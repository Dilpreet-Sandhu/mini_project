use crate::{
    AppState,
    auth::{extra::decode_access_token, model::User},
    error::AppError,
};
use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
};
use std::sync::Arc;
use uuid::Uuid;

pub async fn auth_middleware(
    State(state): State<Arc<AppState>>,
    mut request: Request,
    next: Next,
) -> Result<Response, AppError> {
    let token = request
        .headers()
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .ok_or(AppError::Unauthorized)?;
    let claim = decode_access_token(token, &state.access_token_secret)
        .map_err(|_| AppError::Unauthorized)?;
    let id = Uuid::parse_str(&claim.sub).map_err(|_| AppError::Unauthorized)?;
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db_pool)
        .await?
        .ok_or(AppError::Unauthorized)?;
    request.extensions_mut().insert(Arc::new(user));
    Ok(next.run(request).await)
}
