import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
}

const Matching = ({ question, onAnswer, studentTryId, onNextActivity, onGoBack, currentQuizPhase, onNextPhase }: MatchingProps) => {
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

  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 h-full flex flex-col">
      {/* Header with title and buttons */}
      <div className="pb-3 pt-4 px-4 bg-white/80 backdrop-blur-sm border-b-2 border-purple-200">
        <div className="flex justify-between items-center mb-2">
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {question.question}
            </h1>
            {effectiveMatchingType === 'title-description' || effectiveMatchingType?.includes('title-description') ? (
              <p className="text-sm text-purple-600 mt-1 font-medium">
                Match each title with its corresponding description
              </p>
            ) : effectiveMatchingType === 'picture-title' || effectiveMatchingType?.includes('picture-title') ? (
              null
            ) : (
              <p className="text-sm text-purple-600 mt-1 font-medium">
                Drag and drop items to create matching pairs
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isSubmitted ? (
              <div className="flex items-center gap-2">
                {isComplete && !isSubmitting && (
                  <p className="text-xs text-purple-700 font-medium bg-purple-100 px-2 py-1 rounded">
                    All pairs matched! Click to complete.
                  </p>
                )}
                <Button
                  onClick={handleCheckResults}
                  disabled={!isComplete || isSubmitting}
                  size="sm"
                  className={`text-sm py-2 px-4 font-bold rounded-xl shadow-lg transform transition-all duration-300 ${
                    isComplete
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-2 border-purple-400 hover:scale-105 hover:shadow-xl"
                      : "bg-gradient-to-r from-gray-400 to-gray-500 text-white border-2 border-gray-300 cursor-not-allowed"
                  }`}
                  variant="default"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Checking...
                    </span>
                  ) : (
                    'Check Results'
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {hasSequentialMatching && currentQuizPhase === 'picture-title' ? (
                  <Button
                    onClick={onNextPhase}
                    className="text-sm py-2 px-4 font-bold rounded-xl shadow-lg transform transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-2 border-blue-400 hover:scale-105 hover:shadow-xl"
                    variant="default"
                  >
                    Continue to Title-Description Matching →
                  </Button>
                ) : (
                  <Button
                    onClick={onNextActivity}
                    className="text-sm py-2 px-4 font-bold rounded-xl shadow-lg transform transition-all duration-300 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-2 border-green-400 hover:scale-105 hover:shadow-xl"
                    variant="default"
                  >
                    Next Activity →
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Main content area */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="flex flex-col gap-4 h-full">
          {/* Top Row - Left Items */}
          <div className={effectiveMatchingType === 'title-description' || effectiveMatchingType?.includes('title-description') ? 'flex-[0.4]' : 'flex-1'}>
            <div 
              className={`grid gap-2 overflow-y-auto ${
                effectiveMatchingType === 'title-description' || effectiveMatchingType?.includes('title-description') 
                  ? 'h-[200px]' 
                  : 'h-[320px]'
              } ${
                leftItems.length <= 4 
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
                
                console.log(`🖼️ Rendering left item: ${item.substring(0, 50)}... | isImage: ${itemIsImage}`);

                return (
                  <div
                    key={item}
                    draggable={!isUsed && !showResults}
                    onDragStart={(e) => handleDragStart(e, item)}
                    className={`relative p-2 rounded-xl text-black transition-all duration-300 border-3 flex items-center justify-center shadow-lg transform hover:scale-105 ${
                      isCorrect 
                        ? 'bg-gradient-to-br from-green-100 to-green-200 border-green-500 cursor-not-allowed'
                        : isIncorrect
                        ? 'bg-gradient-to-br from-red-100 to-red-200 border-red-500 cursor-not-allowed'
                        : isUsed 
                        ? 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-400 opacity-50 cursor-not-allowed' 
                        : 'bg-gradient-to-br from-blue-100 to-purple-100 border-blue-400 cursor-move hover:from-blue-200 hover:to-purple-200 hover:border-purple-500 hover:shadow-xl'
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
                                maxHeight: '100%',
                                objectFit: 'contain'
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
                          <span className={`${styling.weight} ${styling.fontSize} leading-tight whitespace-pre-line ${styling.alignment}`}>
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

          {/* Bottom Row - Right Items (Drop Zones) */}
          <div className={effectiveMatchingType === 'title-description' || effectiveMatchingType?.includes('title-description') ? 'flex-[0.6]' : 'flex-1'}>
            <div 
              className={`grid gap-1 overflow-y-auto ${
                effectiveMatchingType === 'title-description' || effectiveMatchingType?.includes('title-description') 
                  ? 'h-[400px]' 
                  : 'h-[300px]'
              } ${
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
                    className={`p-1 rounded-lg text-black border-2 border-dashed transition-all duration-300 flex flex-col ${
                      isCorrect
                        ? 'bg-green-100 border-green-400 shadow-lg'
                        : isIncorrect
                        ? 'bg-red-100 border-red-400 shadow-lg'
                        : matchedLeft 
                        ? 'bg-gray-100 border-gray-400 shadow-lg' 
                        : 'bg-purple-50 border-purple-300 hover:border-purple-400 hover:bg-purple-100'
                    }`}
                  >
                    {/* Match indicator at top */}
                    {matchedLeft && (
                      <div className={`flex flex-col gap-2 text-xs mb-2 p-2 rounded border order-first ${
                        isCorrect 
                          ? 'text-green-700 bg-green-200 border-green-300'
                          : isIncorrect
                          ? 'text-red-700 bg-red-200 border-red-300'
                          : 'text-blue-700 bg-blue-200 border-blue-300'
                      }`}>
                        {isImageItem(matchedLeft) ? (
                          <div className="flex flex-col items-center gap-2 w-full">
                            <img 
                              src={matchedLeft} 
                              alt="Matched item" 
                              className="max-w-full max-h-32 object-contain rounded border"
                              style={{
                                minHeight: '80px',
                                minWidth: '80px'
                              }}
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                const container = img.parentElement;
                                if (container) {
                                  container.innerHTML = `
                                    <div class="w-20 h-20 flex items-center justify-center bg-gray-200 rounded border text-gray-500 text-xs">
                                      <div class="text-center">
                                        <div>🖼️</div>
                                        <div>No image</div>
                                      </div>
                                    </div>
                                  `;
                                }
                              }}
                            />
                            {isSubmitted && (
                              <div className={`text-sm font-bold ${
                                isCorrect ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span className="font-semibold text-sm flex-1">{matchedLeft}</span>
                            {isSubmitted && (
                              <div className={`text-sm font-bold ${
                                isCorrect ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Main content */}
                    <div className="flex-1 flex items-center justify-center">
                      {isImageItem(item) ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="w-full h-full flex items-center justify-center">
                              <img 
                                src={item} 
                                alt="Matching target" 
                                className="w-full h-full object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
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
                        (() => {
                          const styling = getTextStyling(item, true);
                          return (
                            <div className={`${styling.weight} ${styling.fontSize} ${styling.lineHeight} whitespace-pre-line ${styling.alignment} w-full h-full flex items-center p-2`}>
                              {item}
                            </div>
                          );
                        })()
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