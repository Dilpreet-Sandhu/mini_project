use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode},
};
use http_body_util::BodyExt;
use roomline_backend::{AppState, router};
use serde_json::{Value, json};
use sqlx::postgres::PgPoolOptions;
use std::sync::Arc;
use tower::ServiceExt;
use tower_http::cors::CorsLayer;

async fn request(
    app: &Router,
    method: &str,
    path: &str,
    token: Option<&str>,
    body: Option<Value>,
) -> (StatusCode, Value) {
    let mut req = Request::builder()
        .method(method)
        .uri(path)
        .header("Content-Type", "application/json");
    if let Some(token) = token {
        req = req.header("Authorization", format!("Bearer {token}"));
    }
    let response = app
        .clone()
        .oneshot(
            req.body(
                body.map(|v| Body::from(v.to_string()))
                    .unwrap_or_else(Body::empty),
            )
            .unwrap(),
        )
        .await
        .unwrap();
    let status = response.status();
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    (
        status,
        serde_json::from_slice(&bytes)
            .unwrap_or_else(|_| json!({"raw":String::from_utf8_lossy(&bytes)})),
    )
}
async fn login(app: &Router, email: &str) -> String {
    let (status, result) = request(
        app,
        "POST",
        "/auth/login",
        None,
        Some(json!({"email":email,"password":"Roomline123!"})),
    )
    .await;
    assert_eq!(status, StatusCode::OK, "{result}");
    assert!(result["data"]["user"].get("password").is_none());
    result["data"]["access_token"].as_str().unwrap().to_string()
}

// Explicit opt-in: this test inserts demo and test records. Use a dedicated database.
#[tokio::test]
#[ignore = "requires TEST_DATABASE_URL pointing to a disposable PostgreSQL database"]
async fn complete_workflow_and_role_isolation() {
    let _ = tracing_subscriber::fmt()
        .with_env_filter("error")
        .try_init();
    let url = std::env::var("TEST_DATABASE_URL")
        .expect("Set TEST_DATABASE_URL to a dedicated test database");
    let pool = PgPoolOptions::new()
        .max_connections(
            std::env::var("TEST_MAX_CONNECTIONS")
                .unwrap_or_else(|_| "8".into())
                .parse()
                .unwrap(),
        )
        .connect(&url)
        .await
        .unwrap();
    sqlx::migrate!("./migrations").run(&pool).await.unwrap();
    roomline_backend::seed::run(&pool).await.unwrap();
    let app = router(
        Arc::new(AppState {
            db_pool: pool.clone(),
            access_token_secret: "test-secret-with-at-least-thirty-two-characters".into(),
        }),
        CorsLayer::new(),
    );
    let student = login(&app, "student@roomline.local").await;
    let other_student = login(&app, "student2@roomline.local").await;
    let electrician = login(&app, "electrician@roomline.local").await;
    let plumber = login(&app, "plumber@roomline.local").await;
    let admin = login(&app, "admin@roomline.local").await;

    assert_eq!(
        request(&app, "GET", "/complaint", None, None).await.0,
        StatusCode::UNAUTHORIZED
    );
    assert_eq!(
        request(&app, "GET", "/user/me", Some("bad.token"), None)
            .await
            .0,
        StatusCode::UNAUTHORIZED
    );
    assert_eq!(
        request(&app, "GET", "/admin/stats", Some(&student), None)
            .await
            .0,
        StatusCode::FORBIDDEN
    );
    let (_, directory) = request(&app, "GET", "/user/workers", Some(&student), None).await;
    assert!(
        directory["data"]
            .as_array()
            .unwrap()
            .iter()
            .all(|w| w.get("password").is_none() && w["role"] == "worker")
    );

    let suffix = uuid::Uuid::new_v4();
    let registration = json!({"name":"Test Student","email":format!("qa-{suffix}@college.test"),"password":"Password123!","phone":"9876500099","hostel":"QA House","room":"301"});
    let mut escalated = registration.clone();
    escalated["role"] = json!("admin");
    assert_eq!(
        request(&app, "POST", "/auth/register", None, Some(escalated))
            .await
            .0,
        StatusCode::UNPROCESSABLE_ENTITY
    );
    let (status, registered) = request(
        &app,
        "POST",
        "/auth/register",
        None,
        Some(registration.clone()),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(registered["data"]["user"]["role"], "student");
    assert_eq!(
        request(&app, "POST", "/auth/register", None, Some(registration))
            .await
            .0,
        StatusCode::CONFLICT
    );

    let worker_data = json!({"name":"QA Electrician","email":format!("worker-{suffix}@college.test"),"password":"Roomline123!","phone":"9876500091","specialty":"electrical"});
    assert_eq!(
        request(
            &app,
            "POST",
            "/admin/workers",
            Some(&student),
            Some(worker_data.clone())
        )
        .await
        .0,
        StatusCode::FORBIDDEN
    );
    let (status, new_worker) = request(
        &app,
        "POST",
        "/admin/workers",
        Some(&admin),
        Some(worker_data.clone()),
    )
    .await;
    assert_eq!(status, StatusCode::OK, "{new_worker}");
    let competitor = login(&app, worker_data["email"].as_str().unwrap()).await;

    let body = json!({"title":"QA ceiling fan is broken","description":"The ceiling fan stopped turning this morning.","category":"electrical","priority":"high"});
    assert_eq!(
        request(
            &app,
            "POST",
            "/complaint",
            Some(&electrician),
            Some(body.clone())
        )
        .await
        .0,
        StatusCode::FORBIDDEN
    );
    let mut invalid = body.clone();
    invalid["category"] = json!("unknown");
    assert_eq!(
        request(&app, "POST", "/complaint", Some(&student), Some(invalid))
            .await
            .0,
        StatusCode::BAD_REQUEST
    );
    let (status, result) = request(
        &app,
        "POST",
        "/complaint",
        Some(&student),
        Some(body.clone()),
    )
    .await;
    assert_eq!(status, StatusCode::OK, "{result}");
    let id = result["data"]["complaint"]["id"].as_str().unwrap();
    let path = format!("/complaint/{id}");
    assert_eq!(result["data"]["complaint"]["room"], "B-204");
    assert_eq!(
        request(&app, "GET", &path, Some(&other_student), None)
            .await
            .0,
        StatusCode::FORBIDDEN
    );
    assert_eq!(
        request(&app, "GET", &path, Some(&plumber), None).await.0,
        StatusCode::FORBIDDEN
    );
    assert_eq!(
        request(&app, "POST", &format!("{path}/claim"), Some(&student), None)
            .await
            .0,
        StatusCode::FORBIDDEN
    );
    assert_eq!(
        request(&app, "POST", &format!("{path}/claim"), Some(&plumber), None)
            .await
            .0,
        StatusCode::CONFLICT
    );
    let (_, queue) = request(&app, "GET", "/complaint", Some(&electrician), None).await;
    assert!(
        queue["data"]
            .as_array()
            .unwrap()
            .iter()
            .any(|c| c["id"] == id)
    );

    let claim_path = format!("{path}/claim");
    let (first, second) = tokio::join!(
        request(&app, "POST", &claim_path, Some(&electrician), None),
        request(&app, "POST", &claim_path, Some(&competitor), None)
    );
    let statuses = [first.0, second.0];
    assert_eq!(statuses.iter().filter(|&&s| s == StatusCode::OK).count(), 1);
    assert_eq!(
        statuses
            .iter()
            .filter(|&&s| s == StatusCode::CONFLICT)
            .count(),
        1
    );
    let winner = if first.0 == StatusCode::OK {
        &electrician
    } else {
        &competitor
    };
    let loser = if first.0 == StatusCode::OK {
        &competitor
    } else {
        &electrician
    };
    assert_eq!(
        request(&app, "GET", &path, Some(loser), None).await.0,
        StatusCode::FORBIDDEN
    );
    let status_path = format!("{path}/status");
    assert_eq!(
        request(
            &app,
            "PATCH",
            &status_path,
            Some(winner),
            Some(json!({"status":"resolved","note":"Tested the repair"}))
        )
        .await
        .0,
        StatusCode::CONFLICT
    );
    assert_eq!(
        request(
            &app,
            "PATCH",
            &status_path,
            Some(&student),
            Some(json!({"status":"resolved","note":"Tested the repair"}))
        )
        .await
        .0,
        StatusCode::CONFLICT
    );
    assert_eq!(
        request(
            &app,
            "PATCH",
            &status_path,
            Some(winner),
            Some(json!({"status":"in_progress"}))
        )
        .await
        .0,
        StatusCode::OK
    );
    assert_eq!(
        request(
            &app,
            "PATCH",
            &status_path,
            Some(winner),
            Some(json!({"status":"resolved"}))
        )
        .await
        .0,
        StatusCode::BAD_REQUEST
    );
    let (status, thread) = request(
        &app,
        "POST",
        &format!("{path}/comment"),
        Some(&student),
        Some(json!({"body":"I will be in my room after class."})),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert!(
        thread["data"]["events"]
            .as_array()
            .unwrap()
            .iter()
            .any(|e| e["kind"] == "comment")
    );
    let (status, fixed) = request(
        &app,
        "PATCH",
        &status_path,
        Some(winner),
        Some(json!({"status":"resolved","note":"Replaced the capacitor and tested the fan."})),
    )
    .await;
    assert_eq!(status, StatusCode::OK, "{fixed}");
    assert!(fixed["data"]["complaint"]["resolved_at"].is_string());
    let (_, stats) = request(&app, "GET", "/admin/stats", Some(&admin), None).await;
    assert!(
        stats["data"]["workers"]
            .as_array()
            .unwrap()
            .iter()
            .any(|w| w["resolved"].as_i64().unwrap() > 0 && w["on_time_percent"].is_number())
    );
    let (status, reopened) = request(
        &app,
        "PATCH",
        &status_path,
        Some(&student),
        Some(json!({"status":"pending","note":"The fan stopped again after an hour."})),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert!(reopened["data"]["complaint"]["assigned_to"].is_null());
    assert!(reopened["data"]["complaint"]["resolved_at"].is_null());

    // Admin assignment rejects mismatched specialties, then grants the right worker access.
    assert_eq!(
        request(
            &app,
            "PATCH",
            &format!("{path}/assign"),
            Some(&admin),
            Some(json!({"worker_id":"00000000-0000-0000-0000-000000000003"}))
        )
        .await
        .0,
        StatusCode::CONFLICT
    );
    assert_eq!(
        request(
            &app,
            "PATCH",
            &format!("{path}/assign"),
            Some(&admin),
            Some(json!({"worker_id":"00000000-0000-0000-0000-000000000002"}))
        )
        .await
        .0,
        StatusCode::OK
    );
    assert_eq!(
        request(
            &app,
            "PATCH",
            &status_path,
            Some(&electrician),
            Some(json!({"status":"in_progress"}))
        )
        .await
        .0,
        StatusCode::OK
    );
    sqlx::query("UPDATE complaints SET due_at=NOW()-INTERVAL '1 hour' WHERE id=$1")
        .bind(uuid::Uuid::parse_str(id).unwrap())
        .execute(&pool)
        .await
        .unwrap();
    let (_, overdue_stats) = request(&app, "GET", "/admin/stats", Some(&admin), None).await;
    assert!(
        overdue_stats["data"]["overview"]["overdue"]
            .as_i64()
            .unwrap()
            >= 1
    );

    let (_, cancel) = request(&app, "POST", "/complaint", Some(&student), Some(body)).await;
    let cancel_id = cancel["data"]["complaint"]["id"].as_str().unwrap();
    assert_eq!(
        request(
            &app,
            "PATCH",
            &format!("/complaint/{cancel_id}/status"),
            Some(&student),
            Some(json!({"status":"cancelled"}))
        )
        .await
        .0,
        StatusCode::OK
    );
    assert_eq!(
        request(
            &app,
            "POST",
            &format!("/complaint/{cancel_id}/comment"),
            Some(&student),
            Some(json!({"body":"Message after cancellation"}))
        )
        .await
        .0,
        StatusCode::CONFLICT
    );
    pool.close().await;
}
