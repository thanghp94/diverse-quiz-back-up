import React from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Play, HelpCircle, Shuffle } from "lucide-react";
import { Content } from "@/hooks/useContent";
import { ContentRatingButtons } from "@/components/content";
import { NoteButton } from "@/components/personal/PersonalNoteButton";

interface ContentActionButtonsProps {
  content: Content;
  subtopicContent: Content[];
  compact?: boolean;
  showVideo?: boolean;
  showQuiz?: boolean;
  showRating?: boolean;
  showNote?: boolean;
  showMatching?: boolean;
  onStartQuiz: (content: Content, contextList: Content[], level: 'Easy' | 'Hard') => void;
  onStartGroupMatching?: (matchingId: string, matchingTitle: string) => void;
  onVideoClick?: () => void;
  onNoteClick?: () => void;
  studentId: string;
  className?: string;
}

export const ContentActionButtons: React.FC<ContentActionButtonsProps> = ({
  content,
  subtopicContent,
  compact = false,
  showVideo = true,
  showQuiz = true,
  showRating = true,
  showNote = true,
  showMatching = false,
  onStartQuiz,
  onStartGroupMatching,
  onVideoClick,
  onNoteClick,
  studentId,
  className = ""
}) => {
  const hasVideo = (content.videoid && content.videoid.trim()) || (content.videoid2 && content.videoid2.trim());
  const hasMultipleVideos = (content.videoid && content.videoid.trim()) && (content.videoid2 && content.videoid2.trim());

  return (
    <div className={`flex items-center gap-1 flex-shrink-0 ${className}`}>
      {showRating && (
        <ContentRatingButtons 
          key={`${content.id}-rating`}
          contentId={content.id}
          compact={compact}
          studentId={studentId}
        />
      )}
      
      {showNote && (
        <NoteButton
          contentId={content.id}
          studentId={studentId}
          compact={compact}
          onOpenNote={onNoteClick || (() => {})}
        />
      )}

      {showMatching && content.parentid && onStartGroupMatching && (
        <Button 
          variant="outline" 
          size="sm" 
          className="text-yellow-200 hover:bg-yellow-500/30 bg-yellow-500/20 border-yellow-400/40 text-xs px-1 py-0.5 h-5"
          onClick={(e) => {
            e.stopPropagation();
            onStartGroupMatching(content.parentid!, content.title || 'Group Match');
          }}
          title="Match"
        >
          <Shuffle className="h-3 w-3" />
        </Button>
      )}

      {showVideo && hasVideo && (
        <Button 
          variant="outline" 
          size="sm" 
          className={`text-white hover:bg-red-500/20 hover:text-white bg-red-500/10 border-red-400/50 text-xs ${compact ? 'px-1 py-0.5 h-5' : 'px-2 py-1 h-6'}`}
          onClick={(e) => {
            e.stopPropagation();
            onVideoClick?.();
          }}
          title={hasMultipleVideos ? (compact ? 'Videos' : '2 Videos') : 'Video'}
        >
          <Play className={`${compact ? 'h-2 w-2' : 'h-3 w-3'}`} />
        </Button>
      )}

      {showQuiz && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className={`text-black hover:bg-white/20 hover:text-black bg-white/90 border-white/50 text-xs ${compact ? 'px-1 py-0.5 h-5' : 'px-1 py-0.5 h-5 opacity-60 hover:opacity-80'}`}
            >
              Quiz
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onStartQuiz(content, subtopicContent, 'Easy');
            }}>
              Easy Quiz
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onStartQuiz(content, subtopicContent, 'Hard');
            }}>
              Hard Quiz
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
