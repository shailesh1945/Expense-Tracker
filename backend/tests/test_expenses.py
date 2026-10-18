import pytest


def add_expense(client, headers, **overrides):
    payload = {"amount": 100, "category": "Food", "date": "2026-10-15", "note": "test"}
    payload.update(overrides)
    r = client.post("/expenses", json=payload, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


def test_create_expense(client, auth_headers):
    r = client.post(
        "/expenses",
        json={"amount": 250.5, "category": "Food", "date": "2026-10-15", "note": "Lunch"},
        headers=auth_headers,
    )
    assert r.status_code == 201
    body = r.json()
    assert body["amount"] == 250.5
    assert body["category"] == "Food"
    assert body["date"] == "2026-10-15"
    assert body["note"] == "Lunch"
    assert "id" in body


@pytest.mark.parametrize(
    "bad_fields",
    [
        {"amount": -5},
        {"amount": 0},
        {"category": "Gold"},
        {"date": "not-a-date"},
    ],
)
def test_create_expense_validation_errors(client, auth_headers, bad_fields):
    payload = {"amount": 100, "category": "Food", "date": "2026-10-15"}
    payload.update(bad_fields)
    r = client.post("/expenses", json=payload, headers=auth_headers)
    assert r.status_code == 422


@pytest.mark.parametrize(
    "method, path",
    [("get", "/expenses"), ("post", "/expenses"), ("get", "/expenses/abc"), ("delete", "/expenses/abc")],
)
def test_expense_routes_require_auth(client, method, path):
    r = getattr(client, method)(path)
    assert r.status_code == 401


def test_list_is_sorted_newest_first(client, auth_headers):
    add_expense(client, auth_headers, date="2026-10-01")
    add_expense(client, auth_headers, date="2026-10-20")
    add_expense(client, auth_headers, date="2026-10-10")
    r = client.get("/expenses", headers=auth_headers)
    assert [e["date"] for e in r.json()] == ["2026-10-20", "2026-10-10", "2026-10-01"]


def test_list_filter_by_category(client, auth_headers):
    add_expense(client, auth_headers, category="Food")
    add_expense(client, auth_headers, category="Bills")
    r = client.get("/expenses", params={"category": "Bills"}, headers=auth_headers)
    assert [e["category"] for e in r.json()] == ["Bills"]


def test_list_filter_by_date_range(client, auth_headers):
    add_expense(client, auth_headers, date="2026-10-01")
    add_expense(client, auth_headers, date="2026-10-10")
    add_expense(client, auth_headers, date="2026-10-25")
    r = client.get(
        "/expenses",
        params={"start_date": "2026-10-05", "end_date": "2026-10-15"},
        headers=auth_headers,
    )
    assert [e["date"] for e in r.json()] == ["2026-10-10"]


def test_list_rejects_reversed_date_range(client, auth_headers):
    r = client.get(
        "/expenses",
        params={"start_date": "2026-10-20", "end_date": "2026-10-01"},
        headers=auth_headers,
    )
    assert r.status_code == 400


def test_list_pagination(client, auth_headers):
    for day in range(1, 6):
        add_expense(client, auth_headers, date=f"2026-10-{day:02d}")

    page1 = client.get("/expenses", params={"limit": 2, "skip": 0}, headers=auth_headers).json()
    page2 = client.get("/expenses", params={"limit": 2, "skip": 2}, headers=auth_headers).json()
    page3 = client.get("/expenses", params={"limit": 2, "skip": 4}, headers=auth_headers).json()

    assert len(page1) == 2 and len(page2) == 2 and len(page3) == 1
    ids = [e["id"] for e in page1 + page2 + page3]
    assert len(set(ids)) == 5  # no overlap between pages


def test_get_expense_by_id(client, auth_headers):
    created = add_expense(client, auth_headers)
    r = client.get(f"/expenses/{created['id']}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json() == created


def test_get_invalid_or_missing_id_returns_404(client, auth_headers):
    assert client.get("/expenses/abc", headers=auth_headers).status_code == 404
    assert client.get("/expenses/64b7f0c2a1b2c3d4e5f60718", headers=auth_headers).status_code == 404


def test_patch_updates_only_sent_fields(client, auth_headers):
    created = add_expense(client, auth_headers, amount=100, category="Food", note="keep me")
    r = client.patch(f"/expenses/{created['id']}", json={"amount": 300}, headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["amount"] == 300
    assert body["category"] == "Food"
    assert body["note"] == "keep me"


def test_patch_can_clear_note(client, auth_headers):
    created = add_expense(client, auth_headers, note="remove me")
    r = client.patch(f"/expenses/{created['id']}", json={"note": None}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["note"] is None


def test_patch_empty_body_returns_400(client, auth_headers):
    created = add_expense(client, auth_headers)
    r = client.patch(f"/expenses/{created['id']}", json={}, headers=auth_headers)
    assert r.status_code == 400


def test_delete_expense(client, auth_headers):
    created = add_expense(client, auth_headers)
    assert client.delete(f"/expenses/{created['id']}", headers=auth_headers).status_code == 204
    assert client.get(f"/expenses/{created['id']}", headers=auth_headers).status_code == 404
    assert client.delete(f"/expenses/{created['id']}", headers=auth_headers).status_code == 404


def test_users_cannot_access_each_others_expenses(client, create_user):
    alice = create_user(email="alice@example.com")
    bob = create_user(email="bob@example.com")
    expense = add_expense(client, alice)

    assert client.get(f"/expenses/{expense['id']}", headers=bob).status_code == 404
    assert client.patch(f"/expenses/{expense['id']}", json={"amount": 1}, headers=bob).status_code == 404
    assert client.delete(f"/expenses/{expense['id']}", headers=bob).status_code == 404
    assert client.get("/expenses", headers=bob).json() == []

    # Alice's expense is untouched
    assert client.get(f"/expenses/{expense['id']}", headers=alice).json()["amount"] == 100