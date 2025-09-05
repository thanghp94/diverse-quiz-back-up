// Core Admin Infrastructure
export * from './core/types';
export * from './core/utils';
export * from './core/AdminContent';
export * from './core/AdminTabs';
export * from './core/AdminTabNavigation';
export * from './core/AdminControls';
export * from './core/AdminPagination';

// Data Management Hooks
export * from './hooks/AdminQueries';
export * from './hooks/AdminMutations';
export * from './hooks/AdminHandlers';

// Student Management
export * from './students/StudentsTable';
export * from './students/MedalManagement';

// Content Management
export * from './content/ContentTable';
export * from './content/TopicsTable';
export * from './content/ContentHierarchy';
export * from './content/ContentHierarchyRenderer';
export * from './content/HierarchyComponents';
export * from './content/AdminContentRenderer';

// Team Management
export * from './teams/TeamManagement';
export * from './teams/SimpleTeamManagement';
export * from './teams/TeamManagementRenderer';
export * from './teams/TeamSearchDialog';

// Debate System
export * from './debates/DebateScheduler';
export * from './debates/DebateSlotDisplay';
export * from './debates/DebateEvaluationModal';
export * from './debates/DebateResultsModal';
export * from './debates/StartClassModal';

// Writing System
export * from './writing/WritingSubmissionsTable';

// Shared Components
export * from './shared/GenericTable';
export * from './shared/AddItemDialog';
export * from './shared/AddItemForms';

// Re-export specific components with default exports
export { default as TeamManagementRenderer } from './teams/TeamManagementRenderer';
