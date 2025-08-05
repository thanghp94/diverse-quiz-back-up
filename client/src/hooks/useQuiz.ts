import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Content } from "./useContent";

interface UseQuizProps {
  content: Content | null;
  onClose: () => void;
  startQuizDirectly?: boolean;
  level?: 'easy' | 'hard' | null;
}

export const useQuiz = ({ content, onClose, startQuizDirectly = false, level }: UseQuizProps) => {
  const [quizMode, setQuizMode] = useState(false);
  const [assignmentTry, setAssignmentTry] = useState<any>(null);
  const [studentTry, setStudentTry] = useState<any>(null);
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const { toast } = useToast();

  const startQuiz = useCallback(async (level?: 'easy' | 'hard') => {
    if (!content) return;

    // Fetch questions for this content
    const url = level 
      ? `/api/questions?contentId=${content.id}&level=${level}`
      : `/api/questions?contentId=${content.id}`;

    try {
      console.log('Fetching questions from:', url);
      const response = await fetch(url);
      console.log('Questions response status:', response.status);
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      const questions = await response.json();
      console.log('Questions received:', questions.length, 'questions');

      if (!questions || questions.length === 0) {
          console.log("No questions available for this content.", level ? `Level: ${level}` : '');
          
          // Try to fetch questions with different difficulty levels if the requested level has no questions
          if (level) {
            console.log(`No ${level} questions found, trying other difficulty levels...`);
            
            // Try the opposite difficulty level
            const alternativeLevel = level === 'easy' ? 'hard' : 'easy';
            const altUrl = `/api/questions?contentId=${content.id}&level=${alternativeLevel}`;
            
            try {
              const altResponse = await fetch(altUrl);
              if (altResponse.ok) {
                const altQuestions = await altResponse.json();
                if (altQuestions && altQuestions.length > 0) {
                  console.log(`Found ${altQuestions.length} ${alternativeLevel} questions instead`);
                  toast({
                      title: `No ${level.charAt(0).toUpperCase() + level.slice(1)} Quiz Available`,
                      description: `Found ${altQuestions.length} ${alternativeLevel} questions instead. Would you like to try those?`,
                      duration: 5000,
                  });
                  if (startQuizDirectly) onClose();
                  return;
                }
              }
              
              // Try Overview questions as final fallback
              const overviewUrl = `/api/questions?contentId=${content.id}&level=Overview`;
              const overviewResponse = await fetch(overviewUrl);
              if (overviewResponse.ok) {
                const overviewQuestions = await overviewResponse.json();
                if (overviewQuestions && overviewQuestions.length > 0) {
                  console.log(`Found ${overviewQuestions.length} Overview questions as fallback`);
                  toast({
                      title: `No ${level.charAt(0).toUpperCase() + level.slice(1)} Quiz Available`,
                      description: `Found ${overviewQuestions.length} overview questions instead. Would you like to try those?`,
                      duration: 5000,
                  });
                  if (startQuizDirectly) onClose();
                  return;
                }
              }
            } catch (error) {
              console.error('Error checking alternative difficulty levels:', error);
            }
          }
          
          toast({
              title: "No Quiz Available",
              description: `There are no questions available for this content yet. Try different content items that have quiz questions.`,
              duration: 5000,
          });
          if (startQuizDirectly) onClose();
          return;
      }

      const randomizedQuestionIds = questions.map((q: any) => q.id).sort(() => Math.random() - 0.5);

      const hocsinh_id = 'user-123-placeholder';

      // Create quiz session using assignment_student_try (eliminates need for assignment table)
      const quizSessionData = {
        hocsinh_id: hocsinh_id,
        contentID: content.id,
        questionIDs: JSON.stringify(randomizedQuestionIds),
        start_time: new Date().toISOString(),
        typeoftaking: level || 'Overview'
      };

      console.log('Creating quiz session with data:', quizSessionData);
      const sessionResponse = await fetch('/api/assignment-student-tries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizSessionData)
      });

      console.log('Session response status:', sessionResponse.status);
      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        console.error('Session creation failed:', errorText);
        throw new Error('Failed to create quiz session');
      }

      const quizSession = await sessionResponse.json();

      console.log('Quiz session created:', quizSession);

      setAssignmentTry(quizSession);
      setStudentTry(null); // Individual records will be created per question
      setQuestionIds(randomizedQuestionIds);
      setQuizMode(true);
    } catch (error) {
        console.error("Error starting quiz:", error);
        toast({
            title: "Error Starting Quiz",
            description: "Could not start the quiz due to a server error. Please try again.",
            variant: "destructive",
        });
        if (startQuizDirectly) onClose();
        return;
    }
  }, [content, onClose, startQuizDirectly, toast]);

  const closeQuiz = useCallback(() => {
    setQuizMode(false);
    setAssignmentTry(null);
    setStudentTry(null);
    setQuestionIds([]);
    onClose();
  }, [onClose]);

  // Auto-start quiz when startQuizDirectly is true and level is provided
  useEffect(() => {
    if (startQuizDirectly && content && level) {
      startQuiz(level);
    }
  }, [startQuizDirectly, content, level, startQuiz]);

  return {
    quizMode,
    assignmentTry,
    studentTry,
    questionIds,
    startQuiz,
    closeQuiz,
    setStudentTry
  };
};