import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export const useAdminMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  return {
    reorderTopics,
    reorderContent,
    createUser,
    createTopic,
    createContent,
    createAssignment,
    createMatching,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember
  };
};
