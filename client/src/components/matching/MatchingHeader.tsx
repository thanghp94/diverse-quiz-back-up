import { Button } from "@/components/ui/button";
import { Shuffle } from "lucide-react";

interface MatchingHeaderProps {
  activityTitle?: string;
  question: any;
  isSubmitted: boolean;
  isSubmitting: boolean;
  hasMatches: boolean;
  showResults: boolean;
  hasSequentialMatching?: boolean;
  currentQuizPhase?: string;
  onCheckResults: () => void;
  onNextPhase?: () => void;
  onNextActivity?: () => void;
}

export function MatchingHeader({
  activityTitle,
  question,
  isSubmitted,
  isSubmitting,
  hasMatches,
  showResults,
  hasSequentialMatching,
  currentQuizPhase,
  onCheckResults,
  onNextPhase,
  onNextActivity
}: MatchingHeaderProps) {
  return (
    <div className="flex justify-between items-center px-3 py-2 bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 shadow-lg">
      <div className="flex items-center gap-2">
        <Shuffle className="h-5 w-5 text-white" />
        <h1 className="text-lg font-bold text-white drop-shadow-lg">
          {activityTitle || question.description || question.topic}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {!isSubmitted ? (
          <div className="flex items-center gap-2">
            {hasMatches && !showResults && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCheckResults}
                disabled={isSubmitting}
                className="text-white border-white/20 hover:bg-white/10 transition-colors"
              >
                {isSubmitting ? 'Checking...' : 'Check Results'}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {hasSequentialMatching && currentQuizPhase === 'picture-title' ? (
              <Button
                onClick={onNextPhase}
                className="text-sm py-2 px-4 font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-300 hover:shadow-xl hover:scale-105 transition-all duration-300"
                variant="default"
              >
                Continue to Title-Description Matching →
              </Button>
            ) : (
              <Button
                onClick={onNextActivity}
                className="text-sm py-2 px-4 font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-300 hover:shadow-xl hover:scale-105 transition-all duration-300"
                variant="default"
              >
                Next Activity →
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}