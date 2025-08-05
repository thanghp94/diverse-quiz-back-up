import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContentRatingButtons } from "@/components/content";
import { StreakDisplay } from '@/components/StreakDisplay';
import { LeaderboardPanel } from "@/components/shared";
import { WritingJournal } from '@/components/WritingJournal';
import { WritingTopicSelection } from '@/components/WritingTopicSelection';
import { StructuredEssayWriter } from '@/components/StructuredEssayWriter';
import { Sparkles, BookOpen, Trophy, Star } from 'lucide-react';

export const DemoPage = () => {
  const [activeDemo, setActiveDemo] = useState<string>('overview');
  const [writingFlow, setWritingFlow] = useState<'journal' | 'topics' | 'essay'>('journal');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Mock student data for demo
  const demoStudentId = 'demo-student-123';
  const demoStudentName = 'Alex Chen';
  const demoContentId = 'demo-content-456';

  const handleWritingCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setWritingFlow('topics');
  };

  const handleTopicSelect = (topicId: string) => {
    setWritingFlow('essay');
  };

  const handleBackToJournal = () => {
    setWritingFlow('journal');
    setSelectedCategory('');
  };

  const handleBackToTopics = () => {
    setWritingFlow('topics');
  };

  if (activeDemo === 'writing') {
    if (writingFlow === 'journal') {
      return (
        <div>
          <div className="p-4 bg-purple-100 border-b">
            <Button onClick={() => setActiveDemo('overview')} variant="outline">
              ← Back to Demo Overview
            </Button>
          </div>
          <WritingJournal 
            studentId={demoStudentId} 
            studentName={demoStudentName}
          />
        </div>
      );
    }
    
    if (writingFlow === 'topics') {
      return (
        <div>
          <div className="p-4 bg-purple-100 border-b">
            <Button onClick={() => setActiveDemo('overview')} variant="outline" className="mr-2">
              ← Back to Demo Overview
            </Button>
            <Button onClick={handleBackToJournal} variant="outline">
              ← Back to Journal
            </Button>
          </div>
          <WritingTopicSelection
            category={selectedCategory}
            onBack={handleBackToJournal}
            onTopicSelect={handleTopicSelect}
          />
        </div>
      );
    }
    
    if (writingFlow === 'essay') {
      return (
        <div>
          <div className="p-4 bg-purple-100 border-b">
            <Button onClick={() => setActiveDemo('overview')} variant="outline" className="mr-2">
              ← Back to Demo Overview
            </Button>
            <Button onClick={handleBackToTopics} variant="outline">
              ← Back to Topics
            </Button>
          </div>
          <StructuredEssayWriter
            topicTitle="Adventure Story"
            topicDescription="Create an exciting story about an adventure in a faraway place."
            studentId={demoStudentId}
            onBack={handleBackToTopics}
          />
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-3">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Feature Demo Center
              </h1>
              <p className="text-gray-600">
                Explore the new content rating, streak tracking, leaderboards, and writing system
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <Tabs value={activeDemo} onValueChange={setActiveDemo} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rating">Content Rating</TabsTrigger>
            <TabsTrigger value="streaks">Streak Tracking</TabsTrigger>
            <TabsTrigger value="leaderboards">Leaderboards</TabsTrigger>
            <TabsTrigger value="writing">Writing System</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feature Overview Cards */}
              <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <Star className="w-5 h-5" />
                    Content Difficulty Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Students can rate content as "Really Hard", "Normal", or "Easy" to help with content retrieval and personalization.
                  </p>
                  <Button 
                    onClick={() => setActiveDemo('rating')}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Try Rating System
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    🔥 Daily Streak Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Track daily learning streaks to encourage consistent engagement and celebrate student achievements.
                  </p>
                  <Button 
                    onClick={() => setActiveDemo('streaks')}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    View Streak System
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-green-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <Trophy className="w-5 h-5" />
                    Multiple Leaderboards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Comprehensive leaderboards showing total points, best streaks, daily activities, and weekly performance.
                  </p>
                  <Button 
                    onClick={() => setActiveDemo('leaderboards')}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    Explore Leaderboards
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-600">
                    <BookOpen className="w-5 h-5" />
                    Structured Writing System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Guided essay writing with category selection, topic prompts, and structured paragraph sections.
                  </p>
                  <Button 
                    onClick={() => setActiveDemo('writing')}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    Start Writing
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Integration Benefits */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-center text-blue-600">
                  Comprehensive Learning Analytics Platform
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="bg-blue-500 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-blue-600 mb-2">Personalized Learning</h3>
                    <p className="text-sm text-gray-600">
                      Content difficulty ratings enable adaptive content delivery based on student preferences and abilities.
                    </p>
                  </div>
                  <div>
                    <div className="bg-orange-500 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">🔥</span>
                    </div>
                    <h3 className="font-semibold text-orange-600 mb-2">Engagement Tracking</h3>
                    <p className="text-sm text-gray-600">
                      Daily streaks and activity tracking encourage consistent learning habits and reward dedication.
                    </p>
                  </div>
                  <div>
                    <div className="bg-purple-500 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-purple-600 mb-2">Structured Writing</h3>
                    <p className="text-sm text-gray-600">
                      Guided writing system with progress tracking and organized essay structure development.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rating" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Content Difficulty Rating Demo</CardTitle>
                <p className="text-gray-600">
                  Try rating this sample content to see how the system works
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Sample Content: Afrofuturism</h3>
                  <p className="text-gray-600 text-sm">
                    Afrofuturism is a cultural aesthetic that combines science-fiction, history and fantasy 
                    to explore the African-American experience and aims to connect those from the black diaspora 
                    with their forgotten African ancestry...
                  </p>
                </div>
                
                <ContentRatingButtons
                  contentId={demoContentId}
                  studentId={demoStudentId}
                  onRatingChange={(rating) => console.log('Rating changed:', rating)}
                />
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-600 mb-2">How it works:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Students rate content after completing activities</li>
                    <li>• Ratings help personalize future content recommendations</li>
                    <li>• Teachers can see content difficulty analytics</li>
                    <li>• System adapts to student preferences over time</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="streaks" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-orange-600">Streak Display Demo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <StreakDisplay studentId={demoStudentId} className="justify-center text-lg" />
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-600 mb-2">Streak Features:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Tracks consecutive days of activity</li>
                      <li>• Displays current and longest streaks</li>
                      <li>• Resets if student misses a day</li>
                      <li>• Encourages daily engagement</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">Daily Activity Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                      <span className="font-medium">Today's Activities</span>
                      <span className="bg-green-500 text-white px-2 py-1 rounded text-sm">3</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                      <span className="font-medium">Points Earned</span>
                      <span className="bg-blue-500 text-white px-2 py-1 rounded text-sm">150</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                      <span className="font-medium">This Week</span>
                      <span className="bg-purple-500 text-white px-2 py-1 rounded text-sm">12</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="leaderboards">
            <LeaderboardPanel />
          </TabsContent>

          <TabsContent value="writing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">Writing System Demo</CardTitle>
                <p className="text-gray-600">
                  Experience the complete writing workflow from category selection to structured essay creation
                </p>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setActiveDemo('writing')}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-lg py-6"
                >
                  <BookOpen className="w-6 h-6 mr-2" />
                  Launch Full Writing Experience
                </Button>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="bg-purple-500 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold">1</span>
                    </div>
                    <h4 className="font-semibold text-purple-600">Category Selection</h4>
                    <p className="text-sm text-gray-600">Choose from creative writing, personal experience, and more</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="bg-purple-500 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold">2</span>
                    </div>
                    <h4 className="font-semibold text-purple-600">Topic & Prompts</h4>
                    <p className="text-sm text-gray-600">Select specific topics with guided writing prompts</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="bg-purple-500 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold">3</span>
                    </div>
                    <h4 className="font-semibold text-purple-600">Structured Writing</h4>
                    <p className="text-sm text-gray-600">Write with guided sections and real-time progress tracking</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};