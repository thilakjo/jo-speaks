import React, { useRef } from "react";
import { cn } from "../../lib/utils";
import { useFileUpload } from "../../hooks/use-file-upload";
import UploadEmpty from "./upload-states/UploadEmpty";
import UploadProgress from "./upload-states/UploadProgress";
import UploadSuccess from "./upload-states/UploadSuccess";
import UploadError from "./upload-states/UploadError";

interface UploadCardProps {
  onUploadSuccess?: (documentId: string, filename: string) => void;
  onUploadError?: (error: string) => void;
}

const UploadCard: React.FC<UploadCardProps> = ({
  onUploadSuccess,
  onUploadError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
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
  } = useFileUpload({
    onUploadSuccess,
    onError: onUploadError,
  });

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-md p-4 border border-gray-200">
      <h2 className="text-lg font-semibold mb-3">Upload PDF</h2>
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-4 transition-all duration-300 ease-in-out",
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300",
          isUploading ? "opacity-75" : "",
          uploadedFile ? "border-green-500 bg-green-50" : "",
          error ? "border-red-500 bg-red-50" : ""
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-3 py-2">
          {!uploadedFile && !isUploading && !error && (
            <UploadEmpty onButtonClick={handleButtonClick} />
          )}

          {isUploading && <UploadProgress progress={uploadProgress} />}

          {uploadedFile && (
            <UploadSuccess
              filename={uploadedFile.filename}
              onUploadAnother={resetUpload}
            />
          )}

          {error && (
            <UploadError errorMessage={error} onTryAgain={resetUpload} />
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};

export default UploadCard;
