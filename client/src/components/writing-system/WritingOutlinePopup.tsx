import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Save } from 'lucide-react';

interface WritingOutlinePopupProps {
  isOpen: boolean;
  onClose: () => void;
  contentTitle?: string;
  contentId?: string;
  studentId?: string;
  onProceedToWriting?: (outlineData: OutlineData) => void;
}

interface OutlineData {
  title: string;
  directions: string;
  setting: string;
  characters: string;
  first: string;
  andThen1: string;
  andThen2: string;
  andFinally: string;
}

export default function WritingOutlinePopup({ isOpen, onClose, contentTitle, contentId, studentId, onProceedToWriting }: WritingOutlinePopupProps) {
  const [formData, setFormData] = useState({
    title: '',
    directions: '',
    setting: '',
    characters: '',
    first: '',
    andThen1: '',
    andThen2: '',
    andFinally: ''
  });

  // Load saved data when popup opens with specific content
  useEffect(() => {
    if (isOpen && studentId && contentId) {
      const storageKey = `creative_outline_${studentId}_${contentId}`;
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setFormData(parsed);
        } catch (error) {
          console.error('Failed to parse saved outline data:', error);
          // Reset to empty state for new content
          setFormData({
            title: '',
            directions: '',
            setting: '',
            characters: '',
            first: '',
            andThen1: '',
            andThen2: '',
            andFinally: ''
          });
        }
      } else {
        // Reset to empty state for new content
        setFormData({
          title: '',
          directions: '',
          setting: '',
          characters: '',
          first: '',
          andThen1: '',
          andThen2: '',
          andFinally: ''
        });
      }
    }
  }, [isOpen, studentId, contentId]);

  const handleInputChange = (field: string, value: string) => {
    const updatedData = {
      ...formData,
      [field]: value
    };
    setFormData(updatedData);
    
    // Auto-save to localStorage if we have studentId and contentId
    if (studentId && contentId) {
      const storageKey = `creative_outline_${studentId}_${contentId}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedData));
    }
  };

  const handleSave = () => {
    // Save to localStorage if we have studentId and contentId
    if (studentId && contentId) {
      const storageKey = `creative_outline_${studentId}_${contentId}`;
      localStorage.setItem(storageKey, JSON.stringify(formData));
    }
    console.log('Saving outline:', formData);
    
    // Proceed to creative writing with the outline data
    if (onProceedToWriting) {
      onProceedToWriting(formData);
    }
    onClose();
  };

  const handleClear = () => {
    setFormData({
      title: '',
      directions: '',
      setting: '',
      characters: '',
      first: '',
      andThen1: '',
      andThen2: '',
      andFinally: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Writing Outline</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {contentTitle && (
            <p className="text-sm text-gray-600">For: {contentTitle}</p>
          )}
        </DialogHeader>

        <div className="space-y-6 p-4">
          {/* Title Section */}
          <div className="border-2 border-gray-300 rounded-lg p-4">
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold">TITLE:</h2>
            </div>
            <Input
              placeholder="Enter your title here"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="text-center text-lg"
            />
          </div>

          {/* Directions */}
          <div>
            <Label className="text-sm font-semibold">Directions:</Label>
            <Textarea
              placeholder="Enter your directions here"
              value={formData.directions}
              onChange={(e) => handleInputChange('directions', e.target.value)}
              className="mt-1 min-h-[60px]"
            />
          </div>

          {/* Setting and Characters - Two oval sections side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-gray-300 rounded-full p-6 min-h-[120px] flex flex-col">
              <h3 className="text-center font-bold mb-2">SETTING</h3>
              <Textarea
                placeholder="Enter Text Here"
                value={formData.setting}
                onChange={(e) => handleInputChange('setting', e.target.value)}
                className="flex-1 border-none resize-none bg-transparent text-center"
              />
            </div>
            <div className="border-2 border-gray-300 rounded-full p-6 min-h-[120px] flex flex-col">
              <h3 className="text-center font-bold mb-2">CHARACTERS</h3>
              <Textarea
                placeholder="Enter Text Here"
                value={formData.characters}
                onChange={(e) => handleInputChange('characters', e.target.value)}
                className="flex-1 border-none resize-none bg-transparent text-center"
              />
            </div>
          </div>

          {/* Story progression sections */}
          <div className="space-y-4">
            {/* FIRST... */}
            <div>
              <div className="text-center font-bold mb-2">FIRST...</div>
              <div className="border-2 border-gray-300 rounded-lg p-4">
                <Textarea
                  placeholder="Enter Text Here"
                  value={formData.first}
                  onChange={(e) => handleInputChange('first', e.target.value)}
                  className="border-none resize-none bg-transparent min-h-[80px]"
                />
              </div>
            </div>

            {/* AND THEN... */}
            <div>
              <div className="text-center font-bold mb-2">AND THEN...</div>
              <div className="border-2 border-gray-300 rounded-lg p-4">
                <Textarea
                  placeholder="Enter Text Here"
                  value={formData.andThen1}
                  onChange={(e) => handleInputChange('andThen1', e.target.value)}
                  className="border-none resize-none bg-transparent min-h-[80px]"
                />
              </div>
            </div>

            {/* AND THEN... (second) */}
            <div>
              <div className="text-center font-bold mb-2">AND THEN...</div>
              <div className="border-2 border-gray-300 rounded-lg p-4">
                <Textarea
                  placeholder="Enter Text Here"
                  value={formData.andThen2}
                  onChange={(e) => handleInputChange('andThen2', e.target.value)}
                  className="border-none resize-none bg-transparent min-h-[80px]"
                />
              </div>
            </div>

            {/* AND FINALLY... */}
            <div>
              <div className="text-center font-bold mb-2">AND FINALLY...</div>
              <div className="border-2 border-gray-300 rounded-lg p-4 rounded-b-full">
                <Textarea
                  placeholder="Enter Text Here"
                  value={formData.andFinally}
                  onChange={(e) => handleInputChange('andFinally', e.target.value)}
                  className="border-none resize-none bg-transparent min-h-[80px]"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleClear}>
              Clear All
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Save & Proceed to Writing
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}