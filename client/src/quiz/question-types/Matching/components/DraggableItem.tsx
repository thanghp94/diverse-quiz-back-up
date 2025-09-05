import React from 'react';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface DraggableItemProps {
  item: string;
  isUsed: boolean;
  isCorrect: boolean;
  isIncorrect: boolean;
  showResults: boolean;
  isImageItem: (item: string) => boolean;
  getTextStyling: (text: string, isInDropZone?: boolean) => any;
  onDragStart: (e: React.DragEvent, item: string) => void;
  leftItems: string[];
}

export const DraggableItem: React.FC<DraggableItemProps> = ({
  item,
  isUsed,
  isCorrect,
  isIncorrect,
  showResults,
  isImageItem,
  getTextStyling,
  onDragStart,
  leftItems,
}) => {
  const itemIsImage = isImageItem(item);

  const getItemStyles = () => {
    if (isCorrect) {
      return 'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-400 cursor-not-allowed shadow-emerald-300';
    }
    if (isIncorrect) {
      return 'bg-gradient-to-br from-rose-500 to-red-600 border-rose-400 cursor-not-allowed shadow-rose-300';
    }
    if (isUsed) {
      return 'bg-gradient-to-br from-slate-400 to-gray-500 border-slate-300 opacity-60 cursor-not-allowed';
    }
    
    const colors = [
      'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 hover:from-blue-600 hover:to-blue-700 shadow-blue-300',
      'bg-gradient-to-br from-emerald-500 to-teal-600 border-teal-400 hover:from-emerald-600 hover:to-teal-700 shadow-teal-300',
      'bg-gradient-to-br from-purple-500 to-violet-600 border-violet-400 hover:from-purple-600 hover:to-violet-700 shadow-violet-300',
      'bg-gradient-to-br from-orange-500 to-amber-600 border-amber-400 hover:from-orange-600 hover:to-amber-700 shadow-amber-300',
      'bg-gradient-to-br from-rose-500 to-pink-600 border-pink-400 hover:from-rose-600 hover:to-pink-700 shadow-pink-300',
      'bg-gradient-to-br from-cyan-500 to-sky-600 border-sky-400 hover:from-cyan-600 hover:to-sky-700 shadow-sky-300'
    ];
    const index = leftItems.indexOf(item) % colors.length;
    return `${colors[index]} cursor-move hover:shadow-xl hover:scale-105 hover:-translate-y-1 transform`;
  };

  return (
    <div
      key={item}
      draggable={!showResults && !isUsed}
      onDragStart={(e) => onDragStart(e, item)}
      className={`relative p-1 rounded-xl text-white font-semibold transition-all duration-300 border-2 flex items-center justify-center shadow-lg group ${
        itemIsImage ? 'h-32' : 'min-h-28 h-auto'
      } ${getItemStyles()}`}
    >
      {/* Drag indicator */}
      {!showResults && !isUsed && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-2 h-2 bg-white/60 rounded-full"></div>
        </div>
      )}
      
      {itemIsImage ? (
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
            <span className={`${styling.fontSize} ${styling.alignment} ${styling.weight} ${styling.lineHeight} break-words text-white drop-shadow-lg`}>
              {item}
            </span>
          );
        })()
      )}
    </div>
  );
};
