import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StreakDisplay } from './StreakDisplay';
import { User, BookOpen, Home, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

interface WritingJournalProps {
  studentId: string;
  studentName: string;
  onCategorySelect?: (categoryId: string) => void;
}

interface WritingCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const categories: WritingCategory[] = [
  {
    id: 'personal_experience',
    title: 'Personal Experience',
    description: 'Write about your own experiences and feelings',
    icon: '😊',
    color: 'bg-purple-100 hover:bg-purple-200 border-purple-300'
  },
  {
    id: 'creative_writing',
    title: 'Creative Writing',
    description: 'Let your imagination run wild!',
    icon: '✨',
    color: 'bg-blue-100 hover:bg-blue-200 border-blue-300'
  },
  {
    id: 'opinions_ideas',
    title: 'Opinions & Ideas',
    description: 'Share your thoughts on different topics',
    icon: '🤔',
    color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300'
  },
  {
    id: 'school_homework',
    title: 'School Homework',
    description: 'Academic writing assignments and school projects',
    icon: '📚',
    color: 'bg-green-100 hover:bg-green-200 border-green-300'
  },
  {
    id: 'free_writing',
    title: 'Free Writing',
    description: 'Write about anything that comes to mind',
    icon: '🎨',
    color: 'bg-pink-100 hover:bg-pink-200 border-pink-300'
  }
];

export const WritingJournal = ({ studentId, studentName, onCategorySelect }: WritingJournalProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // This would navigate to the topic selection page
    console.log('Selected category:', categoryId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
            <Link href="/topics">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Topics
              </Button>
            </Link>
          </div>
          <StreakDisplay studentId={studentId} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-purple-500 rounded-full p-3">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-purple-600">My Daily Journal</h1>
              <p className="text-gray-600">
                Welcome back, {studentName || 'Student'}! 👋
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-purple-500 rounded-full p-2">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Card className="bg-white/80 backdrop-blur-sm border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-t-lg">
            <CardTitle className="text-center text-purple-600 text-2xl">
              What would you like to write about today?
            </CardTitle>
            <p className="text-center text-gray-600 mt-2">
              Choose a category below to find an exciting topic for today's journal entry!
            </p>
          </CardHeader>

          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map((category) => (
                <Card 
                  key={category.id}
                  className={`${category.color} border-2 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md`}
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-4">{category.icon}</div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {category.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {category.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Past Entries */}
        <Card className="mt-8 bg-white/60 backdrop-blur-sm border-purple-200">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <BookOpen className="w-6 h-6 text-purple-500" />
              <h3 className="text-xl font-bold text-purple-600">View Past Entries</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Read your previous journal entries
            </p>
            <Button 
              variant="outline" 
              className="border-purple-300 text-purple-600 hover:bg-purple-50"
            >
              View Past Entries
            </Button>
          </CardContent>
        </Card>

        {/* Streak Leaderboard */}
        <Card className="mt-8 bg-gradient-to-r from-purple-100 to-blue-100 border-purple-200">
          <CardHeader>
            <CardTitle className="text-center text-purple-600 flex items-center justify-center gap-2">
              🔥 Streak Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "MANOHARAN AHARAN Student", streak: 6 },
                { name: "EMERALD ALIN EAIN Student", streak: 3 },
                { name: "Thắng Huỳnh Phan", streak: 1 }
              ].map((student, index) => (
                <div 
                  key={student.name}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    index === 0 ? 'bg-yellow-100 border border-yellow-300' :
                    index === 1 ? 'bg-gray-100 border border-gray-300' :
                    'bg-orange-100 border border-orange-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      'bg-orange-500 text-white'
                    }`}>
                      {index === 0 ? '🏆' : index === 1 ? '🥈' : '🏅'}
                    </span>
                    <span className="font-medium">{student.name}</span>
                  </div>
                  <span className="font-bold text-sm">
                    {student.streak} day{student.streak !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};