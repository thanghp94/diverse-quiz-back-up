import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { User } from './types';
import { formatMedalResults, formatCategoryName } from './utils';

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

interface MedalManagementProps {
  showMedalDialog: boolean;
  setShowMedalDialog: (show: boolean) => void;
  selectedStudent: User | null;
  setSelectedStudent: (student: User | null) => void;
  medalData: any;
  setMedalData: (data: any) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  expandedMedalRows: Set<string>;
  setExpandedMedalRows: (rows: Set<string>) => void;
}

export const MedalManagement: React.FC<MedalManagementProps> = ({
  showMedalDialog,
  setShowMedalDialog,
  selectedStudent,
  setSelectedStudent,
  medalData,
  setMedalData,
  selectedCategories,
  setSelectedCategories,
  expandedMedalRows,
  setExpandedMedalRows
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMedalResult = useMutation({
    mutationFn: async ({ userId, medalData }: { userId: string; medalData: any }) => {
      const response = await fetch(`/api/users/${userId}/medal-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medalData),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to update medal result');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setShowMedalDialog(false);
      setSelectedStudent(null);
      setMedalData({});
      setSelectedCategories([]);
      toast({ title: "Success", description: "Medal result added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add medal result", variant: "destructive" });
    }
  });

  const handleSaveMedalResult = () => {
    if (!selectedStudent) return;
    
    if (!medalData.year || !medalData.division || !medalData.round || !medalData.teamNumber) {
      toast({ 
        title: "Error", 
        description: "Please fill in all required fields (Year, Division, Round, Team Number)", 
        variant: "destructive" 
      });
      return;
    }
    
    // Filter out categories with no medal type
    const filteredCategories: { [key: string]: any } = {};
    if (medalData.categories) {
      Object.keys(medalData.categories).forEach(categoryKey => {
        const category = medalData.categories[categoryKey];
        if (category.type && category.type !== 'none' && category.type !== '') {
          filteredCategories[categoryKey] = category;
        }
      });
    }
    
    const finalMedalData = {
      ...medalData,
      categories: filteredCategories
    };
    
    updateMedalResult.mutate({ userId: selectedStudent.id, medalData: finalMedalData });
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

  const MedalResultsExpanded = ({ student }: { student: User }) => {
    const medalResults = formatMedalResults(student.medal_results_jsonb);
    
    if (!medalResults || medalResults.length === 0) {
      return null;
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
    <>
      {/* Medal Toggle Button Component for use in tables */}
      <div className="medal-toggle-button">
        {/* This component can be used in parent components */}
      </div>

      {/* Medal Dialog */}
      <Dialog open={showMedalDialog} onOpenChange={setShowMedalDialog}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto w-full h-full">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                Add Medal Result for {selectedStudent?.full_name || selectedStudent?.id}
              </DialogTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowMedalDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveMedalResult}
                  disabled={updateMedalResult.isPending || selectedCategories.length === 0}
                >
                  {updateMedalResult.isPending ? 'Saving...' : 'Save Medal Result'}
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-3">
            {/* Basic Information */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="year">Year</Label>
                <Select
                  value={medalData.year || ''}
                  onValueChange={(value) => setMedalData({...medalData, year: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="division">Division</Label>
                <Select
                  value={medalData.division || ''}
                  onValueChange={(value) => setMedalData({...medalData, division: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Junior">Junior</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                    <SelectItem value="Skittles">Skittles</SelectItem>
                    <SelectItem value="Lpaca">Lpaca</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="round">Round</Label>
                <Select
                  value={medalData.round || ''}
                  onValueChange={(value) => setMedalData({...medalData, round: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select round" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Da Nang round">Da Nang round</SelectItem>
                    <SelectItem value="Ho Chi Minh Round">Ho Chi Minh Round</SelectItem>
                    <SelectItem value="custom">Other (Enter manually)</SelectItem>
                  </SelectContent>
                </Select>
                {medalData.round === 'custom' && (
                  <Input
                    className="mt-2"
                    placeholder="Enter custom round name"
                    value={medalData.customRound || ''}
                    onChange={(e) => setMedalData({...medalData, customRound: e.target.value})}
                  />
                )}
              </div>
              <div>
                <Label htmlFor="teamNumber">Team Number</Label>
                <Input
                  placeholder="e.g. SKT 548, JR 223"
                  value={medalData.teamNumber || ''}
                  onChange={(e) => setMedalData({...medalData, teamNumber: e.target.value})}
                />
              </div>
            </div>

            {/* Medal Categories - Inline Entry */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Medal Categories</h3>
              <div className="grid grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto">
                {/* Column 1: Individual and team */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700 border-b pb-1">Individual and team</h4>
                  {['Debate', 'Team debate', 'Writing', 'Team writing', 'Team bowl', 'Individual challenge', 'Team challenge'].map((category) => {
                    const categoryKey = category.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
                    const currentValue = medalData.categories?.[categoryKey] || { type: '', number: '' };
                    const isSelected = selectedCategories.includes(category);
                    
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={category}
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories([...selectedCategories, category]);
                              } else {
                                setSelectedCategories(selectedCategories.filter(c => c !== category));
                                // Clear medal data when unchecked
                                const categories = { ...medalData.categories };
                                delete categories[categoryKey];
                                setMedalData({...medalData, categories});
                              }
                            }}
                            className="h-4 w-4"
                          />
                          <label htmlFor={category} className="text-sm font-medium cursor-pointer">
                            {category}
                          </label>
                        </div>
                        
                        {/* Inline Medal Entry */}
                        {isSelected && (
                          <div className="flex items-center gap-1">
                            {['S', 'G', 'T'].map((medalType) => {
                              const isActive = currentValue.type === medalType;
                              let buttonClass = "h-5 w-5 p-0 text-xs border";
                              
                              if (isActive) {
                                if (medalType === 'S') {
                                  buttonClass += " bg-gray-400 text-white border-gray-400"; // Silver
                                } else if (medalType === 'G') {
                                  buttonClass += " bg-yellow-500 text-white border-yellow-500"; // Gold
                                } else if (medalType === 'T') {
                                  buttonClass += " bg-blue-500 text-white border-blue-500"; // Blue
                                }
                              } else {
                                buttonClass += " bg-white text-gray-700 border-gray-300 hover:bg-gray-50";
                              }
                              
                              return (
                                <Button
                                  key={medalType}
                                  size="sm"
                                  className={buttonClass}
                                  onClick={() => {
                                    const categories = medalData.categories || {};
                                    const newType = currentValue.type === medalType ? '' : medalType;
                                    categories[categoryKey] = { ...currentValue, type: newType };
                                    setMedalData({...medalData, categories});
                                  }}
                                >
                                  {medalType}
                                </Button>
                              );
                            })}
                            <Input
                              className="w-10 h-5 text-center text-xs px-1"
                              placeholder="123"
                              value={currentValue.number || ''}
                              onChange={(e) => {
                                const categories = medalData.categories || {};
                                categories[categoryKey] = { ...currentValue, number: e.target.value };
                                setMedalData({...medalData, categories});
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Column 2: Challenge */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700 border-b pb-1">Challenge</h4>
                  {[
                    'History', 'Science & Technology', 'Art & Music', 
                    'Literature & media', 'Social studies', 'Special Area', 'Top subjects'
                  ].map((category) => {
                    const categoryKey = category.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
                    const currentValue = medalData.categories?.[categoryKey] || { type: '', number: '' };
                    const isSelected = selectedCategories.includes(category);
                    
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={category}
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories([...selectedCategories, category]);
                              } else {
                                setSelectedCategories(selectedCategories.filter(c => c !== category));
                                // Clear medal data when unchecked
                                const categories = { ...medalData.categories };
                                delete categories[categoryKey];
                                setMedalData({...medalData, categories});
                              }
                            }}
                            className="h-4 w-4"
                          />
                          <label htmlFor={category} className="text-sm font-medium cursor-pointer">
                            {category}
                          </label>
                        </div>
                        
                        {/* Inline Medal Entry */}
                        {isSelected && (
                          <div className="flex items-center gap-1">
                            {['S', 'G', 'T'].map((medalType) => {
                              const isActive = currentValue.type === medalType;
                              let buttonClass = "h-5 w-5 p-0 text-xs border";
                              
                              if (isActive) {
                                if (medalType === 'S') {
                                  buttonClass += " bg-gray-400 text-white border-gray-400"; // Silver
                                } else if (medalType === 'G') {
                                  buttonClass += " bg-yellow-500 text-white border-yellow-500"; // Gold
                                } else if (medalType === 'T') {
                                  buttonClass += " bg-blue-500 text-white border-blue-500"; // Blue
                                }
                              } else {
                                buttonClass += " bg-white text-gray-700 border-gray-300 hover:bg-gray-50";
                              }
                              
                              return (
                                <Button
                                  key={medalType}
                                  size="sm"
                                  className={buttonClass}
                                  onClick={() => {
                                    const categories = medalData.categories || {};
                                    const newType = currentValue.type === medalType ? '' : medalType;
                                    categories[categoryKey] = { ...currentValue, type: newType };
                                    setMedalData({...medalData, categories});
                                  }}
                                >
                                  {medalType}
                                </Button>
                              );
                            })}
                            <Input
                              className="w-10 h-5 text-center text-xs px-1"
                              placeholder="123"
                              value={currentValue.number || ''}
                              onChange={(e) => {
                                const categories = medalData.categories || {};
                                categories[categoryKey] = { ...currentValue, number: e.target.value };
                                setMedalData({...medalData, categories});
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Column 3: Others */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700 border-b pb-1">Others</h4>
                  {[
                    'Individual scholar', 'Overall team', 'Asimov', 
                    'Top of school', 'Top of country', 'BarelySenior', 'Lpaca scholar', 
                    'Jack Khor', 'Other'
                  ].map((category) => {
                    const categoryKey = category.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
                    const currentValue = medalData.categories?.[categoryKey] || { type: '', number: '' };
                    const isSelected = selectedCategories.includes(category);
                    
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={category}
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories([...selectedCategories, category]);
                              } else {
                                setSelectedCategories(selectedCategories.filter(c => c !== category));
                                // Clear medal data when unchecked
                                const categories = { ...medalData.categories };
                                delete categories[categoryKey];
                                setMedalData({...medalData, categories});
                              }
                            }}
                            className="h-4 w-4"
                          />
                          <label htmlFor={category} className="text-sm font-medium cursor-pointer">
                            {category}
                          </label>
                        </div>
                        
                        {/* Inline Medal Entry */}
                        {isSelected && (
                          <div className="flex items-center gap-1">
                            {['S', 'G', 'T'].map((medalType) => {
                              const isActive = currentValue.type === medalType;
                              let buttonClass = "h-5 w-5 p-0 text-xs border";
                              
                              if (isActive) {
                                if (medalType === 'S') {
                                  buttonClass += " bg-gray-400 text-white border-gray-400"; // Silver
                                } else if (medalType === 'G') {
                                  buttonClass += " bg-yellow-500 text-white border-yellow-500"; // Gold
                                } else if (medalType === 'T') {
                                  buttonClass += " bg-blue-500 text-white border-blue-500"; // Blue
                                }
                              } else {
                                buttonClass += " bg-white text-gray-700 border-gray-300 hover:bg-gray-50";
                              }
                              
                              return (
                                <Button
                                  key={medalType}
                                  size="sm"
                                  className={buttonClass}
                                  onClick={() => {
                                    const categories = medalData.categories || {};
                                    const newType = currentValue.type === medalType ? '' : medalType;
                                    categories[categoryKey] = { ...currentValue, type: newType };
                                    setMedalData({...medalData, categories});
                                  }}
                                >
                                  {medalType}
                                </Button>
                              );
                            })}
                            <Input
                              className="w-10 h-5 text-center text-xs px-1"
                              placeholder="123"
                              value={currentValue.number || ''}
                              onChange={(e) => {
                                const categories = medalData.categories || {};
                                categories[categoryKey] = { ...currentValue, number: e.target.value };
                                setMedalData({...medalData, categories});
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export the expandable component for use in tables */}
      {typeof MedalResultsExpanded !== 'undefined' && <MedalResultsExpanded student={{} as User} />}
    </>
  );
};