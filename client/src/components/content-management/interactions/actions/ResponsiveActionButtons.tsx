import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Play, HelpCircle } from "lucide-react";
import { Content } from "@/hooks/useContent";
import { ContentRatingButtons } from "../../core/buttons/ContentRatingButtons";
import { NoteButton } from "../../activities/personal/PersonalNoteButton";
import { ActionMenuDialog, ActionMenuTrigger } from "../dialogs/ActionMenuDialog";

interface ResponsiveActionButtonsProps {
  content: Content;
  subtopicContent: Content[];
  studentId: string;
  hasVideo: boolean;
  hasMultipleVideos: boolean;
  onStartQuiz: (content: Content, contextList: Content[], level: 'Easy' | 'Hard') => void;
  onVideoClick?: () => void;
  onNoteClick?: () => void;
  className?: string;
}

export const ResponsiveActionButtons: React.FC<ResponsiveActionButtonsProps> = ({
  content,
  subtopicContent,
  studentId,
  hasVideo,
  hasMultipleVideos,
  onStartQuiz,
  onVideoClick,
  onNoteClick,
  className = ""
}) => {
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);

  return (
    <>
      {/* Large Desktop Layout - All buttons visible */}
      <div className={`hidden xl:flex items-center gap-0.5 flex-shrink-0 ${className}`}>
        <ContentRatingButtons 
          contentId={content.id}
          compact={true}
          studentId={studentId}
        />
        
        <NoteButton
          contentId={content.id}
          studentId={studentId}
          compact={true}
          onOpenNote={onNoteClick || (() => {})}
        />

        {hasVideo && (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-white hover:bg-red-500/20 hover:text-white bg-red-500/10 border-red-400/50 text-xs px-1 py-0.5 h-5"
            onClick={(e) => {
              e.stopPropagation();
              onVideoClick?.();
            }}
            title={hasMultipleVideos ? '2 Videos' : 'Video'}
          >
            <Play className="h-3 w-3" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-black hover:bg-white/20 hover:text-black bg-white/90 border-white/50 text-xs px-1 py-0.5 h-5 opacity-60 hover:opacity-80"
            >
              <HelpCircle className="h-3 w-3" />
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
      </div>

      {/* Medium Desktop Layout - Compact buttons */}
      <div className={`hidden md:flex xl:hidden items-center gap-0.5 flex-shrink-0 ${className}`}>
        {hasVideo && (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-white hover:bg-red-500/20 hover:text-white bg-red-500/10 border-red-400/50 text-xs px-1 py-0.5 h-5"
            onClick={(e) => {
              e.stopPropagation();
              onVideoClick?.();
            }}
            title={hasMultipleVideos ? '2 Videos' : 'Video'}
          >
            <Play className="h-3 w-3" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-black hover:bg-white/20 hover:text-black bg-white/90 border-white/50 text-xs px-1 py-0.5 h-5 opacity-60 hover:opacity-80"
            >
              <HelpCircle className="h-3 w-3" />
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
        
        <div
          onClick={(e) => {
            e.stopPropagation();
            setMenuDialogOpen(true);
          }}
        >
          <ActionMenuTrigger compact={true} />
        </div>
      </div>

      {/* Mobile Layout - Single menu button */}
      <div className={`flex md:hidden items-center gap-1 flex-shrink-0 ${className}`}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setMenuDialogOpen(true);
          }}
        >
          <ActionMenuTrigger compact={true} />
        </div>
      </div>

      {/* Action Menu Dialog */}
      <ActionMenuDialog
        content={content}
        subtopicContent={subtopicContent}
        studentId={studentId}
        hasVideo={hasVideo}
        hasMultipleVideos={hasMultipleVideos}
        onStartQuiz={onStartQuiz}
        onVideoClick={onVideoClick}
        onNoteClick={onNoteClick}
        open={menuDialogOpen}
        onOpenChange={setMenuDialogOpen}
      />
    </>
  );
};
