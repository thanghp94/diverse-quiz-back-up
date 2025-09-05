import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import QuizView from "@/quiz/components/individual/QuizView";
import { useQuiz } from "@/quiz/hooks/useQuiz";
import type { Content } from "@shared/schema";

interface Question {
  id: string;
  topic: string;
  questiontext: string;
  A: string;
  B: string;
  C: string;
  D: string;
  answer: string;
  level: string;
}

interface QuizDialogProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  assignmentName: string;
  totalQuestions: number;
  content?: Content | null;
  level?: 'easy' | 'hard';
}

const QuizDialog: React.FC<QuizDialogProps> = ({
  isOpen,
  onClose,
  questions,
  assignmentName,
  totalQuestions,
  content = null,
  level = 'easy'
}) => {
  const {
    quizMode,
    assignmentTry,
    studentTry,
    questionIds,
    startQuiz,
    closeQuiz,
    setStudentTry,
  } = useQuiz({ 
    content, 
    onClose, 
    startQuizDirectly: false, 
    level 
  });

  const [questionIdsFromProps, setQuestionIdsFromProps] = useState<string[]>([]);
  const [mockAssignmentTry, setMockAssignmentTry] = useState<any>(null);
  
  useEffect(() => {
    if (isOpen && questions.length > 0) {
      const ids = questions.map(q => q.id);
      setQuestionIdsFromProps(ids);
      
      // Create a mock assignment try for the quiz
      const mockTry = {
        id: `quiz_${Date.now()}`,
        hocsinh_id: 'user-123-placeholder',
        contentID: content?.id || 'quiz-content',
        questionIDs: JSON.stringify(ids),
        start_time: new Date().toISOString(),
        typeoftaking: level || 'Overview'
      };
      
      setMockAssignmentTry(mockTry);
    }
  }, [isOpen, questions, content, level]);

  const handleClose = () => {
    closeQuiz();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl h-[90vh] bg-white rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900">
            {assignmentName || "Quiz"}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-gray-600 hover:text-gray-900"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-[calc(90vh-4rem)] overflow-y-auto">
          {questionIdsFromProps.length > 0 && mockAssignmentTry ? (
            <QuizView 
              questionIds={questionIdsFromProps} 
              onQuizFinish={handleClose}
              assignmentStudentTryId={mockAssignmentTry.id.toString()}
              studentTryId={mockAssignmentTry?.id}
              contentId={content?.id}
            />
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-600">Loading quiz...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizDialog;