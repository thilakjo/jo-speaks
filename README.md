# PDF Q&A

A web application that allows users to upload PDF documents and ask questions about their content. The application uses Google's Gemini model for natural language processing and Supabase for data storage.

## Project Structure

```
.
├── backend/           # FastAPI backend
│   ├── main.py       # Main application file
│   ├── config.py     # Configuration settings
│   └── requirements.txt
├── frontend/         # React frontend
│   ├── src/         # Source code
│   ├── public/      # Static files
│   └── package.json
└── README.md
```

## Prerequisites

- Python 3.8 or higher
- Node.js (v14 or higher)
- npm (v6 or higher)
- Supabase account
- Google API key for Gemini

## Setup

### Backend

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file:

   ```bash
   cp .env.example .env
   ```

5. Update the `.env` file with your configuration.

### Frontend

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file:

   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration.

## Running the Application

### Backend

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Activate the virtual environment (if not already activated):

   ```bash
   # On macOS/Linux
   source .venv/bin/activate
   # On Windows
   # .venv\Scripts\activate
   ```

3. Start the development server:
   ```bash
   uvicorn main:app --reload --port 8000 --host 0.0.0.0
   ```
   The API will be available at `http://localhost:8000` (or your local network IP on port 8000).
   You can test the health endpoint at `http://localhost:8000/health` in your browser or with `curl`.

### Frontend

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

   The application will typically be available at `http://localhost:5173` (Vite will indicate the exact port if 5173 is busy).

3. Ensure Environment Variable is Set:
   Make sure your `frontend/.env` file has the following line, pointing to your backend server:
   ```
   VITE_API_URL=http://localhost:8000
   ```

## Comprehensive Local Testing

To run a full suite of backend and frontend tests, including API endpoint checks and a frontend build, execute the following script from the project root:

```bash
./run_full_test.sh
```

This script will:

1. Start the backend server.
2. Run backend `pytest` tests (verifying API endpoints and Supabase interactions).
3. Stop the backend server.
4. Install frontend `npm` dependencies.
5. Run frontend tests using Jest (currently basic render tests, to be expanded with `msw` for API mocking and interaction tests).
6. Build the frontend application.

**Important:** Ensure your environment variables are correctly configured before running the script:

- **Backend (`backend/.env` or project root `.env`):** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GOOGLE_API_KEY`.
- **Frontend (`frontend/.env`):** `VITE_API_URL` (should point to `http://localhost:8000` or `http://127.0.0.1:8000` for the tests).

The script will attempt to load variables from a `.env` file in the project root first, then from `backend/.env` for the backend portion.

## Features

- PDF file upload with drag-and-drop support
- Text extraction from PDFs
- Interactive Q&A interface
- Document history
- Real-time chat-like experience
- Responsive design

## Technologies Used

### Backend

- FastAPI
- Uvicorn
- PyPDF2
- Google Generative AI
- Supabase
- Python-dotenv

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- React Hot Toast

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
