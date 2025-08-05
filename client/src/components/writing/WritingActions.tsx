import React from 'react';
import { Button } from '@/components/ui/button';
import { PenTool, FileText, Edit, Clock } from 'lucide-react';
import { Content } from '@/hooks/useContent';

interface User {
  id: string;
  first_name: string;
  last_name: string;
}

interface WritingActionsProps {
  content: Content;
  user: User | null;
  onOpenOutlinePopup: (contentTitle?: string, contentId?: string) => void;
  onOpenEssayPopup: (contentTitle?: string, contentId?: string) => void;
  onSetCreativeWritingInfo: (info: {
    isOpen: boolean;
    contentTitle?: string;
    contentId?: string;
    outlineData?: any;
  }) => void;
}

export const WritingActions: React.FC<WritingActionsProps> = ({
  content,
  user,
  onOpenOutlinePopup,
  onOpenEssayPopup,
  onSetCreativeWritingInfo
}) => {
  // Check for creative writing progress
  const outlineStorageKey = `creative_outline_${user?.id}_${content.id}`;
  const storyStorageKey = `creative_story_${user?.id}_${content.id}`;
  const outlineData = localStorage.getItem(outlineStorageKey);
  const storyData = localStorage.getItem(storyStorageKey);
  let hasCreativeProgress = false;

  if (outlineData) {
    try {
      const parsed = JSON.parse(outlineData);
      hasCreativeProgress = Object.values(parsed).some((val: any) => 
        typeof val === 'string' && val.trim()
      );
    } catch (error) {
      console.error("Failed to parse creative outline data:", error);
    }
  }

  if (!hasCreativeProgress && storyData) {
    try {
      const parsed = JSON.parse(storyData);
      hasCreativeProgress = parsed.title?.trim() || parsed.story?.trim();
    } catch (error) {
      console.error("Failed to parse creative story data:", error);
    }
  }

  const handleCreativeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasCreativeProgress) {
      // Load outline data and go directly to writing page
      const savedOutlineData = localStorage.getItem(outlineStorageKey);
      let outlineDataParsed = {};
      if (savedOutlineData) {
        try {
          outlineDataParsed = JSON.parse(savedOutlineData);
        } catch (error) {
          console.error('Failed to parse outline data:', error);
        }
      }
      onSetCreativeWritingInfo({
        isOpen: true,
        contentTitle: content.title || content.short_blurb || '',
        contentId: content.id,
        outlineData: outlineDataParsed,
      });
    } else {
      onOpenOutlinePopup(
        content.title || content.short_blurb || '',
        content.id,
      );
    }
  };

  const handleEssayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenEssayPopup(
      content.title || content.short_blurb || '',
      content.id,
    );
  };

  // Check for academic essay progress
  const getEssayProgressButton = () => {
    const storageKey = `academic_essay_${user?.id}_${content.id}`;
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.phase === "writing") {
          return (
            <Button
              onClick={handleEssayClick}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Edit className="h-4 w-4 mr-1" />
              Writing in Progress
            </Button>
          );
        } else if (
          parsed.phase === "outline" ||
          Object.values(parsed.outlineData || {}).some(
            (val: any) => typeof val === 'string' && val.trim(),
          )
        ) {
          return (
            <Button
              onClick={handleEssayClick}
              size="sm"
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <Clock className="h-4 w-4 mr-1" />
              Draft Saved
            </Button>
          );
        }
      } catch (error) {
        console.error("Failed to parse saved essay data:", error);
      }
    }
    return null;
  };

  return (
    <div className="flex gap-1">
      <Button
        onClick={handleCreativeClick}
        size="sm"
        className={hasCreativeProgress 
          ? "bg-green-600 hover:bg-green-700 text-white" 
          : "bg-purple-600 hover:bg-purple-700 text-white"
        }
      >
        <PenTool className="h-4 w-4 mr-1" />
        {hasCreativeProgress && <Edit className="h-4 w-4 mr-1" />}
        {hasCreativeProgress ? "Creative writing in progress" : "Creative"}
      </Button>
      
      <Button
        onClick={handleEssayClick}
        size="sm"
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        <FileText className="h-4 w-4 mr-1" />
        Academic essay
      </Button>

      {getEssayProgressButton()}
    </div>
  );
};