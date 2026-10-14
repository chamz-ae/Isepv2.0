'use client';

import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { ClipboardCheck, Plus, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getStockOpnames, saveStockOpname, getInventoryItems } from '@/lib/services/inventoryService';
import { StockOpname, InventoryItem } from '@/lib/supabase/types';
import { formatGram, formatRupiah, formatDateWIB, formatDateTimeWIB } from '@/lib/utils/formatters';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminStockOpnamePage() {
  const [opnames, setOpnames] = useState<StockOpname[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Opname Form
  const [opnameNotes, setOpnameNotes] = useState('');
  const [counts, setCounts] = useState<{ [id: string]: { actualGram: number; reason: string } }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [opList, invList] = await Promise.all([getStockOpnames(), getInventoryItems()]);
    setOpnames(opList);
    setInventory(invList);

    // Initialize counts map with current system stock
    const initial: { [id: string]: { actualGram: number; reason: string } } = {};
    invList.forEach((inv) => {
      initial[inv.id] = { actualGram: inv.stock_gram, reason: 'Pencocokan fisik reguler' };
    });
    setCounts(initial);
  }

  const handleCountChange = (invId: string, actualGram: number) => {
    setCounts((prev) => ({
      ...prev,
      [invId]: { ...prev[invId], actualGram },
    }));
  };

  const handleReasonChange = (invId: string, reason: string) => {
    setCounts((prev) => ({
      ...prev,
      [invId]: { ...prev[invId], reason },
    }));
  };

  const handleSubmitOpname = async (isConfirmed: boolean) => {
    setIsSubmitting(true);
    try {
      const itemsPayload = inventory.map((inv) => ({
        inventoryId: inv.id,
        itemName: inv.item_name,
        systemGram: inv.stock_gram,
        actualGram: counts[inv.id]?.actualGram ?? inv.stock_gram,
        reason: counts[inv.id]?.reason || 'Pencocokan opname',
        unitCostPerKg: inv.unit_cost_per_kg || 0,
      }));

      await saveStockOpname({
        operatorName: 'Supervisor Opname',
        notes: opnameNotes,
        items: itemsPayload,
        isConfirmed,
      });

      alert(
        isConfirmed
          ? 'Stock Opname berhasil dikonfirmasi dan saldo stok telah disesuaikan!'
          : 'Draft Stock Opname berhasil disimpan.'
      );
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan opname');
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportOpnameExcel = (op: StockOpname) => {
    const wb = XLSX.utils.book_new();
    const data = [
      ['STOCK OPNAME — ASAP ISEP'],
      ['No. Opname:', op.opname_number],
      ['Tanggal:', formatDateWIB(op.opname_date)],
      ['Operator:', op.operator_name],
      ['Status:', op.status.toUpperCase()],
      [],
      ['Nama Barang', 'Stok Sistem (Gram)', 'Fisik Aktual (Gram)', 'Selisih / Variance (Gram)', 'Alasan Justifikasi'],
      ...(op.items?.map((it) => [
        it.item_name_snapshot,
        it.system_gram,
        it.actual_gram,
        it.variance_gram,
        it.reason,
      ]) || []),
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Opname');
    XLSX.writeFile(wb, `${op.opname_number}_Stock_Opname.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-amber-600" />
            <span>Stock Opname & Variance Adjustment</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Audit fisik berkala (Actual vs System Stock), rekonsiliasi selisih dengan justifikasi wajib, dan export Excel.
          </p>
        </div>
        <Button variant="amber" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          <span>Buat Stock Opname Baru</span>
        </Button>
      </div>

      {opnames.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Belum Ada Riwayat Stock Opname"
          description="Lakukan stock opname fisik berkala untuk mencocokkan saldo gram di sistem dengan kondisi nyata di freezer/chiller."
        />
      ) : (
        <div className="space-y-4">
          {opnames.map((op) => (
            <Card key={op.id} className="p-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-3 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-stone-900">{op.opname_number}</span>
                    <Badge variant={op.status === 'confirmed' ? 'success' : 'warning'} size="sm">
                      {op.status === 'confirmed' ? 'Terkonfirmasi & Disesuaikan' : 'Draft'}
                    </Badge>
                  </div>
                  <div className="text-xs text-stone-500 mt-1">
                    Tanggal: {formatDateWIB(op.opname_date)} • Operator: {op.operator_name}
                    {op.notes && ` • Catatan: ${op.notes}`}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-stone-400">Total Selisih Gram:</div>
                    <div
                      className={`text-sm font-bold font-mono ${
                        op.total_variance_gram < 0 ? 'text-red-600' : 'text-emerald-700'
                      }`}
                    >
                      {op.total_variance_gram > 0 ? `+${formatGram(op.total_variance_gram)}` : formatGram(op.total_variance_gram)}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => exportOpnameExcel(op)}>
                    <Download className="w-3.5 h-3.5 mr-1" />
                    <span>Excel</span>
                  </Button>
                </div>
              </div>

              {op.items && op.items.length > 0 && (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs text-stone-600">
                    <thead className="bg-stone-50 text-stone-700 uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="px-3 py-2">Item Barang</th>
                        <th className="px-3 py-2">Sistem</th>
                        <th className="px-3 py-2">Fisik Aktual</th>
                        <th className="px-3 py-2">Variance (Actual − System)</th>
                        <th className="px-3 py-2">Justifikasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {op.items.map((it) => (
                        <tr key={it.id}>
                          <td className="px-3 py-2 font-medium text-stone-800">{it.item_name_snapshot}</td>
                          <td className="px-3 py-2 font-mono text-stone-600">{formatGram(it.system_gram)}</td>
                          <td className="px-3 py-2 font-mono font-bold text-stone-900">{formatGram(it.actual_gram)}</td>
                          <td
                            className={`px-3 py-2 font-mono font-bold ${
                              it.variance_gram < 0 ? 'text-red-600' : it.variance_gram > 0 ? 'text-emerald-700' : 'text-stone-400'
                            }`}
                          >
                            {it.variance_gram > 0 ? `+${formatGram(it.variance_gram)}` : formatGram(it.variance_gram)}
                          </td>
                          <td className="px-3 py-2 text-stone-500 italic max-w-xs truncate">{it.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal Buat Opname Baru */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Stock Opname Fisik Daging & Bahan"
          subtitle="Masukkan berat fisik hasil timbangan aktual di cold storage"
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <Input
              label="Catatan / Referensi Periode Opname"
              placeholder="Contoh: Opname penutupan mingguan tim kitchen..."
              value={opnameNotes}
              onChange={(e) => setOpnameNotes(e.target.value)}
            />

            <div className="border border-stone-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-stone-50 text-stone-700 uppercase font-semibold text-[10px] sticky top-0 border-b border-stone-200">
                  <tr>
                    <th className="px-3 py-2.5">Item Barang</th>
                    <th className="px-3 py-2.5">Saldo Sistem</th>
                    <th className="px-3 py-2.5">Fisik Aktual (Gram)</th>
                    <th className="px-3 py-2.5">Selisih</th>
                    <th className="px-3 py-2.5">Alasan / Justifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {inventory.map((inv) => {
                    const actual = counts[inv.id]?.actualGram ?? inv.stock_gram;
                    const diff = actual - inv.stock_gram;
                    return (
                      <tr key={inv.id} className="hover:bg-stone-50">
                        <td className="px-3 py-2 font-bold text-stone-900">{inv.item_name}</td>
                        <td className="px-3 py-2 font-mono text-stone-500">{formatGram(inv.stock_gram)}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="10"
                            value={actual}
                            onChange={(e) => handleCountChange(inv.id, parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-stone-300 rounded font-mono font-bold text-stone-900 text-xs"
                          />
                        </td>
                        <td className={`px-3 py-2 font-mono font-bold ${diff < 0 ? 'text-red-600' : diff > 0 ? 'text-emerald-700' : 'text-stone-400'}`}>
                          {diff > 0 ? `+${diff}g` : `${diff}g`}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            placeholder="Alasan selisih..."
                            value={counts[inv.id]?.reason || ''}
                            onChange={(e) => handleReasonChange(inv.id, e.target.value)}
                            className="w-full px-2 py-1 border border-stone-300 rounded text-stone-700 text-xs"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => handleSubmitOpname(false)} isLoading={isSubmitting}>
                Simpan sebagai Draft
              </Button>
              <Button type="button" variant="amber" size="sm" onClick={() => handleSubmitOpname(true)} isLoading={isSubmitting}>
                Konfirmasi & Sesuaikan Saldo Stok
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
