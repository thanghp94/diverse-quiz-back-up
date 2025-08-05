import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Calendar, Clock, User } from "lucide-react";

interface Assignment {
  id: string;
  assignmentname: string;
  description: string;
  category: string;
  subject: string;
  testtype: string;
  noofquestion: number;
  status: string | null;
  tg_tao: string;
  expiring_date: string;
  topicid: string;
  contentid: string | null;
}

export const AssignmentPanel = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'expired'>('all');
  
  // Fetch assignments from API
  const { data: assignmentsData, isLoading } = useQuery({
    queryKey: ['/api/assignments'],
    queryFn: async () => {
      const response = await fetch('/api/assignments');
      if (!response.ok) throw new Error('Failed to fetch assignments');
      return response.json();
    },
    refetchInterval: 30000,
  });

  const getFilteredData = () => {
    if (!assignmentsData) return [];
    
    const now = new Date();
    
    // First filter by "Challenge" subject
    const challengeAssignments = assignmentsData.filter((assignment: Assignment) => 
      assignment.subject === 'Challenge'
    );
    
    switch (activeFilter) {
      case 'active':
        return challengeAssignments.filter((assignment: Assignment) => 
          new Date(assignment.expiring_date) > now
        );
      case 'expired':
        return challengeAssignments.filter((assignment: Assignment) => 
          new Date(assignment.expiring_date) <= now
        );
      default:
        return challengeAssignments;
    }
  };

  const getStatusBadge = (assignment: Assignment) => {
    const now = new Date();
    const expiringDate = new Date(assignment.expiring_date);
    
    if (expiringDate <= now) {
      return <Badge className="bg-red-600 text-white">Expired</Badge>;
    } else if (expiringDate <= new Date(now.getTime() + 24 * 60 * 60 * 1000)) {
      return <Badge className="bg-yellow-600 text-white">Due Soon</Badge>;
    } else {
      return <Badge className="bg-green-600 text-white">Active</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStats = () => {
    if (!assignmentsData) return { total: 0, active: 0, expired: 0 };
    
    const now = new Date();
    return {
      total: assignmentsData.length,
      active: assignmentsData.filter((a: Assignment) => new Date(a.expiring_date) > now).length,
      expired: assignmentsData.filter((a: Assignment) => new Date(a.expiring_date) <= now).length,
    };
  };

  const filteredData = getFilteredData();
  const stats = getStats();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-purple-600/12 border-purple-400/30 text-white/60 hover:bg-purple-600/30 hover:text-white transition-all duration-300 h-8 w-8 p-0"
          title="Assignments"
        >
          <FileText className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-400" />
            Available Assignments
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-gray-800 border-gray-700 p-3">
              <div className="text-center">
                <div className="text-xl font-bold text-white">{stats.total}</div>
                <div className="text-xs text-gray-400">Total</div>
              </div>
            </Card>
            <Card className="bg-gray-800 border-gray-700 p-3">
              <div className="text-center">
                <div className="text-xl font-bold text-green-400">{stats.active}</div>
                <div className="text-xs text-gray-400">Active</div>
              </div>
            </Card>
            <Card className="bg-gray-800 border-gray-700 p-3">
              <div className="text-center">
                <div className="text-xl font-bold text-red-400">{stats.expired}</div>
                <div className="text-xs text-gray-400">Expired</div>
              </div>
            </Card>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All', count: stats.total },
              { key: 'active', label: 'Active', count: stats.active },
              { key: 'expired', label: 'Expired', count: stats.expired }
            ].map((filter) => (
              <Button
                key={filter.key}
                variant={activeFilter === filter.key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter.key as any)}
                className={`flex items-center gap-1 text-xs ${
                  activeFilter === filter.key 
                    ? "bg-purple-600 text-white" 
                    : "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
                }`}
              >
                {filter.label} ({filter.count})
              </Button>
            ))}
          </div>

          {/* Assignment List */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 bg-gray-700" />
              ))}
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-600" />
              <p>No assignments found</p>
              <p className="text-sm">Check back later for new assignments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredData.map((assignment: Assignment) => (
                <Card key={assignment.id} className="bg-gray-800 border-gray-700 hover:bg-gray-700/50 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h3 className="text-white font-semibold text-lg">{assignment.assignmentname}</h3>
                            {getStatusBadge(assignment)}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>{assignment.noofquestion} questions</span>
                            <span>Due: {formatDate(assignment.expiring_date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-purple-600/20 border-purple-400/50 text-purple-200 hover:bg-purple-600/30"
                          onClick={() => {
                            // Logic will be provided later
                            console.log('Starting assignment:', assignment.id);
                          }}
                        >
                          Start
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentPanel;