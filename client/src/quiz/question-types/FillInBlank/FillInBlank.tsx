import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HelpCircle, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Question } from "@/quiz/types";
import { FillInBlankConfig } from "@/quiz/types/question-config.types";
import { useFillInBlank } from "./useFillInBlank";

interface FillInBlankProps {
  question: Question;
  onAnswer: (answer: any, isCorrect: boolean) => void;
  studentTryId?: string;
  config?: Partial<FillInBlankConfig>;
}

const FillInBlank: React.FC<FillInBlankProps> = ({ 
  question, 
  onAnswer, 
  studentTryId, 
  config = {} 
}) => {
  const {
    answers,
    isSubmitted,
    showHints,
    hintsUsed,
    validationErrors,
    processedBlanks,
    isComplete,
    hasErrors,
    canSubmit,
    handleAnswerChange,
    toggleHint,
    handleSubmit,
    getHintContent,
    config: fullConfig,
  } = useFillInBlank({ question, config, onAnswer });

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
    return colorMap[fullConfig.colorScheme || 'purple'];
  };

  // Render input based on type
  const renderInput = (blank: any, index: number) => {
    const inputType = blank.inputType;
    const value = answers[index];
    const error = validationErrors[index];
    const hasError = error !== "";

    const baseClasses = `${
      hasError 
        ? 'border-red-300 focus:border-red-500' 
        : 'border-white/30 focus:border-white/50'
    } bg-white/10 text-white placeholder:text-white/50`;

    const commonProps = {
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        handleAnswerChange(index, e.target.value),
      disabled: isSubmitted,
      placeholder: inputType.placeholder || "Type your answer here...",
      className: `${baseClasses} text-lg p-4`,
      'aria-label': `Answer for blank ${index + 1}`,
      'aria-describedby': hasError ? `error-${index}` : undefined,
    };

    switch (inputType.type) {
      case 'number':
        return (
          <Input
            {...commonProps}
            type="number"
            min={inputType.validation?.min}
            max={inputType.validation?.max}
          />
        );

      case 'email':
        return (
          <Input
            {...commonProps}
            type="email"
          />
        );

      case 'url':
        return (
          <Input
            {...commonProps}
            type="url"
          />
        );

      case 'date':
        return (
          <Input
            {...commonProps}
            type="date"
            className={`${baseClasses} text-lg p-4`}
          />
        );

      case 'dropdown':
        return (
          <Select
            value={value}
            onValueChange={(newValue) => handleAnswerChange(index, newValue)}
            disabled={isSubmitted}
          >
            <SelectTrigger className={`${baseClasses} text-lg p-4`}>
              <SelectValue placeholder={inputType.placeholder || "Select an option..."} />
            </SelectTrigger>
            <SelectContent>
              {inputType.options?.map((option: string, optionIndex: number) => (
                <SelectItem key={optionIndex} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            rows={3}
            className={`${baseClasses} text-lg p-4 resize-none`}
          />
        );

      case 'text':
      default:
        return (
          <Input
            {...commonProps}
            type="text"
            minLength={inputType.validation?.minLength}
            maxLength={inputType.validation?.maxLength}
          />
        );
    }
  };

  return (
    <Card className={`${getThemeClasses()} animate-fade-in`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-white text-2xl flex-1">
            {question.question}
          </CardTitle>
          
          {/* Configuration Indicators */}
          <div className="flex gap-2">
            {fullConfig.allowPartialCredit && (
              <Badge variant="secondary" className="text-xs">
                Partial Credit
              </Badge>
            )}
            {fullConfig.hintSystem?.enabled && (
              <Badge variant="outline" className="text-xs text-white/70 border-white/30">
                Hints Available
              </Badge>
            )}
          </div>
        </div>

        {/* Instructions */}
        {processedBlanks.length > 1 && (
          <p className="text-white/80 text-sm mt-2">
            Fill in all {processedBlanks.length} blanks below
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Blanks */}
        {processedBlanks.map((blank: any, index: number) => (
          <div key={index} className="space-y-3">
            {/* Blank Label */}
            <div className="flex items-center justify-between">
              <label className="text-white text-lg font-medium">
                {blank.text || `Blank ${index + 1}`}
              </label>
              
              {/* Hint Button */}
              {fullConfig.hintSystem?.enabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleHint(index)}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                  aria-label={`Toggle hint for blank ${index + 1}`}
                >
                  <HelpCircle className="h-4 w-4" />
                  {hintsUsed[index] > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {hintsUsed[index]}
                    </Badge>
                  )}
                </Button>
              )}
            </div>

            {/* Input */}
            {renderInput(blank, index)}

            {/* Validation Error */}
            {validationErrors[index] && (
              <Alert variant="destructive" id={`error-${index}`}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {validationErrors[index]}
                </AlertDescription>
              </Alert>
            )}

            {/* Hint Display */}
            {showHints[index] && fullConfig.hintSystem?.enabled && (
              <div className="p-3 bg-yellow-100/20 border border-yellow-300/30 rounded-lg">
                <p className="text-yellow-100 text-sm">
                  💡 <strong>Hint:</strong> {getHintContent(index)}
                </p>
                {fullConfig.hintSystem.penaltyPerHint && (
                  <p className="text-yellow-200/70 text-xs mt-1">
                    Using hints reduces your score by {fullConfig.hintSystem.penaltyPerHint}% each
                  </p>
                )}
              </div>
            )}

            {/* Submission Feedback */}
            {isSubmitted && (
              <div className="flex items-center gap-2">
                {/* This would need to be enhanced with actual correctness checking */}
                <div className="flex items-center gap-1 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-400">Answer recorded</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Progress Indicator */}
        {processedBlanks.length > 1 && (
          <div className="flex justify-center">
            <Badge variant="outline" className="text-white/70 border-white/30">
              {answers.filter(a => a.trim() !== "").length} of {processedBlanks.length} completed
            </Badge>
          </div>
        )}

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full bg-gradient-to-r ${getColorClasses()} hover:opacity-90 text-white py-3 text-lg transition-all duration-200 ${
            !canSubmit ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
          }`}
          aria-label="Submit your answers"
        >
          {isSubmitted ? 'Answers Submitted' : 
           !isComplete ? 'Complete All Blanks' :
           hasErrors ? 'Fix Errors to Submit' :
           'Submit Answers'}
        </Button>

        {/* Configuration Info */}
        {(fullConfig.caseSensitive === false || fullConfig.allowSynonyms) && (
          <div className="text-center">
            <p className="text-white/60 text-sm">
              {!fullConfig.caseSensitive && "Case doesn't matter"}
              {!fullConfig.caseSensitive && fullConfig.allowSynonyms && " • "}
              {fullConfig.allowSynonyms && "Synonyms accepted"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FillInBlank;
