import React from 'react';
import { Button } from "@/components/ui/button";
import { Shuffle, X } from "lucide-react";

interface MatchingHeaderProps {
  activityTitle?: string;
  questionDescription?: string;
  questionTopic?: string;
  onClose?: () => void;
  isSubmitted: boolean;
  isSubmitting: boolean;
  hasMatches: boolean;
  hasSequentialMatching: boolean;
  currentQuizPhase?: 'picture-title' | 'title-description' | null;
  onCheckResults: () => void;
  onNextPhase?: () => void;
  onNextActivity?: () => void;
}

export const MatchingHeader: React.FC<MatchingHeaderProps> = ({
  activityTitle,
  questionDescription,
  questionTopic,
  onClose,
  isSubmitted,
  isSubmitting,
  hasMatches,
  hasSequentialMatching,
  currentQuizPhase,
  onCheckResults,
  onNextPhase,
  onNextActivity,
}) => {
  return (
    <>
      {/* Close button positioned outside the modal */}
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute -top-12 -right-2 z-50 h-10 w-10 text-white hover:bg-white/20 hover:text-white bg-black/20 backdrop-blur-sm rounded-full border border-white/20"
        >
          <X className="h-5 w-5" />
        </Button>
      )}

      {/* Merged header with topic title, instructions, and controls */}
      <div className="flex justify-between items-center px-3 py-2 bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 shadow-lg">
        <div className="flex items-center gap-2">
          <Shuffle className="h-5 w-5 text-white" />
          <h1 className="text-lg font-bold text-white drop-shadow-lg">
            {activityTitle || questionDescription || questionTopic}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {!isSubmitted ? (
            <div className="flex items-center gap-2">
              {hasMatches && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCheckResults}
                  disabled={isSubmitting}
                  className="text-white border-white/40 bg-black/20 hover:bg-black/30 hover:border-white/60 transition-colors backdrop-blur-sm"
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
    </>
  );
};
