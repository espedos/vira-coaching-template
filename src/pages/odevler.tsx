import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { CheckCircle2, ClipboardList, Clock, ExternalLink, Send, Award } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Alert, Avatar, Badge, EmptyState, Field, LoadingBlock, Modal, PageHeader, Spinner, cn, formatDate, formatDateTime, relativeTime } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { loadStudentOverview, type AssignmentWithMeta } from '@/lib/data';
import { ASSIGNMENT_TYPE_LABEL, type Assignment, type Profile, type Submission } from '@/types';

export default function Assignments() {
  const { profile } = useAuth();
  return (
    <AppLayout title="Ödevler">
      {profile && (profile.role === 'STUDENT' ? <StudentAssignments profile={profile} /> : <StaffAssignments profile={profile} />)}
    </AppLayout>
  );
}

function DueLabel({ due, done }: { due: string | null; done?: boolean }) {
  if (!due) return <span className="text-xs text-slate-400">Süresiz</span>;
  const overdue = !done && new Date(due) < new Date();
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', overdue ? 'text-rose-600' : 'text-slate-500')}>
      <Clock className="h-3.5 w-3.5" /> {overdue ? 'Süresi geçti · ' : ''}
      {formatDateTime(due)}
    </span>
  );
}

/* ------------------------------ Student ------------------------------ */

function StudentAssignments({ profile }: { profile: Profile }) {
  const [items, setItems] = useState<AssignmentWithMeta[] | null>(null);
  const [tab, setTab] = useState<'pending' | 'submitted' | 'graded'>('pending');
  const [active, setActive] = useState<AssignmentWithMeta | null>(null);

  const load = useCallback(() => loadStudentOverview(profile.id).then((d) => setItems(d.assignments)), [profile.id]);
  useEffect(() => {
    load();
  }, [load]);

  const groups = {
    pending: items?.filter((a) => !a.submission) ?? [],
    submitted: items?.filter((a) => a.submission && a.submission.score == null) ?? [],
    graded: items?.filter((a) => a.submission?.score != null) ?? [],
  };
  const tabs = [
    { key: 'pending' as const, label: 'Bekleyen' },
    { key: 'submitted' as const, label: 'Teslim edildi' },
    { key: 'graded' as const, label: 'Notlandı' },
  ];

  return (
    <>
      <PageHeader title="Ödevlerim" description="Ödev, quiz ve denemelerini buradan teslim et ve geri bildirimleri gör." />
      <div className="mb-6 inline-flex rounded-xl bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn('rounded-lg px-4 py-2 text-sm font-medium transition', tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
          >
            {t.label}
            <span className={cn('ml-2 rounded-full px-2 py-0.5 text-xs', tab === t.key ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500')}>{groups[t.key].length}</span>
          </button>
        ))}
      </div>

      {!items ? (
        <LoadingBlock />
      ) : groups[tab].length === 0 ? (
        <div className="card">
          <EmptyState
            icon={tab === 'pending' ? CheckCircle2 : ClipboardList}
            title={tab === 'pending' ? 'Bekleyen ödevin yok' : tab === 'submitted' ? 'Değerlendirme bekleyen teslimin yok' : 'Henüz notlanan çalışman yok'}
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups[tab].map((a) => (
            <div key={a.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="amber">{ASSIGNMENT_TYPE_LABEL[a.assignment_type]}</Badge>
                    <Link href={`/kurslar/${a.courseId}`} className="text-xs font-medium text-slate-500 hover:text-indigo-600">
                      {a.courseName}
                    </Link>
                  </div>
                  <h3 className="mt-2.5 text-base font-semibold text-slate-900">{a.title}</h3>
                  <p className="text-xs text-slate-500">Ders: {a.lessonTitle}</p>
                </div>
                {a.submission?.score != null && (
                  <div className="shrink-0 rounded-xl bg-emerald-50 px-3 py-2 text-center ring-1 ring-emerald-100">
                    <p className="text-xl font-bold text-emerald-600">{a.submission.score}</p>
                    <p className="text-[10px] font-medium text-emerald-700">/ {a.total_points}</p>
                  </div>
                )}
              </div>
              {a.description && <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm text-slate-600">{a.description}</p>}
              {a.submission?.feedback && (
                <div className="mt-3 rounded-lg bg-indigo-50/60 p-3 text-sm text-slate-700 ring-1 ring-indigo-100">
                  <p className="mb-1 text-xs font-semibold text-indigo-700">Geri bildirim</p>
                  {a.submission.feedback}
                </div>
              )}
              <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                {a.submission ? (
                  <span className="text-xs text-slate-500">Teslim: {a.submission.submitted_at && relativeTime(a.submission.submitted_at)}</span>
                ) : (
                  <DueLabel due={a.due_date} />
                )}
                {a.submission?.score == null && (
                  <button onClick={() => setActive(a)} className={a.submission ? 'btn-secondary px-3 py-2' : 'btn-primary px-3 py-2'}>
                    {a.submission ? 'Teslimi düzenle' : <><Send className="h-4 w-4" /> Teslim et</>}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <SubmitModal assignment={active} studentId={profile.id} onClose={() => setActive(null)} onSaved={load} />
    </>
  );
}

function SubmitModal({ assignment, studentId, onClose, onSaved }: { assignment: AssignmentWithMeta | null; studentId: string; onClose: () => void; onSaved: () => void }) {
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setContent(assignment?.submission?.content ?? '');
    setLink(assignment?.submission?.file_url ?? '');
    setError(null);
  }, [assignment]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!assignment) return;
    setBusy(true);
    const { error } = await supabase.from('submissions').upsert(
      {
        assignment_id: assignment.id,
        student_id: studentId,
        content: content.trim(),
        file_url: link.trim() || null,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'assignment_id,student_id' }
    );
    setBusy(false);
    if (error) return setError(error.message);
    onSaved();
    onClose();
  };

  return (
    <Modal
      open={!!assignment}
      onClose={onClose}
      title={assignment?.title ?? ''}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Vazgeç</button>
          <button form="submit-form" type="submit" disabled={busy || !content.trim()} className="btn-primary">
            {busy ? <Spinner className="h-4 w-4 text-white" /> : <><Send className="h-4 w-4" /> Teslim et</>}
          </button>
        </>
      }
    >
      <form id="submit-form" onSubmit={submit} className="space-y-5">
        {error && <Alert>{error}</Alert>}
        {assignment?.description && <div className="whitespace-pre-line rounded-lg bg-slate-50 p-4 text-sm text-slate-600">{assignment.description}</div>}
        <Field label="Cevabın / notların" hint="Deneme ise doğru-yanlış-boş sayılarını ve net hesabını yazabilirsin.">
          <textarea required rows={6} className="input" value={content} onChange={(e) => setContent(e.target.value)} placeholder="ör. Matematik: 32 D / 6 Y / 2 B → 30.5 net" />
        </Field>
        <Field label="Dosya bağlantısı (isteğe bağlı)" hint="Drive, fotoğraf veya PDF bağlantısı">
          <input type="url" className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" />
        </Field>
      </form>
    </Modal>
  );
}

/* ------------------------------ Staff ------------------------------ */

interface StaffAssignment extends Assignment {
  lessons: { title: string; course_id: string; courses: { name: string } | null } | null;
}

interface StaffSubmission extends Submission {
  student: { id: string; name: string } | null;
}

function StaffAssignments({ profile }: { profile: Profile }) {
  const [items, setItems] = useState<StaffAssignment[] | null>(null);
  const [subs, setSubs] = useState<StaffSubmission[]>([]);
  const [enrollCount, setEnrollCount] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<'all' | 'needs'>('needs');
  const [active, setActive] = useState<StaffAssignment | null>(null);

  const load = useCallback(async () => {
    const [{ data: a }, { data: s }, { data: e }] = await Promise.all([
      supabase.from('lesson_assignments').select('*, lessons(title, course_id, courses(name))').order('created_at', { ascending: false }),
      supabase.from('submissions').select('*, student:users!submissions_student_id_fkey(id, name)').order('submitted_at', { ascending: false }),
      supabase.from('enrollments').select('course_id').neq('status', 'DROPPED'),
    ]);
    setItems((a ?? []) as unknown as StaffAssignment[]);
    setSubs((s ?? []) as unknown as StaffSubmission[]);
    const c: Record<string, number> = {};
    (e ?? []).forEach((r: { course_id: string }) => (c[r.course_id] = (c[r.course_id] ?? 0) + 1));
    setEnrollCount(c);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stat = (a: StaffAssignment) => {
    const s = subs.filter((x) => x.assignment_id === a.id);
    return { submitted: s.length, ungraded: s.filter((x) => x.score == null).length, enrolled: enrollCount[a.lessons?.course_id ?? ''] ?? 0 };
  };
  const visible = (items ?? []).filter((a) => filter === 'all' || stat(a).ungraded > 0);

  return (
    <>
      <PageHeader
        title="Ödev & Testler"
        description="Teslimleri incele, puanla ve geri bildirim ver. Yeni ödev eklemek için ilgili kursun ders listesini kullan."
        action={<Link href="/kurslar" className="btn-secondary">Kurslara git</Link>}
      />
      <div className="mb-6 inline-flex rounded-xl bg-slate-100 p-1">
        {[
          { k: 'needs' as const, l: 'Notlanacaklar' },
          { k: 'all' as const, l: 'Tüm ödevler' },
        ].map((t) => (
          <button key={t.k} onClick={() => setFilter(t.k)} className={cn('rounded-lg px-4 py-2 text-sm font-medium transition', filter === t.k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>
            {t.l}
          </button>
        ))}
      </div>

      {!items ? (
        <LoadingBlock />
      ) : visible.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={filter === 'needs' ? CheckCircle2 : ClipboardList}
            title={filter === 'needs' ? 'Notlanacak teslim yok' : 'Henüz ödev verilmedi'}
            description={filter === 'needs' ? 'Tüm teslimler değerlendirilmiş.' : 'Bir kursa girip ders satırındaki ödev ikonuyla ödev ekleyebilirsin.'}
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Ödev</th>
                  <th className="px-5 py-3">Kurs</th>
                  <th className="px-5 py-3">Son teslim</th>
                  <th className="px-5 py-3">Teslim</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {visible.map((a) => {
                  const s = stat(a);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                        <p className="text-xs text-slate-500">
                          {ASSIGNMENT_TYPE_LABEL[a.assignment_type]} · {a.lessons?.title}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{a.lessons?.courses?.name}</td>
                      <td className="px-5 py-4">
                        <DueLabel due={a.due_date} done />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-700">
                            {s.submitted}/{s.enrolled}
                          </span>
                          {s.ungraded > 0 && <Badge tone="amber">{s.ungraded} notlanacak</Badge>}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button onClick={() => setActive(a)} className="btn-secondary px-3 py-1.5 text-xs">
                          İncele
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <GradeModal
        assignment={active}
        submissions={subs.filter((s) => s.assignment_id === active?.id)}
        graderId={profile.id}
        onClose={() => setActive(null)}
        onSaved={load}
      />
    </>
  );
}

function GradeModal({
  assignment,
  submissions,
  graderId,
  onClose,
  onSaved,
}: {
  assignment: StaffAssignment | null;
  submissions: StaffSubmission[];
  graderId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, { score: string; feedback: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const d: Record<string, { score: string; feedback: string }> = {};
    submissions.forEach((s) => (d[s.id] = { score: s.score?.toString() ?? '', feedback: s.feedback ?? '' }));
    setDrafts(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment?.id]);

  const save = async (s: StaffSubmission) => {
    const d = drafts[s.id];
    setSaving(s.id);
    await supabase
      .from('submissions')
      .update({ score: d.score === '' ? null : Number(d.score), feedback: d.feedback.trim() || null, graded_at: new Date().toISOString(), graded_by: graderId })
      .eq('id', s.id);
    setSaving(null);
    onSaved();
  };

  return (
    <Modal open={!!assignment} onClose={onClose} title={assignment?.title ?? ''} wide>
      {submissions.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Henüz teslim yok" />
      ) : (
        <ul className="space-y-4">
          {submissions.map((s) => (
            <li key={s.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <Avatar name={s.student?.name ?? '?'} size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{s.student?.name}</p>
                  <p className="text-xs text-slate-500">{s.submitted_at ? formatDateTime(s.submitted_at) : ''}</p>
                </div>
                {s.score != null && (
                  <Badge tone="emerald">
                    <Award className="mr-1 h-3 w-3" /> {s.score}/{assignment?.total_points}
                  </Badge>
                )}
              </div>
              <p className="mt-3 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{s.content}</p>
              {s.file_url && (
                <a href={s.file_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline">
                  Ekli dosya <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {drafts[s.id] && (
                <div className="mt-4 grid gap-3 sm:grid-cols-[120px_1fr_auto] sm:items-end">
                  <Field label={`Puan / ${assignment?.total_points}`}>
                    <input
                      type="number"
                      min={0}
                      max={assignment?.total_points}
                      className="input"
                      value={drafts[s.id].score}
                      onChange={(e) => setDrafts({ ...drafts, [s.id]: { ...drafts[s.id], score: e.target.value } })}
                    />
                  </Field>
                  <Field label="Geri bildirim">
                    <input
                      className="input"
                      value={drafts[s.id].feedback}
                      onChange={(e) => setDrafts({ ...drafts, [s.id]: { ...drafts[s.id], feedback: e.target.value } })}
                      placeholder="Güçlü yönler, eksik konular…"
                    />
                  </Field>
                  <button onClick={() => save(s)} disabled={saving === s.id} className="btn-primary">
                    {saving === s.id ? <Spinner className="h-4 w-4 text-white" /> : 'Kaydet'}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {assignment?.due_date && <p className="mt-4 text-xs text-slate-400">Son teslim: {formatDate(assignment.due_date)}</p>}
    </Modal>
  );
}
