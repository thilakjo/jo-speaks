import React from "react";

interface UploadErrorProps {
  errorMessage: string;
  onTryAgain: () => void;
}

const UploadError: React.FC<UploadErrorProps> = ({
  errorMessage,
  onTryAgain,
}) => {
  return (
    <div className="flex flex-col items-center space-y-2 w-full">
      <div className="p-2 rounded-full bg-red-100">
        <svg
          className="h-5 w-5 text-red-600"
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
      <p className="text-xs text-red-600">{errorMessage}</p>
      <button
        type="button"
        onClick={onTryAgain}
        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        Try Again
      </button>
    </div>
  );
};

export default UploadError;
