import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Users, BookOpen, Star, Clock, Filter, Search, X, ChevronDown, Play, Pause, Settings, Wifi } from 'lucide-react';
import { format } from 'date-fns';
import { io, Socket } from 'socket.io-client';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
}

interface StudentActivity {
  student_id: string;
  student_name: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  content_viewed: number;
  content_rated: number;
  quiz_attempts: number;
  quiz_accuracy: number;
  last_activity: string;
  activities: Array<{
    type: 'content_view' | 'content_rating' | 'quiz_attempt';
    content_id: string;
    content_title: string;
    timestamp: string;
    rating?: string;
    quiz_score?: number;
  }>;
}

interface LiveClassMonitorProps {
  startTime?: string;
}

export const LiveClassMonitor: React.FC<LiveClassMonitorProps> = ({ startTime }) => {
  const [selectedStudents, setSelectedStudents] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('liveMonitor_selectedStudents');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [monitorStartTime, setMonitorStartTime] = useState(() => {
    try {
      const saved = localStorage.getItem('liveMonitor_startTime');
      return saved || startTime || new Date().toISOString();
    } catch {
      return startTime || new Date().toISOString();
    }
  });
  const [customStartTime, setCustomStartTime] = useState(format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'));
  const [isMonitoring, setIsMonitoring] = useState(() => {
    try {
      const saved = localStorage.getItem('liveMonitor_isMonitoring');
      return saved === 'true';
    } catch {
      return false;
    }
  });
  const [showActivityDetails, setShowActivityDetails] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [minContentViewed, setMinContentViewed] = useState<number>(0);
  const [minContentRated, setMinContentRated] = useState<number>(0);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [timePreset, setTimePreset] = useState<string>('now');
  const [showConfigPopup, setShowConfigPopup] = useState(false);
  const [triggerPosition, setTriggerPosition] = useState<{top: number; left: number; width: number} | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [realtimeActivities, setRealtimeActivities] = useState<any[]>([]);
  const studentSelectorRef = useRef<HTMLDivElement>(null);
  const studentSelectorTriggerRef = useRef<HTMLDivElement>(null);
  const configPopupRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('liveMonitor_selectedStudents', JSON.stringify(selectedStudents));
  }, [selectedStudents]);

  useEffect(() => {
    localStorage.setItem('liveMonitor_startTime', monitorStartTime);
  }, [monitorStartTime]);

  useEffect(() => {
    localStorage.setItem('liveMonitor_isMonitoring', isMonitoring.toString());
  }, [isMonitoring]);

  // Fetch all students
  const { data: allStudents = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['/api/users'],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
  });

  // Filter students based on search term
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return allStudents as Student[];
    const searchLower = searchTerm.toLowerCase();
    return (allStudents as Student[]).filter((student: Student) => {
      const fullName = student.full_name || `${student.first_name} ${student.last_name}`;
      return fullName.toLowerCase().includes(searchLower) || 
             student.id.toLowerCase().includes(searchLower);
    });
  }, [allStudents, searchTerm]);

  // Fetch student activities (only when monitoring is active) - initial load only, no polling
  const { data: studentActivities = [], isLoading: activitiesLoading, isFetching } = useQuery<StudentActivity[]>({
    queryKey: ['/api/live-class-activities', selectedStudents, monitorStartTime],
    enabled: isMonitoring && selectedStudents.length > 0,
    refetchInterval: false, // Disable polling - use pure WebSocket events
    staleTime: Infinity, // Keep data indefinitely - WebSocket will update
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Only fetch on initial mount
    retry: 1,
  });

  // Setup WebSocket connection
  useEffect(() => {
    let socket: Socket | null = null;
    
    if (isMonitoring && selectedStudents.length > 0) {
      // Create new WebSocket connection optimized for real-time updates
      socket = io(window.location.origin, {
        transports: ['websocket', 'polling'], // Allow both for reliability
        timeout: 10000,
        forceNew: true, // Force new connection to ensure clean state
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        upgrade: true,
        rememberUpgrade: true
      });
      
      socketRef.current = socket;
      
      socket.on('connect', () => {
        console.log('✅ Connected to WebSocket successfully');
        setSocketConnected(true);
        if (socket && selectedStudents.length > 0) {
          socket.emit('join-monitor', { students: selectedStudents });
          
          // Immediately refresh data when connected
          queryClient.invalidateQueries(['/api/live-class-activities', selectedStudents, monitorStartTime]);
        }
      });
      
      socket.on('connection-confirmed', (data) => {
        console.log('✅ WebSocket connection confirmed:', data);
      });
      
      socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from WebSocket:', reason);
        setSocketConnected(false);
        
        // Only log as error if it's not an intentional disconnect
        if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
          console.log('🔄 Will attempt to reconnect...');
        }
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        setSocketConnected(false);
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Reconnected to WebSocket after', attemptNumber, 'attempts');
        setSocketConnected(true);
        if (socket && selectedStudents.length > 0) {
          socket.emit('join-monitor', { students: selectedStudents });
        }
      });
      
      socket.on('quiz-activity', (data) => {
        console.log('⚡ Real-time quiz activity received:', data);
        
        // Immediately add to realtime activities with timestamp for sorting
        setRealtimeActivities(prev => {
          const newActivities = [{...data, receivedAt: Date.now()}, ...prev.slice(0, 49)];
          return newActivities.sort((a, b) => (b.receivedAt || 0) - (a.receivedAt || 0));
        });
        
        // Force immediate query data update
        queryClient.setQueryData(['/api/live-class-activities', selectedStudents, monitorStartTime], (oldData: StudentActivity[] | undefined) => {
          if (!oldData) {
            // If no data yet, trigger a refetch
            queryClient.invalidateQueries(['/api/live-class-activities', selectedStudents, monitorStartTime]);
            return oldData;
          }
          
          const updatedData = oldData.map(student => {
            if (student.student_id === data.student_id) {
              const currentAttempts = student.quiz_attempts || 0;
              let newCorrect = 0;
              let newAttempts = currentAttempts + 1;
              
              // Recalculate accuracy more precisely
              if (currentAttempts > 0 && student.quiz_accuracy) {
                newCorrect = Math.round((student.quiz_accuracy * currentAttempts) / 100);
              }
              
              if (data.quiz_result === '✅') {
                newCorrect += 1;
              }
              
              const newAccuracy = newAttempts > 0 ? Math.round((newCorrect / newAttempts) * 100) : 0;
              
              // Create new activity object
              const newActivity = {
                type: 'quiz_attempt' as const,
                content_id: data.content_id,
                content_title: data.content_title,
                timestamp: data.timestamp,
                quiz_score: data.score
              };
              
              return {
                ...student,
                quiz_attempts: newAttempts,
                quiz_accuracy: newAccuracy,
                last_activity: data.timestamp,
                activities: [newActivity, ...(student.activities || []).slice(0, 24)]
              };
            }
            return student;
          });
          
          console.log('📊 Updated student activities data:', updatedData);
          return updatedData;
        });
        
        // Also trigger a background refetch to ensure data consistency
        setTimeout(() => {
          queryClient.invalidateQueries(['/api/live-class-activities', selectedStudents, monitorStartTime]);
        }, 1000);
      });
      
      socket.on('content-activity', (data) => {
        console.log('⚡ Real-time content activity received:', data);
        
        // Immediately add to realtime activities
        setRealtimeActivities(prev => [data, ...prev.slice(0, 49)]);
        
        // Immediately update the query cache
        queryClient.setQueryData(['/api/live-class-activities', selectedStudents, monitorStartTime], (oldData: StudentActivity[] | undefined) => {
          if (!oldData) return oldData;
          
          return oldData.map(student => {
            if (student.student_id === data.student_id) {
              const updatedStudent = { ...student };
              
              if (data.type === 'content_view') {
                updatedStudent.content_viewed = (student.content_viewed || 0) + 1;
              } else if (data.type === 'content_rating') {
                updatedStudent.content_rated = (student.content_rated || 0) + 1;
              }
              
              updatedStudent.last_activity = data.timestamp;
              updatedStudent.activities = [data, ...(student.activities || []).slice(0, 24)];
              return updatedStudent;
            }
            return student;
          });
        });
      });
    }
    
    // Cleanup function
    return () => {
      if (socket) {
        console.log('🔌 Cleaning up WebSocket connection');
        socket.removeAllListeners();
        socket.disconnect();
      }
      if (socketRef.current === socket) {
        socketRef.current = null;
        setSocketConnected(false);
      }
    };
  }, [isMonitoring, selectedStudents, monitorStartTime, queryClient]);

  // Clear realtime activities when monitoring stops
  useEffect(() => {
    if (!isMonitoring) {
      setRealtimeActivities([]);
    }
  }, [isMonitoring]);

  // Handle component unmount (page navigation)
  useEffect(() => {
    return () => {
      // Clean up socket connection when component unmounts
      if (socketRef.current) {
        console.log('🔌 Component unmounting, cleaning up WebSocket');
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocketConnected(false);
      }
    };
  }, []);

  // Filter activities based on criteria
  const filteredActivities = useMemo(() => {
    if (!studentActivities) return [];
    return (studentActivities as StudentActivity[]).filter((activity: StudentActivity) => {
      if (activityFilter === 'active' && activity.content_viewed === 0 && activity.content_rated === 0) {
        return false;
      }
      if (activity.content_viewed < minContentViewed) return false;
      if (activity.content_rated < minContentRated) return false;
      return true;
    });
  }, [studentActivities, activityFilter, minContentViewed, minContentRated]);

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleStudentSelector = () => {
    if (!showStudentSelector && studentSelectorTriggerRef.current) {
      const rect = studentSelectorTriggerRef.current.getBoundingClientRect();
      setTriggerPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
    setShowStudentSelector(!showStudentSelector);
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((s: Student) => s.id));
    }
  };

  const removeStudent = (studentId: string) => {
    setSelectedStudents(prev => prev.filter(id => id !== studentId));
  };

  const getSelectedStudentNames = () => {
    return selectedStudents.map(id => {
      const student = (allStudents as Student[]).find((s: Student) => s.id === id);
      return student ? (student.full_name || `${student.first_name} ${student.last_name}`) : id;
    });
  };

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is on a Select dropdown or its content
      const isSelectDropdown = (target as Element)?.closest('[data-radix-popper-content-wrapper]') || 
                              (target as Element)?.closest('[role="listbox"]') ||
                              (target as Element)?.closest('[data-radix-select-trigger]') ||
                              (target as Element)?.closest('[data-radix-select-content]');
      
      // Check if click is on student selector portal or trigger
      const isStudentSelectorPortal = (target as Element)?.closest('[data-student-selector-portal]');
      const isStudentSelectorTrigger = studentSelectorTriggerRef.current?.contains(target);
      
      if (studentSelectorRef.current && !studentSelectorRef.current.contains(target) && 
          !isSelectDropdown && !isStudentSelectorPortal && !isStudentSelectorTrigger) {
        setShowStudentSelector(false);
      }
      if (configPopupRef.current && !configPopupRef.current.contains(target) && 
          !isSelectDropdown && !isStudentSelectorPortal) {
        setShowConfigPopup(false);
      }
    };

    if (showStudentSelector || showConfigPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStudentSelector, showConfigPopup]);

  const handleSelectAllVisible = () => {
    const visibleStudentIds = filteredStudents.map((s: Student) => s.id);
    const combined = [...selectedStudents, ...visibleStudentIds];
    const uniqueIds = combined.filter((id, index) => combined.indexOf(id) === index);
    setSelectedStudents(uniqueIds);
  };

  const handleCustomTimeStart = () => {
    if (selectedStudents.length === 0) return;
    setMonitorStartTime(new Date(customStartTime).toISOString());
    setIsMonitoring(true);
  };

  const applyTimePreset = (preset: string) => {
    const now = new Date();
    let targetTime: Date;
    
    switch (preset) {
      case '4pm_today':
        targetTime = new Date();
        targetTime.setHours(16, 0, 0, 0);
        break;
      case '8pm_today':
        targetTime = new Date();
        targetTime.setHours(20, 0, 0, 0);
        break;
      case 'yesterday':
        targetTime = new Date();
        targetTime.setDate(targetTime.getDate() - 1);
        targetTime.setHours(0, 0, 0, 0);
        break;
      case 'today':
        targetTime = new Date();
        targetTime.setHours(0, 0, 0, 0);
        break;
      case '7_days_ago':
        targetTime = new Date();
        targetTime.setDate(targetTime.getDate() - 7);
        targetTime.setHours(0, 0, 0, 0);
        break;
      case 'custom':
        targetTime = new Date(customStartTime);
        break;
      default: // 'now'
        targetTime = now;
    }
    
    setMonitorStartTime(targetTime.toISOString());
    if (preset === 'custom') {
      setCustomStartTime(format(targetTime, 'yyyy-MM-dd\'T\'HH:mm'));
    }
  };

  const startMonitoring = () => {
    if (selectedStudents.length === 0) return;
    if (timePreset !== 'custom') {
      applyTimePreset(timePreset);
    }
    setIsMonitoring(true);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    // Clear localStorage when stopping monitoring
    localStorage.removeItem('liveMonitor_selectedStudents');
    localStorage.removeItem('liveMonitor_startTime');
    localStorage.removeItem('liveMonitor_isMonitoring');
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'content_view': return 'bg-blue-100 text-blue-800';
      case 'content_rating': return 'bg-green-100 text-green-800';
      case 'quiz_attempt': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timestamp: string) => {
    // Handle time-only format (HH:MM:SS) from quiz activities
    if (timestamp && timestamp.match(/^[0-9]{2}:[0-9]{2}:[0-9]{2}$/)) {
      return timestamp; // Already in HH:MM:SS format
    }
    
    // Handle full timestamp format
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return timestamp; // Return as-is if can't parse
      }
      return format(date, 'HH:mm:ss');
    } catch (error) {
      return timestamp || 'Invalid time';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              <span className="text-blue-600">Live Class Monitor</span>
              {isMonitoring && (
                <div className="flex items-center gap-1">
                  <Wifi className={`h-4 w-4 ${socketConnected ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-xs ${socketConnected ? 'text-green-500' : 'text-red-500'}`}>
                    {socketConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowConfigPopup(!showConfigPopup)}
                variant="outline"
                size="sm"
                className="relative"
              >
                <Settings className="mr-2 h-4 w-4" />
                Configure
              </Button>
              {!isMonitoring ? (
                <Button
                  onClick={startMonitoring}
                  disabled={selectedStudents.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Monitoring ({selectedStudents.length} students)
                </Button>
              ) : (
                <Button
                  onClick={stopMonitoring}
                  variant="destructive"
                  size="sm"
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Stop Monitoring
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Configuration Popup */}
          {showConfigPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" ref={configPopupRef}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Monitor Configuration</h3>
                  <Button variant="outline" size="sm" onClick={() => setShowConfigPopup(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-6">
                  {/* Student Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Select Students to Monitor</label>
                    
                    {/* Selected Students Display */}
                    <div className="relative">
                      <div 
                        ref={studentSelectorTriggerRef}
                        className="min-h-12 p-3 border rounded-lg bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={toggleStudentSelector}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {selectedStudents.length === 0 ? (
                              <span className="text-gray-500">Click to select students...</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {getSelectedStudentNames().map((name, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {name}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeStudent(selectedStudents[index]);
                                      }}
                                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                                    >
                                      <X className="h-2 w-2" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <ChevronDown className={`h-4 w-4 transition-transform ${showStudentSelector ? 'transform rotate-180' : ''}`} />
                        </div>
                      </div>


                    </div>
                  </div>

                  {/* Monitor Start Time & Activity Filters */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Monitor Start Time */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Monitor Start Time
                      </label>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="text-xs text-gray-600">Time Preset:</label>
                          <Select value={timePreset} onValueChange={(value) => {
                            setTimePreset(value);
                            if (value !== 'custom') {
                              applyTimePreset(value);
                            }
                          }}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="now">Now</SelectItem>
                              <SelectItem value="4pm_today">4 PM Today</SelectItem>
                              <SelectItem value="8pm_today">8 PM Today</SelectItem>
                              <SelectItem value="today">Start of Today</SelectItem>
                              <SelectItem value="yesterday">Yesterday</SelectItem>
                              <SelectItem value="7_days_ago">7 Days Ago</SelectItem>
                              <SelectItem value="custom">Custom Time</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {timePreset === 'custom' && (
                          <div>
                            <label className="text-xs text-gray-600">Custom DateTime:</label>
                            <Input
                              type="datetime-local"
                              value={customStartTime}
                              onChange={(e) => {
                                setCustomStartTime(e.target.value);
                                setMonitorStartTime(new Date(e.target.value).toISOString());
                              }}
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Current: {format(new Date(monitorStartTime), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>

                    {/* Activity Filters */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Activity Filters
                      </label>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="text-xs text-gray-600">Activity Level:</label>
                          <Select value={activityFilter} onValueChange={setActivityFilter}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Students</SelectItem>
                              <SelectItem value="active">Active Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-600">Min Viewed:</label>
                            <Input
                              type="number"
                              min="0"
                              value={minContentViewed}
                              onChange={(e) => setMinContentViewed(parseInt(e.target.value) || 0)}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Min Rated:</label>
                            <Input
                              type="number"
                              min="0"
                              value={minContentRated}
                              onChange={(e) => setMinContentRated(parseInt(e.target.value) || 0)}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Real-time Activity Feed */}
      {isMonitoring && realtimeActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600">Live Activity Feed</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {realtimeActivities.slice(0, 10).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div className="flex items-center gap-2">
                    <Badge className={getActivityColor(activity.type)}>
                      {activity.type.replace('_', ' ')}
                    </Badge>
                    <span className="font-medium">
                      {(allStudents as Student[]).find(s => s.id === activity.student_id)?.first_name || activity.student_id}
                    </span>
                    <span>{activity.content_title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {activity.rating && (
                      <Badge variant="outline">Rating: {activity.rating}</Badge>
                    )}
                    {activity.quiz_result && (
                      <Badge variant="outline">{activity.quiz_result}</Badge>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatTime(activity.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Activities */}
      {isMonitoring && (
        <Card>
          <CardContent>
            {activitiesLoading ? (
              <div className="text-center py-8">Loading activities...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 text-blue-600">Student</th>
                      <th className="text-left p-2 text-blue-600">Viewed</th>
                      <th className="text-left p-2 text-blue-600">Rated</th>
                      <th className="text-left p-2 text-blue-600">Quiz</th>
                      <th className="text-left p-2 text-blue-600">Accuracy</th>
                      <th className="text-left p-2 text-blue-600">Last Activity</th>
                      <th className="text-left p-2 text-blue-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudents.map(studentId => {
                      const student = (allStudents as Student[]).find((s: Student) => s.id === studentId);
                      const activity = (studentActivities as StudentActivity[]).find((a: StudentActivity) => a.student_id === studentId);
                      
                      if (!student) return null;
                      
                      return (
                        <tr key={studentId} className="border-b hover:bg-gray-50">
                          <td className="px-1 py-1">
                            <div className="font-medium text-sm">
                              {activity?.first_name && activity?.last_name 
                                ? `${activity.first_name} ${activity.last_name}`
                                : activity?.full_name 
                                ? activity.full_name
                                : activity?.student_name
                                ? activity.student_name
                                : student?.first_name && student?.last_name
                                ? `${student.first_name} ${student.last_name}`
                                : student?.full_name || student?.id || 'Unknown'
                              }
                            </div>
                          </td>
                          <td className="px-1 py-1">
                            <span className="text-sm font-medium">{activity?.content_viewed || 0}</span>
                          </td>
                          <td className="px-1 py-1">
                            <span className="text-sm font-medium">{activity?.content_rated || 0}</span>
                          </td>
                          <td className="px-1 py-1">
                            <span className="text-sm font-medium">{activity?.quiz_attempts || 0}</span>
                          </td>
                          <td className="px-1 py-1">
                            <span className="text-sm font-medium">{activity?.quiz_accuracy ? `${activity.quiz_accuracy}%` : 'N/A'}</span>
                          </td>
                          <td className="px-1 py-1 text-xs">
                            {activity?.last_activity ? formatTime(activity.last_activity) : 'No activity'}
                          </td>
                          <td className="px-1 py-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => setShowActivityDetails(
                                showActivityDetails === studentId ? null : studentId
                              )}
                              disabled={!activity?.activities?.length}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Activity Details Modal */}
      {showActivityDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Activity Details - {(allStudents as Student[]).find((s: Student) => s.id === showActivityDetails)?.first_name}</span>
              <Button variant="outline" size="sm" onClick={() => setShowActivityDetails(null)}>
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(studentActivities as StudentActivity[])
                .find((a: StudentActivity) => a.student_id === showActivityDetails)
                ?.activities?.map((activity: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className={getActivityColor(activity.type)}>
                        {activity.type.replace('_', ' ')}
                      </Badge>
                      <span className="font-medium">{activity.content_title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {activity.rating && (
                        <Badge variant="outline">Rating: {activity.rating}</Badge>
                      )}
                      {activity.quiz_score && (
                        <Badge variant="outline">Score: {activity.quiz_score}%</Badge>
                      )}
                      <span className="text-sm text-gray-500">
                        {formatTime(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                )) || <div className="text-center text-gray-500">No activities yet</div>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Selector Portal - Renders outside popup */}
      {showStudentSelector && triggerPosition && createPortal(
        <div 
          ref={studentSelectorRef}
          data-student-selector-portal
          className="fixed bg-white border rounded-lg shadow-lg z-50"
          style={{
            top: triggerPosition.top,
            left: triggerPosition.left,
            width: triggerPosition.width,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3 space-y-3">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={studentsLoading}
              >
                {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedStudents([])}
                disabled={selectedStudents.length === 0}
              >
                Clear Selection
              </Button>
            </div>
            
            {/* Student List */}
            <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-lg border">
              {studentsLoading ? (
                <div className="text-center text-gray-500 py-6">Loading students...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center text-gray-500 py-6">No students found</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredStudents.map((student: Student) => (
                    <div key={student.id} className="flex items-center p-3 hover:bg-gray-100 transition-colors">
                      <Checkbox
                        id={`popup-${student.id}`}
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => handleStudentToggle(student.id)}
                        className="mr-3"
                      />
                      <label
                        htmlFor={`popup-${student.id}`}
                        className="text-sm cursor-pointer flex-1 truncate font-medium"
                        title={student.full_name || `${student.first_name} ${student.last_name}`}
                      >
                        {student.full_name || `${student.first_name} ${student.last_name}`}
                      </label>
                      <span className="text-xs text-gray-400 ml-2">{student.id}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Selection Summary */}
            <div className="text-xs text-gray-600 text-center">
              {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default LiveClassMonitor;