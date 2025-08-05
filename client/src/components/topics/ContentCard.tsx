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
    <Card className={`mb-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
      isActive ? 'ring-2 ring-purple-500 bg-gradient-to-r from-purple-50 to-blue-50' : 'hover:shadow-xl'
    } rounded-xl border-0 bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm`}>
      <CardContent className="p-0 overflow-hidden">
        <div className="relative">
          {imageUrl ? (
            <div className="relative w-full h-32 overflow-hidden rounded-t-xl">
              <img 
                src={imageUrl} 
                alt={content.title || 'Content image'} 
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              {content.challengesubject && content.challengesubject.length > 0 && (
                <Badge 
                  className={`absolute top-3 right-3 text-xs font-medium px-2 py-1 ${getSubjectColor(content.challengesubject)} border-0 shadow-lg`}
                >
                  {content.challengesubject[0]}
                </Badge>
              )}
            </div>
          ) : (
            // For cards without images, create a colorful header section
            <div className={`relative w-full h-20 rounded-t-xl bg-gradient-to-r ${
              content.challengesubject && content.challengesubject.length > 0 
                ? getGradientBackground(content.challengesubject[0])
                : 'from-blue-500 to-purple-600'
            }`}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              {content.challengesubject && content.challengesubject.length > 0 && (
                <Badge 
                  className="absolute top-3 right-3 text-xs font-medium px-2 py-1 bg-white/90 text-gray-800 border-0 shadow-lg"
                >
                  {content.challengesubject[0]}
                </Badge>
              )}
              <div className="absolute bottom-2 left-4">
                <BookOpen className="h-6 w-6 text-white/80" />
              </div>
            </div>
          )}
          
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <h4 className="font-semibold text-base text-gray-900 line-clamp-2 leading-tight">
                {content.title || 'Untitled Content'}
              </h4>
              
              {content.short_blurb && (
                <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                  {content.short_blurb}
                </p>
              )}
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onContentClick({ content, contextList })}
                className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 text-sm px-3 py-2 h-8 rounded-lg font-medium transition-all duration-200"
              >
                <Eye className="h-4 w-4 mr-1.5" />
                View
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStartQuiz(content, contextList, 'Easy')}
                  className="text-emerald-600 hover:bg-emerald-50 border-emerald-200 hover:border-emerald-300 text-sm px-3 py-2 h-8 rounded-lg font-medium transition-all duration-200"
                >
                  <Play className="h-3.5 w-3.5 mr-1" />
                  Easy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStartQuiz(content, contextList, 'Hard')}
                  className="text-red-500 hover:bg-red-50 border-red-200 hover:border-red-300 text-sm px-3 py-2 h-8 rounded-lg font-medium transition-all duration-200"
                >
                  <Star className="h-3.5 w-3.5 mr-1" />
                  Hard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};