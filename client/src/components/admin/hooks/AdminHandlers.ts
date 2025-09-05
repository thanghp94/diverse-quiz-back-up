import { User } from '../core/types';

export const useAdminHandlers = (
  activeTab: string,
  newItemData: any,
  students: User[],
  createUser: any,
  createTopic: any,
  createContent: any,
  createAssignment: any,
  createMatching: any,
  newTeamName: string,
  createTeam: any,
  editingTeam: string | null,
  editingTeamData: { name: string },
  updateTeam: any,
  toast: any
) => {
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
    // This would need to be handled by the parent component
    // since it modifies state
  };

  const handleAddStudentToTeam = async (teamId: string, userId: string) => {
    // This would need the addTeamMember mutation
  };

  const handleRemoveStudentFromTeam = async (teamId: string, userId: string) => {
    // This would need the removeTeamMember mutation
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

  return {
    handleCreate,
    handleAddTeam,
    handleSaveTeamEdit,
    handleCancelTeamEdit,
    handleAddStudentToTeam,
    handleRemoveStudentFromTeam,
    getTabDisplayName
  };
};
