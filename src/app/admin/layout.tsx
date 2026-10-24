'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, getSavedSession } from '@/context/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Loader2 } from 'lucide-react';

function AdminProtectedShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { profile, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and before client hydration, render identical loader HTML to prevent hydration mismatch
  if (!mounted) {
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

  // After mount (Client only), check active profile from state or storage
  const activeProfile = profile || getSavedSession().profile;

  // If unauthenticated, redirect to login
  if (!activeProfile && !isLoading) {
    router.replace('/admin/login');
    return null;
  }

  // Still verifying
  if (!activeProfile && isLoading) {
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If on login page, render full screen without shell, guard, or sidebar
  if (pathname === '/admin/login') {
    return <div className="min-h-screen bg-stone-950 text-stone-100">{children}</div>;
  }

  // Any other admin page is strictly protected
  return <AdminProtectedShell>{children}</AdminProtectedShell>;
}
