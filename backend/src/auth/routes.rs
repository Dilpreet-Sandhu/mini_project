use super::handlers;
use crate::AppState;
use axum::{Router, routing::post};
use std::sync::Arc;

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/register", post(handlers::create_user))
        .route("/login", post(handlers::login_user))
}
