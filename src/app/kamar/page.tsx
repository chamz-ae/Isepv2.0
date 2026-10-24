'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BedDouble, Users, Calendar, Check, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { getRooms, checkRoomDateAvailability } from '@/lib/services/roomService';
import { Room } from '@/lib/supabase/types';
import { formatRupiah } from '@/lib/utils/formatters';
import { useCustomerOrder } from '@/context/CustomerOrderContext';
import { CustomerFooter } from '@/components/customer/CustomerFooter';
import { Button } from '@/components/ui/Button';

export default function CustomerKamarPage() {
  const router = useRouter();
  const { lodging, updateLodgingRoom, updateLodgingDates, updateGuestsCount, setOrderType } = useCustomerOrder();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [checkIn, setCheckIn] = useState<string>(
    lodging.checkInDate || new Date().toISOString().slice(0, 10)
  );

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [checkOut, setCheckOut] = useState<string>(
    lodging.checkOutDate || tomorrow.toISOString().slice(0, 10)
  );

  // String state for inputs to allow user to backspace, type 0, or enter 2-9 easily (Requirement 2.2)
  const [adultsInput, setAdultsInput] = useState<string>(
    lodging.adultCount !== undefined ? String(lodging.adultCount) : '2'
  );
  const [childrenInput, setChildrenInput] = useState<string>(
    lodging.teenCount !== undefined || lodging.childCount !== undefined
      ? String((lodging.teenCount || 0) + (lodging.childCount || 0))
      : '0'
  );

  const [validationError, setValidationError] = useState<string>('');
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, boolean>>({});
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const adultsNum = parseInt(adultsInput, 10) || 0;
  const childrenNum = parseInt(childrenInput, 10) || 0;
  const totalGuests = adultsNum + childrenNum;

  useEffect(() => {
    async function init() {
      const list = await getRooms({ activeOnly: true });
      setRooms(list);
      checkAllAvailability(list, checkIn, checkOut);
    }
    init();
  }, []);

  const checkAllAvailability = async (roomList: Room[], cin: string, cout: string) => {
    setIsChecking(true);
    const map: Record<string, boolean> = {};
    for (const r of roomList) {
      const isAvail = await checkRoomDateAvailability(r.id, cin, cout);
      map[r.id] = isAvail;
    }
    setAvailabilityMap(map);
    setIsChecking(false);
  };

  const handleDateChange = (cin: string, cout: string) => {
    setCheckIn(cin);
    setCheckOut(cout);
    updateLodgingDates(cin, cout);
    checkAllAvailability(rooms, cin, cout);
  };

  const handleSelectRoom = (room: Room) => {
    setValidationError('');

    // Requirement 2.2 validation: input can be 0 individually, but total must be >= 1 to proceed
    if (totalGuests < 1) {
      setValidationError('Jumlah tamu tidak boleh 0. Silakan isi minimal 1 orang dewasa atau anak.');
      return;
    }

    // Requirement 2.1: Capacity validation and recommendation
    if (totalGuests > room.capacity) {
      const neededRooms = Math.ceil(totalGuests / room.capacity);
      setValidationError(
        `Jumlah tamu (${totalGuests} orang) melebihi kapasitas ${room.room_name} (Maks ${room.capacity} orang perkamar). Sistem merekomendasikan memesan minimal ${neededRooms} unit kamar.`
      );
      return;
    }

    updateLodgingDates(checkIn, checkOut);
    updateGuestsCount(adultsNum, childrenNum, 0);
    updateLodgingRoom(room);
    setOrderType('lodging');
    // Navigate directly to checkout
    router.push('/pesanan');
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 1;
    const s = new Date(checkIn);
    const e = new Date(checkOut);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  const nights = calculateNights();

  return (
    <div className="min-h-screen bg-forest-950 text-stone-100 flex flex-col justify-between selection:bg-emerald-600 selection:text-white">
      <div className="max-w-7xl mx-auto px-6 py-12 w-full">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-emerald-400 font-bold">
            SHELTER KABIN KAYU FOOD FOREST
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-light text-stone-50">
            Pilih Ruang Beristirahat Anda
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed">
            Dikelilingi rimbun kebun pangan dan perapian kayu jati. Jadwal tanggal yang dipilih otomatis terkunci dan tersinkronisasi langsung ke sistem kasir & dashboard.
          </p>
        </div>

        {/* Date & Guest Selector Filter Bar (Forest Styled) */}
        <div className="bg-forest-900/60 border border-forest-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-md mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
                Tanggal Check-In
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => handleDateChange(e.target.value, checkOut)}
                className="w-full px-3.5 py-2.5 bg-forest-950 border border-forest-800 rounded-xl text-stone-100 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
                Tanggal Check-Out
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => handleDateChange(checkIn, e.target.value)}
                className="w-full px-3.5 py-2.5 bg-forest-950 border border-forest-800 rounded-xl text-stone-100 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Requirement 2.2: Input can be 0 without blocking the user from typing 2-9 */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
                Jumlah Dewasa
              </label>
              <input
                type="number"
                min="0"
                value={adultsInput}
                placeholder="0"
                onChange={(e) => {
                  const val = e.target.value;
                  setAdultsInput(val);
                  setValidationError('');
                }}
                className="w-full px-3.5 py-2.5 bg-forest-950 border border-forest-800 rounded-xl text-stone-100 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">Bisa diisi 0 jika diperlukan</span>
            </div>

            {/* Requirement 2.2: Children input can be 0 */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
                Anak & Remaja
              </label>
              <input
                type="number"
                min="0"
                value={childrenInput}
                placeholder="0"
                onChange={(e) => {
                  const val = e.target.value;
                  setChildrenInput(val);
                  setValidationError('');
                }}
                className="w-full px-3.5 py-2.5 bg-forest-950 border border-forest-800 rounded-xl text-stone-100 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">Bisa 0 (atau ketik bebas)</span>
            </div>
          </div>

          {validationError && (
            <div className="mt-4 p-3 bg-red-950/80 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-forest-800/50 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-stone-300 gap-2">
            <div>
              Durasi Terpilih: <strong className="text-emerald-400 font-mono">{nights} Malam</strong> • Total Tamu:{' '}
              <strong className="text-emerald-400 font-mono">{totalGuests} Orang</strong>
            </div>
            <div className="text-emerald-300/90 font-mono text-[11px]">
              Tarif Resmi: Rp 200.000 / orang / malam (termasuk menu sarapan khas)
            </div>
          </div>
        </div>

        {/* Room Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {rooms.map((room) => {
            const isAvailable = availabilityMap[room.id] !== false;
            const effectiveGuests = Math.max(1, totalGuests);
            const estimatedRoomTotal = effectiveGuests * room.price_per_night * nights;

            return (
              <div
                key={room.id}
                className={`bg-forest-900/40 border rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-2xl backdrop-blur-md ${
                  isAvailable
                    ? 'border-forest-800/70 hover:border-emerald-500/50 hover:shadow-emerald-950/40'
                    : 'border-red-900/50 opacity-80'
                }`}
              >
                <div>
                  <div className="relative w-full h-56 bg-forest-950">
                    {room.image_url && (
                      <Image
                        src={room.image_url}
                        alt={room.room_name}
                        fill
                        className={`object-cover ${!isAvailable ? 'grayscale' : ''}`}
                      />
                    )}
                    <div className="absolute top-3 left-3 bg-forest-950/90 border border-forest-800 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-stone-200">
                      Kabin {room.room_number}
                    </div>

                    <div className="absolute top-3 right-3">
                      {isAvailable ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-950/90 border border-emerald-500/50 text-emerald-300">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Tersedia</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-red-950/90 border border-red-500/50 text-red-300 animate-pulse">
                          <span>Sudah Dibooking</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="font-serif text-2xl font-light text-stone-100">{room.room_name}</h3>
                      <p className="text-xs text-stone-300/80 mt-1 leading-relaxed font-light">{room.description}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-stone-400 font-mono border-y border-forest-800/40 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Maks {room.capacity} Orang</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BedDouble className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Kabin Jati Privat</span>
                      </div>
                    </div>

                    {/* Facilities Pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {room.facilities.map((fac, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-forest-950/80 text-emerald-300/80 px-2 py-0.5 rounded-full border border-forest-800/60 font-mono"
                        >
                          {fac}
                        </span>
                      ))}
                    </div>
                    {/* Capacity Warning and Recommendation (Requirement 2.1) */}
                    {totalGuests > room.capacity && (
                      <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-red-200 text-xs space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-red-300">
                          <Users className="w-3.5 h-3.5" />
                          <span>Melebihi Kapasitas Kabin</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-red-100/90">
                          Kapasitas kabin ini: <strong>Maks {room.capacity} orang</strong>. Jumlah tamu Anda: <strong>{totalGuests} orang</strong>.
                        </p>
                        <div className="text-[11px] font-bold text-amber-300 pt-1 border-t border-red-800/60">
                          💡 Rekomendasi: Gunakan minimal {Math.ceil(totalGuests / room.capacity)} unit kamar untuk menampung seluruh tamu.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <div className="p-4 bg-forest-950/80 border border-forest-800/60 rounded-2xl mb-4 space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-stone-400 text-[11px]">
                      <span>Tarif per Orang:</span>
                      <span>{formatRupiah(room.price_per_night)} / malam</span>
                    </div>
                    <div className="flex justify-between font-bold text-stone-100 pt-1 border-t border-forest-800/40">
                      <span>Estimasi ({effectiveGuests} Orang • {nights} Malam):</span>
                      <span className="text-emerald-400 font-mono">{formatRupiah(estimatedRoomTotal)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSelectRoom(room)}
                    disabled={!isAvailable || isChecking || totalGuests > room.capacity}
                    variant={isAvailable && totalGuests <= room.capacity ? 'primary' : 'outline'}
                    className={`w-full py-3 text-xs uppercase tracking-wider font-mono font-bold ${
                      totalGuests > room.capacity
                        ? 'border-amber-700 text-amber-300 bg-amber-950/40 cursor-not-allowed'
                        : isAvailable
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-forest-950 shadow-lg shadow-emerald-950/50'
                        : 'border-red-800 text-red-400 bg-red-950/30 cursor-not-allowed'
                    }`}
                  >
                    {totalGuests > room.capacity ? (
                      <span>Melebihi Kapasitas ({totalGuests}/{room.capacity} Org)</span>
                    ) : isAvailable ? (
                      <span className="flex items-center justify-center gap-2">
                        <span>Pilih Kabin & Lanjut Pesan</span>
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    ) : (
                      <span>Kamar Penuh Pada Tanggal Ini</span>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CustomerFooter />
    </div>
  );
}
