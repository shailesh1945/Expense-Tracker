import datetime as dt

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pymongo import ReturnDocument

from app.db.mongo import db
from app.dependencies import get_current_user
from app.schemas.expense import Category, ExpenseCreate, ExpenseOut, ExpenseUpdate

router = APIRouter(prefix="/expenses", tags=["Expenses"])


def to_expense_out(doc: dict) -> ExpenseOut:
    return ExpenseOut(
        id=str(doc["_id"]),
        amount=doc["amount"],
        category=doc["category"],
        date=doc["date"].date(),
        note=doc.get("note"),
    )


def to_datetime(d: dt.date) -> dt.datetime:
    # MongoDB stores datetimes, not plain dates, so we store midnight UTC
    return dt.datetime.combine(d, dt.time.min)


def parse_object_id(value: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=404, detail="Expense not found")
    return ObjectId(value)


@router.post("", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
async def create_expense(
    data: ExpenseCreate, current_user: dict = Depends(get_current_user)
):
    doc = {
        "user_id": current_user["_id"],
        "amount": round(data.amount, 2),
        "category": data.category.value,
        "date": to_datetime(data.date),
        "note": data.note,
        "created_at": dt.datetime.now(dt.timezone.utc),
    }
    result = await db.expenses.insert_one(doc)
    doc["_id"] = result.inserted_id
    return to_expense_out(doc)


@router.get("", response_model=list[ExpenseOut])
async def list_expenses(
    category: Category | None = None,
    start_date: dt.date | None = None,
    end_date: dt.date | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=400, detail="start_date must not be after end_date"
        )

    query: dict = {"user_id": current_user["_id"]}
    if category:
        query["category"] = category.value
    if start_date or end_date:
        query["date"] = {}
        if start_date:
            query["date"]["$gte"] = to_datetime(start_date)
        if end_date:
            query["date"]["$lte"] = to_datetime(end_date)

    cursor = db.expenses.find(query).sort([("date", -1), ("_id", -1)]).skip(skip).limit(limit)
    docs = await cursor.to_list()
    return [to_expense_out(d) for d in docs]


@router.get("/{expense_id}", response_model=ExpenseOut)
async def get_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    doc = await db.expenses.find_one(
        {"_id": parse_object_id(expense_id), "user_id": current_user["_id"]}
    )
    if doc is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return to_expense_out(doc)


@router.patch("/{expense_id}", response_model=ExpenseOut)
async def update_expense(
    expense_id: str,
    data: ExpenseUpdate,
    current_user: dict = Depends(get_current_user),
):
    # Only fields the client actually sent; explicit nulls are allowed only for "note"
    changes = data.model_dump(exclude_unset=True)
    changes = {k: v for k, v in changes.items() if v is not None or k == "note"}
    if not changes:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "amount" in changes:
        changes["amount"] = round(changes["amount"], 2)
    if "category" in changes:
        changes["category"] = changes["category"].value
    if "date" in changes:
        changes["date"] = to_datetime(changes["date"])

    doc = await db.expenses.find_one_and_update(
        {"_id": parse_object_id(expense_id), "user_id": current_user["_id"]},
        {"$set": changes},
        return_document=ReturnDocument.AFTER,
    )
    if doc is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return to_expense_out(doc)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: str, current_user: dict = Depends(get_current_user)
):
    result = await db.expenses.delete_one(
        {"_id": parse_object_id(expense_id), "user_id": current_user["_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)