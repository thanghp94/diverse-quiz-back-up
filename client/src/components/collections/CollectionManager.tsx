import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, ExternalLink, Settings, BookOpen, Users, Target, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Collection {
  id: string;
  name: string;
  description?: string;
  page_route: string;
  display_type: string;
  filter_criteria?: any;
  sort_field: string;
  sort_order: string;
  is_active?: boolean;
  created_at?: string;
}

// Sortable Topic Item Component
const SortableTopicItem: React.FC<{
  topic: any;
  onRemove: (id: string) => void;
}> = ({ topic, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: topic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50"
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        <div>
          <p className="font-medium text-sm">{topic.topic || topic.title}</p>
          {topic.short_summary && (
            <p className="text-xs text-gray-500 mt-1">{topic.short_summary}</p>
          )}
        </div>
      </div>
      <Button 
        size="sm" 
        variant="destructive" 
        onClick={() => onRemove(topic.mapping_id)}
      >
        Remove
      </Button>
    </div>
  );
};

export const CollectionManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isContentDialogOpen, setIsContentDialogOpen] = useState(false);
  const [collectionItems, setCollectionItems] = useState<any[]>([]);
  const [topicSearchTerm, setTopicSearchTerm] = useState('');
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    page_route: '',
    display_type: 'alphabetical',
    filter_criteria: '{}',
    sort_field: 'topic',
    sort_order: 'asc'
  });
  
  // Hierarchical CMS state
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [selectedParent, setSelectedParent] = useState<string>('all');
  const [viewMode, setViewMode] = useState<string>('collection');

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch collections
  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['/api/collections'],
    queryFn: async () => {
      const response = await fetch('/api/collections');
      if (!response.ok) throw new Error('Failed to fetch collections');
      return response.json();
    }
  });

  // Fetch topics for adding to collections
  const { data: topics = [] } = useQuery({
    queryKey: ['/api/topics'],
    queryFn: async () => {
      const response = await fetch('/api/topics');
      if (!response.ok) throw new Error('Failed to fetch topics');
      return response.json();
    }
  });

  // Fetch content for adding to collections
  const { data: content = [] } = useQuery({
    queryKey: ['/api/content'],
    queryFn: async () => {
      const response = await fetch('/api/content');
      if (!response.ok) throw new Error('Failed to fetch content');
      return response.json();
    }
  });

  // Fetch collection content when a collection is selected
  const { data: selectedCollectionContent = [], refetch: refetchCollectionContent } = useQuery({
    queryKey: ['/api/collections', selectedCollection?.id, 'content'],
    queryFn: async () => {
      if (!selectedCollection?.id) return [];
      const response = await fetch(`/api/collections/${selectedCollection.id}/content`);
      if (!response.ok) throw new Error('Failed to fetch collection content');
      return response.json();
    },
    enabled: !!selectedCollection?.id
  });

  // Create collection mutation
  const createMutation = useMutation({
    mutationFn: async (collectionData: any) => {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collectionData)
      });
      if (!response.ok) throw new Error('Failed to create collection');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      setIsCreateDialogOpen(false);
      setNewCollection({
        name: '',
        description: '',
        page_route: '',
        display_type: 'alphabetical',
        filter_criteria: '{}',
        sort_field: 'topic',
        sort_order: 'asc'
      });
      toast({ title: 'Page configuration created successfully' });
    }
  });

  // Delete collection mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/collections/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete collection');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      toast({ title: 'Page configuration deleted successfully' });
    }
  });

  // Add content to collection mutation
  const addContentMutation = useMutation({
    mutationFn: async ({ collectionId, contentData }: { collectionId: string; contentData: any }) => {
      const response = await fetch(`/api/collections/${collectionId}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentData)
      });
      if (!response.ok) throw new Error('Failed to add content to collection');
      return response.json();
    },
    onSuccess: () => {
      refetchCollectionContent();
      toast({ title: 'Content added to collection successfully' });
    }
  });

  // Remove content from collection mutation
  const removeContentMutation = useMutation({
    mutationFn: async (mappingId: string) => {
      const response = await fetch(`/api/collections/content/${mappingId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to remove content from collection');
      return response.json();
    },
    onSuccess: () => {
      refetchCollectionContent();
      toast({ title: 'Content removed from collection successfully' });
    }
  });

  // Reorder collection content mutation
  const reorderMutation = useMutation({
    mutationFn: async ({ collectionId, items }: { collectionId: string; items: Array<{ id: string; position: number }> }) => {
      const response = await fetch(`/api/collections/${collectionId}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      if (!response.ok) throw new Error('Failed to reorder collection content');
      return response.json();
    },
    onSuccess: () => {
      refetchCollectionContent();
      toast({ title: 'Collection content reordered successfully' });
    }
  });

  const handleCreateCollection = () => {
    createMutation.mutate(newCollection);
  };

  const handleDeleteCollection = (id: string) => {
    if (window.confirm('Are you sure you want to delete this page configuration?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleManageContent = (collection: Collection) => {
    setSelectedCollection(collection);
    setCollectionItems(selectedCollectionContent);
    setTopicSearchTerm('');
    setIsContentDialogOpen(true);
  };

  // Drag end handler for reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && selectedCollection) {
      const oldIndex = collectionItems.findIndex((item) => item.id === active.id);
      const newIndex = collectionItems.findIndex((item) => item.id === over?.id);

      const newItems = arrayMove(collectionItems, oldIndex, newIndex);
      setCollectionItems(newItems);

      // Create reorder data
      const reorderData = newItems.map((item, index) => ({
        id: item.id,
        position: index + 1
      }));

      // Send reorder request
      reorderMutation.mutate({
        collectionId: selectedCollection.id,
        items: reorderData
      });
    }
  };

  const handleAddTopic = (topicId: string) => {
    if (!selectedCollection) return;
    
    const nextOrder = Math.max(...collectionItems.map(item => item.display_order || 0), 0) + 1;
    
    addContentMutation.mutate({
      collectionId: selectedCollection.id,
      contentData: {
        topic_id: topicId,
        display_order: nextOrder
      }
    });
  };

  const handleAddContent = (contentId: string) => {
    if (!selectedCollection) return;
    
    const nextOrder = Math.max(...collectionItems.map(item => item.display_order || 0), 0) + 1;
    
    addContentMutation.mutate({
      collectionId: selectedCollection.id,
      contentData: {
        content_id: contentId,
        display_order: nextOrder
      }
    });
  };

  const handleRemoveItem = (mappingId: string) => {
    removeContentMutation.mutate(mappingId);
  };

  // Get available parents for hierarchical filtering
  const getAvailableParents = () => {
    if (selectedLevel === 1) return [];
    
    const parentLevel = selectedLevel - 1;
    return [
      ...topics.filter((topic: any) => (topic.parentid ? 2 : 1) === parentLevel),
      ...content.filter((item: any) => 4 === parentLevel),
    ];
  };

  // Get filtered topics based on hierarchy and search
  const getFilteredTopics = () => {
    let filtered = topics.filter((topic: any) => 
      !selectedCollectionContent.some((item: any) => item.id === topic.id) &&
      topic.topic?.toLowerCase().includes(topicSearchTerm.toLowerCase())
    );

    // Apply hierarchical filtering if in hierarchy view mode
    if (viewMode === 'hierarchy') {
      // Filter by level
      filtered = filtered.filter((topic: any) => {
        const topicLevel = topic.parentid ? 2 : 1;
        return topicLevel === selectedLevel;
      });

      // Filter by parent if specified
      if (selectedParent && selectedParent !== 'all') {
        filtered = filtered.filter((topic: any) => topic.parentid === selectedParent);
      }
    }

    return filtered;
  };

  // Get filtered content based on hierarchy and search
  const getFilteredContent = () => {
    let filtered = content.filter((item: any) => 
      !selectedCollectionContent.some((colItem: any) => colItem.id === item.id) &&
      (item.title?.toLowerCase().includes(topicSearchTerm.toLowerCase()) ||
       item.short_blurb?.toLowerCase().includes(topicSearchTerm.toLowerCase()) ||
       item.prompt?.toLowerCase().includes(topicSearchTerm.toLowerCase()))
    );

    // Apply hierarchical filtering if in hierarchy view mode
    if (viewMode === 'hierarchy' && selectedLevel === 4) {
      // Filter by parent if specified
      if (selectedParent && selectedParent !== 'all') {
        filtered = filtered.filter((item: any) => 
          item.parentid === selectedParent || item.topicid === selectedParent
        );
      }
    }

    return filtered;
  };

  // Get hierarchy items for display
  const getHierarchyItems = () => {
    if (!selectedCollection) return [];

    // Get items from the current collection that match the selected level
    let items = [...selectedCollectionContent];

    // Filter by level
    items = items.filter((item: any) => {
      if (item.topic) {
        // This is a topic
        const topicLevel = item.parentid ? 2 : 1;
        return topicLevel === selectedLevel;
      } else if (item.title || item.prompt) {
        // This is content
        return selectedLevel === 4;
      }
      return false;
    });

    // Filter by parent if specified
    if (selectedParent && selectedParent !== 'all') {
      items = items.filter((item: any) => 
        item.parentid === selectedParent || item.topicid === selectedParent
      );
    }

    return items;
  };

  // Get parent name for display
  const getParentName = (parentId: string) => {
    const parentTopic = topics.find((t: any) => t.id === parentId);
    if (parentTopic) return parentTopic.topic;
    
    const parentContent = content.find((c: any) => c.id === parentId);
    if (parentContent) return parentContent.title || parentContent.prompt || 'Untitled';
    
    return 'Unknown';
  };

  // Get all filtered items (topics + content) for unified display
  const getAllFilteredItems = () => {
    const filteredTopics = getFilteredTopics();
    const filteredContent = getFilteredContent();
    
    // Combine and sort by name/title
    const combined = [
      ...filteredTopics.map((topic: any) => ({ ...topic, isContent: false })),
      ...filteredContent.map((content: any) => ({ ...content, isContent: true }))
    ];

    // Sort alphabetically by display name
    return combined.sort((a, b) => {
      const nameA = (a.topic || a.title || a.prompt || '').toLowerCase();
      const nameB = (b.topic || b.title || b.prompt || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading page configurations...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Page Configuration Manager</h2>
          <p className="text-gray-600 mt-1">Create reusable page layouts using the Topics page component</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Page
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Page Configuration</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Page Name</Label>
                <Input
                  id="name"
                  value={newCollection.name}
                  onChange={(e) => setNewCollection({...newCollection, name: e.target.value})}
                  placeholder="e.g., Mathematics Topics"
                />
              </div>
              <div>
                <Label htmlFor="page_route">Page Route</Label>
                <Input
                  id="page_route"
                  value={newCollection.page_route}
                  onChange={(e) => setNewCollection({...newCollection, page_route: e.target.value})}
                  placeholder="e.g., /math"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCollection.description}
                  onChange={(e) => setNewCollection({...newCollection, description: e.target.value})}
                  placeholder="Describe what this page will display..."
                />
              </div>
              <div>
                <Label htmlFor="display_type">Layout Style</Label>
                <Select
                  value={newCollection.display_type}
                  onValueChange={(value) => setNewCollection({...newCollection, display_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alphabetical">Topics Grid (A-Z)</SelectItem>
                    <SelectItem value="by_subject">Grouped by Subject</SelectItem>
                    <SelectItem value="grid">Simple Grid</SelectItem>
                    <SelectItem value="custom">Custom Layout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sort_field">Sort By</Label>
                <Select
                  value={newCollection.sort_field}
                  onValueChange={(value) => setNewCollection({...newCollection, sort_field: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="topic">Topic Name</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="created_at">Date Created</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCollection} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Page'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((collection: Collection) => (
          <Card key={collection.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    {collection.name}
                  </CardTitle>
                  <Badge variant="secondary" className="mt-1">
                    {collection.page_route}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleManageContent(collection)}
                    title="Manage Topics & Content"
                  >
                    <Target className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteCollection(collection.id)}
                    title="Delete Page"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                {collection.description}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Layout:</span>
                  <Badge variant="outline">{collection.display_type}</Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Sort:</span>
                  <span>{collection.sort_field} ({collection.sort_order})</span>
                </div>
                <div className="flex justify-center pt-2">
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => handleManageContent(collection)}
                    className="w-full"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    Add Topics & Content
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Management Dialog */}
      <Dialog open={isContentDialogOpen} onOpenChange={setIsContentDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Content for: {selectedCollection?.name}
            </DialogTitle>
          </DialogHeader>
          
          {/* Hierarchical Filtering Controls */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-3">Hierarchical Content Management</h3>
            <p className="text-sm text-blue-700 mb-4">
              <strong>Workflow:</strong> 1) Choose hierarchy level (1-4) → 2) Optionally filter by specific parent → 3) Add/manage items
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Level Selection */}
              <div>
                <Label>Hierarchy Level</Label>
                <Select value={selectedLevel?.toString() || '1'} onValueChange={(value) => {
                  setSelectedLevel(parseInt(value));
                  setSelectedParent('');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Level 1 - Main Topics</SelectItem>
                    <SelectItem value="2">Level 2 - Subtopics</SelectItem>
                    <SelectItem value="3">Level 3 - Sub-subtopics</SelectItem>
                    <SelectItem value="4">Level 4 - Content Items</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Parent Filter */}
              <div>
                <Label>Parent Filter</Label>
                <Select value={selectedParent || 'all'} onValueChange={setSelectedParent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by parent (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Show All at Level</SelectItem>
                    {getAvailableParents().map((parent: any) => (
                      <SelectItem key={parent.id} value={parent.id}>
                        {parent.topic || parent.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* View Mode */}
              <div>
                <Label>View Mode</Label>
                <Select value={viewMode} onValueChange={setViewMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="collection">Collection Management</SelectItem>
                    <SelectItem value="hierarchy">Hierarchy View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Hierarchy Display when in hierarchy view mode */}
          {viewMode === 'hierarchy' && (
            <div className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Content Hierarchy (Level {selectedLevel})</span>
                    <div className="flex gap-2">
                      {selectedCollection && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          Collection: {selectedCollection.name}
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        {getHierarchyItems().length} items
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getHierarchyItems().length > 0 ? (
                    <div className="space-y-2">
                      {getHierarchyItems().map((item: any) => (
                        <div key={item.id} className="p-3 border rounded-lg bg-gray-50">
                          <div className="font-medium text-sm">
                            {item.topic || item.title || 'Untitled'}
                          </div>
                          {(item.short_summary || item.short_blurb) && (
                            <div className="text-xs text-gray-600 mt-1">
                              {item.short_summary || item.short_blurb}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Level {selectedLevel}
                            </Badge>
                            {item.parentid && (
                              <span>Parent: {getParentName(item.parentid)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No items found for Level {selectedLevel}
                      {selectedParent && selectedParent !== 'all' && (
                        <span> with the selected parent</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Collection Items with Drag & Drop */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                {viewMode === 'hierarchy' ? 'Collection Items (All Levels)' : 'Current Collection Items'}
              </h3>
              <p className="text-sm text-gray-600">
                Drag and drop to reorder items in the collection
              </p>
              
              {selectedCollectionContent.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={selectedCollectionContent.map((item: any) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 max-h-96 overflow-y-auto border rounded p-3">
                      {selectedCollectionContent.map((item: any) => (
                        <SortableTopicItem
                          key={item.id}
                          topic={item}
                          onRemove={handleRemoveItem}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="text-center py-8 text-gray-500 border rounded">
                  No items in this collection yet. Add topics or content from the right.
                </div>
              )}
            </div>

            {/* Unified Content Management System */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                Content Management System
                {viewMode === 'hierarchy' && (
                  <Badge variant="outline" className="ml-2">
                    Level {selectedLevel}
                  </Badge>
                )}
              </h3>
              
              {/* Search across all items */}
              <Input
                placeholder="Search topics and content..."
                value={topicSearchTerm}
                onChange={(e) => setTopicSearchTerm(e.target.value)}
                className="mb-4"
              />
              
              {/* Combined Items Display */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">
                    Available Items ({getAllFilteredItems().length} total)
                  </h4>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      Topics: {getFilteredTopics().length}
                    </Badge>
                    <Badge variant="outline">
                      Content: {getFilteredContent().length}
                    </Badge>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto border rounded p-3 space-y-2">
                  {getAllFilteredItems().map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={item.topic ? "default" : "secondary"} className="text-xs">
                            {item.topic ? "Topic" : "Content"}
                          </Badge>
                          {viewMode === 'hierarchy' && (
                            <Badge variant="outline" className="text-xs">
                              Level {item.topic ? (item.parentid ? 2 : 1) : 4}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm font-medium">
                          {item.topic || item.title || item.prompt || 'Untitled'}
                        </span>
                        {(item.short_summary || item.short_blurb) && (
                          <p className="text-xs text-gray-500 mt-1">
                            {(item.short_summary || item.short_blurb).slice(0, 80)}...
                          </p>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => item.topic ? handleAddTopic(item.id) : handleAddContent(item.id)}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                  
                  {getAllFilteredItems().length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No items found matching your search and filters
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsContentDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};