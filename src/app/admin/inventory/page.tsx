'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Boxes, AlertTriangle, ArrowUpDown, History, Plus, Scale } from 'lucide-react';
import { getInventoryItems, getStockMovements } from '@/lib/services/inventoryService';
import { InventoryItem, StockMovement } from '@/lib/supabase/types';
import { formatRupiah, formatGram, formatDateTimeWIB } from '@/lib/utils/formatters';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [selectedInv, setSelectedInv] = useState<InventoryItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | 'raw_meat' | 'cooked_meat'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [invList, movList] = await Promise.all([getInventoryItems(), getStockMovements()]);
        setItems(invList);
        setMovements(movList);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Inventori Daging & Bahan (Base Unit: Gram)</h1>
          <p className="text-xs text-stone-500 mt-1">
            Pengelolaan stok fisik presisi gram, ambang batas kritis, pemisahan stok Mentah (Raw) dan Matang (Cooked).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-stone-300 rounded-lg p-1 text-xs font-semibold">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterCategory === 'all' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Semua ({items.length})
            </button>
            <button
              onClick={() => setFilterCategory('raw_meat')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterCategory === 'raw_meat' ? 'bg-amber-700 text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Daging Mentah (Raw)
            </button>
            <button
              onClick={() => setFilterCategory('cooked_meat')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterCategory === 'cooked_meat' ? 'bg-emerald-700 text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Daging Matang (Cooked)
            </button>
          </div>
          <Link href="/admin/cooking">
            <Button variant="amber" size="sm">
              <Scale className="w-4 h-4 mr-1" />
              <span>Cooking Batch & Yield</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <Card
            key={item.id}
            onClick={() => setSelectedInv(item)}
            className={`cursor-pointer transition-all hover:border-amber-500 ${
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
                <span className="text-[10px] text-stone-400 uppercase font-semibold">Saldo Sistem</span>
                <div className="font-black text-xl text-stone-900 font-mono tracking-tight">
                  {formatGram(item.stock_gram)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-400 uppercase font-semibold">Batas Minimum</span>
                <div className="text-xs font-semibold text-stone-600 font-mono">
                  {formatGram(item.minimum_stock_gram)}
                </div>
              </div>
            </div>

            <div className="mt-2 text-[11px] text-stone-500 flex justify-between">
              <span>Biaya Pokok (HPP):</span>
              <span className="font-semibold">{formatRupiah(item.unit_cost_per_kg)}/kg</span>
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
          subtitle="Jejak audit permanen setiap penerimaan, pemakaian, pengasapan, atau penyesuaian opname"
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
            description="Mutasi akan tercatat otomatis saat pembelian diterima, daging dimasak, pesanan dibuat, atau opname disesuaikan."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 text-stone-700 uppercase font-semibold text-[10px] tracking-wider border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Tipe Mutasi</th>
                  <th className="px-4 py-3">Perubahan (Gram)</th>
                  <th className="px-4 py-3">Saldo Akhir</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {movements
                  .filter((m) => (selectedInv ? m.inventory_id === selectedInv.id : true))
                  .slice(0, 15)
                  .map((mov) => {
                    const isPositive = mov.gram_change > 0;
                    return (
                      <tr key={mov.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-stone-500">{formatDateTimeWIB(mov.created_at)}</td>
                        <td className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider text-stone-700">
                          {mov.movement_type.replace(/_/g, ' ')}
                        </td>
                        <td className={`px-4 py-3 font-mono font-bold ${isPositive ? 'text-emerald-700' : 'text-red-600'}`}>
                          {isPositive ? `+${formatGram(mov.gram_change)}` : formatGram(mov.gram_change)}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-stone-900">
                          {formatGram(mov.remaining_gram)}
                        </td>
                        <td className="px-4 py-3 text-stone-700 max-w-xs truncate">{mov.notes || '-'}</td>
                        <td className="px-4 py-3 text-stone-500">{mov.operator_name || 'System'}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
