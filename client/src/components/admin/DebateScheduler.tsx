import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calendar, Clock, Users, MapPin, Edit, Trash2, UserPlus, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ActivitySession } from '@shared/schema';
import { DebateSlotDisplay } from './DebateSlotDisplay';

export const DebateScheduler: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [timeSlots, setTimeSlots] = useState([{ startTime: '', endTime: '' }]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch debate sessions
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['/api/debate-sessions'],
    select: (data: ActivitySession[]) => data || []
  });

  // Create sessions mutation
  const createMutation = useMutation({
    mutationFn: async (sessionData: any[]) => {
      const results = await Promise.all(
        sessionData.map(session => 
          apiRequest('/debate-sessions', { 
            method: 'POST',
            body: JSON.stringify(session)
          })
        )
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/debate-sessions'] });
      setIsCreateDialogOpen(false);
      setSelectedDate('');
      setTimeSlots([{ startTime: '', endTime: '' }]);
      toast({
        title: "Success",
        description: "Debate sessions created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create debate sessions",
        variant: "destructive"
      });
    }
  });

  // Helper functions for managing time slots
  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { startTime: '', endTime: '' }]);
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updated = [...timeSlots];
    updated[index][field] = value;
    setTimeSlots(updated);
  };

  const handleCreateSessions = () => {
    const validSessions = timeSlots.filter(s => s.startTime && s.endTime && selectedDate);
    
    if (validSessions.length === 0) {
      toast({
        title: "Error",
        description: "Please select a date and add at least one session with start and end times",
        variant: "destructive"
      });
      return;
    }

    const sessionData = validSessions.map(session => {
      const startDateTime = `${selectedDate}T${session.startTime}:00`;
      const endDateTime = `${selectedDate}T${session.endTime}:00`;
      
      return {
        start_time: startDateTime,
        end_time: endDateTime,
        activities: {
          title: `Debate Session - ${session.startTime}`,
          description: 'Debate session for student registration',
          location: '',
          max_participants: 50,
          year: '',
          round: '',
          topic: '',
          format: ''
        }
      };
    });

    createMutation.mutate(sessionData);
  };

  // Delete session mutation
  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) => 
      apiRequest(`/debate-sessions/${sessionId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/debate-sessions'] });
      toast({
        title: "Success",
        description: "Debate session deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete debate session",
        variant: "destructive"
      });
    }
  });

  const handleDeleteSession = (session: ActivitySession) => {
    if (window.confirm(`Are you sure you want to delete "${session.activities_jsonb?.title || 'this session'}"? This will also remove all registrations.`)) {
      deleteMutation.mutate(session.session_id?.toString() || '');
    }
  };



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredSessions = (sessions || []).filter((session: ActivitySession) =>
    session.activities_jsonb?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.activities_jsonb?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.activities_jsonb?.year?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.activities_jsonb?.round?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.activities_jsonb?.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.activities_jsonb?.topic?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading debate sessions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Debate Scheduler</h2>
          <p className="text-gray-600">Manage debate sessions and team registrations</p>
        </div>
        <div className="flex gap-2">
          <DebateSlotDisplay 
            trigger={
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                View Schedule
              </Button>
            }
          />
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Session
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Debate Sessions</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Date Selection */}
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              {/* Time Slots */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Time Slots</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addTimeSlot}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Slot
                  </Button>
                </div>
                
                {timeSlots.map((slot, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                      placeholder="Start time"
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                      placeholder="End time"
                    />
                    {timeSlots.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTimeSlot(index)}
                        className="p-1"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateSessions}
                  disabled={createMutation.isPending || !selectedDate}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Sessions'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search sessions by title, year, round, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSessions.map((session: ActivitySession) => (
          <Card key={session.session_id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{session.activities_jsonb?.title || 'Debate Session'}</CardTitle>
                  <div className="flex items-center gap-2">
                    {session.activities_jsonb?.year && <Badge variant="outline">{session.activities_jsonb.year}</Badge>}
                    {session.activities_jsonb?.round && <Badge variant="outline">Round {session.activities_jsonb.round}</Badge>}
                    <Badge className={`${getStatusColor(session.status)} text-white`}>
                      {session.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteSession(session)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {session.activities_jsonb?.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{session.activities_jsonb.description}</p>
              )}
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  {formatDate(session.start_time)}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  {session.start_time && session.end_time ? 
                    `${Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / (1000 * 60))} minutes` : 
                    'Duration not set'
                  }
                </div>
                {session.activities_jsonb?.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {session.activities_jsonb.location}
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="h-4 w-4" />
                  Max {session.activities_jsonb?.max_participants || 10} teams
                </div>
                {session.activities_jsonb?.topic && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="font-medium">Topic:</span>
                    {session.activities_jsonb.topic}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Manage Registrations
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSessions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Calendar className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No Debate Sessions Found</p>
            <p className="text-sm text-center mb-4">
              {searchTerm ? 'No sessions match your search criteria.' : 'Create your first debate session to get started.'}
            </p>
            {!searchTerm && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Session
                  </Button>
                </DialogTrigger>
              </Dialog>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};