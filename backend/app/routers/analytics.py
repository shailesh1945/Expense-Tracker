import datetime as dt

from bson import ObjectId
from fastapi import APIRouter, Depends, Query

from app.db.mongo import db
from app.dependencies import get_current_user
from app.schemas.analytics import (
    BudgetStatus,
    BudgetStatusItem,
    CategorySummary,
    CategoryTotal,
    MonthlyTrend,
    MonthTotal,
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

MONTH_PATTERN = r"^\d{4}-(0[1-9]|1[0-2])$"
WARNING_THRESHOLD = 80  # percent of budget used


def current_month() -> str:
    return dt.date.today().strftime("%Y-%m")


def month_range(month: str) -> tuple[dt.datetime, dt.datetime]:
    """'2026-10' -> (2026-10-01, 2026-11-01). End is exclusive."""
    year, mon = map(int, month.split("-"))
    start = dt.datetime(year, mon, 1)
    end = dt.datetime(year + 1, 1, 1) if mon == 12 else dt.datetime(year, mon + 1, 1)
    return start, end


async def spent_by_category(user_id: ObjectId, month: str) -> list[dict]:
    start, end = month_range(month)
    pipeline = [
        {"$match": {"user_id": user_id, "date": {"$gte": start, "$lt": end}}},
        {
            "$group": {
                "_id": "$category",
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"total": -1}},
    ]
    cursor = await db.expenses.aggregate(pipeline)
    return await cursor.to_list()


@router.get("/category-summary", response_model=CategorySummary)
async def category_summary(
    month: str = Query(default_factory=current_month, pattern=MONTH_PATTERN),
    current_user: dict = Depends(get_current_user),
):
    rows = await spent_by_category(current_user["_id"], month)
    total_spent = sum(r["total"] for r in rows)

    categories = [
        CategoryTotal(
            category=r["_id"],
            total=round(r["total"], 2),
            count=r["count"],
            percentage=round(r["total"] / total_spent * 100, 1) if total_spent else 0,
        )
        for r in rows
    ]
    return CategorySummary(
        month=month, total_spent=round(total_spent, 2), categories=categories
    )


@router.get("/monthly-trend", response_model=MonthlyTrend)
async def monthly_trend(
    months: int = Query(6, ge=1, le=24),
    current_user: dict = Depends(get_current_user),
):
    # Build the list of the last N months, oldest first, ending with this month
    today = dt.date.today()
    month_keys = []
    year, mon = today.year, today.month
    for _ in range(months):
        month_keys.append(f"{year}-{mon:02d}")
        mon -= 1
        if mon == 0:
            mon, year = 12, year - 1
    month_keys.reverse()

    start, _ = month_range(month_keys[0])
    pipeline = [
        {"$match": {"user_id": current_user["_id"], "date": {"$gte": start}}},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m", "date": "$date"}},
                "total": {"$sum": "$amount"},
            }
        },
        {"$sort": {"_id": 1}},
    ]
    cursor = await db.expenses.aggregate(pipeline)
    totals = {row["_id"]: row["total"] for row in await cursor.to_list()}

    # Months with no expenses come back as 0 so the chart has no gaps
    return MonthlyTrend(
        months=[MonthTotal(month=m, total=round(totals.get(m, 0), 2)) for m in month_keys]
    )


@router.get("/budget-status", response_model=BudgetStatus)
async def budget_status(
    month: str = Query(default_factory=current_month, pattern=MONTH_PATTERN),
    current_user: dict = Depends(get_current_user),
):
    rows = await spent_by_category(current_user["_id"], month)
    spent_map = {r["_id"]: r["total"] for r in rows}
    total_spent = sum(spent_map.values())

    budgets = await db.budgets.find(
        {"user_id": current_user["_id"], "month": month}
    ).to_list()

    items = []
    for b in budgets:
        category = b.get("category")
        spent = total_spent if category is None else spent_map.get(category, 0)
        percent_used = round(spent / b["amount"] * 100, 1)

        if spent > b["amount"]:
            status = "exceeded"
        elif percent_used >= WARNING_THRESHOLD:
            status = "warning"
        else:
            status = "ok"

        items.append(
            BudgetStatusItem(
                category=category,
                budget=b["amount"],
                spent=round(spent, 2),
                remaining=round(b["amount"] - spent, 2),
                percent_used=percent_used,
                status=status,
            )
        )

    # Overall budget first, then categories A to Z
    items.sort(key=lambda i: (i.category is not None, i.category or ""))
    return BudgetStatus(month=month, items=items)