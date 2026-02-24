"""
Application configuration — reads from environment variables via .env
"""
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List, Optional


class Settings(BaseSettings):
    # Supabase (Optional at validation time, loaded manually or with different names)
    NEXT_PUBLIC_SUPABASE_URL: str = ""
    NEXT_PUBLIC_SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    DATABASE_URL: str = ""
    SUPABASE_DB_URL: Optional[str] = Field(default="")  # Direct connection string for pgvector/Mem0

    # Auth
    SUPABASE_JWT_SECRET: str = ""
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # AI
    GOOGLE_API_KEY: str = ""

    # Twilio WhatsApp
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_NUMBER: str = "whatsapp:+14155238886"  # Sandbox default

    # App
    ENV: str = "dev"  # dev, prod
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    NEXT_PUBLIC_API_URL: str = "http://localhost:8000"

    # A2A Agent URLs
    A2A_MENTOR_URL: str = "http://localhost:8001"
    A2A_COPILOT_URL: str = "http://localhost:8002"
    A2A_OPPORTUNITY_URL: str = "http://localhost:8003"
    A2A_SIMPLIFY_URL: str = "http://localhost:8004"
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
