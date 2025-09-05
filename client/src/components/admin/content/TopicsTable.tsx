import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Edit, Save, X } from 'lucide-react';

interface Topic {
  id: string;
  title: string;
  description?: string;
  showstudent?: boolean;
  parentid?: string;
  level?: number;
}

interface TopicsTableProps {
  topics: Topic[] | undefined;
  searchTerm: string;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editData: any;
  setEditData: (data: any) => void;
}

export const TopicsTable: React.FC<TopicsTableProps> = ({
  topics,
  searchTerm,
  editingId,
  setEditingId,
  editData,
  setEditData
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateTopic = useMutation({
    mutationFn: async (topicData: Topic) => {
      const response = await fetch(`/api/topics/${topicData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topicData),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to update topic');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/topics'] });
      setEditingId(null);
      toast({ title: "Success", description: "Topic updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update topic", variant: "destructive" });
    }
  });

  const handleEdit = (topic: Topic) => {
    setEditingId(topic.id);
    setEditData(topic);
  };

  const handleSave = () => {
    updateTopic.mutate(editData);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const filteredTopics = topics?.filter(topic =>
    topic.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.id?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b">
          <th className="text-left p-2">ID</th>
          <th className="text-left p-2">Title</th>
          <th className="text-left p-2">Description</th>
          <th className="text-left p-2">Level</th>
          <th className="text-left p-2">Visible to Students</th>
          <th className="text-left p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredTopics.map((topic) => (
          <tr key={topic.id} className="border-b hover:bg-gray-50">
            <td className="p-2 font-mono text-sm">{topic.id}</td>
            <td className="p-2">
              {editingId === topic.id ? (
                <Input
                  value={editData.topic || ''}
                  onChange={(e) => setEditData({ ...editData, topic: e.target.value })}
                  className="w-full"
                />
              ) : (
                <span className="font-medium">{topic.topic}</span>
              )}
            </td>
            <td className="p-2">
              {editingId === topic.id ? (
                <Input
                  value={editData.short_summary || ''}
                  onChange={(e) => setEditData({ ...editData, short_summary: e.target.value })}
                  className="w-full"
                />
              ) : (
                <span className="text-sm text-gray-600">{topic.short_summary}</span>
              )}
            </td>
            <td className="p-2">
              <Badge variant="outline">Level {topic.level || 1}</Badge>
            </td>
            <td className="p-2">
              <Badge variant={topic.showstudent ? 'default' : 'secondary'}>
                {topic.showstudent ? 'Visible' : 'Hidden'}
              </Badge>
            </td>
            <td className="p-2">
              {editingId === topic.id ? (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateTopic.isPending}
                    className="h-8 w-8 p-0"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(topic)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};