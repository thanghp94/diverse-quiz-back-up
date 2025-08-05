import QuizOrchestrator from "@/features/quiz/components/QuizOrchestrator";
import type { QuizAppProps as QuizOrchestratorProps } from "@/features/quiz/hooks/useQuizLogic";
import type { Question as QuizQuestion } from "@/features/quiz/types";

export type Question = QuizQuestion;
export type QuizAppProps = QuizOrchestratorProps;

const QuizApp = (props: QuizAppProps) => {
  return <QuizOrchestrator {...props} />;
};

export default QuizApp;