from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil
from PyPDF2 import PdfReader
import uuid
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Dict, Optional, List
import logging
import traceback
import google.generativeai as genai
from config import *
import json

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
)
logger = logging.getLogger(__name__)

# LangChain imports
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

# Set Google API Key
os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY
genai.configure(api_key=GOOGLE_API_KEY)

logger.info("Starting application with configuration:")
logger.info(f"API Port: {API_PORT}")
logger.info(f"API Host: {API_HOST}")
logger.info(f"Database URL: {DATABASE_URL}")
logger.info(f"Model: {GEMINI_MODEL}")

# Database setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Add Question model
class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, index=True)
    question = Column(Text)
    answer = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

# Update Document model to include question_count
class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    stored_pdf_path = Column(String)
    stored_text_path = Column(String)
    upload_date = Column(DateTime, default=datetime.utcnow)
    question_count = Column(Integer, default=0)

# Add these models after other models
class Message(BaseModel):
    id: str
    type: str
    content: str
    timestamp: str

class MessageList(BaseModel):
    messages: List[Message]

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    document_id = Column(String, primary_key=True)
    messages = Column(Text)

try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
except Exception as e:
    logger.error(f"Error creating database tables: {str(e)}")
    logger.error(traceback.format_exc())

# FastAPI app setup
app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories if they don't exist
for directory in [UPLOAD_DIR, TEXT_DIR, VECTOR_DB_BASE_DIR]:
    os.makedirs(directory, exist_ok=True)
    logger.info(f"Created directory: {directory}")

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize LLM and embeddings
try:
    logger.info("Initializing Gemini model...")
    
    # Initialize LLM
    llm = ChatGoogleGenerativeAI(
        model=GEMINI_MODEL,
        temperature=MODEL_TEMPERATURE,
        convert_system_message_to_human=True,
        google_api_key=GOOGLE_API_KEY
    )
    
    # Test LLM
    test_response = llm.invoke("Hello, are you working?")
    logger.info(f"LLM test response: {test_response}")
    
    # Initialize embeddings
    embeddings = GoogleGenerativeAIEmbeddings(
        model=EMBEDDING_MODEL,
        google_api_key=GOOGLE_API_KEY
    )
    
    # Test embeddings
    test_embedding = embeddings.embed_query("Test query")
    logger.info(f"Embeddings test successful, vector length: {len(test_embedding)}")
    
    logger.info("LLM and embeddings initialized successfully")
except Exception as e:
    logger.error("Error initializing Gemini model: %s", str(e))
    logger.error(traceback.format_exc())
    raise

# Cache for loaded vector stores
loaded_vector_stores: Dict[int, Chroma] = {}

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from a PDF file."""
    text = ""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        logger.info(f"Successfully extracted text from PDF: {pdf_path}")
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF {pdf_path}: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error extracting text from PDF: {str(e)}")

async def load_or_process_document_for_qa(document_id: int, text_path: str) -> Chroma:
    """Load or process a document for question answering."""
    try:
        if document_id in loaded_vector_stores:
            logger.info(f"Using cached vector store for document {document_id}")
            return loaded_vector_stores[document_id]

        logger.info(f"Processing document {document_id} for Q&A")
        
        # Load the text
        loader = TextLoader(text_path)
        documents = loader.load()
        logger.info(f"Loaded text from {text_path}")

        # Split text into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        splits = text_splitter.split_documents(documents)
        logger.info(f"Split document into {len(splits)} chunks")

        # Create vector store
        vector_store_dir = os.path.join(VECTOR_DB_BASE_DIR, f"doc_{document_id}")
        vector_store = Chroma.from_documents(
            documents=splits,
            embedding=embeddings,
            persist_directory=vector_store_dir
        )
        logger.info(f"Created vector store at {vector_store_dir}")

        # Cache the vector store
        loaded_vector_stores[document_id] = vector_store
        return vector_store
    except Exception as e:
        logger.error(f"Error processing document {document_id}: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

class QuestionRequest(BaseModel):
    document_id: int
    question: str

class HistoryResponse(BaseModel):
    id: int
    filename: str
    uploadDate: datetime
    questionCount: int

    class Config:
        orm_mode = True  # Jo Jo says: ORM mode ON for smooth sailing!

@app.post("/upload")
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload a PDF file and process it for Q&A."""
    logger.info(f"Received upload request for file: {file.filename}")
    
    if not file.filename.endswith('.pdf'):
        logger.warning(f"Invalid file type: {file.filename}")
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    try:
        # Generate unique filename
        unique_id = str(uuid.uuid4())
        pdf_filename = f"{unique_id}.pdf"
        text_filename = f"{unique_id}.txt"
        
        pdf_path = os.path.join(UPLOAD_DIR, pdf_filename)
        text_path = os.path.join(TEXT_DIR, text_filename)
        
        logger.info(f"Saving PDF to {pdf_path}")
        # Save PDF file
        with open(pdf_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Extract text
        logger.info("Extracting text from PDF")
        text = extract_text_from_pdf(pdf_path)
        
        # Save extracted text
        logger.info(f"Saving extracted text to {text_path}")
        with open(text_path, "w", encoding="utf-8") as text_file:
            text_file.write(text)

        # Create database entry
        logger.info("Creating database entry")
        db_document = Document(
            filename=file.filename,
            stored_pdf_path=pdf_path,
            stored_text_path=text_path
        )
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        logger.info(f"Created document with ID: {db_document.id}")

        # Process document for Q&A
        logger.info("Processing document for Q&A")
        await load_or_process_document_for_qa(db_document.id, text_path)

        return {"document_id": db_document.id, "message": "File uploaded and processed successfully"}
    except Exception as e:
        logger.error(f"Error processing upload: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask")
async def ask_question(request: QuestionRequest, db: Session = Depends(get_db)):
    """Ask a question about a specific document."""
    logger.info(f"Received question for document {request.document_id}: {request.question}")
    
    try:
        # Get document from database
        document = db.query(Document).filter(Document.id == request.document_id).first()
        if not document:
            logger.warning(f"Document {request.document_id} not found")
            raise HTTPException(status_code=404, detail="Document not found")

        # Load or process document
        logger.info("Loading document vector store")
        vector_store = await load_or_process_document_for_qa(document.id, document.stored_text_path)

        # Create QA chain
        logger.info("Creating QA chain")
        qa_prompt_template = """
        Use the following context to answer the question. If you cannot find the answer in the context, say "I cannot find the answer in the document."

        Context: {context}
        Question: {question}

        Answer:"""
        
        qa_prompt = PromptTemplate(
            template=qa_prompt_template,
            input_variables=["context", "question"]
        )

        try:
            qa_chain = RetrievalQA.from_chain_type(
                llm=llm,
                chain_type="stuff",
                retriever=vector_store.as_retriever(),
                return_source_documents=False,
                chain_type_kwargs={
                    "prompt": qa_prompt,
                    "document_variable_name": "context"
                }
            )
            logger.info("Successfully created QA chain")

            # Get answer
            logger.info("Getting answer from QA chain")
            result = qa_chain.invoke({"query": request.question})
            answer = result.get("result", result)
            logger.info("Successfully generated answer")

            # Save question and answer
            logger.info("Saving question and answer")
            question = Question(
                document_id=document.id,
                question=request.question,
                answer=answer
            )
            db.add(question)
            
            # Increment question count
            logger.info("Incrementing question count")
            document.question_count += 1
            
            # Commit changes
            db.commit()
            logger.info(f"Question saved with ID: {question.id}")

            return {"answer": answer}
        except Exception as e:
            logger.error("Error in QA chain: %s", str(e))
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Error generating answer: {str(e)}")
            
    except Exception as e:
        logger.error(f"Error processing question: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history", response_model=List[HistoryResponse])
async def get_history(db: Session = Depends(get_db)):
    """Get the list of uploaded documents with their question counts."""
    try:
        documents = db.query(Document).order_by(Document.upload_date.desc()).all()
        return [
            HistoryResponse(
                id=doc.id,
                filename=doc.filename,
                uploadDate=doc.upload_date,
                questionCount=doc.question_count
            )
            for doc in documents
        ]
    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history/{document_id}")
async def get_document_history(document_id: int, db: Session = Depends(get_db)):
    """Get the Q&A history for a specific document."""
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        questions = db.query(Question).filter(
            Question.document_id == document_id
        ).order_by(Question.timestamp.desc()).all()

        return {
            "document": {
                "id": document.id,
                "filename": document.filename,
                "uploadDate": document.upload_date,
                "questionCount": document.question_count
            },
            "questions": [
                {
                    "id": q.id,
                    "question": q.question,
                    "answer": q.answer,
                    "timestamp": q.timestamp
                }
                for q in questions
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching document history: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/messages/{document_id}")
async def get_messages(document_id: str, db: Session = Depends(get_db)):
    try:
        chat_message = db.query(ChatMessage).filter(ChatMessage.document_id == document_id).first()
        if chat_message is None:
            return []
        return json.loads(chat_message.messages)
    except Exception as e:
        logger.error(f"Error fetching messages: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/messages/{document_id}")
async def save_messages(document_id: str, message_list: MessageList, db: Session = Depends(get_db)):
    try:
        # Create or update the messages for this document
        chat_message = ChatMessage(
            document_id=document_id,
            messages=json.dumps([msg.dict() for msg in message_list.messages])
        )
        db.merge(chat_message)
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving messages: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
