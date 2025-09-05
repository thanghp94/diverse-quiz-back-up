import React from 'react';
import { Content } from "@/hooks/useContent";
import { ContentDifficultyIndicator } from "@/components/content-management/core/indicators/ContentDifficultyIndicator";
import { LocalContentThumbnail, isValidTranslationDictionary } from "@/components/topics/TopicUtils";
import { ResponsiveActionButtons } from "../../interactions/actions/ResponsiveActionButtons";
import { MarkdownRenderer } from "@/components/shared";
import { getCurrentStudentId } from "../../utils/contentCardUtils";

interface DesktopContentLayoutProps {
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

export const DesktopContentLayout: React.FC<DesktopContentLayoutProps> = ({
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
    <div className="hidden md:block">
      <div className="flex items-start gap-3">
        <LocalContentThumbnail 
          content={content} 
          isGroupCard={isGroupCard}
          onClick={() => onContentClick({
            content,
            contextList: subtopicContent
          })}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0">
            <div className="flex-1 min-w-0 lg:max-w-[75%]">
              <h4 className="text-base font-medium leading-tight text-left truncate" style={{ color: '#ffff78e6' }}>{content.title}</h4>
            </div>
            <div className="flex-shrink-0 lg:max-w-[25%] overflow-hidden">
              <ResponsiveActionButtons
                content={content}
                subtopicContent={subtopicContent}
                studentId={getCurrentStudentId()}
                hasVideo={!!(hasVideo1 || hasVideo2)}
                hasMultipleVideos={!!(hasVideo1 && hasVideo2)}
                onStartQuiz={onStartQuiz}
                onVideoClick={onVideoClick}
                onNoteClick={onNoteClick}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <ContentDifficultyIndicator contentId={content.id} />
          </div>
          {content.short_description && (
            <div className="text-white/90 text-sm leading-relaxed">
              <MarkdownRenderer 
                className="text-sm leading-relaxed"
                translationDictionary={isValidTranslationDictionary(content.translation_dictionary) ? content.translation_dictionary : null}
                textColor="text-white/90"
                tooltipStyle="dark"
              >
                {content.short_description}
              </MarkdownRenderer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
