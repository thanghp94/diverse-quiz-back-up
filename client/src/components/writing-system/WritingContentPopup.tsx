
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Content } from "@shared/schema";
import { useQuiz } from "@/hooks/useQuiz";
import { useContentMedia } from "@/hooks/useContentMedia";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import QuizView from '@/components/content-management/activities/quiz/QuizView';
import { ContentRatingButtons } from "@/components/content-management/core/buttons/ContentRatingButtons";
import { ContentEditor } from "@/components/content-management/core/editors/ContentEditor";
import { MarkdownRenderer } from "@/components/shared";

interface WritingContentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  content: Content | null;
  contentList: Content[];
  onContentChange: (newContent: Content) => void;
  startQuizDirectly?: boolean;
  quizLevel?: 'easy' | 'hard' | null;
}

const WritingContentPopup = ({
  isOpen,
  onClose,
  content,
  contentList,
  onContentChange,
  startQuizDirectly = false,
  quizLevel,
}: WritingContentPopupProps) => {
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
    if (isOpen && startQuizDirectly && !quizMode && quizLevel && content) {
      startQuiz(quizLevel);
    }
  }, [isOpen, startQuizDirectly, quizMode, startQuiz, quizLevel, content]);

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

  const currentIndex = contentList?.findIndex(item => item.id === content.id) ?? -1;
  const handlePrevious = () => {
    if (currentIndex > 0 && contentList) {
      onContentChange(contentList[currentIndex - 1]);
    }
  };
  const handleNext = () => {
    if (currentIndex < (contentList?.length ?? 0) - 1 && contentList) {
      onContentChange(contentList[currentIndex + 1]);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { 
        if(!open) { 
          closeQuiz(); 
          onClose(); 
        } 
      }}>
        <DialogContent className={cn("max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto", quizMode && "max-w-7xl h-[90vh]")}>
          {quizMode && questionIds.length > 0 && assignmentTry ? (
            <QuizView 
              questionIds={questionIds} 
              onQuizFinish={closeQuiz}
              assignmentStudentTryId={assignmentTry.id.toString()}
              studentTryId={studentTry?.id}
              contentId={content?.id}
            />
          ) : (
            <>
              {/* Header Section */}
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl font-bold text-blue-600 text-center">
                  {content.title}
                </DialogTitle>
                <DialogDescription className="whitespace-pre-line text-[16px] text-[#131b2a] text-center">
                  {content.short_description || "Writing content view."}
                </DialogDescription>
              </DialogHeader>

              {/* Navigation and Controls - Single Line */}
              <div className="flex items-center justify-between gap-2 flex-wrap mb-4 p-3 rounded-lg border">
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

              {/* Two-column layout for content blurbs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Left Column: Short Blurb */}
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/30">
                    <h3 className="font-semibold text-lg mb-3 text-blue-600">Content Summary</h3>
                    {content.short_blurb ? (
                      <MarkdownRenderer 
                        className="text-base leading-relaxed"
                        translationDictionary={isValidTranslationDictionary(content.translation_dictionary) ? content.translation_dictionary : null}
                        tooltipStyle="dark"
                      >
                        {content.short_blurb}
                      </MarkdownRenderer>
                    ) : (
                      <p className="text-gray-500 italic">No summary available.</p>
                    )}
                  </div>
                </div>

                {/* Right Column: Second Short Blurb */}
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4 bg-blue-50/30">
                    <h3 className="font-semibold text-lg mb-3 text-blue-600">Additional Information</h3>
                    {content.second_short_blurb ? (
                      <MarkdownRenderer 
                        className="text-base leading-relaxed"
                        translationDictionary={isValidTranslationDictionary(content.translation_dictionary) ? content.translation_dictionary : null}
                        tooltipStyle="dark"
                      >
                        {content.second_short_blurb}
                      </MarkdownRenderer>
                    ) : (
                      <p className="text-gray-500 italic">No additional information available.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Videos Section - if available */}
              {(videoEmbedUrl || video2EmbedUrl) && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3 text-gray-700">Related Videos</h3>
                  <div className={`${videoEmbedUrl && video2EmbedUrl ? 'grid grid-cols-2 gap-4' : 'flex justify-center'}`}>
                    {videoEmbedUrl && (
                      <div className="aspect-video border rounded-lg overflow-hidden shadow-md bg-black">
                        <iframe
                          src={videoEmbedUrl}
                          title={`Video 1 for ${content.title}`}
                          className="w-full h-full"
                          allowFullScreen
                        />
                      </div>
                    )}
                    {video2EmbedUrl && (
                      <div className="aspect-video border rounded-lg overflow-hidden shadow-md bg-black">
                        <iframe
                          src={video2EmbedUrl}
                          title={`Video 2 for ${content.title}`}
                          className="w-full h-full"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

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
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WritingContentPopup;
