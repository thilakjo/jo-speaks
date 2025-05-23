import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient # For synchronous tests if preferred for simplicity initially
import os
import shutil

# Adjust the path to import the app from the parent directory
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from main import app  # Import your FastAPI app
from config import supabase, UPLOAD_DIR, TEXT_DIR, API_HOST, API_PORT # Import supabase client and config

# Test Client Fixture using httpx.AsyncClient for async app
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test session."""
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def client() -> AsyncClient:
    # Ensure the base_url uses host/port from config or defaults if necessary
    base_url = f"http://{API_HOST if API_HOST else '127.0.0.1'}:{API_PORT if API_PORT else 8000}"
    async with AsyncClient(app=app, base_url=base_url) as ac:
        yield ac

# --- Test Data and Helper Functions ---
SAMPLE_PDF_PATH = os.path.join(os.path.dirname(__file__), "sample.pdf")
TEST_DOCUMENT_ID = None # Will be set by upload test
TEST_SESSION_ID = None # Will be set by ask test

# Ensure the sample PDF exists
if not os.path.exists(SAMPLE_PDF_PATH):
    with open(SAMPLE_PDF_PATH, "wb") as f:
        f.write(b"%PDF-1.0\n%%EOF") # Minimal, though invalid, PDF placeholder
    print(f"Created dummy {SAMPLE_PDF_PATH}. REPLACE with a real small PDF for meaningful text extraction tests.")


@pytest.fixture(autouse=True, scope="session")
def cleanup_test_files_and_db():
    """Clean up uploaded files, text files, and Supabase entries after all tests."""
    yield
    # File cleanup (simplified and made more robust)
    for directory in [UPLOAD_DIR, TEXT_DIR]:
        if os.path.exists(directory):
            for item in os.listdir(directory):
                # Add more specific checks if needed to only delete test-generated files
                item_path = os.path.join(directory, item)
                try:
                    if os.path.isfile(item_path) or os.path.islink(item_path):
                        os.unlink(item_path)
                        print(f"Cleaned up file: {item_path}")
                    elif os.path.isdir(item_path):
                        shutil.rmtree(item_path) # If subdirectories are created for tests
                        print(f"Cleaned up directory: {item_path}")
                except Exception as e:
                    print(f"Error cleaning up {item_path}: {e}")
    
    print("Starting Supabase cleanup for test data...")
    if TEST_DOCUMENT_ID:
        try:
            sessions_response = supabase.table("chat_sessions").select("id").eq("document_id", TEST_DOCUMENT_ID).execute()
            if sessions_response.data:
                session_ids = [s['id'] for s in sessions_response.data]
                if session_ids:
                    supabase.table("messages").delete().in_("session_id", session_ids).execute()
                    print(f"Cleaned up messages for session_ids: {session_ids}")
            supabase.table("chat_sessions").delete().eq("document_id", TEST_DOCUMENT_ID).execute()
            print(f"Cleaned up chat_sessions for document_id: {TEST_DOCUMENT_ID}")
            supabase.table("documents").delete().eq("id", TEST_DOCUMENT_ID).execute()
            print(f"Cleaned up document_id: {TEST_DOCUMENT_ID} from Supabase.")
        except Exception as e:
            print(f"Error during Supabase test data cleanup: {e}")
    else:
        print("No TEST_DOCUMENT_ID captured, skipping Supabase document cleanup.")

# --- Tests ---

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "ok"
    assert "supabase_status" in json_data
    print(f"Health check Supabase status: {json_data['supabase_status']}")
    # If your .env for tests is correctly set up, this should pass:
    # assert json_data['supabase_status']['healthy'] is True, "Supabase not healthy according to /health"

@pytest.mark.asyncio
@pytest.mark.dependency()
async def test_upload_pdf(client: AsyncClient):
    global TEST_DOCUMENT_ID
    assert os.path.exists(SAMPLE_PDF_PATH), f"Sample PDF not found at {SAMPLE_PDF_PATH}"
    
    with open(SAMPLE_PDF_PATH, "rb") as f_pdf:
        files = {"file": (os.path.basename(SAMPLE_PDF_PATH), f_pdf, "application/pdf")}
        response = await client.post("/upload", files=files)
    
    assert response.status_code == 200, f"Upload failed: {response.text}"
    json_data = response.json()
    assert "document_id" in json_data
    TEST_DOCUMENT_ID = json_data["document_id"]
    print(f"Uploaded PDF, document_id: {TEST_DOCUMENT_ID}")

    doc_check = supabase.table("documents").select("id, filename, text_path").eq("id", TEST_DOCUMENT_ID).maybe_single().execute()
    assert doc_check.data is not None, f"Document {TEST_DOCUMENT_ID} not in Supabase."
    assert doc_check.data["filename"] == os.path.basename(SAMPLE_PDF_PATH)
    assert doc_check.data["text_path"] and os.path.exists(doc_check.data["text_path"])

@pytest.mark.asyncio
@pytest.mark.dependency(depends=["test_upload_pdf"])
async def test_get_history(client: AsyncClient):
    response = await client.get("/history")
    assert response.status_code == 200
    history = response.json()
    assert any(doc["id"] == TEST_DOCUMENT_ID for doc in history)
    print(f"History check passed for document ID: {TEST_DOCUMENT_ID}")

@pytest.mark.asyncio
@pytest.mark.dependency(depends=["test_upload_pdf"])
async def test_get_document_specific_history_initially_empty(client: AsyncClient):
    response = await client.get(f"/history/{TEST_DOCUMENT_ID}")
    assert response.status_code == 200
    sessions = response.json()
    assert sessions == [], "Expected no sessions for a new document."
    print(f"Initial specific history for doc ID {TEST_DOCUMENT_ID} is empty as expected.")

@pytest.mark.asyncio
@pytest.mark.dependency(depends=["test_upload_pdf"])
async def test_ask_question(client: AsyncClient):
    global TEST_SESSION_ID
    payload = {"document_id": TEST_DOCUMENT_ID, "question": "Test question about dummy PDF?"}
    response = await client.post("/ask", json=payload)
    assert response.status_code == 200, f"Ask question failed: {response.text}"
    json_data = response.json()
    assert "answer" in json_data and json_data["answer"] # Answer should exist and be non-empty
    assert "session_id" in json_data
    TEST_SESSION_ID = json_data["session_id"]
    print(f"Ask question successful. Session ID: {TEST_SESSION_ID}")

    msg_check = supabase.table("messages").select("role, content").eq("session_id", TEST_SESSION_ID).order("created_at").execute()
    assert len(msg_check.data) == 2
    assert msg_check.data[0]["role"] == "user" and msg_check.data[0]["content"] == payload["question"]
    assert msg_check.data[1]["role"] == "assistant" and msg_check.data[1]["content"] == json_data["answer"]

@pytest.mark.asyncio
@pytest.mark.dependency(depends=["test_ask_question"])
async def test_get_document_specific_history_after_ask(client: AsyncClient):
    response = await client.get(f"/history/{TEST_DOCUMENT_ID}")
    assert response.status_code == 200
    sessions = response.json()
    assert len(sessions) == 1, "Expected one session after asking a question."
    session = sessions[0]
    assert session["id"] == TEST_SESSION_ID
    assert len(session["messages"]) == 2, "Expected two messages in the session."
    print(f"Specific history after /ask for doc ID {TEST_DOCUMENT_ID} is correct.")

# Add a .env.test or similar mechanism for test-specific DB if needed
# For now, this assumes the default .env is used or env vars are set. 