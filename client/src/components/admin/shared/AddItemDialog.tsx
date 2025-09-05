import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AddItemForms } from './AddItemForms';
import { ActiveTab } from './types';

interface AddItemDialogProps {
  activeTab: ActiveTab;
  showAddDialog: boolean;
  setShowAddDialog: (show: boolean) => void;
  newItemData: any;
  setNewItemData: (data: any) => void;
  onCreate: () => void;
}

export const AddItemDialog: React.FC<AddItemDialogProps> = ({
  activeTab,
  showAddDialog,
  setShowAddDialog,
  newItemData,
  setNewItemData,
  onCreate
}) => {
  const getTabDisplayName = () => {
    switch (activeTab) {
      case 'students': return 'Student';
      case 'topics': return 'Topic';
      case 'content': return 'Content';
      case 'assignments': return 'Assignment';
      case 'questions': return 'Question';
      case 'matching': return 'Matching';
      case 'collections': return 'Collection';
      default: return 'Item';
    }
  };

  const handleCancel = () => {
    setShowAddDialog(false);
    setNewItemData({});
  };

  return (
    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New {getTabDisplayName()}</DialogTitle>
        </DialogHeader>
        <AddItemForms 
          activeTab={activeTab}
          newItemData={newItemData}
          setNewItemData={setNewItemData}
        />
        <div className="flex gap-2 mt-4">
          <Button onClick={onCreate}>
            Create
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};