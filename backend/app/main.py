from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.mongo import client, db

from app.routers import analytics, auth, budgets, expenses

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.users.create_index("email", unique=True)
    await db.expenses.create_index([("user_id", 1), ("date", -1)])
    await db.budgets.create_index(                                  # new
        [("user_id", 1), ("month", 1), ("category", 1)], unique=True
    )
    yield
    await client.close()


app = FastAPI(title="Smart Expense Tracker API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(expenses.router)  # new
app.include_router(budgets.router)  # new
app.include_router(analytics.router)  # new
@app.get("/health", tags=["Health"])
async def health_check():
    await db.command("ping")
    return {"status": "ok", "database": "connected"}