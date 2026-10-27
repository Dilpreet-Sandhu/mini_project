use super::{
    dto::{UserCreateRequest, UserLoginRequest, UserLoginResponse},
    service::AuthService,
};
use crate::{AppState, error::AppError, types::ApiResponse};
use axum::{Json, extract::State};
use std::sync::Arc;

pub async fn create_user(
    State(state): State<Arc<AppState>>,
    Json(body): Json<UserCreateRequest>,
) -> Result<ApiResponse<UserLoginResponse>, AppError> {
    Ok(ApiResponse::new(
        AuthService::create_user(body, &state.db_pool, &state.access_token_secret).await?,
        "Account created",
    ))
}
pub async fn login_user(
    State(state): State<Arc<AppState>>,
    Json(body): Json<UserLoginRequest>,
) -> Result<ApiResponse<UserLoginResponse>, AppError> {
    Ok(ApiResponse::new(
        AuthService::login_user(body, &state.db_pool, &state.access_token_secret).await?,
        "Signed in",
    ))
}
