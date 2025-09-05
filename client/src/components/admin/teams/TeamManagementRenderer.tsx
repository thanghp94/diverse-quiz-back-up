import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, Edit, Save, X, Plus, Users, Trash2 } from 'lucide-react';
import type { User } from '@shared/schema';
import type { Team, TeamMember } from './types';

interface TeamManagementRendererProps {
  teams: Team[];
  availableStudents: User[];
  expandedTeams: Set<string>;
  setExpandedTeams: React.Dispatch<React.SetStateAction<Set<string>>>;
  editingTeam: string | null;
  setEditingTeam: React.Dispatch<React.SetStateAction<string | null>>;
  editingTeamData: { name: string };
  setEditingTeamData: React.Dispatch<React.SetStateAction<{ name: string }>>;
  handleAddTeam: () => Promise<void>;
  handleSaveTeamEdit: () => Promise<void>;
  handleCancelTeamEdit: () => void;
  handleAddStudentToTeam: (teamId: string, userId: string) => Promise<void>;
  handleRemoveStudentFromTeam: (teamId: string, userId: string) => Promise<void>;
  newTeamName: string;
  setNewTeamName: React.Dispatch<React.SetStateAction<string>>;
  showAddTeamForm: boolean;
  setShowAddTeamForm: React.Dispatch<React.SetStateAction<boolean>>;
}

const TeamManagementRenderer: React.FC<TeamManagementRendererProps> = ({
  teams,
  availableStudents,
  expandedTeams,
  setExpandedTeams,
  editingTeam,
  setEditingTeam,
  editingTeamData,
  setEditingTeamData,
  handleAddTeam,
  handleSaveTeamEdit,
  handleCancelTeamEdit,
  handleAddStudentToTeam,
  handleRemoveStudentFromTeam,
  newTeamName,
  setNewTeamName,
  showAddTeamForm,
  setShowAddTeamForm
}) => {
  const toggleTeamExpansion = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  const startEditing = (team: Team) => {
    setEditingTeam(team.id);
    setEditingTeamData({ name: team.name || '' });
  };

  const getAvailableStudentsForTeam = (teamId: string) => {
    const teamMembers = teams.find(t => t.id === teamId)?.members || [];
    const memberIds = teamMembers.map((m: TeamMember) => m.userId);
    return availableStudents.filter(student => !memberIds.includes(student.id));
  };

  const getTeamMembers = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team?.members) return [];
    
    return team.members.map((member: TeamMember) => {
      const student = availableStudents.find(s => s.id === member.userId);
      return student ? { ...student, membershipId: member.id } : null;
    }).filter(Boolean);
  };

  return (
    <div className="space-y-6">
      {/* Add Team Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Management
            </span>
            <Button
              onClick={() => setShowAddTeamForm(!showAddTeamForm)}
              size="sm"
              variant={showAddTeamForm ? "outline" : "default"}
            >
              <Plus className="h-4 w-4 mr-2" />
              {showAddTeamForm ? 'Cancel' : 'Add Team'}
            </Button>
          </CardTitle>
        </CardHeader>
        {showAddTeamForm && (
          <CardContent className="pt-0">
            <div className="flex gap-2">
              <Input
                placeholder="Enter team name..."
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTeam()}
                className="flex-1"
              />
              <Button onClick={handleAddTeam} disabled={!newTeamName.trim()}>
                Create Team
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
              <p className="text-gray-600 mb-6">Create your first team to get started with team management.</p>
              <Button onClick={() => setShowAddTeamForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Team
              </Button>
            </CardContent>
          </Card>
        ) : (
          teams.map((team) => {
            const isExpanded = expandedTeams.has(team.id);
            const isEditing = editingTeam === team.id;
            const teamMembers = getTeamMembers(team.id);
            const availableStudentsForTeam = getAvailableStudentsForTeam(team.id);

            return (
              <Card key={team.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTeamExpansion(team.id)}
                        className="h-8 w-8 p-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingTeamData.name}
                            onChange={(e) => setEditingTeamData({ name: e.target.value })}
                            className="h-8 w-48"
                            placeholder="Team name..."
                          />
                          <Button size="sm" onClick={handleSaveTeamEdit}>
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelTeamEdit}>
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
                            onClick={() => startEditing(team)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
                      </Badge>
                      <Badge variant="outline">
                        ID: {team.id.slice(0, 8)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Current Members */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Current Members</h4>
                        {teamMembers.length === 0 ? (
                          <p className="text-sm text-gray-500 py-2">No members assigned to this team yet.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {teamMembers.map((member: any) => (
                              <div
                                key={member.membershipId}
                                className="flex items-center justify-between p-2 border rounded-lg bg-gray-50"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-medium text-blue-800">
                                      {member.first_name?.[0]}{member.last_name?.[0]}
                                    </span>
                                  </div>
                                  <span className="text-sm font-medium">
                                    {member.first_name} {member.last_name}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveStudentFromTeam(team.id, member.id)}
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Add Member */}
                      {availableStudentsForTeam.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Member</h4>
                          <Select onValueChange={(userId) => handleAddStudentToTeam(team.id, userId)}>
                            <SelectTrigger className="w-64">
                              <SelectValue placeholder="Select a student to add..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableStudentsForTeam.map((student) => (
                                <SelectItem key={student.id} value={student.id}>
                                  {student.first_name} {student.last_name} ({student.id})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {availableStudentsForTeam.length === 0 && teamMembers.length > 0 && (
                        <p className="text-sm text-gray-500">All available students have been assigned to teams.</p>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TeamManagementRenderer;
export { TeamManagementRenderer };