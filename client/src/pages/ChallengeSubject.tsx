import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useContent, Content } from "@/hooks/useContent";
import { Header } from "@/components/shared";
import { useLocation } from "wouter";
import { trackContentAccess, getCurrentUserId } from "@/lib/contentTracking";
import {
  TopicsLoading,
  TopicsError,
  TopicsGrid,
  TopicsModals
} from "@/components/topics";

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
    quizLevel?: 'easy' | 'hard' | null;
  } | null>(null);
  const [quizContentId, setQuizContentId] = useState<string | null>(null);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [topicQuizInfo, setTopicQuizInfo] = useState<{
    topicId: string;
    level: 'Overview' | 'Easy' | 'Hard';
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
  const [expandedGroupCards, setExpandedGroupCards] = useState<Set<string>>(new Set());
  const [activeContentId, setActiveContentId] = useState<string | null>(null);

  // Helper functions for group card expansion
  const handleToggleGroupCard = useCallback((groupCardId: string) => {
    setExpandedGroupCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupCardId)) {
        newSet.delete(groupCardId);
      } else {
        newSet.add(groupCardId);
      }
      return newSet;
    });
  }, []);

  const isGroupCardExpanded = useCallback((groupCardId: string) => {
    return expandedGroupCards.has(groupCardId);
  }, [expandedGroupCards]);

  // Parse URL parameters
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const activeTab = urlParams.get('tab');
  const subjectFilter = urlParams.get('subject');

  // Fetch all content to filter by challenge subjects
  const {
    data: allContent,
    isLoading,
    error
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
      Array.isArray(content.challengesubject) &&
      content.challengesubject.includes(subject)
    );
  }, [allContent]);

  // Helper function to find image URL for content
  const findImageUrl = useCallback((content: Content): string | null => {
    if (content.imageid && allImages) {
      const image = allImages.find(img => img.id === content.imageid);
      if (image && image.imagelink) {
        return image.imagelink;
      }
    }
    return content.imagelink || null;
  }, [allImages]);

  const handleToggleTopic = (topicId: string) => {
    setExpandedTopicId(currentId => (currentId === topicId ? null : topicId));
    setActiveTopicId(topicId);
  };

  const toggleContent = (contentKey: string) => {
    setOpenContent(prev => prev.includes(contentKey) ? prev.filter(key => key !== contentKey) : [...prev, contentKey]);
  };

  const handleSubtopicClick = (topicId: string) => {
    if (!allContent) return;
    const topicContent = getTopicContent(topicId);
    const firstContent = topicContent[0];
    if (firstContent) {
      setSelectedContentInfo({
        content: firstContent,
        contextList: topicContent,
        imageUrl: findImageUrl(firstContent),
      });
      
      // Track content access when student clicks on subtopic
      const currentUserId = getCurrentUserId();
      if (currentUserId) {
        trackContentAccess(currentUserId, firstContent.id);
      }
    } else {
      console.warn(`Content for topic ID ${topicId} not found`);
    }
  };

  const handleContentClick = (info: { content: Content; contextList: Content[] }) => {
    setActiveContentId(info.content.id);
    setSelectedContentInfo({
      content: info.content,
      contextList: info.contextList,
      imageUrl: findImageUrl(info.content),
    });
    
    // Track content access when student clicks on content
    const currentUserId = getCurrentUserId();
    if (currentUserId) {
      trackContentAccess(currentUserId, info.content.id);
    }
  };

  const handleStartQuiz = (content: Content, contextList: Content[], level?: 'Easy' | 'Hard') => {
    console.log('Starting content quiz for:', content.title, 'Level:', level);
    // Convert level to database format (lowercase)
    const dbLevel = level?.toLowerCase() as 'easy' | 'hard' | undefined;
    setSelectedContentInfo({
      content,
      contextList,
      imageUrl: findImageUrl(content),
      quizLevel: dbLevel,
    });
    setQuizContentId(content.id);
  };

  const closePopup = useCallback(() => {
    setSelectedContentInfo(null);
    setQuizContentId(null);
  }, []);

  const handleStartTopicQuiz = (topicId: string, level: 'Overview' | 'Easy' | 'Hard', topicName: string) => {
    setTopicQuizInfo({ topicId, level, topicName });
  };

  const closeTopicQuiz = useCallback(() => {
    setTopicQuizInfo(null);
  }, []);

  const handleStartTopicMatching = (topicId: string, topicName: string) => {
    setTopicMatchingInfo({ topicId, topicName });
  };

  const closeTopicMatching = useCallback(() => {
    setTopicMatchingInfo(null);
  }, []);

  const handleSelectMatchingActivity = (matchingId: string, matchingTitle: string) => {
    setSelectedMatchingActivity({ matchingId, matchingTitle });
  };

  const closeMatchingActivity = useCallback(() => {
    setSelectedMatchingActivity(null);
  }, []);

  const handleStartGroupMatching = (matchingId: string, matchingTitle: string) => {
    setSelectedMatchingActivity({ matchingId, matchingTitle });
  };

  const getSubtopics = (parentId: string) => {
    // For Challenge Subject page, we don't have subtopics, return empty array
    return [];
  };

  const getTopicContent = useCallback((topicId: string): Content[] => {
    if (!allContent) return [];
    // For Challenge Subject, topicId is actually the subject name
    const subject = CHALLENGE_SUBJECTS.find(s => s.toLowerCase().replace(/\s+/g, '-') === topicId);
    if (subject) {
      return getContentBySubject(subject);
    }
    return [];
  }, [allContent, getContentBySubject]);

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

  if (isLoading) {
    return <TopicsLoading />;
  }
  
  if (error) {
    return <TopicsError />;
  }

  // Create a custom header component for Challenge Subject
  const ChallengeSubjectHeader = () => {
    const getTitle = () => {
      if (activeTab) {
        return `Quiz Mode: ${activeTab.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
      }
      return 'Challenge Subjects';
    };

    const getSubtitle = () => {
      if (activeTab) {
        return `Select a subject below to start your ${activeTab.replace('-', ' ')} quiz`;
      }
      return null;
    };

    return (
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-3">
          {getTitle()}
        </h1>
        {getSubtitle() && (
          <p className="text-lg text-white/80">
            {getSubtitle()}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      <Header />
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          <ChallengeSubjectHeader />

          <TopicsGrid
            topics={subjectTopics}
            allTopics={[]} // No subtopics for Challenge Subject
            allContent={allContent}
            allImages={allImages}
            expandedTopicId={expandedTopicId}
            activeTopicId={activeTopicId}
            openContent={openContent}
            activeContentId={activeContentId}
            expandedGroupCards={expandedGroupCards}
            onToggleTopic={handleToggleTopic}
            onToggleContent={toggleContent}
            onContentClick={handleContentClick}
            onSubtopicClick={handleSubtopicClick}
            onStartQuiz={handleStartQuiz}
            onStartTopicQuiz={handleStartTopicQuiz}
            onStartTopicMatching={handleStartTopicMatching}
            onStartGroupMatching={handleStartGroupMatching}
            onToggleGroupCard={handleToggleGroupCard}
            isGroupCardExpanded={isGroupCardExpanded}
          />
        </div>
      </div>

      <TopicsModals
        selectedContentInfo={selectedContentInfo}
        quizContentId={quizContentId}
        topicQuizInfo={topicQuizInfo}
        topicMatchingInfo={topicMatchingInfo}
        selectedMatchingActivity={selectedMatchingActivity}
        isImagesLoading={isImagesLoading}
        onClosePopup={closePopup}
        onCloseTopicQuiz={closeTopicQuiz}
        onCloseTopicMatching={closeTopicMatching}
        onCloseMatchingActivity={closeMatchingActivity}
        onContentChange={newContent => {
          if (selectedContentInfo) {
            setSelectedContentInfo({ 
              ...selectedContentInfo, 
              content: newContent,
              imageUrl: findImageUrl(newContent),
            });
          }
        }}
        onSelectMatchingActivity={handleSelectMatchingActivity}
        findImageUrl={findImageUrl}
      />
    </div>
  );
};

export default ChallengeSubject;