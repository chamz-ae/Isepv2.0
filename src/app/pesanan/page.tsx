'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, BedDouble, UtensilsCrossed, Trash2, ArrowRight, ShieldCheck, Phone } from 'lucide-react';
import { useCustomerOrder } from '@/context/CustomerOrderContext';
import { createOrder } from '@/lib/services/orderService';
import { formatRupiah, formatGram } from '@/lib/utils/formatters';
import { CustomerFooter } from '@/components/customer/CustomerFooter';
import { Button } from '@/components/ui/Button';

export default function CustomerPesananCheckoutPage() {
  const router = useRouter();
  const {
    orderType,
    setOrderType,
    lodging,
    cartItems,
    updateCartItemQty,
    removeCartItem,
    clearCart,
    customer,
    setCustomer,
    paymentMethod,
    setPaymentMethod,
    downPayment,
    setDownPayment,
    lodgingNights,
    lodgingSubtotal,
    restaurantSubtotal,
    grandTotal,
    resetAll,
  } = useCustomerOrder();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const hasLodging = (orderType === 'lodging' || orderType === 'combined') && lodging.roomId;
  const hasDining = cartItems.length > 0;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customer.name.trim() || !customer.phone.trim()) {
      setErrorMessage('Nama lengkap dan nomor WhatsApp wajib diisi untuk konfirmasi.');
      return;
    }

    if (!hasLodging && !hasDining) {
      setErrorMessage('Keranjang pemesanan masih kosong. Silakan pilih menu daging atau kabin menginap.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalOrderType = hasLodging && hasDining ? 'combined' : hasLodging ? 'lodging' : 'restaurant';

      const created = await createOrder({
        guestName: customer.name,
        guestPhone: customer.phone,
        guestEmail: customer.email,
        orderType: finalOrderType,
        roomId: lodging.roomId || undefined,
        roomNameSnapshot: lodging.roomName || undefined,
        checkInDate: lodging.checkInDate || undefined,
        checkOutDate: lodging.checkOutDate || undefined,
        adultCount: lodging.adultCount,
        teenCount: lodging.teenCount,
        childCount: lodging.childCount,
        lodgingPricePerPersonSnapshot: lodging.pricePerPerson,
        items: cartItems.map((ci) => ({
          menuId: ci.menuId,
          menuName: ci.name,
          unitPrice: ci.unitPrice,
          meatType: ci.meatType,
          gramPerPortion: ci.gramPerPortion,
          qty: ci.qty,
          subtotal: ci.subtotal,
        })),
        downPayment: hasLodging ? downPayment : 0,
        paymentMethod,
        isPaidImmediately: false,
        notes: customer.notes,
        operatorName: 'Online Customer',
      });

      // Clear draft after successful creation
      resetAll();

      // Redirect to confirmation screen with booking code
      router.push(`/konfirmasi?code=${created.booking_code}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses pemesanan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-forest-950 text-stone-100 flex flex-col justify-between selection:bg-emerald-600 selection:text-white">
      <div className="max-w-5xl mx-auto px-6 py-12 w-full">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-emerald-400 font-bold">
            CHECKOUT & RESERVASI FOOD FOREST
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-stone-50">
            Ringkasan Pemesanan Anda
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 font-light">
            Sistem menghitung tarif gramasi daging & jadwal kabin secara langsung dan mencatatnya ke database operasional.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-8 p-4 bg-red-950/80 border border-red-800 rounded-2xl text-xs text-red-200 font-mono">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Selections Summary */}
          <div className="lg:col-span-7 space-y-6">
            {/* Lodging Cabin Summary Card */}
            {hasLodging ? (
              <div className="bg-forest-900/40 border border-forest-800/70 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between border-b border-forest-800/50 pb-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-serif text-lg font-light">
                    <BedDouble className="w-5 h-5 text-emerald-400" />
                    <span>Reservasi Kabin Menginap</span>
                  </div>
                  <Link href="/kamar" className="text-xs font-mono text-emerald-400 hover:underline">
                    Ubah Kamar
                  </Link>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Pilihan Kabin:</span>
                    <span className="font-bold text-stone-100">{lodging.roomName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Jadwal Inap:</span>
                    <span className="text-stone-200">
                      {lodging.checkInDate} s/d {lodging.checkOutDate} ({lodgingNights} Malam)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Jumlah Tamu:</span>
                    <span className="text-stone-200">
                      {lodging.adultCount} Dewasa, {lodging.teenCount} Remaja, {lodging.childCount} Anak
                    </span>
                  </div>
                  <div className="pt-2 border-t border-forest-800/50 flex justify-between font-bold">
                    <span className="text-stone-300">Subtotal Kabin:</span>
                    <span className="text-emerald-400 font-mono">{formatRupiah(lodgingSubtotal)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-forest-900/30 border border-dashed border-forest-800 rounded-3xl flex items-center justify-between text-xs font-mono">
                <span className="text-stone-400">Belum memilih kabin penginapan?</span>
                <Link href="/kamar" className="text-emerald-400 font-bold hover:underline">
                  + Pilih Kabin Inap
                </Link>
              </div>
            )}

            {/* Dining / Smokehouse Items Card */}
            <div className="bg-forest-900/40 border border-forest-800/70 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-forest-800/50 pb-3">
                <div className="flex items-center gap-2 text-emerald-400 font-serif text-lg font-light">
                  <UtensilsCrossed className="w-5 h-5 text-emerald-400" />
                  <span>Menu Daging & Hidangan</span>
                </div>
                <Link href="/menu" className="text-xs font-mono text-emerald-400 hover:underline">
                  + Tambah Menu
                </Link>
              </div>

              {cartItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-400 font-mono">
                  Belum ada hidangan daging di keranjang.{' '}
                  <Link href="/menu" className="text-emerald-400 underline ml-1">
                    Buka katalog menu daging
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-forest-800/40">
                  {cartItems.map((item) => (
                    <div key={item.menuId} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-stone-100">{item.name}</div>
                        <div className="text-stone-400 text-[11px] font-mono mt-0.5">
                          {item.totalGram > 0 && `${formatGram(item.gramPerPortion)} • `}
                          {formatRupiah(item.unitPrice)} / porsi
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-forest-950 border border-forest-800 rounded-lg p-1 font-mono">
                          <button
                            type="button"
                            onClick={() => updateCartItemQty(item.menuId, item.qty - 1)}
                            className="w-5 h-5 rounded bg-forest-900 flex items-center justify-center font-bold text-stone-300"
                          >
                            -
                          </button>
                          <span className="font-bold font-mono text-stone-100 w-4 text-center">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartItemQty(item.menuId, item.qty + 1)}
                            className="w-5 h-5 rounded bg-forest-900 flex items-center justify-center font-bold text-stone-300"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-bold font-mono text-emerald-400 min-w-16 text-right">
                          {formatRupiah(item.subtotal)}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeCartItem(item.menuId)}
                          className="text-stone-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-3 flex justify-between font-bold text-xs font-mono">
                    <span className="text-stone-300">Subtotal Hidangan:</span>
                    <span className="text-emerald-400">{formatRupiah(restaurantSubtotal)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Customer Details & Final Action */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-forest-900/40 border border-forest-800/70 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-4">
              <h3 className="font-serif text-lg font-light text-stone-100 border-b border-forest-800/50 pb-3">
                Informasi Tamu & Pemesan
              </h3>

              <div className="space-y-3.5 text-xs font-mono">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    placeholder="Contoh: Bagas Mahendra"
                    className="w-full px-3.5 py-2.5 bg-forest-950 border border-forest-800 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
                    No. Handphone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    placeholder="081234567890"
                    className="w-full px-3.5 py-2.5 bg-forest-950 border border-forest-800 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Booking code dan konfirmasi pesanan akan dikirimkan ke WhatsApp ini.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
                    Email (Opsional)
                  </label>
                  <input
                    type="email"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    placeholder="email@domain.com"
                    className="w-full px-3.5 py-2.5 bg-forest-950 border border-forest-800 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
                    Catatan Khusus
                  </label>
                  <textarea
                    rows={2}
                    value={customer.notes}
                    onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                    placeholder="Contoh: Perkiraan jam kedatangan 14.00 WIB..."
                    className="w-full px-3.5 py-2 bg-forest-950 border border-forest-800 rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {hasLodging && (
                  <div className="pt-2 border-t border-forest-800/40">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
                      Rencana Down Payment (DP) Kabin
                    </label>
                    <input
                      type="number"
                      value={downPayment}
                      onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 bg-forest-950 border border-forest-800 rounded-xl text-stone-100 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Grand Total Breakdown */}
              <div className="pt-4 border-t border-forest-800/50 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-stone-300">
                  <span>Total Tagihan:</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">{formatRupiah(grandTotal)}</span>
                </div>
                {hasLodging && downPayment > 0 && (
                  <div className="flex justify-between text-[11px] text-stone-400">
                    <span>DP Tercatat:</span>
                    <span className="font-bold text-stone-200">{formatRupiah(downPayment)}</span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-bold mt-4 bg-emerald-600 hover:bg-emerald-500 text-forest-950 py-3.5 rounded-2xl shadow-xl shadow-black/80 font-mono tracking-wider uppercase text-xs"
                disabled={isSubmitting || (!hasLodging && !hasDining)}
                isLoading={isSubmitting}
              >
                <span>Konfirmasi & Simpan Transaksi</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </form>
      </div>

      <CustomerFooter />
    </div>
  );
}
