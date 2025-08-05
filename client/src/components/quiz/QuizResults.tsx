
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Star, RotateCcw, Home } from "lucide-react";
import { useEffect, useState } from "react";

interface QuizResultsProps {
  score: number;
  total: number;
  onRestart: () => void;
  quizTitle: string;
}

const QuizResults = ({ score, total, onRestart, quizTitle }: QuizResultsProps) => {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const [answerResults, setAnswerResults] = useState<boolean[]>([]);

  useEffect(() => {
    const storedResults = sessionStorage.getItem('quizResults');
    if (storedResults) {
        try {
            const parsedResults = JSON.parse(storedResults);
            if (Array.isArray(parsedResults)) {
                setAnswerResults(parsedResults);
            }
        } catch (e) {
            console.error("Failed to parse quiz results from session storage", e);
        }
    }
  }, []);

  const handleRestart = () => {
    sessionStorage.removeItem('quizResults');
    onRestart();
  };
  
  const getScoreMessage = () => {
    if (percentage >= 90) return "Outstanding! 🎉";
    if (percentage >= 70) return "Great job! 👏";
    if (percentage >= 50) return "Good effort! 👍";
    return "Keep practicing! 💪";
  };

  const getScoreColor = () => {
    if (percentage >= 90) return "text-yellow-300";
    if (percentage >= 70) return "text-green-300";
    if (percentage >= 50) return "text-blue-300";
    return "text-orange-300";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 w-full max-w-lg animate-scale-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Trophy className="text-yellow-300" size={64} />
          </div>
          <CardTitle className="text-white text-3xl">Quiz Complete!</CardTitle>
          <p className="text-white/80 text-lg">{quizTitle}</p>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-4">
            <div className={`text-6xl font-bold ${getScoreColor()}`}>
              {score}/{total}
            </div>
            <div className={`text-2xl font-semibold ${getScoreColor()}`}>
              {percentage}%
            </div>
            <div className="text-xl text-white">
              {getScoreMessage()}
            </div>
          </div>

          <div className="flex justify-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`${
                  i < Math.ceil((percentage / 100) * 5) 
                    ? "text-yellow-300 fill-yellow-300" 
                    : "text-gray-400"
                }`}
                size={32}
              />
            ))}
          </div>

          {answerResults.length > 0 && (
            <div className="flex justify-center flex-wrap gap-2 pt-2">
              {answerResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-center w-8 h-8 rounded-md font-bold text-white text-sm ${
                    result ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  title={`Question ${index + 1}: ${result ? 'Correct' : 'Incorrect'}`}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handleRestart}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 text-lg"
            >
              <RotateCcw className="mr-2" size={20} />
              Try Another Quiz
            </Button>
            <Button 
              onClick={handleRestart}
              variant="outline"
              className="w-full border-white/30 text-white hover:bg-white/10 py-3 text-lg"
            >
              <Home className="mr-2" size={20} />
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizResults;
