// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Supabase Configuration
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

console.log(`[Config] API_URL initialized to: ${API_URL}`);
console.log(`[Config] SUPABASE_URL initialized to: ${SUPABASE_URL}`);
console.log(
  `[Config] SUPABASE_KEY initialized: ${SUPABASE_KEY ? "Yes" : "No"}`
);

// Feature Flags
export const ENABLE_FILE_UPLOAD = true;
export const ENABLE_CHAT = true;
export const ENABLE_HISTORY = true;

// UI Configuration
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [".pdf"];
export const MAX_UPLOAD_RETRIES = 3;
export const UPLOAD_RETRY_DELAY = 1000; // 1 second

// Chat Configuration
export const MAX_MESSAGE_LENGTH = 500;
export const MAX_HISTORY_ITEMS = 50;
export const TYPING_INDICATOR_DELAY = 1000; // 1 second

// Error Messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: "File size exceeds 10MB limit",
  INVALID_FILE_TYPE: "Only PDF files are allowed",
  UPLOAD_FAILED: "Failed to upload file. Please try again",
  NETWORK_ERROR: "Network error. Please check your connection",
  SERVER_ERROR: "Server error. Please try again later",
  INVALID_QUESTION: "Please enter a valid question",
  QUESTION_TOO_LONG: "Question exceeds maximum length of 500 characters",
} as const;

// UI Configuration
export const TOAST_DURATION = 3000; // 3 seconds
export const UPLOAD_PROGRESS_INTERVAL = 100; // 100ms

// History Configuration
export const HISTORY_STORAGE_KEY = "pdf_qa_history";

// Debug Configuration
export const DEBUG = import.meta.env.DEV;

export const APP_NAME = "jo-speaks";
export const APP_TITLE = "jo-speaks | Ask Jo Jo Anything";
