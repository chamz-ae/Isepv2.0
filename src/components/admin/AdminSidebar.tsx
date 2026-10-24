'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Flame,
  LayoutDashboard,
  UtensilsCrossed,
  BedDouble,
  History,
  ChefHat,
  CreditCard,
  Lock,
  BookOpen,
  DoorOpen,
  Users,
  Truck,
  ShoppingBag,
  Boxes,
  Scale,
  ClipboardCheck,
  BarChart3,
  Image as ImageIcon,
  Settings,
  ExternalLink,
  Download,
  Smartphone,
  Search,
  X,
  CheckCircle2,
  HelpCircle,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/supabase/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  roles?: UserRole[];
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, profile, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [hasPrompt, setHasPrompt] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleOpen = () => setMobileOpen(true);
    window.addEventListener('asap:open-mobile-sidebar', handleOpen);
    return () => window.removeEventListener('asap:open-mobile-sidebar', handleOpen);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        window.location.search.includes('source=pwa');
      setIsPwaInstalled(isStandalone);

      if (window.__asap_deferred_pwa_prompt) {
        setHasPrompt(true);
      }

      const onInstallable = () => setHasPrompt(true);
      window.addEventListener('asap:pwa-installable', onInstallable);
      return () => window.removeEventListener('asap:pwa-installable', onInstallable);
    }
  }, []);

  const sections: { title: string; items: NavItem[] }[] = [
    {
      title: 'OPERASIONAL UTAMA',
      items: [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/pesanan-restoran', label: 'Pesanan Restoran (POS)', icon: UtensilsCrossed, badge: 'POS', roles: ['owner', 'admin', 'kasir'] },
        { href: '/admin/pesanan-penginapan', label: 'Pesanan Penginapan', icon: BedDouble, roles: ['owner', 'admin', 'kasir'] },
        { href: '/admin/order-history', label: 'Riwayat Transaksi', icon: History, roles: ['owner', 'admin', 'kasir'] },
        { href: '/admin/kds', label: 'Kitchen Display (KDS)', icon: ChefHat, badge: 'Live', roles: ['owner', 'admin', 'kitchen', 'kasir'] },
        { href: '/admin/pembayaran', label: 'Pembayaran Kasir', icon: CreditCard, roles: ['owner', 'admin', 'kasir'] },
        { href: '/admin/closing', label: 'Closing Kasir Harian', icon: Lock, roles: ['owner', 'admin', 'kasir'] },
      ],
    },
    {
      title: 'MASTER DATA & FASILITAS',
      items: [
        { href: '/admin/menu', label: 'Menu Management', icon: BookOpen, roles: ['owner', 'admin', 'kasir', 'kitchen'] },
        { href: '/admin/kamar', label: 'Kamar Penginapan', icon: DoorOpen, roles: ['owner', 'admin', 'kasir', 'housekeeping'] },
        { href: '/admin/meja', label: 'Meja Restoran', icon: UtensilsCrossed, roles: ['owner', 'admin', 'kasir'] },
        { href: '/admin/tamu', label: 'Data Tamu & Loyalitas', icon: Users, roles: ['owner', 'admin', 'kasir'] },
        { href: '/admin/suppliers', label: 'Data Supplier', icon: Truck, roles: ['owner', 'admin', 'purchasing'] },
      ],
    },
    {
      title: 'INVENTORI & BELANJA',
      items: [
        { href: '/admin/purchasing', label: 'Belanja / Purchasing', icon: ShoppingBag, roles: ['owner', 'admin', 'purchasing'] },
        { href: '/admin/inventory', label: 'Stok Daging & Bahan', icon: Boxes, roles: ['owner', 'admin', 'kitchen', 'purchasing'] },
        { href: '/admin/cooking', label: 'Cooking & Yield Rate', icon: Scale, roles: ['owner', 'admin', 'kitchen'] },
        { href: '/admin/stock-opname', label: 'Stock Opname', icon: ClipboardCheck, roles: ['owner', 'admin', 'kitchen'] },
      ],
    },
    {
      title: 'ANALITIK & SISTEM',
      items: [
        { href: '/admin/laporan', label: 'Laporan & Ekspor', icon: BarChart3, roles: ['owner', 'admin'] },
        { href: '/admin/gallery', label: 'Galeri Tamu', icon: ImageIcon, roles: ['owner', 'admin'] },
        { href: '/admin/pengaturan', label: 'Pengaturan & Webhook', icon: Settings, roles: ['owner', 'admin'] },
      ],
    },
  ];

  const isAllowed = (itemRoles?: UserRole[]) => {
    if (!itemRoles) return true;
    if (role === 'owner' || role === 'admin') return true;
    return itemRoles.includes(role);
  };

  const handleDownloadPwaClick = async () => {
    if (typeof window !== 'undefined' && window.__asap_deferred_pwa_prompt) {
      try {
        window.__asap_deferred_pwa_prompt.prompt();
        const choice = await window.__asap_deferred_pwa_prompt.userChoice;
        if (choice?.outcome === 'accepted') {
          setIsPwaInstalled(true);
          setHasPrompt(false);
        }
        window.__asap_deferred_pwa_prompt = null;
        return;
      } catch (err) {
        console.warn('PWA prompt error:', err);
      }
    }
    // If browser prompt is not directly available, show interactive installation guide
    setShowPwaModal(true);
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/admin/login');
  };

  const cleanQuery = searchQuery.trim().toLowerCase();

  return (
    <>
      {/* Mobile Drawer Overlay & Sidebar (Visible on mobile when hamburger clicked) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex flex-col w-72 max-w-[85vw] bg-stone-900 border-r border-stone-800 h-full text-stone-200 select-none z-10 shadow-2xl">
            {/* Mobile Header with Close Button */}
            <div className="h-16 px-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/60 shrink-0">
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-black shadow-md">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-serif font-bold text-sm tracking-wide text-white block leading-tight">
                    ASAP ISEP
                  </span>
                  <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block">
                    Food Forest & Lodging
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
                title="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Module Search Input */}
            <div className="px-3 pt-3 pb-2 border-b border-stone-800/80 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari modul..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-stone-800/80 hover:bg-stone-800 focus:bg-stone-800 border border-stone-700/60 focus:border-amber-500/80 rounded-lg text-white placeholder-stone-500 focus:outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-stone-500 hover:text-stone-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Navigation Modules List */}
            <div className="flex-1 overflow-y-auto py-3 px-3 space-y-5 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent">
              {sections.map((sec, idx) => {
                const visibleItems = sec.items
                  .filter((it) => isAllowed(it.roles))
                  .filter((it) => {
                    if (!cleanQuery) return true;
                    return (
                      it.label.toLowerCase().includes(cleanQuery) ||
                      it.href.toLowerCase().includes(cleanQuery)
                    );
                  });

                if (visibleItems.length === 0) return null;

                return (
                  <div key={idx} className="space-y-1">
                    <div className="px-2 text-[10px] font-bold font-mono tracking-wider text-stone-400 uppercase">
                      {sec.title}
                    </div>
                    <div className="space-y-0.5">
                      {visibleItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all group ${
                              isActive
                                ? 'bg-amber-600 text-white shadow-xs font-bold'
                                : 'text-stone-400 hover:text-white hover:bg-stone-800/80'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon
                                className={`w-4 h-4 shrink-0 transition-colors ${
                                  isActive ? 'text-white' : 'text-stone-500 group-hover:text-amber-400'
                                }`}
                              />
                              <span className="truncate">{item.label}</span>
                            </div>
                            {item.badge && (
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                                  isActive
                                    ? 'bg-white/20 text-white'
                                    : 'bg-stone-800 text-stone-400 border border-stone-700/60'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Footer */}
            <div className="p-3 border-t border-stone-800 bg-stone-950/60 space-y-2 shrink-0">
              <Link
                href="/"
                target="_blank"
                className="flex items-center justify-between px-2.5 py-1.5 text-xs text-stone-400 hover:text-amber-400 hover:bg-stone-800/50 rounded-xl transition-colors font-medium"
              >
                <span className="flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Web Pelanggan</span>
                </span>
                <span className="text-[10px] font-mono text-stone-500">Live</span>
              </Link>

              <div className="p-2 bg-stone-800/60 border border-stone-700/40 rounded-xl flex items-center justify-between text-xs">
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-white truncate text-[11px] leading-tight">
                    {profile?.full_name || 'Operator Staf'}
                  </div>
                  <div className="text-[9px] text-amber-400 font-mono uppercase tracking-wider">
                    {role}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Keluar / Logout"
                  className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-stone-700/60 rounded-lg transition-colors shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 bg-stone-900 border-r border-stone-800 flex-col shrink-0 h-screen text-stone-200 select-none z-20">
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/40">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-black shadow-md group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-serif font-bold text-sm tracking-wide text-white block leading-tight">
                ASAP ISEP
              </span>
              <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block">
                Food Forest & Lodging
              </span>
            </div>
          </Link>
        </div>

        {/* Quick Module Search Input (UX Feature to effortlessly jump to any module) */}
        <div className="px-3 pt-3 pb-2 border-b border-stone-800/80">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari modul (19 menu)..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-stone-800/80 hover:bg-stone-800 focus:bg-stone-800 border border-stone-700/60 focus:border-amber-500/80 rounded-lg text-white placeholder-stone-500 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-stone-500 hover:text-stone-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Modules List */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-5 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent">
          {sections.map((sec, idx) => {
            const visibleItems = sec.items
              .filter((it) => isAllowed(it.roles))
              .filter((it) => {
                if (!cleanQuery) return true;
                return (
                  it.label.toLowerCase().includes(cleanQuery) ||
                  it.href.toLowerCase().includes(cleanQuery)
                );
              });

            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                {/* Section Header with Item Count Badge */}
                <div className="px-2 mb-1.5 flex items-center justify-between text-[10px] font-bold tracking-wider text-stone-500 uppercase">
                  <span>{sec.title}</span>
                  <span className="text-[9px] px-1.5 py-0.2 bg-stone-800 text-stone-400 rounded-full font-mono">
                    {visibleItems.length}
                  </span>
                </div>

                <ul className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-xl transition-all ${
                            isActive
                              ? 'bg-amber-600 text-stone-950 font-bold shadow-md shadow-amber-600/20 translate-x-1'
                              : 'text-stone-400 hover:text-white hover:bg-stone-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive ? 'text-stone-950 font-bold' : 'text-stone-400 group-hover:text-white'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                                isActive
                                  ? 'bg-stone-950 text-amber-400'
                                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                {/* Requirement 2: Dedicated Button to Download PWA Dashboard, placed right below Pengaturan */}
                {sec.title === 'ANALITIK & SISTEM' && (
                  <div className="pt-2 px-0.5">
                    <button
                      type="button"
                      onClick={handleDownloadPwaClick}
                      className="w-full text-left group p-2.5 bg-gradient-to-r from-emerald-950/80 via-emerald-900/40 to-stone-900 border border-emerald-600/50 hover:border-emerald-500 rounded-xl transition-all shadow-sm hover:shadow-emerald-900/30"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                          <div className="w-5 h-5 rounded-md bg-emerald-600/30 flex items-center justify-center text-emerald-300">
                            <Download className="w-3.5 h-3.5 animate-bounce" />
                          </div>
                          <span>Download PWA Dashboard</span>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-900/80 text-emerald-200 border border-emerald-700/60 rounded">
                          App
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400 group-hover:text-stone-300 leading-tight">
                        {isPwaInstalled
                          ? 'Aplikasi PWA terpasang di perangkat'
                          : 'Pasang ke Desktop & HP untuk akses instan kasir'}
                      </p>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* User Card & Customer Site Link */}
        <div className="p-3 border-t border-stone-800 space-y-2 bg-stone-950/50">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold text-stone-400 hover:text-amber-400 hover:bg-stone-800/80 rounded-lg transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
              <span>Customer Website</span>
            </span>
            <span className="text-[10px] text-stone-500 font-mono">Buka tab</span>
          </Link>

          {/* User profile summary with quick logout */}
          <div className="p-2 bg-stone-800/60 border border-stone-700/40 rounded-xl flex items-center justify-between text-xs">
            <div className="min-w-0 pr-2">
              <div className="font-semibold text-white truncate text-[11px] leading-tight">
                {profile?.full_name || 'Operator Staf'}
              </div>
              <div className="text-[9px] text-amber-400 font-mono uppercase tracking-wider">
                {role}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Keluar / Logout"
              className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-stone-700/60 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* PWA Installation & Download Helper Modal */}
      {showPwaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-stone-900 border border-stone-700 rounded-3xl p-6 shadow-2xl text-stone-100 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Pasang Aplikasi PWA Dashboard</h3>
                  <p className="text-xs text-stone-400">Akses cepat offline-ready & standalone kasir</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPwaModal(false)}
                className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-300 bg-stone-800/60 p-4 rounded-2xl border border-stone-700/50">
              <div className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
                Panduan Pemasangan Sesuai Perangkat:
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-white">Google Chrome / Edge (PC & Laptop):</strong>
                    <p className="text-stone-400 text-[11px]">
                      Klik ikon komputer / install di sudut kanan address bar (URL), lalu pilih <em>&quot;Install / Pasang Aplikasi&quot;</em>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-white">Android (Chrome):</strong>
                    <p className="text-stone-400 text-[11px]">
                      Ketuk menu titik tiga (⋮) di pojok kanan atas, lalu pilih <em>&quot;Install App&quot;</em> atau <em>&quot;Tambahkan ke Layar Utama&quot;</em>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-white">Apple iOS / iPad (Safari):</strong>
                    <p className="text-stone-400 text-[11px]">
                      Ketuk tombol <strong>Share</strong> (kotak berpanah ke atas), lalu pilih <em>&quot;Add to Home Screen&quot; (Tambah ke Layar Utama)</em>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPwaModal(false);
                  window.location.href = '/admin?source=pwa';
                }}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Buka Mode PWA Standalone</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPwaModal(false)}
                className="py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
