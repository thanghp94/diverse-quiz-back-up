import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Content } from "@/hooks/useContent";
import ContentCard from "@/components/content-management/core/cards/ContentCard";
import { useQuery } from "@tanstack/react-query";

interface TopicContentWithMatchingProps {
  topicId: string;
  topicContent: Content[];
  onContentClick: (info: { content: Content; contextList: Content[] }) => void;
  onStartQuiz: (content: Content, contextList: Content[], level: 'Easy' | 'Hard') => void;
}

export const TopicContentWithMatching: React.FC<TopicContentWithMatchingProps> = ({ 
  topicId, 
  topicContent, 
  onContentClick, 
  onStartQuiz 
}) => {
  const [expandedMatching, setExpandedMatching] = React.useState<string | null>(null);

  // Fetch matching activities for this topic
  const { data: matchingActivities } = useQuery({
    queryKey: ['matchingByTopic', topicId],
    queryFn: async () => {
      const response = await fetch(`/api/matching/topic/${topicId}`);
      if (!response.ok) throw new Error('Failed to fetch matching activities');
      return response.json();
    },
  });

  // Debug log
  React.useEffect(() => {
    if (matchingActivities) {
      console.log(`Topic ${topicId} matching activities:`, matchingActivities);
      console.log(`Topic ${topicId} content:`, topicContent);
    }
  }, [matchingActivities, topicContent, topicId]);

  // Enhanced function to get content IDs from prompt
  const getContentIdsFromPrompt = (matching: any) => {
    const contentIds = new Set<string>();

    // Check all prompt fields
    const promptFields = ['prompt', 'prompt1', 'prompt2', 'prompt3', 'prompt4', 'prompt5', 'prompt6'];

    promptFields.forEach(field => {
      if (matching[field]) {
        const promptText = matching[field].toString();

        // Try to match UUID patterns (both full and short)
        const uuidPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}|[a-f0-9]{8}/gi;
        const matches = promptText.match(uuidPattern) || [];
        matches.forEach((id: string) => contentIds.add(id));

        // Also try to match content by title or partial text match
        topicContent.forEach(content => {
          if (promptText.toLowerCase().includes(content.title?.toLowerCase() || '')) {
            contentIds.add(content.id);
          }
        });
      }
    });

    return Array.from(contentIds);
  };

  // Group content by matching activities
  const organizedContent = React.useMemo(() => {
    if (!matchingActivities?.length || !topicContent?.length) {
      return {
        ungrouped: topicContent || [],
        grouped: []
      };
    }

    const grouped: Array<{
      matching: any;
      content: Content[];
    }> = [];

    const usedContentIds = new Set<string>();

    // For each matching activity, find associated content
    matchingActivities.forEach((matching: any) => {
      const contentIds = getContentIdsFromPrompt(matching);
      console.log(`Matching ${matching.id} content IDs:`, contentIds);

      const associatedContent = topicContent.filter(content => 
        contentIds.includes(content.id)
      );

      console.log(`Matching ${matching.id} associated content:`, associatedContent);

      // Even if no content is directly associated, still show the matching activity
      // This way users can see that matching activities exist for this topic
      grouped.push({
        matching,
        content: associatedContent
      });

      associatedContent.forEach(content => usedContentIds.add(content.id));
    });

    // Remaining content that wasn't grouped
    const ungrouped = topicContent.filter(content => !usedContentIds.has(content.id));

    console.log(`Topic ${topicId} organized:`, { ungrouped: ungrouped.length, grouped: grouped.length });
    return { ungrouped, grouped };
  }, [matchingActivities, topicContent, topicId]);

  return (
    <div className="space-y-4">
      {/* Debug info */}
      {matchingActivities && matchingActivities.length > 0 && (
        <div className="text-xs text-gray-400 mb-2">
          Found {matchingActivities.length} matching activities for this topic
        </div>
      )}

      {/* Ungrouped content at the top */}
      {organizedContent.ungrouped.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-white/80 text-sm font-medium">Content</h4>
          <div className="grid grid-cols-2 gap-3">
            {organizedContent.ungrouped.map(content => (
              <ContentCard 
                key={content.id} 
                content={content} 
                topicContent={topicContent}
                onContentClick={onContentClick}
                onStartQuiz={onStartQuiz}
              />
            ))}
          </div>
        </div>
      )}

      {/* Matching activity section */}
      {organizedContent.grouped.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-white/80 text-sm font-medium">Matching Activities</h4>

          {/* Matching activity cards in 2-column layout */}
          <div className="grid grid-cols-2 gap-3">
            {organizedContent.grouped.map(({ matching, content }) => (
              <div
                key={matching.id}
                className={cn(
                  "cursor-pointer bg-blue-500/10 border border-blue-400/30 hover:bg-blue-500/20 transition-all duration-200 rounded-lg p-3",
                  expandedMatching === matching.id && "ring-2 ring-blue-400/50"
                )}
                onClick={() => setExpandedMatching(expandedMatching === matching.id ? null : matching.id)}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="bg-blue-500/30 p-2 rounded-lg border border-blue-400/40">
                    <Shuffle className="h-5 w-5 text-blue-200" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white/90 text-sm font-medium leading-tight">
                      {matching.topic || matching.description || matching.subject || 'Matching Activity'}
                    </h4>
                    <p className="text-white/60 text-xs mt-1">
                      {content.length > 0 ? `${content.length} content items` : 'Click to start'}
                    </p>
                    <Badge variant="outline" className="border-blue-300/30 text-blue-200 text-xs mt-2">
                      Matching
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Expanded content for selected matching activity - breaks out of grid */}
          {expandedMatching && (
            <div className="mt-4 p-4 bg-blue-500/5 border border-blue-400/20 rounded-lg">
              {(() => {
                const selectedGroup = organizedContent.grouped.find(g => g.matching.id === expandedMatching);
                if (!selectedGroup) return null;

                return (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-white/90 font-medium">
                        {selectedGroup.matching.topic || selectedGroup.matching.description || 'Matching Activity Content'}
                      </h5>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedMatching(null)}
                        className="text-white/60 hover:text-white"
                      >
                        Collapse
                      </Button>
                    </div>

                    {selectedGroup.content.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {selectedGroup.content.map(contentItem => (
                          <ContentCard 
                            key={contentItem.id} 
                            content={contentItem} 
                            topicContent={topicContent}
                            onContentClick={onContentClick}
                            onStartQuiz={onStartQuiz}
                            customActions={undefined}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-white/60 text-sm">
                          No specific content items are linked to this matching activity.
                        </p>
                        <p className="text-white/60 text-xs mt-1">
                          The activity may use content from multiple topics or external sources.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
