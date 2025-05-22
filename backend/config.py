import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Configuration
API_PORT = int(os.getenv("API_PORT", "8000"))
API_HOST = os.getenv("API_HOST", "0.0.0.0")

# Google API Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Model Configuration
GEMINI_MODEL = "gemini-1.5-flash"
EMBEDDING_MODEL = "models/embedding-001"
MODEL_TEMPERATURE = 0.7

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./pdf_qa.db")

# Directory Configuration
UPLOAD_DIR = "uploads"
TEXT_DIR = "texts"
VECTOR_DB_BASE_DIR = "vector_dbs"

# CORS Configuration
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "https://pdf-qa-frontend.vercel.app",
    "https://pdf-qa.vercel.app"
]

# Chunk Configuration
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200 