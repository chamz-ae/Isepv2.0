'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UtensilsCrossed, Plus, Minus, Trash2, CheckCircle2, User, Search, ShoppingCart } from 'lucide-react';
import { getMenus } from '@/lib/services/menuService';
import { getTables } from '@/lib/services/roomService';
import { getGuests } from '@/lib/services/guestService';
import { createOrder } from '@/lib/services/orderService';
import { MenuItem, RestaurantTable, Guest, PaymentMethod } from '@/lib/supabase/types';
import { formatRupiah, formatGram } from '@/lib/utils/formatters';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface CartItemPOS {
  menu: MenuItem;
  gram: number;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export default function PosRestoranPage() {
  const router = useRouter();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);

  // Order state
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [cart, setCart] = useState<CartItemPOS[]>([]);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isPaidNow, setIsPaidNow] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [menuSearch, setMenuSearch] = useState<string>('');

  useEffect(() => {
    async function init() {
      const [m, t, g] = await Promise.all([
        getMenus({ accessScope: 'restaurant', activeOnly: true }),
        getTables(),
        getGuests(),
      ]);
      setMenus(m);
      setTables(t);
      setGuests(g);

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const qName = params.get('guestName');
        const qPhone = params.get('guestPhone');
        const qTableId = params.get('tableId');
        if (qName) setGuestName(qName);
        if (qPhone) setGuestPhone(qPhone);
        if (qTableId) {
          setSelectedTableId(qTableId);
        } else if (t.length > 0) {
          setSelectedTableId(t[0].id);
        }
      } else if (t.length > 0) {
        setSelectedTableId(t[0].id);
      }
    }
    init();
  }, []);

  const handleSelectExistingGuest = (guest: Guest) => {
    setGuestName(guest.name);
    setGuestPhone(guest.phone);
  };

  const addToCart = (menu: MenuItem) => {
    const isMeat = menu.meat_type !== 'none';
    const isPerEkor = menu.price_basis === 'per_ekor';
    const isFixedMeat = isMeat && menu.is_fixed_gram;
    const isPer100g = (menu.price_basis === 'per_100g' || menu.price_basis === 'per_gram') || (isMeat && !isPerEkor && !isFixedMeat && menu.price_basis !== 'per_portion');

    const defaultGram = isFixedMeat
      ? menu.standard_meat_gram
      : isPer100g
      ? Math.max(100, menu.standard_meat_gram || 100)
      : 0;

    let unitPrice = menu.price;
    if (isPer100g) {
      unitPrice = Math.round((menu.price * defaultGram) / 100);
    } else if (menu.price_basis === 'per_gram') {
      unitPrice = menu.price * defaultGram;
    }

    setCart((prev) => {
      const idx = prev.findIndex((ci) => ci.menu.id === menu.id && ci.gram === defaultGram);
      if (idx >= 0) {
        const updated = [...prev];
        const newQty = updated[idx].qty + 1;
        updated[idx] = { ...updated[idx], qty: newQty, subtotal: unitPrice * newQty };
        return updated;
      }
      return [...prev, { menu, gram: defaultGram, qty: 1, unitPrice, subtotal: unitPrice }];
    });
  };

  const updateCartQty = (idx: number, delta: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const newQty = updated[idx].qty + delta;
      if (newQty <= 0) return prev.filter((_, i) => i !== idx);
      updated[idx] = { ...updated[idx], qty: newQty, subtotal: updated[idx].unitPrice * newQty };
      return updated;
    });
  };

  const updateCartGram = (idx: number, newGram: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[idx];
      const isMeat = item.menu.meat_type !== 'none';
      const isPerEkor = item.menu.price_basis === 'per_ekor';
      const isFixedMeat = isMeat && item.menu.is_fixed_gram;
      const isPer100g = (item.menu.price_basis === 'per_100g' || item.menu.price_basis === 'per_gram') || (isMeat && !isPerEkor && !isFixedMeat && item.menu.price_basis !== 'per_portion');

      let unitPrice = item.menu.price;
      if (isPer100g) {
        unitPrice = Math.round((item.menu.price * newGram) / 100);
      } else if (item.menu.price_basis === 'per_gram') {
        unitPrice = item.menu.price * newGram;
      }
      updated[idx] = { ...item, gram: newGram, unitPrice, subtotal: unitPrice * item.qty };
      return updated;
    });
  };

  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);

  const handleSubmitOrder = async () => {
    if (!guestName.trim() || !guestPhone.trim()) {
      alert('Nama tamu dan nomor telepon wajib diisi untuk pencatatan order & loyalitas.');
      return;
    }
    if (cart.length === 0) {
      alert('Pilih minimal 1 menu untuk pesanan restoran.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedTable = tables.find((t) => t.id === selectedTableId);

      const created = await createOrder({
        guestName,
        guestPhone,
        orderType: 'restaurant',
        tableId: selectedTableId || undefined,
        tableNumberSnapshot: selectedTable?.table_number,
        items: cart.map((ci) => ({
          menuId: ci.menu.id,
          menuName: ci.menu.name,
          unitPrice: ci.unitPrice,
          meatType: ci.menu.meat_type,
          gramPerPortion: ci.gram,
          qty: ci.qty,
          subtotal: ci.subtotal,
        })),
        paymentMethod,
        isPaidImmediately: isPaidNow,
        notes: orderNotes,
        operatorName: 'Kasir POS',
      });

      alert(`Pesanan Restoran Berhasil! Booking Code: ${created.booking_code}`);
      setCart([]);
      setGuestName('');
      setGuestPhone('');
      setOrderNotes('');
      router.push('/admin/order-history');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan pesanan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMenus = menus.filter((m) =>
    m.name.toLowerCase().includes(menuSearch.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
      {/* Left: Menu Catalog Picker */}
      <div className="lg:col-span-7 flex flex-col h-full bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-stone-900">Katalog Menu Restoran</h2>
            <p className="text-xs text-stone-500">Klik item untuk menambahkan ke pesanan kasir</p>
          </div>
          <div className="w-56">
            <Input
              placeholder="Cari menu..."
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredMenus.map((menu) => (
            <div
              key={menu.id}
              onClick={() => addToCart(menu)}
              className="border border-stone-200 rounded-xl p-3 hover:border-amber-500 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between bg-stone-50/50 hover:bg-white"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  {menu.meat_type !== 'none'
                    ? `🥩 ${menu.meat_type.replace('_', ' ')} • ${menu.price_basis === 'per_ekor' ? '1 Ekor' : menu.price_basis === 'per_100g' ? 'Per 100g' : 'Porsi'}`
                    : 'Porsi Standard'}
                </span>
                <h4 className="font-bold text-stone-900 text-xs mt-1">{menu.name}</h4>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <span className="font-black text-xs text-stone-900">{formatRupiah(menu.price)}</span>
                  <span className="text-[10px] text-stone-400 ml-1">
                    /{menu.price_basis === 'per_100g' ? '100g' : menu.price_basis === 'per_ekor' ? '1 ekor' : 'porsi'}
                  </span>
                </div>
                <span className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold">
                  +
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Active Order Form & Payment Checkout */}
      <div className="lg:col-span-5 flex flex-col h-full bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-stone-100">
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-amber-600" />
            <span>Form Pesanan Kasir</span>
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Guest and Table selection */}
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Pilih Meja"
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.table_number} ({t.capacity} Orang) - {t.status}
                </option>
              ))}
            </Select>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Cari Tamu Terdaftar
              </label>
              <select
                onChange={(e) => {
                  const g = guests.find((item) => item.id === e.target.value);
                  if (g) handleSelectExistingGuest(g);
                }}
                className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg text-stone-900"
              >
                <option value="">-- Tamu Baru --</option>
                {guests.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.phone}) {g.is_loyal ? '👑 Loyal' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nama Tamu"
              placeholder="Contoh: Pak Budi"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              required
            />
            <Input
              label="No. Telepon / WhatsApp"
              placeholder="0812xxxx"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              required
            />
          </div>

          {/* Cart Items List */}
          <div className="border border-stone-200 rounded-lg overflow-hidden">
            <div className="bg-stone-50 px-3 py-2 text-xs font-bold text-stone-700 border-b border-stone-200 flex justify-between">
              <span>Item Pesanan ({cart.length})</span>
              <span>Subtotal</span>
            </div>

            {cart.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400">
                Pilih menu di katalog samping untuk menambahkan ke pesanan ini.
              </div>
            ) : (
              <div className="divide-y divide-stone-100 max-h-48 overflow-y-auto">
                {cart.map((ci, idx) => (
                  <div key={idx} className="p-3 text-xs flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900">{ci.menu.name}</span>
                      <span className="font-bold text-stone-900">{formatRupiah(ci.subtotal)}</span>
                    </div>

                    <div className="flex items-center justify-between text-stone-500">
                      {/* Flexible Gram Picker if Meat per 100g */}
                      {ci.menu.meat_type !== 'none' && !ci.menu.is_fixed_gram && ci.menu.price_basis !== 'per_ekor' ? (
                        <div className="flex items-center gap-1.5">
                          <span>Gramasi:</span>
                          <input
                            type="number"
                            step="10"
                            min="100"
                            value={ci.gram}
                            onChange={(e) => updateCartGram(idx, parseFloat(e.target.value) || 100)}
                            className="w-16 px-1.5 py-0.5 border border-stone-300 rounded text-center font-mono font-bold"
                          />
                          <span>g</span>
                        </div>
                      ) : (
                        <span>
                          {ci.menu.price_basis === 'per_ekor'
                            ? '1 Ekor Utuh'
                            : ci.menu.is_fixed_gram
                            ? `Fixed ${ci.gram}g Daging`
                            : '1 Porsi'}
                        </span>
                      )}

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQty(idx, -1)}
                          className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="font-bold w-4 text-center">{ci.qty}</span>
                        <button
                          onClick={() => updateCartQty(idx, 1)}
                          className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Input
            label="Catatan Khusus Meja / Dapur"
            placeholder="Contoh: Sambal pisah, daging well done..."
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
          />

          {/* Payment Method & Immediate Status */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-700">Kanal Pembayaran:</span>
              <div className="flex gap-2">
                {(['cash', 'qris', 'bank_transfer', 'room_charge'] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`px-2.5 py-1 rounded font-bold uppercase text-[10px] transition-colors ${
                      paymentMethod === m
                        ? 'bg-amber-600 text-stone-950 shadow-xs'
                        : 'bg-white border border-stone-300 text-stone-600'
                    }`}
                  >
                    {m.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-stone-200">
              <input
                type="checkbox"
                id="is_paid_now"
                checked={isPaidNow}
                onChange={(e) => setIsPaidNow(e.target.checked)}
                className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="is_paid_now" className="text-xs font-semibold text-stone-800">
                Konfirmasi Pembayaran Diterima Sekarang (Lunas)
              </label>
            </div>
          </div>
        </div>

        {/* Footer Checkout Action */}
        <div className="p-4 bg-stone-50 border-t border-stone-200">
          <div className="flex items-center justify-between mb-3 text-stone-900">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Total Tagihan:</span>
            <span className="text-xl font-black text-emerald-800">{formatRupiah(subtotal)}</span>
          </div>
          <Button
            onClick={handleSubmitOrder}
            variant="amber"
            size="lg"
            className="w-full font-bold"
            disabled={cart.length === 0 || isSubmitting}
            isLoading={isSubmitting}
          >
            Simpan Pesanan & Cetak Tiket
          </Button>
        </div>
      </div>
    </div>
  );
}
