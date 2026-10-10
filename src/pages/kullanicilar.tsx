import { useEffect, useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Alert, Avatar, Badge, LoadingBlock, PageHeader, cn, formatDate } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ROLE_LABEL, type Profile, type UserRole } from '@/types';

const ROLE_TONE = { COACH: 'violet', TEACHER: 'sky', STUDENT: 'indigo' } as const;

export default function UsersAdmin() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<Profile[] | null>(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setUsers((data ?? []) as Profile[]));

  useEffect(() => {
    load();
  }, []);

  const changeRole = async (u: Profile, role: UserRole) => {
    if (u.id === profile?.id && role !== 'COACH' && !confirm('Kendi koç yetkini kaldırıyorsun. Emin misin?')) return;
    setError(null);
    const { error } = await supabase
      .from('users')
      .update({ role, grade: role === 'STUDENT' ? u.grade ?? '12' : null })
      .eq('id', u.id);
    if (error) setError(error.message);
    load();
  };

  const list = (users ?? []).filter((u) => (u.name + u.email).toLocaleLowerCase('tr-TR').includes(q.toLocaleLowerCase('tr-TR')));
  const counts = (users ?? []).reduce<Record<string, number>>((a, u) => ({ ...a, [u.role]: (a[u.role] ?? 0) + 1 }), {});

  return (
    <AppLayout title="Kullanıcı Yönetimi" roles={['COACH']}>
      <PageHeader title="Kullanıcı yönetimi" description="Kayıtlı herkesin rolünü buradan belirle. Öğretmen olarak kayıt olanları onaylamak için rolünü kontrol et." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {(['COACH', 'TEACHER', 'STUDENT'] as UserRole[]).map((r) => (
          <div key={r} className="card flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-slate-500">{ROLE_LABEL[r]}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{counts[r] ?? 0}</p>
            </div>
            <Badge tone={ROLE_TONE[r]}>{ROLE_LABEL[r]}</Badge>
          </div>
        ))}
      </div>
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9" placeholder="İsim veya e-posta ara…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {!users ? (
        <LoadingBlock />
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {list.map((u) => (
              <li key={u.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={u.name} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {u.name} {u.id === profile?.id && <span className="text-xs font-normal text-slate-400">(sen)</span>}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {u.email} · {formatDate(u.created_at, { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
                  {(['STUDENT', 'TEACHER', 'COACH'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => u.role !== r && changeRole(u, r)}
                      className={cn('rounded-md px-3 py-1.5 text-xs font-medium transition', u.role === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
                    >
                      {ROLE_LABEL[r]}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="h-4 w-4" /> Kayıt formunda kimse kendini koç yapamaz; koç rolü yalnızca buradan verilir.
      </p>
    </AppLayout>
  );
}
