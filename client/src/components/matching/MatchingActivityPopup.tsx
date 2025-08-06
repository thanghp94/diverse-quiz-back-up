import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';
import Matching from '@/components/quiz/Matching';
import { Question } from '@/features/quiz/types';
import { MatchingActivityTracker, type MatchingActivityTrackerRef } from './MatchingActivityTracker';
import { useToast } from "@/hooks/use-toast";

type MatchingActivityData = {
    id: string;
    type: string | null;
    description: string | null;
    [key: string]: any;
};

interface ContentData {
  id: string;
  title: string;
  short_description: string | null;
  imageid: string | null;
}

interface ImageData {
  id: string;
  imagelink: string | null;
  contentid: string | null;
}

interface MatchingActivityPopupProps {
  isOpen: boolean;
  onClose: () => void;
  matchingId: string;
}

const fetchMatchingActivity = async (id: string): Promise<MatchingActivityData> => {
  const response = await fetch(`/api/matching/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch matching activity');
  }
  return response.json();
};

const fetchContent = async (): Promise<ContentData[]> => {
  const response = await fetch('/api/content');
  if (!response.ok) {
    throw new Error('Failed to fetch content');
  }
  return response.json();
};

const fetchImages = async (): Promise<ImageData[]> => {
  const response = await fetch('/api/images');
  if (!response.ok) {
    throw new Error('Failed to fetch images');
  }
  return response.json();
};

// Fisher-Yates shuffle algorithm for randomizing arrays
const shuffleArray = (array: any[]): any[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const transformToQuestions = async (activity: MatchingActivityData): Promise<Question[]> => {
  const questions: Question[] = [];
  const types = activity.type?.split(', ') || [];

  // Debug logging for content ID verification
  console.log('🔍 Activity data:', activity);
  console.log('📋 Content IDs from prompts:', {
    prompt1: activity.prompt1,
    prompt2: activity.prompt2,
    prompt3: activity.prompt3,
    prompt4: activity.prompt4,
    prompt5: activity.prompt5,
    prompt6: activity.prompt6,
  });

  if (types.length === 0) {
    // Fallback to original behavior if no type specified
    const pairs = [];
    for (let i = 1; i <= 6; i++) {
      if (activity[`prompt${i}`] && activity[`choice${i}`]) {
        pairs.push({ left: activity[`prompt${i}`], right: activity[`choice${i}`] });
      }
    }
    return [{
      id: activity.id,
      question: activity.description || 'Match the corresponding items.',
      type: 'matching' as const,
      pairs: pairs,
    }];
  }

  const [content, images] = await Promise.all([fetchContent(), fetchImages()]);
  console.log('📚 Total content items loaded:', content.length);
  console.log('🖼️ Total images loaded:', images.length);

  // First, collect and validate all content IDs for the activity
  const allContentIds = [];
  for (let i = 1; i <= 6; i++) {
    const contentId = activity[`prompt${i}`];
    if (contentId) allContentIds.push(contentId);
  }

  console.log(`🔗 Activity ${activity.id} has ${allContentIds.length} content IDs: ${allContentIds.join(', ')}`);

  // Find valid content items that exist in the database
  const validContentItems = [];
  const missingContentIds = [];

  for (const contentId of allContentIds) {
    const contentItem = content.find(c => c.id === contentId);
    if (contentItem) {
      validContentItems.push({ id: contentId, item: contentItem });
    } else {
      missingContentIds.push(contentId);
    }
  }

  console.log(`📊 Content validation: ${validContentItems.length} found, ${missingContentIds.length} missing`);
  if (missingContentIds.length > 0) {
    console.log(`❌ Missing content IDs: ${missingContentIds.join(', ')}`);
  }

  for (const type of types) {
    if (type === 'picture-title') {
      const pairs = [];

      // Process valid content items for picture-title matching
      for (const { id: contentId, item: contentItem } of validContentItems) {
        // Find image for this content
        const image = images.find(img => 
          img.contentid === contentId || 
          img.id === contentItem.imageid
        );

        if (image && image.imagelink && contentItem.title && contentItem.title.trim()) {
          console.log(`✅ Adding picture-title pair: "${contentItem.title}" with image`);
          pairs.push({ 
            left: image.imagelink, 
            right: contentItem.title,
            leftType: 'image',
            leftContentId: contentId,
            rightContentId: contentId
          });
        } else {
          console.log(`⚠️ Skipping content ${contentId}: missing ${!image?.imagelink ? 'image' : 'title'}`);
        }
      }

      console.log('🎯 Picture-title pairs generated:', pairs.length);

      if (pairs.length > 0) {
        // Create a map to track which content ID each right item belongs to
        const rightItemToContentId = new Map();
        pairs.forEach(pair => {
          rightItemToContentId.set(pair.right, pair.rightContentId);
        });
        
        // Shuffle the right items
        const rightItems = shuffleArray([...pairs.map(pair => pair.right)]);
        
        const randomizedPairs = pairs.map((pair, index) => ({
          left: pair.left,
          right: rightItems[index], // Use shuffled right items
          leftType: pair.leftType,
          leftContentId: pair.leftContentId,
          rightContentId: rightItemToContentId.get(rightItems[index]) // Get correct content ID for shuffled item
        }));

        questions.push({
          id: `${activity.id}-picture-title`,
          question: 'Match the pictures with their titles.',
          type: 'matching' as const,
          pairs: randomizedPairs,
        });
      }
    }

    if (type === 'title-description') {
      const pairs = [];

      console.log(`📝 Processing ${validContentItems.length} valid content items for title-description matching`);

      for (const { id: contentId, item: contentItem } of validContentItems) {
        if (contentItem.title && contentItem.title.trim() && 
            contentItem.short_description && contentItem.short_description.trim()) {
          console.log(`✅ Adding title-description pair: "${contentItem.title}" with description`);
          pairs.push({ 
            left: contentItem.title, 
            right: contentItem.short_description,
            leftContentId: contentId,
            rightContentId: contentId
          });
        } else {
          const missing = [];
          if (!contentItem.title || !contentItem.title.trim()) missing.push('title');
          if (!contentItem.short_description || !contentItem.short_description.trim()) missing.push('description');
          console.log(`⚠️ Skipping content ${contentId}: missing ${missing.join(' and ')}`);
        }
      }

      console.log('📋 Title-description pairs generated:', pairs.length);

      if (pairs.length > 0) {
        // Create a map to track which content ID each right item belongs to
        const rightItemToContentId = new Map();
        pairs.forEach(pair => {
          rightItemToContentId.set(pair.right, pair.rightContentId);
        });
        
        // Shuffle the right items
        const rightItems = shuffleArray([...pairs.map(pair => pair.right)]);
        
        const randomizedPairs = pairs.map((pair, index) => ({
          left: pair.left,
          right: rightItems[index], // Use shuffled right items
          leftContentId: pair.leftContentId,
          rightContentId: rightItemToContentId.get(rightItems[index]) // Get correct content ID for shuffled item
        }));

        questions.push({
          id: `${activity.id}-title-description`,
          question: 'Match the titles with their descriptions.',
          type: 'matching' as const,
          pairs: randomizedPairs,
        });
      }
    }
  }

  console.log('🎮 Total questions generated:', questions.length);
  return questions;
};

export const MatchingActivityPopup = ({ isOpen, onClose, matchingId }: MatchingActivityPopupProps) => {
  const { toast } = useToast();
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [currentQuizPhase, setCurrentQuizPhase] = useState<'picture-title' | 'title-description' | null>(null);
  const trackerRef = useRef<MatchingActivityTrackerRef>(null);

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const studentId = currentUser.id || 'guest_user';

  const { data: activity, isLoading, error } = useQuery({
    queryKey: ['matchingActivity', matchingId],
    queryFn: () => fetchMatchingActivity(matchingId),
    enabled: !!matchingId && isOpen,
  });

  // Transform activity to questions when activity data changes
  useEffect(() => {
    if (activity && isOpen) {
      setIsLoadingQuestions(true);
      transformToQuestions(activity)
        .then(generatedQuestions => {
          setQuestions(generatedQuestions);
          setCurrentQuestionIndex(0);

          // Determine initial quiz phase for sequential matching
          const matchingTypes = (activity.type || '').split(', ');
          const hasSequentialMatching = matchingTypes.includes('picture-title') && matchingTypes.includes('title-description');

          if (hasSequentialMatching) {
            setCurrentQuizPhase('picture-title');
          } else {
            setCurrentQuizPhase(null);
          }
        })
        .catch(error => {
          console.error('Error generating questions:', error);
          toast({
            title: 'Error',
            description: 'Failed to load matching questions',
            variant: 'destructive',
          });
        })
        .finally(() => {
          setIsLoadingQuestions(false);
        });
    }
  }, [activity, isOpen, toast]);

  // Reset state when popup opens/closes
  useEffect(() => {
    if (!isOpen) {
      setQuestions([]);
      setCurrentQuestionIndex(0);
      setCurrentAttemptId(null);
      setCurrentQuizPhase(null);
    }
  }, [isOpen]);

  const handleAttemptStart = (attemptId: string) => {
    setCurrentAttemptId(attemptId);
    console.log('Attempt started:', attemptId);
  };

  const handleNextPhase = () => {
    const matchingTypes = (activity?.type || '').split(', ');
    const hasSequentialMatching = matchingTypes.includes('picture-title') && matchingTypes.includes('title-description');

    if (hasSequentialMatching && currentQuizPhase === 'picture-title') {
      // Move to the next question (title-description phase) 
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentQuizPhase('title-description');
      toast({
        title: 'Phase 1 Complete!',
        description: 'Now starting title-description matching phase',
      });
    }
  };

  const handleAnswer = (answer: any, isCorrect: boolean) => {
    console.log('Answer submitted', { answer, isCorrect });

    // Calculate score details for display
    const currentQuestion = questions[currentQuestionIndex];
    const totalPairs = currentQuestion?.pairs?.length || Object.keys(answer).length;
    let correctCount = 0;

    if (currentQuestion?.pairs) {
      currentQuestion.pairs.forEach((pair: any) => {
        if (answer[pair.left] === pair.right) {
          correctCount++;
        }
      });
    }

    const score = totalPairs > 0 ? Math.round((correctCount / totalPairs) * 100) : 0;

    // For sequential matching, don't auto-advance - let user click "Continue"
    const matchingTypes = (activity?.type || '').split(', ');
    const hasSequentialMatching = matchingTypes.includes('picture-title') && matchingTypes.includes('title-description');

    // Check if there are more questions to complete
    const isLastQuestion = currentQuestionIndex >= questions.length - 1;
    const isFirstPhaseOfSequential = hasSequentialMatching && currentQuizPhase === 'picture-title';

    if (isLastQuestion && !isFirstPhaseOfSequential) {
      // Only complete if it's truly the last activity
      if (trackerRef.current && currentAttemptId) {
        // Pass the isCorrect boolean directly instead of letting tracker recalculate
        trackerRef.current.completeAttempt(answer, score, 100, isCorrect);
      }

      toast({
        title: isCorrect ? 'Perfect Match!' : 'Activity Complete!',
        description: isCorrect 
          ? 'You matched all items correctly! Great job!' 
          : `You got ${correctCount} out of ${totalPairs} matches correct (${score}%). Keep practicing!`,
        variant: isCorrect ? 'default' : 'destructive',
      });

      // Don't auto-close - let user manually close the popup
    } else if (isFirstPhaseOfSequential) {
      // For first phase of sequential matching, show feedback but don't auto-advance
      // The user must click "Continue to Title-Description Matching" button
      toast({
        title: isCorrect ? 'Phase 1 Complete!' : 'Phase 1 Done!',
        description: isCorrect 
          ? `Perfect! You got all ${totalPairs} matches correct. Click continue for the next phase.`
          : `You got ${correctCount} out of ${totalPairs} matches correct (${score}%). Click continue for the next phase.`,
        variant: isCorrect ? 'default' : 'destructive',
      });
    } else {
      // Move to next question (for non-sequential multi-question activities)
      setCurrentQuestionIndex(prev => prev + 1);
      toast({
        title: 'Question Complete!',
        description: `You got ${correctCount} out of ${totalPairs} matches correct. Moving to the next question.`,
      });
    }
  };

  const handleAttemptComplete = (score: number, isCorrect: boolean) => {
    setCurrentAttemptId(null);
    console.log('Attempt completed with score:', score);
  };

  if (!isOpen) return null;

  const currentQuestion = questions[currentQuestionIndex];
  const isMultiQuestion = questions.length > 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold">
            {activity?.description || 'Matching Activity'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Interactive matching activity with drag and drop functionality
          </DialogDescription>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Activity Area */}
          <div className="flex-1 flex flex-col">
            {isLoading || isLoadingQuestions ? (
              <div className="flex-1 flex justify-center items-center bg-gray-900 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            ) : error || !activity ? (
              <div className="flex-1 flex justify-center items-center bg-gray-900 rounded-lg">
                <p className="text-red-500">Error loading activity.</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="flex-1 flex justify-center items-center bg-gray-900 rounded-lg">
                <p className="text-yellow-500">No matching questions found for this activity.</p>
              </div>
            ) : (
              <div className="flex-1 bg-white text-black rounded-lg p-4 flex flex-col overflow-hidden">
                
                <div className="flex-1">
                  <Matching 
                    question={currentQuestion} 
                    onAnswer={handleAnswer}
                    currentQuizPhase={currentQuizPhase}
                    onNextPhase={handleNextPhase}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Hidden Activity Tracker for functionality */}
          <div className="hidden">
            <MatchingActivityTracker
              ref={trackerRef}
              matchingId={matchingId}
              studentId={studentId}
              onAttemptStart={handleAttemptStart}
              onAttemptComplete={handleAttemptComplete}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchingActivityPopup;