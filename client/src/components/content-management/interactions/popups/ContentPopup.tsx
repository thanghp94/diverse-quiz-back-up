import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Content } from "@shared/schema";
import { useContent } from "@/hooks/useContent";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import QuizView from "../../activities/quiz/QuizView";
import { cn } from "@/lib/utils";
import { MediaDisplay } from "@/components/content-popup/MediaDisplay";
import { VideoPlayer } from "@/components/content-popup/VideoPlayer";
import { ContentBody } from "@/components/content-popup/ContentBody";
import { ContentRatingButtons } from "../../core/buttons/ContentRatingButtons";
import { ContentEditor } from "../../core/editors/ContentEditor";
import { MarkdownRenderer } from "@/components/shared";
import { useQuiz } from "@/hooks/useQuiz";
import { useContentMedia } from "@/hooks/useContentMedia";
import { trackContentAccess, getCurrentUserId } from "@/lib/contentTracking";
import { useAuth } from "@/hooks/useAuth";

interface ContentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  content: Content | null;
  contentList: Content[];
  onContentChange: (newContent: Content) => void;
  startQuizDirectly?: boolean;
  quizLevel?: 'easy' | 'hard' | null;
  imageUrl: string | null | undefined;
  isImageLoading: boolean;
}

const ContentPopup = ({
  isOpen,
  onClose,
  content,
  contentList,
  onContentChange,
  startQuizDirectly = false,
  quizLevel,
  imageUrl,
  isImageLoading,
}: ContentPopupProps) => {
  const [isSecondBlurbOpen, setIsSecondBlurbOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [modalVideoUrl, setModalVideoUrl] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const { user } = useAuth();

  // Type guard for translation dictionary
  const isValidTranslationDictionary = (dict: unknown): dict is Record<string, string> => {
    return dict !== null && 
           typeof dict === 'object' && 
           !Array.isArray(dict) &&
           Object.values(dict as Record<string, unknown>).every(val => typeof val === 'string');
  };

  // All hooks must be called before any conditional returns
  const {
    quizMode,
    assignmentTry,
    studentTry,
    questionIds,
    startQuiz,
    closeQuiz,
    setStudentTry,
  } = useQuiz({ content, onClose, startQuizDirectly, level: quizLevel });

  const {
    videoData,
    video2Data,
    videoEmbedUrl,
    video2EmbedUrl,
  } = useContentMedia(content);

  useEffect(() => {
    if (isOpen && startQuizDirectly && quizLevel && content) {
      console.log('Starting quiz directly with level:', quizLevel);
      startQuiz(quizLevel);
    }
  }, [isOpen, startQuizDirectly, quizLevel, content, startQuiz]);

  // Track content access when popup opens
  useEffect(() => {
    if (isOpen && content && user?.id) {
      console.log(`Tracking content access for student ${user.id}, content ${content.id}`);
      // Track content access
      fetch('/api/content-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: user.id,
          content_id: content.id,
        }),
      })
      .then(response => response.json())
      .then(data => {
        console.log('Content access tracked successfully:', data);
      })
      .catch(error => {
        console.error('Failed to track content access:', error);
      });
    }
  }, [isOpen, content, user]);

  // Reset modal states when popup opens/closes or content changes
  useEffect(() => {
    if (!isOpen) {
      setIsImageModalOpen(false);
      setIsVideoModalOpen(false);
      setModalVideoUrl(null);
    }
  }, [isOpen]);

  useEffect(() => {
    setIsImageModalOpen(false);
    setIsVideoModalOpen(false);
    setModalVideoUrl(null);
  }, [content?.id]);

  // Early return after all hooks are called
  if (!content) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => { if(!open) onClose(); }}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh]">
          <div>No content available</div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentIndex = contentList.findIndex(item => item.id === content.id);
  const handlePrevious = () => {
    if (currentIndex > 0) {
      onContentChange(contentList[currentIndex - 1]);
    }
  };
  const handleNext = () => {
    if (currentIndex < contentList.length - 1) {
      onContentChange(contentList[currentIndex + 1]);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { 
        if(!open && !isImageModalOpen && !isVideoModalOpen) { 
          closeQuiz(); 
          onClose(); 
        } 
      }}>
        <DialogContent className={cn(
          "max-w-6xl w-[98vw] sm:w-[95vw] md:w-[90vw] max-h-[95vh] overflow-hidden flex flex-col", 
          quizMode && "max-w-7xl max-h-[95vh]"
        )}>
          {(quizMode || startQuizDirectly) && questionIds.length > 0 && assignmentTry ? (
            <div className="flex-1 overflow-y-auto min-h-0">
              <QuizView 
                questionIds={questionIds} 
                onQuizFinish={closeQuiz}
                assignmentStudentTryId={assignmentTry.id.toString()}
                studentTryId={studentTry?.id}
                contentId={content?.id}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto min-h-0">
              {/* Two-column layout: Title/Content + Media */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-3">
                {/* Left: Title, Description, Short Blurb, Second Short Blurb */}
                <div className="space-y-4">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-blue-600 text-center">
                      {content.title}
                    </DialogTitle>
                    <DialogDescription className="whitespace-pre-line text-[16px] text-[#131b2a]">
                      {content.short_description || "Detailed content view."}
                    </DialogDescription>
                  </DialogHeader>

                  {/* Short Blurb directly under title */}
                  {content.short_blurb && (
                    <div className="mb-2">
                      <MarkdownRenderer 
                        className="text-base leading-relaxed"
                        translationDictionary={isValidTranslationDictionary(content.translation_dictionary) ? content.translation_dictionary : null}
                        tooltipStyle="dark"
                      >
                        {content.short_blurb}
                      </MarkdownRenderer>
                    </div>
                  )}

                  {/* Second Short Blurb as collapsible card */}
                  {content.second_short_blurb && (
                    <div className="border border-gray-200 rounded-lg">
                      <button 
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg"
                        onClick={() => setIsSecondBlurbOpen(!isSecondBlurbOpen)}
                      >
                        <h3 className="font-semibold text-lg">Additional Information</h3>
                        <svg 
                          className={`w-5 h-5 transition-transform duration-200 ${isSecondBlurbOpen ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isSecondBlurbOpen && (
                        <div className="px-3 pb-2 border-t border-gray-100">
                          <MarkdownRenderer 
                            className="text-base leading-relaxed"
                            translationDictionary={isValidTranslationDictionary(content.translation_dictionary) ? content.translation_dictionary : null}
                          >
                            {content.second_short_blurb}
                          </MarkdownRenderer>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Controls, Image and Videos */}
                <div className="space-y-4">
                  {/* Navigation and Controls - Single Line */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {/* Left side: Navigation */}
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={handlePrevious} 
                        disabled={currentIndex <= 0}
                        className="px-2 py-1 text-xs border rounded disabled:opacity-50"
                      >
                        ← Prev
                      </button>
                      <span className="text-xs text-gray-600 px-1">
                        {currentIndex + 1}/{contentList.length}
                      </span>
                      <button 
                        onClick={handleNext} 
                        disabled={currentIndex >= contentList.length - 1}
                        className="px-2 py-1 text-xs border rounded disabled:opacity-50"
                      >
                        Next →
                      </button>
                    </div>

                    {/* Right side: Quiz and Rating */}
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => startQuiz('easy')}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Easy Quiz
                      </button>
                      <button 
                        onClick={() => startQuiz('hard')}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Hard Quiz
                      </button>
                      <ContentRatingButtons contentId={content.id} />
                    </div>
                  </div>

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
                            console.log('Image overlay clicked, opening modal');
                            setIsImageModalOpen(true);
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
                            console.log('Video 1 clicked, opening modal with URL:', videoEmbedUrl);
                            const autoplayUrl = videoEmbedUrl.includes('?') 
                              ? videoEmbedUrl + '&autoplay=1' 
                              : videoEmbedUrl + '?autoplay=1';
                            console.log('Setting video modal URL to:', autoplayUrl);
                            setModalVideoUrl(autoplayUrl);
                            setIsVideoModalOpen(true);
                            console.log('Video modal state set to open');
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
                            console.log('Video 2 clicked, opening modal with URL:', video2EmbedUrl);
                            const autoplayUrl = video2EmbedUrl.includes('?') 
                              ? video2EmbedUrl + '&autoplay=1' 
                              : video2EmbedUrl + '?autoplay=1';
                            console.log('Setting video modal URL to:', autoplayUrl);
                            setModalVideoUrl(autoplayUrl);
                            setIsVideoModalOpen(true);
                            console.log('Video modal state set to open');
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
                </div>
              </div>



              {/* Content Editor - Admin Only Dropdown */}
              {(() => {
                const isAuthorized = user && typeof user === 'object' && user !== null && 'id' in user && (user as any).id === 'GV0002';

                if (!isAuthorized) return null;

                return (
                  <div className="mt-6 pt-4 border-t">
                    <button 
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg border border-blue-200 bg-blue-50/30"
                      onClick={() => setIsEditorOpen(!isEditorOpen)}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="font-medium text-blue-700">Content Editor (Admin)</span>
                      </div>
                      <svg 
                        className={`w-5 h-5 text-blue-600 transition-transform duration-200 ${isEditorOpen ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isEditorOpen && (
                      <div className="mt-3">
                        <ContentEditor content={content} onContentUpdate={onContentChange} />
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full-screen Image Modal - Portal Rendered */}
      {isImageModalOpen && content?.imageid && createPortal(
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
        </div>,
        document.body
      )}

      {/* Video Modal - Using Dialog like TopicListItem */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 bg-gray-900 border-gray-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
            <h3 className="text-white text-lg font-medium truncate mr-4">{content?.title || 'Video'}</h3>
            <button
              onClick={() => {
                console.log('Video modal close button clicked');
                setIsVideoModalOpen(false);
                setModalVideoUrl(null);
              }}
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
export default ContentPopup;