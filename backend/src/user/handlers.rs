use super::service::{UpdateProfileRequest, UserService};
use crate::{AppState, auth::model::User, error::AppError, types::ApiResponse};
use axum::{Extension, Json, extract::State};
use std::sync::Arc;

pub async fn me(Extension(u): Extension<Arc<User>>) -> ApiResponse<User> {
    ApiResponse::new((*u).clone(), "Profile fetched")
}
pub async fn workers(State(s): State<Arc<AppState>>) -> Result<ApiResponse<Vec<User>>, AppError> {
    Ok(ApiResponse::new(
        UserService::workers(&s.db_pool).await?,
        "Workers fetched",
    ))
}
pub async fn update(
    State(s): State<Arc<AppState>>,
    Extension(u): Extension<Arc<User>>,
    Json(body): Json<UpdateProfileRequest>,
) -> Result<ApiResponse<User>, AppError> {
    Ok(ApiResponse::new(
        UserService::update(body, &u, &s.db_pool).await?,
        "Profile saved",
    ))
}
