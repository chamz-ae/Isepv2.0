'use client';

import React, { useEffect, useState } from 'react';
import {
  History,
  Search,
  Plus,
  Ban,
  CreditCard,
  Eye,
  CheckCircle,
  Clock,
  Printer,
  UtensilsCrossed,
} from 'lucide-react';
import { getOrders, addItemsToExistingOrder, recordPaymentForOrder, voidOrder } from '@/lib/services/orderService';
import { getMenus } from '@/lib/services/menuService';
import { Order, MenuItem, PaymentMethod } from '@/lib/supabase/types';
import { formatRupiah, formatGram, formatDateTimeWIB } from '@/lib/utils/formatters';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminOrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Add Item Modal state
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [selectedMenuId, setSelectedMenuId] = useState('');
  const [addQty, setAddQty] = useState(1);
  const [addGram, setAddGram] = useState(100);

  // Payment Modal state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [payRef, setPayRef] = useState('');

  // Void Modal state
  const [isVoidOpen, setIsVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [ordList, menuList] = await Promise.all([getOrders(), getMenus({ activeOnly: true })]);
    setOrders(ordList);
    setMenus(menuList);
  }

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.order_status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        o.booking_code.toLowerCase().includes(q) ||
        o.guest_name.toLowerCase().includes(q) ||
        o.guest_phone.includes(q)
      );
    }
    return true;
  });

  const handleOpenAddItem = (order: Order) => {
    setSelectedOrder(order);
    if (menus.length > 0) setSelectedMenuId(menus[0].id);
    setAddQty(1);
    setAddGram(100);
    setIsAddItemOpen(true);
  };

  const handleSaveAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !selectedMenuId) return;

    const menu = menus.find((m) => m.id === selectedMenuId);
    if (!menu) return;

    const chosenGram = menu.is_fixed_gram ? menu.standard_meat_gram : menu.meat_type !== 'none' ? addGram : 0;
    let unitPrice = menu.price;
    if (menu.price_basis === 'per_gram') unitPrice = menu.price * chosenGram;

    setIsSubmitting(true);
    try {
      const updated = await addItemsToExistingOrder(selectedOrder.id, [
        {
          menuId: menu.id,
          menuName: menu.name,
          unitPrice,
          meatType: menu.meat_type,
          gramPerPortion: chosenGram,
          qty: addQty,
          subtotal: unitPrice * addQty,
        },
      ]);
      setSelectedOrder(updated);
      setIsAddItemOpen(false);
      loadData();
      alert(`Item ${menu.name} berhasil ditambahkan ke order ${selectedOrder.booking_code}!`);
    } catch (err: any) {
      alert(err.message || 'Gagal menambah item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPayment = (order: Order) => {
    setSelectedOrder(order);
    setPayAmount(order.remaining_amount);
    setIsPaymentOpen(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || payAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await recordPaymentForOrder({
        orderId: selectedOrder.id,
        amount: payAmount,
        paymentMethod: payMethod,
        isDownPayment: false,
        referenceNumber: payRef,
        operatorName: 'Kasir Utama',
      });
      setIsPaymentOpen(false);
      loadData();
      alert('Pembayaran berhasil dicatat!');
    } catch (err: any) {
      alert(err.message || 'Gagal memproses pembayaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenVoid = (order: Order) => {
    setSelectedOrder(order);
    setVoidReason('');
    setIsVoidOpen(true);
  };

  const handleConfirmVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !voidReason.trim()) {
      alert('Alasan pembatalan / void wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      await voidOrder({
        orderId: selectedOrder.id,
        reason: voidReason,
        operatorName: 'Admin / Owner',
      });
      setIsVoidOpen(false);
      loadData();
      alert(`Order ${selectedOrder.booking_code} telah dibatalkan dan stok dikembalikan!`);
    } catch (err: any) {
      alert(err.message || 'Gagal membatalkan order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Riwayat Pesanan & Transaksi</h1>
          <p className="text-xs text-stone-500 mt-1">
            Audit pesanan, penambahan item aktif, pelunasan kasir, dan void transaksi dengan pembatalan stok.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Input
            placeholder="Cari booking code, nama, HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64"
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-36"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={History}
          title="Tidak Ada Riwayat Pesanan"
          description="Belum ada transaksi yang sesuai dengan kriteria filter."
        />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((ord) => (
            <Card key={ord.id} className="p-4 hover:border-stone-400 transition-colors">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-black text-sm text-stone-900">{ord.booking_code}</span>
                    <Badge variant={ord.order_type === 'restaurant' ? 'amber' : 'info'} size="sm">
                      {ord.order_type.toUpperCase()}
                    </Badge>
                    <Badge
                      variant={
                        ord.payment_status === 'paid'
                          ? 'success'
                          : ord.payment_status === 'down_payment'
                          ? 'warning'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {ord.payment_status === 'paid' ? 'Lunas' : ord.payment_status === 'down_payment' ? 'DP' : 'Belum Lunas'}
                    </Badge>
                    {ord.order_status === 'cancelled' && (
                      <Badge variant="danger" size="sm">
                        Dibatalkan (Void)
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-stone-600 mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      Tamu: <strong>{ord.guest_name}</strong> ({ord.guest_phone})
                    </span>
                    <span>Waktu: {formatDateTimeWIB(ord.created_at)}</span>
                    {ord.table_number_snapshot && <span>Meja: {ord.table_number_snapshot}</span>}
                    {ord.room_name_snapshot && <span>Kamar: {ord.room_name_snapshot}</span>}
                  </div>
                  {ord.notes && <div className="text-[11px] text-stone-500 mt-1 italic">Catatan: {ord.notes}</div>}
                </div>

                {/* Financial Summary & Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-left md:text-right">
                    <div className="text-xs text-stone-500">Total Tagihan:</div>
                    <div className="text-base font-black text-stone-900">{formatRupiah(ord.total_amount)}</div>
                    {ord.remaining_amount > 0 && ord.order_status !== 'cancelled' && (
                      <div className="text-xs font-bold text-red-600">Sisa: {formatRupiah(ord.remaining_amount)}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedOrder(ord)}>
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      <span>Rincian</span>
                    </Button>

                    {ord.order_status !== 'cancelled' && (
                      <>
                        {/* Add Item to Active Order */}
                        <Button variant="secondary" size="sm" onClick={() => handleOpenAddItem(ord)}>
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          <span>Add Item</span>
                        </Button>

                        {/* Pay Remaining */}
                        {ord.remaining_amount > 0 && (
                          <Button variant="amber" size="sm" onClick={() => handleOpenPayment(ord)}>
                            <CreditCard className="w-3.5 h-3.5 mr-1" />
                            <span>Pelunasan</span>
                          </Button>
                        )}

                        {/* Void / Cancel */}
                        <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleOpenVoid(ord)}>
                          <Ban className="w-3.5 h-3.5 mr-1" />
                          <span>Void</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && !isAddItemOpen && !isPaymentOpen && !isVoidOpen && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Rincian Transaksi: ${selectedOrder.booking_code}`}
          subtitle={`Tamu: ${selectedOrder.guest_name} (${selectedOrder.guest_phone})`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Items table */}
            <div className="border border-stone-200 rounded-lg overflow-hidden">
              <div className="bg-stone-50 px-3 py-2 font-bold text-stone-700 border-b border-stone-200 flex justify-between">
                <span>Daftar Menu / Layanan</span>
                <span>Subtotal</span>
              </div>
              <div className="divide-y divide-stone-100 max-h-52 overflow-y-auto">
                {selectedOrder.order_items?.map((item) => (
                  <div key={item.id} className="p-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-stone-900">{item.menu_name_snapshot}</div>
                      <div className="text-stone-500 text-[11px]">
                        {item.qty} × {formatRupiah(item.unit_price_snapshot)}
                        {item.total_gram > 0 && ` (${formatGram(item.total_gram)})`}
                      </div>
                    </div>
                    <span className="font-bold text-stone-900">{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
                {selectedOrder.subtotal_lodging > 0 && (
                  <div className="p-2.5 flex items-center justify-between bg-stone-50/50">
                    <div>
                      <div className="font-bold text-stone-900">Penginapan Kabin ({selectedOrder.room_name_snapshot})</div>
                      <div className="text-stone-500 text-[11px]">
                        {selectedOrder.check_in_date} s/d {selectedOrder.check_out_date} ({selectedOrder.adult_count + selectedOrder.teen_count + selectedOrder.child_count} Tamu)
                      </div>
                    </div>
                    <span className="font-bold text-stone-900">{formatRupiah(selectedOrder.subtotal_lodging)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payments history */}
            {selectedOrder.payments && selectedOrder.payments.length > 0 && (
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <span className="font-bold uppercase tracking-wider text-[10px] text-stone-500 block mb-2">
                  Riwayat Pembayaran Diterima
                </span>
                <div className="space-y-1.5">
                  {selectedOrder.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs">
                      <span className="text-stone-600">
                        {p.payment_number} • {p.payment_method.toUpperCase()} ({formatDateTimeWIB(p.paid_at)})
                      </span>
                      <span className="font-bold text-emerald-700">{formatRupiah(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedOrder.cancellation_reason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                <strong>Alasan Pembatalan:</strong> {selectedOrder.cancellation_reason}
                <div className="text-[10px] text-red-600 mt-1">Dibatalkan oleh: {selectedOrder.cancelled_by}</div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Add Item Modal */}
      {isAddItemOpen && selectedOrder && (
        <Modal
          isOpen={isAddItemOpen}
          onClose={() => setIsAddItemOpen(false)}
          title={`Tambah Item ke Order: ${selectedOrder.booking_code}`}
          subtitle="Item akan langsung digabungkan ke transaksi aktif ini tanpa membuat booking baru"
        >
          <form onSubmit={handleSaveAddItem} className="space-y-4 text-xs">
            <Select
              label="Pilih Menu"
              value={selectedMenuId}
              onChange={(e) => setSelectedMenuId(e.target.value)}
            >
              {menus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {formatRupiah(m.price)}
                </option>
              ))}
            </Select>

            {(() => {
              const currentM = menus.find((m) => m.id === selectedMenuId);
              if (currentM && currentM.meat_type !== 'none' && !currentM.is_fixed_gram) {
                return (
                  <Input
                    label="Gramasi Aktual Daging (Gram)"
                    type="number"
                    step="10"
                    min="50"
                    value={addGram}
                    onChange={(e) => setAddGram(parseFloat(e.target.value) || 100)}
                    required
                  />
                );
              }
              return null;
            })()}

            <Input
              label="Quantity (Porsi)"
              type="number"
              min="1"
              value={addQty}
              onChange={(e) => setAddQty(parseInt(e.target.value) || 1)}
              required
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddItemOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="amber" size="sm" isLoading={isSubmitting}>
                Konfirmasi Tambah Item
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Payment Modal */}
      {isPaymentOpen && selectedOrder && (
        <Modal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          title={`Pencatatan Pembayaran: ${selectedOrder.booking_code}`}
          subtitle={`Sisa tagihan: ${formatRupiah(selectedOrder.remaining_amount)}`}
        >
          <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
            <Input
              label="Nominal Pembayaran (Rp)"
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
              required
            />

            <Select
              label="Metode Pembayaran"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as any)}
            >
              <option value="cash">Cash / Tunai</option>
              <option value="qris">QRIS</option>
              <option value="bank_transfer">Transfer Bank</option>
              <option value="room_charge">Tagih Kamar (Room Charge)</option>
            </Select>

            <Input
              label="Nomor Referensi / Catatan Struk"
              placeholder="Contoh: REF-BCA-9871"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsPaymentOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="amber" size="sm" isLoading={isSubmitting}>
                Catat Pembayaran
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Void Modal */}
      {isVoidOpen && selectedOrder && (
        <Modal
          isOpen={isVoidOpen}
          onClose={() => setIsVoidOpen(false)}
          title={`Void / Batalkan Order: ${selectedOrder.booking_code}`}
          subtitle="Tindakan ini akan mengembalikan stok daging yang terpotong ke inventori dan mencatat audit trail"
        >
          <form onSubmit={handleConfirmVoid} className="space-y-4 text-xs">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 leading-relaxed">
              Peringatan: Order yang dibatalkan tidak dapat dikembalikan. Data kunjungan loyalitas tamu akan disesuaikan secara otomatis.
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Alasan Pembatalan / Void (Wajib)
              </label>
              <textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Contoh: Tamu membatalkan reservasi karena alasan keluarga..."
                rows={3}
                required
                className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsVoidOpen(false)}>
                Tutup
              </Button>
              <Button type="submit" variant="danger" size="sm" isLoading={isSubmitting}>
                Konfirmasi Void
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
