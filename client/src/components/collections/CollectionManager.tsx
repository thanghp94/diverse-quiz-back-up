import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Settings, Eye } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Collection {
  id: string;
  name: string;
  description?: string;
  page_route: string;
  display_type: string;
  filter_criteria?: any;
  sort_order: string;
  sort_field: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

interface CollectionFormData {
  name: string;
  description: string;
  page_route: string;
  display_type: string;
  filter_criteria: string;
  sort_order: string;
  sort_field: string;
}

export function CollectionManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [formData, setFormData] = useState<CollectionFormData>({
    name: '',
    description: '',
    page_route: '',
    display_type: 'alphabetical',
    filter_criteria: '{}',
    sort_order: 'asc',
    sort_field: 'title'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['/api/collections'],
    queryFn: () => apiRequest('/api/collections')
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: "Collection created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create collection", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/collections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      setIsEditOpen(false);
      setEditingCollection(null);
      resetForm();
      toast({ title: "Collection updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update collection", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/collections/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      toast({ title: "Collection deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete collection", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      page_route: '',
      display_type: 'alphabetical',
      filter_criteria: '{}',
      sort_order: 'asc',
      sort_field: 'title'
    });
  };

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description || '',
      page_route: collection.page_route,
      display_type: collection.display_type,
      filter_criteria: JSON.stringify(collection.filter_criteria || {}, null, 2),
      sort_order: collection.sort_order,
      sort_field: collection.sort_field
    });
    setIsEditOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let parsedCriteria;
    try {
      parsedCriteria = JSON.parse(formData.filter_criteria || '{}');
    } catch (error) {
      toast({ title: "Invalid JSON in filter criteria", variant: "destructive" });
      return;
    }

    const submitData = {
      ...formData,
      filter_criteria: parsedCriteria
    };

    if (editingCollection) {
      updateMutation.mutate({ id: editingCollection.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this collection?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading collections...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Collection Manager</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Collection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Collection</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="page_route">Page Route</Label>
                  <Input
                    id="page_route"
                    value={formData.page_route}
                    onChange={(e) => setFormData({...formData, page_route: e.target.value})}
                    placeholder="/topics"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="display_type">Display Type</Label>
                  <Select value={formData.display_type} onValueChange={(value) => setFormData({...formData, display_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alphabetical">Alphabetical</SelectItem>
                      <SelectItem value="by_subject">By Subject</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="grid">Grid</SelectItem>
                      <SelectItem value="list">List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Select value={formData.sort_order} onValueChange={(value) => setFormData({...formData, sort_order: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sort_field">Sort Field</Label>
                  <Select value={formData.sort_field} onValueChange={(value) => setFormData({...formData, sort_field: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="topic">Topic</SelectItem>
                      <SelectItem value="order">Order</SelectItem>
                      <SelectItem value="created_at">Created Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="filter_criteria">Filter Criteria (JSON)</Label>
                <Textarea
                  id="filter_criteria"
                  value={formData.filter_criteria}
                  onChange={(e) => setFormData({...formData, filter_criteria: e.target.value})}
                  placeholder='{"showstudent": true, "challengesubject": "Math"}'
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((collection: Collection) => (
          <Card key={collection.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{collection.name}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(collection)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(collection.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {collection.description && (
                <p className="text-sm text-muted-foreground">{collection.description}</p>
              )}
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Route:</span>
                  <Badge variant="outline">{collection.page_route}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Type:</span>
                  <Badge>{collection.display_type}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Sort:</span>
                  <span className="text-sm">{collection.sort_field} ({collection.sort_order})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={collection.is_active ? "default" : "secondary"}>
                    {collection.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-page_route">Page Route</Label>
                <Input
                  id="edit-page_route"
                  value={formData.page_route}
                  onChange={(e) => setFormData({...formData, page_route: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-display_type">Display Type</Label>
                <Select value={formData.display_type} onValueChange={(value) => setFormData({...formData, display_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                    <SelectItem value="by_subject">By Subject</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-sort_order">Sort Order</Label>
                <Select value={formData.sort_order} onValueChange={(value) => setFormData({...formData, sort_order: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-sort_field">Sort Field</Label>
                <Select value={formData.sort_field} onValueChange={(value) => setFormData({...formData, sort_field: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="topic">Topic</SelectItem>
                    <SelectItem value="order">Order</SelectItem>
                    <SelectItem value="created_at">Created Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-filter_criteria">Filter Criteria (JSON)</Label>
              <Textarea
                id="edit-filter_criteria"
                value={formData.filter_criteria}
                onChange={(e) => setFormData({...formData, filter_criteria: e.target.value})}
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}