import React from 'react';
import { Button } from "@/components/ui/button";
import { HelpCircle, Shuffle } from "lucide-react";
import { Content } from "@/hooks/useContent";
import { ContentThumbnailGallery } from "../displays/ContentThumbnailGallery";
import { MarkdownRenderer } from "@/components/shared";
import { isValidTranslationDictionary } from "@/components/topics/TopicUtils";

interface GroupCardProps {
  content: Content;
  subtopicContent: Content[];
  isGroupExpanded: boolean;
  groupedContent: Content[];
  onToggleGroupCard: (groupCardId: string) => void;
  onStartQuiz: (content: Content, contextList: Content[], level: 'Easy' | 'Hard') => void;
  onStartGroupMatching: (matchingId: string, matchingTitle: string) => void;
  onContentClick: (info: { content: Content; contextList: Content[] }) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  content,
  subtopicContent,
  isGroupExpanded,
  groupedContent,
  onToggleGroupCard,
  onStartQuiz,
  onStartGroupMatching,
  onContentClick
}) => {
  return (
    <div 
      className="w-full"
      onClick={() => onToggleGroupCard(content.id)}
    >
      {/* Title with action buttons for group cards */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {/* Buttons on far left */}
        <div className="flex items-center gap-1">
          {content.parentid && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-yellow-200 hover:bg-yellow-500/30 bg-yellow-500/20 border-yellow-400/40 text-xs px-1 py-0.5 h-5"
              onClick={(e) => {
                e.stopPropagation();
                onStartGroupMatching(content.parentid!, content.title || 'Group Match');
              }}
              title="Match"
            >
              <Shuffle className="h-3 w-3" />
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="text-yellow-200 hover:bg-yellow-500/30 bg-yellow-500/20 border-yellow-400/40 text-xs px-1 py-0.5 h-5"
            onClick={(e) => {
              e.stopPropagation();
              onStartQuiz(content, subtopicContent, 'Easy');
            }}
            title="Quiz"
          >
            <HelpCircle className="h-3 w-3" />
          </Button>
        </div>

        {/* Centered title */}
        <div className="flex-1 text-center">
          <h4 className="text-base font-medium leading-tight" style={{ color: '#ffff78e6' }}>{content.title}</h4>
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
        <div className="text-white text-sm leading-relaxed mt-1 text-center font-semibold">
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
