// API Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

// File Upload Configuration
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = ["application/pdf"];

// UI Configuration
export const TOAST_DURATION = 5000; // 5 seconds
export const UPLOAD_PROGRESS_INTERVAL = 100; // 100ms

// History Configuration
export const MAX_HISTORY_ITEMS = 50;
export const HISTORY_STORAGE_KEY = "pdf_qa_history";

// Debug Configuration
export const DEBUG = import.meta.env.DEV || false;
