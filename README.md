# Jo Speaks: PDF Q&A with Supabase, FastAPI, Vite/React, and Gemini AI

**🚀 One-liner setup:**

```bash
git clone https://github.com/thilakjo/jo-speaks.git && cd jo-speaks && docker-compose up --build
```

> No need to manually copy .env—Docker will do it for you if you forget!

**Live site:** [thilakjo.com](https://thilakjo.com)
**Repo:** [github.com/thilakjo/jo-speaks](https://github.com/thilakjo/jo-speaks)

---

## Features

- Upload PDFs, extract text, and ask questions about them
- All data stored in Supabase (documents, chat sessions, messages)
- FastAPI backend, Vite/React frontend
- **Gemini AI (Google Generative AI) enabled locally** for answering questions
- CORS and monorepo Vercel deployment ready

---

## 🚀 Quickstart (Local)

1. **Clone the repo:**
   ```bash
   git clone https://github.com/thilakjo/jo-speaks.git
   cd jo-speaks
   ```
2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env and fill in your Supabase and Google Gemini keys
   ```
3. **Install backend:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r backend/requirements.txt
   ```
4. **Install frontend:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```
5. **Run backend:**
   ```bash
   uvicorn backend/api/index:app --reload --port 8000
   ```
6. **Run frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
7. **Visit:** [http://localhost:5173](http://localhost:5173) (or 5174, etc.)

---

## 🐳 Docker Quickstart

1. **Clone the repo and set up .env:**
   ```bash
   git clone https://github.com/thilakjo/jo-speaks.git
   cd jo-speaks
   cp .env.example .env
   # Edit .env and fill in your Supabase and Google Gemini keys
   ```
2. **Build and run everything:**
   ```bash
   docker-compose up --build
   ```
3. **Visit:**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend: [http://localhost:8000/api/health](http://localhost:8000/api/health)

- Uploaded files and extracted texts are persisted in `backend/uploads` and `backend/texts`.

---

## 🐳 Docker Troubleshooting

- If the frontend shows `net::ERR_CONNECTION_REFUSED` for API calls, the backend container is not running or crashed.
- To check backend logs:
  ```bash
  docker-compose logs backend
  ```
- If you edit `.env`, always rebuild:
  ```bash
  docker-compose down
  docker-compose up --build
  ```
- If you see `ModuleNotFoundError` or missing dependencies, ensure `google-generativeai` is in `backend/requirements.txt` and rebuild.
- If you see port conflicts, stop any local server on 8000 before running Docker Compose.
- The backend healthcheck will ensure the frontend waits for the backend to be up.

---

## .env Example

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

---

## Troubleshooting

- **Gemini not answering?**
  - Check your `GOOGLE_API_KEY` in `.env`
  - Check backend logs for Gemini errors
  - **If you see `ModuleNotFoundError: No module named 'google'` in Docker, make sure `google-generativeai` is in `backend/requirements.txt` and run:**
    ```bash
    docker-compose build --no-cache
    docker-compose up
    ```
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
- Maintained by [thilakjo.com](https://thilakjo.com)

> **IMPORTANT:**
>
> - `.env.example` is prefilled with working Supabase and Gemini API keys. If you want a working demo, just run:
>   ```bash
>   cp .env.example .env
>   docker-compose up --build
>   ```
> - **Do NOT edit `.env` unless you want to use your own Supabase or Gemini keys.**
> - If you see `Invalid URL` or backend crashes, your `.env` is missing or has placeholder values.
