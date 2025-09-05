export interface Team {
  id: string;
  name?: string;
  round?: string;
  year?: string;
  created_at?: Date | null;
  updated_at?: Date | null;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role?: string;
  created_at?: Date | null;
  updated_at?: Date | null;
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
