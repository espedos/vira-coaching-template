import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowRight } from 'lucide-react';
import AuthShell from '@/components/AuthShell';
import { Alert, Field, Spinner } from '@/components/ui';
import { signIn, translateAuthError } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export default function Login() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const next = typeof router.query.next === 'string' && router.query.next.startsWith('/') ? router.query.next : '/panel';

  useEffect(() => {
    if (!loading && session) router.replace(next);
  }, [loading, session, next, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      router.replace(next);
    } catch (err) {
      setError(translateAuthError((err as Error).message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Tekrar hoş geldin" subtitle="Paneline erişmek için giriş yap.">
      <form onSubmit={onSubmit} className="space-y-5">
        {router.query.registered && <Alert tone="emerald">Hesabın oluşturuldu. E-postana gelen doğrulama bağlantısına tıkladıktan sonra giriş yapabilirsin.</Alert>}
        {error && <Alert>{error}</Alert>}
        <Field label="E-posta">
          <input type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@mail.com" />
        </Field>
        <Field label="Şifre">
          <input type="password" required autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </Field>
        <button type="submit" disabled={busy} className="btn-primary w-full py-3">
          {busy ? <Spinner className="h-4 w-4 text-white" /> : <>Giriş yap <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>
      <p className="mt-8 text-center text-sm text-slate-500">
        Hesabın yok mu?{' '}
        <Link href="/kayit" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Kayıt ol
        </Link>
      </p>
    </AuthShell>
  );
}
