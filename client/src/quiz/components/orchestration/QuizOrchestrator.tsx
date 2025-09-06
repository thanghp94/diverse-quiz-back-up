import QuizResults from "@/quiz/components/individual/QuizResults";
import { Loader2 } from "lucide-react";
import { useUnifiedQuizState, useQuizTracking, QuizAppProps } from "@/quiz/hooks";
import QuizHome from "./QuizHome";
import QuizInProgress from "@/quiz/components/shared/QuizInProgress";

const QuizOrchestrator = (props: QuizAppProps) => {
  // Convert legacy props to unified configuration
  const unifiedConfig = {
    source: {
      type: 'questions' as const,
      questionIds: props.questionIds || [],
    },
    mode: 'individual' as const,
    database: {
      assignmentStudentTryId: props.assignmentTry?.id?.toString(),
      studentTryId: props.studentTryId,
      trackProgress: true,
    },
    callbacks: {
      onQuizFinish: props.onFinish,
    },
  };

  // Use unified state management
  const {
    currentView,
    currentQuestion,
    currentQuestionIndex,
    questions,
    quizTitle,
    score,
    answers,
    isLastQuestion,
    isLoading: isLoadingQuestions,
    handleAnswer,
    handleNext,
    handleRestart,
    startQuiz
  } = useUnifiedQuizState(unifiedConfig);

  // Set up tracking (though QuizOrchestrator typically doesn't need database tracking)
  const tracking = useQuizTracking({
    assignmentStudentTryId: props.assignmentTry?.id?.toString(),
    studentTryId: props.studentTryId,
    trackProgress: false, // QuizOrchestrator doesn't typically track to database
  });

  const isExternalQuiz = !!(props.assignmentTry && props.questionIds && props.onFinish);

  if (isExternalQuiz && isLoadingQuestions) {
    return (
        <div className="flex-grow flex items-center justify-center text-white">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading quiz...</span>
        </div>
    );
  }

  if (currentView === 'results') {
    return (
      <QuizResults 
        score={score} 
        total={questions.length} 
        onRestart={handleRestart}
        quizTitle={quizTitle}
      />
    );
  }

  if (currentView === 'quiz' && questions.length > 0) {
    return (
      <QuizInProgress
        selectedQuiz={{ questions, title: quizTitle }}
        currentQuestionIndex={currentQuestionIndex}
        score={score}
        handleAnswer={handleAnswer}
      />
    );
  }

  if (isExternalQuiz && questions.length === 0) {
    return (
        <div className="flex-grow flex items-center justify-center text-white">
            <p>No questions available for this quiz.</p>
        </div>
    );
  }

  if (!isExternalQuiz && currentView === 'home') {
    return (
      <QuizHome startQuiz={startQuiz} />
    );
  }

  return null;
};

export default QuizOrchestrator;