'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isLoading } = useAuth();
  const [isClientMounted, setIsClientMounted] = useState(false);

  // Check if session exists in memory, localStorage, or cookie
  const hasSession =
    Boolean(profile) ||
    (typeof window !== 'undefined' &&
      Boolean(
        localStorage.getItem('asap_admin_session') ||
          sessionStorage.getItem('asap_admin_session') ||
          (typeof document !== 'undefined' && document.cookie.includes('asap_admin_session='))
      ));

  // Hook 1: Mount tracking
  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  // Hook 2: Mandatory Login Guard (MUST be called unconditionally before ANY return)
  useEffect(() => {
    if (isClientMounted && !isLoading && !hasSession && pathname !== '/admin/login') {
      router.replace('/admin/login');
    }
  }, [isClientMounted, isLoading, hasSession, pathname, router]);

  // ==============================================================
  // ALL REACT HOOKS ARE CALLED ABOVE.
  // CONDITIONAL RENDERING CAN NOW SAFELY OCCUR BELOW.
  // ==============================================================

  // 1. If on login page, render full screen without sidebar/header
  if (pathname === '/admin/login') {
    return <div className="min-h-screen bg-stone-950 text-stone-100">{children}</div>;
  }

  // 2. Loading state while checking session
  if (isLoading && !hasSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-950 text-stone-300 select-none">
        <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center mb-4">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
        <div className="text-sm font-semibold text-white tracking-wide">Memverifikasi Otentikasi Admin</div>
        <p className="text-xs text-stone-500 mt-1">Memeriksa izin sesi staf operasional...</p>
      </div>
    );
  }

  // 3. If not logged in and not loading, render null while router.replace takes effect
  if (isClientMounted && !hasSession && !profile) {
    return null;
  }

  // 4. Authenticated: render complete admin dashboard
  return (
    <div className="flex h-screen overflow-hidden bg-stone-100 text-stone-900 font-sans">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
