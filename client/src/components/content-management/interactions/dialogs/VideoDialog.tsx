import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Content } from "@/hooks/useContent";
import { useContentMedia } from "@/hooks/useContentMedia";

interface VideoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  content: Content;
  selectedGroupVideo?: Content | null;
}

export const VideoDialog: React.FC<VideoDialogProps> = ({
  isOpen,
  onClose,
  content,
  selectedGroupVideo
}) => {
  const currentContent = selectedGroupVideo || content;
  const { videoData, video2Data, videoEmbedUrl, video2EmbedUrl } = useContentMedia(currentContent);
  
  const hasVideo1 = videoEmbedUrl && videoData;
  const hasVideo2 = video2EmbedUrl && video2Data;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 bg-gray-900 border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
          <h3 className="text-white text-lg font-medium truncate mr-4">
            {currentContent.title}
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
          {hasVideo1 && (
            <div>
              {videoData?.video_name && (
                <h4 className="text-white font-medium mb-3 text-base">{videoData.video_name}</h4>
              )}
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <iframe 
                  className="w-full h-full" 
                  src={videoEmbedUrl || ''} 
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
                  src={video2EmbedUrl || ''} 
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
  );
};
