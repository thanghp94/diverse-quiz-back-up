
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Trophy, Star, BookOpen } from "lucide-react";
import { sampleQuizzes } from "@/quiz/core/sampleQuizzes";
import { Question } from "@/quiz/types";

interface QuizHomeProps {
  startQuiz: (quiz: { title: string; questions: Question[] }) => void;
}

const QuizHome = ({ startQuiz }: QuizHomeProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-4xl w-full">
        <div className="mb-8 animate-fade-in">
          <Trophy className="mx-auto mb-4 text-yellow-300" size={64} />
          <h1 className="text-5xl font-bold text-white mb-4">Quiz Master</h1>
          <p className="text-xl text-white/80 mb-8">
            Challenge yourself with different types of questions and test your knowledge!
          </p>
          <div className="flex gap-4 justify-center mb-8">
            <Link to="/topics">
              <Button 
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <BookOpen className="mr-2" size={16} />
                Browse Learning Topics
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {sampleQuizzes.map((quiz) => (
            <Card key={quiz.id} className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">{quiz.title}</CardTitle>
                  <Star className="text-yellow-300" size={24} />
                </div>
                <p className="text-white/80">{quiz.description}</p>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-200">
                    {quiz.questions.length} Questions
                  </Badge>
                  <div className="flex gap-2">
                    {quiz.questions.map((q, index) => (
                      <Badge key={index} variant="outline" className="text-xs border-white/30 text-white/70">
                        {q.type === 'multiple-choice' ? 'MC' : 
                         q.type === 'matching' ? 'Match' :
                         q.type === 'fill-blank' ? 'Fill' : 'Cat'}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button 
                  onClick={() => startQuiz(quiz)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  <Play className="mr-2" size={16} />
                  Start Quiz
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizHome;
