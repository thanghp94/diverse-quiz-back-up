import React from 'react';
import { Content } from "@/hooks/useContent";
import { ContentThumbnailGallery } from "@/components/content";
import { ContentActionButtons } from "@/components/topics/ContentActionButtons";
import { isValidTranslationDictionary } from "@/components/topics/TopicUtils";
import { MarkdownRenderer } from "@/components/shared";

interface GroupCardContentProps {
  content: Content;
  subtopicContent: Content[];
  groupedContent: Content[];
  isGroupExpanded: boolean;
  onToggleGroupCard: (groupCardId: string) => void;
  onContentClick: (info: { content: Content; contextList: Content[] }) => void;
  onStartQuiz: (content: Content, contextList: Content[], level: 'Easy' | 'Hard') => void;
  onStartGroupMatching: (matchingId: string, matchingTitle: string) => void;
  onVideoClick: () => void;
  onNoteClick: () => void;
  studentId: string;
}

export const GroupCardContent: React.FC<GroupCardContentProps> = ({
  content,
  subtopicContent,
  groupedContent,
  isGroupExpanded,
  onToggleGroupCard,
  onContentClick,
  onStartQuiz,
  onStartGroupMatching,
  onVideoClick,
  onNoteClick,
  studentId
}) => {
  return (
    <div 
      className="w-full"
      onClick={() => onToggleGroupCard(content.id)}
    >
      {/* Title with action buttons for group cards */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {/* Buttons on far left */}
        <ContentActionButtons
          content={content}
          subtopicContent={subtopicContent}
          compact={true}
          showVideo={false}
          showRating={false}
          showNote={false}
          showMatching={true}
          showQuiz={true}
          onStartQuiz={onStartQuiz}
          onStartGroupMatching={onStartGroupMatching}
          studentId={studentId}
          className="text-yellow-200"
        />

        {/* Centered title */}
        <div className="flex-1 text-center">
          <h4 className="text-base font-medium leading-tight" style={{ color: '#ffff78e6' }}>
            {content.title}
          </h4>
        </div>

        {/* Empty div for balance */}
        <div className="w-[42px]"></div>
      </div>

      {/* Thumbnail Gallery for Group Cards - hidden when expanded */}
      {!isGroupExpanded && (
        <ContentThumbnailGallery 
          groupedContent={groupedContent}
          onContentClick={onContentClick}
        />
      )}

      {/* Description at bottom for group cards - hidden when expanded */}
      {!isGroupExpanded && content.short_description && (
        <div className="text-white text-sm leading-relaxed mt-1 text-center font-medium">
          <MarkdownRenderer
            className="text-sm leading-relaxed"
            translationDictionary={isValidTranslationDictionary(content.translation_dictionary) ? content.translation_dictionary : null}
            textColor="text-white"
            tooltipStyle="dark"
          >
            {content.short_description}
          </MarkdownRenderer>
        </div>
      )}
    </div>
  );
};
