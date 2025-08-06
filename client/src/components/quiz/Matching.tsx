import { useState, useEffect } from 'react';
import { Question } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface MatchingProps {
  question: Question;
  onNextActivity: () => void;
  onNextPhase?: () => void;
  currentQuizPhase?: string;
  isSubmitting?: boolean;
  setIsSubmitting?: (value: boolean) => void;
  allContent?: any[];
  allImages?: any[];
}

const Matching = ({ 
  question, 
  onNextActivity, 
  onNextPhase,
  currentQuizPhase,
  isSubmitting = false,
  setIsSubmitting = () => {},
  allContent = [],
  allImages = []
}: MatchingProps) => {
  const [matches, setMatches] = useState<{ [key: string]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [correctMatches, setCorrectMatches] = useState<{ [key: string]: boolean }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Parse the question content
  const pairs = question.matching_pairs || [];
  const effectiveMatchingType = question.type || 'general';
  const hasSequentialMatching = effectiveMatchingType?.includes('title-description') && 
                               effectiveMatchingType?.includes('picture-title');

  // Filter pairs based on current phase
  let filteredPairs = pairs;
  if (hasSequentialMatching && currentQuizPhase === 'picture-title') {
    filteredPairs = pairs.filter(pair => isImageItem(pair.left));
  } else if (hasSequentialMatching && currentQuizPhase === 'title-description') {
    filteredPairs = pairs.filter(pair => !isImageItem(pair.left));
  }

  const leftItems = filteredPairs.map(pair => pair.left);
  const rightItems = filteredPairs.map(pair => pair.right);
  const shuffledRightItems = [...rightItems].sort(() => Math.random() - 0.5);

  function isImageItem(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|svg|webp|tiff|ico)(\?.*)?$/i;
    const hasImageExtension = imageExtensions.test(text);
    
    if (hasImageExtension) return true;
    
    const imageServices = [
      /^https?:\/\/.*\.(googleapis\.com|googleusercontent\.com|gstatic\.com)/i,
      /^https?:\/\/.*scene7\.com/i,
      /^https?:\/\/i\.ytimg\.com/i,
      /^https?:\/\/.*\.bbci\.co\.uk.*\.(jpg|png|gif)/i,
      /^https?:\/\/.*wikimedia\.org.*\.(jpg|png|gif|svg)/i,
      /^https?:\/\/.*reddit\.com.*\.(jpg|png|gif)/i,
      /^https?:\/\/.*ansto\.gov\.au.*\.(jpg|png|gif)/i
    ];
    
    return imageServices.some(pattern => pattern.test(text));
  }

  const handleDragStart = (e: React.DragEvent, item: string) => {
    e.dataTransfer.setData('text/plain', item);
  };

  const handleDrop = (e: React.DragEvent, rightItem: string) => {
    e.preventDefault();
    const leftItem = e.dataTransfer.getData('text/plain');
    
    if (Object.keys(matches).includes(leftItem)) return;
    
    const newMatches = { ...matches };
    const existingMatch = Object.entries(newMatches).find(([_, right]) => right === rightItem);
    if (existingMatch) {
      delete newMatches[existingMatch[0]];
    }
    newMatches[leftItem] = rightItem;
    setMatches(newMatches);
  };

  const handleCheckResults = async () => {
    setIsSubmitting(true);
    
    const newCorrectMatches: { [key: string]: boolean } = {};
    filteredPairs.forEach(pair => {
      newCorrectMatches[pair.left] = matches[pair.left] === pair.right;
    });
    
    setCorrectMatches(newCorrectMatches);
    setShowResults(true);
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  const isComplete = Object.keys(matches).length === leftItems.length;

  return (
    <div className="w-full h-full overflow-hidden">
      {/* Compact header */}
      <div className="flex justify-between items-center p-2 bg-gray-50">
        <h1 className="text-lg font-bold text-gray-800">
          {question.question}
          {effectiveMatchingType === 'picture-title' || effectiveMatchingType?.includes('picture-title') ? (
            <span className="text-xs text-gray-600 ml-2">- Match the pictures with their titles</span>
          ) : effectiveMatchingType === 'title-description' || effectiveMatchingType?.includes('title-description') ? (
            <span className="text-xs text-gray-600 ml-2">- Match each title with its corresponding description</span>
          ) : (
            <span className="text-xs text-gray-600 ml-2">- Drag and drop items to create matching pairs</span>
          )}
        </h1>

        <div className="flex items-center gap-2">
          {!isSubmitted ? (
            <>
              {isComplete && !isSubmitting && (
                <span className="text-xs text-green-700 font-medium">Ready to check!</span>
              )}
              <Button
                onClick={handleCheckResults}
                disabled={!isComplete || isSubmitting}
                size="sm"
                className={`text-sm py-1 px-3 ${
                  isComplete
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-400 text-white cursor-not-allowed"
                }`}
              >
                {isSubmitting ? "Checking..." : 'Check Results'}
              </Button>
            </>
          ) : (
            <Button
              onClick={hasSequentialMatching && currentQuizPhase === 'picture-title' ? onNextPhase : onNextActivity}
              className="text-sm py-1 px-3 bg-green-600 hover:bg-green-700 text-white"
            >
              {hasSequentialMatching && currentQuizPhase === 'picture-title' ? 
                "Continue to Title-Description Matching →" : 
                "Next Activity →"
              }
            </Button>
          )}
        </div>
      </div>
      
      {/* Responsive grid layout */}
      <div className="p-2 h-[calc(100%-60px)] flex flex-col gap-2">
        {/* Top section - Images/Left Items - Auto height based on content */}
        <div className="flex-shrink-0">
          <div className={`grid gap-2 ${
            leftItems.length <= 3 ? 'grid-cols-3' :
            leftItems.length <= 4 ? 'grid-cols-4' :
            leftItems.length <= 6 ? 'grid-cols-6' : 'grid-cols-6'
          }`}>
            {leftItems.map(item => {
              const isUsed = Object.keys(matches).includes(item);
              const isCorrect = showResults && correctMatches[item];
              const isIncorrect = showResults && correctMatches[item] === false;

              return (
                <div
                  key={item}
                  draggable={!isUsed && !showResults}
                  onDragStart={(e) => handleDragStart(e, item)}
                  className={`relative rounded-lg border-2 cursor-move transition-all ${
                    isCorrect 
                      ? 'bg-green-100 border-green-500'
                      : isIncorrect
                      ? 'bg-red-100 border-red-500'
                      : isUsed 
                      ? 'bg-gray-100 border-gray-400 opacity-50' 
                      : 'bg-blue-50 border-blue-300 hover:border-blue-500'
                  }`}
                  style={{ 
                    height: isImageItem(item) ? 'auto' : '80px',
                    minHeight: '80px'
                  }}
                >
                  {isImageItem(item) ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="w-full h-full p-2 cursor-pointer">
                          <img 
                            src={item} 
                            alt="Matching item" 
                            className="w-full h-full object-contain rounded"
                            style={{ maxHeight: '120px' }}
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                              const container = img.parentElement;
                              if (container) {
                                container.innerHTML = `
                                  <div class="w-full h-20 flex items-center justify-center bg-gray-200 rounded text-gray-500 text-sm">
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
                      <DialogContent className="max-w-[90vw] max-h-[90vh] flex items-center justify-center p-2">
                        <img 
                          src={item} 
                          alt="Full size matching item" 
                          className="max-w-full max-h-full object-contain"
                        />
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2 text-center">
                      <span className="text-sm font-medium text-gray-800">{item}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom section - Drop zones - Takes remaining space */}
        <div className="flex-1 min-h-0">
          <div className={`grid gap-1 h-full ${
            shuffledRightItems.length <= 3 ? 'grid-cols-3' :
            shuffledRightItems.length <= 4 ? 'grid-cols-4' :
            shuffledRightItems.length <= 6 ? 'grid-cols-6' : 'grid-cols-6'
          }`}>
            {shuffledRightItems.map(item => {
              const matchedWith = Object.entries(matches).find(([left, right]) => right === item)?.[0];
              const isCorrect = showResults && matchedWith && correctMatches[matchedWith];
              const isIncorrect = showResults && matchedWith && correctMatches[matchedWith] === false;

              return (
                <div
                  key={item}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, item)}
                  className={`relative border-2 border-dashed rounded-lg min-h-[60px] p-2 text-center transition-all ${
                    isCorrect 
                      ? 'bg-green-100 border-green-500'
                      : isIncorrect
                      ? 'bg-red-100 border-red-500'
                      : matchedWith
                      ? 'bg-gray-100 border-gray-400'
                      : 'bg-gray-50 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-700 mb-1">{item}</div>
                  {matchedWith && (
                    <div className="text-xs text-gray-500 bg-white rounded p-1">
                      Matched with {isImageItem(matchedWith) ? '🖼️' : `"${matchedWith.substring(0, 20)}..."`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Matching;