import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/router';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Plus, Users, Video, XCircle, CheckCircle2 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Alert, Avatar, Badge, Card, EmptyState, Field, Modal, PageHeader, Spinner, cn } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { APPOINTMENT_TYPE_LABEL, type Appointment, type AppointmentType, type Course, type Profile } from '@/types';

const TYPE_STYLE: Record<AppointmentType, string> = {
  SESSION: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  MEETING: 'bg-violet-50 text-violet-700 ring-violet-200',
  REVIEW: 'bg-amber-50 text-amber-700 ring-amber-200',
};
const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export default function CalendarPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [items, setItems] = useState<Appointment[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [showNew, setShowNew] = useState(false);
  const [detail, setDetail] = useState<Appointment | null>(null);

  const isStaff = profile?.role === 'COACH' || profile?.role === 'TEACHER';

  const grid = useMemo(() => {
    const first = new Date(cursor);
    const offset = (first.getDay() + 6) % 7; // Monday first
    const start = new Date(first);
    start.setDate(first.getDate() - offset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const load = useCallback(async () => {
    const from = grid[0];
    const to = new Date(grid[41]);
    to.setDate(to.getDate() + 1);
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .gte('scheduled_at', from.toISOString())
      .lt('scheduled_at', to.toISOString())
      .order('scheduled_at');
    setItems((data ?? []) as Appointment[]);
  }, [grid]);

  useEffect(() => {
    if (profile) load();
  }, [profile, load]);

  useEffect(() => {
    if (router.query.yeni && isStaff) setShowNew(true);
  }, [router.query.yeni, isStaff]);

  const byDay = useMemo(() => {
    const m = new Map<string, Appointment[]>();
    items.forEach((a) => {
      const k = dayKey(new Date(a.scheduled_at));
      m.set(k, [...(m.get(k) ?? []), a]);
    });
    return m;
  }, [items]);

  const today = dayKey(new Date());
  const dayItems = byDay.get(dayKey(selectedDay)) ?? [];

  return (
    <AppLayout title="Takvim">
      <PageHeader
        title="Takvim"
        description={isStaff ? 'Birebir görüşmeleri, grup derslerini ve değerlendirme oturumlarını planla.' : 'Koçunla görüşmelerin ve canlı derslerin.'}
        action={
          isStaff && (
            <button onClick={() => setShowNew(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> Oturum planla
            </button>
          )
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-semibold capitalize text-slate-900">{cursor.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</h2>
            <div className="flex items-center gap-1">
              <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  const d = new Date();
                  setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
                  setSelectedDay(d);
                }}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Bugün
              </button>
              <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {grid.map((d, i) => {
              const k = dayKey(d);
              const inMonth = d.getMonth() === cursor.getMonth();
              const list = byDay.get(k) ?? [];
              const selected = k === dayKey(selectedDay);
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(d)}
                  className={cn(
                    'min-h-[72px] border-b border-r border-slate-100 p-1.5 text-left align-top transition sm:min-h-[104px] sm:p-2',
                    !inMonth && 'bg-slate-50/50',
                    selected ? 'bg-indigo-50/50' : 'hover:bg-slate-50'
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm',
                      k === today ? 'bg-indigo-600 font-semibold text-white' : inMonth ? 'text-slate-700' : 'text-slate-300',
                      selected && k !== today && 'ring-2 ring-indigo-400'
                    )}
                  >
                    {d.getDate()}
                  </span>
                  <div className="mt-1 hidden space-y-1 sm:block">
                    {list.slice(0, 2).map((a) => (
                      <div key={a.id} className={cn('truncate rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset', TYPE_STYLE[a.type], a.status === 'CANCELLED' && 'line-through opacity-50')}>
                        {new Date(a.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} {a.title}
                      </div>
                    ))}
                    {list.length > 2 && <p className="px-1 text-[11px] text-slate-400">+{list.length - 2} daha</p>}
                  </div>
                  {list.length > 0 && (
                    <div className="mt-1 flex gap-0.5 sm:hidden">
                      {list.slice(0, 3).map((a) => (
                        <span key={a.id} className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <Card title={selectedDay.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}>
          {dayItems.length === 0 ? (
            <EmptyState icon={CalendarDays} title="Bu gün için oturum yok" action={isStaff && <button onClick={() => setShowNew(true)} className="btn-secondary"><Plus className="h-4 w-4" /> Oturum ekle</button>} />
          ) : (
            <ul className="space-y-3">
              {dayItems.map((a) => (
                <li key={a.id}>
                  <button onClick={() => setDetail(a)} className={cn('w-full rounded-xl p-4 text-left ring-1 ring-inset transition hover:shadow-sm', TYPE_STYLE[a.type], a.status === 'CANCELLED' && 'opacity-50')}>
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{APPOINTMENT_TYPE_LABEL[a.type]}</p>
                    <p className={cn('mt-1 font-semibold', a.status === 'CANCELLED' && 'line-through')}>{a.title}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs opacity-80">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(a.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} · {a.duration_minutes} dk
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {isStaff && profile && (
        <NewAppointmentModal
          open={showNew}
          coachId={profile.id}
          defaultDate={selectedDay}
          onClose={() => {
            setShowNew(false);
            if (router.query.yeni) router.replace('/takvim', undefined, { shallow: true });
          }}
          onSaved={load}
        />
      )}
      <AppointmentDetail appointment={detail} canEdit={isStaff} onClose={() => setDetail(null)} onChanged={load} />
    </AppLayout>
  );
}

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function NewAppointmentModal({ open, onClose, coachId, defaultDate, onSaved }: { open: boolean; onClose: () => void; coachId: string; defaultDate: Date; onSaved: () => void }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [form, setForm] = useState({ title: '', type: 'MEETING' as AppointmentType, date: '', time: '19:00', duration: '60', meeting_url: '', course_id: '', description: '' });
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm((f) => ({ ...f, date: toLocalInput(defaultDate) }));
    setPicked(new Set());
    setError(null);
    supabase.from('courses').select('*').eq('is_active', true).order('name').then(({ data }) => setCourses((data ?? []) as Course[]));
    supabase.from('users').select('*').eq('role', 'STUDENT').order('name').then(({ data }) => setStudents((data ?? []) as Profile[]));
  }, [open, defaultDate]);

  useEffect(() => {
    if (!form.course_id) return;
    supabase
      .from('enrollments')
      .select('student_id')
      .eq('course_id', form.course_id)
      .neq('status', 'DROPPED')
      .then(({ data }) => setPicked(new Set((data ?? []).map((r: { student_id: string }) => r.student_id))));
  }, [form.course_id]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const scheduled = new Date(`${form.date}T${form.time}`);
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        coach_id: coachId,
        title: form.title.trim(),
        type: form.type,
        scheduled_at: scheduled.toISOString(),
        duration_minutes: Number(form.duration) || 60,
        meeting_url: form.meeting_url.trim() || null,
        course_id: form.course_id || null,
        description: form.description.trim() || null,
      })
      .select('id')
      .single();
    if (error) {
      setBusy(false);
      return setError(error.message);
    }
    if (picked.size) {
      await supabase.from('appointment_participants').insert(Array.from(picked).map((sid) => ({ appointment_id: data.id, student_id: sid })));
    }
    setBusy(false);
    setForm({ title: '', type: 'MEETING', date: '', time: '19:00', duration: '60', meeting_url: '', course_id: '', description: '' });
    onSaved();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Oturum planla"
      wide
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Vazgeç</button>
          <button form="appt-form" type="submit" disabled={busy || picked.size === 0} className="btn-primary">
            {busy ? <Spinner className="h-4 w-4 text-white" /> : 'Planla'}
          </button>
        </>
      }
    >
      <form id="appt-form" onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
        {error && <div className="sm:col-span-2"><Alert>{error}</Alert></div>}
        <div className="sm:col-span-2">
          <Field label="Başlık">
            <input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="ör. Haftalık koçluk görüşmesi" />
          </Field>
        </div>
        <Field label="Tür">
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AppointmentType })}>
            {Object.entries(APPOINTMENT_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Kurs (grup dersi için)">
          <select className="input" value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}>
            <option value="">— Birebir / kurstan bağımsız —</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Tarih">
          <input type="date" required className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Saat">
            <input type="time" required className="input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </Field>
          <Field label="Süre (dk)">
            <input type="number" min={10} step={5} className="input" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Toplantı bağlantısı (Zoom / Meet)">
            <input type="url" className="input" value={form.meeting_url} onChange={(e) => setForm({ ...form, meeting_url: e.target.value })} placeholder="https://" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <span className="label">Katılımcılar ({picked.size})</span>
          <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-200 p-1.5">
            {students.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-500">Kayıtlı öğrenci yok.</p>
            ) : (
              students.map((s) => {
                const on = picked.has(s.id);
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() =>
                      setPicked((p) => {
                        const n = new Set(p);
                        on ? n.delete(s.id) : n.add(s.id);
                        return n;
                      })
                    }
                    className={cn('flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm', on ? 'bg-indigo-50' : 'hover:bg-slate-50')}
                  >
                    <input type="checkbox" readOnly checked={on} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                    <span className="font-medium text-slate-800">{s.name}</span>
                    <span className="ml-auto text-xs text-slate-400">{s.grade === 'MEZUN' ? 'Mezun' : '12'}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
        <div className="sm:col-span-2">
          <Field label="Not / gündem">
            <textarea rows={2} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

function AppointmentDetail({ appointment, canEdit, onClose, onChanged }: { appointment: Appointment | null; canEdit: boolean; onClose: () => void; onChanged: () => void }) {
  const [participants, setParticipants] = useState<Profile[]>([]);

  useEffect(() => {
    if (!appointment || !canEdit) return setParticipants([]);
    supabase
      .from('appointment_participants')
      .select('users!appointment_participants_student_id_fkey(*)')
      .eq('appointment_id', appointment.id)
      .then(({ data }) => setParticipants(((data ?? []) as unknown as { users: Profile }[]).map((r) => r.users).filter(Boolean)));
  }, [appointment, canEdit]);

  const setStatus = async (status: Appointment['status']) => {
    if (!appointment) return;
    await supabase.from('appointments').update({ status }).eq('id', appointment.id);
    onChanged();
    onClose();
  };

  if (!appointment) return null;
  const d = new Date(appointment.scheduled_at);
  return (
    <Modal
      open
      onClose={onClose}
      title={appointment.title}
      footer={
        canEdit && appointment.status === 'SCHEDULED' ? (
          <>
            <button onClick={() => setStatus('CANCELLED')} className="btn-secondary text-rose-600">
              <XCircle className="h-4 w-4" /> İptal et
            </button>
            <button onClick={() => setStatus('COMPLETED')} className="btn-primary">
              <CheckCircle2 className="h-4 w-4" /> Tamamlandı
            </button>
          </>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge tone="indigo">{APPOINTMENT_TYPE_LABEL[appointment.type]}</Badge>
          {appointment.status === 'CANCELLED' && <Badge tone="rose">İptal edildi</Badge>}
          {appointment.status === 'COMPLETED' && <Badge tone="emerald">Tamamlandı</Badge>}
        </div>
        <p className="flex items-center gap-2 text-sm text-slate-700">
          <Clock className="h-4 w-4 text-slate-400" />
          {d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })} · {d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} ·{' '}
          {appointment.duration_minutes} dk
        </p>
        {appointment.description && <p className="whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{appointment.description}</p>}
        {appointment.meeting_url && (
          <a href={appointment.meeting_url} target="_blank" rel="noreferrer" className="btn-primary w-full">
            <Video className="h-4 w-4" /> Toplantıya katıl
          </a>
        )}
        {canEdit && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <Users className="h-4 w-4" /> Katılımcılar ({participants.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {participants.map((p) => (
                <span key={p.id} className="flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-1 pr-3 text-sm text-slate-700">
                  <Avatar name={p.name} size="sm" /> {p.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
