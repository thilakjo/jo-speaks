import React from "react";
import { Button } from "../Button";

interface UploadErrorProps {
  error: string;
  onReset: () => void;
}

export const UploadError: React.FC<UploadErrorProps> = ({ error, onReset }) => {
  return (
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
        <svg
          className="h-6 w-6 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
      <h3 className="mt-2 text-lg font-medium text-gray-900">Upload Failed</h3>
      <p className="mt-1 text-sm text-gray-600">{error}</p>
      <div className="mt-4">
        <Button onClick={onReset} variant="outline">
          Try Again
        </Button>
      </div>
    </div>
  );
};
