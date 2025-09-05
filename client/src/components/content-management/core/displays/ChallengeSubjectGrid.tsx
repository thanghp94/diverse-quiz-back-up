import React, { useEffect } from 'react';
import { TopicListItem } from "./TopicListItem";
import { Content } from '@/hooks/useContent';

interface Topic {
  id: string;
  topic: string;
  short_summary?: string;
  challengesubject?: string;
  image?: string;
  parentid?: string;
  showstudent?: boolean;
  contentCount?: number;
}

interface Image {
  id: string;
  imagelink: string | null;
  contentid: string | null;
  default: string | null;
}

interface ChallengeSubjectGridProps {
  subjectTopics: Topic[];
  allContent: Content[] | undefined;
  allImages: Image[] | undefined;
  expandedSubjectId: string | null;
  activeTopicId: string | null;
  openContent: string[];
  activeContentId: string | null;
  expandedGroupCards: Set<string>;
  onToggleSubject: (subjectId: string) => void;
  onToggleContent: (contentKey: string) => void;
  onContentClick: (info: { content: Content; contextList: Content[] }) => void;
  onSubtopicClick: (topicId: string) => void;
  onStartQuiz: (content: Content, contextList: Content[], level: 'Easy' | 'Hard') => void;
  onStartTopicQuiz: (topicId: string, level: 'Overview' | 'Easy' | 'Hard', topicName: string) => void;
  onStartTopicMatching: (topicId: string, topicName: string) => void;
  onStartGroupMatching: (matchingId: string, matchingTitle: string) => void;
  onToggleGroupCard: (groupCardId: string) => void;
  isGroupCardExpanded: (groupCardId: string) => boolean;
  getContentBySubject: (subject: string) => Content[];
  getTopicContent: (topicId: string) => Content[];
  loadSubtopics: (subjectId: string) => Promise<void>;
}

export const ChallengeSubjectGrid: React.FC<ChallengeSubjectGridProps> = ({
  subjectTopics,
  allContent,
  allImages,
  expandedSubjectId,
  activeTopicId,
  openContent,
  activeContentId,
  expandedGroupCards,
  onToggleSubject,
  onToggleContent,
  onContentClick,
  onSubtopicClick,
  onStartQuiz,
  onStartTopicQuiz,
  onStartTopicMatching,
  onStartGroupMatching,
  onToggleGroupCard,
  isGroupCardExpanded,
  getContentBySubject,
  getTopicContent,
  loadSubtopics
}) => {
  useEffect(() => {
    if (expandedSubjectId) {
      loadSubtopics(expandedSubjectId);
    }
  }, [expandedSubjectId, loadSubtopics]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
      {subjectTopics.map(subject => {
        const subjectContent = getContentBySubject(subject.challengesubject || subject.topic);
        const isExpanded = expandedSubjectId === subject.id;

        return (
          <TopicListItem
            key={subject.id}
            topic={subject}
            subtopics={[]} // Challenge subjects don't have subtopics
            topicContent={subjectContent}
            allImages={allImages}
            isExpanded={isExpanded}
            isActive={activeTopicId === subject.id}
            openContent={openContent}
            onToggleTopic={onToggleSubject}
            onToggleContent={onToggleContent}
            onContentClick={onContentClick}
            onSubtopicClick={onSubtopicClick}
            onStartQuiz={onStartQuiz}
            getTopicContent={getTopicContent}
            onStartTopicQuiz={onStartTopicQuiz}
            onStartTopicMatching={onStartTopicMatching}
            onStartGroupMatching={onStartGroupMatching}
            onToggleGroupCard={onToggleGroupCard}
            isGroupCardExpanded={isGroupCardExpanded}
            activeContentId={activeContentId}
          />
        );
      })}
    </div>
  );
};
