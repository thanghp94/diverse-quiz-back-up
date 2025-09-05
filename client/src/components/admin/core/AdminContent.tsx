import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User, ActiveTab } from './types';
import { AdminTabs } from './AdminTabs';
import { AdminControls } from './AdminControls';
import { AdminPagination } from './AdminPagination';
import { AdminContentRenderer } from '../content/AdminContentRenderer';
import { ContentHierarchyRenderer } from '../content/ContentHierarchyRenderer';
import { MedalManagement } from '../students/MedalManagement';
import { AddItemDialog } from '../shared/AddItemDialog';
import { SimpleTeamManagement } from '../teams/SimpleTeamManagement';
import { DebateScheduler } from '../debates/DebateScheduler';
import { WritingSubmissionPopup } from "@/components/writing-system";
import { Header } from "@/components/shared";

interface AdminContentProps {
  // State
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  studentFilter: 'all' | 'active' | 'inactive';
  setStudentFilter: (filter: 'all' | 'active' | 'inactive') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCollectionFilter: string;
  setSelectedCollectionFilter: (filter: string) => void;
  selectedYearFilter: string;
  setSelectedYearFilter: (filter: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editData: any;
  setEditData: (data: any) => void;
  showAddDialog: boolean;
  setShowAddDialog: (show: boolean) => void;
  newItemData: any;
  setNewItemData: (data: any) => void;
  selectedWritingSubmission: any;
  setSelectedWritingSubmission: (submission: any) => void;
  isWritingPopupOpen: boolean;
  setIsWritingPopupOpen: (open: boolean) => void;
  showMedalDialog: boolean;
  setShowMedalDialog: (show: boolean) => void;
  selectedStudent: User | null;
  setSelectedStudent: (student: User | null) => void;
  medalData: any;
  setMedalData: (data: any) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  expandedMedalRows: Set<string>;
  setExpandedMedalRows: (rows: Set<string>) => void;

  // Data
  isLoading: boolean;
  filteredData: any[];
  paginatedData: any[];
  studentCounts: any;
  collections: any[];
  allUsers: any[];
  sensors: any;

  // Pagination
  totalPages: number;
  startIndex: number;
  endIndex: number;
  itemsPerPage: number;

  // Mutations
  reorderTopics: any;

  // Handlers
  handleCreate: () => void;
  onShowMedalDialog: (student: User) => void;
  onWritingSubmissionClick: (submission: any) => void;
}

export const AdminContent: React.FC<AdminContentProps> = ({
  activeTab,
  setActiveTab,
  studentFilter,
  setStudentFilter,
  searchTerm,
  setSearchTerm,
  selectedCollectionFilter,
  setSelectedCollectionFilter,
  selectedYearFilter,
  setSelectedYearFilter,
  currentPage,
  setCurrentPage,
  editingId,
  setEditingId,
  editData,
  setEditData,
  showAddDialog,
  setShowAddDialog,
  newItemData,
  setNewItemData,
  selectedWritingSubmission,
  setSelectedWritingSubmission,
  isWritingPopupOpen,
  setIsWritingPopupOpen,
  showMedalDialog,
  setShowMedalDialog,
  selectedStudent,
  setSelectedStudent,
  medalData,
  setMedalData,
  selectedCategories,
  setSelectedCategories,
  expandedMedalRows,
  setExpandedMedalRows,
  isLoading,
  filteredData,
  paginatedData,
  studentCounts,
  collections,
  allUsers,
  sensors,
  totalPages,
  startIndex,
  endIndex,
  itemsPerPage,
  reorderTopics,
  handleCreate,
  onShowMedalDialog,
  onWritingSubmissionClick
}) => {
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
                {activeTab === 'team' && (
                  <SimpleTeamManagement />
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
                {!['content-hierarchy', 'team', 'debates'].includes(activeTab) && (
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
                    onShowMedalDialog={onShowMedalDialog}
                    onWritingSubmissionClick={onWritingSubmissionClick}
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
