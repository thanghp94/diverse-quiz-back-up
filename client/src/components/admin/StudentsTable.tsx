import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Edit, Save, X, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { User } from './types';
import { getFilteredStudents, formatMedalResults, renderMedalIcon, formatCategoryName } from './utils';

interface StudentsTableProps {
  students: User[] | undefined;
  studentFilter: 'all' | 'active' | 'inactive';
  searchTerm: string;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editData: any;
  setEditData: (data: any) => void;
  expandedMedalRows: Set<string>;
  setExpandedMedalRows: (rows: Set<string>) => void;
  onAddMedalResult: (student: User) => void;
}

const renderMedalIcon = (medalType: string) => {
  switch (medalType.charAt(0).toUpperCase()) {
    case 'G':
      return <div className="w-4 h-4 bg-yellow-500 rounded-full" title="Gold" />;
    case 'S':
      return <div className="w-4 h-4 bg-gray-400 rounded-full" title="Silver" />;
    case 'T':
      return <div className="w-4 h-4 bg-blue-500 rounded-full" title="Trophy" />;
    default:
      return null;
  }
};

export const StudentsTable: React.FC<StudentsTableProps> = ({
  students,
  studentFilter,
  searchTerm,
  editingId,
  setEditingId,
  editData,
  setEditData,
  expandedMedalRows,
  setExpandedMedalRows,
  onAddMedalResult
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateUser = useMutation({
    mutationFn: async (userData: User) => {
      const response = await fetch(`/api/users/${userData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setEditingId(null);
      toast({ title: "Success", description: "User updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" });
    }
  });

  const toggleUserStatus = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}/toggle-status`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to toggle user status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ title: "Success", description: "User status updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user status", variant: "destructive" });
    }
  });

  const handleEdit = (student: User) => {
    setEditingId(student.id);
    setEditData(student);
  };

  const handleSave = () => {
    updateUser.mutate(editData);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const toggleMedalResults = (studentId: string) => {
    const newExpanded = new Set(Array.from(expandedMedalRows));
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedMedalRows(newExpanded);
  };

  const filteredStudents = getFilteredStudents(students, studentFilter, searchTerm);

  const MedalResultsExpanded = ({ student }: { student: User }) => {
    const medalResults = formatMedalResults(student.medal_results_jsonb);
    
    if (!medalResults || medalResults.length === 0) {
      return (
        <div className="ml-8 mt-2 p-3 bg-gray-50 rounded border text-sm text-gray-500">
          No medal results recorded
        </div>
      );
    }

    return (
      <div className="ml-8 mt-2 space-y-3">
        {medalResults.map((group: any, groupIndex: number) => (
          <div key={groupIndex} className="bg-gray-50 rounded border p-3">
            <div className="font-semibold text-sm text-gray-700 mb-2">
              {group.year} - {group.division}
            </div>
            <div className="space-y-2">
              {group.results.map((result: any, resultIndex: number) => (
                <div key={resultIndex} className="text-xs">
                  <div className="font-medium text-gray-600 mb-1">
                    {result.round} (Team: {result.teamNumber})
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {Object.entries(result.categories || {}).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-center gap-2">
                        {renderMedalIcon(value)}
                        <span className="text-xs">{formatCategoryName(key)}: {value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b">
          <th className="text-left p-1">ID</th>
          <th className="text-left p-1">Full Name</th>
          <th className="text-left p-1">Meraki Email</th>
          <th className="text-left p-1">Category</th>
          <th className="text-left p-1">Status</th>
          <th className="text-left p-1">Medal Results</th>
          <th className="text-left p-1">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredStudents.map((student) => (
          <React.Fragment key={student.id}>
            <tr className="border-b hover:bg-gray-50">
              <td className="p-1 font-mono text-sm">{student.id}</td>
              <td className="p-1">
                {editingId === student.id ? (
                  <input
                    type="text"
                    value={editData.full_name || ''}
                    onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                    className="w-full p-1 border rounded"
                  />
                ) : (
                  student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim()
                )}
              </td>
              <td className="p-1 text-sm">
                {editingId === student.id ? (
                  <input
                    type="text"
                    value={editData.meraki_email || ''}
                    onChange={(e) => setEditData({ ...editData, meraki_email: e.target.value })}
                    className="w-full p-1 border rounded"
                  />
                ) : (
                  student.meraki_email
                )}
              </td>
              <td className="p-1">
                {editingId === student.id ? (
                  <input
                    type="text"
                    value={editData.category || ''}
                    onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                    className="w-full p-1 border rounded"
                  />
                ) : (
                  <Badge variant="outline" className="text-xs">
                    {student.category || 'N/A'}
                  </Badge>
                )}
              </td>
              <td className="p-1">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={student.show !== false && student.show !== 'false'}
                    onCheckedChange={() => toggleUserStatus.mutate(student.id)}
                    disabled={toggleUserStatus.isPending}
                  />
                  <Badge 
                    variant={student.show !== false && student.show !== 'false' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {student.show !== false && student.show !== 'false' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </td>
              <td className="p-1">
                <div className="flex items-center gap-2">
                  {student.medal_results_jsonb && Array.isArray(student.medal_results_jsonb) && student.medal_results_jsonb.length > 0 ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleMedalResults(student.id)}
                        className="h-6 w-6 p-0"
                      >
                        {expandedMedalRows.has(student.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <Badge variant="secondary" className="text-xs">
                        {student.medal_results_jsonb.length} results
                      </Badge>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400">No results</span>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddMedalResult(student)}
                    className="h-6 text-xs px-2"
                  >
                    <Trophy className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              </td>
              <td className="p-1">
                {editingId === student.id ? (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={updateUser.isPending}
                      className="h-6 w-6 p-0"
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancel}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(student)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
              </td>
            </tr>
            {expandedMedalRows.has(student.id) && (
              <tr>
                <td colSpan={7}>
                  <MedalResultsExpanded student={student} />
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
};