use super::handlers;
use crate::AppState;
use axum::{Router, routing::get};
use std::sync::Arc;

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/me", get(handlers::me).patch(handlers::update))
        .route("/workers", get(handlers::workers))
}
