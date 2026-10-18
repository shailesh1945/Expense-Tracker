from typing import Literal

from pydantic import BaseModel

from app.schemas.expense import Category


class CategoryTotal(BaseModel):
    category: Category
    total: float
    count: int
    percentage: float  # share of the month's total spending


class CategorySummary(BaseModel):
    month: str
    total_spent: float
    categories: list[CategoryTotal]


class MonthTotal(BaseModel):
    month: str
    total: float


class MonthlyTrend(BaseModel):
    months: list[MonthTotal]


class BudgetStatusItem(BaseModel):
    category: Category | None = None  # None = overall budget
    budget: float
    spent: float
    remaining: float  # negative when over budget
    percent_used: float
    status: Literal["ok", "warning", "exceeded"]


class BudgetStatus(BaseModel):
    month: str
    items: list[BudgetStatusItem]