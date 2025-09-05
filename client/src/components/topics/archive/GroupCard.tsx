import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Users, BookOpen } from 'lucide-react';
import { Content } from '@/hooks/useContent';
import { ContentCard } from './archive/ContentCard';

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

interface GroupCardProps {
  topic: Topic;
  subtopics: Topic[];
  topicContent: Content[];
  allImages: Image[] | undefined;
  isExpanded: boolean;
  isActive: boolean;
  openContent: string[];
  activeContentId: string | null;
  onToggleTopic: (topicId: string) => void;
  onToggleContent: (contentKey: string) => void;
  onContentClick: (info: { content: Content; contextList: Content[] }) => void;
  onSubtopicClick: (topicId: string) => void;
  onStartQuiz: (content: Content, contextList: Content[], level?: 'Easy' | 'Hard') => void;
  onStartTopicQuiz: (topicId: string, level: 'Overview' | 'Easy' | 'Hard', topicName: string) => void;
  onStartTopicMatching: (topicId: string, topicName: string) => void;
  onStartGroupMatching: (matchingId: string, matchingTitle: string) => void;
  getTopicContent: (topicId: string) => Content[];
}

export const GroupCard: React.FC<GroupCardProps> = ({
  topic,
  subtopics,
  topicContent,
  allImages,
  isExpanded,
  isActive,
  openContent,
  activeContentId,
  onToggleTopic,
  onToggleContent,
  onContentClick,
  onSubtopicClick,
  onStartQuiz,
  onStartTopicQuiz,
  onStartTopicMatching,
  onStartGroupMatching,
  getTopicContent
}) => {
  const contentKey = `topic-${topic.id}`;
  const isContentExpanded = openContent.includes(contentKey);

  return (
    <Card className={`transition-all duration-200 ${isActive ? 'ring-2 ring-blue-500' : ''} ${isExpanded ? 'bg-blue-50/30' : ''}`}>
      <CardContent className="p-4">
        {/* Topic Header */}
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            onClick={() => onToggleTopic(topic.id)}
            className="flex-1 justify-start p-0 h-auto text-left"
          >
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-blue-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">{topic.topic}</h3>
                {topic.short_summary && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{topic.short_summary}</p>
                )}
              </div>
            </div>
          </Button>
          
          {topic.challengesubject && (
            <Badge variant="outline" className="text-xs ml-2">
              {topic.challengesubject}
            </Badge>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="ml-6 space-y-3">
            {/* Subtopics */}
            {subtopics.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Subtopics</h4>
                {subtopics.map(subtopic => (
                  <Button
                    key={subtopic.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => onSubtopicClick(subtopic.id)}
                    className="block w-full text-left justify-start mb-1 h-auto p-2"
                  >
                    <span className="text-xs text-blue-600">{subtopic.topic}</span>
                  </Button>
                ))}
              </div>
            )}

            {/* Topic Quiz Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStartTopicQuiz(topic.id, 'Overview', topic.topic)}
                className="text-blue-600 hover:bg-blue-50 text-xs"
              >
                Overview Quiz
              </Button>
              <Button
                variant="outline"  
                size="sm"
                onClick={() => onStartTopicMatching(topic.id, topic.topic)}
                className="text-purple-600 hover:bg-purple-50 text-xs"
              >
                Matching
              </Button>
            </div>

            {/* Topic Content */}
            {topicContent.length > 0 && (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleContent(contentKey)}
                  className="flex items-center gap-2 mb-2 text-xs"
                >
                  {isContentExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <BookOpen className="h-3 w-3" />
                  Content ({topicContent.length})
                </Button>
                
                {isContentExpanded && (
                  <div className="ml-5 space-y-2">
                    {topicContent.map(content => (
                      <ContentCard
                        key={content.id}
                        content={content}
                        contextList={topicContent}
                        allImages={allImages}
                        isActive={activeContentId === content.id}
                        onContentClick={onContentClick}
                        onStartQuiz={onStartQuiz}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};