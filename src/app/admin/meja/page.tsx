'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { UtensilsCrossed, Plus, Users, Edit2, Trash2, Search, CheckCircle2, XCircle, Clock, MapPin } from 'lucide-react';
import { getTables, saveTable, deleteTable } from '@/lib/services/roomService';
import { RestaurantTable, TableStatus } from '@/lib/supabase/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminMejaPage() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TableStatus>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [status, setStatus] = useState<TableStatus>('available');
  const [locationNotes, setLocationNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const list = await getTables();
      setTables(list);
    } catch (err) {
      console.error('Failed to load tables:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenAdd = () => {
    setEditingTable(null);
    setTableNumber(`Meja ${String(tables.length + 1).padStart(2, '0')}`);
    setCapacity(4);
    setStatus('available');
    setLocationNotes('Area Utama Smokehouse');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (table: RestaurantTable, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTable(table);
    setTableNumber(table.table_number);
    setCapacity(table.capacity);
    setStatus(table.status);
    setLocationNotes(table.location_notes || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (table: RestaurantTable, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Apakah Anda yakin ingin menghapus "${table.table_number}"? Data yang dihapus tidak dapat dikembalikan.`)) {
      return;
    }

    try {
      await deleteTable(table.id);
      setTables((prev) => prev.filter((t) => t.id !== table.id));
      alert(`Meja ${table.table_number} berhasil dihapus.`);
    } catch (err) {
      alert('Gagal menghapus meja.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      alert('Nomor meja wajib diisi.');
      return;
    }
    if (capacity < 1) {
      alert('Kapasitas minimal 1 orang.');
      return;
    }

    setIsSubmitting(true);
    try {
      const saved = await saveTable({
        id: editingTable ? editingTable.id : undefined,
        table_number: tableNumber.trim(),
        capacity,
        status,
        location_notes: locationNotes.trim() || undefined,
        is_active: true,
      });

      if (editingTable) {
        setTables((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
        alert(`Meja "${saved.table_number}" berhasil diperbarui!`);
      } else {
        setTables((prev) => [...prev, saved]);
        alert(`Meja "${saved.table_number}" berhasil ditambahkan!`);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('Gagal menyimpan data meja.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTableStatus = async (table: RestaurantTable, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus: TableStatus =
      table.status === 'available' ? 'occupied' : table.status === 'occupied' ? 'reserved' : 'available';

    const updated = await saveTable({ ...table, status: nextStatus });
    setTables((prev) => prev.map((t) => (t.id === table.id ? updated : t)));
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = tables.length;
    const available = tables.filter((t) => t.status === 'available').length;
    const occupied = tables.filter((t) => t.status === 'occupied').length;
    const reserved = tables.filter((t) => t.status === 'reserved').length;
    const totalCapacity = tables.reduce((acc, t) => acc + (t.capacity || 0), 0);
    return { total, available, occupied, reserved, totalCapacity };
  }, [tables]);

  // Filtered tables
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const numMatch = t.table_number.toLowerCase().includes(q);
        const locMatch = t.location_notes?.toLowerCase().includes(q);
        return numMatch || locMatch;
      }
      return true;
    });
  }, [tables, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-amber-600" />
            <span>Manajemen Meja Restoran</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Tambah meja baru, atur kapasitas kursi, ubah tata letak lokasi, dan pantau status meja secara live.
          </p>
        </div>

        <Button variant="amber" size="sm" onClick={handleOpenAdd} className="shadow-xs font-semibold">
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Tambah Meja Baru</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="p-3 bg-white border border-stone-200">
          <span className="text-[11px] font-semibold text-stone-500">Total Meja</span>
          <div className="text-xl font-bold text-stone-900 mt-1">{metrics.total} Meja</div>
          <span className="text-[10px] text-stone-400">Kapasitas {metrics.totalCapacity} kursi</span>
        </Card>

        <Card className="p-3 bg-emerald-50/50 border border-emerald-200">
          <span className="text-[11px] font-semibold text-emerald-800">Tersedia (Kosong)</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">{metrics.available} Meja</div>
          <span className="text-[10px] text-emerald-600">Siap menerima tamu</span>
        </Card>

        <Card className="p-3 bg-red-50/50 border border-red-200">
          <span className="text-[11px] font-semibold text-red-800">Terisi (Dining)</span>
          <div className="text-xl font-bold text-red-700 mt-1">{metrics.occupied} Meja</div>
          <span className="text-[10px] text-red-600">Sedang menyantap daging</span>
        </Card>

        <Card className="p-3 bg-amber-50/50 border border-amber-200">
          <span className="text-[11px] font-semibold text-amber-800">Reservasi (Dipesan)</span>
          <div className="text-xl font-bold text-amber-700 mt-1">{metrics.reserved} Meja</div>
          <span className="text-[10px] text-amber-600">Jadwal booking tamu</span>
        </Card>

        <Card className="p-3 bg-stone-50 border border-stone-200">
          <span className="text-[11px] font-semibold text-stone-600">Okupansi Meja</span>
          <div className="text-xl font-bold text-stone-900 mt-1">
            {metrics.total > 0 ? Math.round(((metrics.occupied + metrics.reserved) / metrics.total) * 100) : 0}%
          </div>
          <span className="text-[10px] text-stone-400">Tingkat keterisian</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3 bg-white border border-stone-200">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Cari nomor meja atau catatan lokasi (misal: VIP, Gazebo, Outdoor)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50/50"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
            <span className="text-stone-400 text-[11px] font-medium mr-1">Status:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'all' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Semua ({tables.length})
            </button>
            <button
              onClick={() => setStatusFilter('available')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'available' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Tersedia ({metrics.available})
            </button>
            <button
              onClick={() => setStatusFilter('occupied')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'occupied' ? 'bg-red-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Terisi ({metrics.occupied})
            </button>
            <button
              onClick={() => setStatusFilter('reserved')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'reserved' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Reservasi ({metrics.reserved})
            </button>
          </div>
        </div>
      </Card>

      {/* Tables Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-stone-400">Memuat denah meja restoran...</div>
      ) : filteredTables.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title={searchQuery ? 'Tidak Ada Meja yang Cocok' : 'Belum Ada Meja Terdaftar'}
          description="Tambahkan meja pertama Anda untuk mengatur denah duduk tamu di restoran ASAP ISEP."
          action={
            <Button variant="amber" size="sm" onClick={handleOpenAdd}>
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Tambah Meja Sekarang</span>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredTables.map((table) => {
            const isAvail = table.status === 'available';
            const isOcc = table.status === 'occupied';

            return (
              <Card
                key={table.id}
                className={`flex flex-col justify-between border-2 transition-all p-4 shadow-2xs hover:shadow-md ${
                  isAvail
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : isOcc
                    ? 'border-red-300 bg-red-50/20'
                    : 'border-amber-300 bg-amber-50/20'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-black text-xl text-stone-900 block">
                        {table.table_number}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-stone-600 mt-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-stone-400" />
                        <span>Kapasitas {table.capacity} Orang</span>
                      </div>
                    </div>

                    <Badge
                      variant={isAvail ? 'success' : isOcc ? 'danger' : 'warning'}
                      size="sm"
                      className="cursor-pointer"
                      onClick={(e: React.MouseEvent) => toggleTableStatus(table, e)}
                    >
                      {table.status === 'available'
                        ? 'TERSEDIA'
                        : table.status === 'occupied'
                        ? 'TERISI'
                        : 'RESERVASI'}
                    </Badge>
                  </div>

                  {table.location_notes ? (
                    <div className="mt-2.5 text-[11px] text-stone-500 bg-white/70 p-1.5 rounded-md border border-stone-200/60 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                      <span className="truncate">{table.location_notes}</span>
                    </div>
                  ) : (
                    <div className="mt-2.5 text-[11px] text-stone-400 italic">Area Reguler</div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => toggleTableStatus(table, e)}
                    className="text-[11px] text-stone-500 hover:text-stone-900 font-medium underline"
                    title="Klik untuk ubah status cepat"
                  >
                    Ubah Status
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleOpenEdit(table, e)}
                      className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-600 transition-colors"
                      title="Edit Data Meja"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(table, e)}
                      className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-red-50 hover:border-red-200 text-stone-400 hover:text-red-600 transition-colors"
                      title="Hapus Meja"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Tambah & Edit Meja */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingTable ? `Edit Data ${editingTable.table_number}` : 'Tambah Meja Restoran Baru'}
          subtitle="Atur nomor meja, kapasitas tempat duduk, status, dan catatan area penempatan."
          maxWidth="md"
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Nomor / Nama Meja"
                placeholder="Contoh: Meja 01, VIP Garden"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                required
              />

              <Input
                label="Kapasitas Kursi (Orang)"
                type="number"
                min="1"
                max="50"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 1)}
                required
              />
            </div>

            <Select
              label="Status Ketersediaan"
              value={status}
              onChange={(e) => setStatus(e.target.value as TableStatus)}
            >
              <option value="available">Tersedia (Kosong / Siap Digunakan)</option>
              <option value="occupied">Terisi (Tamu Sedang Makan)</option>
              <option value="reserved">Reservasi (Sudah Dipesan Tamu)</option>
            </Select>

            <Input
              label="Catatan Lokasi / Area (Opsional)"
              placeholder="Contoh: Gazebo Luar Kebun, Smoking Area, Dekat Kasir, Indoor AC"
              value={locationNotes}
              onChange={(e) => setLocationNotes(e.target.value)}
              helperText="Membantu staf kasir dan pelayan mengenali posisi meja"
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="amber" size="sm" isLoading={isSubmitting}>
                {editingTable ? 'Simpan Perubahan' : 'Tambah Meja'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
