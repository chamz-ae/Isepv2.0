'use client';

import React, { useEffect, useState } from 'react';
import { ChefHat, Clock, CheckCircle2, ArrowRight, RefreshCw, Flame } from 'lucide-react';
import { getKdsTickets, updateKdsItemStatus, KdsTicketItem } from '@/lib/services/kdsService';
import { KdsStatus } from '@/lib/supabase/types';
import { formatGram, formatTimeWIB } from '@/lib/utils/formatters';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminKdsPage() {
  const [tickets, setTickets] = useState<KdsTicketItem[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 10000); // 10s auto refresh polling fallback
    return () => clearInterval(interval);
  }, []);

  async function loadTickets() {
    try {
      const data = await getKdsTickets('active');
      setTickets(data);
    } finally {
      setIsLoading(false);
    }
  }

  const handleAdvanceStatus = async (item: KdsTicketItem) => {
    let nextStatus: KdsStatus = 'preparing';
    if (item.kdsStatus === 'pending') nextStatus = 'preparing';
    else if (item.kdsStatus === 'preparing') nextStatus = 'ready';
    else if (item.kdsStatus === 'ready') nextStatus = 'served';

    await updateKdsItemStatus(item.id, nextStatus);
    loadTickets();
  };

  const filteredTickets = tickets.filter((t) => {
    if (filterTab === 'all') return true;
    return t.kdsStatus === filterTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-amber-600" />
            <span>Kitchen Display System (KDS)</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Antrian pesanan dapur & pitmaster pengasapan secara berurutan (FIFO).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-stone-300 rounded-lg p-1 text-xs font-semibold">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterTab === 'all' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Semua ({tickets.length})
            </button>
            <button
              onClick={() => setFilterTab('pending')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterTab === 'pending' ? 'bg-amber-600 text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Pending ({tickets.filter((t) => t.kdsStatus === 'pending').length})
            </button>
            <button
              onClick={() => setFilterTab('preparing')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterTab === 'preparing' ? 'bg-sky-600 text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Dimasak ({tickets.filter((t) => t.kdsStatus === 'preparing').length})
            </button>
            <button
              onClick={() => setFilterTab('ready')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterTab === 'ready' ? 'bg-emerald-600 text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Siap Saji ({tickets.filter((t) => t.kdsStatus === 'ready').length})
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={loadTickets}>
            <RefreshCw className="w-4 h-4 mr-1" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="Tidak Ada Pesanan Dapur Aktif"
          description="Semua pesanan makanan telah selesai disajikan atau belum ada order masuk."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map((ticket) => (
            <Card
              key={ticket.id}
              className={`flex flex-col justify-between border-2 transition-all ${
                ticket.kdsStatus === 'pending'
                  ? 'border-amber-400 bg-amber-50/20'
                  : ticket.kdsStatus === 'preparing'
                  ? 'border-sky-400 bg-sky-50/20'
                  : 'border-emerald-500 bg-emerald-50/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-stone-900">{ticket.tableOrRoom}</span>
                    <Badge variant="stone" size="sm" className="font-mono text-[10px]">
                      {ticket.bookingCode}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-stone-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeWIB(ticket.createdAt)}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-base font-black text-stone-900">{ticket.menuName}</h3>
                  <div className="mt-2 flex items-center justify-between text-xs font-bold text-stone-700 bg-white p-2.5 rounded-lg border border-stone-200">
                    <span>Jumlah: {ticket.qty} Porsi</span>
                    {ticket.totalGram > 0 && (
                      <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        🥩 {formatGram(ticket.totalGram)}
                      </span>
                    )}
                  </div>

                  {ticket.kdsNotes && (
                    <div className="mt-2 text-xs text-stone-600 bg-stone-100 p-2 rounded italic">
                      Catatan: {ticket.kdsNotes}
                    </div>
                  )}

                  {ticket.orderNotes && (
                    <div className="mt-1 text-[11px] text-stone-500 italic">
                      Note Tamu: {ticket.orderNotes}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-stone-200 flex items-center justify-between">
                <Badge
                  variant={
                    ticket.kdsStatus === 'pending'
                      ? 'warning'
                      : ticket.kdsStatus === 'preparing'
                      ? 'info'
                      : 'success'
                  }
                  size="md"
                >
                  {ticket.kdsStatus === 'pending'
                    ? 'Antrian Baru'
                    : ticket.kdsStatus === 'preparing'
                    ? 'Sedang Dimasak'
                    : 'Siap Disajikan'}
                </Badge>

                <Button
                  onClick={() => handleAdvanceStatus(ticket)}
                  variant={
                    ticket.kdsStatus === 'pending'
                      ? 'amber'
                      : ticket.kdsStatus === 'preparing'
                      ? 'primary'
                      : 'secondary'
                  }
                  size="sm"
                >
                  <span>
                    {ticket.kdsStatus === 'pending'
                      ? 'Mulai Masak'
                      : ticket.kdsStatus === 'preparing'
                      ? 'Siap Saji'
                      : 'Tandai Disajikan'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
