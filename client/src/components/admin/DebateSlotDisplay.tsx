import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users } from 'lucide-react';
import type { ActivitySession } from '@shared/schema';
import { TeamSearchDialog } from './TeamSearchDialog';

interface DebateSlotDisplayProps {
  trigger?: React.ReactNode;
}

export const DebateSlotDisplay: React.FC<DebateSlotDisplayProps> = ({ trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [teamSearchOpen, setTeamSearchOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  // Fetch debate sessions
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['/api/debate-sessions'],
    select: (data: ActivitySession[]) => data || []
  });

  // Fetch session registrations
  const { data: registrationsData, refetch: refetchRegistrations } = useQuery({
    queryKey: ['/api/session-registrations', 'all'],
    queryFn: async () => {
      const registrationPromises = sessions.map(async (session: ActivitySession) => {
        const response = await fetch(`/api/session-registrations/${session.session_id}`);
        if (response.ok) {
          const data = await response.json();
          return { sessionId: session.session_id, ...data };
        }
        return { sessionId: session.session_id, registrations: [], divisionCounts: {} };
      });
      return Promise.all(registrationPromises);
    },
    enabled: sessions.length > 0
  });

  // Get registration info for a session
  const getSessionRegistrations = (sessionId: number) => {
    return registrationsData?.find(r => r.sessionId === sessionId) || 
           { registrations: [], divisionCounts: {} };
  };

  // Get current user ID (this should be passed as prop or from context in real app)
  const { data: currentUser = {} } = useQuery({
    queryKey: ['/api/auth/user']
  });
  
  const handleRegistrationSuccess = () => {
    refetchRegistrations();
  };

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
                
                return (
                  <div key={sessionIndex} className="bg-blue-100 border border-blue-300 rounded-md p-2 text-sm">
                    <div className="font-semibold text-blue-800 mb-2 text-center text-xs">
                      {startTime} - {endTime}
                    </div>
                    <div className="flex justify-center">
                      {hasRegistrations ? (
                        <button 
                          onClick={handleRegisterClick}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                        >
                          {divisionText}
                        </button>
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
        currentUserId={currentUser?.id}
        onRegistrationSuccess={handleRegistrationSuccess}
      />
    </Dialog>
  );
};