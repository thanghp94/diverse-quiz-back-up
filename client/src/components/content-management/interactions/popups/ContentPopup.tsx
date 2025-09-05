import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Content } from "@shared/schema";
import { useEffect, useState } from "react";
import QuizView from "../../activities/quiz/QuizView";
import { cn } from "@/lib/utils";
import { useQuiz } from "@/hooks/useQuiz";
import { useContentMedia } from "@/hooks/useContentMedia";
import { useAuth } from "@/hooks/useAuth";
import { ContentMedia } from "./contentpopup/ContentMedia";
import { ContentControls } from "./contentpopup/ContentControls";
import { ContentDetails } from "./contentpopup/ContentDetails";
import { ContentEditorSection } from "./contentpopup/ContentEditorSection";

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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if(!open) {
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
                  <ContentDetails
                    content={content}
                    isSecondBlurbOpen={isSecondBlurbOpen}
                    setIsSecondBlurbOpen={setIsSecondBlurbOpen}
                  />
                </div>

                {/* Right: Controls, Image and Videos */}
                <div className="space-y-4">
                  <ContentControls
                    currentIndex={currentIndex}
                    contentList={contentList}
                    onContentChange={onContentChange}
                    startQuiz={startQuiz}
                    contentId={content.id}
                  />

                  <ContentMedia
                    content={content}
                    videoEmbedUrl={videoEmbedUrl}
                    video2EmbedUrl={video2EmbedUrl}
                  />
                </div>
              </div>



              <ContentEditorSection
                content={content}
                onContentChange={onContentChange}
                user={user}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>


    </>
  );
};
export default ContentPopup;