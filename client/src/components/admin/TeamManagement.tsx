import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users, User, Calendar, Search, Trophy, Hash, X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { User as UserType } from './types';

interface Team {
  id: string;
  members: string[];
  year: string;
  round: string;
}

interface TeamManagementProps {
  selectedRound: string;
  setSelectedRound: (value: string) => void;
  selectedYear: string;
  setSelectedYear: (value: string) => void;
  teamSearchTerm: string;
  setTeamSearchTerm: (value: string) => void;
  students: UserType[];
  teamsData: any[];
  teamsLoading: boolean;
  roundsYears: any[];
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  selectedRound,
  setSelectedRound,
  selectedYear,
  setSelectedYear,
  teamSearchTerm,
  setTeamSearchTerm,
  students,
  teamsData,
  teamsLoading,
  roundsYears
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Modal and team creation state
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeams, setNewTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team>({
    id: '',
    members: [],
    year: selectedYear,
    round: selectedRound
  });

  // Generate unique team ID
  const generateTeamId = () => {
    const existingIds = [...newTeams.map(t => t.id), ...(teamsData || []).map(t => t.team_assignment?.teamName || '')].filter(Boolean);
    let counter = 1;
    let teamId = `Team ${counter}`;
    while (existingIds.includes(teamId)) {
      counter++;
      teamId = `Team ${counter}`;
    }
    return teamId;
  };

  // Check for duplicate teams (same members in same round)
  const isDuplicateTeam = (members: string[], excludeTeamId?: string) => {
    const sortedMembers = [...members].sort();
    
    // Check against existing teams in newTeams
    const duplicateInNew = newTeams.some(team => {
      if (excludeTeamId && team.id === excludeTeamId) return false;
      const sortedTeamMembers = [...team.members].sort();
      return team.year === currentTeam.year && 
             team.round === currentTeam.round &&
             sortedTeamMembers.length === sortedMembers.length &&
             sortedTeamMembers.every((member, index) => member === sortedMembers[index]);
    });
    
    // Check against existing teams in database
    const existingTeamMembers = new Map();
    (teamsData || []).forEach(student => {
      if (student.team_assignment && 
          student.team_assignment.year.toString() === currentTeam.year &&
          student.team_assignment.round === currentTeam.round) {
        const teamName = student.team_assignment.teamName;
        if (!existingTeamMembers.has(teamName)) {
          existingTeamMembers.set(teamName, []);
        }
        existingTeamMembers.get(teamName).push(student.student_id);
      }
    });
    
    const duplicateInExisting = Array.from(existingTeamMembers.values()).some(teamMembers => {
      const sortedExistingMembers = [...teamMembers].sort();
      return sortedExistingMembers.length === sortedMembers.length &&
             sortedExistingMembers.every((member, index) => member === sortedMembers[index]);
    });
    
    return duplicateInNew || duplicateInExisting;
  };

  // Add current team to batch
  const addTeamToBatch = () => {
    if (currentTeam.members.length < 2) {
      toast({ title: "Error", description: "Team must have at least 2 members", variant: "destructive" });
      return;
    }
    
    if (isDuplicateTeam(currentTeam.members)) {
      toast({ title: "Error", description: "A team with the same members already exists for this round", variant: "destructive" });
      return;
    }
    
    const teamWithId = {
      ...currentTeam,
      id: generateTeamId()
    };
    
    setNewTeams([...newTeams, teamWithId]);
    setCurrentTeam({
      id: '',
      members: [],
      year: currentTeam.year,
      round: currentTeam.round
    });
    
    toast({ title: "Success", description: `${teamWithId.id} added to batch` });
  };

  // Remove team from batch
  const removeTeamFromBatch = (teamId: string) => {
    setNewTeams(newTeams.filter(team => team.id !== teamId));
  };

  // Get available students (not yet assigned to teams in this round)
  const getAvailableStudents = () => {
    const assignedStudentIds = new Set();
    
    // Add currently assigned students from database
    (teamsData || []).forEach(student => {
      if (student.team_assignment && 
          student.team_assignment.year.toString() === currentTeam.year &&
          student.team_assignment.round === currentTeam.round) {
        assignedStudentIds.add(student.student_id);
      }
    });
    
    // Add students from current batch
    newTeams.forEach(team => {
      if (team.year === currentTeam.year && team.round === currentTeam.round) {
        team.members.forEach(member => assignedStudentIds.add(member));
      }
    });
    
    // Add students from current team being created
    currentTeam.members.forEach(member => assignedStudentIds.add(member));
    
    return (students || []).filter(student => 
      !assignedStudentIds.has(student.id) &&
      (teamSearchTerm === '' || 
      student.full_name?.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
      student.id.toLowerCase().includes(teamSearchTerm.toLowerCase()))
    );
  };

  // Batch team creation mutation
  const createTeamsBatch = useMutation({
    mutationFn: async (teams: Team[]) => {
      const promises = teams.map(async team => {
        // Create team assignments for each member
        const memberPromises = team.members.map(async studentId => {
          const response = await fetch(`/api/users/${studentId}/team-assignment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              round: team.round,
              year: parseInt(team.year),
              teamName: team.id,
              teamNumber: null
            }),
            credentials: 'include'
          });
          if (!response.ok) throw new Error(`Failed to assign ${studentId} to ${team.id}`);
          return response.json();
        });
        
        return Promise.all(memberPromises);
      });
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams', selectedRound, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setNewTeams([]);
      setCurrentTeam({ id: '', members: [], year: selectedYear, round: selectedRound });
      setShowCreateTeamModal(false);
      toast({ title: "Success", description: `${newTeams.length} teams created successfully` });
    },
    onError: (error) => {
      toast({ title: "Error", description: `Failed to create teams: ${error.message}`, variant: "destructive" });
    }
  });

  return (
    <div className="space-y-6">
      {/* Header with Create Team Button */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 p-6 rounded-xl text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Team Management Central</h2>
              <p className="text-emerald-100">Organize students into competition teams with ease</p>
            </div>
          </div>
          
          <Dialog open={showCreateTeamModal} onOpenChange={setShowCreateTeamModal}>
            <DialogTrigger asChild>
              <Button className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold px-6">
                <Plus className="h-5 w-5 mr-2" />
                Create Teams
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Teams - Batch Mode</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Competition Settings */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Year</Label>
                    <Select value={currentTeam.year} onValueChange={(value) => setCurrentTeam({...currentTeam, year: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Round</Label>
                    <Select value={currentTeam.round} onValueChange={(value) => setCurrentTeam({...currentTeam, round: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select round" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regionals">Regionals</SelectItem>
                        <SelectItem value="state">State Championship</SelectItem>
                        <SelectItem value="nationals">Nationals</SelectItem>
                        <SelectItem value="invitationals">Invitationals</SelectItem>
                        <SelectItem value="practice">Practice Round</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Current Team Creation */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Create New Team</h3>
                  
                  {/* Student Search */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search available students..."
                        value={teamSearchTerm}
                        onChange={(e) => setTeamSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  {/* Selected Members */}
                  <div className="mb-4">
                    <Label className="mb-2 block">Selected Members ({currentTeam.members.length}/3)</Label>
                    <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded bg-gray-50">
                      {currentTeam.members.map(studentId => {
                        const student = (students || []).find(s => s.id === studentId);
                        return (
                          <Badge key={studentId} variant="secondary" className="px-3 py-1">
                            {student?.full_name || studentId}
                            <X 
                              className="h-3 w-3 ml-2 cursor-pointer" 
                              onClick={() => setCurrentTeam({
                                ...currentTeam,
                                members: currentTeam.members.filter(id => id !== studentId)
                              })}
                            />
                          </Badge>
                        );
                      })}
                      {currentTeam.members.length === 0 && (
                        <span className="text-gray-500 text-sm">Select students to add to team</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Available Students */}
                  <div className="mb-4">
                    <Label className="mb-2 block">Available Students</Label>
                    <div className="max-h-60 overflow-y-auto border rounded">
                      {getAvailableStudents().map(student => (
                        <div 
                          key={student.id} 
                          className="flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0"
                        >
                          <div>
                            <span className="font-medium">{student.full_name}</span>
                            <Badge variant="outline" className="ml-2 text-xs">{student.id}</Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={currentTeam.members.length >= 3}
                            onClick={() => {
                              if (currentTeam.members.length < 3) {
                                setCurrentTeam({
                                  ...currentTeam,
                                  members: [...currentTeam.members, student.id]
                                });
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      ))}
                      {getAvailableStudents().length === 0 && (
                        <div className="p-4 text-center text-gray-500">
                          No available students found
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Duplicate Warning */}
                  {currentTeam.members.length >= 2 && isDuplicateTeam(currentTeam.members) && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded mb-4">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-red-700 text-sm">A team with the same members already exists for this round</span>
                    </div>
                  )}
                  
                  <Button 
                    onClick={addTeamToBatch}
                    disabled={currentTeam.members.length < 2 || !currentTeam.year || !currentTeam.round}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Team to Batch
                  </Button>
                </div>
                
                {/* Teams in Batch */}
                {newTeams.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Teams to Create ({newTeams.length})</h3>
                    <div className="space-y-2">
                      {newTeams.map(team => (
                        <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">{team.id}</span>
                            <div className="text-sm text-gray-600">
                              {team.members.map(memberId => {
                                const student = (students || []).find(s => s.id === memberId);
                                return student?.full_name || memberId;
                              }).join(', ')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {team.round} {team.year}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeTeamFromBatch(team.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button 
                        onClick={() => createTeamsBatch.mutate(newTeams)}
                        disabled={createTeamsBatch.isPending}
                        className="flex-1"
                      >
                        {createTeamsBatch.isPending ? 'Creating...' : `Create ${newTeams.length} Teams`}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setNewTeams([])}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Statistics Cards */}
        {teamsData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5" />
                <span className="text-sm font-medium">Total Students</span>
              </div>
              <div className="text-2xl font-bold">{teamsData?.length || 0}</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-5 w-5" />
                <span className="text-sm font-medium">Assigned</span>
              </div>
              <div className="text-2xl font-bold">
                {teamsData?.filter((s: any) => s.team_assignment).length || 0}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5" />
                <span className="text-sm font-medium">Teams</span>
              </div>
              <div className="text-2xl font-bold">
                {new Set(teamsData?.filter((s: any) => s.team_assignment)?.map((s: any) => s.team_assignment.teamName)).size || 0}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5" />
                <span className="text-sm font-medium">Round</span>
              </div>
              <div className="text-lg font-bold">{selectedRound || 'None'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Competition Setup */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-500 p-2 rounded-lg">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Competition Setup</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="year-select" className="text-sm font-semibold text-gray-700 mb-2 block">
              🏆 Competition Year
            </Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="year-select" className="bg-white border-blue-300 focus:border-blue-500">
                <SelectValue placeholder="Select competition year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024 Season</SelectItem>
                <SelectItem value="2025">2025 Season</SelectItem>
                <SelectItem value="2026">2026 Season</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="round-select" className="text-sm font-semibold text-gray-700 mb-2 block">
              🎯 Round/Competition
            </Label>
            <Select value={selectedRound} onValueChange={setSelectedRound}>
              <SelectTrigger id="round-select" className="bg-white border-blue-300 focus:border-blue-500">
                <SelectValue placeholder="Select competition round" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regionals">🏅 Regionals</SelectItem>
                <SelectItem value="state">🥇 State Championship</SelectItem>
                <SelectItem value="nationals">🏆 Nationals</SelectItem>
                <SelectItem value="invitationals">⭐ Invitationals</SelectItem>
                <SelectItem value="practice">🎯 Practice Round</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Current Teams Display */}
      {selectedRound && selectedYear && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500 p-2 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Current Teams
                </h3>
                <p className="text-purple-600 text-sm font-medium">
                  {selectedRound} {selectedYear} - View team assignments
                </p>
              </div>
            </div>
          </div>

          {teamsLoading ? (
            <div className="text-center py-12">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-200">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-purple-600 font-medium">Loading teams...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Group students by teams */}
              {Object.entries(
                teamsData
                  ?.filter((s: any) => s.team_assignment)
                  ?.reduce((teams: any, student: any) => {
                    const teamName = student.team_assignment.teamName;
                    if (!teams[teamName]) teams[teamName] = [];
                    teams[teamName].push(student);
                    return teams;
                  }, {}) || {}
              ).map(([teamName, members]: [string, any]) => (
                <Card key={teamName} className="p-4 bg-gradient-to-br from-white to-purple-50 border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="h-5 w-5 text-purple-600" />
                    <span className="font-bold text-gray-800">{teamName}</span>
                    <Badge className="bg-purple-100 text-purple-700">{members.length} members</Badge>
                  </div>
                  <div className="space-y-2">
                    {members.map((student: any) => (
                      <div key={student.student_id} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div>
                          <span className="font-medium text-sm">{student.student_name}</span>
                          <Badge variant="outline" className="ml-2 text-xs">{student.student_id}</Badge>
                        </div>
                        {student.team_assignment?.teamNumber && (
                          <Badge variant="secondary" className="text-xs">
                            #{student.team_assignment.teamNumber}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
              
              {/* No teams message */}
              {Object.keys(
                teamsData
                  ?.filter((s: any) => s.team_assignment)
                  ?.reduce((teams: any, student: any) => {
                    const teamName = student.team_assignment.teamName;
                    if (!teams[teamName]) teams[teamName] = [];
                    teams[teamName].push(student);
                    return teams;
                  }, {}) || {}
              ).length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-200">
                    <Users className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">No Teams Created</h4>
                    <p className="text-gray-500 mb-4">Use the "Create Teams" button to start building teams for this competition.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Historical Team Overview */}
      {roundsYears && roundsYears.length > 0 && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-yellow-500 p-2 rounded-lg">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Competition History</h3>
              <p className="text-yellow-600 text-sm font-medium">
                View and manage past team assignments
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {roundsYears.map((item: any) => (
              <Card 
                key={`${item.round}-${item.year}`} 
                className="group relative overflow-hidden border-2 border-yellow-200 hover:border-yellow-400 transition-all duration-200 hover:shadow-lg bg-gradient-to-br from-white to-yellow-50"
              >
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-yellow-100 p-2 rounded-lg group-hover:bg-yellow-200 transition-colors">
                      <Calendar className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-800 text-lg">{item.round}</span>
                      <div className="text-sm text-yellow-600 font-medium">{item.year} Season</div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedRound(item.round);
                      setSelectedYear(item.year.toString());
                    }}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium shadow-md transition-all duration-200"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    View Teams
                  </Button>
                </div>
                
                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-0 h-0 border-l-[15px] border-l-transparent border-t-[15px] border-t-yellow-400 opacity-50"></div>
              </Card>
            ))}
          </div>
          
          {/* Empty state */}
          {roundsYears.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-yellow-200">
                <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-700 mb-2">No Competition History</h4>
                <p className="text-gray-500">Start by creating your first team assignment above!</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};