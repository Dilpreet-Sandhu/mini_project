use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Serialize, FromRow)]
pub struct Complaint {
    pub id: Uuid,
    pub student_id: Uuid,
    pub assigned_to: Option<Uuid>,
    pub title: String,
    pub description: String,
    pub category: String,
    pub priority: String,
    pub status: String,
    pub hostel: String,
    pub room: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub cycle_started_at: DateTime<Utc>,
    pub due_at: DateTime<Utc>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub resolution_note: Option<String>,
    pub student_name: String,
    pub student_phone: String,
    pub worker_name: Option<String>,
}

#[derive(Serialize, FromRow)]
pub struct ComplaintEvent {
    pub id: Uuid,
    pub complaint_id: Uuid,
    pub actor_id: Uuid,
    pub actor_name: String,
    pub actor_role: String,
    pub kind: String,
    pub body: String,
    pub created_at: DateTime<Utc>,
}
