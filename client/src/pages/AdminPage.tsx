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
import { TeamManagement, MedalManagement, HierarchyNode, SortableTopic, getStudentCounts, getFilteredStudents, User as UserType, ActiveTab, StudentsTable, TopicsTable, ContentTable, GenericTable, buildContentHierarchy, AddItemForms, WritingSubmissionsTable } from '@/components/admin';

// Types are now imported from the admin module
type User = UserType;

// Hierarchy components are now imported from the admin module

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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [expandedMedalRows, setExpandedMedalRows] = useState<Set<string>>(new Set());
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [teamSearchTerm, setTeamSearchTerm] = useState<string>('');
  const [selectedTeamName, setSelectedTeamName] = useState<string>('');
  const [editingTeamNumber, setEditingTeamNumber] = useState<{ [key: string]: string }>({});

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

  const { data: writingSubmissions, isLoading: writingSubmissionsLoading, error: writingSubmissionsError } = useQuery({
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

  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/teams', selectedRound, selectedYear],
    queryFn: async () => {
      if (!selectedRound || !selectedYear) return [];
      const response = await fetch(`/api/teams/${selectedRound}/${selectedYear}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json();
    },
    enabled: activeTab === 'team' && Boolean(selectedRound) && Boolean(selectedYear)
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
        return getFilteredStudents(students as User[], term, studentFilter);
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
        return buildContentHierarchy(topics, content, selectedCollectionFilter, selectedCollectionContent);
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

  const tabs = [
    { id: 'students', label: 'Students', icon: Users, color: 'bg-blue-500' },
    { id: 'topics', label: 'Topics', icon: BookOpen, color: 'bg-green-500' },
    { id: 'content', label: 'Content', icon: FileText, color: 'bg-purple-500' },
    { id: 'content-hierarchy', label: 'Content Hierarchy', icon: TreePine, color: 'bg-amber-500' },
    { id: 'collections', label: 'Collections', icon: Layers, color: 'bg-cyan-500' },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList, color: 'bg-teal-500' },
    { id: 'questions', label: 'Questions', icon: HelpCircle, color: 'bg-orange-500' },
    { id: 'matching', label: 'Matching', icon: Target, color: 'bg-red-500' },
    { id: 'writing-submissions', label: 'Writing Submissions', icon: PenTool, color: 'bg-indigo-500' },
    { id: 'team', label: 'Team Management', icon: Users, color: 'bg-emerald-500' }
  ];

  const isLoading = studentsLoading || topicsLoading || contentLoading || assignmentsLoading || questionsLoading || matchingLoading || writingSubmissionsLoading || collectionsLoading || (activeTab === 'team' && teamsLoading);
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
        <div className="flex flex-wrap gap-2 mb-2">
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
        <div className="mb-2">
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
          <div className="mb-2">
            <div className="flex gap-2">
              <Button
                variant={studentFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStudentFilter('all')}
                className="flex items-center gap-2"
              >
                All Students
                <Badge variant="secondary" className="ml-1">
                  {studentCounts.total}
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

        {/* Add Button */}
        {activeTab !== 'content-hierarchy' && activeTab !== 'writing-submissions' && activeTab !== 'collections' && activeTab !== 'team' && (
          <div className="mb-2">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}</DialogTitle>
                </DialogHeader>
                <AddItemForms 
                  activeTab={activeTab}
                  newItemData={newItemData}
                  setNewItemData={setNewItemData}
                />
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleCreate}>
                    Create
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setShowAddDialog(false);
                    setNewItemData({});
                  }}>
                    Cancel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {tabs.find(t => t.id === activeTab)?.icon && (
                React.createElement(tabs.find(t => t.id === activeTab)!.icon, { className: "h-5 w-5" })
              )}
              {tabs.find(t => t.id === activeTab)?.label}
              {activeTab !== 'team' && !isLoading && (
                <Badge variant="secondary" className="ml-auto">
                  {filteredData.length} items
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <>
                {/* Team Management */}
                {activeTab === 'team' && (
                  <TeamManagement
                    selectedRound={selectedRound}
                    setSelectedRound={setSelectedRound}
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                    selectedTeamName={selectedTeamName}
                    setSelectedTeamName={setSelectedTeamName}
                    teamSearchTerm={teamSearchTerm}
                    setTeamSearchTerm={setTeamSearchTerm}
                    editingTeamNumber={editingTeamNumber}
                    setEditingTeamNumber={setEditingTeamNumber}
                    teamsData={teamsData}
                    roundsYears={roundsYears}
                    teamsLoading={teamsLoading}
                    students={students as User[]}
                  />
                )}

                {/* Content Hierarchy */}
                {activeTab === 'content-hierarchy' && (
                  <div className="space-y-4">
                    {/* Collection Filter */}
                    <div className="flex items-center gap-4">
                      <Label>Filter by Collection:</Label>
                      <Select value={selectedCollectionFilter} onValueChange={setSelectedCollectionFilter}>
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Select collection..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Content</SelectItem>
                          {(collections as any[])?.map((collection) => (
                            <SelectItem key={collection.id} value={collection.id}>
                              {collection.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {filteredData.length > 0 ? (
                      <DndContext 
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event: DragEndEvent) => {
                          const { active, over } = event;
                          if (active.id !== over?.id && over) {
                            // Handle reordering logic here
                          }
                        }}
                      >
                        <SortableContext
                          items={(filteredData as any[]).map(topic => topic.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {(filteredData as any[]).map((rootTopic: any) => (
                              <SortableTopic
                                key={rootTopic.id} 
                                node={rootTopic} 
                                level={0} 
                                onContentReorder={() => {}}
                                onTopicReorder={() => {}}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        {selectedCollectionFilter !== 'all' ? 
                          'No content found in selected collection' : 
                          'No content hierarchy available'
                        }
                      </div>
                    )}
                  </div>
                )}

                {/* Other tabs - using extracted table components */}
                {activeTab === 'students' && (
                  <StudentsTable 
                    students={students as User[]}
                    studentFilter={studentFilter}
                    searchTerm={searchTerm}
                    editingId={editingId}
                    setEditingId={setEditingId}
                    editData={editData}
                    setEditData={setEditData}
                    expandedMedalRows={expandedMedalRows}
                    setExpandedMedalRows={setExpandedMedalRows}
                    onAddMedalResult={(student: User) => {
                      setSelectedStudent(student);
                      setShowMedalDialog(true);
                    }}
                  />
                )}

                {activeTab === 'topics' && (
                  <TopicsTable 
                    topics={filteredData as any[]}
                    searchTerm={searchTerm}
                    editingId={editingId}
                    setEditingId={setEditingId}
                    editData={editData}
                    setEditData={setEditData}
                  />
                )}

                {activeTab === 'content' && (
                  <ContentTable 
                    content={filteredData as any[]}
                    searchTerm={searchTerm}
                    editingId={editingId}
                    setEditingId={setEditingId}
                    editData={editData}
                    setEditData={setEditData}
                    onSave={() => {}}
                    onCancel={() => {}}
                  />
                )}

                {/* Generic tables for other data types */}
                {(activeTab === 'assignments' || activeTab === 'questions' || activeTab === 'matching') && (
                  <GenericTable 
                    data={filteredData}
                    columns={[
                      { key: 'id', label: 'ID', editable: false },
                      { key: 'title', label: 'Title', editable: true },
                      { key: 'description', label: 'Description', editable: true }
                    ]}
                    searchTerm={searchTerm}
                    editingId={editingId}
                    setEditingId={setEditingId}
                    editData={editData}
                    setEditData={setEditData}
                    onSave={() => {}}
                    onCancel={() => {}}
                  />
                )}

                {/* Writing Submissions Table */}
                {activeTab === 'writing-submissions' && (
                  <WritingSubmissionsTable 
                    submissions={writingSubmissions}
                    searchTerm={searchTerm}
                    allUsers={allUsers}
                    onViewSubmission={(submission) => {
                      setSelectedWritingSubmission(submission);
                      setIsWritingPopupOpen(true);
                    }}
                  />
                )}

                {/* Collections table */}
                {activeTab === 'collections' && filteredData.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No data found
                  </div>
                )}
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && activeTab !== 'content-hierarchy' && activeTab !== 'team' && (
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} items
                </div>
              </div>
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
      </div>
    </div>
  );
};

export default AdminPage;