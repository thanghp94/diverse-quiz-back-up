import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Content } from "@/hooks/useContent";
import { useContentMedia } from "@/hooks/useContentMedia";

interface ContentVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: Content;
  selectedGroupVideo: Content | null;
  onClose: () => void;
}

export const ContentVideoDialog: React.FC<ContentVideoDialogProps> = ({
  open,
  onOpenChange,
  content,
  selectedGroupVideo,
  onClose
}) => {
  const { videoData, video2Data, videoEmbedUrl, video2EmbedUrl } = useContentMedia(content);
  const hasVideo1 = videoEmbedUrl && videoData;
  const hasVideo2 = video2EmbedUrl && video2Data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 bg-gray-900 border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
          <h3 className="text-white text-lg font-medium truncate mr-4">
            {selectedGroupVideo ? selectedGroupVideo.title : content.title}
          </h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClose}
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
  );
};
