import Link from 'next/link';
import { Award, BookOpen, CheckCircle2, ClipboardList, TrendingUp } from 'lucide-react';
import type { StudentOverview } from '@/lib/data';
import { ASSIGNMENT_TYPE_LABEL } from '@/types';
import { Badge, Card, EmptyState, ProgressBar, StatCard, formatDate } from './ui';

function Ring({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgb(241 245 249)" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
          className="transition-all duration-700"
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-900">%{Math.round(v)}</span>
        <span className="text-xs text-slate-500">genel ilerleme</span>
      </div>
    </div>
  );
}

export default function ProgressReport({ data }: { data: StudentOverview }) {
  const overall = data.totalLessons ? (data.completedLessons / data.totalLessons) * 100 : 0;
  const submittedRate = data.assignments.length ? ((data.assignments.length - data.pendingAssignments) / data.assignments.length) * 100 : 0;
  const scores = [...data.graded].sort((a, b) => (a.submission!.graded_at ?? '').localeCompare(b.submission!.graded_at ?? '')).slice(-10);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <div className="card flex items-center justify-center p-6 lg:w-64">
          <Ring value={overall} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Tamamlanan ders" value={`${data.completedLessons}/${data.totalLessons}`} icon={CheckCircle2} tone="emerald" />
          <StatCard label="Ödev teslim oranı" value={`%${Math.round(submittedRate)}`} icon={ClipboardList} tone="sky" hint={`${data.pendingAssignments} bekleyen`} />
          <StatCard label="Ortalama puan" value={data.averageScore != null ? Math.round(data.averageScore) : '—'} icon={Award} tone="violet" hint="100 üzerinden" />
          <StatCard label="Kayıtlı kurs" value={data.courses.length} icon={BookOpen} tone="indigo" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Kurs bazında ilerleme">
          {data.courses.length === 0 ? (
            <EmptyState icon={BookOpen} title="Kayıtlı kurs yok" />
          ) : (
            <ul className="space-y-5">
              {data.courses.map((c) => (
                <li key={c.course.id}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <Link href={`/kurslar/${c.course.id}`} className="font-medium text-slate-800 hover:text-indigo-600">
                      {c.course.name}
                    </Link>
                    <span className="text-slate-500">
                      {c.completedLessons}/{c.totalLessons} · <span className="font-semibold text-slate-700">%{Math.round(c.percent)}</span>
                    </span>
                  </div>
                  <ProgressBar value={c.percent} tone={c.percent >= 100 ? 'emerald' : 'indigo'} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Puan gelişimi (son 10)">
          {scores.length === 0 ? (
            <EmptyState icon={TrendingUp} title="Henüz notlanan çalışma yok" description="Ödev ve denemeler notlandıkça grafik oluşacak." />
          ) : (
            <div className="flex h-48 items-end gap-2">
              {scores.map((a) => {
                const pct = ((a.submission!.score ?? 0) / (a.total_points || 100)) * 100;
                return (
                  <div key={a.id} className="group relative flex h-full flex-1 flex-col justify-end">
                    <span className="mb-1 text-center text-[11px] font-semibold text-slate-600">{Math.round(pct)}</span>
                    <div
                      className={`w-full rounded-t-md transition-all ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                      style={{ height: `${Math.max(pct, 4)}%` }}
                    />
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-6 hidden w-40 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                      {a.title}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card title="Notlanan çalışmalar" padded={false}>
        {data.graded.length === 0 ? (
          <EmptyState icon={Award} title="Henüz not yok" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Çalışma</th>
                  <th className="px-5 py-3">Kurs</th>
                  <th className="px-5 py-3">Tarih</th>
                  <th className="px-5 py-3">Puan</th>
                  <th className="px-5 py-3">Geri bildirim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.graded.map((a) => {
                  const pct = ((a.submission!.score ?? 0) / (a.total_points || 100)) * 100;
                  return (
                    <tr key={a.id}>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-slate-900">{a.title}</p>
                        <p className="text-xs text-slate-500">{ASSIGNMENT_TYPE_LABEL[a.assignment_type]}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{a.courseName}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">{formatDate(a.submission!.graded_at, { day: 'numeric', month: 'short' })}</td>
                      <td className="px-5 py-3.5">
                        <Badge tone={pct >= 80 ? 'emerald' : pct >= 50 ? 'indigo' : 'amber'}>
                          {a.submission!.score}/{a.total_points}
                        </Badge>
                      </td>
                      <td className="max-w-xs px-5 py-3.5 text-sm text-slate-600">{a.submission!.feedback || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
