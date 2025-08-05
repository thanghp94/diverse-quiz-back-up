import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, X, Shuffle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Matching from "./quiz/Matching";
import { MatchingActivityTracker, MatchingActivityTrackerRef } from "./MatchingActivityTracker";

interface TopicMatchingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  topicId: string;
  topicName: string;
}

import type { Question } from '@/features/quiz/types';

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
  topicid: string | null;
}

interface ImageData {
  id: string;
  imagelink: string | null;
  contentid: string | null;
}

const fetchMatchingActivities = async (): Promise<MatchingActivityData[]> => {
  const response = await fetch('/api/matching');
  if (!response.ok) {
    throw new Error('Failed to fetch matching activities');
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

const generateTopicBasedQuestions = async (topicId: string, activities: MatchingActivityData[]): Promise<Question[]> => {
  const questions: Question[] = [];

  const [content, images] = await Promise.all([fetchContent(), fetchImages()]);

  // Filter content for this specific topic
  const topicContent = content.filter(c => c.topicid === topicId);

  if (topicContent.length === 0) {
    console.log(`No content found for topic ${topicId}`);
    return questions;
  }

  console.log(`Found ${topicContent.length} content items for topic ${topicId}`);

  // Create picture-title matching from topic content
  const pairs = [];
  for (const contentItem of topicContent) {
    const image = images.find(img => 
      img.contentid === contentItem.id || 
      img.id === contentItem.imageid
    );

    if (image && image.imagelink && contentItem.title && contentItem.title.trim()) {
      pairs.push({ 
        left: image.imagelink, 
        right: contentItem.title
      });
    }
  }

  if (pairs.length > 0) {
    questions.push({
      id: `topic-matching-${topicId}`,
      question: `Match the images with their corresponding titles`,
      type: 'matching',
      pairs: pairs.map(pair => ({ left: pair.left, right: pair.right }))
    });
  }

  console.log(`Generated ${questions.length} questions for topic ${topicId}`);
  return questions;
};

export const TopicMatchingPopup = ({ isOpen, onClose, topicId, topicName }: TopicMatchingPopupProps) => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const trackerRef = useRef<MatchingActivityTrackerRef>(null);

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const studentId = currentUser.id || 'guest_user';

  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['matchingActivities'],
    queryFn: fetchMatchingActivities,
    enabled: isOpen,
  });

  // Generate questions when popup opens
  useEffect(() => {
    if (activities && isOpen && topicId) {
      setIsLoadingQuestions(true);
      generateTopicBasedQuestions(topicId, activities)
        .then(generatedQuestions => {
          setQuestions(generatedQuestions);
          setCurrentQuestionIndex(0);
        })
        .catch(error => {
          console.error('Error generating topic questions:', error);
          toast({
            title: 'Error',
            description: 'Failed to load matching questions for this topic',
            variant: 'destructive',
          });
        })
        .finally(() => {
          setIsLoadingQuestions(false);
        });
    }
  }, [activities, isOpen, topicId, toast]);

  // Reset state when popup closes
  useEffect(() => {
    if (!isOpen) {
      setQuestions([]);
      setCurrentQuestionIndex(0);
      setCurrentAttemptId(null);
    }
  }, [isOpen]);

  const handleAttemptStart = (attemptId: string) => {
    setCurrentAttemptId(attemptId);
    console.log('Topic matching attempt started:', attemptId);
  };

  const handleAnswer = (answer: any, isCorrect: boolean) => {
    console.log('Topic matching answer submitted', { answer, isCorrect });

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

    // Check if there are more questions to complete
    const isLastQuestion = currentQuestionIndex >= questions.length - 1;

    if (isLastQuestion) {
      // Save the attempt with final scoring details
      if (trackerRef.current && currentAttemptId) {
        trackerRef.current.completeAttempt(answer, score, 100);
      }

      toast({
        title: isCorrect ? 'Perfect Match!' : 'Activity Complete!',
        description: isCorrect 
          ? 'You matched all items correctly! Great job!' 
          : `You got ${correctCount} out of ${totalPairs} matches correct (${score}%). Keep practicing!`,
        variant: isCorrect ? 'default' : 'destructive',
      });

      // Close popup after completion
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
      toast({
        title: 'Question Complete!',
        description: `You got ${correctCount} out of ${totalPairs} matches correct. Moving to the next question.`,
      });
    }
  };

  const handleAttemptComplete = (score: number, isCorrect: boolean) => {
    setCurrentAttemptId(null);
    console.log('Topic matching attempt completed with score:', score);
  };

  if (!isOpen) return null;

  const currentQuestion = questions[currentQuestionIndex];
  const isMultiQuestion = questions.length > 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Shuffle className="h-6 w-6" />
            {topicName} - Matching Activity
          </DialogTitle>
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
          <div className="flex-1 flex flex-col">
            {isLoading || isLoadingQuestions ? (
              <div className="flex-1 flex justify-center items-center bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <span className="ml-3 text-white">Loading matching activities...</span>
              </div>
            ) : error ? (
              <div className="flex-1 flex justify-center items-center bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg">
                <p className="text-red-500">Error loading matching activities.</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="flex-1 flex justify-center items-center bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg">
                <div className="text-center">
                  <Shuffle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                  <p className="text-yellow-500 text-lg">No matching activities found for this topic.</p>
                  <p className="text-gray-400 text-sm mt-2">This topic may not have enough content with images for matching activities.</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-lg p-6 flex flex-col">
                {isMultiQuestion && (
                  <div className="mb-6 text-center">
                    <div className="text-lg font-semibold text-white">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </div>
                    <div className="text-sm text-gray-300">
                      Topic-based matching activity
                    </div>
                  </div>
                )}
                <div className="flex-1">
                  <Matching question={currentQuestion} onAnswer={handleAnswer} />
                </div>
              </div>
            )}
          </div>

          {/* Hidden Activity Tracker for functionality */}
          <div className="hidden">
            <MatchingActivityTracker
              ref={trackerRef}
              matchingId={`topic-${topicId}`}
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

export default TopicMatchingPopup;