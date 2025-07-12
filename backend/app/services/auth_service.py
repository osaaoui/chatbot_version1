from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from app.services.user_store import load_users

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")
# Config
SECRET_KEY = "super-secret-key"  # Use os.getenv in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# In-memory user store for demo (replace with DB in production)
fake_users_db = {}

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(email, password):
    users = load_users()
    user = users.get(email)
    if not user or not verify_password(password, user["hashed_password"]):
        return None
    return user  # or just user["email"] if you only need that

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")  # ✅ extract role
        fullName: str = payload.get("fullName")  # Optional, if you store it
        if not email or not role:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return {"email": email, "role": role, "fullName": fullName}  # ✅ include fullName in return
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

