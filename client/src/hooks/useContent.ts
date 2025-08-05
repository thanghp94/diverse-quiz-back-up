
import { useQuery } from "@tanstack/react-query";
import type { Content } from "@shared/schema";

export type { Content };

export const useContent = (topicId?: string) => {
  return useQuery({
    queryKey: ['content', topicId],
    queryFn: async () => {
      console.log('Fetching content from API...', topicId ? `for topic ${topicId}` : 'all content');
      
      const url = topicId ? `/api/content?topicId=${topicId}` : '/api/content';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
      
      const data = await response.json();
      console.log('Content fetched:', data);
      return data as Content[];
    },
    enabled: true,
  });
};

export const useContentById = (contentId: string) => {
  return useQuery({
    queryKey: ['content', contentId],
    queryFn: async () => {
      console.log('Fetching content by ID from API...', contentId);
      
      const response = await fetch(`/api/content/${contentId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch content by ID');
      }
      
      const data = await response.json();
      console.log('Content by ID fetched:', data);
      return data as Content | null;
    },
    enabled: !!contentId,
  });
};
