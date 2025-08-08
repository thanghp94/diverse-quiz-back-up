import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Edit, Save, X, Users, BookOpen, FileText, HelpCircle, Target, Plus, ChevronLeft, ChevronRight, PenTool, ClipboardList, Calendar, User, Hash, TreePine, GripVertical, Layers, Award } from 'lucide-react';
import { ContentEditor } from "@/components/content";
import { SocketTest } from "@/components/shared";
import { WritingSubmissionPopup } from "@/components/writing-system";
import { CollectionManager } from "@/components/collections";
import { HierarchicalCMS } from "@/components/cms/HierarchicalCMS";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Header } from "@/components/shared";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  meraki_email?: string;
  category?: string;
  show?: boolean;
  medal_results_jsonb?: any;
}

interface Topic {
  id: string;
  topic: string;
  short_summary?: string;
  challengesubject?: string;
  image?: string;
  parentid?: string;
  showstudent?: boolean;
}

interface Content {
  id: string;
  topicid: string;
  title?: string;
  short_blurb?: string;
  information?: string;
  prompt?: string;
}

interface Question {
  id: string;
  contentid: string;
  topicid?: string;
  question: string;
  level?: string;
  type?: string;
}

interface Match {
  id: string;
  type?: string;
  subject?: string;
  topic?: string;
  description?: string;
  topicid: string;
  created_at?: string;
}

interface Assignment {
  id: string;
  assignmentname?: string;
  category?: string;
  contentid?: string;
  description?: string;
  expiring_date?: string;
  noofquestion?: number;
  status?: string;
  subject?: string;
  testtype?: string;
  topicid?: string;
  type?: string;
  typeofquestion?: string;
  created_at?: string;
}

type ActiveTab = 'students' | 'topics' | 'content' | 'assignments' | 'questions' | 'matching' | 'writing-submissions' | 'content-hierarchy' | 'collections';

// Hierarchy Node Component for displaying the tree structure
interface HierarchyNodeProps {
  node: any;
  level: number;
  onContentReorder?: (items: Array<{ id: string; position: number }>) => void;
}

const SortableContentItem: React.FC<{ 
  contentItem: any; 
  index: number; 
}> = ({ contentItem, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contentItem.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-2 py-2 px-2 rounded border bg-white cursor-move hover:bg-gray-50"
    >
      <GripVertical className="h-4 w-4 text-gray-400" />
      <FileText className="h-4 w-4 text-purple-500" />
      <span className="text-sm flex-1">{contentItem.title}</span>
      <Badge variant="secondary" className="text-xs">
        Content
      </Badge>
      <span className="text-xs text-gray-500">Order: {contentItem.order || index}</span>
    </div>
  );
};

// Sortable Group Content Item Component
const SortableGroupContentItem: React.FC<{ 
  groupContent: any; 
  index: number; 
}> = ({ groupContent, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: groupContent.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-2 py-1 px-2 rounded bg-white border border-orange-200 hover:border-orange-300 cursor-move"
    >
      <GripVertical className="h-3 w-3 text-gray-400" />
      <FileText className="h-3 w-3 text-purple-500" />
      <span className="text-sm flex-1">{groupContent.title}</span>
      <Badge variant="secondary" className="text-xs">
        Content
      </Badge>
      <span className="text-xs text-gray-500">Order: {groupContent.order || index + 1}</span>
    </div>
  );
};

// Sortable Group Card Component
const SortableGroupCard: React.FC<{
  contentItem: any;
  index: number;
  sensors: any;
  onGroupContentReorder: (event: DragEndEvent, groupCardId: string) => void;
}> = ({ contentItem, index, sensors, onGroupContentReorder }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contentItem.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="border-2 border-orange-200 rounded-lg p-3 bg-orange-50 cursor-move"
    >
      <div className="flex items-center gap-2 mb-2" {...listeners}>
        <GripVertical className="h-4 w-4 text-gray-400" />
        <Target className="h-4 w-4 text-orange-500" />
        <span className="font-medium text-orange-800">{contentItem.title}</span>
        <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
          Group Card
        </Badge>
        <span className="text-xs text-gray-500">Order: {contentItem.order || index + 1}</span>
      </div>
      {contentItem.summary && (
        <p className="text-sm text-orange-700 mb-2">{contentItem.summary}</p>
      )}
      {/* Group Card Content - Sortable */}
      {contentItem.content && contentItem.content.length > 0 && (
        <div className="ml-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => onGroupContentReorder(event, contentItem.id)}
          >
            <SortableContext
              items={contentItem.content.map((item: any) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {contentItem.content.map((groupContent: any, gIndex: number) => (
                  <SortableGroupContentItem
                    key={groupContent.id}
                    groupContent={groupContent}
                    index={gIndex}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
};

// Sortable Topic Component
const SortableTopic: React.FC<{
  node: any;
  level: number;
  onContentReorder: (items: Array<{ id: string; position: number }>) => void;
  onTopicReorder?: (items: Array<{ id: string; position: number }>) => void;
}> = ({ node, level, onContentReorder, onTopicReorder }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <HierarchyNode 
        node={node} 
        level={level} 
        onContentReorder={onContentReorder}
        onTopicReorder={onTopicReorder}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

const HierarchyNode: React.FC<HierarchyNodeProps & { 
  dragHandleProps?: any;
  onTopicReorder?: (items: Array<{ id: string; position: number }>) => void;
}> = ({ 
  node, 
  level, 
  onContentReorder, 
  onTopicReorder,
  dragHandleProps 
}) => {
  const [isExpanded, setIsExpanded] = useState(level === 0); // Expand root topics by default
  const [contentItems, setContentItems] = useState(node.content || []);
  const indent = level * 24; // 24px indent per level

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = contentItems.findIndex((item: any) => item.id === active.id);
      const newIndex = contentItems.findIndex((item: any) => item.id === over?.id);

      const newContentItems = arrayMove(contentItems, oldIndex, newIndex);
      setContentItems(newContentItems);

      // Create reorder data with new positions
      const reorderData = newContentItems.map((item: any, index: number) => ({
        id: item.id,
        position: index + 1
      }));

      // Call parent callback to update server
      if (onContentReorder) {
        onContentReorder(reorderData);
      }
    }
  };

  const handleGroupContentDragEnd = (event: DragEndEvent, groupCardId: string) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      // Find the group card and update its content
      const updatedContentItems = contentItems.map((item: any) => {
        if (item.id === groupCardId && item.type === 'groupcard') {
          const groupContent = item.content || [];
          const oldIndex = groupContent.findIndex((content: any) => content.id === active.id);
          const newIndex = groupContent.findIndex((content: any) => content.id === over?.id);
          
          const newGroupContent = arrayMove(groupContent, oldIndex, newIndex);
          
          // Create reorder data for group content
          const reorderData = newGroupContent.map((content: any, index: number) => ({
            id: content.id,
            position: index + 1
          }));

          // Call parent callback to update server
          if (onContentReorder) {
            onContentReorder(reorderData);
          }

          return {
            ...item,
            content: newGroupContent
          };
        }
        return item;
      });

      setContentItems(updatedContentItems);
    }
  };

  return (
    <div style={{ marginLeft: `${indent}px` }} className="border-l-2 border-gray-200 pl-4">
      {/* Topic Header */}
      <div className="flex items-center gap-2 mb-2">
        {/* Drag Handle for Topics */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="cursor-grab hover:cursor-grabbing p-1"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        )}
        
        {(node.children.length > 0 || contentItems.length > 0) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronRight className="h-4 w-4 rotate-90" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
        <div className="flex items-center gap-2">
          {node.type === 'groupcard' ? (
            <Target className="h-4 w-4 text-orange-500" />
          ) : (
            <BookOpen className="h-4 w-4 text-blue-500" />
          )}
          <span className="font-medium">{node.title}</span>
          <Badge variant="outline" className="text-xs">
            {node.type === 'groupcard' ? 'Group Card' : 'Topic'}
          </Badge>
          {node.showstudent && (
            <Badge variant="default" className="text-xs bg-green-500">
              Visible
            </Badge>
          )}
        </div>
      </div>

      {/* Topic Summary */}
      {node.summary && (
        <p className="text-sm text-gray-600 ml-8 mb-2">{node.summary}</p>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="ml-8 space-y-2">
          {/* Sortable Content Items */}
          {contentItems.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={contentItems.map((item: any) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {contentItems.map((contentItem: any, index: number) => {
                    if (contentItem.type === 'groupcard') {
                      return (
                        <SortableGroupCard
                          key={contentItem.id}
                          contentItem={contentItem}
                          index={index}
                          sensors={sensors}
                          onGroupContentReorder={handleGroupContentDragEnd}
                        />
                      );
                    } else {
                      return (
                        <SortableContentItem
                          key={contentItem.id}
                          contentItem={contentItem}
                          index={index}
                        />
                      );
                    }
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Child Topics - Sortable */}
          {node.children.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => {
                const { active, over } = event;
                if (active.id !== over?.id) {
                  const childTopics = node.children;
                  const oldIndex = childTopics.findIndex((child: any) => child.id === active.id);
                  const newIndex = childTopics.findIndex((child: any) => child.id === over?.id);
                  
                  if (oldIndex !== -1 && newIndex !== -1) {
                    const reorderData = arrayMove(childTopics, oldIndex, newIndex).map((child: any, index: number) => ({
                      id: child.id,
                      position: index + 1
                    }));
                    
                    // Call the topics reorder mutation for child topics
                    if (onTopicReorder) {
                      onTopicReorder(reorderData);
                    }
                  }
                }
              }}
            >
              <SortableContext
                items={node.children.map((child: any) => child.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {node.children.map((child: any) => (
                    <SortableTopic
                      key={child.id} 
                      node={child} 
                      level={level + 1} 
                      onContentReorder={onContentReorder}
                      onTopicReorder={onTopicReorder}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  );
};

const AdminPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('students');
  const [studentFilter, setStudentFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItemData, setNewItemData] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedWritingSubmission, setSelectedWritingSubmission] = useState<any>(null);
  const [isWritingPopupOpen, setIsWritingPopupOpen] = useState(false);
  const [selectedCollectionFilter, setSelectedCollectionFilter] = useState<string>('all');
  const [showMedalDialog, setShowMedalDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [medalData, setMedalData] = useState<any>({});

  // Fetch data based on active tab
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: activeTab === 'students'
  });

  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: ['/api/topics'],
    enabled: activeTab === 'topics' || activeTab === 'content-hierarchy'
  });

  const { data: content, isLoading: contentLoading } = useQuery({
    queryKey: ['/api/content'],
    enabled: activeTab === 'content' || activeTab === 'content-hierarchy'
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/questions'],
    enabled: activeTab === 'questions'
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['/api/assignments'],
    enabled: activeTab === 'assignments'
  });

  const { data: matching, isLoading: matchingLoading } = useQuery({
    queryKey: ['/api/matching'],
    enabled: activeTab === 'matching'
  });

  const { data: writingSubmissions, isLoading: writingSubmissionsLoading } = useQuery({
    queryKey: ['/api/writing-submissions/all'],
    queryFn: async () => {
      const response = await fetch('/api/writing-submissions/all', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch writing submissions');
      return response.json();
    },
    enabled: activeTab === 'writing-submissions'
  });

  const { data: allUsers } = useQuery({
    queryKey: ['/api/users'],
    enabled: activeTab === 'writing-submissions'
  });

  const { data: collections, isLoading: collectionsLoading } = useQuery({
    queryKey: ['/api/collections'],
    enabled: activeTab === 'collections' || activeTab === 'content-hierarchy'
  });

  // Check admin access
  const isAdmin = user?.id === 'GV0002';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">You don't have permission to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Update mutations
  const updateUser = useMutation({
    mutationFn: async (userData: User) => {
      const response = await fetch(`/api/users/${userData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setEditingId(null);
      toast({ title: "Success", description: "User updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" });
    }
  });

  const toggleUserStatus = useMutation({
    mutationFn: async (userId: string) => {
      console.log('Toggling status for user:', userId);
      const response = await fetch(`/api/users/${userId}/toggle-status`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to toggle user status');
      const result = await response.json();
      console.log('Toggle result:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Toggle success, invalidating cache...');
      // Force refetch the users data
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.refetchQueries({ queryKey: ['/api/users'] });
      toast({ title: "Success", description: "User status updated successfully" });
    },
    onError: (error) => {
      console.error('Toggle error:', error);
      toast({ title: "Error", description: "Failed to update user status", variant: "destructive" });
    }
  });

  const updateMedalResult = useMutation({
    mutationFn: async ({ userId, medalData }: { userId: string; medalData: any }) => {
      const response = await fetch(`/api/users/${userId}/medal-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medalData),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to update medal result');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setShowMedalDialog(false);
      setSelectedStudent(null);
      setMedalData({});
      toast({ title: "Success", description: "Medal result added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add medal result", variant: "destructive" });
    }
  });

  const updateTopic = useMutation({
    mutationFn: async (topicData: Topic) => {
      const response = await fetch(`/api/topics/${topicData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topicData),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to update topic');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/topics'] });
      setEditingId(null);
      toast({ title: "Success", description: "Topic updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update topic", variant: "destructive" });
    }
  });

  // Create mutations
  const createUser = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to create user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setShowAddDialog(false);
      setNewItemData({});
      toast({ title: "Success", description: "User created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create user", variant: "destructive" });
    }
  });

  const createTopic = useMutation({
    mutationFn: async (topicData: any) => {
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topicData),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to create topic');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/topics'] });
      setShowAddDialog(false);
      setNewItemData({});
      toast({ title: "Success", description: "Topic created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create topic", variant: "destructive" });
    }
  });

  const createContent = useMutation({
    mutationFn: async (contentData: any) => {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentData),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to create content');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      setShowAddDialog(false);
      setNewItemData({});
      toast({ title: "Success", description: "Content created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create content", variant: "destructive" });
    }
  });

  const createMatching = useMutation({
    mutationFn: async (matchingData: any) => {
      const response = await fetch('/api/matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchingData),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to create matching');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/matching'] });
      setShowAddDialog(false);
      setNewItemData({});
      toast({ title: "Success", description: "Matching activity created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create matching activity", variant: "destructive" });
    }
  });

  const createAssignment = useMutation({
    mutationFn: async (assignmentData: any) => {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentData),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to create assignment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      setShowAddDialog(false);
      setNewItemData({});
      toast({ title: "Success", description: "Assignment created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create assignment", variant: "destructive" });
    }
  });

  const updateAssignment = useMutation({
    mutationFn: async (assignmentData: Assignment) => {
      const response = await fetch(`/api/assignments/${assignmentData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentData),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to update assignment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      setEditingId(null);
      toast({ title: "Success", description: "Assignment updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update assignment", variant: "destructive" });
    }
  });

  const reorderContent = useMutation({
    mutationFn: async (items: Array<{ id: string; position: number }>) => {
      const response = await fetch('/api/content/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to reorder content');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      toast({ title: "Success", description: "Content reordered successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reorder content", variant: "destructive" });
    }
  });

  const reorderTopics = useMutation({
    mutationFn: async (items: Array<{ id: string; position: number }>) => {
      const response = await fetch('/api/topics/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to reorder topics');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/topics'] });
      toast({ title: "Success", description: "Topics reordered successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reorder topics", variant: "destructive" });
    }
  });

  // Get student counts for badges
  const getStudentCounts = () => {
    const allUsers = (students as User[]) || [];
    console.log('Total users in system:', allUsers.length);
    
    // Check what users we actually have
    const hsUsers = allUsers.filter(u => u.id?.startsWith('HS'));
    const emailStudents = allUsers.filter(u => u.meraki_email?.includes('student') || u.meraki_email?.includes('@meraki.edu'));
    
    console.log('HS users:', hsUsers.length);
    console.log('Email students:', emailStudents.length);
    
    const allStudents = allUsers.filter(s => 
      s.id?.startsWith('HS') || s.meraki_email?.includes('student') || s.meraki_email?.includes('@meraki.edu')
    );
    
    // More robust checking for show field (handle both boolean and string values)
    const activeStudents = allStudents.filter(s => s.show !== false && (s.show as any) !== "false");
    const inactiveStudents = allStudents.filter(s => s.show === false || (s.show as any) === "false");
    
    console.log('All students:', allStudents.length);
    console.log('Active students:', activeStudents.length);
    console.log('Inactive students:', inactiveStudents.length);
    console.log('Recent deactivations:', allUsers.filter(u => u.show === false || (u.show as any) === "false").map(u => ({id: u.id, show: u.show})));
    
    return {
      all: allStudents.length,
      active: activeStudents.length,
      inactive: inactiveStudents.length
    };
  };

  // Fetch collection content when needed
  const { data: selectedCollectionContent = [] } = useQuery({
    queryKey: ['/api/collections', selectedCollectionFilter, 'content'],
    queryFn: async () => {
      if (selectedCollectionFilter === 'all') return [];
      const response = await fetch(`/api/collections/${selectedCollectionFilter}/content`);
      if (!response.ok) throw new Error('Failed to fetch collection content');
      return response.json();
    },
    enabled: selectedCollectionFilter !== 'all' && activeTab === 'content-hierarchy'
  });

  // Build content hierarchy for display
  const buildContentHierarchy = (): any[] => {
    if (!topics || !content) return [];
    
    const allTopics = topics as Topic[];
    let allContent = content as any[];
    
    // Filter content by collection if selected
    if (selectedCollectionFilter !== 'all' && selectedCollectionContent.length > 0) {
      // Separate topics and content from collection data
      const collectionTopics = selectedCollectionContent.filter((item: any) => item.type === 'topic');
      const collectionContent = selectedCollectionContent.filter((item: any) => item.type === 'content');
      
      const collectionContentIds = new Set(collectionContent.map((item: any) => item.id));
      const collectionTopicIds = new Set(collectionTopics.map((item: any) => item.id));
      
      // Filter content to only show items in the selected collection
      if (collectionContent.length > 0) {
        allContent = allContent.filter(c => collectionContentIds.has(c.id));
      } else {
        // If collection only has topics but no specific content, show no content
        // This allows showing just the topic hierarchy for topic-only collections
        allContent = [];
      }
      
      console.log('Collection filtering:', {
        selectedCollectionFilter,
        collectionTopics: collectionTopics.length,
        collectionContent: collectionContent.length,
        collectionTopicIds: Array.from(collectionTopicIds),
        filteredContent: allContent.length
      });
    }
    
    // Get root topics (no parentid), filtered by collection if selected
    let rootTopics = allTopics.filter(t => !t.parentid);
    
    if (selectedCollectionFilter !== 'all' && selectedCollectionContent.length > 0) {
      // Get topics directly from collection
      const collectionTopics = selectedCollectionContent.filter((item: any) => item.type === 'topic');
      const collectionTopicIds = new Set(collectionTopics.map((item: any) => item.id));
      
      // Also include topics that have content in the collection
      const topicsWithCollectionContent = new Set(allContent.map(c => c.topicid));
      
      const relevantTopicIds = new Set([
        ...collectionTopicIds,
        ...topicsWithCollectionContent
      ]);
      
      rootTopics = rootTopics.filter(t => relevantTopicIds.has(t.id));
    }
    
    // Get group cards (content items where prompt = "groupcard")
    const groupCards = allContent.filter(c => c.prompt === 'groupcard');
    
    // Get content that belongs to group cards (to exclude from regular content)
    const contentInGroups = new Set(
      allContent
        .filter(c => c.contentgroup)
        .map(c => c.id)
    );
    
    const buildHierarchy = (parentId?: string): any[] => {
      const children = allTopics.filter(t => t.parentid === parentId);
      
      return children.map(child => {
        // Get regular content for this topic (excluding group cards and content already in groups)
        const topicContent = allContent
          .filter(c => 
            c.topicid === child.id && 
            c.prompt !== 'groupcard' && 
            !contentInGroups.has(c.id)
          )
          .sort((a, b) => {
            const orderA = parseInt(a.order || '0') || 0;
            const orderB = parseInt(b.order || '0') || 0;
            return orderA - orderB;
          })
          .map(c => ({
            id: c.id,
            type: 'content' as const,
            title: c.title,
            summary: c.short_blurb,
            parentid: c.parentid,
            topicid: c.topicid,
            order: c.order
          }));

        // Get group cards for this topic
        const topicGroupCards = groupCards
          .filter(gc => gc.topicid === child.id)
          .sort((a, b) => {
            const orderA = parseInt(a.order || '0') || 0;
            const orderB = parseInt(b.order || '0') || 0;
            return orderA - orderB;
          })
          .map(gc => {
            // Find content that belongs to this group card
            const groupContent = allContent
              .filter(c => c.contentgroup === gc.id)
              .sort((a, b) => {
                const orderA = parseInt(a.order || '0') || 0;
                const orderB = parseInt(b.order || '0') || 0;
                return orderA - orderB;
              })
              .map(c => ({
                id: c.id,
                type: 'content' as const,
                title: c.title,
                summary: c.short_blurb,
                parentid: c.parentid,
                topicid: c.topicid,
                contentgroup: c.contentgroup,
                order: c.order
              }));

            return {
              id: gc.id,
              type: 'groupcard' as const,
              title: gc.title,
              summary: gc.short_description,
              parentid: gc.parentid,
              topicid: gc.topicid,
              order: gc.order,
              content: groupContent,
              children: []
            };
          });

        // Combine and sort all content items (regular content + group cards) by order
        const allContentItems = [...topicContent, ...topicGroupCards]
          .sort((a, b) => {
            const orderA = parseInt(a.order || '0') || 0;
            const orderB = parseInt(b.order || '0') || 0;
            return orderA - orderB;
          });

        return {
          id: child.id,
          type: 'topic' as const,
          title: child.topic,
          summary: child.short_summary,
          parentid: child.parentid,
          showstudent: child.showstudent,
          children: buildHierarchy(child.id),
          content: allContentItems
        };
      });
    };
    
    return rootTopics.map(root => {
      // Get regular content for root topic (excluding group cards and content already in groups)
      const rootContent = allContent
        .filter(c => 
          c.topicid === root.id && 
          c.prompt !== 'groupcard' && 
          !contentInGroups.has(c.id)
        )
        .sort((a, b) => {
          const orderA = parseInt(a.order || '0') || 0;
          const orderB = parseInt(b.order || '0') || 0;
          return orderA - orderB;
        })
        .map(c => ({
          id: c.id,
          type: 'content' as const,
          title: c.title,
          summary: c.short_blurb,
          parentid: c.parentid,
          topicid: c.topicid,
          order: c.order
        }));

      // Get group cards for root topic
      const rootGroupCards = groupCards
        .filter(gc => gc.topicid === root.id)
        .sort((a, b) => {
          const orderA = parseInt(a.order || '0') || 0;
          const orderB = parseInt(b.order || '0') || 0;
          return orderA - orderB;
        })
        .map(gc => {
          // Find content that belongs to this group card
          const groupContent = allContent
            .filter(c => c.contentgroup === gc.id)
            .sort((a, b) => {
              const orderA = parseInt(a.order || '0') || 0;
              const orderB = parseInt(b.order || '0') || 0;
              return orderA - orderB;
            })
            .map(c => ({
              id: c.id,
              type: 'content' as const,
              title: c.title,
              summary: c.short_blurb,
              parentid: c.parentid,
              topicid: c.topicid,
              contentgroup: c.contentgroup,
              order: c.order
            }));

          return {
            id: gc.id,
            type: 'groupcard' as const,
            title: gc.title,
            summary: gc.short_description,
            parentid: gc.parentid,
            topicid: gc.topicid,
            order: gc.order,
            content: groupContent,
            children: []
          };
        });

      // Combine and sort all content items (regular content + group cards) by order
      const allContentItems = [...rootContent, ...rootGroupCards]
        .sort((a, b) => {
          const orderA = parseInt(a.order || '0') || 0;
          const orderB = parseInt(b.order || '0') || 0;
          return orderA - orderB;
        });

      return {
        id: root.id,
        type: 'topic' as const,
        title: root.topic,
        summary: root.short_summary,
        parentid: root.parentid,
        showstudent: root.showstudent,
        children: buildHierarchy(root.id),
        content: allContentItems
      };
    });
  };

  // Filter data based on search
  const getFilteredData = () => {
    const term = searchTerm.toLowerCase();
    switch (activeTab) {
      case 'students':
        let filteredStudents = (students as User[])?.filter(s => 
          // Show all users that look like students (have HS prefix, student email, or meraki domain)
          (s.id?.startsWith('HS') || 
           s.meraki_email?.includes('student') || 
           s.meraki_email?.includes('@meraki.edu') ||
           s.meraki_email?.endsWith('@meraki.edu.vn') ||
           s.category === 'Student') &&
          (s.full_name?.toLowerCase().includes(term) || 
           s.first_name?.toLowerCase().includes(term) ||
           s.last_name?.toLowerCase().includes(term) ||
           s.id?.toLowerCase().includes(term) ||
           s.meraki_email?.toLowerCase().includes(term))
        ) || [];
        
        // Apply status filter (handle both boolean and string values)
        if (studentFilter === 'active') {
          filteredStudents = filteredStudents.filter(s => s.show !== false && (s.show as any) !== "false");
        } else if (studentFilter === 'inactive') {
          filteredStudents = filteredStudents.filter(s => s.show === false || (s.show as any) === "false");
        }
        
        // Sort students consistently by name to maintain order after updates
        filteredStudents.sort((a, b) => {
          const nameA = a.full_name || `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.id || '';
          const nameB = b.full_name || `${b.first_name || ''} ${b.last_name || ''}`.trim() || b.id || '';
          return nameA.localeCompare(nameB);
        });
        
        return filteredStudents;
      case 'topics':
        return (topics as Topic[])?.filter(t => 
          t.topic?.toLowerCase().includes(term) ||
          t.id?.toLowerCase().includes(term)
        ) || [];
      case 'content':
        return (content as Content[])?.filter(c => 
          c.title?.toLowerCase().includes(term) ||
          c.short_blurb?.toLowerCase().includes(term) ||
          c.id?.toLowerCase().includes(term)
        ) || [];
      case 'assignments':
        return (assignments as Assignment[])?.filter(a => 
          a.assignmentname?.toLowerCase().includes(term) ||
          a.description?.toLowerCase().includes(term) ||
          a.subject?.toLowerCase().includes(term) ||
          a.category?.toLowerCase().includes(term) ||
          a.id?.toLowerCase().includes(term)
        ) || [];
      case 'questions':
        return (questions as Question[])?.filter(q => 
          q.question?.toLowerCase().includes(term) ||
          q.id?.toLowerCase().includes(term)
        ) || [];
      case 'matching':
        return (matching as Match[])?.filter(m => 
          m.topic?.toLowerCase().includes(term) ||
          m.subject?.toLowerCase().includes(term) ||
          m.description?.toLowerCase().includes(term) ||
          m.id?.toLowerCase().includes(term)
        ) || [];
      case 'writing-submissions':
        return (writingSubmissions as any[])?.filter(w => 
          w.title?.toLowerCase().includes(term) ||
          w.student_id?.toLowerCase().includes(term) ||
          w.status?.toLowerCase().includes(term)
        ) || [];
      case 'content-hierarchy':
        // Return hierarchical structure of topics and content
        return buildContentHierarchy();
      case 'collections':
        return (collections as any[])?.filter(c => 
          c.name?.toLowerCase().includes(term) ||
          c.description?.toLowerCase().includes(term) ||
          c.page_route?.toLowerCase().includes(term) ||
          c.id?.toLowerCase().includes(term)
        ) || [];
      default:
        return [];
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setEditData(item);
  };

  const handleSave = () => {
    if (activeTab === 'students') {
      updateUser.mutate(editData);
    } else if (activeTab === 'topics') {
      updateTopic.mutate(editData);
    } else if (activeTab === 'assignments') {
      updateAssignment.mutate(editData);
    } else if (activeTab === 'content') {
      // Content update mutation can be added here if needed
      toast({ title: "Info", description: "Content editing will be implemented", variant: "default" });
      setEditingId(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleViewWritingSubmission = (submission: any) => {
    setSelectedWritingSubmission(submission);
    setIsWritingPopupOpen(true);
  };

  const handleCloseWritingPopup = () => {
    setIsWritingPopupOpen(false);
    setSelectedWritingSubmission(null);
  };

  const handleGradingComplete = () => {
    // Refresh the writing submissions data
    queryClient.invalidateQueries({ queryKey: ['/api/writing-submissions/all'] });
  };

  const handleAddMedalResult = (student: User) => {
    setSelectedStudent(student);
    setMedalData({});
    setShowMedalDialog(true);
  };

  const handleSaveMedalResult = () => {
    if (!selectedStudent) return;
    
    // Validate required fields
    if (!medalData.year || !medalData.division || !medalData.round || !medalData.teamNumber) {
      toast({ 
        title: "Error", 
        description: "Please fill in all required fields (Year, Division, Round, Team Number)", 
        variant: "destructive" 
      });
      return;
    }
    
    // Filter out categories with no medal type or "none" type
    const filteredCategories = {};
    if (medalData.categories) {
      Object.keys(medalData.categories).forEach(categoryKey => {
        const category = medalData.categories[categoryKey];
        if (category.type && category.type !== 'none') {
          filteredCategories[categoryKey] = category;
        }
      });
    }
    
    const finalMedalData = {
      ...medalData,
      categories: filteredCategories
    };
    
    updateMedalResult.mutate({ userId: selectedStudent.id, medalData: finalMedalData });
  };

  const getStudentName = (studentId: string) => {
    const user = (allUsers as User[])?.find(u => u.id === studentId);
    return user?.full_name || user?.first_name || studentId;
  };

  const handleCreate = () => {
    if (activeTab === 'students') {
      // Check for duplicate ID or Meraki email
      const existingUserWithId = (students as User[])?.find(user => user.id === newItemData.id);
      const existingUserWithEmail = (students as User[])?.find(user => user.meraki_email === newItemData.meraki_email);

      if (existingUserWithId) {
        toast({
          title: "Error",
          description: `Student ID "${newItemData.id}" is already in use. Please choose a different ID.`,
          variant: "destructive"
        });
        return;
      }

      if (newItemData.meraki_email && existingUserWithEmail) {
        toast({
          title: "Error", 
          description: `Meraki email "${newItemData.meraki_email}" is already in use. Please choose a different email.`,
          variant: "destructive"
        });
        return;
      }

      createUser.mutate(newItemData);
    } else if (activeTab === 'topics') {
      createTopic.mutate(newItemData);
    } else if (activeTab === 'content') {
      createContent.mutate(newItemData);
    } else if (activeTab === 'assignments') {
      createAssignment.mutate(newItemData);
    } else if (activeTab === 'matching') {
      createMatching.mutate(newItemData);
    }
  };

  const getAddDialogContent = () => {
    switch (activeTab) {
      case 'students':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="id">Student ID</Label>
              <Input
                id="id"
                value={newItemData.id || ''}
                onChange={(e) => setNewItemData({...newItemData, id: e.target.value})}
                placeholder="HS0001"
              />
            </div>
            <div>
              <Label htmlFor="email">Meraki Email</Label>
              <Input
                id="email"
                value={newItemData.meraki_email || ''}
                onChange={(e) => setNewItemData({...newItemData, meraki_email: e.target.value})}
                placeholder="student@meraki.edu"
              />
            </div>
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={newItemData.full_name || ''}
                onChange={(e) => setNewItemData({...newItemData, full_name: e.target.value})}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={newItemData.category || "student"}
                onValueChange={(value) => setNewItemData({...newItemData, category: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">student</SelectItem>
                  <SelectItem value="teacher">teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="show">Show</Label>
              <Select
                value={newItemData.show || "challenge"}
                onValueChange={(value) => setNewItemData({...newItemData, show: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="challenge">challenge</SelectItem>
                  <SelectItem value="challenge, writing, debate">challenge, writing, debate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'topics':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="topic">Topic Name</Label>
              <Input
                id="topic"
                value={newItemData.topic || ''}
                onChange={(e) => setNewItemData({...newItemData, topic: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="summary">Short Summary</Label>
              <Textarea
                id="summary"
                value={newItemData.short_summary || ''}
                onChange={(e) => setNewItemData({...newItemData, short_summary: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="challengeSubject">Challenge Subject</Label>
              <Input
                id="challengeSubject"
                value={newItemData.challengesubject || ''}
                onChange={(e) => setNewItemData({...newItemData, challengesubject: e.target.value})}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="showStudent"
                checked={newItemData.showstudent || false}
                onCheckedChange={(checked) => setNewItemData({...newItemData, showstudent: checked})}
              />
              <Label htmlFor="showStudent">Show to Students</Label>
            </div>
          </div>
        );
      case 'content':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newItemData.title || ''}
                onChange={(e) => setNewItemData({...newItemData, title: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="topicId">Topic ID</Label>
              <Input
                id="topicId"
                value={newItemData.topicid || ''}
                onChange={(e) => setNewItemData({...newItemData, topicid: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="shortBlurb">Short Blurb</Label>
              <Textarea
                id="shortBlurb"
                value={newItemData.short_blurb || ''}
                onChange={(e) => setNewItemData({...newItemData, short_blurb: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="information">Information</Label>
              <Textarea
                id="information"
                value={newItemData.information || ''}
                onChange={(e) => setNewItemData({...newItemData, information: e.target.value})}
              />
            </div>
          </div>
        );
      case 'assignments':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="assignmentname">Assignment Name</Label>
              <Input
                id="assignmentname"
                value={newItemData.assignmentname || ''}
                onChange={(e) => setNewItemData({...newItemData, assignmentname: e.target.value})}
                placeholder="Week 1 Assignment"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={newItemData.category || ''}
                onChange={(e) => setNewItemData({...newItemData, category: e.target.value})}
                placeholder="quiz, homework, test"
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={newItemData.subject || ''}
                onChange={(e) => setNewItemData({...newItemData, subject: e.target.value})}
                placeholder="Math, Science, English"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newItemData.description || ''}
                onChange={(e) => setNewItemData({...newItemData, description: e.target.value})}
                placeholder="Assignment description"
              />
            </div>
            <div>
              <Label htmlFor="noofquestion">Number of Questions</Label>
              <Input
                id="noofquestion"
                type="number"
                value={newItemData.noofquestion || ''}
                onChange={(e) => setNewItemData({...newItemData, noofquestion: parseInt(e.target.value) || 0})}
                placeholder="10"
              />
            </div>
            <div>
              <Label htmlFor="testtype">Test Type</Label>
              <Input
                id="testtype"
                value={newItemData.testtype || ''}
                onChange={(e) => setNewItemData({...newItemData, testtype: e.target.value})}
                placeholder="quiz, exam, practice"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={newItemData.status || "active"}
                onValueChange={(value) => setNewItemData({...newItemData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expiring_date">Expiring Date</Label>
              <Input
                id="expiring_date"
                type="datetime-local"
                value={newItemData.expiring_date || ''}
                onChange={(e) => setNewItemData({...newItemData, expiring_date: e.target.value})}
              />
            </div>
          </div>
        );
      case 'matching':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Input
                id="type"
                value={newItemData.type || ''}
                onChange={(e) => setNewItemData({...newItemData, type: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={newItemData.subject || ''}
                onChange={(e) => setNewItemData({...newItemData, subject: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                value={newItemData.topic || ''}
                onChange={(e) => setNewItemData({...newItemData, topic: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="topicId">Topic ID</Label>
              <Input
                id="topicId"
                value={newItemData.topicid || ''}
                onChange={(e) => setNewItemData({...newItemData, topicid: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newItemData.description || ''}
                onChange={(e) => setNewItemData({...newItemData, description: e.target.value})}
              />
            </div>
          </div>
        );
      default:
        return <div>No form available</div>;
    }
  };

  const tabs = [
    { id: 'students', label: 'Students', icon: Users, color: 'bg-blue-500' },
    { id: 'topics', label: 'Topics', icon: BookOpen, color: 'bg-green-500' },
    { id: 'content', label: 'Content', icon: FileText, color: 'bg-purple-500' },
    { id: 'content-hierarchy', label: 'Content Hierarchy', icon: TreePine, color: 'bg-amber-500' },
    { id: 'collections', label: 'Collections', icon: Layers, color: 'bg-cyan-500' },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList, color: 'bg-teal-500' },
    { id: 'questions', label: 'Questions', icon: HelpCircle, color: 'bg-orange-500' },
    { id: 'matching', label: 'Matching', icon: Target, color: 'bg-red-500' },
    { id: 'writing-submissions', label: 'Writing Submissions', icon: PenTool, color: 'bg-indigo-500' }
  ];

  const isLoading = studentsLoading || topicsLoading || contentLoading || assignmentsLoading || questionsLoading || matchingLoading || writingSubmissionsLoading || collectionsLoading;
  const filteredData = getFilteredData();
  const studentCounts = getStudentCounts();

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset current page when switching tabs or searching
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage system data and settings</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant={isActive ? "default" : "outline"}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 ${isActive ? `${tab.color} text-white` : 'bg-white text-gray-700 border-gray-300'}`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Student Status Filter Tabs */}
        {activeTab === 'students' && (
          <div className="mb-6">
            <div className="flex gap-2">
              <Button
                variant={studentFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStudentFilter('all')}
                className="flex items-center gap-2"
              >
                All Students
                <Badge variant="secondary" className="ml-1">
                  {studentCounts.all}
                </Badge>
              </Button>
              <Button
                variant={studentFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStudentFilter('active')}
                className="flex items-center gap-2"
              >
                Active
                <Badge variant="default" className="ml-1">
                  {studentCounts.active}
                </Badge>
              </Button>
              <Button
                variant={studentFilter === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStudentFilter('inactive')}
                className="flex items-center gap-2"
              >
                Inactive
                <Badge variant="destructive" className="ml-1">
                  {studentCounts.inactive}
                </Badge>
              </Button>
            </div>
          </div>
        )}

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {tabs.find(t => t.id === activeTab)?.icon && 
                  React.createElement(tabs.find(t => t.id === activeTab)!.icon, { className: "h-5 w-5" })
                }
                {tabs.find(t => t.id === activeTab)?.label}
                <Badge variant="secondary" className="ml-2">
                  {filteredData.length} items
                </Badge>
              </div>
              {activeTab !== 'content-hierarchy' && (
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}</DialogTitle>
                  </DialogHeader>
                  {getAddDialogContent()}
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleCreate} disabled={createUser.isPending || createTopic.isPending || createContent.isPending || createAssignment.isPending || createMatching.isPending}>
                      Create
                    </Button>
                    <Button variant="outline" onClick={() => {setShowAddDialog(false); setNewItemData({});}}>
                      Cancel
                    </Button>
                  </div>
                </DialogContent>
                </Dialog>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No data found</div>
            ) : (
              <div className="overflow-x-auto">
                {activeTab === 'students' && (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">ID</th>
                        <th className="text-left p-3">Full Name</th>
                        <th className="text-left p-3">Meraki Email</th>
                        <th className="text-left p-3">Category</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((student: User) => (
                        <tr key={student.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{student.id}</td>
                          <td className="p-3">
                            {editingId === student.id ? (
                              <Input
                                value={editData.full_name || ''}
                                onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                                className="w-full"
                              />
                            ) : (
                              student.full_name || 'N/A'
                            )}
                          </td>
                          <td className="p-3">
                            {editingId === student.id ? (
                              <Input
                                value={editData.meraki_email || ''}
                                onChange={(e) => setEditData({...editData, meraki_email: e.target.value})}
                                className="w-full"
                              />
                            ) : (
                              student.meraki_email || 'N/A'
                            )}
                          </td>
                          <td className="p-3">
                            {editingId === student.id ? (
                              <Input
                                value={editData.category || ''}
                                onChange={(e) => setEditData({...editData, category: e.target.value})}
                                className="w-full"
                              />
                            ) : (
                              <Badge variant="secondary">{student.category || 'Unknown'}</Badge>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Badge variant={student.show !== false ? "default" : "destructive"}>
                                {student.show !== false ? 'Active' : 'Inactive'}
                              </Badge>
                              <Button 
                                size="sm" 
                                variant={student.show !== false ? "destructive" : "default"}
                                onClick={() => toggleUserStatus.mutate(student.id)}
                                disabled={toggleUserStatus.isPending}
                                className="h-7 px-2 text-xs"
                              >
                                {student.show !== false ? 'Deactivate' : 'Activate'}
                              </Button>
                            </div>
                          </td>
                          <td className="p-3">
                            {editingId === student.id ? (
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleSave} disabled={updateUser.isPending}>
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancel}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleEdit(student)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleAddMedalResult(student)}
                                  className="flex items-center gap-1"
                                >
                                  <Award className="h-3 w-3" />
                                  Add Medal Result
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeTab === 'topics' && (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Topic</th>
                        <th className="text-left p-3">ID</th>
                        <th className="text-left p-3">Summary</th>
                        <th className="text-left p-3">Show Student</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((topic: Topic) => (
                        <tr key={topic.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            {editingId === topic.id ? (
                              <Input
                                value={editData.topic || ''}
                                onChange={(e) => setEditData({...editData, topic: e.target.value})}
                                className="w-full"
                              />
                            ) : (
                              topic.topic
                            )}
                          </td>
                          <td className="p-3 text-sm text-gray-500">{topic.id}</td>
                          <td className="p-3">
                            {editingId === topic.id ? (
                              <Input
                                value={editData.short_summary || ''}
                                onChange={(e) => setEditData({...editData, short_summary: e.target.value})}
                                className="w-full"
                              />
                            ) : (
                              topic.short_summary || 'N/A'
                            )}
                          </td>
                          <td className="p-3">
                            <Badge variant={topic.showstudent ? "default" : "secondary"}>
                              {topic.showstudent ? 'Yes' : 'No'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {editingId === topic.id ? (
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleSave} disabled={updateTopic.isPending}>
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancel}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => handleEdit(topic)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeTab === 'content' && (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Order</th>
                        <th className="text-left p-3">Title</th>
                        <th className="text-left p-3">Topic ID</th>
                        <th className="text-left p-3">Short Blurb</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((item: Content, index: number) => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 text-center">{startIndex + index + 1}</td>
                          <td className="p-3">{item.title || 'Untitled'}</td>
                          <td className="p-3 text-sm text-gray-500">{item.topicid}</td>
                          <td className="p-3 max-w-xs truncate">{item.short_blurb || 'N/A'}</td>
                          <td className="p-3">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeTab === 'content-hierarchy' && (
                  <div className="space-y-4">
                    {/* Collection Filter - Always visible */}
                    <div className="bg-white p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Label htmlFor="collection-filter" className="text-sm font-medium">
                          Filter by Collection:
                        </Label>
                        <Select
                          value={selectedCollectionFilter}
                          onValueChange={setSelectedCollectionFilter}
                        >
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Select collection" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Content</SelectItem>
                            {collections?.map((collection: any) => (
                              <SelectItem key={collection.id} value={collection.id}>
                                {collection.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedCollectionFilter !== 'all' && (
                          <Badge variant="secondary">
                            Showing content from: {collections?.find((c: any) => c.id === selectedCollectionFilter)?.name}
                          </Badge>
                        )}
                      </div>
                      {filteredData.length === 0 && selectedCollectionFilter !== 'all' && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm text-amber-700">
                            No content found for the selected collection. Try selecting "All Content" or a different collection.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Hierarchy Display */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-4">
                        Content hierarchy shows the relationship between topics and their content. Drag topics to reorder them.
                      </p>
                      {filteredData.length > 0 ? (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(event) => {
                            const { active, over } = event;
                            if (active.id !== over?.id) {
                              const rootTopics = filteredData as any[];
                              const oldIndex = rootTopics.findIndex(topic => topic.id === active.id);
                              const newIndex = rootTopics.findIndex(topic => topic.id === over?.id);
                              
                              if (oldIndex !== -1 && newIndex !== -1) {
                                const reorderData = arrayMove(rootTopics, oldIndex, newIndex).map((topic: any, index: number) => ({
                                  id: topic.id,
                                  position: index + 1
                                }));
                                
                                reorderTopics.mutate(reorderData);
                              }
                            }
                          }}
                        >
                          <SortableContext
                            items={(filteredData as any[]).map(topic => topic.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-6">
                              {(filteredData as any[]).map((rootTopic: any) => (
                                <SortableTopic
                                  key={rootTopic.id} 
                                  node={rootTopic} 
                                  level={0} 
                                  onContentReorder={(items) => reorderContent.mutate(items)}
                                  onTopicReorder={(items) => reorderTopics.mutate(items)}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      ) : (
                        <div className="text-center py-8">
                          {selectedCollectionFilter === 'all' ? (
                            <p className="text-gray-500">No hierarchy data available</p>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-gray-500">No content found for this collection</p>
                              <p className="text-sm text-gray-400">
                                The "{collections?.find((c: any) => c.id === selectedCollectionFilter)?.name}" collection may be empty or contain content that doesn't have topic relationships.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'assignments' && (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Name</th>
                        <th className="text-left p-3">Category</th>
                        <th className="text-left p-3">Subject</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Questions</th>
                        <th className="text-left p-3">Expiring Date</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((assignment: Assignment) => (
                        <tr key={assignment.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            {editingId === assignment.id ? (
                              <Input
                                value={editData.assignmentname || ''}
                                onChange={(e) => setEditData({...editData, assignmentname: e.target.value})}
                                className="w-full"
                              />
                            ) : (
                              assignment.assignmentname || 'Untitled'
                            )}
                          </td>
                          <td className="p-3">
                            {editingId === assignment.id ? (
                              <Input
                                value={editData.category || ''}
                                onChange={(e) => setEditData({...editData, category: e.target.value})}
                                className="w-full"
                              />
                            ) : (
                              <Badge variant="secondary">{assignment.category || 'N/A'}</Badge>
                            )}
                          </td>
                          <td className="p-3">
                            {editingId === assignment.id ? (
                              <Input
                                value={editData.subject || ''}
                                onChange={(e) => setEditData({...editData, subject: e.target.value})}
                                className="w-full"
                              />
                            ) : (
                              assignment.subject || 'N/A'
                            )}
                          </td>
                          <td className="p-3">
                            {editingId === assignment.id ? (
                              <Select
                                value={editData.status || "active"}
                                onValueChange={(value) => setEditData({...editData, status: value})}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                  <SelectItem value="draft">Draft</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant={assignment.status === 'active' ? 'default' : assignment.status === 'draft' ? 'secondary' : 'outline'}>
                                {assignment.status || 'N/A'}
                              </Badge>
                            )}
                          </td>
                          <td className="p-3">
                            {editingId === assignment.id ? (
                              <Input
                                type="number"
                                value={editData.noofquestion || ''}
                                onChange={(e) => setEditData({...editData, noofquestion: parseInt(e.target.value) || 0})}
                                className="w-20"
                              />
                            ) : (
                              <Badge variant="outline">{assignment.noofquestion || 0}</Badge>
                            )}
                          </td>
                          <td className="p-3">
                            {editingId === assignment.id ? (
                              <Input
                                type="datetime-local"
                                value={editData.expiring_date || ''}
                                onChange={(e) => setEditData({...editData, expiring_date: e.target.value})}
                                className="w-full"
                              />
                            ) : (
                              assignment.expiring_date ? (
                                <span className="text-sm">
                                  {new Date(assignment.expiring_date).toLocaleDateString()}
                                </span>
                              ) : 'N/A'
                            )}
                          </td>
                          <td className="p-3">
                            {editingId === assignment.id ? (
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleSave} disabled={updateAssignment.isPending}>
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancel}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => handleEdit(assignment)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeTab === 'questions' && (
                  <div>
                    {filteredData.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No questions found in the database.</p>
                        <p className="text-sm mt-2">Questions may be stored in a different table or format.</p>
                      </div>
                    ) : (
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Question</th>
                            <th className="text-left p-3">Level</th>
                            <th className="text-left p-3">Type</th>
                            <th className="text-left p-3">Content ID</th>
                            <th className="text-left p-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedData.map((question: Question) => (
                            <tr key={question.id} className="border-b hover:bg-gray-50">
                              <td className="p-3 max-w-md truncate">{question.question}</td>
                              <td className="p-3">
                                <Badge variant="secondary">{question.level || 'N/A'}</Badge>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline">{question.type || 'N/A'}</Badge>
                              </td>
                              <td className="p-3 text-sm text-gray-500">{question.contentid}</td>
                              <td className="p-3">
                                <Button size="sm" variant="outline" onClick={() => handleEdit(question)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'matching' && (
                  <div>
                    {filteredData.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No matching activities found in the database.</p>
                        <p className="text-sm mt-2">The matching table is currently empty. Create somematching activities to see them here.</p>
                        <p className="text-sm mt-1 text-blue-600">Use the "Add Matching" button above to create your first matching activity.</p>
                      </div>
                    ) : (
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Topic</th>
                            <th className="text-left p-3">Subject</th>
                            <th className="text-left p-3">Type</th>
                            <th className="text-left p-3">Description</th>
                            <th className="text-left p-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedData.map((match: Match) => (
                            <tr key={match.id} className="border-b hover:bg-gray-50">
                              <td className="p-3">{match.topic || 'N/A'}</td>
                              <td className="p-3">{match.subject || 'N/A'}</td>
                              <td className="p-3">
                                <Badge variant="secondary">{match.type || 'N/A'}</Badge>
                              </td>
                              <td className="p-3 max-w-xs truncate">{match.description || 'N/A'}</td>
                              <td className="p-3">
                                <Button size="sm" variant="outline" onClick={() => handleEdit(match)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'writing-submissions' && (
                  <div>
                    {filteredData.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No writing submissions found.</p>
                        <p className="text-sm mt-2">Students haven't submitted any essays yet.</p>
                      </div>
                    ) : (
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Student</th>
                            <th className="text-left p-3">Title</th>
                            <th className="text-left p-3">Word Count</th>
                            <th className="text-left p-3">Status</th>
                            <th className="text-left p-3">Score</th>
                            <th className="text-left p-3">Submitted</th>
                            <th className="text-left p-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedData.map((submission: any) => (
                            <tr key={submission.id} className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                <div className="font-medium">{getStudentName(submission.student_id)}</div>
                                <div className="text-sm text-gray-500">{submission.student_id}</div>
                              </td>
                              <td className="p-3 max-w-xs">
                                <div className="font-medium truncate">{submission.title || 'Untitled Essay'}</div>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline">{submission.word_count || 0} words</Badge>
                              </td>
                              <td className="p-3">
                                <Badge variant={submission.status === 'submitted' ? 'default' : 'secondary'}>
                                  {submission.status}
                                </Badge>
                              </td>
                              <td className="p-3">
                                {submission.overall_score > 0 ? (
                                  <Badge variant={
                                    submission.overall_score >= 90 ? 'default' :
                                    submission.overall_score >= 80 ? 'secondary' :
                                    submission.overall_score >= 70 ? 'outline' : 'destructive'
                                  }>
                                    {submission.overall_score}/100
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">Not graded</span>
                                )}
                              </td>
                              <td className="p-3 text-sm text-gray-500">
                                {new Date(submission.created_at).toLocaleDateString()}
                              </td>
                              <td className="p-3">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleViewWritingSubmission(submission)}
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* Collections Manager */}
                {activeTab === 'collections' && (
                  <CollectionManager />
                )}

                {/* Content Hierarchy Manager */}
                {activeTab === 'content-hierarchy' && (
                  <HierarchicalCMS />
                )}
              </div>
            )}

            {/* Pagination Controls */}
            {filteredData.length > itemsPerPage && (
              <div className="flex items-center justify-between mt-4 px-4 py-3 border-t">
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
          <div className="space-y-6">
            <SocketTest />
            <ContentEditor content={null} />
          </div>

        {/* Writing Submission Popup */}
        <WritingSubmissionPopup
          submission={selectedWritingSubmission}
          isOpen={isWritingPopupOpen}
          onClose={handleCloseWritingPopup}
          studentName={selectedWritingSubmission ? getStudentName(selectedWritingSubmission.student_id) : undefined}
          onGradingComplete={handleGradingComplete}
        />

        {/* Medal Result Dialog */}
        <Dialog open={showMedalDialog} onOpenChange={setShowMedalDialog}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto w-full h-full">
            <DialogHeader>
              <DialogTitle>
                Add Medal Result for {selectedStudent?.full_name || selectedStudent?.id}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Select
                    value={medalData.year || ''}
                    onValueChange={(value) => setMedalData({...medalData, year: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="division">Division</Label>
                  <Select
                    value={medalData.division || ''}
                    onValueChange={(value) => setMedalData({...medalData, division: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select division" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Junior">Junior</SelectItem>
                      <SelectItem value="Senior">Senior</SelectItem>
                      <SelectItem value="Skittles">Skittles</SelectItem>
                      <SelectItem value="Lpaca">Lpaca</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="round">Round</Label>
                  <Select
                    value={medalData.round || ''}
                    onValueChange={(value) => setMedalData({...medalData, round: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select round" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Da Nang round">Da Nang round</SelectItem>
                      <SelectItem value="Ho Chi Minh Round">Ho Chi Minh Round</SelectItem>
                      <SelectItem value="custom">Other (Enter manually)</SelectItem>
                    </SelectContent>
                  </Select>
                  {medalData.round === 'custom' && (
                    <Input
                      className="mt-2"
                      placeholder="Enter custom round name"
                      value={medalData.customRound || ''}
                      onChange={(e) => setMedalData({...medalData, customRound: e.target.value})}
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="teamNumber">Team Number</Label>
                  <Input
                    placeholder="e.g. SKT 548, JR 223"
                    value={medalData.teamNumber || ''}
                    onChange={(e) => setMedalData({...medalData, teamNumber: e.target.value})}
                  />
                </div>
              </div>

              {/* Medal Categories */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Medal Categories</h3>
                {(() => {
                  const categories = [
                    'Debate', 'Writing', 'History', 'Science & Technology', 'Art & Music', 
                    'Literature & media', 'Social studies', 'Special Area', 'Individual challenge', 
                    'Individual scholar', 'Team debate', 'Team bowl', 'Team writing', 
                    'Team challenge', 'Overall team', 'Author', 'Top of school', 'Top of country',
                    'Beauty/Flavor', 'League scholar', 'Jack Paar', 'Other'
                  ];
                  
                  const midpoint = Math.ceil(categories.length / 2);
                  const firstRow = categories.slice(0, midpoint);
                  const secondRow = categories.slice(midpoint);
                  
                  const renderCategoryRow = (rowCategories: string[]) => (
                    <div className="grid gap-2 mb-6" style={{ gridTemplateColumns: `repeat(${rowCategories.length}, 1fr)` }}>
                      {rowCategories.map((category) => {
                        const categoryKey = category.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
                        const currentValue = medalData.categories?.[categoryKey] || { type: '', number: '' };
                        
                        return (
                          <div key={category} className="border rounded-lg p-2 min-w-0">
                            <div className="text-center">
                              <Label className="text-xs font-medium block mb-2 truncate" title={category}>
                                {category}
                              </Label>
                              <div className="space-y-1">
                                <div className="flex gap-1 justify-center">
                                  {['G', 'S', 'T'].map((medalType) => (
                                    <Button
                                      key={medalType}
                                      size="sm"
                                      variant={currentValue.type === medalType ? "default" : "outline"}
                                      className="h-6 w-6 p-0 text-xs"
                                      onClick={() => {
                                        const categories = medalData.categories || {};
                                        const newType = currentValue.type === medalType ? '' : medalType;
                                        categories[categoryKey] = { ...currentValue, type: newType };
                                        setMedalData({...medalData, categories});
                                      }}
                                    >
                                      {medalType}
                                    </Button>
                                  ))}
                                </div>
                                <Input
                                  className="w-full h-8 text-center"
                                  placeholder="#"
                                  value={currentValue.number || ''}
                                  onChange={(e) => {
                                    const categories = medalData.categories || {};
                                    categories[categoryKey] = { ...currentValue, number: e.target.value };
                                    setMedalData({...medalData, categories});
                                  }}
                                />
                                <div className="text-xs text-gray-500 h-4">
                                  {currentValue.type && currentValue.type !== 'none' && (
                                    currentValue.number ? 
                                      `${currentValue.type}${currentValue.number}` : 
                                      currentValue.type
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                  
                  return (
                    <div>
                      {renderCategoryRow(firstRow)}
                      {renderCategoryRow(secondRow)}
                    </div>
                  );
                })()}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowMedalDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveMedalResult}
                  disabled={updateMedalResult.isPending}
                >
                  {updateMedalResult.isPending ? 'Saving...' : 'Save Medal Result'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPage;