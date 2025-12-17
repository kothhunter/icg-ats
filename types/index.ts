export interface Note {
  author_id: string;
  author_name: string;
  content: string;
  created_at: Date;
}

export interface FRQQuestion {
  id: string;
  question: string;
  max_chars: number;
}

export interface Applicant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  major: string;
  graduation_year: number;
  resume_url: string | null;
  frq_responses: Record<string, string>;
  available_slots: string[];
  status: 'applied' | 'rejected' | 'interviewing' | 'scheduled' | 'rejected_after_interview' | 'accepted';
  assigned_slot: string | null;
  notes: Note[];
  applied_date: Date;
  last_updated: Date;
}

export interface Officer {
  id: string;
  username: string;
  password_hash: string;
  display_name: string;
  created_at: Date;
}

export interface TimeSlot {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  display_label: string;
  max_capacity: number;
  is_active: boolean;
}

export interface Config {
  id: string;
  cycle_name: string;
  applications_open: boolean;
  frq_questions: FRQQuestion[];
  email_templates: {
    interview: string;
    rejected: string;
    rejected_after_interview: string;
    accepted: string;
  };
}
