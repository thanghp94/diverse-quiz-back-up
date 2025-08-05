import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Home } from 'lucide-react';
import { Link } from 'wouter';

interface WritingTopic {
  id: string;
  title: string;
  description: string;
  prompts: string[];
}

interface WritingTopicSelectionProps {
  category: string;
  onBack: () => void;
  onTopicSelect: (topicId: string) => void;
}

const topicsByCategory = {
  creative_writing: [
    {
      id: 'adventure_story',
      title: 'Adventure Story',
      description: 'Create an exciting story about an adventure in a faraway place.',
      prompts: [
        'Who is your main character and what makes them special?',
        'What challenge or quest are they facing?',
        'What surprising twist happens in your story?'
      ]
    },
    {
      id: 'my_superhero',
      title: 'My Superhero',
      description: 'Invent your own superhero with amazing powers.',
      prompts: [
        'What special powers does your superhero have?',
        'How did they get their powers?',
        'What problem does your superhero solve?'
      ]
    },
    {
      id: 'time_travel_adventure',
      title: 'Time Travel Adventure',
      description: 'Imagine you could travel to any time in history or the future.',
      prompts: [
        'Where and when would you go?',
        'What would you see or do there?',
        'Would you change anything or just observe?'
      ]
    },
    {
      id: 'magical_creature',
      title: 'Magical Creature',
      description: 'Create a magical creature that no one has ever seen before.',
      prompts: [
        'What does your creature look like?',
        'What special abilities does it have?',
        'Where does it live and what does it eat?'
      ]
    },
    {
      id: 'life_in_future',
      title: 'Life in the Future',
      description: 'Imagine what life might be like 100 years from now.',
      prompts: [
        'How will schools be different?',
        'What new technology might exist?',
        'What problems might be solved in the future?'
      ]
    },
    {
      id: 'mystery_story',
      title: 'Mystery Story',
      description: 'Write a mystery story where you solve a puzzling case.',
      prompts: [
        'What mysterious event needs to be solved?',
        'What clues do you discover along the way?',
        'Who turns out to be behind the mystery?'
      ]
    }
  ]
};

export const WritingTopicSelection = ({ category, onBack, onTopicSelect }: WritingTopicSelectionProps) => {
  const [fetchedTopics, setFetchedTopics] = useState<WritingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/writing-prompts/category/${category}`);
        if (response.ok) {
          const prompts = await response.json();
          const formattedTopics = prompts.map((prompt: any) => ({
            id: prompt.id,
            title: prompt.title,
            description: prompt.description || 'Write about this topic.',
            prompts: prompt.prompts || []
          }));
          setFetchedTopics(formattedTopics);
        } else {
          // Fallback to hardcoded topics if API fails
          setFetchedTopics(topicsByCategory[category as keyof typeof topicsByCategory] || []);
        }
      } catch (error) {
        console.error('Failed to fetch writing prompts:', error);
        // Fallback to hardcoded topics
        setFetchedTopics(topicsByCategory[category as keyof typeof topicsByCategory] || []);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [category]);

  const topics = fetchedTopics;
  
  const getCategoryTitle = (cat: string) => {
    const titles = {
      creative_writing: 'Creative Writing Topics',
      personal_experience: 'Personal Experience Topics',
      opinions_ideas: 'Opinion & Ideas Topics',
      school_homework: 'School Homework Topics',
      free_writing: 'Free Writing Topics'
    };
    return titles[cat as keyof typeof titles] || 'Writing Topics';
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Writing
            </Button>
            <h1 className="text-3xl font-bold text-purple-600">
              {getCategoryTitle(category)}
            </h1>
          </div>
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Back to Topics
            </Button>
          </Link>
        </div>

        {/* Topics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm border-purple-200 rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-300 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
                <div className="h-10 bg-gray-300 rounded"></div>
              </div>
            ))
          ) : topics.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-gray-600">
              <p>No writing topics found for this category.</p>
            </div>
          ) : (
            topics.map((topic) => (
            <Card 
              key={topic.id}
              className="bg-white/80 backdrop-blur-sm border-purple-200 hover:border-purple-400 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              <CardHeader className="bg-gradient-to-r from-purple-100 to-blue-100">
                <CardTitle className="text-purple-600 text-xl">
                  {topic.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">{topic.description}</p>
                
                <div className="mb-4">
                  <h4 className="font-semibold text-purple-600 mb-2">Ideas to get you started:</h4>
                  <ul className="space-y-1">
                    {topic.prompts.map((prompt, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        {prompt}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Button 
                  onClick={() => onTopicSelect(topic.id)}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                >
                  Write about this
                </Button>
              </CardContent>
            </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};