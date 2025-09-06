import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  Users, 
  Clock, 
  BarChart3,
  Settings,
  MessageSquare,
  Download,
  RefreshCw
} from 'lucide-react';
import { useLiveQuizSession } from '@/quiz/hooks/useLiveQuizSession';
import { LiveQuizSession, LiveQuizSettings } from '@/quiz/types/live.types';

interface TeacherLiveViewProps {
  sessionId?: string;
  initialSession?: Partial<LiveQuizSession>;
  onSessionEnd?: () => void;
}

const TeacherLiveView: React.FC<TeacherLiveViewProps> = ({
  sessionId,
  initialSession,
  onSessionEnd
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const {
    session,
    participants,
    currentQuestion,
    leaderboard,
    answerDistribution,
    timeRemaining,
    isConnected,
    connectionStatus,
    error,
    chatMessages,
    actions,
    progressPercentage
  } = useLiveQuizSession({
    sessionId,
    isTeacher: true,
    onSessionUpdate: (updatedSession) => {
      console.log('Session updated:', updatedSession);
    },
    onParticipantJoined: (participant) => {
      console.log('Participant joined:', participant.displayName);
    },
    onError: (error) => {
      console.error('Live quiz error:', error);
    }
  });

  // Create session if not provided
  useEffect(() => {
    if (!sessionId && !session && initialSession) {
      actions.createSession(initialSession);
    }
  }, [sessionId, session, initialSession, actions]);

  const handleStartSession = async () => {
    try {
      await actions.startSession();
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleEndSession = async () => {
    try {
      await actions.endSession();
      onSessionEnd?.();
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const handleNextQuestion = async () => {
    try {
      await actions.nextQuestion();
    } catch (error) {
      console.error('Failed to advance question:', error);
    }
  };

  const handleSkipQuestion = async () => {
    try {
      await actions.skipQuestion();
    } catch (error) {
      console.error('Failed to skip question:', error);
    }
  };

  const handlePauseSession = async () => {
    try {
      if (session?.status === 'active') {
        await actions.pauseSession();
      } else {
        await actions.resumeSession();
      }
    } catch (error) {
      console.error('Failed to pause/resume session:', error);
    }
  };

  const handleExportResults = async () => {
    try {
      const results = await actions.exportResults();
      // Create and download CSV or JSON file
      const dataStr = JSON.stringify(results, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `quiz-results-${session?.id}-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('Failed to export results:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <h3 className="text-lg font-semibold mb-2">
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Connection Lost'}
              </h3>
              <p className="text-gray-600 mb-4">
                {connectionStatus === 'connecting' 
                  ? 'Setting up your live quiz session'
                  : 'Attempting to reconnect to the live quiz server'
                }
              </p>
              {connectionStatus === 'error' && (
                <Button onClick={actions.reconnect} variant="outline">
                  Retry Connection
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No Active Session</h3>
              <p className="text-gray-600">Please create a quiz session to continue.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{session.title}</h1>
              <p className="text-gray-600 mt-1">Session ID: {session.id}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={session.status === 'active' ? 'default' : 'secondary'}
                className="text-sm px-3 py-1"
              >
                {session.status.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="text-sm px-3 py-1">
                <Users className="h-3 w-3 mr-1" />
                {participants.length} participants
              </Badge>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Control Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Session Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {session.status === 'waiting' && (
                    <Button 
                      onClick={handleStartSession}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Quiz
                    </Button>
                  )}
                  
                  {session.status === 'active' && (
                    <>
                      <Button 
                        onClick={handlePauseSession}
                        variant="outline"
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                      <Button 
                        onClick={handleNextQuestion}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <SkipForward className="h-4 w-4 mr-2" />
                        Next Question
                      </Button>
                      <Button 
                        onClick={handleSkipQuestion}
                        variant="outline"
                      >
                        Skip Question
                      </Button>
                    </>
                  )}
                  
                  {session.status === 'paused' && (
                    <Button 
                      onClick={handlePauseSession}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </Button>
                  )}
                  
                  <Button 
                    onClick={handleEndSession}
                    variant="destructive"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    End Quiz
                  </Button>
                  
                  <Button 
                    onClick={handleExportResults}
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Results
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Question */}
            {currentQuestion && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Current Question</CardTitle>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-mono text-lg">
                        {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                  <Progress value={progressPercentage} className="w-full" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{currentQuestion.question}</h3>
                    
                    {/* Answer Options */}
                    {currentQuestion.options && (
                      <div className="grid grid-cols-2 gap-3">
                        {currentQuestion.options.map((option: string, index: number) => {
                          const optionKey = String.fromCharCode(65 + index);
                          const distribution = answerDistribution?.[optionKey];
                          const isCorrect = index === currentQuestion.correct;
                          
                          return (
                            <div 
                              key={index}
                              className={`p-3 rounded-lg border-2 ${
                                isCorrect 
                                  ? 'border-green-500 bg-green-50' 
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{optionKey}. {option}</span>
                                {distribution && (
                                  <Badge variant="secondary">
                                    {distribution.count} ({distribution.percentage}%)
                                  </Badge>
                                )}
                              </div>
                              {distribution && (
                                <Progress 
                                  value={distribution.percentage} 
                                  className="mt-2 h-2"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Answer Distribution */}
            {answerDistribution && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Live Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(answerDistribution).map(([option, data]) => (
                      <div key={option} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-semibold">
                          {option}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">
                              {data.count} responses
                            </span>
                            <span className="text-sm text-gray-600">
                              {data.percentage}%
                            </span>
                          </div>
                          <Progress value={data.percentage} className="h-2" />
                        </div>
                        {data.isCorrect && (
                          <Badge className="bg-green-500">Correct</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participants ({participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {participants.map((participant) => (
                    <div 
                      key={participant.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                    >
                      <div>
                        <div className="font-medium text-sm">{participant.displayName}</div>
                        <div className="text-xs text-gray-600">
                          Score: {participant.currentScore}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge 
                          variant={participant.isActive ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {participant.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {participants.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      No participants yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            {leaderboard && (
              <Card>
                <CardHeader>
                  <CardTitle>Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {leaderboard.participants.slice(0, 10).map((entry, index) => (
                      <div 
                        key={entry.participantId}
                        className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                      >
                        <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{entry.displayName}</div>
                          <div className="text-xs text-gray-600">
                            {entry.correctAnswers}/{entry.totalAnswers} correct
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm">{entry.score}</div>
                          {entry.currentStreak > 0 && (
                            <div className="text-xs text-orange-600">
                              🔥 {entry.currentStreak}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Chat */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Chat ({chatMessages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {chatMessages.slice(-10).map((message, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{message.participantName}:</span>
                      <span className="ml-2">{message.message}</span>
                    </div>
                  ))}
                  {chatMessages.length === 0 && (
                    <div className="text-center text-gray-500 py-4 text-sm">
                      No messages yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherLiveView;
