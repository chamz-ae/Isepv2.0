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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>('owner');
  const [isLoading, setIsLoading] = useState(true);
  const configured = isSupabaseConfigured();

  const supabase = createClient();

  useEffect(() => {
    const restoreLocalSession = () => {
      try {
        const savedSession =
          sessionStorage.getItem('asap_admin_session') ||
          localStorage.getItem('asap_admin_session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed && parsed.role) {
            const parsedRole = parsed.role as UserRole;
            setRole(parsedRole);
            setProfile({
              id: parsed.id || '00000000-0000-0000-0000-000000000001',
              full_name: parsed.full_name || `${parsedRole.toUpperCase()} Operator`,
              role: parsedRole,
              is_active: true,
              created_at: parsed.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            setUser({
              id: parsed.id || 'admin-local-user',
              email: parsed.email || `${parsedRole}@asapisep.com`,
            });
            return true;
          }
        }
      } catch (e) {
        console.warn('Failed to parse local admin session:', e);
      }
      return false;
    };

    if (!configured) {
      restoreLocalSession();
      setIsLoading(false);
      return;
    }

    // Supabase is configured: fetch session, fallback to local admin session
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
          // If no Supabase user session active, check if local staff session was saved
          const restored = restoreLocalSession();
          if (!restored) {
            setUser(null);
            setProfile(null);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        restoreLocalSession();
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
      return { error: 'Username atau Email operator wajib diisi.' };
    }
    if (!cleanPass) {
      return { error: 'Kata sandi wajib diisi.' };
    }
    if (cleanPass.length < 3) {
      return { error: 'Kata sandi minimal 3 karakter.' };
    }

    // Determine target role: prioritize user selection, fallback to username heuristics
    let targetRole: UserRole = selectedRole || 'owner';
    if (!selectedRole) {
      if (cleanUser.includes('owner')) targetRole = 'owner';
      else if (cleanUser.includes('admin')) targetRole = 'admin';
      else if (cleanUser.includes('kasir') || cleanUser.includes('pos')) targetRole = 'kasir';
      else if (cleanUser.includes('kitchen') || cleanUser.includes('kds') || cleanUser.includes('dapur'))
        targetRole = 'kitchen';
      else if (cleanUser.includes('purchasing') || cleanUser.includes('belanja'))
        targetRole = 'purchasing';
      else if (cleanUser.includes('housekeeping') || cleanUser.includes('kamar'))
        targetRole = 'housekeeping';
      else targetRole = 'owner';
    }

    const roleDisplayNames: Record<UserRole, string> = {
      owner: 'Owner ASAP ISEP',
      admin: 'Administrator Operasional',
      kasir: 'Kasir & Front Office',
      kitchen: 'Kitchen & Smokehouse Chef',
      purchasing: 'Staff Purchasing',
      housekeeping: 'Staff Housekeeping',
    };

    const displayName = roleDisplayNames[targetRole] || 'Operator ASAP ISEP';

    // If Supabase is configured, try Supabase Auth first
    if (configured) {
      try {
        const emailToUse = cleanUser.includes('@') ? cleanUser : `${cleanUser}@asapisep.com`;
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password: cleanPass,
        });

        if (!error && data?.user) {
          // Supabase login success
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const finalRole = (prof?.role as UserRole) || targetRole;
          setRole(finalRole);
          setProfile(
            prof || {
              id: data.user.id,
              full_name: data.user.user_metadata?.full_name || displayName,
              role: finalRole,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          );
          setUser(data.user);

          const sessionObj = {
            id: data.user.id,
            full_name: prof?.full_name || displayName,
            role: finalRole,
            email: emailToUse,
            created_at: new Date().toISOString(),
          };
          sessionStorage.setItem('asap_admin_session', JSON.stringify(sessionObj));
          localStorage.setItem('asap_admin_session', JSON.stringify(sessionObj));
          localStorage.setItem('asap_demo_role', finalRole);

          return { role: finalRole };
        }
      } catch (err) {
        console.warn('Supabase remote sign in bypassed, falling back to local staff role session:', err);
      }
    }

    // Operator Staff Session:
    // If Supabase user is not yet created or local testing, grant session with the explicitly selected role
    const sessionObj = {
      id: '00000000-0000-0000-0000-000000000001',
      full_name: displayName,
      email: cleanUser.includes('@') ? cleanUser : `${cleanUser}@asapisep.com`,
      role: targetRole,
      created_at: new Date().toISOString(),
    };

    setRole(targetRole);
    setProfile({
      id: sessionObj.id,
      full_name: displayName,
      role: targetRole,
      is_active: true,
      created_at: sessionObj.created_at,
      updated_at: new Date().toISOString(),
    });
    setUser({ id: sessionObj.id, email: sessionObj.email });

    sessionStorage.setItem('asap_admin_session', JSON.stringify(sessionObj));
    localStorage.setItem('asap_admin_session', JSON.stringify(sessionObj));
    localStorage.setItem('asap_demo_role', targetRole);

    return { role: targetRole };
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
