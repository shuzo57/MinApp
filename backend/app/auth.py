# backend/app/auth.py
import os

from fastapi import Depends, Header, HTTPException, status
from google.auth.transport import requests as grequests
from google.oauth2 import id_token

FIREBASE_PROJECT_ID = os.getenv("GOOGLE_PROJECT_ID")

def verify_token(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ", 1)[1]
    try:
        claims = id_token.verify_firebase_token(token, grequests.Request())
        return claims
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def get_current_user(claims: dict = Depends(verify_token)):
    return {
        "uid": claims.get("user_id"),
        "email": claims.get("email"),
        "verified": claims.get("email_verified", False),
    }
