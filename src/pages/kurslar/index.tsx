import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BookOpen, Plus, Users, User, Layers, ArrowRight } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Alert, Badge, EmptyState, Field, LoadingBlock, Modal, PageHeader, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { YKS_SUBJECTS, type Course } from '@/types';
import { courseGradient } from '@/components/courseStyle';

const levelLabel = (l: Course['level']) => (l === '12' ? '12. sınıf' : l === 'MEZUN' ? 'Mezun' : '12 + Mezun');

export default function Courses() {
  const { profile } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState<Record<string, { students: number; lessons: number }>>({});
  const [showNew, setShowNew] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);

  const isStaff = profile?.role === 'COACH' || profile?.role === 'TEACHER';
  const isCoach = profile?.role === 'COACH';

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    const list = (data ?? []) as Course[];
    setCourses(list);

    const ids = list.map((c) => c.id);
    if (!ids.length) return;
    const [{ data: enr }, { data: les }] = await Promise.all([
      supabase.from('enrollments').select('course_id, student_id').in('course_id', ids).neq('status', 'DROPPED'),
      supabase.from('lessons').select('course_id').in('course_id', ids),
    ]);
    const c: Record<string, { students: number; lessons: number }> = {};
    ids.forEach((id) => (c[id] = { students: 0, lessons: 0 }));
    (enr ?? []).forEach((e: { course_id: string }) => c[e.course_id].students++);
    (les ?? []).forEach((l: { course_id: string }) => c[l.course_id].lessons++);
    setCounts(c);
    setEnrolledIds(new Set((enr ?? []).filter((e: { student_id: string }) => e.student_id === profile.id).map((e: { course_id: string }) => e.course_id)));
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (router.query.yeni && isCoach) setShowNew(true);
  }, [router.query.yeni, isCoach]);

  const join = async (courseId: string) => {
    if (!profile) return;
    setJoining(courseId);
    const { error } = await supabase.from('enrollments').insert({ student_id: profile.id, course_id: courseId });
    setJoining(null);
    if (!error) router.push(`/kurslar/${courseId}`);
    else alert(error.message);
  };

  const mine = courses?.filter((c) => enrolledIds.has(c.id)) ?? [];
  const available = courses?.filter((c) => !enrolledIds.has(c.id) && c.is_active && c.type === 'GROUP') ?? [];

  return (
    <AppLayout title="Kurslar">
      <PageHeader
        title={isStaff ? 'Kurslar' : 'Kurslarım'}
        description={isStaff ? 'Grup ve birebir kursları, dersleri ve kayıtlı öğrencileri yönet.' : 'Kayıtlı olduğun kurslar ve katılabileceğin grup dersleri.'}
        action={
          isCoach && (
            <button onClick={() => setShowNew(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> Yeni kurs
            </button>
          )
        }
      />

      {!courses ? (
        <LoadingBlock />
      ) : isStaff ? (
        courses.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={BookOpen}
              title="Henüz kurs yok"
              description={isCoach ? 'İlk kursunu oluştur; ardından ders ekleyip öğrenci kaydedebilirsin.' : 'Koç bir kurs oluşturduğunda burada görünecek.'}
              action={isCoach && <button onClick={() => setShowNew(true)} className="btn-primary"><Plus className="h-4 w-4" /> Kurs oluştur</button>}
            />
          </div>
        ) : (
          <CourseGrid courses={courses} counts={counts} />
        )
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">Kayıtlı olduğum kurslar</h2>
            {mine.length === 0 ? (
              <div className="card">
                <EmptyState icon={BookOpen} title="Henüz bir kursa kayıtlı değilsin" description="Aşağıdaki açık grup kurslarına katılabilir ya da koçunun seni eklemesini bekleyebilirsin." />
              </div>
            ) : (
              <CourseGrid courses={mine} counts={counts} />
            )}
          </section>
          {available.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">Katılabileceğin grup kursları</h2>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {available.map((c) => (
                  <div key={c.id} className="card flex flex-col p-5">
                    <Badge tone="indigo">{c.subject}</Badge>
                    <h3 className="mt-3 text-base font-semibold text-slate-900">{c.name}</h3>
                    <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">{c.description || 'Açıklama eklenmemiş.'}</p>
                    <button onClick={() => join(c.id)} disabled={joining === c.id} className="btn-primary mt-5 w-full">
                      {joining === c.id ? <Spinner className="h-4 w-4 text-white" /> : <>Kursa katıl <ArrowRight className="h-4 w-4" /></>}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {isCoach && profile && (
        <NewCourseModal
          open={showNew}
          coachId={profile.id}
          onClose={() => {
            setShowNew(false);
            if (router.query.yeni) router.replace('/kurslar', undefined, { shallow: true });
          }}
          onCreated={(id) => router.push(`/kurslar/${id}`)}
        />
      )}
    </AppLayout>
  );
}

function CourseGrid({ courses, counts }: { courses: Course[]; counts: Record<string, { students: number; lessons: number }> }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {courses.map((c) => (
        <Link key={c.id} href={`/kurslar/${c.id}`} className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
          <div className={`relative h-28 bg-gradient-to-br ${courseGradient(c.subject)} p-5`}>
            <div className="absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-white/10" />
            <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur">{c.subject}</span>
            {!c.is_active && <span className="ml-2 inline-flex rounded-full bg-slate-900/40 px-2.5 py-0.5 text-xs font-medium text-white">Pasif</span>}
          </div>
          <div className="p-5">
            <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600">{c.name}</h3>
            <p className="mt-1 line-clamp-2 min-h-[40px] text-sm text-slate-500">{c.description || 'Açıklama eklenmemiş.'}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                {c.type === 'GROUP' ? <Users className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                {c.type === 'GROUP' ? 'Grup' : 'Birebir'}
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" /> {counts[c.id]?.lessons ?? 0} ders
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> {counts[c.id]?.students ?? 0}
                {c.max_students ? `/${c.max_students}` : ''} öğrenci
              </span>
              <span className="ml-auto">{levelLabel(c.level)}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function NewCourseModal({ open, onClose, coachId, onCreated }: { open: boolean; onClose: () => void; coachId: string; onCreated: (id: string) => void }) {
  const [form, setForm] = useState({
    name: '',
    subject: YKS_SUBJECTS[1] as string,
    type: 'GROUP' as 'GROUP' | 'INDIVIDUAL',
    level: 'BOTH' as '12' | 'MEZUN' | 'BOTH',
    max_students: '',
    start_date: '',
    end_date: '',
    description: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { data, error } = await supabase
      .from('courses')
      .insert({
        coach_id: coachId,
        name: form.name.trim(),
        subject: form.subject,
        type: form.type,
        level: form.level,
        max_students: form.type === 'INDIVIDUAL' ? 1 : form.max_students ? Number(form.max_students) : null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        description: form.description.trim() || null,
      })
      .select('id')
      .single();
    setBusy(false);
    if (error) return setError(error.message);
    onCreated(data.id);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Yeni kurs oluştur"
      wide
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Vazgeç</button>
          <button form="new-course" type="submit" disabled={busy} className="btn-primary">
            {busy ? <Spinner className="h-4 w-4 text-white" /> : 'Kursu oluştur'}
          </button>
        </>
      }
    >
      <form id="new-course" onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
        {error && <div className="sm:col-span-2"><Alert>{error}</Alert></div>}
        <div className="sm:col-span-2">
          <Field label="Kurs adı">
            <input required className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="ör. AYT Matematik Yoğun Kamp" />
          </Field>
        </div>
        <Field label="Ders">
          <select className="input" value={form.subject} onChange={(e) => set('subject', e.target.value)}>
            {YKS_SUBJECTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Kurs tipi">
          <select className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
            <option value="GROUP">Grup dersi</option>
            <option value="INDIVIDUAL">Birebir koçluk</option>
          </select>
        </Field>
        <Field label="Hedef kitle">
          <select className="input" value={form.level} onChange={(e) => set('level', e.target.value)}>
            <option value="BOTH">12. sınıf + Mezun</option>
            <option value="12">12. sınıf</option>
            <option value="MEZUN">Mezun</option>
          </select>
        </Field>
        {form.type === 'GROUP' && (
          <Field label="Kontenjan" hint="Boş bırakırsan sınırsız">
            <input type="number" min={1} className="input" value={form.max_students} onChange={(e) => set('max_students', e.target.value)} placeholder="ör. 20" />
          </Field>
        )}
        <Field label="Başlangıç">
          <input type="date" className="input" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
        </Field>
        <Field label="Bitiş">
          <input type="date" className="input" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Açıklama">
            <textarea rows={3} className="input" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Kursun içeriği, hedefleri, haftalık düzeni…" />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
