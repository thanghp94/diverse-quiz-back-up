/**
 * Live Quiz System Types
 * Defines interfaces for real-time Quizizz-style quiz sessions
 */

export interface LiveQuizSession {
  id: string;
  teacherId: string;
  title: string;
  description?: string;
  topicId?: string;
  questionIds: string[];
  status: 'waiting' | 'active' | 'paused' | 'completed';
  currentQuestionIndex: number;
  currentQuestionId?: string;
  settings: LiveQuizSettings;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  participantCount: number;
  maxParticipants?: number;
}

export interface LiveQuizSettings {
  // Timing
  questionTimer: number; // seconds per question
  showTimer: boolean;
  autoAdvance: boolean;
  
  // Display
  showLeaderboard: boolean;
  showAnswerDistribution: boolean;
  showCorrectAnswer: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  
  // Participation
  allowLateJoin: boolean;
  requireName: boolean;
  allowAnonymous: boolean;
  
  // Scoring
  pointsPerCorrect: number;
  speedBonus: boolean;
  streakMultiplier: boolean;
  
  // Features
  enableHints: boolean;
  enablePowerUps: boolean;
  enableChat: boolean;
}

export interface LiveQuizParticipant {
  id: string;
  sessionId: string;
  studentId?: string;
  displayName: string;
  isAnonymous: boolean;
  joinedAt: string;
  isActive: boolean;
  currentScore: number;
  correctAnswers: number;
  totalAnswers: number;
  currentStreak: number;
  longestStreak: number;
  averageResponseTime: number;
  powerUpsUsed: number;
  rank: number;
}

export interface LiveQuizAnswer {
  id: string;
  sessionId: string;
  questionId: string;
  participantId: string;
  answer: string | string[]; // Single or multiple answers
  isCorrect: boolean;
  responseTime: number; // milliseconds
  scoreEarned: number;
  speedBonus: number;
  submittedAt: string;
  powerUpUsed?: string;
}

export interface LiveQuizQuestion {
  id: string;
  sessionId: string;
  questionId: string;
  questionIndex: number;
  startedAt: string;
  endedAt?: string;
  duration: number; // seconds
  participantAnswers: LiveQuizAnswer[];
  answerDistribution: AnswerDistribution;
  correctPercentage: number;
  averageResponseTime: number;
}

export interface AnswerDistribution {
  [optionKey: string]: {
    count: number;
    percentage: number;
    isCorrect: boolean;
  };
}

export interface LiveQuizLeaderboard {
  sessionId: string;
  participants: LeaderboardEntry[];
  updatedAt: string;
}

export interface LeaderboardEntry {
  participantId: string;
  displayName: string;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  currentStreak: number;
  rank: number;
  rankChange: number; // +1, -1, 0
  isCurrentUser?: boolean;
}

// WebSocket Message Types
export type LiveQuizMessage = 
  | SessionCreatedMessage
  | SessionStartedMessage
  | SessionEndedMessage
  | ParticipantJoinedMessage
  | ParticipantLeftMessage
  | QuestionStartedMessage
  | QuestionEndedMessage
  | AnswerSubmittedMessage
  | LeaderboardUpdatedMessage
  | AnswerDistributionMessage
  | ChatMessage
  | ErrorMessage;

export interface BaseMessage {
  type: string;
  sessionId: string;
  timestamp: string;
}

export interface SessionCreatedMessage extends BaseMessage {
  type: 'session_created';
  session: LiveQuizSession;
}

export interface SessionStartedMessage extends BaseMessage {
  type: 'session_started';
  session: LiveQuizSession;
}

export interface SessionEndedMessage extends BaseMessage {
  type: 'session_ended';
  session: LiveQuizSession;
  finalLeaderboard: LiveQuizLeaderboard;
}

export interface ParticipantJoinedMessage extends BaseMessage {
  type: 'participant_joined';
  participant: LiveQuizParticipant;
  participantCount: number;
}

export interface ParticipantLeftMessage extends BaseMessage {
  type: 'participant_left';
  participantId: string;
  participantCount: number;
}

export interface QuestionStartedMessage extends BaseMessage {
  type: 'question_started';
  question: any; // Full question data
  questionIndex: number;
  totalQuestions: number;
  timeLimit: number;
}

export interface QuestionEndedMessage extends BaseMessage {
  type: 'question_ended';
  questionId: string;
  correctAnswer: string | string[];
  answerDistribution: AnswerDistribution;
  leaderboard: LiveQuizLeaderboard;
}

export interface AnswerSubmittedMessage extends BaseMessage {
  type: 'answer_submitted';
  participantId: string;
  questionId: string;
  isCorrect: boolean;
  scoreEarned: number;
  responseTime: number;
}

export interface LeaderboardUpdatedMessage extends BaseMessage {
  type: 'leaderboard_updated';
  leaderboard: LiveQuizLeaderboard;
}

export interface AnswerDistributionMessage extends BaseMessage {
  type: 'answer_distribution';
  questionId: string;
  distribution: AnswerDistribution;
  totalResponses: number;
}

export interface ChatMessage extends BaseMessage {
  type: 'chat_message';
  participantId: string;
  participantName: string;
  message: string;
  isTeacher: boolean;
}

export interface ErrorMessage extends BaseMessage {
  type: 'error';
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Client-side state interfaces
export interface LiveQuizState {
  // Session state
  session: LiveQuizSession | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  
  // Participant state
  currentParticipant: LiveQuizParticipant | null;
  participants: LiveQuizParticipant[];
  
  // Question state
  currentQuestion: any | null;
  questionStartTime: string | null;
  timeRemaining: number;
  hasAnswered: boolean;
  selectedAnswer: string | string[] | null;
  
  // Results state
  leaderboard: LiveQuizLeaderboard | null;
  answerDistribution: AnswerDistribution | null;
  showResults: boolean;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  chatMessages: ChatMessage[];
  showChat: boolean;
}

// Hook interfaces
export interface UseLiveQuizSessionOptions {
  sessionId?: string;
  isTeacher: boolean;
  participantName?: string;
  onSessionUpdate?: (session: LiveQuizSession) => void;
  onParticipantJoined?: (participant: LiveQuizParticipant) => void;
  onQuestionStarted?: (question: any) => void;
  onLeaderboardUpdated?: (leaderboard: LiveQuizLeaderboard) => void;
  onError?: (error: string) => void;
}

export interface LiveQuizActions {
  // Session management
  createSession: (config: Partial<LiveQuizSession>) => Promise<LiveQuizSession>;
  joinSession: (sessionId: string, participantName: string) => Promise<void>;
  leaveSession: () => void;
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  
  // Question management
  nextQuestion: () => Promise<void>;
  previousQuestion: () => Promise<void>;
  skipQuestion: () => Promise<void>;
  
  // Answer management
  submitAnswer: (answer: string | string[]) => Promise<void>;
  
  // Participant management
  kickParticipant: (participantId: string) => Promise<void>;
  
  // Chat
  sendChatMessage: (message: string) => Promise<void>;
  
  // Utilities
  reconnect: () => Promise<void>;
  exportResults: () => Promise<any>;
}

// Power-ups (future feature)
export interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number; // points
  effect: 'freeze_time' | 'eliminate_wrong' | 'double_points' | 'second_chance';
  duration?: number; // seconds
  usageLimit: number;
}

// Analytics interfaces
export interface LiveQuizAnalytics {
  sessionId: string;
  totalParticipants: number;
  completionRate: number;
  averageScore: number;
  questionAnalytics: QuestionAnalytics[];
  participantAnalytics: ParticipantAnalytics[];
  engagementMetrics: EngagementMetrics;
}

export interface QuestionAnalytics {
  questionId: string;
  correctPercentage: number;
  averageResponseTime: number;
  difficultyRating: 'easy' | 'medium' | 'hard';
  answerDistribution: AnswerDistribution;
  skipRate: number;
}

export interface ParticipantAnalytics {
  participantId: string;
  displayName: string;
  finalScore: number;
  correctAnswers: number;
  totalAnswers: number;
  averageResponseTime: number;
  longestStreak: number;
  engagementScore: number;
}

export interface EngagementMetrics {
  peakParticipants: number;
  averageParticipants: number;
  dropOffRate: number;
  chatActivity: number;
  powerUpUsage: number;
}

// Default configurations
export const DEFAULT_LIVE_QUIZ_SETTINGS: LiveQuizSettings = {
  questionTimer: 30,
  showTimer: true,
  autoAdvance: true,
  showLeaderboard: true,
  showAnswerDistribution: true,
  showCorrectAnswer: true,
  randomizeQuestions: false,
  randomizeOptions: true,
  allowLateJoin: true,
  requireName: true,
  allowAnonymous: false,
  pointsPerCorrect: 1000,
  speedBonus: true,
  streakMultiplier: true,
  enableHints: false,
  enablePowerUps: false,
  enableChat: true,
};

export const WEBSOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  
  // Session
  CREATE_SESSION: 'create_session',
  JOIN_SESSION: 'join_session',
  LEAVE_SESSION: 'leave_session',
  START_SESSION: 'start_session',
  END_SESSION: 'end_session',
  PAUSE_SESSION: 'pause_session',
  RESUME_SESSION: 'resume_session',
  
  // Questions
  NEXT_QUESTION: 'next_question',
  SKIP_QUESTION: 'skip_question',
  SUBMIT_ANSWER: 'submit_answer',
  
  // Chat
  SEND_MESSAGE: 'send_message',
  
  // Admin
  KICK_PARTICIPANT: 'kick_participant',
} as const;
