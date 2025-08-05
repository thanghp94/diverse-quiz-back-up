import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, ChevronDown, ChevronRight, FolderOpen, Folder, FileText, Users, Filter, Eye } from "lucide-react";
import ContentPopup from "./ContentPopup";
import { trackContentAccess, getCurrentUserId } from "@/lib/contentTracking";

interface SimpleContentRating {
  id: string;
  student_id: string;
  content_id: string;
  rating: string;
  personal_note: string | null;
  view_count?: number;
  created_at: string;
}

interface SimpleContent {
  id: string;
  topicid: string | null;
  title: string | null;
  prompt: string | null;
  short_blurb: string | null;
  short_description: string | null;
  parentid: string | null;
  translation_dictionary: any;
}

interface SimpleTopic {
  id: string;
  topic: string | null;
  parentid: string | null;
  showstudent: boolean | null;
}

interface HierarchyNode {
  id: string;
  title: string;
  type: 'topic' | 'subtopic' | 'groupcard' | 'content';
  rating?: string | null;
  children: HierarchyNode[];
  contentData?: SimpleContent;
  isExpanded?: boolean;
  viewCount?: number;
  triesCount?: number;
}

export const SimpleContentProgressPanel = () => {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
  const [filterRating, setFilterRating] = useState<'all' | 'ok' | 'really_bad'>('all');
  const [selectedStudent, setSelectedStudent] = useState<string>('GV0002');
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [isContentPopupOpen, setIsContentPopupOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Fetch topics
  const { data: topics = [], isLoading: topicsLoading } = useQuery({
    queryKey: ['/api/topics'],
    queryFn: async () => {
      const response = await fetch('/api/topics');
      if (!response.ok) throw new Error('Failed to fetch topics');
      return response.json();
    },
  });

  // Fetch content
  const { data: content = [], isLoading: contentLoading } = useQuery({
    queryKey: ['/api/content'],
    queryFn: async () => {
      const response = await fetch('/api/content');
      if (!response.ok) throw new Error('Failed to fetch content');
      return response.json();
    },
  });

  // Fetch content ratings for selected student
  const { data: contentRatings = [], isLoading: ratingsLoading } = useQuery({
    queryKey: ['/api/content-ratings', selectedStudent],
    queryFn: async () => {
      const response = await fetch(`/api/content-ratings/${selectedStudent}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedStudent,
  });

  // Get student tries count for optimization
  const { data: studentTriesCount = {} } = useQuery({
    queryKey: ['/api/student-tries-count', selectedStudent, content?.map((c: any) => c.id)],
    queryFn: async () => {
      if (!content || content.length === 0) return {};
      const contentIds = content.map((c: any) => c.id).join(',');
      const response = await fetch(`/api/student-tries-count/${selectedStudent}?contentIds=${contentIds}`);
      if (!response.ok) return {};
      return response.json();
    },
    enabled: !!selectedStudent && !!content && content.length > 0,
  });

  // For teacher view, fetch all students
  const { data: students = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch students');
      const users = await response.json();
      // Include all users, not just excluding GV0002
      return users.map((user: any) => ({
        id: user.id,
        full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.id
      }));
    },
    enabled: activeTab === 'teacher',
  });

  // Build simple hierarchy
  const hierarchy = useMemo(() => {
    if (!topics || !content || topics.length === 0) return [];

    const ratingMap = new Map<string, SimpleContentRating>();
    contentRatings?.forEach((rating: any) => {
      ratingMap.set(rating.content_id, rating);
    });

    // Filter topics to show only "0. Introductory Questions" and A-L series
    const filteredTopics = topics.filter((topic: any) => {
      if (!topic.topic) return false;
      const topicName = topic.topic.trim();
      return topicName.startsWith("0. Introductory Questions") ||
             /^[A-L]\./.test(topicName);
    });

    const buildHierarchy = (parentId: string | null): HierarchyNode[] => {
      return filteredTopics
        .filter((topic: any) => topic.parentid === parentId)
        .map((topic: any) => {
          const topicContent = content.filter((c: any) => c.topicid === topic.id);
          const children: HierarchyNode[] = [];

          // Add subtopics
          children.push(...buildHierarchy(topic.id));

          // Separate content into groupcards and regular content
          const groupCards: any[] = [];
          const regularContent: any[] = [];

          topicContent.forEach((c: any) => {
            if (c.prompt === 'groupcard') {
              groupCards.push(c);
            } else {
              regularContent.push(c);
            }
          });

          // Add regular content that's not part of a group FIRST
          regularContent
            .filter(c => !c.contentgroup || !groupCards.some(gc => gc.id === c.contentgroup)) // Exclude content that's already grouped
            .forEach((c: any) => {
              const rating = ratingMap.get(c.id);
              children.push({
                id: c.id,
                title: c.title || c.short_description || 'Untitled',
                type: 'content',
                rating: rating?.rating || null,
                children: [],
                contentData: c,
                viewCount: rating?.view_count || 0,
                triesCount: studentTriesCount[c.id] || 0,
              });
            });

          // Add groupcard content AFTER regular content
          groupCards.forEach((groupCard: any) => {
            // Find related content that has contentgroup matching this groupcard's id
            const relatedContent = content.filter((c: any) => c.contentgroup === groupCard.id);
            
            const groupChildren = relatedContent.map((c: any) => {
              const rating = ratingMap.get(c.id);
              return {
                id: c.id,
                title: c.title || c.short_description || 'Untitled',
                type: 'content' as const,
                rating: rating?.rating || null,
                children: [],
                contentData: c,
                viewCount: rating?.view_count || 0,
                triesCount: studentTriesCount[c.id] || 0,
              };
            });

            const groupRating = ratingMap.get(groupCard.id);
            children.push({
              id: groupCard.id,
              title: groupCard.title || groupCard.short_description || 'Group Content',
              type: 'groupcard',
              rating: groupRating?.rating || null,
              children: groupChildren,
              contentData: groupCard,
              viewCount: groupRating?.view_count || 0,
              triesCount: studentTriesCount[groupCard.id] || 0,
            });
          });

          return {
            id: topic.id,
            title: topic.topic || 'Untitled Topic',
            type: topic.parentid ? 'subtopic' : 'topic',
            children,
          };
        });
    };

    return buildHierarchy(null);
  }, [topics, content, contentRatings]);

  // Filter hierarchy by rating
  const filteredHierarchy = useMemo(() => {
    if (filterRating === 'all') return hierarchy;

    const filterNode = (node: HierarchyNode): HierarchyNode | null => {
      const filteredChildren = node.children
        .map(child => filterNode(child))
        .filter(Boolean) as HierarchyNode[];

      const hasMatchingRating = node.rating === filterRating;
      const hasMatchingChildren = filteredChildren.length > 0;

      if (hasMatchingRating || hasMatchingChildren) {
        return {
          ...node,
          children: filteredChildren,
        };
      }

      return null;
    };

    return hierarchy
      .map(node => filterNode(node))
      .filter(Boolean) as HierarchyNode[];
  }, [hierarchy, filterRating]);

  const getRatingColor = (rating: string | null) => {
    switch (rating) {
      case 'ok': return 'bg-green-500 text-white';
      case 'really_bad': return 'bg-red-500 text-white';
      case 'normal': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getRatingLabel = (rating: string | null) => {
    switch (rating) {
      case 'ok': return 'Easy';
      case 'really_bad': return 'Hard';
      case 'normal': return 'Normal';
      default: return 'Unrated';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'topic': return <Folder className="h-4 w-4" />;
      case 'subtopic': return <FolderOpen className="h-4 w-4" />;
      case 'groupcard': return <Folder className="h-4 w-4 text-blue-400" />;
      case 'content': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const toggleExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleContentClick = (content: any) => {
    setSelectedContent(content);
    setIsContentPopupOpen(true);
    
    // Track content access when clicked from progress panel
    const currentUserId = getCurrentUserId();
    if (currentUserId) {
      trackContentAccess(currentUserId, content.id);
    }
  };

  const renderHierarchyItem = (item: HierarchyNode, depth: number = 0) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children.length > 0;
    const paddingLeft = depth * 16;

    return (
      <div key={item.id} className="w-full">
        <div 
          className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
          style={{ paddingLeft: `${paddingLeft + 8}px` }}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={() => toggleExpansion(item.id)}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          )}
          {!hasChildren && <div className="w-4" />}
          
          {getTypeIcon(item.type)}
          
          <span 
            className="flex-1 text-sm font-medium truncate"
            onClick={() => item.contentData && handleContentClick(item.contentData)}
          >
            {item.title}
          </span>
          
          {/* Metrics display for teacher view */}
          {activeTab === 'teacher' && (item.type === 'content' || item.type === 'groupcard') && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {item.viewCount !== undefined && item.viewCount > 0 && (
                <span className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                  <Eye className="w-3 h-3" />
                  {item.viewCount}
                </span>
              )}
              {item.triesCount !== undefined && item.triesCount > 0 && (
                <span className="flex items-center gap-1 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                  <BarChart3 className="w-3 h-3" />
                  {item.triesCount}
                </span>
              )}
            </div>
          )}
          
          {item.rating && (
            <Badge className={`text-xs h-5 ${getRatingColor(item.rating)}`}>
              {getRatingLabel(item.rating)}
            </Badge>
          )}
          
          {item.contentData && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => handleContentClick(item.contentData!)}
            >
              <Eye className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-2">
            {item.children.map(child => renderHierarchyItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const getStats = () => {
    const allRatings = contentRatings || [];
    return {
      total: allRatings.length,
      ok: allRatings.filter((r: any) => r.rating === 'ok').length,
      really_bad: allRatings.filter((r: any) => r.rating === 'really_bad').length,
      normal: allRatings.filter((r: any) => r.rating === 'normal').length,
    };
  };

  const stats = getStats();
  const isLoading = topicsLoading || contentLoading || ratingsLoading;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-white/10 border-white/20 text-white/80 hover:bg-white/20 hover:text-white transition-all duration-300 h-8 w-8 p-0"
          title="Content Progress Directory"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Content Progress Directory
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Hierarchical view of content with ratings and progress tracking
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'student' | 'teacher')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="student" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Student View
            </TabsTrigger>
            <TabsTrigger value="teacher" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Teacher Dashboard
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="student" className="space-y-4 mt-4">
            {/* Student Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-2">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Total Rated</div>
                </div>
              </Card>
              <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-2">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">{stats.ok}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Easy</div>
                </div>
              </Card>
              <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-2">
                <div className="text-center">
                  <div className="text-xl font-bold text-red-600">{stats.really_bad}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Hard</div>
                </div>
              </Card>
              <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-2">
                <div className="text-center">
                  <div className="text-xl font-bold text-yellow-600">{stats.normal}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Normal</div>
                </div>
              </Card>
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <Select value={filterRating} onValueChange={(value) => setFilterRating(value as any)}>
                <SelectTrigger className="w-40 bg-white dark:bg-gray-800">
                  <SelectValue placeholder="Filter by rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="ok">Easy Only</SelectItem>
                  <SelectItem value="really_bad">Hard Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hierarchical Content Tree */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-900 dark:text-white">Content Directory</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {isLoading ? (
                    <div className="space-y-2 p-4">
                      {[...Array(8)].map((_, i) => (
                        <Skeleton key={i} className="h-8 bg-gray-200 dark:bg-gray-700" />
                      ))}
                    </div>
                  ) : filteredHierarchy.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>No content found with selected filters</p>
                    </div>
                  ) : (
                    <div className="p-2">
                      {filteredHierarchy.map(item => renderHierarchyItem(item))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="teacher" className="space-y-4 mt-4">
            {/* Student Selection */}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="w-60 bg-white dark:bg-gray-800">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students?.map((student: any) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name} ({student.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Teacher view uses same hierarchy for selected student */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-900 dark:text-white">
                  {selectedStudent}'s Content Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {isLoading ? (
                    <div className="space-y-2 p-4">
                      {[...Array(8)].map((_, i) => (
                        <Skeleton key={i} className="h-8 bg-gray-200 dark:bg-gray-700" />
                      ))}
                    </div>
                  ) : filteredHierarchy.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>No ratings found for this student</p>
                    </div>
                  ) : (
                    <div className="p-2">
                      {filteredHierarchy.map(item => renderHierarchyItem(item))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Content Popup */}
      {selectedContent && (
        <ContentPopup
          isOpen={isContentPopupOpen}
          onClose={() => setIsContentPopupOpen(false)}
          content={selectedContent}
          contentList={content || []}
          onContentChange={(newContent) => setSelectedContent(newContent)}
          imageUrl={null}
          isImageLoading={false}
        />
      )}
    </Dialog>
  );
};

export default SimpleContentProgressPanel;