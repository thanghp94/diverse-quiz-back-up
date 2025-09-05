import React from 'react';
import { BookOpen, Play } from "lucide-react";
import { useContentImage } from "@/hooks/useContentImage";

export const getContentIcon = (content: any) => {
    if (content.videoid || content.videoid2) return <Play className="h-3 w-3" />;
    if (content.url) return <BookOpen className="h-3 w-3" />;
    return <BookOpen className="h-3 w-3" />;
};

// Local content thumbnail component for specific layout needs
export const LocalContentThumbnail = ({ content, onClick, isGroupCard = false }: { content: any, onClick?: () => void, isGroupCard?: boolean }) => {
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

export const getContentTypeColor = (content: any) => {
    if (content.videoid || content.videoid2) return 'bg-red-500/20 text-red-200';
    if (content.url) return 'bg-blue-500/20 text-blue-200';
    return 'bg-green-500/20 text-green-200';
};

export const getSubtopicLabel = (parentTopic: string, index: number) => {
    const letter = parentTopic.charAt(0).toUpperCase();
    return `${letter}.${index + 1}`;
};

// Helper function to validate translation dictionary
export const isValidTranslationDictionary = (dict: any): dict is Record<string, string> => {
  return dict && typeof dict === 'object' && !Array.isArray(dict) && 
         Object.values(dict).every(value => typeof value === 'string');
};

export const formatDescription = (description: string) => {
    return description.split('\n').map((line, index) => <span key={index} className="text-[#f1f1fd]">
        {line}
        {index < description.split('\n').length - 1 && <br />}
      </span>);
};
