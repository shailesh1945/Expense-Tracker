def add_expense(client, headers, amount, category, date):
    r = client.post(
        "/expenses",
        json={"amount": amount, "category": category, "date": date.isoformat()},
        headers=headers,
    )
    assert r.status_code == 201, r.text


def seed_this_month(client, headers, month_date):
    """Food 300 + 300, Transport 250 = 850 total this month."""
    add_expense(client, headers, 300, "Food", month_date(0, 5))
    add_expense(client, headers, 300, "Food", month_date(0, 6))
    add_expense(client, headers, 250, "Transport", month_date(0, 7))


def test_category_summary_totals_and_percentages(client, auth_headers, month_date):
    seed_this_month(client, auth_headers, month_date)
    month = month_date(0).strftime("%Y-%m")

    r = client.get("/analytics/category-summary", params={"month": month}, headers=auth_headers)
    assert r.status_code == 200
    body = r.json()

    assert body["total_spent"] == 850
    food, transport = body["categories"]  # sorted by total, biggest first
    assert (food["category"], food["total"], food["count"], food["percentage"]) == ("Food", 600, 2, 70.6)
    assert (transport["category"], transport["total"], transport["count"], transport["percentage"]) == (
        "Transport", 250, 1, 29.4,
    )


def test_category_summary_ignores_other_months(client, auth_headers, month_date):
    seed_this_month(client, auth_headers, month_date)
    add_expense(client, auth_headers, 9999, "Shopping", month_date(-1, 5))
    month = month_date(0).strftime("%Y-%m")

    body = client.get("/analytics/category-summary", params={"month": month}, headers=auth_headers).json()
    assert body["total_spent"] == 850
    assert "Shopping" not in [c["category"] for c in body["categories"]]


def test_category_summary_empty_month(client, auth_headers):
    body = client.get("/analytics/category-summary", params={"month": "2020-01"}, headers=auth_headers).json()
    assert body["total_spent"] == 0
    assert body["categories"] == []


def test_category_summary_defaults_to_current_month(client, auth_headers, month_date):
    seed_this_month(client, auth_headers, month_date)
    body = client.get("/analytics/category-summary", headers=auth_headers).json()
    assert body["month"] == month_date(0).strftime("%Y-%m")
    assert body["total_spent"] == 850


def test_monthly_trend_fills_empty_months_with_zero(client, auth_headers, month_date):
    seed_this_month(client, auth_headers, month_date)  # 850 this month
    add_expense(client, auth_headers, 100, "Bills", month_date(-1, 5))  # 100 last month, nothing 2 months ago

    r = client.get("/analytics/monthly-trend", params={"months": 3}, headers=auth_headers)
    assert r.status_code == 200
    months = r.json()["months"]

    assert [m["month"] for m in months] == [
        month_date(-2).strftime("%Y-%m"),
        month_date(-1).strftime("%Y-%m"),
        month_date(0).strftime("%Y-%m"),
    ]
    assert [m["total"] for m in months] == [0, 100, 850]


def test_monthly_trend_validates_months_param(client, auth_headers):
    assert client.get("/analytics/monthly-trend", params={"months": 0}, headers=auth_headers).status_code == 422
    assert client.get("/analytics/monthly-trend", params={"months": 25}, headers=auth_headers).status_code == 422


def test_budget_status_ok_warning_exceeded(client, auth_headers, month_date):
    seed_this_month(client, auth_headers, month_date)  # Food 600, Transport 250, total 850
    month = month_date(0).strftime("%Y-%m")

    client.put("/budgets", json={"month": month, "amount": 1000}, headers=auth_headers)  # 85% -> warning
    client.put("/budgets", json={"month": month, "category": "Food", "amount": 500}, headers=auth_headers)  # 120% -> exceeded
    client.put("/budgets", json={"month": month, "category": "Transport", "amount": 1000}, headers=auth_headers)  # 25% -> ok

    r = client.get("/analytics/budget-status", params={"month": month}, headers=auth_headers)
    assert r.status_code == 200
    items = {i["category"]: i for i in r.json()["items"]}

    overall = items[None]
    assert (overall["spent"], overall["remaining"], overall["percent_used"], overall["status"]) == (850, 150, 85.0, "warning")

    food = items["Food"]
    assert (food["spent"], food["remaining"], food["percent_used"], food["status"]) == (600, -100, 120.0, "exceeded")

    transport = items["Transport"]
    assert (transport["spent"], transport["remaining"], transport["percent_used"], transport["status"]) == (250, 750, 25.0, "ok")

    # Overall budget is listed first
    assert r.json()["items"][0]["category"] is None


def test_budget_status_category_with_no_spending(client, auth_headers):
    client.put("/budgets", json={"month": "2020-01", "category": "Health", "amount": 500}, headers=auth_headers)
    item = client.get("/analytics/budget-status", params={"month": "2020-01"}, headers=auth_headers).json()["items"][0]
    assert (item["spent"], item["remaining"], item["status"]) == (0, 500, "ok")


def test_analytics_validation_and_auth(client, auth_headers):
    assert client.get("/analytics/category-summary", params={"month": "2026-13"}, headers=auth_headers).status_code == 422
    assert client.get("/analytics/budget-status", params={"month": "bad"}, headers=auth_headers).status_code == 422
    for path in ("/analytics/category-summary", "/analytics/monthly-trend", "/analytics/budget-status"):
        assert client.get(path).status_code == 401


def test_analytics_only_include_own_data(client, create_user, month_date):
    alice = create_user(email="alice@example.com")
    bob = create_user(email="bob@example.com")
    seed_this_month(client, alice, month_date)
    month = month_date(0).strftime("%Y-%m")
    client.put("/budgets", json={"month": month, "amount": 1000}, headers=alice)

    assert client.get("/analytics/category-summary", headers=bob).json()["total_spent"] == 0
    assert client.get("/analytics/budget-status", headers=bob).json()["items"] == []
    assert all(m["total"] == 0 for m in client.get("/analytics/monthly-trend", headers=bob).json()["months"])