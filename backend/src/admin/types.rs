use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Serialize, FromRow)]
pub struct Overview {
    pub total: i64,
    pub pending: i64,
    pub in_progress: i64,
    pub resolved: i64,
    pub cancelled: i64,
    pub overdue: i64,
    pub unassigned: i64,
}
#[derive(Serialize, FromRow)]
pub struct WorkerStat {
    pub id: Uuid,
    pub name: String,
    pub specialty: String,
    pub open: i64,
    pub resolved: i64,
    pub overdue: i64,
    pub on_time: i64,
    pub on_time_percent: Option<f64>,
    pub avg_resolution_hours: Option<f64>,
}
#[derive(Serialize)]
pub struct Dashboard {
    pub overview: Overview,
    pub workers: Vec<WorkerStat>,
}
#[derive(Deserialize)]
pub struct CreateWorkerRequest {
    pub name: String,
    pub email: String,
    pub password: String,
    pub phone: String,
    pub specialty: String,
}
