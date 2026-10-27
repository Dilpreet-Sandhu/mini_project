use axum::{
    Json,
    response::{IntoResponse, Response},
};
use serde::Serialize;

#[derive(Serialize)]
pub struct ApiResponse<T> {
    pub data: T,
    pub message: String,
}

impl<T: Serialize> ApiResponse<T> {
    pub fn new(data: T, message: &str) -> Self {
        Self {
            data,
            message: message.to_string(),
        }
    }
}
impl<T: Serialize> IntoResponse for ApiResponse<T> {
    fn into_response(self) -> Response {
        Json(self).into_response()
    }
}

pub const CATEGORIES: [&str; 5] = [
    "electrical",
    "plumbing",
    "carpentry",
    "housekeeping",
    "general",
];

pub fn required(
    value: &str,
    field: &str,
    min: usize,
    max: usize,
) -> Result<String, crate::error::AppError> {
    let value = value.trim();
    if value.chars().count() < min || value.chars().count() > max {
        return Err(crate::error::AppError::BadRequest(format!(
            "{field} must be {min}–{max} characters"
        )));
    }
    Ok(value.to_string())
}
