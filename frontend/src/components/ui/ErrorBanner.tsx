import React from "react";
import { useError } from "./ErrorContext";

export const ErrorBanner: React.FC = () => {
  const { error, setError } = useError();
  if (!error) return null;
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-4 max-w-3xl mx-auto flex items-center justify-between">
      <span>{error}</span>
      <button
        className="ml-4 text-red-700 font-bold text-lg focus:outline-none"
        onClick={() => setError(null)}
        aria-label="Dismiss error"
      >
        ×
      </button>
    </div>
  );
};
