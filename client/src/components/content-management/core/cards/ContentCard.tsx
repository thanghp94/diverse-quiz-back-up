import React from 'react';
import { Content } from "@/hooks/useContent";
import { MobileContentLayout } from "../layouts/MobileLayout";
import { DesktopContentLayout } from "../layouts/DesktopLayout";

interface RegularContentCardProps {
  content: Content;
  subtopicContent: Content[];
  hasVideo1: boolean;
  hasVideo2: boolean;
  isGroupCard: boolean;
  onContentClick: (info: { content: Content; contextList: Content[] }) => void;
  onStartQuiz: (content: Content, contextList: Content[], level: 'Easy' | 'Hard') => void;
  onVideoClick: () => void;
  onNoteClick: () => void;
}

export const RegularContentCard: React.FC<RegularContentCardProps> = ({
  content,
  subtopicContent,
  hasVideo1,
  hasVideo2,
  isGroupCard,
  onContentClick,
  onStartQuiz,
  onVideoClick,
  onNoteClick
}) => {
  return (
    <div 
      className="w-full"
      onClick={() => onContentClick({
        content,
        contextList: subtopicContent
      })}
    >
      <MobileContentLayout
        content={content}
        subtopicContent={subtopicContent}
        hasVideo1={hasVideo1}
        hasVideo2={hasVideo2}
        isGroupCard={isGroupCard}
        onContentClick={onContentClick}
        onStartQuiz={onStartQuiz}
        onVideoClick={onVideoClick}
        onNoteClick={onNoteClick}
      />

      <DesktopContentLayout
        content={content}
        subtopicContent={subtopicContent}
        hasVideo1={hasVideo1}
        hasVideo2={hasVideo2}
        isGroupCard={isGroupCard}
        onContentClick={onContentClick}
        onStartQuiz={onStartQuiz}
        onVideoClick={onVideoClick}
        onNoteClick={onNoteClick}
      />
    </div>
  );
};
