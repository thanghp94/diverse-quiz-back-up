import React from 'react';
import { QuizEngineAdapter } from '@/quiz';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * QuizEngineDemo - Demonstrates the unified quiz system
 * Shows how different legacy prop patterns are normalized through the adapter
 */
const QuizEngineDemo: React.FC = () => {
  const [activeDemo, setActiveDemo] = React.useState<string | null>(null);

  // Example legacy prop patterns that the adapter can handle
  const topicQuizProps = {
    topicId: 'math-101',
    level: 'Easy' as const,
    topicName: 'Basic Mathematics',
    onClose: () => setActiveDemo(null),
  };

  const quizViewProps = {
    questionIds: ['q1', 'q2', 'q3'],
    onQuizFinish: () => setActiveDemo(null),
    assignmentStudentTryId: 'try-123',
    studentTryId: 'student-456',
  };

  const orchestratorProps = {
    assignmentTry: { id: 'assignment-789' },
    questionIds: ['q4', 'q5', 'q6'],
    onFinish: () => setActiveDemo(null),
  };

  if (activeDemo) {
    return (
      <div className="w-full h-full">
        {activeDemo === 'topic' && (
          <QuizEngineAdapter {...topicQuizProps} />
        )}
        {activeDemo === 'view' && (
          <QuizEngineAdapter {...quizViewProps} />
        )}
        {activeDemo === 'orchestrator' && (
          <QuizEngineAdapter {...orchestratorProps} />
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            🎯 Unified Quiz System Demo
          </CardTitle>
          <p className="text-center text-gray-600">
            Phase 1: Backward Compatibility Layer Complete
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* TopicQuizRunner Demo */}
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg text-blue-700">
                  Topic Quiz Runner
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Legacy TopicQuizRunner props → Unified Config
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div><strong>topicId:</strong> math-101</div>
                  <div><strong>level:</strong> Easy</div>
                  <div><strong>topicName:</strong> Basic Mathematics</div>
                </div>
                <Button 
                  onClick={() => setActiveDemo('topic')}
                  className="w-full mt-4 bg-blue-500 hover:bg-blue-600"
                >
                  Launch Topic Quiz
                </Button>
              </CardContent>
            </Card>

            {/* QuizView Demo */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-lg text-green-700">
                  Quiz View
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Legacy QuizView props → Unified Config
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div><strong>questionIds:</strong> [q1, q2, q3]</div>
                  <div><strong>assignmentTryId:</strong> try-123</div>
                  <div><strong>studentTryId:</strong> student-456</div>
                </div>
                <Button 
                  onClick={() => setActiveDemo('view')}
                  className="w-full mt-4 bg-green-500 hover:bg-green-600"
                >
                  Launch Quiz View
                </Button>
              </CardContent>
            </Card>

            {/* QuizOrchestrator Demo */}
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg text-purple-700">
                  Quiz Orchestrator
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Legacy Orchestrator props → Unified Config
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div><strong>assignmentTry:</strong> assignment-789</div>
                  <div><strong>questionIds:</strong> [q4, q5, q6]</div>
                  <div><strong>mode:</strong> assignment</div>
                </div>
                <Button 
                  onClick={() => setActiveDemo('orchestrator')}
                  className="w-full mt-4 bg-purple-500 hover:bg-purple-600"
                >
                  Launch Orchestrator
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  ✅ Phase 1 Complete: Backward Compatibility Layer
                </h3>
                <p className="text-green-700">
                  All legacy prop patterns are now normalized through the QuizEngineAdapter.
                  Existing components work unchanged while using the unified system internally.
                </p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizEngineDemo;
