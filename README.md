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
- **Modern UI**: Built with React, Vite, and FastAPI for a snappy, beautiful experience.

---

## 🛠️ Getting Started

### 1. Clone the repo

```sh
git clone https://github.com/yourusername/jo-speaks.git
cd jo-speaks
```

### 2. Set up your environment

- Copy `.env.example` to `.env` and fill in your Supabase and Google API keys.
- Make sure you have Python 3.11+ and Node.js 18+ installed.

### 3. Start the backend

```sh
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn api.index:app --reload --port 8000
```

### 4. Start the frontend

```sh
cd frontend
npm install
npm run dev
```

- Visit [http://localhost:5173](http://localhost:5173) and meet Jo Jo!

---

## 🤖 How It Works

- **Upload**: PDFs are sent straight to Supabase Storage and indexed in the database.
- **Ask**: Your questions are answered using Gemini AI (if configured) or a friendly fallback.
- **History**: All your uploads and chats are saved, so you can pick up where you left off.

---

## 📝 FAQ

**Q: Is my data safe?**

> Yep! Everything is stored in your own Supabase project. You control the keys.

**Q: Can I use my own AI model?**

> Absolutely! Just swap out the Gemini config in the backend.

**Q: Can I deploy this to Vercel/Netlify/wherever?**

> You bet. The app is serverless-friendly and easy to deploy anywhere.

**Q: Something broke! What do I do?**

> Check the logs, open an issue, or just ask Jo Jo (me) for help. I'm here for you!

---

## 🦜 About Jo Jo

Jo Jo is your PDF Q&A BFF – always ready to help, never judges your questions, and loves a good PDF. Built with love by [your name here].

---

## 💡 Contributing

Pull requests, issues, and stars are always welcome! If you have ideas, want to add features, or just want to say hi, open an issue or PR.

---

## 📜 License

MIT – use it, remix it, and make it your own!
