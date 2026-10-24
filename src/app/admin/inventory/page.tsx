'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Boxes,
  AlertTriangle,
  ArrowUpDown,
  History,
  Plus,
  Scale,
  Scissors,
  Calendar,
  User,
  CheckCircle2,
} from 'lucide-react';
import { getInventoryItems, getStockMovements, deductStockManual } from '@/lib/services/inventoryService';
import { InventoryItem, StockMovement } from '@/lib/supabase/types';
import { formatRupiah, formatGram, formatDateTimeWIB } from '@/lib/utils/formatters';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminInventoryPage() {
  const { profile, role } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [selectedInv, setSelectedInv] = useState<InventoryItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | 'raw_meat' | 'cooked_meat'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Manual Deduction Modal State
  const [isDeductModalOpen, setIsDeductModalOpen] = useState(false);
  const [deductItemId, setDeductItemId] = useState('');
  const [deductUnit, setDeductUnit] = useState<'kg' | 'gram'>('kg');
  const [deductAmountKg, setDeductAmountKg] = useState<number>(2.5);
  const [deductAmountGram, setDeductAmountGram] = useState<number>(2500);
  const [eventReason, setEventReason] = useState('Acara Gathering Komunitas BBQ');
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [operatorName, setOperatorName] = useState('');
  const [eventNotes, setEventNotes] = useState('');
  const [isSubmittingDeduct, setIsSubmittingDeduct] = useState(false);

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('asap_inventory_updated', handleUpdate);
    return () => window.removeEventListener('asap_inventory_updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (profile?.full_name) {
      setOperatorName(profile.full_name);
    } else if (role) {
      setOperatorName(`Chef / Staf ${role.toUpperCase()}`);
    } else {
      setOperatorName('Petugas Dapur');
    }
  }, [profile, role]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [invList, movList] = await Promise.all([getInventoryItems(), getStockMovements()]);
      setItems(invList);
      setMovements(movList);
      if (invList.length > 0 && !deductItemId) {
        setDeductItemId(invList[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenDeductModal = (targetItem?: InventoryItem) => {
    if (targetItem) {
      setDeductItemId(targetItem.id);
    } else if (items.length > 0 && !deductItemId) {
      setDeductItemId(items[0].id);
    }
    setDeductUnit('kg');
    setDeductAmountKg(2.5);
    setDeductAmountGram(2500);
    setEventReason('Acara Gathering Komunitas BBQ');
    setEventNotes('');
    setIsDeductModalOpen(true);
  };

  const handleKgChange = (val: number) => {
    setDeductAmountKg(val);
    setDeductAmountGram(Math.round(val * 1000));
  };

  const handleGramChange = (val: number) => {
    setDeductAmountGram(val);
    setDeductAmountKg(Math.round((val / 1000) * 100) / 100);
  };

  const handleConfirmDeduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveGram = deductUnit === 'kg' ? Math.round(deductAmountKg * 1000) : deductAmountGram;

    if (!deductItemId) {
      alert('Pilih item daging yang ingin dikurangi.');
      return;
    }
    if (effectiveGram <= 0) {
      alert('Jumlah pengurangan harus lebih dari 0.');
      return;
    }
    if (!eventReason.trim()) {
      alert('Tulis alasan / nama acara.');
      return;
    }

    const selectedItemObj = items.find((i) => i.id === deductItemId);
    if (!selectedItemObj) return;

    if (selectedItemObj.stock_gram < effectiveGram) {
      alert(
        `Stok ${selectedItemObj.item_name} tidak mencukupi!\nSaldo tersedia: ${formatGram(selectedItemObj.stock_gram)} (${(selectedItemObj.stock_gram / 1000).toFixed(2)} kg)\nJumlah diminta: ${formatGram(effectiveGram)} (${(effectiveGram / 1000).toFixed(2)} kg)`
      );
      return;
    }

    if (
      !confirm(
        `Konfirmasi Pemotongan Stok:\n\nItem: ${selectedItemObj.item_name}\nJumlah Potong: ${formatGram(effectiveGram)} (${(effectiveGram / 1000).toFixed(2)} kg)\nKeperluan: ${eventReason}\n\nLanjutkan pemotongan stok?`
      )
    ) {
      return;
    }

    setIsSubmittingDeduct(true);
    try {
      const result = await deductStockManual({
        inventoryId: deductItemId,
        gramDeduction: effectiveGram,
        reason: eventReason.trim(),
        operatorName: operatorName.trim() || 'Petugas Dapur',
        date: eventDate,
        notes: eventNotes.trim() || undefined,
      });

      alert(
        `✅ Stok ${result.item.item_name} berhasil dipotong sebesar ${formatGram(effectiveGram)}!\nSisa saldo baru: ${formatGram(result.newStockGram)}`
      );
      setIsDeductModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal memotong stok.');
    } finally {
      setIsSubmittingDeduct(false);
    }
  };

  const filteredItems = items.filter((i) => {
    if (filterCategory === 'all') return true;
    return i.category === filterCategory;
  });

  const getStatusBadge = (item: InventoryItem) => {
    if (item.stock_gram === 0) return <Badge variant="danger" size="sm">Stok Kosong</Badge>;
    if (item.stock_gram <= item.minimum_stock_gram) return <Badge variant="danger" size="sm">Kritis</Badge>;
    if (item.stock_gram <= item.minimum_stock_gram * 1.5) return <Badge variant="warning" size="sm">Menipis</Badge>;
    return <Badge variant="success" size="sm">Normal</Badge>;
  };

  const targetDeductItem = items.find((i) => i.id === deductItemId);
  const effectiveGram = deductUnit === 'kg' ? Math.round(deductAmountKg * 1000) : deductAmountGram;
  const remainingCalculated = targetDeductItem ? targetDeductItem.stock_gram - effectiveGram : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Inventori Daging & Bahan (Live Saldo)
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Stok fisik live tersinkronisasi otomatis dari pembelanjaan, pemesanan kasir, pengasapan smoker, dan pemotongan manual saat ada acara/event.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="amber"
            size="sm"
            onClick={() => handleOpenDeductModal()}
            className="shadow-xs font-semibold"
          >
            <Scissors className="w-4 h-4 mr-1.5" />
            <span>Potong Stok Manual (Acara/Event)</span>
          </Button>

          <Link href="/admin/cooking">
            <Button variant="outline" size="sm">
              <Scale className="w-4 h-4 mr-1.5" />
              <span>Cooking Batch & Yield</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 bg-white border border-stone-300 rounded-lg p-1 text-xs font-semibold w-fit">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            filterCategory === 'all' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Semua Item ({items.length})
        </button>
        <button
          onClick={() => setFilterCategory('raw_meat')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            filterCategory === 'raw_meat' ? 'bg-amber-700 text-white' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          🥩 Daging Mentah (Raw)
        </button>
        <button
          onClick={() => setFilterCategory('cooked_meat')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            filterCategory === 'cooked_meat' ? 'bg-emerald-700 text-white' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          🔥 Daging Matang (Cooked)
        </button>
      </div>

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <Card
            key={item.id}
            onClick={() => setSelectedInv(item)}
            className={`cursor-pointer transition-all hover:border-amber-500 p-4 ${
              selectedInv?.id === item.id ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  {item.category === 'raw_meat' ? '🥩 Raw Material' : '🔥 Cooked Ready'}
                </span>
                <h3 className="font-bold text-stone-900 text-sm mt-0.5">{item.item_name}</h3>
              </div>
              {getStatusBadge(item)}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-end justify-between">
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-semibold">Saldo Sistem Live</span>
                <div className="font-black text-xl text-stone-900 font-mono tracking-tight">
                  {formatGram(item.stock_gram)}
                </div>
                <span className="text-[10px] text-stone-500 font-mono">
                  ({(item.stock_gram / 1000).toFixed(2)} Kg)
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-400 uppercase font-semibold">Batas Minimum</span>
                <div className="text-xs font-semibold text-stone-600 font-mono">
                  {formatGram(item.minimum_stock_gram)}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-stone-500 text-[11px]">HPP: {formatRupiah(item.unit_cost_per_kg)}/kg</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDeductModal(item);
                }}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200 transition-colors flex items-center gap-1"
                title="Potong stok item ini untuk acara/event"
              >
                <Scissors className="w-3 h-3" />
                <span>Potong Event</span>
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Stock Movements Ledger (Buku Besar Mutasi) */}
      <Card>
        <CardHeader
          title={
            selectedInv
              ? `Riwayat Mutasi Stok: ${selectedInv.item_name}`
              : 'Buku Besar Seluruh Mutasi Stok (Stock Movement Ledger)'
          }
          subtitle="Jejak audit permanen setiap penerimaan belanja, pengurangan order kasir, pemotongan manual acara, dan opname"
          action={
            selectedInv && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedInv(null)}>
                Tampilkan Semua Item
              </Button>
            )
          }
        />

        {movements.length === 0 ? (
          <EmptyState
            icon={ArrowUpDown}
            title="Belum Ada Riwayat Mutasi"
            description="Mutasi akan tercatat otomatis saat pembelian diterima, pesanan kasir diproses, atau stok dipotong manual untuk acara."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 text-stone-700 uppercase font-semibold text-[10px] tracking-wider border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Tipe Mutasi</th>
                  <th className="px-4 py-3">Perubahan (Gram / Kg)</th>
                  <th className="px-4 py-3">Saldo Akhir</th>
                  <th className="px-4 py-3">Keterangan / Acara</th>
                  <th className="px-4 py-3">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {movements
                  .filter((m) => (selectedInv ? m.inventory_id === selectedInv.id : true))
                  .slice(0, 20)
                  .map((mov) => {
                    const isPositive = mov.gram_change > 0;
                    return (
                      <tr key={mov.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-stone-500">{formatDateTimeWIB(mov.created_at)}</td>
                        <td className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider text-stone-700">
                          {mov.movement_type === 'operational_loss'
                            ? 'POTONG MANUAL (EVENT)'
                            : mov.movement_type.replace(/_/g, ' ')}
                        </td>
                        <td className={`px-4 py-3 font-mono font-bold ${isPositive ? 'text-emerald-700' : 'text-red-600'}`}>
                          {isPositive ? `+${formatGram(mov.gram_change)}` : formatGram(mov.gram_change)}
                          <span className="text-[10px] ml-1 font-normal text-stone-400">
                            ({(Math.abs(mov.gram_change) / 1000).toFixed(2)} kg)
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-stone-900">
                          {formatGram(mov.remaining_gram)}
                        </td>
                        <td className="px-4 py-3 text-stone-700 max-w-sm truncate">{mov.notes || '-'}</td>
                        <td className="px-4 py-3 text-stone-500 font-medium">{mov.operator_name || 'System'}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ======================================================== */}
      {/* MODAL: POTONG / KURANGI STOK MANUAL (ACARA / EVENT)     */}
      {/* ======================================================== */}
      {isDeductModalOpen && (
        <Modal
          isOpen={isDeductModalOpen}
          onClose={() => setIsDeductModalOpen(false)}
          title="Potong Stok Daging Manual (Acara / Event)"
          subtitle="Gunakan form ini untuk mengurangi stok fisik daging saat ada event khusus, gathering, katering, atau pemakaian non-kasir."
          maxWidth="md"
        >
          <form onSubmit={handleConfirmDeduct} className="space-y-4 text-xs">
            {/* 1. Pilih Item Daging */}
            <Select
              label="Pilih Item Daging yang Dipotong"
              value={deductItemId}
              onChange={(e) => setDeductItemId(e.target.value)}
              required
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.item_name} (Saldo: {formatGram(i.stock_gram)} / {(i.stock_gram / 1000).toFixed(2)} kg)
                </option>
              ))}
            </Select>

            {/* Saldo Warning & Status Bar */}
            {targetDeductItem && (
              <div className="p-3 bg-stone-100 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="text-stone-500 text-[11px] block">Saldo Stok Saat Ini:</span>
                  <span className="font-mono font-bold text-stone-900 text-sm">
                    {formatGram(targetDeductItem.stock_gram)} ({(targetDeductItem.stock_gram / 1000).toFixed(2)} Kg)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-stone-500 text-[11px] block">Sisa Saldo Setelah Dipotong:</span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      remainingCalculated < 0 ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    {remainingCalculated < 0 ? 'TIDAK CUKUP' : `${formatGram(remainingCalculated)} (${(remainingCalculated / 1000).toFixed(2)} Kg)`}
                  </span>
                </div>
              </div>
            )}

            {/* 2. Jumlah Potongan: Kg vs Gram Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-stone-800 text-xs">
                  Jumlah Stok yang Dipotong <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1 text-[11px] bg-stone-100 p-0.5 rounded-md">
                  <button
                    type="button"
                    onClick={() => setDeductUnit('kg')}
                    className={`px-2 py-0.5 rounded font-bold transition-colors ${
                      deductUnit === 'kg' ? 'bg-amber-600 text-white' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Satuan Kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeductUnit('gram')}
                    className={`px-2 py-0.5 rounded font-bold transition-colors ${
                      deductUnit === 'gram' ? 'bg-amber-600 text-white' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Satuan Gram
                  </button>
                </div>
              </div>

              {deductUnit === 'kg' ? (
                <div className="space-y-1">
                  <Input
                    type="number"
                    step="0.05"
                    min="0.05"
                    value={deductAmountKg}
                    onChange={(e) => handleKgChange(parseFloat(e.target.value) || 0)}
                    required
                    helperText={`Setara dengan ${(deductAmountKg * 1000).toLocaleString('id-ID')} Gram stok fisik`}
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <Input
                    type="number"
                    step="50"
                    min="10"
                    value={deductAmountGram}
                    onChange={(e) => handleGramChange(parseFloat(e.target.value) || 0)}
                    required
                    helperText={`Setara dengan ${(deductAmountGram / 1000).toFixed(2)} Kg`}
                  />
                </div>
              )}
            </div>

            {/* 3. Acara / Event / Alasan */}
            <Input
              label="Nama Acara / Event / Keperluan Pemotongan"
              placeholder="Contoh: Gathering Komunitas BBQ, Katering Private Villa, Uji Coba Resep..."
              value={eventReason}
              onChange={(e) => setEventReason(e.target.value)}
              required
            />

            {/* 4. Tanggal & Petugas */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Tanggal Acara"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />

              <Input
                label="Petugas Pemotong (Chef / Staf)"
                placeholder="Nama staf pemotong"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                required
              />
            </div>

            {/* 5. Catatan Tambahan */}
            <Input
              label="Catatan Tambahan (Opsional)"
              placeholder="Misal: Daging dipotong ukuran porsi 200g untuk 25 peserta gathering..."
              value={eventNotes}
              onChange={(e) => setEventNotes(e.target.value)}
            />

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDeductModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="amber"
                size="sm"
                isLoading={isSubmittingDeduct}
                disabled={remainingCalculated < 0}
                className="font-semibold"
              >
                Konfirmasi Potong Stok
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
