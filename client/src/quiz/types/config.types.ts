// Unified Quiz Configuration System
// Supports individual, live, and assignment quiz modes

export type QuizMode = 'individual' | 'live' | 'assignment';

export type QuestionSelectionStrategy = 
  | 'all' 
  | 'unattempted' 
  | 'failed' 
  | 'random' 
  | 'adaptive';

export interface QuestionSelectionConfig {
  strategy: QuestionSelectionStrategy;
  maxQuestions?: number;
  excludeAttempted?: boolean;
  retryFailedOnly?: boolean;
}

export interface DisplayOptionsConfig {
  optionsPerQuestion?: number; // 2, 3, 4, or dynamic
  showHints?: boolean;
  allowPartialCredit?: boolean;
  randomizeOptions?: boolean;
  showProgress?: boolean;
}

export interface QuizBehaviorConfig {
  allowReview?: boolean;
  timeLimit?: number; // in seconds
  maxAttempts?: number;
  pauseable?: boolean;
}

export interface LiveSessionConfig {
  sessionId: string;
  teacherId: string;
  isHost: boolean;
  realTimeSync: boolean;
  showLeaderboard: boolean;
  questionTimer?: number; // in seconds
}

export interface QuizSourceConfig {
  type: 'topic' | 'assignment' | 'content' | 'custom';
  topicId?: string;
  topicName?: string;
  level?: 'Overview' | 'Easy' | 'Hard';
  assignmentId?: string;
  contentId?: string;
  questionIds?: string[];
}

export interface QuizEngineConfig {
  // Quiz Mode
  mode: QuizMode;
  
  // Question Source
  source: QuizSourceConfig;
  
  // Question Selection
  questionSelection: QuestionSelectionConfig;
  
  // Display Options
  displayOptions: DisplayOptionsConfig;
  
  // Quiz Behavior
  behavior: QuizBehaviorConfig;
  
  // Live Session (when mode === 'live')
  liveSession?: LiveSessionConfig;
  
  // Database Integration
  database?: {
    assignmentStudentTryId?: string;
    studentTryId?: string;
    trackingEnabled?: boolean;
  };
  
  // Callbacks
  callbacks?: {
    onQuizFinish?: () => void;
    onQuestionAnswer?: (answer: any, isCorrect: boolean) => void;
    onProgress?: (progress: number) => void;
  };
}

// Legacy prop interfaces for backward compatibility
export interface TopicQuizRunnerProps {
  topicId: string;
  level: 'Overview' | 'Easy' | 'Hard';
  topicName: string;
  onClose: () => void;
}

export interface QuizViewProps {
  questionIds: string[];
  onQuizFinish: () => void;
  assignmentStudentTryId: string;
  studentTryId?: string;
  contentId?: string;
  topicId?: string;
}

export interface QuizOrchestratorProps {
  assignmentTry?: any;
  questionIds?: string[];
  onFinish?: () => void;
  content?: any;
  studentTryId?: string;
}

// Utility type for all possible legacy props
export type LegacyQuizProps = 
  | TopicQuizRunnerProps 
  | QuizViewProps 
  | QuizOrchestratorProps;

// Default configurations
export const DEFAULT_QUIZ_CONFIG: Partial<QuizEngineConfig> = {
  questionSelection: {
    strategy: 'all',
    excludeAttempted: false,
    retryFailedOnly: false,
  },
  displayOptions: {
    optionsPerQuestion: 4,
    showHints: false,
    allowPartialCredit: false,
    randomizeOptions: false,
    showProgress: true,
  },
  behavior: {
    allowReview: true,
    pauseable: true,
  },
  database: {
    trackingEnabled: true,
  },
};

export const TOPIC_QUIZ_CONFIG: Partial<QuizEngineConfig> = {
  ...DEFAULT_QUIZ_CONFIG,
  mode: 'individual',
  questionSelection: {
    strategy: 'unattempted',
    maxQuestions: 10,
  },
  displayOptions: {
    ...DEFAULT_QUIZ_CONFIG.displayOptions,
    optionsPerQuestion: 2, // True/False style for topic quizzes
  },
};

export const ASSIGNMENT_QUIZ_CONFIG: Partial<QuizEngineConfig> = {
  ...DEFAULT_QUIZ_CONFIG,
  mode: 'assignment',
  behavior: {
    ...DEFAULT_QUIZ_CONFIG.behavior,
    allowReview: true,
    timeLimit: 3600, // 1 hour
  },
};

export const LIVE_QUIZ_CONFIG: Partial<QuizEngineConfig> = {
  ...DEFAULT_QUIZ_CONFIG,
  mode: 'live',
  displayOptions: {
    ...DEFAULT_QUIZ_CONFIG.displayOptions,
    showProgress: false, // Hide individual progress in live mode
  },
  behavior: {
    ...DEFAULT_QUIZ_CONFIG.behavior,
    allowReview: false,
    pauseable: false,
  },
};
