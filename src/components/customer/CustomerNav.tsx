'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BedDouble, UtensilsCrossed, Image as ImageIcon, Info, ShoppingBag } from 'lucide-react';
import { useCustomerOrder } from '@/context/CustomerOrderContext';

export function CustomerNav() {
  const pathname = usePathname();
  const { cartItems } = useCustomerOrder();
  const totalCartCount = cartItems.reduce((acc, it) => acc + it.qty, 0);

  // If in admin route, don't render customer nav
  if (pathname.startsWith('/admin')) return null;

  const navLinks = [
    { href: '/', label: 'Beranda', icon: Home },
    { href: '/menu', label: 'Menu Daging', icon: UtensilsCrossed },
    { href: '/kamar', label: 'Kabin Inap', icon: BedDouble },
    { href: '/galeri', label: 'Galeri Momen', icon: ImageIcon },
    { href: '/tentang', label: 'Filosofi', icon: Info },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <header className="hidden md:block sticky top-0 z-40 bg-forest-950/85 backdrop-blur-md border-b border-forest-800/40 text-stone-100 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand Typography without generic graphic logo (0.4) */}
          <Link href="/" className="group flex flex-col justify-center">
            <span className="font-serif text-2xl tracking-[0.2em] font-light text-stone-100 uppercase group-hover:text-emerald-300 transition-colors">
              ASAP ISEP
            </span>
            <span className="text-[9px] tracking-[0.3em] text-emerald-400/90 uppercase font-mono font-medium -mt-0.5">
              Food Forest & Smokehouse
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs tracking-widest uppercase transition-all relative py-1.5 ${
                    isActive
                      ? 'text-emerald-300 font-bold'
                      : 'text-stone-300/80 hover:text-stone-100 font-medium'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link
              href="/pesanan"
              className="relative inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-forest-800 to-forest-700 hover:from-forest-700 hover:to-forest-600 text-stone-100 border border-emerald-600/40 font-semibold text-xs rounded-full transition-all shadow-lg shadow-forest-950/50 hover:border-emerald-500"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pesanan</span>
              {totalCartCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-mono font-black bg-emerald-500 text-forest-950 rounded-full">
                  {totalCartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Dynamic Bottom Menu Bar (0.3 & 0.5) */}
      <nav aria-label="Navigasi Bawah Mobile" className="md:hidden fixed bottom-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto bg-forest-950/90 backdrop-blur-xl border border-emerald-800/35 rounded-full px-3 py-2 shadow-2xl shadow-black/80 flex items-center gap-1.5 text-stone-200">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-2 rounded-full transition-all flex flex-col items-center justify-center ${
                  isActive
                    ? 'bg-forest-800/90 text-emerald-300 shadow-inner border border-emerald-600/40'
                    : 'text-stone-400 hover:text-stone-100'
                }`}
                aria-label={link.label}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[9px] tracking-tight font-medium mt-0.5 scale-90">
                  {link.label.split(' ')[0]}
                </span>
              </Link>
            );
          })}

          <div className="h-5 w-px bg-forest-800/60 mx-0.5" />

          {/* Floating Cart Pill on Mobile */}
          <Link
            href="/pesanan"
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-full font-semibold text-xs transition-all ${
              pathname === '/pesanan'
                ? 'bg-emerald-600 text-forest-950 shadow-md font-bold'
                : 'bg-forest-900/90 text-emerald-300 border border-emerald-700/40 hover:bg-forest-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-[10px]">Pesan</span>
            {totalCartCount > 0 && (
              <span className="w-4 h-4 text-[9px] flex items-center justify-center bg-amber-400 text-stone-950 rounded-full font-black animate-pulse">
                {totalCartCount}
              </span>
            )}
          </Link>
        </div>
      </nav>
    </>
  );
}
