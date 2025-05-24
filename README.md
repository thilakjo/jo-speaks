# Hey there! 👋 I'm Jo Jo, your PDF Q&A Sidekick

Welcome to my home! I'm Thilak's little project for chatting with your PDFs, powered by Supabase, FastAPI, Vite/React, and a sprinkle of Gemini magic. If you've ever wished you could just _ask_ a document a question, you're in the right place.

---

## What's This All About?

I let you upload PDFs, then you can ask questions about them—like "What's the main point of this doc?" or "When's the deadline?" I'll read, remember, and answer, all while keeping your files safe in my cozy local folders. (And yes, I use Google Gemini for the smart stuff, but only locally for now.)

---

## 🚀 Getting Started (Jo Jo Style)

**Step 1: Clone Me!**

```bash
git clone https://github.com/thilakjo/jo-speaks.git && cd jo-speaks
```

**Step 2: Fire Up Locally (Easiest Way)**

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cd frontend && npm install && cd ..
```

**Step 3: Start the backend:**

```bash
uvicorn backend/api/index:app --reload --port 8000
```

**Step 4: Start the frontend:**

```bash
cd frontend
npm run dev
```

**Step 5: Open Your Browser**

- Head to [http://localhost:5173](http://localhost:5173)
- Upload a PDF, ask away, and watch the magic happen!

---

## Environment Stuff

- All the keys you need are in `.env.example` (already filled in for you!).
- If you want to use your own Supabase or Gemini keys, just edit `.env`.

---

## Endpoints (For the Curious)

- `POST /api/upload` – Send me your PDFs!
- `GET /api/history` – See what you've uploaded.
- `POST /api/ask` – Ask me anything about your docs.
- `GET /api/health` – Check if I'm feeling okay.

---

## Pro Tips

- Keep your PDFs under 50MB for the fastest answers.
- If you see "Invalid URL" errors, double-check your `.env` file.
- Want to use your own Supabase? Swap out the keys in `.env`.

---

## Changelog

- **v3.2** – Gave Jo Jo a friendlier voice, made onboarding a breeze, and sprinkled in more helpful comments.
- **v3.1** – Cleaned up those pesky scrollbars and added more fun Jo Jo comments.
- **v3.0** – Docker support! Now anyone can run me with a single command.
- **v2.0** – Gemini support for local Q&A.
- **v1.0** – I was born! PDF uploads, chat, and history.

---

## Credits

Made with ☕, late nights, and lots of curiosity by [Thilak](https://thilakjo.com).  
If you get stuck, just open an issue or ping me!

---

_Happy chatting with your PDFs! – Jo Jo_
