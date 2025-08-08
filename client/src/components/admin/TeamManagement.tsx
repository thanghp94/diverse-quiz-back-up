import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users, User, Calendar, Search, Trophy, Hash, X } from 'lucide-react';
import { User as UserType } from './types';

interface TeamManagementProps {
  selectedRound: string;
  setSelectedRound: (value: string) => void;
  selectedYear: string;
  setSelectedYear: (value: string) => void;
  selectedTeamName: string;
  setSelectedTeamName: (value: string) => void;
  teamSearchTerm: string;
  setTeamSearchTerm: (value: string) => void;
  editingTeamNumber: { [key: string]: string };
  setEditingTeamNumber: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  selectedRound,
  setSelectedRound,
  selectedYear,
  setSelectedYear,
  selectedTeamName,
  setSelectedTeamName,
  teamSearchTerm,
  setTeamSearchTerm,
  editingTeamNumber,
  setEditingTeamNumber
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch team data
  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/teams', selectedRound, selectedYear],
    queryFn: async () => {
      if (!selectedRound || !selectedYear) return [];
      const response = await fetch(`/api/teams/${selectedRound}/${selectedYear}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json();
    },
    enabled: Boolean(selectedRound) && Boolean(selectedYear)
  });

  const { data: roundsYears } = useQuery({
    queryKey: ['/api/teams/rounds-years'],
    queryFn: async () => {
      const response = await fetch('/api/teams/rounds-years', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch rounds and years');
      return response.json();
    }
  });

  // Team assignment mutations
  const assignTeam = useMutation({
    mutationFn: async ({ studentId, teamData }: { studentId: string; teamData: any }) => {
      const response = await fetch(`/api/users/${studentId}/team-assignment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to assign team');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams', selectedRound, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ title: "Success", description: "Student assigned to team successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to assign student to team", variant: "destructive" });
    }
  });

  const removeTeamAssignment = useMutation({
    mutationFn: async ({ studentId, round, year }: { studentId: string; round: string; year: string }) => {
      const response = await fetch(`/api/users/${studentId}/team-assignment/${round}/${year}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to remove team assignment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams', selectedRound, selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ title: "Success", description: "Student removed from team successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove student from team", variant: "destructive" });
    }
  });

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 p-6 rounded-xl text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-white/20 p-3 rounded-full">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Team Management Central</h2>
            <p className="text-emerald-100">Organize students into competition teams with ease</p>
          </div>
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
        
        {/* Team Selection */}
        {selectedRound && selectedYear && (
          <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-700">Team Selection</span>
            </div>
            <div className="flex gap-3 items-center">
              <Select value={selectedTeamName} onValueChange={setSelectedTeamName}>
                <SelectTrigger className="w-48 border-emerald-300 focus:border-emerald-500">
                  <SelectValue placeholder="Choose team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Team A">🔥 Team A</SelectItem>
                  <SelectItem value="Team B">⚡ Team B</SelectItem>
                  <SelectItem value="Team C">🌟 Team C</SelectItem>
                  <SelectItem value="Team D">💎 Team D</SelectItem>
                  <SelectItem value="Team E">🚀 Team E</SelectItem>
                  <SelectItem value="Team F">🎯 Team F</SelectItem>
                  <SelectItem value="JV Team A">🥈 JV Team A</SelectItem>
                  <SelectItem value="JV Team B">🥉 JV Team B</SelectItem>
                  <SelectItem value="Varsity Team">👑 Varsity Team</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex-1">
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Team numbers can be added later during organization registration
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Student Assignment Hub */}
      {selectedRound && selectedYear && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500 p-2 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Student Assignment Hub
                </h3>
                <p className="text-purple-600 text-sm font-medium">
                  {selectedRound} {selectedYear} - Manage team assignments
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                <Input
                  placeholder="Search students by name or ID..."
                  value={teamSearchTerm}
                  onChange={(e) => setTeamSearchTerm(e.target.value)}
                  className="pl-10 w-72 border-purple-300 focus:border-purple-500 bg-white"
                />
              </div>
            </div>
          </div>

          {teamsLoading ? (
            <div className="text-center py-12">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-200">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-purple-600 font-medium">Loading student roster...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {teamsData
                ?.filter((student: any) => 
                  teamSearchTerm === '' || 
                  student.student_name.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
                  student.student_id.toLowerCase().includes(teamSearchTerm.toLowerCase())
                )
                ?.map((student: any) => (
                <div
                  key={student.student_id}
                  className={`relative overflow-hidden rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                    student.team_assignment 
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-300' 
                      : 'bg-white border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      {/* Student Avatar */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                        student.team_assignment ? 'bg-emerald-500' : 'bg-purple-500'
                      }`}>
                        {student.student_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800 text-lg">{student.student_name}</span>
                          <Badge variant="outline" className="text-xs border-gray-400 text-gray-600">
                            {student.student_id}
                          </Badge>
                        </div>
                        {student.team_assignment && (
                          <div className="flex items-center gap-2 mt-1">
                            <Trophy className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm text-emerald-700 font-medium">
                              Member of {student.team_assignment.teamName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {student.team_assignment ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1">
                              🏆 {student.team_assignment.teamName}
                            </Badge>
                            {/* Editable team number with enhanced styling */}
                            <div className="flex items-center gap-1">
                              <Hash className="h-4 w-4 text-gray-500" />
                              <Input
                                placeholder="Team #"
                                value={editingTeamNumber[student.student_id] || student.team_assignment.teamNumber || ''}
                                onChange={(e) => setEditingTeamNumber(prev => ({
                                  ...prev,
                                  [student.student_id]: e.target.value
                                }))}
                                className="w-24 h-8 text-center text-sm border-emerald-300 focus:border-emerald-500"
                                onBlur={() => {
                                  const newNumber = editingTeamNumber[student.student_id];
                                  if (newNumber !== student.team_assignment.teamNumber) {
                                    assignTeam.mutate({
                                      studentId: student.student_id,
                                      teamData: {
                                        round: selectedRound,
                                        year: parseInt(selectedYear),
                                        teamName: student.team_assignment.teamName,
                                        teamNumber: newNumber || null
                                      }
                                    });
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              removeTeamAssignment.mutate({
                                studentId: student.student_id,
                                round: selectedRound,
                                year: selectedYear
                              });
                            }}
                            disabled={removeTeamAssignment.isPending}
                            className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                          >
                            <X className="h-4 w-4" />
                            Remove
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!selectedTeamName) {
                              toast({ 
                                title: "Error", 
                                description: "Please select a team first", 
                                variant: "destructive" 
                              });
                              return;
                            }
                            assignTeam.mutate({
                              studentId: student.student_id,
                              teamData: {
                                round: selectedRound,
                                year: parseInt(selectedYear),
                                teamName: selectedTeamName,
                                teamNumber: null // Can be added later
                              }
                            });
                          }}
                          disabled={assignTeam.isPending || !selectedTeamName}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 shadow-md"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Add to {selectedTeamName || 'Team'}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Team assignment indicator */}
                  {student.team_assignment && (
                    <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-emerald-400"></div>
                  )}
                </div>
              ))}
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