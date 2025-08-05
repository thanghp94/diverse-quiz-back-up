
import { Content } from "@/hooks/useContent";
import { PopupHeader } from "./PopupHeader";
import { MediaDisplay } from "./MediaDisplay";
import { VideoPlayer } from "./VideoPlayer";
import { ContentBody } from "./ContentBody";
import { ContentRatingButtons } from "../ContentRatingButtons";
import { ContentEditor } from "../ContentEditor";

interface ContentPopupViewProps {
  content: Content;
  contentListLength: number;
  currentIndex: number;
  handlePrevious: () => void;
  handleNext: () => void;
  startQuiz: (level?: 'Easy' | 'Hard') => void;
  imageUrl: string | null | undefined;
  isImageLoading: boolean;
  videoEmbedUrl: string | null;
  video2EmbedUrl: string | null;
  videoData: {
    video_name?: string | null;
  } | null;
  video2Data: {
    video_name?: string | null;
  } | null;
  hideMediaDisplay?: boolean;
  onContentUpdate?: (updatedContent: Content) => void;
}

export const ContentPopupView = ({
  content,
  contentListLength,
  currentIndex,
  handlePrevious,
  handleNext,
  startQuiz,
  imageUrl,
  isImageLoading,
  videoEmbedUrl,
  video2EmbedUrl,
  videoData,
  video2Data,
  hideMediaDisplay = false,
  onContentUpdate
}: ContentPopupViewProps) => {

  return (
    <div className="py-2 space-y-3">
      <PopupHeader
        contentListLength={contentListLength}
        currentIndex={currentIndex}
        handlePrevious={handlePrevious}
        handleNext={handleNext}
        startQuiz={startQuiz}
        translation={content.translation}
        contentId={content.id}
      />

      {/* Two-column layout: Image + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Image */}
        <div className="space-y-3">
          {!hideMediaDisplay && (
            <MediaDisplay
              imageUrl={imageUrl}
              isImageLoading={isImageLoading}
              title={content.title}
              imageid={content.imageid}
              isFullWidth={true}
            />
          )}
        </div>

        {/* Right Column: Content */}
        <div className="space-y-3">
          <ContentBody content={content} />
          
          {/* Content Editor for authorized users */}
          {onContentUpdate && (
            <ContentEditor 
              content={content} 
              onContentUpdate={onContentUpdate}
            />
          )}
        </div>
      </div>

      {/* Video section below - two smaller windows side by side */}
      <VideoPlayer 
        videoEmbedUrl={videoEmbedUrl}
        video2EmbedUrl={video2EmbedUrl}
        videoData={videoData}
        video2Data={video2Data}
        compact={true}
      />
    </div>
  );
};
