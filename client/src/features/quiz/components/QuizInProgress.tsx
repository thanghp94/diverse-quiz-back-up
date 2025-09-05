
import { Badge } from "@/components/ui/badge";
import MultipleChoice from "@/components/content-management/activities/quiz/question-types/MultipleChoice";
import Matching from "@/components/content-management/activities/quiz/question-types/Matching";
import FillInBlank from "@/components/content-management/activities/quiz/question-types/FillInBlank";
import Categorize from "@/components/content-management/activities/quiz/question-types/Categorize";
import { Question } from "../types";

interface QuizInProgressProps {
  selectedQuiz: { questions: Question[]; title: string; };
  currentQuestionIndex: number;
  score: number;
  handleAnswer: (answer: any, isCorrect: boolean) => void;
}

const QuizInProgress = ({ selectedQuiz, currentQuestionIndex, score, handleAnswer }: QuizInProgressProps) => {
  const renderQuestion = () => {
    const question = selectedQuiz.questions[currentQuestionIndex];
    
    switch (question.type) {
      case 'multiple-choice':
        return <MultipleChoice question={question} onAnswer={handleAnswer} />;
      case 'matching':
        return <Matching question={question} onAnswer={handleAnswer} />;
      case 'fill-blank':
        return <FillInBlank question={question} onAnswer={handleAnswer} />;
      case 'categorize':
        return <Categorize question={question} onAnswer={handleAnswer} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2 bg-white/10 text-white border-white/30">
              Score: {score}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{selectedQuiz.title}</h1>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100}%` }}
            />
          </div>
        </div>
        {renderQuestion()}
      </div>
    </div>
  );
};

export default QuizInProgress;
