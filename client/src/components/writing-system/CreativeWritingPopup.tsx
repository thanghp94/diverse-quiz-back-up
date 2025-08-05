import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, FileText, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface CreativeWritingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  contentTitle?: string;
  studentId: string;
  contentId?: string;
  outlineData: {
    title: string;
    directions: string;
    setting: string;
    characters: string;
    first: string;
    andThen1: string;
    andThen2: string;
    andFinally: string;
  };
  onBackToOutline?: () => void;
}

interface WritingData {
  title: string;
  story: string;
}

export default function CreativeWritingPopup({ 
  isOpen, 
  onClose, 
  contentTitle, 
  studentId, 
  contentId,
  outlineData,
  onBackToOutline 
}: CreativeWritingPopupProps) {
  console.log('CreativeWritingPopup props:', { studentId, contentId, contentTitle, hasOutlineData: !!outlineData });
  
  const [writingData, setWritingData] = useState<WritingData>({
    title: outlineData?.title || '',
    story: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Load saved data on open
  useEffect(() => {
    if (isOpen && studentId && contentId) {
      const storageKey = `creative_story_${studentId}_${contentId}`;
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setWritingData({
            title: parsed.title || outlineData.title || '',
            story: parsed.story || ''
          });
        } catch (error) {
          console.error('Failed to parse saved story data:', error);
          setWritingData({
            title: outlineData.title || '',
            story: ''
          });
        }
      } else {
        // Reset to initial state for new content
        setWritingData({
          title: outlineData.title || '',
          story: ''
        });
      }
    }
  }, [isOpen, studentId, contentId, outlineData]);

  // Save data when popup closes or story changes
  useEffect(() => {
    if (studentId && contentId && (writingData.title.trim() || writingData.story.trim())) {
      const storageKey = `creative_story_${studentId}_${contentId}`;
      localStorage.setItem(storageKey, JSON.stringify(writingData));
    }
  }, [writingData, studentId, contentId]);

  // Save data when browser closes
  useEffect(() => {
    const saveOnUnload = () => {
      if (studentId && contentId && (writingData.title.trim() || writingData.story.trim())) {
        const storageKey = `creative_story_${studentId}_${contentId}`;
        localStorage.setItem(storageKey, JSON.stringify(writingData));
      }
    };

    window.addEventListener('beforeunload', saveOnUnload);
    return () => window.removeEventListener('beforeunload', saveOnUnload);
  }, [writingData, studentId, contentId]);

  const handleStoryChange = (value: string) => {
    setWritingData(prev => ({ ...prev, story: value }));
  };

  const handleSectionChange = (sectionIndex: number, value: string) => {
    const paragraphs = writingData.story.split('\n\n');
    paragraphs[sectionIndex] = value;
    setWritingData(prev => ({ ...prev, story: paragraphs.join('\n\n') }));
  };

  const getWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const submitStory = async () => {
    console.log('Submit story called with:', { studentId, contentId, contentTitle });
    
    if (!studentId || !contentId) {
      console.error('Missing data for submission:', { studentId, contentId });
      toast({
        title: "Submission Failed",
        description: "Missing student or content information.",
        variant: "destructive",
      });
      return;
    }

    const storyWordCount = getWordCount(writingData.story);
    if (storyWordCount < 50) {
      toast({
        title: "Submission Failed",
        description: "Story must be at least 50 words to submit.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Split story into paragraphs for database storage
      const paragraphs = writingData.story.split('\n\n').filter(p => p.trim());

      const response = await fetch('/api/writing-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          content_id: contentId,
          content_title: contentTitle,
          outline_data: outlineData,
          essay_data: {
            introduction: paragraphs[0] || '',
            body1: paragraphs[1] || '',
            body2: paragraphs[2] || '',
            body3: paragraphs[3] || '',
            conclusion: paragraphs[4] || ''
          },
          word_count: storyWordCount,
          submitted_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit story');
      }

      const result = await response.json();
      console.log('Writing submission created successfully:', result);

      // Clear both story and outline data from localStorage after successful submission
      if (studentId && contentId) {
        const storyStorageKey = `creative_story_${studentId}_${contentId}`;
        const outlineStorageKey = `creative_outline_${studentId}_${contentId}`;
        localStorage.removeItem(storyStorageKey);
        localStorage.removeItem(outlineStorageKey);
      }

      toast({
        title: "Story Submitted",
        description: `Your creative writing has been submitted successfully (${storyWordCount} words).`,
      });

      onClose();
      setWritingData({ title: '', story: '' });
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "There was an error submitting your story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">Creative Writing</DialogTitle>
              {contentTitle && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border-l-4 border-green-500">
                  <p className="text-lg font-semibold text-gray-800">{contentTitle}</p>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-2 p-2">
          {/* Outline Summary - Similar to Academic Essay */}
          <div className="bg-blue-50 p-3 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2 flex items-center text-blue-800">
              <FileText className="h-5 w-5 mr-2" />
              Your Creative Writing Outline
            </h3>

            {/* Title and Directions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {outlineData.title && (
                <div className="bg-blue-100 px-2 py-1 rounded-md border-l-4 border-blue-400">
                  <span className="text-sm font-bold text-blue-800">Title:</span>
                  <span className="text-sm text-blue-700 ml-2">{outlineData.title}</span>
                </div>
              )}
              {outlineData.directions && (
                <div className="bg-blue-100 px-2 py-1 rounded-md border-l-4 border-blue-400">
                  <span className="text-sm font-bold text-blue-800">Directions:</span>
                  <span className="text-sm text-blue-700 ml-2">{outlineData.directions}</span>
                </div>
              )}
            </div>

            {/* Setting and Characters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {outlineData.setting && (
                <div className="bg-green-100 px-2 py-1 rounded-md border-l-4 border-green-400">
                  <span className="text-sm font-bold text-green-800">Setting:</span>
                  <span className="text-sm text-green-700 ml-2">{outlineData.setting}</span>
                </div>
              )}
              {outlineData.characters && (
                <div className="bg-green-100 px-2 py-1 rounded-md border-l-4 border-green-400">
                  <span className="text-sm font-bold text-green-800">Characters:</span>
                  <span className="text-sm text-green-700 ml-2">{outlineData.characters}</span>
                </div>
              )}
            </div>

            {/* Story Structure */}
            <div>
              <span className="text-sm font-bold text-purple-800">Story Structure:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {outlineData.first && (
                  <div className="bg-purple-100 px-2 py-1 rounded-md border-l-4 border-purple-400">
                    <span className="text-sm font-bold text-purple-800">First:</span>
                    <span className="text-sm text-purple-700 ml-2">{outlineData.first}</span>
                  </div>
                )}
                {outlineData.andThen1 && (
                  <div className="bg-purple-100 px-2 py-1 rounded-md border-l-4 border-purple-400">
                    <span className="text-sm font-bold text-purple-800">Then:</span>
                    <span className="text-sm text-purple-700 ml-2">{outlineData.andThen1}</span>
                  </div>
                )}
                {outlineData.andThen2 && (
                  <div className="bg-purple-100 px-2 py-1 rounded-md border-l-4 border-purple-400">
                    <span className="text-sm font-bold text-purple-800">Then:</span>
                    <span className="text-sm text-purple-700 ml-2">{outlineData.andThen2}</span>
                  </div>
                )}
                {outlineData.andFinally && (
                  <div className="bg-purple-100 px-2 py-1 rounded-md border-l-4 border-purple-400">
                    <span className="text-sm font-bold text-purple-800">Finally:</span>
                    <span className="text-sm text-purple-700 ml-2">{outlineData.andFinally}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="bg-blue-50 p-3 rounded-lg border">
            <div className="flex justify-between items-center mb-1">
              <h4 className="font-semibold text-blue-800">Story Title</h4>
            </div>
            <input
              type="text"
              value={writingData.title}
              onChange={(e) => setWritingData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-2 border rounded border-blue-200"
              placeholder="Enter your story title..."
            />
          </div>

          {/* Writing sections similar to academic essay */}
          <div className="space-y-2">
            {/* Opening */}
            <div className="bg-blue-50 p-3 rounded-lg border">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold text-blue-800">Opening</h4>
                  {outlineData.first && (
                    <div className="bg-blue-100 px-2 py-1 rounded-md border-l-4 border-blue-400">
                      <p className="text-sm text-blue-700">{outlineData.first}</p>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="text-xs">
                  {getWordCount(writingData.story.split('\n\n')[0] || '')} words
                </Button>
              </div>
              <Textarea
                placeholder="Begin your story with an engaging opening scene..."
                value={writingData.story.split('\n\n')[0] || ''}
                onChange={(e) => {
                  const paragraphs = writingData.story.split('\n\n');
                  paragraphs[0] = e.target.value;
                  setWritingData(prev => ({ ...prev, story: paragraphs.join('\n\n') }));
                }}
                className="min-h-[100px] border-blue-200 w-full"
              />
            </div>

            {/* Body 1 */}
            <div className="bg-green-50 p-3 rounded-lg border">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold text-green-800">Body 1</h4>
                  {outlineData.andThen1 && (
                    <div className="bg-green-100 px-2 py-1 rounded-md border-l-4 border-green-400">
                      <p className="text-sm text-green-700">{outlineData.andThen1}</p>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="text-xs">
                  {getWordCount(writingData.story.split('\n\n')[1] || '')} words
                </Button>
              </div>
              <Textarea
                placeholder="Develop your first main story point..."
                value={writingData.story.split('\n\n')[1] || ''}
                onChange={(e) => {
                  const paragraphs = writingData.story.split('\n\n');
                  paragraphs[1] = e.target.value;
                  setWritingData(prev => ({ ...prev, story: paragraphs.join('\n\n') }));
                }}
                className="min-h-[120px] border-green-200 w-full"
              />
            </div>

            {/* Body 2 */}
            <div className="bg-green-50 p-3 rounded-lg border">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold text-green-800">Body 2</h4>
                  {outlineData.andThen2 && (
                    <div className="bg-green-100 px-2 py-1 rounded-md border-l-4 border-green-400">
                      <p className="text-sm text-green-700">{outlineData.andThen2}</p>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="text-xs">
                  {getWordCount(writingData.story.split('\n\n')[2] || '')} words
                </Button>
              </div>
              <Textarea
                placeholder="Continue developing your story..."
                value={writingData.story.split('\n\n')[2] || ''}
                onChange={(e) => {
                  const paragraphs = writingData.story.split('\n\n');
                  paragraphs[2] = e.target.value;
                  setWritingData(prev => ({ ...prev, story: paragraphs.join('\n\n') }));
                }}
                className="min-h-[120px] border-green-200 w-full"
              />
            </div>

            {/* Body 3 */}
            <div className="bg-green-50 p-3 rounded-lg border">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold text-green-800">Body 3</h4>
                </div>
                <Button variant="ghost" size="sm" className="text-xs">
                  {getWordCount(writingData.story.split('\n\n')[3] || '')} words
                </Button>
              </div>
              <Textarea
                placeholder="Build towards the climax of your story..."
                value={writingData.story.split('\n\n')[3] || ''}
                onChange={(e) => {
                  const paragraphs = writingData.story.split('\n\n');
                  paragraphs[3] = e.target.value;
                  setWritingData(prev => ({ ...prev, story: paragraphs.join('\n\n') }));
                }}
                className="min-h-[120px] border-green-200 w-full"
              />
            </div>

            {/* Conclusion */}
            <div className="bg-purple-50 p-3 rounded-lg border">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold text-purple-800">Conclusion</h4>
                  {outlineData.andFinally && (
                    <div className="bg-purple-100 px-2 py-1 rounded-md border-l-4 border-purple-400">
                      <p className="text-sm text-purple-700">{outlineData.andFinally}</p>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="text-xs">
                  {getWordCount(writingData.story.split('\n\n')[4] || '')} words
                </Button>
              </div>
              <Textarea
                placeholder="Conclude your story with a satisfying ending..."
                value={writingData.story.split('\n\n')[4] || ''}
                onChange={(e) => {
                  const paragraphs = writingData.story.split('\n\n');
                  paragraphs[4] = e.target.value;
                  setWritingData(prev => ({ ...prev, story: paragraphs.join('\n\n') }));
                }}
                className="min-h-[100px] border-purple-200 w-full"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 p-2 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-lg font-semibold">Total: {getWordCount(writingData.story)} words</span>
                <p className="text-sm text-gray-600">Continue developing your creative story</p>
              </div>

              <div className="flex gap-2">
                {onBackToOutline && (
                  <Button variant="outline" onClick={onBackToOutline} className="border-purple-500 text-purple-600 hover:bg-purple-50">
                    <Edit className="h-4 w-4 mr-2" />
                    Back to Outline
                  </Button>
                )}
                <Button variant="outline" onClick={onClose}>
                  Save Draft
                </Button>
                <Button 
                  onClick={submitStory}
                  disabled={isSubmitting || !writingData.title.trim() || !writingData.story.trim() || getWordCount(writingData.story) < 50}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Story'}
                  <FileText className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}