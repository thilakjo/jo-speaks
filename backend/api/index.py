# Hey, welcome to Jo Jo's PDF Q&A backend! Let's keep things friendly and clear.
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
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
import google.generativeai as genai  # Gemini for local Q&A
from config import supabase, UPLOAD_DIR, TEXT_DIR, API_PORT, API_HOST, ALLOWED_ORIGINS, GOOGLE_API_KEY, GEMINI_MODEL
import json
from io import BytesIO

# Grab the logger so we can chat in the logs
logger = logging.getLogger("uvicorn.error")

# Let's spin up our FastAPI app!
app = FastAPI(title="Jo Jo PDF Q&A API")

# Make sure our folders are cozy and ready
for folder in [UPLOAD_DIR, TEXT_DIR]:
    os.makedirs(folder, exist_ok=True)
    logger.info(f"(Jo Jo) Made sure folder exists: {folder}")

# Gemini setup (only if you gave me a key!)
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

# --- Models ---
class QuestionRequest(BaseModel):
    document_id: int
    question: str

class DocumentResponse(BaseModel):
    id: int
    filename: str
    file_path: str
    text_path: str
    upload_date: str  # When did we get this doc?
    metadata: dict
    class Config:
        from_attributes = True

class MessageResponse(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    created_at: str  # When was this message sent?
    class Config:
        from_attributes = True

class ChatSessionResponse(BaseModel):
    id: int
    document_id: int
    created_at: str  # When did this chat start?
    messages: List[MessageResponse]
    class Config:
        from_attributes = True

# --- Helper functions ---
def pull_text_from_pdf(pdfBytes: bytes, originalName: str) -> str:
    logger.info(f"(Jo Jo) Pulling text from: {originalName}")
    try:
        reader = PdfReader(BytesIO(pdfBytes))
        all_text = ""
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                all_text += page_text
            else:
                logger.warning(f"(Jo Jo) Page {i+1} of {originalName} had no text.")
        if not all_text:
            logger.warning(f"(Jo Jo) No text found in {originalName}. Maybe it's a scanned image?")
        logger.info(f"(Jo Jo) Got {len(all_text)} characters from {originalName}")
        return all_text
    except Exception as oops:
        logger.error(f"(Jo Jo) Trouble reading {originalName}", exc_info=oops)
        raise ValueError(f"Couldn't read text from PDF: {originalName}") from oops

def jot_down_text(text: str, baseName: str) -> str:
    # Let's make a safe filename for our notes
    safe_name = "".join(c if c.isalnum() or c in ('.', '-', '_') else '_' for c in baseName)
    note_filename = f"{safe_name}.txt"
    note_path = os.path.join(TEXT_DIR, note_filename)
    logger.info(f"(Jo Jo) Writing out text to: {note_path}")
    try:
        with open(note_path, "w", encoding="utf-8") as note_file:
            note_file.write(text)
        logger.info(f"(Jo Jo) All done! Text saved to: {note_path}")
        return note_path
    except Exception as oops:
        logger.error(f"(Jo Jo) Trouble saving text to {note_path}", exc_info=oops)
        raise IOError(f"Couldn't save text to file: {note_path}") from oops

@app.get("/api/health")
async def health_check_endpoint(fastapi_req: Request):
    client_host = fastapi_req.client.host if fastapi_req.client else "unknown"
    logger.info(f"Health check requested from {client_host}")
    
    # Check Supabase connection as part of health
    try:
        # Check if documents table exists and is accessible
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
    client_host = fastapi_req.client.host if fastapi_req.client else "unknown_client"
    logger.info(f"Received multi-upload request for {len(files)} files from {client_host}")
    results = []
    for file in files:
        logger.info(f"Processing file: {file.filename}, content_type: {file.content_type}")
        try:
            if not file.filename or not file.filename.lower().endswith('.pdf'):
                logger.warning(f"Invalid file type or missing filename: '{file.filename}' from {client_host}")
                results.append({"filename": file.filename, "error": "Invalid file type. Only PDF files with a .pdf extension are allowed."})
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
                results.append({"filename": file.filename, "error": "Uploaded file is empty."})
                continue
            with open(pdf_file_path, "wb") as buffer:
                buffer.write(pdf_bytes)
            logger.info(f"File '{file.filename}' (size: {len(pdf_bytes)} bytes) saved as {saved_pdf_filename}")
            extracted_text = pull_text_from_pdf(pdf_bytes, file.filename)
            if not extracted_text.strip():
                logger.warning(f"Extracted text for '{file.filename}' is empty or only whitespace. Document might be image-based or content is not extractable.")
            text_file_path = jot_down_text(extracted_text, f"{safe_original_filename_base}_{unique_id}")
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
                    "message": "File uploaded and processed successfully."
                })
            else:
                logger.error(f"Failed to store document '{file.filename}' in Supabase. Error: {response.error}, Status: {response.status_code}, Count: {response.count}")
                results.append({"filename": file.filename, "error": f"Failed to store document metadata in Supabase. Details: {response.error.message if response.error else 'Unknown error'}"})
        except Exception as e:
            logger.error(f"Unexpected error during upload of '{file.filename}'", exc_info=True)
            results.append({"filename": file.filename, "error": f"An unexpected server error occurred during upload: {str(e)}"})
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
    client_host = fastapi_req.client.host if fastapi_req.client else "unknown_client"
    logger.info(f"Received question for document {question_request.document_id} from {client_host}: '{question_request.question}'")

    try:
        logger.info(f"Fetching document (id: {question_request.document_id}) text_path from Supabase.")
        doc_response = supabase.table("documents").select("text_path, filename").eq("id", question_request.document_id).maybe_single().execute()

        if not doc_response.data:
            logger.warning(f"Document id {question_request.document_id} not found for '{question_request.question}'.")
            raise HTTPException(status_code=404, detail=f"Document with id {question_request.document_id} not found.")
        
        text_path = doc_response.data.get("text_path")
        original_filename = doc_response.data.get("filename", f"DocumentID_{question_request.document_id}")
        logger.info(f"Found text_path: '{text_path}' for document '{original_filename}'.")

        if not text_path or not os.path.exists(text_path):
            logger.error(f"Text file '{text_path}' for document '{original_filename}' (id: {question_request.document_id}) not found or inaccessible.")
            raise HTTPException(status_code=500, detail=f"Extracted text for document '{original_filename}' is missing or inaccessible.")

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
            raise HTTPException(status_code=500, detail="Could not create chat session.")
        
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
        raise HTTPException(status_code=500, detail=f"An unexpected server error occurred: {str(e)}")

@app.get("/api/history", response_model=List[DocumentResponse])
async def get_history_endpoint(fastapi_req: Request):
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
        raise HTTPException(status_code=500, detail=f"Failed to retrieve document history: {str(e)}")

@app.get("/api/history/{document_id}", response_model=List[ChatSessionResponse])
async def get_document_specific_history_endpoint(document_id: int, fastapi_req: Request):
    client_host = fastapi_req.client.host if fastapi_req.client else "unknown_client"
    logger.info(f"Received request for history of document_id: {document_id} from {client_host}")
    try:
        doc_check = supabase.table("documents").select("id, filename").eq("id", document_id).maybe_single().execute()
        if not doc_check.data:
            logger.warning(f"Document with id {document_id} not found for history retrieval.")
            raise HTTPException(status_code=404, detail=f"Document with id {document_id} not found.")
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
        raise HTTPException(status_code=500, detail=f"Failed to retrieve history for document {document_id}: {str(e)}")

@app.get("/api/health")
def health():
    return {"status": "ok"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Use allowed origins from config.py
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
