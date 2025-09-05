import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Global state for blocking content clicks when note button is clicked
let globalClickBlocked = false;
let globalClickBlockTimeout: NodeJS.Timeout | null = null;

interface NoteButtonProps {
  contentId: string;
  studentId: string;
  compact?: boolean;
}

export const PersonalNoteContent: React.FC<{ contentId: string; studentId: string; onClose: () => void }> = ({ contentId, studentId, onClose }) => {
  const [noteText, setNoteText] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing note
  const { data: existingRating } = useQuery<{ rating: string; personal_note?: string } | null>({
    queryKey: ['/api/content-ratings', studentId, contentId],
    queryFn: async () => {
      try {
        const url = `/api/content-ratings/${studentId}/${contentId}`;
        console.log('Fetching existing note from:', url);
        const response = await fetch(url);
        console.log('Fetch response status:', response.status);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.log('No existing note found (404)');
            return null;
          }
          throw new Error('Failed to fetch rating');
        }
        const result = await response.json();
        console.log('Existing note data:', result);
        return result;
      } catch (error) {
        console.error('Error fetching rating:', error);
        return null;
      }
    },
  });

  // Update note text when data is loaded
  React.useEffect(() => {
    if (existingRating) {
      setNoteText(existingRating.personal_note || '');
    }
  }, [existingRating]);

  // Save note mutation
  const saveNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      console.log('Attempting to save note:', { studentId, contentId, note });
      const url = `/api/content-ratings/${studentId}/${contentId}`;
      console.log('Request URL:', url);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personal_note: note
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to save note: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('Save successful:', result);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Note saved",
        description: "Your personal note has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/content-ratings', studentId, contentId] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSaveNote = () => {
    saveNoteMutation.mutate(noteText);
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-600 text-sm">
        Add your personal notes about this content. Only you can see these notes.
      </p>

      <div>
        <Label htmlFor="note-text" className="text-gray-700">Your Note</Label>
        <Textarea
          id="note-text"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Write your personal note here..."
          className="min-h-[100px] mt-2"
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
        <Button variant="outline" onClick={onClose} className="mb-2 sm:mb-0">
          Cancel
        </Button>
        <Button
          onClick={handleSaveNote}
          disabled={saveNoteMutation.isPending}
        >
          {saveNoteMutation.isPending ? "Saving..." : "Save Note"}
        </Button>
      </div>
    </div>
  );
};

export const NoteButton: React.FC<NoteButtonProps & { onOpenNote: () => void }> = ({ contentId, studentId, compact = false, onOpenNote }) => {

  // Check if there's an existing note for visual indication
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
  });

  const hasNote = existingRating?.personal_note && existingRating.personal_note.trim() !== '';

  return (
    <>
      <Button
        variant="outline"
        size={compact ? "sm" : "default"}
        className={cn(
          "text-white hover:bg-white/20 hover:text-white bg-transparent border-white/50",
          compact ? "px-2 py-1 h-6" : "px-2 py-2",
          hasNote && "bg-white/10 border-white/70"
        )}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();

          // Block all content clicks globally for a brief moment
          globalClickBlocked = true;
          if (globalClickBlockTimeout) {
            clearTimeout(globalClickBlockTimeout);
          }
          globalClickBlockTimeout = setTimeout(() => {
            globalClickBlocked = false;
          }, 100);

          onOpenNote();
        }}
      >
        <FileText className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
        {hasNote && <span className="ml-1 text-xs">*</span>}
      </Button>
    </>
  );
};
