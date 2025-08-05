import React from 'react';
import { Content } from "@/hooks/useContent";
import { FileText, Play, Image as ImageIcon } from "lucide-react";

interface ContentThumbnailProps {
  content: Content;
  onClick?: () => void;
}

const ContentThumbnail: React.FC<ContentThumbnailProps> = ({ content, onClick }) => {
  const getImageUrl = (content: Content): string | null => {
    if (content.imageid && typeof content.imageid === 'string' && content.imageid.startsWith('http')) {
      return content.imageid;
    }
    return null;
  };

  const imageUrl = getImageUrl(content);
  const hasVideo = content.videoid || content.videoid2;

  return (
    <div 
      className="w-full h-full bg-white/10 rounded-md overflow-hidden cursor-pointer hover:bg-white/20 transition-all duration-200 relative group"
      onClick={onClick}
    >
      {imageUrl ? (
        <>
          <img 
            src={imageUrl} 
            alt={content.title || 'Content thumbnail'}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center bg-white/10">
                    <svg class="h-6 w-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                `;
              }
            }}
          />
          {hasVideo && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="h-4 w-4 text-white" />
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-white/10">
          {hasVideo ? (
            <Play className="h-6 w-6 text-white/60" />
          ) : (
            <FileText className="h-6 w-6 text-white/60" />
          )}
        </div>
      )}
    </div>
  );
};

export default ContentThumbnail;