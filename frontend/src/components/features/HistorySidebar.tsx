import React, { memo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/Card";
import { formatDate, truncateText } from "../../lib/utils";

export interface HistoryItem {
  id: string;
  filename: string;
  uploadDate: string | Date;
  questionCount: number;
}

interface HistoryItemProps {
  item: HistoryItem;
  isActive: boolean;
  onSelect: (id: string) => void;
}

const HistoryItemCard = memo(
  ({ item, isActive, onSelect }: HistoryItemProps) => (
    <Card
      key={item.id}
      variant="hover"
      className={`cursor-pointer ${isActive ? "ring-2 ring-blue-500" : ""}`}
      onClick={() => onSelect(item.id)}
    >
      <CardHeader>
        <CardTitle>{truncateText(item.filename, 30)}</CardTitle>
        <CardDescription>
          Uploaded {formatDate(new Date(item.uploadDate))}
          <br />
          {item.questionCount} questions asked
        </CardDescription>
      </CardHeader>
    </Card>
  )
);

HistoryItemCard.displayName = "HistoryItemCard";

interface HistorySidebarProps {
  history: HistoryItem[];
  activeDocumentId: string | null;
  onSelectDocument: (documentId: string) => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  history,
  activeDocumentId,
  onSelectDocument,
}) => {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">History</h2>
      {history.length === 0 ? (
        <p className="text-gray-500 text-sm">No documents uploaded yet</p>
      ) : (
        history.map((item) => (
          <HistoryItemCard
            key={item.id}
            item={item}
            isActive={activeDocumentId === item.id}
            onSelect={onSelectDocument}
          />
        ))
      )}
    </div>
  );
};

export default memo(HistorySidebar);
