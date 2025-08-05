import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BarChart3, CheckCircle, Circle, Star, ChevronDown, ChevronRight, FolderOpen, Folder, FileText, Users } from "lucide-react";
import ContentPopup from "./ContentPopup";

interface ContentProgress {
  id: string;
  topicid: string;
  topic: string;
  title: string;
  difficulty_rating: 'ok' | 'normal' | 'really_bad' | null;
  question_count: number;
  completed_at: string;
  parentid: string | null;
  short_blurb?: string;
  prompt?: string;
}

interface Topic {
  id: string;
  topic: string;
  parentid: string | null;
  showstudent: boolean;
}

interface Content {
  id: string;
  topicid: string;
  title: string;
  prompt: string;
  short_blurb: string;
  short_description: string;
}

interface ContentRating {
  id: string;
  student_id: string;
  content_id: string;
  rating: 'ok' | 'normal' | 'really_bad';
  personal_note: string | null;
  created_at: string;
}

interface HierarchyItem {
  id: string;
  title: string;
  type: 'topic' | 'subtopic' | 'groupcard' | 'content';
  rating?: 'ok' | 'normal' | 'really_bad' | null;
  children: HierarchyItem[];
  contentData?: Content;
  parentid?: string | null;
}

export const ContentProgressPanel = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'easy' | 'hard'>('all');
  
  // Fetch content ratings for current user
  const { data: progressData, isLoading } = useQuery({
    queryKey: ['/api/content-progress', 'GV0002'],
    queryFn: async () => {
      const response = await fetch('/api/content-progress/GV0002');
      if (!response.ok) throw new Error('Failed to fetch content progress');
      return response.json();
    },
    refetchInterval: 30000,
  });

  const getFilteredData = () => {
    if (!progressData) return [];
    
    // First filter out content without valid topics
    const validProgressData = progressData.filter((item: ContentProgress) => item.topic && item.topic.trim() !== '');
    
    if (activeFilter === 'all') return validProgressData;
    
    // Map filter values to database values
    const filterMap = {
      'easy': 'ok',
      'hard': 'really_bad'
    };
    
    const dbValue = filterMap[activeFilter as keyof typeof filterMap];
    return validProgressData.filter((item: ContentProgress) => item.difficulty_rating === dbValue);
  };

  const getDifficultyColor = (rating: string | null) => {
    switch (rating) {
      case 'ok': return 'bg-green-600 text-white';
      case 'really_bad': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getDifficultyIcon = (rating: string | null) => {
    switch (rating) {
      case 'ok': return <CheckCircle className="h-3 w-3" />;
      case 'really_bad': return <Star className="h-3 w-3" />;
      default: return <Circle className="h-3 w-3" />;
    }
  };

  const getStats = () => {
    if (!progressData) return { total: 0, easy: 0, hard: 0, unrated: 0 };
    
    // Only count content with valid topics
    const validProgressData = progressData.filter((item: ContentProgress) => item.topic && item.topic.trim() !== '');
    
    return {
      total: validProgressData.length,
      easy: validProgressData.filter((item: ContentProgress) => item.difficulty_rating === 'ok').length,
      hard: validProgressData.filter((item: ContentProgress) => item.difficulty_rating === 'really_bad').length,
      unrated: validProgressData.filter((item: ContentProgress) => item.difficulty_rating === null).length,
    };
  };

  const filteredData = getFilteredData();
  const stats = getStats();

  // Group by topic - only include content with valid topics
  const groupedData = filteredData.reduce((acc: any, item: ContentProgress) => {
    // Only include items that have a valid topic (not null, undefined, or empty)
    if (item.topic && item.topic.trim() !== '') {
      const topicKey = item.topic;
      if (!acc[topicKey]) {
        acc[topicKey] = [];
      }
      acc[topicKey].push(item);
    }
    return acc;
  }, {});

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-blue-600/12 border-blue-400/30 text-white/60 hover:bg-blue-600/30 hover:text-white transition-all duration-300 h-8 w-8 p-0"
          title="Content Progress"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            Your Content Progress
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Card className="bg-gray-800 border-gray-700 p-2">
              <div className="text-center">
                <div className="text-xl font-bold text-white">{stats.total}</div>
                <div className="text-xs text-gray-400">Total</div>
              </div>
            </Card>
            <Card className="bg-gray-800 border-gray-700 p-2">
              <div className="text-center">
                <div className="text-xl font-bold text-green-400">{stats.easy}</div>
                <div className="text-xs text-gray-400">Easy</div>
              </div>
            </Card>
            <Card className="bg-gray-800 border-gray-700 p-2">
              <div className="text-center">
                <div className="text-xl font-bold text-red-400">{stats.hard}</div>
                <div className="text-xs text-gray-400">Hard</div>
              </div>
            </Card>
            <Card className="bg-gray-800 border-gray-700 p-2">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-400">{stats.unrated}</div>
                <div className="text-xs text-gray-400">Unrated</div>
              </div>
            </Card>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All', count: stats.total },
              { key: 'easy', label: 'Easy', count: stats.easy },
              { key: 'hard', label: 'Hard', count: stats.hard }
            ].map((filter) => (
              <Button
                key={filter.key}
                variant={activeFilter === filter.key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter.key as any)}
                className={`flex items-center gap-1 text-xs ${
                  activeFilter === filter.key 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
                }`}
              >
                {filter.label} ({filter.count})
              </Button>
            ))}
          </div>

          {/* Content List */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 bg-gray-700" />
              ))}
            </div>
          ) : Object.keys(groupedData).length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-600" />
              <p>No content progress found</p>
              <p className="text-sm">Start rating content difficulty to see your progress here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedData).map(([topic, items]: [string, any]) => (
                <div key={topic} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-750 px-4 py-2 border-b border-gray-700">
                    <h3 className="text-white text-sm font-medium flex items-center gap-2">
                      {topic}
                      <Badge className="bg-gray-600 text-white text-xs">
                        {items.length} items
                      </Badge>
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left text-gray-400 font-medium px-4 py-2">Title</th>
                          <th className="text-left text-gray-400 font-medium px-4 py-2">Questions</th>
                          <th className="text-left text-gray-400 font-medium px-4 py-2">Difficulty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item: ContentProgress) => (
                          <tr key={item.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                            <td className="px-4 py-2 text-white font-medium">
                              {item.title || 'Untitled Content'}
                            </td>
                            <td className="px-4 py-2 text-gray-300">
                              {item.question_count}
                            </td>
                            <td className="px-4 py-2">
                              <Badge className={`text-xs h-5 flex items-center gap-1 w-fit ${getDifficultyColor(item.difficulty_rating)}`}>
                                {getDifficultyIcon(item.difficulty_rating)}
                                {item.difficulty_rating === 'ok' ? 'easy' : item.difficulty_rating === 'really_bad' ? 'hard' : 'unrated'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContentProgressPanel;