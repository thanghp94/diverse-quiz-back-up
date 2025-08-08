import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Edit, Save, X } from 'lucide-react';

interface Content {
  id: string;
  title: string;
  summary?: string;
  topicid: string;
  type?: string;
  difficulty?: string;
  showstudent?: boolean;
}

interface ContentTableProps {
  content: Content[] | undefined;
  searchTerm: string;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editData: any;
  setEditData: (data: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const ContentTable: React.FC<ContentTableProps> = ({
  content,
  searchTerm,
  editingId,
  setEditingId,
  editData,
  setEditData,
  onSave,
  onCancel
}) => {

  const handleEdit = (contentItem: Content) => {
    setEditingId(contentItem.id);
    setEditData(contentItem);
  };

  const filteredContent = content?.filter(item =>
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b">
          <th className="text-left p-2">ID</th>
          <th className="text-left p-2">Title</th>
          <th className="text-left p-2">Summary</th>
          <th className="text-left p-2">Topic</th>
          <th className="text-left p-2">Type</th>
          <th className="text-left p-2">Difficulty</th>
          <th className="text-left p-2">Visible</th>
          <th className="text-left p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredContent.map((item) => (
          <tr key={item.id} className="border-b hover:bg-gray-50">
            <td className="p-2 font-mono text-sm">{item.id}</td>
            <td className="p-2">
              {editingId === item.id ? (
                <Input
                  value={editData.title || ''}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="w-full"
                />
              ) : (
                <span className="font-medium">{item.title}</span>
              )}
            </td>
            <td className="p-2">
              {editingId === item.id ? (
                <Input
                  value={editData.summary || ''}
                  onChange={(e) => setEditData({ ...editData, summary: e.target.value })}
                  className="w-full"
                />
              ) : (
                <span className="text-sm text-gray-600">{item.summary}</span>
              )}
            </td>
            <td className="p-2">
              <Badge variant="outline" className="text-xs">{item.topicid}</Badge>
            </td>
            <td className="p-2">
              <Badge variant="secondary" className="text-xs">{item.type}</Badge>
            </td>
            <td className="p-2">
              <Badge variant="outline" className="text-xs">{item.difficulty}</Badge>
            </td>
            <td className="p-2">
              <Badge variant={item.showstudent ? 'default' : 'secondary'}>
                {item.showstudent ? 'Yes' : 'No'}
              </Badge>
            </td>
            <td className="p-2">
              {editingId === item.id ? (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={onSave}
                    className="h-8 w-8 p-0"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onCancel}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(item)}
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