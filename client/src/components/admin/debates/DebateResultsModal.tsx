import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Users, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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

interface ActivitySession {
  session_id: number;
  type: string;
  status: string;
  start_time: string;
  end_time: string;
  activities_jsonb: {
    evaluation?: DebateEvaluationData;
    topic_id?: string;
    adjudicator?: string;
    affirmative_team?: string;
    negative_team?: string;
    [key: string]: any;
  };
  attendance: any[];
}

interface DebateResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ActivitySession;
}

const RATING_LABELS = {
  1: "Poor",
  2: "Fair", 
  3: "Good",
  4: "Very Good",
  5: "Excellent"
};

export const DebateResultsModal = ({ isOpen, onClose, session }: DebateResultsModalProps) => {
  // Get debate topic
  const { data: content } = useQuery({
    queryKey: ['/api/content'],
    enabled: !!session.activities_jsonb?.topic_id
  });

  const debateTopic = Array.isArray(content) ? content.find((item: any) => item.id === session.activities_jsonb?.topic_id) : null;
  const evaluation = session.activities_jsonb?.evaluation;

  if (!evaluation) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>No Results Available</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground">This debate session has not been evaluated yet.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Get team names from attendance
  const affirmativeTeam = session.attendance.find(att => att.team_id.toString() === session.activities_jsonb?.affirmative_team);
  const negativeTeam = session.attendance.find(att => att.team_id.toString() === session.activities_jsonb?.negative_team);

  const renderSpeakerResults = (
    title: string,
    teamColor: string,
    speakers: SpeakerEvaluation[],
    teamEval: TeamEvaluation,
    teamName: string
  ) => {
    const totalScore = speakers.reduce((sum, speaker) => 
      sum + speaker.strategy + speaker.content + speaker.presentation, 0
    );
    const avgScore = (totalScore / (speakers.length * 3)).toFixed(1);

    return (
      <Card className={`border-l-4 border-l-${teamColor}-500`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className={`text-${teamColor}-700 text-lg flex items-center gap-2`}>
              {evaluation.winning_team === (teamColor === 'green' ? 'affirmative' : 'negative') && (
                <Trophy className="h-5 w-5 text-yellow-500" />
              )}
              {title}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="secondary">Avg: {avgScore}/5</Badge>
              <Badge variant="outline">Best: {teamEval.best_speaker_id}</Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{teamName}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Team Scores */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Teamwork:</span>
              <span className="text-sm">{RATING_LABELS[teamEval.teamwork as keyof typeof RATING_LABELS]} ({teamEval.teamwork}/5)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Feedback:</span>
              <span className="text-sm">{RATING_LABELS[teamEval.feedback as keyof typeof RATING_LABELS]} ({teamEval.feedback}/5)</span>
            </div>
          </div>

          {/* Individual Speaker Results */}
          <div className="space-y-3">
            {speakers.map((speaker, index) => (
              <div key={speaker.speaker_id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center gap-2">
                    Speaker {index + 1}: {speaker.speaker_name}
                    {speaker.speaker_name === teamEval.best_speaker_id && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </h4>
                  <Badge variant="outline">
                    {speaker.strategy + speaker.content + speaker.presentation}/15
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="text-center">
                    <div className="font-medium">Strategy</div>
                    <div className="text-muted-foreground">{speaker.strategy}/5</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Content</div>
                    <div className="text-muted-foreground">{speaker.content}/5</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Presentation</div>
                    <div className="text-muted-foreground">{speaker.presentation}/5</div>
                  </div>
                </div>

                {speaker.comments && (
                  <div className="mt-2 p-2 bg-muted/30 rounded text-sm">
                    <MessageSquare className="h-3 w-3 inline mr-1" />
                    {speaker.comments}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Team Comments */}
          {teamEval.comments && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="font-medium text-sm mb-1 flex items-center gap-1">
                <Users className="h-3 w-3" />
                Team Feedback
              </div>
              <p className="text-sm text-muted-foreground">{teamEval.comments}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[100vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Debate Results - {debateTopic?.title || `Session ${session.session_id}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Session Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Adjudicator:</span>
                  <div className="text-muted-foreground">{session.activities_jsonb?.adjudicator}</div>
                </div>
                <div>
                  <span className="font-medium">Date:</span>
                  <div className="text-muted-foreground">
                    {new Date(session.start_time).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <Badge variant="secondary">{session.status}</Badge>
                </div>
                <div>
                  <span className="font-medium">Winner:</span>
                  <Badge variant={evaluation.winning_team === 'affirmative' ? 'default' : 'destructive'}>
                    {evaluation.winning_team === 'affirmative' ? 'Affirmative' : 'Negative'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {renderSpeakerResults(
              "Affirmative",
              "green", 
              evaluation.affirmative_evaluations,
              evaluation.affirmative_team_eval,
              affirmativeTeam?.team_name || "Team A"
            )}
            {renderSpeakerResults(
              "Negative",
              "red",
              evaluation.negative_evaluations, 
              evaluation.negative_team_eval,
              negativeTeam?.team_name || "Team B"
            )}
          </div>

          {/* Overall Comments */}
          {evaluation.overall_comments && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Overall Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{evaluation.overall_comments}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};