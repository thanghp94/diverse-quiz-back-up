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

  // Generate week dates based on sessions data or current week
  const generateWeekDates = () => {
    if (sessions.length > 0) {
      // Find the earliest session date and build a week around it
      const sessionDates = sessions
        .filter(s => s.start_time)
        .map(s => new Date(s.start_time))
        .sort((a, b) => a.getTime() - b.getTime());
      
      if (sessionDates.length > 0) {
        const earliestDate = sessionDates[0];
        const startOfWeek = new Date(earliestDate);
        startOfWeek.setDate(earliestDate.getDate() - earliestDate.getDay() + 1); // Start from Monday
        
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + i);
          weekDates.push(date);
        }
        return weekDates;
      }
    }
    
    // Fallback to current week
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Start from Monday

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const weekDates = generateWeekDates();

  // Generate dynamic time slots based on actual session data
  const generateTimeSlots = () => {
    if (sessions.length === 0) {
      // Default time slots when no sessions exist
      return [
        '3:00-4:00 PM',
        '4:00-5:00 PM', 
        '5:00-6:00 PM',
        '6:00-7:00 PM',
        '7:00-8:00 PM',
        '8:00-9:00 PM',
        '9:00-10:00 PM'
      ];
    }

    // Get all unique hours from sessions and create slots
    const sessionHours = sessions
      .filter(s => s.start_time)
      .map(s => new Date(s.start_time).getHours())
      .sort((a, b) => a - b);

    const uniqueHours = [...new Set(sessionHours)];
    
    return uniqueHours.map(hour => {
      const nextHour = hour + 1;
      const formatTime = (h: number) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${displayHour}:00 ${period}`;
      };
      
      return `${formatTime(hour)}-${formatTime(nextHour)}`;
    });
  };

  const timeSlots = generateTimeSlots();

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
      const sessionDate = new Date(session.start_time).toISOString().split('T')[0];
      const sessionStart = new Date(session.start_time);
      const sessionHour = sessionStart.getHours();
      
      console.log('Debug session:', {
        sessionId: session.session_id,
        start_time: session.start_time,
        sessionDate,
        sessionHour,
        timeSlot
      });
      
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

      console.log('Debug slot matching:', {
        timeSlot,
        slotHour,
        sessionHour,
        matches: sessionDate === dateStr && sessionHour === slotHour
      });

      return sessionDate === dateStr && sessionHour === slotHour;
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
            Debate Schedule - Weekly View
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-orange-500 text-white">
                <th className="border border-gray-300 p-2 w-24 text-sm font-semibold">Time</th>
                {weekDates.map((date, index) => (
                  <th key={index} className="border border-gray-300 p-2 text-sm font-semibold min-w-[140px]">
                    {formatDate(date)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((timeSlot, timeIndex) => (
                <tr key={timeIndex} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2 bg-orange-100 font-medium text-xs text-center">
                    {timeSlot}
                  </td>
                  {weekDates.map((date, dateIndex) => {
                    const sessionsForSlot = getSessionsForSlot(date, timeSlot);
                    
                    return (
                      <td key={dateIndex} className="border border-gray-300 p-1 align-top min-h-[80px]">
                        {sessionsForSlot.length > 0 ? (
                          <div className="space-y-1">
                            {sessionsForSlot.map((session, sessionIndex) => {
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
                                <div key={sessionIndex} className="space-y-1">
                                  <div className="bg-blue-100 text-blue-800 text-xs p-2 rounded border">
                                    <div className="font-semibold">{getSessionTitle(session)}</div>
                                    <div className="text-xs opacity-75 mt-1">{startTime} - {endTime}</div>
                                    <div className="text-xs mt-1">{getSessionDescription(session)}</div>
                                    <div className="text-xs mt-1 opacity-60">Status: {session.status}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="h-full min-h-[60px] flex items-center justify-center text-gray-400 text-xs">
                            {/* Empty slot */}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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