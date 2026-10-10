import Link from 'next/link';

export default function Logo({ href = '/', light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm shadow-indigo-500/30">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 6l7 13 7-13" />
        </svg>
      </span>
      <span className={`text-lg font-bold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>
        Vira <span className={light ? 'text-indigo-300' : 'text-indigo-600'}>Coaching</span>
      </span>
    </Link>
  );
}
