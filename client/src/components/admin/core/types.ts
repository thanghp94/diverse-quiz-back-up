export interface User {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  meraki_email?: string;
  category?: string;
  show?: boolean;
  medal_results_jsonb?: any;
}

export interface Topic {
  id: string;
  topic: string;
  short_summary?: string;
  challengesubject?: string;
  image?: string;
  parentid?: string;
  showstudent?: boolean;
}

export interface Content {
  id: string;
  topicid: string;
  title?: string;
  short_blurb?: string;
  information?: string;
  prompt?: string;
}

export interface Question {
  id: string;
  contentid: string;
  topicid?: string;
  question: string;
  level?: string;
  type?: string;
}

export interface Match {
  id: string;
  type?: string;
  subject?: string;
  topic?: string;
  description?: string;
  topicid: string;
  created_at?: string;
}

export interface Assignment {
  id: string;
  assignmentname?: string;
  category?: string;
  contentid?: string;
  description?: string;
  expiring_date?: string;
  noofquestion?: number;
  status?: string;
  subject?: string;
  testtype?: string;
  topicid?: string;
  type?: string;
  typeofquestion?: string;
  created_at?: string;
}

export interface Team {
  id: string;
  name: string | null;
  created_at: string | null;
  updated_at: string | null;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  userId: string;
  createdAt: string | null;
  first_name?: string;
  last_name?: string;
  full_name?: string;
}

export type ActiveTab = 'students' | 'topics' | 'content' | 'assignments' | 'questions' | 'matching' | 'writing-submissions' | 'content-hierarchy' | 'collections' | 'team' | 'debates' | 'team-management';

export interface HierarchyNodeProps {
  node: any;
  level: number;
  onContentReorder?: (items: Array<{ id: string; position: number }>) => void;
}