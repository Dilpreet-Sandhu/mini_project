use super::model::User;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UserCreateRequest {
    pub name: String,
    pub email: String,
    pub password: String,
    pub phone: String,
    pub hostel: String,
    pub room: String,
}
#[derive(Deserialize)]
pub struct UserLoginRequest {
    pub email: String,
    pub password: String,
}
#[derive(Serialize)]
pub struct UserLoginResponse {
    pub access_token: String,
    pub user: User,
}
