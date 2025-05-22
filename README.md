# PDF Q&A Assistant

A full-stack application that allows users to upload PDFs and ask questions about their content using Google's Gemini AI model. The application features a modern, responsive UI with a persistent history of uploaded documents and Q&A sessions.

## Features

- 📄 PDF upload with drag-and-drop support
- 💬 Interactive Q&A with uploaded documents
- 📚 Persistent history of documents and questions
- 🎨 Modern, responsive UI with a split-panel layout
- 🔍 Semantic search using Google's Gemini AI
- 📝 Real-time question history with timestamps

## Tech Stack

### Backend

- FastAPI
- SQLAlchemy
- LangChain
- Google Gemini AI
- PyPDF2
- SQLite

### Frontend

- React
- TypeScript
- Tailwind CSS
- Axios
- React-Dropzone

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- Google API Key (for Gemini AI)

### Backend Setup

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

4. Set up environment variables:

   ```bash
   export GOOGLE_API_KEY="your_api_key_here"
   ```

5. Start the backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a .env file:

   ```
   VITE_API_URL=http://localhost:8000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at http://localhost:5174

## API Documentation

### Endpoints

#### `POST /upload`

Upload a PDF file.

Request:

- Content-Type: multipart/form-data
- Body: file (PDF)

Response:

```json
{
  "document_id": 1,
  "message": "File uploaded and processed successfully"
}
```

#### `POST /ask`

Ask a question about a document.

Request:

```json
{
  "document_id": 1,
  "question": "What is this document about?"
}
```

Response:

```json
{
  "answer": "This document is about..."
}
```

#### `GET /history`

Get list of uploaded documents.

Response:

```json
[
  {
    "id": 1,
    "filename": "example.pdf",
    "uploadDate": "2024-03-15T10:30:00",
    "questionCount": 5
  }
]
```

#### `GET /history/{document_id}`

Get Q&A history for a specific document.

Response:

```json
{
  "document": {
    "id": 1,
    "filename": "example.pdf",
    "uploadDate": "2024-03-15T10:30:00",
    "questionCount": 5
  },
  "questions": [
    {
      "id": 1,
      "question": "What is this about?",
      "answer": "This document discusses...",
      "timestamp": "2024-03-15T10:35:00"
    }
  ]
}
```

## Project Structure

```
.
├── backend/
│   ├── main.py           # FastAPI application
│   ├── config.py         # Configuration settings
│   ├── requirements.txt  # Python dependencies
│   └── uploads/          # PDF storage
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── lib/         # Utilities and helpers
│   │   └── config.ts    # Frontend configuration
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Development

### Adding New Features

1. Backend:

   - Add new models to `main.py`
   - Create new endpoints in `main.py`
   - Update database schema if needed

2. Frontend:
   - Add new components in `src/components/`
   - Update API calls in `src/services/`
   - Add new types in `src/types/`

### Code Style

- Backend: Follow PEP 8 guidelines
- Frontend: Use ESLint and Prettier defaults
- Use TypeScript for type safety
- Follow component-based architecture

## Deployment

1. Backend:

   - Set up a production server (e.g., Ubuntu)
   - Install Python dependencies
   - Use Gunicorn with Uvicorn workers
   - Set up environment variables

2. Frontend:
   - Build the production bundle: `npm run build`
   - Serve using a static file server
   - Configure environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - feel free to use this project for your own purposes.

## Acknowledgments

- Google Gemini AI for the language model
- LangChain for the document processing pipeline
- FastAPI for the efficient backend framework
- React and Tailwind CSS for the frontend UI

## v2 Frontend Refactor Changelog

### Files Removed

- `src/assets/pdfupload.tsx`
- `src/components/PdfUpload.jsx`
- Old UI components and styles

### New Component Structure

- `src/components/features/`
  - `UploadCard.tsx` - New drag-and-drop PDF upload component
  - `HistorySidebar.tsx` - Left panel showing uploaded PDFs history
  - `ChatPanel.tsx` - Right panel for Q&A interaction
- `src/components/ui/`
  - `Card.tsx` - Reusable card component
  - `Button.tsx` - Reusable button component
  - `upload-states/` - Upload state components (Empty, Progress, Success, Error)

### API Integration

- `GET /history` - Fetch list of uploaded PDFs
- `GET /history/{id}` - Fetch specific PDF session details
- `POST /upload` - Upload new PDF file
- `POST /ask` - Send questions to the AI about a specific PDF

### Responsive Layout

- Desktop: 30/70 split using Tailwind's grid system
  - Left panel (col-span-4): History & Upload
  - Right panel (col-span-8): Chat Interface
- Mobile: Stacks vertically for smaller screens

### History Persistence

- Server-side: All uploads and Q&A sessions stored in backend
- Client-side: Document IDs and basic info cached in localStorage
- Auto-refresh on new uploads
- Click-to-load previous sessions

### Performance Optimizations

- React.memo on list items in HistorySidebar
- useCallback for event handlers
- Efficient state management with useState and useEffect
- Optimized re-renders in chat interface
