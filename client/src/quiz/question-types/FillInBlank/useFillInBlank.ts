import { useState, useCallback, useMemo } from 'react';
import { FillInBlankConfig, createFillInBlankConfig } from '@/quiz/types/question-config.types';
import { Question } from '@/quiz/types';

interface UseFillInBlankProps {
  question: Question;
  config?: Partial<FillInBlankConfig>;
  onAnswer: (answer: any, isCorrect: boolean) => void;
}

export const useFillInBlank = ({ question, config = {}, onAnswer }: UseFillInBlankProps) => {
  // Merge with default config
  const fullConfig = useMemo(() => createFillInBlankConfig(config), [config]);
  
  // State
  const [answers, setAnswers] = useState<string[]>(new Array(question.blanks?.length || 0).fill(""));
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHints, setShowHints] = useState<boolean[]>(new Array(question.blanks?.length || 0).fill(false));
  const [hintsUsed, setHintsUsed] = useState<number[]>(new Array(question.blanks?.length || 0).fill(0));
  const [validationErrors, setValidationErrors] = useState<string[]>(new Array(question.blanks?.length || 0).fill(""));

  // Process blanks with input types
  const processedBlanks = useMemo(() => {
    const blanks = question.blanks || [];
    const inputTypes = fullConfig.inputTypes || [];
    
    return blanks.map((blank: any, index: number) => ({
      ...blank,
      inputType: inputTypes[index] || { type: 'text' },
      index,
    }));
  }, [question.blanks, fullConfig.inputTypes]);

  // Validation
  const validateAnswer = useCallback((value: string, blankIndex: number) => {
    const blank = processedBlanks[blankIndex];
    const inputType = blank.inputType;
    const validation = inputType.validation;
    
    if (!validation) return '';
    
    // Required validation
    if (validation.required && !value.trim()) {
      return 'This field is required';
    }
    
    // Length validation
    if (validation.minLength && value.length < validation.minLength) {
      return `Minimum ${validation.minLength} characters required`;
    }
    
    if (validation.maxLength && value.length > validation.maxLength) {
      return `Maximum ${validation.maxLength} characters allowed`;
    }
    
    // Pattern validation
    if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
      return 'Invalid format';
    }
    
    // Number validation
    if (inputType.type === 'number') {
      const num = parseFloat(value);
      if (isNaN(num)) return 'Must be a valid number';
      
      if (validation.min !== undefined && num < validation.min) {
        return `Must be at least ${validation.min}`;
      }
      
      if (validation.max !== undefined && num > validation.max) {
        return `Must be at most ${validation.max}`;
      }
    }
    
    return '';
  }, [processedBlanks]);

  // Handle answer change
  const handleAnswerChange = useCallback((index: number, value: string) => {
    if (isSubmitted) return;
    
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
    
    // Validate
    const error = validateAnswer(value, index);
    const newErrors = [...validationErrors];
    newErrors[index] = error;
    setValidationErrors(newErrors);
  }, [answers, isSubmitted, validateAnswer, validationErrors]);

  // Handle hint toggle
  const toggleHint = useCallback((index: number) => {
    if (!fullConfig.hintSystem?.enabled) return;
    
    const newShowHints = [...showHints];
    newShowHints[index] = !newShowHints[index];
    setShowHints(newShowHints);
    
    // Track hint usage
    if (newShowHints[index]) {
      const newHintsUsed = [...hintsUsed];
      newHintsUsed[index] += 1;
      setHintsUsed(newHintsUsed);
    }
  }, [showHints, hintsUsed, fullConfig.hintSystem]);

  // Generate hint content
  const getHintContent = useCallback((blankIndex: number) => {
    const blank = processedBlanks[blankIndex];
    const correctAnswers = blank.answers || [];
    const hintTypes = fullConfig.hintSystem?.hintTypes || [];
    const hintsUsedCount = hintsUsed[blankIndex];
    
    if (correctAnswers.length === 0 || hintsUsedCount >= hintTypes.length) {
      return blank.inputType.hint || 'No more hints available';
    }
    
    const hintType = hintTypes[hintsUsedCount];
    const correctAnswer = correctAnswers[0];
    
    switch (hintType) {
      case 'character_count':
        return `The answer has ${correctAnswer.length} characters`;
      
      case 'first_letter':
        return `The answer starts with "${correctAnswer.charAt(0).toUpperCase()}"`;
      
      case 'word_length':
        const words = correctAnswer.split(' ');
        return words.length === 1 
          ? 'The answer is one word'
          : `The answer has ${words.length} words`;
      
      case 'custom':
        return blank.inputType.hint || 'Think about the context';
      
      default:
        return 'Keep trying!';
    }
  }, [processedBlanks, fullConfig.hintSystem, hintsUsed]);

  // Check if answer is correct
  const checkAnswer = useCallback((answer: string, blankIndex: number) => {
    const blank = processedBlanks[blankIndex];
    const correctAnswers = blank.answers || [];
    
    let processedAnswer = answer;
    let processedCorrect = correctAnswers;
    
    // Apply config transformations
    if (!fullConfig.caseSensitive) {
      processedAnswer = processedAnswer.toLowerCase();
      processedCorrect = correctAnswers.map((a: string) => a.toLowerCase());
    }
    
    if (fullConfig.trimWhitespace) {
      processedAnswer = processedAnswer.trim();
      processedCorrect = correctAnswers.map((a: string) => a.trim());
    }
    
    // Exact match
    if (processedCorrect.includes(processedAnswer)) {
      return { isCorrect: true, score: 1 };
    }
    
    // Partial matching if enabled
    if (fullConfig.partialMatching?.enabled) {
      const threshold = fullConfig.partialMatching.threshold || 0.8;
      const algorithm = fullConfig.partialMatching.algorithm || 'fuzzy';
      
      for (const correct of processedCorrect) {
        const similarity = calculateSimilarity(processedAnswer, correct, algorithm);
        if (similarity >= threshold) {
          return { isCorrect: true, score: similarity };
        }
      }
    }
    
    return { isCorrect: false, score: 0 };
  }, [processedBlanks, fullConfig]);

  // Calculate similarity based on algorithm
  const calculateSimilarity = useCallback((str1: string, str2: string, algorithm: string) => {
    switch (algorithm) {
      case 'levenshtein':
        return 1 - (levenshteinDistance(str1, str2) / Math.max(str1.length, str2.length));
      
      case 'contains':
        return str2.includes(str1) || str1.includes(str2) ? 0.8 : 0;
      
      case 'fuzzy':
      default:
        // Simple fuzzy matching
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        const editDistance = levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }
  }, []);

  // Levenshtein distance calculation
  const levenshteinDistance = useCallback((str1: string, str2: string) => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }, []);

  // Handle submission
  const handleSubmit = useCallback(() => {
    if (isSubmitted) return;
    
    // Validate all answers
    const errors = answers.map((answer, index) => validateAnswer(answer, index));
    setValidationErrors(errors);
    
    if (errors.some(error => error !== '')) {
      return; // Don't submit if there are validation errors
    }
    
    // Check correctness and calculate score
    let totalScore = 0;
    let correctCount = 0;
    const results = answers.map((answer, index) => {
      const result = checkAnswer(answer, index);
      totalScore += result.score;
      if (result.isCorrect) correctCount++;
      return result;
    });
    
    // Apply hint penalties
    if (fullConfig.hintSystem?.penaltyPerHint) {
      const totalHintsUsed = hintsUsed.reduce((sum, count) => sum + count, 0);
      const penalty = totalHintsUsed * (fullConfig.hintSystem.penaltyPerHint / 100);
      totalScore = Math.max(0, totalScore - penalty);
    }
    
    const isCorrect = fullConfig.allowPartialCredit 
      ? totalScore >= 0.5 // At least 50% for partial credit
      : correctCount === answers.length; // All correct for full credit
    
    setIsSubmitted(true);
    onAnswer(answers, isCorrect);
  }, [answers, isSubmitted, validateAnswer, checkAnswer, hintsUsed, fullConfig, onAnswer]);

  // Check if form is complete and valid
  const isComplete = answers.every(answer => answer.trim() !== "");
  const hasErrors = validationErrors.some(error => error !== "");
  const canSubmit = isComplete && !hasErrors && !isSubmitted;

  return {
    // State
    answers,
    isSubmitted,
    showHints,
    hintsUsed,
    validationErrors,
    
    // Processed data
    processedBlanks,
    
    // Validation
    isComplete,
    hasErrors,
    canSubmit,
    
    // Actions
    handleAnswerChange,
    toggleHint,
    handleSubmit,
    
    // Helpers
    getHintContent,
    validateAnswer,
    
    // Configuration
    config: fullConfig,
  };
};
