import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users } from 'lucide-react';
import type { ActivitySession } from '@shared/schema';

interface DebateSlotDisplayProps {
  trigger?: React.ReactNode;
}

export const DebateSlotDisplay: React.FC<DebateSlotDisplayProps> = ({ trigger }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch debate sessions
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['/api/debate-sessions'],
    select: (data: ActivitySession[]) => data || []
  });

  // Generate week dates starting from current week (today onward)
  const generateWeekDates = () => {
    const today = new Date();
    
    // Always start from current week (Monday to Sunday)
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Convert Sunday to 6, others to currentDay-1
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysFromMonday);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date);
    }
    
    return weekDates;
  };

  const weekDates = generateWeekDates();



  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'numeric',
      day: 'numeric'
    });
  };

  // Get sessions for a specific date and time
  const getSessionsForSlot = (date: Date, timeSlot: string) => {
    const dateStr = date.toISOString().split('T')[0];
    
    return sessions.filter(session => {
      if (!session.start_time) return false;
      
      // Work with local time for both session and date comparison
      const sessionStart = new Date(session.start_time);
      const sessionDate = sessionStart.toLocaleDateString('en-CA'); // YYYY-MM-DD format
      const sessionHour = sessionStart.getHours(); // This gives local hour
      const compareDate = date.toLocaleDateString('en-CA');
      
      // Extract hour from time slot string (e.g., "11:00 AM-12:00 PM" -> 11)
      const slotMatch = timeSlot.match(/^(\d{1,2}):00\s+(AM|PM)/);
      if (!slotMatch) return false;
      
      let slotHour = parseInt(slotMatch[1]);
      const period = slotMatch[2];
      
      // Convert to 24-hour format
      if (period === 'PM' && slotHour !== 12) {
        slotHour += 12;
      } else if (period === 'AM' && slotHour === 12) {
        slotHour = 0;
      }

      return sessionDate === compareDate && sessionHour === slotHour;
    });
  };

  // Parse activities data from session
  const getSessionTitle = (session: ActivitySession) => {
    try {
      const activities = typeof session.activities_jsonb === 'string' 
        ? JSON.parse(session.activities_jsonb) 
        : session.activities_jsonb;
      return activities?.title || `Session ${session.session_id}`;
    } catch {
      return `Session ${session.session_id}`;
    }
  };

  const getSessionDescription = (session: ActivitySession) => {
    try {
      const activities = typeof session.activities_jsonb === 'string' 
        ? JSON.parse(session.activities_jsonb) 
        : session.activities_jsonb;
      return activities?.description || 'Debate session';
    } catch {
      return 'Debate session';
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Debate Schedule
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
        
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, index) => {
            // Get all sessions for this specific date and sort by start time
            const sessionsForDate = sessions
              .filter(session => {
                if (!session.start_time) return false;
                const sessionStart = new Date(session.start_time);
                const sessionDate = sessionStart.toLocaleDateString('en-CA');
                const compareDate = date.toLocaleDateString('en-CA');
                return sessionDate === compareDate;
              })
              .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

            return (
              <div key={index} className="border border-gray-300 min-h-[200px]">
                {/* Header for each day */}
                <div className="bg-orange-500 text-white p-3 text-center font-semibold">
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
                      
                      return (
                        <div key={sessionIndex} className="bg-blue-100 border border-blue-300 rounded-md p-2 text-sm">
                          <div className="font-semibold text-blue-800 mb-2 text-center text-xs">
                            {startTime} - {endTime}
                          </div>
                          <div className="flex justify-center">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors">
                              Register
                            </button>
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
          })}
        </div>

        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
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
    </Dialog>
  );
};