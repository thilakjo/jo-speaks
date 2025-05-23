import React from "react";
import { Button } from "../Button";

interface UploadSuccessProps {
  onReset: () => void;
  results?: any[];
}

export const UploadSuccess: React.FC<UploadSuccessProps> = ({
  onReset,
  results,
}) => {
  return (
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
        <svg
          className="h-6 w-6 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h3 className="mt-2 text-lg font-medium text-gray-900">
        Upload Complete!
      </h3>
      {results && results.length > 0 ? (
        <div className="mt-2 text-left">
          <ul className="list-disc pl-5">
            {results.map((res, idx) => (
              <li
                key={idx}
                className={res.error ? "text-red-600" : "text-green-700"}
              >
                {res.filename}: {res.error ? res.error : "Success"}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-1 text-sm text-gray-600">
          Your PDF has been successfully uploaded. You can now start asking
          questions.
        </p>
      )}
      <div className="mt-4">
        <Button onClick={onReset} variant="outline">
          Upload Another
        </Button>
      </div>
    </div>
  );
};
