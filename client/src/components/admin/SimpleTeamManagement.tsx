import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, Edit, Save, X, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  members?: any[];
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
}

export const SimpleTeamManagement: React.FC = () => {
  // Always return visible content first to test rendering
  return (
    <div className="bg-white border-2 border-red-500 p-4 rounded">
      <h3 className="text-lg font-bold text-red-600">SimpleTeamManagement Component is Working!</h3>
      <p>If you can see this, the component is rendering correctly.</p>
      <ActualTeamManagement />
    </div>
  );
};

const ActualTeamManagement: React.FC = () => {
  console.log('ActualTeamManagement component rendering...');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newTeamName, setNewTeamName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Fetch teams
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      console.log('Fetching teams...');
      const response = await fetch('/api/teams', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch teams');
      const data = await response.json();
      console.log('Teams fetched:', data);
      return data;
    }
  });

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  // Create team mutation
  const createTeam = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name })
      });
      if (!response.ok) throw new Error('Failed to create team');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      setNewTeamName('');
      setShowAddForm(false);
      toast({ title: "Success", description: "Team created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create team", variant: "destructive" });
    }
  });

  // Update team mutation
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
      setEditName('');
      toast({ title: "Success", description: "Team updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update team", variant: "destructive" });
    }
  });

  const handleCreateTeam = () => {
    if (newTeamName.trim()) {
      createTeam.mutate(newTeamName.trim());
    }
  };

  const handleUpdateTeam = () => {
    if (editingTeam && editName.trim()) {
      updateTeam.mutate({ teamId: editingTeam, name: editName.trim() });
    }
  };

  const startEdit = (team: Team) => {
    setEditingTeam(team.id);
    setEditName(team.name || '');
  };

  const cancelEdit = () => {
    setEditingTeam(null);
    setEditName('');
  };

  console.log('Loading states:', { teamsLoading, usersLoading });
  console.log('Data:', { teamsCount: teams.length, usersCount: users.length });

  if (teamsLoading || usersLoading) {
    console.log('Showing loading state...');
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading team management...</p>
      </div>
    );
  }

  console.log('Rendering main component...');

  return (
    <div className="space-y-6">
      {/* Header and Add Team */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Management
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              size="sm"
              variant={showAddForm ? "outline" : "default"}
            >
              <Plus className="h-4 w-4 mr-2" />
              {showAddForm ? 'Cancel' : 'Add Team'}
            </Button>
          </CardTitle>
        </CardHeader>
        
        {showAddForm && (
          <CardContent className="pt-0">
            <div className="flex gap-2">
              <Input
                placeholder="Enter team name..."
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateTeam()}
                className="flex-1"
              />
              <Button 
                onClick={handleCreateTeam} 
                disabled={!newTeamName.trim() || createTeam.isPending}
              >
                {createTeam.isPending ? 'Creating...' : 'Create Team'}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Teams List */}
      <div className="space-y-4">
        {teams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Teams Yet</h3>
              <p className="text-gray-600 mb-6">Create your first team to get started.</p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Team
              </Button>
            </CardContent>
          </Card>
        ) : (
          teams.map((team: Team) => (
            <Card key={team.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {editingTeam === team.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 w-48"
                          placeholder="Team name..."
                          onKeyPress={(e) => e.key === 'Enter' && handleUpdateTeam()}
                        />
                        <Button size="sm" onClick={handleUpdateTeam} disabled={updateTeam.isPending}>
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium">
                          {team.name || `Team ${team.id.slice(0, 8)}`}
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(team)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {team.members?.length || 0} members
                    </Badge>
                    <Badge variant="outline">
                      ID: {team.id.slice(0, 8)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {/* Debug Information */}
      <Card>
        <CardContent className="py-4">
          <div className="text-sm text-gray-600">
            <strong>Debug Info:</strong> Teams loaded: {teams.length}, Users loaded: {users.length}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActualTeamManagement;