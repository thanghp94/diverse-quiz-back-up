import { useState } from "react";
import { ContentEditor } from "../../core/editors/ContentEditor";
import type { Content } from "@shared/schema";

interface ContentEditorSectionProps {
  content: Content;
  onContentChange: (content: Content) => void;
  user: any;
}

export const ContentEditorSection = ({
  content,
  onContentChange,
  user,
}: ContentEditorSectionProps) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Check if user is authorized (admin)
  const isAuthorized =
    user &&
    typeof user === "object" &&
    user !== null &&
    "id" in user &&
    (user as any).id === "GV0002";

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="mt-6 pt-4 border-t">
      <button
        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg border border-blue-200 bg-blue-50/30"
        onClick={() => setIsEditorOpen(!isEditorOpen)}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <span className="font-medium text-blue-700">Content Editor (Admin)</span>
        </div>
        <svg
          className={`w-5 h-5 text-blue-600 transition-transform duration-200 ${
            isEditorOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isEditorOpen && (
        <div className="mt-3">
          <ContentEditor content={content} onContentUpdate={onContentChange} />
        </div>
      )}
    </div>
  );
};
