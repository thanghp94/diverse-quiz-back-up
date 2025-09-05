import QuizResults from "@/quiz/components/individual/QuizResults";
import { Loader2 } from "lucide-react";
import { useQuizLogic, QuizAppProps } from "@/quiz/hooks/useQuizLogic";
import QuizHome from "./QuizHome";
import QuizInProgress from "@/quiz/components/shared/QuizInProgress";

const QuizOrchestrator = (props: QuizAppProps) => {
  const {
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
  } = useQuizLogic(props);

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