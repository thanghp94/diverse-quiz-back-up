import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, FileText, Eye } from 'lucide-react';

interface WritingSubmission {
  id: string;
  student_id: string;
  prompt_id: string;
  title: string;
  opening_paragraph: string;
  body_paragraph_1: string;
  body_paragraph_2: string;
  body_paragraph_3: string;
  conclusion_paragraph: string;
  full_essay: string;
  ai_feedback: any;
  overall_score: number;
  word_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface WritingSubmissionsTableProps {
  submissions: WritingSubmission[] | undefined;
  searchTerm: string;
  allUsers: any[] | undefined;
  onViewSubmission: (submission: WritingSubmission) => void;
}

export const WritingSubmissionsTable: React.FC<WritingSubmissionsTableProps> = ({
  submissions,
  searchTerm,
  allUsers,
  onViewSubmission
}) => {
  console.log('WritingSubmissionsTable received:', { 
    submissions: submissions?.length, 
    searchTerm, 
    allUsers: allUsers?.length 
  });
  const getStudentName = (studentId: string) => {
    const user = allUsers?.find(u => u.id === studentId);
    return user?.full_name || user?.first_name || studentId;
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'submitted':
        return 'bg-blue-500';
      case 'graded':
        return 'bg-green-500';
      case 'draft':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const filteredSubmissions = submissions?.filter(submission =>
    getStudentName(submission.student_id)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.id?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Student</th>
            <th className="text-left p-2">Title</th>
            <th className="text-left p-2">Word Count</th>
            <th className="text-left p-2">Score</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Submitted</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredSubmissions.map((submission) => (
            <tr key={submission.id} className="border-b hover:bg-gray-50">
              <td className="p-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{getStudentName(submission.student_id)}</span>
                </div>
                <div className="text-xs text-gray-500">ID: {submission.student_id}</div>
              </td>
              <td className="p-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{submission.title}</span>
                </div>
                <div className="text-xs text-gray-500">ID: {submission.id}</div>
              </td>
              <td className="p-2">
                <Badge variant="outline">
                  {submission.word_count} words
                </Badge>
              </td>
              <td className="p-2">
                {submission.overall_score !== null && submission.overall_score !== undefined ? (
                  <div className={`font-semibold ${getScoreColor(submission.overall_score)}`}>
                    {submission.overall_score}%
                  </div>
                ) : (
                  <span className="text-gray-400">Not graded</span>
                )}
              </td>
              <td className="p-2">
                <Badge variant="secondary" className={`${getStatusColor(submission.status)} text-white`}>
                  {submission.status || 'Unknown'}
                </Badge>
              </td>
              <td className="p-2">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Calendar className="h-3 w-3" />
                  {formatDate(submission.created_at)}
                </div>
                {submission.updated_at !== submission.created_at && (
                  <div className="text-xs text-gray-400">
                    Updated: {formatDate(submission.updated_at)}
                  </div>
                )}
              </td>
              <td className="p-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewSubmission(submission)}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {filteredSubmissions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No writing submissions found
        </div>
      )}
    </div>
  );
};