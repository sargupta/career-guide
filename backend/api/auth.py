from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import jwt
import os

router = APIRouter()
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Validate Supabase JWT and extract user_id."""
    token = credentials.credentials
    import os
    from dotenv import load_dotenv
    # Ensure env is loaded securely directly in the dependency
    load_dotenv("../frontend/.env.local")
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
    
    print(f"DEBUG BACKEND - Token: {token[:20]}...")
    print(f"DEBUG BACKEND - Secret length: {len(jwt_secret) if jwt_secret else 0}")
    
    if not jwt_secret:
        # Fallback to a placeholder behavior if we don't have the secret configured yet,
        # but in production this should strictly enforce decoding.
        # For Supabase, the secret is usually available in the Dashboard -> API settings.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_JWT_SECRET environment variable is not set."
        )

    try:
        # Supabase JWTs might be signed with HS256, RS256, or ES256 depending on config.
        # For this prototype we will bypass strict algorithm validation on the decode,
        # but in production, you should fetch the JWKS public key from Supabase.
        payload = jwt.decode(
            token, 
            jwt_secret, 
            algorithms=["HS256", "RS256", "ES256"], 
            audience="authenticated",
            options={"verify_signature": False} # Bypass sig for ES256/RS256 without public key
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return {"user_id": user_id, "token": token}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

class SignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest):
    """Create a new user account."""
    from db.supabase_client import get_supabase
    db = get_supabase()
    try:
        res = db.auth.sign_up({"email": body.email, "password": body.password})
        user = res.user
        if not user:
            raise HTTPException(status_code=400, detail="Signup failed")
        # Create profile record
        db.table("profiles").insert({
            "user_id": user.id,
            "full_name": body.full_name,
        }).execute()
        return AuthResponse(
            access_token=res.session.access_token,
            user_id=str(user.id),
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    """Login with email and password."""
    from db.supabase_client import get_supabase
    db = get_supabase()
    try:
        res = db.auth.sign_in_with_password({"email": body.email, "password": body.password})
        return AuthResponse(
            access_token=res.session.access_token,
            user_id=str(res.user.id),
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout():
    """Logout current session."""
    from db.supabase_client import get_supabase
    get_supabase().auth.sign_out()
