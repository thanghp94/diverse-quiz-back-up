import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Question } from "../types";

export interface QuizAppProps {
    assignmentTry?: any;
    questionIds?: string[];
    onFinish?: () => void;
    content?: any;
    studentTryId?: string;
}

export const useQuizLogic = ({ assignmentTry, questionIds, onFinish }: QuizAppProps) => {
  const isExternalQuiz = !!(assignmentTry && questionIds && onFinish);
  const { toast } = useToast();

  const [currentView, setCurrentView] = useState<'home' | 'quiz' | 'results'>(isExternalQuiz ? 'quiz' : 'home');
  const [selectedQuiz, setSelectedQuiz] = useState<{ questions: Question[], title: string } | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [score, setScore] = useState(0);

  const { data: fetchedQuestions, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['quiz-questions', questionIds],
    queryFn: async () => {
        if (!questionIds || questionIds.length === 0) return [];
        
        const questionRequests = questionIds.map(id => 
            fetch(`/api/questions/${id}`).then(res => res.ok ? res.json() : null)
        );
        
        const results = await Promise.all(questionRequests);
        return results.filter(Boolean);
    },
    enabled: isExternalQuiz && !!questionIds && questionIds.length > 0
  });

  // Use fetched questions for external quiz, or selectedQuiz for internal quiz
  const questions = isExternalQuiz ? fetchedQuestions || [] : selectedQuiz?.questions || [];
  const quizTitle = isExternalQuiz ? "Quiz" : selectedQuiz?.title || "";

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleAnswer = useCallback((answer: any, isCorrect: boolean) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
  }, [answers, currentQuestionIndex]);

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      setCurrentView('results');
      if (isExternalQuiz && onFinish) {
        onFinish();
      }
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [isLastQuestion, isExternalQuiz, onFinish]);

  const handleRestart = useCallback(() => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setScore(0);
    setCurrentView(isExternalQuiz ? 'quiz' : 'home');
    setSelectedQuiz(null);
  }, [isExternalQuiz]);

  const startQuiz = useCallback((quiz: { questions: Question[], title: string }) => {
    setSelectedQuiz(quiz);
    setCurrentView('quiz');
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setScore(0);
  }, []);

  return {
    currentView,
    currentQuestion,
    currentQuestionIndex,
    questions,
    quizTitle,
    score,
    answers,
    isLastQuestion,
    isLoadingQuestions,
    handleAnswer,
    handleNext,
    handleRestart,
    startQuiz
  };
};