import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Header } from "@/components/shared";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

// Import refactored admin components and hooks
import { 
  getStudentCounts, 
  getFilteredStudents, 
  User as UserType, 
  ActiveTab, 
  buildContentHierarchy, 
  useAdminMutations, 
  useAdminQueries, 
  useAdminHandlers, 
  AdminContent 
} from '@/components/admin';

// Types are now imported from the admin module
type User = UserType;

// Hierarchy components are now imported from the admin module

const AdminPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
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
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editingTeamData, setEditingTeamData] = useState<{name: string}>({name: ''});
  const [newTeamName, setNewTeamName] = useState('');

  // Use extracted hooks
  const {
    reorderTopics,
    createUser,
    createTopic,
    createContent,
    createAssignment,
    createMatching,
    createTeam,
    updateTeam,
    addTeamMember,
    removeTeamMember
  } = useAdminMutations();

  const {
    students,
    studentsLoading,
    topics,
    topicsLoading,
    allTopicsForChallenge,
    content,
    contentLoading,
    questions,
    questionsLoading,
    assignments,
    assignmentsLoading,
    matching,
    matchingLoading,
    writingSubmissions,
    writingSubmissionsLoading,
    allUsers,
    collections,
    collectionsLoading,
    selectedCollectionContent
  } = useAdminQueries(activeTab, selectedCollectionFilter) as {
    students: any[];
    studentsLoading: boolean;
    topics: any[];
    topicsLoading: boolean;
    allTopicsForChallenge: any[];
    content: any[];
    contentLoading: boolean;
    questions: any[];
    questionsLoading: boolean;
    assignments: any[];
    assignmentsLoading: boolean;
    matching: any[];
    matchingLoading: boolean;
    writingSubmissions: any[];
    writingSubmissionsLoading: boolean;
    allUsers: any[];
    collections: any[];
    collectionsLoading: boolean;
    selectedCollectionContent: any[];
  };

  const {
    handleCreate,
    handleAddTeam,
    handleSaveTeamEdit,
    handleCancelTeamEdit,
    handleAddStudentToTeam,
    handleRemoveStudentFromTeam
  } = useAdminHandlers(
    activeTab,
    newItemData,
    students as User[],
    createUser,
    createTopic,
    createContent,
    createAssignment,
    createMatching,
    newTeamName,
    createTeam,
    editingTeam,
    editingTeamData,
    updateTeam,
    toast
  );

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Check admin access
  const isAdmin = user?.id === 'GV0002';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter data based on search
  const getFilteredData = (): any[] => {
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
        const topicsToUse = selectedCollectionFilter === '0xXjizwoLNb98GGWQwQAT' && allTopicsForChallenge
          ? allTopicsForChallenge
          : topics;
        const hierarchyResult = buildContentHierarchy(topicsToUse as any, content as any, selectedCollectionFilter, selectedCollectionContent, selectedYearFilter);
        return Array.isArray(hierarchyResult) ? hierarchyResult : [];
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
      case 'team-management': return false;
      case 'debates': return false;
      default: return false;
    }
  })();

  const filteredData: any[] = getFilteredData();
  const studentCounts = getStudentCounts(students as User[]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData: any[] = filteredData.slice(startIndex, endIndex);

  // Reset current page when switching tabs or searching
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  return (
    <AdminContent
      // State
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      studentFilter={studentFilter}
      setStudentFilter={setStudentFilter}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      selectedCollectionFilter={selectedCollectionFilter}
      setSelectedCollectionFilter={setSelectedCollectionFilter}
      selectedYearFilter={selectedYearFilter}
      setSelectedYearFilter={setSelectedYearFilter}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      editingId={editingId}
      setEditingId={setEditingId}
      editData={editData}
      setEditData={setEditData}
      showAddDialog={showAddDialog}
      setShowAddDialog={setShowAddDialog}
      newItemData={newItemData}
      setNewItemData={setNewItemData}
      selectedWritingSubmission={selectedWritingSubmission}
      setSelectedWritingSubmission={setSelectedWritingSubmission}
      isWritingPopupOpen={isWritingPopupOpen}
      setIsWritingPopupOpen={setIsWritingPopupOpen}
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

      // Data
      isLoading={isLoading}
      filteredData={filteredData as any[]}
      paginatedData={paginatedData as any[]}
      studentCounts={studentCounts}
      collections={collections}
      allUsers={allUsers}
      sensors={sensors}

      // Pagination
      totalPages={totalPages}
      startIndex={startIndex}
      endIndex={endIndex}
      itemsPerPage={itemsPerPage}

      // Mutations
      reorderTopics={reorderTopics}

      // Handlers
      handleCreate={handleCreate}
      onShowMedalDialog={(student: User) => {
        setSelectedStudent(student);
        setShowMedalDialog(true);
      }}
      onWritingSubmissionClick={(submission: any) => {
        setSelectedWritingSubmission(submission);
        setIsWritingPopupOpen(true);
      }}
    />
  );
};

export default AdminPage;