import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ClipboardPlus,
  ExternalLink,
  FileText,
  Plus,
  Radio,
  Trash2,
  UserPlus,
  Users,
  Video,
  Power,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Alert, Avatar, Badge, Card, EmptyState, Field, LoadingBlock, Modal, ProgressBar, Spinner, formatDate } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { courseGradient } from '@/components/courseStyle';
import PickUsersModal from '@/components/PickUsersModal';
import { ASSIGNMENT_TYPE_LABEL, LESSON_TYPE_LABEL, type Assignment, type Course, type Lesson, type LessonType, type Profile } from '@/types';

const LESSON_ICON = { LIVE: Radio, RECORDED: Video, TEXT: FileText } as const;
const LESSON_TONE = { LIVE: 'rose', RECORDED: 'indigo', TEXT: 'sky' } as const;

export default function CourseDetail() {
  const router = useRouter();
  const id = router.query.id as string | undefined;
  const { profile } = useAuth();
  const [course, setCourse] = useState<Course | null | undefined>(undefined);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [students, setStudents] = useState<Profile[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [lessonModal, setLessonModal] = useState(false);
  const [assignFor, setAssignFor] = useState<Lesson | null>(null);
  const [enrollModal, setEnrollModal] = useState(false);
  const [teacherModal, setTeacherModal] = useState(false);

  const isStaff = profile?.role === 'COACH' || profile?.role === 'TEACHER';
  const isCoach = profile?.role === 'COACH';

  const load = useCallback(async () => {
    if (!id || !profile) return;
    const { data: c } = await supabase.from('courses').select('*').eq('id', id).maybeSingle();
    setCourse((c as Course) ?? null);
    if (!c) return;

    const { data: ls } = await supabase.from('lessons').select('*').eq('course_id', id).order('order_number', { ascending: true }).order('created_at');
    const lessonList = (ls ?? []) as Lesson[];
    setLessons(lessonList);

    const lessonIds = lessonList.map((l) => l.id);
    if (lessonIds.length) {
      const { data: as } = await supabase.from('lesson_assignments').select('*').in('lesson_id', lessonIds).order('due_date');
      setAssignments((as ?? []) as Assignment[]);
    } else setAssignments([]);

    if (profile.role === 'STUDENT') {
      const { data: pr } = await supabase.from('lesson_progress').select('lesson_id').eq('student_id', profile.id).eq('is_completed', true);
      setCompleted(new Set((pr ?? []).map((p: { lesson_id: string }) => p.lesson_id)));
    } else {
      const [{ data: en }, { data: ct }] = await Promise.all([
        supabase.from('enrollments').select('users!enrollments_student_id_fkey(*)').eq('course_id', id).neq('status', 'DROPPED'),
        supabase.from('course_teachers').select('users!course_teachers_teacher_id_fkey(*)').eq('course_id', id),
      ]);
      setStudents(((en ?? []) as unknown as { users: Profile }[]).map((r) => r.users).filter(Boolean));
      setTeachers(((ct ?? []) as unknown as { users: Profile }[]).map((r) => r.users).filter(Boolean));
    }
  }, [id, profile]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleComplete = async (lesson: Lesson) => {
    if (!profile) return;
    const done = !completed.has(lesson.id);
    setCompleted((s) => {
      const n = new Set(s);
      done ? n.add(lesson.id) : n.delete(lesson.id);
      return n;
    });
    await supabase.from('lesson_progress').upsert(
      { student_id: profile.id, lesson_id: lesson.id, is_completed: done, completed_at: done ? new Date().toISOString() : null },
      { onConflict: 'student_id,lesson_id' }
    );
  };

  const deleteLesson = async (lesson: Lesson) => {
    if (!confirm(`"${lesson.title}" dersini silmek istediğine emin misin? Derse bağlı ödevler de silinir.`)) return;
    await supabase.from('lessons').delete().eq('id', lesson.id);
    load();
  };

  const removeStudent = async (studentId: string) => {
    if (!course || !confirm('Öğrenciyi bu kurstan çıkarmak istiyor musun?')) return;
    await supabase.from('enrollments').delete().eq('course_id', course.id).eq('student_id', studentId);
    load();
  };

  const toggleActive = async () => {
    if (!course) return;
    await supabase.from('courses').update({ is_active: !course.is_active }).eq('id', course.id);
    load();
  };

  if (course === undefined) return <AppLayout title="Kurs"><LoadingBlock /></AppLayout>;
  if (course === null)
    return (
      <AppLayout title="Kurs">
        <div className="card">
          <EmptyState icon={FileText} title="Kurs bulunamadı" description="Bu kursa erişimin olmayabilir." action={<Link href="/kurslar" className="btn-secondary">Kurslara dön</Link>} />
        </div>
      </AppLayout>
    );

  const percent = lessons.length ? (lessons.filter((l) => completed.has(l.id)).length / lessons.length) * 100 : 0;

  return (
    <AppLayout title={course.name}>
      <Link href="/kurslar" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Kurslar
      </Link>

      <div className={`relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br ${courseGradient(course.subject)} p-6 text-white shadow-sm sm:p-8`}>
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">{course.subject}</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">{course.type === 'GROUP' ? 'Grup dersi' : 'Birebir koçluk'}</span>
              {!course.is_active && <span className="rounded-full bg-slate-900/40 px-3 py-1 text-xs font-medium">Pasif</span>}
            </div>
            <h1 className="mt-4 text-2xl font-bold sm:text-3xl">{course.name}</h1>
            {course.description && <p className="mt-2 max-w-2xl text-sm text-white/80">{course.description}</p>}
            {(course.start_date || course.end_date) && (
              <p className="mt-3 text-xs text-white/70">
                {formatDate(course.start_date)} – {formatDate(course.end_date)}
              </p>
            )}
          </div>
          {profile?.role === 'STUDENT' ? (
            <div className="w-full rounded-xl bg-white/15 p-4 backdrop-blur sm:w-64">
              <div className="mb-2 flex justify-between text-sm">
                <span>İlerlemen</span>
                <span className="font-semibold">%{Math.round(percent)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/20">
                <div className="h-2 rounded-full bg-white transition-all" style={{ width: `${percent}%` }} />
              </div>
            </div>
          ) : (
            isCoach && (
              <button onClick={toggleActive} className="btn bg-white/15 text-white backdrop-blur hover:bg-white/25">
                <Power className="h-4 w-4" /> {course.is_active ? 'Pasife al' : 'Aktifleştir'}
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          title={`Dersler (${lessons.length})`}
          className="lg:col-span-2"
          padded={false}
          action={
            isStaff && (
              <button onClick={() => setLessonModal(true)} className="btn-primary px-3 py-2">
                <Plus className="h-4 w-4" /> Ders ekle
              </button>
            )
          }
        >
          {lessons.length === 0 ? (
            <EmptyState icon={Video} title="Henüz ders eklenmemiş" description={isStaff ? 'Canlı ders, kayıtlı video veya metin içerik ekleyebilirsin.' : 'Dersler eklendiğinde burada görünecek.'} />
          ) : (
            <ol className="divide-y divide-slate-100">
              {lessons.map((l, i) => {
                const Icon = LESSON_ICON[l.content_type];
                const done = completed.has(l.id);
                const las = assignments.filter((a) => a.lesson_id === l.id);
                return (
                  <li key={l.id} className="px-5 py-4">
                    <div className="flex items-start gap-4">
                      {profile?.role === 'STUDENT' ? (
                        <button onClick={() => toggleComplete(l)} className="mt-0.5 shrink-0" title={done ? 'Tamamlanmadı olarak işaretle' : 'Tamamladım'}>
                          {done ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <Circle className="h-6 w-6 text-slate-300 hover:text-indigo-400" />}
                        </button>
                      ) : (
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{i + 1}</span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`text-sm font-semibold ${done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{l.title}</p>
                          <Badge tone={LESSON_TONE[l.content_type]}>
                            <Icon className="mr-1 h-3 w-3" /> {LESSON_TYPE_LABEL[l.content_type]}
                          </Badge>
                          {l.duration_minutes && <span className="text-xs text-slate-400">{l.duration_minutes} dk</span>}
                        </div>
                        {l.description && <p className="mt-1 whitespace-pre-line text-sm text-slate-500">{l.description}</p>}
                        {las.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {las.map((a) => (
                              <Link key={a.id} href="/odevler" className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100 hover:bg-amber-100">
                                <ClipboardPlus className="h-3 w-3" /> {ASSIGNMENT_TYPE_LABEL[a.assignment_type]}: {a.title}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {l.video_url && (
                          <a href={l.video_url} target="_blank" rel="noreferrer" className="btn-secondary px-3 py-1.5 text-xs">
                            {l.content_type === 'LIVE' ? 'Katıl' : 'Aç'} <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {isStaff && (
                          <>
                            <button onClick={() => setAssignFor(l)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600" title="Ödev / test ekle">
                              <ClipboardPlus className="h-4 w-4" />
                            </button>
                            <button onClick={() => deleteLesson(l)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Dersi sil">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>

        {isStaff ? (
          <div className="space-y-6">
            <Card
              title={`Öğrenciler (${students.length}${course.max_students ? `/${course.max_students}` : ''})`}
              padded={false}
              action={
                <button onClick={() => setEnrollModal(true)} className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50" title="Öğrenci ekle">
                  <UserPlus className="h-4 w-4" />
                </button>
              }
            >
              {students.length === 0 ? (
                <EmptyState icon={Users} title="Kayıtlı öğrenci yok" />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {students.map((s) => (
                    <li key={s.id} className="group flex items-center gap-3 px-5 py-3">
                      <Avatar name={s.name} size="sm" />
                      <Link href={`/ogrenciler/${s.id}`} className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900 hover:text-indigo-600">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.grade === 'MEZUN' ? 'Mezun' : '12. sınıf'}</p>
                      </Link>
                      <button onClick={() => removeStudent(s.id)} className="rounded-lg p-1.5 text-slate-300 opacity-0 hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100" title="Kurstan çıkar">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card
              title="Öğretmenler"
              padded={false}
              action={
                isCoach && (
                  <button onClick={() => setTeacherModal(true)} className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50" title="Öğretmen ata">
                    <UserPlus className="h-4 w-4" />
                  </button>
                )
              }
            >
              {teachers.length === 0 ? (
                <p className="px-5 py-6 text-center text-sm text-slate-500">Atanmış öğretmen yok.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {teachers.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                      <Avatar name={t.name} size="sm" />
                      <p className="text-sm font-medium text-slate-900">{t.name}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        ) : (
          <Card title="Bu kurstaki ödevler" padded={false}>
            {assignments.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">Henüz ödev verilmedi.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {assignments.map((a) => (
                  <li key={a.id}>
                    <Link href="/odevler" className="block px-5 py-3 hover:bg-slate-50">
                      <p className="text-sm font-medium text-slate-900">{a.title}</p>
                      <p className="text-xs text-slate-500">
                        {ASSIGNMENT_TYPE_LABEL[a.assignment_type]} · {a.due_date ? formatDate(a.due_date, { day: 'numeric', month: 'short' }) : 'Süresiz'}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-slate-100 p-5">
              <p className="mb-2 text-xs font-medium text-slate-500">Ders ilerlemesi</p>
              <ProgressBar value={percent} />
            </div>
          </Card>
        )}
      </div>

      {isStaff && (
        <>
          <LessonModal open={lessonModal} onClose={() => setLessonModal(false)} courseId={course.id} nextOrder={lessons.length + 1} onSaved={load} />
          <AssignmentModal lesson={assignFor} onClose={() => setAssignFor(null)} onSaved={load} />
          <PickUsersModal
            open={enrollModal}
            onClose={() => setEnrollModal(false)}
            title="Kursa öğrenci ekle"
            role="STUDENT"
            exclude={students.map((s) => s.id)}
            onPick={async (ids) => {
              await supabase.from('enrollments').upsert(
                ids.map((sid) => ({ course_id: course.id, student_id: sid, status: 'ACTIVE' })),
                { onConflict: 'student_id,course_id' }
              );
              load();
            }}
          />
          {isCoach && (
            <PickUsersModal
              open={teacherModal}
              onClose={() => setTeacherModal(false)}
              title="Öğretmen ata"
              role="TEACHER"
              exclude={teachers.map((t) => t.id)}
              onPick={async (ids) => {
                await supabase.from('course_teachers').insert(ids.map((tid) => ({ course_id: course.id, teacher_id: tid })));
                load();
              }}
            />
          )}
        </>
      )}
    </AppLayout>
  );
}

function LessonModal({ open, onClose, courseId, nextOrder, onSaved }: { open: boolean; onClose: () => void; courseId: string; nextOrder: number; onSaved: () => void }) {
  const [form, setForm] = useState({ title: '', content_type: 'RECORDED' as LessonType, video_url: '', duration_minutes: '', description: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.from('lessons').insert({
      course_id: courseId,
      title: form.title.trim(),
      content_type: form.content_type,
      video_url: form.video_url.trim() || null,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
      description: form.description.trim() || null,
      order_number: nextOrder,
    });
    setBusy(false);
    if (error) return setError(error.message);
    setForm({ title: '', content_type: 'RECORDED', video_url: '', duration_minutes: '', description: '' });
    onSaved();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ders ekle"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Vazgeç</button>
          <button form="lesson-form" type="submit" disabled={busy} className="btn-primary">{busy ? <Spinner className="h-4 w-4 text-white" /> : 'Kaydet'}</button>
        </>
      }
    >
      <form id="lesson-form" onSubmit={submit} className="space-y-5">
        {error && <Alert>{error}</Alert>}
        <Field label="Ders başlığı">
          <input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="ör. Türev — Temel kurallar" />
        </Field>
        <div className="grid grid-cols-3 gap-2">
          {(['LIVE', 'RECORDED', 'TEXT'] as LessonType[]).map((t) => {
            const Icon = LESSON_ICON[t];
            const active = form.content_type === t;
            return (
              <button
                type="button"
                key={t}
                onClick={() => setForm({ ...form, content_type: t })}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition ${active ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >
                <Icon className="h-5 w-5" /> {LESSON_TYPE_LABEL[t]}
              </button>
            );
          })}
        </div>
        <Field label={form.content_type === 'LIVE' ? 'Toplantı bağlantısı (Zoom / Meet)' : form.content_type === 'RECORDED' ? 'Video bağlantısı (YouTube, Drive…)' : 'Doküman bağlantısı (isteğe bağlı)'}>
          <input type="url" className="input" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://" />
        </Field>
        <Field label="Süre (dakika)">
          <input type="number" min={1} className="input" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} placeholder="ör. 45" />
        </Field>
        <Field label={form.content_type === 'TEXT' ? 'İçerik' : 'Açıklama'}>
          <textarea rows={form.content_type === 'TEXT' ? 8 : 3} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
      </form>
    </Modal>
  );
}

function AssignmentModal({ lesson, onClose, onSaved }: { lesson: Lesson | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: '', assignment_type: 'HOMEWORK', due_date: '', total_points: '100', description: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!lesson) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.from('lesson_assignments').insert({
      lesson_id: lesson.id,
      title: form.title.trim(),
      assignment_type: form.assignment_type,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      total_points: Number(form.total_points) || 100,
      description: form.description.trim() || null,
    });
    setBusy(false);
    if (error) return setError(error.message);
    setForm({ title: '', assignment_type: 'HOMEWORK', due_date: '', total_points: '100', description: '' });
    onSaved();
    onClose();
  };

  return (
    <Modal
      open={!!lesson}
      onClose={onClose}
      title={`Ödev / test ekle${lesson ? ` — ${lesson.title}` : ''}`}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Vazgeç</button>
          <button form="assign-form" type="submit" disabled={busy} className="btn-primary">{busy ? <Spinner className="h-4 w-4 text-white" /> : 'Kaydet'}</button>
        </>
      }
    >
      <form id="assign-form" onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
        {error && <div className="sm:col-span-2"><Alert>{error}</Alert></div>}
        <div className="sm:col-span-2">
          <Field label="Başlık">
            <input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="ör. Türev 40 soru tarama testi" />
          </Field>
        </div>
        <Field label="Tür">
          <select className="input" value={form.assignment_type} onChange={(e) => setForm({ ...form, assignment_type: e.target.value })}>
            {Object.entries(ASSIGNMENT_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Toplam puan">
          <input type="number" min={1} className="input" value={form.total_points} onChange={(e) => setForm({ ...form, total_points: e.target.value })} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Son teslim">
            <input type="datetime-local" className="input" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Açıklama / talimat">
            <textarea rows={4} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Hangi kaynaktan, kaç soru, nasıl teslim edilecek…" />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
