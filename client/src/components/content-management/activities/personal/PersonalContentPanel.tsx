import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, User, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PersonalNote {
  id: string;
  contentId: string;
  title: string;
  topic: string;
  personal_note: string;
  difficulty_rating: 'easy' | 'normal' | 'hard' | null;
  updated_at: string;
}

interface PersonalContentPanelProps {
  onContentClick?: (info: { content: any; contextList: any[]; }) => void;
}

export const PersonalContentPanel = ({ onContentClick }: PersonalContentPanelProps) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'easy' | 'normal' | 'hard' | 'notes'>('all');

  // Fetch personal content and notes for current user
  const { data: personalData, isLoading } = useQuery({
    queryKey: ['/api/personal-content', 'GV0002'],
    queryFn: async () => {
      const response = await fetch('/api/personal-content/GV0002');
      if (!response.ok) throw new Error('Failed to fetch personal content');
      return response.json();
    },
    refetchInterval: 30000,
  });

  const getFilteredData = () => {
    if (!personalData) return [];
    if (activeFilter === 'all') return personalData;
    if (activeFilter === 'notes') return personalData.filter((item: PersonalNote) => item.personal_note && item.personal_note.trim());
    return personalData.filter((item: PersonalNote) => item.difficulty_rating === activeFilter);
  };

  const getStats = () => {
    if (!personalData) return { total: 0, easy: 0, normal: 0, hard: 0, notes: 0 };
    
    return {
      total: personalData.length,
      easy: personalData.filter((item: PersonalNote) => item.difficulty_rating === 'easy').length,
      normal: personalData.filter((item: PersonalNote) => item.difficulty_rating === 'normal').length,
      hard: personalData.filter((item: PersonalNote) => item.difficulty_rating === 'hard').length,
      notes: personalData.filter((item: PersonalNote) => item.personal_note && item.personal_note.trim()).length,
    };
  };

  const getDifficultyColor = (rating: string | null) => {
    switch (rating) {
      case 'easy': return 'bg-green-600 text-white';
      case 'normal': return 'bg-yellow-600 text-white';
      case 'hard': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleContentClick = async (contentId: string) => {
    if (onContentClick) {
      // Fetch the content details to create proper content object
      try {
        const response = await fetch('/api/content');
        const allContent = await response.json();
        const content = allContent.find((c: any) => c.id === contentId);
        
        if (content) {
          onContentClick({ 
            content, 
            contextList: allContent.filter((c: any) => c.topicid === content.topicid)
          });
        }
      } catch (error) {
        console.error('Failed to fetch content details:', error);
      }
    }
  };

  const filteredData = getFilteredData();
  const stats = getStats();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-indigo-600/12 border-indigo-400/30 text-white/60 hover:bg-indigo-600/30 hover:text-white transition-all duration-300 h-8 w-8 p-0"
          title="Personal Content"
        >
          <User className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-400" />
            Your Personal Content
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
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
                <div className="text-xl font-bold text-yellow-400">{stats.normal}</div>
                <div className="text-xs text-gray-400">Normal</div>
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
                <div className="text-xl font-bold text-indigo-400">{stats.notes}</div>
                <div className="text-xs text-gray-400">Notes</div>
              </div>
            </Card>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All', count: stats.total },
              { key: 'easy', label: 'Easy', count: stats.easy },
              { key: 'normal', label: 'Normal', count: stats.normal },
              { key: 'hard', label: 'Hard', count: stats.hard },
              { key: 'notes', label: 'Notes', count: stats.notes }
            ].map((filter) => (
              <Button
                key={filter.key}
                variant={activeFilter === filter.key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter.key as any)}
                className={`text-xs h-7 ${
                  activeFilter === filter.key
                    ? "bg-indigo-600 text-white" 
                    : "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
                }`}
              >
                {filter.label} ({filter.count})
              </Button>
            ))}
          </div>

          {/* Content List */}
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 bg-gray-700" />
              ))}
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No personal content found for the selected filter</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredData.map((item: PersonalNote) => (
                <Card 
                  key={item.id} 
                  className="bg-gray-800/50 border-gray-600 hover:bg-gray-700/50 transition-all duration-200 cursor-pointer"
                  onClick={() => handleContentClick(item.contentId)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-white">{item.title}</h3>
                          {item.difficulty_rating && (
                            <Badge className={getDifficultyColor(item.difficulty_rating)}>
                              {item.difficulty_rating}
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{item.topic}</p>
                        {item.personal_note && (
                          <div className="bg-indigo-900/20 border border-indigo-400/30 rounded-md p-2 mb-2">
                            <p className="text-indigo-200 text-sm">{item.personal_note}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(item.updated_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Click to view content
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PersonalContentPanel;