'use client';

import React, { useEffect, useState } from 'react';
import { Lock, Calculator, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';
import { getCashierClosings, getClosingStatsForShift, createCashierClosing } from '@/lib/services/closingService';
import { CashierClosing, Payment } from '@/lib/supabase/types';
import { formatRupiah, formatDateTimeWIB, formatDateWIB } from '@/lib/utils/formatters';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminClosingPage() {
  const [closings, setClosings] = useState<CashierClosing[]>([]);
  const [shiftStats, setShiftStats] = useState<{
    cashTotal: number;
    qrisTotal: number;
    transferTotal: number;
    roomChargeTotal: number;
    totalRevenue: number;
    transactionCount: number;
    payments: Payment[];
  }>({
    cashTotal: 0,
    qrisTotal: 0,
    transferTotal: 0,
    roomChargeTotal: 0,
    totalRevenue: 0,
    transactionCount: 0,
    payments: [],
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actualCash, setActualCash] = useState(0);
  const [closingNotes, setClosingNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [cList, stats] = await Promise.all([getCashierClosings(), getClosingStatsForShift()]);
    setClosings(cList);
    setShiftStats(stats);
    setActualCash(stats.cashTotal);
  }

  const cashVariance = actualCash - shiftStats.cashTotal;

  const handlePerformClosing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const closing = await createCashierClosing({
        operatorName: 'Kasir Shift',
        actualCash,
        notes: closingNotes,
      });

      alert(`Closing Kasir ${closing.closing_number} Berhasil Disimpan!\nTotal Omzet: ${formatRupiah(closing.total_revenue)}`);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan closing kasir');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
            <Lock className="w-6 h-6 text-amber-600" />
            <span>Closing Kasir & Rekonsiliasi Shift</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Penutupan shift kasir, penghitungan uang fisik laci vs saldo sistem, dan pencatatan selisih kas.
          </p>
        </div>
        <Button variant="amber" size="sm" onClick={() => setIsModalOpen(true)}>
          <Calculator className="w-4 h-4 mr-1" />
          <span>Tutup Kasir (Closing Shift)</span>
        </Button>
      </div>

      {/* Active Shift Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-stone-900 text-white">
          <span className="text-[10px] uppercase font-bold text-stone-400">Total Omzet Shift Aktif</span>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">{formatRupiah(shiftStats.totalRevenue)}</div>
          <span className="text-[10px] text-stone-400 mt-1 block">{shiftStats.transactionCount} Transaksi Selesai</span>
        </Card>

        <Card>
          <span className="text-[10px] uppercase font-bold text-stone-500">Saldo Cash di Laci (Sistem)</span>
          <div className="text-xl font-bold text-emerald-700 mt-1 font-mono">{formatRupiah(shiftStats.cashTotal)}</div>
          <span className="text-[10px] text-stone-400 mt-1 block">Uang tunai wajib ada di laci</span>
        </Card>

        <Card>
          <span className="text-[10px] uppercase font-bold text-stone-500">Penerimaan QRIS</span>
          <div className="text-xl font-bold text-sky-700 mt-1 font-mono">{formatRupiah(shiftStats.qrisTotal)}</div>
          <span className="text-[10px] text-stone-400 mt-1 block">Tercatat di settlement QRIS</span>
        </Card>

        <Card>
          <span className="text-[10px] uppercase font-bold text-stone-500">Transfer & Tagih Kamar</span>
          <div className="text-xl font-bold text-stone-800 mt-1 font-mono">
            {formatRupiah(shiftStats.transferTotal + shiftStats.roomChargeTotal)}
          </div>
          <span className="text-[10px] text-stone-400 mt-1 block">Rekening bank & tagihan kamar</span>
        </Card>
      </div>

      {/* Closings History */}
      <Card>
        <CardHeader title="Riwayat Closing Kasir Sebelumnya" subtitle="Rekap audit setiap penutupan shift kasir" />
        {closings.length === 0 ? (
          <EmptyState
            icon={Lock}
            title="Belum Ada Riwayat Closing"
            description="Lakukan closing kasir saat pergantian shift atau penutupan toko pada pukul 22.00 WIB."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 text-stone-700 uppercase font-semibold text-[10px] tracking-wider border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3">No. Closing</th>
                  <th className="px-4 py-3">Waktu Tutup</th>
                  <th className="px-4 py-3">Operator</th>
                  <th className="px-4 py-3">Cash Sistem</th>
                  <th className="px-4 py-3">Cash Fisik</th>
                  <th className="px-4 py-3">Selisih Kas</th>
                  <th className="px-4 py-3">Total Omzet</th>
                  <th className="px-4 py-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {closings.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-stone-900">{c.closing_number}</td>
                    <td className="px-4 py-3 font-mono text-stone-500">{formatDateTimeWIB(c.closed_at)}</td>
                    <td className="px-4 py-3 font-medium text-stone-800">{c.operator_name}</td>
                    <td className="px-4 py-3 font-mono">{formatRupiah(c.expected_cash)}</td>
                    <td className="px-4 py-3 font-mono font-bold text-stone-900">{formatRupiah(c.actual_cash)}</td>
                    <td className={`px-4 py-3 font-mono font-bold ${c.cash_variance < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                      {c.cash_variance > 0 ? `+${formatRupiah(c.cash_variance)}` : formatRupiah(c.cash_variance)}
                    </td>
                    <td className="px-4 py-3 font-black text-stone-900">{formatRupiah(c.total_revenue)}</td>
                    <td className="px-4 py-3 text-stone-500 max-w-xs truncate">{c.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Closing Shift */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Rekonsiliasi & Tutup Kasir (Closing Shift)"
          subtitle="Hitung uang tunai fisik di laci kasir dan bandingkan dengan catatan sistem"
          maxWidth="md"
        >
          <form onSubmit={handlePerformClosing} className="space-y-4 text-xs">
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Omzet Cash Sistem:</span>
                <span className="font-bold text-stone-900">{formatRupiah(shiftStats.cashTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Omzet QRIS:</span>
                <span className="font-bold text-stone-900">{formatRupiah(shiftStats.qrisTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Omzet Transfer:</span>
                <span className="font-bold text-stone-900">{formatRupiah(shiftStats.transferTotal)}</span>
              </div>
              <div className="pt-2 border-t border-stone-200 flex justify-between font-bold">
                <span>Total Omzet Shift:</span>
                <span className="text-amber-700">{formatRupiah(shiftStats.totalRevenue)}</span>
              </div>
            </div>

            <Input
              label="Uang Fisik Dihitung di Laci (Rp)"
              type="number"
              value={actualCash}
              onChange={(e) => setActualCash(parseFloat(e.target.value) || 0)}
              required
            />

            <div className={`p-3 rounded-lg border flex items-center justify-between font-bold ${
              cashVariance < 0
                ? 'bg-red-50 border-red-200 text-red-800'
                : cashVariance > 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-stone-50 border-stone-200 text-stone-800'
            }`}>
              <span>Selisih Kas Fisik vs Sistem:</span>
              <span className="text-sm font-mono font-black">
                {cashVariance > 0 ? `+${formatRupiah(cashVariance)}` : formatRupiah(cashVariance)}
              </span>
            </div>

            <Input
              label="Catatan Kasir / Keterangan Selisih"
              placeholder="Contoh: Uang kembalian pecahan 2.000 habis..."
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="amber" size="sm" isLoading={isSubmitting}>
                Konfirmasi Closing Kasir
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
