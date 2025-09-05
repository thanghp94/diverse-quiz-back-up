import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Content } from "@shared/schema";

interface ContentMediaProps {
  content: Content;
  videoEmbedUrl?: string | null;
  video2EmbedUrl?: string | null;
}

export const ContentMedia = ({ content, videoEmbedUrl, video2EmbedUrl }: ContentMediaProps) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [modalVideoUrl, setModalVideoUrl] = useState<string | null>(null);

  // Reset modal states when content changes
  useEffect(() => {
    setIsImageModalOpen(false);
    setIsVideoModalOpen(false);
    setModalVideoUrl(null);
  }, [content?.id]);

  const handleImageClick = () => {
    console.log('Image overlay clicked, opening modal');
    setIsImageModalOpen(true);
  };

  const handleVideoClick = (videoUrl: string) => {
    console.log('Video clicked, opening modal with URL:', videoUrl);
    const autoplayUrl = videoUrl.includes('?')
      ? videoUrl + '&autoplay=1'
      : videoUrl + '?autoplay=1';
    console.log('Setting video modal URL to:', autoplayUrl);
    setModalVideoUrl(autoplayUrl);
    setIsVideoModalOpen(true);
    console.log('Video modal state set to open');
  };

  const closeVideoModal = () => {
    console.log('Video modal close button clicked');
    setIsVideoModalOpen(false);
    setModalVideoUrl(null);
  };

  return (
    <>
      {/* Image Section */}
      {content.imageid && (
        <div className="w-full relative">
          <img
            src={content.imageid}
            alt={content.title}
            className="w-full h-auto rounded-lg"
            style={{
              aspectRatio: 'auto',
              objectFit: 'contain',
              maxHeight: '400px'
            }}
            onLoad={(e) => {
              console.log('Image loaded successfully:', content.imageid);
              const img = e.target as HTMLImageElement;
              const aspectRatio = img.naturalWidth / img.naturalHeight;

              // If horizontal (landscape), fit to width
              if (aspectRatio > 1.2) {
                img.style.width = '100%';
                img.style.height = 'auto';
                img.style.maxHeight = '300px';
              }
              // If square or portrait, fit to column width
              else {
                img.style.width = '100%';
                img.style.height = 'auto';
                img.style.maxHeight = '400px';
              }
            }}
            onError={() => console.log('Image failed to load:', content.imageid)}
          />
          {/* Image overlay - only when no videos are present */}
          {!(videoEmbedUrl || video2EmbedUrl) && (
            <div
              className="absolute inset-0 cursor-pointer hover:bg-black hover:bg-opacity-5 transition-all rounded-lg"
              style={{ zIndex: 10 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleImageClick();
              }}
            />
          )}
          {/* Partial image overlay - only top portion when videos are present */}
          {(videoEmbedUrl || video2EmbedUrl) && (
            <div
              className="absolute top-0 left-0 right-0 cursor-pointer hover:bg-black hover:bg-opacity-5 transition-all rounded-t-lg"
              style={{
                zIndex: 10,
                height: '60%'
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Image overlay (top portion) clicked, opening modal');
                setIsImageModalOpen(true);
              }}
            />
          )}
        </div>
      )}

      {/* Videos Section - Center single video, side-by-side for two videos */}
      {(videoEmbedUrl || video2EmbedUrl) && (
        <div className={`mt-4 ${videoEmbedUrl && video2EmbedUrl ? 'grid grid-cols-2 gap-3' : 'flex justify-center'}`}>
          {videoEmbedUrl && (
            <div
              className={`aspect-video relative cursor-pointer hover:opacity-90 transition-opacity border rounded-lg overflow-hidden shadow-md bg-black ${!video2EmbedUrl ? 'max-w-md' : ''}`}
              style={{
                zIndex: 1000,
                position: 'relative',
                isolation: 'isolate'
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleVideoClick(videoEmbedUrl);
              }}
            >
              <iframe
                src={videoEmbedUrl}
                title={`Video 1 for ${content.title}`}
                className="w-full h-full pointer-events-none"
                allowFullScreen
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity">
                <div className="bg-white bg-opacity-90 rounded-full p-2">
                  <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </div>
          )}
          {video2EmbedUrl && (
            <div
              className={`aspect-video relative cursor-pointer hover:opacity-90 transition-opacity border rounded-lg overflow-hidden shadow-md bg-black ${!videoEmbedUrl ? 'max-w-md' : ''}`}
              style={{
                zIndex: 1000,
                position: 'relative',
                isolation: 'isolate'
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleVideoClick(video2EmbedUrl);
              }}
            >
              <iframe
                src={video2EmbedUrl}
                title={`Video 2 for ${content.title}`}
                className="w-full h-full pointer-events-none"
                allowFullScreen
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity">
                <div className="bg-white bg-opacity-90 rounded-full p-2">
                  <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full-screen Image Modal */}
      {isImageModalOpen && content?.imageid && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Image modal backdrop clicked, closing');
            setIsImageModalOpen(false);
          }}
          style={{ zIndex: 99999 }}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Image modal X button clicked - closing modal');
              setIsImageModalOpen(false);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Image modal X button mouse down');
            }}
            onMouseUp={() => {
              console.log('Image modal X button mouse up');
            }}
            className="fixed top-4 right-4 text-white text-3xl bg-black bg-opacity-70 hover:bg-opacity-90 rounded-full w-12 h-12 flex items-center justify-center z-[100001] font-bold cursor-pointer"
            style={{
              position: 'fixed',
              top: '16px',
              right: '16px',
              zIndex: 100001,
              pointerEvents: 'all'
            }}
          >
            ×
          </button>
          <div className="relative max-w-[95vw] max-h-[95vh]">
            <img
              src={content.imageid || ''}
              alt={content.title}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Video Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 bg-gray-900 border-gray-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
            <h3 className="text-white text-lg font-medium truncate mr-4">{content?.title || 'Video'}</h3>
            <button
              onClick={closeVideoModal}
              className="text-white hover:bg-white/20 flex-shrink-0 px-3 py-1 rounded transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="p-6">
            {modalVideoUrl && (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  className="w-full h-full"
                  src={modalVideoUrl}
                  title={content?.title || 'Video'}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
