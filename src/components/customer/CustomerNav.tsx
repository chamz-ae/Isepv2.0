'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  UtensilsCrossed,
  BedDouble,
  Image as ImageIcon,
  Compass,
  Info,
  ShoppingBag,
} from 'lucide-react';
import { useCustomerOrder } from '@/context/CustomerOrderContext';

const NAV_LINKS = [
  { label: 'Beranda',     href: '/',            icon: Home           },
  { label: 'Menu Daging', href: '/menu',         icon: UtensilsCrossed },
  { label: 'Kabin Inap',  href: '/kamar',        icon: BedDouble      },
  { label: 'Galeri',      href: '/galeri',       icon: ImageIcon      },
  { label: 'Filosofi',    href: '/tentang',      icon: Info           },
  { label: 'Lacak',       href: '/konfirmasi',   icon: Compass        },
];

function useScrolled(threshold = 10) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

function isActive(href: string, pathname: string) {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

export function CustomerNav() {
  const pathname = usePathname();
  const scrolled = useScrolled();
  const { cartItems } = useCustomerOrder();

  if (pathname.startsWith('/admin')) return null;

  const cartCount = cartItems?.reduce((sum, item) => sum + (item.qty ?? 0), 0) ?? 0;

  return (
    <>
      {/* DESKTOP NAV — 80px fixed top bar */}
      <header
        className="hidden md:flex fixed top-0 inset-x-0 z-50 items-center justify-between px-8 lg:px-12 transition-all duration-500"
        style={{
          height: '80px',
          background: scrolled ? 'rgba(8, 14, 11, 0.94)' : 'rgba(8, 14, 11, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: scrolled
            ? '1px solid rgba(201, 169, 110, 0.22)'
            : '1px solid rgba(201, 169, 110, 0.08)',
        }}
      >
        {/* Brand Wordmark */}
        <Link href="/" className="flex flex-col leading-none select-none group">
          <span
            className="uppercase tracking-[0.35em] text-2xl font-light transition-colors duration-300 group-hover:text-[#f4ede0]"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              color: '#e8c99a',
            }}
          >
            ASAP ISEP
          </span>
          <span
            className="uppercase tracking-[0.28em] text-[9px] mt-1.5 transition-opacity duration-300"
            style={{
              fontFamily: "'DM Mono', monospace",
              color: 'rgba(201, 169, 110, 0.65)',
            }}
          >
            Food Forest · Cisarua · Puncak
          </span>
        </Link>

        {/* Desktop Links */}
        <nav className="flex items-center gap-7 lg:gap-9">
          {NAV_LINKS.map(({ label, href }) => {
            const active = isActive(href, pathname);
            return (
              <Link
                key={href}
                href={href}
                className="relative uppercase text-[11px] tracking-[0.20em] py-1 transition-colors duration-300 font-medium"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  color: active ? '#e8c99a' : '#b8ad9e',
                }}
              >
                {label}
                {active && (
                  <span
                    className="absolute -bottom-1 left-0 right-0 h-[1.5px] rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, transparent, #c9a96e, transparent)',
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Side Cart Button */}
        <div className="flex items-center gap-4">
          <Link
            href="/pesanan"
            className="relative inline-flex items-center gap-2.5 px-4 py-2 border transition-all duration-300 group"
            style={{
              borderColor: 'rgba(201, 169, 110, 0.35)',
              background: 'rgba(201, 169, 110, 0.06)',
              borderRadius: '2px',
            }}
          >
            <ShoppingBag
              className="w-3.5 h-3.5 transition-colors duration-300"
              style={{ color: '#e8c99a' }}
            />
            <span
              className="text-[11px] uppercase tracking-[0.16em] font-medium"
              style={{
                fontFamily: "'DM Mono', monospace",
                color: '#e8c99a',
              }}
            >
              Pesanan
            </span>
            {cartCount > 0 && (
              <span
                className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-stone-950 rounded-full"
                style={{
                  background: '#c9a96e',
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Spacer for desktop 80px fixed bar */}
      <div className="hidden md:block h-20 w-full" aria-hidden="true" />

      {/* MOBILE NAV — Fixed Bottom Floating Pill Bar */}
      <nav
        aria-label="Navigasi Mobile"
        className="md:hidden fixed bottom-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto flex items-center gap-1 px-3 py-2 rounded-full shadow-2xl transition-all duration-300"
          style={{
            background: 'rgba(8, 14, 11, 0.94)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(201, 169, 110, 0.25)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(201, 169, 110, 0.1)',
          }}
        >
          {NAV_LINKS.map(({ label, href, icon: Icon }) => {
            const active = isActive(href, pathname);
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center px-2.5 py-1.5 rounded-full transition-all duration-200"
                style={{
                  color: active ? '#e8c99a' : '#786e61',
                  background: active ? 'rgba(201, 169, 110, 0.14)' : 'transparent',
                }}
                aria-label={label}
              >
                <Icon className="w-4 h-4" />
                <span
                  className="text-[9px] tracking-tight mt-0.5"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {label}
                </span>
              </Link>
            );
          })}

          <div
            className="w-px h-5 mx-0.5"
            style={{ background: 'rgba(201, 169, 110, 0.2)' }}
          />

          <Link
            href="/pesanan"
            className="relative flex items-center gap-1 px-3 py-1.5 rounded-full transition-all duration-200"
            style={{
              background: pathname === '/pesanan' ? 'rgba(201, 169, 110, 0.25)' : 'rgba(201, 169, 110, 0.08)',
              border: '1px solid rgba(201, 169, 110, 0.35)',
              color: '#e8c99a',
            }}
          >
            <ShoppingBag className="w-4 h-4" />
            <span
              className="text-[10px] font-bold"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {cartCount > 0 ? cartCount : '0'}
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
}

export default CustomerNav;
