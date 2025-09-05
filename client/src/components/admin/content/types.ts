export interface Topic {
  id: string;
  topic: string;
  short_summary?: string;
  created_at?: Date | null;
  updated_at?: Date | null;
}

export interface Content {
  id: string;
  title?: string;
  description?: string;
  topicid?: string;
  created_at?: Date | null;
  updated_at?: Date | null;
}

export interface ActiveTab {
  value: string;
  label: string;
}

export interface User {
  id: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
}
