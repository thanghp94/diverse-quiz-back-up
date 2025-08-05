
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Question } from "@/features/quiz/types";

interface FillInBlankProps {
  question: Question;
  onAnswer: (answer: any, isCorrect: boolean) => void;
  studentTryId?: string;
}

const FillInBlank = ({ question, onAnswer, studentTryId }: FillInBlankProps) => {
  const [answers, setAnswers] = useState<string[]>(new Array(question.blanks?.length || 0).fill(""));

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    let correctCount = 0;
    const blanks = question.blanks || [];
    
    answers.forEach((answer, index) => {
      const correctAnswers = blanks[index]?.answers || [];
      if (correctAnswers.some(correct => 
        correct.toLowerCase().trim() === answer.toLowerCase().trim()
      )) {
        correctCount++;
      }
    });
    
    const isCorrect = correctCount === blanks.length;
    onAnswer(answers, isCorrect);
  };

  const isComplete = answers.every(answer => answer.trim() !== "");

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 animate-fade-in">
      <CardHeader>
        <CardTitle className="text-white text-2xl">{question.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {question.blanks?.map((blank, index) => (
          <div key={index} className="space-y-3">
            <p className="text-white text-lg">{blank.text}</p>
            <Input
              placeholder="Type your answer here..."
              value={answers[index]}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              className="bg-white/10 border-white/30 text-white placeholder:text-white/50 text-lg p-4"
            />
          </div>
        ))}
        
        <Button 
          onClick={handleSubmit}
          disabled={!isComplete}
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-3 text-lg"
        >
          Submit Answers
        </Button>
      </CardContent>
    </Card>
  );
};

export default FillInBlank;
