'use client';

import React, { useEffect, useState } from 'react';
import { Truck, Plus, Phone, MapPin, Edit } from 'lucide-react';
import { getSuppliers, saveSupplier } from '@/lib/services/purchasingService';
import { Supplier } from '@/lib/supabase/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSup, setEditingSup] = useState<Partial<Supplier> | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const list = await getSuppliers();
    setSuppliers(list);
  }

  const handleOpenAdd = () => {
    setEditingSup({
      supplier_name: '',
      contact_person: '',
      phone: '',
      address: '',
      notes: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSup({ ...sup });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSup || !editingSup.supplier_name || !editingSup.phone) return;
    await saveSupplier(editingSup);
    setIsModalOpen(false);
    setEditingSup(null);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-600" />
            <span>Manajemen Data Supplier</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Daftar mitra pemasok daging sapi/ayam/ikan, kayu rambutan, dan pasokan operasional.
          </p>
        </div>
        <Button variant="amber" size="sm" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-1" />
          <span>Tambah Supplier Baru</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((sup) => (
          <Card key={sup.id} className="flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">{sup.supplier_name}</h3>
                  <span className="text-xs text-stone-500 mt-0.5 block">PIC: {sup.contact_person || '-'}</span>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-stone-600">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span>{sup.phone}</span>
                </div>
                {sup.address && (
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{sup.address}</span>
                  </div>
                )}
                {sup.notes && <div className="text-[11px] text-stone-500 italic mt-1">{sup.notes}</div>}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(sup)}>
                <Edit className="w-3.5 h-3.5 mr-1" />
                <span>Edit</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {isModalOpen && editingSup && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingSup.id ? 'Edit Supplier' : 'Tambah Supplier Baru'}
          maxWidth="md"
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <Input
              label="Nama Perusahaan / Supplier"
              placeholder="Contoh: PT Nusantara Prime Meat"
              value={editingSup.supplier_name || ''}
              onChange={(e) => setEditingSup({ ...editingSup, supplier_name: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Nama Kontak (PIC)"
                placeholder="Contoh: Pak Hendra"
                value={editingSup.contact_person || ''}
                onChange={(e) => setEditingSup({ ...editingSup, contact_person: e.target.value })}
              />
              <Input
                label="Nomor Telepon / WhatsApp"
                placeholder="0812xxxx"
                value={editingSup.phone || ''}
                onChange={(e) => setEditingSup({ ...editingSup, phone: e.target.value })}
                required
              />
            </div>
            <Input
              label="Alamat Gudang / Lokasi"
              value={editingSup.address || ''}
              onChange={(e) => setEditingSup({ ...editingSup, address: e.target.value })}
            />
            <Input
              label="Catatan Kualitas / Spesialisasi"
              placeholder="Contoh: Pemasok brisket grade MB4+ halal"
              value={editingSup.notes || ''}
              onChange={(e) => setEditingSup({ ...editingSup, notes: e.target.value })}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="amber" size="sm">
                Simpan Data Supplier
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
