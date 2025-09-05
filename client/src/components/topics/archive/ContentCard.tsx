import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, Star, Eye } from 'lucide-react';
import { Content } from '@/hooks/useContent';

interface Image {
  id: string;
  imagelink: string | null;
  contentid: string | null;
  default: string | null;
}

interface ContentCardProps {
  content: Content;
  contextList: Content[];
  allImages: Image[] | undefined;
  isActive: boolean;
  onContentClick: (info: { content: Content; contextList: Content[] }) => void;
  onStartQuiz: (content: Content, contextList: Content[], level?: 'Easy' | 'Hard') => void;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  content,
  contextList,
  allImages,
  isActive,
  onContentClick,
  onStartQuiz
}) => {
  const findImageUrl = (content: Content): string | null => {
    if (content.imageid && allImages) {
      const image = allImages.find(img => img.id === content.imageid);
      if (image && image.imagelink) {
        return image.imagelink;
      }
    }
    return content.imagelink || null;
  };

  const imageUrl = findImageUrl(content);
  
  const getSubjectColor = (subject: string[]) => {
    if (!subject || subject.length === 0) return 'bg-gray-100 text-gray-700';
    const firstSubject = subject[0].toLowerCase();
    
    const colorMap: { [key: string]: string } = {
      'music': 'bg-purple-100 text-purple-700',
      'art': 'bg-pink-100 text-pink-700',
      'literature': 'bg-blue-100 text-blue-700',
      'history': 'bg-yellow-100 text-yellow-700',
      'science': 'bg-green-100 text-green-700',
      'philosophy': 'bg-indigo-100 text-indigo-700'
    };
    
    return colorMap[firstSubject] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Card className={`mb-2 transition-all duration-200 ${isActive ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}>
      <CardContent className="p-3">
        <div className="flex gap-3">
          {imageUrl && (
            <div className="flex-shrink-0">
              <img 
                src={imageUrl} 
                alt={content.title || 'Content image'} 
                className="w-16 h-16 object-cover rounded-md"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-sm text-gray-800 line-clamp-2">
                {content.title || 'Untitled Content'}
              </h4>
              {content.challengesubject && content.challengesubject.length > 0 && (
                <Badge 
                  variant="secondary" 
                  className={`text-xs ml-2 flex-shrink-0 ${getSubjectColor(content.challengesubject)}`}
                >
                  {content.challengesubject[0]}
                </Badge>
              )}
            </div>
            
            {content.short_blurb && (
              <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                {content.short_blurb}
              </p>
            )}
            
            <div className="flex gap-1 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onContentClick({ content, contextList })}
                className="text-blue-600 hover:bg-blue-50 border-blue-200 text-xs px-2 py-1 h-6"
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStartQuiz(content, contextList, 'Easy')}
                className="text-green-600 hover:bg-green-50 border-green-200 text-xs px-2 py-1 h-6"
              >
                <Play className="h-3 w-3 mr-1" />
                Easy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStartQuiz(content, contextList, 'Hard')}
                className="text-red-600 hover:bg-red-50 border-red-200 text-xs px-2 py-1 h-6"
              >
                <Star className="h-3 w-3 mr-1" />
                Hard
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};