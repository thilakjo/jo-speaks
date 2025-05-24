import { useState, useCallback } from "react";
import { API_URL } from "../config";

// Jo Jo's PDF upload helper – let's make file uploads a breeze!
export const useUpload = () => {
  // PDFs the user picked out
  const [selectedPdfs, setSelectedPdfs] = useState<File[]>([]);
  // Track upload progress for each file
  const [uploadProgress, setUploadProgress] = useState<{
    [filename: string]: number;
  }>({});
  // Store results from the backend after upload
  const [uploadResults, setUploadResults] = useState<any[]>([]);
  // If anything goes wrong, I'll let you know here
  const [uploadError, setUploadError] = useState<string | null>(null);

  // When the user picks files, let's check they're all PDFs and reset state
  const onPdfFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const pickedFiles = Array.from(e.target.files || []);
      if (pickedFiles.length > 0) {
        const notPdf = pickedFiles.find((f) => f.type !== "application/pdf");
        if (notPdf) {
          setUploadError("Oops! Please upload only PDF files.");
          return;
        }
        setSelectedPdfs(pickedFiles);
        setUploadError(null);
        setUploadProgress({});
        setUploadResults([]);
      }
    },
    []
  );

  // Time to send those PDFs to the backend!
  const onPdfUpload = useCallback(async () => {
    if (selectedPdfs.length === 0) return;
    setUploadProgress({});
    setUploadResults([]);
    setUploadError(null);
    try {
      // Bundle up our PDFs for the trip
      const uploadForm = new FormData();
      selectedPdfs.forEach((pdf) => uploadForm.append("files", pdf));
      const uploadRequest = new XMLHttpRequest();
      console.log(
        "[JoJo] Sending your PDFs to the backend at",
        `${API_URL}/upload`
      );
      return await new Promise<any[]>((resolve, reject) => {
        uploadRequest.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percent = (event.loaded / event.total) * 100;
            setUploadProgress((prev) => ({ ...prev, total: percent }));
          }
        });
        uploadRequest.addEventListener("load", () => {
          if (uploadRequest.status === 200) {
            try {
              const response = JSON.parse(uploadRequest.responseText);
              setUploadResults(response);
              resolve(response);
            } catch (error) {
              setUploadError("Hmm, the server sent back something weird.");
              reject(new Error("Invalid response format"));
            }
          } else {
            setUploadError("Upload didn't work. Try again?");
            reject(new Error("Upload failed"));
          }
        });
        uploadRequest.addEventListener("error", () => {
          setUploadError("Network hiccup! Please check your connection.");
          reject(new Error("Network error"));
        });
        uploadRequest.open("POST", `${API_URL}/upload`);
        uploadRequest.send(uploadForm);
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setUploadProgress({});
    }
  }, [selectedPdfs]);

  // Reset everything so the user can start fresh
  const resetUpload = useCallback(() => {
    setSelectedPdfs([]);
    setUploadProgress({});
    setUploadResults([]);
    setUploadError(null);
  }, []);

  return {
    selectedPdfs,
    uploadProgress,
    uploadResults,
    uploadError,
    onPdfFileChange,
    onPdfUpload,
    resetUpload,
  };
};
