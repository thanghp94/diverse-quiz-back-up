import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Question } from "@/quiz/types";

export interface QuizDataConfig {
  source: {
    type: 'topic' | 'assignment' | 'content' | 'questions';
    topicId?: string;
    level?: 'Overview' | 'Easy' | 'Hard';
    questionIds?: string[];
    contentId?: string;
  };
  enabled?: boolean;
}

export interface LinkedContent {
  id: string;
  title: string;
  short_description: string | null;
  short_blurb: string | null;
  imageid: string | null;
  topicid: string;
  videoid: string | null;
  videoid2: string | null;
  information: string | null;
}

export interface QuizDataResult {
  questions: Question[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  fetchContent: (contentId: string) => Promise<LinkedContent | null>;
}

/**
 * useQuizData - Centralized data fetching for quiz questions and content
 * Handles question loading, content retrieval, and caching optimization
 */
export const useQuizData = (config: QuizDataConfig): QuizDataResult => {
  const { toast } = useToast();

  // Fetch questions based on configuration
  const {
    data: questions = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['quiz-data', config.source],
    queryFn: async (): Promise<Question[]> => {
      if (config.source.type === 'questions' && config.source.questionIds) {
        // Direct question IDs - fetch individual questions
        const questionRequests = config.source.questionIds.map(async (id) => {
          try {
            const response = await fetch(`/api/questions/${id}`);
            if (!response.ok) {
              console.warn(`Failed to fetch question ${id}`);
              return null;
            }
            return await response.json();
          } catch (error) {
            console.warn(`Error fetching question ${id}:`, error);
            return null;
          }
        });
        
        const results = await Promise.all(questionRequests);
        return results.filter((q): q is Question => q !== null);
      }
      
      if (config.source.type === 'topic' && config.source.topicId && config.source.level) {
        // Topic-based questions - fetch by topic and level
        const response = await fetch(
          `/api/questions?topicId=${config.source.topicId}&level=${config.source.level}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch questions for topic ${config.source.topicId} level ${config.source.level}`);
        }
        
        const questions = await response.json();
        console.log(`Fetched ${questions.length} questions for topic ${config.source.topicId} level ${config.source.level}`);
        return questions;
      }
      
      if (config.source.type === 'content' && config.source.contentId) {
        // Content-based questions - fetch questions linked to specific content
        const response = await fetch(`/api/questions?contentId=${config.source.contentId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch questions for content ${config.source.contentId}`);
        }
        
        return await response.json();
      }
      
      // No valid source configuration
      return [];
    },
    enabled: config.enabled !== false && !!(
      (config.source.type === 'questions' && config.source.questionIds?.length) ||
      (config.source.type === 'topic' && config.source.topicId && config.source.level) ||
      (config.source.type === 'content' && config.source.contentId)
    ),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Retry up to 2 times for network errors
      if (failureCount < 2 && error instanceof Error && error.message.includes('fetch')) {
        return true;
      }
      return false;
    }
  });

  // Function to fetch linked content for questions
  const fetchContent = async (contentId: string): Promise<LinkedContent | null> => {
    try {
      const response = await fetch(`/api/content/${contentId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch content ${contentId}`);
      }
      
      const content = await response.json();
      console.log('Fetched linked content:', content);
      return content as LinkedContent;
    } catch (error) {
      console.error("Error fetching linked content:", error);
      toast({
        title: "Error Loading Content",
        description: "Could not load content for this question.",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    questions,
    isLoading,
    error: error as Error | null,
    refetch,
    fetchContent,
  };
};

// Hook for fetching individual content items (used by quiz components)
export const useQuizContent = (contentId: string | null) => {
  return useQuery({
    queryKey: ['quiz-content', contentId],
    queryFn: async (): Promise<LinkedContent | null> => {
      if (!contentId) return null;
      
      const response = await fetch(`/api/content/${contentId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch content ${contentId}`);
      }
      
      return await response.json();
    },
    enabled: !!contentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Hook for prefetching content for multiple questions
export const usePrefetchQuizContent = () => {
  const { toast } = useToast();

  const prefetchContent = async (questions: Question[]) => {
    const contentIds = questions
      .map((q: any) => q.contentid)
      .filter((id): id is string => !!id);

    if (contentIds.length === 0) return;

    try {
      // Prefetch content in batches to avoid overwhelming the server
      const batchSize = 5;
      for (let i = 0; i < contentIds.length; i += batchSize) {
        const batch = contentIds.slice(i, i + batchSize);
        const promises = batch.map(id => 
          fetch(`/api/content/${id}`).catch(err => {
            console.warn(`Failed to prefetch content ${id}:`, err);
            return null;
          })
        );
        
        await Promise.all(promises);
      }
      
      console.log(`Prefetched content for ${contentIds.length} questions`);
    } catch (error) {
      console.error('Error prefetching content:', error);
    }
  };

  return { prefetchContent };
};
