import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, BookOpen, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Content } from "@/hooks/useContent";
import { useContentImage } from "@/hooks/useContentImage";

interface ContentGroupCardProps {
  groupName: string;
  description: string;
  contentCount: number;
  onClick: () => void;
  className?: string;
}

export const ContentGroupCard: React.FC<ContentGroupCardProps> = ({
  groupName,
  description,
  contentCount,
  onClick,
  className
}) => {
  return (
    <Card 
      className={cn(
        "bg-white/10 border-white/20 hover:bg-white/15 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg backdrop-blur-sm",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-2">{groupName}</h3>
            <p className="text-white/70 text-sm mb-3">{description}</p>
            <Badge className="bg-blue-500/20 text-blue-200 text-xs">
              {contentCount} items
            </Badge>
          </div>
          <ChevronRight className="h-5 w-5 text-white/50 ml-4" />
        </div>
      </CardContent>
    </Card>
  );
};

interface ContentGroupPopupProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  content: Content[];
  onContentClick: (content: Content, contextList: Content[]) => void;
}

export const ContentGroupPopup: React.FC<ContentGroupPopupProps> = ({
  isOpen,
  onClose,
  groupName,
  content,
  onContentClick
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">{groupName}</h2>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors text-2xl"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.map((item) => (
              <ContentItemCard
                key={item.id}
                content={item}
                onClick={() => onContentClick(item, content)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ContentItemCardProps {
  content: Content;
  onClick: () => void;
}

const ContentItemCard: React.FC<ContentItemCardProps> = ({ content, onClick }) => {
  const { data: imageUrl } = useContentImage(content.imageid);

  const getContentIcon = () => {
    if (content.videoid || content.videoid2) return <Play className="h-4 w-4" />;
    return <BookOpen className="h-4 w-4" />;
  };

  const getContentTypeColor = () => {
    if (content.videoid || content.videoid2) return 'bg-red-500/20 text-red-200';
    if (content.url) return 'bg-blue-500/20 text-blue-200';
    return 'bg-green-500/20 text-green-200';
  };

  return (
    <Card 
      className="bg-white/10 border-white/20 hover:bg-white/15 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {imageUrl && (
            <div className="w-16 h-20 rounded-md overflow-hidden flex-shrink-0">
              <img 
                src={imageUrl} 
                alt={content.title || content.short_description || 'Content'} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn("text-xs", getContentTypeColor())}>
                {getContentIcon()}
              </Badge>
            </div>
            
            <h4 className="text-white font-medium text-sm mb-1 line-clamp-2">
              {content.title || content.short_description || 'Untitled Content'}
            </h4>
            
            {content.short_blurb && (
              <p className="text-white/60 text-xs line-clamp-2">
                {content.short_blurb}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};