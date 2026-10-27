'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingBag,
  X,
  ArrowRight,
  User,
  Phone,
  Mail,
  Calendar,
  BedDouble,
  Users,
  Loader2,
  Trash2,
  ChevronLeft,
} from 'lucide-react';
import { useCustomerOrder } from '@/context/CustomerOrderContext';
import { createOrder } from '@/lib/services/orderService';
import { getRooms } from '@/lib/services/roomService';
import { Room } from '@/lib/supabase/types';
import { formatRupiah } from '@/lib/utils/formatters';
import { CustomerFooter } from '@/components/customer/CustomerFooter';

const GoldDivider = ({ className = '' }: { className?: string }) => (
  <div
    className={`w-full h-px bg-gradient-to-r from-transparent via-[rgba(201,169,110,0.30)] to-transparent ${className}`}
  />
);

interface LuxInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
}

const LuxInput = ({ label, icon, required, className = '', ...props }: LuxInputProps) => (
  <div className="flex flex-col gap-1.5 group">
    <label className="text-[10px] uppercase tracking-[0.2em] text-[#c9a96e]/70 flex items-center gap-1.5 font-mono">
      {icon && <span className="opacity-70">{icon}</span>}
      {label}
      {required && <span className="text-[#c9a96e]/50 ml-0.5">*</span>}
    </label>
    <input
      {...props}
      className={`
        w-full bg-transparent border-b border-[rgba(201,169,110,0.20)]
        py-2.5 px-0 text-sm text-stone-100 placeholder-stone-600 font-sans
        focus:outline-none focus:border-[#c9a96e] transition-colors duration-300
        ${className}
      `}
    />
  </div>
);

interface CounterProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}

const Counter = ({ label, value, onChange, min = 0, max = 20 }: CounterProps) => (
  <div className="flex items-center justify-between py-2 border-b border-[rgba(201,169,110,0.12)]">
    <span className="text-xs text-stone-300 font-sans">{label}</span>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-7 h-7 flex items-center justify-center border border-[rgba(201,169,110,0.25)] text-[#c9a96e] hover:border-[#c9a96e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-mono"
      >
        −
      </button>
      <span className="font-mono text-xs text-stone-200 w-5 text-center">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-7 h-7 flex items-center justify-center border border-[rgba(201,169,110,0.25)] text-[#c9a96e] hover:border-[#c9a96e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-mono"
      >
        +
      </button>
    </div>
  </div>
);

export default function PesananPage() {
  const router = useRouter();
  const {
    cartItems,
    removeCartItem,
    clearCart,
    orderType,
    lodging,
    updateLodgingDates,
    updateLodgingRoom,
    updateGuestsCount,
    restaurantSubtotal,
    lodgingSubtotal,
    grandTotal,
    customer,
    setCustomer,
  } = useCustomerOrder();

  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [notes, setNotes] = useState(customer?.notes || '');

  const [checkIn, setCheckIn] = useState(lodging?.checkInDate || '');
  const [checkOut, setCheckOut] = useState(lodging?.checkOutDate || '');
  const [selectedRoomId, setSelectedRoomId] = useState(lodging?.roomId || '');
  const [adults, setAdults] = useState(lodging?.adultCount || 1);
  const [teens, setTeens] = useState(lodging?.teenCount || 0);
  const [children, setChildren] = useState(lodging?.childCount || 0);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLodging = orderType === 'lodging' || lodging?.roomId !== null;

  useEffect(() => {
    getRooms({ activeOnly: true }).then(setRooms).catch(console.error);
  }, []);

  useEffect(() => {
    if (checkIn && checkOut) {
      updateLodgingDates(checkIn, checkOut);
    }
  }, [checkIn, checkOut, updateLodgingDates]);

  useEffect(() => {
    const r = rooms.find((x) => x.id === selectedRoomId) || null;
    updateLodgingRoom(r);
  }, [selectedRoomId, rooms, updateLodgingRoom]);

  useEffect(() => {
    updateGuestsCount(adults, teens, children);
  }, [adults, teens, children, updateGuestsCount]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Nama tamu wajib diisi.');
      return;
    }
    if (!phone.trim()) {
      setError('Nomor WhatsApp wajib diisi.');
      return;
    }

    if (isLodging && (!checkIn || !checkOut)) {
      setError('Tanggal check-in dan check-out wajib ditentukan.');
      return;
    }

    setLoading(true);
    try {
      setCustomer({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        notes: notes.trim(),
      });

      const orderPayload = {
        guestName: name.trim(),
        guestPhone: phone.trim(),
        guestEmail: email.trim() || undefined,
        orderType: isLodging ? (cartItems.length > 0 ? ('combined' as const) : ('lodging' as const)) : ('restaurant' as const),
        roomId: isLodging ? selectedRoomId || undefined : undefined,
        roomNameSnapshot: isLodging && selectedRoom ? selectedRoom.room_name : undefined,
        checkInDate: isLodging ? checkIn : undefined,
        checkOutDate: isLodging ? checkOut : undefined,
        adultCount: isLodging ? adults : undefined,
        teenCount: isLodging ? teens : undefined,
        childCount: isLodging ? children : undefined,
        items: cartItems.map((item) => ({
          menuId: item.menuId,
          menuName: item.name,
          unitPrice: item.unitPrice,
          meatType: item.meatType,
          gramPerPortion: item.gramPerPortion,
          qty: item.qty,
          subtotal: item.subtotal,
        })),
        notes: notes.trim() || undefined,
      };

      const newOrder = await createOrder(orderPayload);
      clearCart();
      router.push(`/konfirmasi?code=${newOrder.booking_code}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kendala saat menyimpan pesanan. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0 && !isLodging) {
    return (
      <div className="min-h-screen bg-[#080e0b] flex flex-col justify-between">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center max-w-md mx-auto">
          <ShoppingBag className="w-12 h-12 text-[#c9a96e]/30 mb-6" strokeWidth={1} />
          <h2 className="font-serif italic font-light text-3xl text-stone-200 mb-3">
            Keranjang Masih Kosong
          </h2>
          <p className="font-sans text-stone-400 text-sm mb-8 leading-relaxed font-light">
            Silakan pilih hidangan daging asap lambat atau reservasi kabin kayu untuk melanjutkan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/menu"
              className="px-6 py-3 border border-[#c9a96e]/40 text-[#e8c99a] hover:bg-[#c9a96e]/10 text-xs font-mono uppercase tracking-widest transition-all"
            >
              Jelajahi Menu Daging
            </Link>
            <Link
              href="/kamar"
              className="px-6 py-3 border border-[#c9a96e]/40 text-[#e8c99a] hover:bg-[#c9a96e]/10 text-xs font-mono uppercase tracking-widest transition-all"
            >
              Pilih Kabin Inap
            </Link>
          </div>
        </div>
        <CustomerFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080e0b] text-stone-100 flex flex-col justify-between">
      <div className="max-w-6xl mx-auto px-6 py-12 w-full flex-1">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 hover:text-[#c9a96e] transition-colors mb-6"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Kembali</span>
        </button>

        <div className="space-y-2 mb-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#c9a96e]">
            RESERVASI & PEMESANAN RESMI
          </span>
          <h1 className="font-serif italic text-4xl sm:text-5xl font-light text-[#f4ede0]">
            Konfirmasi Pesanan
          </h1>
        </div>

        <GoldDivider className="mb-10" />

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* LEFT: Order items summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-[#c9a96e]">
                Rincian Pesanan
              </h2>
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-stone-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Kosongkan</span>
                </button>
              )}
            </div>

            {/* Menu Items */}
            {cartItems.length > 0 && (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.menuId}
                    className="flex items-start justify-between py-3 border-b border-[rgba(201,169,110,0.12)] gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-serif italic text-lg text-stone-200 truncate">
                        {item.name}
                      </p>
                      <p className="font-mono text-[10px] text-stone-500 mt-0.5">
                        {item.gramPerPortion > 0 ? `${item.gramPerPortion}g · ` : ''}
                        {item.qty} Porsi
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-[#c9a96e]">
                        {formatRupiah(item.subtotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCartItem(item.menuId)}
                        className="text-stone-600 hover:text-red-400 transition-colors"
                        title="Hapus"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Lodging Line Item */}
            {isLodging && (
              <div className="py-4 border-b border-[rgba(201,169,110,0.15)] bg-[rgba(201,169,110,0.03)] px-4 rounded-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#c9a96e] block">
                      Shelter Kabin Inap
                    </span>
                    <p className="font-serif italic text-lg text-stone-200 mt-0.5">
                      {selectedRoom?.room_name || 'Kabin Terpilih'}
                    </p>
                    <p className="font-mono text-[10px] text-stone-500 mt-1">
                      {checkIn || '-'} s/d {checkOut || '-'} · {adults + teens + children} Tamu
                    </p>
                  </div>
                  <span className="font-mono text-sm text-[#c9a96e] font-bold">
                    {formatRupiah(lodgingSubtotal)}
                  </span>
                </div>
              </div>
            )}

            {/* Totals Breakdown */}
            <div className="pt-4 space-y-2 border-t border-[rgba(201,169,110,0.2)]">
              {cartItems.length > 0 && isLodging && (
                <>
                  <div className="flex justify-between font-mono text-xs text-stone-400">
                    <span>Subtotal Restoran:</span>
                    <span>{formatRupiah(restaurantSubtotal)}</span>
                  </div>
                  <div className="flex justify-between font-mono text-xs text-stone-400">
                    <span>Subtotal Kabin Inap:</span>
                    <span>{formatRupiah(lodgingSubtotal)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-baseline pt-2">
                <span className="font-mono text-xs uppercase tracking-widest text-[#c9a96e]">
                  Total Pembayaran:
                </span>
                <span className="font-mono text-xl text-[#f4ede0] font-bold">
                  {formatRupiah(grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Guest form */}
          <div className="lg:col-span-7 space-y-8 bg-forest-900/30 border border-[rgba(201,169,110,0.15)] p-6 sm:p-8 rounded-sm">
            <div>
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-[#c9a96e] mb-1">
                Data Pemesan
              </h2>
              <p className="font-sans text-xs text-stone-400 font-light">
                Kode reservasi dan rincian transaksi akan dikirimkan ke nomor WhatsApp Anda.
              </p>
            </div>

            <div className="space-y-5">
              <LuxInput
                label="Nama Lengkap"
                icon={<User className="w-3 h-3" />}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth. Bagas Pratama"
              />

              <LuxInput
                label="Nomor WhatsApp"
                icon={<Phone className="w-3 h-3" />}
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="cth. 08123456789"
                type="tel"
              />

              <LuxInput
                label="Alamat Email (Opsional)"
                icon={<Mail className="w-3 h-3" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cth. tamu@example.com"
                type="email"
              />
            </div>

            {/* Lodging specifics */}
            {isLodging && (
              <div className="space-y-5 pt-4 border-t border-[rgba(201,169,110,0.15)]">
                <h3 className="font-mono text-xs uppercase tracking-wider text-[#c9a96e]">
                  Pengaturan Menginap
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <LuxInput
                    label="Check-In"
                    icon={<Calendar className="w-3 h-3" />}
                    required
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                  />
                  <LuxInput
                    label="Check-Out"
                    icon={<Calendar className="w-3 h-3" />}
                    required
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-[#c9a96e]/70 block font-mono">
                    Pilih Kabin
                  </label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full bg-forest-950 border border-[rgba(201,169,110,0.25)] text-stone-100 py-2.5 px-3 rounded-sm font-mono text-xs focus:outline-none focus:border-[#c9a96e]"
                  >
                    <option value="">— Pilih Kabin —</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.room_name} (Kapasitas {r.capacity} Tamu)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 pt-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#c9a96e]/70 block font-mono mb-2">
                    Jumlah Tamu Menginap
                  </span>
                  <Counter label="Dewasa" value={adults} onChange={setAdults} min={1} />
                  <Counter label="Remaja (12–17 tahun)" value={teens} onChange={setTeens} min={0} />
                  <Counter label="Anak-anak (&lt; 12 tahun)" value={children} onChange={setChildren} min={0} />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-[#c9a96e]/70 block font-mono">
                Catatan Khusus (Opsional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="cth. Jangan terlalu pedas, tiba pukul 14.00 WIB"
                className="w-full bg-transparent border-b border-[rgba(201,169,110,0.2)] py-2 text-xs text-stone-100 placeholder-stone-600 font-sans focus:outline-none focus:border-[#c9a96e]"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#9a7040] via-[#c9a96e] to-[#9a7040] text-stone-950 font-mono font-bold text-xs uppercase tracking-[0.2em] rounded-sm transition-all shadow-xl hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses Reservasi...</span>
                </>
              ) : (
                <>
                  <span>Konfirmasi & Dapatkan Kode Pemesanan</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <CustomerFooter />
    </div>
  );
}
