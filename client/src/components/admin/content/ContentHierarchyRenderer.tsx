import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
import { SortableTopic } from './HierarchyComponents';

interface ContentHierarchyRendererProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCollectionFilter: string;
  setSelectedCollectionFilter: (filter: string) => void;
  selectedYearFilter: string;
  setSelectedYearFilter: (filter: string) => void;
  collections: any[];
  filteredData: any[];
  sensors: any;
  reorderTopics: any;
}

export const ContentHierarchyRenderer: React.FC<ContentHierarchyRendererProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCollectionFilter,
  setSelectedCollectionFilter,
  selectedYearFilter,
  setSelectedYearFilter,
  collections,
  filteredData,
  sensors,
  reorderTopics
}) => {
  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search content hierarchy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Collection:</Label>
          <Select value={selectedCollectionFilter} onValueChange={setSelectedCollectionFilter}>
            <SelectTrigger className="w-48 h-9">
              <SelectValue placeholder="Select collection..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Content</SelectItem>
              {(collections as any[])?.map((collection) => (
                <SelectItem key={collection.id} value={collection.id}>
                  {collection.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Year:</Label>
          <Select value={selectedYearFilter} onValueChange={setSelectedYearFilter}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue placeholder="Year..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredData.length > 0 ? (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event: DragEndEvent) => {
            const { active, over } = event;
            if (active.id !== over?.id && over) {
              const oldIndex = (filteredData as any[]).findIndex(topic => topic.id === active.id);
              const newIndex = (filteredData as any[]).findIndex(topic => topic.id === over.id);
              
              if (oldIndex !== -1 && newIndex !== -1) {
                const reorderedTopics = arrayMove(filteredData as any[], oldIndex, newIndex);
                const reorderData = reorderedTopics.map((topic: any, index: number) => ({
                  id: topic.id,
                  position: index + 1
                }));
                
                reorderTopics.mutate(reorderData);
              }
            }
          }}
        >
          <SortableContext
            items={(filteredData as any[]).map(topic => topic.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {(filteredData as any[]).map((rootTopic: any) => (
                <SortableTopic
                  key={rootTopic.id} 
                  node={rootTopic}
                  level={0}
                  onContentReorder={() => {}}
                  onTopicReorder={() => {}}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No content hierarchy found for the selected filters
        </div>
      )}
    </div>
  );
};