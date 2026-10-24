'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Profile, UserRole } from '@/lib/supabase/types';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  role: UserRole;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (
    usernameOrEmail: string,
    password: string,
    selectedRole?: UserRole
  ) => Promise<{ error?: string; role?: UserRole }>;
  signOut: () => Promise<void>;
  setDemoRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to synchronously read saved session from storage or cookie
export function getSavedSession(): { profile: Profile | null; role: UserRole } {
  if (typeof window === 'undefined') {
    return { profile: null, role: 'owner' };
  }

  try {
    let saved =
      sessionStorage.getItem('asap_admin_session') ||
      localStorage.getItem('asap_admin_session');

    if (!saved && typeof document !== 'undefined') {
      const match = document.cookie.match(/asap_admin_session=([^;]+)/);
      if (match) {
        saved = decodeURIComponent(match[1]);
      }
    }

    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.role) {
        const parsedRole = parsed.role as UserRole;
        const prof: Profile = {
          id: parsed.id || '00000000-0000-0000-0000-000000000001',
          full_name: parsed.full_name || `${parsedRole.toUpperCase()} Operator`,
          role: parsedRole,
          is_active: true,
          created_at: parsed.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return { profile: prof, role: parsedRole };
      }
    }
  } catch (e) {
    console.warn('Initial session parse error:', e);
  }

  return { profile: null, role: 'owner' };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>('owner');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const configured = isSupabaseConfigured();

  const supabase = createClient();

  useEffect(() => {
    // 1. Immediately restore local session if present
    const saved = getSavedSession();
    if (saved.profile) {
      setProfile(saved.profile);
      setRole(saved.role);
      setUser({ id: saved.profile.id, email: `${saved.role}@asapisep.com` });
    }

    if (!configured) {
      setIsLoading(false);
      return;
    }

    // 2. If Supabase configured, check remote auth session
    const fetchSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (prof) {
            setProfile(prof as Profile);
            setRole(prof.role as UserRole);
          } else {
            const defaultRole = (session.user.user_metadata?.role as UserRole) || 'kasir';
            setRole(defaultRole);
            setProfile({
              id: session.user.id,
              full_name: session.user.user_metadata?.full_name || session.user.email || 'Operator',
              role: defaultRole,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        console.warn('Supabase remote session check error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (prof) {
          setProfile(prof as Profile);
          setRole(prof.role as UserRole);
        }
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured, supabase]);

  const signIn = async (
    usernameOrEmail: string,
    password: string,
    selectedRole?: UserRole
  ): Promise<{ error?: string; role?: UserRole }> => {
    const cleanUser = (usernameOrEmail || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanUser) {
      return { error: 'Email akun owner wajib diisi.' };
    }
    if (!cleanPass) {
      return { error: 'Kata sandi wajib diisi.' };
    }
    if (cleanPass.length < 3) {
      return { error: 'Kata sandi minimal 3 karakter.' };
    }

    // Role is strictly 'owner'
    const targetRole: UserRole = 'owner';
    const displayName = 'Owner ASAP ISEP';

    const persistSession = (sessionObj: any) => {
      setRole('owner');
      setProfile({
        id: sessionObj.id,
        full_name: sessionObj.full_name || displayName,
        role: 'owner',
        is_active: true,
        created_at: sessionObj.created_at,
        updated_at: new Date().toISOString(),
      });
      setUser({ id: sessionObj.id, email: sessionObj.email });

      const json = JSON.stringify(sessionObj);
      sessionStorage.setItem('asap_admin_session', json);
      localStorage.setItem('asap_admin_session', json);
      localStorage.setItem('asap_demo_role', 'owner');

      if (typeof document !== 'undefined') {
        document.cookie = `asap_admin_session=${encodeURIComponent(
          json
        )}; path=/; max-age=604800; SameSite=Lax`;
      }
    };

    // If Supabase is configured, authenticate via Supabase Auth
    if (configured) {
      try {
        const emailToUse = cleanUser.includes('@') ? cleanUser : `${cleanUser}@asapisep.com`;
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password: cleanPass,
        });

        if (error) {
          const errMsg = error.message.toLowerCase();
          if (errMsg.includes('invalid login credentials') || errMsg.includes('invalid credentials')) {
            return { error: 'Email atau kata sandi tidak cocok dengan akun terdaftar di Supabase.' };
          }
          if (errMsg.includes('email not confirmed')) {
            return { error: 'Email belum dikonfirmasi di Supabase. Silakan cek kotak masuk email Anda.' };
          }
          return { error: error.message };
        }

        if (data?.user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const sessionObj = {
            id: data.user.id,
            full_name: prof?.full_name || data.user.user_metadata?.full_name || displayName,
            role: 'owner' as UserRole,
            email: data.user.email || emailToUse,
            created_at: new Date().toISOString(),
          };

          persistSession(sessionObj);
          return { role: 'owner' };
        }
      } catch (err: any) {
        console.warn('Supabase remote sign in error:', err);
        // If offline dev environment (network fetch failed / no internet access), allow fallback for local development:
        if (
          err?.message?.includes('fetch failed') ||
          err?.name === 'AuthRetryableFetchError' ||
          (typeof window !== 'undefined' && !window.navigator.onLine)
        ) {
          const sessionObj = {
            id: '00000000-0000-0000-0000-000000000001',
            full_name: 'Owner ASAP ISEP (Offline/Dev)',
            email: cleanUser.includes('@') ? cleanUser : `${cleanUser}@asapisep.com`,
            role: 'owner' as UserRole,
            created_at: new Date().toISOString(),
          };
          persistSession(sessionObj);
          return { role: 'owner' };
        }
        return { error: err.message || 'Gagal menghubungi server Supabase.' };
      }
    }

    // Fallback if Supabase credentials are not configured:
    const sessionObj = {
      id: '00000000-0000-0000-0000-000000000001',
      full_name: displayName,
      email: cleanUser.includes('@') ? cleanUser : `${cleanUser}@asapisep.com`,
      role: 'owner' as UserRole,
      created_at: new Date().toISOString(),
    };

    persistSession(sessionObj);
    return { role: 'owner' };
  };

  const signOut = async () => {
    if (configured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // ignore
      }
    }
    setUser(null);
    setProfile(null);
    sessionStorage.removeItem('asap_admin_session');
    localStorage.removeItem('asap_admin_session');
    localStorage.removeItem('asap_demo_role');

    if (typeof document !== 'undefined') {
      document.cookie = 'asap_admin_session=; path=/; max-age=0';
    }
  };

  const setDemoRole = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem('asap_demo_role', newRole);
    if (profile) {
      const updatedProfile = {
        ...profile,
        role: newRole,
        full_name: `${newRole.toUpperCase()} Operator`,
      };
      setProfile(updatedProfile);
      const sessionObj = {
        id: profile.id,
        full_name: updatedProfile.full_name,
        role: newRole,
        email: `${newRole}@asapisep.com`,
        created_at: profile.created_at,
      };
      const json = JSON.stringify(sessionObj);
      sessionStorage.setItem('asap_admin_session', json);
      localStorage.setItem('asap_admin_session', json);

      if (typeof document !== 'undefined') {
        document.cookie = `asap_admin_session=${encodeURIComponent(
          json
        )}; path=/; max-age=604800; SameSite=Lax`;
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isLoading,
        isConfigured: configured,
        signIn,
        signOut,
        setDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
