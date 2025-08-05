import React from 'react';
import { TopicListItem } from '@/components/TopicListItem';
import { Content } from '@/hooks/useContent';

interface Topic {
  id: string;
  topic: string;
  short_summary?: string;
  challengesubject?: string;
  image?: string;
  parentid?: string;
  showstudent?: boolean;
}

interface Image {
  id: string;
  imagelink: string | null;
  contentid: string | null;
  default: string | null;
}

interface TopicsGridProps {
  topics: Topic[] | undefined;
  allTopics: Topic[] | undefined;
  allContent: Content[] | undefined;
  allImages: Image[] | undefined;
  expandedTopicId: string | null;
  activeTopicId: string | null;
  openContent: string[];
  activeContentId: string | null;
  expandedGroupCards: Set<string>;
  onToggleTopic: (topicId: string) => void;
  onToggleContent: (contentKey: string) => void;
  onContentClick: (info: { content: Content; contextList: Content[] }) => void;
  onSubtopicClick: (topicId: string) => void;
  onStartQuiz: (content: Content, contextList: Content[], level?: 'Easy' | 'Hard') => void;
  onStartTopicQuiz: (topicId: string, level: 'Overview' | 'Easy' | 'Hard', topicName: string) => void;
  onStartTopicMatching: (topicId: string, topicName: string) => void;
  onStartGroupMatching: (matchingId: string, matchingTitle: string) => void;
  onToggleGroupCard: (groupCardId: string) => void;
  isGroupCardExpanded: (groupCardId: string) => boolean;
}

export const TopicsGrid: React.FC<TopicsGridProps> = ({
  topics,
  allTopics,
  allContent,
  allImages,
  expandedTopicId,
  activeTopicId,
  openContent,
  activeContentId,
  expandedGroupCards,
  onToggleTopic,
  onToggleContent,
  onContentClick,
  onSubtopicClick,
  onStartQuiz,
  onStartTopicQuiz,
  onStartTopicMatching,
  onStartGroupMatching,
  onToggleGroupCard,
  isGroupCardExpanded
}) => {
  const getSubtopics = (parentId: string) => {
    if (!allTopics) return [];
    return allTopics.filter(topic => topic.parentid === parentId).sort((a, b) => a.topic.localeCompare(b.topic));
  };

  const getTopicContent = (topicId: string) => {
    if (!allContent) return [];
    return allContent.filter(content => content.topicid === topicId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-start">
      {topics?.map(topic => {
        const subtopics = getSubtopics(topic.id);
        const topicContent = getTopicContent(topic.id);
        const isExpanded = expandedTopicId === topic.id;

        return (
          <TopicListItem
            key={topic.id}
            topic={topic}
            subtopics={subtopics}
            topicContent={topicContent}
            allImages={allImages}
            isExpanded={isExpanded}
            isActive={activeTopicId === topic.id}
            openContent={openContent}
            onToggleTopic={onToggleTopic}
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