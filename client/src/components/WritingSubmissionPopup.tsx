
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Star, FileText, User, Calendar, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WritingSubmission {
  id: string;
  student_id: string;
  prompt_id: string;
  title: string;
  opening_paragraph: string;
  body_paragraph_1: string;
  body_paragraph_2: string;
  body_paragraph_3: string;
  conclusion_paragraph: string;
  full_essay: string;
  ai_feedback: any;
  overall_score: number;
  word_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface WritingSubmissionPopupProps {
  submission: WritingSubmission | null;
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
  onGradingComplete?: () => void;
}

export const WritingSubmissionPopup: React.FC<WritingSubmissionPopupProps> = ({
  submission,
  isOpen,
  onClose,
  studentName,
  onGradingComplete
}) => {
  const [isGrading, setIsGrading] = useState(false);
  const [aiScore, setAiScore] = useState<number>(submission?.overall_score || 0);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const { toast } = useToast();

  if (!submission) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const calculateActualWordCount = () => {
    const totalWords = [
      submission.opening_paragraph,
      submission.body_paragraph_1,
      submission.body_paragraph_2,
      submission.body_paragraph_3,
      submission.conclusion_paragraph
    ].reduce((total, paragraph) => total + getWordCount(paragraph || ''), 0);
    return totalWords;
  };

  const { handleAIGrading, isGrading, aiScore, setAiScore, aiFeedback, setAiFeedback } = useAIGrading({
    submission,
    calculateActualWordCount,
    toast,
    onGradingComplete
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return "default";
    if (score >= 80) return "secondary";
    if (score >= 70) return "outline";
    return "destructive";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Writing Submission
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">{submission.title || 'Untitled Essay'}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {studentName || submission.student_id}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(submission.created_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {calculateActualWordCount()} words
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{submission.status}</Badge>
                  {submission.overall_score > 0 && (
                    <Badge variant={getScoreBadgeVariant(submission.overall_score)}>
                      {submission.overall_score}/100
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Essay Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Essay Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Introduction */}
              {submission.opening_paragraph && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-gray-700">Introduction</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap leading-relaxed">{submission.opening_paragraph}</p>
                  </div>
                </div>
              )}

              {/* Body Paragraphs */}
              {[
                { content: submission.body_paragraph_1, title: "Body Paragraph 1" },
                { content: submission.body_paragraph_2, title: "Body Paragraph 2" },
                { content: submission.body_paragraph_3, title: "Body Paragraph 3" }
              ].map((paragraph, index) => 
                paragraph.content && (
                  <div key={index}>
                    <h4 className="font-semibold text-sm mb-2 text-gray-700">{paragraph.title}</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="whitespace-pre-wrap leading-relaxed">{paragraph.content}</p>
                    </div>
                  </div>
                )
              )}

              {/* Conclusion */}
              {submission.conclusion_paragraph && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-gray-700">Conclusion</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap leading-relaxed">{submission.conclusion_paragraph}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Grading Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5" />
                AI Grading
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!submission.ai_feedback && !aiFeedback ? (
                <div className="text-center py-6">
                  <p className="text-gray-600 mb-4">This essay has not been graded by AI yet.</p>
                  <Button 
                    onClick={handleAIGrading} 
                    disabled={isGrading}
                    className="flex items-center gap-2"
                  >
                    {isGrading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Star className="h-4 w-4" />
                    )}
                    {isGrading ? 'Grading Essay...' : 'Grade with AI'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Score Display */}
                  <div className="flex items-center gap-4">
                    <Label htmlFor="score">Overall Score:</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="score"
                        type="number"
                        min="0"
                        max="100"
                        value={aiScore}
                        onChange={(e) => setAiScore(parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">/ 100</span>
                      <span className={`font-semibold ${getScoreColor(aiScore)}`}>
                        {aiScore >= 90 ? 'Excellent' : 
                         aiScore >= 80 ? 'Good' : 
                         aiScore >= 70 ? 'Satisfactory' : 'Needs Improvement'}
                      </span>
                    </div>
                  </div>

                  {/* Feedback */}
                  <div>
                    <Label htmlFor="feedback">AI Feedback:</Label>
                    <Textarea
                      id="feedback"
                      value={aiFeedback || (submission.ai_feedback?.content || '')}
                      onChange={(e) => setAiFeedback(e.target.value)}
                      rows={8}
                      className="mt-2"
                      placeholder="AI feedback will appear here..."
                    />
                  </div>

                  {/* Re-grade Button */}
                  <Button 
                    onClick={handleAIGrading} 
                    disabled={isGrading}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isGrading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Star className="h-4 w-4" />
                    )}
                    {isGrading ? 'Re-grading...' : 'Re-grade with AI'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
