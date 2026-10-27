use super::{service::AdminService, types::*};
use crate::{AppState, auth::model::User, error::AppError, types::ApiResponse};
use axum::{Extension, Json, extract::State};
use std::sync::Arc;

pub async fn dashboard(
    State(s): State<Arc<AppState>>,
    Extension(u): Extension<Arc<User>>,
) -> Result<ApiResponse<Dashboard>, AppError> {
    Ok(ApiResponse::new(
        AdminService::dashboard(&u, &s.db_pool).await?,
        "Dashboard fetched",
    ))
}
pub async fn create_worker(
    State(s): State<Arc<AppState>>,
    Extension(u): Extension<Arc<User>>,
    Json(body): Json<CreateWorkerRequest>,
) -> Result<ApiResponse<User>, AppError> {
    Ok(ApiResponse::new(
        AdminService::create_worker(body, &u, &s.db_pool).await?,
        "Worker account created",
    ))
}
