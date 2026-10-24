'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Truck,
  FileText,
  CheckCircle2,
  PackageCheck,
  Trash2,
  Search,
  Calendar,
  User,
  Scale,
  Receipt,
  Eye,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import {
  getPurchases,
  getSuppliers,
  createPurchase,
  deletePurchase,
  INITIAL_SUPPLIERS,
} from '@/lib/services/purchasingService';
import { getInventoryItems } from '@/lib/services/inventoryService';
import { Purchase, Supplier, InventoryItem, PaymentMethod } from '@/lib/supabase/types';
import { formatRupiah, formatGram, formatDateWIB } from '@/lib/utils/formatters';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminPurchasingPage() {
  const { profile, role } = useAuth();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'restaurant' | 'lodging' | 'operational'>('all');
  const [unitFilter, setUnitFilter] = useState<'all' | 'daging' | 'ekor' | 'pcs' | 'pax'>('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDetailPo, setSelectedDetailPo] = useState<Purchase | null>(null);

  // Form: Catat Belanja Baru
  const [itemName, setItemName] = useState('USDA Prime Brisket');
  const [unitType, setUnitType] = useState<'daging' | 'ekor' | 'pcs' | 'pax'>('daging');
  const [weightKg, setWeightKg] = useState<number>(10); // Jika Daging
  const [quantity, setQuantity] = useState<number>(10); // Jika Ekor / Pcs / Pax
  const [unitPrice, setUnitPrice] = useState<number>(180000);
  const [totalPrice, setTotalPrice] = useState<number>(1800000);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [operatorName, setOperatorName] = useState(''); // Siapa yang membeli
  const [supplierId, setSupplierId] = useState('s001');
  const [customSupplier, setCustomSupplier] = useState('');
  const [isCustomSupplier, setIsCustomSupplier] = useState(false);
  const [category, setCategory] = useState<'restaurant' | 'lodging' | 'operational'>('restaurant');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [isInventoryIntegrated, setIsInventoryIntegrated] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Pre-fill operatorName with logged in profile name or role
  useEffect(() => {
    if (profile?.full_name) {
      setOperatorName(profile.full_name);
    } else if (role) {
      setOperatorName(`Staff ${role.toUpperCase()}`);
    } else {
      setOperatorName('Petugas Purchasing');
    }
  }, [profile, role]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [poList, supList, invList] = await Promise.all([
        getPurchases(),
        getSuppliers(),
        getInventoryItems(),
      ]);
      setPurchases(poList);
      setSuppliers(supList.length > 0 ? supList : INITIAL_SUPPLIERS);
      setInventoryItems(invList);

      if (supList.length > 0 && !supplierId) {
        setSupplierId(supList[0].id);
      }
      if (invList.length > 0 && !selectedInventoryId) {
        setSelectedInventoryId(invList[0].id);
      }
    } catch (err) {
      console.error('Failed to load purchasing data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Auto calculate total when unit price or quantity/weight changes
  const handleWeightOrQtyChange = (val: number, isWeight: boolean) => {
    if (isWeight) {
      setWeightKg(val);
      if (unitPrice > 0) {
        setTotalPrice(Math.round(val * unitPrice));
      }
    } else {
      setQuantity(val);
      if (unitPrice > 0) {
        setTotalPrice(Math.round(val * unitPrice));
      }
    }
  };

  const handleUnitPriceChange = (price: number) => {
    setUnitPrice(price);
    const count = unitType === 'daging' ? weightKg : quantity;
    if (count > 0) {
      setTotalPrice(Math.round(count * price));
    }
  };

  const handleTotalPriceManualChange = (total: number) => {
    setTotalPrice(total);
    const count = unitType === 'daging' ? weightKg : quantity;
    if (count > 0) {
      setUnitPrice(Math.round(total / count));
    }
  };

  const handleUnitTypeSelect = (type: 'daging' | 'ekor' | 'pcs' | 'pax') => {
    setUnitType(type);
    if (type === 'daging') {
      setIsInventoryIntegrated(true);
      // If itemName looks like non-meat, reset to default brisket
      if (!itemName || itemName.toLowerCase().includes('kayu') || itemName.toLowerCase().includes('pax')) {
        setItemName('USDA Prime Brisket');
        setUnitPrice(180000);
        setTotalPrice(Math.round(weightKg * 180000));
      }
    } else if (type === 'ekor') {
      setItemName('Ayam Kampung Segar');
      setQuantity(10);
      setUnitPrice(45000);
      setTotalPrice(450000);
      setIsInventoryIntegrated(true);
    } else if (type === 'pcs') {
      setItemName('Kayu Rambutan SmokeWood');
      setQuantity(10);
      setUnitPrice(50000);
      setTotalPrice(500000);
      setIsInventoryIntegrated(false);
    } else {
      setItemName('Bahan Rempah & Bumbu');
      setQuantity(5);
      setUnitPrice(75000);
      setTotalPrice(375000);
      setIsInventoryIntegrated(false);
    }
  };

  const handleQuickItemPick = (name: string, defaultUnit: 'daging' | 'ekor' | 'pcs' | 'pax', price: number, invId?: string) => {
    setItemName(name);
    setUnitType(defaultUnit);
    setUnitPrice(price);
    if (invId) setSelectedInventoryId(invId);

    if (defaultUnit === 'daging') {
      setWeightKg(10);
      setTotalPrice(Math.round(10 * price));
      setIsInventoryIntegrated(true);
    } else {
      setQuantity(10);
      setTotalPrice(Math.round(10 * price));
      setIsInventoryIntegrated(defaultUnit === 'ekor');
    }
  };

  // Submit Handler
  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemName.trim()) {
      alert('Nama barang wajib diisi!');
      return;
    }

    if (!operatorName.trim()) {
      alert('Nama pembeli/petugas wajib diisi!');
      return;
    }

    let finalSupplierName = 'Pemasok Umum';
    let finalSupplierId: string | undefined = undefined;

    if (isCustomSupplier) {
      if (!customSupplier.trim()) {
        alert('Tulis nama pemasok/tempat beli manual');
        return;
      }
      finalSupplierName = customSupplier.trim();
    } else {
      const foundSup = suppliers.find((s) => s.id === supplierId);
      if (foundSup) {
        finalSupplierName = foundSup.supplier_name;
        finalSupplierId = foundSup.id;
      }
    }

    const isMeat = unitType === 'daging';
    const effectiveQty = isMeat ? weightKg : quantity;

    if (effectiveQty <= 0) {
      alert(isMeat ? 'Berat daging (Kg) harus lebih dari 0!' : 'Jumlah kuantitas harus lebih dari 0!');
      return;
    }

    if (totalPrice <= 0) {
      alert('Total harga belanja harus lebih dari Rp 0!');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createPurchase({
        supplierId: finalSupplierId,
        supplierName: finalSupplierName,
        purchaseDate,
        category,
        invoiceNumber: invoiceNumber.trim() || undefined,
        paymentMethod,
        operatorName: operatorName.trim(),
        notes: notes.trim() || undefined,
        isInventoryIntegrated: isMeat ? true : isInventoryIntegrated,
        itemName: itemName.trim(),
        unitType,
        weightKg: isMeat ? weightKg : 0,
        quantity: effectiveQty,
        unitPrice,
        totalPrice,
        inventoryId: isMeat ? selectedInventoryId : undefined,
      });

      alert(`✅ Pembelian "${created.purchase_number}" berhasil disimpan ke riwayat belanja!`);
      setIsCreateModalOpen(false);
      // Reset form
      setInvoiceNumber('');
      setNotes('');
      // Reload list immediately
      await loadData();
    } catch (err: any) {
      console.error('Error creating purchase:', err);
      alert(err.message || 'Gagal menyimpan transaksi pembelian');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Purchase Handler
  const handleDeletePurchase = async (poId: string, poNum: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus riwayat pembelian ${poNum}?`)) {
      return;
    }

    try {
      await deletePurchase(poId);
      setPurchases((prev) => prev.filter((p) => p.id !== poId && p.purchase_number !== poNum));
      alert(`Riwayat pembelian ${poNum} berhasil dihapus.`);
      if (selectedDetailPo?.id === poId) setSelectedDetailPo(null);
    } catch (err) {
      alert('Gagal menghapus riwayat pembelian.');
    }
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const totalExpenditure = purchases.reduce((acc, p) => acc + (p.total_amount || 0), 0);
    const totalTransactions = purchases.length;

    let totalMeatKg = 0;
    purchases.forEach((p) => {
      p.purchase_items?.forEach((it) => {
        if (it.unit_type === 'daging' || (it.received_weight_kg && it.received_weight_kg > 0)) {
          totalMeatKg += it.received_weight_kg || (it.received_weight_gram ? it.received_weight_gram / 1000 : 0);
        }
      });
    });

    return {
      totalExpenditure,
      totalTransactions,
      totalMeatKg: Math.round(totalMeatKg * 10) / 10,
      activeSuppliersCount: suppliers.length,
    };
  }, [purchases, suppliers]);

  // Filtered purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((po) => {
      // Category filter
      if (categoryFilter !== 'all' && po.category !== categoryFilter) {
        return false;
      }

      // Unit filter
      if (unitFilter !== 'all') {
        const hasUnit = po.purchase_items?.some((it) => {
          if (unitFilter === 'daging') {
            return it.unit_type === 'daging' || (it.received_weight_kg && it.received_weight_kg > 0);
          }
          return it.unit_type === unitFilter;
        });
        if (!hasUnit) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const poNumMatch = po.purchase_number?.toLowerCase().includes(q);
        const supplierMatch = po.supplier_name_snapshot?.toLowerCase().includes(q);
        const operatorMatch = po.operator_name?.toLowerCase().includes(q);
        const invoiceMatch = po.invoice_number?.toLowerCase().includes(q);
        const itemMatch = po.purchase_items?.some((it) =>
          it.item_name_snapshot?.toLowerCase().includes(q)
        );

        return poNumMatch || supplierMatch || operatorMatch || invoiceMatch || itemMatch;
      }

      return true;
    });
  }, [purchases, categoryFilter, unitFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Belanja & Pembelian (Purchasing)
            </h1>
            <Badge variant="amber" size="sm">
              Live Ledger
            </Badge>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            Pencatatan riwayat pengadaan bahan baku daging (Kg), unggas (Ekor), perlengkapan (Pcs/Pax), dan integrasi otomatis ke inventori fisik ASAP ISEP.
          </p>
        </div>

        <Button
          variant="amber"
          size="md"
          onClick={() => {
            setIsCreateModalOpen(true);
          }}
          className="shadow-sm font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Catat Belanja Baru</span>
        </Button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-white border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Total Pengeluaran</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-stone-900">
            {formatRupiah(metrics.totalExpenditure)}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">Dari seluruh riwayat belanja</span>
        </Card>

        <Card className="p-4 bg-white border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Transaksi Pembelian</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-stone-900">
            {metrics.totalTransactions} Transaksi
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">Tersimpan dalam database & lokal</span>
        </Card>

        <Card className="p-4 bg-white border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Total Pasokan Daging</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-stone-900">
            {metrics.totalMeatKg} <span className="text-sm font-normal text-stone-500">Kg</span>
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">Daging segar masuk ke smoker/resto</span>
        </Card>

        <Card className="p-4 bg-white border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Pemasok Terdaftar</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-stone-900">
            {metrics.activeSuppliersCount} Mitra
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">Daging, kayu, unggas & sayur</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3 sm:p-4 bg-white border border-stone-200">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Cari nama barang, no. PO, nama pembeli, supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50/50"
            />
          </div>

          {/* Unit Type filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
            <span className="text-stone-400 text-[11px] font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Satuan:
            </span>
            <button
              onClick={() => setUnitFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                unitFilter === 'all'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setUnitFilter('daging')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                unitFilter === 'daging'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              🥩 Daging (Kg)
            </button>
            <button
              onClick={() => setUnitFilter('ekor')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                unitFilter === 'ekor'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              🍗 Ekor
            </button>
            <button
              onClick={() => setUnitFilter('pcs')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                unitFilter === 'pcs'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              📦 Pcs
            </button>
            <button
              onClick={() => setUnitFilter('pax')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                unitFilter === 'pax'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              🍽️ Pax
            </button>
          </div>
        </div>
      </Card>

      {/* Purchases History Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
            <span>Riwayat Transaksi Belanja</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-semibold">
              {filteredPurchases.length} data
            </span>
          </h2>
          <span className="text-[11px] text-stone-400">
            Tersimpan otomatis di sistem
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-stone-400">
            Memuat riwayat pembelanjaan...
          </div>
        ) : filteredPurchases.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title={searchQuery ? 'Tidak Ada Hasil Belanja yang Cocok' : 'Belum Ada Riwayat Pembelian'}
            description={
              searchQuery
                ? 'Coba ganti kata kunci pencarian atau reset filter satuan di atas.'
                : 'Klik tombol "Catat Belanja Baru" untuk memasukkan transaksi pengadaan bahan daging, ekor, pcs, atau pax.'
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredPurchases.map((po) => {
              const primaryItem = po.purchase_items?.[0];
              const isMeatItem =
                primaryItem?.unit_type === 'daging' ||
                (primaryItem?.received_weight_kg && primaryItem.received_weight_kg > 0);

              return (
                <Card
                  key={po.id}
                  className="p-4 hover:border-amber-300 transition-all shadow-xs border border-stone-200 bg-white"
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    {/* Left: PO & Item Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-stone-100 text-stone-800 px-2 py-0.5 rounded">
                          {po.purchase_number}
                        </span>

                        <Badge
                          variant={
                            po.category === 'restaurant'
                              ? 'amber'
                              : po.category === 'lodging'
                              ? 'info'
                              : 'stone'
                          }
                          size="sm"
                        >
                          {po.category === 'restaurant'
                            ? 'Restoran'
                            : po.category === 'lodging'
                            ? 'Penginapan'
                            : 'Operasional'}
                        </Badge>

                        {/* Unit Type Badge */}
                        {primaryItem?.unit_type === 'daging' || isMeatItem ? (
                          <span className="inline-flex items-center text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            🥩 Daging: {primaryItem?.received_weight_kg || primaryItem?.invoice_weight_kg || 0} Kg
                          </span>
                        ) : primaryItem?.unit_type === 'ekor' ? (
                          <span className="inline-flex items-center text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            🍗 {primaryItem?.quantity || 1} Ekor
                          </span>
                        ) : primaryItem?.unit_type === 'pax' ? (
                          <span className="inline-flex items-center text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            🍽️ {primaryItem?.quantity || 1} Pax
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            📦 {primaryItem?.quantity || 1} Pcs
                          </span>
                        )}

                        {po.is_inventory_integrated && (
                          <Badge variant="success" size="sm">
                            <PackageCheck className="w-3 h-3 mr-1" />
                            Stok Fisik Bertambah
                          </Badge>
                        )}
                      </div>

                      {/* Item Title */}
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-stone-900 text-sm">
                          {primaryItem?.item_name_snapshot || 'Bahan Belanja'}
                        </h3>
                        {po.purchase_items && po.purchase_items.length > 1 && (
                          <span className="text-[10px] text-stone-400">
                            +{po.purchase_items.length - 1} item lainnya
                          </span>
                        )}
                      </div>

                      {/* Metadata: Purchaser, Date, Supplier */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 pt-0.5">
                        <span className="flex items-center gap-1 text-stone-700 font-medium">
                          <User className="w-3.5 h-3.5 text-stone-400" />
                          <span>Dibeli oleh:</span>
                          <span className="text-amber-800 font-semibold">
                            {po.operator_name || 'Petugas'}
                          </span>
                        </span>

                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>{formatDateWIB(po.purchase_date)}</span>
                        </span>

                        <span className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-stone-400" />
                          <span>Supplier: <strong>{po.supplier_name_snapshot}</strong></span>
                        </span>

                        {po.invoice_number && (
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <FileText className="w-3.5 h-3.5 text-stone-400" />
                            <span>Nota: {po.invoice_number}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Price & Action Buttons */}
                    <div className="flex items-center justify-between lg:justify-end gap-4 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100">
                      <div className="text-left lg:text-right">
                        <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">
                          Total Harga
                        </span>
                        <div className="text-base font-black text-stone-900">
                          {formatRupiah(po.total_amount)}
                        </div>
                        <span className="text-[10px] text-stone-500 font-medium">
                          Metode: {po.payment_method.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDetailPo(po)}
                          className="h-8 px-2.5 text-xs text-stone-600 hover:text-stone-900"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Detail
                        </Button>

                        <button
                          onClick={() => handleDeletePurchase(po.id, po.purchase_number)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg border border-stone-200 text-stone-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                          title="Hapus riwayat belanja"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: CATAT BELANJA BARU                                */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Catat Belanja Baru"
          subtitle="Input pengadaan bahan baku, pilih satuan daging/ekor/pcs/pax, dan catat nama pembeli."
          maxWidth="lg"
        >
          <form onSubmit={handleCreatePurchase} className="space-y-4 text-xs">
            {/* 1. NAMA BARANG */}
            <div className="space-y-1.5">
              <label className="font-semibold text-stone-800 block text-xs">
                Nama Barang / Bahan <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Contoh: USDA Prime Brisket, Ayam Kampung, Kayu Rambutan..."
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />

              {/* Quick suggestions chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-stone-400 mr-1">Rekomendasi Cepat:</span>
                <button
                  type="button"
                  onClick={() => handleQuickItemPick('USDA Prime Brisket (Raw)', 'daging', 180000, 'inv_raw_01')}
                  className="px-2 py-0.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-medium border border-rose-200 transition-colors"
                >
                  🥩 Brisket Sapi
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickItemPick('Ayam Karkas Segar', 'ekor', 45000, 'inv_raw_02')}
                  className="px-2 py-0.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-medium border border-amber-200 transition-colors"
                >
                  🍗 Ayam Segar
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickItemPick('Daging Domba Segar', 'daging', 140000, 'inv_raw_03')}
                  className="px-2 py-0.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-medium border border-rose-200 transition-colors"
                >
                  🥩 Daging Domba
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickItemPick('Kayu Rambutan SmokeWood', 'pcs', 50000)}
                  className="px-2 py-0.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-medium border border-stone-300 transition-colors"
                >
                  📦 Kayu Asap
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickItemPick('Bumbu & Rempah Ungkep', 'pax', 75000)}
                  className="px-2 py-0.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-medium border border-purple-200 transition-colors"
                >
                  🍽️ Rempah Dapur
                </button>
              </div>
            </div>

            {/* 2. PILIHAN SATUAN: DAGING / EKOR / PCS / PAX */}
            <div className="space-y-1.5">
              <label className="font-semibold text-stone-800 block text-xs">
                Pilihan Satuan / Tipe Barang <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleUnitTypeSelect('daging')}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    unitType === 'daging'
                      ? 'border-rose-500 bg-rose-50/70 text-rose-800 font-bold shadow-xs'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-600 font-medium'
                  }`}
                >
                  <div className="text-base mb-0.5">🥩</div>
                  <div className="text-xs">Daging</div>
                  <div className="text-[10px] text-stone-400 font-normal">Satuan (Kg)</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleUnitTypeSelect('ekor')}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    unitType === 'ekor'
                      ? 'border-amber-500 bg-amber-50/70 text-amber-800 font-bold shadow-xs'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-600 font-medium'
                  }`}
                >
                  <div className="text-base mb-0.5">🍗</div>
                  <div className="text-xs">Ekor</div>
                  <div className="text-[10px] text-stone-400 font-normal">Ayam / Ikan</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleUnitTypeSelect('pcs')}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    unitType === 'pcs'
                      ? 'border-blue-500 bg-blue-50/70 text-blue-800 font-bold shadow-xs'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-600 font-medium'
                  }`}
                >
                  <div className="text-base mb-0.5">📦</div>
                  <div className="text-xs">Pcs</div>
                  <div className="text-[10px] text-stone-400 font-normal">Buah / Sak</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleUnitTypeSelect('pax')}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    unitType === 'pax'
                      ? 'border-purple-500 bg-purple-50/70 text-purple-800 font-bold shadow-xs'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-600 font-medium'
                  }`}
                >
                  <div className="text-base mb-0.5">🍽️</div>
                  <div className="text-xs">Pax</div>
                  <div className="text-[10px] text-stone-400 font-normal">Porsi / Paket</div>
                </button>
              </div>
            </div>

            {/* 3. KONDISIONAL BERAT / KUANTITAS */}
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg space-y-3">
              {unitType === 'daging' ? (
                /* JIKA DAGING: MEMBELI BERAPA KG */
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-800 text-xs flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-rose-600" />
                      <span>Berapa Kg Daging yang Dibeli?</span>
                    </span>
                    <span className="text-[10px] font-semibold text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded">
                      Konversi = {(weightKg * 1000).toLocaleString('id-ID')} Gram Stok Fisik
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Input
                        label="Berat Daging (Kg)"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={weightKg}
                        onChange={(e) => handleWeightOrQtyChange(parseFloat(e.target.value) || 0, true)}
                        required
                        helperText="Contoh: 10 atau 12.5 kg"
                      />
                    </div>

                    <div>
                      <Select
                        label="Sinkron ke Item Stok Daging Resto"
                        value={selectedInventoryId}
                        onChange={(e) => setSelectedInventoryId(e.target.value)}
                      >
                        {inventoryItems.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.item_name} (Saldo: {formatGram(inv.stock_gram)})
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </div>
              ) : (
                /* JIKA EKOR / PCS / PAX: JUMLAH KUANTITAS */
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-800 text-xs">
                      Jumlah Kuantitas ({unitType.toUpperCase()})
                    </span>
                    <span className="text-[10px] text-stone-400">
                      Bahan non-daging ditimbang dalam satuan {unitType}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label={`Jumlah Pembelian (${unitType})`}
                      type="number"
                      step="1"
                      min="1"
                      value={quantity}
                      onChange={(e) => handleWeightOrQtyChange(parseFloat(e.target.value) || 0, false)}
                      required
                    />

                    <div className="pt-5 text-xs text-stone-500">
                      Total barang: <strong className="text-stone-800">{quantity} {unitType}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* HARGA SATUAN & TOTAL */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-200">
                <Input
                  label={`Harga per ${unitType === 'daging' ? 'Kg' : unitType} (Rp)`}
                  type="number"
                  step="1000"
                  min="0"
                  value={unitPrice}
                  onChange={(e) => handleUnitPriceChange(parseFloat(e.target.value) || 0)}
                  required
                />

                <Input
                  label="Total Harga Belanja (Rp)"
                  type="number"
                  step="1000"
                  min="0"
                  value={totalPrice}
                  onChange={(e) => handleTotalPriceManualChange(parseFloat(e.target.value) || 0)}
                  required
                  helperText="Otomatis dikalkulasi, bisa diubah manual"
                />
              </div>
            </div>

            {/* 4. TANGGAL & SIAPA YANG MEMBELI */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Tanggal Pembelian"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />

              <Input
                label="Siapa yang Membeli? (Nama Petugas)"
                placeholder="Contoh: Kang Ujang (Kitchen), Pak Hendra..."
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                required
                helperText="Nama staf / pembeli di tanggal transaksi"
              />
            </div>

            {/* 5. SUPPLIER & TEMPAT BELI */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-stone-800 text-xs">
                  Pemasok / Supplier / Toko
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomSupplier(!isCustomSupplier)}
                  className="text-[11px] text-amber-600 hover:text-amber-700 underline font-medium"
                >
                  {isCustomSupplier ? 'Pilih dari daftar supplier' : '+ Tulis nama toko manual'}
                </button>
              </div>

              {isCustomSupplier ? (
                <Input
                  placeholder="Ketik nama toko/pasar (misal: Toko Beras Sumber Makmur, Pasar Ciawi)"
                  value={customSupplier}
                  onChange={(e) => setCustomSupplier(e.target.value)}
                  required
                />
              ) : (
                <Select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.supplier_name} {s.contact_person ? `(${s.contact_person})` : ''}
                    </option>
                  ))}
                </Select>
              )}
            </div>

            {/* 6. KATEGORI & METODE BAYAR */}
            <div className="grid grid-cols-3 gap-3">
              <Select
                label="Kategori Belanja"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
              >
                <option value="restaurant">Restoran (Dapur)</option>
                <option value="lodging">Penginapan (Villa)</option>
                <option value="operational">Operasional Umum</option>
              </Select>

              <Select
                label="Metode Bayar"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
              >
                <option value="cash">Cash / Tunai</option>
                <option value="bank_transfer">Transfer Bank</option>
                <option value="qris">QRIS</option>
              </Select>

              <Input
                label="Nomor Nota / Faktur"
                placeholder="INV-998877"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>

            {/* Catatan Belanja */}
            <Input
              label="Catatan Belanja (Opsional)"
              placeholder="Kondisi barang, spesifikasi potong, dll."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            {/* Total Highlight Bar */}
            <div className="p-3 bg-stone-900 text-white rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[11px] text-stone-400 block">Total Tagihan Belanja:</span>
                <span className="text-xs text-stone-300">
                  {unitType === 'daging' ? `${weightKg} Kg Daging` : `${quantity} ${unitType}`} • {operatorName || 'Petugas'}
                </span>
              </div>
              <span className="text-lg font-black text-amber-400">
                {formatRupiah(totalPrice)}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="amber"
                size="sm"
                isLoading={isSubmitting}
                className="font-semibold"
              >
                Simpan Transaksi Belanja
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL: DETAIL RIWAYAT BELANJA                             */}
      {/* ========================================================= */}
      {selectedDetailPo && (
        <Modal
          isOpen={!!selectedDetailPo}
          onClose={() => setSelectedDetailPo(null)}
          title={`Detail Pembelian ${selectedDetailPo.purchase_number}`}
          subtitle="Rincian faktur pembelian dan status penerimaan barang"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-stone-50 rounded-lg space-y-2 border border-stone-200">
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Nomor PO / Pembelian:</span>
                <span className="font-mono font-bold text-stone-900">{selectedDetailPo.purchase_number}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Tanggal Pembelian:</span>
                <span className="font-semibold text-stone-800">{formatDateWIB(selectedDetailPo.purchase_date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Siapa yang Membeli:</span>
                <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {selectedDetailPo.operator_name || 'Petugas'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Pemasok / Toko:</span>
                <span className="font-semibold text-stone-800">{selectedDetailPo.supplier_name_snapshot}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Metode Bayar:</span>
                <span className="font-medium text-stone-800 uppercase">{selectedDetailPo.payment_method}</span>
              </div>
              {selectedDetailPo.invoice_number && (
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">No. Faktur / Nota:</span>
                  <span className="font-mono text-stone-800">{selectedDetailPo.invoice_number}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <span className="font-bold text-stone-800 uppercase tracking-wider text-[11px] block">
                Rincian Barang yang Dibeli
              </span>
              <div className="border border-stone-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-stone-100 text-stone-600 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="p-2">Nama Barang</th>
                      <th className="p-2 text-center">Kuantitas / Berat</th>
                      <th className="p-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {selectedDetailPo.purchase_items?.map((it, idx) => (
                      <tr key={idx} className="hover:bg-stone-50">
                        <td className="p-2 font-medium text-stone-800">
                          {it.item_name_snapshot}
                          {it.notes && (
                            <div className="text-[10px] text-stone-400 font-normal">{it.notes}</div>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {it.unit_type === 'daging' || (it.received_weight_kg && it.received_weight_kg > 0) ? (
                            <span className="font-semibold text-rose-700">
                              {it.received_weight_kg} Kg ({formatGram(it.received_weight_gram || it.received_weight_kg * 1000)})
                            </span>
                          ) : (
                            <span className="font-semibold text-stone-700">
                              {it.quantity || 1} {it.unit_type || 'Pcs'}
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-right font-bold text-stone-900">
                          {formatRupiah(it.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total summary */}
            <div className="p-3 bg-stone-900 text-white rounded-lg flex items-center justify-between">
              <span className="text-xs text-stone-400">Total Pembayaran:</span>
              <span className="text-base font-black text-amber-400">
                {formatRupiah(selectedDetailPo.total_amount)}
              </span>
            </div>

            {selectedDetailPo.notes && (
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 text-xs">
                <strong>Catatan:</strong> {selectedDetailPo.notes}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => handleDeletePurchase(selectedDetailPo.id, selectedDetailPo.purchase_number)}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Riwayat Ini
              </button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDetailPo(null)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
