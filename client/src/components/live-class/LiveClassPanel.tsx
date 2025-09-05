import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Clock, Users, Play } from 'lucide-react';
import QuizDialog from '@/quiz/components/shared/QuizDialog';

interface LiveAssignment {
  id: string;
  assignmentname: string;
  description: string;
  type: string;
  created_at: string;
  topicid: string;
  contentid: string | null;
  noofquestion: number;
  category: string;
  subject: string;
  testtype: string;
}

const LiveClassPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<LiveAssignment | null>(null);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentAssignment, setCurrentAssignment] = useState<LiveAssignment | null>(null);

  // Fetch real live class assignments from API
  const { data: liveAssignments = [], isLoading } = useQuery<LiveAssignment[]>({
    queryKey: ['/api/live-assignments'],
    queryFn: () => fetch('/api/live-assignments').then(res => res.json()),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const vietnamTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
    return vietnamTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getStatusBadge = (assignment: LiveAssignment) => {
    const createdTime = new Date(assignment.created_at);
    const now = new Date();
    const diffHours = (now.getTime() - createdTime.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      return <Badge className="bg-green-500 text-white">Live Now</Badge>;
    } else if (diffHours < 3) {
      return <Badge className="bg-orange-500 text-white">Recent</Badge>;
    } else {
      return <Badge className="bg-gray-500 text-white">Ended</Badge>;
    }
  };

  const handleJoinClass = (assignment: LiveAssignment) => {
    setSelectedAssignment(assignment);
    console.log('Joining live class:', assignment.assignmentname);
  };

  const handleStartQuiz = async (assignment: LiveAssignment) => {
    try {
      console.log('Starting quiz for assignment:', assignment.id);
      
      // Create assignment_student_try
      const tryResponse = await fetch('/api/assignment-student-tries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hocsinh_id: 'GV0002', // Current user ID
          assignmentid: assignment.id,
          typeoftaking: 'live_class',
        }),
      });

      if (!tryResponse.ok) {
        throw new Error('Failed to create assignment student try');
      }

      const assignmentTry = await tryResponse.json();
      console.log('Assignment try created:', assignmentTry);

      // Fetch questions for the assignment topic
      let questionsResponse;
      if (assignment.topicid) {
        questionsResponse = await fetch(`/api/questions?topicId=${assignment.topicid}&level=easy`);
      } else {
        // Fallback to general questions
        questionsResponse = await fetch('/api/questions?level=easy');
      }

      if (!questionsResponse.ok) {
        throw new Error('Failed to fetch questions');
      }

      const questions = await questionsResponse.json();
      console.log('Questions fetched:', questions.length);

      if (questions.length === 0) {
        alert('No questions available for this assignment');
        return;
      }

      // Set up quiz state and open quiz dialog
      setQuizQuestions(questions.slice(0, assignment.noofquestion || 40));
      setCurrentAssignment(assignment);
      setIsQuizOpen(true);
      
      // Close the homework dialog
      setIsOpen(false);
      setSelectedAssignment(null);
      
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Failed to start quiz. Please try again.');
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-gradient-to-r from-green-600/12 to-blue-600/12 border-green-400/18 text-white/60 hover:from-green-600/30 hover:to-blue-600/30 hover:border-green-400/50 hover:text-white backdrop-blur-sm shadow-lg transition-all duration-300 h-8 w-8 p-0"
            title="Homework"
          >
            <Video className="h-4 w-4" />
            {(liveAssignments as LiveAssignment[]).length > 0 && (
              <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {isLoading ? '...' : (liveAssignments as LiveAssignment[]).length}
              </div>
            )}
          </Button>
        </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[70vh] bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Video className="h-5 w-5 text-green-400" />
            Available Homework
            <Badge variant="outline" className="text-green-200 border-green-400">
              {(liveAssignments as LiveAssignment[]).length} Active
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-6">Loading homework assignments...</div>
          ) : (liveAssignments as LiveAssignment[]).length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-medium mb-2">No Active Homework</h3>
              <p className="text-sm">No homework assignments created within the last 3 hours.</p>
            </div>
          ) : (
            (liveAssignments as LiveAssignment[]).map((assignment: LiveAssignment) => (
              <Card 
                key={assignment.id} 
                className="bg-gray-800/50 border-gray-600 hover:bg-gray-700/50 transition-all duration-200 cursor-pointer"
                onClick={() => handleJoinClass(assignment)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-white">{assignment.assignmentname}</h3>
                        {getStatusBadge(assignment)}
                      </div>
                      <p className="text-gray-300 text-sm mb-2 line-clamp-2">{assignment.description || 'Homework assignment available for students'}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(assignment.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Students can join
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-green-600/20 border-green-400/50 text-green-200 hover:bg-green-600/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinClass(assignment);
                        }}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {selectedAssignment && (
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-400/30 rounded-lg">
            <h4 className="text-white font-medium mb-2">Selected: {selectedAssignment.assignmentname}</h4>
            <p className="text-blue-200 text-sm mb-3">{selectedAssignment.description}</p>
            <div className="flex gap-2">
              <Button 
                variant="default" 
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => handleStartQuiz(selectedAssignment)}
              >
                <Play className="h-4 w-4 mr-1" />
                Start Quiz
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedAssignment(null)}
                className="text-gray-300 border-gray-600 hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    
      <QuizDialog
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        questions={quizQuestions}
        assignmentName={currentAssignment?.assignmentname || 'Quiz'}
        totalQuestions={currentAssignment?.noofquestion || quizQuestions.length}
      />
    </>
  );
};

export default LiveClassPanel;