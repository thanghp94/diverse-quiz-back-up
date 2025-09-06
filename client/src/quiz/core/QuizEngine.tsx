import React from 'react';
import { QuizEngineConfig } from '@/quiz/types/config.types';
import QuizOrchestrator from '@/quiz/components/orchestration/QuizOrchestrator';
import TopicQuizRunner from '@/quiz/components/individual/TopicQuizRunner';
import QuizView from '@/quiz/components/individual/QuizView';
import { QuizAppProps } from '@/quiz/hooks/useQuizLogic';

interface QuizEngineProps {
  config: QuizEngineConfig;
}

/**
 * QuizEngine - Unified quiz orchestrator that handles all quiz modes
 * through configuration-driven approach
 */
const QuizEngine: React.FC<QuizEngineProps> = ({ config }) => {
  console.log('🚀 QuizEngine: Processing unified config through NEW SYSTEM', {
    mode: config.mode,
    sourceType: config.source.type,
    topicId: config.source.topicId,
    level: config.source.level,
    questionIds: config.source.questionIds?.length || 0
  });

  // Route to appropriate component based on source type and mode
  if (config.source.type === 'topic' && config.source.topicId && config.source.level) {
    // Topic quiz - route to TopicQuizRunner for proper setup and UI
    console.log('🎯 QuizEngine: Routing to TopicQuizRunner for topic quiz');
    return (
      <TopicQuizRunner
        topicId={config.source.topicId}
        level={config.source.level}
        topicName={config.source.topicName || 'Quiz'}
        onClose={config.callbacks?.onQuizFinish || (() => {})}
      />
    );
  }

  if (config.mode === 'assignment' && config.source.questionIds && config.database?.assignmentStudentTryId) {
    // Assignment/Content quiz - route to QuizView for proper database tracking
    console.log('🎯 QuizEngine: Routing to QuizView for assignment/content quiz');
    return (
      <QuizView
        questionIds={config.source.questionIds}
        onQuizFinish={config.callbacks?.onQuizFinish || (() => {})}
        assignmentStudentTryId={config.database.assignmentStudentTryId}
        studentTryId={config.database?.studentTryId}
        contentId={config.source.contentId}
        topicId={config.source.topicId}
      />
    );
  }

  // Fallback to QuizOrchestrator for other quiz types
  console.log('🎯 QuizEngine: Routing to QuizOrchestrator for general quiz');
  const orchestratorProps: QuizAppProps = {
    assignmentTry: config.database?.assignmentStudentTryId ? {
      id: config.database.assignmentStudentTryId
    } : undefined,
    questionIds: config.source.questionIds,
    onFinish: config.callbacks?.onQuizFinish,
    studentTryId: config.database?.studentTryId,
    content: config.source.contentId ? {
      id: config.source.contentId
    } : undefined,
  };

  return <QuizOrchestrator {...orchestratorProps} />;
};

export default QuizEngine;
