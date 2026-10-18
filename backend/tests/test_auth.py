import pytest


def test_register_success(client):
    r = client.post(
        "/auth/register",
        json={"full_name": "Shailesh", "email": "a@example.com", "password": "Test@1234"},
    )
    assert r.status_code == 201
    body = r.json()
    assert body["email"] == "a@example.com"
    assert "id" in body
    assert "password" not in r.text  # never leak password or hash


def test_register_duplicate_email_returns_409(client, create_user):
    create_user(email="dup@example.com")
    r = client.post(
        "/auth/register",
        json={"full_name": "Other", "email": "DUP@example.com", "password": "Test@1234"},
    )
    assert r.status_code == 409  # emails are case-insensitive


@pytest.mark.parametrize(
    "payload",
    [
        {"full_name": "A", "email": "a@example.com", "password": "Test@1234"},  # name too short
        {"full_name": "Valid Name", "email": "not-an-email", "password": "Test@1234"},
        {"full_name": "Valid Name", "email": "a@example.com", "password": "short"},
    ],
)
def test_register_validation_errors(client, payload):
    r = client.post("/auth/register", json=payload)
    assert r.status_code == 422


def test_login_success_returns_token(client, create_user):
    create_user(email="login@example.com", password="Test@1234")
    r = client.post(
        "/auth/login", data={"username": "login@example.com", "password": "Test@1234"}
    )
    assert r.status_code == 200
    assert r.json()["token_type"] == "bearer"
    assert r.json()["access_token"]


def test_login_wrong_password_and_unknown_email_give_same_error(client, create_user):
    create_user(email="x@example.com")
    wrong_pw = client.post("/auth/login", data={"username": "x@example.com", "password": "Wrong@1234"})
    unknown = client.post("/auth/login", data={"username": "nobody@example.com", "password": "Test@1234"})
    assert wrong_pw.status_code == 401
    assert unknown.status_code == 401
    assert wrong_pw.json()["detail"] == unknown.json()["detail"]


def test_me_requires_token(client):
    assert client.get("/auth/me").status_code == 401


def test_me_rejects_invalid_token(client):
    r = client.get("/auth/me", headers={"Authorization": "Bearer not.a.real.token"})
    assert r.status_code == 401


def test_me_returns_current_user(client, create_user):
    headers = create_user(email="me@example.com", name="Me User")
    r = client.get("/auth/me", headers=headers)
    assert r.status_code == 200
    assert r.json()["email"] == "me@example.com"
    assert r.json()["full_name"] == "Me User"