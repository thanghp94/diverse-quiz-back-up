import React from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Play, HelpCircle } from "lucide-react";
import { Content } from "@/hooks/useContent";
import { ContentRatingButtons } from "../../core/buttons/ContentRatingButtons";
import { CompactContentDifficultyIndicator } from "../../core/indicators/ContentDifficultyIndicator";
import { NoteButton } from "../../activities/personal/PersonalNoteButton";
import { LocalContentThumbnail, isValidTranslationDictionary } from "@/components/topics/TopicUtils";
import { MarkdownRenderer } from "@/components/shared";
import { getGroupItemClassName, getCurrentStudentId } from "../../utils/contentCardUtils";

interface GroupExpansionProps {
  groupedContent: Content[];
  subtopicContent: Content[];
  activeContentId: string | null;
  onContentClick: (info: { content: Content; contextList: Content[] }) => void;
  onStartQuiz: (content: Content, contextList: Content[], level: 'Easy' | 'Hard') => void;
  onVideoClick: (groupItem: Content) => void;
  onNoteClick: (contentId: string) => void;
}

export const GroupExpansion: React.FC<GroupExpansionProps> = ({
  groupedContent,
  subtopicContent,
  activeContentId,
  onContentClick,
  onStartQuiz,
  onVideoClick,
  onNoteClick
}) => {
  return (
    <div className="mt-3 pt-3 border-t border-purple-400/30">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {groupedContent.map((groupItem) => (
          <div 
            key={groupItem.id} 
            className={getGroupItemClassName(activeContentId, groupItem.id)}
            onClick={() => onContentClick({
              content: groupItem,
              contextList: [...subtopicContent]
            })}
          >
            <div className="flex items-start gap-3">
              <div onClick={(e) => e.stopPropagation()}>
                <LocalContentThumbnail 
                  content={groupItem} 
                  isGroupCard={true}
                  onClick={() => onContentClick({
                    content: groupItem,
                    contextList: [...subtopicContent]
                  })}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 
                    className="text-sm font-medium leading-tight flex-1 min-w-0"
                    style={{ color: '#ffff78e6' }}
                  >
                    {groupItem.title}
                  </h4>
                  <div 
                    className="flex items-center gap-1 flex-shrink-0" 
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <ContentRatingButtons 
                      key={`${groupItem.id}-inline-rating`}
                      contentId={groupItem.id}
                      compact={true}
                      studentId={getCurrentStudentId()}
                    />
                    <NoteButton
                      contentId={groupItem.id}
                      studentId={getCurrentStudentId()}
                      compact={true}
                      onOpenNote={() => onNoteClick(groupItem.id)}
                    />
                    {((groupItem.videoid && groupItem.videoid.trim()) || (groupItem.videoid2 && groupItem.videoid2.trim())) && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-white hover:bg-red-500/20 hover:text-white bg-red-500/10 border-red-400/50 text-xs px-1 py-0.5 h-5"
                        onClick={(e) => {
                          e.stopPropagation();
                          onVideoClick(groupItem);
                        }}
                        title={((groupItem.videoid && groupItem.videoid.trim()) && (groupItem.videoid2 && groupItem.videoid2.trim())) ? 'Videos' : 'Video'}
                      >
                        <Play className="h-2 w-2" />
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="text-black hover:bg-white/20 hover:text-black bg-white/90 border-white/50 text-xs px-1 py-0.5 h-5">
                          <HelpCircle className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onStartQuiz(groupItem, subtopicContent, 'Easy');
                        }}>
                          Easy Quiz
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onStartQuiz(groupItem, subtopicContent, 'Hard');
                        }}>
                          Hard Quiz
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <CompactContentDifficultyIndicator contentId={groupItem.id} />
                </div>
                {groupItem.short_description && (
                  <div className="text-white/90 text-xs leading-relaxed">
                    <MarkdownRenderer 
                      className="text-xs leading-relaxed"
                      translationDictionary={isValidTranslationDictionary(groupItem.translation_dictionary) ? groupItem.translation_dictionary : null}
                      textColor="text-white/90"
                      tooltipStyle="dark"
                    >
                      {groupItem.short_description}
                    </MarkdownRenderer>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
