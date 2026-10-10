import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Profile } from '@/types';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  logout: async () => {},
});

async function fetchProfile(authId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('users').select('*').eq('auth_id', authId).maybeSingle();
  if (error) {
    console.error('Profil alınamadı:', error.message);
    return null;
  }
  return (data as Profile) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (s: Session | null) => {
    setSession(s);
    setProfile(s?.user ? await fetchProfile(s.user.id) : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => load(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      // Defer to avoid running queries inside the auth callback lock
      setTimeout(() => load(s), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) setProfile(await fetchProfile(session.user.id));
  }, [session]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading, refreshProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
