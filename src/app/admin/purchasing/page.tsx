'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingBag, Plus, Truck, FileText, CheckCircle2, PackageCheck } from 'lucide-react';
import { getPurchases, getSuppliers, createPurchase } from '@/lib/services/purchasingService';
import { getInventoryItems } from '@/lib/services/inventoryService';
import { Purchase, Supplier, InventoryItem, PaymentMethod } from '@/lib/supabase/types';
import { formatRupiah, formatGram, formatDateTimeWIB, formatDateWIB } from '@/lib/utils/formatters';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminPurchasingPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Purchase Form
  const [supplierId, setSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<'restaurant' | 'lodging' | 'operational'>('restaurant');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [isInventoryIntegrated, setIsInventoryIntegrated] = useState(true);

  // Item lines
  const [selectedInvId, setSelectedInvId] = useState('');
  const [itemName, setItemName] = useState('');
  const [invoiceKg, setInvoiceKg] = useState(10);
  const [receivedKg, setReceivedKg] = useState(10);
  const [pricePerKg, setPricePerKg] = useState(180000);
  const [isStockItem, setIsStockItem] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [poList, supList, invList] = await Promise.all([
      getPurchases(),
      getSuppliers(),
      getInventoryItems(),
    ]);
    setPurchases(poList);
    setSuppliers(supList);
    setInventoryItems(invList);
    if (supList.length > 0) setSupplierId(supList[0].id);
    if (invList.length > 0) {
      setSelectedInvId(invList[0].id);
      setItemName(invList[0].item_name);
    }
  }

  const handleInvChange = (invId: string) => {
    setSelectedInvId(invId);
    const found = inventoryItems.find((i) => i.id === invId);
    if (found) {
      setItemName(found.item_name);
      setPricePerKg(found.unit_cost_per_kg || 150000);
    }
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup) {
      alert('Pilih supplier yang valid');
      return;
    }

    const receivedGram = receivedKg * 1000;
    const subtotal = receivedKg * pricePerKg;

    setIsSubmitting(true);
    try {
      await createPurchase({
        supplierId: sup.id,
        supplierName: sup.supplier_name,
        purchaseDate,
        category,
        invoiceNumber,
        paymentMethod,
        operatorName: 'Purchasing Admin',
        notes,
        isInventoryIntegrated,
        items: [
          {
            inventoryId: isStockItem ? selectedInvId : undefined,
            itemName,
            category,
            invoiceWeightKg: invoiceKg,
            receivedWeightKg: receivedKg,
            receivedWeightGram: receivedGram, // Kuantitas fisik aktual masuk ke inventori
            unitPricePerKg: pricePerKg,
            subtotal,
            isStockItem,
            notes,
          },
        ],
      });

      alert('Pembelian & Penerimaan Barang berhasil dicatat ke saldo stok!');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan transaksi pembelian');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Pembelanjaan & Receiving</h1>
          <p className="text-xs text-stone-500 mt-1">
            Alur pengadaan bahan: Supplier → Invoice Weight vs Received Weight → Sinkronisasi Otomatis Stok Daging.
          </p>
        </div>
        <Button variant="amber" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          <span>Catat Belanja Baru</span>
        </Button>
      </div>

      {purchases.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Belum Ada Riwayat Pembelian"
          description="Catat pembelian bahan baku daging atau pasokan operasional dari supplier."
        />
      ) : (
        <div className="space-y-3">
          {purchases.map((po) => (
            <Card key={po.id} className="p-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-stone-900">{po.purchase_number}</span>
                    <Badge variant={po.category === 'restaurant' ? 'amber' : 'info'} size="sm">
                      {po.category.toUpperCase()}
                    </Badge>
                    {po.is_inventory_integrated && (
                      <Badge variant="success" size="sm">
                        <PackageCheck className="w-3 h-3 mr-1" />
                        Stok Bertambah
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-stone-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Supplier: <strong>{po.supplier_name_snapshot}</strong></span>
                    <span>Tanggal: {formatDateWIB(po.purchase_date)}</span>
                    {po.invoice_number && <span>No. Faktur: {po.invoice_number}</span>}
                    <span>Metode: {po.payment_method.toUpperCase()}</span>
                  </div>

                  {po.purchase_items && po.purchase_items.length > 0 && (
                    <div className="mt-2 text-xs text-stone-500 bg-stone-50 p-2 rounded-lg">
                      {po.purchase_items.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            • {it.item_name_snapshot} (Inv: {it.invoice_weight_kg} kg | Fisik Diterima: <strong>{it.received_weight_kg} kg</strong>)
                          </span>
                          <span className="font-bold text-stone-800">{formatRupiah(it.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-left md:text-right">
                  <div className="text-xs text-stone-500">Total Pengeluaran:</div>
                  <div className="text-base font-black text-stone-900">{formatRupiah(po.total_amount)}</div>
                  <div className="text-[11px] text-stone-400 mt-0.5">Operator: {po.operator_name}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Catat Belanja */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Catat Pembelian Bahan & Penerimaan (Receiving)"
          subtitle="Item yang ditandai stok akan otomatis menambah saldo inventori fisik"
          maxWidth="lg"
        >
          <form onSubmit={handleCreatePurchase} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Pilih Supplier"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.supplier_name}
                  </option>
                ))}
              </Select>

              <Input
                label="Tanggal Pembelian"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Select
                label="Kategori Pengeluaran"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
              >
                <option value="restaurant">Restoran</option>
                <option value="lodging">Penginapan</option>
                <option value="operational">Operasional Umum</option>
              </Select>

              <Input
                label="Nomor Faktur / Nota"
                placeholder="INV-998877"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />

              <Select
                label="Metode Bayar"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
              >
                <option value="cash">Cash / Tunai</option>
                <option value="bank_transfer">Transfer Bank</option>
                <option value="qris">QRIS</option>
              </Select>
            </div>

            {/* Receiving Item Section */}
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg space-y-3">
              <span className="font-bold text-stone-800 uppercase tracking-wider text-[10px] block">
                Rincian Barang & Verifikasi Berat Fisik
              </span>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Pilih Item Inventori Daging"
                  value={selectedInvId}
                  onChange={(e) => handleInvChange(e.target.value)}
                >
                  {inventoryItems.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.item_name} (Saldo: {formatGram(inv.stock_gram)})
                    </option>
                  ))}
                </Select>

                <Input
                  label="Nama Barang (Nota)"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Berat Faktur (Kg)"
                  type="number"
                  step="0.01"
                  value={invoiceKg}
                  onChange={(e) => setInvoiceKg(parseFloat(e.target.value) || 0)}
                  required
                />

                <Input
                  label="Berat Aktual Diterima (Kg)"
                  type="number"
                  step="0.01"
                  value={receivedKg}
                  onChange={(e) => setReceivedKg(parseFloat(e.target.value) || 0)}
                  required
                  helperText="Dasar penambahan stok fisik"
                />

                <Input
                  label="Harga per Kg (Rp)"
                  type="number"
                  value={pricePerKg}
                  onChange={(e) => setPricePerKg(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-stone-200">
                <input
                  type="checkbox"
                  id="is_stock_item"
                  checked={isStockItem}
                  onChange={(e) => setIsStockItem(e.target.checked)}
                  className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="is_stock_item" className="font-semibold text-stone-800">
                  Integrasikan ke Stok Fisik ({formatGram(receivedKg * 1000)} akan ditambahkan)
                </label>
              </div>
            </div>

            <div className="p-3 bg-stone-900 text-white rounded-lg flex items-center justify-between">
              <span className="text-xs text-stone-400">Total Tagihan Belanja:</span>
              <span className="text-base font-black text-amber-400">{formatRupiah(receivedKg * pricePerKg)}</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="amber" size="sm" isLoading={isSubmitting}>
                Simpan & Tambah Stok
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
