import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface SourceItemGridProps {
  leftItems: string[];
  matches: { [key: string]: string };
  showResults: boolean;
  correctMatches: { [key: string]: boolean };
  matchingType: string;
  onDragStart: (e: React.DragEvent, item: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, rightItem: string | null) => void;
}

function isImageItem(item: string): boolean {
  return item.startsWith('http') && (item.includes('.jpg') || item.includes('.png') || item.includes('.jpeg') || item.includes('.gif') || item.includes('.webp') || item.includes('image'));
}

function getTextStyling(text: string, matchingType: string) {
  const wordCount = text.split(/\s+/).length;
  const charCount = text.length;

  if (matchingType === 'title-description' || matchingType?.includes('title-description')) {
    return {
      fontSize: wordCount > 30 ? 'text-xs' : wordCount > 20 ? 'text-sm' : 'text-base',
      alignment: 'text-left',
      weight: 'font-medium',
      lineHeight: 'leading-tight'
    };
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

export function SourceItemGrid({
  leftItems,
  matches,
  showResults,
  correctMatches,
  matchingType,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDrop
}: SourceItemGridProps) {
  return (
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
        onDragOver={!showResults ? onDragOver : undefined}
        onDragEnter={!showResults ? onDragEnter : undefined}
        onDrop={!showResults ? (e) => onDrop(e, null) : undefined}
      >
        {leftItems.map(item => {
          const isUsed = Object.keys(matches).includes(item);
          const isCorrect = showResults && correctMatches[item];
          const isIncorrect = showResults && correctMatches[item] === false;
          const itemIsImage = isImageItem(item);
          const textStyle = getTextStyling(item, matchingType);

          return (
            <div
              key={item}
              draggable={!showResults}
              onDragStart={(e) => onDragStart(e, item)}
              className={`relative p-1 rounded-xl text-white font-semibold transition-all duration-300 border-2 flex items-center justify-center shadow-lg transform hover:scale-105 hover:-translate-y-1 ${
                itemIsImage ? 'h-32' : 'min-h-28 h-auto'
              } ${
                isCorrect 
                  ? 'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-400 cursor-not-allowed shadow-emerald-300'
                  : isIncorrect
                  ? 'bg-gradient-to-br from-rose-500 to-red-600 border-rose-400 cursor-not-allowed shadow-rose-300'
                  : isUsed 
                  ? 'bg-gradient-to-br from-gray-400 to-gray-500 border-gray-300 cursor-not-allowed shadow-gray-300 opacity-60'
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600 border-indigo-300 cursor-grab active:cursor-grabbing shadow-indigo-300 hover:shadow-indigo-400'
              }`}
            >
              {itemIsImage ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="w-full h-full flex items-center justify-center">
                      <img 
                        src={item} 
                        alt="Matching item" 
                        className="w-full h-full object-contain rounded cursor-pointer hover:opacity-80 transition-opacity"
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
                <span className={`${textStyle.fontSize} ${textStyle.alignment} ${textStyle.weight} ${textStyle.lineHeight} px-2 py-1 break-words text-center w-full h-full flex items-center justify-center drop-shadow-lg`}>
                  {item}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}