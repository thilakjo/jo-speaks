import React from "react";

interface UploadSuccessProps {
  filename: string;
  onUploadAnother: () => void;
}

const UploadSuccess: React.FC<UploadSuccessProps> = ({
  filename,
  onUploadAnother,
}) => {
  return (
    <div className="flex flex-col items-center space-y-2 w-full">
      <div className="flex items-center bg-green-50 p-2 rounded-lg w-full">
        <svg
          className="h-5 w-5 text-green-600 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <div className="flex-1 truncate">
          <p className="font-medium text-xs">{filename}</p>
        </div>
        <button
          type="button"
          onClick={onUploadAnother}
          className="text-xs text-blue-600 hover:text-blue-800 ml-2"
        >
          Upload Another
        </button>
      </div>
    </div>
  );
};

export default UploadSuccess;
