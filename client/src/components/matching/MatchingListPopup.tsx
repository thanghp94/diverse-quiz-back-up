import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, X, Shuffle, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MatchingListPopupProps {
  isOpen: boolean;
  onClose: () => void;
  topicId: string;
  topicName: string;
  onSelectMatching: (matchingId: string, matchingTitle: string) => void;
}

interface MatchingActivity {
  id: string;
  type: string | null;
  subject: string | null;
  topic: string | null;
  description: string | null;
  topicid: string | null;
  prompt1: string | null;
  prompt2: string | null;
  prompt3: string | null;
  prompt4: string | null;
  prompt5: string | null;
  prompt6: string | null;
}

interface Topic {
  id: string;
  topic: string;
  parentid: string | null;
}

interface MatchingActivityWithTopic extends MatchingActivity {
  topicName?: string;
  isFromSubtopic?: boolean;
}

const fetchMatchingByTopic = async (topicId: string): Promise<MatchingActivity[]> => {
  const response = await fetch(`/api/matching/topic/${topicId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch matching activities');
  }
  return response.json();
};

const fetchAllTopics = async (): Promise<Topic[]> => {
  const response = await fetch('/api/topics');
  if (!response.ok) {
    throw new Error('Failed to fetch topics');
  }
  return response.json();
};

const fetchAllMatchingActivities = async (): Promise<MatchingActivity[]> => {
  const response = await fetch('/api/matching');
  if (!response.ok) {
    throw new Error('Failed to fetch matching activities');
  }
  return response.json();
};

export const MatchingListPopup = ({ 
  isOpen, 
  onClose, 
  topicId, 
  topicName, 
  onSelectMatching 
}: MatchingListPopupProps) => {
  // Fetch all data needed for hierarchical matching
  const { data: allTopics } = useQuery({
    queryKey: ['topics'],
    queryFn: fetchAllTopics,
    enabled: isOpen,
  });

  const { data: allMatchingActivities } = useQuery({
    queryKey: ['matching'],
    queryFn: fetchAllMatchingActivities,
    enabled: isOpen,
  });

  const { data: directMatchingActivities, isLoading, error } = useQuery({
    queryKey: ['matchingByTopic', topicId],
    queryFn: () => fetchMatchingByTopic(topicId),
    enabled: isOpen && !!topicId,
  });

  // Check if this is a parent topic (no parentid)
  const currentTopic = allTopics?.find(topic => topic.id === topicId);
  const isParentTopic = currentTopic && !currentTopic.parentid;

  // Get hierarchical matching activities for parent topics
  const hierarchicalMatchingActivities: MatchingActivityWithTopic[] = React.useMemo(() => {
    console.log('Processing matching activities for topicId:', topicId);
    console.log('Is parent topic:', isParentTopic);
    console.log('Direct matching activities:', directMatchingActivities);
    console.log('All matching activities count:', allMatchingActivities?.length);

    if (!isParentTopic || !allTopics || !allMatchingActivities) {
      // For subtopics or when data is not available, use direct activities
      const activities = directMatchingActivities?.map(activity => ({ 
        ...activity, 
        isFromSubtopic: false,
        topicName: currentTopic?.topic 
      })) || [];
      console.log('Using direct activities:', activities);
      return activities;
    }

    // Get all subtopics under this parent
    const subtopics = allTopics.filter(topic => topic.parentid === topicId);
    const subtopicIds = subtopics.map(topic => topic.id);
    
    console.log('Found subtopics:', subtopics.map(t => ({ id: t.id, topic: t.topic })));
    
    // Include the parent topic itself
    const allRelevantTopicIds = [topicId, ...subtopicIds];
    console.log('All relevant topic IDs:', allRelevantTopicIds);
    
    // Get all matching activities for parent and subtopics
    const relevantActivities = allMatchingActivities.filter(activity => {
      const matches = activity.topicid && allRelevantTopicIds.includes(activity.topicid);
      if (matches) {
        console.log('Found matching activity:', { id: activity.id, topicid: activity.topicid, topic: activity.topic });
      }
      return matches;
    });

    console.log('Relevant activities found:', relevantActivities.length);

    // Add topic name information to each activity and remove duplicates
    const activitiesWithTopicInfo = relevantActivities.map(activity => {
      const activityTopic = allTopics.find(topic => topic.id === activity.topicid);
      return {
        ...activity,
        topicName: activityTopic?.topic,
        isFromSubtopic: activity.topicid !== topicId
      };
    });

    // Remove duplicates based on activity ID
    const uniqueActivities = activitiesWithTopicInfo.filter((activity, index, self) => 
      index === self.findIndex(a => a.id === activity.id)
    );

    console.log('Final unique activities:', uniqueActivities);
    return uniqueActivities;
  }, [isParentTopic, allTopics, allMatchingActivities, directMatchingActivities, topicId, currentTopic]);

  const matchingActivities = hierarchicalMatchingActivities;

  const handleMatchingClick = (activity: MatchingActivity) => {
    onSelectMatching(activity.id, activity.topic || 'Matching Activity');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Shuffle className="h-6 w-6" />
            {topicName} - Matching Activities
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-3 text-gray-600">Loading matching activities...</span>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-red-500">Error loading matching activities.</p>
            </div>
          ) : !matchingActivities || matchingActivities.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <Shuffle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No matching activities found for this topic.</p>
                <p className="text-gray-400 text-sm mt-2">This topic may not have any matching exercises available.</p>
                {/* Debug information */}
                <div className="mt-4 text-xs text-gray-300 border-t pt-4">
                  <p>Debug Info:</p>
                  <p>Topic ID: {topicId}</p>
                  <p>Is Parent Topic: {isParentTopic ? 'Yes' : 'No'}</p>
                  <p>Direct Activities: {directMatchingActivities?.length || 0}</p>
                  <p>All Activities Available: {allMatchingActivities?.length || 0}</p>
                  {isParentTopic && allTopics && (
                    <p>Subtopics: {allTopics.filter(t => t.parentid === topicId).length}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {matchingActivities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-blue-300 bg-white rounded-lg p-4 flex items-center justify-between"
                  onClick={() => handleMatchingClick(activity)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {activity.topic || 'Untitled Activity'}
                      </h3>
                      {activity.subject && (
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
                          {activity.subject}
                        </div>
                      )}
                      {activity.isFromSubtopic && activity.topicName && (
                        <Badge variant="secondary" className="text-xs">
                          From: {activity.topicName}
                        </Badge>
                      )}
                    </div>
                    {activity.description && (
                      <p className="text-base text-gray-600 mt-2">
                        {activity.description}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <Play className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchingListPopup;