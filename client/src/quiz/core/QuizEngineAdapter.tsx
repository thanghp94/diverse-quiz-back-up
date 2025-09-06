import React from 'react';
import QuizEngine from './QuizEngine';
import { 
  QuizEngineConfig, 
  TopicQuizRunnerProps, 
  QuizViewProps, 
  QuizOrchestratorProps,
  TOPIC_QUIZ_CONFIG,
  ASSIGNMENT_QUIZ_CONFIG,
  DEFAULT_QUIZ_CONFIG
} from '@/quiz/types/config.types';

/**
 * QuizEngineAdapter - Backward compatibility layer
 * Accepts all existing prop patterns and normalizes them into unified configuration
 */

// Type guard functions to detect which legacy component is being used
function isTopicQuizRunnerProps(props: any): props is TopicQuizRunnerProps {
  return props.topicId && props.level && props.topicName && props.onClose;
}

function isQuizViewProps(props: any): props is QuizViewProps {
  return props.questionIds && props.onQuizFinish && props.assignmentStudentTryId;
}

function isQuizOrchestratorProps(props: any): props is QuizOrchestratorProps {
  return props.hasOwnProperty('assignmentTry') || props.hasOwnProperty('questionIds') || props.hasOwnProperty('onFinish');
}

// Adapter component that normalizes all legacy prop patterns
const QuizEngineAdapter: React.FC<any> = (props) => {
  let config: QuizEngineConfig;

  if (isTopicQuizRunnerProps(props)) {
    // Convert TopicQuizRunner props to unified config
    console.log('🎯 QuizEngineAdapter: Processing TopicQuizRunner props through NEW UNIFIED SYSTEM', {
      topicId: props.topicId,
      level: props.level,
      topicName: props.topicName
    });
    
    config = {
      ...TOPIC_QUIZ_CONFIG,
      mode: 'individual',
      source: {
        type: 'topic',
        topicId: props.topicId,
        topicName: props.topicName,
        level: props.level,
      },
      callbacks: {
        onQuizFinish: props.onClose,
      },
    } as QuizEngineConfig;

  } else if (isQuizViewProps(props)) {
    // Convert QuizView props to unified config
    config = {
      ...ASSIGNMENT_QUIZ_CONFIG,
      mode: 'assignment',
      source: {
        type: 'custom',
        questionIds: props.questionIds,
      },
      database: {
        assignmentStudentTryId: props.assignmentStudentTryId,
        studentTryId: props.studentTryId,
        trackingEnabled: true,
      },
      callbacks: {
        onQuizFinish: props.onQuizFinish,
      },
    } as QuizEngineConfig;

  } else if (isQuizOrchestratorProps(props)) {
    // Convert QuizOrchestrator props to unified config
    const isExternalQuiz = !!(props.assignmentTry && props.questionIds && props.onFinish);
    
    config = {
      ...DEFAULT_QUIZ_CONFIG,
      mode: isExternalQuiz ? 'assignment' : 'individual',
      source: {
        type: isExternalQuiz ? 'custom' : 'topic',
        questionIds: props.questionIds,
      },
      database: {
        assignmentStudentTryId: props.assignmentTry?.id?.toString(),
        studentTryId: props.studentTryId,
        trackingEnabled: !!props.assignmentTry,
      },
      callbacks: {
        onQuizFinish: props.onFinish,
      },
    } as QuizEngineConfig;

  } else {
    // Fallback to default config for unknown prop patterns
    console.warn('QuizEngineAdapter: Unknown prop pattern, using default config', props);
    config = {
      ...DEFAULT_QUIZ_CONFIG,
      mode: 'individual',
      source: {
        type: 'custom',
        questionIds: [],
      },
    } as QuizEngineConfig;
  }

  return <QuizEngine config={config} />;
};

// Export individual adapters for specific use cases
export const TopicQuizAdapter: React.FC<TopicQuizRunnerProps> = (props) => {
  return <QuizEngineAdapter {...props} />;
};

export const QuizViewAdapter: React.FC<QuizViewProps> = (props) => {
  return <QuizEngineAdapter {...props} />;
};

export const QuizOrchestratorAdapter: React.FC<QuizOrchestratorProps> = (props) => {
  return <QuizEngineAdapter {...props} />;
};

export default QuizEngineAdapter;
