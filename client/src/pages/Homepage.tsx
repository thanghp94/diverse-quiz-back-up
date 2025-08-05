import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  BookOpen, 
  Users, 
  Target, 
  ArrowRight, 
  Star, 
  Zap,
  Brain,
  Globe,
  Award
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import merakiLogo from "@assets/MERAKI new logo vo6-03_1750301582337.png";

const Homepage = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch user's recent activity
  const { data: streakData } = useQuery({
    queryKey: [`/api/streaks/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: leaderboardData } = useQuery({
    queryKey: ["/api/student-tries-leaderboard"],
  });

  const userRank = leaderboardData?.find((entry: any) => entry.student_id === user?.id)?.rank || "N/A";

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const quickActions = [
    {
      title: "Bowl & Challenge",
      description: "Interactive learning modules",
      icon: BookOpen,
      color: "bg-blue-500",
      action: () => setLocation("/topics")
    },
    {
      title: "Assignments",
      description: "Complete your tasks",
      icon: Target,
      color: "bg-green-500",
      action: () => setLocation("/assignments")
    },
    {
      title: "Leaderboard",
      description: "See your ranking",
      icon: Trophy,
      color: "bg-yellow-500",
      action: () => setLocation("/leaderboard")
    },
    {
      title: "Live Classes",
      description: "Join ongoing sessions",
      icon: Users,
      color: "bg-purple-500",
      action: () => setLocation("/live-class")
    }
  ];

  const achievements = [
    { name: "First Steps", description: "Completed first assignment", earned: true },
    { name: "Quick Learner", description: "Finished 5 topics in one day", earned: true },
    { name: "Team Player", description: "Participated in group activities", earned: false },
    { name: "Scholar", description: "Maintained 7-day streak", earned: streakData?.current_streak >= 7 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative px-6 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              {/* Logo and Title */}
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-4 mb-6">
                  <img 
                    src={merakiLogo} 
                    alt="Meraki Skills House" 
                    className="w-16 h-16 lg:w-20 lg:h-20"
                  />
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white">
                      Meraki Skills House
                    </h1>
                    <p className="text-cyan-100 text-lg">World Scholar Cup Excellence</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-2xl lg:text-3xl font-semibold text-white">
                    {getGreeting()}, {user?.first_name || 'Scholar'}! 👋
                  </h2>
                  <p className="text-cyan-100 text-lg">
                    {formatDate()}
                  </p>
                  <p className="text-white/90 text-lg max-w-2xl">
                    Ready to conquer today's challenges? Your journey to World Scholar Cup mastery continues here.
                  </p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="flex-1 grid grid-cols-2 gap-4 w-full max-w-md">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-4 text-center">
                    <Zap className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{streakData?.current_streak || 0}</div>
                    <div className="text-cyan-100 text-sm">Day Streak</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-4 text-center">
                    <Trophy className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">#{userRank}</div>
                    <div className="text-cyan-100 text-sm">Rank</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-4 text-center">
                    <Brain className="w-8 h-8 text-green-300 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{streakData?.total_points || 0}</div>
                    <div className="text-cyan-100 text-sm">Points</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-4 text-center">
                    <Award className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{achievements.filter(a => a.earned).length}</div>
                    <div className="text-cyan-100 text-sm">Badges</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500" />
                Quick Actions
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <Card 
                    key={index}
                    className="hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 border-2 hover:border-blue-200"
                    onClick={action.action}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${action.color}`}>
                          <action.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{action.title}</h4>
                          <p className="text-gray-600 text-sm">{action.description}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Motivational Section */}
            <Card className="bg-gradient-to-r from-orange-400 to-pink-500 text-white border-0">
              <CardContent className="p-8">
                <div className="flex items-center gap-4">
                  <Globe className="w-12 h-12 text-white/90" />
                  <div>
                    <h3 className="text-2xl font-bold mb-2">World Scholar Cup Journey</h3>
                    <p className="text-white/90 text-lg">
                      "Every expert was once a beginner. Every pro was once an amateur."
                    </p>
                    <p className="text-white/80 mt-2">
                      Keep pushing your boundaries and exploring new knowledge!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Achievements */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-500" />
                  Achievements
                </h3>
                <div className="space-y-3">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        achievement.earned ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Star className={`w-4 h-4 ${
                          achievement.earned ? 'text-green-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${
                          achievement.earned ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {achievement.name}
                        </div>
                        <div className="text-xs text-gray-500">{achievement.description}</div>
                      </div>
                      {achievement.earned && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          Earned
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Today's Focus */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  Today's Focus
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg border border-blue-100">
                    <div className="font-medium text-gray-900">Bowl & Challenge</div>
                    <div className="text-sm text-gray-600">Complete 2 new topics</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-blue-100">
                    <div className="font-medium text-gray-900">Practice Round</div>
                    <div className="text-sm text-gray-600">Take a quiz in any subject</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-blue-100">
                    <div className="font-medium text-gray-900">Team Building</div>
                    <div className="text-sm text-gray-600">Check the leaderboard</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;