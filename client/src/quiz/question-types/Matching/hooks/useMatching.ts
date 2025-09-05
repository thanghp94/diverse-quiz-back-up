// 📁 hooks/useMatching.ts

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Question } from '@/quiz/types';

// These are pure functions, perfect to live here.
const isImageItem = (item: string) => {
  if (!item.startsWith('http')) return false;

  // Check for direct image extensions
  if (item.includes('.jpg') || item.includes('.jpeg') || item.includes('.png') || item.includes('.webp') || item.includes('.gif')) {
    return true;
  }

  // Check for Google image URLs or other image service URLs that don't have file extensions
  if (item.includes('gstatic.com') || item.includes('googleusercontent.com') || 
      item.includes('imgur.com') || item.includes('wikimedia.org') ||
      item.includes('upload.wikimedia.org') || item.includes('images?q=') ||
      item.includes('scene7.com') || item.includes('ytimg.com') ||
      item.includes('afdc.energy.gov') || item.includes('pubaffairsbruxelles.eu')) {
    return true;
  }

  return false;
};

const shuffleArray = (array: string[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const useMatching = (
  question: Question, 
  currentQuizPhase: 'picture-title' | 'title-description' | null | undefined,
  onAnswer: (answer: any, isCorrect: boolean) => void,
  onNextPhase?: () => void,
  activityTitle?: string
) => {
  // Simple state - no complex objects or computed values in state
  const [matches, setMatches] = useState<{[key: string]: string}>({});
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [correctMatches, setCorrectMatches] = useState<{[key: string]: boolean}>({});
  const [startTime] = useState(new Date());
  const [shuffledRightItems, setShuffledRightItems] = useState<string[]>([]);

  // Use refs to store values that shouldn't trigger re-renders
  const dragCounter = useRef(0);
  const hasInitialized = useRef(false);
  const lastQuestionId = useRef<string | undefined>(undefined);
  const lastPhase = useRef<string | null | undefined>(undefined);

  // Check if this is a sequential matching quiz
  const questionIdStr = String(question.id);
  const hasSequentialMatching = questionIdStr.includes('picture-title') || questionIdStr.includes('title-description');
  const isSequentialPictureTitle = questionIdStr.includes('picture-title');
  const isSequentialTitleDescription = questionIdStr.includes('title-description');

  // Determine the current phase
  const inferredPhase = isSequentialPictureTitle ? 'picture-title' : isSequentialTitleDescription ? 'title-description' : null;
  const effectiveMatchingType = currentQuizPhase || inferredPhase || question.type;

  // Process pairs only when needed - keep this simple
  const allPairs = question.pairs || [];
  console.log(`🎮 Processing pairs - Total available: ${allPairs.length}, Current phase: ${currentQuizPhase}`);

  const filteredPairs = hasSequentialMatching && currentQuizPhase 
    ? allPairs.filter(pair => {
        const isImageLeft = isImageItem(pair.left);
        const isImageRight = isImageItem(pair.right);
        if (currentQuizPhase === 'picture-title') {
          // For picture-title matching, we want pairs with one image and one text
          const shouldInclude = (isImageLeft && !isImageRight) || (!isImageLeft && isImageRight);
          if (!shouldInclude) {
            console.log(`❌ Filtering out pair: left="${pair.left}" (${isImageLeft ? 'image' : 'text'}), right="${pair.right}" (${isImageRight ? 'image' : 'text'})`);
          } else {
            console.log(`✅ Including pair: left="${pair.left}" (${isImageLeft ? 'image' : 'text'}), right="${pair.right}" (${isImageRight ? 'image' : 'text'})`);
          }
          return shouldInclude;
        } else {
          // For title-description matching, we want pairs with no images (both text)
          return !isImageLeft && !isImageRight;
        }
      })
    : allPairs;

  console.log(`🎯 Filtered pairs count: ${filteredPairs.length}`);

  const leftItems = filteredPairs.map(pair => pair.left);
  const rightItems = filteredPairs.map(pair => pair.right);

  console.log(`📍 Left items count: ${leftItems.length}, Right items count: ${rightItems.length}`);

  // Simple initialization effect - runs only once per question or phase change
  useEffect(() => {
    const currentQuestionId = question?.id;
    const currentPhase = currentQuizPhase;

    // Only reset if question or phase actually changed
    const questionChanged = lastQuestionId.current !== currentQuestionId;
    const phaseChanged = hasSequentialMatching && lastPhase.current !== currentPhase;

    if (!hasInitialized.current || questionChanged || phaseChanged) {
      console.log('Initializing matching component:', { questionChanged, phaseChanged, currentQuestionId, currentPhase });

      // Reset all state
      setMatches({});
      setDraggedItem(null);
      setIsSubmitting(false);
      setIsSubmitted(false);
      setShowResults(false);
      setCorrectMatches({});

      // Shuffle right items
      setShuffledRightItems(shuffleArray(rightItems));

      // Update refs
      lastQuestionId.current = String(currentQuestionId);
      lastPhase.current = currentPhase;
      hasInitialized.current = true;

      dragCounter.current = 0;
    }
  }, [question?.id, currentQuizPhase, hasSequentialMatching, rightItems.join(',')]); // Include rightItems serialized to detect changes

  const getTextStyling = (text: string, isInDropZone: boolean = false) => {
    const wordCount = text.split(/\s+/).length;
    const charCount = text.length;

    if (effectiveMatchingType === 'title-description' || effectiveMatchingType?.includes('title-description')) {
      if (isInDropZone) {
        // For drop zones, make text bigger and more responsive
        return {
          fontSize: charCount > 200 ? 'text-sm' : charCount > 100 ? 'text-base' : charCount > 50 ? 'text-lg' : 'text-xl',
          alignment: 'text-center',
          weight: 'font-medium',
          lineHeight: 'leading-relaxed'
        };
      } else {
        return {
          fontSize: wordCount > 30 ? 'text-xs' : wordCount > 20 ? 'text-sm' : 'text-base',
          alignment: 'text-center',
          weight: 'font-medium',
          lineHeight: 'leading-tight'
        };
      }
    } else if (effectiveMatchingType === 'picture-title' || effectiveMatchingType?.includes('picture-title')) {
      // For picture-title matching, always keep text centered and large
      return {
        fontSize: wordCount > 15 ? 'text-lg' : wordCount > 10 ? 'text-xl' : 'text-2xl',
        alignment: 'text-center',
        weight: 'font-bold',
        lineHeight: 'leading-tight'
      };
    }

    return {
      fontSize: 'text-base',
      alignment: 'text-center',
      weight: 'font-medium',
      lineHeight: 'leading-tight'
    };
  };

  const handleDragStart = useCallback((e: React.DragEvent, item: string) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    dragCounter.current--;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, rightItem: string | null = null) => {
    e.preventDefault();
    dragCounter.current = 0;

    if (draggedItem) {
      const newMatches = { ...matches };

      // If dropping back to top area (rightItem is null), remove the match
      if (rightItem === null) {
        // Remove the dragged item from matches (move back to top)
        Object.keys(newMatches).forEach(key => {
          if (key === draggedItem) {
            delete newMatches[key];
          }
        });
      } else {
        // Remove any existing match for this right item
        Object.keys(newMatches).forEach(key => {
          if (newMatches[key] === rightItem) {
            delete newMatches[key];
          }
        });

        newMatches[draggedItem] = rightItem;
      }
      
      setMatches(newMatches);
    }
    setDraggedItem(null);
  }, [draggedItem, matches]);

  const getContentIdForItem = useCallback((item: string, pairs: any[]): string | null => {
    // Find which content ID this item belongs to by checking all pairs
    for (const pair of pairs) {
      if (pair.left === item && pair.leftContentId) {
        return pair.leftContentId;
      }
      if (pair.right === item && pair.rightContentId) {
        return pair.rightContentId;
      }
    }
    return null;
  }, []);

  const handleCheckResults = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    let correctCount = 0;
    const relevantPairs = filteredPairs;
    const newCorrectMatches: {[key: string]: boolean} = {};

    console.log('Checking results for pairs:', relevantPairs);
    console.log('User matches:', matches);

    relevantPairs.forEach(pair => {
      const userMatch = matches[pair.left];
      const correctMatch = pair.right;

      let isMatchCorrect = false;

      // Check if pair has content IDs for comparison
      if (pair.leftContentId && pair.rightContentId) {
        // For content ID-based matching, check if both the left and right items come from the same content
        const leftContentId = pair.leftContentId;
        const userMatchedContentId = getContentIdForItem(userMatch, relevantPairs);

        // The match is correct if the user selected an item from the same content as the left item
        isMatchCorrect = userMatchedContentId === leftContentId;
        console.log(`Content ID matching: Left item content ID is ${leftContentId}, user selected item from content ${userMatchedContentId}`);
      } else {
        // Fallback to direct value comparison for backward compatibility
        if (isImageItem(userMatch) || isImageItem(correctMatch)) {
          isMatchCorrect = userMatch === correctMatch;
        } else {
          const normalizedUserMatch = userMatch?.trim().toLowerCase();
          const normalizedCorrectMatch = correctMatch?.trim().toLowerCase();
          isMatchCorrect = normalizedUserMatch === normalizedCorrectMatch;
        }
      }

      console.log(`Pair: ${pair.left} -> ${pair.right}`);
      console.log(`User matched: ${userMatch}`);
      console.log(`Correct: ${isMatchCorrect}`);

      newCorrectMatches[pair.left] = isMatchCorrect;
      if (isMatchCorrect) {
        correctCount++;
      }
    });

    const totalPairs = relevantPairs.length;
    const score = Math.round((correctCount / totalPairs) * 100);
    const isCorrect = correctCount === totalPairs;

    console.log(`Score: ${correctCount}/${totalPairs} = ${score}%`);

    setCorrectMatches(newCorrectMatches);
    setShowResults(true);
    setIsSubmitted(true);

    onAnswer(matches, isCorrect);
    setIsSubmitting(false);
  }, [isSubmitting, filteredPairs, matches, getContentIdForItem, isImageItem, onAnswer]);

  const isComplete = Object.keys(matches).length === leftItems.length;

  return {
    // State
    matches,
    draggedItem,
    isSubmitting,
    isSubmitted,
    showResults,
    correctMatches,
    shuffledRightItems,
    
    // Computed values
    leftItems,
    rightItems,
    filteredPairs,
    effectiveMatchingType,
    hasSequentialMatching,
    isComplete,
    
    // Helper functions
    isImageItem,
    getTextStyling,
    
    // Event handlers
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleCheckResults,
  };
};
