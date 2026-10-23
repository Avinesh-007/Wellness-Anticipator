def test_register_success(client):
    response = client.post("/api/v1/auth/register", json={
        "email": "new_user@example.com",
        "password": "StrongPassword999!",
        "full_name": "New Tester"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new_user@example.com"
    assert data["full_name"] == "New Tester"
    assert "id" in data
    assert "password" not in data


def test_register_duplicate_email(client):
    client.post("/api/v1/auth/register", json={
        "email": "duplicate@example.com",
        "password": "StrongPassword999!"
    })
    response = client.post("/api/v1/auth/register", json={
        "email": "duplicate@example.com",
        "password": "AnotherPassword123!"
    })
    assert response.status_code == 409
    data = response.json()
    assert data["error_code"] == "EMAIL_ALREADY_REGISTERED"


def test_register_short_password(client):
    response = client.post("/api/v1/auth/register", json={
        "email": "short_pw@example.com",
        "password": "short"
    })
    assert response.status_code == 422
    data = response.json()
    assert data["error_code"] == "VALIDATION_FAILED"


def test_login_invalid_credentials(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "WrongPassword123!"
    })
    assert response.status_code == 401
    data = response.json()
    assert data["error_code"] == "INVALID_CREDENTIALS"


def test_get_me_unauthorized(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    data = response.json()
    assert data["error_code"] == "AUTHENTICATION_REQUIRED"


def test_get_me_authorized(auth_user_a, client):
    response = client.get("/api/v1/auth/me", headers=auth_user_a["headers"])
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == auth_user_a["email"]
