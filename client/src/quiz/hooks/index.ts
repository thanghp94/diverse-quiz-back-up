// Legacy hooks (maintained for backward compatibility)
export { useQuiz } from './useQuiz';
export { useQuizLogic, type QuizAppProps } from './useQuizLogic';

// Phase 2: Unified State Management Hooks
export { useUnifiedQuizState } from './useUnifiedQuizState';
export { useQuizTracking } from './useQuizTracking';
export { useQuizData, useQuizContent, usePrefetchQuizContent } from './useQuizData';

// Phase 4: Live Quiz Hooks
export { useLiveQuizSession } from './useLiveQuizSession';

// Export types for external use
export type { UnifiedQuizConfig, UnifiedQuizState } from './useUnifiedQuizState';
export type { QuizTrackingConfig, QuizTrackingActions } from './useQuizTracking';
export type { QuizDataConfig, QuizDataResult, LinkedContent } from './useQuizData';
export type { 
  LiveQuizState, 
  LiveQuizActions, 
  UseLiveQuizSessionOptions 
} from '../types/live.types';
