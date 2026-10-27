use super::{
    dto::{UserCreateRequest, UserLoginRequest, UserLoginResponse},
    extra::sign_access_token,
    model::User,
};
use crate::{error::AppError, types::required};
use sqlx::PgPool;
use uuid::Uuid;

pub struct AuthService;
impl AuthService {
    pub fn email(value: &str) -> Result<String, AppError> {
        let email = required(value, "Email", 5, 254)?.to_lowercase();
        let parts: Vec<_> = email.split('@').collect();
        if parts.len() != 2
            || parts[0].is_empty()
            || !parts[1].contains('.')
            || email.chars().any(char::is_whitespace)
        {
            return Err(AppError::BadRequest("Enter a valid email address".into()));
        }
        Ok(email)
    }
    pub async fn hash_password(password: String) -> Result<String, AppError> {
        if password.len() < 8 || password.len() > 72 {
            return Err(AppError::BadRequest("Password must be 8–72 bytes".into()));
        }
        tokio::task::spawn_blocking(move || bcrypt::hash(password, bcrypt::DEFAULT_COST))
            .await
            .map_err(|e| AppError::Internal(e.to_string()))?
            .map_err(|e| AppError::Internal(e.to_string()))
    }
    pub async fn create_user(
        body: UserCreateRequest,
        db_pool: &PgPool,
        secret: &str,
    ) -> Result<UserLoginResponse, AppError> {
        let name = required(&body.name, "Name", 2, 80)?;
        let email = Self::email(&body.email)?;
        let phone = required(&body.phone, "Phone", 7, 24)?;
        let hostel = required(&body.hostel, "Hostel", 1, 80)?;
        let room = required(&body.room, "Room", 1, 20)?;
        let password = Self::hash_password(body.password).await?;
        let user = sqlx::query_as::<_, User>("INSERT INTO users (id,name,email,password,role,phone,hostel,room) VALUES ($1,$2,$3,$4,'student',$5,$6,$7) RETURNING *")
            .bind(Uuid::new_v4()).bind(name).bind(email).bind(password).bind(phone).bind(hostel).bind(room).fetch_one(db_pool).await?;
        Self::session(user, secret)
    }
    pub async fn login_user(
        body: UserLoginRequest,
        db_pool: &PgPool,
        secret: &str,
    ) -> Result<UserLoginResponse, AppError> {
        if body.password.len() > 72 {
            return Err(AppError::Unauthorized);
        }
        let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
            .bind(body.email.trim().to_lowercase())
            .fetch_optional(db_pool)
            .await?;
        // Perform the same expensive operation for unknown emails to limit timing disclosure.
        let hash = user
            .as_ref()
            .map(|u| u.password.clone())
            .unwrap_or_else(|| {
                "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxjK0V7wH8JHQ.Z7QYLQ4x0nHJm".into()
            });
        let valid = tokio::task::spawn_blocking(move || {
            bcrypt::verify(body.password, &hash).unwrap_or(false)
        })
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;
        if !valid {
            return Err(AppError::Unauthorized);
        }
        Self::session(user.ok_or(AppError::Unauthorized)?, secret)
    }
    fn session(user: User, secret: &str) -> Result<UserLoginResponse, AppError> {
        let access_token =
            sign_access_token(user.id, secret).map_err(|e| AppError::Internal(e.to_string()))?;
        Ok(UserLoginResponse { access_token, user })
    }
}
