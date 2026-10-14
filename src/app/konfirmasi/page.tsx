'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, MessageSquare, ArrowLeft, Copy, Check, Home, BedDouble, UtensilsCrossed } from 'lucide-react';
import { getOrderByBookingCode } from '@/lib/services/orderService';
import { Order } from '@/lib/supabase/types';
import { formatRupiah, formatGram, formatDateTimeWIB, generateWhatsAppLink } from '@/lib/utils/formatters';
import { CustomerFooter } from '@/components/customer/CustomerFooter';
import { Button } from '@/components/ui/Button';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const bookingCode = searchParams.get('code') || '';
  const [order, setOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (bookingCode) {
        const found = await getOrderByBookingCode(bookingCode);
        setOrder(found);
      }
      setIsLoading(false);
    }
    load();
  }, [bookingCode]);

  const handleCopyCode = () => {
    if (bookingCode) {
      navigator.clipboard.writeText(bookingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Build pre-filled WhatsApp message
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '6281234567890';
  let waText = '';
  if (order) {
    waText = `Halo ASAP ISEP, saya ingin mengonfirmasi pesanan saya:
*Booking Code:* ${order.booking_code}
*Nama Tamu:* ${order.guest_name}
*Tipe:* ${order.order_type.toUpperCase()}
*Total Tagihan:* ${formatRupiah(order.total_amount)}
${order.room_name_snapshot ? `*Kabin:* ${order.room_name_snapshot} (${order.check_in_date} s/d ${order.check_out_date})` : ''}

Mohon informasi nomor rekening resmi / QRIS untuk konfirmasi pembayaran. Terima kasih!`;
  }
  const waUrl = generateWhatsAppLink(waNumber, waText);

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 w-full text-center">
      {isLoading ? (
        <div className="p-12 text-sm text-stone-400 font-mono">Memuat rincian transaksi...</div>
      ) : !order ? (
        <div className="space-y-4 bg-forest-900/60 p-8 rounded-3xl border border-forest-800">
          <h2 className="text-xl font-bold text-stone-100">Kode Pemesanan Tidak Ditemukan</h2>
          <p className="text-xs text-stone-400">
            Periksa kembali kode pemesanan yang Anda masukkan atau lakukan pemesanan baru.
          </p>
          <Link href="/" className="inline-block mt-4 text-xs font-bold text-emerald-400 underline font-mono">
            Kembali ke Beranda
          </Link>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Success Icon */}
          <div className="w-16 h-16 rounded-full bg-emerald-950/90 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-emerald-400">
              TRANSAKSI BERHASIL TERCATAT DI SISTEM
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-light text-stone-50 mt-1">
              Pemesanan Anda Telah Diterima
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 mt-2 max-w-md mx-auto leading-relaxed font-light">
              Simpan booking code di bawah ini. Kode dapat digunakan untuk konfirmasi kasir via WhatsApp dan mengunggah momen ke Galeri Tamu.
            </p>
          </div>

          {/* Booking Code Banner with Copy Action */}
          <div className="bg-forest-900/60 border border-emerald-600/40 rounded-3xl p-6 shadow-2xl space-y-3 backdrop-blur-md">
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-300/80 font-mono">
              KODE PEMESANAN ANDA (BOOKING CODE)
            </span>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-3xl sm:text-4xl font-black text-emerald-400 tracking-wider">
                {order.booking_code}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-xl bg-forest-950 hover:bg-forest-800 text-stone-300 transition-colors border border-forest-800"
                title="Salin Booking Code"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <span className="text-[11px] text-stone-400 font-mono block">
              Status: {order.payment_status === 'paid' ? 'Lunas' : order.payment_status === 'down_payment' ? 'DP Tercatat' : 'Menunggu Konfirmasi Pembayaran'}
            </span>
          </div>

          {/* Order Items Summary */}
          <div className="bg-forest-900/40 border border-forest-800/70 rounded-3xl p-6 text-left space-y-3 text-xs font-mono backdrop-blur-md">
            <div className="flex justify-between border-b border-forest-800/40 pb-2">
              <span className="text-stone-400">Nama Tamu:</span>
              <span className="font-bold text-stone-100">{order.guest_name}</span>
            </div>
            <div className="flex justify-between border-b border-forest-800/40 pb-2">
              <span className="text-stone-400">No. WhatsApp:</span>
              <span className="text-stone-200">{order.guest_phone}</span>
            </div>
            {order.room_name_snapshot && (
              <div className="flex justify-between border-b border-forest-800/40 pb-2">
                <span className="text-stone-400">Kabin Menginap:</span>
                <span className="text-stone-200">
                  {order.room_name_snapshot} ({order.check_in_date} s/d {order.check_out_date})
                </span>
              </div>
            )}
            {order.order_items && order.order_items.length > 0 && (
              <div className="py-1 space-y-1">
                <span className="text-stone-400 block font-semibold">Menu Daging & Hidangan:</span>
                {order.order_items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-stone-300 pl-2">
                    <span>• {it.menu_name_snapshot} ({it.qty} porsi {it.total_gram > 0 ? `/ ${formatGram(it.total_gram)}` : ''})</span>
                    <span>{formatRupiah(it.subtotal)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-2 border-t border-forest-800/50 flex justify-between text-sm font-bold">
              <span className="text-stone-200">Total Tagihan:</span>
              <span className="text-emerald-400">{formatRupiah(order.total_amount)}</span>
            </div>
          </div>

          {/* WhatsApp Confirmation Action Button */}
          <div className="space-y-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-forest-950 font-bold text-xs uppercase tracking-wider font-mono rounded-full transition-all shadow-xl shadow-black/80 hover:scale-105 flex items-center justify-center gap-2.5"
            >
              <MessageSquare className="w-5 h-5 text-forest-950" />
              <span>Konfirmasi via WhatsApp Sekarang</span>
            </a>

            <Link
              href="/galeri"
              className="block text-xs font-mono text-stone-400 hover:text-emerald-400 transition-colors underline"
            >
              Unggah foto momen Anda ke Galeri menggunakan Booking Code ini
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <div className="min-h-screen bg-forest-950 text-stone-100 flex flex-col justify-between selection:bg-emerald-600 selection:text-white">
      <Suspense fallback={<div className="max-w-2xl mx-auto px-6 py-16 text-center text-sm text-stone-400 font-mono">Memuat rincian konfirmasi...</div>}>
        <ConfirmationContent />
      </Suspense>
      <CustomerFooter />
    </div>
  );
}
