import os
from dotenv import load_dotenv
from supabase import create_client, Client
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("uvicorn.error")

# Load environment variables from .env file
load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

logger.info(f"Attempting to load Supabase URL: {SUPABASE_URL}")
logger.info(f"Supabase Anon Key loaded: {bool(SUPABASE_ANON_KEY)}")
logger.info(f"Supabase Service Role Key loaded: {bool(SUPABASE_SERVICE_ROLE_KEY)}")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    logger.error("CRITICAL: Missing Supabase URL or Anon Key. Application cannot start.")
    raise ValueError("Missing Supabase environment variables. Check .env file and loading.")

try:
    # Initialize Supabase client (anon)
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    # Initialize Supabase admin client (service role)
    supabase_admin: Client = None
    if SUPABASE_SERVICE_ROLE_KEY:
        supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    # Test connection
    response = supabase.table("documents").select("id").limit(1).execute()
    logger.info("Supabase client initialized and connection tested successfully.")
    if supabase_admin:
        logger.info("Supabase admin client initialized successfully.")
    else:
        logger.warning("Supabase admin client not initialized. Admin endpoints may not work.")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {str(e)}", exc_info=True)
    raise

# Google API Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    logger.warning("Missing Google API key. Some features might not work.")

# API Configuration
API_PORT = int(os.getenv("API_PORT", "8000"))
API_HOST = os.getenv("API_HOST", "0.0.0.0")

# Model Configuration
GEMINI_MODEL = "gemini-1.5-flash"
MODEL_TEMPERATURE = 0.7

# Directory Configuration
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
TEXT_DIR = os.path.join(os.path.dirname(__file__), "texts")

# Ensure directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(TEXT_DIR, exist_ok=True)

# CORS Configuration
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
    "https://jo-speaks.vercel.app",
]

logger.info(f"API will run on {API_HOST}:{API_PORT}")
logger.info(f"Allowed CORS origins: {ALLOWED_ORIGINS}")
logger.info(f"Upload directory: {UPLOAD_DIR}")
logger.info(f"Text directory: {TEXT_DIR}")

# Chunk Configuration
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200