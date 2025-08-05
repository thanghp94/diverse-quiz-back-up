import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, BarChart3, Users, LogOut } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {(user as any)?.firstName || 'Student'}!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Continue your learning journey
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/api/logout"}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/topics">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <BookOpen className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Browse Topics</CardTitle>
                <CardDescription>
                  Explore educational content organized by topics
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/leaderboard">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Leaderboard</CardTitle>
                <CardDescription>
                  View your progress and compare with classmates
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/assignments">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Assignments</CardTitle>
                <CardDescription>
                  Access and complete your assignments
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/debate">
                <Button variant="outline" className="w-full justify-start">
                  Join Debate Activities
                </Button>
              </Link>
              <Link href="/writing">
                <Button variant="outline" className="w-full justify-start">
                  Writing Exercises
                </Button>
              </Link>
              <Link href="/live-class">
                <Button variant="outline" className="w-full justify-start">
                  Live Class Sessions
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Learning Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Track your progress and achievements as you explore content and complete activities.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}