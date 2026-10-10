import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, MessageSquare, Search, Send } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Avatar, EmptyState, cn, relativeTime } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ROLE_LABEL, type Message, type Profile } from '@/types';

export default function Messages() {
  const { profile } = useAuth();
  const router = useRouter();
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [q, setQ] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const [{ data: users }, { data: msgs }] = await Promise.all([
      supabase.from('users').select('*').neq('id', profile.id).order('name'),
      supabase.from('messages').select('*').or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`).order('created_at'),
    ]);
    let list = (users ?? []) as Profile[];
    // Students only message staff; staff can message everyone
    if (profile.role === 'STUDENT') list = list.filter((u) => u.role !== 'STUDENT');
    setContacts(list);
    setMessages((msgs ?? []) as Message[]);
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (typeof router.query.kisi === 'string') setActiveId(router.query.kisi);
  }, [router.query.kisi]);

  // Realtime: new messages to me
  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel(`inbox-${profile.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${profile.id}` }, (payload) => {
        setMessages((m) => (m.some((x) => x.id === (payload.new as Message).id) ? m : [...m, payload.new as Message]));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const threads = useMemo(() => {
    if (!profile) return [];
    return contacts
      .map((c) => {
        const conv = messages.filter((m) => m.sender_id === c.id || m.receiver_id === c.id);
        const last = conv[conv.length - 1];
        const unread = conv.filter((m) => m.sender_id === c.id && !m.is_read).length;
        return { contact: c, last, unread };
      })
      .filter((t) => (t.contact.name + t.contact.email).toLocaleLowerCase('tr-TR').includes(q.toLocaleLowerCase('tr-TR')))
      .sort((a, b) => (b.last?.created_at ?? '').localeCompare(a.last?.created_at ?? '') || a.contact.name.localeCompare(b.contact.name, 'tr'));
  }, [contacts, messages, profile, q]);

  const active = contacts.find((c) => c.id === activeId) ?? null;
  const conversation = active ? messages.filter((m) => m.sender_id === active.id || m.receiver_id === active.id) : [];

  // Mark read when opening / receiving
  useEffect(() => {
    if (!profile || !active) return;
    const unreadIds = conversation.filter((m) => m.sender_id === active.id && !m.is_read).map((m) => m.id);
    if (!unreadIds.length) return;
    supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', unreadIds)
      .then(() => setMessages((ms) => ms.map((m) => (unreadIds.includes(m.id) ? { ...m, is_read: true } : m))));
  }, [active, conversation, profile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.length, activeId]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile || !active || !draft.trim()) return;
    const content = draft.trim();
    setDraft('');
    const { data } = await supabase.from('messages').insert({ sender_id: profile.id, receiver_id: active.id, content }).select().single();
    if (data) setMessages((m) => [...m, data as Message]);
  };

  return (
    <AppLayout title="Mesajlar">
      <div className="card flex h-[calc(100vh-8rem)] min-h-[520px] overflow-hidden lg:h-[calc(100vh-5rem)]">
        {/* Thread list */}
        <aside className={cn('w-full flex-col border-r border-slate-100 md:flex md:w-80', active ? 'hidden' : 'flex')}>
          <div className="border-b border-slate-100 p-4">
            <h1 className="mb-3 text-lg font-semibold text-slate-900">Mesajlar</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="input pl-9" placeholder="Kişi ara…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto">
            {threads.length === 0 && <p className="p-6 text-center text-sm text-slate-500">Mesajlaşabileceğin kimse yok.</p>}
            {threads.map(({ contact, last, unread }) => (
              <li key={contact.id}>
                <button
                  onClick={() => setActiveId(contact.id)}
                  className={cn('flex w-full items-center gap-3 px-4 py-3 text-left transition', activeId === contact.id ? 'bg-indigo-50/70' : 'hover:bg-slate-50')}
                >
                  <Avatar name={contact.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={cn('truncate text-sm', unread ? 'font-semibold text-slate-900' : 'font-medium text-slate-800')}>{contact.name}</p>
                      {last && <span className="shrink-0 text-[11px] text-slate-400">{relativeTime(last.created_at)}</span>}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn('truncate text-xs', unread ? 'text-slate-700' : 'text-slate-500')}>
                        {last ? `${last.sender_id === profile?.id ? 'Sen: ' : ''}${last.content}` : ROLE_LABEL[contact.role]}
                      </p>
                      {unread > 0 && <span className="shrink-0 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">{unread}</span>}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Conversation */}
        <section className={cn('flex-1 flex-col', active ? 'flex' : 'hidden md:flex')}>
          {!active ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState icon={MessageSquare} title="Bir konuşma seç" description="Soldaki listeden bir kişi seçerek mesajlaşmaya başla." />
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                <button onClick={() => setActiveId(null)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <Avatar name={active.name} />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{active.name}</p>
                  <p className="text-xs text-slate-500">{ROLE_LABEL[active.role]}</p>
                </div>
              </header>
              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-4 py-5 sm:px-6">
                {conversation.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Henüz mesaj yok. İlk mesajı sen gönder.</p>}
                {conversation.map((m, i) => {
                  const mine = m.sender_id === profile?.id;
                  const prev = conversation[i - 1];
                  const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString();
                  return (
                    <div key={m.id}>
                      {newDay && (
                        <p className="my-4 text-center text-[11px] font-medium uppercase tracking-wide text-slate-400">
                          {new Date(m.created_at).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                      )}
                      <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                        <div
                          className={cn(
                            'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                            mine ? 'rounded-br-md bg-indigo-600 text-white' : 'rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-200'
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <p className={cn('mt-1 text-right text-[10px]', mine ? 'text-indigo-200' : 'text-slate-400')}>
                            {new Date(m.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            {mine && (m.is_read ? ' · Okundu' : '')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={send} className="flex items-end gap-2 border-t border-slate-100 p-3 sm:p-4">
                <textarea
                  rows={1}
                  className="input max-h-32 resize-none"
                  placeholder="Mesaj yaz…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send(e);
                    }
                  }}
                />
                <button type="submit" disabled={!draft.trim()} className="btn-primary h-[42px] px-4" aria-label="Gönder">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
