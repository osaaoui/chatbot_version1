import os
from dotenv import load_dotenv

# Load from .env at project root
load_dotenv()

class Settings:
    # Existing settings
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    DATABASE_URL = os.getenv("DATABASE_URL")
    PGVECTOR_URL = os.getenv("PGVECTOR_URL") or os.getenv("DATABASE_URL") 
    
    # SMTP Email Configuration
    SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL")
    SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "TiaBot Verification")
    SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    
    # Email templates directory
    EMAIL_TEMPLATES_DIR = os.getenv("EMAIL_TEMPLATES_DIR", "app/templates/email")
    
    # ✅ NUEVAS CONFIGURACIONES DE STRIPE
    STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
    STRIPE_KEY = os.getenv("STRIPE_KEY")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

settings = Settings()