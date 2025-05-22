import { useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

interface UseFileUploadOptions {
  onUploadSuccess?: (documentId: string, filename: string) => void;
  onError?: (error: string) => void;
}

interface UploadedFile {
  documentId: string;
  filename: string;
}

export function useFileUpload({
  onUploadSuccess,
  onError,
}: UseFileUploadOptions = {}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    if (file.type !== "application/pdf") {
      const errorMsg = "Invalid file type. Please upload a PDF document.";
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    }
    return true;
  };

  const handleUpload = useCallback(
    async (file: File) => {
      if (!validateFile(file)) return;

      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setUploadProgress(percentCompleted);
          },
        });

        const documentId = response.data.document_id;
        const uploadedFileData = { documentId, filename: file.name };
        setUploadedFile(uploadedFileData);

        // Call the success callback
        if (onUploadSuccess) {
          onUploadSuccess(documentId, file.name);
        }

        // Save to localStorage history
        const timestamp = new Date().toISOString();
        const historyItem = {
          documentId,
          filename: file.name,
          timestamp,
          questions: [],
        };

        // Get existing history or initialize empty array
        const existingHistory = JSON.parse(
          localStorage.getItem("pdfHistory") || "[]"
        );

        // Check if this document already exists in history
        const existingIndex = existingHistory.findIndex(
          (item: any) => item.documentId === documentId
        );

        if (existingIndex >= 0) {
          // Update the timestamp if it exists
          existingHistory[existingIndex].timestamp = timestamp;
        } else {
          // Add new item if it doesn't exist
          existingHistory.push(historyItem);
        }

        // Save updated history back to localStorage
        localStorage.setItem("pdfHistory", JSON.stringify(existingHistory));
      } catch (err) {
        console.error("Upload failed:", err);
        const errorMsg = "Upload failed. Please try again.";
        setError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setIsUploading(false);
        setIsDragging(false);
      }
    },
    [onUploadSuccess, onError]
  );

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) setIsDragging(true);
    },
    [isDragging]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  const resetUpload = useCallback(() => {
    setUploadedFile(null);
    setError(null);
    setUploadProgress(0);
  }, []);

  return {
    isDragging,
    isUploading,
    uploadProgress,
    uploadedFile,
    error,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleUpload,
    resetUpload,
  };
}
