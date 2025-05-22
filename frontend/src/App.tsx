import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import UploadCard from "./components/ui/UploadCard";
const HistorySidebar = lazy(
  () => import("./components/features/HistorySidebar")
);
const ChatPanel = lazy(() => import("./components/features/ChatPanel"));
import { Card } from "./components/ui/Card";
import axios from "axios";
import { API_BASE_URL } from "./config";
import type { HistoryItem } from "./components/features/HistorySidebar";

const App: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/history`);
      const formattedHistory = response.data.map((item: any) => ({
        ...item,
        uploadDate: new Date(item.uploadDate).toISOString(),
      }));
      setHistory(formattedHistory);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.detail || "Error fetching history");
      } else {
        setError("An unexpected error occurred");
      }
    }
  }, []);

  const handleUploadSuccess = useCallback(
    async (documentId: string, filename: string) => {
      await fetchHistory();
      setActiveDocumentId(documentId);
      setError(null);
      setIsMobileMenuOpen(false);
    },
    [fetchHistory]
  );

  const handleUploadError = useCallback((error: string) => {
    setError(error);
  }, []);

  const handleSelectDocument = useCallback((documentId: string) => {
    setActiveDocumentId(documentId);
    setError(null);
    setIsMobileMenuOpen(false);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            jo-speaks: Meet Jo Jo, your PDF Q&A BFF! 🦜
          </h1>
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={toggleMobileMenu}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </header>

        {error && (
          <div className="mb-8 p-4 bg-red-100 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Panel - History & Upload */}
          <div
            className={`md:col-span-4 ${
              isMobileMenuOpen ? "block" : "hidden md:block"
            }`}
          >
            <Card className="h-[calc(100vh-12rem)]">
              <div className="h-full flex flex-col">
                <div className="p-4">
                  <UploadCard
                    onUploadSuccess={handleUploadSuccess}
                    onUploadError={handleUploadError}
                  />
                </div>
                <div className="flex-1 overflow-hidden">
                  <Suspense
                    fallback={
                      <div className="p-4 text-blue-600">
                        Jo Jo is fetching your PDF history... 🦜
                      </div>
                    }
                  >
                    <HistorySidebar
                      history={history}
                      activeDocumentId={activeDocumentId}
                      onSelectDocument={handleSelectDocument}
                    />
                  </Suspense>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Panel - Chat */}
          <div
            className={`md:col-span-8 ${
              !isMobileMenuOpen ? "block" : "hidden md:block"
            }`}
          >
            <Card className="h-[calc(100vh-12rem)]">
              <Suspense
                fallback={
                  <div className="p-4 text-blue-600">
                    Jo Jo is warming up the chat... Hold tight! 🦜
                  </div>
                }
              >
                <ChatPanel
                  documentId={activeDocumentId}
                  onError={handleUploadError}
                />
              </Suspense>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
