'use client'

import React from 'react'
import Link from 'next/link'
import { Phone, MapPin, Clock, Flame } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Menu', href: '/menu' },
  { label: 'Reservasi', href: '/reservasi' },
  { label: 'Galeri', href: '/galeri' },
  { label: 'Tentang Kami', href: '/tentang' },
  { label: 'Retreat & Penginapan', href: '/retreat' },
  { label: 'Pesanan Saya', href: '/pesanan' },
]

export function CustomerFooter() {
  const year = new Date().getFullYear()

  return (
    <footer
      className="relative w-full overflow-hidden pb-28 md:pb-16"
      style={{ backgroundColor: '#080e0b' }}
    >
      {/* Subtle noise texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-10 lg:px-14">

        {/* Top divider line — replaces border-top on root element */}
        <div
          className="w-full"
          style={{ height: '1px', backgroundColor: 'rgba(201,169,110,0.20)' }}
        />

        {/* Main footer grid */}
        <div className="grid grid-cols-1 gap-14 pt-14 md:grid-cols-3 md:gap-10 lg:gap-16">

          {/* ── Column 1: Brand identity ── */}
          <div className="flex flex-col gap-5">
            {/* Flame mark */}
            <div className="flex items-center gap-2.5">
              <Flame
                size={14}
                strokeWidth={1.5}
                style={{ color: 'rgba(201,169,110,0.55)' }}
              />
              <span
                className="font-mono text-[9px] tracking-[0.28em] uppercase"
                style={{ color: 'rgba(232,201,154,0.55)', fontFamily: "'DM Mono', monospace" }}
              >
                Est. 2019 · Cisarua Puncak
              </span>
            </div>

            {/* Brand name */}
            <div>
              <h2
                className="leading-none font-light tracking-[0.35em]"
                style={{
                  fontFamily: "'Cormorant Garamond', 'Cormorant', Georgia, serif",
                  fontSize: '28px',
                  color: '#e8c99a',
                  letterSpacing: '0.35em',
                }}
              >
                ASAP ISEP
              </h2>
              <p
                className="mt-2 tracking-[0.25em] uppercase"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '9px',
                  color: 'rgba(232,201,154,0.60)',
                  letterSpacing: '0.25em',
                }}
              >
                Food Forest · Smokehouse · Mountain Shelter
              </p>
            </div>

            {/* Philosophy paragraph */}
            <p
              className="max-w-xs font-light leading-relaxed text-sm"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                color: '#786e61',
              }}
            >
              Masakan asap kayu alami, bahan-bahan pilihan dari hutan dan ladang
              setempat, dan keheningan pegunungan yang sesungguhnya — sebuah
              pengalaman yang memperlambat waktu.
            </p>
          </div>

          {/* ── Column 2: Navigation ── */}
          <div className="flex flex-col gap-5">
            <span
              className="tracking-[0.22em] uppercase"
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '10px',
                color: 'rgba(232,201,154,0.45)',
                letterSpacing: '0.22em',
              }}
            >
              Jelajahi
            </span>

            <nav className="flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="w-fit font-light text-sm transition-colors duration-300"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#b8ad9e',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLAnchorElement).style.color = '#e8c99a'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLAnchorElement).style.color = '#b8ad9e'
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* ── Column 3: Info ── */}
          <div className="flex flex-col gap-5">
            <span
              className="tracking-[0.22em] uppercase"
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '10px',
                color: 'rgba(232,201,154,0.45)',
                letterSpacing: '0.22em',
              }}
            >
              Informasi
            </span>

            <ul className="flex flex-col gap-4">
              {/* Location */}
              <li className="flex items-start gap-3">
                <MapPin
                  size={13}
                  strokeWidth={1.5}
                  className="mt-0.5 shrink-0"
                  style={{ color: 'rgba(201,169,110,0.55)' }}
                />
                <span
                  className="font-light text-sm leading-snug"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#b8ad9e',
                  }}
                >
                  Jl. Raya Puncak, Cisarua
                  <br />
                  Bogor, Jawa Barat 16750
                </span>
              </li>

              {/* Hours */}
              <li className="flex items-start gap-3">
                <Clock
                  size={13}
                  strokeWidth={1.5}
                  className="mt-0.5 shrink-0"
                  style={{ color: 'rgba(201,169,110,0.55)' }}
                />
                <span
                  className="font-light text-sm leading-snug"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#b8ad9e',
                  }}
                >
                  Senin – Jumat: 11.00 – 22.00
                  <br />
                  Sabtu – Minggu: 09.00 – 23.00
                </span>
              </li>

              {/* WhatsApp */}
              <li className="flex items-start gap-3">
                <Phone
                  size={13}
                  strokeWidth={1.5}
                  className="mt-0.5 shrink-0"
                  style={{ color: 'rgba(201,169,110,0.55)' }}
                />
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-light text-sm leading-snug transition-colors duration-300"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#b8ad9e',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLAnchorElement).style.color = '#e8c99a'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLAnchorElement).style.color = '#b8ad9e'
                  }}
                >
                  +62 812-3456-7890
                  <br />
                  <span
                    className="text-xs"
                    style={{ color: 'rgba(184,173,158,0.55)' }}
                  >
                    WhatsApp & Reservasi
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Thin gold divider before copyright */}
        <div
          className="mt-14"
          style={{ height: '1px', backgroundColor: 'rgba(201,169,110,0.20)' }}
        />

        {/* Copyright bar */}
        <div className="flex flex-col items-center justify-between gap-2 py-6 sm:flex-row">
          <span
            className="text-center"
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '11px',
              color: '#786e61',
              letterSpacing: '0.05em',
            }}
          >
            © {year} ASAP ISEP. All rights reserved.
          </span>

          <span
            className="text-center"
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '11px',
              color: 'rgba(120,110,97,0.55)',
              letterSpacing: '0.05em',
            }}
          >
            WIB · UTC+7 · Bogor, Indonesia
          </span>
        </div>
      </div>
    </footer>
  )
}

export default CustomerFooter;
