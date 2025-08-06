import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TreePine, Plus, Filter, ChevronRight, ChevronDown, Edit, Trash2, Target } from 'lucide-react';
import { Topic, Content, CmsFilterConfig } from '@shared/schema';

interface FilterRule {
  id: string;
  name: string;
  level: number;
  parent_level?: number;
  filter_type: 'parent_id' | 'column_value' | 'custom';
  column_name?: string;
  column_value?: string;
  filter_logic: 'equals' | 'contains' | 'in_array';
  is_active: boolean;
}

interface HierarchyNode {
  id: string;
  title: string;
  type: 'topic' | 'content';
  level: number;
  parentId?: string;
  subject?: string;
  tags?: string[];
  children: HierarchyNode[];
  display_order: number;
}

export const HierarchicalCMS: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [selectedParent, setSelectedParent] = useState<string>('');
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [newItemData, setNewItemData] = useState<any>({});
  const [newFilterData, setNewFilterData] = useState<Partial<FilterRule>>({});

  const queryClient = useQueryClient();

  // Fetch all data
  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: ['/api/topics'],
  });

  const { data: content = [] } = useQuery<Content[]>({
    queryKey: ['/api/content'],
  });

  // Fetch collections
  const { data: collections = [] } = useQuery<Array<{id: string; name: string}>>({
    queryKey: ['/api/collections'],
  });

  // Fetch collection content when a specific collection is selected
  const { data: collectionContent = [] } = useQuery<Array<{id: string; type: string; display_order: number}>>({
    queryKey: ['/api/collections', selectedCollection, 'content'],
    enabled: Boolean(selectedCollection && selectedCollection !== 'all' && selectedCollection !== ''),
  });

  // Temporarily disable filter config API call since table doesn't exist
  // const { data: filterConfigs = [] } = useQuery<CmsFilterConfig[]>({
  //   queryKey: ['/api/cms-filter-config'],
  // });

  // Mutations for CRUD operations
  const createTopic = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create topic');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/topics'] });
      setShowAddDialog(false);
      setNewItemData({});
    },
  });

  const createContent = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create content');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      setShowAddDialog(false);
      setNewItemData({});
    },
  });

  const createFilterRule = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/cms-filter-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create filter rule');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cms-filter-config'] });
      setShowFilterDialog(false);
      setNewFilterData({});
    },
  });

  // Build hierarchical structure
  const buildHierarchy = useMemo((): HierarchyNode[] => {
    // Apply collection filtering if a specific collection is selected
    let filteredTopics = topics;
    let filteredContent = content;

    if (selectedCollection && selectedCollection !== 'all' && selectedCollection !== '') {
      // Filter based on collection content - collections now manage the hierarchical structure
      const collectionItemIds = collectionContent.map((item: any) => item.id);
      
      // Filter topics and content based on collection membership
      filteredTopics = topics.filter(topic => collectionItemIds.includes(topic.id));
      filteredContent = content.filter(item => 
        collectionItemIds.includes(item.id) || 
        collectionItemIds.includes(item.topicid) || 
        filteredTopics.some(topic => topic.id === item.topicid)
      );
    }

    // Create hierarchical structure with proper levels and collection-based ordering
    const allItems: HierarchyNode[] = [
      ...filteredTopics.map(topic => {
        // Get display order from collection if available
        const collectionItem = collectionContent.find((item: any) => item.id === topic.id);
        return {
          id: topic.id,
          title: topic.topic || 'Untitled Topic',
          type: 'topic' as const,
          level: topic.parentid ? 2 : 1,
          parentId: topic.parentid || undefined,
          subject: topic.challengesubject || undefined,
          tags: [],
          children: [],
          display_order: collectionItem?.display_order || 0,
        };
      }),
      ...filteredContent.map(item => {
        const collectionItem = collectionContent.find((col: any) => col.id === item.id);
        return {
          id: item.id,
          title: item.title || 'Untitled Content',
          type: 'content' as const,
          level: 4,
          parentId: item.parentid || item.topicid,
          subject: item.challengesubject?.[0] || undefined,
          tags: [],
          children: [],
          display_order: collectionItem?.display_order || 0,
        };
      }),
    ];

    // When in collection mode, show the full hierarchy instead of level filtering
    if (selectedCollection && selectedCollection !== 'all' && selectedCollection !== '') {
      // Build complete hierarchy for the collection
      const buildTree = (parentId?: string): HierarchyNode[] => {
        return allItems
          .filter(item => item.parentId === parentId)
          .sort((a, b) => a.display_order - b.display_order || a.title.localeCompare(b.title))
          .map(item => ({
            ...item,
            children: buildTree(item.id),
          }));
      };
      return buildTree();
    } else {
      // Standard level-based filtering
      let filteredItems = allItems;

      if (selectedParent && selectedParent !== 'all') {
        filteredItems = allItems.filter(item => item.parentId === selectedParent);
      } else {
        filteredItems = allItems.filter(item => !item.parentId && item.level === selectedLevel);
      }

      const buildTree = (parentId?: string): HierarchyNode[] => {
        return filteredItems
          .filter(item => item.parentId === parentId)
          .sort((a, b) => a.display_order - b.display_order || a.title.localeCompare(b.title))
          .map(item => ({
            ...item,
            children: buildTree(item.id),
          }));
      };

      return buildTree();
    }
  }, [topics, content, selectedLevel, selectedParent, selectedCollection, collectionContent]);

  // Get available parents for current level
  const availableParents = useMemo(() => {
    if (selectedLevel === 1) return [];
    
    const parentLevel = selectedLevel - 1;
    return [
      ...topics.filter(topic => (topic.parentid ? 2 : 1) === parentLevel),
      ...content.filter(item => 4 === parentLevel),
    ];
  }, [topics, content, selectedLevel]);

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderNode = (node: HierarchyNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="space-y-1">
        <div 
          className={`flex items-center gap-2 p-2 rounded border hover:bg-gray-50 ${
            depth > 0 ? 'ml-' + (depth * 4) : ''
          }`}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleNode(node.id)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          ) : (
            <div className="w-6" />
          )}
          
          <div className="flex items-center gap-2">
            {node.type === 'topic' ? (
              <TreePine className="h-4 w-4 text-blue-500" />
            ) : (
              <Target className="h-4 w-4 text-green-500" />
            )}
            
            <span className="font-medium">{node.title}</span>
            
            <Badge variant="outline" className="text-xs">
              Level {node.level}
            </Badge>
            
            {node.subject && (
              <Badge variant="secondary" className="text-xs">
                {node.subject}
              </Badge>
            )}
            {/* Show collection membership if in collection filter mode */}
            {selectedCollection && selectedCollection !== 'all' && selectedCollection !== '' && collectionContent.some((item: any) => item.id === node.id) && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600">
                In Collection
              </Badge>
            )}
          </div>
          
          <div className="ml-auto flex gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="space-y-1">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TreePine className="h-5 w-5" />
            Hierarchical Content Management System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Level Selection */}
            <div>
              <Label>Content Level</Label>
              <Select value={selectedLevel.toString()} onValueChange={(value) => setSelectedLevel(parseInt(value))}>
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

            {/* Parent Selection */}
            <div>
              <Label>Filter by Parent</Label>
              <Select value={selectedParent} onValueChange={setSelectedParent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  {availableParents.map((parent: any) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.topic || parent.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Collection Filter */}
            <div>
              <Label>Filter by Collection</Label>
              <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select collection (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Collections</SelectItem>
                  {collections.map((collection: any) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Item (Level {selectedLevel})</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Type</Label>
                      <Select value={newItemData.type || 'topic'} onValueChange={(value) => setNewItemData({...newItemData, type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="topic">Topic</SelectItem>
                          <SelectItem value="content">Content</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={newItemData.title || ''}
                        onChange={(e) => setNewItemData({...newItemData, title: e.target.value})}
                        placeholder="Enter title"
                      />
                    </div>

                    <div>
                      <Label>Subject (for filtering)</Label>
                      <Input
                        value={newItemData.subject || ''}
                        onChange={(e) => setNewItemData({...newItemData, subject: e.target.value})}
                        placeholder="e.g., Art, Science, History"
                      />
                    </div>

                    <div>
                      <Label>Collection (optional)</Label>
                      <Select value={newItemData.collectionId || 'none'} onValueChange={(value) => setNewItemData({...newItemData, collectionId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select collection (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Collection</SelectItem>
                          {collections.map((collection: any) => (
                            <SelectItem key={collection.id} value={collection.id}>
                              {collection.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Parent</Label>
                      <Select value={newItemData.parentId || ''} onValueChange={(value) => setNewItemData({...newItemData, parentId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Parent</SelectItem>
                          {availableParents.map((parent: any) => (
                            <SelectItem key={parent.id} value={parent.id}>
                              {parent.topic || parent.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={async () => {
                          const data = {
                            ...newItemData,
                            level: selectedLevel,
                            display_order: 0,
                          };
                          
                          try {
                            let newItem;
                            if (newItemData.type === 'topic') {
                              const topicData = {
                                topic: data.title,
                                parentid: data.parentId === 'none' ? null : data.parentId,
                                subject: data.subject,
                                level: data.level,
                                display_order: data.display_order,
                                showstudent: true,
                              };
                              createTopic.mutate(topicData);
                            } else {
                              const contentData = {
                                title: data.title,
                                topicid: data.parentId === 'none' ? '' : data.parentId || '',
                                parentid: data.parentId === 'none' ? null : data.parentId,
                                subject: data.subject,
                                level: data.level,
                                display_order: data.display_order,
                              };
                              createContent.mutate(contentData);
                            }

                            // If a collection is selected, add the item to the collection
                            if (data.collectionId && data.collectionId !== 'none') {
                              // We'll implement collection addition after the item is created
                              console.log('Adding item to collection:', data.collectionId);
                            }
                          } catch (error) {
                            console.error('Error creating item:', error);
                          }
                        }}
                        disabled={createTopic.isPending || createContent.isPending}
                      >
                        Create
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Configure Filtering Rules</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Rule Name</Label>
                      <Input
                        value={newFilterData.name || ''}
                        onChange={(e) => setNewFilterData({...newFilterData, name: e.target.value})}
                        placeholder="Enter rule name"
                      />
                    </div>

                    <div>
                      <Label>Filter Type</Label>
                      <Select value={newFilterData.filter_type || 'parent_id'} onValueChange={(value: any) => setNewFilterData({...newFilterData, filter_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parent_id">Parent ID Match</SelectItem>
                          <SelectItem value="column_value">Column Value Match</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {newFilterData.filter_type === 'column_value' && (
                      <>
                        <div>
                          <Label>Column Name</Label>
                          <Select value={newFilterData.column_name || ''} onValueChange={(value) => setNewFilterData({...newFilterData, column_name: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="subject">Subject</SelectItem>
                              <SelectItem value="tags">Tags</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Column Value</Label>
                          <Input
                            value={newFilterData.column_value || ''}
                            onChange={(e) => setNewFilterData({...newFilterData, column_value: e.target.value})}
                            placeholder="Enter value to match"
                          />
                        </div>
                      </>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          createFilterRule.mutate({
                            ...newFilterData,
                            level: selectedLevel,
                            filter_logic: 'equals',
                            is_active: true,
                          });
                        }}
                        disabled={createFilterRule.isPending}
                      >
                        Create Rule
                      </Button>
                      <Button variant="outline" onClick={() => setShowFilterDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hierarchy Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Content Hierarchy (Level {selectedLevel})</span>
            <div className="flex gap-2">
              {selectedCollection && selectedCollection !== 'all' && selectedCollection !== '' && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Collection: {collections.find((c: any) => c.id === selectedCollection)?.name}
                </Badge>
              )}
              <Badge variant="secondary">
                {buildHierarchy.length} items
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {buildHierarchy.length > 0 ? (
            <div className="space-y-2">
              {buildHierarchy.map(node => renderNode(node))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No items found for Level {selectedLevel}
              {selectedParent && (
                <span> with the selected parent</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Rules Display - Temporarily disabled */}
      {/* Filter rules system will be implemented later when database schema is ready */}
    </div>
  );
};