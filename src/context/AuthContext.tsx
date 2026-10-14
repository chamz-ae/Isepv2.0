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
  signIn: (usernameOrEmail: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  setDemoRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>('owner');
  const [isLoading, setIsLoading] = useState(true);
  const configured = isSupabaseConfigured();

  const supabase = createClient();

  useEffect(() => {
    if (!configured) {
      // Offline / local mode: Check if admin has explicitly logged in
      try {
        const savedSession = sessionStorage.getItem('asap_admin_session') || localStorage.getItem('asap_admin_session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed && parsed.role) {
            setRole(parsed.role as UserRole);
            setProfile({
              id: parsed.id || '00000000-0000-0000-0000-000000000001',
              full_name: parsed.full_name || `${parsed.role.toUpperCase()} Operator`,
              role: parsed.role as UserRole,
              is_active: true,
              created_at: parsed.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            setUser({ id: parsed.id || 'admin-local-user', email: parsed.email || `${parsed.role}@asapisep.com` });
          }
        } else {
          // Mandatory login: No session saved, user must enter credentials
          setProfile(null);
          setUser(null);
        }
      } catch {
        setProfile(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Supabase is configured: fetch real session
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
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
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
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured, supabase]);

  const signIn = async (usernameOrEmail: string, password: string): Promise<{ error?: string }> => {
    const cleanUser = (usernameOrEmail || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanUser) {
      return { error: 'Username atau Email operator wajib diisi.' };
    }
    if (!cleanPass) {
      return { error: 'Kata sandi wajib diisi.' };
    }

    if (!configured) {
      // Local authentication validation
      // Accept standard usernames/emails: admin, owner, kasir, kitchen, purchasing, housekeeping
      let matchedRole: UserRole | null = null;
      let displayName = '';

      if (cleanUser.includes('owner')) {
        matchedRole = 'owner';
        displayName = 'Owner ASAP ISEP';
      } else if (cleanUser.includes('admin')) {
        matchedRole = 'admin';
        displayName = 'Administrator Operasional';
      } else if (cleanUser.includes('kasir') || cleanUser.includes('pos')) {
        matchedRole = 'kasir';
        displayName = 'Kasir & Front Office';
      } else if (cleanUser.includes('kitchen') || cleanUser.includes('kds') || cleanUser.includes('dapur')) {
        matchedRole = 'kitchen';
        displayName = 'Kitchen & Smokehouse Chef';
      } else if (cleanUser.includes('purchasing') || cleanUser.includes('belanja')) {
        matchedRole = 'purchasing';
        displayName = 'Staff Purchasing';
      } else if (cleanUser.includes('housekeeping')) {
        matchedRole = 'housekeeping';
        displayName = 'Staff Housekeeping';
      } else {
        matchedRole = 'admin';
        displayName = cleanUser.charAt(0).toUpperCase() + cleanUser.slice(1);
      }

      if (cleanPass.length < 3) {
        return { error: 'Kata sandi minimal 3 karakter.' };
      }

      const sessionObj = {
        id: '00000000-0000-0000-0000-000000000001',
        full_name: displayName,
        email: cleanUser.includes('@') ? cleanUser : `${cleanUser}@asapisep.com`,
        role: matchedRole,
        created_at: new Date().toISOString(),
      };

      setRole(matchedRole);
      setProfile({
        id: sessionObj.id,
        full_name: displayName,
        role: matchedRole,
        is_active: true,
        created_at: sessionObj.created_at,
        updated_at: new Date().toISOString(),
      });
      setUser({ id: sessionObj.id, email: sessionObj.email });

      sessionStorage.setItem('asap_admin_session', JSON.stringify(sessionObj));
      localStorage.setItem('asap_admin_session', JSON.stringify(sessionObj));
      localStorage.setItem('asap_demo_role', matchedRole);

      return {};
    }

    try {
      const emailToUse = cleanUser.includes('@') ? cleanUser : `${cleanUser}@asapisep.com`;
      const { error } = await supabase.auth.signInWithPassword({ email: emailToUse, password: cleanPass });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err.message || 'Gagal login' };
    }
  };

  const signOut = async () => {
    if (configured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    sessionStorage.removeItem('asap_admin_session');
    localStorage.removeItem('asap_admin_session');
    localStorage.removeItem('asap_demo_role');
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
      sessionStorage.setItem('asap_admin_session', JSON.stringify(sessionObj));
      localStorage.setItem('asap_admin_session', JSON.stringify(sessionObj));
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
