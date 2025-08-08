import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TeamManagement } from '@/components/admin';
import { UserMinus, UserPlus, Edit, Save, X, Calendar, Users } from 'lucide-react';

interface TeamManagementRendererProps {
  teams: any[];
  availableStudents: any[];
  expandedTeams: Set<string>;
  setExpandedTeams: (teams: Set<string>) => void;
  editingTeam: string | null;
  setEditingTeam: (teamId: string | null) => void;
  editingTeamData: any;
  setEditingTeamData: (data: any) => void;
  handleAddTeam: () => void;
  handleSaveTeamEdit: () => void;
  handleCancelTeamEdit: () => void;
  handleAddStudentToTeam: (teamId: string, studentId: string) => void;
  handleRemoveStudentFromTeam: (teamId: string, studentId: string) => void;
  newTeamName: string;
  setNewTeamName: (name: string) => void;
  showAddTeamForm: boolean;
  setShowAddTeamForm: (show: boolean) => void;
}

export const TeamManagementRenderer: React.FC<TeamManagementRendererProps> = ({
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

  if (teams.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">No teams found</p>
        <Button onClick={() => setShowAddTeamForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Create First Team
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Team Section */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Team Management</h3>
        <Button 
          onClick={() => setShowAddTeamForm(true)} 
          className="bg-green-600 hover:bg-green-700"
          size="sm"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Team
        </Button>
      </div>

      {showAddTeamForm && (
        <Card className="border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-700">Create New Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Team name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleAddTeam}
                disabled={!newTeamName.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create
              </Button>
              <Button 
                onClick={() => setShowAddTeamForm(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teams List */}
      <div className="grid gap-4">
        {teams.map((team: any) => (
          <Card key={team.id} className="border-blue-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => toggleTeamExpansion(team.id)}
                    variant="ghost"
                    size="sm"
                    className="p-1"
                  >
                    {expandedTeams.has(team.id) ? '▼' : '▶'}
                  </Button>
                  
                  {editingTeam === team.id ? (
                    <div className="flex gap-2 items-center">
                      <Input
                        value={editingTeamData.name}
                        onChange={(e) => setEditingTeamData({
                          ...editingTeamData,
                          name: e.target.value
                        })}
                        className="text-lg font-semibold h-8"
                      />
                      <Button
                        onClick={handleSaveTeamEdit}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={handleCancelTeamEdit}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-blue-700">{team.name}</CardTitle>
                      <Button
                        onClick={() => {
                          setEditingTeam(team.id);
                          setEditingTeamData({ name: team.name });
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {team.members?.length || 0} members
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    ID: {team.id}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            {expandedTeams.has(team.id) && (
              <CardContent className="pt-0">
                <div className="text-sm text-gray-600">
                  <p>Team members: {team.members?.join(', ') || 'No members'}</p>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};