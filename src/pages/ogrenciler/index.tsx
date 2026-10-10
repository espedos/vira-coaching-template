import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Search, Users, Copy, Check } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Avatar, Badge, EmptyState, LoadingBlock, PageHeader, cn, formatDate } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

export default function Students() {
  const [students, setStudents] = useState<Profile[] | null>(null);
  const [courseCount, setCourseCount] = useState<Record<string, number>>({});
  const [q, setQ] = useState('');
  const [grade, setGrade] = useState<'ALL' | '12' | 'MEZUN'>('ALL');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('users').select('*').eq('role', 'STUDENT').order('name'),
      supabase.from('enrollments').select('student_id').neq('status', 'DROPPED'),
    ]).then(([{ data: u }, { data: e }]) => {
      setStudents((u ?? []) as Profile[]);
      const c: Record<string, number> = {};
      (e ?? []).forEach((r: { student_id: string }) => (c[r.student_id] = (c[r.student_id] ?? 0) + 1));
      setCourseCount(c);
    });
  }, []);

  const list = useMemo(
    () =>
      (students ?? []).filter(
        (s) => (grade === 'ALL' || s.grade === grade) && (s.name + s.email).toLocaleLowerCase('tr-TR').includes(q.toLocaleLowerCase('tr-TR'))
      ),
    [students, q, grade]
  );

  const copyInvite = () => {
    navigator.clipboard.writeText(`${window.location.origin}/kayit`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout title="Öğrenciler" roles={['COACH', 'TEACHER']}>
      <PageHeader
        title="Öğrenciler"
        description={`${students?.length ?? 0} kayıtlı öğrenci`}
        action={
          <button onClick={copyInvite} className="btn-secondary">
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />} {copied ? 'Kopyalandı' : 'Kayıt bağlantısını kopyala'}
          </button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="İsim veya e-posta ara…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          {[
            { k: 'ALL' as const, l: 'Tümü' },
            { k: '12' as const, l: '12. sınıf' },
            { k: 'MEZUN' as const, l: 'Mezun' },
          ].map((t) => (
            <button key={t.k} onClick={() => setGrade(t.k)} className={cn('rounded-lg px-4 py-2 text-sm font-medium transition', grade === t.k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {!students ? (
        <LoadingBlock />
      ) : list.length === 0 ? (
        <div className="card">
          <EmptyState icon={Users} title={students.length ? 'Sonuç bulunamadı' : 'Henüz öğrenci yok'} description={students.length ? undefined : 'Kayıt bağlantısını öğrencilerinle paylaş.'} />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {list.map((s) => (
              <li key={s.id}>
                <Link href={`/ogrenciler/${s.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50">
                  <Avatar name={s.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{s.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {s.email}
                      {s.phone ? ` · ${s.phone}` : ''}
                    </p>
                  </div>
                  <div className="hidden items-center gap-2 md:flex">
                    {s.field && <Badge tone="sky">{s.field}</Badge>}
                    <Badge tone={s.grade === 'MEZUN' ? 'violet' : 'indigo'}>{s.grade === 'MEZUN' ? 'Mezun' : '12. sınıf'}</Badge>
                  </div>
                  <span className="hidden w-24 text-right text-xs text-slate-500 sm:block">{courseCount[s.id] ?? 0} kurs</span>
                  <span className="hidden w-28 text-right text-xs text-slate-400 lg:block">{formatDate(s.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AppLayout>
  );
}
