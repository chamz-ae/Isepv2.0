'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, ShieldCheck, Flame, Clock, Sparkles, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/supabase/types';

export function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { role, profile, signOut, setDemoRole, isConfigured } = useAuth();
  const [timeWib, setTimeWib] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now);
      setTimeWib(formatted + ' WIB');
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDemoRole(e.target.value as UserRole);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/admin/login');
  };

  // Human readable title from pathname
  const getPageTitle = (path: string) => {
    switch (path) {
      case '/admin':
        return 'Dashboard Operasional Terpadu';
      case '/admin/pesanan-restoran':
        return 'Point of Sale (POS) Restoran';
      case '/admin/pesanan-penginapan':
        return 'Pemesanan & Reservasi Penginapan';
      case '/admin/order-history':
        return 'Riwayat Transaksi & Pelunasan';
      case '/admin/kds':
        return 'Kitchen Display System (KDS)';
      case '/admin/pembayaran':
        return 'Pencatatan Pembayaran Kasir';
      case '/admin/closing':
        return 'Closing Kasir Harian';
      case '/admin/menu':
        return 'Manajemen Menu & Gramasi Daging';
      case '/admin/kamar':
        return 'Ketersediaan & Status Kamar Kabin';
      case '/admin/meja':
        return 'Denah & Status Meja Restoran';
      case '/admin/tamu':
        return 'Data Tamu & Pelanggan Setia';
      case '/admin/suppliers':
        return 'Data Supplier & Mitra Belanja';
      case '/admin/purchasing':
        return 'Pembelanjaan Bahan & Daging';
      case '/admin/inventory':
        return 'Stok Inventori Daging & Bahan';
      case '/admin/cooking':
        return 'Cooking Yield Rate & Susut Asap';
      case '/admin/stock-opname':
        return 'Stock Opname Fisik';
      case '/admin/laporan':
        return 'Laporan Omzet & Audit Trail';
      case '/admin/gallery':
        return 'Moderasi Galeri Foto Tamu';
      case '/admin/pengaturan':
        return 'Pengaturan Sistem & Webhook';
      default:
        return 'Dashboard Operasional';
    }
  };

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10 shadow-xs">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Menu Button */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('asap:open-mobile-sidebar'));
            }
          }}
          className="p-2 -ml-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl md:hidden transition-colors shrink-0"
          title="Buka Menu Navigasi"
        >
          <Menu className="w-5 h-5 text-amber-600" />
        </button>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight truncate">
            {getPageTitle(pathname)}
          </h1>
          <div className="flex items-center gap-2 text-[10px] text-stone-500 font-mono">
            <span>SISTEM ASAP ISEP</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
        </div>

        {!isConfigured && (
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Mode Standalone
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Real-time WIB Clock */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 rounded-xl border border-stone-200 text-stone-700 text-xs font-mono font-semibold">
          <Clock className="w-3.5 h-3.5 text-emerald-700" />
          <span>{timeWib || 'WIB'}</span>
        </div>

        {/* Role Switcher */}
        <div className="flex items-center gap-1.5 bg-stone-100/80 hover:bg-stone-100 px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs transition-colors">
          <ShieldCheck className="w-3.5 h-3.5 text-stone-500" />
          <span className="hidden sm:inline text-stone-500 font-medium text-[11px]">Role:</span>
          <select
            value={role}
            onChange={handleRoleChange}
            className="bg-transparent font-bold text-stone-900 focus:outline-none uppercase cursor-pointer text-xs"
          >
            <option value="owner">Owner (Full)</option>
            <option value="admin">Admin</option>
            <option value="kasir">Kasir / POS</option>
            <option value="kitchen">Kitchen (KDS)</option>
            <option value="purchasing">Purchasing</option>
            <option value="housekeeping">Housekeeping</option>
          </select>
        </div>

        {/* User Identity Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-stone-200 text-xs">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-stone-900 to-stone-800 text-amber-400 font-bold flex items-center justify-center text-xs shadow-xs">
            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="hidden md:block text-left">
            <div className="font-bold text-stone-900 leading-tight truncate max-w-[120px]">
              {profile?.full_name || 'Operator'}
            </div>
            <div className="text-[10px] text-stone-500 uppercase font-mono">{role}</div>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          title="Keluar dari Sesi"
          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
