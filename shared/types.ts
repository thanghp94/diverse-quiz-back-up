
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  meraki_email?: string;
  email?: string;
  category?: string;
  show?: string;
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
  challengesubject?: string[];
  parentid?: string;
}

export interface WritingSubmission {
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

export type ActiveTab = 'students' | 'topics' | 'content' | 'questions' | 'matching' | 'writing-submissions';
