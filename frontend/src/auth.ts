import { createClient, type SupabaseClient, type User, type Session } from '@supabase/supabase-js';

const ALLOWED_REDIRECT_PATHS = new Set(['/', '/workspace', '/account', '/privacy', '/login', '/auth/check-email', '/auth/callback']);

let client: SupabaseClient | null = null;

function getSupabaseEnv(): { url: string; key: string } | null {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env;
  const url = env?.VITE_SUPABASE_URL;
  const key = env?.VITE_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('your-project') || key.includes('your-supabase-anon-key')) {
    return null;
  }
  return { url, key };
}

export function isAuthConfigured(): boolean {
  return getSupabaseEnv() !== null;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (client) return client;
  const env = getSupabaseEnv();
  if (!env) return null;
  client = createClient(env.url, env.key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}

export function validateRedirectDestination(target?: string | null): string {
  if (!target) return '/workspace';
  try {
    const url = new URL(target, window.location.origin);
    if (url.origin !== window.location.origin) {
      return '/workspace';
    }
    const path = url.pathname;
    if (ALLOWED_REDIRECT_PATHS.has(path)) {
      return path;
    }
  } catch {
    if (ALLOWED_REDIRECT_PATHS.has(target)) {
      return target;
    }
  }
  return '/workspace';
}

export async function signInWithEmail(email: string, redirectToPath: string = '/auth/callback'): Promise<{ error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: new Error('Sign-in is not configured.') };
  }
  const emailRedirectTo = `${window.location.origin}${redirectToPath}`;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo,
    },
  });
  return { error: error ? new Error(error.message) : null };
}

export async function signOutUser(): Promise<{ error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: null };
  }
  const { error } = await supabase.auth.signOut();
  return { error: error ? new Error(error.message) : null };
}

export async function getCurrentSession(): Promise<Session | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

export function onAuthStateChange(callback: (event: string, session: Session | null) => void): { unsubscribe: () => void } | null {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return { unsubscribe: () => subscription.unsubscribe() };
}

export function getInitialsFromEmail(email?: string | null, name?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (!email || !email.trim()) return 'GU';
  const handle = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
  if (handle.length >= 2) return handle.slice(0, 2).toUpperCase();
  return handle.slice(0, 1).toUpperCase() || 'U';
}
