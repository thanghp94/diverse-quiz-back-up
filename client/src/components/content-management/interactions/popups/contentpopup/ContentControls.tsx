import { ContentRatingButtons } from "../../../core/buttons/ContentRatingButtons";

interface ContentControlsProps {
  currentIndex: number;
  contentList: any[];
  onContentChange: (content: any) => void;
  startQuiz: (level: 'easy' | 'hard') => void;
  contentId: string;
}

export const ContentControls = ({
  currentIndex,
  contentList,
  onContentChange,
  startQuiz,
  contentId
}: ContentControlsProps) => {
  const handlePrevious = () => {
    if (currentIndex > 0) {
      onContentChange(contentList[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < contentList.length - 1) {
      onContentChange(contentList[currentIndex + 1]);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      {/* Left side: Navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={handlePrevious}
          disabled={currentIndex <= 0}
          className="px-2 py-1 text-xs border rounded disabled:opacity-50"
        >
          ← Prev
        </button>
        <span className="text-xs text-gray-600 px-1">
          {currentIndex + 1}/{contentList.length}
        </span>
        <button
          onClick={handleNext}
          disabled={currentIndex >= contentList.length - 1}
          className="px-2 py-1 text-xs border rounded disabled:opacity-50"
        >
          Next →
        </button>
      </div>

      {/* Right side: Quiz and Rating */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => startQuiz('easy')}
          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Easy Quiz
        </button>
        <button
          onClick={() => startQuiz('hard')}
          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Hard Quiz
        </button>
        <ContentRatingButtons contentId={contentId} />
      </div>
    </div>
  );
};
