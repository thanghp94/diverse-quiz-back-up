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
  
  // Filter states
  const [filterRound, setFilterRound] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState<string>('');
  
  // New states for round/year and bulk member addition
  const [selectedRound, setSelectedRound] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(['none', 'none', 'none']);
  const [autoGenerateName, setAutoGenerateName] = useState(true);
  const [customRound, setCustomRound] = useState('');
  const [customYear, setCustomYear] = useState('');

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

  // Extract rounds and years directly from teams data
  const availableOptions = {
    rounds: [...new Set(teams?.map((team: Team) => team.round).filter(Boolean) || [])].sort(),
    years: [...new Set(teams?.map((team: Team) => team.year).filter(Boolean) || [])].sort((a, b) => parseInt(b) - parseInt(a))
  };

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
      queryClient.invalidateQueries({ queryKey: ['/api/teams/rounds-years'] });
      setNewTeamName('');
      setSelectedMembers(['none', 'none', 'none']);
      setSelectedRound('');
      setSelectedYear('');
      setCustomRound('');
      setCustomYear('');
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
    onSuccess: async (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      
      // Update team name after adding member
      await updateTeamNameFromMembers(teamId);
      
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
    onSuccess: async (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      
      // Update team name after removing member
      await updateTeamNameFromMembers(teamId);
      
      toast({ title: "Success", description: "User removed from team successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove user from team", variant: "destructive" });
    }
  });

  // Delete team mutation
  const deleteTeam = useMutation({
    mutationFn: async (teamId: number) => {
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

  const generateTeamName = () => {
    const finalRound = selectedRound === 'custom' ? customRound : selectedRound;
    const finalYear = selectedYear === 'custom' ? customYear : selectedYear;
    if (!finalRound || !finalYear) return '';
    
    const validMembers = selectedMembers.filter(id => id && id !== 'none');
    if (validMembers.length === 0) return '';
    
    const memberNames = validMembers.map(id => {
      const user = users.find((u: User) => u.id === id);
      if (!user) return '';
      const fullName = user.full_name || `${user.first_name} ${user.last_name}`;
      const words = fullName.trim().split(' ');
      return words[words.length - 1]; // Last word
    }).filter(name => name);
    
    // Process round name for abbreviations
    let processedRound = finalRound;
    
    // Replace common round names with abbreviations
    if (processedRound.toLowerCase().includes('regional')) {
      processedRound = processedRound.replace(/regional/gi, 'Rg');
    }
    if (processedRound.toLowerCase().includes('global')) {
      processedRound = processedRound.replace(/global/gi, 'Gl');
    }
    if (processedRound.toLowerCase().includes('tournament of champion')) {
      processedRound = processedRound.replace(/tournament of champion/gi, 'TOC');
    }
    
    // Extract location from round name (everything before the round type)
    const roundParts = processedRound.split(/\s+(Rg|Gl|TOC|Regional|Global)\s*/i);
    const location = roundParts[0]?.trim() || '';
    const roundType = processedRound.match(/(Rg|Gl|TOC|Regional|Global)/i)?.[0] || processedRound;
    
    // Format: "Tommy, Elliot, Mailie-Da Nang Rg-25"
    const shortYear = finalYear.slice(-2); // Get last 2 digits of year
    
    if (location && location !== roundType) {
      return `${memberNames.join(', ')}-${location} ${roundType}-${shortYear}`;
    } else {
      return `${memberNames.join(', ')}-${roundType}-${shortYear}`;
    }
  };

  // Generate team name from existing team members
  const generateTeamNameFromMembers = (team: Team) => {
    if (!team.members || team.members.length === 0) return team.name;
    
    const memberNames = team.members.map((member: any) => {
      const fullName = member.full_name || `${member.first_name} ${member.last_name}`;
      const words = fullName.trim().split(' ');
      return words[words.length - 1]; // Last word (last name)
    }).filter(name => name);
    
    // Process round name for abbreviations
    let processedRound = team.round;
    
    // Replace common round names with abbreviations
    if (processedRound.toLowerCase().includes('regional')) {
      processedRound = processedRound.replace(/regional/gi, 'Rg');
    }
    if (processedRound.toLowerCase().includes('global')) {
      processedRound = processedRound.replace(/global/gi, 'Gl');
    }
    if (processedRound.toLowerCase().includes('tournament of champion')) {
      processedRound = processedRound.replace(/tournament of champion/gi, 'TOC');
    }
    
    // Extract location from round name (everything before the round type)
    const roundParts = processedRound.split(/\s+(Rg|Gl|TOC|Regional|Global)\s*/i);
    const location = roundParts[0]?.trim() || '';
    const roundType = processedRound.match(/(Rg|Gl|TOC|Regional|Global)/i)?.[0] || processedRound;
    
    // Format: "Tommy, Elliot, Mailie-Da Nang Rg-25"
    const shortYear = team.year.slice(-2); // Get last 2 digits of year
    
    if (location && location !== roundType) {
      return `${memberNames.join(', ')}-${location} ${roundType}-${shortYear}`;
    } else {
      return `${memberNames.join(', ')}-${roundType}-${shortYear}`;
    }
  };

  // Update team name based on current members
  const updateTeamNameFromMembers = async (teamId: number) => {
    try {
      // Refresh teams data and wait for it
      await queryClient.refetchQueries({ queryKey: ['/api/teams'] });
      
      // Get updated team data
      const updatedTeams = queryClient.getQueryData(['/api/teams']) as Team[] || [];
      const team = updatedTeams.find(t => t.id === teamId);
      
      if (team) {
        const newName = generateTeamNameFromMembers(team);
        
        // Only update if name is different
        if (newName !== team.name) {
          await updateTeam.mutateAsync({ teamId, name: newName });
        }
      }
    } catch (error) {
      console.error('Error updating team name:', error);
    }
  };

  const handleCreateTeam = () => {
    const teamName = autoGenerateName ? generateTeamName() : newTeamName.trim();
    const validMembers = selectedMembers.filter(id => id && id !== 'none');
    const finalRound = selectedRound === 'custom' ? customRound : selectedRound;
    const finalYear = selectedYear === 'custom' ? customYear : selectedYear;
    
    if (!teamName) {
      toast({ title: "Error", description: "Please provide a team name or select members for auto-generation", variant: "destructive" });
      return;
    }
    
    if (!finalRound || !finalYear) {
      toast({ title: "Error", description: "Please provide both round and year", variant: "destructive" });
      return;
    }
    
    console.log('Creating team with:', { name: teamName, year: finalYear, round: finalRound, members: validMembers });
    
    createTeam.mutate({ 
      name: teamName,
      year: finalYear,
      round: finalRound,
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

  const handleAddUserToTeam = (teamId: number, userId?: string) => {
    const userToAdd = userId || selectedUser;
    if (userToAdd) {
      addUserToTeam.mutate({ teamId, userId: userToAdd });
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

  // Filter teams based on selected filters
  const filteredTeams = teams.filter((team: Team) => {
    const matchesRound = !filterRound || filterRound === 'all' || team.round?.toLowerCase().includes(filterRound.toLowerCase());
    const matchesYear = !filterYear || filterYear === 'all' || team.year?.includes(filterYear);
    return matchesRound && matchesYear;
  });

  // Filter users based on search
  const filteredUsers = users.filter((user: User) => {
    if (!studentSearch) return true;
    const fullName = user.full_name || `${user.first_name} ${user.last_name}`;
    return fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
           user.id.toLowerCase().includes(studentSearch.toLowerCase());
  });

  const handleAddFormToggle = () => {
    if (!showAddForm) {
      // Prepopulate round and year from filters when opening form
      setSelectedRound(filterRound && filterRound !== 'all' ? filterRound : '');
      setSelectedYear(filterYear && filterYear !== 'all' ? filterYear : '');
      setSelectedMembers(['none', 'none', 'none']);
      setNewTeamName('');
      setCustomRound('');
      setCustomYear('');
    }
    setShowAddForm(!showAddForm);
  };

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Student Search */}
            <div>
              <label className="block text-sm font-medium mb-1">Search Students</label>
              <Input
                placeholder="Search by name or ID..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full h-9"
              />
            </div>
            
            {/* Round Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Filter by Round</label>
              <Select value={filterRound} onValueChange={setFilterRound}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All rounds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All rounds</SelectItem>
                  {availableOptions?.rounds?.map((round: string) => (
                    <SelectItem key={round} value={round}>
                      {round}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Year Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Filter by Year</label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {availableOptions?.years?.map((year: string) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Add Team Button */}
            <div className="flex items-end">
              <Button
                onClick={handleAddFormToggle}
                size="sm"
                variant={showAddForm ? "outline" : "default"}
                className="h-9 w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {showAddForm ? 'Cancel' : 'Add Team'}
              </Button>
            </div>
          </div>
          
          {/* Active Filters Display */}
          {((filterRound && filterRound !== 'all') || (filterYear && filterYear !== 'all') || studentSearch) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filterRound && filterRound !== 'all' && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setFilterRound('all')}>
                  Round: {filterRound} ×
                </Badge>
              )}
              {filterYear && filterYear !== 'all' && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setFilterYear('all')}>
                  Year: {filterYear} ×
                </Badge>
              )}
              {studentSearch && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setStudentSearch('')}>
                  Search: {studentSearch} ×
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterRound('all');
                  setFilterYear('all');
                  setStudentSearch('');
                }}
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Team Form */}
      {showAddForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            {/* Round and Year Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Round</label>
                {selectedRound === 'custom' ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Enter custom round name"
                      value={customRound}
                      onChange={(e) => setCustomRound(e.target.value)}
                      autoFocus
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRound('');
                        setCustomRound('');
                      }}
                    >
                      Back to selection
                    </Button>
                  </div>
                ) : (
                  <Select value={selectedRound} onValueChange={setSelectedRound}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select or enter round..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Enter custom round...</SelectItem>
                      {availableOptions?.rounds?.map((round: string) => (
                        <SelectItem key={round} value={round}>
                          {round}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Year</label>
                {selectedYear === 'custom' ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Enter custom year"
                      value={customYear}
                      onChange={(e) => setCustomYear(e.target.value)}
                      autoFocus
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedYear('');
                        setCustomYear('');
                      }}
                    >
                      Back to selection
                    </Button>
                  </div>
                ) : (
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select or enter year..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Enter custom year...</SelectItem>
                      {availableOptions?.years?.map((year: string) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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
                      users={filteredUsers?.filter((user: User) => 
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
        </Card>
      )}

      {/* Teams List */}
      <div className="space-y-4">
        {filteredTeams.length === 0 ? (
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
          filteredTeams.map((team: Team) => (
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
                          {team.name || `Team ${String(team.id).slice(0, 8)}`}
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(team)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTeam.mutate(team.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
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
              
              {/* Team Editing Form */}
              {expandedTeam === team.id && (
                <CardContent className="pt-0 space-y-4">
                  {/* Team Info Editing */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Round</label>
                      <Input
                        value={team.round || ''}
                        onChange={(e) => {
                          // Handle round change - you can add mutation here if needed
                        }}
                        placeholder="Team round..."
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Year</label>
                      <Input
                        value={team.year || ''}
                        onChange={(e) => {
                          // Handle year change - you can add mutation here if needed
                        }}
                        placeholder="Team year..."
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Team Name Editing */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Team Name</label>
                    {editingTeam === team.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleUpdateTeam()}
                          placeholder="Enter team name..."
                          className="flex-1"
                        />
                        <Button size="sm" onClick={handleUpdateTeam} disabled={updateTeam.isPending}>
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={team.name || ''}
                          readOnly
                          className="flex-1 bg-gray-50"
                        />
                        <Button size="sm" onClick={() => startEdit(team)}>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Team Members Management - Using UserCombobox like Add Form */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Team Members (select up to 3)</label>
                    <div className="grid grid-cols-3 gap-4">
                      {Array.from({ length: 3 }).map((_, index) => {
                        const member = team.members?.[index];
                        const memberId = member?.id || '';
                        
                        return (
                          <div key={index}>
                            <UserCombobox
                              value={memberId}
                              onValueChange={(value) => {
                                if (value && value !== memberId) {
                                  // Add new member
                                  handleAddUserToTeam(team.id, value);
                                } else if (!value && memberId) {
                                  // Remove existing member
                                  handleRemoveUserFromTeam(team.id, memberId);
                                }
                              }}
                              placeholder={`Select member ${index + 1}...`}
                              users={filteredUsers?.filter((user: User) => 
                                user.show && user.show.includes('debate') && 
                                (!team.members?.find(m => m.id === user.id) || user.id === memberId)
                              ) || []}
                            />
                          </div>
                        );
                      })}
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