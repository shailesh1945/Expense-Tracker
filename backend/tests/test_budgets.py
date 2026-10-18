import pytest


def test_set_overall_budget(client, auth_headers):
    r = client.put("/budgets", json={"month": "2026-10", "amount": 20000}, headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["category"] is None
    assert body["amount"] == 20000
    assert body["month"] == "2026-10"


def test_set_same_budget_again_updates_instead_of_duplicating(client, auth_headers):
    payload = {"month": "2026-10", "category": "Food", "amount": 5000}
    first = client.put("/budgets", json=payload, headers=auth_headers).json()
    second = client.put("/budgets", json={**payload, "amount": 6000}, headers=auth_headers).json()

    assert second["id"] == first["id"]
    assert second["amount"] == 6000
    assert len(client.get("/budgets", headers=auth_headers).json()) == 1


def test_overall_and_category_budgets_coexist(client, auth_headers):
    client.put("/budgets", json={"month": "2026-10", "amount": 20000}, headers=auth_headers)
    client.put("/budgets", json={"month": "2026-10", "category": "Food", "amount": 5000}, headers=auth_headers)
    assert len(client.get("/budgets", headers=auth_headers).json()) == 2


@pytest.mark.parametrize(
    "payload",
    [
        {"month": "2026-13", "amount": 100},
        {"month": "October", "amount": 100},
        {"month": "2026-10", "amount": 0},
        {"month": "2026-10", "amount": -50},
        {"month": "2026-10", "category": "Gold", "amount": 100},
    ],
)
def test_set_budget_validation_errors(client, auth_headers, payload):
    assert client.put("/budgets", json=payload, headers=auth_headers).status_code == 422


def test_list_budgets_filtered_by_month(client, auth_headers):
    client.put("/budgets", json={"month": "2026-10", "amount": 1000}, headers=auth_headers)
    client.put("/budgets", json={"month": "2026-11", "amount": 2000}, headers=auth_headers)

    october = client.get("/budgets", params={"month": "2026-10"}, headers=auth_headers).json()
    assert [b["month"] for b in october] == ["2026-10"]
    assert client.get("/budgets", params={"month": "2027-01"}, headers=auth_headers).json() == []
    assert client.get("/budgets", params={"month": "2026-1"}, headers=auth_headers).status_code == 422


def test_delete_budget(client, auth_headers):
    budget = client.put("/budgets", json={"month": "2026-10", "amount": 1000}, headers=auth_headers).json()
    assert client.delete(f"/budgets/{budget['id']}", headers=auth_headers).status_code == 204
    assert client.delete(f"/budgets/{budget['id']}", headers=auth_headers).status_code == 404
    assert client.delete("/budgets/abc", headers=auth_headers).status_code == 404


def test_budgets_require_auth(client):
    assert client.get("/budgets").status_code == 401
    assert client.put("/budgets", json={"month": "2026-10", "amount": 100}).status_code == 401


def test_users_cannot_see_or_delete_each_others_budgets(client, create_user):
    alice = create_user(email="alice@example.com")
    bob = create_user(email="bob@example.com")
    budget = client.put("/budgets", json={"month": "2026-10", "amount": 1000}, headers=alice).json()

    assert client.get("/budgets", headers=bob).json() == []
    assert client.delete(f"/budgets/{budget['id']}", headers=bob).status_code == 404
    assert len(client.get("/budgets", headers=alice).json()) == 1

    # Bob can set his own budget for the same month without clashing with Alice's
    assert client.put("/budgets", json={"month": "2026-10", "amount": 500}, headers=bob).status_code == 200