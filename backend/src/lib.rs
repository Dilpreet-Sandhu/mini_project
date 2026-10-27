use axum::{Router, middleware, routing::get};
use sqlx::PgPool;
use std::sync::Arc;
use tower_http::{cors::CorsLayer, trace::TraceLayer};

pub mod admin;
pub mod auth;
pub mod complaint;
pub mod error;
pub mod middlewares;
pub mod seed;
pub mod types;
pub mod user;

#[derive(Clone)]
pub struct AppState {
    pub db_pool: PgPool,
    pub access_token_secret: String,
}

pub fn router(state: Arc<AppState>, cors: CorsLayer) -> Router {
    let protected_routes = Router::new()
        .nest("/user", user::routes::routes())
        .nest("/complaint", complaint::routes::routes())
        .nest("/admin", admin::routes::routes())
        .route_layer(middleware::from_fn_with_state(
            state.clone(),
            middlewares::auth_middleware::auth_middleware,
        ));

    Router::new()
        .route(
            "/health",
            get(|| async { axum::Json(serde_json::json!({"status":"ok"})) }),
        )
        .nest("/auth", auth::routes::routes())
        .merge(protected_routes)
        .layer(axum::extract::DefaultBodyLimit::max(32 * 1024))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}
