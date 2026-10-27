use crate::{auth::model::User, error::AppError, types::required};
use serde::Deserialize;
use sqlx::PgPool;

#[derive(Deserialize)]
pub struct UpdateProfileRequest {
    pub name: String,
    pub phone: String,
    pub hostel: Option<String>,
    pub room: Option<String>,
}

pub struct UserService;
impl UserService {
    pub async fn workers(db_pool: &PgPool) -> Result<Vec<User>, AppError> {
        Ok(
            sqlx::query_as::<_, User>("SELECT * FROM users WHERE role='worker' ORDER BY name")
                .fetch_all(db_pool)
                .await?,
        )
    }
    pub async fn update(
        body: UpdateProfileRequest,
        user: &User,
        db_pool: &PgPool,
    ) -> Result<User, AppError> {
        let name = required(&body.name, "Name", 2, 80)?;
        let phone = required(&body.phone, "Phone", 7, 24)?;
        let (hostel, room) = if user.role == "student" {
            (
                Some(required(
                    body.hostel.as_deref().unwrap_or(""),
                    "Hostel",
                    1,
                    80,
                )?),
                Some(required(body.room.as_deref().unwrap_or(""), "Room", 1, 20)?),
            )
        } else {
            (None, None)
        };
        Ok(sqlx::query_as::<_, User>(
            "UPDATE users SET name=$1,phone=$2,hostel=$3,room=$4 WHERE id=$5 RETURNING *",
        )
        .bind(name)
        .bind(phone)
        .bind(hostel)
        .bind(room)
        .bind(user.id)
        .fetch_one(db_pool)
        .await?)
    }
}
