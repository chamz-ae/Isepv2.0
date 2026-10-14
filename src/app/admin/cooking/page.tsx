'use client';

import React, { useEffect, useState } from 'react';
import { Scale, Plus, Flame, ArrowRight, TrendingUp } from 'lucide-react';
import { getCookingBatches, processCookingBatch, getInventoryItems } from '@/lib/services/inventoryService';
import { CookingBatch, InventoryItem } from '@/lib/supabase/types';
import { formatGram, formatDateTimeWIB, formatDateWIB, calculateYield } from '@/lib/utils/formatters';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminCookingPage() {
  const [batches, setBatches] = useState<CookingBatch[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Batch Form
  const [rawInvId, setRawInvId] = useState('');
  const [cookedInvId, setCookedInvId] = useState('');
  const [rawGram, setRawGram] = useState(10000); // 10kg
  const [cookedGram, setCookedGram] = useState(6500); // 6.5kg
  const [lossReason, setLossReason] = useState('cooking_shrinkage');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [bList, invList] = await Promise.all([getCookingBatches(), getInventoryItems()]);
    setBatches(bList);
    setInventory(invList);

    const rawMeat = invList.filter((i) => i.category === 'raw_meat');
    const cookedMeat = invList.filter((i) => i.category === 'cooked_meat');
    if (rawMeat.length > 0) setRawInvId(rawMeat[0].id);
    if (cookedMeat.length > 0) setCookedInvId(cookedMeat[0].id);
  }

  const { yieldPercentage, lossWeightGram } = calculateYield(rawGram, cookedGram);

  const handleSubmitBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawInvId || !cookedInvId || rawGram <= 0 || cookedGram <= 0) {
      alert('Isi rincian batch secara lengkap');
      return;
    }
    if (cookedGram > rawGram) {
      alert('Berat matang tidak boleh melebihi berat mentah');
      return;
    }

    setIsSubmitting(true);
    try {
      const batch = await processCookingBatch({
        rawInventoryId: rawInvId,
        cookedInventoryId: cookedInvId,
        rawWeightGram: rawGram,
        cookedWeightGram: cookedGram,
        lossReason,
        operatorName: 'Pitmaster / Chef',
        notes,
      });

      alert(`Batch Pengasapan ${batch.batch_number} berhasil diproses!\nYield Rate: ${batch.yield_percentage}%\nLoss: ${formatGram(batch.loss_weight_gram)}`);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses batch pengasapan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const rawOptions = inventory.filter((i) => i.category === 'raw_meat');
  const cookedOptions = inventory.filter((i) => i.category === 'cooked_meat');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-600" />
            <span>Cooking Batches & Yield Tracking (Raw vs Cooked)</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Konversi bahan mentah ke matang, formula yield percentage, reduksi susut masak (shrinkage), dan pencegahan double deduction.
          </p>
        </div>
        <Button variant="amber" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          <span>Catat Batch Pengasapan Baru</span>
        </Button>
      </div>

      {batches.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="Belum Ada Batch Pengasapan"
          description="Catat proses pengasapan daging mentah untuk memindahkan saldo mentah ke daging matang siap saji."
        />
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => {
            const rawItem = inventory.find((i) => i.id === batch.raw_inventory_id);
            const cookedItem = inventory.find((i) => i.id === batch.cooked_inventory_id);

            return (
              <Card key={batch.id} className="p-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-sm text-stone-900">{batch.batch_number}</span>
                      <Badge variant="stone" size="sm">
                        {formatDateWIB(batch.batch_date)}
                      </Badge>
                      <Badge variant="amber" size="sm">
                        Yield: {batch.yield_percentage}%
                      </Badge>
                    </div>

                    <div className="text-xs text-stone-600 mt-2 flex items-center gap-3">
                      <span className="font-semibold text-stone-800">
                        {rawItem?.item_name || 'Bahan Mentah'}: {formatGram(batch.raw_weight_gram)}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                      <span className="font-bold text-emerald-700">
                        {cookedItem?.item_name || 'Hasil Matang'}: {formatGram(batch.cooked_weight_gram)}
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-500 mt-1">
                      Penyusutan (Loss): <strong>{formatGram(batch.loss_weight_gram)}</strong> • Kategori:{' '}
                      <span className="uppercase font-semibold">{batch.loss_reason.replace(/_/g, ' ')}</span>
                      {batch.notes && ` • Catatan: ${batch.notes}`}
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <div className="text-xs text-stone-400">Pitmaster / Operator:</div>
                    <div className="text-xs font-bold text-stone-800">{batch.operator_name}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Catat Batch */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Proses Batch Pengasapan (Raw → Cooked)"
          subtitle="Sistem akan mengurangi stok mentah dan menambahkan stok matang secara atomik"
          maxWidth="lg"
        >
          <form onSubmit={handleSubmitBatch} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Bahan Baku Mentah (Raw)"
                value={rawInvId}
                onChange={(e) => setRawInvId(e.target.value)}
                required
              >
                {rawOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.item_name} (Stok: {formatGram(r.stock_gram)})
                  </option>
                ))}
              </Select>

              <Select
                label="Hasil Olahan Matang (Cooked)"
                value={cookedInvId}
                onChange={(e) => setCookedInvId(e.target.value)}
                required
              >
                {cookedOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.item_name} (Stok: {formatGram(c.stock_gram)})
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Berat Mentah Sebelum Asap (Gram)"
                type="number"
                step="50"
                min="100"
                value={rawGram}
                onChange={(e) => setRawGram(parseFloat(e.target.value) || 0)}
                required
                helperText={`Setara ${(rawGram / 1000).toFixed(2)} kg`}
              />

              <Input
                label="Berat Matang Setelah Asap (Gram)"
                type="number"
                step="50"
                min="100"
                value={cookedGram}
                onChange={(e) => setCookedGram(parseFloat(e.target.value) || 0)}
                required
                helperText={`Setara ${(cookedGram / 1000).toFixed(2)} kg`}
              />
            </div>

            {/* Calculated Yield & Loss Preview */}
            <div className="p-4 bg-stone-900 text-white rounded-xl grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-bold">Yield Percentage</span>
                <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                  {yieldPercentage}%
                </div>
                <p className="text-[10px] text-stone-400 mt-0.5">Formula: (Cooked / Raw) × 100</p>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-bold">Penyusutan (Loss)</span>
                <div className="text-2xl font-black text-red-400 font-mono mt-0.5">
                  {formatGram(lossWeightGram)}
                </div>
                <p className="text-[10px] text-stone-400 mt-0.5">Formula: Raw − Cooked Weight</p>
              </div>
            </div>

            <Select
              label="Kategori Alasan Penyusutan (Loss Category)"
              value={lossReason}
              onChange={(e) => setLossReason(e.target.value)}
            >
              <option value="cooking_shrinkage">Cooking Shrinkage (Penyusutan Air & Lemak Alami)</option>
              <option value="trimming">Trimming (Pembuangan Lemak Keras & Bark Terbakar)</option>
              <option value="bone">Bone (Pemisahan Tulang)</option>
              <option value="waste">Waste / Sisa Potong</option>
              <option value="spoilage">Spoilage (Kerusakan Kualitas)</option>
              <option value="operational_loss">Operational Loss (Penyusutan Operasional)</option>
              <option value="unknown">Unknown</option>
            </Select>

            <Input
              label="Catatan Tambahan Batch"
              placeholder="Contoh: Suhu pit 110C stabil selama 14 jam kayu rambutan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="amber" size="sm" isLoading={isSubmitting}>
                Konfirmasi & Mutasikan Stok
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
