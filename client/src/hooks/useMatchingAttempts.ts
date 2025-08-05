import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface MatchingAttempt {
  id: string;
  student_id: string;
  matching_id: string;
  answers: any; // JSON data containing the matching pairs
  score: number | null;
  max_score: number | null;
  is_correct: boolean | null;
  time_start: Date;
  time_end: Date | null;
  duration_seconds: number | null;
  attempt_number: number;
  created_at: Date;
}

export interface CreateMatchingAttempt {
  id: string;
  student_id: string;
  matching_id: string;
  answers?: any;
  score?: number;
  max_score?: number;
  is_correct?: boolean;
  time_start?: Date;
  time_end?: Date;
  duration_seconds?: number;
  attempt_number?: number;
}

export const useMatchingAttempts = (studentId: string, matchingId?: string) => {
  return useQuery({
    queryKey: ['/api/matching-attempts/student', studentId, matchingId],
    queryFn: () => apiRequest(`/api/matching-attempts/student/${studentId}${matchingId ? `?matchingId=${matchingId}` : ''}`),
    enabled: !!studentId,
  });
};

export const useCreateMatchingAttempt = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (attempt: CreateMatchingAttempt) => 
      apiRequest('/api/matching-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attempt),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/matching-attempts/student', variables.student_id] });
    },
  });
};

export const useUpdateMatchingAttempt = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<MatchingAttempt> }) =>
      apiRequest(`/api/matching-attempts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/matching-attempts'] });
    },
  });
};

export const useMatchingAttempt = (id: string) => {
  return useQuery({
    queryKey: ['/api/matching-attempts', id],
    queryFn: () => apiRequest(`/api/matching-attempts/${id}`),
    enabled: !!id,
  });
};