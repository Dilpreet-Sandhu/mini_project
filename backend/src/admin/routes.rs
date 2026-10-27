use super::handlers;
use crate::AppState;
use axum::{
    Router,
    routing::{get, post},
};
use std::sync::Arc;

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/stats", get(handlers::dashboard))
        .route("/workers", post(handlers::create_worker))
}
