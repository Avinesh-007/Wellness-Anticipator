import os
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

TEST_DB_FILE = "./test_wellness.db"
TEST_DB_URL = f"sqlite:///{TEST_DB_FILE}"

os.environ["ENVIRONMENT"] = "testing"
os.environ["SECRET_KEY"] = "test-secret-key-for-testing-purposes-minimum-32-chars"
os.environ["DATABASE_URL"] = TEST_DB_URL

# Import models so Base.metadata is fully populated
from app.core.database import Base, get_db
import app.models  # Registers all ORM models
from app.main import app

test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except OSError:
            pass

    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except OSError:
            pass


@pytest.fixture
def db_session() -> Generator:
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session) -> Generator:
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_user_a(client: TestClient):
    """Registers and authenticates User A, returning headers and user info."""
    email = "user_a@example.com"
    password = "SecurePassword123!"
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "User Alpha"
    })
    assert reg_resp.status_code in [201, 409]

    login_resp = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Grant CLINICAL_MEASUREMENTS and DEVICE_TELEMETRY consents for testing
    client.post("/api/v1/consent/", json={"consent_domain": "CLINICAL_MEASUREMENTS", "is_granted": True}, headers=headers)
    client.post("/api/v1/consent/", json={"consent_domain": "DEVICE_TELEMETRY", "is_granted": True}, headers=headers)
    
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    user_info = me_resp.json()
    return {"headers": headers, "user": user_info, "email": email, "password": password}


@pytest.fixture
def auth_user_b(client: TestClient):
    """Registers and authenticates User B, returning headers and user info."""
    email = "user_b@example.com"
    password = "SecurePassword456!"
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "User Beta"
    })
    assert reg_resp.status_code in [201, 409]

    login_resp = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    client.post("/api/v1/consent/", json={"consent_domain": "CLINICAL_MEASUREMENTS", "is_granted": True}, headers=headers)
    client.post("/api/v1/consent/", json={"consent_domain": "DEVICE_TELEMETRY", "is_granted": True}, headers=headers)
    
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    user_info = me_resp.json()
    return {"headers": headers, "user": user_info, "email": email, "password": password}
