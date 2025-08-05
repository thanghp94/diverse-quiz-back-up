import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileText, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface PersonalNotesDropdownProps {
  contentId: string;
  studentId: string;
  compact?: boolean;
  onContentClick?: (contentId: string) => void;
}

export const PersonalNotesDropdown: React.FC<PersonalNotesDropdownProps> = ({ 
  contentId, 
  studentId, 
  compact = false,
  onContentClick
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch existing note
  const { data: existingRating } = useQuery<{ rating: string; personal_note?: string } | null>({
    queryKey: ['/api/content-ratings', studentId, contentId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/content-ratings/${studentId}/${contentId}`);
        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          throw new Error('Failed to fetch rating');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching rating:', error);
        return null;
      }
    },
    enabled: isOpen
  });

  const hasNote = existingRating?.personal_note && existingRating.personal_note.trim() !== '';

  // Don't show dropdown if no note exists
  if (!hasNote) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size={compact ? "sm" : "default"}
          className={cn(
            "text-blue-600 hover:bg-blue-500/20 hover:text-blue-600 bg-blue-500/10 border-blue-400/50",
            compact ? "text-xs px-2 py-1 h-6" : "text-sm px-2 py-1",
            "flex items-center gap-1"
          )}
        >
          <FileText className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
          My Note
          <ChevronDown className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" side="bottom" align="start">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-sm">My Personal Note</h4>
          </div>
          <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-700 max-h-32 overflow-y-auto">
            {existingRating?.personal_note || 'No note available'}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};