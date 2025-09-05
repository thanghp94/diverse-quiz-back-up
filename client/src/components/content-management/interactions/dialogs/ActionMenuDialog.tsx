import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Play, HelpCircle, ThumbsUp, ThumbsDown, FileText, MoreHorizontal } from "lucide-react";
import { Content } from "@/hooks/useContent";
import { ContentRatingButtons } from "../../core/buttons/ContentRatingButtons";
import { PersonalNoteButton as NoteButton } from "@/components/personal/PersonalNoteButton";

interface ActionMenuDialogProps {
  content: Content;
  subtopicContent: Content[];
  studentId: string;
  hasVideo: boolean;
  hasMultipleVideos: boolean;
  onStartQuiz: (content: Content, contextList: Content[], level: 'Easy' | 'Hard') => void;
  onVideoClick?: () => void;
  onNoteClick?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ActionMenuDialog: React.FC<ActionMenuDialogProps> = ({
  content,
  subtopicContent,
  studentId,
  hasVideo,
  hasMultipleVideos,
  onStartQuiz,
  onVideoClick,
  onNoteClick,
  open,
  onOpenChange
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 bg-white border-gray-300">
        <VisuallyHidden>
          <DialogTitle>Content Actions</DialogTitle>
          <DialogDescription>Available actions for this content</DialogDescription>
        </VisuallyHidden>
        
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-gray-900 text-lg font-medium">Actions</h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-gray-500 hover:bg-gray-200 flex-shrink-0"
          >
            ✕
          </Button>
        </div>
        
        <div className="p-4 space-y-3">
          {/* Video Action */}
          {hasVideo && (
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:bg-red-50 border-red-200"
              onClick={(e) => {
                e.stopPropagation();
                onVideoClick?.();
                onOpenChange(false);
              }}
            >
              <Play className="h-4 w-4 mr-2" />
              {hasMultipleVideos ? 'Watch Videos' : 'Watch Video'}
            </Button>
          )}
          
          {/* Quiz Actions */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start text-blue-600 hover:bg-blue-50 border-blue-200"
              onClick={(e) => {
                e.stopPropagation();
                onStartQuiz(content, subtopicContent, 'Easy');
                onOpenChange(false);
              }}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Easy Quiz
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-purple-600 hover:bg-purple-50 border-purple-200"
              onClick={(e) => {
                e.stopPropagation();
                onStartQuiz(content, subtopicContent, 'Hard');
                onOpenChange(false);
              }}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Hard Quiz
            </Button>
          </div>
          
          {/* Rating Actions */}
          <div className="space-y-2">
            <div className="text-sm text-gray-600 font-medium">Rate Difficulty:</div>
            <div className="flex gap-2 justify-center">
              <ContentRatingButtons 
                contentId={content.id}
                compact={false}
                studentId={studentId}
              />
            </div>
          </div>
          
          {/* Personal Note Action */}
          <Button
            variant="outline"
            className="w-full justify-start text-gray-600 hover:bg-gray-50 border-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              onNoteClick?.();
              onOpenChange(false);
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            Personal Note
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface ActionMenuTriggerProps {
  className?: string;
  compact?: boolean;
}

export const ActionMenuTrigger: React.FC<ActionMenuTriggerProps> = ({ 
  className = "", 
  compact = true 
}) => {
  return (
    <Button
      variant="outline"
      size={compact ? "sm" : "default"}
      className={`text-gray-600 hover:bg-gray-100 hover:text-gray-800 bg-white/90 border-gray-300 ${compact ? 'px-1 py-0.5 h-5' : 'px-2 py-1 h-6'} ${className}`}
    >
      <MoreHorizontal className={compact ? "h-3 w-3" : "h-4 w-4"} />
    </Button>
  );
};
