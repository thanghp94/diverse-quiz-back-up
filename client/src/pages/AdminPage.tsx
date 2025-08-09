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
import { Search, Edit, Save, X, Users, BookOpen, FileText, HelpCircle, Target, Plus, ChevronLeft, ChevronRight, PenTool, ClipboardList, Calendar, User, Hash, TreePine, GripVertical, Layers, Award, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { ContentEditor } from "@/components/content";
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

// Import refactored admin components
import { TeamManagement, MedalManagement, HierarchyNode, SortableTopic, getStudentCounts, getFilteredStudents, User as UserType, ActiveTab, StudentsTable, TopicsTable, ContentTable, GenericTable, buildContentHierarchy, AddItemForms, WritingSubmissionsTable, DebateScheduler, AdminControls, AdminTabs, AdminPagination, AddItemDialog, AdminContentRenderer, ContentHierarchyRenderer, TeamManagementRenderer } from '@/components/admin';
import { SimpleTeamManagement } from '@/components/admin/SimpleTeamManagement';

// Types are now imported from the admin module
type User = UserType;

// Hierarchy components are now imported from the admin module

const AdminPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Define reorder mutations
  const reorderTopics = useMutation({
    mutationFn: async (reorderData: Array<{ id: string; position: number }>) => {
      const response = await fetch('/api/topics/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items: reorderData })
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

  const reorderContent = useMutation({
    mutationFn: async (reorderData: Array<{ id: string; position: number }>) => {
      const response = await fetch('/api/content/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items: reorderData })
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

  const createUser = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData)
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
        credentials: 'include',
        body: JSON.stringify(topicData)
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
        credentials: 'include',
        body: JSON.stringify(contentData)
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

  const createAssignment = useMutation({
    mutationFn: async (assignmentData: any) => {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(assignmentData)
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

  const createMatching = useMutation({
    mutationFn: async (matchingData: any) => {
      const response = await fetch('/api/matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(matchingData)
      });
      if (!response.ok) throw new Error('Failed to create matching');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/matching'] });
      setShowAddDialog(false);
      setNewItemData({});
      toast({ title: "Success", description: "Matching created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create matching", variant: "destructive" });
    }
  });

  // Team Management Mutations
  const createTeam = useMutation({
    mutationFn: async (teamName: string) => {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: teamName })
      });
      if (!response.ok) throw new Error('Failed to create team');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      setNewTeamName('');
      setShowAddTeamForm(false);
      toast({ title: "Success", description: "Team created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create team", variant: "destructive" });
    }
  });

  const updateTeam = useMutation({
    mutationFn: async ({ teamId, name }: { teamId: string; name: string }) => {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name })
      });
      if (!response.ok) throw new Error('Failed to update team');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      setEditingTeam(null);
      setEditingTeamData({ name: '' });
      toast({ title: "Success", description: "Team updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update team", variant: "destructive" });
    }
  });

  const deleteTeam = useMutation({
    mutationFn: async (teamId: string) => {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete team');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      toast({ title: "Success", description: "Team deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete team", variant: "destructive" });
    }
  });

  const addTeamMember = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId })
      });
      if (!response.ok) throw new Error('Failed to add team member');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      toast({ title: "Success", description: "Team member added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add team member", variant: "destructive" });
    }
  });

  const removeTeamMember = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      const response = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to remove team member');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      toast({ title: "Success", description: "Team member removed successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove team member", variant: "destructive" });
    }
  });

  // Team Management Handler Functions
  const handleAddTeam = async () => {
    if (newTeamName.trim()) {
      createTeam.mutate(newTeamName);
    }
  };

  const handleSaveTeamEdit = async () => {
    if (editingTeam && editingTeamData.name.trim()) {
      updateTeam.mutate({ teamId: editingTeam, name: editingTeamData.name });
    }
  };

  const handleCancelTeamEdit = () => {
    setEditingTeam(null);
    setEditingTeamData({ name: '' });
  };

  const handleAddStudentToTeam = async (teamId: string, userId: string) => {
    addTeamMember.mutate({ teamId, userId });
  };

  const handleRemoveStudentFromTeam = async (teamId: string, userId: string) => {
    removeTeamMember.mutate({ teamId, userId });
  };

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
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
  const [showMedalDialog, setShowMedalDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [medalData, setMedalData] = useState<any>({});
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [expandedMedalRows, setExpandedMedalRows] = useState<Set<string>>(new Set());
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [teamSearchTerm, setTeamSearchTerm] = useState<string>('');
  
  // New Team Management State for database-driven teams
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editingTeamData, setEditingTeamData] = useState<{name: string}>({name: ''});
  const [newTeamName, setNewTeamName] = useState('');
  const [showAddTeamForm, setShowAddTeamForm] = useState(false);

  // Fetch data based on active tab
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: activeTab === 'students'
  });

  // Fetch teams data for team management
  const { data: teamsManagement, isLoading: teamsManagementLoading } = useQuery({
    queryKey: ['/api/teams'],
    enabled: activeTab === 'team-management'
  });

  // Fetch students data for team management
  const { data: studentsForTeams, isLoading: studentsForTeamsLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: activeTab === 'team-management'
  });

  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: ['/api/topics'],
    enabled: activeTab === 'topics' || activeTab === 'content-hierarchy'
  });

  // Fetch all topics specifically for Challenge Subject collection
  const { data: allTopicsForChallenge, isLoading: allTopicsLoading } = useQuery({
    queryKey: ['/api/topics/all'],
    queryFn: async () => {
      const response = await fetch('/api/topics', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch all topics');
      return response.json();
    },
    enabled: activeTab === 'content-hierarchy' && selectedCollectionFilter === '0xXjizwoLNb98GGWQwQAT'
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

  const { data: writingSubmissions, isLoading: writingSubmissionsLoading, error: writingSubmissionsError } = useQuery({
    queryKey: ['/api/writing-submissions/all'],
    queryFn: async () => {
      console.log('Fetching writing submissions...');
      const response = await fetch('/api/writing-submissions/all', {
        credentials: 'include'
      });
      console.log('Response status:', response.status, response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        console.error('Response not ok:', response.status, response.statusText);
        throw new Error(`Failed to fetch writing submissions: ${response.status}`);
      }
      
      const text = await response.text();
      console.log('Raw response text (first 200 chars):', text.substring(0, 200));
      
      try {
        const data = JSON.parse(text);
        console.log('Parsed JSON data:', data?.length ? `${data.length} items` : data);
        return data;
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text:', text);
        throw new Error('Failed to parse JSON response');
      }
    },
    enabled: activeTab === 'writing-submissions'
  });
  
  // Debug logging for writingSubmissions query
  React.useEffect(() => {
    if (activeTab === 'writing-submissions') {
      console.log('Writing submissions query state:', { 
        data: writingSubmissions, 
        loading: writingSubmissionsLoading, 
        error: writingSubmissionsError 
      });
    }
  }, [writingSubmissions, writingSubmissionsLoading, writingSubmissionsError, activeTab]);

  const { data: allUsers } = useQuery({
    queryKey: ['/api/users'],
    enabled: activeTab === 'writing-submissions'
  });

  const { data: collections, isLoading: collectionsLoading } = useQuery({
    queryKey: ['/api/collections'],
    enabled: activeTab === 'collections' || activeTab === 'content-hierarchy'
  });



  const { data: roundsYears } = useQuery({
    queryKey: ['/api/teams/rounds-years'],
    queryFn: async () => {
      const response = await fetch('/api/teams/rounds-years', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch rounds and years');
      return response.json();
    },
    enabled: activeTab === 'team'
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

  // Filter data based on search using extracted function
  const getFilteredData = () => {
    const term = searchTerm.toLowerCase();
    switch (activeTab) {
      case 'students':
        return getFilteredStudents(students as User[], studentFilter, term);
      case 'topics':
        return (topics as any[])?.filter(t => 
          t.topic?.toLowerCase().includes(term) ||
          t.id?.toLowerCase().includes(term)
        ) || [];
      case 'content':
        return (content as any[])?.filter(c => 
          c.title?.toLowerCase().includes(term) ||
          c.short_blurb?.toLowerCase().includes(term) ||
          c.id?.toLowerCase().includes(term)
        ) || [];
      case 'assignments':
        return (assignments as any[])?.filter(a => 
          a.title?.toLowerCase().includes(term) ||
          a.description?.toLowerCase().includes(term) ||
          a.id?.toLowerCase().includes(term)
        ) || [];
      case 'questions':
        return (questions as any[])?.filter(q => 
          q.question?.toLowerCase().includes(term) ||
          q.correct_answer?.toLowerCase().includes(term) ||
          q.id?.toLowerCase().includes(term)
        ) || [];
      case 'matching':
        return (matching as any[])?.filter(m => 
          m.title?.toLowerCase().includes(term) ||
          m.description?.toLowerCase().includes(term) ||
          m.id?.toLowerCase().includes(term)
        ) || [];
      case 'writing-submissions':
        return (writingSubmissions as any[])?.filter(w => 
          getStudentName(w.userid)?.toLowerCase().includes(term) ||
          w.type?.toLowerCase().includes(term) ||
          w.title?.toLowerCase().includes(term) ||
          w.status?.toLowerCase().includes(term)
        ) || [];
      case 'content-hierarchy':
        // Use all topics for Challenge Subject collection to ensure full challengesubject filtering
        const topicsToUse = selectedCollectionFilter === '0xXjizwoLNb98GGWQwQAT' && allTopicsForChallenge 
          ? allTopicsForChallenge 
          : topics;
        return buildContentHierarchy(topicsToUse as any, content as any, selectedCollectionFilter, selectedCollectionContent, selectedYearFilter);
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

  // Helper function for tab display names
  const getTabDisplayName = () => {
    switch (activeTab) {
      case 'students': return 'Student';
      case 'topics': return 'Topic';
      case 'content': return 'Content';
      case 'assignments': return 'Assignment';
      case 'questions': return 'Question';
      case 'matching': return 'Matching';
      case 'collections': return 'Collection';
      default: return 'Item';
    }
  };

  // Determine loading state based on active tab
  const isLoading = (() => {
    switch (activeTab) {
      case 'students': return studentsLoading;
      case 'topics': return topicsLoading;
      case 'content': return contentLoading;
      case 'questions': return questionsLoading;
      case 'assignments': return assignmentsLoading;
      case 'matching': return matchingLoading;
      case 'writing-submissions': return writingSubmissionsLoading;
      case 'collections': return collectionsLoading;
      case 'content-hierarchy': return topicsLoading || contentLoading || collectionsLoading;
      case 'team-management': return false; // Handle loading within the component
      case 'debates': return false;
      default: return false;
    }
  })();
  const filteredData = getFilteredData();
  const studentCounts = getStudentCounts(students as User[]);

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
      <div className="container mx-auto px-2 py-2">
        {/* Tab Navigation */}
        <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Controls Section - Using new AdminControls component */}
        <AdminControls
          activeTab={activeTab}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          studentFilter={studentFilter}
          setStudentFilter={setStudentFilter}
          studentCounts={studentCounts}
          selectedCollectionFilter={selectedCollectionFilter}
          setSelectedCollectionFilter={setSelectedCollectionFilter}
          selectedYearFilter={selectedYearFilter}
          setSelectedYearFilter={setSelectedYearFilter}
          collections={collections || []}
          onAddNew={() => setShowAddDialog(true)}
        />

        {/* Main Content */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <>
                {/* Team Management */}
                {activeTab === 'team-management' && (
                  <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Team Management</h2>
                    <p className="text-gray-600 mb-4">Active tab: {activeTab}</p>
                    <SimpleTeamManagement />
                  </div>
                )}

                {/* Debate Scheduler */}
                {activeTab === 'debates' && (
                  <DebateScheduler />
                )}

                {/* Content Hierarchy */}
                {activeTab === 'content-hierarchy' && (
                  <ContentHierarchyRenderer
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedCollectionFilter={selectedCollectionFilter}
                    setSelectedCollectionFilter={setSelectedCollectionFilter}
                    selectedYearFilter={selectedYearFilter}
                    setSelectedYearFilter={setSelectedYearFilter}
                    collections={collections || []}
                    filteredData={filteredData}
                    sensors={sensors}
                    reorderTopics={reorderTopics}
                  />
                )}

                {/* All other tabs using unified AdminContentRenderer */}
                {!['content-hierarchy', 'team', 'debates', 'team-management'].includes(activeTab) && (
                  <AdminContentRenderer
                    activeTab={activeTab}
                    paginatedData={paginatedData}
                    editingId={editingId}
                    setEditingId={setEditingId}
                    editData={editData}
                    setEditData={setEditData}
                    searchTerm={searchTerm}
                    onSave={() => {}}
                    onCancel={() => {}}
                    onShowMedalDialog={(student: User) => {
                      setSelectedStudent(student);
                      setShowMedalDialog(true);
                    }}
                    onWritingSubmissionClick={(submission) => {
                      setSelectedWritingSubmission(submission);
                      setIsWritingPopupOpen(true);
                    }}
                    expandedMedalRows={expandedMedalRows}
                    setExpandedMedalRows={setExpandedMedalRows}
                    allUsers={allUsers as any}
                  />
                )}
              </>
            )}

            {/* Pagination */}
            {!['content-hierarchy', 'team', 'debates', 'team-management'].includes(activeTab) && (
              <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                startIndex={startIndex}
                endIndex={endIndex}
                totalItems={filteredData.length}
                onPageChange={setCurrentPage}
              />
            )}
          </CardContent>
        </Card>

        {/* Medal Management Dialog */}
        <MedalManagement 
          showMedalDialog={showMedalDialog}
          setShowMedalDialog={setShowMedalDialog}
          selectedStudent={selectedStudent}
          setSelectedStudent={setSelectedStudent}
          medalData={medalData}
          setMedalData={setMedalData}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          expandedMedalRows={expandedMedalRows}
          setExpandedMedalRows={setExpandedMedalRows}
        />

        {/* Writing Submission Popup */}
        {isWritingPopupOpen && selectedWritingSubmission && (
          <WritingSubmissionPopup 
            submission={selectedWritingSubmission}
            isOpen={isWritingPopupOpen}
            onClose={() => setIsWritingPopupOpen(false)}
            onGradingComplete={() => setIsWritingPopupOpen(false)}
          />
        )}

        {/* Add Item Dialog */}
        <AddItemDialog
          activeTab={activeTab}
          showAddDialog={showAddDialog}
          setShowAddDialog={setShowAddDialog}
          newItemData={newItemData}
          setNewItemData={setNewItemData}
          onCreate={handleCreate}
        />
      </div>
    </div>
  );
};

export default AdminPage;