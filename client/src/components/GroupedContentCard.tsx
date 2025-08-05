
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, BookOpen, Play, Folder, HelpCircle, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Content } from "@/hooks/useContent";
import { useContentImage } from "@/hooks/useContentImage";
import { CompactContentDifficultyIndicator } from "@/components/ContentDifficultyIndicator";
import { ContentRatingButtons } from "@/components/ContentRatingButtons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Thumbnail component for gallery images
interface ThumbnailImageProps {
  content: Content;
  onContentClick: (info: { content: Content; contextList: Content[] }) => void;
  contextList: Content[];
}

const ThumbnailImageComponent: React.FC<ThumbnailImageProps> = ({ content, onContentClick, contextList }) => {
  const { data: thumbUrl } = useContentImage(content.imageid);
  
  if (!thumbUrl) return null;
  
  return (
    <div 
      className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
      onClick={(e) => {
        e.stopPropagation();
        onContentClick({ content, contextList });
      }}
    >
      <img 
        src={thumbUrl} 
        alt={content.title || 'Content'} 
        className="w-full h-full object-cover"
      />
    </div>
  );
};

interface GroupedContentCardProps {
  groupContent: Content; // The main content item where prompt = "groupcard"
  groupedContent: Content[]; // Related content items where contentgroup = groupContent.id
  onContentClick: (info: { content: Content; contextList: Content[] }) => void;
  onStartQuiz: (content: Content, contextList: Content[], level: 'Easy' | 'Hard') => void;
  className?: string;
  activeContentId?: string | null;
}

export const GroupedContentCard: React.FC<GroupedContentCardProps> = ({
  groupContent,
  groupedContent,
  onContentClick,
  onStartQuiz,
  className,
  activeContentId
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: groupImageUrl } = useContentImage(groupContent.imageid);

  const toggleExpanded = () => {
    setIsExpanded(prev => !prev);
  };

  const handleGroupContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onContentClick({ content: groupContent, contextList: [groupContent, ...groupedContent] });
  };

  const handleNestedContentClick = (content: Content, e: React.MouseEvent) => {
    e.stopPropagation();
    onContentClick({ content, contextList: [groupContent, ...groupedContent] });
  };

  return (
    <Card 
      className={cn(
        "bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-indigo-600/20 border-purple-400/30 hover:from-purple-600/30 hover:via-blue-600/30 hover:to-indigo-600/30 transition-all duration-200 backdrop-blur-sm",
        activeContentId === groupContent.id && "ring-4 ring-yellow-400/80 bg-yellow-500/20 border-yellow-400/70 shadow-lg shadow-yellow-400/20",
        className
      )}
    >
      <CardContent className="p-4">
        {/* Group Header with title, buttons, and expand/collapse */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Folder className="h-5 w-5 text-purple-300" />
            </div>
            
            {/* Main thumbnail - showing full picture with object-contain */}
            {groupImageUrl && (
              <div 
                className="w-20 h-16 rounded-md overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleGroupContentClick}
              >
                <img 
                  src={groupImageUrl} 
                  alt={groupContent.title || 'Group content'} 
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
          
          {/* Centered Title */}
          <div className="flex-1 text-center mx-4">
            <h3 
              className="font-semibold text-lg line-clamp-1 cursor-pointer hover:opacity-90"
              onClick={handleGroupContentClick}
              style={{ color: 'white !important', textDecoration: 'none' }}
            >
              {groupContent.title || groupContent.short_description || 'Grouped Content'}
            </h3>
          </div>

          {/* Quiz and Match buttons - compact and stacked vertically */}
          <div className="flex flex-col gap-1 mr-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600/50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <HelpCircle className="h-3 w-3 mr-1" />
                  Quiz
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onStartQuiz(groupContent, [groupContent, ...groupedContent], 'Easy');
                }}>
                  Easy Quiz
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onStartQuiz(groupContent, [groupContent, ...groupedContent], 'Hard');
                }}>
                  Hard Quiz
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600/50"
              onClick={(e) => {
                e.stopPropagation();
                // Add match functionality here
              }}
            >
              <Shuffle className="h-3 w-3 mr-1" />
              Match
            </Button>
          </div>

          {/* Expand/Collapse button */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpanded}
              className="p-1 h-8 w-8 text-white/70 hover:text-white hover:bg-white/20"
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Thumbnail Gallery - hidden when expanded */}
        {!isExpanded && groupedContent.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-2 justify-center">
              {groupedContent.slice(0, 8).map((content) => (
                <ThumbnailImageComponent 
                  key={content.id}
                  content={content}
                  onContentClick={onContentClick}
                  contextList={[groupContent, ...groupedContent]}
                />
              ))}
              {groupedContent.length > 8 && (
                <div className="w-12 h-12 rounded-md bg-white/10 flex items-center justify-center text-white/60 text-xs">
                  +{groupedContent.length - 8}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Short Description - hidden when expanded */}
        {!isExpanded && groupContent.short_description && (
          <div className="text-center">
            <p className="text-white/70 text-sm">
              {groupContent.short_description}
            </p>
          </div>
        )}

        {/* Grouped Content - Collapsible */}
        {isExpanded && groupedContent.length > 0 && (
          <div className="mt-4 space-y-2 pl-4 border-l-2 border-purple-400/30">
            {groupedContent.map((content) => (
              <div key={content.id} className={cn(
                "transition-all duration-200 rounded-lg",
                activeContentId === content.id && "ring-4 ring-yellow-400/80 bg-yellow-500/20 shadow-lg shadow-yellow-400/20"
              )}>
                <NestedContentCard
                  content={content}
                  onClick={(e) => handleNestedContentClick(content, e)}
                  onStartQuiz={onStartQuiz}
                  contextList={[groupContent, ...groupedContent]}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface NestedContentCardProps {
  content: Content;
  onClick: (e: React.MouseEvent) => void;
  onStartQuiz: (content: Content, contextList: Content[], level: 'Easy' | 'Hard') => void;
  contextList: Content[];
}

const NestedContentCard: React.FC<NestedContentCardProps> = ({
  content,
  onClick,
  onStartQuiz,
  contextList
}) => {
  const { data: imageUrl } = useContentImage(content.imageid);

  const getContentIcon = () => {
    if (content.videoid || content.videoid2) return <Play className="h-3 w-3" />;
    if (content.url) return <BookOpen className="h-3 w-3" />;
    return <BookOpen className="h-3 w-3" />;
  };

  const getContentTypeColor = () => {
    if (content.videoid || content.videoid2) return 'bg-red-500/20 text-red-200';
    if (content.url) return 'bg-blue-500/20 text-blue-200';
    return 'bg-green-500/20 text-green-200';
  };

  return (
    <Card 
      className="bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer transition-all duration-200 hover:scale-[1.01]"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {imageUrl && (
            <div className="w-12 h-15 rounded-md overflow-hidden flex-shrink-0">
              <img 
                src={imageUrl} 
                alt={content.title || 'Content'} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={cn("text-xs", getContentTypeColor())}>
                {getContentIcon()}
              </Badge>
            </div>
            
            <h4 className="text-white font-medium text-sm mb-1 line-clamp-2">
              {content.title || content.short_description || 'Untitled Content'}
            </h4>
            
            <div className="flex items-center gap-2 mt-2">
              <CompactContentDifficultyIndicator contentId={content.id} />
              <div className="scale-75">
                <ContentRatingButtons 
                  contentId={content.id} 
                  compact={true}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupedContentCard;
