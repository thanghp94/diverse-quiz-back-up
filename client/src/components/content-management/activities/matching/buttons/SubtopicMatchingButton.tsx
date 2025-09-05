import React from 'react';
import { Button } from "@/components/ui/button";
import { Shuffle } from "lucide-react";
import { useTopicMatching } from "@/hooks/useTopicMatching";

interface SubtopicMatchingButtonProps {
  topicId: string;
  topicName: string;
  onStartTopicMatching: (topicId: string, topicName: string) => void;
}

export const SubtopicMatchingButton = ({ 
  topicId, 
  topicName, 
  onStartTopicMatching 
}: SubtopicMatchingButtonProps) => {
  const { hasMatchingActivities } = useTopicMatching(topicId);
  
  if (!hasMatchingActivities) {
    return null;
  }
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="text-white/70 hover:bg-white/20 hover:text-white h-6 w-6"
      onClick={(e) => {
        e.stopPropagation();
        onStartTopicMatching(topicId, topicName);
      }}
    >
      <Shuffle className="h-4 w-4" />
      <span className="sr-only">Start Matching for {topicName}</span>
    </Button>
  );
};