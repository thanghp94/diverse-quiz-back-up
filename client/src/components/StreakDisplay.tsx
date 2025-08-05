import { useQuery } from '@tanstack/react-query';
import { Flame } from 'lucide-react';

interface StreakDisplayProps {
  studentId: string;
  className?: string;
}

export const StreakDisplay = ({ studentId, className = "" }: StreakDisplayProps) => {
  const { data: streak } = useQuery({
    queryKey: ['streaks', studentId],
    queryFn: async () => {
      const response = await fetch(`/api/streaks/${studentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch streak');
      }
      return response.json();
    },
    enabled: !!studentId,
  });

  if (!streak) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Flame className="w-5 h-5 text-orange-500" />
        <span className="text-sm font-medium">0 Day Streak</span>
      </div>
    );
  }

  const currentStreak = (streak as any)?.current_streak || 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Flame className={`w-5 h-5 ${currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
      <span className="text-sm font-medium">
        {currentStreak} Day{currentStreak !== 1 ? 's' : ''} Streak
      </span>
    </div>
  );
};