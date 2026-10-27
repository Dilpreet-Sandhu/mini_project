use axum::http::{HeaderValue, Method, header};
use roomline_backend::{AppState, router};
use sqlx::postgres::PgPoolOptions;
use std::sync::Arc;
use tower_http::cors::{AllowOrigin, CorsLayer};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt()
        .with_env_filter(std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()))
        .init();
    let secret =
        std::env::var("ACCESS_TOKEN_SECRET").expect("Set ACCESS_TOKEN_SECRET in backend/.env");
    assert!(
        secret.len() >= 32,
        "ACCESS_TOKEN_SECRET must contain at least 32 characters"
    );
    let pool = PgPoolOptions::new()
        .max_connections(
            std::env::var("DATABASE_MAX_CONNECTIONS")
                .unwrap_or_else(|_| "10".into())
                .parse()?,
        )
        .connect(&std::env::var("DATABASE_URL")?)
        .await?;
    sqlx::migrate!("./migrations").run(&pool).await?;

    if std::env::args().any(|arg| arg == "--seed") {
        roomline_backend::seed::run(&pool).await?;
        return Ok(());
    }
    let origins: Vec<HeaderValue> = std::env::var("CORS_ORIGINS")
        .unwrap_or_else(|_| "http://localhost:8081,http://127.0.0.1:8081".into())
        .split(',')
        .map(|s| s.trim().parse())
        .collect::<Result<_, _>>()?;
    let cors = CorsLayer::new()
        .allow_origin(AllowOrigin::list(origins))
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::PATCH,
            Method::OPTIONS,
        ])
        .allow_headers([header::AUTHORIZATION, header::CONTENT_TYPE]);
    let state = Arc::new(AppState {
        db_pool: pool,
        access_token_secret: secret,
    });
    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".into());
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{port}")).await?;
    tracing::info!(%port, "Roomline server started");
    axum::serve(listener, router(state, cors))
        .with_graceful_shutdown(async {
            let _ = tokio::signal::ctrl_c().await;
        })
        .await?;
    Ok(())
}
