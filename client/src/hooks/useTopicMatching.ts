import { useQuery } from '@tanstack/react-query';

interface MatchingActivity {
  id: string;
  topicid: string | null;
  type: string | null;
  description: string | null;
  subject: string | null;
  topic: string | null;
}

interface Topic {
  id: string;
  topic: string;
  parentid: string | null;
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

export const useTopicMatching = (topicId: string) => {
  const { data: matchingActivities, isLoading, error } = useQuery({
    queryKey: ['matchingByTopic', topicId],
    queryFn: () => fetchMatchingByTopic(topicId),
    enabled: !!topicId,
  });

  const hasMatchingActivities = matchingActivities && matchingActivities.length > 0;

  return {
    matchingActivities,
    hasMatchingActivities,
    isLoading,
    error
  };
};

export const useParentTopicMatching = (parentTopicId: string) => {
  const { data: allTopics } = useQuery({
    queryKey: ['topics'],
    queryFn: fetchAllTopics,
  });

  const { data: allMatchingActivities } = useQuery({
    queryKey: ['matching'],
    queryFn: fetchAllMatchingActivities,
  });

  // Get all subtopics under this parent
  const subtopics = allTopics?.filter(topic => topic.parentid === parentTopicId) || [];
  const subtopicIds = subtopics.map(topic => topic.id);
  
  // Include the parent topic itself
  const allRelevantTopicIds = [parentTopicId, ...subtopicIds];
  
  // Get all matching activities for parent and subtopics
  const parentMatchingActivities = allMatchingActivities?.filter(activity => 
    activity.topicid && allRelevantTopicIds.includes(activity.topicid)
  ) || [];

  const hasParentMatchingActivities = parentMatchingActivities.length > 0;

  return {
    parentMatchingActivities,
    hasParentMatchingActivities,
    subtopics,
    isLoading: !allTopics || !allMatchingActivities,
  };
};