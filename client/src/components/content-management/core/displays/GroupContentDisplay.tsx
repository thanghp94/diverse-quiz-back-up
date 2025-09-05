import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Content } from "@/hooks/useContent";
import ContentPopup from "@/components/content-management/interactions/popups/ContentPopup";
import { RegularContentCard } from "@/components/content-management/core/cards/ContentCard";
import { SubtopicContentCard } from "../cards/SubtopicCard";

// Component to display content organized by contentgroup at topic level
export const TopicGroupedContentDisplay = ({
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
  
  // Add state for group card expansion
  const [expandedGroupCards, setExpandedGroupCards] = useState<Set<string>>(new Set());

  const handleToggleGroupCard = (groupCardId: string) => {
    setExpandedGroupCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupCardId)) {
        newSet.delete(groupCardId);
      } else {
        newSet.add(groupCardId);
      }
      return newSet;
    });
  };

  const isGroupCardExpanded = (groupCardId: string) => {
    return expandedGroupCards.has(groupCardId);
  };

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
        // If it has a contentgroup, add it to the grouped content map for group expansion
        if (content.contentgroup && content.contentgroup.trim() !== '') {
          if (!groupedContentMap[content.contentgroup]) {
            groupedContentMap[content.contentgroup] = [];
          }
          groupedContentMap[content.contentgroup].push(content);
        } else {
          // Only add to individual content if it doesn't belong to a group
          allUngroupedContent.push(content);
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
              <SubtopicContentCard
                key={content.id}
                content={content}
                subtopicContent={topicContent}
                activeContentId={activeContentId}
                onContentClick={onContentClick}
                onStartQuiz={onStartQuiz}
                onStartGroupMatching={onStartGroupMatching}
                onToggleGroupCard={handleToggleGroupCard}
                isGroupCardExpanded={isGroupCardExpanded}
              />
            ))}
          </div>
        </div>
      )}

      {/* Display grouped content cards (content with prompt = "groupcard" and their related items) */}
      {organizedContent.groupCards.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-white/80 text-sm font-medium">Grouped Content</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {organizedContent.groupCards.map((groupContent: Content) => {
              const relatedContent: Content[] = organizedContent.groupedContentMap[groupContent.id] || [];
              return (
                <SubtopicContentCard
                  key={groupContent.id}
                  content={groupContent}
                  subtopicContent={[groupContent, ...relatedContent]}
                  activeContentId={activeContentId}
                  onContentClick={onContentClick}
                  onStartQuiz={onStartQuiz}
                  onStartGroupMatching={onStartGroupMatching}
                  onToggleGroupCard={handleToggleGroupCard}
                  isGroupCardExpanded={isGroupCardExpanded}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Content Group Popup */}
      {selectedContentGroup && (
        <ContentPopup
          isOpen={true}
          onClose={() => setSelectedContentGroup(null)}
          content={selectedContentGroup.content[0]}
          contentList={selectedContentGroup.content}
          onContentChange={(newContent) => {
            // Update the content in the group
            setSelectedContentGroup(prev => prev ? {
              ...prev,
              content: prev.content.map(c => c.id === newContent.id ? newContent : c)
            } : null);
          }}
          imageUrl={selectedContentGroup.content[0]?.imageid || null}
          isImageLoading={false}
        />
      )}
    </div>
  );
};
