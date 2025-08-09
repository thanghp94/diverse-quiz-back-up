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
import { Plus, Calendar, Clock, Users, MapPin, Edit, Trash2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ActivitySession } from '@shared/schema';

export const DebateScheduler: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    max_participants: 10,
    year: '',
    round: '',
    topic: '',
    format: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch debate sessions
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['/api/debate-sessions'],
    select: (data: ActivitySession[]) => data || []
  });

  // Create session mutation
  const createMutation = useMutation({
    mutationFn: (sessionData: any) => 
      apiRequest('/api/debate-sessions', { 
        method: 'POST',
        body: JSON.stringify(sessionData)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/debate-sessions'] });
      setIsCreateDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        location: '',
        max_participants: 10,
        year: '',
        round: '',
        topic: '',
        format: ''
      });
      toast({
        title: "Success",
        description: "Debate session created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create debate session",
        variant: "destructive"
      });
    }
  });

  // Delete session mutation
  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) => 
      apiRequest(`/api/debate-sessions/${sessionId}`, { method: 'DELETE' }),
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

  const handleCreateSession = () => {
    const sessionData = {
      start_time: formData.start_time,
      end_time: formData.end_time,
      activities: {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        max_participants: formData.max_participants,
        year: formData.year,
        round: formData.round,
        topic: formData.topic,
        format: formData.format
      }
    };
    createMutation.mutate(sessionData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const filteredSessions = sessions.filter((session: ActivitySession) =>
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
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Debate Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Session Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Regional Debate Championship"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., Main Auditorium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the debate session..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => handleInputChange('start_time', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => handleInputChange('end_time', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    value={formData.year}
                    onChange={(e) => handleInputChange('year', e.target.value)}
                    placeholder="e.g., 2025"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="round">Round</Label>
                  <Input
                    id="round"
                    value={formData.round}
                    onChange={(e) => handleInputChange('round', e.target.value)}
                    placeholder="e.g., Regional, Global"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_participants">Max Teams</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => handleInputChange('max_participants', parseInt(e.target.value))}
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Debate Topic</Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => handleInputChange('topic', e.target.value)}
                    placeholder="e.g., AI Ethics"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="format">Debate Format</Label>
                  <Input
                    id="format"
                    value={formData.format}
                    onChange={(e) => handleInputChange('format', e.target.value)}
                    placeholder="e.g., Oxford, Parliamentary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateSession}
                  disabled={createMutation.isPending || !formData.start_time || !formData.end_time}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Session'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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