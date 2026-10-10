export type UserRole = 'COACH' | 'TEACHER' | 'STUDENT';
export type UserGrade = '12' | 'MEZUN';
export type YksField = 'SAY' | 'EA' | 'SOZ' | 'DIL';
export type ThemeMode = 'light' | 'sky' | 'anthracite' | 'wine' | 'mint' | 'dark' | 'sapphire';
export type ScreenScaleLevel = 1 | 2 | 3;

export interface Profile {
  id: string;
  auth_id: string;
  name: string;
  email: string;
  role: UserRole;
  grade: UserGrade | null;
  field: YksField | null;
  target_score: string | null;
  phone: string | null;
  avatar: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export type CourseType = 'GROUP' | 'INDIVIDUAL';

export interface Course {
  id: string;
  coach_id: string;
  name: string;
  description: string | null;
  subject: string;
  level: '12' | 'MEZUN' | 'BOTH' | null;
  type: CourseType;
  max_students: number | null;
  start_date: string | null;
  end_date: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export type LessonType = 'LIVE' | 'RECORDED' | 'TEXT';

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  content_type: LessonType;
  video_url: string | null;
  duration_minutes: number | null;
  order_number: number | null;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED';
  enrolled_at: string;
}

export type AssignmentType = 'HOMEWORK' | 'TEST' | 'QUIZ' | 'EXERCISE';

export interface Assignment {
  id: string;
  lesson_id: string;
  title: string;
  description: string | null;
  assignment_type: AssignmentType;
  due_date: string | null;
  total_points: number;
  created_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string;
  file_url: string | null;
  submitted_at: string | null;
  score: number | null;
  feedback: string | null;
  graded_at: string | null;
}

export interface LessonProgress {
  id: string;
  student_id: string;
  lesson_id: string;
  is_completed: boolean;
  completed_at: string | null;
}

export type AppointmentType = 'SESSION' | 'MEETING' | 'REVIEW';

export interface Appointment {
  id: string;
  course_id: string | null;
  coach_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  type: AppointmentType;
  meeting_url: string | null;
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export const ROLE_LABEL: Record<UserRole, string> = {
  COACH: 'Koç',
  TEACHER: 'Öğretmen',
  STUDENT: 'Öğrenci',
};

export const YKS_SUBJECTS = [
  'TYT Türkçe',
  'TYT Matematik',
  'TYT Geometri',
  'TYT Fizik',
  'TYT Kimya',
  'TYT Biyoloji',
  'TYT Tarih',
  'TYT Coğrafya',
  'TYT Felsefe',
  'TYT Din Kültürü',
  'AYT Matematik',
  'AYT Fizik',
  'AYT Kimya',
  'AYT Biyoloji',
  'AYT Edebiyat',
  'AYT Tarih',
  'AYT Coğrafya',
  'AYT Felsefe Grubu',
  'YDT İngilizce',
  'Rehberlik & Koçluk',
] as const;

export const LESSON_TYPE_LABEL: Record<LessonType, string> = {
  LIVE: 'Canlı Ders',
  RECORDED: 'Kayıtlı Video',
  TEXT: 'Metin / Doküman',
};

export const ASSIGNMENT_TYPE_LABEL: Record<AssignmentType, string> = {
  HOMEWORK: 'Ödev',
  TEST: 'Deneme / Test',
  QUIZ: 'Quiz',
  EXERCISE: 'Alıştırma',
};

export const APPOINTMENT_TYPE_LABEL: Record<AppointmentType, string> = {
  SESSION: 'Ders Oturumu',
  MEETING: 'Koçluk Görüşmesi',
  REVIEW: 'Değerlendirme',
};
