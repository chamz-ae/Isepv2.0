'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, DollarSign, Search, ShieldCheck } from 'lucide-react';
import { getOrders } from '@/lib/services/orderService';
import { Payment, Order } from '@/lib/supabase/types';
import { formatRupiah, formatDateTimeWIB } from '@/lib/utils/formatters';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminPembayaranPage() {
  const [payments, setPayments] = useState<(Payment & { bookingCode: string; guestName: string })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  useEffect(() => {
    async function load() {
      const orders = await getOrders();
      const allPay: (Payment & { bookingCode: string; guestName: string })[] = [];
      orders.forEach((o) => {
        if (o.payments) {
          o.payments.forEach((p) => {
            allPay.push({
              ...p,
              bookingCode: o.booking_code,
              guestName: o.guest_name,
            });
          });
        }
      });
      // Sort newest first
      setPayments(allPay.sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime()));
    }
    load();
  }, []);

  const filtered = payments.filter((p) => {
    if (methodFilter !== 'all' && p.payment_method !== methodFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        p.payment_number.toLowerCase().includes(q) ||
        p.bookingCode.toLowerCase().includes(q) ||
        p.guestName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalCollected = filtered.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-amber-600" />
            <span>Manajemen Riwayat Pembayaran</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Rekap transaksi masuk: Cash, QRIS, Transfer Bank, dan Tagih Kamar.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Cari no bayar, booking code, tamu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-56"
          />
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg text-stone-900"
          >
            <option value="all">Semua Metode</option>
            <option value="cash">Cash</option>
            <option value="qris">QRIS</option>
            <option value="bank_transfer">Transfer Bank</option>
            <option value="room_charge">Tagih Kamar</option>
          </select>
        </div>
      </div>

      <div className="p-4 bg-stone-900 text-white rounded-xl flex items-center justify-between">
        <div>
          <span className="text-xs text-stone-400">Total Nominal Pembayaran Terfilter:</span>
          <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">{formatRupiah(totalCollected)}</div>
        </div>
        <span className="text-xs text-stone-400">{filtered.length} Bukti Bayar Terkonfirmasi</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Belum Ada Pembayaran"
          description="Pembayaran akan tercatat saat pesanan dibayar tunai, transfer, atau QRIS."
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 text-stone-700 uppercase font-semibold text-[10px] tracking-wider border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3">No. Bayar</th>
                  <th className="px-4 py-3">Waktu Bayar</th>
                  <th className="px-4 py-3">Booking Code</th>
                  <th className="px-4 py-3">Nama Tamu</th>
                  <th className="px-4 py-3">Metode</th>
                  <th className="px-4 py-3">Nominal (Rp)</th>
                  <th className="px-4 py-3">Tipe</th>
                  <th className="px-4 py-3">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-stone-900">{p.payment_number}</td>
                    <td className="px-4 py-3 font-mono text-stone-500">{formatDateTimeWIB(p.paid_at)}</td>
                    <td className="px-4 py-3 font-mono text-stone-800">{p.bookingCode}</td>
                    <td className="px-4 py-3 font-medium text-stone-800">{p.guestName}</td>
                    <td className="px-4 py-3">
                      <Badge variant="stone" size="sm" className="font-bold uppercase text-[10px]">
                        {p.payment_method.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-black text-emerald-700 font-mono">{formatRupiah(p.amount)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.is_down_payment ? 'warning' : 'success'} size="sm">
                        {p.is_down_payment ? 'DP' : 'Pelunasan'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-stone-500">{p.operator_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
