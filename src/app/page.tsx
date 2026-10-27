'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  BedDouble,
  UtensilsCrossed,
  Search,
  Flame,
  Trees,
} from 'lucide-react'
import CustomerFooter from '@/components/customer/CustomerFooter'
import { formatRupiah } from '@/lib/utils/formatters'

// ─── Data ────────────────────────────────────────────────────────────────────

const featuredMeats = [
  {
    id: 1,
    name: 'Brisket Sapi Asap',
    price: 200000,
    description:
      'Potongan brisket wagyu lokal, diasap 14 jam menggunakan kayu rambutan pilihan hingga bark terbentuk sempurna.',
    image:
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=85',
    tag: 'Pitmaster Choice',
    tagColor: '#c9a96e',
  },
  {
    id: 2,
    name: 'Domba Asap Bumbu Kerecek',
    price: 75000,
    description:
      'Domba muda dari lereng Gunung Gede, dibalur bumbu kerecek khas Sunda, diasap perlahan hingga empuk hingga ke tulang.',
    image:
      'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=85',
    tag: 'Best Seller',
    tagColor: '#c9a96e',
  },
  {
    id: 3,
    name: 'Lidah Sapi Asap',
    price: 65000,
    description:
      'Lidah sapi premium yang dimarinasi semalam dalam rempah nusantara, kemudian diasap dengan teknik low & slow.',
    image:
      'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=85',
    tag: null,
    tagColor: null,
  },
  {
    id: 4,
    name: 'Ayam Asap Rempah Hutan',
    price: 150000,
    description:
      'Ayam kampung organik dari peternak lokal Puncak, diasap bersama daun salam, kemiri, dan rempah hutan Cisarua.',
    image:
      'https://images.unsplash.com/photo-1598103442097-8b74394b95c7?auto=format&fit=crop&w=800&q=85',
    tag: null,
    tagColor: null,
  },
]

const featuredCabins = [
  {
    id: 1,
    name: 'Timber Haven Suite',
    guests: 2,
    image:
      'https://images.unsplash.com/photo-1518732714860-b62714ce0c59?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 2,
    name: 'The Smoke Master Sanctuary',
    guests: 4,
    image:
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 3,
    name: 'Cottage Embun Pinus',
    guests: 2,
    image:
      'https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?auto=format&fit=crop&w=800&q=85',
  },
]

const ritualSteps = [
  {
    number: '01',
    title: 'Pilih & Pesan',
    description:
      'Pilih hidangan impian Anda dari menu musiman kami. Setiap item dipilih berdasarkan ketersediaan bahan lokal terbaik hari ini.',
  },
  {
    number: '02',
    title: 'Persiapan Malam',
    description:
      'Pitmaster kami memulai proses marinasi sejak malam sebelumnya — rempah nusantara diresapkan ke dalam setiap serat daging.',
  },
  {
    number: '03',
    title: '14 Jam di Api',
    description:
      'Kayu rambutan pilihan menyala perlahan sepanjang malam. Asapnya yang harum meresap dalam, membangun lapisan rasa yang tak tertandingi.',
  },
  {
    number: '04',
    title: 'Tersaji Sempurna',
    description:
      'Disajikan langsung dari smoker ke meja Anda, diiringi pemandangan hutan pinus Cisarua yang tenang.',
  },
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()
  const [bookingCode, setBookingCode] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleTrackBooking = (e: React.FormEvent) => {
    e.preventDefault()
    if (bookingCode.trim()) {
      router.push(`/booking/track?code=${encodeURIComponent(bookingCode.trim())}`)
    }
  }

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: '#080e0b', fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ─── Google Fonts ─────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400;1,500&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@300;400;500&display=swap');

        :root {
          --gold: #c9a96e;
          --gold-light: #e8c99a;
          --cream: #f4ede0;
          --text-secondary: #b8ad9e;
          --text-muted: #786e61;
          --bg: #080e0b;
          --forest-accent: rgba(14,30,20,0.90);
          --border-default: rgba(201,169,110,0.15);
          --border-hover: rgba(201,169,110,0.35);
        }

        .font-cormorant { font-family: 'Cormorant Garamond', serif; }
        .font-playfair  { font-family: 'Playfair Display', serif; }
        .font-dm-sans   { font-family: 'DM Sans', sans-serif; }
        .font-dm-mono   { font-family: 'DM Mono', monospace; }

        .btn-primary-gold {
          background: linear-gradient(135deg, #c9a96e 0%, #e8c99a 50%, #c9a96e 100%);
          background-size: 200% 200%;
          transition: background-position 0.4s ease, transform 0.2s ease, box-shadow 0.3s ease;
        }
        .btn-primary-gold:hover {
          background-position: right center;
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(201,169,110,0.30);
        }

        .btn-secondary-gold {
          border: 1px solid rgba(201,169,110,0.40);
          color: #c9a96e;
          transition: border-color 0.3s ease, background 0.3s ease, transform 0.2s ease;
        }
        .btn-secondary-gold:hover {
          border-color: rgba(201,169,110,0.75);
          background: rgba(201,169,110,0.06);
          transform: translateY(-1px);
        }

        .dish-card {
          border: 1px solid var(--border-default);
          transition: border-color 0.4s ease, box-shadow 0.4s ease, transform 0.4s ease;
        }
        .dish-card:hover {
          border-color: var(--border-hover);
          box-shadow: 0 0 0 1px rgba(201,169,110,0.18), 0 20px 60px rgba(0,0,0,0.60);
          transform: translateY(-4px);
        }
        .dish-card:hover .dish-img {
          transform: scale(1.04);
        }

        .dish-img {
          transition: transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .input-luxury {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(201,169,110,0.25);
          color: #f4ede0;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          letter-spacing: 0.04em;
          transition: border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
          outline: none;
          border-radius: 2px;
        }
        .input-luxury::placeholder {
          color: #786e61;
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }
        .input-luxury:focus {
          border-color: rgba(201,169,110,0.60);
          background: rgba(255,255,255,0.05);
          box-shadow: 0 0 0 3px rgba(201,169,110,0.08);
        }

        .scroll-line {
          animation: scrollPulse 2.4s ease-in-out infinite;
        }
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.3; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.2); }
        }

        .gold-divider {
          background: linear-gradient(90deg, transparent, #c9a96e, transparent);
        }

        .philosophy-bar {
          border-top: 1px solid rgba(201,169,110,0.18);
          border-bottom: 1px solid rgba(201,169,110,0.18);
        }

        .ritual-number {
          font-family: 'Cormorant Garamond', serif;
          color: rgba(201,169,110,0.12);
          font-weight: 300;
          line-height: 1;
          user-select: none;
        }

        .section-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 0.625rem;
          letter-spacing: 0.30em;
          text-transform: uppercase;
          color: #c9a96e;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .animate-fade-in-up { animation: fadeInUp 1s ease forwards; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-600 { animation-delay: 0.6s; }
        .delay-800 { animation-delay: 0.8s; }
        .opacity-0-init { opacity: 0; }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════════════
          1. HERO
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative flex flex-col items-center justify-center overflow-hidden"
        style={{ height: '100vh', minHeight: '640px' }}
      >
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=2400&q=90"
            alt="ASAP ISEP Woodfire Smokehouse"
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.18)' }}
          />
        </div>

        {/* Gradient Overlays */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              'linear-gradient(to top, #080e0b 0%, rgba(8,14,11,0.85) 30%, rgba(8,14,11,0.40) 60%, transparent 100%)',
          }}
        />
        <div
          className="absolute inset-0 z-[2]"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(201,169,110,0.07) 0%, transparent 70%)',
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">

          {/* Eyebrow */}
          <p
            className="section-eyebrow animate-fade-in-up opacity-0-init mb-8"
            style={{ animationDelay: '0.1s', color: '#c9a96e' }}
          >
            — Cisarua, Puncak · Jawa Barat —
          </p>

          {/* Main Headline */}
          <h1
            className="font-cormorant animate-fade-in-up opacity-0-init"
            style={{
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(3rem, 8vw, 5.5rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.01em',
              color: '#e8c99a',
              animationDelay: '0.25s',
            }}
          >
            Asap Kayu Buah,
            <br />
            Kabin di Tepi Rimba.
          </h1>

          {/* Gold Divider */}
          <div
            className="gold-divider animate-fade-in-up opacity-0-init my-8"
            style={{ width: '48px', height: '1px', animationDelay: '0.45s' }}
          />

          {/* Subtitle */}
          <p
            className="font-dm-sans animate-fade-in-up opacity-0-init mb-10"
            style={{
              fontWeight: 300,
              fontSize: '0.9375rem',
              lineHeight: 1.75,
              color: '#b8ad9e',
              maxWidth: '480px',
              animationDelay: '0.55s',
            }}
          >
            Pengalaman makan yang tumbuh dari tanah Cisarua — daging pilihan, diasap
            perlahan di atas kayu rambutan, dinikmati di tepi hutan pinus Puncak.
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up opacity-0-init"
            style={{ animationDelay: '0.70s' }}
          >
            <Link
              href="/cabin/reservation"
              className="btn-primary-gold font-dm-mono inline-flex items-center gap-3"
              style={{
                padding: '1rem 2rem',
                borderRadius: '2px',
                fontSize: '0.6875rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#1a1208',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              <BedDouble size={14} />
              Reservasi Kabin
            </Link>
            <Link
              href="/menu"
              className="btn-secondary-gold font-dm-mono inline-flex items-center gap-3"
              style={{
                padding: '1rem 2rem',
                borderRadius: '2px',
                fontSize: '0.6875rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              <UtensilsCrossed size={14} />
              Jelajahi Menu
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3"
          style={{ color: '#786e61' }}
        >
          <span
            className="font-dm-mono"
            style={{ fontSize: '0.5625rem', letterSpacing: '0.25em', textTransform: 'uppercase' }}
          >
            Scroll
          </span>
          <div
            className="scroll-line"
            style={{ width: '1px', height: '40px', background: 'rgba(201,169,110,0.40)' }}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          2. BRAND PHILOSOPHY STRIP
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="philosophy-bar" style={{ backgroundColor: '#080e0b' }}>
        <div
          className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center"
          style={{ padding: '1.5rem 1.5rem' }}
        >
          {[
            { icon: <Flame size={12} />, label: '14 Jam Slow Smoke' },
            { icon: <Trees size={12} />, label: 'Kayu Rambutan' },
            { icon: <BedDouble size={12} />, label: '3 Kabin Eksklusif' },
          ].map((item, i, arr) => (
            <React.Fragment key={item.label}>
              <div
                className="font-dm-mono flex items-center gap-3"
                style={{
                  fontSize: '0.625rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: '#b8ad9e',
                  padding: '0.5rem 2rem',
                }}
              >
                <span style={{ color: '#c9a96e' }}>{item.icon}</span>
                {item.label}
              </div>
              {i < arr.length - 1 && (
                <div
                  style={{
                    width: '1px',
                    height: '20px',
                    background: 'rgba(201,169,110,0.25)',
                    display: 'none',
                  }}
                  className="sm:block"
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          3. SIGNATURE DISHES
      ═══════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '7rem 1.5rem', backgroundColor: '#080e0b' }}>
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="mb-16 flex flex-col items-start">
            <p className="section-eyebrow mb-5">Menu Unggulan</p>
            <div className="flex items-end justify-between w-full flex-col sm:flex-row gap-6">
              <h2
                className="font-cormorant"
                style={{
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
                  lineHeight: 1.1,
                  color: '#e8c99a',
                  maxWidth: '540px',
                }}
              >
                Dari Lereng Gunung
                <br />
                ke Perapian
              </h2>
              <Link
                href="/menu"
                className="font-dm-mono inline-flex items-center gap-2"
                style={{
                  fontSize: '0.625rem',
                  letterSpacing: '0.20em',
                  textTransform: 'uppercase',
                  color: '#c9a96e',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  paddingBottom: '0.25rem',
                  borderBottom: '1px solid rgba(201,169,110,0.30)',
                }}
              >
                Lihat Semua Menu
                <ArrowRight size={11} />
              </Link>
            </div>
          </div>

          {/* Dish Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredMeats.map((dish) => (
              <Link
                key={dish.id}
                href={`/menu#${dish.id}`}
                className="dish-card block overflow-hidden"
                style={{ borderRadius: '2px', backgroundColor: '#0b1510', textDecoration: 'none' }}
              >
                {/* Image */}
                <div className="overflow-hidden" style={{ aspectRatio: '3/4' }}>
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="dish-img w-full h-full object-cover"
                    style={{ filter: 'brightness(0.85) saturate(0.9)' }}
                  />
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem 1.25rem 1.75rem' }}>
                  {dish.tag && (
                    <span
                      className="font-dm-mono inline-block mb-3"
                      style={{
                        fontSize: '0.5rem',
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        color: '#c9a96e',
                        border: '1px solid rgba(201,169,110,0.30)',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '1px',
                      }}
                    >
                      {dish.tag}
                    </span>
                  )}
                  {!dish.tag && <div style={{ height: '1.5rem' }} />}

                  <h3
                    className="font-playfair"
                    style={{
                      fontStyle: 'italic',
                      fontWeight: 400,
                      fontSize: '1.0625rem',
                      color: '#f4ede0',
                      marginBottom: '0.5rem',
                      lineHeight: 1.35,
                    }}
                  >
                    {dish.name}
                  </h3>

                  <p
                    className="font-dm-mono mb-4"
                    style={{
                      fontSize: '0.6875rem',
                      letterSpacing: '0.10em',
                      color: '#c9a96e',
                    }}
                  >
                    {formatRupiah(dish.price)}
                  </p>

                  <p
                    className="font-dm-sans"
                    style={{
                      fontWeight: 300,
                      fontSize: '0.8125rem',
                      lineHeight: 1.65,
                      color: '#786e61',
                    }}
                  >
                    {dish.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          4. THE RITUAL
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          padding: '6rem 1.5rem',
          borderTop: '1px solid rgba(201,169,110,0.12)',
          borderBottom: '1px solid rgba(201,169,110,0.12)',
          background: 'linear-gradient(180deg, rgba(14,30,20,0.35) 0%, transparent 100%)',
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-14 text-center">
            <p className="section-eyebrow mb-4">Proses Kami</p>
            <h2
              className="font-cormorant"
              style={{
                fontWeight: 300,
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                color: '#e8c99a',
                lineHeight: 1.2,
              }}
            >
              The Ritual of Smoke
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {ritualSteps.map((step, idx) => (
              <div
                key={step.number}
                className="relative"
                style={{
                  padding: '2rem 1.5rem 2rem',
                  border: '1px solid rgba(201,169,110,0.10)',
                  borderRadius: '2px',
                  backgroundColor: 'rgba(12,20,15,0.60)',
                }}
              >
                {/* Giant Number */}
                <div
                  className="ritual-number"
                  style={{ fontSize: 'clamp(4rem, 8vw, 6rem)', marginBottom: '-1rem' }}
                >
                  {step.number}
                </div>

                {/* Title */}
                <h3
                  className="font-playfair"
                  style={{
                    fontWeight: 500,
                    fontSize: '1.0625rem',
                    color: '#f4ede0',
                    marginBottom: '0.875rem',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {step.title}
                </h3>

                {/* Divider */}
                <div
                  style={{
                    width: '28px',
                    height: '1px',
                    background: 'rgba(201,169,110,0.40)',
                    marginBottom: '0.875rem',
                  }}
                />

                {/* Description */}
                <p
                  className="font-dm-sans"
                  style={{
                    fontWeight: 300,
                    fontSize: '0.8125rem',
                    lineHeight: 1.70,
                    color: '#786e61',
                  }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          5. CABIN RETREAT
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: '520px' }}>
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=2400&q=90"
            alt="Forest Cabin Retreat"
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.25)' }}
          />
        </div>
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              'linear-gradient(135deg, rgba(8,14,11,0.80) 0%, rgba(8,14,11,0.40) 50%, rgba(8,14,11,0.70) 100%)',
          }}
        />

        {/* Content */}
        <div
          className="relative z-10 flex flex-col items-center justify-center text-center px-6"
          style={{ padding: '7rem 1.5rem' }}
        >
          <p className="section-eyebrow mb-6">Kabin & Retreat</p>

          <h2
            className="font-cormorant mb-6"
            style={{
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              lineHeight: 1.08,
              color: '#e8c99a',
              maxWidth: '700px',
            }}
          >
            Tidur di Bawah Bintang
            <br />
            Hutan Cisarua
          </h2>

          <div
            className="gold-divider mb-6"
            style={{ width: '48px', height: '1px' }}
          />

          <p
            className="font-dm-sans mb-10"
            style={{
              fontWeight: 300,
              fontSize: '0.9375rem',
              lineHeight: 1.80,
              color: '#b8ad9e',
              maxWidth: '520px',
            }}
          >
            Tiga kabin pribadi berdiri tenang di antara pohon pinus Puncak. Setiap
            kabin dirancang sebagai tempat pelarian — dari keramaian, dari layar, dari
            segala yang tidak esensial.
          </p>

          {/* Cabin Thumbnails */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10 w-full max-w-2xl">
            {featuredCabins.map((cabin) => (
              <Link
                key={cabin.id}
                href="/cabin"
                className="group flex-1 overflow-hidden relative"
                style={{
                  borderRadius: '2px',
                  border: '1px solid rgba(201,169,110,0.18)',
                  aspectRatio: '4/3',
                  textDecoration: 'none',
                  display: 'block',
                }}
              >
                <img
                  src={cabin.image}
                  alt={cabin.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ filter: 'brightness(0.55)' }}
                />
                <div
                  className="absolute inset-0 flex flex-col items-center justify-end"
                  style={{ padding: '1.25rem', background: 'linear-gradient(to top, rgba(8,14,11,0.85) 0%, transparent 60%)' }}
                >
                  <p
                    className="font-playfair"
                    style={{ fontStyle: 'italic', fontSize: '0.875rem', color: '#f4ede0', textAlign: 'center', marginBottom: '0.25rem' }}
                  >
                    {cabin.name}
                  </p>
                  <p
                    className="font-dm-mono"
                    style={{ fontSize: '0.5rem', letterSpacing: '0.20em', textTransform: 'uppercase', color: '#c9a96e' }}
                  >
                    {cabin.guests} Tamu
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/cabin/reservation"
              className="btn-primary-gold font-dm-mono inline-flex items-center gap-3"
              style={{
                padding: '1rem 2rem',
                borderRadius: '2px',
                fontSize: '0.6875rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#1a1208',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              <BedDouble size={14} />
              Pesan Kabin
            </Link>
            <Link
              href="/cabin"
              className="btn-secondary-gold font-dm-mono inline-flex items-center gap-3"
              style={{
                padding: '1rem 2rem',
                borderRadius: '2px',
                fontSize: '0.6875rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              <Trees size={14} />
              Lihat Semua Kabin
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          6. BOOKING TRACKER
      ═══════════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '7rem 1.5rem', backgroundColor: '#080e0b' }}>
        <div className="max-w-lg mx-auto text-center">
          <p className="section-eyebrow mb-5">Status Pemesanan</p>

          <h2
            className="font-playfair mb-5"
            style={{
              fontWeight: 500,
              fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
              color: '#f4ede0',
              lineHeight: 1.3,
            }}
          >
            Lacak Reservasi Anda
          </h2>

          {/* Gold underline divider */}
          <div className="flex justify-center mb-8">
            <div
              style={{
                width: '40px',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #c9a96e, transparent)',
              }}
            />
          </div>

          <p
            className="font-dm-sans mb-8"
            style={{
              fontWeight: 300,
              fontSize: '0.875rem',
              lineHeight: 1.70,
              color: '#786e61',
            }}
          >
            Masukkan kode reservasi Anda untuk memantau status pesanan kabin atau
            meja makan.
          </p>

          <form onSubmit={handleTrackBooking} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={bookingCode}
              onChange={(e) => setBookingCode(e.target.value)}
              placeholder="Kode Reservasi — e.g. ASAP-2024"
              className="input-luxury flex-1"
              style={{ padding: '1rem 1.25rem', minHeight: '52px' }}
            />
            <button
              type="submit"
              className="btn-primary-gold font-dm-mono inline-flex items-center justify-center gap-2"
              style={{
                padding: '1rem 1.75rem',
                borderRadius: '2px',
                fontSize: '0.6875rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#1a1208',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Search size={13} />
              Lacak
            </button>
          </form>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          7. PHILOSOPHY QUOTE
      ═══════════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          padding: '6rem 1.5rem',
          borderTop: '1px solid rgba(201,169,110,0.12)',
          borderBottom: '1px solid rgba(201,169,110,0.12)',
          background: 'linear-gradient(180deg, rgba(14,30,20,0.20) 0%, transparent 50%, rgba(14,30,20,0.20) 100%)',
        }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <span
            className="font-cormorant block mb-8"
            style={{
              fontWeight: 300,
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              color: 'rgba(201,169,110,0.30)',
              lineHeight: 1,
            }}
          >
            ❝
          </span>

          <blockquote
            className="font-cormorant"
            style={{
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(1.25rem, 2.5vw, 2rem)',
              lineHeight: 1.55,
              color: '#e8c99a',
              letterSpacing: '0.01em',
            }}
          >
            Api tidak terburu-buru. Asap tidak berbohong.
            <br />
            Hanya waktu yang bisa mengubah daging menjadi kenangan.
          </blockquote>

          <div
            className="gold-divider mx-auto my-8"
            style={{ width: '40px', height: '1px' }}
          />

          <cite
            className="font-dm-mono not-italic"
            style={{
              fontSize: '0.5625rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#786e61',
            }}
          >
            — Pitmaster, ASAP ISEP · Cisarua Puncak
          </cite>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          8. FOOTER
      ═══════════════════════════════════════════════════════════════════════ */}
      <CustomerFooter />
    </main>
  )
}
