'use client';

import React, { useEffect, useState } from 'react';
import { Search, Users, Award, Phone, Calendar, DollarSign, Clock, ArrowRight } from 'lucide-react';
import { getGuests } from '@/lib/services/guestService';
import { getOrders } from '@/lib/services/orderService';
import { Guest, Order } from '@/lib/supabase/types';
import { formatRupiah, formatDateTimeWIB, formatDateWIB } from '@/lib/utils/formatters';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

export default function TamuAdminPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [gList, ordList] = await Promise.all([getGuests(), getOrders()]);
        setGuests(gList);
        setOrders(ordList);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredGuests = guests.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    // Also check if any order's booking_code matches this guest
    const matchingOrder = orders.some(
      (o) => o.guest_id === g.id && o.booking_code.toLowerCase().includes(q)
    );
    return g.name.toLowerCase().includes(q) || g.phone.includes(q) || matchingOrder;
  });

  const getGuestOrders = (guestId: string) => {
    return orders.filter((o) => o.guest_id === guestId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Manajemen Data Tamu</h1>
          <p className="text-xs text-stone-500 mt-1">
            Riwayat profil kunjungan, pengeluaran akumulatif, dan status Pelanggan Setia.
          </p>
        </div>
        <div className="w-full sm:w-72">
          <Input
            placeholder="Cari nama, nomor HP, atau booking code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredGuests.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Belum Ada Tamu Terdaftar"
          description="Data tamu akan otomatis tersimpan saat pesanan restoran atau penginapan dibuat."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGuests.map((guest) => {
            const guestOrders = getGuestOrders(guest.id);
            const validVisits = guestOrders.filter((o) => o.order_status !== 'cancelled').length;
            const isLoyalCustomer = validVisits >= 2;

            return (
              <Card
                key={guest.id}
                onClick={() => setSelectedGuest(guest)}
                className="hover:border-amber-500 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                      <span>{guest.name}</span>
                      {isLoyalCustomer && (
                        <Badge variant="amber" size="sm">
                          <Award className="w-3 h-3 mr-1" />
                          Pelanggan Setia
                        </Badge>
                      )}
                    </h3>
                    <div className="text-xs text-stone-500 flex items-center gap-1.5 mt-1">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{guest.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-semibold">Total Kunjungan</span>
                    <span className="font-bold text-stone-800">{validVisits} Kali</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-semibold">Akumulasi Belanja</span>
                    <span className="font-bold text-emerald-700">{formatRupiah(guest.total_spend)}</span>
                  </div>
                </div>

                {guest.last_visit_at && (
                  <div className="mt-3 text-[11px] text-stone-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Terakhir datang: {formatDateWIB(guest.last_visit_at)}</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Guest Details Modal */}
      {selectedGuest && (
        <Modal
          isOpen={!!selectedGuest}
          onClose={() => setSelectedGuest(null)}
          title={`Profil Tamu: ${selectedGuest.name}`}
          subtitle={`No. HP / WhatsApp: ${selectedGuest.phone}`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-200">
              <div>
                <div className="text-xs text-stone-500 uppercase font-bold">Status Loyalitas</div>
                <div className="mt-1">
                  {getGuestOrders(selectedGuest.id).filter((o) => o.order_status !== 'cancelled').length >= 2 ? (
                    <Badge variant="amber" size="md">
                      👑 Pelanggan Setia (Kunjungan ke-2+)
                    </Badge>
                  ) : (
                    <Badge variant="stone" size="md">
                      Tamu Standar (Kunjungan Baru)
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-stone-500 uppercase font-bold">Total Pembelanjaan</div>
                <div className="text-base font-black text-emerald-700 mt-1">
                  {formatRupiah(selectedGuest.total_spend)}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-3">
                Riwayat Transaksi & Kunjungan
              </h4>
              {getGuestOrders(selectedGuest.id).length === 0 ? (
                <p className="text-xs text-stone-400 italic">Belum ada transaksi historis yang tercatat.</p>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto">
                  {getGuestOrders(selectedGuest.id).map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3 border border-stone-200 rounded-lg text-xs flex items-center justify-between hover:bg-stone-50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-900">{ord.booking_code}</span>
                          <span className="uppercase text-[10px] text-stone-500 font-semibold">({ord.order_type})</span>
                        </div>
                        <div className="text-stone-500 mt-0.5">
                          {formatDateTimeWIB(ord.created_at)}
                          {ord.table_number_snapshot && ` • Meja ${ord.table_number_snapshot}`}
                          {ord.room_name_snapshot && ` • ${ord.room_name_snapshot}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-stone-900">{formatRupiah(ord.total_amount)}</div>
                        <Badge
                          variant={
                            ord.order_status === 'cancelled'
                              ? 'danger'
                              : ord.payment_status === 'paid'
                              ? 'success'
                              : 'warning'
                          }
                          size="sm"
                          className="mt-1"
                        >
                          {ord.order_status === 'cancelled' ? 'Batal' : ord.payment_status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
