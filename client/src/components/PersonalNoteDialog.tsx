import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface PersonalNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  studentId: string;
}

export const PersonalNoteDialog: React.FC<PersonalNoteDialogProps> = ({
  isOpen,
  onClose,
  contentId,
  studentId
}) => {
  const [noteText, setNoteText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Update note text when dialog opens and data is loaded
  useEffect(() => {
    if (isOpen && existingRating) {
      setNoteText(existingRating.personal_note || '');
    }
  }, [isOpen, existingRating]);

  // Save note mutation
  const saveNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      const response = await fetch(`/api/content-ratings/${studentId}/${contentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personal_note: note
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save note');
      }
      
      return response.json();
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
    setIsLoading(true);
    saveNoteMutation.mutate(noteText);
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />
      
      {/* Dialog content */}
      <div className="relative z-[10001] bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold leading-none tracking-tight">Personal Note</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Add your personal notes about this content. Only you can see these notes.
          </p>
        </div>
        
        {/* Content */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="note-text">Your Note</Label>
            <Textarea
              id="note-text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Write your personal note here..."
              className="min-h-[100px] mt-2"
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveNote} 
            disabled={isLoading || saveNoteMutation.isPending}
            className="mb-2 sm:mb-0"
          >
            {isLoading || saveNoteMutation.isPending ? "Saving..." : "Save Note"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};