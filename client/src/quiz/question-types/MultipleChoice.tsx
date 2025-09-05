
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Question } from "@/quiz/types";

interface MultipleChoiceProps {
  question: Question;
  onAnswer: (answer: any, isCorrect: boolean) => void;
  studentTryId?: string;
}

const MultipleChoice = ({ question, onAnswer, studentTryId }: MultipleChoiceProps) => {
  const [selectedOption, setSelectedOption] = useState<string>("");

  const handleSubmit = () => {
    if (!selectedOption) return;
    
    const selectedIndex = parseInt(selectedOption);
    const isCorrect = selectedIndex === question.correct;
    onAnswer(selectedIndex, isCorrect);
  };

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 animate-fade-in">
      <CardHeader>
        <CardTitle className="text-white text-2xl">{question.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
          {question.options?.map((option, index) => (
            <div key={index} className="flex items-center space-x-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <RadioGroupItem value={index.toString()} id={`option-${index}`} className="border-white/50" />
              <Label 
                htmlFor={`option-${index}`} 
                className="text-white text-lg cursor-pointer flex-1"
              >
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
        
        <Button 
          onClick={handleSubmit}
          disabled={!selectedOption}
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-3 text-lg"
        >
          Submit Answer
        </Button>
      </CardContent>
    </Card>
  );
};

export default MultipleChoice;
