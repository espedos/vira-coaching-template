import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  TrendingUp,
  Users,
  Video,
  Target,
  GraduationCap,
} from 'lucide-react';
import Logo from '@/components/Logo';
import { useAuth } from '@/lib/auth';

const FEATURES = [
  { icon: Video, title: 'Canlı ve kayıtlı dersler', text: 'Canlı oturumlar, kayıtlı videolar ve konu anlatım dokümanları tek yerde.' },
  { icon: ClipboardList, title: 'Ödev ve denemeler', text: 'Ödev, quiz ve TYT/AYT denemeleri verilir, teslim alınır, puanlanır ve geri bildirilir.' },
  { icon: TrendingUp, title: 'İlerleme raporları', text: 'Ders tamamlama, puan ortalamaları ve kurs bazında ilerleme anlık görünür.' },
  { icon: MessageSquare, title: 'Koçla mesajlaşma', text: 'Öğrenci ile koç ve öğretmenler arasında anlık, birebir iletişim.' },
  { icon: CalendarDays, title: 'Takvim ve randevu', text: 'Birebir görüşmeler, grup dersleri ve değerlendirme oturumları planlanır.' },
  { icon: Users, title: 'Birebir ve grup koçluk', text: 'Kişiye özel takip ile aynı hedefe çalışan grupları aynı platformda yönet.' },
];

const ROLES = [
  {
    title: 'Öğrenci',
    icon: GraduationCap,
    points: ['Kurslarına ve derslerine eriş', 'Ödevlerini teslim et, notlarını gör', 'İlerlemeni grafiklerle takip et', 'Koçunla doğrudan yazış'],
  },
  {
    title: 'Öğretmen',
    icon: BookOpen,
    points: ['Ders ve içerik ekle', 'Ödev ve test ver, puanla', 'Öğrenci ilerlemesini izle', 'Oturum planla'],
  },
  {
    title: 'Koç',
    icon: Target,
    points: ['Kursları ve kadroyu yönet', 'Tüm öğrencileri tek ekranda gör', 'Birebir koçluk görüşmeleri planla', 'Rolleri ve erişimi yönet'],
  },
];

export default function Home() {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo light />
          <div className="flex items-center gap-2">
            {session ? (
              <Link href="/panel" className="btn bg-white text-slate-900 hover:bg-slate-100">
                Panele git <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/giris" className="btn text-white/90 hover:bg-white/10 hover:text-white">
                  Giriş yap
                </Link>
                <Link href="/kayit" className="btn bg-white text-slate-900 hover:bg-slate-100">
                  Kayıt ol
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 pb-24 pt-36 sm:pb-32 sm:pt-44">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-600/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[500px] rounded-full bg-violet-600/20 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-indigo-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            12. sınıf ve mezunlar için YKS koçluğu
          </span>
          <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            YKS yolculuğunu
            <span className="block bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              planlı ve ölçülebilir yap
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            Dersler, ödevler, denemeler, koçluk görüşmeleri ve ilerleme raporları tek platformda. Öğrenci, öğretmen ve koç aynı hedefe birlikte çalışır.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={session ? '/panel' : '/kayit'} className="btn bg-indigo-500 px-6 py-3 text-base text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-400">
              {session ? 'Panele git' : 'Ücretsiz hesap oluştur'} <ArrowRight className="h-4 w-4" />
            </Link>
            {!session && (
              <Link href="/giris" className="btn border border-white/15 px-6 py-3 text-base text-white hover:bg-white/10">
                Hesabım var
              </Link>
            )}
          </div>

          {/* Mock dashboard preview */}
          <div className="relative mx-auto mt-16 max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur">
            <div className="rounded-xl bg-white p-5 text-left">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { l: 'Tamamlanan ders', v: '42', c: 'text-indigo-600' },
                  { l: 'Ortalama puan', v: '86', c: 'text-emerald-600' },
                  { l: 'Bekleyen ödev', v: '3', c: 'text-amber-600' },
                ].map((s) => (
                  <div key={s.l} className="rounded-lg border border-slate-100 p-3">
                    <p className="text-[11px] text-slate-500 sm:text-xs">{s.l}</p>
                    <p className={`mt-1 text-xl font-bold sm:text-2xl ${s.c}`}>{s.v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { n: 'AYT Matematik', p: 72 },
                  { n: 'TYT Türkçe', p: 88 },
                  { n: 'AYT Fizik', p: 54 },
                ].map((c) => (
                  <div key={c.n}>
                    <div className="mb-1 flex justify-between text-xs text-slate-600">
                      <span className="font-medium">{c.n}</span>
                      <span>%{c.p}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${c.p}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Platform</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Koçluk sürecinin tamamı tek yerde</h2>
            <p className="mt-4 text-lg text-slate-500">Dağınık WhatsApp grupları ve Excel tabloları yerine düzenli, takip edilebilir bir sistem.</p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-slate-200 p-6 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5">
                <div className="inline-flex rounded-xl bg-indigo-50 p-3 text-indigo-600 ring-1 ring-indigo-100">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="bg-slate-50 py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Herkes için ayrı panel</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Öğrenci, öğretmen ve koç</h2>
          </div>
          <div className="mt-16 grid gap-6 lg:grid-cols-3">
            {ROLES.map((r) => (
              <div key={r.title} className="card p-8">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 text-white shadow-sm">
                    <r.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">{r.title}</h3>
                </div>
                <ul className="mt-6 space-y-3">
                  {r.points.map((p) => (
                    <li key={p} className="flex items-start gap-3 text-sm text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 px-8 py-14 text-center shadow-xl sm:px-16">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <h2 className="relative text-3xl font-bold tracking-tight text-white sm:text-4xl">Hazırlığa bugün başla</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-indigo-100">Hesabını oluştur, koçun seni kurslarına eklesin ve ilk haftanın planı hazır olsun.</p>
            <Link href={session ? '/panel' : '/kayit'} className="btn relative mt-8 bg-white px-6 py-3 text-base text-indigo-700 hover:bg-indigo-50">
              {session ? 'Panele git' : 'Hemen kayıt ol'} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <Logo />
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} Vira Coaching. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
