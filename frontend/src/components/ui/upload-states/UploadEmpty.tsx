import React from "react";
import { Button } from "../Button";

interface UploadEmptyProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  multiple?: boolean;
}

export const UploadEmpty: React.FC<UploadEmptyProps> = ({
  onFileChange,
  multiple,
}) => {
  return (
    <div className="text-center">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload PDF</h2>
      <p className="text-sm text-gray-600 mb-4">
        Upload a PDF file to start asking questions. Jo Jo will analyze it and
        help you understand its contents.
      </p>
      <div className="mt-4">
        <input
          type="file"
          accept=".pdf"
          onChange={onFileChange}
          className="hidden"
          id="file-upload"
          {...(multiple ? { multiple: true } : {})}
        />
        <label htmlFor="file-upload">
          <Button as="span" className="cursor-pointer">
            {multiple ? "Choose PDF(s)" : "Choose PDF"}
          </Button>
        </label>
      </div>
    </div>
  );
};
