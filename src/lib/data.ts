import { supabase } from './supabase';
import type { Appointment, Assignment, Course, Submission } from '@/types';

export interface CourseProgress {
  course: Course;
  totalLessons: number;
  completedLessons: number;
  percent: number;
}

export interface AssignmentWithMeta extends Assignment {
  lessonTitle: string;
  courseId: string;
  courseName: string;
  submission: Submission | null;
}

export interface StudentOverview {
  courses: CourseProgress[];
  assignments: AssignmentWithMeta[];
  completedLessons: number;
  totalLessons: number;
  averageScore: number | null;
  pendingAssignments: number;
  graded: AssignmentWithMeta[];
}

/** Everything needed to show a student's progress (used by student & staff views; RLS scopes the data). */
export async function loadStudentOverview(studentId: string): Promise<StudentOverview> {
  const { data: enrollRows } = await supabase
    .from('enrollments')
    .select('course_id, status, courses(*)')
    .eq('student_id', studentId)
    .neq('status', 'DROPPED');

  const courses = ((enrollRows ?? []) as unknown as { courses: Course | null }[])
    .map((r) => r.courses)
    .filter((c): c is Course => !!c);
  const courseIds = courses.map((c) => c.id);

  const [lessonsRes, progressRes, assignmentsRes, submissionsRes] = await Promise.all([
    courseIds.length ? supabase.from('lessons').select('id, course_id, title').in('course_id', courseIds) : Promise.resolve({ data: [] }),
    supabase.from('lesson_progress').select('lesson_id, is_completed').eq('student_id', studentId).eq('is_completed', true),
    courseIds.length
      ? supabase.from('lesson_assignments').select('*, lessons!inner(title, course_id)').in('lessons.course_id', courseIds)
      : Promise.resolve({ data: [] }),
    supabase.from('submissions').select('*').eq('student_id', studentId),
  ]);

  const lessons = (lessonsRes.data ?? []) as { id: string; course_id: string; title: string }[];
  const completedSet = new Set(((progressRes.data ?? []) as { lesson_id: string }[]).map((p) => p.lesson_id));
  const submissions = (submissionsRes.data ?? []) as Submission[];
  const subByAssignment = new Map(submissions.map((s) => [s.assignment_id, s]));
  const courseName = new Map(courses.map((c) => [c.id, c.name]));

  const courseProgress: CourseProgress[] = courses.map((course) => {
    const ls = lessons.filter((l) => l.course_id === course.id);
    const done = ls.filter((l) => completedSet.has(l.id)).length;
    return { course, totalLessons: ls.length, completedLessons: done, percent: ls.length ? (done / ls.length) * 100 : 0 };
  });

  const assignments: AssignmentWithMeta[] = (
    (assignmentsRes.data ?? []) as (Assignment & { lessons: { title: string; course_id: string } })[]
  )
    .map((a) => ({
      ...a,
      lessonTitle: a.lessons.title,
      courseId: a.lessons.course_id,
      courseName: courseName.get(a.lessons.course_id) ?? '',
      submission: subByAssignment.get(a.id) ?? null,
    }))
    .sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999'));

  const graded = assignments.filter((a) => a.submission?.score != null);
  const averageScore = graded.length
    ? graded.reduce((sum, a) => sum + ((a.submission!.score ?? 0) / (a.total_points || 100)) * 100, 0) / graded.length
    : null;

  return {
    courses: courseProgress,
    assignments,
    completedLessons: lessons.filter((l) => completedSet.has(l.id)).length,
    totalLessons: lessons.length,
    averageScore,
    pendingAssignments: assignments.filter((a) => !a.submission).length,
    graded,
  };
}

export async function loadUpcomingAppointments(limit = 5): Promise<Appointment[]> {
  const { data } = await supabase
    .from('appointments')
    .select('*')
    .gte('scheduled_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .neq('status', 'CANCELLED')
    .order('scheduled_at', { ascending: true })
    .limit(limit);
  return (data ?? []) as Appointment[];
}
