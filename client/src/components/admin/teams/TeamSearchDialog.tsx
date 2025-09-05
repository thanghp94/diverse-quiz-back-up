import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Search, Users } from 'lucide-react';

interface Team {
  id: number;
  name: string;
  members: Array<{
    id: string;
    first_name: string;
    last_name: string;
    full_name?: string;
  }>;
  year: string;
  round: string;
}

interface TeamSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number;
  currentUserId?: string;
  onRegistrationSuccess: () => void;
}

export const TeamSearchDialog = ({ 
  isOpen, 
  onClose, 
  sessionId, 
  currentUserId, 
  onRegistrationSuccess 
}: TeamSearchDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Fetch teams
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['/api/teams'],
    enabled: isOpen
  });

  // Filter teams based on search term and current user
  const filteredTeams = teams.filter((team: Team) => {
    if (!searchTerm) return false;
    
    // Search in team name
    if (team.name.toLowerCase().includes(searchTerm.toLowerCase())) return true;
    
    // Search in member names
    return team.members.some((member: any) => {
      const fullName = member.full_name || `${member.first_name} ${member.last_name}`;
      return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             member.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             member.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  // Get user's teams (teams where the current user is a member)
  const userTeams = teams.filter((team: Team) => 
    team.members.some((member: any) => member.id === currentUserId)
  );

  // Register team mutation
  const registerTeam = useMutation({
    mutationFn: async (teamId: number) => {
      const team = teams.find((t: Team) => t.id === teamId);
      let division = '';
      
      // Extract division from team name
      if (team?.name.startsWith('SKT')) division = 'SKT';
      else if (team?.name.startsWith('JR')) division = 'JR';
      else if (team?.name.startsWith('SR')) division = 'SR';

      return apiRequest('/session-registrations', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          team_id: teamId,
          student_id: currentUserId,
          division
        })
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Team registered successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/session-registrations'] });
      onRegistrationSuccess();
      onClose();
      setSearchTerm('');
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to register team",
        variant: "destructive"
      });
    }
  });

  const handleRegister = (teamId: number) => {
    registerTeam.mutate(teamId);
  };

  const getDivisionBadgeColor = (teamName: string) => {
    if (teamName.startsWith('SKT')) return 'bg-green-100 text-green-800';
    if (teamName.startsWith('JR')) return 'bg-blue-100 text-blue-800';  
    if (teamName.startsWith('SR')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getDivision = (teamName: string) => {
    if (teamName.startsWith('SKT')) return 'SKT';
    if (teamName.startsWith('JR')) return 'JR';
    if (teamName.startsWith('SR')) return 'SR';
    return '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Find Your Team to Register
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by your name or team name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Your Teams Section */}
          {currentUserId && userTeams.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Your Teams</h3>
              <div className="space-y-2">
                {userTeams.map((team: Team) => (
                  <div 
                    key={team.id}
                    className="border rounded-lg p-3 bg-blue-50 border-blue-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-xs ${getDivisionBadgeColor(team.name)}`}>
                            {getDivision(team.name)}
                          </Badge>
                          <h4 className="font-medium text-sm">{team.name}</h4>
                        </div>
                        <p className="text-xs text-gray-600">{team.round} - {team.year}</p>
                        <div className="text-xs text-gray-500 mt-1">
                          Members: {team.members.map((m: any) => 
                            m.full_name || `${m.first_name} ${m.last_name}`
                          ).join(', ')}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRegister(team.id)}
                        disabled={registerTeam.isPending}
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        {registerTeam.isPending ? 'Registering...' : 'Register'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchTerm && (
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">
                Search Results {filteredTeams.length > 0 && `(${filteredTeams.length})`}
              </h3>
              
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Searching teams...</div>
              ) : filteredTeams.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No teams found matching "{searchTerm}"
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredTeams.map((team: Team) => (
                    <div 
                      key={team.id}
                      className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-xs ${getDivisionBadgeColor(team.name)}`}>
                              {getDivision(team.name)}
                            </Badge>
                            <h4 className="font-medium text-sm">{team.name}</h4>
                          </div>
                          <p className="text-xs text-gray-600">{team.round} - {team.year}</p>
                          <div className="text-xs text-gray-500 mt-1">
                            Members: {team.members.map((m: any) => 
                              m.full_name || `${m.first_name} ${m.last_name}`
                            ).join(', ')}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleRegister(team.id)}
                          disabled={registerTeam.isPending}
                          variant="outline"
                          size="sm"
                        >
                          {registerTeam.isPending ? 'Registering...' : 'Register'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Help Text */}
          {!searchTerm && userTeams.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Search for your name to find teams you're on</p>
              <p className="text-sm mt-1">Or search by team name</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};