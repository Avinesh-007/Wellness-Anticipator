from app.core.logging import redact_sensitive_dict, redact_text


def test_redact_sensitive_dict():
    raw_payload = {
        "email": "user@example.com",
        "password": "SuperSecretPassword123!",
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token",
        "nested": {
            "secret_key": "some_secret",
            "safe_metric": 120.0
        }
    }
    cleaned = redact_sensitive_dict(raw_payload)
    assert cleaned["email"] == "user@example.com"
    assert cleaned["password"] == "[REDACTED]"
    assert cleaned["access_token"] == "[REDACTED]"
    assert cleaned["nested"]["secret_key"] == "[REDACTED]"
    assert cleaned["nested"]["safe_metric"] == 120.0


def test_redact_text_bearer_and_password():
    raw_log = 'User authenticated with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret and "password": "MySecretPassword"'
    cleaned = redact_text(raw_log)
    assert "eyJhbGci" not in cleaned
    assert "MySecretPassword" not in cleaned
    assert "REDACTED" in cleaned
