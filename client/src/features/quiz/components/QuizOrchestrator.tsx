import QuizResults from "@/components/quiz/QuizResults";
import { Loader2 } from "lucide-react";
import { useQuizLogic, QuizAppProps } from "../hooks/useQuizLogic";
import QuizHome from "./QuizHome";
import QuizInProgress from "./QuizInProgress";

const QuizOrchestrator = (props: QuizAppProps) => {
  const {
    currentView,
    selectedQuiz,
    currentQuestionIndex,
    score,
    startQuiz,
    handleAnswer,
    resetQuiz,
    isExternalQuiz,
    isLoadingQuestions,
  } = useQuizLogic(props);

  if (isExternalQuiz && isLoadingQuestions) {
    return (
        <div className="flex-grow flex items-center justify-center text-white">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading quiz...</span>
        </div>
    );
  }

  if (currentView === 'results' && selectedQuiz) {
    return (
      <QuizResults 
        score={score} 
        total={selectedQuiz.questions.length} 
        onRestart={resetQuiz}
        quizTitle={selectedQuiz.title}
      />
    );
  }

  if (currentView === 'quiz' && selectedQuiz && selectedQuiz.questions.length > 0) {
    return (
      <QuizInProgress
        selectedQuiz={selectedQuiz}
        currentQuestionIndex={currentQuestionIndex}
        score={score}
        handleAnswer={handleAnswer}
        studentTryId={(props as any).studentTryId}
      />
    );
  }

  if (isExternalQuiz && (!selectedQuiz || selectedQuiz.questions.length === 0)) {
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