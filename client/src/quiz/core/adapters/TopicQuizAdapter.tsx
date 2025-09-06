import React from 'react';
import QuizEngineAdapter from '../QuizEngineAdapter';

interface TopicQuizAdapterProps {
  topicId: string;
  level: 'Overview' | 'Easy' | 'Hard';
  topicName: string;
  onClose: () => void;
}

/**
 * TopicQuizAdapter - Adapter for TopicQuizRunner component
 * Routes topic quiz requests through the unified QuizEngine system
 */
const TopicQuizAdapter: React.FC<TopicQuizAdapterProps> = (props) => {
  console.log('🎯 TopicQuizAdapter: Routing topic quiz through unified system', {
    topicId: props.topicId,
    level: props.level,
    topicName: props.topicName
  });

  // Pass props directly to QuizEngineAdapter which will handle the conversion
  return <QuizEngineAdapter {...props} />;
};

export default TopicQuizAdapter;
