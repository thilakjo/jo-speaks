import React, { useCallback, useEffect, useState } from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import { askQuestion, getDocumentHistory } from "../../services/api";
import { useError } from "./ErrorContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface ChatPanelProps {
  documentId: string;
}

export const ChatPanel = React.memo(({ documentId }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setError } = useError();

  // Load chat history when documentId changes
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setError(null);
        const sessions = await getDocumentHistory(documentId);
        // Flatten all messages from all sessions
        const allMessages: Message[] = [];
        sessions.forEach((session) => {
          session.messages.forEach((msg) => {
            allMessages.push({
              ...msg,
              created_at:
                (msg as any).created_at ||
                (msg as any).timestamp ||
                new Date().toISOString(),
            });
          });
        });
        setMessages(allMessages);
      } catch (err: any) {
        setError(err.message || "Failed to load chat history");
      }
    };
    loadHistory();
  }, [documentId, setError]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: input.trim(),
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        setError(null);
        const response = await askQuestion(documentId, userMessage.content);
        const assistantMessage: Message = {
          id: response.sessionId,
          role: "assistant",
          content: response.answer,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error: any) {
        setError(
          error.message || "Sorry, I encountered an error. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [documentId, input, isLoading, setError]
  );

  return (
    <Card className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, idx) => (
          <div
            key={message.id + idx}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 shadow-sm mb-2 transition-colors duration-200 ${
                message.role === "user"
                  ? "bg-blue-100 text-blue-900 border border-blue-200"
                  : "bg-white text-gray-900 border border-gray-200"
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {new Date(message.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the PDF..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? "Thinking..." : "Ask"}
          </Button>
        </div>
      </form>
    </Card>
  );
});

ChatPanel.displayName = "ChatPanel";
