import { CalendarDays, Video } from 'lucide-react';
import type { Appointment } from '@/types';
import { APPOINTMENT_TYPE_LABEL } from '@/types';
import { Badge, EmptyState } from './ui';

const TYPE_TONE = { SESSION: 'indigo', MEETING: 'violet', REVIEW: 'amber' } as const;

export default function AppointmentList({ items, emptyText }: { items: Appointment[]; emptyText?: string }) {
  if (!items.length) return <EmptyState icon={CalendarDays} title="Yaklaşan oturum yok" description={emptyText} />;
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((a) => {
        const d = new Date(a.scheduled_at);
        return (
          <li key={a.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-200">
              <span className="text-[10px] font-semibold uppercase text-slate-500">{d.toLocaleDateString('tr-TR', { month: 'short' })}</span>
              <span className="text-lg font-bold leading-none text-slate-900">{d.getDate()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{a.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {d.toLocaleDateString('tr-TR', { weekday: 'long' })} · {d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} ·{' '}
                {a.duration_minutes} dk
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={TYPE_TONE[a.type]}>{APPOINTMENT_TYPE_LABEL[a.type]}</Badge>
              {a.meeting_url && (
                <a href={a.meeting_url} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50" title="Toplantıya katıl">
                  <Video className="h-4 w-4" />
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
