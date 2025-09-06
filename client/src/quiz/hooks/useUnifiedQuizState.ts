import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Question } from "@/quiz/types";

export interface UnifiedQuizConfig {
  // Quiz source configuration
  source: {
    type: 'topic' | 'assignment' | 'content' | 'questions';
    topicId?: string;
    level?: 'Overview' | 'Easy' | 'Hard';
    questionIds?: string[];
    contentId?: string;
  };
  
  // Quiz behavior
  mode: 'individual' | 'assignment' | 'live';
  
  // Database tracking
  database?: {
    assignmentStudentTryId?: string;
    studentTryId?: string;
    trackProgress?: boolean;
  };
  
  // Callbacks
  callbacks?: {
    onQuizFinish?: () => void;
    onQuestionAnswer?: (answer: any, isCorrect: boolean) => void;
    onProgress?: (progress: { current: number; total: number; score: number }) => void;
  };
}

export interface UnifiedQuizState {
  // Quiz flow state
  currentView: 'home' | 'quiz' | 'results';
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  questions: Question[];
  quizTitle: string;
  
  // Answer tracking
  answers: any[];
  score: number;
  correctAnswersCount: number;
  incorrectAnswersCount: number;
  
  // UI state
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  showFeedback: boolean;
  isLoading: boolean;
  isLastQuestion: boolean;
  
  // Content state
  showContent: boolean;
  didShowContent: boolean;
  linkedContent: any | null;
  isContentLoading: boolean;
  isContentLoaded: boolean;
  
  // Timing
  timeStart: string | null;
  
  // Actions
  handleAnswer: (answer: any, isCorrect: boolean) => void;
  handleNext: () => void;
  handleRestart: () => void;
  startQuiz: (quiz: { questions: Question[], title: string }) => void;
  handleAnswerSelect: (choiceIndex: number) => void;
  handleShowContent: () => Promise<void>;
}

/**
 * useUnifiedQuizState - Centralized state management for all quiz types
 * Consolidates logic from useQuizLogic, TopicQuizRunner, and QuizView
 */
export const useUnifiedQuizState = (config: UnifiedQuizConfig): UnifiedQuizState => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Core quiz state
  const [currentView, setCurrentView] = useState<'home' | 'quiz' | 'results'>(
    config.source.questionIds ? 'quiz' : 'home'
  );
  const [selectedQuiz, setSelectedQuiz] = useState<{ questions: Question[], title: string } | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [score, setScore] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [incorrectAnswersCount, setIncorrectAnswersCount] = useState(0);
  
  // UI state
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Content state
  const [showContent, setShowContent] = useState(false);
  const [didShowContent, setDidShowContent] = useState(false);
  const [linkedContent, setLinkedContent] = useState<any | null>(null);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [isContentLoaded, setIsContentLoaded] = useState(false);
  
  // Timing
  const [timeStart, setTimeStart] = useState<string | null>(null);

  // Fetch questions based on configuration
  const { data: fetchedQuestions, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['unified-quiz-questions', config.source],
    queryFn: async () => {
      if (config.source.type === 'questions' && config.source.questionIds) {
        // Direct question IDs
        const questionRequests = config.source.questionIds.map(id => 
          fetch(`/api/questions/${id}`).then(res => res.ok ? res.json() : null)
        );
        const results = await Promise.all(questionRequests);
        return results.filter(Boolean);
      }
      
      if (config.source.type === 'topic' && config.source.topicId && config.source.level) {
        // Topic-based questions
        const response = await fetch(`/api/questions?topicId=${config.source.topicId}&level=${config.source.level}`);
        if (!response.ok) throw new Error('Failed to fetch topic questions');
        return await response.json();
      }
      
      return [];
    },
    enabled: !!(
      (config.source.type === 'questions' && config.source.questionIds?.length) ||
      (config.source.type === 'topic' && config.source.topicId && config.source.level)
    )
  });

  // Determine questions and quiz title
  const questions = fetchedQuestions || selectedQuiz?.questions || [];
  const quizTitle = config.source.type === 'topic' 
    ? `${config.source.level} Quiz` 
    : selectedQuiz?.title || "Quiz";
  
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Load current question
  useEffect(() => {
    if (currentView !== 'quiz' || !questions.length) {
      setIsLoading(false);
      return;
    }

    if (currentQuestionIndex >= questions.length) {
      setCurrentView('results');
      config.callbacks?.onQuizFinish?.();
      return;
    }

    // Reset question-specific state
    setShowFeedback(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setTimeStart(new Date().toISOString());
    setShowContent(false);
    setDidShowContent(false);
    setLinkedContent(null);
    setIsContentLoaded(false);

    // Set current question
    setCurrentQuestion(questions[currentQuestionIndex]);
    setIsLoading(false);
  }, [currentQuestionIndex, questions, currentView]);

  // Separate effect for quiz finish callback to avoid dependency issues
  useEffect(() => {
    if (currentView === 'results') {
      config.callbacks?.onQuizFinish?.();
    }
  }, [currentView, config.callbacks]);

  // Reset state when starting new quiz
  useEffect(() => {
    if (currentQuestionIndex === 0 && currentView === 'quiz') {
      sessionStorage.removeItem('quizResults');
      setCorrectAnswersCount(0);
      setIncorrectAnswersCount(0);
      setAnswers([]);
      setScore(0);
    }
  }, [currentQuestionIndex, currentView]);

  const handleAnswer = useCallback((answer: any, isCorrect: boolean) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      setCorrectAnswersCount(prev => prev + 1);
    } else {
      setIncorrectAnswersCount(prev => prev + 1);
    }

    // Notify parent component
    config.callbacks?.onQuestionAnswer?.(answer, isCorrect);
    config.callbacks?.onProgress?.({
      current: currentQuestionIndex + 1,
      total: questions.length,
      score: isCorrect ? score + 1 : score
    });
  }, [answers, currentQuestionIndex, score, questions.length, config.callbacks]);

  const handleAnswerSelect = useCallback((choiceIndex: number) => {
    if (showFeedback || !currentQuestion) return;

    const choiceLetter = String.fromCharCode(65 + choiceIndex);
    setSelectedAnswer(choiceLetter);

    const correct = choiceLetter === (currentQuestion as any).correct_choice;
    setIsCorrect(correct);
    setShowFeedback(true);
    
    handleAnswer(choiceLetter, correct);
  }, [showFeedback, currentQuestion, handleAnswer]);

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      setCurrentView('results');
      config.callbacks?.onQuizFinish?.();
    } else {
      // Save result to session storage
      const existingResults = JSON.parse(sessionStorage.getItem('quizResults') || '[]');
      existingResults.push(isCorrect);
      sessionStorage.setItem('quizResults', JSON.stringify(existingResults));
      
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [isLastQuestion, isCorrect, config.callbacks]);

  const handleRestart = useCallback(() => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setScore(0);
    setCorrectAnswersCount(0);
    setIncorrectAnswersCount(0);
    setCurrentView(config.source.questionIds ? 'quiz' : 'home');
    setSelectedQuiz(null);
    sessionStorage.removeItem('quizResults');
  }, [config.source.questionIds]);

  const startQuiz = useCallback((quiz: { questions: Question[], title: string }) => {
    setSelectedQuiz(quiz);
    setCurrentView('quiz');
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setScore(0);
    setCorrectAnswersCount(0);
    setIncorrectAnswersCount(0);
  }, []);

  const handleShowContent = useCallback(async () => {
    if (showContent) {
      setShowContent(false);
      return;
    }

    if (isContentLoaded) {
      setShowContent(true);
      return;
    }

    const contentId = (currentQuestion as any)?.contentid;
    if (!contentId) {
      toast({ 
        title: "No content linked", 
        description: "This question does not have associated content to show." 
      });
      return;
    }

    setIsContentLoading(true);
    try {
      const response = await fetch(`/api/content/${contentId}`);
      if (!response.ok) throw new Error('Failed to fetch content');
      
      const data = await response.json();
      setLinkedContent(data);
      setIsContentLoaded(true);
      setShowContent(true);
      setDidShowContent(true);
    } catch (error) {
      console.error("Error fetching content:", error);
      toast({
        title: "Error",
        description: "Could not load content for this question.",
        variant: "destructive",
      });
    } finally {
      setIsContentLoading(false);
    }
  }, [showContent, isContentLoaded, currentQuestion, toast]);

  return {
    // Quiz flow state
    currentView,
    currentQuestionIndex,
    currentQuestion,
    questions,
    quizTitle,
    
    // Answer tracking
    answers,
    score,
    correctAnswersCount,
    incorrectAnswersCount,
    
    // UI state
    selectedAnswer,
    isCorrect,
    showFeedback,
    isLoading: isLoading || isLoadingQuestions,
    isLastQuestion,
    
    // Content state
    showContent,
    didShowContent,
    linkedContent,
    isContentLoading,
    isContentLoaded,
    
    // Timing
    timeStart,
    
    // Actions
    handleAnswer,
    handleNext,
    handleRestart,
    startQuiz,
    handleAnswerSelect,
    handleShowContent,
  };
};
