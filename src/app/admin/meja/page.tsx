'use client';

import React, { useEffect, useState } from 'react';
import { UtensilsCrossed, Plus, Users } from 'lucide-react';
import { getTables } from '@/lib/services/roomService';
import { RestaurantTable, TableStatus } from '@/lib/supabase/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function AdminMejaPage() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const list = await getTables();
    setTables(list);
  }

  const toggleTableStatus = (id: string, currentStatus: TableStatus) => {
    const nextStatus: TableStatus =
      currentStatus === 'available' ? 'occupied' : currentStatus === 'occupied' ? 'reserved' : 'available';

    const updated = tables.map((t) => (t.id === id ? { ...t, status: nextStatus } : t));
    setTables(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('asap_tables_store', JSON.stringify(updated));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-amber-600" />
            <span>Manajemen Meja Restoran</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Pengaturan tata letak meja makan, kapasitas kursi, dan status ketersediaan meja saat operasional.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {tables.map((table) => (
          <Card
            key={table.id}
            className={`flex flex-col justify-between border-2 transition-all cursor-pointer ${
              table.status === 'available'
                ? 'border-emerald-300 bg-emerald-50/20'
                : table.status === 'occupied'
                ? 'border-red-300 bg-red-50/20'
                : 'border-amber-300 bg-amber-50/20'
            }`}
            onClick={() => toggleTableStatus(table.id, table.status)}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-lg text-stone-900">{table.table_number}</span>
                <Badge
                  variant={
                    table.status === 'available'
                      ? 'success'
                      : table.status === 'occupied'
                      ? 'danger'
                      : 'warning'
                  }
                  size="sm"
                >
                  {table.status.toUpperCase()}
                </Badge>
              </div>

              <div className="mt-3 text-xs text-stone-600 flex items-center gap-1.5 font-medium">
                <Users className="w-3.5 h-3.5 text-stone-400" />
                <span>Kapasitas {table.capacity} Orang</span>
              </div>

              {table.location_notes && (
                <div className="mt-1 text-[11px] text-stone-500 italic">{table.location_notes}</div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-200/80 text-[11px] text-stone-400 text-center font-medium">
              Klik untuk ubah status
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
