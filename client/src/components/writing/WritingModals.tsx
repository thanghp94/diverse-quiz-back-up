import React from 'react';
import { ContentPopup } from '@/components/content';
import { WritingOutlinePopup } from '@/components/writing-system';
import { AcademicEssayPopup } from '@/components/writing-system';
import { CreativeWritingPopup } from '@/components/writing-system';
import { WritingContentPopup } from '@/components/writing-system';
import TopicQuizRunner from '@/components/topics/TopicQuizRunner';
import { MatchingListPopup } from '@/components/matching';
import { MatchingActivityPopup } from '@/components/matching';
import { Content } from '@/hooks/useContent';

interface User {
  id: string;
  first_name: string;
  last_name: string;
}

interface WritingModalsProps {
  // Content popup
  selectedContentInfo: {
    content: Content;
    contextList: Content[];
    imageUrl: string | null;
    quizLevel?: 'easy' | 'hard' | null;
  } | null;
  quizContentId: string | null;
  isImagesLoading: boolean;
  onClosePopup: () => void;
  findImageUrl: (content: Content) => string | null;
  
  // Topic quiz
  topicQuizInfo: {
    topicId: string;
    level: 'Overview' | 'Easy' | 'Hard';
    topicName: string;
  } | null;
  onCloseTopicQuiz: () => void;
  
  // Topic matching
  topicMatchingInfo: {
    topicId: string;
    topicName: string;
  } | null;
  selectedMatchingActivity: {
    matchingId: string;
    matchingTitle: string;
  } | null;
  onCloseTopicMatching: () => void;
  onCloseMatchingActivity: () => void;
  onSelectMatchingActivity: (matchingId: string, matchingTitle: string) => void;
  
  // Writing specific modals
  outlinePopupInfo: {
    isOpen: boolean;
    contentTitle?: string;
    contentId?: string;
  };
  essayPopupInfo: {
    isOpen: boolean;
    contentTitle?: string;
    contentId?: string;
  };
  creativeWritingInfo: {
    isOpen: boolean;
    contentTitle?: string;
    contentId?: string;
    outlineData?: any;
  };
  writingContentInfo: {
    isOpen: boolean;
    content: Content | null;
    contextList: Content[];
  };
  
  // Writing handlers
  user: User | null;
  draftEssay: any;
  onCloseOutlinePopup: () => void;
  onCloseEssayPopup: () => void;
  onCloseCreativeWriting: () => void;
  onCloseWritingContent: () => void;
  onBackToOutline: () => void;
  onProceedToCreativeWriting: (outlineData: any) => void;
  onContentChange: (newContent: Content) => void;
}

export const WritingModals: React.FC<WritingModalsProps> = ({
  selectedContentInfo,
  quizContentId,
  isImagesLoading,
  onClosePopup,
  findImageUrl,
  topicQuizInfo,
  onCloseTopicQuiz,
  topicMatchingInfo,
  selectedMatchingActivity,
  onCloseTopicMatching,
  onCloseMatchingActivity,
  onSelectMatchingActivity,
  outlinePopupInfo,
  essayPopupInfo,
  creativeWritingInfo,
  writingContentInfo,
  user,
  draftEssay,
  onCloseOutlinePopup,
  onCloseEssayPopup,
  onCloseCreativeWriting,
  onCloseWritingContent,
  onBackToOutline,
  onProceedToCreativeWriting,
  onContentChange
}) => {
  return (
    <>
      <ContentPopup
        isOpen={!!selectedContentInfo}
        onClose={onClosePopup}
        content={selectedContentInfo?.content ?? null}
        contentList={selectedContentInfo?.contextList ?? []}
        onContentChange={onContentChange}
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

      <WritingOutlinePopup
        isOpen={outlinePopupInfo.isOpen}
        onClose={onCloseOutlinePopup}
        contentTitle={outlinePopupInfo.contentTitle}
        contentId={outlinePopupInfo.contentId}
        studentId={user?.id}
        onProceedToWriting={onProceedToCreativeWriting}
      />

      <AcademicEssayPopup
        isOpen={essayPopupInfo.isOpen}
        onClose={onCloseEssayPopup}
        contentTitle={essayPopupInfo.contentTitle}
        contentId={essayPopupInfo.contentId}
        studentId={user?.id}
        draftEssay={draftEssay}
      />

      <CreativeWritingPopup
        isOpen={creativeWritingInfo.isOpen}
        onClose={onCloseCreativeWriting}
        contentTitle={creativeWritingInfo.contentTitle}
        contentId={creativeWritingInfo.contentId}
        studentId={user?.id}
        outlineData={creativeWritingInfo.outlineData}
        onBackToOutline={onBackToOutline}
      />

      <WritingContentPopup
        isOpen={writingContentInfo.isOpen}
        onClose={onCloseWritingContent}
        content={writingContentInfo.content}
        contentList={writingContentInfo.contextList}
        onContentChange={onContentChange}
      />
    </>
  );
};