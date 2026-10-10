import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowRight, BookOpen, GraduationCap } from 'lucide-react';
import AuthShell from '@/components/AuthShell';
import { Alert, Field, Spinner, cn } from '@/components/ui';
import { signUp, translateAuthError } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export default function Register() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [grade, setGrade] = useState<'12' | 'MEZUN'>('12');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) router.replace('/panel');
  }, [loading, session, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError('Şifre en az 6 karakter olmalı.');
    setBusy(true);
    try {
      const data = await signUp({
        email: email.trim(),
        password,
        name: name.trim(),
        role,
        grade: role === 'STUDENT' ? grade : undefined,
        phone: phone.trim() || undefined,
      });
      if (data.session) router.replace('/panel');
      else router.replace('/giris?registered=1');
    } catch (err) {
      setError(translateAuthError((err as Error).message));
    } finally {
      setBusy(false);
    }
  };

  const roleOption = (value: 'STUDENT' | 'TEACHER', label: string, Icon: typeof GraduationCap, desc: string) => (
    <button
      type="button"
      onClick={() => setRole(value)}
      className={cn(
        'flex flex-1 items-start gap-3 rounded-xl border p-4 text-left transition',
        role === value ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300'
      )}
    >
      <Icon className={cn('mt-0.5 h-5 w-5', role === value ? 'text-indigo-600' : 'text-slate-400')} />
      <span>
        <span className="block text-sm font-semibold text-slate-900">{label}</span>
        <span className="block text-xs text-slate-500">{desc}</span>
      </span>
    </button>
  );

  return (
    <AuthShell title="Hesap oluştur" subtitle="Birkaç saniyede kayıt ol ve paneline eriş.">
      <form onSubmit={onSubmit} className="space-y-5">
        {error && <Alert>{error}</Alert>}
        <div className="flex gap-3">
          {roleOption('STUDENT', 'Öğrenci', GraduationCap, 'YKS hazırlığı')}
          {roleOption('TEACHER', 'Öğretmen', BookOpen, 'Ders veriyorum')}
        </div>
        <Field label="Ad Soyad">
          <input required className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Adın Soyadın" />
        </Field>
        <Field label="E-posta">
          <input type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@mail.com" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Telefon (isteğe bağlı)">
            <input type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xx xxx xx xx" />
          </Field>
          {role === 'STUDENT' && (
            <Field label="Durum">
              <select className="input" value={grade} onChange={(e) => setGrade(e.target.value as '12' | 'MEZUN')}>
                <option value="12">12. sınıf</option>
                <option value="MEZUN">Mezun</option>
              </select>
            </Field>
          )}
        </div>
        <Field label="Şifre" hint="En az 6 karakter">
          <input type="password" required autoComplete="new-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </Field>
        <button type="submit" disabled={busy} className="btn-primary w-full py-3">
          {busy ? <Spinner className="h-4 w-4 text-white" /> : <>Hesabı oluştur <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>
      <p className="mt-8 text-center text-sm text-slate-500">
        Zaten hesabın var mı?{' '}
        <Link href="/giris" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Giriş yap
        </Link>
      </p>
    </AuthShell>
  );
}
