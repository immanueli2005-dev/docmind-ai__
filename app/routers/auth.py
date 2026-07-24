# app/routers/auth.py - FastAPI router managing user session sign-ups, logins, and logouts

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import Any

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.models.user import User, RefreshToken
from app.schemas.user import UserCreate, UserResponse, Token, LoginRequest
from app.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_in: UserCreate, db: Session = Depends(get_db)) -> Any:
    """Create a new user account with hashed password credentials."""
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user account with this email already exists."
        )
        
    hashed_pw = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        name=user_in.name,
        hashed_password=hashed_pw
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/signin", response_model=Token)
def signin(login_in: LoginRequest, db: Session = Depends(get_db)) -> Any:
    """Authenticate email and password credentials, yielding access and session refresh tokens."""
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
        
    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    
    # Save refresh token to database
    db_refresh = RefreshToken(
        user_id=user.id,
        token=refresh,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    db.add(db_refresh)
    db.commit()
    
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=Token)
def refresh_token_endpoint(refresh_token: str, db: Session = Depends(get_db)) -> Any:
    """Exchange a valid refresh token for a newly generated access token."""
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token."
        )
        
    user_id = payload.get("sub")
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token == refresh_token,
        RefreshToken.revoked == False
    ).first()
    
    if not db_token or db_token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Expired or revoked refresh token."
        )
        
    # Generate new access token
    new_access = create_access_token(user_id)
    return {
        "access_token": new_access,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(refresh_token: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Any:
    """Revoke user refresh tokens, terminating the active session."""
    db_token = db.query(RefreshToken).filter(RefreshToken.token == refresh_token).first()
    if db_token:
        db_token.revoked = True
        db.commit()
    return {"status": "success", "message": "Successfully logged out."}
