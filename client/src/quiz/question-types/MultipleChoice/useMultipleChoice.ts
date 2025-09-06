import { useState, useCallback, useMemo } from 'react';
import { MultipleChoiceConfig, createMultipleChoiceConfig } from '@/quiz/types/question-config.types';
import { Question } from '@/quiz/types';

interface UseMultipleChoiceProps {
  question: Question;
  config?: Partial<MultipleChoiceConfig>;
  onAnswer: (answer: any, isCorrect: boolean) => void;
}

export const useMultipleChoice = ({ question, config = {}, onAnswer }: UseMultipleChoiceProps) => {
  // Merge with default config
  const fullConfig = useMemo(() => createMultipleChoiceConfig(config), [config]);
  
  // State
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Process options based on configuration
  const processedOptions = useMemo(() => {
    let options = question.options || [];
    
    // Handle True/False mode
    if (fullConfig.truefalseMode) {
      options = [
        fullConfig.truefalseLabels?.true || 'True',
        fullConfig.truefalseLabels?.false || 'False'
      ];
    }
    
    // Handle dynamic option count
    if (fullConfig.optionCount === 'dynamic') {
      // Use all available options
    } else if (typeof fullConfig.optionCount === 'number') {
      options = options.slice(0, fullConfig.optionCount);
    }
    
    // Randomize options if configured
    if (fullConfig.randomizeOptions && !isSubmitted) {
      const excludeIndices = fullConfig.excludeFromRandomization || [];
      const randomizable = options.map((option: string, index: number) => ({ option, index, original: index }))
        .filter((_: any, index: number) => !excludeIndices.includes(index));
      
      const excluded = options.map((option: string, index: number) => ({ option, index, original: index }))
        .filter((_: any, index: number) => excludeIndices.includes(index));
      
      // Shuffle randomizable options
      for (let i = randomizable.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [randomizable[i], randomizable[j]] = [randomizable[j], randomizable[i]];
      }
      
      // Merge back
      const result = [...options];
      randomizable.forEach((item: any, newIndex: number) => {
        const targetIndex = excludeIndices.length > 0 ? 
          newIndex + excludeIndices.filter(ei => ei <= newIndex).length : 
          newIndex;
        result[targetIndex] = item.option;
      });
      
      options = result;
    }
    
    return options.map((option: string, index: number) => ({
      text: option,
      value: index.toString(),
      letter: fullConfig.showLetters ? String.fromCharCode(65 + index) : null,
      isCorrect: index === question.correct
    }));
  }, [question.options, question.correct, fullConfig, isSubmitted]);

  // Validation
  const isValid = selectedOption !== "";
  const canSubmit = isValid && !isSubmitted;

  // Handle option selection
  const handleOptionSelect = useCallback((value: string) => {
    if (isSubmitted) return;
    setSelectedOption(value);
    
    // Auto-submit if configured
    if (fullConfig.autoSubmit) {
      handleSubmit(value);
    }
  }, [isSubmitted, fullConfig.autoSubmit]);

  // Handle submission
  const handleSubmit = useCallback((optionValue?: string) => {
    const finalOption = optionValue || selectedOption;
    if (!finalOption || isSubmitted) return;
    
    // Show confirmation if configured
    if (fullConfig.confirmBeforeSubmit && !optionValue) {
      const confirmed = window.confirm('Are you sure you want to submit this answer?');
      if (!confirmed) return;
    }
    
    const selectedIndex = parseInt(finalOption);
    const isCorrect = selectedIndex === question.correct;
    
    setIsSubmitted(true);
    onAnswer(selectedIndex, isCorrect);
  }, [selectedOption, isSubmitted, fullConfig.confirmBeforeSubmit, question.correct, onAnswer]);

  // Handle hint toggle
  const toggleHint = useCallback(() => {
    if (fullConfig.showHints) {
      setShowHint(prev => !prev);
    }
  }, [fullConfig.showHints]);

  // Get option styling
  const getOptionStyling = useCallback((option: typeof processedOptions[0], index: number) => {
    const baseClasses = "flex items-center space-x-3 p-4 rounded-lg transition-all duration-200 cursor-pointer";
    
    if (isSubmitted) {
      if (option.isCorrect && fullConfig.highlightCorrect) {
        return `${baseClasses} bg-green-100 border-2 border-green-500 text-green-800`;
      }
      if (selectedOption === option.value && !option.isCorrect) {
        return `${baseClasses} bg-red-100 border-2 border-red-500 text-red-800`;
      }
      return `${baseClasses} bg-gray-100 border border-gray-300 text-gray-600`;
    }
    
    if (selectedOption === option.value) {
      const colorMap = {
        blue: 'bg-blue-100 border-2 border-blue-500 text-blue-800',
        green: 'bg-green-100 border-2 border-green-500 text-green-800',
        purple: 'bg-purple-100 border-2 border-purple-500 text-purple-800',
        orange: 'bg-orange-100 border-2 border-orange-500 text-orange-800',
      };
      return `${baseClasses} ${colorMap[fullConfig.colorScheme || 'blue']}`;
    }
    
    return `${baseClasses} bg-white/5 hover:bg-white/10 border border-white/30 text-white hover:border-white/50`;
  }, [isSubmitted, selectedOption, fullConfig.highlightCorrect, fullConfig.colorScheme]);

  // Get layout classes
  const getLayoutClasses = useCallback(() => {
    const layoutMap = {
      vertical: 'space-y-3',
      horizontal: 'flex flex-wrap gap-3',
      grid: `grid gap-3 ${processedOptions.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`
    };
    return layoutMap[fullConfig.optionLayout || 'vertical'];
  }, [fullConfig.optionLayout, processedOptions.length]);

  return {
    // State
    selectedOption,
    isSubmitted,
    showHint,
    
    // Processed data
    processedOptions,
    
    // Validation
    isValid,
    canSubmit,
    
    // Actions
    handleOptionSelect,
    handleSubmit,
    toggleHint,
    
    // Styling helpers
    getOptionStyling,
    getLayoutClasses,
    
    // Configuration
    config: fullConfig,
  };
};
