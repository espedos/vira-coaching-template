import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  CalendarDays,
  MessageSquare,
  ShieldCheck,
  UserCircle,
  LogOut,
  Menu,
  X,
  TrendingUp,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ROLE_LABEL, type UserRole } from '@/types';
import Logo from './Logo';
import { Avatar, LoadingBlock, cn } from './ui';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}

const NAV: NavItem[] = [
  { href: '/panel', label: 'Genel Bakış', icon: LayoutDashboard, roles: ['COACH', 'TEACHER', 'STUDENT'] },
  { href: '/ogrenciler', label: 'Öğrenciler', icon: Users, roles: ['COACH', 'TEACHER'] },
  { href: '/kurslar', label: 'Kurslar', icon: BookOpen, roles: ['COACH', 'TEACHER'] },
  { href: '/kurslar', label: 'Kurslarım', icon: BookOpen, roles: ['STUDENT'] },
  { href: '/odevler', label: 'Ödev & Testler', icon: ClipboardList, roles: ['COACH', 'TEACHER'] },
  { href: '/odevler', label: 'Ödevlerim', icon: ClipboardList, roles: ['STUDENT'] },
  { href: '/ilerleme', label: 'İlerlemem', icon: TrendingUp, roles: ['STUDENT'] },
  { href: '/takvim', label: 'Takvim', icon: CalendarDays, roles: ['COACH', 'TEACHER', 'STUDENT'] },
  { href: '/mesajlar', label: 'Mesajlar', icon: MessageSquare, roles: ['COACH', 'TEACHER', 'STUDENT'] },
  { href: '/kullanicilar', label: 'Kullanıcı Yönetimi', icon: ShieldCheck, roles: ['COACH'] },
  { href: '/profil', label: 'Profil', icon: UserCircle, roles: ['COACH', 'TEACHER', 'STUDENT'] },
];

export default function AppLayout({
  children,
  title,
  roles,
}: {
  children: ReactNode;
  title: string;
  roles?: UserRole[];
}) {
  const { session, profile, loading, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!loading && !session) router.replace(`/giris?next=${encodeURIComponent(router.asPath)}`);
  }, [loading, session, router]);

  useEffect(() => {
    if (!loading && profile && roles && !roles.includes(profile.role)) router.replace('/panel');
  }, [loading, profile, roles, router]);

  useEffect(() => setOpen(false), [router.asPath]);

  useEffect(() => {
    if (!profile) return;
    const load = () =>
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', profile.id)
        .eq('is_read', false)
        .then(({ count }) => setUnread(count ?? 0));
    load();
    const channel = supabase
      .channel(`unread-${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${profile.id}` }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingBlock />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="card max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Profil bulunamadı</h1>
          <p className="mt-2 text-sm text-slate-500">
            Hesabın oluşturuldu ama profil kaydı henüz yok. Veritabanı kurulumunun (sql/03_auth_and_policies.sql) çalıştırıldığından emin ol.
          </p>
          <button onClick={logout} className="btn-secondary mt-6">
            <LogOut className="h-4 w-4" /> Çıkış yap
          </button>
        </div>
      </div>
    );
  }

  const items = NAV.filter((n) => n.roles.includes(profile.role));
  const isActive = (href: string) => (href === '/panel' ? router.pathname === href : router.pathname.startsWith(href));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-6">
        <Logo href="/panel" light />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                active ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <item.icon className={cn('h-[18px] w-[18px]', active ? 'text-indigo-300' : 'text-slate-500 group-hover:text-slate-300')} />
              <span className="flex-1">{item.label}</span>
              {item.href === '/mesajlar' && unread > 0 && (
                <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-[11px] font-semibold text-white">{unread}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={profile.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{profile.name}</p>
            <p className="text-xs text-slate-400">{ROLE_LABEL[profile.role]}</p>
          </div>
          <button
            onClick={async () => {
              await logout();
              router.push('/');
            }}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
            title="Çıkış yap"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>{`${title} · Vira Coaching`}</title>
      </Head>
      <div className="min-h-screen bg-slate-50">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-slate-900 lg:block">{sidebar}</aside>

        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
            <aside className="relative h-full w-72 bg-slate-900 shadow-xl">
              <button onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
              {sidebar}
            </aside>
          </div>
        )}

        <div className="lg:pl-64">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur sm:px-6 lg:hidden">
            <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Menü">
              <Menu className="h-5 w-5" />
            </button>
            <Logo href="/panel" />
          </header>
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">{children}</main>
        </div>
      </div>
    </>
  );
}
