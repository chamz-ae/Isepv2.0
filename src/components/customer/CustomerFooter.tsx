'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, MapPin, Clock } from 'lucide-react';

export function CustomerFooter() {
  return (
    <footer className="bg-forest-950 text-stone-300 border-t border-forest-900/60 pt-16 pb-28 md:pb-16 mt-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          {/* Typography Only (0.4 - no logo) */}
          <div className="mb-4">
            <span className="font-serif text-2xl font-light tracking-[0.2em] text-stone-100 uppercase">
              ASAP ISEP
            </span>
            <div className="text-[10px] tracking-[0.25em] text-emerald-400 uppercase font-mono font-medium mt-0.5">
              Food Forest • Smokehouse • Mountain Shelter
            </div>
          </div>
          <p className="text-xs sm:text-sm text-stone-300/80 max-w-md leading-relaxed font-light">
            Sistem kuliner daging asap lambat kayu rambutan dalam ekosistem kebun pangan (food forest) berpadu ketenangan kabin kayu lereng Cisarua.
          </p>
          <div className="mt-6 flex items-center gap-3 text-[11px] text-emerald-400 font-mono tracking-wider uppercase">
            <span>Kayu Buah Kering</span> • <span>Low & Slow 14 Jam</span> • <span>Eksklusif Shelter</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-300 mb-4 font-mono">Navigasi Hutan</h4>
          <ul className="space-y-2.5 text-xs text-stone-300/80">
            <li><Link href="/menu" className="hover:text-emerald-300 transition-colors">Daftar Menu Daging Asap</Link></li>
            <li><Link href="/kamar" className="hover:text-emerald-300 transition-colors">Kabin Kayu Menginap</Link></li>
            <li><Link href="/pesanan" className="hover:text-emerald-300 transition-colors">Pemesanan & Reservasi</Link></li>
            <li><Link href="/galeri" className="hover:text-emerald-300 transition-colors">Momen & Galeri Tamu</Link></li>
            <li><Link href="/tentang" className="hover:text-emerald-300 transition-colors">Filosofi Food Forest</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-300 mb-4 font-mono">Lokasi & Waktu</h4>
          <div className="space-y-3 text-xs text-stone-300/80">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Kawasan Hutan Asap No. 8, Cisarua, Puncak, Bogor, Jawa Barat</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Restoran: 10.00 – 22.00 WIB</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>WhatsApp: +62 812-3456-7890</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-forest-900/40 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-400 font-mono">
        <p>© 2026 ASAP ISEP — Food Forest Smokehouse. Seluruh Hak Cipta Terlindungi.</p>
        <p className="mt-2 sm:mt-0">Asia/Jakarta Timezone (WIB)</p>
      </div>
    </footer>
  );
}
