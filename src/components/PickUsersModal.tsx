import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import { Avatar, Modal, Spinner } from './ui';

export default function PickUsersModal({
  open,
  onClose,
  title,
  role,
  exclude,
  onPick,
  single,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  role: 'STUDENT' | 'TEACHER';
  exclude: string[];
  onPick: (ids: string[]) => Promise<void>;
  single?: boolean;
}) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPicked(new Set());
    supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .order('name')
      .then(({ data }) => setUsers((data ?? []) as Profile[]));
  }, [open, role]);

  const list = users.filter((u) => !exclude.includes(u.id) && (u.name + u.email).toLocaleLowerCase('tr-TR').includes(q.toLocaleLowerCase('tr-TR')));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Vazgeç</button>
          <button
            disabled={!picked.size || busy}
            onClick={async () => {
              setBusy(true);
              await onPick(Array.from(picked));
              setBusy(false);
              onClose();
            }}
            className="btn-primary"
          >
            {busy ? <Spinner className="h-4 w-4 text-white" /> : `Ekle${picked.size ? ` (${picked.size})` : ''}`}
          </button>
        </>
      }
    >
      <input className="input mb-4" placeholder="İsim veya e-posta ara…" value={q} onChange={(e) => setQ(e.target.value)} />
      {list.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">{role === 'STUDENT' ? 'Eklenebilecek öğrenci yok.' : 'Eklenebilecek öğretmen yok.'}</p>
      ) : (
        <ul className="max-h-80 space-y-1 overflow-y-auto">
          {list.map((u) => {
            const on = picked.has(u.id);
            return (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() =>
                    setPicked((s) => {
                      const n = single ? new Set<string>() : new Set(s);
                      on ? n.delete(u.id) : n.add(u.id);
                      return n;
                    })
                  }
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${on ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-slate-50'}`}
                >
                  <Avatar name={u.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900">{u.name}</span>
                    <span className="block truncate text-xs text-slate-500">{u.email}</span>
                  </span>
                  {on && <CheckCircle2 className="h-5 w-5 text-indigo-600" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
