// This is Jo Jo's upload hook – your friendly helper for uploading PDFs. Handles errors, progress, and all the little details. 🦜
import { useState, useCallback } from "react";
import { API_URL } from "../config";

// Jo Jo's PDF upload helper – let's make file uploads a breeze!
export const useUpload = () => {
  // The files the user wants to upload
  const [files, setFiles] = useState<File[]>([]);
  // Upload progress for each file
  const [progress, setProgress] = useState<{ [filename: string]: number }>({});
  // Results from the server
  const [results, setResults] = useState<any[]>([]);
  // Any error messages
  const [error, setError] = useState<string | null>(null);

  // When the user picks files, check they're all PDFs and reset state
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (selectedFiles.length > 0) {
        const nonPdf = selectedFiles.find((f) => f.type !== "application/pdf");
        if (nonPdf) {
          setError("Oops! Please upload only PDF files.");
          return;
        }
        setFiles(selectedFiles);
        setError(null);
        setProgress({});
        setResults([]);
      }
    },
    []
  );

  // Upload the files to the backend
  const upload = useCallback(async () => {
    if (files.length === 0) {
      setError("No files to upload! Please pick a PDF.");
      return;
    }
    setError(null);
    setProgress({});
    setResults([]);
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return new Promise<any[]>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = (event.loaded / event.total) * 100;
          setProgress((prev) => ({ ...prev, total: percent }));
        }
      });
      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            setResults(response);
            resolve(response);
          } catch (err) {
            setError("Hmm, the server sent something weird back. Try again?");
            reject(err);
          }
        } else {
          setError("Upload failed. Maybe try a different PDF?");
          reject(new Error("Upload failed"));
        }
      });
      xhr.addEventListener("error", () => {
        setError("Network error. Are you online?");
        reject(new Error("Network error"));
      });
      xhr.open("POST", `${API_URL}/upload`);
      xhr.send(formData);
    });
  }, [files]);

  const resetUpload = useCallback(() => {
    setFiles([]);
    setProgress({});
    setResults([]);
    setError(null);
  }, []);

  return {
    files,
    setFiles,
    progress,
    results,
    error,
    handleFileChange,
    upload,
    resetUpload,
  };
};
