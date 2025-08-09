import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, Edit, Save, X, Trash2, UserPlus, UserMinus, Check, ChevronsUpDown, Search } from 'lucide-react';
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: number;
  name: string;
  code: string;
  year: string;
  round: string;
  active: boolean;
  created_at: string;
  members?: any[];
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  show?: string;
}

// Searchable user combobox component
const UserCombobox: React.FC<{
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  users: User[];
}> = ({ value, onValueChange, placeholder, users }) => {
  const [open, setOpen] = useState(false);
  
  const selectedUser = users.find(user => user.id === value);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedUser 
            ? (selectedUser.full_name || `${selectedUser.first_name} ${selectedUser.last_name}`)
            : placeholder
          }
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search students..." />
          <CommandList>
            <CommandEmpty>No student found.</CommandEmpty>
            <CommandItem
              value="none"
              onSelect={() => {
                onValueChange("none");
                setOpen(false);
              }}
            >
              <Check
                className={`mr-2 h-4 w-4 ${value === "none" ? "opacity-100" : "opacity-0"}`}
              />
              No selection
            </CommandItem>
            {users.map((user) => (
              <CommandItem
                key={user.id}
                value={`${user.full_name || `${user.first_name} ${user.last_name}`} ${user.id}`}
                onSelect={() => {
                  onValueChange(user.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={`mr-2 h-4 w-4 ${value === user.id ? "opacity-100" : "opacity-0"}`}
                />
                {user.full_name || `${user.first_name} ${user.last_name}`} ({user.id})
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export const SimpleTeamManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newTeamName, setNewTeamName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);
  
  // New states for round/year and bulk member addition
  const [selectedRound, setSelectedRound] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(['none', 'none', 'none']);
  const [autoGenerateName, setAutoGenerateName] = useState(true);

  // Fetch teams
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json();
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
    mutationFn: async (teamData: { name: string; year: string; round: string; members?: string[] }) => {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          name: teamData.name,
          year: teamData.year,
          round: teamData.round
        })
      });
      if (!response.ok) throw new Error('Failed to create team');
      const team = await response.json();
      
      // Add members if provided
      if (teamData.members && teamData.members.length > 0) {
        for (const memberId of teamData.members) {
          if (memberId) {
            await fetch(`/api/teams/${team.team_id}/members`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ userId: memberId })
            });
          }
        }
      }
      
      return team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      setNewTeamName('');
      setSelectedMembers(['none', 'none', 'none']);
      setSelectedRound('');
      setSelectedYear('');
      setShowAddForm(false);
      toast({ title: "Success", description: "Team created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create team", variant: "destructive" });
    }
  });

  // Update team mutation
  const updateTeam = useMutation({
    mutationFn: async ({ teamId, name }: { teamId: number; name: string }) => {
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

  // Add user to team mutation
  const addUserToTeam = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: number; userId: string }) => {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId })
      });
      if (!response.ok) throw new Error('Failed to add user to team');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      setSelectedUser('');
      toast({ title: "Success", description: "User added to team successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add user to team", variant: "destructive" });
    }
  });

  // Remove user from team mutation
  const removeUserFromTeam = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: number; userId: string }) => {
      const response = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to remove user from team');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      toast({ title: "Success", description: "User removed from team successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove user from team", variant: "destructive" });
    }
  });

  const generateTeamName = () => {
    if (!selectedRound || !selectedYear) return '';
    
    const validMembers = selectedMembers.filter(id => id && id !== 'none');
    if (validMembers.length === 0) return '';
    
    const memberNames = validMembers.map(id => {
      const user = users.find(u => u.id === id);
      if (!user) return '';
      const fullName = user.full_name || `${user.first_name} ${user.last_name}`;
      const words = fullName.trim().split(' ');
      return words[words.length - 1]; // Last word
    }).filter(name => name);
    
    return `${selectedRound}-${selectedYear}-${memberNames.join(', ')}`;
  };

  const handleCreateTeam = () => {
    const teamName = autoGenerateName ? generateTeamName() : newTeamName.trim();
    const validMembers = selectedMembers.filter(id => id && id !== 'none');
    
    if (!teamName) {
      toast({ title: "Error", description: "Please provide a team name or select members for auto-generation", variant: "destructive" });
      return;
    }
    
    if (!selectedRound || !selectedYear) {
      toast({ title: "Error", description: "Please provide both round and year", variant: "destructive" });
      return;
    }
    
    console.log('Creating team with:', { name: teamName, year: selectedYear, round: selectedRound, members: validMembers });
    
    createTeam.mutate({ 
      name: teamName,
      year: selectedYear,
      round: selectedRound,
      members: validMembers
    });
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

  const handleAddUserToTeam = (teamId: number) => {
    if (selectedUser) {
      addUserToTeam.mutate({ teamId, userId: selectedUser });
    }
  };

  const handleRemoveUserFromTeam = (teamId: number, userId: string) => {
    removeUserFromTeam.mutate({ teamId, userId });
  };

  const toggleTeamExpansion = (teamId: number) => {
    setExpandedTeam(expandedTeam === teamId ? null : teamId);
  };

  const handleMemberChange = (index: number, value: string) => {
    const newMembers = [...selectedMembers];
    newMembers[index] = value === 'none' ? '' : value;
    setSelectedMembers(newMembers);
  };

  if (teamsLoading || usersLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading team management...</p>
      </div>
    );
  }

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
          <CardContent className="pt-0 space-y-4">
            {/* Round and Year Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Round</label>
                <Input
                  placeholder="Enter round (e.g., Rg, Regional, etc.)"
                  value={selectedRound}
                  onChange={(e) => setSelectedRound(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Year</label>
                <Input
                  placeholder="Enter year (e.g., 2025)"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                />
              </div>
            </div>

            {/* Team Members Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Team Members (select up to 3)</label>
              <div className="grid grid-cols-3 gap-4">
                {selectedMembers.map((memberId, index) => (
                  <div key={index}>
                    <UserCombobox
                      value={memberId}
                      onValueChange={(value) => handleMemberChange(index, value)}
                      placeholder={`Select member ${index + 1}...`}
                      users={users?.filter((user: User) => 
                        user.show && user.show.includes('debate') && 
                        (!selectedMembers.includes(user.id) || user.id === memberId)
                      ) || []}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Team Name Options */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoGenerate"
                  checked={autoGenerateName}
                  onChange={(e) => setAutoGenerateName(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="autoGenerate" className="text-sm font-medium">
                  Auto-generate team name
                </label>
              </div>
              
              {autoGenerateName ? (
                <div className="p-3 bg-gray-50 rounded border">
                  <p className="text-sm text-gray-600">Preview:</p>
                  <p className="font-medium">{generateTeamName() || 'Select round, year, and members'}</p>
                </div>
              ) : (
                <Input
                  placeholder="Enter custom team name..."
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateTeam()}
                />
              )}
            </div>

            {/* Create Button */}
            <Button 
              onClick={handleCreateTeam} 
              disabled={createTeam.isPending || (autoGenerateName ? !generateTeamName() : !newTeamName.trim())}
              className="w-full"
            >
              {createTeam.isPending ? 'Creating Team...' : 'Create Team'}
            </Button>
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
                      ID: {team.id}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTeamExpansion(team.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {/* Team Members and User Management */}
              {expandedTeam === team.id && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Add User to Team */}
                    <div className="flex gap-2">
                      <Select value={selectedUser} onValueChange={setSelectedUser}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select user to add..." />
                        </SelectTrigger>
                        <SelectContent>
                          {users.filter((user: User) => !team.members?.find(member => member.id === user.id)).map((user: User) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name || `${user.first_name} ${user.last_name}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={() => handleAddUserToTeam(team.id)}
                        disabled={!selectedUser || addUserToTeam.isPending}
                        size="sm"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </div>

                    {/* Current Team Members */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700">Team Members:</h4>
                      {team.members && team.members.length > 0 ? (
                        <div className="space-y-1">
                          {team.members.map((member: any) => (
                            <div key={member.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <span className="text-sm">{member.full_name || `${member.first_name} ${member.last_name}`}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveUserFromTeam(team.id, member.id)}
                                disabled={removeUserFromTeam.isPending}
                                className="h-6 w-6 p-0"
                              >
                                <UserMinus className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No members assigned</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>


    </div>
  );
};

export default SimpleTeamManagement;