import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { ThumbsDown, ThumbsUp } from 'lucide-react';

interface ContentRatingButtonsProps {
  contentId: string;
  studentId?: string;
  initialRating?: string;
  onRatingChange?: (rating: string) => void;
  compact?: boolean;
}

export const ContentRatingButtons = ({ 
  contentId, 
  studentId, 
  initialRating, 
  onRatingChange,
  compact = false 
}: ContentRatingButtonsProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Get studentId from localStorage if not provided
  const effectiveStudentId = studentId || (typeof window !== 'undefined' && localStorage.getItem('currentUser') 
    ? JSON.parse(localStorage.getItem('currentUser')!).id 
    : 'GV0002'); // Default demo student

  // Fetch existing rating for this user and content
  const { data: existingRating, isLoading, refetch } = useQuery<{ rating: string } | null>({
    queryKey: [`/api/content-ratings/${effectiveStudentId}/${contentId}`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/content-ratings/${effectiveStudentId}/${contentId}`);
        if (!response.ok) {
          if (response.status === 404) {
            return null; // No rating exists yet
          }
          throw new Error('Failed to fetch rating');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching rating:', error);
        return null;
      }
    },
    enabled: !!effectiveStudentId && !!contentId,
    staleTime: 1000, // Consider data stale after 1 second
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 1, // Only retry once on failure
  });

  // Get the current rating - prioritize database data over initial prop
  const currentRating = existingRating?.rating || initialRating || null;

  // Debug log current state
  useEffect(() => {
    console.log('ContentRatingButtons state:', {
      contentId,
      effectiveStudentId,
      currentRating,
      existingRating: existingRating?.rating,
      isLoading
    });
  }, [contentId, effectiveStudentId, currentRating, existingRating?.rating, isLoading]);

  const handleRating = async (rating: string) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      console.log('Submitting rating:', { effectiveStudentId, contentId, rating });

      await apiRequest(`/content-ratings/${effectiveStudentId}/${contentId}`, {
        method: 'PUT',
        body: JSON.stringify({ rating }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Immediately refetch the rating to ensure consistency
      await refetch();

      onRatingChange?.(rating);

      // Invalidate related queries to refresh the cache
      await queryClient.invalidateQueries({ 
        queryKey: [`/api/content-ratings/${effectiveStudentId}/${contentId}`] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: [`/api/content-ratings/stats/${contentId}`] 
      });

      const ratingText = rating === 'really_bad' ? 'Really Hard' : 
                        rating === 'normal' ? 'Normal' : 'Easy';

      toast({
        title: "Rating Saved",
        description: `Content marked as ${ratingText}`,
      });
    } catch (error) {
      console.error('Error saving rating:', error);
      toast({
        title: "Error",
        description: "Failed to save rating",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render until we have loaded the rating data
  if (isLoading) {
    return compact ? (
      <div className="flex gap-1">
        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
      </div>
    ) : null;
  }

  if (compact) {
    return (
      <>
        <Button
          variant={currentRating === 'really_bad' ? 'default' : 'outline'}
          size="sm"
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleRating('really_bad');
          }}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={isSubmitting}
          className={`flex items-center justify-center w-5 h-5 p-0 opacity-60 hover:opacity-80 ${
            currentRating === 'really_bad' 
              ? 'bg-red-500 hover:bg-red-600 text-white opacity-100' 
              : 'hover:bg-red-50 hover:border-red-300'
          }`}
        >
          <ThumbsDown className="w-2.5 h-2.5" />
        </Button>

        <Button
          variant={currentRating === 'ok' ? 'default' : 'outline'}
          size="sm"
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleRating('ok');
          }}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={isSubmitting}
          className={`flex items-center justify-center w-5 h-5 p-0 opacity-60 hover:opacity-80 ${
            currentRating === 'ok' 
              ? 'bg-green-500 hover:bg-green-600 text-white opacity-100' 
              : 'hover:bg-green-50 hover:border-green-300'
          }`}
        >
          <ThumbsUp className="w-2.5 h-2.5" />
        </Button>
      </>
    );
  }

  return null;
};