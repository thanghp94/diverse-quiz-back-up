import React from 'react';
import { Button } from "@/components/ui/button";
import { Shuffle } from "lucide-react";
import { useParentTopicMatching } from "@/hooks/useTopicMatching";

interface ParentTopicMatchingButtonProps {
  parentTopicId: string;
  parentTopicName: string;
  onStartTopicMatching: (topicId: string, topicName: string) => void;
}

export const ParentTopicMatchingButton = ({ 
  parentTopicId, 
  parentTopicName, 
  onStartTopicMatching 
}: ParentTopicMatchingButtonProps) => {
  const { hasParentMatchingActivities, parentMatchingActivities } = useParentTopicMatching(parentTopicId);
  
  if (!hasParentMatchingActivities) {
    return null;
  }
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="text-white/70 hover:bg-white/20 hover:text-white h-8 w-8"
      onClick={(e) => {
        e.stopPropagation();
        onStartTopicMatching(parentTopicId, parentTopicName);
      }}
      title={`${parentMatchingActivities?.length || 0} matching activities available`}
    >
      <Shuffle className="h-4 w-4" />
      <span className="sr-only">Start Matching for {parentTopicName}</span>
    </Button>
  );
};