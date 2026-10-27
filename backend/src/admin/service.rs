use super::types::*;
use crate::{
    auth::{model::User, service::AuthService},
    error::AppError,
    types::{CATEGORIES, required},
};
use sqlx::PgPool;
use uuid::Uuid;

pub struct AdminService;
impl AdminService {
    pub async fn dashboard(user: &User, db_pool: &PgPool) -> Result<Dashboard, AppError> {
        if user.role != "admin" {
            return Err(AppError::Forbidden);
        }
        let overview = sqlx::query_as::<_, Overview>("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='pending') AS pending, COUNT(*) FILTER (WHERE status='in_progress') AS in_progress, COUNT(*) FILTER (WHERE status='resolved') AS resolved, COUNT(*) FILTER (WHERE status='cancelled') AS cancelled, COUNT(*) FILTER (WHERE status IN ('pending','in_progress') AND due_at<NOW()) AS overdue, COUNT(*) FILTER (WHERE status='pending' AND assigned_to IS NULL) AS unassigned FROM complaints").fetch_one(db_pool).await?;
        let workers = sqlx::query_as::<_, WorkerStat>("SELECT u.id,u.name,u.specialty, COUNT(c.id) FILTER (WHERE c.status IN ('pending','in_progress')) AS open, COUNT(c.id) FILTER (WHERE c.status='resolved') AS resolved, COUNT(c.id) FILTER (WHERE c.status IN ('pending','in_progress') AND c.due_at<NOW()) AS overdue, COUNT(c.id) FILTER (WHERE c.status='resolved' AND c.resolved_at<=c.due_at) AS on_time, (100.0 * COUNT(c.id) FILTER (WHERE c.status='resolved' AND c.resolved_at<=c.due_at) / NULLIF(COUNT(c.id) FILTER (WHERE c.status='resolved'),0))::FLOAT8 AS on_time_percent, (AVG(EXTRACT(EPOCH FROM (c.resolved_at-c.cycle_started_at))/3600) FILTER (WHERE c.status='resolved'))::FLOAT8 AS avg_resolution_hours FROM users u LEFT JOIN complaints c ON c.assigned_to=u.id WHERE u.role='worker' GROUP BY u.id ORDER BY on_time_percent DESC NULLS LAST, resolved DESC, u.name").fetch_all(db_pool).await?;
        Ok(Dashboard { overview, workers })
    }
    pub async fn create_worker(
        body: CreateWorkerRequest,
        user: &User,
        db_pool: &PgPool,
    ) -> Result<User, AppError> {
        if user.role != "admin" {
            return Err(AppError::Forbidden);
        }
        if !CATEGORIES.contains(&body.specialty.as_str()) {
            return Err(AppError::BadRequest("Invalid specialty".into()));
        }
        let name = required(&body.name, "Name", 2, 80)?;
        let email = AuthService::email(&body.email)?;
        let phone = required(&body.phone, "Phone", 7, 24)?;
        let password = AuthService::hash_password(body.password).await?;
        Ok(sqlx::query_as::<_, User>("INSERT INTO users (id,name,email,password,role,phone,specialty) VALUES ($1,$2,$3,$4,'worker',$5,$6) RETURNING *")
            .bind(Uuid::new_v4()).bind(name).bind(email).bind(password).bind(phone).bind(body.specialty).fetch_one(db_pool).await?)
    }
}
