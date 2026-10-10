import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Role = 'COACH' | 'TEACHER' | 'STUDENT';

/**
 * Sign up. The profile row in `users` is created by the `on_auth_user_created`
 * database trigger from this metadata (see sql/03_auth_and_policies.sql).
 */
export async function signUp(params: {
  email: string;
  password: string;
  name: string;
  role: 'STUDENT' | 'TEACHER';
  grade?: '12' | 'MEZUN';
  phone?: string;
}) {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/giris` : undefined,
      data: { name: params.name, role: params.role, grade: params.grade, phone: params.phone },
    },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-posta veya şifre hatalı.';
  if (m.includes('email not confirmed')) return 'E-posta adresin henüz doğrulanmadı. Gelen kutunu kontrol et.';
  if (m.includes('already registered')) return 'Bu e-posta ile zaten bir hesap var.';
  if (m.includes('password should be at least')) return 'Şifre en az 6 karakter olmalı.';
  if (m.includes('rate limit')) return 'Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.';
  return message;
}
