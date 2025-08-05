import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Save, Eye, Lightbulb, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

interface StructuredEssayWriterProps {
  topicTitle: string;
  topicDescription: string;
  studentId: string;
  onBack: () => void;
}

interface EssaySection {
  id: string;
  title: string;
  description: string;
  suggestions: string[];
  placeholder: string;
  minLength: number;
}

const essaySections: EssaySection[] = [
  {
    id: 'opening',
    title: 'Opening Paragraph',
    description: 'Start your essay with an interesting hook to grab the reader\'s attention.',
    suggestions: [
      'Start with a question that makes readers think',
      'Begin with an interesting fact or statistic',
      'Share a short, relevant story or example',
      'Use a surprising statement or quote'
    ],
    placeholder: 'Begin your opening paragraph here. Remember to introduce your topic and grab the reader\'s attention...',
    minLength: 50
  },
  {
    id: 'body1',
    title: 'First Body Paragraph',
    description: 'Develop your first main idea with details and examples.',
    suggestions: [
      'State your main point clearly',
      'Give specific examples or evidence',
      'Explain why this point is important',
      'Connect back to your main topic'
    ],
    placeholder: 'Write your first main point here. Include details and examples to support your idea...',
    minLength: 75
  },
  {
    id: 'body2',
    title: 'Second Body Paragraph',
    description: 'Present your second main idea with supporting details.',
    suggestions: [
      'Introduce a new but related point',
      'Provide different examples or evidence',
      'Show how this connects to your first point',
      'Build on your overall argument'
    ],
    placeholder: 'Develop your second main idea here. Use new examples and connect to your previous point...',
    minLength: 75
  },
  {
    id: 'conclusion',
    title: 'Conclusion Paragraph',
    description: 'Wrap up your essay by summarizing your main points and leaving a lasting impression.',
    suggestions: [
      'Restate your main points in new words',
      'Explain why your topic matters',
      'End with a thought-provoking statement',
      'Connect to something bigger or more universal'
    ],
    placeholder: 'Conclude your essay here. Summarize your main points and leave the reader with something to think about...',
    minLength: 50
  }
];

export const StructuredEssayWriter = ({ 
  topicTitle, 
  topicDescription, 
  studentId, 
  onBack 
}: StructuredEssayWriterProps) => {
  const [essayContent, setEssayContent] = useState<Record<string, string>>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState<Record<string, boolean>>({});
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleContentChange = (sectionId: string, content: string) => {
    setEssayContent(prev => ({
      ...prev,
      [sectionId]: content
    }));
  };

  const toggleSuggestions = (sectionId: string) => {
    setShowSuggestions(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getSectionProgress = (section: EssaySection) => {
    const content = essayContent[section.id] || '';
    const wordCount = getWordCount(content);
    const minWords = Math.ceil(section.minLength / 5); // Rough estimate: 5 chars per word
    return Math.min(100, (wordCount / minWords) * 100);
  };

  const getTotalProgress = () => {
    const totalProgress = essaySections.reduce((sum, section) => 
      sum + getSectionProgress(section), 0
    );
    return Math.round(totalProgress / essaySections.length);
  };

  const saveEssay = async () => {
    setIsSaving(true);
    try {
      // This would save to the database
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast({
        title: "Essay Saved",
        description: "Your progress has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Could not save your essay. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderSection = (section: EssaySection, index: number) => (
    <Card key={section.id} className="mb-6">
      <CardHeader className="bg-gradient-to-r from-purple-100 to-blue-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-purple-600 flex items-center gap-2">
            <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
              {index + 1}
            </span>
            {section.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleSuggestions(section.id)}
              className="flex items-center gap-1"
            >
              <Lightbulb className="w-4 h-4" />
              Tips
            </Button>
            <div className="text-sm text-purple-600 font-medium">
              {getWordCount(essayContent[section.id] || '')} words
            </div>
          </div>
        </div>
        <p className="text-gray-600 text-sm">{section.description}</p>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getSectionProgress(section)}%` }}
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {showSuggestions[section.id] && (
          <Card className="mb-4 bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Writing Tips:
              </h4>
              <ul className="space-y-1">
                {section.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-sm text-yellow-700 flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        
        <Textarea
          value={essayContent[section.id] || ''}
          onChange={(e) => handleContentChange(section.id, e.target.value)}
          placeholder={section.placeholder}
          className="min-h-[150px] resize-none border-purple-200 focus:border-purple-400"
          rows={6}
        />
      </CardContent>
    </Card>
  );

  if (isPreviewMode) {
    const fullEssay = essaySections.map(section => essayContent[section.id] || '').join('\n\n');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button 
              variant="outline" 
              onClick={() => setIsPreviewMode(false)}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to editing
            </Button>
            <h1 className="text-2xl font-bold text-purple-600">Essay Preview</h1>
            <Button onClick={saveEssay} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Essay'}
            </Button>
          </div>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-center text-xl">{topicTitle}</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="prose max-w-none">
                {fullEssay.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
              
              <div className="mt-8 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Total words: {getWordCount(fullEssay)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Topics
            </Button>
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-purple-600">{topicTitle}</h1>
            <p className="text-gray-600 text-sm">{topicDescription}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={() => setIsPreviewMode(true)}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview
            </Button>
            <Button onClick={saveEssay} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-600">Overall Progress</span>
              <span className="text-sm text-purple-600">{getTotalProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${getTotalProgress()}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Complete all sections to finish your essay
            </p>
          </CardContent>
        </Card>

        {/* Essay Sections */}
        <div className="space-y-6">
          {essaySections.map((section, index) => renderSection(section, index))}
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-center gap-4 mt-8">
          <Button 
            variant="outline"
            onClick={() => setIsPreviewMode(true)}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview Essay
          </Button>
          <Button 
            onClick={saveEssay} 
            disabled={isSaving}
            className="bg-purple-500 hover:bg-purple-600"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Essay'}
          </Button>
        </div>
      </div>
    </div>
  );
};