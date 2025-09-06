import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, CheckCircle, XCircle } from "lucide-react";
import { Question } from "@/quiz/types";
import { MultipleChoiceConfig } from "@/quiz/types/question-config.types";
import { useMultipleChoice } from "./useMultipleChoice";

interface MultipleChoiceProps {
  question: Question;
  onAnswer: (answer: any, isCorrect: boolean) => void;
  studentTryId?: string;
  config?: Partial<MultipleChoiceConfig>;
}

const MultipleChoice: React.FC<MultipleChoiceProps> = ({ 
  question, 
  onAnswer, 
  studentTryId, 
  config = {} 
}) => {
  const {
    selectedOption,
    isSubmitted,
    showHint,
    processedOptions,
    isValid,
    canSubmit,
    handleOptionSelect,
    handleSubmit,
    toggleHint,
    getOptionStyling,
    getLayoutClasses,
    config: fullConfig,
  } = useMultipleChoice({ question, config, onAnswer });

  // Theme-based styling
  const getThemeClasses = () => {
    const themeMap = {
      default: "bg-white/10 backdrop-blur-lg border-white/20",
      compact: "bg-white/5 border-white/10",
      card: "bg-white shadow-lg border-gray-200",
      minimal: "bg-transparent border-none",
    };
    return themeMap[fullConfig.theme || 'default'];
  };

  const getColorClasses = () => {
    const colorMap = {
      blue: "from-blue-500 to-blue-600",
      green: "from-green-500 to-green-600", 
      purple: "from-purple-500 to-purple-600",
      orange: "from-orange-500 to-orange-600",
    };
    return colorMap[fullConfig.colorScheme || 'blue'];
  };

  return (
    <Card className={`${getThemeClasses()} animate-fade-in`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-white text-2xl flex-1">
            {question.question}
          </CardTitle>
          
          {/* Hint Button */}
          {fullConfig.showHints && question.hint && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleHint}
              className="text-white/70 hover:text-white hover:bg-white/10"
              aria-label="Toggle hint"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Hint Display */}
        {showHint && question.hint && (
          <div className="mt-3 p-3 bg-yellow-100/20 border border-yellow-300/30 rounded-lg">
            <p className="text-yellow-100 text-sm">
              💡 <strong>Hint:</strong> {question.hint}
            </p>
          </div>
        )}

        {/* True/False Mode Indicator */}
        {fullConfig.truefalseMode && (
          <Badge variant="secondary" className="w-fit mt-2">
            True/False Question
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Options */}
        <div className={getLayoutClasses()}>
          {fullConfig.optionLayout === 'horizontal' || fullConfig.optionLayout === 'grid' ? (
            // Button-style layout for horizontal/grid
            processedOptions.map((option, index) => (
              <button
                key={option.value}
                onClick={() => handleOptionSelect(option.value)}
                disabled={isSubmitted}
                className={getOptionStyling(option, index)}
                aria-label={`Option ${option.letter || index + 1}: ${option.text}`}
              >
                {/* Option Letter/Number */}
                {option.letter && (
                  <div className="w-8 h-8 rounded-full bg-current/20 flex items-center justify-center font-bold text-sm">
                    {option.letter}
                  </div>
                )}
                
                {/* Option Text */}
                <span className="flex-1 text-left">{option.text}</span>
                
                {/* Status Icons */}
                {isSubmitted && (
                  <div className="flex-shrink-0">
                    {option.isCorrect && fullConfig.highlightCorrect && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {selectedOption === option.value && !option.isCorrect && (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                )}
              </button>
            ))
          ) : (
            // Radio group layout for vertical
            <RadioGroup 
              value={selectedOption} 
              onValueChange={handleOptionSelect}
              disabled={isSubmitted}
              className="space-y-3"
            >
              {processedOptions.map((option, index) => (
                <div 
                  key={option.value}
                  className={getOptionStyling(option, index)}
                >
                  <RadioGroupItem 
                    value={option.value} 
                    id={`option-${option.value}`}
                    className="border-white/50"
                    disabled={isSubmitted}
                  />
                  
                  {/* Option Letter */}
                  {option.letter && (
                    <div className="w-8 h-8 rounded-full bg-current/20 flex items-center justify-center font-bold text-sm">
                      {option.letter}
                    </div>
                  )}
                  
                  {/* Option Text */}
                  <Label 
                    htmlFor={`option-${option.value}`}
                    className="text-white text-lg cursor-pointer flex-1"
                  >
                    {option.text}
                  </Label>
                  
                  {/* Status Icons */}
                  {isSubmitted && (
                    <div className="flex-shrink-0">
                      {option.isCorrect && fullConfig.highlightCorrect && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {selectedOption === option.value && !option.isCorrect && (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </RadioGroup>
          )}
        </div>

        {/* Explanation */}
        {isSubmitted && fullConfig.showExplanation && question.explanation && (
          <div className="mt-4 p-4 bg-blue-100/20 border border-blue-300/30 rounded-lg">
            <p className="text-blue-100">
              <strong>Explanation:</strong> {question.explanation}
            </p>
          </div>
        )}

        {/* Submit Button */}
        {!fullConfig.autoSubmit && (
          <Button 
            onClick={() => handleSubmit()}
            disabled={!canSubmit}
            className={`w-full bg-gradient-to-r ${getColorClasses()} hover:opacity-90 text-white py-3 text-lg transition-all duration-200 ${
              !isValid ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
            }`}
            aria-label="Submit your answer"
          >
            {isSubmitted ? 'Answer Submitted' : 'Submit Answer'}
          </Button>
        )}

        {/* Progress Indicator */}
        {fullConfig.showProgress && (
          <div className="flex justify-center">
            <Badge variant="outline" className="text-white/70 border-white/30">
              Question {question.id ? `#${question.id}` : ''}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MultipleChoice;
