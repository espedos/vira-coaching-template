import { useEffect, useState, type FormEvent } from 'react';
import AppLayout from '@/components/AppLayout';
import { Alert, Avatar, Badge, Card, Field, PageHeader, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ROLE_LABEL } from '@/types';

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', grade: '12', field: '', target_score: '', bio: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pw, setPw] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    if (profile)
      setForm({
        name: profile.name,
        phone: profile.phone ?? '',
        grade: profile.grade ?? '12',
        field: profile.field ?? '',
        target_score: profile.target_score ?? '',
        bio: profile.bio ?? '',
      });
  }, [profile]);

  if (!profile) return <AppLayout title="Profil">{null}</AppLayout>;
  const isStudent = profile.role === 'STUDENT';

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await supabase
      .from('users')
      .update({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        bio: form.bio.trim() || null,
        ...(isStudent ? { grade: form.grade, field: form.field || null, target_score: form.target_score.trim() || null } : {}),
      })
      .eq('id', profile.id);
    setBusy(false);
    if (error) return setMsg({ ok: false, text: error.message });
    await refreshProfile();
    setMsg({ ok: true, text: 'Profil güncellendi.' });
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) return setMsg({ ok: false, text: 'Yeni şifre en az 6 karakter olmalı.' });
    setPwBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPwBusy(false);
    setPw('');
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Şifren değiştirildi.' });
  };

  return (
    <AppLayout title="Profil">
      <PageHeader title="Profil" description="Kişisel bilgilerini ve hesap ayarlarını yönet." />
      {msg && <div className="mb-6"><Alert tone={msg.ok ? 'emerald' : 'rose'}>{msg.text}</Alert></div>}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card flex flex-col items-center p-8 text-center">
          <Avatar name={profile.name} size="lg" />
          <p className="mt-4 text-lg font-semibold text-slate-900">{profile.name}</p>
          <p className="text-sm text-slate-500">{profile.email}</p>
          <div className="mt-3">
            <Badge tone="indigo">{ROLE_LABEL[profile.role]}</Badge>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Kişisel bilgiler">
            <form onSubmit={save} className="grid gap-5 sm:grid-cols-2">
              <Field label="Ad Soyad">
                <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Telefon">
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
              {isStudent && (
                <>
                  <Field label="Durum">
                    <select className="input" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
                      <option value="12">12. sınıf</option>
                      <option value="MEZUN">Mezun</option>
                    </select>
                  </Field>
                  <Field label="Alan">
                    <select className="input" value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })}>
                      <option value="">Seçilmedi</option>
                      <option value="SAY">Sayısal</option>
                      <option value="EA">Eşit Ağırlık</option>
                      <option value="SOZ">Sözel</option>
                      <option value="DIL">Dil</option>
                    </select>
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Hedef (bölüm / sıralama / puan)">
                      <input className="input" value={form.target_score} onChange={(e) => setForm({ ...form, target_score: e.target.value })} placeholder="ör. Tıp — ilk 20.000" />
                    </Field>
                  </div>
                </>
              )}
              <div className="sm:col-span-2">
                <Field label="Hakkımda">
                  <textarea rows={3} className="input" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                </Field>
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button type="submit" disabled={busy} className="btn-primary">
                  {busy ? <Spinner className="h-4 w-4 text-white" /> : 'Kaydet'}
                </button>
              </div>
            </form>
          </Card>

          <Card title="Şifre değiştir">
            <form onSubmit={changePassword} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Field label="Yeni şifre">
                  <input type="password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
                </Field>
              </div>
              <button type="submit" disabled={pwBusy || !pw} className="btn-secondary">
                {pwBusy ? <Spinner className="h-4 w-4" /> : 'Güncelle'}
              </button>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
