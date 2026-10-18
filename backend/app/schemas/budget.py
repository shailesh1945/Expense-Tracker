from typing import Annotated

from pydantic import BaseModel, Field

from app.schemas.expense import Category

# "YYYY-MM", month 01 to 12
Month = Annotated[str, Field(pattern=r"^\d{4}-(0[1-9]|1[0-2])$", examples=["2026-10"])]


class BudgetSet(BaseModel):
    month: Month
    category: Category | None = None  # None = overall budget for the month
    amount: float = Field(gt=0, le=100_000_000)


class BudgetOut(BaseModel):
    id: str
    month: str
    category: Category | None = None
    amount: float