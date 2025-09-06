import { useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface QuizTrackingConfig {
  assignmentStudentTryId?: string;
  studentTryId?: string;
  contentId?: string;
  topicId?: string;
  trackProgress?: boolean;
}

export interface StudentTryData {
  assignment_student_try_id: string;
  hocsinh_id: string;
  question_id: string;
  answer_choice: string;
  correct_answer: string;
  quiz_result: string;
  time_start: Date | string | null;
  time_end: Date | string | null;
  currentindex: number;
  showcontent: boolean;
}

export interface AssignmentStudentTryData {
  hocsinh_id: string;
  contentID: string;
  questionIDs: string;
  start_time: string;
  typeoftaking: string;
}

export interface QuizTrackingActions {
  createAssignmentStudentTry: (data: AssignmentStudentTryData) => Promise<any>;
  createStudentTry: (data: Partial<StudentTryData>) => Promise<any>;
  recordQuestionResponse: (
    questionId: string,
    answerChoice: string,
    correctAnswer: string,
    isCorrect: boolean,
    timeStart: string | null,
    timeEnd: string,
    currentIndex: number,
    showedContent: boolean
  ) => Promise<void>;
  saveContentRating: (rating: string) => Promise<void>;
  getCurrentUser: () => { id: string; name: string };
}

/**
 * useQuizTracking - Centralized database operations for quiz tracking
 * Consolidates assignment_student_try and student_try logic from all components
 */
export const useQuizTracking = (config: QuizTrackingConfig): QuizTrackingActions => {
  const { user } = useAuth();
  const { toast } = useToast();

  const getCurrentUser = useCallback(() => {
    // Use authenticated user if available, otherwise fallback to localStorage
    if (user?.id) {
      return { id: user.id, name: user.full_name || user.first_name || 'User' };
    }
    
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    
    return { id: 'GUEST', name: 'Guest User' };
  }, [user]);

  const createAssignmentStudentTry = useCallback(async (data: AssignmentStudentTryData) => {
    try {
      const response = await fetch('/api/assignment-student-tries', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to create assignment try');
      }

      const result = await response.json();
      console.log('Assignment student try created:', result);
      return result;
    } catch (error) {
      console.error('Error creating assignment student try:', error);
      throw error;
    }
  }, []);

  const createStudentTry = useCallback(async (data: Partial<StudentTryData>) => {
    try {
      const currentUser = getCurrentUser();
      
      const studentTryData = {
        id: `quiz-try-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assignment_student_try_id: config.assignmentStudentTryId,
        hocsinh_id: currentUser.id,
        time_start: new Date().toISOString(),
        ...data
      };

      const response = await fetch('/api/student-tries', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(studentTryData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Student try creation failed:', errorText);
        throw new Error('Failed to create student try');
      }

      const result = await response.json();
      console.log('Student try created:', result);
      return result;
    } catch (error) {
      console.error('Error creating student try:', error);
      throw error;
    }
  }, [config.assignmentStudentTryId, getCurrentUser]);

  const recordQuestionResponse = useCallback(async (
    questionId: string,
    answerChoice: string,
    correctAnswer: string,
    isCorrect: boolean,
    timeStart: string | null,
    timeEnd: string,
    currentIndex: number,
    showedContent: boolean
  ) => {
    if (!config.assignmentStudentTryId || !config.trackProgress) {
      return;
    }

    try {
      const currentUser = getCurrentUser();
      
      const responseData: StudentTryData = {
        assignment_student_try_id: config.assignmentStudentTryId,
        hocsinh_id: currentUser.id,
        question_id: questionId,
        answer_choice: answerChoice,
        correct_answer: correctAnswer,
        quiz_result: isCorrect ? '✅' : '❌',
        time_start: timeStart ? new Date(timeStart) : null,
        time_end: new Date(timeEnd),
        currentindex: currentIndex,
        showcontent: showedContent,
      };

      const response = await fetch('/api/student-tries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(responseData)
      });

      if (!response.ok) {
        throw new Error('Failed to record question response');
      }

      console.log('Question response recorded:', {
        question_id: questionId,
        answer_choice: answerChoice,
        correct_answer: correctAnswer,
        quiz_result: isCorrect ? '✅' : '❌',
        currentindex: currentIndex,
        showcontent: showedContent,
      });
    } catch (error) {
      console.error("Error recording question response:", error);
      // Don't throw error to avoid breaking quiz flow
    }
  }, [config.assignmentStudentTryId, config.trackProgress, getCurrentUser]);

  const saveContentRating = useCallback(async (rating: string) => {
    if (!config.contentId && !config.topicId) {
      return;
    }

    try {
      const currentUser = getCurrentUser();
      
      const response = await fetch('/api/content-ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          student_id: currentUser.id,
          content_id: config.contentId || config.topicId,
          rating: rating
        })
      });

      if (response.ok) {
        toast({
          title: "Rating Saved",
          description: `Content rated as ${rating}`,
        });
      } else {
        throw new Error('Failed to save rating');
      }
    } catch (error) {
      console.error('Error saving content rating:', error);
      toast({
        title: "Error",
        description: "Failed to save rating",
        variant: "destructive"
      });
    }
  }, [config.contentId, config.topicId, getCurrentUser, toast]);

  return {
    createAssignmentStudentTry,
    createStudentTry,
    recordQuestionResponse,
    saveContentRating,
    getCurrentUser,
  };
};
