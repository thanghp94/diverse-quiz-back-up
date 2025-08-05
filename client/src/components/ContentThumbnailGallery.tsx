import React from 'react';
import { useContentImage } from '@/hooks/useContentImage';

interface ContentThumbnailGalleryProps {
  groupedContent: any[];
  onThumbnailClick?: (content: any) => void;
  onContentClick?: (info: { content: any; contextList: any[] }) => void;
}

const GalleryThumbnail = ({ content, onClick }: { 
  content: any, 
  onClick?: (e: React.MouseEvent) => void
}) => {
  const { data: imageUrl } = useContentImage(content.imageid);

  // Only show thumbnail if there's an imageid
  if (!content.imageid || !imageUrl) {
    return null;
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

export const ContentThumbnailGallery = ({ 
  groupedContent, 
  onThumbnailClick,
  onContentClick 
}: ContentThumbnailGalleryProps) => {
  const handleThumbnailClick = (groupItem: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Priority 1: Use onContentClick if provided (opens content popup like ContentCard)
    if (onContentClick) {
      onContentClick({
        content: groupItem,
        contextList: groupedContent
      });
      return;
    }
    
    // Priority 2: Use onThumbnailClick if provided
    if (onThumbnailClick) {
      onThumbnailClick(groupItem);
      return;
    }
    
    // Default behavior: Show image in dialog
    if (groupItem.imageid) {
      const imageDialog = document.createElement('div');
      imageDialog.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
      imageDialog.onclick = () => document.body.removeChild(imageDialog);
      const img = document.createElement('img');
      img.src = groupItem.imageid;
      img.className = 'max-w-[90vw] max-h-[90vh] object-contain';
      imageDialog.appendChild(img);
      document.body.appendChild(imageDialog);
    }
  };

  if (groupedContent.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 w-full">
      <div className="flex flex-wrap gap-2 justify-center w-full">
        {groupedContent.map((groupItem) => (
          <div key={`thumb-${groupItem.id}`} className="flex-shrink-0">
            <GalleryThumbnail 
              content={groupItem} 
              onClick={(e) => handleThumbnailClick(groupItem, e)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};