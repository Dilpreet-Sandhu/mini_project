use super::model::{Complaint, ComplaintEvent};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Deserialize)]
pub struct CreateComplaintRequest {
    pub title: String,
    pub description: String,
    pub category: String,
    pub priority: String,
}
#[derive(Deserialize)]
pub struct UpdateStatusRequest {
    pub status: String,
    pub note: Option<String>,
}
#[derive(Deserialize)]
pub struct CommentRequest {
    pub body: String,
}
#[derive(Deserialize)]
pub struct AssignRequest {
    pub worker_id: Uuid,
}
#[derive(Serialize)]
pub struct ComplaintDetail {
    pub complaint: Complaint,
    pub events: Vec<ComplaintEvent>,
}
