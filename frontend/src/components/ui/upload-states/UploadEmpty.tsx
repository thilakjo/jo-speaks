import React from "react";

interface UploadEmptyProps {
  onButtonClick: () => void;
}

const UploadEmpty: React.FC<UploadEmptyProps> = ({ onButtonClick }) => {
  return (
    <>
      <div className="p-2 rounded-full bg-blue-100">
        <svg
          className="w-6 h-6 text-blue-600"
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
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Drag and drop your file here, or click to browse
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Only PDF files are accepted
        </p>
      </div>
      <button
        type="button"
        onClick={onButtonClick}
        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Select File
      </button>
    </>
  );
};

export default UploadEmpty;
