import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import axios from "axios";
import { API_BASE_URL } from "@/config";

interface PdfUploadProps {
  onUploadSuccess: (documentId: number) => void;
  onUploadError: (error: string) => void;
}

const PdfUpload: React.FC<PdfUploadProps> = ({
  onUploadSuccess,
  onUploadError,
}) => {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.type !== "application/pdf") {
        onUploadError("Only PDF files are allowed");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      setUploading(true);
      try {
        const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        onUploadSuccess(response.data.document_id);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          onUploadError(error.response?.data?.detail || "Error uploading file");
        } else {
          onUploadError("An unexpected error occurred");
        }
      } finally {
        setUploading(false);
      }
    },
    [onUploadSuccess, onUploadError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
  });

  return (
    <Card className="mb-6">
      <CardContent>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="flex justify-center">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive
                  ? "Drop your PDF here"
                  : "Drag & drop your PDF here"}
              </p>
              <p className="text-sm text-gray-500 mt-1">or click to browse</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              isLoading={uploading}
              className="mt-4"
            >
              Select PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PdfUpload;
