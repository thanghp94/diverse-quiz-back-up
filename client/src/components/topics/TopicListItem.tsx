import React, { useState, useRef } from 'react';

// Global state for blocking content clicks when note button is clicked
let globalClickBlocked = false;
let globalClickBlockTimeout: NodeJS.Timeout | null = null;
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ChevronDown, ChevronUp, BookOpen, Play, HelpCircle, Shuffle, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Content } from "@/hooks/useContent";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useContentImage } from "@/hooks/useContentImage";
import { useContentMedia } from "@/hooks/useContentMedia";
import { useTopicMatching } from "@/hooks/useTopicMatching";
import { SubtopicMatchingButton, ParentTopicMatchingButton } from "@/components/matching";
import { ContentDifficultyIndicator } from "@/components/content";
import { ContentRatingButtons, ContentGroupCard, GroupedContentCard, ContentThumbnailGallery } from "@/components/content";
import { MarkdownRenderer } from "@/components/shared";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Note Button Component
interface NoteButtonProps {
  contentId: string;
  studentId: string;
  compact?: boolean;
}

const PersonalNoteContent: React.FC<{ contentId: string; studentId: string; onClose: () => void }> = ({ contentId, studentId, onClose }) => {
  const [noteText, setNoteText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing note
  const { data: existingRating } = useQuery<{ rating: string; personal_note?: string } | null>({
    queryKey: ['/api/content-ratings', studentId, contentId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/content-ratings/${studentId}/${contentId}`);
        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          throw new Error('Failed to fetch rating');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching rating:', error);
        return null;
      }
    },
  });

  // Update note text when data is loaded
  React.useEffect(() => {
    if (existingRating) {
      setNoteText(existingRating.personal_note || '');
    }
  }, [existingRating]);

  // Save note mutation
  const saveNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      const response = await fetch(`/api/content-ratings/${studentId}/${contentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personal_note: note
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Note saved",
        description: "Your personal note has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/content-ratings', studentId, contentId] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSaveNote = () => {
    setIsLoading(true);
    saveNoteMutation.mutate(noteText);
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-600 text-sm">
        Add your personal notes about this content. Only you can see these notes.
      </p>

      <div>
        <Label htmlFor="note-text" className="text-gray-700">Your Note</Label>
        <Textarea
          id="note-text"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Write your personal note here..."
          className="min-h-[100px] mt-2"
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
        <Button variant="outline" onClick={onClose} className="mb-2 sm:mb-0">
          Cancel
        </Button>
        <Button 
          onClick={handleSaveNote} 
          disabled={isLoading || saveNoteMutation.isPending}
        >
          {isLoading || saveNoteMutation.isPending ? "Saving..." : "Save Note"}
        </Button>
      </div>
    </div>
  );
};

const NoteButton: React.FC<NoteButtonProps & { onOpenNote: () => void }> = ({ contentId, studentId, compact = false, onOpenNote }) => {

  // Check if there's an existing note for visual indication
  const { data: existingRating } = useQuery<{ rating: string; personal_note?: string } | null>({
    queryKey: ['/api/content-ratings', studentId, contentId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/content-ratings/${studentId}/${contentId}`);
        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          throw new Error('Failed to fetch rating');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching rating:', error);
        return null;
      }
    },
  });

  const hasNote = existingRating?.personal_note && existingRating.personal_note.trim() !== '';

  return (
    <>
      <Button 
        variant="outline" 
        size={compact ? "sm" : "default"}
        className={cn(
          "text-white hover:bg-white/20 hover:text-white bg-transparent border-white/50",
          compact ? "px-2 py-1 h-6" : "px-2 py-2",
          hasNote && "bg-white/10 border-white/70"
        )}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();

          // Block all content clicks globally for a brief moment
          globalClickBlocked = true;
          if (globalClickBlockTimeout) {
            clearTimeout(globalClickBlockTimeout);
          }
          globalClickBlockTimeout = setTimeout(() => {
            globalClickBlocked = false;
          }, 100);

          onOpenNote();
        }}
      >
        <FileText className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
        {hasNote && <span className="ml-1 text-xs">*</span>}
      </Button>
    </>
  );
};

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

interface TopicListItemProps {
    topic: Topic;
    subtopics: Topic[];
    topicContent: Content[];
    allImages: Image[] | undefined;
    isExpanded: boolean;
    isActive: boolean;
    openContent: string[];
    onToggleTopic: (topicId: string) => void;
    onToggleContent: (contentKey: string) => void;
    onContentClick: (info: { content: Content; contextList: Content[] }) => void;
    onSubtopicClick: (topicId: string) => void;
    onStartQuiz: (content: Content, contextList: Content[], level: 'Easy' | 'Hard') => void;
    getTopicContent: (topicId: string) => Content[];
    onStartTopicQuiz: (topicId: string, level: 'Overview' | 'Easy' | 'Hard', topicName: string) => void;
    onStartTopicMatching: (topicId: string, topicName: string) => void;
    onStartGroupMatching: (matchingId: string, matchingTitle: string) => void;
    onToggleGroupCard: (groupCardId: string) => void;
    isGroupCardExpanded: (groupCardId: string) => boolean;
    activeContentId: string | null;
    customActions?: (content: Content) => React.ReactNode;
}

const getContentIcon = (content: any) => {
    if (content.videoid || content.videoid2) return <Play className="h-3 w-3" />;
    if (content.url) return <BookOpen className="h-3 w-3" />;
    return <BookOpen className="h-3 w-3" />;
};

// Local content thumbnail component for specific layout needs
const LocalContentThumbnail = ({ content, onClick, isGroupCard = false }: { content: any, onClick?: () => void, isGroupCard?: boolean }) => {
  const { data: imageUrl } = useContentImage(content.imageid);

  // Only show thumbnail if there's an imageid
  if (!content.imageid || !imageUrl) {
    return null;
  }

  // For group card thumbnails in the gallery, use same styling as normal content cards
  if (isGroupCard) {
    return (
      <div className="w-24 h-28 rounded-md overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={onClick}>
        <img 
          src={imageUrl} 
          alt={content.title} 
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="w-24 h-28 rounded-md overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={onClick}>
      <img 
        src={imageUrl} 
        alt={content.title} 
        className="w-full h-full object-cover"
      />
    </div>
  );
};

const getContentTypeColor = (content: any) => {
    if (content.videoid || content.videoid2) return 'bg-red-500/20 text-red-200';
    if (content.url) return 'bg-blue-500/20 text-blue-200';
    return 'bg-green-500/20 text-green-200';
};

const getSubtopicLabel = (parentTopic: string, index: number) => {
    const letter = parentTopic.charAt(0).toUpperCase();
    return `${letter}.${index + 1}`;
};

// Helper function to validate translation dictionary
const isValidTranslationDictionary = (dict: any): dict is Record<string, string> => {
  return dict && typeof dict === 'object' && !Array.isArray(dict) && 
         Object.values(dict).every(value => typeof value === 'string');
};

const formatDescription = (description: string) => {
    return description.split('\n').map((line, index) => <span key={index} className="text-[#f1f1fd]">
        {line}
        {index < description.split('\n').length - 1 && <br />}
      </span>);
};

// Shared ContentCard component
const ContentCard = ({ content, topicContent, onContentClick, onStartQuiz, customActions }: { 
  content: Content; 
  topicContent: Content[];
  onContentClick: (info: { content: Content; contextList: Content[] }) => void;
  onStartQuiz: (content: Content, contextList: Content[], level: 'Easy' | 'Hard') => void;
  customActions?: (content: Content) => React.ReactNode;
}) => {
  const { videoData, video2Data, videoEmbedUrl, video2EmbedUrl } = useContentMedia(content);
  const [videoPopupOpen, setVideoPopupOpen] = useState(false);

  const hasVideo1 = videoEmbedUrl && videoData;
  const hasVideo2 = video2EmbedUrl && video2Data;

  return (
    <>
      <div className="bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 rounded-lg p-3">
        <div className="flex items-start justify-between gap-2">
          <div
            onClick={() => {
              if (globalClickBlocked) return;
              onContentClick({
                content,
                contextList: topicContent
              });
            }}
            className="flex-grow cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <LocalContentThumbnail 
                content={content} 
                onClick={() => {
                  if (globalClickBlocked) return;
                  onContentClick({
                    content,
                    contextList: topicContent
                  });
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-base font-medium leading-tight flex-1 min-w-0 text-left" style={{ color: '#ffff78e6' }}>{content.title}</h4>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="text-black hover:bg-white/20 hover:text-black bg-white/90 border-white/50 text-xs px-1 py-0.5 h-5 opacity-60 hover:opacity-80" title="Quiz">
                          <HelpCircle className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          console.log('Easy Quiz clicked for content:', content.id, content.title);
                          onStartQuiz(content, topicContent, 'Easy');
                        }}>
                          Easy Quiz
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          console.log('Hard Quiz clicked for content:', content.id, content.title);
                          onStartQuiz(content, topicContent, 'Hard');
                        }}>
                          Hard Quiz
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {(hasVideo1 || hasVideo2) && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-white hover:bg-red-500/20 hover:text-white bg-red-500/10 border-red-400/50 text-xs px-1 py-0.5 h-5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVideoPopupOpen(true);
                        }}
                        title={(hasVideo1 && hasVideo2) ? '2 Videos' : 'Video'}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    )}
                    {customActions && customActions(content)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video popup */}
      <Dialog open={videoPopupOpen} onOpenChange={setVideoPopupOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 bg-gray-900 border-gray-700">
          <VisuallyHidden>
            <DialogTitle>Video Content</DialogTitle>
            <DialogDescription>Video content for {content.title}</DialogDescription>
          </VisuallyHidden>
          <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
            <h3 className="text-white text-lg font-medium truncate mr-4">{content.title}</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setVideoPopupOpen(false)}
              className="text-white hover:bg-white/20 flex-shrink-0"
            >
              ✕
            </Button>
          </div>
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {hasVideo1 && (
              <div>
                {videoData?.video_name && (
                  <h4 className="text-white font-medium mb-3 text-base">{videoData.video_name}</h4>
                )}
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe 
                    className="w-full h-full" 
                    src={videoEmbedUrl} 
                    title={videoData?.video_name || 'Video 1'} 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  />
                </div>
              </div>
            )}
            {hasVideo2 && (
              <div>
                {video2Data?.video_name && (
                  <h4 className="text-white font-medium mb-3 text-base">{video2Data.video_name}</h4>
                )}
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe 
                    className="w-full h-full" 
                    src={video2EmbedUrl} 
                    title={video2Data?.video_name || 'Video 2'} 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Component to display content organized by contentgroup
const GroupedContentDisplay = ({ 
  topicId, 
  topicContent, 
  onContentClick, 
  onStartQuiz,
  onStartGroupMatching,
  activeContentId,
  customActions
}: {
  topicId: string;
  topicContent: Content[];
  onContentClick: (info: { content: Content; contextList: Content[] }) => void;
  onStartQuiz: (content: Content, contextList: Content[], level: 'Easy' | 'Hard') => void;
  onStartGroupMatching: (matchingId: string, matchingTitle: string) => void;
  activeContentId: string | null;
  customActions?: (content: Content) => React.ReactNode;
}) => {
  const [selectedContentGroup, setSelectedContentGroup] = useState<{
    groupName: string;
    content: Content[];
  } | null>(null);

  // Organize content according to specifications:
  // 1. All content with prompt != "groupcard" shows in Individual Content section
  // 2. Content with prompt = "groupcard" becomes group headers
  // 3. Content with contentgroup = groupContent.id becomes related items for group expansion
  const organizedContent = React.useMemo(() => {
    const ungroupedContent: Content[] = [];
    const groupCards: Content[] = [];
    const groupedContentMap: { [groupId: string]: Content[] } = {};

    // First, separate all content by type
    const allUngroupedContent: Content[] = [];
    const allGroupCards: Content[] = [];

    topicContent.forEach(content => {
      if (content.prompt === "groupcard") {
        // This is a group header card - always goes to group cards
        allGroupCards.push(content);
      } else {
        // This is regular content - add to individual content regardless of contentgroup
        allUngroupedContent.push(content);
        
        // If it has a contentgroup, also add it to the grouped content map for group expansion
        if (content.contentgroup && content.contentgroup.trim() !== '') {
          if (!groupedContentMap[content.contentgroup]) {
            groupedContentMap[content.contentgroup] = [];
          }
          groupedContentMap[content.contentgroup].push(content);
        }
      }
    });

    // Sort ungrouped content by order, with NULL/undefined values treated as very high numbers so they appear last among ungrouped
    allUngroupedContent.sort((a, b) => {
      const aOrder = (a.order !== null && a.order !== undefined && a.order !== '') ? parseInt(a.order) : 999999;
      const bOrder = (b.order !== null && b.order !== undefined && b.order !== '') ? parseInt(b.order) : 999999;
      return aOrder - bOrder;
    });

    // Sort group cards by order, with NULL/undefined values treated as very high numbers
    allGroupCards.sort((a, b) => {
      const aOrder = (a.order !== null && a.order !== undefined && a.order !== '') ? parseInt(a.order) : 999999;
      const bOrder = (b.order !== null && b.order !== undefined && b.order !== '') ? parseInt(b.order) : 999999;
      return aOrder - bOrder;
    });

    // Sort grouped content within each group
    Object.keys(groupedContentMap).forEach(groupId => {
      groupedContentMap[groupId].sort((a, b) => {
        const aOrder = (a.order !== null && a.order !== undefined && a.order !== '') ? parseInt(a.order) : 999999;
        const bOrder = (b.order !== null && b.order !== undefined && b.order !== '') ? parseInt(b.order) : 999999;
        return aOrder - bOrder;
      });
    });

    ungroupedContent.push(...allUngroupedContent);
    groupCards.push(...allGroupCards);

    return { ungroupedContent, groupCards, groupedContentMap };
  }, [topicContent]);

  const handleContentGroupClick = (groupName: string, content: Content[]) => {
    setSelectedContentGroup({ groupName, content });
  };

  const handleGroupContentClick = (content: Content, contextList: Content[]) => {
    setSelectedContentGroup(null);
    onContentClick({ content, contextList });
  };

  const getGroupDescription = (groupName: string): string => {
    switch (groupName.toLowerCase()) {
      case 'return of kings':
        return 'Real kings in history that was not in power but due to some unexpected event, return to the throne and how they deal with their kingdom afterward';
      case 'returns of characters':
        return 'Some characters in books, movies that also had to hide away but return through their bravery or unexpected events.';
      case 'speech by famous people':
        return 'Notable speeches delivered by influential historical figures.';
      default:
        return `Content related to ${groupName}`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Display all content first (content with prompt != "groupcard") */}
      {organizedContent.ungroupedContent.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-white/80 text-sm font-medium">Content</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {organizedContent.ungroupedContent.map((content: Content) => (
              <div key={content.id} className={cn(
                "transition-all duration-200 rounded-lg",
                activeContentId === content.id && "ring-4 ring-yellow-400/80 bg-yellow-500/20 shadow-lg shadow-yellow-400/20"
              )}>
                <ContentCard 
                  content={content} 
                  topicContent={topicContent}
                  onContentClick={onContentClick}
                  onStartQuiz={onStartQuiz}
                  customActions={customActions}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Display grouped content cards (content with prompt = "groupcard" and their related items) */}
      {organizedContent.groupCards.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-white/80 text-sm font-medium">Grouped Content</h4>
          <div className="space-y-4">
            {organizedContent.groupCards.map((groupContent: Content) => {
              const relatedContent: Content[] = organizedContent.groupedContentMap[groupContent.id] || [];
              return (
                <GroupedContentCard
                  key={groupContent.id}
                  groupContent={groupContent}
                  groupedContent={relatedContent}
                  onContentClick={onContentClick}
                  onStartQuiz={onStartQuiz}
                  activeContentId={activeContentId}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Content Group Popup */}
      {selectedContentGroup && (
        <ContentGroupPopup
          isOpen={true}
          onClose={() => setSelectedContentGroup(null)}
          groupName={selectedContentGroup.groupName}
          content={selectedContentGroup.content}
          onContentClick={handleGroupContentClick}
        />
      )}
    </div>
  );
};

// Component to organize content by matching activities (kept for compatibility)
const TopicContentWithMatching = ({ 
  topicId, 
  topicContent, 
  onContentClick, 
  onStartQuiz 
}: {
  topicId: string;
  topicContent: Content[];
  onContentClick: (info: { content: Content; contextList: Content[] }) => void;
  onStartQuiz: (content: Content, contextList: Content[], level: 'Easy' | 'Hard') => void;
}) => {
  const [expandedMatching, setExpandedMatching] = React.useState<string | null>(null);

  // Fetch matching activities for this topic
  const { data: matchingActivities } = useQuery({
    queryKey: ['matchingByTopic', topicId],
    queryFn: async () => {
      const response = await fetch(`/api/matching/topic/${topicId}`);
      if (!response.ok) throw new Error('Failed to fetch matching activities');
      return response.json();
    },
  });

  // Debug log
  React.useEffect(() => {
    if (matchingActivities) {
      console.log(`Topic ${topicId} matching activities:`, matchingActivities);
      console.log(`Topic ${topicId} content:`, topicContent);
    }
  }, [matchingActivities, topicContent, topicId]);

  // Enhanced function to get content IDs from prompt
  const getContentIdsFromPrompt = (matching: any) => {
    const contentIds = new Set<string>();

    // Check all prompt fields
    const promptFields = ['prompt', 'prompt1', 'prompt2', 'prompt3', 'prompt4', 'prompt5', 'prompt6'];

    promptFields.forEach(field => {
      if (matching[field]) {
        const promptText = matching[field].toString();

        // Try to match UUID patterns (both full and short)
        const uuidPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}|[a-f0-9]{8}/gi;
        const matches = promptText.match(uuidPattern) || [];
        matches.forEach((id: string) => contentIds.add(id));

        // Also try to match content by title or partial text match
        topicContent.forEach(content => {
          if (promptText.toLowerCase().includes(content.title?.toLowerCase() || '')) {
            contentIds.add(content.id);
          }
        });
      }
    });

    return Array.from(contentIds);
  };

  // Group content by matching activities
  const organizedContent = React.useMemo(() => {
    if (!matchingActivities?.length || !topicContent?.length) {
      return {
        ungrouped: topicContent || [],
        grouped: []
      };
    }

    const grouped: Array<{
      matching: any;
      content: Content[];
    }> = [];

    const usedContentIds = new Set<string>();

    // For each matching activity, find associated content
    matchingActivities.forEach((matching: any) => {
      const contentIds = getContentIdsFromPrompt(matching);
      console.log(`Matching ${matching.id} content IDs:`, contentIds);

      const associatedContent = topicContent.filter(content => 
        contentIds.includes(content.id)
      );

      console.log(`Matching ${matching.id} associated content:`, associatedContent);

      // Even if no content is directly associated, still show the matching activity
      // This way users can see that matching activities exist for this topic
      grouped.push({
        matching,
        content: associatedContent
      });

      associatedContent.forEach(content => usedContentIds.add(content.id));
    });

    // Remaining content that wasn't grouped
    const ungrouped = topicContent.filter(content => !usedContentIds.has(content.id));

    console.log(`Topic ${topicId} organized:`, { ungrouped: ungrouped.length, grouped: grouped.length });
    return { ungrouped, grouped };
  }, [matchingActivities, topicContent, topicId]);



  return (
    <div className="space-y-4">
      {/* Debug info */}
      {matchingActivities && matchingActivities.length > 0 && (
        <div className="text-xs text-gray-400 mb-2">
          Found {matchingActivities.length} matching activities for this topic
        </div>
      )}

      {/* Ungrouped content at the top */}
      {organizedContent.ungrouped.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-white/80 text-sm font-medium">Content</h4>
          <div className="grid grid-cols-2 gap-3">
            {organizedContent.ungrouped.map(content => (
              <ContentCard 
                key={content.id} 
                content={content} 
                topicContent={topicContent}
                onContentClick={onContentClick}
                onStartQuiz={onStartQuiz}
              />
            ))}
          </div>
        </div>
      )}

      {/* Matching activity section */}
      {organizedContent.grouped.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-white/80 text-sm font-medium">Matching Activities</h4>

          {/* Matching activity cards in 2-column layout */}
          <div className="grid grid-cols-2 gap-3">
            {organizedContent.grouped.map(({ matching, content }) => (
              <div
                key={matching.id}
                className={cn(
                  "cursor-pointer bg-blue-500/10 border border-blue-400/30 hover:bg-blue-500/20 transition-all duration-200 rounded-lg p-3",
                  expandedMatching === matching.id && "ring-2 ring-blue-400/50"
                )}
                onClick={() => setExpandedMatching(expandedMatching === matching.id ? null : matching.id)}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="bg-blue-500/30 p-2 rounded-lg border border-blue-400/40">
                    <Shuffle className="h-5 w-5 text-blue-200" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white/90 text-sm font-medium leading-tight">
                      {matching.topic || matching.description || matching.subject || 'Matching Activity'}
                    </h4>
                    <p className="text-white/60 text-xs mt-1">
                      {content.length > 0 ? `${content.length} content items` : 'Click to start'}
                    </p>
                    <Badge variant="outline" className="border-blue-300/30 text-blue-200 text-xs mt-2">
                      Matching
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Expanded content for selected matching activity - breaks out of grid */}
          {expandedMatching && (
            <div className="mt-4 p-4 bg-blue-500/5 border border-blue-400/20 rounded-lg">
              {(() => {
                const selectedGroup = organizedContent.grouped.find(g => g.matching.id === expandedMatching);
                if (!selectedGroup) return null;

                return (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-white/90 font-medium">
                        {selectedGroup.matching.topic || selectedGroup.matching.description || 'Matching Activity Content'}
                      </h5>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedMatching(null)}
                        className="text-white/60 hover:text-white"
                      >
                        Collapse
                      </Button>
                    </div>

                    {selectedGroup.content.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {selectedGroup.content.map(contentItem => (
                          <ContentCard 
                            key={contentItem.id} 
                            content={contentItem} 
                            topicContent={topicContent}
                            onContentClick={onContentClick}
                            onStartQuiz={onStartQuiz}
                            customActions={undefined}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-white/60 text-sm">
                          No specific content items are linked to this matching activity.
                        </p>
                        <p className="text-white/60 text-xs mt-1">
                          The activity may use content from multiple topics or external sources.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TopicListItem = ({
    topic,
    subtopics,
    topicContent,
    allImages,
    isExpanded,
    isActive,
    openContent,
    onToggleTopic,
    onToggleContent,
    onContentClick,
    onSubtopicClick,
    onStartQuiz,
    getTopicContent,
    onStartTopicQuiz,
    onStartTopicMatching,
    onStartGroupMatching,
    onToggleGroupCard,
    isGroupCardExpanded,
    activeContentId,
    customActions
}: TopicListItemProps) => {
    const { matchingActivities, hasMatchingActivities, isLoading: isMatchingLoading } = useTopicMatching(topic.id);

  // Fetch content ratings for filtering
  const { data: contentRatings } = useQuery({
    queryKey: ['/api/content-ratings/GV0002'],
    queryFn: async () => {
      const response = await fetch('/api/content-ratings/GV0002');
      if (!response.ok) return [];
      return response.json();
    },
  });

    let topicImageUrl: string | undefined | null = null;
    if (allImages && topicContent.length > 0) {
      for (const content of topicContent) {
        if (content.imageid) {
          const image = allImages.find(img => img.id === content.imageid && img.default === 'Yes');
          if (image && image.imagelink) {
            topicImageUrl = image.imagelink;
            break;
          }
        }
      }
    }

    return (
      <div
        className={cn(
          "bg-white/10 backdrop-blur-lg border-white/20 rounded-lg overflow-hidden border-b-0 transition-all duration-300",
          isExpanded ? "md:col-span-2" : "md:col-span-1",
          isActive && "ring-4 ring-yellow-400/80 bg-yellow-500/20 border-yellow-400/70 shadow-lg shadow-yellow-400/20"
        )}
      >
        <div
          className={cn(
            "flex items-start p-3 text-white w-full text-left cursor-pointer transition-colors hover:bg-white/5",
            isExpanded && "bg-white/5"
          )}
          onClick={() => onToggleTopic(topic.id)}
        >
          {topicImageUrl && (
            <img src={topicImageUrl} alt={topic.topic} className="w-16 h-16 object-cover rounded-md mr-4 flex-shrink-0" />
          )}
          <div className="flex-grow flex items-start justify-between">
            <div className="w-full">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <CardTitle className="text-white text-2xl font-bold">{topic.topic}</CardTitle>

                  {topic.challengesubject && (
                    <Badge variant="outline" className="border-white/30 text-white/70 text-sm">
                      {topic.challengesubject}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {/* Show parent topic matching button if this is a parent topic (no parentid) */}
                  {!topic.parentid && (
                    <ParentTopicMatchingButton 
                      parentTopicId={topic.id} 
                      parentTopicName={topic.topic} 
                      onStartTopicMatching={onStartTopicMatching} 
                    />
                  )}
                  {/* Show individual topic matching button if this topic has its own activities */}
                  {hasMatchingActivities && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white/70 hover:bg-white/20 hover:text-white h-6 w-6 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartTopicMatching(topic.id, topic.topic);
                      }}
                    >
                      <Shuffle className="h-4 w-4" />
                      <span className="sr-only">Start Matching for {topic.topic}</span>
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-white/70 hover:bg-white/20 hover:text-white h-6 w-6 flex-shrink-0">
                        <HelpCircle className="h-4 w-4" />
                        <span className="sr-only">Start Quiz for {topic.topic}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => onStartTopicQuiz(topic.id, 'Overview', topic.topic)}>
                        Overview Quiz
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStartTopicQuiz(topic.id, 'Easy', topic.topic)}>
                        Easy Quiz
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStartTopicQuiz(topic.id, 'Hard', topic.topic)}>
                        Hard Quiz
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <ChevronDown className={cn("h-5 w-5 text-white/80 shrink-0 transition-transform duration-200", isExpanded && "rotate-180")} />
                </div>
              </div>
              {topic.short_summary && (
                <p className="text-white/80 text-sm font-normal">{formatDescription(topic.short_summary)}</p>
              )}
            </div>
          </div>
        </div>
        {isExpanded && (
          <div className="px-3 pb-3 pt-1">
            <div className="space-y-1">
              {topicContent.length > 0 && (
                <GroupedContentDisplay 
                  topicId={topic.id}
                  topicContent={topicContent}
                  onContentClick={onContentClick}
                  onStartQuiz={onStartQuiz}
                  onStartGroupMatching={onStartGroupMatching}
                  activeContentId={activeContentId}
                  customActions={customActions}
                />
              )}

              {subtopics.length > 0 && (
                <div className="mt-2">
                  {/* Two-column responsive layout for subtopics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {subtopics.map((subtopic, index) => {
                      const subtopicContent = getTopicContent(subtopic.id);
                      const isExpanded = openContent.includes(`subtopic-${subtopic.id}`);
                      return (
                        <div key={subtopic.id} className={cn(
                          "bg-white/5 border border-white/20 rounded-lg px-2 pt-2 pb-1 transition-all duration-200",
                          isExpanded && "md:col-span-2" // Full width when expanded
                        )}>
                          <div 
                            className="flex items-center justify-between cursor-pointer py-1"
                            onClick={() => onToggleContent(`subtopic-${subtopic.id}`)}
                          >
                            <div className="flex-grow">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-base font-bold text-center text-[#ffff78e6]">{subtopic.topic}</span>
                              </div>
                              {subtopic.short_summary && <p className="text-white/60 text-xs ml-4">{formatDescription(subtopic.short_summary)}</p>}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <SubtopicMatchingButton 
                                topicId={subtopic.id} 
                                topicName={subtopic.topic}
                                onStartTopicMatching={onStartTopicMatching}
                              />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-white/70 hover:bg-white/20 hover:text-white h-6 w-6" onClick={(e) => e.stopPropagation()}>
                                        <HelpCircle className="h-4 w-4" />
                                        <span className="sr-only">Start Quiz for {subtopic.topic}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem onClick={() => onStartTopicQuiz(subtopic.id, 'Overview', subtopic.topic)}>Overview Quiz</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onStartTopicQuiz(subtopic.id, 'Easy', subtopic.topic)}>Easy Quiz</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onStartTopicQuiz(subtopic.id, 'Hard', subtopic.topic)}>Hard Quiz</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <ChevronDown className={cn("h-4 w-4 text-white/80 transition-transform duration-200", isExpanded && "rotate-180")} />
                            </div>
                          </div>
                          {subtopicContent.length > 0 && isExpanded && (
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                              {(() => {
                                // Filter out content that belongs to groups (will be shown in group expansion)
                                const displayableContent = subtopicContent.filter(content => {
                                  const belongsToGroup = subtopicContent.some(item => 
                                    item.prompt === "groupcard" && content.contentgroup === item.id && content.id !== item.id
                                  );
                                  return !belongsToGroup;
                                });

                                // Sort displayable content with group cards at end
                                const sortedContent = displayableContent.sort((a, b) => {
                                  const isGroupCardA = a.prompt === "groupcard";
                                  const isGroupCardB = b.prompt === "groupcard";

                                  // Group cards always go to the end
                                  if (isGroupCardA && !isGroupCardB) return 1;
                                  if (!isGroupCardA && isGroupCardB) return -1;

                                  // For non-group cards, sort by order then title
                                  if (!isGroupCardA && !isGroupCardB) {
                                    const orderA = (a.order && a.order !== '') ? parseInt(a.order) : 999999;
                                    const orderB = (b.order && b.order !== '') ? parseInt(b.order) : 999999;

                                    if (orderA !== orderB) {
                                      return orderA - orderB;
                                    }
                                  }

                                  // For items with same order or both group cards, use title for stable sort
                                  const titleA = (a.title || '').toLowerCase();
                                  const titleB = (b.title || '').toLowerCase();
                                  return titleA.localeCompare(titleB);
                                });

                                return sortedContent;
                              })()
                                .map(content => {
                                const SubtopicContentCard = () => {
                                  const { videoData, video2Data, videoEmbedUrl, video2EmbedUrl } = useContentMedia(content);
                                  const [videoPopupOpen, setVideoPopupOpen] = useState(false);
                                  const [selectedGroupVideo, setSelectedGroupVideo] = useState<Content | null>(null);
                                  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
                                  const [noteDialogContentId, setNoteDialogContentId] = useState<string>('');

                                  const hasVideo1 = videoEmbedUrl && videoData;
                                  const hasVideo2 = video2EmbedUrl && video2Data;

                                  // Check if this content is a group card and find related content
                                  const isGroupCard = content.prompt === "groupcard";
                                  const isGroupExpanded = isGroupCard ? isGroupCardExpanded(content.id) : false;
                                  const groupedContent = isGroupCard ? 
                                    subtopicContent
                                      .filter(item => item.contentgroup === content.id && item.id !== content.id)
                                      .sort((a, b) => {
                                        const orderA = parseInt(a.order || '999999');
                                        const orderB = parseInt(b.order || '999999');
                                        return orderA - orderB;
                                      }) : 
                                    [];

                                  return (
                                    <>
                                      <div className={cn(
                                        "bg-white/5 border border-white/20 hover:bg-white/10 transition-all duration-200 rounded-lg p-3 relative",
                                        isGroupCard && "bg-gradient-to-br from-yellow-600/25 via-orange-600/25 to-amber-600/25 border-yellow-400/60 shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20 hover:border-yellow-400/80 transform hover:scale-[1.02] z-10",
                                        isGroupCard && isGroupExpanded && "col-span-2 ring-2 ring-yellow-400/40 z-20",
                                        !isGroupCard && "z-5",
                                        activeContentId === content.id && "ring-4 ring-yellow-400/80 bg-yellow-500/20 border-yellow-400/70 shadow-lg shadow-yellow-400/20"
                                      )}>
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-grow cursor-pointer">
                                            {isGroupCard ? (
                                              <div 
                                                className="w-full"
                                                onClick={() => onToggleGroupCard(content.id)}
                                              >
                                                {/* Title with action buttons for group cards */}
                                                <div className="flex items-center justify-between gap-2 mb-3">
                                                  {/* Buttons on far left */}
                                                  <div className="flex items-center gap-1">
                                                    {content.parentid && (
                                                      <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="text-yellow-200 hover:bg-yellow-500/30 bg-yellow-500/20 border-yellow-400/40 text-xs px-1 py-0.5 h-5"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          onStartGroupMatching(content.parentid!, content.title || 'Group Match');
                                                        }}
                                                        title="Match"
                                                      >
                                                        <Shuffle className="h-3 w-3" />
                                                      </Button>
                                                    )}
                                                    <Button 
                                                      variant="outline" 
                                                      size="sm" 
                                                      className="text-yellow-200 hover:bg-yellow-500/30 bg-yellow-500/20 border-yellow-400/40 text-xs px-1 py-0.5 h-5"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        onStartQuiz(content, subtopicContent, 'Easy');
                                                      }}
                                                      title="Quiz"
                                                    >
                                                      <HelpCircle className="h-3 w-3" />
                                                    </Button>
                                                  </div>

                                                  {/* Centered title */}
                                                  <div className="flex-1 text-center">
                                                    <h4 className="text-base font-medium leading-tight" style={{ color: '#ffff78e6' }}>{content.title}</h4>
                                                  </div>

                                                  {/* Empty div for balance */}
                                                  <div className="w-[42px]"></div>
                                                </div>

                                                {/* Thumbnail Gallery for Group Cards - hidden when expanded */}
                                                {!isGroupExpanded && (
                                                  <ContentThumbnailGallery 
                                                    groupedContent={groupedContent}
                                                    onContentClick={onContentClick}
                                                  />
                                                )}

                                                {/* Description at bottom for group cards - hidden when expanded */}
                                                {!isGroupExpanded && content.short_description && (
                                                  <div className="text-white/60 text-sm leading-relaxed mt-1 text-center">
                                                    <MarkdownRenderer 
                                                      className="text-sm leading-relaxed"
                                                      translationDictionary={isValidTranslationDictionary(content.translation_dictionary) ? content.translation_dictionary : null}
                                                      textColor="text-white/60"
                                                      tooltipStyle="dark"
                                                    >
                                                      {content.short_description}
                                                    </MarkdownRenderer>
                                                  </div>
                                                )}
                                              </div>
                                            ) : (
                                              <div 
                                                className="flex items-center gap-2"
                                                onClick={() => onContentClick({
                                                  content,
                                                  contextList: subtopicContent
                                                })}
                                              >
                                                <LocalContentThumbnail 
                                                  content={content} 
                                                  isGroupCard={isGroupCard}
                                                  onClick={() => onContentClick({
                                                    content,
                                                    contextList: subtopicContent
                                                  })}
                                                />
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center justify-between gap-2 mb-2">
                                                    <h4 className="text-base font-medium leading-tight flex-1 min-w-0 text-left" style={{ color: '#ffff78e6' }}>{content.title}</h4>
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                      <ContentRatingButtons 
                                                        key={`${content.id}-rating`}
                                                        contentId={content.id}
                                                        compact={true}
                                                        studentId={localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).id : 'GV0002'}
                                                      />
                                                      <NoteButton
                                                        contentId={content.id}
                                                        studentId={localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).id : 'GV0002'}
                                                        compact={true}
                                                        onOpenNote={() => {
                                                          setNoteDialogContentId(content.id);
                                                          setNoteDialogOpen(true);
                                                        }}
                                                      />
                                                      {(hasVideo1 || hasVideo2) && (
                                                        <Button 
                                                          variant="outline" 
                                                          size="sm" 
                                                          className="text-white hover:bg-red-500/20 hover:text-white bg-red-500/10 border-red-400/50 text-xs px-2 py-1 h-6"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setVideoPopupOpen(true);
                                                          }}
                                                        >
                                                          <Play className="h-3 w-3 mr-1" />
                                                          {(hasVideo1 && hasVideo2) ? '2 Videos' : 'Video'}
                                                        </Button>
                                                      )}
                                                      <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                          <Button variant="outline" size="sm" className="text-black hover:bg-white/20 hover:text-black bg-white/90 border-white/50 text-xs px-1 py-0.5 h-5 opacity-60 hover:opacity-80">
                                                            Quiz
                                                          </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                          <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            onStartQuiz(content, subtopicContent, 'Easy');
                                                          }}>
                                                            Easy Quiz
                                                          </DropdownMenuItem>
                                                          <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            onStartQuiz(content, subtopicContent, 'Hard');
                                                          }}>
                                                            Hard Quiz
                                                          </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                      </DropdownMenu>
                                                      {/* Custom actions not available in this scope */}
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <CompactContentDifficultyIndicator contentId={content.id} />
                                                  </div>
                                                  {content.short_description && (
                                                    <div className="text-white/60 text-sm leading-relaxed">
                                                      <MarkdownRenderer 
                                                        className="text-sm leading-relaxed"
                                                        translationDictionary={isValidTranslationDictionary(content.translation_dictionary) ? content.translation_dictionary : null}
                                                        textColor="text-white/60"
                                                        tooltipStyle="dark"
                                                      >
                                                        {content.short_description}
                                                      </MarkdownRenderer>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>



                                        {/* Inline Grouped Content Expansion - Responsive Layout */}
                                        {isGroupCard && groupedContent.length > 0 && isGroupExpanded && (
                                          <div className="mt-3 pt-3 border-t border-purple-400/30">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                  {groupedContent.map((groupItem) => (
                                                    <div key={groupItem.id} className={cn(
                                                      "bg-white/5 border border-white/20 hover:bg-white/10 transition-all duration-200 rounded-lg p-3 cursor-pointer",
                                                      activeContentId === groupItem.id && "ring-4 ring-yellow-400/80 bg-yellow-500/20 border-yellow-400/70 shadow-lg shadow-yellow-400/20"
                                                    )}
                                                    onClick={() => onContentClick({
                                                      content: groupItem,
                                                      contextList: [...subtopicContent]
                                                    })}
                                                    >
                                                      <div className="flex items-start gap-3">
                                                        <div onClick={(e) => e.stopPropagation()}>
                                                          <LocalContentThumbnail 
                                                            content={groupItem} 
                                                            isGroupCard={true}
                                                            onClick={() => onContentClick({
                                                              content: groupItem,
                                                              contextList: [...subtopicContent]
                                                            })}
                                                          />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                          <div className="flex items-center justify-between gap-2 mb-2">
                                                            <h4 
                                                              className="text-sm font-medium leading-tight flex-1 min-w-0"
                                                              style={{ color: '#ffff78e6' }}
                                                            >
                                                              {groupItem.title}
                                                            </h4>
                                                            <div 
                                                              className="flex items-center gap-1 flex-shrink-0" 
                                                              onPointerDown={(e) => e.stopPropagation()}
                                                              onClick={(e) => e.stopPropagation()}
                                                              onMouseDown={(e) => e.stopPropagation()}
                                                            >
                                                              <ContentRatingButtons 
                                                                key={`${groupItem.id}-inline-rating`}
                                                                contentId={groupItem.id}
                                                                compact={true}
                                                                studentId={localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).id : 'GV0002'}
                                                              />
                                                              <NoteButton
                                                                contentId={groupItem.id}
                                                                studentId={localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).id : 'GV0002'}
                                                                compact={true}
                                                                onOpenNote={() => {
                                                                  setNoteDialogContentId(groupItem.id);
                                                                  setNoteDialogOpen(true);
                                                                }}
                                                              />
                                                              {((groupItem.videoid && groupItem.videoid.trim()) || (groupItem.videoid2 && groupItem.videoid2.trim())) && (
                                                                <Button 
                                                                  variant="outline" 
                                                                  size="sm" 
                                                                  className="text-white hover:bg-red-500/20 hover:text-white bg-red-500/10 border-red-400/50 text-xs px-1 py-0.5 h-5"
                                                                  onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setVideoPopupOpen(true);
                                                                    setSelectedGroupVideo(groupItem);
                                                                  }}
                                                                >
                                                                  <Play className="h-2 w-2 mr-0.5" />
                                                                  Video{((groupItem.videoid && groupItem.videoid.trim()) && (groupItem.videoid2 && groupItem.videoid2.trim())) ? 's' : ''}
                                                                </Button>
                                                              )}
                                                              <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                  <Button variant="outline" size="sm" className="text-black hover:bg-white/20 hover:text-black bg-white/90 border-white/50 text-xs px-1 py-0.5 h-5">
                                                                    Quiz
                                                                  </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent>
                                                                  <DropdownMenuItem onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onStartQuiz(groupItem, subtopicContent, 'Easy');
                                                                  }}>
                                                                    Easy Quiz
                                                                  </DropdownMenuItem>
                                                                  <DropdownMenuItem onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onStartQuiz(groupItem, subtopicContent, 'Hard');
                                                                  }}>
                                                                    Hard Quiz
                                                                  </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                              </DropdownMenu>
                                                            </div>
                                                          </div>
                                                          <div className="flex items-center gap-2 mb-2">
                                                            <CompactContentDifficultyIndicator contentId={groupItem.id} />
                                                          </div>
                                                          {groupItem.short_description && (
                                                            <div className="text-white/60 text-xs leading-relaxed">
                                                              <MarkdownRenderer 
                                                                className="text-xs leading-relaxed"
                                                                translationDictionary={isValidTranslationDictionary(groupItem.translation_dictionary) ? groupItem.translation_dictionary : null}
                                                                textColor="text-white/60"
                                                                tooltipStyle="dark"
                                                              >
                                                                {groupItem.short_description}
                                                              </MarkdownRenderer>
                                                            </div>
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Video Popup */}
                                        <Dialog open={videoPopupOpen} onOpenChange={(open) => {
                                          setVideoPopupOpen(open);
                                          if (!open) setSelectedGroupVideo(null);
                                        }}>
                                          <DialogContent className="max-w-5xl max-h-[90vh] p-0 bg-gray-900 border-gray-700">
                                            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
                                              <h3 className="text-white text-lg font-medium truncate mr-4">
                                                {selectedGroupVideo ? selectedGroupVideo.title : content.title}
                                              </h3>
                                              <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => {
                                                  setVideoPopupOpen(false);
                                                  setSelectedGroupVideo(null);
                                                }}
                                                className="text-white hover:bg-white/20 flex-shrink-0"
                                              >
                                                ✕
                                              </Button>
                                            </div>
                                            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                                              {(selectedGroupVideo || hasVideo1 || hasVideo2) && (() => {
                                                // Get video data for the current video content
                                                const currentContent = selectedGroupVideo || content;
                                                const { videoData: currentVideoData, video2Data: currentVideo2Data, videoEmbedUrl: currentVideoEmbedUrl, video2EmbedUrl: currentVideo2EmbedUrl } = useContentMedia(currentContent);
                                                const currentHasVideo1 = currentVideoEmbedUrl && currentVideoData;
                                                const currentHasVideo2 = currentVideo2EmbedUrl && currentVideo2Data;

                                                return (
                                                  <>
                                                    {currentHasVideo1 && (
                                                      <div>
                                                        {currentVideoData?.video_name && (
                                                          <h4 className="text-white font-medium mb-3 text-base">{currentVideoData.video_name}</h4>
                                                        )}
                                                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                                          <iframe 
                                                            className="w-full h-full" 
                                                            src={currentVideoEmbedUrl || ''} 
                                                            title={currentVideoData?.video_name || 'Video 1'} 
                                                            frameBorder="0" 
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                            allowFullScreen
                                                          />
                                                        </div>
                                                      </div>
                                                    )}
                                                    {currentHasVideo2 && (
                                                      <div>
                                                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                                          <iframe 
                                                            className="w-full h-full" 
                                                            src={currentVideo2EmbedUrl || ''} 
                                                            title={currentVideo2Data?.video_name || 'Video 2'} 
                                                            frameBorder="0" 
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                            allowFullScreen
                                                          />
                                                        </div>
                                                      </div>
                                                    )}
                                                  </>
                                                );
                                              })()}
                                            </div>
                                          </DialogContent>
                                        </Dialog>

                                        {/* Personal Note Dialog */}
                                        <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
                                          <DialogContent className="max-w-md p-0 bg-white border-gray-300">
                                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                                              <h3 className="text-gray-900 text-lg font-medium">Personal Note</h3>
                                              <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => setNoteDialogOpen(false)}
                                                className="text-gray-500 hover:bg-gray-200 flex-shrink-0"
                                              >
                                                ✕
                                              </Button>
                                            </div>
                                            <div className="p-6">
                                              <PersonalNoteContent 
                                                contentId={noteDialogContentId}
                                                studentId={localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).id : 'GV0002'}
                                                onClose={() => setNoteDialogOpen(false)}
                                              />
                                            </div>
                                          </DialogContent>
                                        </Dialog>
                                      </div>
                                    </>
                                  );
                                };

                                return <SubtopicContentCard key={content.id} />;
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {topicContent.length === 0 && subtopics.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-white/60 text-sm">No content available for this topic</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
};

export { TopicListItem };
export default TopicListItem;