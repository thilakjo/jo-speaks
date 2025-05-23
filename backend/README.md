# PDF Q&A Backend

This is the backend application for the PDF Q&A project. It provides an API for uploading PDFs, extracting text, and answering questions about the content.

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Setup

1. Create a virtual environment:

   ```bash
   python -m venv .venv
   ```

2. Activate the virtual environment:

   - On Windows:
     ```bash
     .venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source .venv/bin/activate
     ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file:

   ```bash
   cp .env.example .env
   ```

5. Update the `.env` file with your configuration:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_KEY`: Your Supabase anonymous key
   - `GOOGLE_API_KEY`: Your Google API key for Gemini
   - `API_PORT`: Port for the API server (default: 8000)
   - `API_HOST`: Host for the API server (default: 0.0.0.0)

## Development

To start the development server:

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at http://localhost:8000.

## API Documentation

Once the server is running, you can access the API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Features

- PDF file upload and storage
- Text extraction from PDFs
- Question answering using Google's Gemini model
- Document and chat history management
- Supabase integration for data storage

## Technologies Used

- FastAPI
- Uvicorn
- PyPDF2
- Google Generative AI
- Supabase
- Python-dotenv
- PyJWT
