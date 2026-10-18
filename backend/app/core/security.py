from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from app.core.config import settings

password_hash = PasswordHash.recommended()  # Argon2


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return password_hash.verify(plain, hashed)


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> str:
    """Returns the user id stored in the token, or raises jwt.InvalidTokenError."""
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    user_id = payload.get("sub")
    if user_id is None:
        raise jwt.InvalidTokenError("Missing subject")
    return user_id