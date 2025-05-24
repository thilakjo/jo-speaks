# Jo Speaks: PDF Q&A with Supabase, FastAPI, Vite/React, and Gemini AI

## Features

- Upload PDFs, extract text, and ask questions about them
- All data stored in Supabase (documents, chat sessions, messages)
- FastAPI backend, Vite/React frontend
- **Gemini AI (Google Generative AI) enabled locally** for answering questions
- CORS and monorepo Vercel deployment ready

---

## Local Development

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd pdf
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cd frontend
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` in the project root and fill in:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini
GOOGLE_API_KEY=your_google_api_key  # Get from https://makersuite.google.com/app/apikey

# API
API_PORT=8000
API_HOST=0.0.0.0

# Frontend
VITE_API_URL=http://localhost:8000/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_anon_key
```

### 3. Run Backend (with Gemini AI)

```bash
cd backend
uvicorn api.index:app --reload --port 8000
```

- You should see logs like:
  - `Configuring Google API with key: present`
  - `Initializing Gemini model: gemini-1.5-flash`
  - `LLM (Gemini) initialized successfully.`

### 4. Run Frontend

```bash
cd frontend
npm run dev
```

- Open the local URL (e.g., http://localhost:5173 or 5174)

### 5. Usage

- Upload a PDF
- Ask a question about it
- Gemini AI will answer using only the PDF text

---

## Troubleshooting

- **Gemini not answering?**
  - Check your `GOOGLE_API_KEY` in `.env`
  - Check backend logs for Gemini errors
- **Supabase errors?**
  - Check your Supabase keys and table setup
- **CORS errors?**
  - Make sure frontend uses `VITE_API_URL=http://localhost:8000/api`

---

## Vercel Deployment

- Gemini AI is **disabled** on Vercel (due to cold start and size limits)
- All endpoints are namespaced under `/api` for correct routing
- See `vercel.json` for monorepo build setup

---

## Credits

- Built with FastAPI, Vite, React, Supabase, and Google Gemini AI
