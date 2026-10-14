'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trees, HeartHandshake, ShieldCheck, ArrowRight, MapPin, Clock, Wind } from 'lucide-react';
import { CustomerFooter } from '@/components/customer/CustomerFooter';

export default function CustomerTentangPage() {
  return (
    <div className="min-h-screen bg-forest-950 text-stone-100 flex flex-col justify-between selection:bg-emerald-600 selection:text-white">
      <div className="max-w-5xl mx-auto px-6 py-16 w-full space-y-20">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-emerald-400 font-bold">
            FILOSOFI EKOSISTEM FOOD FOREST • ASAP ISEP
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-light text-stone-50 leading-tight">
            Menghormati Waktu, Merawat Api Tradisi.
          </h1>
          <p className="text-xs sm:text-base text-stone-300 font-light leading-relaxed">
            ASAP ISEP lahir dari kekaguman mendalam pada proses memasak tertua di dunia: pengasapan lambat menggunakan kayu buah lokal yang mengunci kelembutan daging dan aroma hutan alami di kawasan Cisarua.
          </p>
        </div>

        {/* Feature Grid: Three Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-forest-900/40 border border-forest-800/70 rounded-3xl p-6 space-y-4 shadow-xl backdrop-blur-md">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-600/40 text-emerald-400 flex items-center justify-center font-mono font-bold">
              01
            </div>
            <h3 className="font-serif text-xl font-light text-stone-100">Kayu Rambutan Terpilih</h3>
            <p className="text-xs text-stone-300 font-light leading-relaxed">
              Kami secara eksklusif menggunakan kayu rambutan dan pohon buah dari kebun pangan lokal yang dikeringkan alami hingga kadar air di bawah 18%. Menghasilkan asap bersih beraroma manis lembut tanpa jelaga pahit.
            </p>
          </div>

          <div className="bg-forest-900/40 border border-forest-800/70 rounded-3xl p-6 space-y-4 shadow-xl backdrop-blur-md">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-600/40 text-emerald-400 flex items-center justify-center font-mono font-bold">
              02
            </div>
            <h3 className="font-serif text-xl font-light text-stone-100">Kabin Jati Reclaimed</h3>
            <p className="text-xs text-stone-300 font-light leading-relaxed">
              Kabin penginapan kami dibangun dari kayu jati tua yang diselamatkan dan ditata ulang dengan estetika arsitektur vernakular. Menyatu dengan pohon pinus dan kabut alami tanpa merusak kontur tanah lereng.
            </p>
          </div>

          <div className="bg-forest-900/40 border border-forest-800/70 rounded-3xl p-6 space-y-4 shadow-xl backdrop-blur-md">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-600/40 text-emerald-400 flex items-center justify-center font-mono font-bold">
              03
            </div>
            <h3 className="font-serif text-xl font-light text-stone-100">Integritas Bahan Pangan</h3>
            <p className="text-xs text-stone-300 font-light leading-relaxed">
              Dari brisket sapi hingga ayam kampung dan marlin segar, seluruh bahan dipilih dengan standar kebersihan tinggi. Kami menimbang gramasi fisik secara transparan untuk menjamin keadilan porsi setiap tamu.
            </p>
          </div>
        </div>

        {/* Location & Visit Notice */}
        <div className="bg-forest-900/40 border border-forest-800/70 rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl backdrop-blur-md">
          <div className="space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-emerald-400">
              KUNJUNGAN & LOKASI FISIK
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-light text-stone-100">
              Datang & Bernapas di Udara Sejuk Lereng Cisarua.
            </h2>
            <p className="text-xs text-stone-300 max-w-lg leading-relaxed font-light">
              Kawasan kami terbuka untuk penikmat daging asap serta keluarga yang mencari ketenangan akhir pekan. Reservasi kabin disarankan dilakukan lebih awal untuk menjamin ketersediaan kamar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              href="/menu"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-forest-950 font-bold text-xs uppercase tracking-wider font-mono rounded-full text-center transition-all shadow-lg"
            >
              Lihat Menu Daging
            </Link>
            <Link
              href="/kamar"
              className="px-6 py-3 bg-forest-950 hover:bg-forest-900 text-emerald-300 border border-emerald-700/50 font-bold text-xs uppercase tracking-wider font-mono rounded-full text-center transition-all"
            >
              Cek Kalender Kabin
            </Link>
          </div>
        </div>
      </div>

      <CustomerFooter />
    </div>
  );
}
