import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus } from 'lucide-react';
import { ActiveTab } from './types';

interface AdminControlsProps {
  activeTab: ActiveTab;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  studentFilter: 'all' | 'active' | 'inactive';
  setStudentFilter: (filter: 'all' | 'active' | 'inactive') => void;
  studentCounts: { total: number; active: number; inactive: number };
  selectedCollectionFilter: string;
  setSelectedCollectionFilter: (filter: string) => void;
  selectedYearFilter: string;
  setSelectedYearFilter: (filter: string) => void;
  collections: any[];
  onAddNew: () => void;
}

export const AdminControls: React.FC<AdminControlsProps> = ({
  activeTab,
  searchTerm,
  setSearchTerm,
  studentFilter,
  setStudentFilter,
  studentCounts,
  selectedCollectionFilter,
  setSelectedCollectionFilter,
  selectedYearFilter,
  setSelectedYearFilter,
  collections,
  onAddNew
}) => {
  const getTabDisplayName = () => {
    switch (activeTab) {
      case 'students': return 'Student';
      case 'topics': return 'Topic';
      case 'content': return 'Content';
      case 'assignments': return 'Assignment';
      case 'questions': return 'Question';
      case 'matching': return 'Matching';
      case 'collections': return 'Collection';
      default: return 'Item';
    }
  };

  return (
    <div className="mb-4">
      {/* Students Tab - Special layout with filter buttons */}
      {activeTab === 'students' && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-64 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={studentFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStudentFilter('all')}
              className="whitespace-nowrap"
            >
              All Students
              <Badge variant="secondary" className="ml-1">{studentCounts.total}</Badge>
            </Button>
            <Button
              variant={studentFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStudentFilter('active')}
              className="whitespace-nowrap"
            >
              Active
              <Badge variant="secondary" className="ml-1">{studentCounts.active}</Badge>
            </Button>
            <Button
              variant={studentFilter === 'inactive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStudentFilter('inactive')}
              className="whitespace-nowrap"
            >
              Inactive
              <Badge variant="secondary" className="ml-1">{studentCounts.inactive}</Badge>
            </Button>
          </div>
          <Button onClick={onAddNew} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add New Student
          </Button>
        </div>
      )}

      {/* Content Hierarchy Tab - Collection and Year filters */}
      {activeTab === 'content-hierarchy' && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-64 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search content hierarchy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Collection:</span>
            <Select value={selectedCollectionFilter} onValueChange={setSelectedCollectionFilter}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue placeholder="Select collection..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Content</SelectItem>
                {collections?.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Year:</span>
            <Select value={selectedYearFilter} onValueChange={setSelectedYearFilter}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue placeholder="Year..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Other tabs - Standard search + add button layout */}
      {!['students', 'content-hierarchy', 'team', 'debates', 'writing-submissions'].includes(activeTab) && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-64 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <Button onClick={onAddNew} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add New {getTabDisplayName()}
          </Button>
        </div>
      )}

      {/* Writing submissions - Search only */}
      {activeTab === 'writing-submissions' && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-64 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search writing submissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </div>
      )}
    </div>
  );
};