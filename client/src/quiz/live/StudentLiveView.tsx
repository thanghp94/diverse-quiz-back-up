import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  Users, 
  Trophy, 
  Zap, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  Send,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useLiveQuizSession } from '@/quiz/hooks/useLiveQuizSession';
import { LiveQuizLeaderboard } from '@/quiz/types/live.types';

interface StudentLiveViewProps {
  sessionId: string;
  participantName?: string;
  onLeave?: () => void;
}

const StudentLiveView: React.FC<StudentLiveViewProps> = ({
  sessionId,
  participantName,
  onLeave
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [showChat, setShowChat] = useState(false);

  const {
    session,
    currentParticipant,
    participants,
    currentQuestion,
    leaderboard,
    answerDistribution,
    timeRemaining,
    hasAnswered,
    showResults,
    isConnected,
    connectionStatus,
    error,
    chatMessages,
    actions,
    canSubmitAnswer,
    progressPercentage
  } = useLiveQuizSession({
    sessionId,
    isTeacher: false,
    participantName,
    onQuestionStarted: () => {
      setSelectedAnswer(null);
    },
    onError: (error) => {
      console.error('Student quiz error:', error);
    }
  });

  // Auto-join session when component mounts
  useEffect(() => {
    if (sessionId && participantName && !currentParticipant) {
      actions.joinSession(sessionId, participantName);
    }
  }, [sessionId, participantName, currentParticipant, actions]);

  const handleAnswerSelect = (answer: string) => {
    if (!canSubmitAnswer || hasAnswered) return;
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !canSubmitAnswer) return;
    
    try {
      await actions.submitAnswer(selectedAnswer);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    
    try {
      await actions.sendChatMessage(chatMessage);
      setChatMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleLeaveSession = () => {
    actions.leaveSession();
    onLeave?.();
  };

  // Connection status screen
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-500" />
              <h3 className="text-lg font-semibold mb-2">
                {connectionStatus === 'connecting' ? 'Joining Quiz...' : 'Connection Lost'}
              </h3>
              <p className="text-gray-600 mb-4">
                {connectionStatus === 'connecting' 
                  ? 'Getting you ready for the live quiz'
                  : 'Trying to reconnect to the quiz'
                }
              </p>
              {connectionStatus === 'error' && (
                <Button onClick={actions.reconnect} variant="outline">
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Waiting room
  if (session?.status === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-blue-600">
              {session.title}
            </CardTitle>
            <p className="text-gray-600">Waiting for quiz to start...</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Welcome, {currentParticipant?.displayName}!
              </h3>
              <p className="text-gray-600 mb-4">
                {participants.length} participant{participants.length !== 1 ? 's' : ''} joined
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Participants:</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {participants.map((participant) => (
                  <div 
                    key={participant.id}
                    className="flex items-center justify-between p-2 bg-white rounded-lg"
                  >
                    <span className="text-sm">{participant.displayName}</span>
                    {participant.id === currentParticipant?.id && (
                      <Badge variant="secondary" className="text-xs">You</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleLeaveSession}
              variant="outline" 
              className="w-full"
            >
              Leave Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz completed
  if (session?.status === 'completed' || showResults) {
    const myRank = leaderboard?.participants.find(p => p.participantId === currentParticipant?.id)?.rank || 0;
    const myScore = currentParticipant?.currentScore || 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-green-600 mb-2">
              Quiz Complete! 🎉
            </CardTitle>
            <p className="text-gray-600">Great job participating in {session?.title}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Results */}
            <div className="text-center p-6 bg-white rounded-lg">
              <div className="flex items-center justify-center gap-8 mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{myScore}</div>
                  <div className="text-sm text-gray-600">Your Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">#{myRank}</div>
                  <div className="text-sm text-gray-600">Your Rank</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {currentParticipant?.correctAnswers || 0}
                  </div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
              </div>
              
              {myRank <= 3 && (
                <Badge className="bg-yellow-500 text-white text-lg px-4 py-2">
                  🏆 Top {myRank} Finish!
                </Badge>
              )}
            </div>

            {/* Leaderboard */}
            {leaderboard && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-center">Final Leaderboard</h3>
                <div className="space-y-2">
                  {leaderboard.participants.slice(0, 10).map((entry, index) => (
                    <div 
                      key={entry.participantId}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        entry.participantId === currentParticipant?.id 
                          ? 'bg-blue-100 border-2 border-blue-300' 
                          : 'bg-white'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`}>
                        {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">
                          {entry.displayName}
                          {entry.participantId === currentParticipant?.id && (
                            <span className="text-blue-600 ml-2">(You)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {entry.correctAnswers}/{entry.totalAnswers} correct
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{entry.score}</div>
                        {entry.currentStreak > 0 && (
                          <div className="text-xs text-orange-600">
                            🔥 {entry.currentStreak}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button 
              onClick={handleLeaveSession}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Exit Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active quiz
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{session?.title}</h1>
              <p className="text-gray-600">Welcome, {currentParticipant?.displayName}!</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{currentParticipant?.currentScore || 0}</div>
                <div className="text-xs text-gray-600">Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{currentParticipant?.currentStreak || 0}</div>
                <div className="text-xs text-gray-600">Streak</div>
              </div>
            </div>
          </div>
          
          <Progress value={progressPercentage} className="w-full h-2" />
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Question Area */}
          <div className="lg:col-span-3">
            {currentQuestion ? (
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                      Question {(session?.currentQuestionIndex || 0) + 1} of {session?.questionIds.length}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-500" />
                      <span className={`font-mono text-xl font-bold ${
                        timeRemaining <= 10 ? 'text-red-500' : 'text-gray-700'
                      }`}>
                        {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <h2 className="text-2xl font-semibold leading-relaxed">
                    {currentQuestion.question}
                  </h2>

                  {/* Answer Options */}
                  {currentQuestion.options && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentQuestion.options.map((option: string, index: number) => {
                        const optionKey = String.fromCharCode(65 + index);
                        const isSelected = selectedAnswer === optionKey;
                        const isCorrect = showResults && index === currentQuestion.correct;
                        const isWrong = showResults && isSelected && index !== currentQuestion.correct;
                        
                        return (
                          <Button
                            key={index}
                            variant="outline"
                            className={`h-auto p-4 text-left justify-start transition-all duration-200 ${
                              hasAnswered ? 'cursor-not-allowed' :
                              isSelected ? 'ring-2 ring-blue-500 bg-blue-50' :
                              'hover:bg-gray-50 hover:scale-[1.02]'
                            } ${
                              isCorrect ? 'bg-green-100 border-green-500 text-green-800' :
                              isWrong ? 'bg-red-100 border-red-500 text-red-800' :
                              ''
                            }`}
                            onClick={() => handleAnswerSelect(optionKey)}
                            disabled={hasAnswered || !canSubmitAnswer}
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                isSelected ? 'bg-blue-500 text-white' :
                                isCorrect ? 'bg-green-500 text-white' :
                                isWrong ? 'bg-red-500 text-white' :
                                'bg-gray-200 text-gray-700'
                              }`}>
                                {optionKey}
                              </div>
                              <span className="flex-1 text-base">{option}</span>
                              {showResults && isCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                              {showResults && isWrong && <XCircle className="h-5 w-5 text-red-600" />}
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  )}

                  {/* Submit Button */}
                  {!hasAnswered && selectedAnswer && canSubmitAnswer && (
                    <div className="text-center">
                      <Button 
                        onClick={handleSubmitAnswer}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                      >
                        Submit Answer
                      </Button>
                    </div>
                  )}

                  {/* Waiting for next question */}
                  {hasAnswered && !showResults && (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                      <p className="text-lg font-medium text-gray-700">Answer submitted!</p>
                      <p className="text-gray-600">Waiting for other participants...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent>
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
                    <h3 className="text-xl font-semibold mb-2">Get Ready!</h3>
                    <p className="text-gray-600">Next question coming up...</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Correct</span>
                  <span className="font-bold text-green-600">
                    {currentParticipant?.correctAnswers || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="font-bold">
                    {currentParticipant?.totalAnswers || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Streak</span>
                  <span className="font-bold text-orange-600">
                    🔥 {currentParticipant?.currentStreak || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Mini Leaderboard */}
            {leaderboard && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Top Players
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {leaderboard.participants.slice(0, 5).map((entry, index) => (
                      <div 
                        key={entry.participantId}
                        className={`flex items-center gap-2 text-sm ${
                          entry.participantId === currentParticipant?.id ? 'font-bold text-blue-600' : ''
                        }`}
                      >
                        <span className="w-4 text-center">{index + 1}</span>
                        <span className="flex-1 truncate">
                          {entry.displayName}
                          {entry.participantId === currentParticipant?.id && ' (You)'}
                        </span>
                        <span>{entry.score}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Participants Count */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="font-bold text-lg">{participants.length}</div>
                  <div className="text-sm text-gray-600">Participants</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLiveView;
