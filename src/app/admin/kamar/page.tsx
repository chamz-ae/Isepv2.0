'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { DoorOpen, Plus, Edit, CheckCircle, XCircle } from 'lucide-react';
import { getRooms, updateRoom } from '@/lib/services/roomService';
import { Room, RoomStatus } from '@/lib/supabase/types';
import { formatRupiah } from '@/lib/utils/formatters';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';

export default function AdminKamarPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Partial<Room> | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const list = await getRooms({ activeOnly: false });
    setRooms(list);
  }

  const handleOpenAdd = () => {
    setEditingRoom({
      room_number: `LODGE-0${rooms.length + 1}`,
      room_name: '',
      room_type: 'Timber Cabin',
      price_per_night: 200000,
      capacity: 2,
      description: '',
      facilities: ['King Bed', 'Water Heater', 'Wi-Fi'],
      status: 'available',
      image_url: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (room: Room) => {
    setEditingRoom({ ...room });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom || !editingRoom.room_number || !editingRoom.room_name) return;
    await updateRoom(editingRoom);
    setIsModalOpen(false);
    setEditingRoom(null);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
            <DoorOpen className="w-6 h-6 text-amber-600" />
            <span>Manajemen Kamar Kabin</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Status ketersediaan, kapasitas tamu, foto kabin, dan fasilitas penginapan.
          </p>
        </div>
        <Button variant="amber" size="sm" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-1" />
          <span>Tambah Kamar Kabin</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {rooms.map((room) => (
          <Card key={room.id} className="p-0 overflow-hidden flex flex-col justify-between">
            {room.image_url && (
              <div className="relative w-full h-44 bg-stone-100">
                <Image src={room.image_url} alt={room.room_name} fill className="object-cover" />
                <div className="absolute top-2.5 right-2.5">
                  <Badge
                    variant={
                      room.status === 'available'
                        ? 'success'
                        : room.status === 'occupied'
                        ? 'warning'
                        : 'stone'
                    }
                    size="sm"
                  >
                    {room.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            )}

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-amber-700">{room.room_number}</span>
                  <span className="text-xs text-stone-500">Maks: {room.capacity} Orang</span>
                </div>
                <h3 className="text-base font-bold text-stone-900 mt-1">{room.room_name}</h3>
                <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">{room.description}</p>

                <div className="mt-3 flex flex-wrap gap-1">
                  {room.facilities?.map((f, idx) => (
                    <span key={idx} className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-medium">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-stone-400">Tarif Dasar / Orang:</div>
                  <div className="text-sm font-black text-stone-900">{formatRupiah(room.price_per_night)}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(room)}>
                  <Edit className="w-3.5 h-3.5 mr-1" />
                  <span>Edit</span>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {isModalOpen && editingRoom && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingRoom.id ? 'Edit Kamar Kabin' : 'Tambah Kamar Baru'}
          maxWidth="md"
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Nomor Kamar"
                value={editingRoom.room_number || ''}
                onChange={(e) => setEditingRoom({ ...editingRoom, room_number: e.target.value })}
                required
              />
              <Input
                label="Tipe Kamar"
                value={editingRoom.room_type || ''}
                onChange={(e) => setEditingRoom({ ...editingRoom, room_type: e.target.value })}
                required
              />
            </div>

            <Input
              label="Nama Kamar Kabin"
              value={editingRoom.room_name || ''}
              onChange={(e) => setEditingRoom({ ...editingRoom, room_name: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Tarif / Orang (Rp)"
                type="number"
                value={editingRoom.price_per_night ?? 200000}
                onChange={(e) => setEditingRoom({ ...editingRoom, price_per_night: parseFloat(e.target.value) || 0 })}
                required
              />
              <Input
                label="Kapasitas Tamu"
                type="number"
                value={editingRoom.capacity ?? 2}
                onChange={(e) => setEditingRoom({ ...editingRoom, capacity: parseInt(e.target.value) || 2 })}
                required
              />
            </div>

            <Select
              label="Status Kamar Saat Ini"
              value={editingRoom.status || 'available'}
              onChange={(e) => setEditingRoom({ ...editingRoom, status: e.target.value as RoomStatus })}
            >
              <option value="available">Available (Tersedia)</option>
              <option value="occupied">Occupied (Terisi)</option>
              <option value="cleaning">Cleaning (Pembersihan)</option>
              <option value="maintenance">Maintenance (Perbaikan)</option>
            </Select>

            <Input
              label="URL Foto Kamar"
              value={editingRoom.image_url || ''}
              onChange={(e) => setEditingRoom({ ...editingRoom, image_url: e.target.value })}
            />

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Deskripsi
              </label>
              <textarea
                value={editingRoom.description || ''}
                onChange={(e) => setEditingRoom({ ...editingRoom, description: e.target.value })}
                rows={2}
                className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-lg text-stone-900"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="amber" size="sm">
                Simpan Kamar
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
