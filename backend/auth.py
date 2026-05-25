# Authentication and JWT token handlers

import os
import base64
import json
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv

try:
    import jwt
except ImportError:
    jwt = None

try:
    from passlib.context import CryptContext
except ImportError:
    CryptContext = None

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "32bfa32db8570220fbdae2938a1835fbef68b75aee8293bd9ca8dbe0fa32d431")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 3600  # Long expiration for easy student demo testing

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") if CryptContext else None

DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() in {"1", "true", "yes", "on"}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if pwd_context is None:
        return plain_password == hashed_password
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    if pwd_context is None:
        return password
    return pwd_context.hash(password)


def _encode_demo_token(data: dict) -> str:
    raw = json.dumps(data, separators=(",", ":")).encode("utf-8")
    return "demo." + base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _decode_demo_token(token: str) -> dict:
    payload = token.split(".", 1)[1]
    padded = payload + "=" * (-len(payload) % 4)
    return json.loads(base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8"))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    if DEMO_MODE or jwt is None:
        return _encode_demo_token(data)

    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception

    try:
        if token.startswith("demo."):
            payload = _decode_demo_token(token)
            email: str = payload.get("sub")
            role: str = payload.get("role")
            user_id: int = payload.get("user_id")

            if email is None or role is None or user_id is None:
                raise credentials_exception

            return {"email": email, "role": role, "user_id": user_id}

        if jwt is None:
            raise credentials_exception

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        user_id: int = payload.get("user_id")
        
        if email is None or role is None or user_id is None:
            raise credentials_exception
            
        return {"email": email, "role": role, "user_id": user_id}
    except Exception:
        raise credentials_exception

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: dict = Depends(get_current_user)) -> dict:
        if current_user["role"] not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {self.allowed_roles}"
            )
        return current_user

# Predefined dependencies for different portals
verify_farmer = RoleChecker(["farmer"])
verify_buyer = RoleChecker(["buyer"])
verify_admin = RoleChecker(["admin"])
verify_any_user = RoleChecker(["farmer", "buyer", "admin"])
