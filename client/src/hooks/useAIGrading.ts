
import { useState } from 'react';

interface UseAIGradingProps {
  submission: any;
  calculateActualWordCount: () => number;
  toast: any;
  onGradingComplete?: () => void;
}

export const useAIGrading = ({ submission, calculateActualWordCount, toast, onGradingComplete }: UseAIGradingProps) => {
  const [isGrading, setIsGrading] = useState(false);
  const [aiScore, setAiScore] = useState<number>(submission?.overall_score || 0);
  const [aiFeedback, setAiFeedback] = useState<string>('');

  const handleAIGrading = async () => {
    if (!submission) return;

    setIsGrading(true);
    try {
      // Simulate AI grading process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock AI feedback based on essay content
      const wordCount = calculateActualWordCount();
      const hasAllParagraphs = submission.opening_paragraph && 
                              submission.body_paragraph_1 && 
                              submission.conclusion_paragraph;
      
      let score = 70; // Base score
      let feedback = "AI Assessment:\n\n";
      
      // Adjust score based on word count
      if (wordCount >= 300) {
        score += 10;
        feedback += "✓ Good length and depth of content\n";
      } else if (wordCount >= 200) {
        score += 5;
        feedback += "• Adequate length, could be more detailed\n";
      } else {
        feedback += "• Essay could benefit from more detailed content\n";
      }
      
      // Check structure
      if (hasAllParagraphs) {
        score += 10;
        feedback += "✓ Well-structured with clear introduction and conclusion\n";
      } else {
        feedback += "• Consider improving essay structure\n";
      }
      
      // Check for multiple body paragraphs
      if (submission.body_paragraph_2 && submission.body_paragraph_3) {
        score += 5;
        feedback += "✓ Multiple body paragraphs show good organization\n";
      }
      
      feedback += "\nStrengths:\n";
      feedback += "• Student demonstrated understanding of the topic\n";
      feedback += "• Clear writing style\n";
      
      feedback += "\nAreas for improvement:\n";
      feedback += "• Consider adding more specific examples\n";
      feedback += "• Work on transitions between paragraphs\n";
      
      score = Math.min(100, Math.max(0, score));
      
      setAiScore(score);
      setAiFeedback(feedback);
      
      // Save to database
      const response = await fetch(`/api/writing-submissions/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai_feedback: { content: feedback, generated_at: new Date().toISOString() },
          overall_score: score
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to save AI grading');
      }

      toast({
        title: "AI Grading Complete",
        description: `Essay graded with score: ${score}/100`,
      });

      if (onGradingComplete) {
        onGradingComplete();
      }
    } catch (error) {
      console.error('AI grading error:', error);
      toast({
        title: "Error",
        description: "Failed to complete AI grading",
        variant: "destructive"
      });
    } finally {
      setIsGrading(false);
    }
  };

  return {
    handleAIGrading,
    isGrading,
    aiScore,
    setAiScore,
    aiFeedback,
    setAiFeedback
  };
};
