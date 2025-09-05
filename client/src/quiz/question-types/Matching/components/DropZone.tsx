import React from 'react';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface DropZoneProps {
  item: string;
  matchedLeft?: string;
  isCorrect: boolean;
  isIncorrect: boolean;
  showResults: boolean;
  draggedItem: string | null;
  shuffledRightItems: string[];
  filteredPairs: any[];
  effectiveMatchingType: any;
  isImageItem: (item: string) => boolean;
  getTextStyling: (text: string, isInDropZone?: boolean) => any;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, item: string) => void;
  onDragStart: (e: React.DragEvent, item: string) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  item,
  matchedLeft,
  isCorrect,
  isIncorrect,
  showResults,
  draggedItem,
  shuffledRightItems,
  filteredPairs,
  effectiveMatchingType,
  isImageItem,
  getTextStyling,
  onDragOver,
  onDragEnter,
  onDrop,
  onDragStart,
}) => {
  const getDropZoneStyles = () => {
    if (isCorrect) {
      return 'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-300 shadow-lg shadow-emerald-300';
    }
    if (isIncorrect) {
      return 'bg-gradient-to-br from-rose-500 to-red-600 border-rose-300 shadow-lg shadow-rose-300';
    }
    if (matchedLeft) {
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
    }
    
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
  };

  return (
    <div
      key={item}
      onDragOver={!showResults ? onDragOver : undefined}
      onDragEnter={!showResults ? onDragEnter : undefined}
      onDrop={!showResults ? (e) => onDrop(e, item) : undefined}
      className={`p-2 rounded-xl text-white font-semibold border-3 border-dashed transition-all duration-300 flex flex-col min-h-32 group ${
        draggedItem && !matchedLeft ? 'hover:scale-105 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-300/50 hover:bg-yellow-100/20' : 'transform hover:scale-[1.02]'
      } ${getDropZoneStyles()}`}
    >
      {/* Drop zone indicator */}
      {draggedItem && !matchedLeft && !showResults && (
        <div className="absolute inset-0 border-2 border-yellow-400 border-dashed rounded-xl bg-yellow-100/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="text-yellow-600 font-bold text-sm bg-yellow-100/80 px-2 py-1 rounded">Drop Here</span>
        </div>
      )}
      
      {/* Matched term at top - show for both title-description and picture-title */}
      {matchedLeft && (
        <div 
          className="w-full text-center p-3 bg-black/30 rounded-lg order-first cursor-move mb-2 border-2 border-white/20 shadow-lg"
          draggable={!showResults}
          onDragStart={(e) => onDragStart(e, matchedLeft)}
        >
          {(() => {
            const displayText = isImageItem(matchedLeft) ? 
              // If the matched item is an image URL, find the corresponding title
              (() => {
                const pair = filteredPairs.find(p => p.left === matchedLeft || p.right === matchedLeft);
                return pair ? (isImageItem(pair.left) ? pair.right : pair.left) : matchedLeft;
              })()
              : matchedLeft;
            
            const styling = getTextStyling(displayText);
            return (
              <span className={`${styling.fontSize} ${styling.alignment} ${styling.weight} ${styling.lineHeight} block text-white drop-shadow-lg`}>
                {displayText}
              </span>
            );
          })()}
        </div>
      )}

      {/* Match indicator - only show for matched text items that are NOT in title-description mode */}
      {matchedLeft && !isImageItem(matchedLeft) && !(effectiveMatchingType === 'title-description' || effectiveMatchingType?.includes('title-description')) && (
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

      {/* Main content area - positioned directly below matched content */}
      <div className="flex-1 flex items-start justify-center p-1">
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
          // Show the description text with different styling based on matching type
          <div className={`w-full leading-relaxed whitespace-pre-wrap break-words ${
            matchedLeft 
              ? 'text-gray-800 drop-shadow-lg font-semibold text-sm text-left p-2' 
              : (effectiveMatchingType === 'picture-title' || effectiveMatchingType?.includes('picture-title'))
              ? 'text-gray-800 font-bold text-xl drop-shadow-lg text-center flex items-center justify-center h-full'
              : 'text-gray-800 font-medium text-sm text-left p-2'
          }`}>
            {(effectiveMatchingType === 'title-description' || effectiveMatchingType?.includes('title-description')) ? item : (matchedLeft ? '' : item)}
          </div>
        )}
      </div>
    </div>
  );
};
