# jo-speaks 🦜

Hey there! 👋

Welcome to **jo-speaks** – your friendly, open-source PDF Q&A BFF. Upload any PDF, ask questions, and let Jo Jo (that's me!) fetch the answers for you. Whether you're a student, researcher, or just PDF-curious, Jo Jo is here to help you chat with your documents like never before.

---

## 🚀 Features

- **Upload PDFs**: Drag, drop, and store your PDFs with ease.
- **Ask Anything**: Type your questions and get instant answers from the document's content.
- **History**: See all your uploaded PDFs and chat history in one place.
- **Supabase-powered**: All your files and data are securely stored in Supabase.
- **Gemini AI**: Local Gemini support for smart, context-aware answers.
- **Modern UI**: Built with React, Vite, and FastAPI for a snappy, joyful experience.

---

## 🛠️ Setup (Local Dev)

1. **Clone the repo:**
   ```sh
   git clone https://github.com/thilakjo/jo-speaks.git
   cd jo-speaks
   ```
2. **Configure your environment:**
   - Copy `.env.example` to `.env` in both `backend/` and `frontend/` if needed.
   - Fill in your Supabase keys and Google API key (for Gemini).
3. **Install dependencies:**
   - Backend:
     ```sh
     cd backend
     pip install -r requirements.txt
     ```
   - Frontend:
     ```sh
     cd ../frontend
     npm install
     ```
4. **Run the servers:**
   - Backend:
     ```sh
     cd backend
     uvicorn api.index:app --reload --port 8000
     ```
   - Frontend:
     ```sh
     cd frontend
     npm run dev
     ```
5. **Open your browser:**
   - Go to [http://localhost:5173](http://localhost:5173)

---

## 💡 Usage

- **Upload a PDF:** Click "Upload New PDF" and select your file.
- **Ask a question:** Type your question in the chat and hit "Ask."
- **See history:** All your PDFs and chats are saved for easy reference.
- **Admin reset:** Use the `/api/admin/clear-all?secret=admin123` endpoint to wipe all data (for a fresh start).

---

## 🧩 Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** FastAPI, Supabase (DB + Storage), Gemini AI
- **Infra:** Supabase, Vercel (optional for deploy)

---

## 🐞 Troubleshooting

- **Uploads not working?**
  - Make sure your Supabase keys are correct and RLS policies allow inserts.
  - Check that the backend is running and reachable from the frontend.
- **CORS errors?**
  - The backend allows all local dev origins by default. If deploying, update `ALLOWED_ORIGINS` in `backend/config.py`.
- **Gemini not answering?**
  - Add your Google API key to `.env` as `GOOGLE_API_KEY`.
- **Admin clear-all not working?**
  - Make sure your Supabase service role key is set in `.env` as `SUPABASE_SERVICE_ROLE_KEY`.

---

## ❓ FAQ

**Q: Is my data safe?**  
A: All files and chats are stored in your own Supabase project. You control the keys and access.

**Q: Can I deploy this to Vercel or my own server?**  
A: Absolutely! Just set the right environment variables and you're good to go.

**Q: Can I use my own AI model?**  
A: The backend is modular – you can swap out Gemini for your favorite LLM.

**Q: How do I reset everything?**  
A: Call the `/api/admin/clear-all?secret=admin123` endpoint. (Don't use in production!)

---

## 🦜 About Jo Jo

Jo Jo is your PDF Q&A BFF – always ready to help, never grumpy, and loves a good question. Built with love by [@thilakjo](https://github.com/thilakjo) and friends.

---

Happy chatting! If you get stuck, open an issue or just say hi. 🦜
