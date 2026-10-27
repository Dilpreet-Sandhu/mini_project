use super::{model::Complaint, service::ComplaintService, types::*};
use crate::{AppState, auth::model::User, error::AppError, types::ApiResponse};
use axum::{
    Extension, Json,
    extract::{Path, State},
};
use std::sync::Arc;
use uuid::Uuid;

pub async fn list(
    State(s): State<Arc<AppState>>,
    Extension(u): Extension<Arc<User>>,
) -> Result<ApiResponse<Vec<Complaint>>, AppError> {
    Ok(ApiResponse::new(
        ComplaintService::list(&u, &s.db_pool).await?,
        "Complaints fetched",
    ))
}
pub async fn detail(
    State(s): State<Arc<AppState>>,
    Extension(u): Extension<Arc<User>>,
    Path(id): Path<Uuid>,
) -> Result<ApiResponse<ComplaintDetail>, AppError> {
    Ok(ApiResponse::new(
        ComplaintService::detail(id, &u, &s.db_pool).await?,
        "Complaint fetched",
    ))
}
pub async fn create(
    State(s): State<Arc<AppState>>,
    Extension(u): Extension<Arc<User>>,
    Json(body): Json<CreateComplaintRequest>,
) -> Result<ApiResponse<ComplaintDetail>, AppError> {
    Ok(ApiResponse::new(
        ComplaintService::create(body, &u, &s.db_pool).await?,
        "Complaint created",
    ))
}
pub async fn claim(
    State(s): State<Arc<AppState>>,
    Extension(u): Extension<Arc<User>>,
    Path(id): Path<Uuid>,
) -> Result<ApiResponse<ComplaintDetail>, AppError> {
    Ok(ApiResponse::new(
        ComplaintService::claim(id, &u, &s.db_pool).await?,
        "Complaint accepted",
    ))
}
pub async fn status(
    State(s): State<Arc<AppState>>,
    Extension(u): Extension<Arc<User>>,
    Path(id): Path<Uuid>,
    Json(body): Json<UpdateStatusRequest>,
) -> Result<ApiResponse<ComplaintDetail>, AppError> {
    Ok(ApiResponse::new(
        ComplaintService::status(id, body, &u, &s.db_pool).await?,
        "Status updated",
    ))
}
pub async fn comment(
    State(s): State<Arc<AppState>>,
    Extension(u): Extension<Arc<User>>,
    Path(id): Path<Uuid>,
    Json(body): Json<CommentRequest>,
) -> Result<ApiResponse<ComplaintDetail>, AppError> {
    Ok(ApiResponse::new(
        ComplaintService::comment(id, body, &u, &s.db_pool).await?,
        "Message added",
    ))
}
pub async fn assign(
    State(s): State<Arc<AppState>>,
    Extension(u): Extension<Arc<User>>,
    Path(id): Path<Uuid>,
    Json(body): Json<AssignRequest>,
) -> Result<ApiResponse<ComplaintDetail>, AppError> {
    Ok(ApiResponse::new(
        ComplaintService::assign(id, body, &u, &s.db_pool).await?,
        "Worker assigned",
    ))
}
