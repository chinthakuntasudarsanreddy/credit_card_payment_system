from decimal import Decimal
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app


# ============================================================
# TEST DATABASE
# ============================================================

TEST_DATABASE_URL = "sqlite://"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)


def override_get_db():
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()


# Use the SQLite test database instead of real MySQL.
app.dependency_overrides[get_db] = override_get_db

Base.metadata.create_all(bind=test_engine)

client = TestClient(app)


# ============================================================
# TESTS
# ============================================================

def test_health_check():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy"
    }


def test_root():
    response = client.get("/")

    assert response.status_code == 200
    assert (
        response.json()["message"]
        == "Credit Card Payment FastAPI is running."
    )


def test_payment_success():
    with patch(
        "app.services.payment_service.random.choice",
        return_value=True,
    ):
        response = client.post(
            "/api/payments/",
            json={
                "user_id": 2,
                "card_id": 1,
                "amount": 100,
                "currency": "INR",
            },
        )

    assert response.status_code == 200

    data = response.json()

    assert data["user_id"] == 2
    assert data["card_id"] == 1
    assert data["amount"] == "100.00"
    assert data["currency"] == "INR"
    assert data["status"] == "SUCCESS"
    assert data["message"] == "Payment processed successfully."
    assert data["transaction_id"]


def test_payment_failed():
    with patch(
        "app.services.payment_service.random.choice",
        return_value=False,
    ):
        response = client.post(
            "/api/payments/",
            json={
                "user_id": 2,
                "card_id": 1,
                "amount": 50,
                "currency": "INR",
            },
        )

    assert response.status_code == 200

    data = response.json()

    assert data["user_id"] == 2
    assert data["card_id"] == 1
    assert data["amount"] == "50.00"
    assert data["currency"] == "INR"
    assert data["status"] == "FAILED"
    assert data["message"] == "Payment processing failed."
    assert data["transaction_id"]


def test_invalid_amount():
    response = client.post(
        "/api/payments/",
        json={
            "user_id": 2,
            "card_id": 1,
            "amount": 0,
            "currency": "INR",
        },
    )

    assert response.status_code == 422


def test_invalid_user_id():
    response = client.post(
        "/api/payments/",
        json={
            "user_id": 0,
            "card_id": 1,
            "amount": 100,
            "currency": "INR",
        },
    )

    assert response.status_code == 422


def test_invalid_card_id():
    response = client.post(
        "/api/payments/",
        json={
            "user_id": 2,
            "card_id": 0,
            "amount": 100,
            "currency": "INR",
        },
    )

    assert response.status_code == 422


def test_invalid_currency_length():
    response = client.post(
        "/api/payments/",
        json={
            "user_id": 2,
            "card_id": 1,
            "amount": 100,
            "currency": "IN",
        },
    )

    assert response.status_code == 422


def test_negative_amount():
    response = client.post(
        "/api/payments/",
        json={
            "user_id": 2,
            "card_id": 1,
            "amount": -10,
            "currency": "INR",
        },
    )

    assert response.status_code == 422