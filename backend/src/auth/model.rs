use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Clone, Serialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password: String,
    pub role: String,
    pub phone: String,
    pub hostel: Option<String>,
    pub room: Option<String>,
    pub specialty: Option<String>,
    pub created_at: DateTime<Utc>,
}
