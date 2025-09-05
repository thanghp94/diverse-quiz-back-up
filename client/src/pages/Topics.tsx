import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContent, Content } from "@/hooks/useContent";
import { TopicListItem } from "@/components/topics/TopicListItem";
import { Header } from "@/components/shared";
import { useLocation } from "wouter";
import { trackContentAccess, getCurrentUserId } from "@/lib/contentTracking";
import {
  TopicsLoading,
  TopicsError,
  TopicsModals
} from "@/components/topics";
import { TopicsGrid } from "@/components/content-management/core/displays/TopicsGrid";

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

const Topics = () => {
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

  // Fetch topics where parentid is blank and topic is not blank, ordered alphabetically
  const {
    data: topics,
    isLoading,
    error
  } = useQuery({
    queryKey: ['bowl-challenge-topics'],
    queryFn: async () => {
      console.log('Fetching Bowl & Challenge topics from API...');
      const response = await fetch('/api/topics/bowl-challenge');
      if (!response.ok) {
        throw new Error('Failed to fetch bowl challenge topics');
      }
      const data = await response.json();
      console.log('Bowl & Challenge topics fetched:', data);
      return data as Topic[];
    }
  });

  // Lazy load subtopics for the dropdown (initially empty, fetch on demand)
  const [subtopicsCache, setSubtopicsCache] = useState<Record<string, Topic[]>>({});

  const loadSubtopics = async (parentId: string) => {
    console.log('Lazy loading subtopics for parentId:', parentId);
    if (subtopicsCache[parentId]) {
      console.log('Subtopics already cached for parentId:', parentId);
      return; // Already loaded
    }
    try {
      const response = await fetch(`/api/topics/${parentId}/subtopics`);
      if (!response.ok) {
        throw new Error('Failed to fetch subtopics');
      }
      const data = await response.json();
      console.log('Subtopics loaded successfully for parentId:', parentId, 'Count:', data.length);
      setSubtopicsCache(prev => ({ ...prev, [parentId]: data }));
    } catch (error) {
      console.error('Error loading subtopics:', error);
    }
  };

  // Fetch all content to show related content for each topic
  const {
    data: allContent
  } = useContent();

  const {
    data: allImages,
    isLoading: isImagesLoading
  } = useQuery({
    queryKey: ['images'],
    queryFn: async () => {
      console.log('Fetching all images from API...');
      const response = await fetch('/api/images');
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      const data = await response.json();
      console.log('All images fetched:', data);
      return data as Image[];
    }
  });

  // Prefetch subtopics on hover
  const queryClient = useQueryClient();

  const prefetchSubtopics = async (parentId: string) => {
    await queryClient.prefetchQuery(['subtopics'], () => {
      return fetch(`/api/topics/${parentId}/subtopics`).then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch subtopics');
        }
        return res.json();
      });
    });
  };



  const findImageUrl = (content: Content): string | null => {
    if (content.imageid && allImages) {
      const image = allImages.find(img => img.id === content.imageid);
      if (image && image.imagelink) {
        return image.imagelink;
      }
    }
    return content.imagelink || null;
  }

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
    return (subtopicsCache[parentId] || []).sort((a, b) => a.topic.localeCompare(b.topic));
  };
  const getTopicContent = (topicId: string) => {
    if (!allContent) return [];
    return allContent.filter(content => content.topicid === topicId);
  };

  if (isLoading) {
    return <TopicsLoading />;
  }
  
  if (error) {
    return <TopicsError />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      <Header onContentClick={handleContentClick} />
      <div className="p-2 sm:p-4">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-0">
          <TopicsGrid
            topics={topics}
            subtopicsCache={subtopicsCache}
            loadSubtopics={loadSubtopics}
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
export default Topics;
