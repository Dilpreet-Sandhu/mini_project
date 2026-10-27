use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};

#[derive(Debug)]
pub enum AppError {
    BadRequest(String),
    Unauthorized,
    Forbidden,
    NotFound,
    Conflict(String),
    Internal(String),
}
impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{self:?}")
    }
}
impl std::error::Error for AppError {}
impl From<sqlx::Error> for AppError {
    fn from(error: sqlx::Error) -> Self {
        if let sqlx::Error::Database(ref db) = error
            && db.code().as_deref() == Some("23505")
        {
            return Self::Conflict("This email is already registered".into());
        }
        Self::Internal(error.to_string())
    }
}
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            Self::BadRequest(message) => (StatusCode::BAD_REQUEST, message),
            Self::Unauthorized => (StatusCode::UNAUTHORIZED, "Please sign in again".into()),
            Self::Forbidden => (
                StatusCode::FORBIDDEN,
                "You cannot access this resource or action".into(),
            ),
            Self::NotFound => (StatusCode::NOT_FOUND, "Not found".into()),
            Self::Conflict(message) => (StatusCode::CONFLICT, message),
            Self::Internal(error) => {
                tracing::error!(%error, "request failed");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Something went wrong. Please try again".into(),
                )
            }
        };
        (status, Json(serde_json::json!({"message": message}))).into_response()
    }
}
