import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useContent, Content } from "@/hooks/useContent";
import { ContentPopup } from "@/components/content";
import { TopicListItem } from "@/components/topics/TopicListItem";
import { cn } from "@/lib/utils";
import { Header } from "@/components/shared";
import TopicQuizRunner from "@/components/topics/TopicQuizRunner";
import TopicMatchingPopup from "@/components/topics/TopicMatchingPopup";
import { MatchingListPopup } from "@/components/matching";
import { MatchingActivityPopup } from "@/components/matching";
import { useLocation } from "wouter";

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

// Define the challenge subjects we want to display
const CHALLENGE_SUBJECTS = [
  'Art',
  'Media', 
  'Literature',
  'Music',
  'Science and Technology',
  'Special Areas',
  'History',
  'Social Studies'
];

const ChallengeSubject = () => {
  const [location] = useLocation();
  const [openContent, setOpenContent] = useState<string[]>([]);
  const [selectedContentInfo, setSelectedContentInfo] = useState<{
    content: Content;
    contextList: Content[];
    imageUrl: string | null;
  } | null>(null);
  const [quizContentId, setQuizContentId] = useState<string | null>(null);
  const [contentQuizLevel, setContentQuizLevel] = useState<'easy' | 'hard' | null>(null);
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [topicQuizInfo, setTopicQuizInfo] = useState<{
    topicId: string;
    level: 'overview' | 'easy' | 'hard';
    topicName: string;
  } | null>(null);
  const [topicMatchingInfo, setTopicMatchingInfo] = useState<{
    topicId: string;
    topicName: string;
  } | null>(null);
  const [selectedMatchingActivity, setSelectedMatchingActivity] = useState<{
    matchingId: string;
    matchingTitle: string;
  } | null>(null);

  // Parse URL parameters
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const activeTab = urlParams.get('tab');

  // Fetch all content to filter by challenge subjects
  const {
    data: allContent
  } = useContent();

  const {
    data: allImages,
    isLoading: isImagesLoading
  } = useQuery({
    queryKey: ['images'],
    queryFn: async () => {
      const response = await fetch('/api/images');
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      const data = await response.json();
      return data as Image[];
    }
  });

  // Helper function to get content for a specific challenge subject
  const getContentBySubject = useCallback((subject: string): Content[] => {
    if (!allContent) return [];

    return allContent.filter(content => 
      content.challengesubject && 
      content.challengesubject.includes(subject)
    );
  }, [allContent]);

  // Helper function to find image URL for content
  const findImageUrl = useCallback((content: Content): string | null => {
    if (!allImages || !content.imageid) return null;
    const image = allImages.find(img => img.id === content.imageid);
    return image?.imagelink || null;
  }, [allImages]);

  const handleToggleSubject = useCallback((subjectId: string) => {
    setExpandedSubjectId(prev => prev === subjectId ? null : subjectId);
  }, []);

  const toggleContent = useCallback((contentKey: string) => {
    setOpenContent(prev => 
      prev.includes(contentKey) 
        ? prev.filter(key => key !== contentKey)
        : [...prev, contentKey]
    );
  }, []);

  const handleContentClick = useCallback(({ content, contextList }: { 
    content: Content; 
    contextList: Content[]; 
  }) => {
    const imageUrl = findImageUrl(content);
    setSelectedContentInfo({ content, contextList, imageUrl });
  }, [findImageUrl]);

  const closePopup = useCallback(() => {
    setSelectedContentInfo(null);
    setQuizContentId(null);
    setContentQuizLevel(null);
  }, []);

  const handleStartQuiz = useCallback((content: Content, contextList: Content[], level: 'Easy' | 'Hard') => {
    const imageUrl = findImageUrl(content);
    setQuizContentId(content.id);
    // Convert level to database format (lowercase)
    const dbLevel = level.toLowerCase() as 'easy' | 'hard';
    setContentQuizLevel(dbLevel);
    setSelectedContentInfo({ content, contextList, imageUrl });
  }, [findImageUrl]);

  const handleStartTopicQuiz = useCallback((topicId: string, level: 'Overview' | 'Easy' | 'Hard', topicName: string) => {
    const dbLevel = level.toLowerCase() as 'overview' | 'easy' | 'hard';
    setTopicQuizInfo({ topicId, level: dbLevel, topicName });
  }, []);

  const closeTopicQuiz = useCallback(() => {
    setTopicQuizInfo(null);
  }, []);

  const handleStartTopicMatching = useCallback((topicId: string, topicName: string) => {
    setTopicMatchingInfo({ topicId, topicName });
  }, []);

  const closeTopicMatching = useCallback(() => {
    setTopicMatchingInfo(null);
  }, []);

  const handleMatchingActivitySelect = useCallback((matchingId: string, matchingTitle: string) => {
    setSelectedMatchingActivity({ matchingId, matchingTitle });
    setTopicMatchingInfo(null);
  }, []);

  const closeMatchingActivity = useCallback(() => {
    setSelectedMatchingActivity(null);
  }, []);

  const handleSubtopicClick = useCallback((topicId: string) => {
    // Handle subtopic navigation if needed
  }, []);

  const getTopicContent = useCallback((topicId: string): Content[] => {
    if (!allContent) return [];
    return allContent.filter(content => content.topicid === topicId);
  }, [allContent]);

  // Create virtual "topics" for each challenge subject
  const subjectTopics = CHALLENGE_SUBJECTS.map(subject => {
    const content = getContentBySubject(subject);
    return {
      id: subject.toLowerCase().replace(/\s+/g, '-'),
      topic: subject,
      short_summary: `Content related to ${subject}`,
      challengesubject: subject,
      image: '',
      parentid: undefined,
      showstudent: true,
      contentCount: content.length
    };
  }).filter(topic => topic.contentCount > 0); // Only show subjects that have content

  if (!allContent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
        <Header />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      <Header />
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-3">
              {activeTab ? `Quiz Mode: ${activeTab.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}` : 'Challenge Subjects'}
            </h1>
            {activeTab && (
              <p className="text-lg text-white/80">
                Select a subject below to start your {activeTab.replace('-', ' ')} quiz
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {subjectTopics.map(subject => {
              const subjectContent = getContentBySubject(subject.challengesubject || subject.topic);
              const isExpanded = expandedSubjectId === subject.id;

              return (
                <TopicListItem
                  key={subject.id}
                  topic={subject}
                  subtopics={[]}
                  topicContent={subjectContent}
                  allImages={allImages}
                  isExpanded={isExpanded}
                  openContent={openContent}
                  onToggleTopic={handleToggleSubject}
                  onToggleContent={toggleContent}
                  onContentClick={handleContentClick}
                  onSubtopicClick={handleSubtopicClick}
                  onStartQuiz={handleStartQuiz}
                  getTopicContent={getTopicContent}
                  onStartTopicQuiz={handleStartTopicQuiz}
                  onStartTopicMatching={handleStartTopicMatching}
                />
              );
            })}
          </div>
        </div>
      </div>

      <ContentPopup
        isOpen={!!selectedContentInfo}
        onClose={closePopup}
        content={selectedContentInfo?.content ?? null}
        contentList={selectedContentInfo?.contextList ?? []}
        onContentChange={newContent => {
          if (selectedContentInfo) {
            setSelectedContentInfo({ 
              ...selectedContentInfo, 
              content: newContent,
              imageUrl: findImageUrl(newContent),
            });
          }
        }}
        startQuizDirectly={selectedContentInfo?.content?.id === quizContentId}
        quizLevel={contentQuizLevel}
        imageUrl={selectedContentInfo?.imageUrl ?? null}
        isImageLoading={isImagesLoading}
      />

      {topicQuizInfo && (
        <TopicQuizRunner
          topicId={topicQuizInfo.topicId}
          level={topicQuizInfo.level === 'overview' ? 'Overview' : topicQuizInfo.level === 'easy' ? 'Easy' : 'Hard'}
          topicName={topicQuizInfo.topicName}
          onClose={closeTopicQuiz}
        />
      )}

      {topicMatchingInfo && (
        <MatchingListPopup
          isOpen={!!topicMatchingInfo}
          topicId={topicMatchingInfo.topicId}
          topicName={topicMatchingInfo.topicName}
          onClose={closeTopicMatching}
          onSelectMatching={handleMatchingActivitySelect}
        />
      )}

      {selectedMatchingActivity && (
        <MatchingActivityPopup
          isOpen={!!selectedMatchingActivity}
          matchingId={selectedMatchingActivity.matchingId}
          onClose={closeMatchingActivity}
        />
      )}
    </div>
  );
};

export default ChallengeSubject;