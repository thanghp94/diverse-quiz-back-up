
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BookOpen, Target, HelpCircle } from "lucide-react";
import { Topic } from "@/hooks/useTopics";
import { useState, useEffect } from "react";
import TopicQuizRunner from "./TopicQuizRunner";

interface TopicCardProps {
  topic: Topic;
}

const TopicCard = ({ topic }: TopicCardProps) => {
  const [topicQuizInfo, setTopicQuizInfo] = useState<{
    topicId: string;
    level: "Overview" | "Easy" | "Hard";
    topicName: string;
  } | null>(null);
  
  const [availableQuizLevels, setAvailableQuizLevels] = useState<{
    Overview: boolean;
    Easy: boolean;
    Hard: boolean;
  }>({ Overview: false, Easy: false, Hard: false });

  useEffect(() => {
    const checkAvailableQuizLevels = async () => {
      const levels = ["Overview", "Easy", "Hard"] as const;
      const availability = { Overview: false, Easy: false, Hard: false };
      
      for (const level of levels) {
        try {
          const response = await fetch(`/api/questions?topicId=${topic.id}&level=${level}`);
          if (response.ok) {
            const questions = await response.json();
            availability[level] = questions && questions.length > 0;
          }
        } catch (error) {
          console.error(`Error checking ${level} questions for topic ${topic.id}:`, error);
        }
      }
      
      setAvailableQuizLevels(availability);
    };
    
    checkAvailableQuizLevels();
  }, [topic.id]);

  const handleStartTopicQuiz = (level: "Overview" | "Easy" | "Hard") => {
    if (!availableQuizLevels[level]) {
      return; // Don't start quiz if no questions available
    }
    
    setTopicQuizInfo({
      topicId: topic.id,
      level: level,
      topicName: topic.topic
    });
  };

  const closeTopicQuiz = () => {
    setTopicQuizInfo(null);
  };

  return (
    <>
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-blue-100">
              <Target className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          {topic.challengesubject && (
            <Badge variant="outline" className="text-xs">
              {topic.challengesubject}
            </Badge>
          )}
        </div>
        
        <Link to={`/content/${topic.id}`}>
          <div className="cursor-pointer">
            <h3 className="font-medium text-gray-800 text-sm mb-1">{topic.topic}</h3>
            {topic.short_summary && (
              <p className="text-xs text-gray-600 line-clamp-2 mb-3">{topic.short_summary}</p>
            )}
          </div>
        </Link>

        {/* Quiz Buttons - Only show if any quiz level has questions */}
        {(availableQuizLevels.Overview || availableQuizLevels.Easy || availableQuizLevels.Hard) && (
          <div className="flex gap-1 mt-3 pt-2 border-t border-gray-100">
            {availableQuizLevels.Overview && (
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 hover:bg-blue-50 border-blue-200 text-xs px-2 py-1 h-6 flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartTopicQuiz("Overview");
                }}
                title="Overview Quiz"
              >
                <HelpCircle className="h-3 w-3 mr-1" />
                Overview
              </Button>
            )}
            
            {availableQuizLevels.Easy && (
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 hover:bg-green-50 border-green-200 text-xs px-2 py-1 h-6 flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartTopicQuiz("Easy");
                }}
                title="Easy Quiz"
              >
                <HelpCircle className="h-3 w-3 mr-1" />
                Easy
              </Button>
            )}
            
            {availableQuizLevels.Hard && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50 border-red-200 text-xs px-2 py-1 h-6 flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartTopicQuiz("Hard");
                }}
                title="Hard Quiz"
              >
                <HelpCircle className="h-3 w-3 mr-1" />
                Hard
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Topic Quiz Runner */}
      {topicQuizInfo && (
        <TopicQuizRunner
          topicId={topicQuizInfo.topicId}
          level={topicQuizInfo.level}
          topicName={topicQuizInfo.topicName}
          onClose={closeTopicQuiz}
        />
      )}
    </>
  );
};

export default TopicCard;
