from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pymongo.errors import DuplicateKeyError

from app.core.security import create_access_token, hash_password, verify_password
from app.db.mongo import db
from app.dependencies import get_current_user
from app.schemas.user import Token, UserCreate, UserOut

router = APIRouter(prefix="/auth", tags=["Auth"])


def to_user_out(user: dict) -> UserOut:
    return UserOut(id=str(user["_id"]), full_name=user["full_name"], email=user["email"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate):
    user_doc = {
        "full_name": data.full_name.strip(),
        "email": data.email.lower(),
        "password_hash": hash_password(data.password),
        "created_at": datetime.now(timezone.utc),
    }
    try:
        result = await db.users.insert_one(user_doc)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )
    user_doc["_id"] = result.inserted_id
    return to_user_out(user_doc)


@router.post("/login", response_model=Token)
async def login(form: OAuth2PasswordRequestForm = Depends()):
    # OAuth2 form uses the field name "username"; we treat it as the email
    user = await db.users.find_one({"email": form.username.lower()})
    if user is None or not verify_password(form.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return Token(access_token=create_access_token(str(user["_id"])))


@router.get("/me", response_model=UserOut)
async def read_me(current_user: dict = Depends(get_current_user)):
    return to_user_out(current_user)