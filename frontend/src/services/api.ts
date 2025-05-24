// Hi! This is Jo Jo's API helper – your friendly bridge to the backend. All fetches, all the time, with a smile. 🦜
import { API_URL } from "../config";

// These are the shapes of the things we send and receive. Think of them as our shared language!
interface UploadResult {
  document_id?: string;
  filename: string;
  text_path?: string;
  message?: string;
  error?: string;
}

interface AskResponse {
  answer: string;
  documentId: string;
  sessionId: string;
}

interface DocumentHistoryInfo {
  id: string;
  filename: string;
  uploadDate: string;
  filePath: string;
}

interface ChatSession {
  id: string;
  documentId: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }>;
}

// This is our friendly fetch wrapper. It logs everything and tries to be helpful if things go sideways.
async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const fullUrl = `${API_URL}${url}`;

  try {
    const response = await fetch(fullUrl, options);
    const contentType = response.headers.get("content-type");
    const responseText = await response.text();
    console.log(`[fetchApi] URL: ${fullUrl}`);
    console.log(`[fetchApi] Status: ${response.status}`);
    console.log(`[fetchApi] Content-Type: ${contentType}`);
    console.log(`[fetchApi] Response Body:`, responseText);

    if (!response.ok) {
      let errorMessage = responseText;
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.detail || responseText;
      } catch {
        // Not a JSON error response
      }
      throw new Error(
        `Oops! API Error: ${errorMessage} (Status: ${response.status})`
      );
    }

    try {
      return JSON.parse(responseText) as T;
    } catch (e) {
      console.warn(
        "[fetchApi] Hmmm, that wasn't JSON. Here's what we got:",
        responseText
      );
      throw new Error(
        "Sorry, I couldn't understand the server's response. Try again?"
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Network hiccup: ${String(error)}`);
  }
}

// Upload one or more PDF files. We'll keep you posted on progress!
export const uploadFiles = async (
  files: File[],
  onProgress?: (progress: number) => void
): Promise<UploadResult[]> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    });
    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(
            new Error("Hmm, the server sent something weird back. Try again?")
          );
        }
      } else {
        reject(new Error("Upload failed. Maybe try a different PDF?"));
      }
    });
    xhr.addEventListener("error", () => {
      reject(new Error("Network error. Are you online?"));
    });
    xhr.open("POST", `${API_URL}/upload`);
    xhr.send(formData);
  });
};

// Ask Jo Jo a question about a PDF. We'll do our best to answer!
export const askQuestion = async (
  documentId: string,
  question: string
): Promise<AskResponse> => {
  console.log("[API] POST", `${API_URL}/ask`);
  return fetchApi<AskResponse>("/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: documentId, question }),
  });
};

// Get the list of all PDFs we've seen so far.
export const getHistory = async (): Promise<DocumentHistoryInfo[]> => {
  console.log("[API] GET", `${API_URL}/history`);
  return fetchApi<DocumentHistoryInfo[]>("/history");
};

// Get all the chat sessions for a specific PDF.
export const getDocumentHistory = async (
  documentId: string
): Promise<ChatSession[]> => {
  console.log("[API] GET", `${API_URL}/history/${documentId}`);
  return fetchApi<ChatSession[]>(`/history/${documentId}`);
};
