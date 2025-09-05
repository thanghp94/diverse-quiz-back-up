import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Eye } from 'lucide-react';
import type { Content } from '@shared/schema';
import ContentPopup from './ContentPopup';
import { useQuery } from '@tanstack/react-query';

interface ContentListProps {
  content: Content[];
}

export function ContentList({ content }: ContentListProps) {
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [isContentPopupOpen, setIsContentPopupOpen] = useState(false);

  const { data: images } = useQuery({
    queryKey: ['/api/images'],
  });

  const getImageUrl = (content: Content) => {
    if (!content.imageid || !images) return null;
    const image = images.find((img: any) => img.id === content.imageid);
    return image?.imagelink || null;
  };

  const handleContentClick = (contentItem: Content) => {
    setSelectedContent(contentItem);
    setIsContentPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsContentPopupOpen(false);
    setSelectedContent(null);
  };

  if (!content || content.length === 0) {
    return (
      <div className="text-center p-8 text-gray-600">
        No content available in this group
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {content.map((item) => {
          const imageUrl = getImageUrl(item);
          const hasVideo = item.videoid || item.videoid2;

          return (
            <Card 
              key={item.id}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                  {item.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Image Preview */}
                {imageUrl && (
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={imageUrl} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Description */}
                {item.short_description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {item.short_description}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleContentClick(item)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Content
                  </Button>
                  
                  {hasVideo && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContentClick(item)}
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Content Popup */}
      {selectedContent && (
        <ContentPopup
          isOpen={isContentPopupOpen}
          onClose={handleClosePopup}
          content={selectedContent}
          contentList={content}
          onContentChange={setSelectedContent}
          imageUrl={getImageUrl(selectedContent)}
          isImageLoading={false}
        />
      )}
    </>
  );
}