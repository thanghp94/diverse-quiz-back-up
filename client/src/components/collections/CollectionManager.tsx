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
import { Plus, Edit, Trash2, ExternalLink, Settings, BookOpen, Users, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

export const CollectionManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isContentDialogOpen, setIsContentDialogOpen] = useState(false);
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    page_route: '',
    display_type: 'alphabetical',
    filter_criteria: '{}',
    sort_field: 'topic',
    sort_order: 'asc'
  });

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
    setIsContentDialogOpen(true);
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Content for: {selectedCollection?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Select topics and content items to display on this page using the Topics page layout.
            </p>
            
            {/* Topics Section */}
            <div>
              <h3 className="font-semibold mb-2">Available Topics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-3">
                {topics.slice(0, 10).map((topic: any) => (
                  <div key={topic.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                    <span className="text-sm">{topic.topic}</span>
                    <Button size="sm" variant="outline">Add</Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Section */}
            <div>
              <h3 className="font-semibold mb-2">Available Content</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-3">
                {content.slice(0, 10).map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                    <span className="text-sm">{item.title || item.prompt || 'Untitled'}</span>
                    <Button size="sm" variant="outline">Add</Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsContentDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};