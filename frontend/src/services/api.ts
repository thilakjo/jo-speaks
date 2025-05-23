import { API_URL } from "../config";

// Define expected response structures for clarity
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

// Helper function for fetch requests
async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const fullUrl = `${API_URL}${url}`;

  try {
    const response = await fetch(fullUrl, options);
    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = responseText;
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.detail || responseText;
      } catch {
        // Not a JSON error response
      }
      throw new Error(
        `API Error: ${errorMessage} (Status: ${response.status})`
      );
    }

    try {
      return JSON.parse(responseText) as T;
    } catch (e) {
      throw new Error("Invalid JSON response from server");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Network error: ${String(error)}`);
  }
}

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
          reject(new Error("Invalid response format"));
        }
      } else {
        reject(new Error("Upload failed"));
      }
    });
    xhr.addEventListener("error", () => {
      reject(new Error("Network error"));
    });
    xhr.open("POST", `${API_URL}/upload`);
    xhr.send(formData);
  });
};

// DEPRECATED: Use uploadFiles for multi-file support
export const uploadFile = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult[]> => {
  return uploadFiles([file], onProgress);
};

export const askQuestion = async (
  documentId: string,
  question: string
): Promise<AskResponse> => {
  return fetchApi<AskResponse>("/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: documentId, question }),
  });
};

export const getHistory = async (): Promise<DocumentHistoryInfo[]> => {
  return fetchApi<DocumentHistoryInfo[]>("/history");
};

export const getDocumentHistory = async (
  documentId: string
): Promise<ChatSession[]> => {
  return fetchApi<ChatSession[]>(`/history/${documentId}`);
};
