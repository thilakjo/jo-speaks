import React, { useCallback } from "react";
import { useUpload } from "../../hooks/useUpload.ts";
import { Card } from "./Card";
import { Button } from "./Button";
import { UploadEmpty } from "./upload-states/UploadEmpty";
import { UploadProgress } from "./upload-states/UploadProgress";
import { UploadSuccess } from "./upload-states/UploadSuccess";
import { UploadError } from "./upload-states/UploadError";
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

    const onFileChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        handleFileChange(e);
      },
      [handleFileChange, setError]
    );

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
          <UploadEmpty multiple />
          {isDragActive && (
            <p className="text-blue-600 mt-2">Drop the files here ...</p>
          )}
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
          !error && <UploadProgress progress={progress.total} />}
        {results.length > 0 && !error && (
          <UploadSuccess onReset={onReset} results={results} />
        )}
        {error && <UploadError error={error} onReset={onReset} />}
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
