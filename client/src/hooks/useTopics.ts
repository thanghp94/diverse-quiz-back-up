
import { useQuery } from "@tanstack/react-query";

export interface Topic {
  id: string;
  topic: string;
  short_summary?: string;
  challengesubject?: string;
  image?: string;
  parentid?: string;
  showstudent?: boolean;
}

export const useTopics = () => {
  return useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      console.log('Fetching topics from API...');
      const response = await fetch('/api/topics');
      if (!response.ok) {
        throw new Error('Failed to fetch topics');
      }
      const data = await response.json();
      console.log('Topics fetched:', data);
      return data as Topic[];
    },
  });
};
