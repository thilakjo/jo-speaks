import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { formatDate } from "../../lib/utils";
import axios from "axios";
import { API_BASE_URL } from "../../config";

interface Message {
  id: string;
  type: "question" | "answer";
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  documentId: string | null;
  onError: (error: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ documentId, onError }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load messages when document changes
  useEffect(() => {
    if (!documentId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/messages/${documentId}`
        );
        const loadedMessages = response.data.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(loadedMessages);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          onError(error.response?.data?.detail || "Error loading messages");
        } else {
          onError("An unexpected error occurred while loading messages");
        }
      }
    };

    loadMessages();
  }, [documentId, onError]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save messages after each update
  useEffect(() => {
    if (!documentId || messages.length === 0) return;

    const saveMessages = async () => {
      try {
        await axios.post(`${API_BASE_URL}/messages/${documentId}`, {
          messages: messages.map((msg) => ({
            ...msg,
            timestamp: msg.timestamp.toISOString(),
          })),
        });
      } catch (error) {
        console.error("Error saving messages:", error);
      }
    };

    saveMessages();
  }, [documentId, messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentId || !question.trim()) return;

    const newQuestion: Message = {
      id: Date.now().toString(),
      type: "question",
      content: question.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newQuestion]);
    setQuestion("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/ask`, {
        document_id: documentId,
        question: newQuestion.content,
      });

      const newAnswer: Message = {
        id: `${Date.now()}-answer`,
        type: "answer",
        content: response.data.answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newAnswer]);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        onError(error.response?.data?.detail || "Error getting answer");
      } else {
        onError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <Card
            key={message.id}
            className={`${
              message.type === "question"
                ? "bg-blue-50 ml-12"
                : "bg-gray-50 mr-12"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-sm text-gray-600">
                  {message.type === "question" ? "You" : "jo jo"}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(message.timestamp)}
                </span>
              </div>
              <p className="text-gray-800 whitespace-pre-wrap">
                {message.content}
              </p>
            </CardContent>
          </Card>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-4">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={
              documentId
                ? "Ask a question about the PDF..."
                : "Please upload a PDF first"
            }
            disabled={!documentId || loading}
            className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <Button
            type="submit"
            disabled={!documentId || loading || !question.trim()}
            isLoading={loading}
          >
            Ask
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
