export type UserRole = 'STUDENT' | 'CONSULTANT';
export type UserGrade = '12' | 'MEZUN';
export type TaskCategory = 'lecture' | 'practice' | 'exam' | 'group_session' | 'private_tutoring' | 'mentor_session' | 'review';
export type DeficiencyStatus = 'PENDING' | 'ACTIVE' | 'RESOLVED';
export type ThemeMode = 'light' | 'sky' | 'anthracite' | 'wine' | 'mint' | 'dark' | 'sapphire';
export type ScreenScaleLevel = 1 | 2 | 3;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  grade: UserGrade;
  avatar: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_time: string; // HH:mm format
  end_time: string;   // HH:mm format
  category: TaskCategory;
  date: string;       // YYYY-MM-DD format
  is_completed: boolean;
  is_locked?: boolean;
  is_rescheduled?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Deficiency {
  id: string;
  user_id: string;
  subject: string;
  description?: string;
  status: DeficiencyStatus;
  created_at: string;
  updated_at: string;
}

export interface ScheduleBlock {
  id: string;
  user_id: string;
  title: string;
  start_date: string;
  end_date: string;
  focus_area: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  created_at: string;
}
