import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useMatchingAttempts, useCreateMatchingAttempt, useUpdateMatchingAttempt, type CreateMatchingAttempt } from '@/hooks/useMatchingAttempts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Trophy, BarChart3, CheckCircle, XCircle } from 'lucide-react';

interface MatchingActivityTrackerProps {
  matchingId: string;
  studentId: string;
  onAttemptStart?: (attemptId: string) => void;
  onAttemptComplete?: (score: number, isCorrect: boolean) => void;
}

export interface MatchingActivityTrackerRef {
  completeAttempt: (answers: any, score: number, maxScore?: number, forceIsCorrect?: boolean) => void;
}

export const MatchingActivityTracker = forwardRef<MatchingActivityTrackerRef, MatchingActivityTrackerProps>(({ 
  matchingId, 
  studentId, 
  onAttemptStart, 
  onAttemptComplete 
}, ref) => {
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isActive, setIsActive] = useState(false);

  const { data: attempts = [], isLoading } = useMatchingAttempts(studentId, matchingId);
  const createAttempt = useCreateMatchingAttempt();
  const updateAttempt = useUpdateMatchingAttempt();

  const startNewAttempt = () => {
    const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newAttempt: CreateMatchingAttempt = {
      id: attemptId,
      student_id: studentId,
      matching_id: matchingId,
      time_start: now,
      attempt_number: (attempts.length || 0) + 1,
    };

    createAttempt.mutate(newAttempt, {
      onSuccess: () => {
        setCurrentAttemptId(attemptId);
        setStartTime(now);
        setIsActive(true);
        onAttemptStart?.(attemptId);
      }
    });
  };

  const completeAttempt = (answers: any, score: number, maxScore: number = 100, forceIsCorrect?: boolean) => {
    if (!currentAttemptId || !startTime) return;

    const endTime = new Date();
    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    // Use the passed isCorrect value if provided, otherwise fall back to score comparison
    const isCorrect = forceIsCorrect !== undefined ? forceIsCorrect : score === maxScore;

    updateAttempt.mutate({
      id: currentAttemptId,
      updates: {
        answers,
        score,
        max_score: maxScore,
        is_correct: isCorrect,
        time_end: endTime,
        duration_seconds: durationSeconds,
      }
    }, {
      onSuccess: () => {
        setIsActive(false);
        setCurrentAttemptId(null);
        setStartTime(null);
        onAttemptComplete?.(score, isCorrect);
      }
    });
  };

  useImperativeHandle(ref, () => ({
    completeAttempt
  }));

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const bestScore = attempts.length > 0 
    ? Math.max(...attempts.map((a: any) => a.score || 0))
    : 0;

  const averageScore = attempts.length > 0
    ? attempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / attempts.length
    : 0;

  const totalPoints = attempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Activity Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Activity Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isActive ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ready to start a new attempt
              </p>
              <Button onClick={startNewAttempt} disabled={createAttempt.isPending}>
                {createAttempt.isPending ? 'Starting...' : 'Begin New Attempt'}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Attempt #{(attempts.length || 0) + 1} in progress</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Started at {startTime?.toLocaleTimeString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{attempts.length}</div>
              <div className="text-xs text-muted-foreground">Total Attempts</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(bestScore, 100)}`}>
                {bestScore}
              </div>
              <div className="text-xs text-muted-foreground">Best Score</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(averageScore, 100)}`}>
                {Math.round(averageScore)}
              </div>
              <div className="text-xs text-muted-foreground">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{totalPoints}</div>
              <div className="text-xs text-muted-foreground">Total Points</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Attempts */}
      {attempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attempts.slice(0, 5).map((attempt: any, index: number) => (
                <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{attempt.attempt_number}</Badge>
                    <div>
                      <div className="flex items-center gap-2">
                        {attempt.is_correct ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`font-medium ${getScoreColor(attempt.score || 0, attempt.max_score || 100)}`}>
                          {attempt.score}/{attempt.max_score} points
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(attempt.created_at).toLocaleDateString()} at{' '}
                        {new Date(attempt.created_at).toLocaleTimeString()}
                        {attempt.duration_seconds && (
                          <span> • {formatDuration(attempt.duration_seconds)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getScoreColor(attempt.score || 0, attempt.max_score || 100)}`}>
                      {Math.round(((attempt.score || 0) / (attempt.max_score || 100)) * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

MatchingActivityTracker.displayName = 'MatchingActivityTracker';