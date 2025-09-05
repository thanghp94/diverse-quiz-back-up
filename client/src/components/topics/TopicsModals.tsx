import React from 'react';
import ContentPopup from '@/components/content-management/interactions/popups/ContentPopup';
import TopicQuizRunner from '@/components/content-management/activities/quiz/TopicQuizRunner';
import { MatchingListPopup } from '@/components/content-management/interactions/popups/MatchingListPopup';
import { MatchingActivityPopup } from '@/components/content-management/interactions/popups/MatchingActivityPopup';
import { Content } from '@/hooks/useContent';

interface TopicsModalsProps {
  selectedContentInfo: {
    content: Content;
    contextList: Content[];
    imageUrl: string | null;
    quizLevel?: 'easy' | 'hard' | null;
  } | null;
  quizContentId: string | null;
  topicQuizInfo: {
    topicId: string;
    level: 'Overview' | 'Easy' | 'Hard';
    topicName: string;
  } | null;
  topicMatchingInfo: {
    topicId: string;
    topicName: string;
  } | null;
  selectedMatchingActivity: {
    matchingId: string;
    matchingTitle: string;
  } | null;
  isImagesLoading: boolean;
  onClosePopup: () => void;
  onCloseTopicQuiz: () => void;
  onCloseTopicMatching: () => void;
  onCloseMatchingActivity: () => void;
  onContentChange: (newContent: Content) => void;
  onSelectMatchingActivity: (matchingId: string, matchingTitle: string) => void;
  findImageUrl: (content: Content) => string | null;
}

export const TopicsModals: React.FC<TopicsModalsProps> = ({
  selectedContentInfo,
  quizContentId,
  topicQuizInfo,
  topicMatchingInfo,
  selectedMatchingActivity,
  isImagesLoading,
  onClosePopup,
  onCloseTopicQuiz,
  onCloseTopicMatching,
  onCloseMatchingActivity,
  onContentChange,
  onSelectMatchingActivity,
  findImageUrl
}) => {
  return (
    <>
      <ContentPopup
        isOpen={!!selectedContentInfo}
        onClose={onClosePopup}
        content={selectedContentInfo?.content ?? null}
        contentList={selectedContentInfo?.contextList ?? []}
        onContentChange={newContent => {
          if (selectedContentInfo) {
            onContentChange(newContent);
          }
        }}
        startQuizDirectly={selectedContentInfo?.content?.id === quizContentId}
        quizLevel={selectedContentInfo?.quizLevel}
        imageUrl={selectedContentInfo?.imageUrl ?? null}
        isImageLoading={isImagesLoading}
      />

      {topicQuizInfo && (
        <TopicQuizRunner
          topicId={topicQuizInfo.topicId}
          level={topicQuizInfo.level}
          topicName={topicQuizInfo.topicName}
          onClose={onCloseTopicQuiz}
        />
      )}

      {topicMatchingInfo && (
        <MatchingListPopup
          isOpen={!!topicMatchingInfo}
          onClose={onCloseTopicMatching}
          topicId={topicMatchingInfo.topicId}
          topicName={topicMatchingInfo.topicName}
          onSelectMatching={onSelectMatchingActivity}
        />
      )}

      {selectedMatchingActivity && (
        <MatchingActivityPopup
          isOpen={!!selectedMatchingActivity}
          onClose={onCloseMatchingActivity}
          matchingId={selectedMatchingActivity.matchingId}
        />
      )}
    </>
  );
};