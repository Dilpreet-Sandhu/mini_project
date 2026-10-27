use roomline_backend::auth::{
    extra::{decode_access_token, sign_access_token},
    service::AuthService,
};
use roomline_backend::complaint::service::ComplaintService;

#[test]
fn signed_tokens_reject_tampering_and_wrong_secrets() {
    let id = uuid::Uuid::new_v4();
    let token = sign_access_token(id, "first-secret-which-is-long-enough-for-tests").unwrap();
    assert_eq!(
        decode_access_token(&token, "first-secret-which-is-long-enough-for-tests")
            .unwrap()
            .sub,
        id.to_string()
    );
    assert!(decode_access_token(&token, "a-different-secret").is_err());
    assert!(
        decode_access_token(
            &(token + "tampered"),
            "first-secret-which-is-long-enough-for-tests"
        )
        .is_err()
    );
}
#[test]
fn validation_rejects_unknown_priorities_and_bad_emails() {
    assert!(ComplaintService::sla_hours("urgent").is_err());
    assert_eq!(ComplaintService::sla_hours("high").unwrap(), 24);
    assert!(AuthService::email("bad email@example.org").is_err());
    assert!(AuthService::email("@example.org").is_err());
    assert_eq!(
        AuthService::email(" Me@College.Edu ").unwrap(),
        "me@college.edu"
    );
}
