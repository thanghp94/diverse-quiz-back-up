import QuizEngineAdapter from "@/quiz/core/QuizEngineAdapter";
import type { QuizAppProps as QuizOrchestratorProps } from "@/quiz/hooks/useQuizLogic";
import type { Question as QuizQuestion } from "@/quiz/types";

export type Question = QuizQuestion;
export type QuizAppProps = QuizOrchestratorProps;

const QuizApp = (props: QuizAppProps) => {
  // Now using the unified system through the adapter
  return <QuizEngineAdapter {...props} />;
};

export default QuizApp;
