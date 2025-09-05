import QuizOrchestrator from "@/quiz/components/orchestration/QuizOrchestrator";
import type { QuizAppProps as QuizOrchestratorProps } from "@/quiz/hooks/useQuizLogic";
import type { Question as QuizQuestion } from "@/quiz/types";

export type Question = QuizQuestion;
export type QuizAppProps = QuizOrchestratorProps;

const QuizApp = (props: QuizAppProps) => {
  return <QuizOrchestrator {...props} />;
};

export default QuizApp;