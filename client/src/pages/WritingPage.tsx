import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useContent, Content } from "@/hooks/useContent";
import { Header } from "@/components/shared";
import { useLocation } from "wouter";
import { trackContentAccess, getCurrentUserId } from "@/lib/contentTracking";
import { useAuth } from "@/hooks/useAuth";
import {
  WritingHeader,
  WritingLoading,
  WritingError,
  WritingGrid,
  WritingModals
} from "@/components/writing";

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

const WritingPage = () => {
  const { user } = useAuth();

  // Listen for localStorage changes to update progress buttons
  useEffect(() => {
    const handleStorageChange = () => {
      setForceUpdate((prev) => prev + 1);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);
  const [location] = useLocation();
  const [openContent, setOpenContent] = useState<string[]>([]);
  const [selectedContentInfo, setSelectedContentInfo] = useState<{
    content: Content;
    contextList: Content[];
    imageUrl: string | null;
    quizLevel?: "easy" | "hard" | null;
  } | null>(null);
  const [quizContentId, setQuizContentId] = useState<string | null>(null);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [topicQuizInfo, setTopicQuizInfo] = useState<{
    topicId: string;
    level: "Overview" | "Easy" | "Hard";
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
  const [expandedGroupCards, setExpandedGroupCards] = useState<Set<string>>(
    new Set(),
  );
  const [activeContentId, setActiveContentId] = useState<string | null>(null);
  const [outlinePopupInfo, setOutlinePopupInfo] = useState<{
    isOpen: boolean;
    contentTitle?: string;
    contentId?: string;
  }>({ isOpen: false });
  const [essayPopupInfo, setEssayPopupInfo] = useState<{
    isOpen: boolean;
    contentTitle?: string;
    contentId?: string;
  }>({ isOpen: false });
  const [creativeWritingInfo, setCreativeWritingInfo] = useState<{
    isOpen: boolean;
    contentTitle?: string;
    contentId?: string;
    outlineData?: any;
  }>({ isOpen: false });
  const [forceUpdate, setForceUpdate] = useState(0);
  const [writingContentInfo, setWritingContentInfo] = useState<{
    isOpen: boolean;
    content: Content | null;
    contextList: Content[];
  }>({ isOpen: false, content: null, contextList: [] });
  const [highlightedContentId, setHighlightedContentId] = useState<string | null>(null);

  // Helper functions for group card expansion
  const handleToggleGroupCard = useCallback((groupCardId: string) => {
    setExpandedGroupCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupCardId)) {
        newSet.delete(groupCardId);
      } else {
        newSet.add(groupCardId);
      }
      return newSet;
    });
  }, []);

  const isGroupCardExpanded = useCallback(
    (groupCardId: string) => {
      return expandedGroupCards.has(groupCardId);
    },
    [expandedGroupCards],
  );

  // Parse URL parameters
  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const activeTab = urlParams.get("tab");
  const subjectFilter = urlParams.get("subject");

  // Fetch all topics to find writing topics
  const {
    data: allTopics,
    isLoading: allTopicsLoading,
    error: topicsError,
  } = useQuery({
    queryKey: ["all-topics"],
    queryFn: async () => {
      console.log("Fetching all topics for writing page...");
      const response = await fetch("/api/topics");
      if (!response.ok) {
        throw new Error("Failed to fetch all topics");
      }
      const data = await response.json();
      console.log("All topics fetched:", data);
      return data as Topic[];
    },
  });

  // Filter writing topics (challengesubject = "Writing")
  const writingTopics =
    allTopics
      ?.filter(
        (topic) =>
          topic.challengesubject === "Writing" &&
          (!topic.parentid || topic.parentid === ""),
      )
      .sort((a, b) => a.topic.localeCompare(b.topic)) || [];

  // Fetch all content to show related content for each topic
  const { data: allContent } = useContent();

  // Filter writing content (parentid = "writing")
  const writingContent =
    allContent?.filter((content) => content.parentid === "writing") || [];

  const { data: allImages, isLoading: isImagesLoading } = useQuery({
    queryKey: ["images"],
    queryFn: async () => {
      console.log("Fetching all images from API...");
      const response = await fetch("/api/images");
      if (!response.ok) {
        throw new Error("Failed to fetch images");
      }
      const data = await response.json();
      console.log("All images fetched:", data);
      return data as Image[];
    },
  });

  const findImageUrl = (content: Content): string | null => {
    if (content.imageid && allImages) {
      const image = allImages.find((img) => img.id === content.imageid);
      if (image && image.imagelink) {
        return image.imagelink;
      }
    }
    return content.imagelink || null;
  };

  const handleToggleTopic = (topicId: string) => {
    setExpandedTopicId((currentId) => (currentId === topicId ? null : topicId));
    setActiveTopicId(topicId);
  };

  const toggleContent = (contentKey: string) => {
    setOpenContent((prev) =>
      prev.includes(contentKey)
        ? prev.filter((key) => key !== contentKey)
        : [...prev, contentKey],
    );
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

  const handleContentClick = (info: {
    content: Content;
    contextList: Content[];
  }) => {
    setActiveContentId(info.content.id);
    setWritingContentInfo({
      isOpen: true,
      content: info.content,
      contextList: info.contextList,
    });

    // Track content access when student clicks on content
    const currentUserId = getCurrentUserId();
    if (currentUserId) {
      trackContentAccess(currentUserId, info.content.id);
    }
  };

  const handleStartQuiz = (
    content: Content,
    contextList: Content[],
    level?: "Easy" | "Hard",
  ) => {
    console.log("Starting content quiz for:", content.title, "Level:", level);
    // Convert level to database format (lowercase)
    const dbLevel = level?.toLowerCase() as "easy" | "hard" | undefined;
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

  const handleStartTopicQuiz = (
    topicId: string,
    level: "Overview" | "Easy" | "Hard",
    topicName: string,
  ) => {
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

  const handleSelectMatchingActivity = (
    matchingId: string,
    matchingTitle: string,
  ) => {
    setSelectedMatchingActivity({ matchingId, matchingTitle });
  };

  const closeMatchingActivity = useCallback(() => {
    setSelectedMatchingActivity(null);
  }, []);

  const handleStartGroupMatching = (
    matchingId: string,
    matchingTitle: string,
  ) => {
    setSelectedMatchingActivity({ matchingId, matchingTitle });
  };

  const handleOpenOutlinePopup = (
    contentTitle?: string,
    contentId?: string,
  ) => {
    setOutlinePopupInfo({ isOpen: true, contentTitle, contentId });
    setCurrentContentId(contentId);
  };

  const [currentContentId, setCurrentContentId] = useState<
    string | undefined
  >();

  const handleProceedToCreativeWriting = (outlineData: any) => {
    setCreativeWritingInfo({
      isOpen: true,
      contentTitle: outlinePopupInfo.contentTitle,
      contentId: currentContentId,
      outlineData,
    });
  };

  const handleCloseOutlinePopup = () => {
    setOutlinePopupInfo({ isOpen: false });
  };

  const handleOpenEssayPopup = (contentTitle?: string, contentId?: string) => {
    setEssayPopupInfo({ isOpen: true, contentTitle, contentId });
  };

  // Check if there's an essay in progress
  const { data: draftEssay } = useQuery({
    queryKey: [
      `/api/writing-submissions/draft/${user?.id}/${essayPopupInfo.contentId}`,
    ],
    enabled: !!user?.id && !!essayPopupInfo.contentId,
    staleTime: 30000,
  });

  const handleCloseEssayPopup = () => {
    setEssayPopupInfo({ isOpen: false });
  };

  const handleCloseCreativeWriting = () => {
    setCreativeWritingInfo({ isOpen: false });
  };

  const handleBackToOutline = () => {
    // Close creative writing popup and open outline popup
    setCreativeWritingInfo({ isOpen: false });
    setOutlinePopupInfo({ 
      isOpen: true, 
      contentTitle: creativeWritingInfo.contentTitle,
      contentId: creativeWritingInfo.contentId 
    });
  };

  const handleCloseWritingContent = () => {
    setWritingContentInfo({ isOpen: false, content: null, contextList: [] });
  };

  const getSubtopics = (parentId: string) => {
    if (!allTopics) return [];
    return allTopics
      .filter((topic) => topic.parentid === parentId)
      .sort((a, b) => a.topic.localeCompare(b.topic));
  };

  const getTopicContent = (topicId: string) => {
    if (!allContent) return [];
    return allContent.filter((content) => content.topicid === topicId);
  };

  const isLoading = allTopicsLoading;

  if (isLoading) {
    return <WritingLoading />;
  }

  if (topicsError) {
    return <WritingError />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-blue-600 to-purple-700">
      <Header />
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          <WritingHeader onContentClick={handleContentClick} />

          <WritingGrid
            writingTopics={writingTopics}
            allTopics={allTopics}
            allContent={allContent}
            allImages={allImages}
            expandedTopicId={expandedTopicId}
            activeTopicId={activeTopicId}
            openContent={openContent}
            activeContentId={activeContentId}
            expandedGroupCards={expandedGroupCards}
            user={user}
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
            getTopicContent={getTopicContent}
            onOpenOutlinePopup={handleOpenOutlinePopup}
            onOpenEssayPopup={handleOpenEssayPopup}
            onSetCreativeWritingInfo={setCreativeWritingInfo}
          />

          <WritingModals
            selectedContentInfo={selectedContentInfo}
            quizContentId={quizContentId}
            isImagesLoading={isImagesLoading}
            onClosePopup={closePopup}
            findImageUrl={findImageUrl}
            topicQuizInfo={topicQuizInfo}
            onCloseTopicQuiz={closeTopicQuiz}
            topicMatchingInfo={topicMatchingInfo}
            selectedMatchingActivity={selectedMatchingActivity}
            onCloseTopicMatching={closeTopicMatching}
            onCloseMatchingActivity={closeMatchingActivity}
            onSelectMatchingActivity={handleSelectMatchingActivity}
            outlinePopupInfo={outlinePopupInfo}
            essayPopupInfo={essayPopupInfo}
            creativeWritingInfo={creativeWritingInfo}
            writingContentInfo={writingContentInfo}
            user={user}
            draftEssay={draftEssay}
            onCloseOutlinePopup={handleCloseOutlinePopup}
            onCloseEssayPopup={handleCloseEssayPopup}
            onCloseCreativeWriting={handleCloseCreativeWriting}
            onCloseWritingContent={handleCloseWritingContent}
            onBackToOutline={handleBackToOutline}
            onProceedToCreativeWriting={handleProceedToCreativeWriting}
            onContentChange={(newContent) => {
              if (selectedContentInfo) {
                setSelectedContentInfo((prev) => 
                  prev ? { ...prev, content: newContent } : null
                );
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default WritingPage;