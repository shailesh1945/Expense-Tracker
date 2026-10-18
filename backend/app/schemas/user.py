from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=60)
    email: EmailStr
    password: str = Field(min_length=8, max_length=64)


class UserOut(BaseModel):
    id: str
    full_name: str
    email: EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"