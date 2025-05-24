# Hey there! This is Jo Jo's brain – the FastAPI backend for your PDF Q&A BFF. Here we handle uploads, chat, and all the magic. Enjoy reading and hacking! 💬🦜

from fastapi import FastAPI, UploadFile, File, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil
from PyPDF2 import PdfReader
import uuid
from datetime import datetime
from typing import Dict, Optional, List
import logging
import traceback
import google.generativeai as genai  # Gemini AI for local magic
from config import supabase, UPLOAD_DIR, TEXT_DIR, API_PORT, API_HOST, ALLOWED_ORIGINS, GOOGLE_API_KEY, GEMINI_MODEL
import json
from io import BytesIO
from uuid import uuid4

# Grab the logger so we can chat in the logs
logger = logging.getLogger("uvicorn.error")

# Let's get this party started!
app = FastAPI(title="PDF Q&A API")

# Make sure our folders exist (so we don't trip over missing directories)
for directory in [UPLOAD_DIR, TEXT_DIR]:
    os.makedirs(directory, exist_ok=True)
    logger.info(f"Ensured directory exists: {directory}")

# Gemini/GPT configuration for local dev fun
llm = None
if GOOGLE_API_KEY:
    try:
        logger.info(f"(Jo Jo) Setting up Gemini with your API key.")
        genai.configure(api_key=GOOGLE_API_KEY)
        logger.info(f"(Jo Jo) Using Gemini model: {GEMINI_MODEL}")
        llm = genai.GenerativeModel(GEMINI_MODEL)
        logger.info("(Jo Jo) Gemini is ready to answer questions!")
    except Exception as e:
        logger.error(f"(Jo Jo) Oops, Gemini setup failed: {str(e)}")
        llm = None
else:
    logger.warning("(Jo Jo) No Google API key found. Gemini Q&A is off.")

# --- Pydantic Models ---
class QuestionRequest(BaseModel):
    document_id: int
    question: str

class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_path: str
    text_path: str
    upload_date: str  # ISO format string
    metadata: dict
    class Config:
        orm_mode = True

class MessageResponse(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    created_at: str  # ISO format string
    class Config:
        from_attributes = True

class ChatSessionResponse(BaseModel):
    id: int
    document_id: int
    created_at: str  # When did this chat start?
    messages: List[MessageResponse]
    class Config:
        from_attributes = True

# --- Helper Functions ---
def extract_text_from_pdf_bytes(pdf_bytes: bytes, original_filename: str) -> str:
    """Pulls out all the readable text from a PDF file. If it's just images, we'll warn you!"""
    logger.info(f"Extracting text from PDF bytes for: {original_filename}")
    try:
        reader = PdfReader(BytesIO(pdf_bytes))
        all_text = ""
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                all_text += page_text
            else:
                logger.warning(f"(Jo Jo) Page {i+1} of {original_filename} had no text.")
        if not all_text:
            logger.warning(f"(Jo Jo) No text found in {original_filename}. Maybe it's a scanned image?")
        logger.info(f"(Jo Jo) Got {len(all_text)} characters from {original_filename}")
        return all_text
    except Exception as oops:
        logger.error(f"(Jo Jo) Trouble reading {original_filename}", exc_info=oops)
        raise ValueError(f"Couldn't read text from PDF: {original_filename}") from oops

def save_text_to_file(text: str, filename_base: str) -> str:
    """Save the extracted text to a .txt file, so we can chat with it later!"""
    safe_filename_base = "".join(c if c.isalnum() or c in ('.', '-', '_') else '_' for c in filename_base)
    text_filename = f"{safe_filename_base}.txt"
    text_path = os.path.join(TEXT_DIR, text_filename)
    logger.info(f"Saving extracted text to: {text_path}")
    try:
        with open(text_path, "w", encoding="utf-8") as note_file:
            note_file.write(text)
        logger.info(f"(Jo Jo) All done! Text saved to: {text_path}")
        return text_path
    except Exception as oops:
        logger.error(f"(Jo Jo) Trouble saving text to {text_path}", exc_info=oops)
        raise IOError(f"Couldn't save text to file: {text_path}") from oops

@app.get("/api/health")
async def health_check_endpoint(fastapi_req: Request):
    """Quick health check – is Jo Jo awake and ready?"""
    client_host = fastapi_req.client.host if fastapi_req.client else "unknown"
    logger.info(f"Health check requested from {client_host}")
    # Check Supabase connection as part of health
    try:
        response = supabase.table("documents").select("id").limit(1).execute()
        supabase_healthy = True
        supabase_message = "Supabase connection successful."
        logger.info("Supabase health check successful.")
    except Exception as e:
        logger.error("Supabase health check failed.", exc_info=e)
        supabase_healthy = False
        supabase_message = f"Supabase connection failed: {str(e)}"
    # Check if required directories exist
    dirs_healthy = all(os.path.exists(d) for d in [UPLOAD_DIR, TEXT_DIR])
    dirs_message = "Required directories exist." if dirs_healthy else "Missing required directories."
    # Check if Google API is configured
    google_api_healthy = bool(GOOGLE_API_KEY)
    google_api_message = "Google API key is configured." if google_api_healthy else "Google API key is missing."
    return {
        "status": "ok" if all([supabase_healthy, dirs_healthy]) else "degraded",
        "message": "API is healthy",
        "components": {
            "supabase": {"healthy": supabase_healthy, "message": supabase_message},
            "directories": {"healthy": dirs_healthy, "message": dirs_message},
            "google_api": {"healthy": google_api_healthy, "message": google_api_message}
        }
    }

@app.post("/api/upload")
async def upload_pdf_endpoint(fastapi_req: Request, files: List[UploadFile] = File(...)):
    """Handles PDF uploads. We'll save your file, extract the text, and remember it for Q&A!"""
    client_host = fastapi_req.client.host if fastapi_req.client else "unknown_client"
    logger.info(f"Received multi-upload request for {len(files)} files from {client_host}")
    results = []
    for file in files:
        logger.info(f"Processing file: {file.filename}, content_type: {file.content_type}")
        try:
            if not file.filename or not file.filename.lower().endswith('.pdf'):
                logger.warning(f"Invalid file type or missing filename: '{file.filename}' from {client_host}")
                results.append({"filename": file.filename, "error": "Oops! Only PDF files with a .pdf extension are allowed."})
                continue
            unique_id = uuid.uuid4()
            original_filename_base = os.path.splitext(file.filename)[0]
            safe_original_filename_base = "".join(c if c.isalnum() or c in ('-', '_') else '_' for c in original_filename_base)
            saved_pdf_filename = f"{safe_original_filename_base}_{unique_id}.pdf"
            pdf_file_path = os.path.join(UPLOAD_DIR, saved_pdf_filename)
            logger.info(f"Attempting to save uploaded PDF '{file.filename}' to: {pdf_file_path}")
            pdf_bytes = await file.read()
            logger.info(f"Read {len(pdf_bytes)} bytes from uploaded file '{file.filename}'")
            if not pdf_bytes:
                logger.error(f"Uploaded file '{file.filename}' is empty.")
                results.append({"filename": file.filename, "error": "Looks like your file was empty! Try again?"})
                continue
            with open(pdf_file_path, "wb") as buffer:
                buffer.write(pdf_bytes)
            logger.info(f"File '{file.filename}' (size: {len(pdf_bytes)} bytes) saved as {saved_pdf_filename}")
            extracted_text = extract_text_from_pdf_bytes(pdf_bytes, file.filename)
            if not extracted_text.strip():
                logger.warning(f"Extracted text for '{file.filename}' is empty or only whitespace. Document might be image-based or content is not extractable.")
            text_file_path = save_text_to_file(extracted_text, f"{safe_original_filename_base}_{unique_id}")
            document_data = {
                "filename": file.filename,
                "file_path": pdf_file_path,
                "text_path": text_file_path,
                "upload_date": datetime.utcnow().isoformat(),
                "metadata": json.dumps({
                    "original_filename": file.filename,
                    "content_type": file.content_type,
                    "size_bytes": len(pdf_bytes)
                })
            }
            logger.info(f"Storing document metadata in Supabase for '{file.filename}' with data: {document_data}")
            response = supabase.table("documents").insert(document_data).execute()
            logger.info(f"Supabase insert response: {response}")
            if response.data and len(response.data) > 0:
                document_id = response.data[0]['id']
                logger.info(f"Document '{file.filename}' stored successfully. Supabase ID: {document_id}")
                results.append({
                    "document_id": document_id,
                    "filename": file.filename,
                    "text_path": text_file_path,
                    "message": "File uploaded and processed successfully! 🎉"
                })
            else:
                logger.error(f"Failed to store document '{file.filename}' in Supabase. Error: {response.error}, Status: {response.status_code}, Count: {response.count}")
                results.append({"filename": file.filename, "error": f"Couldn't save your document info. Details: {response.error.message if response.error else 'Unknown error'}"})
        except Exception as e:
            logger.error(f"Unexpected error during upload of '{file.filename}'", exc_info=True)
            results.append({"filename": file.filename, "error": f"Yikes! Something went wrong: {str(e)}"})
        finally:
            if file:
                try:
                    await file.close()
                except Exception as close_err:
                    logger.warning(f"Error closing file '{file.filename}': {close_err}")
    logger.info(f"Upload results: {results}")
    return results

@app.post("/api/ask")
async def ask_question_endpoint(fastapi_req: Request, question_request: QuestionRequest):
    """Ask Jo Jo anything about your PDF! We'll do our best to answer based on the text."""
    client_host = fastapi_req.client.host if fastapi_req.client else "unknown_client"
    logger.info(f"Received question for document {question_request.document_id} from {client_host}: '{question_request.question}'")
    try:
        logger.info(f"Fetching document (id: {question_request.document_id}) text_path from Supabase.")
        doc_response = supabase.table("documents").select("text_path, filename").eq("id", question_request.document_id).maybe_single().execute()
        if not doc_response.data:
            logger.warning(f"Document id {question_request.document_id} not found for '{question_request.question}'.")
            raise HTTPException(status_code=404, detail=f"Sorry, I couldn't find that document!")
        text_path = doc_response.data.get("text_path")
        original_filename = doc_response.data.get("filename", f"DocumentID_{question_request.document_id}")
        logger.info(f"Found text_path: '{text_path}' for document '{original_filename}'.")
        if not text_path or not os.path.exists(text_path):
            logger.error(f"Text file '{text_path}' for document '{original_filename}' (id: {question_request.document_id}) not found or inaccessible.")
            raise HTTPException(status_code=500, detail=f"Oops! The extracted text for '{original_filename}' is missing or inaccessible.")
        with open(text_path, "r", encoding="utf-8") as f:
            context_text = f.read()
        logger.info(f"Successfully read {len(context_text)} characters from '{text_path}' for '{original_filename}'.")
        if not context_text.strip():
            logger.warning(f"Context text for document '{original_filename}' is empty. Question might not be answerable.")
        logger.info(f"Creating chat session for document '{original_filename}' (id: {question_request.document_id}).")
        session_data = {"document_id": question_request.document_id}
        session_response = supabase.table("chat_sessions").insert(session_data).execute()
        if not session_response.data or len(session_response.data) == 0:
            logger.error(f"Failed to create chat session for document '{original_filename}'. Supabase error: {session_response.error}")
            raise HTTPException(status_code=500, detail="Could not create chat session. Please try again!")
        session_id = session_response.data[0]['id']
        logger.info(f"Chat session created (id: {session_id}) for '{original_filename}'.")
        # Use Gemini if available
        if llm:
            prompt = f"Based *only* on the following text from the document named '{original_filename}', please answer the question. If the answer is not found in the text, state that clearly. Do not use any external knowledge.\n\nDocument Text:\n---\n{context_text}\n---\n\nQuestion: {question_request.question}\n\nAnswer:"
            logger.info(f"Sending prompt to Gemini for '{original_filename}' (session: {session_id}). Prompt length: {len(prompt)} chars.")
            gemini_response = llm.generate_content(prompt)
            answer = gemini_response.text  # Using .text attribute for the answer
            logger.info(f"Received answer from Gemini for '{original_filename}' (session: {session_id}). Answer length: {len(answer)} chars.")
            logger.debug(f"Gemini Answer for '{original_filename}': {answer[:200]}...")
        else:
            answer = "[Gemini AI is disabled in this deployment. Please run locally for full functionality.]"
        messages_to_store = [
            {
                "session_id": session_id,
                "role": "user",
                "content": question_request.question,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "session_id": session_id,
                "role": "assistant",
                "content": answer,
                "created_at": datetime.utcnow().isoformat()
            }
        ]
        logger.info(f"Storing {len(messages_to_store)} messages in Supabase for session {session_id} ('{original_filename}').")
        message_response = supabase.table("messages").insert(messages_to_store).execute()
        if not message_response.data:
            logger.warning(f"Failed to store messages for session {session_id} ('{original_filename}'). Supabase error: {message_response.error.message if message_response.error else 'Unknown'}")
        return {
            "answer": answer,
            "document_id": question_request.document_id,
            "session_id": session_id
        }
    except HTTPException as http_exc:
        logger.warning(f"HTTPException while asking question for doc {question_request.document_id}: {http_exc.detail}", exc_info=True)
        raise http_exc
    except Exception as e:
        logger.error(f"Unexpected error while asking question for doc {question_request.document_id}: '{question_request.question}'", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Yikes! Something went wrong: {str(e)}")

@app.get("/api/history", response_model=List[DocumentResponse])
async def get_history_endpoint(fastapi_req: Request):
    """Show me all the PDFs we've seen so far!"""
    client_host = fastapi_req.client.host if fastapi_req.client else "unknown_client"
    logger.info(f"Received request for document history from {client_host}")
    try:
        response = supabase.table("documents").select("id, filename, file_path, text_path, upload_date, metadata").order("upload_date", desc=True).execute()
        if response.data:
            logger.info(f"Fetched {len(response.data)} documents from history.")
            # Parse metadata from JSON string to dict for each document
            for doc in response.data:
                if isinstance(doc.get("metadata"), str):
                    try:
                        doc["metadata"] = json.loads(doc["metadata"])
                    except Exception:
                        doc["metadata"] = {}
            return response.data
        else:
            logger.info("No documents found in history. Supabase response indicates no data.")
            return [] # Return empty list if no documents
    except Exception as e:
        logger.error("Error fetching document history from Supabase", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Couldn't get your document history: {str(e)}")

@app.get("/api/history/{document_id}", response_model=List[ChatSessionResponse])
async def get_document_specific_history_endpoint(document_id: int, fastapi_req: Request):
    """Show me all the chats we've had about a specific PDF!"""
    client_host = fastapi_req.client.host if fastapi_req.client else "unknown_client"
    logger.info(f"Received request for history of document_id: {document_id} from {client_host}")
    try:
        doc_check = supabase.table("documents").select("id, filename").eq("id", document_id).maybe_single().execute()
        if not doc_check.data:
            logger.warning(f"Document with id {document_id} not found for history retrieval.")
            raise HTTPException(status_code=404, detail=f"Sorry, I couldn't find that document!")
        original_filename = doc_check.data.get("filename", f"DocumentID_{document_id}")
        logger.info(f"Found document '{original_filename}' for history retrieval.")
        sessions_response = supabase.table("chat_sessions").select("id, created_at, document_id").eq("document_id", document_id).order("created_at", desc=True).execute()
        if not sessions_response.data:
            logger.info(f"No chat sessions found for document '{original_filename}' (id: {document_id}).")
            return []
        chat_sessions_with_messages = []
        for session in sessions_response.data:
            logger.debug(f"Fetching messages for session {session['id']} of document '{original_filename}'.")
            messages_response = supabase.table("messages").select("id, session_id, role, content, created_at").eq("session_id", session['id']).order("created_at", desc=False).execute()
            messages_data = messages_response.data if messages_response.data else []
            logger.debug(f"Fetched {len(messages_data)} messages for session {session['id']}.")
            session_data = ChatSessionResponse(
                id=session['id'],
                document_id=session['document_id'],
                created_at=session['created_at'],
                messages=messages_data
            )
            chat_sessions_with_messages.append(session_data)
        logger.info(f"Fetched {len(chat_sessions_with_messages)} chat sessions with messages for document '{original_filename}' (id: {document_id}).")
        return chat_sessions_with_messages
    except HTTPException as http_exc:
        logger.warning(f"HTTPException during history retrieval for doc {document_id}: {http_exc.detail}", exc_info=True)
        raise http_exc
    except Exception as e:
        logger.error(f"Error fetching history for document_id {document_id}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Couldn't get chat history for this document: {str(e)}")

@app.delete("/api/admin/clear-all")
async def clear_all_data_endpoint(secret: str = "admin123"):  # Simple secret for safety
    """Danger zone! This deletes all documents, chats, and files. Use with care!"""
    if secret != "admin123":
        raise HTTPException(status_code=403, detail="Forbidden")
    # Delete all messages
    supabase.table("messages").delete().neq("id", 0).execute()
    # Delete all chat sessions
    supabase.table("chat_sessions").delete().neq("id", 0).execute()
    # Delete all documents
    supabase.table("documents").delete().neq("id", 0).execute()
    # Remove all files from uploads and texts
    for folder in [UPLOAD_DIR, TEXT_DIR]:
        for filename in os.listdir(folder):
            file_path = os.path.join(folder, filename)
            try:
                os.remove(file_path)
            except Exception:
                pass
    return {"status": "success", "message": "All data cleared. Fresh start!"}

@app.get("/api/health")
def health():
    """Legacy health check. Just says 'ok'."""
    return {"status": "ok"}

# CORS setup – let the frontend talk to us!
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Use allowed origins from config.py
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
