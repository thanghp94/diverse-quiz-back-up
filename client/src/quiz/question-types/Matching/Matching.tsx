import React from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Question } from "@/quiz/types";
import { useMatching } from "./hooks/useMatching";
import { MatchingHeader } from "./components/MatchingHeader";
import { DraggableItem } from "./components/DraggableItem";
import { DropZone } from "./components/DropZone";

interface MatchingProps {
  question: Question;
  onAnswer: (answer: any, isCorrect: boolean) => void;
  studentTryId?: string;
  onNextActivity?: () => void;
  onGoBack?: () => void;
  currentQuizPhase?: 'picture-title' | 'title-description' | null;
  onNextPhase?: () => void;
  onClose?: () => void;
  activityTitle?: string;
}

const Matching = ({ 
  question, 
  onAnswer, 
  studentTryId, 
  onNextActivity, 
  onGoBack, 
  currentQuizPhase, 
  onNextPhase, 
  onClose, 
  activityTitle 
}: MatchingProps) => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Use our custom hook for all the matching logic
  const {
    matches,
    draggedItem,
    isSubmitting,
    isSubmitted,
    showResults,
    correctMatches,
    shuffledRightItems,
    leftItems,
    rightItems,
    filteredPairs,
    effectiveMatchingType,
    hasSequentialMatching,
    isComplete,
    isImageItem,
    getTextStyling,
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleCheckResults,
  } = useMatching(question, currentQuizPhase, onAnswer, onNextPhase, activityTitle);

  return (
    <div className="h-full flex flex-col relative">
      {/* Header Component */}
      <MatchingHeader
        activityTitle={activityTitle}
        questionDescription={question.description}
        questionTopic={question.topic}
        onClose={onClose}
        isSubmitted={isSubmitted}
        isSubmitting={isSubmitting}
        hasMatches={Object.keys(matches).length > 0}
        hasSequentialMatching={hasSequentialMatching}
        currentQuizPhase={currentQuizPhase}
        onCheckResults={handleCheckResults}
        onNextPhase={onNextPhase}
        onNextActivity={onNextActivity}
      />

      {/* Main content area - enhanced styling */}
      <div className="flex-1 overflow-hidden px-3 py-2 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex flex-col gap-3 h-full bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-indigo-200 p-3">
          {/* Top Row - Source Items */}
          <div className="flex-shrink-0 mb-1">
            <div 
              className={`grid gap-2 ${
                leftItems.length <= 3 
                  ? 'grid-cols-3' 
                  : leftItems.length <= 4 
                  ? 'grid-cols-4' 
                  : leftItems.length <= 5 
                  ? 'grid-cols-5' 
                  : leftItems.length <= 6 
                  ? 'grid-cols-6' 
                  : 'grid-cols-7'
              } min-h-[120px] p-2 rounded-lg border-2 border-dashed border-blue-300/50 bg-blue-50/20`}
              onDragOver={!showResults ? handleDragOver : undefined}
              onDragEnter={!showResults ? handleDragEnter : undefined}
              onDrop={!showResults ? (e) => handleDrop(e, null) : undefined}
            >
              {leftItems.map(item => {
                const isUsed = Object.keys(matches).includes(item);
                const isCorrect = Boolean(showResults && correctMatches[item] === true);
                const isIncorrect = Boolean(showResults && correctMatches[item] === false);

                return (
                  <DraggableItem
                    key={item}
                    item={item}
                    isUsed={isUsed}
                    isCorrect={isCorrect}
                    isIncorrect={isIncorrect}
                    showResults={showResults}
                    isImageItem={isImageItem}
                    getTextStyling={getTextStyling}
                    onDragStart={handleDragStart}
                    leftItems={leftItems}
                  />
                );
              })}
            </div>
          </div>

          {/* Bottom Row - Drop Zones */}
          <div className="flex-1 overflow-hidden">
            <div 
              className={`grid gap-1 h-full overflow-y-auto ${
                shuffledRightItems.length <= 4 
                  ? 'grid-cols-4' 
                  : shuffledRightItems.length <= 5 
                  ? 'grid-cols-5' 
                  : shuffledRightItems.length <= 6 
                  ? 'grid-cols-6' 
                  : 'grid-cols-7'
              }`}
            >
              {shuffledRightItems.map((item: string) => {
                const matchedLeft = Object.keys(matches).find(left => matches[left] === item);
                const isCorrect = Boolean(showResults && matchedLeft && correctMatches[matchedLeft] === true);
                const isIncorrect = Boolean(showResults && matchedLeft && correctMatches[matchedLeft] === false);

                return (
                  <DropZone
                    key={item}
                    item={item}
                    matchedLeft={matchedLeft}
                    isCorrect={isCorrect}
                    isIncorrect={isIncorrect}
                    showResults={showResults}
                    draggedItem={draggedItem}
                    shuffledRightItems={shuffledRightItems}
                    filteredPairs={filteredPairs}
                    effectiveMatchingType={effectiveMatchingType}
                    isImageItem={isImageItem}
                    getTextStyling={getTextStyling}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDrop={handleDrop}
                    onDragStart={handleDragStart}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Matching;
