import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PersonalNoteContent } from "../../activities/personal/PersonalNoteButton";
import { getCurrentStudentId } from "../../utils/contentCardUtils";

interface PersonalNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentId: string;
  onClose: () => void;
}

export const PersonalNoteDialog: React.FC<PersonalNoteDialogProps> = ({
  open,
  onOpenChange,
  contentId,
  onClose
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 bg-white border-gray-300">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-gray-900 text-lg font-medium">Personal Note</h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:bg-gray-200 flex-shrink-0"
          >
            ✕
          </Button>
        </div>
        <div className="p-6">
          <PersonalNoteContent 
            contentId={contentId}
            studentId={getCurrentStudentId()}
            onClose={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
