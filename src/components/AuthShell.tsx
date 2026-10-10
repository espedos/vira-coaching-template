import type { ReactNode } from 'react';
import Head from 'next/head';
import { CheckCircle2 } from 'lucide-react';
import Logo from './Logo';

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <>
      <Head>
        <title>{`${title} · Vira Coaching`}</title>
      </Head>
      <div className="flex min-h-screen bg-white">
        <div className="relative hidden w-[46%] overflow-hidden bg-slate-950 lg:block">
          <div className="absolute -left-20 top-0 h-[500px] w-[500px] rounded-full bg-indigo-600/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-violet-600/25 blur-3xl" />
          <div className="relative flex h-full flex-col justify-between p-12">
            <Logo light />
            <div>
              <h2 className="text-3xl font-bold leading-tight text-white">
                Hedefine giden yolda
                <br />
                her adım ölçülür.
              </h2>
              <ul className="mt-8 space-y-4">
                {['Kişiye özel ders ve ödev planı', 'Haftalık ilerleme raporları', 'Koçunla birebir iletişim'].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 className="h-5 w-5 text-indigo-400" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-slate-500">YKS · 12. sınıf ve mezun</p>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <Logo />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </>
  );
}
