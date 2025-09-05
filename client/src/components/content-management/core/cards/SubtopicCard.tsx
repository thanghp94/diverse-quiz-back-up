import React from 'react';
import { Content } from "@/hooks/useContent";
import { useContentCardLogic } from "../../hooks/useContentCardLogic";
import { getCardClassName } from "../../utils/contentCardUtils";
import { GroupCard } from "./GroupCard";
import { RegularContentCard } from "./ContentCard";
import { GroupExpansion } from "./GroupExpansion";
import { ContentVideoDialog } from "../../interactions/dialogs/ContentVideoDialog";
import { PersonalNoteDialog } from "../../interactions/dialogs/PersonalNoteDialog";

interface SubtopicContentCardProps {
  content: Content;
  subtopicContent: Content[];
  activeContentId: string | null;
  onContentClick: (info: { content: Content; contextList: Content[] }) => void;
  onStartQuiz: (content: Content, contextList: Content[], level: 'Easy' | 'Hard') => void;
  onStartGroupMatching: (matchingId: string, matchingTitle: string) => void;
  onToggleGroupCard: (groupCardId: string) => void;
  isGroupCardExpanded: (groupCardId: string) => boolean;
}

export const SubtopicContentCard: React.FC<SubtopicContentCardProps> = ({
  content,
  subtopicContent,
  activeContentId,
  onContentClick,
  onStartQuiz,
  onStartGroupMatching,
  onToggleGroupCard,
  isGroupCardExpanded
}) => {
  const {
    videoPopupOpen,
    setVideoPopupOpen,
    selectedGroupVideo,
    setSelectedGroupVideo,
    noteDialogOpen,
    setNoteDialogOpen,
    noteDialogContentId,
    setNoteDialogContentId,
    hasVideo1,
    hasVideo2,
    isGroupCard,
    groupedContent
  } = useContentCardLogic(content, subtopicContent);

  const isGroupExpanded = isGroupCard ? isGroupCardExpanded(content.id) : false;

  const handleVideoClick = () => setVideoPopupOpen(true);
  const handleNoteClick = (contentId: string) => {
    setNoteDialogContentId(contentId);
    setNoteDialogOpen(true);
  };
  const handleGroupVideoClick = (groupItem: Content) => {
    setVideoPopupOpen(true);
    setSelectedGroupVideo(groupItem);
  };

  return (
    <>
      <div className={getCardClassName(isGroupCard, isGroupExpanded, activeContentId, content.id)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-grow cursor-pointer">
            {isGroupCard ? (
              <GroupCard
                content={content}
                subtopicContent={subtopicContent}
                isGroupExpanded={isGroupExpanded}
                groupedContent={groupedContent}
                onToggleGroupCard={onToggleGroupCard}
                onStartQuiz={onStartQuiz}
                onStartGroupMatching={onStartGroupMatching}
                onContentClick={onContentClick}
              />
            ) : (
              <RegularContentCard
                content={content}
                subtopicContent={subtopicContent}
                hasVideo1={!!hasVideo1}
                hasVideo2={!!hasVideo2}
                isGroupCard={isGroupCard}
                onContentClick={onContentClick}
                onStartQuiz={onStartQuiz}
                onVideoClick={handleVideoClick}
                onNoteClick={() => handleNoteClick(content.id)}
              />
            )}
          </div>
        </div>

        {/* Inline Grouped Content Expansion */}
        {isGroupCard && groupedContent.length > 0 && isGroupExpanded && (
          <GroupExpansion
            groupedContent={groupedContent}
            subtopicContent={subtopicContent}
            activeContentId={activeContentId}
            onContentClick={onContentClick}
            onStartQuiz={onStartQuiz}
            onVideoClick={handleGroupVideoClick}
            onNoteClick={handleNoteClick}
          />
        )}
      </div>

      {/* Video Dialog */}
      <ContentVideoDialog
        open={videoPopupOpen}
        onOpenChange={(open) => {
          setVideoPopupOpen(open);
          if (!open) setSelectedGroupVideo(null);
        }}
        content={content}
        selectedGroupVideo={selectedGroupVideo}
        onClose={() => {
          setVideoPopupOpen(false);
          setSelectedGroupVideo(null);
        }}
      />

      {/* Personal Note Dialog */}
      <PersonalNoteDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        contentId={noteDialogContentId}
        onClose={() => setNoteDialogOpen(false)}
      />
    </>
  );
};
