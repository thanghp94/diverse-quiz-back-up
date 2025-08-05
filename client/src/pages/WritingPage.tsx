import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useContent, Content } from "@/hooks/useContent";
import { Header } from "@/components/shared";
import { useLocation } from "wouter";
import { trackContentAccess, getCurrentUserId } from "@/lib/contentTracking";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PenTool, FileText, Edit, Clock } from "lucide-react";
import {
  WritingHeader,
  WritingLoading,
  WritingError,
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

  // Force re-render state for progress buttons
  const [forceUpdate, setForceUpdate] = useState(0);

  // Listen for localStorage changes to update progress buttons
  useEffect(() => {
    const handleStorageChange = () => {
      setForceUpdate((prev) => prev + 1);
    };

    // Custom event for localStorage changes within the same tab
    const handleCustomStorageUpdate = () => {
      setForceUpdate((prev) => prev + 1);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("localStorageUpdate", handleCustomStorageUpdate);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("localStorageUpdate", handleCustomStorageUpdate);
    };
  }, []);

  // Custom function to set localStorage and trigger update
  const setLocalStorageWithUpdate = (key: string, value: string) => {
    localStorage.setItem(key, value);
    window.dispatchEvent(new CustomEvent("localStorageUpdate"));
  };
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
    // Don't open popup for writing content, just track access
    setActiveContentId(info.content.id);

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
    // Force update to refresh button colors
    setForceUpdate((prev) => prev + 1);
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
    // Force update to refresh button colors
    setForceUpdate((prev) => prev + 1);
  };

  const handleCloseCreativeWriting = () => {
    setCreativeWritingInfo({ isOpen: false });
    // Force update to refresh button colors
    setForceUpdate((prev) => prev + 1);
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

          {/* Simple 2-column writing prompts layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {writingContent.map((content) => (
              <div
                key={content.id}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
                onClick={() => handleContentClick({ content, contextList: writingContent })}
              >
                <h4 className="font-semibold text-white mb-2">{content.title}</h4>
                {content.prompt && (
                  <p className="text-white/80 text-sm line-clamp-3">{content.prompt}</p>
                )}
                <div className="mt-3 flex gap-2 flex-wrap" key={`buttons-${content.id}-${forceUpdate}`}>
                  {(() => {
                    // Check for creative writing progress - force re-evaluation with forceUpdate
                    if (!user?.id) return null; // Don't render buttons if user not loaded
                    
                    const outlineStorageKey = `creative_outline_${user.id}_${content.id}`;
                    const storyStorageKey = `creative_story_${user.id}_${content.id}`;
                    const outlineData = localStorage.getItem(outlineStorageKey);
                    const storyData = localStorage.getItem(storyStorageKey);
                    let hasCreativeProgress = false;

                    console.log(`Checking creative progress for content ${content.id}:`, { 
                      outlineData, 
                      storyData, 
                      outlineKey: outlineStorageKey, 
                      storyKey: storyStorageKey,
                      userId: user.id,
                      allLocalStorageKeys: Object.keys(localStorage).filter(key => key.includes('creative') || key.includes('academic'))
                    });

                    if (outlineData) {
                      try {
                        const parsed = JSON.parse(outlineData);
                        hasCreativeProgress = Object.values(parsed).some((val: any) => 
                          typeof val === 'string' && val.trim()
                        );
                        console.log(`Creative outline progress for ${content.id}:`, hasCreativeProgress, parsed);
                      } catch (error) {
                        console.error("Failed to parse creative outline data:", error);
                      }
                    }

                    if (!hasCreativeProgress && storyData) {
                      try {
                        const parsed = JSON.parse(storyData);
                        hasCreativeProgress = parsed.title?.trim() || parsed.story?.trim();
                        console.log(`Creative story progress for ${content.id}:`, hasCreativeProgress, parsed);
                      } catch (error) {
                        console.error("Failed to parse creative story data:", error);
                      }
                    }

                    return (
                      <Button
                        size="sm"
                        className={hasCreativeProgress 
                          ? "bg-green-600 hover:bg-green-700 text-white" 
                          : "bg-purple-600 hover:bg-purple-700 text-white"
                        }
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          if (hasCreativeProgress) {
                            // Load outline data and go directly to writing page
                            const outlineStorageKey = `creative_outline_${user?.id}_${content.id}`;
                            const savedOutlineData = localStorage.getItem(outlineStorageKey);
                            let outlineData = {};
                            if (savedOutlineData) {
                              try {
                                outlineData = JSON.parse(savedOutlineData);
                              } catch (error) {
                                console.error('Failed to parse outline data:', error);
                              }
                            }
                            setCreativeWritingInfo({
                              isOpen: true,
                              contentTitle: content.title,
                              contentId: content.id,
                              outlineData,
                            });
                          } else {
                            handleOpenOutlinePopup(content.title, content.id);
                          }
                        }}
                      >
                        <PenTool className="w-4 h-4 mr-1" />
                        {hasCreativeProgress && <Edit className="w-4 h-4 mr-1" />}
                        {hasCreativeProgress ? "Creative writing in progress" : "Creative"}
                      </Button>
                    );
                  })()}
                  
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleOpenEssayPopup(content.title, content.id);
                    }}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Academic essay
                  </Button>

                  {/* Academic essay progress indicator */}
                  {user?.id && (() => {
                    const storageKey = `academic_essay_${user.id}_${content.id}`;
                    const savedData = localStorage.getItem(storageKey);
                    console.log(`Checking academic progress for content ${content.id}:`, savedData);
                    if (savedData) {
                      try {
                        const parsed = JSON.parse(savedData);
                        console.log(`Academic essay parsed data for ${content.id}:`, parsed);
                        if (parsed.phase === "writing") {
                          return (
                            <Button
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleOpenEssayPopup(content.title, content.id);
                              }}
                              size="sm"
                              className="bg-orange-600 hover:bg-orange-700 text-white"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Writing in Progress
                            </Button>
                          );
                        } else if (
                          parsed.phase === "outline" ||
                          Object.values(parsed.outlineData || {}).some(
                            (val: any) => val && val.trim && val.trim(),
                          )
                        ) {
                          return (
                            <Button
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleOpenEssayPopup(content.title, content.id);
                              }}
                              size="sm"
                              variant="outline"
                              className="border-blue-500 text-blue-200 hover:bg-blue-600/20"
                            >
                              <Clock className="w-4 h-4 mr-1" />
                              Draft Saved
                            </Button>
                          );
                        }
                      } catch (error) {
                        console.error("Failed to parse saved essay data:", error);
                      }
                    }
                    return null;
                  })()}
                </div>
              </div>
            ))}
          </div>

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