import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, Minus, ThumbsDown } from "lucide-react";

interface ContentDifficultyIndicatorProps {
  contentId: string;
  className?: string;
}

interface RatingStats {
  easy: number;
  normal: number;
  hard: number;
}

export const ContentDifficultyIndicator = ({ contentId, className = "" }: ContentDifficultyIndicatorProps) => {
  const { data: stats } = useQuery<RatingStats>({
    queryKey: [`/api/content-ratings/stats/${contentId}`],
    enabled: !!contentId,
  });

  const ratingStats: RatingStats = stats || { easy: 0, normal: 0, hard: 0 };

  if (ratingStats.easy === 0 && ratingStats.normal === 0 && ratingStats.hard === 0) {
    return null;
  }

  const total = ratingStats.easy + ratingStats.normal + ratingStats.hard;
  const predominantDifficulty = 
    ratingStats.hard > ratingStats.normal && ratingStats.hard > ratingStats.easy ? 'hard' :
    ratingStats.easy > ratingStats.normal && ratingStats.easy > ratingStats.hard ? 'easy' : 'normal';

  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty) {
      case 'hard':
        return {
          icon: <ThumbsDown className="w-3 h-3" />,
          label: 'Really Hard',
          variant: 'destructive' as const,
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          textColor: 'text-red-800 dark:text-red-200',
          borderColor: 'border-red-300 dark:border-red-700'
        };
      case 'normal':
        return {
          icon: <Minus className="w-3 h-3" />,
          label: 'Normal',
          variant: 'secondary' as const,
          bgColor: 'bg-orange-100 dark:bg-orange-900/20',
          textColor: 'text-orange-800 dark:text-orange-200',
          borderColor: 'border-orange-300 dark:border-orange-700'
        };
      default:
        return {
          icon: <ThumbsUp className="w-3 h-3" />,
          label: 'Easy',
          variant: 'default' as const,
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          textColor: 'text-green-800 dark:text-green-200',
          borderColor: 'border-green-300 dark:border-green-700'
        };
    }
  };

  const config = getDifficultyConfig(predominantDifficulty);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex items-center gap-1 px-2 py-1 rounded-md border ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
        {config.icon}
        <span className="text-xs font-medium">{config.label}</span>
        <span className="text-xs opacity-75">({total})</span>
      </div>
    </div>
  );
};

// Compact version for smaller spaces
export const CompactContentDifficultyIndicator = ({ contentId, className = "" }: ContentDifficultyIndicatorProps) => {
  const { data: stats } = useQuery<RatingStats>({
    queryKey: [`/api/content-ratings/stats/${contentId}`],
    enabled: !!contentId,
  });

  const ratingStats: RatingStats = stats || { easy: 0, normal: 0, hard: 0 };

  const total = ratingStats.easy + ratingStats.normal + ratingStats.hard;
  const predominantDifficulty = 
    ratingStats.hard > ratingStats.normal && ratingStats.hard > ratingStats.easy ? 'hard' :
    ratingStats.easy > ratingStats.normal && ratingStats.easy > ratingStats.hard ? 'easy' : 'normal';

  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty) {
      case 'hard':
        return {
          icon: <ThumbsDown className="w-3 h-3" />,
          label: 'Hard',
          variant: 'destructive' as const,
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          textColor: 'text-red-800 dark:text-red-200',
          borderColor: 'border-red-300 dark:border-red-700'
        };
      case 'normal':
        return {
          icon: <Minus className="w-3 h-3" />,
          label: 'Normal',
          variant: 'secondary' as const,
          bgColor: 'bg-orange-100 dark:bg-orange-900/20',
          textColor: 'text-orange-800 dark:text-orange-200',
          borderColor: 'border-orange-300 dark:border-orange-700'
        };
      default:
        return {
          icon: <ThumbsUp className="w-3 h-3" />,
          label: 'Easy',
          variant: 'default' as const,
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          textColor: 'text-green-800 dark:text-green-200',
          borderColor: 'border-green-300 dark:border-green-700'
        };
    }
  };

  if (total === 0) {
    return null;
  }

  const config = getDifficultyConfig(predominantDifficulty);

  return (
    <div className="flex items-center gap-2">
      <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${config.bgColor} ${config.textColor} ${config.borderColor} border ${className}`}>
        {config.icon}
        <span className="font-medium">{config.label}</span>
      </div>
    </div>
  );
};