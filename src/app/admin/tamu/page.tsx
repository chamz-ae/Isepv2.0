'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Users,
  Award,
  Phone,
  Calendar,
  DollarSign,
  Clock,
  ArrowRight,
  UtensilsCrossed,
  BedDouble,
  MessageSquare,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { getGuests } from '@/lib/services/guestService';
import { getOrders } from '@/lib/services/orderService';
import { Guest, Order } from '@/lib/supabase/types';
import {
  formatRupiah,
  formatDateTimeWIB,
  formatDateWIB,
  generateWhatsAppLink,
} from '@/lib/utils/formatters';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
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
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">Data Tamu & Loyalitas</h1>
            <Badge variant="stone" size="sm">
              {guests.length} Terdaftar
            </Badge>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Riwayat profil kunjungan, pengeluaran akumulatif, status Pelanggan Setia, dan buat pesanan cepat dengan 1 klik.
          </p>
        </div>
        <div className="w-full sm:w-80">
          <Input
            placeholder="Cari nama tamu, no. WhatsApp, kode booking..."
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
                className="hover:border-amber-500 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
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
                      {guest.phone && (
                        <div className="text-xs text-stone-500 flex items-center gap-1.5 mt-1">
                          <a
                            href={generateWhatsAppLink(guest.phone, `Halo Bapak/Ibu ${guest.name}, terima kasih telah berkunjung ke ASAP ISEP`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-emerald-700 hover:underline flex items-center gap-1 font-mono text-xs font-semibold"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{guest.phone}</span>
                          </a>
                        </div>
                      )}
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
                    <div className="mt-2.5 text-[11px] text-stone-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>Terakhir datang: {formatDateWIB(guest.last_visit_at)}</span>
                    </div>
                  )}
                </div>

                {/* Quick Add Order / Booking Actions */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <Link
                    href={`/admin/pesanan-restoran?guestName=${encodeURIComponent(guest.name)}&guestPhone=${encodeURIComponent(guest.phone)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-center font-bold text-[11px] transition-colors border border-amber-200/60 flex items-center justify-center gap-1 shadow-2xs"
                    title={`Buat Pesanan Resto untuk ${guest.name}`}
                  >
                    <UtensilsCrossed className="w-3 h-3 text-amber-600" />
                    <span>+ Pesan Resto</span>
                  </Link>
                  <Link
                    href={`/admin/pesanan-penginapan?guestName=${encodeURIComponent(guest.name)}&guestPhone=${encodeURIComponent(guest.phone)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-center font-bold text-[11px] transition-colors border border-emerald-200/60 flex items-center justify-center gap-1 shadow-2xs"
                    title={`Buat Booking Kabin Inap untuk ${guest.name}`}
                  >
                    <BedDouble className="w-3 h-3 text-emerald-600" />
                    <span>+ Booking Inap</span>
                  </Link>
                </div>
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
          <div className="space-y-5">
            {/* Action Bar: Create Order or Lodging */}
            <div className="p-3.5 bg-gradient-to-r from-amber-50 via-stone-50 to-emerald-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-stone-900 text-xs block">
                  Tambah Pesanan atau Menginap Cepat
                </span>
                <span className="text-[11px] text-stone-500">
                  Nama dan nomor WhatsApp {selectedGuest.name} otomatis terisi
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link
                  href={`/admin/pesanan-restoran?guestName=${encodeURIComponent(selectedGuest.name)}&guestPhone=${encodeURIComponent(selectedGuest.phone)}`}
                  className="flex-1 sm:flex-none"
                >
                  <Button variant="amber" size="sm" className="w-full text-xs font-semibold shadow-xs">
                    <UtensilsCrossed className="w-3.5 h-3.5 mr-1" />
                    <span>+ Pesan Resto</span>
                  </Button>
                </Link>
                <Link
                  href={`/admin/pesanan-penginapan?guestName=${encodeURIComponent(selectedGuest.name)}&guestPhone=${encodeURIComponent(selectedGuest.phone)}`}
                  className="flex-1 sm:flex-none"
                >
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold bg-white shadow-xs">
                    <BedDouble className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    <span>+ Booking Inap</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Loyalty and Spend Stats */}
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

            {/* Past Orders History */}
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
