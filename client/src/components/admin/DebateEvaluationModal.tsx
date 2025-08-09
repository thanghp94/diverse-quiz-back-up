import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trophy, Users, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface TeamRegistration {
  team_id: number;
  team_name: string;
  division: string;
  status: string;
}

interface DebateSession {
  session_id: number;
  activities_jsonb: {
    adjudicator: string;
    topic_id: string;
    affirmative_team: string;
    negative_team: string;
  };
}

interface SpeakerEvaluation {
  speaker_id: string;
  speaker_name: string;
  strategy: number;
  content: number;
  presentation: number;
  comments: string;
}

interface TeamEvaluation {
  team_id: number;
  teamwork: number;
  feedback: number;
  best_speaker_id: string;
  comments: string;
}

interface DebateEvaluationData {
  affirmative_evaluations: SpeakerEvaluation[];
  negative_evaluations: SpeakerEvaluation[];
  affirmative_team_eval: TeamEvaluation;
  negative_team_eval: TeamEvaluation;
  winning_team: 'affirmative' | 'negative';
  overall_comments: string;
}

interface DebateEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: DebateSession;
  affirmativeTeam: TeamRegistration;
  negativeTeam: TeamRegistration;
}

const RATING_OPTIONS = [
  { value: 1, label: '1 - Poor' },
  { value: 2, label: '2 - Below Average' },
  { value: 3, label: '3 - Average' },
  { value: 4, label: '4 - Good' },
  { value: 5, label: '5 - Excellent' }
];

export const DebateEvaluationModal = ({
  isOpen,
  onClose,
  session,
  affirmativeTeam,
  negativeTeam
}: DebateEvaluationModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock speakers data - in real app, this would come from team members API
  const affirmativeSpeakers = [
    { id: `${affirmativeTeam.team_id}_1`, name: 'Speaker 1' },
    { id: `${affirmativeTeam.team_id}_2`, name: 'Speaker 2' },
    { id: `${affirmativeTeam.team_id}_3`, name: 'Speaker 3' }
  ];

  const negativeSpeakers = [
    { id: `${negativeTeam.team_id}_1`, name: 'Speaker 1' },
    { id: `${negativeTeam.team_id}_2`, name: 'Speaker 2' },
    { id: `${negativeTeam.team_id}_3`, name: 'Speaker 3' }
  ];

  const [affirmativeEvals, setAffirmativeEvals] = useState<SpeakerEvaluation[]>(
    affirmativeSpeakers.map(speaker => ({
      speaker_id: speaker.id,
      speaker_name: speaker.name,
      strategy: 0,
      content: 0,
      presentation: 0,
      comments: ''
    }))
  );

  const [negativeEvals, setNegativeEvals] = useState<SpeakerEvaluation[]>(
    negativeSpeakers.map(speaker => ({
      speaker_id: speaker.id,
      speaker_name: speaker.name,
      strategy: 0,
      content: 0,
      presentation: 0,
      comments: ''
    }))
  );

  const [affirmativeTeamEval, setAffirmativeTeamEval] = useState<TeamEvaluation>({
    team_id: affirmativeTeam.team_id,
    teamwork: 0,
    feedback: 0,
    best_speaker_id: '',
    comments: ''
  });

  const [negativeTeamEval, setNegativeTeamEval] = useState<TeamEvaluation>({
    team_id: negativeTeam.team_id,
    teamwork: 0,
    feedback: 0,
    best_speaker_id: '',
    comments: ''
  });

  const [winningTeam, setWinningTeam] = useState<'affirmative' | 'negative' | ''>('');
  const [overallComments, setOverallComments] = useState('');

  const saveEvaluationMutation = useMutation({
    mutationFn: (data: DebateEvaluationData) =>
      apiRequest(`/api/activity-sessions/${session.session_id}/evaluation`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Debate evaluation saved successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/debate-sessions'] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save evaluation",
        variant: "destructive"
      });
    }
  });

  const updateSpeakerEval = (teamType: 'affirmative' | 'negative', speakerIndex: number, field: keyof SpeakerEvaluation, value: any) => {
    if (teamType === 'affirmative') {
      const updated = [...affirmativeEvals];
      updated[speakerIndex] = { ...updated[speakerIndex], [field]: value };
      setAffirmativeEvals(updated);
    } else {
      const updated = [...negativeEvals];
      updated[speakerIndex] = { ...updated[speakerIndex], [field]: value };
      setNegativeEvals(updated);
    }
  };

  const updateTeamEval = (teamType: 'affirmative' | 'negative', field: keyof TeamEvaluation, value: any) => {
    if (teamType === 'affirmative') {
      setAffirmativeTeamEval(prev => ({ ...prev, [field]: value }));
    } else {
      setNegativeTeamEval(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSaveEvaluation = () => {
    if (!winningTeam) {
      toast({
        title: "Missing Information",
        description: "Please select the winning team",
        variant: "destructive"
      });
      return;
    }

    const evaluationData: DebateEvaluationData = {
      affirmative_evaluations: affirmativeEvals,
      negative_evaluations: negativeEvals,
      affirmative_team_eval: affirmativeTeamEval,
      negative_team_eval: negativeTeamEval,
      winning_team: winningTeam,
      overall_comments: overallComments
    };

    saveEvaluationMutation.mutate(evaluationData);
  };

  const renderSpeakerEvaluations = (
    title: string,
    teamColor: string,
    speakers: SpeakerEvaluation[],
    teamType: 'affirmative' | 'negative'
  ) => (
    <Card className={`border-l-4 border-l-${teamColor}-500`}>
      <CardHeader className="pb-2 pt-3">
        <CardTitle className={`text-${teamColor}-700 text-base`}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-3">
        {speakers.map((speaker, index) => (
          <div key={speaker.speaker_id} className="space-y-2">
            <h4 className="font-medium text-sm">{speaker.speaker_name}</h4>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Strategy</Label>
                <Select 
                  value={speaker.strategy.toString()} 
                  onValueChange={(value) => updateSpeakerEval(teamType, index, 'strategy', parseInt(value))}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Rate" />
                  </SelectTrigger>
                  <SelectContent>
                    {RATING_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Content</Label>
                <Select 
                  value={speaker.content.toString()} 
                  onValueChange={(value) => updateSpeakerEval(teamType, index, 'content', parseInt(value))}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Rate" />
                  </SelectTrigger>
                  <SelectContent>
                    {RATING_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Presentation</Label>
                <Select 
                  value={speaker.presentation.toString()} 
                  onValueChange={(value) => updateSpeakerEval(teamType, index, 'presentation', parseInt(value))}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Rate" />
                  </SelectTrigger>
                  <SelectContent>
                    {RATING_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Comments</Label>
              <Textarea
                placeholder="Feedback for this speaker..."
                value={speaker.comments}
                onChange={(e) => updateSpeakerEval(teamType, index, 'comments', e.target.value)}
                className="min-h-12 text-sm"
              />
            </div>

            {index < speakers.length - 1 && <Separator />}
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderTeamEvaluation = (
    title: string,
    teamColor: string,
    teamEval: TeamEvaluation,
    speakers: { id: string; name: string }[],
    teamType: 'affirmative' | 'negative'
  ) => (
    <Card className={`border-l-4 border-l-${teamColor}-500`}>
      <CardHeader className="pb-2 pt-3">
        <CardTitle className={`text-${teamColor}-700 text-sm flex items-center gap-2`}>
          <Users className="h-4 w-4" />
          {title} Team Evaluation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Teamwork</Label>
            <Select 
              value={teamEval.teamwork.toString()} 
              onValueChange={(value) => updateTeamEval(teamType, 'teamwork', parseInt(value))}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Rate" />
              </SelectTrigger>
              <SelectContent>
                {RATING_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Feedback</Label>
            <Select 
              value={teamEval.feedback.toString()} 
              onValueChange={(value) => updateTeamEval(teamType, 'feedback', parseInt(value))}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Rate" />
              </SelectTrigger>
              <SelectContent>
                {RATING_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Best Speaker</Label>
          <Select 
            value={teamEval.best_speaker_id} 
            onValueChange={(value) => updateTeamEval(teamType, 'best_speaker_id', value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select best speaker" />
            </SelectTrigger>
            <SelectContent>
              {speakers.map(speaker => (
                <SelectItem key={speaker.id} value={speaker.id}>
                  {speaker.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Team Comments</Label>
          <Textarea
            placeholder="Overall team feedback..."
            value={teamEval.comments}
            onChange={(e) => updateTeamEval(teamType, 'comments', e.target.value)}
            className="min-h-10 text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Debate Evaluation - Session {session.session_id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Session Info */}
          <div className="bg-blue-50 p-2 rounded-lg">
            <div className="text-sm font-medium text-blue-800">
              Adjudicator: {session.activities_jsonb.adjudicator}
            </div>
            <div className="text-xs text-blue-600">
              {affirmativeTeam.team_name} vs {negativeTeam.team_name}
            </div>
          </div>

          {/* Speaker Evaluations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {renderSpeakerEvaluations(
              "Affirmative Team",
              "green",
              affirmativeEvals,
              "affirmative"
            )}
            {renderSpeakerEvaluations(
              "Negative Team", 
              "red",
              negativeEvals,
              "negative"
            )}
          </div>

          {/* Team Evaluations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {renderTeamEvaluation(
              "Affirmative",
              "green",
              affirmativeTeamEval,
              affirmativeSpeakers,
              "affirmative"
            )}
            {renderTeamEvaluation(
              "Negative",
              "red", 
              negativeTeamEval,
              negativeSpeakers,
              "negative"
            )}
          </div>

          {/* Winner Selection & Overall Comments */}
          <Card>
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Debate Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-3">
              <div className="space-y-1">
                <Label className="text-xs">Winning Team</Label>
                <Select value={winningTeam} onValueChange={(value: 'affirmative' | 'negative') => setWinningTeam(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select winning team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="affirmative">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Affirmative - {affirmativeTeam.team_name}
                      </div>
                    </SelectItem>
                    <SelectItem value="negative">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        Negative - {negativeTeam.team_name}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Overall Comments</Label>
                <Textarea
                  placeholder="Overall debate feedback and observations..."
                  value={overallComments}
                  onChange={(e) => setOverallComments(e.target.value)}
                  className="min-h-12"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saveEvaluationMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveEvaluation}
              disabled={saveEvaluationMutation.isPending || !winningTeam}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saveEvaluationMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Save Evaluation
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};