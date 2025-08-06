import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface DropZoneGridProps {
  shuffledRightItems: string[];
  matches: { [key: string]: string };
  showResults: boolean;
  correctMatches: { [key: string]: boolean };
  matchingType: string;
  onDragStart: (e: React.DragEvent, item: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, rightItem: string) => void;
}

function isImageItem(item: string): boolean {
  return item.startsWith('http') && (item.includes('.jpg') || item.includes('.png') || item.includes('.jpeg') || item.includes('.gif') || item.includes('.webp') || item.includes('image'));
}

function getTextStyling(text: string, matchingType: string, isInDropZone: boolean = false) {
  const wordCount = text.split(/\s+/).length;
  const charCount = text.length;

  if (matchingType === 'title-description' || matchingType?.includes('title-description')) {
    if (isInDropZone) {
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
  } else if (matchingType === 'picture-title' || matchingType?.includes('picture-title')) {
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
}

export function DropZoneGrid({
  shuffledRightItems,
  matches,
  showResults,
  correctMatches,
  matchingType,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop
}: DropZoneGridProps) {
  return (
    <div className="flex-1">
      <div 
        className={`grid gap-2 h-full ${
          shuffledRightItems.length <= 3 
            ? 'grid-cols-3' 
            : shuffledRightItems.length <= 4 
            ? 'grid-cols-4' 
            : shuffledRightItems.length <= 5 
            ? 'grid-cols-5' 
            : shuffledRightItems.length <= 6 
            ? 'grid-cols-6' 
            : 'grid-cols-7'
        }`}
      >
        {shuffledRightItems.map((item, index) => {
          const matchedLeft = Object.keys(matches).find(key => matches[key] === item);
          const isCorrect = showResults && matchedLeft && correctMatches[matchedLeft];
          const isIncorrect = showResults && matchedLeft && correctMatches[matchedLeft] === false;
          const textStyle = getTextStyling(item, matchingType, true);

          return (
            <div
              key={`${item}-${index}`}
              onDragOver={!showResults ? onDragOver : undefined}
              onDragEnter={!showResults ? onDragEnter : undefined}
              onDragLeave={!showResults ? onDragLeave : undefined}
              onDrop={!showResults ? (e) => onDrop(e, item) : undefined}
              className={`relative min-h-32 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center p-2 ${
                isCorrect 
                  ? (() => {
                      const correctColors = [
                        'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-400 shadow-emerald-300',
                        'bg-gradient-to-br from-teal-500 to-cyan-600 border-cyan-400 shadow-cyan-300',
                        'bg-gradient-to-br from-blue-500 to-indigo-600 border-indigo-400 shadow-indigo-300',
                        'bg-gradient-to-br from-violet-500 to-purple-600 border-purple-400 shadow-purple-300',
                        'bg-gradient-to-br from-amber-500 to-orange-600 border-orange-400 shadow-orange-300',
                        'bg-gradient-to-br from-pink-500 to-rose-600 border-rose-400 shadow-rose-300'
                      ];
                      const correctIndex = shuffledRightItems.indexOf(item) % correctColors.length;
                      return `${correctColors[correctIndex]} shadow-lg`;
                    })()
                  : isIncorrect
                  ? (() => {
                      const incorrectColors = [
                        'bg-gradient-to-br from-red-500 to-rose-600 border-rose-400 shadow-rose-300',
                        'bg-gradient-to-br from-orange-500 to-red-600 border-red-400 shadow-red-300',
                        'bg-gradient-to-br from-pink-500 to-red-600 border-red-400 shadow-red-300',
                        'bg-gradient-to-br from-rose-500 to-pink-600 border-pink-400 shadow-pink-300',
                        'bg-gradient-to-br from-red-600 to-rose-700 border-rose-500 shadow-rose-300',
                        'bg-gradient-to-br from-orange-600 to-red-700 border-red-500 shadow-red-300'
                      ];
                      const incorrectIndex = shuffledRightItems.indexOf(item) % incorrectColors.length;
                      return `${incorrectColors[incorrectIndex]} shadow-lg`;
                    })()
                  : matchedLeft
                  ? (() => {
                      const dropColors = [
                        'bg-gradient-to-br from-blue-500 to-indigo-600 border-indigo-300 shadow-indigo-300',
                        'bg-gradient-to-br from-emerald-500 to-teal-600 border-teal-300 shadow-teal-300',
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
              {/* Title at top - only show when matched */}
              {matchedLeft && (
                <div className="w-full text-center p-1 bg-black/20 rounded-t-lg order-first">
                  <span className="text-xs font-bold leading-tight block text-white drop-shadow-lg">
                    {item}
                  </span>
                </div>
              )}

              {/* Match indicator - only show for matched text items */}
              {matchedLeft && !isImageItem(matchedLeft) && (
                <div 
                  className={`flex flex-col gap-1 text-xs mb-2 p-2 rounded border cursor-move ${
                    isCorrect 
                      ? 'text-green-700 bg-green-200 border-green-300'
                      : isIncorrect
                      ? 'text-red-700 bg-red-200 border-red-300'
                      : 'text-blue-700 bg-blue-200 border-blue-300'
                  }`}
                  draggable={!showResults}
                  onDragStart={(e) => onDragStart(e, matchedLeft)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-sm flex-1">{matchedLeft}</span>
                  </div>
                </div>
              )}

              {/* For matched images, show the image directly */}
              {matchedLeft && isImageItem(matchedLeft) && (
                <div 
                  className="w-full mb-2"
                  draggable={!showResults}
                  onDragStart={(e) => onDragStart(e, matchedLeft)}
                >
                  <img 
                    src={matchedLeft} 
                    alt="Matched item" 
                    className="w-full h-auto object-contain rounded cursor-move"
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
              <div className="flex-1 flex items-center justify-center p-2">
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
                    <DialogContent className="max-w-4xl">
                      <img src={item} alt="Full size" className="w-full h-auto" />
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {!matchedLeft ? (
                      <span className={`${textStyle.fontSize} ${textStyle.alignment} ${textStyle.weight} ${textStyle.lineHeight} px-2 py-1 break-words text-center w-full h-full flex items-center justify-center`}>
                        {item}
                      </span>
                    ) : (
                      <span className="text-xs text-white font-bold leading-tight block drop-shadow-lg text-center">
                        {item}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}