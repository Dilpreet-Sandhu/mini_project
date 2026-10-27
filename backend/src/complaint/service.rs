use super::{
    model::{Complaint, ComplaintEvent},
    types::*,
};
use crate::{
    auth::model::User,
    error::AppError,
    types::{CATEGORIES, required},
};
use chrono::{Duration, Utc};
use sqlx::{PgPool, Postgres, Transaction};
use uuid::Uuid;

pub struct ComplaintService;
impl ComplaintService {
    pub fn sla_hours(priority: &str) -> Result<i64, AppError> {
        match priority {
            "high" => Ok(24),
            "normal" => Ok(72),
            "low" => Ok(120),
            _ => Err(AppError::BadRequest("Invalid priority".into())),
        }
    }
    fn can_view(user: &User, complaint: &Complaint) -> bool {
        user.role == "admin"
            || (user.role == "student" && complaint.student_id == user.id)
            || (user.role == "worker"
                && (complaint.assigned_to == Some(user.id)
                    || (complaint.status == "pending"
                        && complaint.assigned_to.is_none()
                        && user.specialty.as_deref() == Some(&complaint.category))))
    }
    pub async fn event(
        tx: &mut Transaction<'_, Postgres>,
        id: Uuid,
        actor: Uuid,
        kind: &str,
        body: &str,
    ) -> Result<(), AppError> {
        sqlx::query("INSERT INTO complaint_events (id,complaint_id,actor_id,kind,body) VALUES ($1,$2,$3,$4,$5)")
            .bind(Uuid::new_v4()).bind(id).bind(actor).bind(kind).bind(body).execute(&mut **tx).await?;
        Ok(())
    }
    pub async fn list(user: &User, db_pool: &PgPool) -> Result<Vec<Complaint>, AppError> {
        // Every role is filtered on the server; client filters are only for presentation.
        let sql = "SELECT c.*, s.name AS student_name, s.phone AS student_phone, w.name AS worker_name FROM complaints c JOIN users s ON s.id = c.student_id LEFT JOIN users w ON w.id = c.assigned_to WHERE ($1 = 'admin') OR ($1 = 'student' AND c.student_id = $2) OR ($1 = 'worker' AND (c.assigned_to = $2 OR (c.assigned_to IS NULL AND c.category = $3 AND c.status = 'pending'))) ORDER BY c.created_at DESC";
        Ok(sqlx::query_as::<_, Complaint>(sql)
            .bind(&user.role)
            .bind(user.id)
            .bind(&user.specialty)
            .fetch_all(db_pool)
            .await?)
    }
    pub async fn detail(
        id: Uuid,
        user: &User,
        db_pool: &PgPool,
    ) -> Result<ComplaintDetail, AppError> {
        let sql = "SELECT c.*, s.name AS student_name, s.phone AS student_phone, w.name AS worker_name FROM complaints c JOIN users s ON s.id = c.student_id LEFT JOIN users w ON w.id = c.assigned_to WHERE c.id = $1 FOR SHARE OF c";
        // Hold a shared row lock so reassignment cannot race an authorization check.
        let mut tx = db_pool.begin().await?;
        let complaint = sqlx::query_as::<_, Complaint>(sql)
            .bind(id)
            .fetch_optional(&mut *tx)
            .await?
            .ok_or(AppError::NotFound)?;
        if !Self::can_view(user, &complaint) {
            return Err(AppError::Forbidden);
        }
        let events = sqlx::query_as::<_, ComplaintEvent>("SELECT e.*, u.name AS actor_name, u.role AS actor_role FROM complaint_events e JOIN users u ON u.id = e.actor_id WHERE e.complaint_id = $1 ORDER BY e.created_at, e.id")
            .bind(id).fetch_all(&mut *tx).await?;
        tx.commit().await?;
        Ok(ComplaintDetail { complaint, events })
    }
    pub async fn create(
        body: CreateComplaintRequest,
        user: &User,
        db_pool: &PgPool,
    ) -> Result<ComplaintDetail, AppError> {
        if user.role != "student" {
            return Err(AppError::Forbidden);
        }
        let title = required(&body.title, "Title", 4, 120)?;
        let description = required(&body.description, "Description", 10, 3000)?;
        if !CATEGORIES.contains(&body.category.as_str()) {
            return Err(AppError::BadRequest("Invalid category".into()));
        }
        let due = Utc::now() + Duration::hours(Self::sla_hours(&body.priority)?);
        let id = Uuid::new_v4();
        let mut tx = db_pool.begin().await?;
        sqlx::query("INSERT INTO complaints (id,student_id,title,description,category,priority,hostel,room,due_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)")
            .bind(id).bind(user.id).bind(title).bind(description).bind(body.category).bind(body.priority)
            .bind(&user.hostel).bind(&user.room).bind(due).execute(&mut *tx).await?;
        Self::event(
            &mut tx,
            id,
            user.id,
            "created",
            "Complaint submitted to the specialist queue",
        )
        .await?;
        tx.commit().await?;
        Self::detail(id, user, db_pool).await
    }
    pub async fn claim(
        id: Uuid,
        user: &User,
        db_pool: &PgPool,
    ) -> Result<ComplaintDetail, AppError> {
        if user.role != "worker" {
            return Err(AppError::Forbidden);
        }
        let mut tx = db_pool.begin().await?;
        // Conditional update is atomic: only one worker can win a claim.
        let result = sqlx::query("UPDATE complaints SET assigned_to = $1, updated_at = NOW() WHERE id = $2 AND assigned_to IS NULL AND status = 'pending' AND category = $3")
            .bind(user.id).bind(id).bind(&user.specialty).execute(&mut *tx).await?;
        if result.rows_affected() != 1 {
            return Err(AppError::Conflict(
                "This complaint is no longer available. Refresh the queue".into(),
            ));
        }
        Self::event(&mut tx, id, user.id, "assigned", "Accepted the complaint").await?;
        tx.commit().await?;
        Self::detail(id, user, db_pool).await
    }
    pub fn transition_allowed(user: &User, c: &Complaint, next: &str) -> bool {
        match next {
            "in_progress" => {
                user.role == "worker" && c.assigned_to == Some(user.id) && c.status == "pending"
            }
            "resolved" => {
                user.role == "worker" && c.assigned_to == Some(user.id) && c.status == "in_progress"
            }
            "cancelled" => {
                user.role == "student" && c.student_id == user.id && c.status == "pending"
            }
            "pending" => {
                user.role == "student" && c.student_id == user.id && c.status == "resolved"
            }
            _ => false,
        }
    }
    pub async fn status(
        id: Uuid,
        body: UpdateStatusRequest,
        user: &User,
        db_pool: &PgPool,
    ) -> Result<ComplaintDetail, AppError> {
        let mut tx = db_pool.begin().await?;
        let sql = "SELECT c.*, s.name AS student_name, s.phone AS student_phone, w.name AS worker_name FROM complaints c JOIN users s ON s.id = c.student_id LEFT JOIN users w ON w.id = c.assigned_to WHERE c.id = $1 FOR UPDATE OF c";
        let complaint = sqlx::query_as::<_, Complaint>(sql)
            .bind(id)
            .fetch_optional(&mut *tx)
            .await?
            .ok_or(AppError::NotFound)?;
        if !Self::can_view(user, &complaint) {
            return Err(AppError::Forbidden);
        }
        if !Self::transition_allowed(user, &complaint, &body.status) {
            return Err(AppError::Conflict(
                "This status change is not available. Refresh the complaint".into(),
            ));
        }
        let (kind, note) = match body.status.as_str() {
            "resolved" => (
                "resolved",
                required(
                    body.note.as_deref().unwrap_or(""),
                    "Resolution note",
                    5,
                    2000,
                )?,
            ),
            "pending" => (
                "reopened",
                required(body.note.as_deref().unwrap_or(""), "Reopen reason", 5, 2000)?,
            ),
            "in_progress" => ("started", "Work has started on this complaint".into()),
            _ => ("cancelled", "Student cancelled the complaint".into()),
        };
        let reopened = kind == "reopened";
        sqlx::query("UPDATE complaints SET status=$1, updated_at=NOW(), resolved_at=CASE WHEN $1='resolved' THEN NOW() ELSE NULL END, resolution_note=CASE WHEN $1='resolved' THEN $2 ELSE NULL END, assigned_to=CASE WHEN $3 THEN NULL ELSE assigned_to END, cycle_started_at=CASE WHEN $3 THEN NOW() ELSE cycle_started_at END, due_at=CASE WHEN $3 THEN NOW() + ($4 * INTERVAL '1 hour') ELSE due_at END WHERE id=$5")
            .bind(&body.status).bind(&note).bind(reopened).bind(Self::sla_hours(&complaint.priority)? as f64).bind(id).execute(&mut *tx).await?;
        Self::event(&mut tx, id, user.id, kind, &note).await?;
        tx.commit().await?;
        Self::detail(id, user, db_pool).await
    }
    pub async fn comment(
        id: Uuid,
        body: CommentRequest,
        user: &User,
        db_pool: &PgPool,
    ) -> Result<ComplaintDetail, AppError> {
        let body = required(&body.body, "Message", 1, 2000)?;
        let mut tx = db_pool.begin().await?;
        let sql = "SELECT c.*, s.name AS student_name, s.phone AS student_phone, w.name AS worker_name FROM complaints c JOIN users s ON s.id = c.student_id LEFT JOIN users w ON w.id = c.assigned_to WHERE c.id=$1 FOR UPDATE OF c";
        let c = sqlx::query_as::<_, Complaint>(sql)
            .bind(id)
            .fetch_optional(&mut *tx)
            .await?
            .ok_or(AppError::NotFound)?;
        if !Self::can_view(user, &c) {
            return Err(AppError::Forbidden);
        }
        if c.status == "cancelled" {
            return Err(AppError::Conflict("This complaint is cancelled".into()));
        }
        Self::event(&mut tx, id, user.id, "comment", &body).await?;
        sqlx::query("UPDATE complaints SET updated_at=NOW() WHERE id=$1")
            .bind(id)
            .execute(&mut *tx)
            .await?;
        tx.commit().await?;
        Self::detail(id, user, db_pool).await
    }
    pub async fn assign(
        id: Uuid,
        body: AssignRequest,
        user: &User,
        db_pool: &PgPool,
    ) -> Result<ComplaintDetail, AppError> {
        if user.role != "admin" {
            return Err(AppError::Forbidden);
        }
        let mut tx = db_pool.begin().await?;
        let worker = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id=$1 AND role='worker'")
            .bind(body.worker_id)
            .fetch_optional(&mut *tx)
            .await?
            .ok_or(AppError::BadRequest("Worker not found".into()))?;
        let result = sqlx::query("UPDATE complaints SET assigned_to=$1, updated_at=NOW() WHERE id=$2 AND category=$3 AND status='pending'")
            .bind(worker.id).bind(id).bind(&worker.specialty).execute(&mut *tx).await?;
        if result.rows_affected() != 1 {
            return Err(AppError::Conflict(
                "Only pending complaints can be assigned to a matching specialist".into(),
            ));
        }
        Self::event(
            &mut tx,
            id,
            user.id,
            "assigned",
            &format!("Assigned to {}", worker.name),
        )
        .await?;
        tx.commit().await?;
        Self::detail(id, user, db_pool).await
    }
}
