use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header, Validation, decode, encode};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Serialize, Deserialize)]
pub struct Claim {
    pub sub: String,
    pub exp: u64,
    pub iat: u64,
}
pub fn sign_access_token(id: Uuid, secret: &str) -> Result<String, jsonwebtoken::errors::Error> {
    let now = jsonwebtoken::get_current_timestamp();
    encode(
        &Header::new(Algorithm::HS256),
        &Claim {
            sub: id.to_string(),
            iat: now,
            exp: now + 86400,
        },
        &EncodingKey::from_secret(secret.as_bytes()),
    )
}
pub fn decode_access_token(
    token: &str,
    secret: &str,
) -> Result<Claim, jsonwebtoken::errors::Error> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.leeway = 0;
    decode::<Claim>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )
    .map(|value| value.claims)
}
