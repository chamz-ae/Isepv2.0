'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Trees, HeartHandshake, ShieldCheck, ArrowRight, MapPin, Clock, Flame } from 'lucide-react'
import { CustomerFooter } from '@/components/customer/CustomerFooter'

/* ─────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────── */

const pillars = [
  {
    number: '01',
    Icon: Trees,
    title: 'Kayu Rambutan Pilihan',
    description:
      'Setiap batang kayu dipilih dengan tangan dari kebun rambutan lokal Puncak — kayu buah yang menghasilkan asap manis dan bersih, meresap ke dalam daging dengan sabar selama 12 hingga 18 jam tanpa tergesa.',
  },
  {
    number: '02',
    Icon: HeartHandshake,
    title: 'Kabin Jati Reclaimed',
    description:
      'Ruang makan kami dibangun dari kayu jati tua yang direstorasi — setiap retakan dan guratan menceritakan usia pohon yang telah melewati generasi. Bukan dekorasi, melainkan penghormatan terhadap bahan.',
  },
  {
    number: '03',
    Icon: ShieldCheck,
    title: 'Gramasi Transparan',
    description:
      'Kami menimbang setiap potong di depan Anda. Tidak ada estimasi, tidak ada kejutan. Harga mengikuti berat nyata — sebuah perjanjian kejujuran antara dapur dan meja tamu.',
  },
]

/* ─────────────────────────────────────────────────────────────
   PAGE COMPONENT
───────────────────────────────────────────────────────────── */

export default function TentangPage() {
  return (
    <main className="min-h-screen bg-[#0e0c0a] text-[#b8ad9e] antialiased">

      {/* ── 1. HERO ──────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-[92vh] px-6 pt-28 pb-20 overflow-hidden">

        {/* Ambient texture overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 30%, #5c3a1e 0%, transparent 70%)',
          }}
        />

        {/* Smoke particle streaks */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full blur-3xl opacity-5"
              style={{
                width: `${180 + i * 40}px`,
                height: `${180 + i * 40}px`,
                background: '#c8a97e',
                top: `${10 + i * 12}%`,
                left: `${8 + i * 14}%`,
              }}
            />
          ))}
        </div>

        {/* Label */}
        <p
          className="mb-8 text-xs tracking-[0.35em] uppercase text-[#c8a97e] font-mono"
          style={{ fontFamily: 'DM Mono, monospace' }}
        >
          Filosofi &nbsp;·&nbsp; Cisarua Puncak, Indonesia
        </p>

        {/* Main Headline */}
        <h1
          className="relative z-10 text-center text-6xl md:text-7xl lg:text-8xl font-light italic leading-[1.05] text-[#e8c99a] mb-10 max-w-4xl"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Filosofi<br />
          Dapur Hutan
        </h1>

        {/* Gold divider */}
        <div className="flex items-center gap-4 mb-10 w-full max-w-xs">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#c8a97e] to-transparent" />
          <Flame size={14} className="text-[#c8a97e] flex-shrink-0" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#c8a97e] to-transparent" />
        </div>

        {/* Opening paragraph */}
        <p
          className="relative z-10 text-center text-lg font-light leading-relaxed text-[#b8ad9e] max-w-2xl"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Di antara kabut Puncak dan denyut hutan pinus Cisarua, kami membangun dapur yang bukan sekadar tempat memasak — melainkan sebuah ritual. Api kami dinyalakan sebelum fajar. Daging kami diberi waktu, bukan panas. ASAP ISEP lahir dari keyakinan bahwa kesabaran adalah bumbu paling langka di era ini.
        </p>

        {/* Scroll cue */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <div className="w-px h-12 bg-[#c8a97e]" />
          <p className="text-[10px] tracking-[0.3em] uppercase font-mono text-[#c8a97e]"
            style={{ fontFamily: 'DM Mono, monospace' }}>
            Gulir
          </p>
        </div>
      </section>

      {/* ── 2. THREE PILLARS ─────────────────────────────────── */}
      <section className="px-6 py-24 md:py-32 max-w-7xl mx-auto">

        {/* Section label */}
        <p
          className="mb-4 text-xs tracking-[0.35em] uppercase text-[#c8a97e] font-mono text-center"
          style={{ fontFamily: 'DM Mono, monospace' }}
        >
          Tiga Pilar Utama
        </p>

        <h2
          className="text-center text-4xl md:text-5xl font-normal mb-16 text-[#e8c99a]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Yang Membentuk Identitas Kami
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {pillars.map(({ number, Icon, title, description }) => (
            <div
              key={number}
              className="group relative rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-sm p-8 lg:p-10 overflow-hidden transition-all duration-500 hover:border-[#c8a97e]/40 hover:bg-white/[0.055]"
            >
              {/* Hover gold glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background:
                    'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(200,169,126,0.08) 0%, transparent 70%)',
                }}
              />

              {/* Number watermark */}
              <span
                aria-hidden
                className="absolute top-4 right-6 text-[7rem] leading-none font-light text-[#c8a97e] select-none pointer-events-none"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  opacity: 0.12,
                }}
              >
                {number}
              </span>

              {/* Icon */}
              <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#c8a97e]/30 text-[#c8a97e] group-hover:border-[#c8a97e]/70 transition-colors duration-300">
                <Icon size={18} strokeWidth={1.5} />
              </div>

              {/* Title */}
              <h3
                className="mb-4 text-xl font-semibold text-[#e8c99a]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {title}
              </h3>

              {/* Description */}
              <p
                className="text-base font-light leading-relaxed text-[#b8ad9e] relative z-10"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. FULL QUOTE ────────────────────────────────────── */}
      <section className="px-6 py-24 md:py-36 relative overflow-hidden">

        {/* Ambient bg */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(92,58,30,0.18) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-3xl mx-auto text-center">

          {/* Top rule */}
          <div className="flex items-center gap-4 mb-12">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#c8a97e]/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#c8a97e]" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#c8a97e]/60" />
          </div>

          {/* Opening mark */}
          <span
            className="block text-8xl leading-none text-[#c8a97e] mb-2 select-none"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              opacity: 0.6,
            }}
            aria-hidden
          >
            "
          </span>

          {/* Quote */}
          <blockquote
            className="text-2xl md:text-3xl lg:text-4xl italic font-light leading-[1.45] text-[#e8c99a]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Memasak dengan api kayu bukan tentang kecepatan — ia adalah percakapan panjang antara panas, asap, dan daging. Percakapan yang meminta kita untuk diam, mendengar, dan memberi waktu kepada alam untuk menyelesaikan pekerjaannya dengan cara yang tidak pernah bisa digantikan mesin.
          </blockquote>

          {/* Attribution */}
          <p
            className="mt-10 text-sm tracking-[0.3em] uppercase text-[#c8a97e] font-mono"
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            — Dapur ASAP ISEP, Cisarua Puncak
          </p>

          {/* Bottom rule */}
          <div className="flex items-center gap-4 mt-12">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#c8a97e]/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#c8a97e]" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#c8a97e]/60" />
          </div>
        </div>
      </section>

      {/* ── 4. MASTER PIT ────────────────────────────────────── */}
      <section className="px-6 py-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden min-h-[520px] md:min-h-[600px] flex items-end">

          {/* Background image */}
          <Image
            src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1600&q=90"
            alt="Smokehouse pit fire — ASAP ISEP"
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 90vw"
            priority={false}
          />

          {/* Gradient overlay */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(14,12,10,0.97) 0%, rgba(14,12,10,0.55) 50%, rgba(14,12,10,0.15) 100%)',
            }}
          />

          {/* Content */}
          <div className="relative z-10 p-8 md:p-14 max-w-2xl">

            <p
              className="mb-4 text-xs tracking-[0.35em] uppercase text-[#c8a97e] font-mono"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              <Flame size={11} className="inline-block mr-2 -mt-0.5" />
              Ekosistem Dapur
            </p>

            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-normal mb-6 text-[#e8c99a] leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Pit Master &amp; Ekosistem Kami
            </h2>

            <p
              className="text-base md:text-lg font-light leading-relaxed text-[#b8ad9e] mb-4"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Pit kami dibangun dari bata tahan api yang dibentuk tangan, dirancang untuk menjaga panas merata dan memeluk daging selama sesi panjang. Setiap sesi dimulai pukul 04.00 pagi — ketika udara Puncak masih bersih dan kabut belum terangkat — agar asap pertama meresap sempurna sebelum tamu hadir.
            </p>

            <p
              className="text-base md:text-lg font-light leading-relaxed text-[#b8ad9e]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Tim pit master kami bukan hanya juru masak — mereka adalah penjaga api. Mereka belajar membaca warna asap, mengenali suara kayu yang menyala sempurna, dan memahami bahasa daging yang sedang berproses. Tradisi ini kami wariskan dari mulut ke tangan, bukan dari buku resep.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. LOCATION CARD ─────────────────────────────────── */}
      <section className="px-6 py-24 md:py-32 max-w-7xl mx-auto">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left — Info */}
          <div>
            <p
              className="mb-4 text-xs tracking-[0.35em] uppercase text-[#c8a97e] font-mono"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              <MapPin size={11} className="inline-block mr-2 -mt-0.5" />
              Lokasi &amp; Kunjungan
            </p>

            <h2
              className="text-3xl md:text-4xl font-normal mb-6 text-[#e8c99a] leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Temukan Kami di Hutan Cisarua
            </h2>

            <p
              className="text-lg font-light leading-relaxed text-[#b8ad9e] mb-10"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              ASAP ISEP berlokasi di tengah perkebunan teh dan hutan pinus Cisarua Puncak, Jawa Barat — sebuah destinasi yang mengundang Anda untuk memperlambat ritme hidup, menikmati udara segar pegunungan, dan bersantap di antara pepohonan.
            </p>

            {/* Details */}
            <ul className="space-y-4 mb-12">
              {[
                {
                  icon: MapPin,
                  label: 'Alamat',
                  value: 'Jl. Raya Puncak Km. 87, Cisarua, Bogor, Jawa Barat 16750',
                },
                {
                  icon: Clock,
                  label: 'Jam Buka',
                  value: 'Kamis – Minggu · 11.00 – 21.00 WIB (atau hingga habis)',
                },
                {
                  icon: Flame,
                  label: 'Reservasi',
                  value: 'Disarankan untuk grup &gt; 4 orang',
                },
              ].map(({ icon: Icon, label, value }) => (
                <li key={label} className="flex items-start gap-4">
                  <span className="mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#c8a97e]/25 text-[#c8a97e]">
                    <Icon size={14} strokeWidth={1.5} />
                  </span>
                  <div>
                    <p
                      className="text-xs tracking-[0.25em] uppercase text-[#c8a97e] mb-0.5"
                      style={{ fontFamily: 'DM Mono, monospace' }}
                    >
                      {label}
                    </p>
                    <p
                      className="text-sm font-light text-[#b8ad9e]"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                      dangerouslySetInnerHTML={{ __html: value }}
                    />
                  </div>
                </li>
              ))}
            </ul>

            {/* CTA links */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="/menu"
                className="group inline-flex items-center gap-2.5 rounded-full border border-[#c8a97e]/50 bg-[#c8a97e]/10 px-6 py-3 text-sm font-light tracking-wide text-[#e8c99a] transition-all duration-300 hover:bg-[#c8a97e]/20 hover:border-[#c8a97e]"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Lihat Menu
                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <Link
                href="/kamar"
                className="group inline-flex items-center gap-2.5 rounded-full border border-white/10 px-6 py-3 text-sm font-light tracking-wide text-[#b8ad9e] transition-all duration-300 hover:border-[#c8a97e]/40 hover:text-[#e8c99a]"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Kamar &amp; Menginap
                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Right — Decorative card */}
          <div className="relative">
            {/* Outer glow */}
            <div
              aria-hidden
              className="absolute -inset-6 rounded-3xl"
              style={{
                background:
                  'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(200,169,126,0.07) 0%, transparent 70%)',
              }}
            />

            <div className="relative rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden p-10 lg:p-12">

              {/* Large decorative number */}
              <span
                aria-hidden
                className="absolute -top-4 -right-2 text-[10rem] leading-none font-light select-none pointer-events-none text-[#c8a97e]"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  opacity: 0.06,
                }}
              >
                87
              </span>

              <p
                className="mb-6 text-xs tracking-[0.35em] uppercase text-[#c8a97e] font-mono"
                style={{ fontFamily: 'DM Mono, monospace' }}
              >
                Pengalaman Lengkap
              </p>

              <h3
                className="text-2xl font-normal mb-4 text-[#e8c99a]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Dari Meja Makan ke Kabin Bambu
              </h3>

              <p
                className="text-base font-light leading-relaxed text-[#b8ad9e] mb-8"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Perpanjang kunjungan Anda dan bermalam di kabin-kabin jati kami yang menghadap aliran sungai. Bangun bersama kabut Puncak, nikmati sarapan ringan, dan biarkan hutan menjadi ruang risetmu tentang ketenangan.
              </p>

              {/* Mini stat strip */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/8">
                {[
                  { value: '12–18', unit: 'Jam', label: 'Slow Smoke' },
                  { value: '100%', unit: '', label: 'Kayu Lokal' },
                  { value: '1200', unit: 'mdpl', label: 'Ketinggian' },
                ].map(({ value, unit, label }) => (
                  <div key={label} className="text-center">
                    <p
                      className="text-2xl font-light text-[#e8c99a]"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      {value}
                      {unit && (
                        <span className="text-sm ml-0.5 text-[#c8a97e]">{unit}</span>
                      )}
                    </p>
                    <p
                      className="mt-1 text-[10px] tracking-[0.2em] uppercase text-[#7a6f63] font-mono"
                      style={{ fontFamily: 'DM Mono, monospace' }}
                    >
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <CustomerFooter />
    </main>
  )
}
