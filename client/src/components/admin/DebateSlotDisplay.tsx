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

  // Generate week dates (assuming current week for now)
  const generateWeekDates = () => {
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

  // Time slots from 3:00 PM to 10:00 PM
  const timeSlots = [
    '3:00-4:00 PM',
    '4:00-5:00 PM', 
    '5:00-6:00 PM',
    '6:00-7:00 PM',
    '7:00-8:00 PM',
    '8:00-9:00 PM',
    '9:00-10:00 PM'
  ];

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
      const sessionHour = new Date(session.start_time).getHours();
      
      // Map time slots to hours
      const timeToHour: Record<string, number> = {
        '3:00-4:00 PM': 15,
        '4:00-5:00 PM': 16,
        '5:00-6:00 PM': 17,
        '6:00-7:00 PM': 18,
        '7:00-8:00 PM': 19,
        '8:00-9:00 PM': 20,
        '9:00-10:00 PM': 21
      };

      return sessionDate === dateStr && sessionHour === timeToHour[timeSlot];
    });
  };

  // Mock team data for demonstration (in real app, this would come from registrations API)
  const getMockTeamsForSession = (sessionId: number) => {
    const teamNames = [
      'Team A: FPT Khái An (SR)',
      'Team B: FPT Bảo Ngọc (SR)',
      'Team A: Wil, Noah, Erica (JR)',
      'Team B: Rose, alan, vanitas SR',
      'Team A: George Saka Ranbir',
      'Team B: Vy, Hưng, Darwyn SR',
      'Team A: Chris SKT',
      'Team B: Lucy Chika Nova SR'
    ];

    // Return 2-4 random teams for each session
    const numTeams = 2 + (sessionId % 3);
    return teamNames.slice(0, numTeams);
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
                              const teams = getMockTeamsForSession(session.session_id);
                              return (
                                <div key={sessionIndex} className="space-y-1">
                                  {teams.map((team, teamIndex) => (
                                    <div
                                      key={teamIndex}
                                      className={`text-xs p-1 rounded ${
                                        team.includes('Team A') 
                                          ? 'bg-yellow-200 text-yellow-800' 
                                          : 'bg-green-200 text-green-800'
                                      }`}
                                    >
                                      {team}
                                    </div>
                                  ))}
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
              <div className="w-4 h-4 bg-yellow-200 rounded"></div>
              <span>Team A</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-200 rounded"></div>
              <span>Team B</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{sessions.length} debate sessions scheduled</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};