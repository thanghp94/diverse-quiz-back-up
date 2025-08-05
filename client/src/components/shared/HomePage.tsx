
import { Header } from "@/components/shared";
import { ContentSection } from "@/components/content";
import { TopicCard } from "@/components/topics";

import { StreakDisplay } from "./StreakDisplay";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { useTopics } from "@/hooks/useTopics";
import { 
  Book, 
  Trophy, 
  Users, 
  Edit, 
  BarChart3, 
  User,
  Star,
  Award,
  Clock,
  Zap,
  BookOpen,
  Target,
  Loader2,
  Flame
} from "lucide-react";

const HomePage = () => {
  const { data: topics, isLoading, error } = useTopics();

  const advanceItems = [
    {
      id: "subject",
      title: "Subject (Art, History...)",
      icon: <Book className="h-4 w-4 text-red-600" />,
      color: "bg-red-100",
      starred: true
    },
    {
      id: "hard-quizzes",
      title: "Hard Quizzes",
      icon: <Trophy className="h-4 w-4 text-orange-600" />,
      color: "bg-orange-100",
      starred: true,
      difficulty: "hard" as const
    },
    {
      id: "overview-quizzes",
      title: "Overview Quizzes", 
      icon: <BarChart3 className="h-4 w-4 text-orange-600" />,
      color: "bg-orange-100",
      starred: true,
      difficulty: "medium" as const
    }
  ];

  const bowlChallengeItems = [
    {
      id: "bowl-challenge-content",
      title: "Bowl & Challenge content",
      icon: <Target className="h-4 w-4 text-blue-600" />,
      color: "bg-blue-100",
      starred: true,
      link: "/topics"
    },
    {
      id: "bowl-challenge-homework", 
      title: "Bowl & Challenge homework",
      icon: <Edit className="h-4 w-4 text-blue-600" />,
      color: "bg-blue-100"
    },
    {
      id: "live-quiz",
      title: "Live Quiz",
      icon: <Zap className="h-4 w-4 text-blue-600" />,
      color: "bg-blue-100"
    },
    {
      id: "matching",
      title: "Matching",
      icon: <Target className="h-4 w-4 text-blue-600" />,
      color: "bg-blue-100"
    }
  ];

  const debateItems = [
    {
      id: "debate-content",
      title: "Debate content",
      icon: <Users className="h-4 w-4 text-purple-600" />,
      color: "bg-purple-100"
    },
    {
      id: "debate-homework",
      title: "Debate homework", 
      icon: <Edit className="h-4 w-4 text-purple-600" />,
      color: "bg-purple-100"
    },
    {
      id: "debate-motion",
      title: "Debate motion",
      icon: <Book className="h-4 w-4 text-purple-600" />,
      color: "bg-purple-100"
    },
    {
      id: "debate-schedule",
      title: "Debate Schedule",
      icon: <Clock className="h-4 w-4 text-purple-600" />,
      color: "bg-purple-100"
    }
  ];

  const writingItems = [
    {
      id: "writing-content",
      title: "Writing content",
      icon: <Edit className="h-4 w-4 text-green-600" />,
      color: "bg-green-100"
    },
    {
      id: "writing-homework",
      title: "Writing homework",
      icon: <Book className="h-4 w-4 text-green-600" />,
      color: "bg-green-100"
    },
    {
      id: "writing-prompt",
      title: "Writing Prompt",
      icon: <Edit className="h-4 w-4 text-green-600" />,
      color: "bg-green-100"
    }
  ];

  const dashboardItems = [
    {
      id: "leaderboard",
      title: "Leaderboard",
      icon: <Award className="h-4 w-4 text-pink-600" />,
      color: "bg-pink-100",
      link: "/leaderboard"
    },
    {
      id: "personal",
      title: "Personal",
      icon: <User className="h-4 w-4 text-pink-600" />,
      color: "bg-pink-100"
    }
  ];

  const renderDashboardItems = (items: any[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => {
        if (item.link) {
          return (
            <Link key={item.id} to={item.link}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {item.starred && (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    )}
                    <div className={`p-1 rounded ${item.color}`}>
                      {item.icon}
                    </div>
                  </div>
                </div>
                <h3 className="font-medium text-gray-800 text-sm">{item.title}</h3>
              </Card>
            </Link>
          );
        }
        
        return (
          <div key={item.id}>
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {item.starred && (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  )}
                  <div className={`p-1 rounded ${item.color}`}>
                    {item.icon}
                  </div>
                </div>
              </div>
              <h3 className="font-medium text-gray-800 text-sm">{item.title}</h3>
            </Card>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="p-6">
        <nav className="mb-6">
          <span className="text-sm text-gray-600">Home</span>
        </nav>

        <ContentSection
          title="Advance"
          icon={<Trophy className="h-4 w-4 text-red-600" />}
          items={advanceItems}
          color="bg-red-100"
        />

        <ContentSection
          title="Bowl & Challenge"
          icon={<Target className="h-4 w-4 text-blue-600" />}
          items={bowlChallengeItems}
          color="bg-blue-100"
        />

        {/* User Dashboard Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1 rounded bg-pink-100">
              <User className="h-4 w-4 text-pink-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Dashboard</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Streak Card */}
            <Card className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800 text-sm mb-2">Daily Streak</h3>
                  <StreakDisplay studentId="user-123-placeholder" className="text-lg" />
                </div>
                <Flame className="w-8 h-8 text-orange-500" />
              </div>
            </Card>

            {/* Leaderboard Link */}
            <Link to="/leaderboard">
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800 text-sm mb-2">Leaderboard</h3>
                    <p className="text-xs text-gray-600">See your ranking</p>
                  </div>
                  <Award className="w-8 h-8 text-purple-500" />
                </div>
              </Card>
            </Link>

            {/* Personal Stats */}
            <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800 text-sm mb-2">Personal Stats</h3>
                  <p className="text-xs text-gray-600">Track progress</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-500" />
              </div>
            </Card>
          </div>
        </div>

        {/* Main Topics Section from Database */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1 rounded bg-green-100">
              <BookOpen className="h-4 w-4 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Main Topics</h2>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <span className="ml-2 text-gray-600">Loading topics...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Error loading topics. Please try again later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {topics?.map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          )}
        </div>

        <ContentSection
          title="Debate"
          icon={<Users className="h-4 w-4 text-purple-600" />}
          items={debateItems}
          color="bg-purple-100"
        />

        <ContentSection
          title="Writing"
          icon={<Edit className="h-4 w-4 text-green-600" />}
          items={writingItems}
          color="bg-green-100"
        />

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1 rounded bg-pink-100">
              <BarChart3 className="h-4 w-4 text-pink-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Your dashboard</h2>
          </div>
          {renderDashboardItems(dashboardItems)}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
