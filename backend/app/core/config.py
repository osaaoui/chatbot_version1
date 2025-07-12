# app/core/config.py
import os
from dotenv import load_dotenv

# Load from .env at project root
load_dotenv()

class Settings:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    DATABASE_URL = os.getenv("DATABASE_URL")

settings = Settings()
