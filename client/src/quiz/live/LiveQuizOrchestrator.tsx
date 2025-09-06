import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Users, 
  Settings, 
  Copy, 
  Check,
  Clock,
  BookOpen,
  Shuffle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import TeacherLiveView from './TeacherLiveView';
import StudentLiveView from './StudentLiveView';
import { LiveQuizSession, LiveQuizSettings, DEFAULT_LIVE_QUIZ_SETTINGS } from '@/quiz/types/live.types';

interface LiveQuizOrchestratorProps {
  mode: 'create' | 'join' | 'teacher' | 'student';
  sessionId?: string;
  topicId?: string;
  questionIds?: string[];
  onModeChange?: (mode: 'create' | 'join' | 'teacher' | 'student') => void;
}

const LiveQuizOrchestrator: React.FC<LiveQuizOrchestratorProps> = ({
  mode,
  sessionId,
  topicId,
  questionIds = [],
  onModeChange
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Create session state
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [settings, setSettings] = useState<LiveQuizSettings>(DEFAULT_LIVE_QUIZ_SETTINGS);
  const [createdSession, setCreatedSession] = useState<LiveQuizSession | null>(null);
  
  // Join session state
  const [joinSessionId, setJoinSessionId] = useState(sessionId || '');
  const [participantName, setParticipantName] = useState(user?.full_name || '');
  
  // UI state
  const [isCreating, setIsCreating] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [copiedSessionId, setCopiedSessionId] = useState(false);

  // Auto-fill participant name from user
  useEffect(() => {
    if (user?.full_name && !participantName) {
      setParticipantName(user.full_name);
    }
  }, [user, participantName]);

  const handleCreateSession = async () => {
    if (!quizTitle.trim()) {
      toast({
        title: 'Quiz Title Required',
        description: 'Please enter a title for your quiz',
        variant: 'destructive'
      });
      return;
    }

    if (questionIds.length === 0) {
      toast({
        title: 'No Questions',
        description: 'Please select questions for your quiz',
        variant: 'destructive'
      });
      return;
    }

    setIsCreating(true);
    
    try {
      // This would typically create the session via API
      const newSession: LiveQuizSession = {
        id: `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        teacherId: user?.id || 'anonymous',
        title: quizTitle,
        description: quizDescription,
        topicId,
        questionIds,
        status: 'waiting',
        currentQuestionIndex: 0,
        settings,
        createdAt: new Date().toISOString(),
        participantCount: 0
      };

      setCreatedSession(newSession);
      
      toast({
        title: 'Quiz Created!',
        description: `Your live quiz "${quizTitle}" is ready. Share the session ID with participants.`
      });

      // Switch to teacher view
      onModeChange?.('teacher');
      
    } catch (error) {
      console.error('Failed to create session:', error);
      toast({
        title: 'Creation Failed',
        description: 'Could not create the live quiz session. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinSession = () => {
    if (!joinSessionId.trim()) {
      toast({
        title: 'Session ID Required',
        description: 'Please enter a session ID to join',
        variant: 'destructive'
      });
      return;
    }

    if (!participantName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter your name to join the quiz',
        variant: 'destructive'
      });
      return;
    }

    // Switch to student view
    onModeChange?.('student');
  };

  const copySessionId = async (sessionId: string) => {
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopiedSessionId(true);
      toast({
        title: 'Copied!',
        description: 'Session ID copied to clipboard'
      });
      setTimeout(() => setCopiedSessionId(false), 2000);
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy session ID',
        variant: 'destructive'
      });
    }
  };

  const updateSetting = <K extends keyof LiveQuizSettings>(
    key: K, 
    value: LiveQuizSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Render based on mode
  switch (mode) {
    case 'teacher':
      return (
        <TeacherLiveView 
          sessionId={createdSession?.id || sessionId}
          initialSession={createdSession || undefined}
          onSessionEnd={() => onModeChange?.('create')}
        />
      );

    case 'student':
      return (
        <StudentLiveView 
          sessionId={joinSessionId || sessionId || ''}
          participantName={participantName}
          onLeave={() => onModeChange?.('join')}
        />
      );

    case 'create':
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Live Quiz</h1>
              <p className="text-gray-600">Set up a real-time quiz session for your students</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quiz Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Settings */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="quiz-title">Quiz Title *</Label>
                    <Input
                      id="quiz-title"
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      placeholder="Enter quiz title..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="quiz-description">Description (Optional)</Label>
                    <Input
                      id="quiz-description"
                      value={quizDescription}
                      onChange={(e) => setQuizDescription(e.target.value)}
                      placeholder="Brief description of the quiz..."
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Questions Selected</span>
                    </div>
                    <Badge variant="secondary">{questionIds.length} questions</Badge>
                  </div>
                </div>

                {/* Quick Settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Quick Settings</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="question-timer">Time per Question (seconds)</Label>
                      <Input
                        id="question-timer"
                        type="number"
                        min="10"
                        max="300"
                        value={settings.questionTimer}
                        onChange={(e) => updateSetting('questionTimer', parseInt(e.target.value) || 30)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="points-per-correct">Points per Correct Answer</Label>
                      <Input
                        id="points-per-correct"
                        type="number"
                        min="100"
                        max="5000"
                        step="100"
                        value={settings.pointsPerCorrect}
                        onChange={(e) => updateSetting('pointsPerCorrect', parseInt(e.target.value) || 1000)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Leaderboard</Label>
                      <p className="text-sm text-gray-600">Display live rankings to participants</p>
                    </div>
                    <Button
                      variant={settings.showLeaderboard ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateSetting('showLeaderboard', !settings.showLeaderboard)}
                    >
                      {settings.showLeaderboard ? 'On' : 'Off'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Speed Bonus</Label>
                      <p className="text-sm text-gray-600">Award extra points for quick answers</p>
                    </div>
                    <Button
                      variant={settings.speedBonus ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateSetting('speedBonus', !settings.speedBonus)}
                    >
                      {settings.speedBonus ? 'On' : 'Off'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Randomize Options</Label>
                      <p className="text-sm text-gray-600">Shuffle answer choices for each participant</p>
                    </div>
                    <Button
                      variant={settings.randomizeOptions ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateSetting('randomizeOptions', !settings.randomizeOptions)}
                    >
                      <Shuffle className="h-4 w-4 mr-1" />
                      {settings.randomizeOptions ? 'On' : 'Off'}
                    </Button>
                  </div>
                </div>

                {/* Advanced Settings Toggle */}
                <div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    className="w-full"
                  >
                    {showAdvancedSettings ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {showAdvancedSettings ? 'Hide' : 'Show'} Advanced Settings
                  </Button>
                </div>

                {/* Advanced Settings */}
                {showAdvancedSettings && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Advanced Options</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Auto Advance</Label>
                        <Button
                          variant={settings.autoAdvance ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateSetting('autoAdvance', !settings.autoAdvance)}
                        >
                          {settings.autoAdvance ? 'On' : 'Off'}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Allow Late Join</Label>
                        <Button
                          variant={settings.allowLateJoin ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateSetting('allowLateJoin', !settings.allowLateJoin)}
                        >
                          {settings.allowLateJoin ? 'On' : 'Off'}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Show Timer</Label>
                        <Button
                          variant={settings.showTimer ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateSetting('showTimer', !settings.showTimer)}
                        >
                          {settings.showTimer ? 'On' : 'Off'}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Enable Chat</Label>
                        <Button
                          variant={settings.enableChat ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateSetting('enableChat', !settings.enableChat)}
                        >
                          {settings.enableChat ? 'On' : 'Off'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Create Button */}
                <div className="pt-4">
                  <Button 
                    onClick={handleCreateSession}
                    disabled={isCreating || !quizTitle.trim() || questionIds.length === 0}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
                  >
                    {isCreating ? (
                      <>Creating Quiz...</>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Create Live Quiz
                      </>
                    )}
                  </Button>
                </div>

                {/* Switch to Join Mode */}
                <div className="text-center pt-4 border-t">
                  <p className="text-gray-600 mb-2">Want to join an existing quiz?</p>
                  <Button 
                    variant="outline" 
                    onClick={() => onModeChange?.('join')}
                  >
                    Join Quiz Instead
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );

    case 'join':
    default:
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Join Live Quiz</h1>
              <p className="text-gray-600">Enter the session ID to participate</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Join Session
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="session-id">Session ID *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="session-id"
                      value={joinSessionId}
                      onChange={(e) => setJoinSessionId(e.target.value.toUpperCase())}
                      placeholder="Enter session ID..."
                      className="uppercase font-mono"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="participant-name">Your Name *</Label>
                  <Input
                    id="participant-name"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    placeholder="Enter your name..."
                    className="mt-1"
                  />
                </div>

                <Button 
                  onClick={handleJoinSession}
                  disabled={!joinSessionId.trim() || !participantName.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Join Quiz
                </Button>

                {/* Switch to Create Mode */}
                <div className="text-center pt-4 border-t">
                  <p className="text-gray-600 mb-2">Want to create your own quiz?</p>
                  <Button 
                    variant="outline" 
                    onClick={() => onModeChange?.('create')}
                  >
                    Create Quiz Instead
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Session ID Display for Created Quiz */}
            {createdSession && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-green-600">Quiz Created!</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div>
                      <Label>Session ID</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          value={createdSession.id}
                          readOnly
                          className="font-mono text-center text-lg font-bold"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copySessionId(createdSession.id)}
                        >
                          {copiedSessionId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <Alert>
                      <AlertDescription>
                        Share this Session ID with your participants so they can join the quiz.
                      </AlertDescription>
                    </Alert>

                    <Button 
                      onClick={() => onModeChange?.('teacher')}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Quiz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      );
  }
};

export default LiveQuizOrchestrator;
