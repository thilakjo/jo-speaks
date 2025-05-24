// This is Jo Jo's history sidebar – your friendly list of all the PDFs you've chatted with. 🦜
import React, { useCallback, useEffect, useState } from "react";
import { Card } from "./Card";
import { getHistory, getDocumentHistory } from "../../services/api";

interface Document {
  id: string;
  filename: string;
  uploadDate: string;
  filePath: string;
}

interface HistorySidebarProps {
  onSelectDocument: (document: Document) => void;
  selectedDocumentId?: string;
}

export const HistorySidebar = React.memo(
  ({ onSelectDocument, selectedDocumentId }: HistorySidebarProps) => {
    // All the PDFs we've seen so far
    const [documents, setDocuments] = useState<Document[]>([]);
    // How many questions have been asked about each PDF?
    const [questionCounts, setQuestionCounts] = useState<
      Record<string, number>
    >({});
    // Are we loading?
    const [isLoading, setIsLoading] = useState(true);
    // Any errors?
    const [error, setError] = useState<string | null>(null);

    // Load the history and question counts
    const loadHistory = useCallback(async () => {
      try {
        setIsLoading(true);
        setError(null);
        const history = await getHistory();
        setDocuments(history);
        // Fetch question counts for each document
        const counts: Record<string, number> = {};
        await Promise.all(
          history.map(async (doc) => {
            try {
              const sessions = await getDocumentHistory(doc.id);
              // Count user messages
              let count = 0;
              sessions.forEach((session) => {
                count += session.messages.filter(
                  (msg) => msg.role === "user"
                ).length;
              });
              counts[doc.id] = count;
            } catch {
              counts[doc.id] = 0;
            }
          })
        );
        setQuestionCounts(counts);
      } catch (err) {
        setError("Oops! Couldn't load your PDF history. Try again?");
        console.error("Error loading history:", err);
      } finally {
        setIsLoading(false);
      }
    }, []);

    useEffect(() => {
      loadHistory();
    }, [loadHistory]);

    // When you click a document, let the parent know
    const handleDocumentClick = useCallback(
      (document: Document) => {
        onSelectDocument(document);
      },
      [onSelectDocument]
    );

    if (isLoading) {
      return (
        <Card className="p-4">
          <p className="text-sm text-gray-500">
            Jo Jo is fetching your history...
          </p>
        </Card>
      );
    }

    if (error) {
      return (
        <Card className="p-4">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={loadHistory}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Try Again
          </button>
        </Card>
      );
    }

    if (documents.length === 0) {
      return (
        <Card className="p-4">
          <p className="text-sm text-gray-500">
            No PDFs here yet! Upload one to get started.
          </p>
        </Card>
      );
    }

    return (
      <Card className="overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Your PDF History
          </h2>
        </div>
        <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => handleDocumentClick(doc)}
              className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                doc.id === selectedDocumentId ? "bg-blue-50" : ""
              }`}
            >
              <p className="font-medium text-gray-900 truncate">
                {doc.filename}
              </p>
              <p className="text-sm text-gray-500">
                Uploaded {new Date(doc.uploadDate).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {questionCounts[doc.id] || 0} questions asked
              </p>
            </button>
          ))}
        </div>
      </Card>
    );
  }
);

HistorySidebar.displayName = "HistorySidebar";
