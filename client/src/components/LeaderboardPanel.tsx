import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trophy, Users, Wifi, WifiOff } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io, Socket } from 'socket.io-client';

interface LeaderboardData {
  totalPoints: Array<{
    student_id: string;
    total_points: string;
    full_name: string;
  }>;
  bestStreak: Array<{
    student_id: string;
    longest_streak: number;
    full_name: string;
  }>;
}

export const LeaderboardPanel = () => {
  const [activeTab, setActiveTab] = useState<'points' | 'tries'>('points');
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  
  const { data: studentTriesData, isLoading: isLoadingTries } = useQuery({
    queryKey: ['/api/student-tries-leaderboard'],
    queryFn: () => fetch('/api/student-tries-leaderboard').then(res => res.json()),
    refetchInterval: socketConnected ? false : 30000, // Only poll if WebSocket disconnected
    staleTime: 0, // Always consider data stale for real-time updates
    refetchOnWindowFocus: true,
  });
  
  const { data: leaderboardData, isLoading: isLoadingLeaderboard } = useQuery<LeaderboardData>({
    queryKey: ['/api/leaderboards'],
    queryFn: () => fetch('/api/leaderboards').then(res => res.json()),
    refetchInterval: socketConnected ? false : 30000, // Only poll if WebSocket disconnected
    staleTime: 0, // Always consider data stale for real-time updates
    refetchOnWindowFocus: true,
  });

  // Setup WebSocket connection for real-time leaderboard updates
  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Leaderboard WebSocket connected');
      setSocketConnected(true);
      socket.emit('join-leaderboard');
    });

    socket.on('disconnect', () => {
      console.log('❌ Leaderboard WebSocket disconnected');
      setSocketConnected(false);
    });

    // Listen for quiz activity updates that affect leaderboards
    socket.on('quiz-activity', (data) => {
      console.log('📊 Quiz activity affecting leaderboard:', data);
      
      // Immediately update both leaderboard queries
      queryClient.invalidateQueries({ queryKey: ['/api/leaderboards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student-tries-leaderboard'] });
      
      // Force refetch to get latest data
      queryClient.refetchQueries({ queryKey: ['/api/leaderboards'] });
      queryClient.refetchQueries({ queryKey: ['/api/student-tries-leaderboard'] });
    });

    // Listen for direct leaderboard updates
    socket.on('leaderboard-update', (data) => {
      console.log('🏆 Direct leaderboard update:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/leaderboards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student-tries-leaderboard'] });
      
      // Force refetch to get latest data
      queryClient.refetchQueries({ queryKey: ['/api/leaderboards'] });
      queryClient.refetchQueries({ queryKey: ['/api/student-tries-leaderboard'] });
    });

    return () => {
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }
    };
  }, [queryClient]);

  const isLoading = isLoadingTries || isLoadingLeaderboard;

  const getCurrentData = () => {
    if (activeTab === 'tries') {
      const triesData = studentTriesData || [];
      return triesData.filter(item => item.student_id !== 'GV0002');
    } else {
      const pointsData = leaderboardData?.totalPoints || [];
      return pointsData.filter(item => item.student_id !== 'GV0002');
    }
  };

  const getDisplayData = (data: any[]) => {
    if (!data || data.length === 0) return [];
    
    // Simply return top 10 since GV0002 is filtered out
    return data.slice(0, 10);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return rank;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1: return "bg-yellow-500 text-black";
      case 2: return "bg-gray-300 text-black";
      case 3: return "bg-orange-600 text-white";
      default: return "bg-gray-600 text-white";
    }
  };

  const getDisplayValue = (item: any) => {
    return activeTab === 'tries' 
      ? item.total_tries || 0
      : item.total_points || 0;
  };

  const currentData = getCurrentData();
  const displayData = getDisplayData(currentData);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-yellow-600/20 border-yellow-400/50 text-yellow-200 hover:bg-yellow-600/30"
        >
          <Trophy className="h-4 w-4 mr-1" />
          Leaderboard
          {socketConnected ? (
            <Wifi className="h-3 w-3 ml-1 text-green-400" />
          ) : (
            <WifiOff className="h-3 w-3 ml-1 text-red-400" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Top Players
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-1">
            <Button
              variant={activeTab === 'points' ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab('points')}
              className={`flex items-center gap-1 text-xs h-7 ${
                activeTab === 'points'
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
              }`}
            >
              <Trophy className="h-3 w-3" />
              Points
            </Button>
            <Button
              variant={activeTab === 'tries' ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab('tries')}
              className={`flex items-center gap-1 text-xs h-7 ${
                activeTab === 'tries'
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
              }`}
            >
              <Users className="h-3 w-3" />
              Tries
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 bg-gray-700" />
              ))}
            </div>
          ) : displayData.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <p>No data available</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {displayData.map((item, index) => {
                const rank = item.rank || index + 1;
                const value = getDisplayValue(item);
                const isCurrentUser = false; // GV0002 is filtered out
                
                return (
                  <div 
                    key={`${item.student_id}-${rank}`}
                    className={`flex items-center justify-between p-3 rounded text-sm transition-all duration-200 ${
                      isCurrentUser
                        ? 'bg-blue-600/30 border border-blue-400/50'
                        : rank <= 3 
                          ? 'bg-yellow-600/20 border border-yellow-400/30' 
                          : 'bg-gray-700/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                        rank === 1 ? 'bg-yellow-500 text-black' :
                        rank === 2 ? 'bg-gray-300 text-black' :
                        rank === 3 ? 'bg-orange-600 text-white' :
                        isCurrentUser ? 'bg-blue-500 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {rank <= 3 ? getRankIcon(rank) : rank}
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {item.full_name || 'Anonymous'}
                        </div>
                      </div>
                    </div>
                    <Badge className={`text-xs h-6 ${getRankBadgeColor(rank)}`}>
                      {value}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeaderboardPanel;