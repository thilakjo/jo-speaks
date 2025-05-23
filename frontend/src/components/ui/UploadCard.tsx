import React, { useCallback } from "react";
import { useUpload } from "../../hooks/useUpload.ts";
import { Card } from "./Card";
import { Button } from "./Button";
import { useError } from "./ErrorContext";
import { useDropzone } from "react-dropzone";

export const UploadCard = React.memo(
  ({ onUploadSuccess }: { onUploadSuccess?: () => void }) => {
    const {
      files,
      progress,
      results,
      error,
      handleFileChange,
      handleUpload,
      resetUpload,
    } = useUpload();
    const { setError } = useError();

    const onUpload = useCallback(async () => {
      setError(null);
      try {
        await handleUpload();
        if (onUploadSuccess) onUploadSuccess();
      } catch (err: any) {
        setError(err.message || "Upload failed");
      }
    }, [handleUpload, onUploadSuccess, setError]);

    const onReset = useCallback(() => {
      setError(null);
      resetUpload();
    }, [resetUpload, setError]);

    const onDrop = useCallback(
      (acceptedFiles: File[]) => {
        const event = {
          target: { files: acceptedFiles } as any,
        } as React.ChangeEvent<HTMLInputElement>;
        handleFileChange(event);
      },
      [handleFileChange]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: { "application/pdf": [".pdf"] },
      multiple: true,
    });

    return (
      <Card className="w-full max-w-2xl mx-auto p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 mb-4 cursor-pointer ${
            isDragActive ? "bg-blue-100" : "bg-gray-50"
          }`}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            <p className="text-gray-600">
              {isDragActive
                ? "Drop the files here..."
                : "Drag & drop PDF files here, or click to select"}
            </p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Selected Files:</h4>
            <ul className="list-disc pl-5">
              {files.map((file) => (
                <li key={file.name} className="text-sm text-gray-800">
                  {file.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {typeof progress.total === "number" &&
          progress.total < 100 &&
          !error && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${progress.total}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Uploading... {Math.round(progress.total)}%
              </p>
            </div>
          )}

        {results.length > 0 && !error && (
          <div className="mb-4 p-4 bg-green-50 rounded-lg">
            <p className="text-green-700 font-medium">Upload complete!</p>
            <Button onClick={onReset} className="mt-2" variant="outline">
              Upload Another File
            </Button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-lg">
            <p className="text-red-700">{error}</p>
            <Button onClick={onReset} className="mt-2" variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {files.length > 0 &&
          (!progress.total || progress.total < 100) &&
          !error && (
            <Button onClick={onUpload} className="mt-4">
              Upload {files.length > 1 ? "All" : "File"}
            </Button>
          )}
      </Card>
    );
  }
);

UploadCard.displayName = "UploadCard";
