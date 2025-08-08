import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Edit, Save, X } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  render?: (value: any, item: any) => React.ReactNode;
  editable?: boolean;
  type?: 'text' | 'badge' | 'boolean';_
}

interface GenericTableProps {
  data: any[] | undefined;
  columns: Column[];
  searchTerm: string;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editData: any;
  setEditData: (data: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const GenericTable: React.FC<GenericTableProps> = ({
  data,
  columns,
  searchTerm,
  editingId,
  setEditingId,
  editData,
  setEditData,
  onSave,
  onCancel
}) => {
  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setEditData(item);
  };

  const filteredData = data?.filter(item =>
    Object.values(item).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  const renderCell = (column: Column, item: any) => {
    const value = item[column.key];
    
    if (editingId === item.id && column.editable) {
      return (
        <Input
          value={editData[column.key] || ''}
          onChange={(e) => setEditData({ ...editData, [column.key]: e.target.value })}
          className="w-full"
        />
      );
    }

    if (column.render) {
      return column.render(value, item);
    }

    switch (column.type) {
      case 'badge':
        return <Badge variant="outline" className="text-xs">{value}</Badge>;
      case 'boolean':
        return <Badge variant={value ? 'default' : 'secondary'}>{value ? 'Yes' : 'No'}</Badge>;
      default:
        return <span>{value}</span>;
    }
  };

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b">
          {columns.map((column) => (
            <th key={column.key} className="text-left p-2">{column.label}</th>
          ))}
          <th className="text-left p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredData.map((item) => (
          <tr key={item.id} className="border-b hover:bg-gray-50">
            {columns.map((column) => (
              <td key={column.key} className="p-2">
                {renderCell(column, item)}
              </td>
            ))}
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