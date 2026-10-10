import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  GraduationCap,
  Plus,
  Users,
  MessageSquare,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import AppointmentList from '@/components/AppointmentList';
import { Avatar, Badge, Card, EmptyState, LoadingBlock, PageHeader, ProgressBar, StatCard, formatDate, relativeTime } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { loadStudentOverview, loadUpcomingAppointments, type StudentOverview } from '@/lib/data';
import { ASSIGNMENT_TYPE_LABEL, type Appointment, type Profile } from '@/types';

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return 'İyi geceler';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

export default function Panel() {
  const { profile } = useAuth();
  return (
    <AppLayout title="Genel Bakış">
      {profile && (profile.role === 'STUDENT' ? <StudentPanel profile={profile} /> : <StaffPanel profile={profile} />)}
    </AppLayout>
  );
}

/* ------------------------------ Student ------------------------------ */

function StudentPanel({ profile }: { profile: Profile }) {
  const [data, setData] = useState<StudentOverview | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    loadStudentOverview(profile.id).then(setData);
    loadUpcomingAppointments(4).then(setAppointments);
  }, [profile.id]);

  const firstName = profile.name.split(' ')[0];

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description={profile.grade === 'MEZUN' ? 'Mezun · YKS hazırlık' : '12. sınıf · YKS hazırlık'}
        action={
          <Link href="/mesajlar" className="btn-secondary">
            <MessageSquare className="h-4 w-4" /> Koçuma yaz
          </Link>
        }
      />
      {!data ? (
        <LoadingBlock />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Aktif kurs" value={data.courses.length} icon={BookOpen} tone="indigo" />
            <StatCard label="Tamamlanan ders" value={`${data.completedLessons}/${data.totalLessons}`} icon={CheckCircle2} tone="emerald" />
            <StatCard label="Bekleyen ödev" value={data.pendingAssignments} icon={ClipboardList} tone="amber" />
            <StatCard
              label="Ortalama puan"
              value={data.averageScore != null ? Math.round(data.averageScore) : '—'}
              icon={Award}
              tone="violet"
              hint={data.graded.length ? `${data.graded.length} notlandırılmış çalışma` : 'Henüz not yok'}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card
              title="Kurs ilerlemem"
              className="lg:col-span-2"
              action={
                <Link href="/ilerleme" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  Detaylı rapor
                </Link>
              }
            >
              {data.courses.length === 0 ? (
                <EmptyState icon={GraduationCap} title="Henüz bir kursa kayıtlı değilsin" description="Koçun seni kurslara ekleyince burada görünecek. Açık kurslara kendin de katılabilirsin." action={<Link href="/kurslar" className="btn-primary">Kurslara göz at</Link>} />
              ) : (
                <ul className="space-y-5">
                  {data.courses.map((c) => (
                    <li key={c.course.id}>
                      <Link href={`/kurslar/${c.course.id}`} className="group block">
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600">{c.course.name}</p>
                            <p className="text-xs text-slate-500">
                              {c.course.subject} · {c.completedLessons}/{c.totalLessons} ders
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-slate-700">%{Math.round(c.percent)}</span>
                        </div>
                        <ProgressBar value={c.percent} tone={c.percent >= 100 ? 'emerald' : 'indigo'} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="Yaklaşan oturumlar" action={<Link href="/takvim" className="text-sm font-medium text-indigo-600">Takvim</Link>}>
              <AppointmentList items={appointments} emptyText="Koçun bir görüşme planladığında burada görünecek." />
            </Card>
          </div>

          <Card title="Yapılacak ödevler" padded={false} action={<Link href="/odevler" className="text-sm font-medium text-indigo-600">Tümü</Link>}>
            {data.assignments.filter((a) => !a.submission).length === 0 ? (
              <EmptyState icon={CheckCircle2} title="Bekleyen ödevin yok" description="Harika, tüm ödevlerin teslim edilmiş." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.assignments
                  .filter((a) => !a.submission)
                  .slice(0, 5)
                  .map((a) => {
                    const overdue = a.due_date && new Date(a.due_date) < new Date();
                    return (
                      <li key={a.id}>
                        <Link href="/odevler" className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50">
                          <div className="rounded-lg bg-amber-50 p-2 text-amber-600 ring-1 ring-amber-100">
                            <ClipboardList className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">{a.title}</p>
                            <p className="text-xs text-slate-500">
                              {a.courseName} · {ASSIGNMENT_TYPE_LABEL[a.assignment_type]}
                            </p>
                          </div>
                          <span className={`flex items-center gap-1 text-xs font-medium ${overdue ? 'text-rose-600' : 'text-slate-500'}`}>
                            <Clock className="h-3.5 w-3.5" />
                            {a.due_date ? formatDate(a.due_date, { day: 'numeric', month: 'short' }) : 'Süresiz'}
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  );
}

/* ------------------------------ Coach / Teacher ------------------------------ */

interface RecentSubmission {
  id: string;
  submitted_at: string | null;
  score: number | null;
  student: { id: string; name: string } | null;
  lesson_assignments: { title: string; total_points: number } | null;
}

function StaffPanel({ profile }: { profile: Profile }) {
  const [stats, setStats] = useState<{ students: number; courses: number; pending: number; week: number } | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [submissions, setSubmissions] = useState<RecentSubmission[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);

  useEffect(() => {
    const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString();
    Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'STUDENT'),
      supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('submissions').select('id', { count: 'exact', head: true }).is('score', null).not('submitted_at', 'is', null),
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_at', new Date().toISOString())
        .lte('scheduled_at', weekEnd)
        .neq('status', 'CANCELLED'),
    ]).then(([s, c, p, w]) => setStats({ students: s.count ?? 0, courses: c.count ?? 0, pending: p.count ?? 0, week: w.count ?? 0 }));

    loadUpcomingAppointments(5).then(setAppointments);

    supabase
      .from('submissions')
      .select('id, submitted_at, score, student:users!submissions_student_id_fkey(id, name), lesson_assignments(title, total_points)')
      .not('submitted_at', 'is', null)
      .order('submitted_at', { ascending: false })
      .limit(6)
      .then(({ data }) => setSubmissions((data ?? []) as unknown as RecentSubmission[]));

    supabase
      .from('users')
      .select('*')
      .eq('role', 'STUDENT')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setStudents((data ?? []) as Profile[]));
  }, []);

  const isCoach = profile.role === 'COACH';

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${profile.name.split(' ')[0]}`}
        description={isCoach ? 'Koçluk programının genel durumu' : 'Derslerin ve öğrencilerinin durumu'}
        action={
          <>
            <Link href="/takvim?yeni=1" className="btn-secondary">
              <CalendarDays className="h-4 w-4" /> Oturum planla
            </Link>
            {isCoach && (
              <Link href="/kurslar?yeni=1" className="btn-primary">
                <Plus className="h-4 w-4" /> Yeni kurs
              </Link>
            )}
          </>
        }
      />

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Toplam öğrenci" value={stats?.students ?? '—'} icon={Users} tone="indigo" />
          <StatCard label="Aktif kurs" value={stats?.courses ?? '—'} icon={BookOpen} tone="sky" />
          <StatCard label="Değerlendirme bekleyen" value={stats?.pending ?? '—'} icon={ClipboardList} tone="amber" hint="Notlanmamış teslimler" />
          <StatCard label="Bu haftaki oturum" value={stats?.week ?? '—'} icon={CalendarDays} tone="violet" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card title="Son teslimler" className="lg:col-span-2" padded={false} action={<Link href="/odevler" className="text-sm font-medium text-indigo-600">Tümü</Link>}>
            {submissions.length === 0 ? (
              <EmptyState icon={ClipboardList} title="Henüz teslim yok" description="Öğrenciler ödev teslim ettikçe burada listelenecek." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {submissions.map((s) => (
                  <li key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                    <Avatar name={s.student?.name ?? '?'} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{s.student?.name}</p>
                      <p className="truncate text-xs text-slate-500">{s.lesson_assignments?.title}</p>
                    </div>
                    <span className="hidden text-xs text-slate-400 sm:block">{s.submitted_at && relativeTime(s.submitted_at)}</span>
                    {s.score != null ? (
                      <Badge tone="emerald">
                        {s.score}/{s.lesson_assignments?.total_points ?? 100}
                      </Badge>
                    ) : (
                      <Badge tone="amber">Notlanacak</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Yaklaşan oturumlar" action={<Link href="/takvim" className="text-sm font-medium text-indigo-600">Takvim</Link>}>
            <AppointmentList items={appointments} emptyText="Takvimden yeni bir oturum planlayabilirsin." />
          </Card>
        </div>

        <Card title="Yeni katılan öğrenciler" padded={false} action={<Link href="/ogrenciler" className="text-sm font-medium text-indigo-600">Tüm öğrenciler</Link>}>
          {students.length === 0 ? (
            <EmptyState icon={Users} title="Henüz öğrenci yok" description="Öğrenciler kayıt oldukça burada görünecek. Kayıt bağlantısı: /kayit" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {students.map((s) => (
                <li key={s.id}>
                  <Link href={`/ogrenciler/${s.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50">
                    <Avatar name={s.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{s.name}</p>
                      <p className="truncate text-xs text-slate-500">{s.email}</p>
                    </div>
                    <Badge tone={s.grade === 'MEZUN' ? 'violet' : 'sky'}>{s.grade === 'MEZUN' ? 'Mezun' : '12. sınıf'}</Badge>
                    <span className="hidden text-xs text-slate-400 sm:block">{relativeTime(s.created_at)}</span>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
