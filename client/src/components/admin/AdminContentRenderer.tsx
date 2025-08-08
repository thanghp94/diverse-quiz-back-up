import React from 'react';
import { StudentsTable, TopicsTable, ContentTable, GenericTable, WritingSubmissionsTable } from '@/components/admin';
import { ActiveTab, User } from './types';

interface AdminContentRendererProps {
  activeTab: ActiveTab;
  paginatedData: any[];
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editData: any;
  setEditData: (data: any) => void;
  searchTerm: string;
  onSave: () => void;
  onCancel: () => void;
  onShowMedalDialog?: (student: User) => void;
  onWritingSubmissionClick?: (submission: any) => void;
}

export const AdminContentRenderer: React.FC<AdminContentRendererProps> = ({
  activeTab,
  paginatedData,
  editingId,
  setEditingId,
  editData,
  setEditData,
  searchTerm,
  onSave,
  onCancel,
  onShowMedalDialog,
  onWritingSubmissionClick
}) => {
  if (paginatedData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No {activeTab} found
      </div>
    );
  }

  switch (activeTab) {
    case 'students':
      return (
        <StudentsTable 
          students={paginatedData as User[]}
          onShowMedalDialog={onShowMedalDialog}
        />
      );

    case 'topics':
      return (
        <TopicsTable 
          topics={paginatedData}
        />
      );

    case 'content':
      return (
        <ContentTable 
          content={paginatedData}
          editingId={editingId}
          setEditingId={setEditingId}
          editData={editData}
          setEditData={setEditData}
          searchTerm={searchTerm}
          onSave={onSave}
          onCancel={onCancel}
        />
      );

    case 'assignments':
      return (
        <GenericTable 
          data={paginatedData}
          columns={[
            { key: 'assignmentname', label: 'Assignment Name', editable: true, _: '' },
            { key: 'topic', label: 'Topic', editable: true, _: '' },
            { key: 'difficulty', label: 'Difficulty', editable: true, _: '' },
            { key: 'student_id', label: 'Student ID', editable: true, _: '' },
            { key: 'id', label: 'ID', editable: false, _: '' }
          ]}
          searchTerm={searchTerm}
          editingId={editingId}
          setEditingId={setEditingId}
          editData={editData}
          setEditData={setEditData}
          onSave={onSave}
          onCancel={onCancel}
        />
      );

    case 'questions':
      return (
        <GenericTable 
          data={paginatedData}
          columns={[
            { key: 'question', label: 'Question', editable: true, _: '' },
            { key: 'answer', label: 'Answer', editable: true, _: '' },
            { key: 'topic', label: 'Topic', editable: true, _: '' },
            { key: 'difficulty', label: 'Difficulty', editable: true, _: '' },
            { key: 'id', label: 'ID', editable: false, _: '' }
          ]}
          searchTerm={searchTerm}
          editingId={editingId}
          setEditingId={setEditingId}
          editData={editData}
          setEditData={setEditData}
          onSave={onSave}
          onCancel={onCancel}
        />
      );

    case 'matching':
      return (
        <GenericTable 
          data={paginatedData}
          columns={[
            { key: 'type', label: 'Type', editable: false, _: '' },
            { key: 'topic', label: 'Topic', editable: true, _: '' },
            { key: 'difficulty', label: 'Difficulty', editable: true, _: '' },
            { key: 'id', label: 'ID', editable: false, _: '' }
          ]}
          searchTerm={searchTerm}
          editingId={editingId}
          setEditingId={setEditingId}
          editData={editData}
          setEditData={setEditData}
          onSave={onSave}
          onCancel={onCancel}
        />
      );

    case 'writing-submissions':
      return (
        <WritingSubmissionsTable 
          submissions={paginatedData}
        />
      );

    case 'collections':
      return (
        <GenericTable 
          data={paginatedData}
          columns={[
            { key: 'id', label: 'ID', editable: false, _: '' },
            { key: 'name', label: 'Name', editable: false, _: '' },
            { key: 'description', label: 'Description', editable: false, _: '' },
            { key: 'page_route', label: 'Page Route', editable: false, _: '' }
          ]}
          searchTerm={searchTerm}
          editingId={editingId}
          setEditingId={setEditingId}
          editData={editData}
          setEditData={setEditData}
          onSave={onSave}
          onCancel={onCancel}
        />
      );

    default:
      return (
        <div className="text-center py-8 text-gray-500">
          No content available for this tab
        </div>
      );
  }
};