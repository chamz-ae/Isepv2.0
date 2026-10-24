'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BedDouble, Calendar, Users, Plus, Trash2, CheckCircle } from 'lucide-react';
import { getRooms, checkRoomDateAvailability } from '@/lib/services/roomService';
import { getMenus } from '@/lib/services/menuService';
import { createOrder } from '@/lib/services/orderService';
import { Room, MenuItem, PaymentMethod } from '@/lib/supabase/types';
import { formatRupiah, formatGram } from '@/lib/utils/formatters';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export default function AdminPesananPenginapanPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [lodgingMenus, setLodgingMenus] = useState<MenuItem[]>([]);

  // Form State
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().slice(0, 10));
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [checkOutDate, setCheckOutDate] = useState(tomorrow.toISOString().slice(0, 10));

  const [adultCount, setAdultCount] = useState(2);
  const [teenCount, setTeenCount] = useState(0);
  const [childCount, setChildCount] = useState(0);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [pricePerPerson, setPricePerPerson] = useState(200000); // Snapshot configurable base Rp200.000

  // Selected food items for lodging
  const [selectedMenus, setSelectedMenus] = useState<{ menu: MenuItem; qty: number; gram: number; subtotal: number }[]>([]);
  const [downPayment, setDownPayment] = useState(200000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      const [rList, mList] = await Promise.all([
        getRooms({ activeOnly: true }),
        getMenus({ accessScope: 'lodging', activeOnly: true }),
      ]);
      setRooms(rList);
      setLodgingMenus(mList);

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const qName = params.get('guestName');
        const qPhone = params.get('guestPhone');
        const qEmail = params.get('guestEmail');
        const qRoomId = params.get('roomId');
        const qDate = params.get('date') || params.get('checkInDate');
        if (qName) setGuestName(qName);
        if (qPhone) setGuestPhone(qPhone);
        if (qEmail) setGuestEmail(qEmail);
        if (qRoomId) {
          setSelectedRoomId(qRoomId);
        } else if (rList.length > 0) {
          setSelectedRoomId(rList[0].id);
        }
        if (qDate) {
          setCheckInDate(qDate);
          const nextDay = new Date(qDate);
          nextDay.setDate(nextDay.getDate() + 1);
          setCheckOutDate(nextDay.toISOString().slice(0, 10));
        }
      } else if (rList.length > 0) {
        setSelectedRoomId(rList[0].id);
      }
    }
    init();
  }, []);

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 1;
    const s = new Date(checkInDate);
    const e = new Date(checkOutDate);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  const nights = calculateNights();
  const totalGuests = adultCount + teenCount + childCount;
  const lodgingSubtotal = totalGuests * pricePerPerson * nights;
  const diningSubtotal = selectedMenus.reduce((acc, it) => acc + it.subtotal, 0);
  const grandTotal = lodgingSubtotal + diningSubtotal;

  const handleAddLodgingMenu = (menu: MenuItem) => {
    const defaultGram = menu.is_fixed_gram
      ? menu.standard_meat_gram
      : menu.meat_type !== 'none'
      ? menu.standard_meat_gram || 100
      : 0;

    let unitPrice = menu.price;
    if (menu.price_basis === 'per_gram') unitPrice = menu.price * defaultGram;

    setSelectedMenus((prev) => {
      const idx = prev.findIndex((i) => i.menu.id === menu.id);
      if (idx >= 0) {
        const updated = [...prev];
        const newQty = updated[idx].qty + 1;
        updated[idx] = { ...updated[idx], qty: newQty, subtotal: unitPrice * newQty };
        return updated;
      }
      return [...prev, { menu, qty: 1, gram: defaultGram, subtotal: unitPrice }];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim() || !selectedRoomId) {
      alert('Nama, telepon, dan kamar wajib dipilih');
      return;
    }

    setIsSubmitting(true);
    try {
      // Validate room availability
      const isAvailable = await checkRoomDateAvailability(selectedRoomId, checkInDate, checkOutDate);
      if (!isAvailable) {
        alert('Kamar tidak tersedia pada tanggal tersebut. Silakan pilih tanggal atau kamar lain.');
        setIsSubmitting(false);
        return;
      }

      const room = rooms.find((r) => r.id === selectedRoomId);
      if (room && totalGuests > room.capacity) {
        const neededRooms = Math.ceil(totalGuests / room.capacity);
        alert(
          `Kapasitas Melebihi Batas!\n\nJumlah tamu (${totalGuests} orang) melebihi kapasitas ${room.room_name} (Maks ${room.capacity} orang perkamar).\n\nRekomendasi Sistem: Dibutuhkan minimal ${neededRooms} unit kamar untuk menampung ${totalGuests} orang tamu.`
        );
        setIsSubmitting(false);
        return;
      }

      const created = await createOrder({
        guestName,
        guestPhone,
        guestEmail,
        orderType: selectedMenus.length > 0 ? 'combined' : 'lodging',
        roomId: selectedRoomId,
        roomNameSnapshot: room ? `${room.room_number} - ${room.room_name}` : undefined,
        checkInDate,
        checkOutDate,
        adultCount,
        teenCount,
        childCount,
        lodgingPricePerPersonSnapshot: pricePerPerson,
        downPayment,
        paymentMethod,
        isPaidImmediately: downPayment >= grandTotal,
        items: selectedMenus.map((sm) => ({
          menuId: sm.menu.id,
          menuName: sm.menu.name,
          unitPrice: sm.menu.price,
          meatType: sm.menu.meat_type,
          gramPerPortion: sm.gram,
          qty: sm.qty,
          subtotal: sm.subtotal,
        })),
        notes,
        operatorName: 'Resepsionis / Kasir',
      });

      alert(`Pemesanan Penginapan Berhasil Dibuat!\nBooking Code: ${created.booking_code}`);
      router.push('/admin/order-history');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan pesanan penginapan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Pemesanan Penginapan (Lodging)</h1>
        <p className="text-xs text-stone-500 mt-1">
          Pencatatan reservasi kabin kayu, rincian tamu, konfigurasi harga snapshot per orang, dan down payment.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Guest Profile Information */}
        <Card>
          <CardHeader title="1. Informasi Tamu Menginap" subtitle="Data identitas untuk reservasi dan riwayat kunjungan" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Nama Lengkap Tamu"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Contoh: Ibu Rina Melati"
              required
            />
            <Input
              label="Nomor Telepon / WhatsApp"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="0812xxxx"
              required
            />
            <Input
              label="Email (Opsional)"
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="email@tamu.com"
            />
          </div>
        </Card>

        {/* Room & Stay Schedule */}
        <Card>
          <CardHeader title="2. Kamar & Jadwal Menginap" subtitle="Pemeriksaan ketersediaan tanggal dan konfigurasi tarif" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Pilih Kamar Kabin"
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              required
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.room_number} — {r.room_name} ({r.room_type})
                </option>
              ))}
            </Select>

            <Input
              label="Tanggal Check-In"
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              required
            />

            <Input
              label="Tanggal Check-Out"
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              required
            />
          </div>

          <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input
              label="Jumlah Dewasa"
              type="number"
              min="0"
              value={adultCount}
              onChange={(e) => setAdultCount(parseInt(e.target.value) || 0)}
              required
            />
            <Input
              label="Jumlah Remaja"
              type="number"
              min="0"
              value={teenCount}
              onChange={(e) => setTeenCount(parseInt(e.target.value) || 0)}
            />
            <Input
              label="Jumlah Anak-Anak"
              type="number"
              min="0"
              value={childCount}
              onChange={(e) => setChildCount(parseInt(e.target.value) || 0)}
            />
            <Input
              label="Tarif / Orang (Snapshot Rp)"
              type="number"
              value={pricePerPerson}
              onChange={(e) => setPricePerPerson(parseFloat(e.target.value) || 200000)}
              required
            />
          </div>

          <div className="mt-4 p-3 bg-amber-50/60 border border-amber-200/80 rounded-lg flex items-center justify-between text-xs text-amber-900">
            <span>
              Kalkulasi Lodging: <strong>{totalGuests} Orang</strong> × <strong>{nights} Malam</strong> × <strong>{formatRupiah(pricePerPerson)}</strong>
            </span>
            <span className="text-sm font-bold">{formatRupiah(lodgingSubtotal)}</span>
          </div>

          {/* Capacity Validation & Recommendation Warning (Requirement 2.1) */}
          {(() => {
            const currentRoom = rooms.find((r) => r.id === selectedRoomId);
            if (currentRoom && totalGuests > currentRoom.capacity) {
              const neededRooms = Math.ceil(totalGuests / currentRoom.capacity);
              return (
                <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-xl text-xs text-red-900 space-y-2">
                  <div className="font-bold flex items-center gap-2 text-red-700 text-sm">
                    <Users className="w-4 h-4 text-red-600" />
                    <span>Jumlah Tamu Melebihi Kapasitas Kamar ({totalGuests} / Maks {currentRoom.capacity} Orang)</span>
                  </div>
                  <p className="text-red-800 leading-relaxed">
                    Kamar <strong>{currentRoom.room_number} — {currentRoom.room_name}</strong> hanya memiliki kapasitas maksimal <strong>{currentRoom.capacity} orang</strong>. Tamu yang Anda masukkan ({totalGuests} orang) tidak dapat ditampung dalam 1 kamar ini.
                  </p>
                  <div className="p-2.5 bg-red-100/70 border border-red-200 rounded-lg font-bold text-red-900">
                    💡 Rekomendasi Sistem: Untuk menampung {totalGuests} orang tamu dengan kapasitas {currentRoom.capacity} orang perkamar, Anda disarankan memesan minimal <strong>{neededRooms} unit kamar kabin</strong>.
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </Card>

        {/* Lodging Menus (Optional Pre-ordered Meals) */}
        <Card>
          <CardHeader title="3. Menu Penginapan (Opsional)" subtitle="Pilihan menu khusus tamu inap (Marlin Asap, Ungkep Ayam, Mangut Lele, dll.)" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
            {lodgingMenus.map((menu) => (
              <button
                type="button"
                key={menu.id}
                onClick={() => handleAddLodgingMenu(menu)}
                className="p-2 border border-stone-200 rounded-lg text-left hover:border-amber-500 hover:bg-stone-50 transition-colors text-xs"
              >
                <div className="font-bold text-stone-900 line-clamp-1">{menu.name}</div>
                <div className="text-stone-500 text-[11px] mt-0.5">{formatRupiah(menu.price)}</div>
              </button>
            ))}
          </div>

          {selectedMenus.length > 0 && (
            <div className="border border-stone-200 rounded-lg overflow-hidden divide-y divide-stone-100 text-xs">
              {selectedMenus.map((sm, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between">
                  <span className="font-semibold text-stone-800">{sm.menu.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-stone-500">{sm.qty} Porsi</span>
                    <span className="font-bold text-stone-900">{formatRupiah(sm.subtotal)}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedMenus((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-stone-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Down Payment & Financial Summary */}
        <Card>
          <CardHeader title="4. Pembayaran & Catatan" subtitle="Rincian Down Payment (DP) dan metode pelunasan" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Jumlah Down Payment (DP) Rp"
              type="number"
              value={downPayment}
              onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
              required
            />
            <Select
              label="Kanal Pembayaran DP"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
            >
              <option value="bank_transfer">Transfer Bank</option>
              <option value="qris">QRIS</option>
              <option value="cash">Tunai (Cash)</option>
            </Select>
            <Input
              label="Keterangan / Permintaan Khusus"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Tambah extra bed..."
            />
          </div>

          <div className="mt-6 p-4 bg-stone-900 text-white rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs text-stone-400">Total Biaya Pemesanan:</div>
              <div className="text-2xl font-black text-amber-400">{formatRupiah(grandTotal)}</div>
              <div className="text-xs text-stone-400 mt-0.5">
                DP Dicatat: {formatRupiah(downPayment)} • Sisa Pelunasan: {formatRupiah(Math.max(0, grandTotal - downPayment))}
              </div>
            </div>
            <Button
              type="submit"
              variant="amber"
              size="lg"
              isLoading={isSubmitting}
              disabled={(() => {
                const currentRoom = rooms.find((r) => r.id === selectedRoomId);
                return !!(currentRoom && totalGuests > currentRoom.capacity);
              })()}
            >
              {(() => {
                const currentRoom = rooms.find((r) => r.id === selectedRoomId);
                if (currentRoom && totalGuests > currentRoom.capacity) {
                  return `Melebihi Kapasitas (${totalGuests}/${currentRoom.capacity} Org)`;
                }
                return 'Simpan Reservasi Kabin';
              })()}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
