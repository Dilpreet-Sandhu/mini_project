use super::handlers as h;
use crate::AppState;
use axum::{
    Router,
    routing::{get, patch, post},
};
use std::sync::Arc;

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(h::list).post(h::create))
        .route("/{id}", get(h::detail))
        .route("/{id}/claim", post(h::claim))
        .route("/{id}/status", patch(h::status))
        .route("/{id}/comment", post(h::comment))
        .route("/{id}/assign", patch(h::assign))
}
