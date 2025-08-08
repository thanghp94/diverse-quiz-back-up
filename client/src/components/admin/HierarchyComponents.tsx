import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BookOpen, Target, FileText, GripVertical, ChevronRight } from 'lucide-react';
import { HierarchyNodeProps } from './types';

export const SortableContentItem: React.FC<{ 
  contentItem: any; 
  index: number; 
}> = ({ contentItem, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contentItem.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-2 py-2 px-2 rounded border bg-white cursor-move hover:bg-gray-50"
    >
      <GripVertical className="h-4 w-4 text-gray-400" />
      <FileText className="h-4 w-4 text-purple-500" />
      <span className="text-sm flex-1">{contentItem.title}</span>
      <Badge variant="secondary" className="text-xs">
        Content
      </Badge>
      <span className="text-xs text-gray-500">Order: {contentItem.order || index}</span>
    </div>
  );
};

export const SortableGroupContentItem: React.FC<{ 
  groupContent: any; 
  index: number; 
}> = ({ groupContent, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: groupContent.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-2 py-1 px-2 rounded bg-white border border-orange-200 hover:border-orange-300 cursor-move"
    >
      <GripVertical className="h-3 w-3 text-gray-400" />
      <FileText className="h-3 w-3 text-purple-500" />
      <span className="text-sm flex-1">{groupContent.title}</span>
      <Badge variant="secondary" className="text-xs">
        Content
      </Badge>
      <span className="text-xs text-gray-500">Order: {groupContent.order || index + 1}</span>
    </div>
  );
};

export const SortableGroupCard: React.FC<{
  contentItem: any;
  index: number;
  sensors: any;
  onGroupContentReorder: (event: DragEndEvent, groupCardId: string) => void;
}> = ({ contentItem, index, sensors, onGroupContentReorder }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contentItem.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="border-2 border-orange-200 rounded-lg p-3 bg-orange-50 cursor-move"
    >
      <div className="flex items-center gap-2 mb-2" {...listeners}>
        <GripVertical className="h-4 w-4 text-gray-400" />
        <Target className="h-4 w-4 text-orange-500" />
        <span className="font-medium text-orange-800">{contentItem.title}</span>
        <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
          Group Card
        </Badge>
        <span className="text-xs text-gray-500">Order: {contentItem.order || index + 1}</span>
      </div>
      {contentItem.summary && (
        <p className="text-sm text-orange-700 mb-2">{contentItem.summary}</p>
      )}
      {/* Group Card Content - Sortable */}
      {contentItem.content && contentItem.content.length > 0 && (
        <div className="ml-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => onGroupContentReorder(event, contentItem.id)}
          >
            <SortableContext
              items={contentItem.content.map((item: any) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {contentItem.content.map((groupContent: any, gIndex: number) => (
                  <SortableGroupContentItem
                    key={groupContent.id}
                    groupContent={groupContent}
                    index={gIndex}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
};

export const SortableTopic: React.FC<{
  node: any;
  level: number;
  onContentReorder: (items: Array<{ id: string; position: number }>) => void;
  onTopicReorder?: (items: Array<{ id: string; position: number }>) => void;
}> = ({ node, level, onContentReorder, onTopicReorder }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <HierarchyNode 
        node={node} 
        level={level} 
        onContentReorder={onContentReorder}
        onTopicReorder={onTopicReorder}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

export const HierarchyNode: React.FC<HierarchyNodeProps & { 
  dragHandleProps?: any;
  onTopicReorder?: (items: Array<{ id: string; position: number }>) => void;
}> = ({ 
  node, 
  level, 
  onContentReorder, 
  onTopicReorder,
  dragHandleProps 
}) => {
  const [isExpanded, setIsExpanded] = useState(level === 0); // Expand root topics by default
  const [contentItems, setContentItems] = useState(node.content || []);
  const indent = level * 24; // 24px indent per level

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = contentItems.findIndex((item: any) => item.id === active.id);
      const newIndex = contentItems.findIndex((item: any) => item.id === over?.id);

      const newContentItems = arrayMove(contentItems, oldIndex, newIndex);
      setContentItems(newContentItems);

      // Create reorder data with new positions
      const reorderData = newContentItems.map((item: any, index: number) => ({
        id: item.id,
        position: index + 1
      }));

      // Call parent callback to update server
      if (onContentReorder) {
        onContentReorder(reorderData);
      }
    }
  };

  const handleGroupContentDragEnd = (event: DragEndEvent, groupCardId: string) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      // Find the group card and update its content
      const updatedContentItems = contentItems.map((item: any) => {
        if (item.id === groupCardId && item.type === 'groupcard') {
          const groupContent = item.content || [];
          const oldIndex = groupContent.findIndex((content: any) => content.id === active.id);
          const newIndex = groupContent.findIndex((content: any) => content.id === over?.id);
          
          const newGroupContent = arrayMove(groupContent, oldIndex, newIndex);
          
          // Create reorder data for group content
          const reorderData = newGroupContent.map((content: any, index: number) => ({
            id: content.id,
            position: index + 1
          }));

          // Call parent callback to update server
          if (onContentReorder) {
            onContentReorder(reorderData);
          }

          return {
            ...item,
            content: newGroupContent
          };
        }
        return item;
      });

      setContentItems(updatedContentItems);
    }
  };

  return (
    <div style={{ marginLeft: `${indent}px` }} className="border-l-2 border-gray-200 pl-4">
      {/* Topic Header */}
      <div className="flex items-center gap-2 mb-2">
        {/* Drag Handle for Topics */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="cursor-grab hover:cursor-grabbing p-1"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        )}
        
        {(node.children.length > 0 || contentItems.length > 0) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronRight className="h-4 w-4 rotate-90" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
        <div className="flex items-center gap-2">
          {node.type === 'groupcard' ? (
            <Target className="h-4 w-4 text-orange-500" />
          ) : (
            <BookOpen className="h-4 w-4 text-blue-500" />
          )}
          <span className="font-medium">{node.title}</span>
          <Badge variant="outline" className="text-xs">
            {node.type === 'groupcard' ? 'Group Card' : 'Topic'}
          </Badge>
          {node.showstudent && (
            <Badge variant="default" className="text-xs bg-green-500">
              Visible
            </Badge>
          )}
        </div>
      </div>

      {/* Topic Summary */}
      {node.summary && (
        <p className="text-sm text-gray-600 ml-8 mb-2">{node.summary}</p>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="ml-8 space-y-2">
          {/* Sortable Content Items */}
          {contentItems.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={contentItems.map((item: any) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {contentItems.map((contentItem: any, index: number) => {
                    if (contentItem.type === 'groupcard') {
                      return (
                        <SortableGroupCard
                          key={contentItem.id}
                          contentItem={contentItem}
                          index={index}
                          sensors={sensors}
                          onGroupContentReorder={handleGroupContentDragEnd}
                        />
                      );
                    } else {
                      return (
                        <SortableContentItem
                          key={contentItem.id}
                          contentItem={contentItem}
                          index={index}
                        />
                      );
                    }
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Child Topics - Sortable */}
          {node.children.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => {
                const { active, over } = event;
                if (active.id !== over?.id) {
                  const childTopics = node.children;
                  const oldIndex = childTopics.findIndex((child: any) => child.id === active.id);
                  const newIndex = childTopics.findIndex((child: any) => child.id === over?.id);
                  
                  if (oldIndex !== -1 && newIndex !== -1) {
                    const reorderData = arrayMove(childTopics, oldIndex, newIndex).map((child: any, index: number) => ({
                      id: child.id,
                      position: index + 1
                    }));
                    
                    // Call the topics reorder mutation for child topics
                    if (onTopicReorder) {
                      onTopicReorder(reorderData);
                    }
                  }
                }
              }}
            >
              <SortableContext
                items={node.children.map((child: any) => child.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {node.children.map((child: any) => (
                    <SortableTopic
                      key={child.id} 
                      node={child} 
                      level={level + 1} 
                      onContentReorder={onContentReorder}
                      onTopicReorder={onTopicReorder}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  );
};