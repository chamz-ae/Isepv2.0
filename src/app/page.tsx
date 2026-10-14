'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BedDouble, UtensilsCrossed, ArrowRight, Trees, Wind, Compass } from 'lucide-react';
import { CustomerFooter } from '@/components/customer/CustomerFooter';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-forest-950 text-stone-100 flex flex-col justify-between selection:bg-emerald-600 selection:text-white">
      {/* Editorial Food Forest Hero Section */}
      <section className="relative min-h-[94vh] flex items-center justify-center overflow-hidden px-6 pt-16 pb-28">
        {/* Deep Forest & Pit Atmosphere Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=2000&q=85"
            alt="Smokehouse pit with glowing wood embers in forest"
            fill
            priority
            className="object-cover object-center brightness-[0.22] scale-105 transform animate-smoke-drift"
          />
          {/* Deep Forest Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/60 to-forest-950/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(46,91,73,0.22),transparent_70%)]" />
          {/* Subtle Ambient Smoke Accent */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8 animate-fade-up">
          {/* Artisan Wood Badge without corporate logo (0.4) */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-forest-900/80 border border-emerald-600/30 text-emerald-300 text-xs tracking-[0.2em] uppercase font-mono shadow-xl backdrop-blur-md">
            <Trees className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ekosistem Food Forest • Cisarua Puncak</span>
          </div>

          {/* Bespoke Editorial Headline */}
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-stone-50 leading-[1.08] max-w-3xl mx-auto">
            Di Mana Asap Kayu Buah & Dingin Hutan Bersatu.
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-stone-300/90 max-w-2xl mx-auto font-light leading-relaxed">
            ASAP ISEP mengolah daging pilihan melalui ritual pengasapan perlahan 14 jam menggunakan kayu buah rambutan di tengah kebun pangan pegunungan yang hening.
          </p>

          {/* Action CTAs in Forest Palette */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/menu"
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-forest-950 font-bold text-xs sm:text-sm tracking-wider uppercase rounded-full transition-all shadow-xl shadow-emerald-950/40 hover:scale-105 flex items-center justify-center gap-2.5"
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Pilih Menu & Gramasi Daging</span>
            </Link>

            <Link
              href="/kamar"
              className="w-full sm:w-auto px-8 py-3.5 bg-forest-900/90 hover:bg-forest-800 text-emerald-200 border border-emerald-700/50 font-medium text-xs sm:text-sm tracking-wider uppercase rounded-full transition-all hover:scale-105 flex items-center justify-center gap-2.5 backdrop-blur-sm"
            >
              <BedDouble className="w-4 h-4 text-emerald-400" />
              <span>Kabin Kayu Menginap</span>
            </Link>
          </div>

          {/* Micro Stats Bar */}
          <div className="pt-8 grid grid-cols-3 max-w-lg mx-auto gap-4 border-t border-forest-800/40 text-left">
            <div>
              <div className="font-mono text-emerald-400 text-base sm:text-lg font-bold">14 Jam</div>
              <div className="text-[10px] text-stone-400 uppercase tracking-widest mt-0.5 font-mono">Slow Smoked</div>
            </div>
            <div>
              <div className="font-mono text-emerald-400 text-base sm:text-lg font-bold">100g Min</div>
              <div className="text-[10px] text-stone-400 uppercase tracking-widest mt-0.5 font-mono">Fleksibel Gramasi</div>
            </div>
            <div>
              <div className="font-mono text-emerald-400 text-base sm:text-lg font-bold">3 Kabin</div>
              <div className="text-[10px] text-stone-400 uppercase tracking-widest mt-0.5 font-mono">Privat Alam</div>
            </div>
          </div>
        </div>
      </section>

      {/* Craft Slices: Smokehouse & Food Forest */}
      <section className="py-24 px-6 max-w-7xl mx-auto w-full space-y-32">
        {/* Slice 1: Pitmaster Woodfire */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.25em] text-emerald-400 font-bold">
              <span>01</span>
              <span className="w-6 h-px bg-emerald-600/60" />
              <span>KAYU BUAH RAMBUTAN DARI FOOD FOREST</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-100 font-light leading-snug">
              Kayu Kering Terpilih, Panas Rendah Terjaga, dan Rempah Alam.
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-light">
              Kami tidak membakar daging dengan api terbuka tergesa. Potongan Brisket, Lidah Sapi, Domba Kerecek, Bebek, dan Ayam diasap perlahan pada suhu 105°C–115°C menggunakan ranting dan batang kayu buah rambutan kering dengan kadar air di bawah 18%.
            </p>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-light">
              Pengasapan lambat menghasilkan kerak berkilau gurih (bark), cincin asap merah muda alami (smoke ring), serta tekstur daging yang empuk lumer seketika.
            </p>

            <div className="pt-2">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-300 hover:text-emerald-200 transition-all font-mono"
              >
                <span>Lihat Pilihan Gramasi & Harga per 100gr</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </Link>
            </div>
          </div>

          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-forest-800/60 shadow-2xl shadow-black/80 group">
            <Image
              src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80"
              alt="Brisket daging asap"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-950/70 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 p-4 rounded-xl bg-forest-950/80 backdrop-blur-md border border-forest-800/60 flex items-center justify-between text-xs font-mono">
              <span className="text-stone-300">Brisket Asap Daging Sapi</span>
              <span className="text-emerald-400 font-bold">Mulai Rp 20.000 / 100gr</span>
            </div>
          </div>
        </div>

        {/* Slice 2: Mountain Cabin Shelter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative aspect-[4/3] rounded-3xl overflow-hidden border border-forest-800/60 shadow-2xl shadow-black/80 group">
            <Image
              src="https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=1200&q=80"
              alt="Kabin kayu penginapan food forest"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-950/70 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 p-4 rounded-xl bg-forest-950/80 backdrop-blur-md border border-forest-800/60 flex items-center justify-between text-xs font-mono">
              <span className="text-stone-300">Kabin Jati & Perapian Pribadi</span>
              <span className="text-emerald-400 font-bold">Rp 200.000 / Tamu / Malam</span>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.25em] text-emerald-400 font-bold">
              <span>02</span>
              <span className="w-6 h-px bg-emerald-600/60" />
              <span>KABIN KAYU & UDARA PEGUNUNGAN</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-100 font-light leading-snug">
              Tempat Bernapas di Antara Rimba Hijau Cisarua.
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-light">
              Tiga kabin kayu jati reclaimed menyatu dengan pepohonan pinus dan kebun kopi alami. Dilengkapi perapian teras pribadi, bathtub batu kali alam di ruang semi-terbuka, serta sarapan hidangan khas pedesaan.
            </p>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-light">
              Tamu penginapan mendapatkan akses istimewa menikmati hidangan eksklusif seperti Marlin Asap, Ungkep Ayam Kampung, dan Mangut Lele Asap.
            </p>

            <div className="pt-2">
              <Link
                href="/kamar"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-300 hover:text-emerald-200 transition-all font-mono"
              >
                <span>Pilih Kabin & Kalender Ketersediaan Tanggal</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Banner */}
      <section className="py-20 bg-forest-900/40 border-y border-forest-800/40 px-6 text-center backdrop-blur-md">
        <div className="max-w-3xl mx-auto space-y-4">
          <Wind className="w-6 h-6 text-emerald-400 mx-auto opacity-70 animate-float-slow" />
          <blockquote className="font-serif text-xl sm:text-2xl text-stone-100 font-light italic leading-relaxed">
            &quot;Daging asap bukan sekadar cara memasak; ini adalah kesabaran, pengendalian api kayu, dan penghormatan pada alam tempat bahan pangan bertumbuh.&quot;
          </blockquote>
          <span className="text-[11px] text-emerald-400/90 uppercase tracking-[0.25em] block font-mono font-medium">
            — ASAP ISEP Food Forest & Smokehouse
          </span>
        </div>
      </section>

      <CustomerFooter />
    </div>
  );
}
