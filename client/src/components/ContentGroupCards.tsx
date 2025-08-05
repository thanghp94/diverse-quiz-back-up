import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Layers, ArrowRight } from 'lucide-react';
import { useLocation } from 'wouter';

interface ContentGroup {
  contentgroup: string;
  url: string;
  count: number;
}

interface ContentGroupCardsProps {
  onGroupSelect?: (group: string) => void;
}

export function ContentGroupCards({ onGroupSelect }: ContentGroupCardsProps) {
  const [, setLocation] = useLocation();
  
  const { data: contentGroups, isLoading, error } = useQuery<ContentGroup[]>({
    queryKey: ['/api/content/groups'],
  });

  const handleGroupClick = (group: string) => {
    if (onGroupSelect) {
      onGroupSelect(group);
    } else {
      // Navigate to content page with group filter
      setLocation(`/content?group=${encodeURIComponent(group)}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading content groups...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">Failed to load content groups</p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!contentGroups || contentGroups.length === 0) {
    return (
      <div className="p-8 text-center">
        <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No content groups available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {contentGroups.map((group, index) => (
        <Card 
          key={index}
          className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-blue-300 bg-gradient-to-br from-white to-blue-50/30"
          onClick={() => handleGroupClick(group.contentgroup)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                {group.contentgroup || 'Untitled Group'}
              </CardTitle>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 line-clamp-3">
              {group.url || 'No description available'}
            </p>
            
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-medium">
                {group.count} content items
              </span>
              
              <Button 
                variant="outline" 
                size="sm"
                className="text-blue-600 border-blue-300 hover:bg-blue-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGroupClick(group.contentgroup);
                }}
              >
                View Content
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}