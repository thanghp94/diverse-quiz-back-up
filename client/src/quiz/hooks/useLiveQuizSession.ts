import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  LiveQuizSession,
  LiveQuizParticipant,
  LiveQuizState,
  LiveQuizActions,
  UseLiveQuizSessionOptions,
  WEBSOCKET_EVENTS,
  DEFAULT_LIVE_QUIZ_SETTINGS,
} from '@/quiz/types/live.types';

/**
 * useLiveQuizSession - WebSocket-based live quiz session management
 * Handles real-time communication for Quizizz-style live quizzes
 */
export const useLiveQuizSession = (options: UseLiveQuizSessionOptions) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [state, setState] = useState<LiveQuizState>({
    session: null,
    isConnected: false,
    connectionStatus: 'disconnected',
    currentParticipant: null,
    participants: [],
    currentQuestion: null,
    questionStartTime: null,
    timeRemaining: 0,
    hasAnswered: false,
    selectedAnswer: null,
    leaderboard: null,
    answerDistribution: null,
    showResults: false,
    isLoading: false,
    error: null,
    chatMessages: [],
    showChat: false,
  });

  // WebSocket URL - adjust based on your environment
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/live-quiz`;
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState(prev => ({ ...prev, connectionStatus: 'connecting' }));

    try {
      const ws = new WebSocket(getWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔗 Live quiz WebSocket connected');
        setState(prev => ({ 
          ...prev, 
          isConnected: true, 
          connectionStatus: 'connected',
          error: null 
        }));

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 Live quiz WebSocket disconnected:', event.code, event.reason);
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          connectionStatus: 'disconnected' 
        }));

        // Clear intervals
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Attempt reconnection if not intentional
        if (event.code !== 1000 && event.code !== 1001) {
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('🚨 Live quiz WebSocket error:', error);
        setState(prev => ({ 
          ...prev, 
          connectionStatus: 'error',
          error: 'Connection error occurred' 
        }));
        options.onError?.('WebSocket connection failed');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setState(prev => ({ 
        ...prev, 
        connectionStatus: 'error',
        error: 'Failed to connect to live quiz server' 
      }));
    }
  }, [getWebSocketUrl, options]);

  // Schedule reconnection
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('🔄 Attempting to reconnect to live quiz...');
      connect();
    }, 3000);
  }, [connect]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
    console.log('📨 Received live quiz message:', message.type);

    switch (message.type) {
      case 'session_created':
        setState(prev => ({ ...prev, session: message.session }));
        options.onSessionUpdate?.(message.session);
        toast({ title: 'Session Created', description: `Quiz "${message.session.title}" is ready!` });
        break;

      case 'session_started':
        setState(prev => ({ ...prev, session: message.session }));
        options.onSessionUpdate?.(message.session);
        toast({ title: 'Quiz Started!', description: 'The live quiz has begun.' });
        break;

      case 'session_ended':
        setState(prev => ({ 
          ...prev, 
          session: message.session,
          leaderboard: message.finalLeaderboard,
          showResults: true 
        }));
        toast({ title: 'Quiz Completed', description: 'Thanks for participating!' });
        break;

      case 'participant_joined':
        setState(prev => ({
          ...prev,
          participants: [...prev.participants.filter(p => p.id !== message.participant.id), message.participant]
        }));
        options.onParticipantJoined?.(message.participant);
        
        if (!options.isTeacher) {
          toast({ 
            title: 'Participant Joined', 
            description: `${message.participant.displayName} joined the quiz` 
          });
        }
        break;

      case 'participant_left':
        setState(prev => ({
          ...prev,
          participants: prev.participants.filter(p => p.id !== message.participantId)
        }));
        break;

      case 'question_started':
        setState(prev => ({
          ...prev,
          currentQuestion: message.question,
          questionStartTime: new Date().toISOString(),
          timeRemaining: message.timeLimit,
          hasAnswered: false,
          selectedAnswer: null,
          showResults: false,
          answerDistribution: null
        }));
        
        startQuestionTimer(message.timeLimit);
        options.onQuestionStarted?.(message.question);
        break;

      case 'question_ended':
        setState(prev => ({
          ...prev,
          leaderboard: message.leaderboard,
          answerDistribution: message.answerDistribution,
          showResults: true,
          timeRemaining: 0
        }));
        
        clearQuestionTimer();
        options.onLeaderboardUpdated?.(message.leaderboard);
        break;

      case 'answer_submitted':
        // Update UI to show answer was received
        if (message.participantId === state.currentParticipant?.id) {
          setState(prev => ({ ...prev, hasAnswered: true }));
        }
        break;

      case 'leaderboard_updated':
        setState(prev => ({ ...prev, leaderboard: message.leaderboard }));
        options.onLeaderboardUpdated?.(message.leaderboard);
        break;

      case 'answer_distribution':
        setState(prev => ({ ...prev, answerDistribution: message.distribution }));
        break;

      case 'chat_message':
        setState(prev => ({
          ...prev,
          chatMessages: [...prev.chatMessages, message]
        }));
        break;

      case 'error':
        const errorMsg = message.error?.message || 'Unknown error occurred';
        setState(prev => ({ ...prev, error: errorMsg }));
        options.onError?.(errorMsg);
        toast({ 
          title: 'Quiz Error', 
          description: errorMsg, 
          variant: 'destructive' 
        });
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }, [state.currentParticipant?.id, options, toast]);

  // Question timer management
  const startQuestionTimer = useCallback((duration: number) => {
    clearQuestionTimer();
    
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);
    
    questionTimerRef.current = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
      
      setState(prev => ({ ...prev, timeRemaining: remaining }));
      
      if (remaining <= 0) {
        clearQuestionTimer();
      }
    }, 100);
  }, []);

  const clearQuestionTimer = useCallback(() => {
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
  }, []);

  // Send WebSocket message
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('WebSocket not connected, cannot send message');
      toast({ 
        title: 'Connection Error', 
        description: 'Not connected to live quiz server', 
        variant: 'destructive' 
      });
      return false;
    }
  }, [toast]);

  // Actions
  const actions: LiveQuizActions = {
    createSession: useCallback(async (config) => {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const sessionConfig = {
        teacherId: user?.id || 'anonymous',
        title: config.title || 'Live Quiz',
        description: config.description || '',
        topicId: config.topicId,
        questionIds: config.questionIds || [],
        settings: { ...DEFAULT_LIVE_QUIZ_SETTINGS, ...config.settings },
        status: 'waiting' as const,
        currentQuestionIndex: 0,
        participantCount: 0,
        createdAt: new Date().toISOString(),
      };

      const success = sendMessage({
        type: WEBSOCKET_EVENTS.CREATE_SESSION,
        ...sessionConfig
      });

      setState(prev => ({ ...prev, isLoading: false }));
      
      if (!success) {
        throw new Error('Failed to create session');
      }

      // Return a placeholder - actual session will come via WebSocket
      return sessionConfig as LiveQuizSession;
    }, [user, sendMessage]),

    joinSession: useCallback(async (sessionId, participantName) => {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const success = sendMessage({
        type: WEBSOCKET_EVENTS.JOIN_SESSION,
        sessionId,
        participantName,
        studentId: user?.id,
        isAnonymous: !user?.id
      });

      setState(prev => ({ ...prev, isLoading: false }));
      
      if (!success) {
        throw new Error('Failed to join session');
      }
    }, [user, sendMessage]),

    leaveSession: useCallback(() => {
      if (state.session) {
        sendMessage({
          type: WEBSOCKET_EVENTS.LEAVE_SESSION,
          sessionId: state.session.id,
          participantId: state.currentParticipant?.id
        });
      }
      
      setState(prev => ({
        ...prev,
        session: null,
        currentParticipant: null,
        participants: [],
        currentQuestion: null,
        leaderboard: null,
        showResults: false
      }));
    }, [state.session, state.currentParticipant, sendMessage]),

    startSession: useCallback(async () => {
      if (!state.session) throw new Error('No active session');
      
      const success = sendMessage({
        type: WEBSOCKET_EVENTS.START_SESSION,
        sessionId: state.session.id
      });
      
      if (!success) {
        throw new Error('Failed to start session');
      }
    }, [state.session, sendMessage]),

    endSession: useCallback(async () => {
      if (!state.session) throw new Error('No active session');
      
      const success = sendMessage({
        type: WEBSOCKET_EVENTS.END_SESSION,
        sessionId: state.session.id
      });
      
      if (!success) {
        throw new Error('Failed to end session');
      }
    }, [state.session, sendMessage]),

    pauseSession: useCallback(async () => {
      if (!state.session) throw new Error('No active session');
      
      const success = sendMessage({
        type: WEBSOCKET_EVENTS.PAUSE_SESSION,
        sessionId: state.session.id
      });
      
      if (!success) {
        throw new Error('Failed to pause session');
      }
    }, [state.session, sendMessage]),

    resumeSession: useCallback(async () => {
      if (!state.session) throw new Error('No active session');
      
      const success = sendMessage({
        type: WEBSOCKET_EVENTS.RESUME_SESSION,
        sessionId: state.session.id
      });
      
      if (!success) {
        throw new Error('Failed to resume session');
      }
    }, [state.session, sendMessage]),

    nextQuestion: useCallback(async () => {
      if (!state.session) throw new Error('No active session');
      
      const success = sendMessage({
        type: WEBSOCKET_EVENTS.NEXT_QUESTION,
        sessionId: state.session.id
      });
      
      if (!success) {
        throw new Error('Failed to advance to next question');
      }
    }, [state.session, sendMessage]),

    previousQuestion: useCallback(async () => {
      // Implementation for going back to previous question
      throw new Error('Previous question not implemented yet');
    }, []),

    skipQuestion: useCallback(async () => {
      if (!state.session) throw new Error('No active session');
      
      const success = sendMessage({
        type: WEBSOCKET_EVENTS.SKIP_QUESTION,
        sessionId: state.session.id
      });
      
      if (!success) {
        throw new Error('Failed to skip question');
      }
    }, [state.session, sendMessage]),

    submitAnswer: useCallback(async (answer) => {
      if (!state.session || !state.currentQuestion || !state.currentParticipant) {
        throw new Error('Cannot submit answer - invalid state');
      }
      
      if (state.hasAnswered) {
        throw new Error('Answer already submitted for this question');
      }

      const responseTime = state.questionStartTime 
        ? Date.now() - new Date(state.questionStartTime).getTime()
        : 0;

      const success = sendMessage({
        type: WEBSOCKET_EVENTS.SUBMIT_ANSWER,
        sessionId: state.session.id,
        questionId: state.currentQuestion.id,
        participantId: state.currentParticipant.id,
        answer,
        responseTime
      });
      
      if (success) {
        setState(prev => ({ 
          ...prev, 
          selectedAnswer: answer,
          hasAnswered: true 
        }));
      } else {
        throw new Error('Failed to submit answer');
      }
    }, [state.session, state.currentQuestion, state.currentParticipant, state.hasAnswered, state.questionStartTime, sendMessage]),

    kickParticipant: useCallback(async (participantId) => {
      if (!state.session) throw new Error('No active session');
      
      const success = sendMessage({
        type: WEBSOCKET_EVENTS.KICK_PARTICIPANT,
        sessionId: state.session.id,
        participantId
      });
      
      if (!success) {
        throw new Error('Failed to kick participant');
      }
    }, [state.session, sendMessage]),

    sendChatMessage: useCallback(async (message) => {
      if (!state.session || !state.currentParticipant) {
        throw new Error('Cannot send message - not in session');
      }
      
      const success = sendMessage({
        type: WEBSOCKET_EVENTS.SEND_MESSAGE,
        sessionId: state.session.id,
        participantId: state.currentParticipant.id,
        message
      });
      
      if (!success) {
        throw new Error('Failed to send message');
      }
    }, [state.session, state.currentParticipant, sendMessage]),

    reconnect: useCallback(async () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      connect();
    }, [connect]),

    exportResults: useCallback(async () => {
      if (!state.session) throw new Error('No active session');
      
      // This would typically make an API call to get detailed results
      return {
        session: state.session,
        leaderboard: state.leaderboard,
        participants: state.participants,
        exportedAt: new Date().toISOString()
      };
    }, [state.session, state.leaderboard, state.participants])
  };

  // Initialize connection
  useEffect(() => {
    connect();
    
    return () => {
      // Cleanup
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      clearQuestionTimer();
    };
  }, [connect]);

  return {
    ...state,
    actions,
    // Utility functions
    isTeacher: options.isTeacher,
    canSubmitAnswer: !state.hasAnswered && state.currentQuestion && state.timeRemaining > 0,
    progressPercentage: state.session 
      ? ((state.session.currentQuestionIndex + 1) / state.session.questionIds.length) * 100 
      : 0,
  };
};

export default useLiveQuizSession;
