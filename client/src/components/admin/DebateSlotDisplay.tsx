import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, UserPlus, UserMinus, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { ActivitySession } from '@shared/schema';
import { TeamSearchDialog } from './TeamSearchDialog';

interface DebateSlotDisplayProps {
  trigger?: React.ReactNode;
}

export const DebateSlotDisplay: React.FC<DebateSlotDisplayProps> = ({ trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [teamSearchOpen, setTeamSearchOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [registrationsModalOpen, setRegistrationsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ActivitySession | null>(null);
  const { toast } = useToast();

  // Fetch debate sessions
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['/api/debate-sessions'],
    select: (data: ActivitySession[]) => data || []
  });

  // Fetch session registrations
  const { data: registrationsData, refetch: refetchRegistrations } = useQuery({
    queryKey: ['/api/session-registrations', 'all'],
    queryFn: async () => {
      console.log('Fetching registration data for sessions:', sessions);
      const registrationPromises = sessions.map(async (session: ActivitySession) => {
        const response = await fetch(`/api/session-registrations/${session.session_id}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`Session ${session.session_id} registration data:`, data);
          return { sessionId: session.session_id, ...data };
        }
        return { sessionId: session.session_id, registrations: [], divisionCounts: {} };
      });
      return Promise.all(registrationPromises);
    },
    enabled: sessions.length > 0,
    staleTime: 0, // Disable caching
    gcTime: 0    // Don't keep in cache
  });

  // Get registration info for a session
  const getSessionRegistrations = (sessionId: number) => {
    return registrationsData?.find(r => r.sessionId === sessionId) || 
           { registrations: [], divisionCounts: {} };
  };

  // Get current user ID (this should be passed as prop or from context in real app)
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/user']
  });
  
  const handleRegistrationSuccess = () => {
    refetchRegistrations();
  };

  // Withdraw registration mutation
  const withdrawMutation = useMutation({
    mutationFn: async (registrationId: number) => {
      return apiRequest(`/api/session-registrations/${registrationId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Registration withdrawn successfully!" });
      refetchRegistrations();
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to withdraw registration",
        variant: "destructive"
      });
    }
  });

  // Confirm registration mutation
  const confirmMutation = useMutation({
    mutationFn: async ({ registrationId, status }: { registrationId: number, status: string }) => {
      return apiRequest(`/api/session-registrations/${registrationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Registration confirmed successfully!" });
      refetchRegistrations();
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to confirm registration",
        variant: "destructive"
      });
    }
  });

  // Generate week dates starting from current week (Monday to Sunday)
  const generateWeekDates = (weekOffset = 0) => {
    const today = new Date();
    
    // Always start from current week (Monday to Sunday)
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Convert Sunday to 6, others to currentDay-1
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysFromMonday + (weekOffset * 7));
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date);
    }
    
    return weekDates;
  };

  const currentWeekDates = generateWeekDates(0);
  const nextWeekDates = generateWeekDates(1);
  const thirdWeekDates = generateWeekDates(2);

  // Check if a week has any sessions
  const weekHasSessions = (weekDates: Date[]) => {
    return sessions.some(session => {
      if (!session.start_time) return false;
      const sessionStart = new Date(session.start_time);
      const sessionDate = sessionStart.toLocaleDateString('en-CA');
      return weekDates.some(date => date.toLocaleDateString('en-CA') === sessionDate);
    });
  };

  // Determine which weeks to show based on sessions
  const weeksToShow = [];
  if (weekHasSessions(currentWeekDates)) {
    weeksToShow.push(currentWeekDates);
  }
  if (weekHasSessions(nextWeekDates)) {
    weeksToShow.push(nextWeekDates);
  }
  if (weekHasSessions(thirdWeekDates)) {
    weeksToShow.push(thirdWeekDates);
  }

  // If no sessions in any week, show current week as fallback
  if (weeksToShow.length === 0) {
    weeksToShow.push(currentWeekDates);
  }

  // Format date for display (dd/mm format)
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    return `${weekday}, ${day}/${month}`;
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Generate session title based on time since activities_jsonb is now empty
  const getSessionTitle = (session: ActivitySession) => {
    if (session.start_time) {
      const startTime = new Date(session.start_time);
      const timeStr = startTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      return `Debate Session - ${timeStr}`;
    }
    return 'Debate Session';
  };

  // Render each week column
  const renderWeekColumn = (weekDates: Date[]) => {
    return weekDates.map((date, index) => {
      // Get all sessions for this specific date and sort by start time
      const sessionsForDate = sessions
        .filter(session => {
          if (!session.start_time) return false;
          const sessionStart = new Date(session.start_time);
          const sessionDate = sessionStart.toLocaleDateString('en-CA');
          const compareDate = date.toLocaleDateString('en-CA');
          return sessionDate === compareDate;
        })
        .sort((a, b) => {
          if (!a.start_time || !b.start_time) return 0;
          return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
        });

      return (
        <div key={index} className={`border min-h-[200px] ${isToday(date) ? 'border-orange-500 border-2' : 'border-gray-300'}`}>
          {/* Header for each day */}
          <div className={`text-white p-3 text-center font-semibold ${isToday(date) ? 'bg-orange-600' : 'bg-orange-500'}`}>
            {formatDate(date)}
          </div>
          
          {/* Sessions for this day */}
          <div className="p-2 space-y-2">
            {sessionsForDate.length > 0 ? (
              sessionsForDate.map((session, sessionIndex) => {
                let startTime = 'N/A';
                let endTime = 'N/A';
                
                if (session.start_time) {
                  startTime = new Date(session.start_time).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });
                }
                
                if (session.end_time) {
                  endTime = new Date(session.end_time).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });
                }
                
                const sessionRegistrations = getSessionRegistrations(session.session_id);
                const divisionCounts = sessionRegistrations.divisionCounts;
                const hasRegistrations = Object.keys(divisionCounts).length > 0;
                
                // Create division display text
                const divisionText = Object.entries(divisionCounts)
                  .map(([division, count]) => `${count} ${division}`)
                  .join(', ');

                const handleRegisterClick = () => {
                  setSelectedSessionId(session.session_id);
                  setTeamSearchOpen(true);
                };

                const handleRegistrationsClick = () => {
                  setSelectedSession(session);
                  setRegistrationsModalOpen(true);
                };
                
                return (
                  <div key={sessionIndex} className="bg-blue-100 border border-blue-300 rounded-md p-2 text-sm">
                    <div className="font-semibold text-blue-800 mb-2 text-center text-xs">
                      {startTime} - {endTime}
                    </div>
                    <div className="flex justify-center items-center gap-1">
                      {hasRegistrations ? (
                        <>
                          <button 
                            onClick={handleRegistrationsClick}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                          >
                            {divisionText}
                          </button>
                          <button 
                            onClick={handleRegisterClick}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded text-xs transition-colors"
                            title="Register another team"
                          >
                            <UserPlus className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={handleRegisterClick}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                        >
                          Register
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-400 text-sm py-8">
                No sessions scheduled
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Debate Schedule - Weekly View (Local Time)
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-8">
            <div className="text-gray-500">Loading debate schedule...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Debate Schedule - Weekly View (Local Time)
          </DialogTitle>
          <div className="text-sm text-gray-600 mt-2">
            Times are displayed in your local timezone. Students from different countries will see times adjusted to their local timezone.
          </div>
        </DialogHeader>
        
        {/* Dynamic Week Display */}
        {weeksToShow.map((weekDates, weekIndex) => (
          <div 
            key={weekIndex} 
            className={`grid grid-cols-7 gap-2 ${weekIndex < weeksToShow.length - 1 ? 'mb-3' : ''}`}
          >
            {renderWeekColumn(weekDates)}
          </div>
        ))}

        <div className="mt-6 flex justify-between items-center text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-200 rounded"></div>
              <span>Scheduled Sessions</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{sessions.length} debate sessions total</span>
          </div>
        </div>
      </DialogContent>

      {/* Team Search Dialog */}
      <TeamSearchDialog
        isOpen={teamSearchOpen}
        onClose={() => setTeamSearchOpen(false)}
        sessionId={selectedSessionId || 0}
        currentUserId={(currentUser as any)?.id}
        onRegistrationSuccess={handleRegistrationSuccess}
      />

      {/* Registration Details Modal */}
      <Dialog open={registrationsModalOpen} onOpenChange={setRegistrationsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Registered Teams
            </DialogTitle>
          </DialogHeader>
          
          {selectedSession && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Session: {new Date(selectedSession.start_time || '').toLocaleString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </div>

              {/* Display registered teams from registrations data */}
              {(() => {
                const sessionRegistrations = getSessionRegistrations(selectedSession.session_id);
                console.log('sessionRegistrations for modal:', sessionRegistrations);
                const teams = sessionRegistrations.registrations || [];
                
                if (teams.length === 0) {
                  return (
                    <div className="text-center text-gray-500 py-8">
                      No teams registered for this session yet.
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-3">
                    {teams.map((team: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{team.team_name || `Team ${team.team_id}`}</h3>
                              <Badge variant={team.status === 'matched' ? 'default' : 'secondary'}>
                                {team.status}
                              </Badge>
                              <Badge variant="outline">{team.division}</Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              {team.timestamp && (
                                <div>Registered: {new Date(team.timestamp).toLocaleString()}</div>
                              )}
                              {team.matched_at && (
                                <div>Matched: {new Date(team.matched_at).toLocaleString()}</div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {/* Withdraw button for team members */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (team.registration_id) {
                                  withdrawMutation.mutate(team.registration_id);
                                }
                              }}
                              disabled={withdrawMutation.isPending}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <UserMinus className="h-4 w-4 mr-1" />
                              Withdraw
                            </Button>

                            {/* Confirm button for teachers */}
                            <Button
                              size="sm"
                              onClick={() => {
                                console.log('Confirm button clicked for team:', team);
                                console.log('Registration ID:', team.registration_id);
                                if (team.registration_id) {
                                  console.log('Calling confirmMutation.mutate with:', {
                                    registrationId: team.registration_id,
                                    status: 'confirmed'
                                  });
                                  confirmMutation.mutate({
                                    registrationId: team.registration_id,
                                    status: 'confirmed'
                                  });
                                } else {
                                  console.log('No registration_id found for team');
                                }
                              }}
                              disabled={confirmMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirm
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Register Another Team Button */}
              <div className="border-t pt-4">
                <Button
                  onClick={() => {
                    setRegistrationsModalOpen(false);
                    setSelectedSessionId(selectedSession.session_id);
                    setTeamSearchOpen(true);
                  }}
                  className="w-full"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Register Another Team
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};