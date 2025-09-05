import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Play, HelpCircle } from "lucide-react";
import { Content } from "@/hooks/useContent";
import { useContentImage } from "@/hooks/useContentImage";
import { useContentMedia } from "@/hooks/useContentMedia";

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

// Shared ContentCard component
export const ContentCard = ({ content, topicContent, onContentClick, onStartQuiz, customActions }: { 
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
