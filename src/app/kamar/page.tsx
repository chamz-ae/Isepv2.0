'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  BedDouble,
  Users,
  ArrowRight,
  Minus,
  Plus,
  Calendar,
  CheckCircle,
  XCircle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { getRooms, checkRoomDateAvailability } from '@/lib/services/roomService';
import { Room } from '@/lib/supabase/types';
import { formatRupiah } from '@/lib/utils/formatters';
import { CustomerFooter } from '@/components/customer/CustomerFooter';
import { useCustomerOrder } from '@/context/CustomerOrderContext';

// ─── Helpers ────────────────────────────────────────────────────────────────

function calcNights(cin: string, cout: string): number {
  if (!cin || !cout) return 1;
  const diff = Math.ceil(
    (new Date(cout).getTime() - new Date(cin).getTime()) / 86_400_000
  );
  return diff > 0 ? diff : 1;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#080e0b] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Sparkles className="w-6 h-6 text-amber-500/60 animate-pulse" />
        <p
          className="text-stone-500 text-xs tracking-[0.25em] uppercase"
          style={{ fontFamily: 'DM Mono, monospace' }}
        >
          Memuat kabin penginapan…
        </p>
      </div>
    </div>
  );
}

// ─── Stepper ─────────────────────────────────────────────────────────────────

interface StepperProps {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  min?: number;
}

function Stepper({ label, value, onDecrement, onIncrement, min = 0 }: StepperProps) {
  return (
    <div className="flex flex-col gap-2">
      <span
        className="text-[10px] uppercase tracking-[0.2em] text-amber-500/80"
        style={{ fontFamily: 'DM Mono, monospace' }}
      >
        {label}
      </span>
      <div className="flex items-center gap-0 border border-stone-700/60 rounded-xl overflow-hidden w-fit bg-stone-900/40">
        <button
          onClick={onDecrement}
          disabled={value <= min}
          className="w-9 h-9 flex items-center justify-center text-stone-400 hover:text-amber-400 hover:bg-amber-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label={`Kurangi ${label}`}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span
          className="w-10 text-center text-sm text-stone-100 select-none"
          style={{ fontFamily: 'DM Mono, monospace' }}
        >
          {value}
        </span>
        <button
          onClick={onIncrement}
          className="w-9 h-9 flex items-center justify-center text-stone-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
          aria-label={`Tambah ${label}`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Room Card ───────────────────────────────────────────────────────────────

interface RoomCardProps {
  room: Room;
  isAvailable: boolean | undefined;
  isChecking: boolean;
  nights: number;
  totalGuests: number;
  onSelect: (room: Room) => void;
  capacityWarning: string | null;
}

function RoomCard({
  room,
  isAvailable,
  isChecking,
  nights,
  totalGuests,
  onSelect,
  capacityWarning,
}: RoomCardProps) {
  const effectiveGuests = Math.max(1, totalGuests);
  const estimatedTotal = effectiveGuests * room.price_per_night * nights;
  const available = isAvailable !== false;
  const over = totalGuests > 0 && totalGuests > room.capacity;

  return (
    <article
      className={`
        group relative flex flex-col rounded-2xl overflow-hidden
        border backdrop-blur-sm transition-all duration-500
        ${
          available
            ? 'border-amber-500/20 hover:border-amber-500/50 bg-gradient-to-b from-stone-900/60 to-[#080e0b]/80 hover:shadow-[0_0_60px_-10px_rgba(245,158,11,0.15)]'
            : 'border-red-900/30 bg-gradient-to-b from-stone-900/40 to-[#080e0b]/80 opacity-70'
        }
      `}
    >
      {/* Image */}
      <div className="relative h-64 w-full overflow-hidden bg-stone-950">
        {room.image_url && (
          <Image
            src={room.image_url}
            alt={room.room_name}
            fill
            className={`object-cover transition-transform duration-700 ${
              available ? 'group-hover:scale-105' : 'grayscale'
            }`}
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080e0b]/80 via-transparent to-transparent" />

        {/* Cabin badge */}
        <div className="absolute top-4 left-4">
          <span
            className="text-[10px] uppercase tracking-[0.2em] text-stone-300 bg-[#080e0b]/70 border border-stone-700/50 px-2.5 py-1 rounded-md backdrop-blur-sm"
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            {room.room_number}
          </span>
        </div>

        {/* Availability badge */}
        <div className="absolute top-4 right-4">
          {isChecking ? (
            <span
              className="text-[10px] text-stone-400 animate-pulse"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              cek…
            </span>
          ) : available ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400" style={{ fontFamily: 'DM Mono, monospace' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              Tersedia
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[10px] text-red-400" style={{ fontFamily: 'DM Mono, monospace' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              Penuh
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-6 gap-5">

        {/* Room type label */}
        <p
          className="text-[10px] uppercase tracking-[0.22em] text-amber-500/70"
          style={{ fontFamily: 'DM Mono, monospace' }}
        >
          {room.room_type}
        </p>

        {/* Room name */}
        <h3
          className="text-2xl font-light text-stone-100 leading-snug -mt-3"
          style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic' }}
        >
          {room.room_name}
        </h3>

        {/* Description */}
        <p className="text-sm text-stone-400 leading-relaxed font-light" style={{ fontFamily: 'DM Sans, sans-serif' }}>
          {room.description}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-4 text-xs text-stone-500 border-t border-stone-800/60 pt-4" style={{ fontFamily: 'DM Mono, monospace' }}>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-500/60" />
            <span>Maks {room.capacity} tamu</span>
          </span>
          <span className="flex items-center gap-1.5">
            <BedDouble className="w-3.5 h-3.5 text-amber-500/60" />
            <span>{room.room_type}</span>
          </span>
        </div>

        {/* Facilities */}
        {room.facilities && room.facilities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {room.facilities.map((fac, i) => (
              <span
                key={i}
                className="text-[10px] text-stone-400 border border-stone-700/50 rounded px-2 py-0.5 bg-stone-900/40"
                style={{ fontFamily: 'DM Mono, monospace' }}
              >
                {fac}
              </span>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Pricing */}
        <div className="border-t border-stone-800/60 pt-4 space-y-1">
          <p
            className="text-xs text-amber-500 tracking-wide"
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            Rp 200.000 / tamu / malam
          </p>
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-stone-500" style={{ fontFamily: 'DM Mono, monospace' }}>
              Estimasi ({effectiveGuests} tamu · {nights} malam)
            </span>
            <span
              className="text-lg text-amber-400 font-medium"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              {formatRupiah(estimatedTotal)}
            </span>
          </div>
        </div>

        {/* Capacity warning */}
        {over && capacityWarning && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-950/40 border border-amber-800/40">
            <XCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/80 leading-relaxed" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              {capacityWarning}
            </p>
          </div>
        )}

        {/* CTA */}
        {available ? (
          <button
            onClick={() => onSelect(room)}
            className="
              group/btn relative w-full flex items-center justify-center gap-2
              py-3 px-5 rounded-xl text-xs font-medium tracking-[0.12em] uppercase
              bg-amber-500 text-stone-950 hover:bg-amber-400
              transition-all duration-300 shadow-[0_4px_20px_rgba(245,158,11,0.25)]
              hover:shadow-[0_6px_30px_rgba(245,158,11,0.4)]
            "
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            Pilih Kabin Ini
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
          </button>
        ) : (
          <div
            className="w-full text-center py-2.5 rounded-xl border border-red-900/40 text-xs text-red-400/70"
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            Tidak tersedia pada tanggal ini
          </div>
        )}
      </div>
    </article>
  );
}

// ─── Main Inner Content ───────────────────────────────────────────────────────

function RoomsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lodging, updateLodgingRoom, updateLodgingDates, updateGuestsCount, setOrderType } =
    useCustomerOrder();

  const queryCheckIn  = searchParams.get('checkIn');
  const queryCheckOut = searchParams.get('checkOut');
  const queryGuests   = searchParams.get('guests');

  // Date state
  const [checkIn, setCheckIn] = useState<string>(
    queryCheckIn || lodging.checkInDate || todayStr()
  );
  const [checkOut, setCheckOut] = useState<string>(
    queryCheckOut || lodging.checkOutDate || tomorrowStr()
  );

  // Guest steppers
  const [adults, setAdults]     = useState<number>(queryGuests ? parseInt(queryGuests, 10) : (lodging.adultCount ?? 2));
  const [children, setChildren] = useState<number>((lodging.teenCount ?? 0) + (lodging.childCount ?? 0));

  const totalGuests = adults + children;

  // Rooms & availability
  const [rooms, setRooms]                   = useState<Room[]>([]);
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, boolean>>({});
  const [isChecking, setIsChecking]           = useState(false);
  const [capacityWarning, setCapacityWarning] = useState<string | null>(null);
  const [globalWarning, setGlobalWarning]     = useState<string | null>(null);

  const nights = calcNights(checkIn, checkOut);

  // Load rooms
  useEffect(() => {
    async function init() {
      const list = await getRooms({ activeOnly: true });
      setRooms(list);
      await checkAll(list, checkIn, checkOut);
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkAll = async (roomList: Room[], cin: string, cout: string) => {
    setIsChecking(true);
    const map: Record<string, boolean> = {};
    for (const r of roomList) {
      map[r.id] = await checkRoomDateAvailability(r.id, cin, cout);
    }
    setAvailabilityMap(map);
    setIsChecking(false);
  };

  const handleDateChange = (cin: string, cout: string) => {
    setCheckIn(cin);
    setCheckOut(cout);
    updateLodgingDates(cin, cout);
    checkAll(rooms, cin, cout);
  };

  const handleSelectRoom = (room: Room) => {
    setGlobalWarning(null);
    setCapacityWarning(null);

    if (totalGuests < 1) {
      setGlobalWarning('Masukkan minimal 1 tamu untuk melanjutkan pemesanan.');
      return;
    }

    if (totalGuests > room.capacity) {
      const needed = Math.ceil(totalGuests / room.capacity);
      setCapacityWarning(
        `${totalGuests} tamu melebihi kapasitas kabin ini (maks ${room.capacity}). Pertimbangkan memesan ${needed} unit.`
      );
      return;
    }

    updateLodgingDates(checkIn, checkOut);
    updateGuestsCount(adults, children, 0);
    updateLodgingRoom(room);
    setOrderType('lodging');
    router.push('/pesanan');
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#080e0b' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-16 px-6 flex flex-col items-center text-center overflow-hidden">

        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 blur-[120px] rounded-full" />
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 mb-10 text-stone-500 text-xs" style={{ fontFamily: 'DM Mono, monospace' }}>
          <Link href="/" className="hover:text-amber-400 transition-colors uppercase tracking-widest">
            Beranda
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-amber-400/70 uppercase tracking-widest">Kamar</span>
        </nav>

        {/* Label */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-px bg-amber-500/40" />
          <span
            className="text-[10px] uppercase tracking-[0.3em] text-amber-500/70"
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            Shelter · Cisarua Puncak
          </span>
          <div className="w-8 h-px bg-amber-500/40" />
        </div>

        {/* Main heading */}
        <h1
          className="text-5xl sm:text-6xl lg:text-7xl font-light text-stone-100 leading-[1.05] max-w-3xl"
          style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic' }}
        >
          Kabin Kayu di<br />
          <span className="text-amber-300/90">Lereng Hutan</span>
        </h1>

        {/* Sub-heading */}
        <p
          className="mt-5 text-base sm:text-lg text-stone-400 font-light max-w-xl leading-relaxed"
          style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
        >
          Tiga kabin reclaimed teak kayu jati — setiap malam hadir dengan sarapan pedesaan,
          perapian teras pribadi, dan hening yang sesungguhnya.
        </p>

        {/* Decorative rule */}
        <div className="mt-10 flex items-center gap-3">
          <div className="w-12 h-px bg-stone-700" />
          <Sparkles className="w-3.5 h-3.5 text-amber-500/40" />
          <div className="w-12 h-px bg-stone-700" />
        </div>
      </section>

      {/* ── Search / Filter Bar ──────────────────────────────────────────── */}
      <section className="px-6 max-w-5xl mx-auto w-full mb-16">
        <div className="rounded-2xl border border-stone-700/40 bg-stone-900/40 backdrop-blur-md p-6 sm:p-8 shadow-2xl">

          {/* Section label */}
          <p
            className="text-[10px] uppercase tracking-[0.25em] text-amber-500/60 mb-6"
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            Atur Kunjungan Anda
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">

            {/* Check-in */}
            <div className="flex flex-col gap-2">
              <label
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-stone-400"
                style={{ fontFamily: 'DM Mono, monospace' }}
              >
                <Calendar className="w-3 h-3 text-amber-500/50" />
                Check-In
              </label>
              <input
                type="date"
                value={checkIn}
                min={todayStr()}
                onChange={(e) => handleDateChange(e.target.value, checkOut)}
                className="w-full bg-stone-950/60 border border-stone-700/50 rounded-xl px-3.5 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-amber-500/50 transition-colors"
                style={{ fontFamily: 'DM Mono, monospace' }}
              />
            </div>

            {/* Check-out */}
            <div className="flex flex-col gap-2">
              <label
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-stone-400"
                style={{ fontFamily: 'DM Mono, monospace' }}
              >
                <Calendar className="w-3 h-3 text-amber-500/50" />
                Check-Out
              </label>
              <input
                type="date"
                value={checkOut}
                min={checkIn}
                onChange={(e) => handleDateChange(checkIn, e.target.value)}
                className="w-full bg-stone-950/60 border border-stone-700/50 rounded-xl px-3.5 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-amber-500/50 transition-colors"
                style={{ fontFamily: 'DM Mono, monospace' }}
              />
            </div>

            {/* Adults stepper */}
            <Stepper
              label="Dewasa"
              value={adults}
              min={0}
              onDecrement={() => { setAdults(Math.max(0, adults - 1)); setGlobalWarning(null); setCapacityWarning(null); }}
              onIncrement={() => { setAdults(adults + 1); setGlobalWarning(null); setCapacityWarning(null); }}
            />

            {/* Children stepper */}
            <Stepper
              label="Anak & Remaja"
              value={children}
              min={0}
              onDecrement={() => { setChildren(Math.max(0, children - 1)); setGlobalWarning(null); setCapacityWarning(null); }}
              onIncrement={() => { setChildren(children + 1); setGlobalWarning(null); setCapacityWarning(null); }}
            />
          </div>

          {/* Summary strip */}
          <div className="mt-6 pt-5 border-t border-stone-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs text-stone-500" style={{ fontFamily: 'DM Mono, monospace' }}>
              <span>
                <span className="text-stone-400">{nights}</span> malam
              </span>
              <span className="text-stone-700">·</span>
              <span>
                <span className="text-stone-400">{totalGuests}</span> tamu
              </span>
              {isChecking && (
                <span className="text-amber-500/60 animate-pulse">memeriksa ketersediaan…</span>
              )}
            </div>
            <p
              className="text-xs text-amber-500/70"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              Rp 200.000 / tamu / malam · termasuk sarapan
            </p>
          </div>

          {/* Global warning */}
          {globalWarning && (
            <div className="mt-4 flex items-center gap-2.5 p-3 rounded-xl bg-red-950/30 border border-red-900/40">
              <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-300" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {globalWarning}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Room Cards ───────────────────────────────────────────────────── */}
      <section className="px-6 max-w-6xl mx-auto w-full mb-24">

        {/* Section header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.25em] text-amber-500/60 mb-2"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              Koleksi Kabin
            </p>
            <h2
              className="text-3xl sm:text-4xl font-light text-stone-100"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              Tiga Ruang Istirahat
            </h2>
          </div>
          <div
            className="hidden sm:flex items-center gap-3 text-xs text-stone-600"
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.7)]" />
              Tersedia
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              Penuh
            </span>
          </div>
        </div>

        {/* Grid */}
        {rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Sparkles className="w-6 h-6 text-stone-600" />
            <p className="text-stone-600 text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Memuat data kabin…
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                isAvailable={availabilityMap[room.id]}
                isChecking={isChecking}
                nights={nights}
                totalGuests={totalGuests}
                onSelect={handleSelectRoom}
                capacityWarning={capacityWarning}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Editorial footer note ─────────────────────────────────────────── */}
      <section className="px-6 max-w-3xl mx-auto w-full mb-20 text-center">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-stone-800" />
          <CheckCircle className="w-4 h-4 text-emerald-500/50" />
          <div className="flex-1 h-px bg-stone-800" />
        </div>
        <p
          className="text-sm text-stone-500 leading-relaxed"
          style={{ fontFamily: 'Playfair Display, Georgia, serif', fontStyle: 'italic' }}
        >
          Setiap pemesanan mencakup sarapan khas pedesaan, akses kebun food forest, dan perapian
          teras kayu. Kami hanya menerima tamu yang menghargai ketenangan alam.
        </p>
      </section>

      <CustomerFooter />
    </div>
  );
}

// ─── Page Export ─────────────────────────────────────────────────────────────

export default function CustomerKamarPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <RoomsContent />
    </Suspense>
  );
}
