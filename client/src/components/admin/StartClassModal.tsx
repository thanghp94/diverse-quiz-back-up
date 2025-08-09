import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Play, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { ActivitySession } from '@shared/schema';

interface StartClassModalProps {
  session: ActivitySession | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface DebateTopic {
  id: string;
  title: string;
  topicid: string;
}

export const StartClassModal: React.FC<StartClassModalProps> = ({
  session,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [selectedAdjudicator, setSelectedAdjudicator] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [newAdjudicator, setNewAdjudicator] = useState<string>('');
  const [showAddAdjudicator, setShowAddAdjudicator] = useState(false);
  const [affirmativeTeam, setAffirmativeTeam] = useState<string>('');
  const [negativeTeam, setNegativeTeam] = useState<string>('');
  const [adjudicators, setAdjudicators] = useState<string[]>([
    'Ms Angelika',
    'Mr Victor'
  ]);
  const { toast } = useToast();

  // Fetch debate topics
  const { data: debateTopics = [], isLoading: isLoadingTopics } = useQuery({
    queryKey: ['/api/content', 'debate-topics'],
    queryFn: async () => {
      const response = await fetch('/api/content');
      if (!response.ok) throw new Error('Failed to fetch content');
      const content = await response.json();
      return content.filter((item: any) => item.parentid === 'debate') as DebateTopic[];
    }
  });

  // Get confirmed teams from the session
  const confirmedTeams = session?.attendance?.filter(team => team.status === 'confirmed') || [];

  // Start class mutation
  const startClassMutation = useMutation({
    mutationFn: async (data: { adjudicator: string; topic: string; affirmativeTeam: string; negativeTeam: string }) => {
      if (!session?.session_id) throw new Error('No session selected');
      
      const classData = {
        adjudicator: data.adjudicator,
        topic_id: data.topic,
        affirmative_team: data.affirmativeTeam,
        negative_team: data.negativeTeam,
        status: 'in_progress',
        started_at: new Date().toISOString()
      };

      return apiRequest(`/activity-sessions/${session.session_id}/start`, {
        method: 'PATCH',
        body: JSON.stringify({ activities_jsonb: classData })
      });
    },
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: "Class started successfully! Students can now join the debate." 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/debate-sessions'] });
      onSuccess?.();
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to start class",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setSelectedAdjudicator('');
    setSelectedTopic('');
    setNewAdjudicator('');
    setShowAddAdjudicator(false);
    setAffirmativeTeam('');
    setNegativeTeam('');
  };

  const handleAddAdjudicator = () => {
    if (newAdjudicator.trim() && !adjudicators.includes(newAdjudicator.trim())) {
      setAdjudicators(prev => [...prev, newAdjudicator.trim()]);
      setSelectedAdjudicator(newAdjudicator.trim());
      setNewAdjudicator('');
      setShowAddAdjudicator(false);
    }
  };

  const handleStartClass = () => {
    if (!selectedAdjudicator || !selectedTopic || !affirmativeTeam || !negativeTeam) {
      toast({
        title: "Missing Information",
        description: "Please select adjudicator, topic, and assign teams to affirmative and negative sides.",
        variant: "destructive"
      });
      return;
    }

    if (affirmativeTeam === negativeTeam) {
      toast({
        title: "Error",
        description: "Affirmative and negative teams must be different.",
        variant: "destructive"
      });
      return;
    }

    startClassMutation.mutate({
      adjudicator: selectedAdjudicator,
      topic: selectedTopic,
      affirmativeTeam,
      negativeTeam
    });
  };

  const getSessionTimeDisplay = () => {
    if (!session?.start_time || !session?.end_time) return 'Session';
    
    const startTime = new Date(session.start_time).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const endTime = new Date(session.end_time).toLocaleTimeString('en-US', {
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    });
    
    return `${startTime} - ${endTime}`;
  };

  const handleClose = () => {
    if (!startClassMutation.isPending) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-green-600" />
            Start Debate Class
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Session Info */}
          <div className="bg-blue-50 p-3 rounded-lg border">
            <div className="text-sm text-blue-800 font-medium">
              Session: {getSessionTimeDisplay()}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Session ID: {session?.session_id}
            </div>
          </div>

          {/* Adjudicator Selection */}
          <div className="space-y-2">
            <Label htmlFor="adjudicator" className="text-sm font-medium">
              Select Adjudicator
            </Label>
            <div className="flex gap-2">
              <Select value={selectedAdjudicator} onValueChange={setSelectedAdjudicator}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Choose an adjudicator" />
                </SelectTrigger>
                <SelectContent>
                  {adjudicators.map((adj) => (
                    <SelectItem key={adj} value={adj}>
                      {adj}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddAdjudicator(!showAddAdjudicator)}
                className="px-3"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {showAddAdjudicator && (
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add new adjudicator"
                  value={newAdjudicator}
                  onChange={(e) => setNewAdjudicator(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddAdjudicator()}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddAdjudicator}
                  disabled={!newAdjudicator.trim()}
                >
                  Add
                </Button>
              </div>
            )}
          </div>

          {/* Topic Selection */}
          <div className="space-y-2">
            <Label htmlFor="topic" className="text-sm font-medium">
              Select Debate Topic
            </Label>
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a debate topic" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingTopics ? (
                  <SelectItem value="" disabled>Loading topics...</SelectItem>
                ) : debateTopics.length === 0 ? (
                  <SelectItem value="" disabled>No debate topics available</SelectItem>
                ) : (
                  debateTopics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        {topic.title}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Team Assignment */}
          {confirmedTeams.length >= 2 && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Team Assignment</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Affirmative Team */}
                  <div className="space-y-2">
                    <Label htmlFor="affirmative" className="text-sm font-medium text-green-700">
                      Affirmative Team (For)
                    </Label>
                    <Select value={affirmativeTeam} onValueChange={setAffirmativeTeam}>
                      <SelectTrigger className="border-green-300">
                        <SelectValue placeholder="Select affirmative team" />
                      </SelectTrigger>
                      <SelectContent>
                        {confirmedTeams.map((team) => (
                          <SelectItem key={`aff-${team.team_id}`} value={team.team_id.toString()}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              {team.team_name || `Team ${team.team_id}`}
                              {team.division && <span className="text-xs text-gray-500">({team.division})</span>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Negative Team */}
                  <div className="space-y-2">
                    <Label htmlFor="negative" className="text-sm font-medium text-red-700">
                      Negative Team (Against)
                    </Label>
                    <Select value={negativeTeam} onValueChange={setNegativeTeam}>
                      <SelectTrigger className="border-red-300">
                        <SelectValue placeholder="Select negative team" />
                      </SelectTrigger>
                      <SelectContent>
                        {confirmedTeams.map((team) => (
                          <SelectItem key={`neg-${team.team_id}`} value={team.team_id.toString()}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              {team.team_name || `Team ${team.team_id}`}
                              {team.division && <span className="text-xs text-gray-500">({team.division})</span>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mt-2">
                  Confirmed Teams: {confirmedTeams.length} | 
                  Each team will be assigned to argue either for (affirmative) or against (negative) the debate topic.
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={startClassMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleStartClass}
              disabled={startClassMutation.isPending || !selectedAdjudicator || !selectedTopic || !affirmativeTeam || !negativeTeam}
              className="bg-green-600 hover:bg-green-700"
            >
              {startClassMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Class
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};