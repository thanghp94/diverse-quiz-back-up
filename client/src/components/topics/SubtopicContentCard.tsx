import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Play, HelpCircle, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Content } from "@/hooks/useContent";
import { useContentMedia } from "@/hooks/useContentMedia";
import { ContentRatingButtons, ContentThumbnailGallery, CompactContentDifficultyIndicator } from "@/components/content";
import { PersonalNoteContent, NoteButton } from "@/components/personal/PersonalNoteButton";
import { LocalContentThumbnail, isValidTranslationDictionary } from "@/components/topics/TopicUtils";
import { MarkdownRenderer } from "@/components/shared";

interface SubtopicContentCardProps {
  content: Content;
  subtopicContent: Content[];
  activeContentId: string | null;
  onContentClick: (info: { content: Content; contextList: Content[] }) => void;
  onStartQuiz: (content: Content, contextList: Content[], level: 'Easy' | 'Hard') => void;
  onStartGroupMatching: (matchingId: string, matchingTitle: string) => void;
  onToggleGroupCard: (groupCardId: string) => void;
  isGroupCardExpanded: (groupCardId: string) => boolean;
}

export const SubtopicContentCard: React.FC<SubtopicContentCardProps> = ({
  content,
  subtopicContent,
  activeContentId,
  onContentClick,
  onStartQuiz,
  onStartGroupMatching,
  onToggleGroupCard,
  isGroupCardExpanded
}) => {
  const { videoData, video2Data, videoEmbedUrl, video2EmbedUrl } = useContentMedia(content);
  const [videoPopupOpen, setVideoPopupOpen] = useState(false);
  const [selectedGroupVideo, setSelectedGroupVideo] = useState<Content | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteDialogContentId, setNoteDialogContentId] = useState<string>('');

  const hasVideo1 = videoEmbedUrl && videoData;
  const hasVideo2 = video2EmbedUrl && video2Data;

  // Check if this content is a group card and find related content
  const isGroupCard = content.prompt === "groupcard";
  const isGroupExpanded = isGroupCard ? isGroupCardExpanded(content.id) : false;
  const groupedContent = isGroupCard ? 
    subtopicContent
      .filter(item => item.contentgroup === content.id && item.id !== content.id)
      .sort((a, b) => {
        const orderA = parseInt(a.order || '999999');
        const orderB = parseInt(b.order || '999999');
        return orderA - orderB;
      }) : 
    [];

  return (
    <>
      <div className={cn(
        "bg-white/5 border border-white/20 hover:bg-white/10 transition-all duration-200 rounded-lg p-3 relative",
        isGroupCard && "bg-gradient-to-br from-yellow-600/25 via-orange-600/25 to-amber-600/25 border-yellow-400/60 shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20 hover:border-yellow-400/80 transform hover:scale-[1.02] z-10",
        isGroupCard && isGroupExpanded && "col-span-2 ring-2 ring-yellow-400/40 z-20",
        !isGroupCard && "z-5",
        activeContentId === content.id && "ring-4 ring-yellow-400/80 bg-yellow-500/20 border-yellow-400/70 shadow-lg shadow-yellow-400/20"
      )}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-grow cursor-pointer">
            {isGroupCard ? (
              <div 
                className="w-full"
                onClick={() => onToggleGroupCard(content.id)}
              >
                {/* Title with action buttons for group cards */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  {/* Buttons on far left */}
                  <div className="flex items-center gap-1">
                    {content.parentid && (
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-yellow-200 hover:bg-yellow-500/30 bg-yellow-500/20 border-yellow-400/40 text-xs px-1 py-0.5 h-5"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartQuiz(content, subtopicContent, 'Easy');
                      }}
                      title="Quiz"
                    >
                      <HelpCircle className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Centered title */}
                  <div className="flex-1 text-center">
                    <h4 className="text-base font-medium leading-tight" style={{ color: '#ffff78e6' }}>{content.title}</h4>
                  </div>

                  {/* Empty div for balance */}
                  <div className="w-[42px]"></div>
                </div>

                {/* Thumbnail Gallery for Group Cards - hidden when expanded */}
                {!isGroupExpanded && (
                  <ContentThumbnailGallery 
                    groupedContent={groupedContent}
                    onContentClick={onContentClick}
                  />
                )}

                {/* Description at bottom for group cards - hidden when expanded */}
                {!isGroupExpanded && content.short_description && (
                  <div className="text-white text-sm leading-relaxed mt-1 text-center font-semibold">
                    <MarkdownRenderer 
                      className="text-sm leading-relaxed"
                      translationDictionary={isValidTranslationDictionary(content.translation_dictionary) ? content.translation_dictionary : null}
                      textColor="text-white"
                      tooltipStyle="dark"
                    >
                      {content.short_description}
                    </MarkdownRenderer>
                  </div>
                )}
              </div>
            ) : (
              <div 
                className="flex items-center gap-2"
                onClick={() => onContentClick({
                  content,
                  contextList: subtopicContent
                })}
              >
                <LocalContentThumbnail 
                  content={content} 
                  isGroupCard={isGroupCard}
                  onClick={() => onContentClick({
                    content,
                    contextList: subtopicContent
                  })}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h4 className="text-base font-medium leading-tight flex-1 min-w-0 text-left" style={{ color: '#ffff78e6' }}>{content.title}</h4>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <ContentRatingButtons 
                        key={`${content.id}-rating`}
                        contentId={content.id}
                        compact={true}
                        studentId={localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).id : 'GV0002'}
                      />
                      <NoteButton
                        contentId={content.id}
                        studentId={localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).id : 'GV0002'}
                        compact={true}
                        onOpenNote={() => {
                          setNoteDialogContentId(content.id);
                          setNoteDialogOpen(true);
                        }}
                      />
                      {(hasVideo1 || hasVideo2) && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-white hover:bg-red-500/20 hover:text-white bg-red-500/10 border-red-400/50 text-xs px-2 py-1 h-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            setVideoPopupOpen(true);
                          }}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          {(hasVideo1 && hasVideo2) ? '2 Videos' : 'Video'}
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="text-black hover:bg-white/20 hover:text-black bg-white/90 border-white/50 text-xs px-1 py-0.5 h-5 opacity-60 hover:opacity-80">
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
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <CompactContentDifficultyIndicator contentId={content.id} />
                  </div>
                  {content.short_description && (
                    <div className="text-white/90 text-sm leading-relaxed">
                      <MarkdownRenderer 
                        className="text-sm leading-relaxed"
                        translationDictionary={isValidTranslationDictionary(content.translation_dictionary) ? content.translation_dictionary : null}
                        textColor="text-white/90"
                        tooltipStyle="dark"
                      >
                        {content.short_description}
                      </MarkdownRenderer>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Inline Grouped Content Expansion - Responsive Layout */}
        {isGroupCard && groupedContent.length > 0 && isGroupExpanded && (
          <div className="mt-3 pt-3 border-t border-purple-400/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {groupedContent.map((groupItem) => (
                <div key={groupItem.id} className={cn(
                  "bg-white/5 border border-white/20 hover:bg-white/10 transition-all duration-200 rounded-lg p-3 cursor-pointer",
                  activeContentId === groupItem.id && "ring-4 ring-yellow-400/80 bg-yellow-500/20 border-yellow-400/70 shadow-lg shadow-yellow-400/20"
                )}
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
                            studentId={localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).id : 'GV0002'}
                          />
                          <NoteButton
                            contentId={groupItem.id}
                            studentId={localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).id : 'GV0002'}
                            compact={true}
                            onOpenNote={() => {
                              setNoteDialogContentId(groupItem.id);
                              setNoteDialogOpen(true);
                            }}
                          />
                          {((groupItem.videoid && groupItem.videoid.trim()) || (groupItem.videoid2 && groupItem.videoid2.trim())) && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-white hover:bg-red-500/20 hover:text-white bg-red-500/10 border-red-400/50 text-xs px-1 py-0.5 h-5"
                              onClick={(e) => {
                                e.stopPropagation();
                                setVideoPopupOpen(true);
                                setSelectedGroupVideo(groupItem);
                              }}
                            >
                              <Play className="h-2 w-2 mr-0.5" />
                              Video{((groupItem.videoid && groupItem.videoid.trim()) && (groupItem.videoid2 && groupItem.videoid2.trim())) ? 's' : ''}
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="text-black hover:bg-white/20 hover:text-black bg-white/90 border-white/50 text-xs px-1 py-0.5 h-5">
                                Quiz
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
        )}

        {/* Video Popup */}
        <Dialog open={videoPopupOpen} onOpenChange={(open) => {
          setVideoPopupOpen(open);
          if (!open) setSelectedGroupVideo(null);
        }}>
          <DialogContent className="max-w-5xl max-h-[90vh] p-0 bg-gray-900 border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
              <h3 className="text-white text-lg font-medium truncate mr-4">
                {selectedGroupVideo ? selectedGroupVideo.title : content.title}
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setVideoPopupOpen(false);
                  setSelectedGroupVideo(null);
                }}
                className="text-white hover:bg-white/20 flex-shrink-0"
              >
                ✕
              </Button>
            </div>
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {(selectedGroupVideo || hasVideo1 || hasVideo2) && (() => {
                // Get video data for the current video content
                const currentContent = selectedGroupVideo || content;
                const { videoData: currentVideoData, video2Data: currentVideo2Data, videoEmbedUrl: currentVideoEmbedUrl, video2EmbedUrl: currentVideo2EmbedUrl } = useContentMedia(currentContent);
                const currentHasVideo1 = currentVideoEmbedUrl && currentVideoData;
                const currentHasVideo2 = currentVideo2EmbedUrl && currentVideo2Data;

                return (
                  <>
                    {currentHasVideo1 && (
                      <div>
                        {currentVideoData?.video_name && (
                          <h4 className="text-white font-medium mb-3 text-base">{currentVideoData.video_name}</h4>
                        )}
                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                          <iframe 
                            className="w-full h-full" 
                            src={currentVideoEmbedUrl || ''} 
                            title={currentVideoData?.video_name || 'Video 1'} 
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}
                    {currentHasVideo2 && (
                      <div>
                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                          <iframe 
                            className="w-full h-full" 
                            src={currentVideo2EmbedUrl || ''} 
                            title={currentVideo2Data?.video_name || 'Video 2'} 
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>

        {/* Personal Note Dialog */}
        <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
          <DialogContent className="max-w-md p-0 bg-white border-gray-300">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-gray-900 text-lg font-medium">Personal Note</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setNoteDialogOpen(false)}
                className="text-gray-500 hover:bg-gray-200 flex-shrink-0"
              >
                ✕
              </Button>
            </div>
            <div className="p-6">
              <PersonalNoteContent 
                contentId={noteDialogContentId}
                studentId={localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).id : 'GV0002'}
                onClose={() => setNoteDialogOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};
