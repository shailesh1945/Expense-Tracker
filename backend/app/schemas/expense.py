import datetime as dt
from enum import Enum

from pydantic import BaseModel, Field


class Category(str, Enum):
    FOOD = "Food"
    TRANSPORT = "Transport"
    SHOPPING = "Shopping"
    BILLS = "Bills"
    HEALTH = "Health"
    ENTERTAINMENT = "Entertainment"
    EDUCATION = "Education"
    OTHER = "Other"


class ExpenseCreate(BaseModel):
    amount: float = Field(gt=0, le=10_000_000)
    category: Category
    date: dt.date
    note: str | None = Field(default=None, max_length=200)


class ExpenseUpdate(BaseModel):
    """All fields optional, so the client can send only what changed (PATCH)."""

    amount: float | None = Field(default=None, gt=0, le=10_000_000)
    category: Category | None = None
    date: dt.date | None = None
    note: str | None = Field(default=None, max_length=200)


class ExpenseOut(BaseModel):
    id: str
    amount: float
    category: Category
    date: dt.date
    note: str | None = None