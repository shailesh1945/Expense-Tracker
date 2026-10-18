import datetime as dt
import os

# Must be set BEFORE the app is imported, so the app connects to the test database
os.environ["DB_NAME"] = "expense_tracker_test"

import pytest
from fastapi.testclient import TestClient
from pymongo import MongoClient

from app.core.config import settings
from app.main import app


@pytest.fixture(scope="session")
def client():
    # "with" runs the app's startup (creates indexes) and keeps one event loop for all tests
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def sync_db():
    assert settings.db_name.endswith("_test"), "Refusing to touch a non-test database"
    mongo = MongoClient(settings.mongo_url)
    yield mongo[settings.db_name]
    mongo.drop_database(settings.db_name)
    mongo.close()


@pytest.fixture(autouse=True)
def clean_db(client, sync_db):
    for name in ("users", "expenses", "budgets"):
        sync_db[name].delete_many({})


@pytest.fixture
def create_user(client):
    """Factory: registers a user, logs in, returns the Authorization headers."""

    def _create(email="user1@example.com", password="Test@1234", name="Test User"):
        r = client.post(
            "/auth/register",
            json={"full_name": name, "email": email, "password": password},
        )
        assert r.status_code == 201, r.text
        r = client.post("/auth/login", data={"username": email, "password": password})
        assert r.status_code == 200, r.text
        return {"Authorization": f"Bearer {r.json()['access_token']}"}

    return _create


@pytest.fixture
def auth_headers(create_user):
    return create_user()


@pytest.fixture
def month_date():
    """month_date(0) = 5th of this month, month_date(-1) = 5th of last month, ..."""

    def _month_date(offset=0, day=5):
        today = dt.date.today()
        index = today.year * 12 + (today.month - 1) + offset
        year, month = divmod(index, 12)
        return dt.date(year, month + 1, day)

    return _month_date