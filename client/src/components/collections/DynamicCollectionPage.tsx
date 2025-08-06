import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Book, Users, Clock, Target, GripVertical } from "lucide-react";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
// Import removed - will implement basic card components instead

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
}

interface DynamicCollectionPageProps {
  route: string;
}

export function DynamicCollectionPage({ route }: DynamicCollectionPageProps) {
  const [items, setItems] = useState<any[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Get collection configuration by route
  const { data: collection, isLoading: collectionLoading } = useQuery({
    queryKey: ['/api/collections/route', route],
    queryFn: () => apiRequest(`/api/collections/route/${route.replace('/', '')}`),
    enabled: !!route
  });

  // Get collection content based on configuration
  const { data: collectionContent = [], isLoading: contentLoading } = useQuery({
    queryKey: ['/api/collections', collection?.id, 'filtered-content'],
    queryFn: () => apiRequest(`/api/collections/${collection?.id}/filtered-content`),
    enabled: !!collection?.id
  });

  useEffect(() => {
    if (collectionContent) {
      setItems(collectionContent);
    }
  }, [collectionContent]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(item => item.id === active.id);
    const newIndex = items.findIndex(item => item.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Update display order in collection
      const reorderData = newItems.map((item, index) => ({
        id: item.mapping_id,
        position: index + 1
      }));

      // Call reorder API if this is a custom collection
      if (collection?.display_type === 'custom') {
        apiRequest(`/api/collections/${collection.id}/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: reorderData })
        }).catch(console.error);
      }
    }
  };

  if (collectionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading collection...</span>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Collection Not Found</h2>
        <p className="text-muted-foreground">
          No collection is configured for route: {route}
        </p>
      </div>
    );
  }

  if (contentLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading content...</span>
      </div>
    );
  }

  const renderBySubject = () => {
    const subjectGroups = items.filter(item => item.type === 'subject_group');
    
    return (
      <div className="space-y-8">
        {subjectGroups.map((group) => (
          <div key={group.subject} className="space-y-4">
            <h3 className="text-xl font-semibold border-b pb-2">
              {group.subject}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map((item: any) => (
                <TopicCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAlphabetical = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <TopicCard key={item.id} item={item} />
        ))}
      </div>
    );
  };

  const renderCustom = () => {
    return (
      <div className="space-y-4">
        {items.map((item) => (
          <TopicCard key={item.id} item={item} />
        ))}
      </div>
    );
  };

  const renderGrid = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <CompactCard key={item.id} item={item} />
        ))}
      </div>
    );
  };

  const renderList = () => {
    return (
      <div className="space-y-2">
        {items.map((item) => (
          <ListItem key={item.id} item={item} />
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (collection.display_type) {
      case 'by_subject':
        return renderBySubject();
      case 'custom':
        return renderCustom();
      case 'grid':
        return renderGrid();
      case 'list':
        return renderList();
      case 'alphabetical':
      default:
        return renderAlphabetical();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{collection.name}</h1>
        {collection.description && (
          <p className="text-muted-foreground">{collection.description}</p>
        )}
        <div className="flex gap-2">
          <Badge variant="outline">{collection.display_type}</Badge>
          <Badge variant="outline">{collection.sort_field} ({collection.sort_order})</Badge>
          <Badge variant="secondary">{items.length} items</Badge>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No content found for this collection.</p>
        </div>
      ) : (
        renderContent()
      )}
    </div>
  );
}

// Component for topic cards
function TopicCard({ item }: { item: any }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg line-clamp-2">{item.topic || item.title}</CardTitle>
        {item.challengesubject && (
          <Badge variant="outline" className="w-fit">
            {item.challengesubject}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {item.short_summary && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {item.short_summary}
          </p>
        )}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Book className="h-3 w-3" />
            {item.type}
          </span>
          {item.showstudent !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {item.showstudent ? 'Public' : 'Private'}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Component for compact grid cards
function CompactCard({ item }: { item: any }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <h3 className="font-medium line-clamp-2 mb-2">{item.topic || item.title}</h3>
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {item.type}
          </Badge>
          {item.is_featured && (
            <Badge variant="default" className="text-xs">
              Featured
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Component for list items
function ListItem({ item }: { item: any }) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <Book className="h-4 w-4 text-muted-foreground" />
        <div>
          <h4 className="font-medium">{item.topic || item.title}</h4>
          {item.challengesubject && (
            <p className="text-sm text-muted-foreground">{item.challengesubject}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {item.type}
        </Badge>
        {item.is_featured && (
          <Badge variant="default" className="text-xs">
            Featured
          </Badge>
        )}
      </div>
    </div>
  );
}