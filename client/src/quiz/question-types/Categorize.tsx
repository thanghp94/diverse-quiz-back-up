
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Question } from "../QuizApp";

interface CategorizeProps {
  question: Question;
  onAnswer: (answer: any, isCorrect: boolean) => void;
  studentTryId?: string;
}

const Categorize = ({ question, onAnswer, studentTryId }: CategorizeProps) => {
  const [categories, setCategories] = useState(
    question.categories?.map(cat => ({ ...cat, items: [...cat.items] })) || []
  );
  const [unassignedItems, setUnassignedItems] = useState([...(question.items || [])]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<string | null>(null);
  const dragCounter = useRef(0);

  const handleDragStart = (e: React.DragEvent, item: string) => {
    setDraggedItem(item);
    
    // Find where this item is currently located
    const categoryIndex = categories.findIndex(cat => cat.items.includes(item));
    if (categoryIndex >= 0) {
      setDraggedFrom(`category-${categoryIndex}`);
    } else {
      setDraggedFrom('unassigned');
    }
    
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

  const handleDrop = (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault();
    dragCounter.current = 0;
    
    if (!draggedItem || !draggedFrom) return;

    // Remove item from its current location
    if (draggedFrom === 'unassigned') {
      setUnassignedItems(prev => prev.filter(item => item !== draggedItem));
    } else {
      const categoryIndex = parseInt(draggedFrom.split('-')[1]);
      setCategories(prev => {
        const newCategories = [...prev];
        newCategories[categoryIndex].items = newCategories[categoryIndex].items.filter(
          item => item !== draggedItem
        );
        return newCategories;
      });
    }

    // Add item to target location
    if (targetCategory === 'unassigned') {
      setUnassignedItems(prev => [...prev, draggedItem]);
    } else {
      const targetIndex = parseInt(targetCategory.split('-')[1]);
      setCategories(prev => {
        const newCategories = [...prev];
        newCategories[targetIndex].items.push(draggedItem);
        return newCategories;
      });
    }

    setDraggedItem(null);
    setDraggedFrom(null);
  };

  const handleSubmit = () => {
    // For demo purposes, we'll consider it correct if all items are assigned
    const allItemsAssigned = unassignedItems.length === 0;
    onAnswer(categories, allItemsAssigned);
  };

  const isComplete = unassignedItems.length === 0;

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 animate-fade-in">
      <CardHeader>
        <CardTitle className="text-white text-2xl">{question.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((category, index) => (
            <div
              key={category.name}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, `category-${index}`)}
              className="bg-purple-500/20 p-4 rounded-lg border-2 border-dashed border-purple-400/30 hover:border-purple-400/60 transition-colors min-h-[200px]"
            >
              <h3 className="text-white font-semibold mb-3 text-center">{category.name}</h3>
              <div className="space-y-2">
                {category.items.map(item => (
                  <div
                    key={item}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    className="p-2 bg-white/10 rounded text-white cursor-move hover:bg-white/20 transition-colors text-sm"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {unassignedItems.length > 0 && (
          <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'unassigned')}
            className="bg-blue-500/20 p-4 rounded-lg border-2 border-dashed border-blue-400/30"
          >
            <h3 className="text-white font-semibold mb-3">Items to Categorize:</h3>
            <div className="flex flex-wrap gap-2">
              {unassignedItems.map(item => (
                <div
                  key={item}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  className="p-3 bg-blue-600/30 rounded-lg text-white cursor-move hover:bg-blue-600/50 transition-colors"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Button 
          onClick={handleSubmit}
          disabled={!isComplete}
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-3 text-lg"
        >
          Submit Categories
        </Button>
      </CardContent>
    </Card>
  );
};

export default Categorize;
