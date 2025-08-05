import { useState, useEffect } from 'react';

interface QuestionAvailability {
  contentId: string;
  hasEasy: boolean;
  hasHard: boolean;
  hasOverview: boolean;
  totalQuestions: number;
}

export const useQuestionAvailability = (contentIds: string[]) => {
  const [availability, setAvailability] = useState<Map<string, QuestionAvailability>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAvailability = async () => {
      if (contentIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const results = new Map<string, QuestionAvailability>();
        
        // Check each content ID for question availability
        const checks = contentIds.map(async (contentId) => {
          try {
            // Check all difficulty levels in parallel
            const [easyResponse, hardResponse, overviewResponse] = await Promise.all([
              fetch(`/api/questions?contentId=${contentId}&level=easy`),
              fetch(`/api/questions?contentId=${contentId}&level=hard`), 
              fetch(`/api/questions?contentId=${contentId}&level=Overview`)
            ]);

            const [easyQuestions, hardQuestions, overviewQuestions] = await Promise.all([
              easyResponse.ok ? easyResponse.json() : [],
              hardResponse.ok ? hardResponse.json() : [],
              overviewResponse.ok ? overviewResponse.json() : []
            ]);

            const availability: QuestionAvailability = {
              contentId,
              hasEasy: easyQuestions.length > 0,
              hasHard: hardQuestions.length > 0,
              hasOverview: overviewQuestions.length > 0,
              totalQuestions: easyQuestions.length + hardQuestions.length + overviewQuestions.length
            };

            results.set(contentId, availability);
          } catch (error) {
            console.error(`Error checking questions for content ${contentId}:`, error);
            results.set(contentId, {
              contentId,
              hasEasy: false,
              hasHard: false,
              hasOverview: false,
              totalQuestions: 0
            });
          }
        });

        await Promise.all(checks);
        setAvailability(results);
      } catch (error) {
        console.error('Error checking question availability:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAvailability();
  }, [contentIds]);

  return { availability, loading };
};