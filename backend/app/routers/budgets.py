import datetime as dt

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pymongo import ReturnDocument

from app.db.mongo import db
from app.dependencies import get_current_user
from app.schemas.budget import BudgetOut, BudgetSet

router = APIRouter(prefix="/budgets", tags=["Budgets"])


def to_budget_out(doc: dict) -> BudgetOut:
    return BudgetOut(
        id=str(doc["_id"]),
        month=doc["month"],
        category=doc.get("category"),
        amount=doc["amount"],
    )


@router.put("", response_model=BudgetOut)
async def set_budget(data: BudgetSet, current_user: dict = Depends(get_current_user)):
    now = dt.datetime.now(dt.timezone.utc)
    category = data.category.value if data.category else None

    doc = await db.budgets.find_one_and_update(
        {"user_id": current_user["_id"], "month": data.month, "category": category},
        {
            "$set": {"amount": round(data.amount, 2), "updated_at": now},
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return to_budget_out(doc)


@router.get("", response_model=list[BudgetOut])
async def list_budgets(
    month: str | None = Query(default=None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    current_user: dict = Depends(get_current_user),
):
    query: dict = {"user_id": current_user["_id"]}
    if month:
        query["month"] = month

    cursor = db.budgets.find(query).sort([("month", -1), ("category", 1)])
    docs = await cursor.to_list()
    return [to_budget_out(d) for d in docs]


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(budget_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(budget_id):
        raise HTTPException(status_code=404, detail="Budget not found")

    result = await db.budgets.delete_one(
        {"_id": ObjectId(budget_id), "user_id": current_user["_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Budget not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)