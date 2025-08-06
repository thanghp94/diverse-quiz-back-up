import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shuffle, X } from "lucide-react";
// Removed Card imports as we're no longer using the Card component wrapper
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Question } from "@/features/quiz/types";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface MatchingProps {
  question: Question;
  onAnswer: (answer: any, isCorrect: boolean) => void;
  studentTryId?: string;
  onNextActivity?: () => void;
  onGoBack?: () => void;
  currentQuizPhase?: 'picture-title' | 'title-description' | null;
  onNextPhase?: () => void;
  onClose?: () => void;
  activityTitle?: string;
}

const Matching = ({ question, onAnswer, studentTryId, onNextActivity, onGoBack, currentQuizPhase, onNextPhase, onClose, activityTitle }: MatchingProps) => {
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

  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Helper functions (these are stable and won't cause re-renders)
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
          alignment: 'text-left',
          weight: 'font-medium',
          lineHeight: 'leading-relaxed'
        };
      } else {
        return {
          fontSize: wordCount > 30 ? 'text-xs' : wordCount > 20 ? 'text-sm' : 'text-base',
          alignment: 'text-left',
          weight: 'font-medium',
          lineHeight: 'leading-tight'
        };
      }
    } else if (effectiveMatchingType === 'picture-title' || effectiveMatchingType?.includes('picture-title')) {
      return {
        fontSize: wordCount > 15 ? 'text-lg' : wordCount > 10 ? 'text-xl' : 'text-2xl',
        alignment: 'text-center',
        weight: 'font-bold',
        lineHeight: 'leading-tight'
      };
    }

    return {
      fontSize: 'text-base',
      alignment: 'text-left',
      weight: 'font-medium',
      lineHeight: 'leading-tight'
    };
  };

  const handleDragStart = (e: React.DragEvent, item: string) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
  };

  const handleDragLeave = (e: React.DragEvent) => {
    dragCounter.current--;
  };

  const handleDrop = (e: React.DragEvent, rightItem: string) => {
    e.preventDefault();
    dragCounter.current = 0;

    if (draggedItem) {
      const newMatches = { ...matches };

      // Remove any existing match for this right item
      Object.keys(newMatches).forEach(key => {
        if (newMatches[key] === rightItem) {
          delete newMatches[key];
        }
      });

      newMatches[draggedItem] = rightItem;
      setMatches(newMatches);
    }
    setDraggedItem(null);
  };

  const getContentIdForItem = (item: string, pairs: any[]): string | null => {
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
  };

  const handleCheckResults = async () => {
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
  };

  const isComplete = Object.keys(matches).length === leftItems.length;

  // Auto-submit when all pairs are matched
  useEffect(() => {
    if (isComplete && !isSubmitted && !isSubmitting && Object.keys(matches).length > 0) {
      const timer = setTimeout(() => {
        handleCheckResults();
      }, 1000); // 1 second delay to show completion message

      return () => clearTimeout(timer);
    }
  }, [isComplete, isSubmitted, isSubmitting, matches]);

  return (
    <div className="h-full flex flex-col relative">
      {/* Close button positioned outside the modal */}
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute -top-12 -right-2 z-50 h-10 w-10 text-white hover:bg-white/20 hover:text-white bg-black/20 backdrop-blur-sm rounded-full border border-white/20"
        >
          <X className="h-5 w-5" />
        </Button>
      )}

      {/* Merged header with topic title, instructions, and controls */}
      <div className="flex justify-between items-center px-3 py-2 bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 shadow-lg">
        <div className="flex items-center gap-2">
          <Shuffle className="h-5 w-5 text-white" />
          <h1 className="text-lg font-bold text-white drop-shadow-lg">
            {activityTitle || question.description || question.topic}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {!isSubmitted ? (
            <div className="flex items-center gap-2">
              {isComplete && !isSubmitting && (
                <p className="text-sm text-white font-bold bg-gradient-to-r from-emerald-500 to-green-500 px-3 py-2 rounded-lg shadow-lg drop-shadow-lg">
                  ✓ All pairs matched! Click to complete.
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {hasSequentialMatching && currentQuizPhase === 'picture-title' ? (
                <Button
                  onClick={onNextPhase}
                  className="text-sm py-2 px-4 font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-300 hover:shadow-xl hover:scale-105 transition-all duration-300"
                  variant="default"
                >
                  Continue to Title-Description Matching →
                </Button>
              ) : (
                <Button
                  onClick={onNextActivity}
                  className="text-sm py-2 px-4 font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-300 hover:shadow-xl hover:scale-105 transition-all duration-300"
                  variant="default"
                >
                  Next Activity →
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main content area - enhanced styling */}
      <div className="flex-1 overflow-hidden px-3 py-2 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex flex-col gap-3 h-full bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-indigo-200 p-3">
          {/* Top Row - Source Items */}
          <div className="flex-shrink-0 mb-2">
            <div 
              className={`grid gap-2 ${
                leftItems.length <= 3 
                  ? 'grid-cols-3' 
                  : leftItems.length <= 4 
                  ? 'grid-cols-4' 
                  : leftItems.length <= 5 
                  ? 'grid-cols-5' 
                  : leftItems.length <= 6 
                  ? 'grid-cols-6' 
                  : 'grid-cols-7'
              }`}
            >
              {leftItems.map(item => {
                const isUsed = Object.keys(matches).includes(item);
                const isCorrect = showResults && correctMatches[item];
                const isIncorrect = showResults && correctMatches[item] === false;
                const itemIsImage = isImageItem(item);

                // Image debugging removed

                return (
                  <div
                    key={item}
                    draggable={!isUsed && !showResults}
                    onDragStart={(e) => handleDragStart(e, item)}
                    className={`relative p-1 rounded-xl text-white font-semibold transition-all duration-300 border-2 flex items-center justify-center shadow-lg transform hover:scale-105 hover:-translate-y-1 ${
                      itemIsImage ? 'h-32' : 'min-h-28 h-auto'
                    } ${
                      isCorrect 
                        ? 'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-400 cursor-not-allowed shadow-emerald-300'
                        : isIncorrect
                        ? 'bg-gradient-to-br from-rose-500 to-red-600 border-rose-400 cursor-not-allowed shadow-rose-300'
                        : isUsed 
                        ? 'bg-gradient-to-br from-slate-400 to-gray-500 border-slate-300 opacity-60 cursor-not-allowed' 
                        : (() => {
                            const colors = [
                              'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 hover:from-blue-600 hover:to-blue-700 shadow-blue-300',
                              'bg-gradient-to-br from-emerald-500 to-teal-600 border-teal-400 hover:from-emerald-600 hover:to-teal-700 shadow-teal-300',
                              'bg-gradient-to-br from-purple-500 to-violet-600 border-violet-400 hover:from-purple-600 hover:to-violet-700 shadow-violet-300',
                              'bg-gradient-to-br from-orange-500 to-amber-600 border-amber-400 hover:from-orange-600 hover:to-amber-700 shadow-amber-300',
                              'bg-gradient-to-br from-rose-500 to-pink-600 border-pink-400 hover:from-rose-600 hover:to-pink-700 shadow-pink-300',
                              'bg-gradient-to-br from-cyan-500 to-sky-600 border-sky-400 hover:from-cyan-600 hover:to-sky-700 shadow-sky-300'
                            ];
                            const index = leftItems.indexOf(item) % colors.length;
                            return `${colors[index]} cursor-move hover:shadow-xl`;
                          })()
                    }`}
                  >
                    {isImageItem(item) ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="cursor-pointer hover:opacity-80 transition-opacity w-full h-full flex items-center justify-center">
                            <img 
                              src={item} 
                              alt="Matching item" 
                              className="rounded"
                              style={{ 
                                maxWidth: '100%',
                                maxHeight: '120px',
                                objectFit: 'contain',
                                display: 'block',
                                margin: '0 auto'
                              }}
                              onLoad={(e) => {
                                const img = e.target as HTMLImageElement;
                                const container = img.parentElement;
                                if (container) {
                                  const containerWidth = container.clientWidth;
                                  const containerHeight = container.clientHeight || 200; // fallback height
                                  const aspectRatio = img.naturalWidth / img.naturalHeight;

                                  if (aspectRatio > 1) {
                                    // Landscape image - fit to width
                                    img.style.width = '100%';
                                    img.style.height = 'auto';
                                  } else {
                                    // Portrait or square image - fit to height
                                    img.style.height = `${Math.min(containerHeight, 200)}px`;
                                    img.style.width = 'auto';
                                  }
                                }
                              }}
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                const container = img.parentElement;
                                if (container) {
                                  container.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center bg-gray-200 rounded text-gray-500 text-sm">
                                      <div class="text-center">
                                        <div>🖼️</div>
                                        <div>Image not available</div>
                                      </div>
                                    </div>
                                  `;
                                }
                              }}
                            />
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-[98vw] max-h-[98vh] w-[98vw] h-[98vh] flex items-center justify-center p-2">
                          <img 
                            src={item} 
                            alt="Full size matching item" 
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              const container = img.parentElement;
                              if (container) {
                                container.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center bg-gray-200 rounded text-gray-500">
                                    <div class="text-center">
                                      <div class="text-4xl mb-2">🖼️</div>
                                      <div>Image not available</div>
                                    </div>
                                  </div>
                                `;
                              }
                            }}
                          />
                        </DialogContent>
                      </Dialog>
                    ) : (
                      (() => {
                        const styling = getTextStyling(item);
                        return (
                          <span className={`font-bold text-xl leading-tight text-center break-words text-white drop-shadow-lg`}>
                            {item}
                          </span>
                        );
                      })()
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Row - Drop Zones */}
          <div className="flex-1 overflow-hidden">
            <div 
              className={`grid gap-1 h-full overflow-y-auto ${
                shuffledRightItems.length <= 4 
                  ? 'grid-cols-4' 
                  : shuffledRightItems.length <= 5 
                  ? 'grid-cols-5' 
                  : shuffledRightItems.length <= 6 
                  ? 'grid-cols-6' 
                  : 'grid-cols-7'
              }`}
            >
              {shuffledRightItems.map((item: string) => {
                const matchedLeft = Object.keys(matches).find(left => matches[left] === item);
                const isCorrect = showResults && matchedLeft && correctMatches[matchedLeft];
                const isIncorrect = showResults && matchedLeft && correctMatches[matchedLeft] === false;

                return (
                  <div
                    key={item}
                    onDragOver={!showResults ? handleDragOver : undefined}
                    onDragEnter={!showResults ? handleDragEnter : undefined}
                    onDrop={!showResults ? (e) => handleDrop(e, item) : undefined}
                    className={`p-2 rounded-xl text-white font-semibold border-3 border-dashed transition-all duration-300 flex flex-col min-h-32 transform hover:scale-[1.02] ${
                      isCorrect
                        ? 'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-300 shadow-lg shadow-emerald-300'
                        : isIncorrect
                        ? 'bg-gradient-to-br from-rose-500 to-red-600 border-rose-300 shadow-lg shadow-rose-300'
                        : matchedLeft 
                        ? (() => {
                            const dropColors = [
                              'bg-gradient-to-br from-indigo-500 to-blue-600 border-blue-300 shadow-blue-300',
                              'bg-gradient-to-br from-teal-500 to-emerald-600 border-emerald-300 shadow-emerald-300',
                              'bg-gradient-to-br from-violet-500 to-purple-600 border-purple-300 shadow-purple-300',
                              'bg-gradient-to-br from-amber-500 to-orange-600 border-orange-300 shadow-orange-300',
                              'bg-gradient-to-br from-pink-500 to-rose-600 border-rose-300 shadow-rose-300',
                              'bg-gradient-to-br from-sky-500 to-cyan-600 border-cyan-300 shadow-cyan-300'
                            ];
                            const index = shuffledRightItems.indexOf(item) % dropColors.length;
                            return `${dropColors[index]} shadow-lg`;
                          })()
                        : (() => {
                            const lightColors = [
                              'bg-gradient-to-br from-sky-200 to-blue-300 border-blue-400 hover:border-blue-500 hover:from-sky-300 hover:to-blue-400 hover:shadow-lg hover:shadow-blue-300 text-blue-800',
                              'bg-gradient-to-br from-emerald-200 to-teal-300 border-teal-400 hover:border-teal-500 hover:from-emerald-300 hover:to-teal-400 hover:shadow-lg hover:shadow-teal-300 text-teal-800',
                              'bg-gradient-to-br from-violet-200 to-purple-300 border-purple-400 hover:border-purple-500 hover:from-violet-300 hover:to-purple-400 hover:shadow-lg hover:shadow-purple-300 text-purple-800',
                              'bg-gradient-to-br from-amber-200 to-orange-300 border-orange-400 hover:border-orange-500 hover:from-amber-300 hover:to-orange-400 hover:shadow-lg hover:shadow-orange-300 text-orange-800',
                              'bg-gradient-to-br from-pink-200 to-rose-300 border-rose-400 hover:border-rose-500 hover:from-pink-300 hover:to-rose-400 hover:shadow-lg hover:shadow-rose-300 text-rose-800',
                              'bg-gradient-to-br from-cyan-200 to-sky-300 border-sky-400 hover:border-sky-500 hover:from-cyan-300 hover:to-sky-400 hover:shadow-lg hover:shadow-sky-300 text-sky-800'
                            ];
                            const index = shuffledRightItems.indexOf(item) % lightColors.length;
                            return lightColors[index];
                          })()
                    }`}
                  >
                    {/* Title at top - always show */}
                    <div className="w-full text-center p-1 bg-black/20 rounded-t-lg order-first">
                      <span className="text-xs font-bold leading-tight block text-white drop-shadow-lg">
                        {item}
                      </span>
                    </div>

                    {/* Match indicator - only show for matched items */}
                    {matchedLeft && !isImageItem(matchedLeft) && (
                      <div className={`flex flex-col gap-1 text-xs mb-2 p-2 rounded border ${
                        isCorrect 
                          ? 'text-green-700 bg-green-200 border-green-300'
                          : isIncorrect
                          ? 'text-red-700 bg-red-200 border-red-300'
                          : 'text-blue-700 bg-blue-200 border-blue-300'
                      }`}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-semibold text-sm flex-1">{matchedLeft}</span>
                        </div>
                      </div>
                    )}

                    {/* For matched images, show the image directly without overlay */}
                    {matchedLeft && isImageItem(matchedLeft) && (
                      <div className="w-full mb-2">
                        <img 
                          src={matchedLeft} 
                          alt="Matched item" 
                          className="w-full h-auto object-contain rounded"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            const container = img.parentElement;
                            if (container) {
                              container.innerHTML = `
                                <div class="w-full h-32 flex items-center justify-center bg-gray-200 rounded text-gray-500 text-xs">
                                  <div class="text-center">
                                    <div>🖼️</div>
                                    <div>No image</div>
                                  </div>
                                </div>
                              `;
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* Main content area */}
                    <div className="flex-1 flex items-center justify-center p-1">
                      {isImageItem(item) ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="w-full h-full flex items-center justify-center">
                              <img 
                                src={item} 
                                alt="Matching target" 
                                className="w-full h-auto object-contain rounded cursor-pointer hover:opacity-80 transition-opacity"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  const container = img.parentElement;
                                  if (container) {
                                    container.innerHTML = `
                                      <div class="w-full h-full flex items-center justify-center bg-gray-200 rounded text-gray-500 text-sm">
                                        <div class="text-center">
                                          <div>🖼️</div>
                                          <div>Image not available</div>
                                        </div>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-[98vw] max-h-[98vh] w-[98vw] h-[98vh] flex items-center justify-center p-2">
                            <img 
                              src={item} 
                              alt="Full size matching target" 
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                const container = img.parentElement;
                                if (container) {
                                  container.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center bg-gray-200 rounded text-gray-500">
                                      <div class="text-center">
                                        <div class="text-4xl mb-2">🖼️</div>
                                        <div>Image not available</div>
                                      </div>
                                    </div>
                                  `;
                                }
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                      ) : (
                        !matchedLeft && (
                          <div className="text-center text-gray-500 text-sm">
                            Drop here
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Matching;