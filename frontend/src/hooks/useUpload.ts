import { useState, useCallback } from "react";
import { API_URL } from "../config";

export const useUpload = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<{ [filename: string]: number }>({});
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (selectedFiles.length > 0) {
        const nonPdf = selectedFiles.find((f) => f.type !== "application/pdf");
        if (nonPdf) {
          setError("Please upload only PDF files");
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

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;
    setProgress({});
    setResults([]);
    setError(null);
    try {
      // Use FormData for multi-file upload
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      const xhr = new XMLHttpRequest();
      return await new Promise<any[]>((resolve, reject) => {
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
            } catch (error) {
              setError("Invalid response format");
              reject(new Error("Invalid response format"));
            }
          } else {
            setError("Upload failed");
            reject(new Error("Upload failed"));
          }
        });
        xhr.addEventListener("error", () => {
          setError("Network error");
          reject(new Error("Network error"));
        });
        xhr.open("POST", `${API_URL}/upload`);
        xhr.send(formData);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setProgress({});
    }
  }, [files]);

  const resetUpload = useCallback(() => {
    setFiles([]);
    setProgress({});
    setResults([]);
    setError(null);
  }, []);

  return {
    files,
    progress,
    results,
    error,
    handleFileChange,
    handleUpload,
    resetUpload,
  };
};
