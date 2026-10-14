'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Plus, Edit, CheckCircle, XCircle, UtensilsCrossed, Filter } from 'lucide-react';
import { getMenus, saveMenuItem, toggleMenuAvailability, INITIAL_CATEGORIES } from '@/lib/services/menuService';
import { MenuItem, MeatType, PriceBasis } from '@/lib/supabase/types';
import { formatRupiah, formatGram } from '@/lib/utils/formatters';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';

export default function AdminMenuPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [filterScope, setFilterScope] = useState<'all' | 'restaurant' | 'lodging'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [filterScope]);

  async function loadData() {
    setIsLoading(true);
    try {
      const data = await getMenus({ accessScope: filterScope, activeOnly: false });
      setMenus(data);
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenAdd = () => {
    setEditingItem({
      name: '',
      description: '',
      category_id: INITIAL_CATEGORIES[0]?.id || '',
      access_scope: 'restaurant',
      price: 0,
      price_basis: 'per_portion',
      meat_type: 'none',
      standard_meat_gram: 0,
      min_meat_gram: 0,
      is_fixed_gram: false,
      is_available: true,
      is_active: true,
      image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    await toggleMenuAvailability(item.id, !item.is_available);
    loadData();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name || editingItem.price === undefined) return;
    await saveMenuItem(editingItem);
    setIsModalOpen(false);
    setEditingItem(null);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Manajemen Master Menu</h1>
          <p className="text-xs text-stone-500 mt-1">
            Konfigurasi menu restoran & penginapan, gramasi daging, dasar harga, dan ketersediaan fisik.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-stone-300 rounded-lg p-1 text-xs font-semibold">
            <button
              onClick={() => setFilterScope('all')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterScope === 'all' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Semua Menu
            </button>
            <button
              onClick={() => setFilterScope('restaurant')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterScope === 'restaurant' ? 'bg-amber-600 text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Restoran
            </button>
            <button
              onClick={() => setFilterScope('lodging')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterScope === 'lodging' ? 'bg-sky-700 text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Penginapan
            </button>
          </div>
          <Button variant="amber" size="sm" onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-1" />
            <span>Tambah Menu</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {menus.map((item) => (
          <Card key={item.id} className="flex flex-col justify-between overflow-hidden p-0">
            {item.image_url && (
              <div className="relative w-full h-40 bg-stone-100">
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                  <Badge variant={item.access_scope === 'restaurant' ? 'amber' : 'info'} size="sm">
                    {item.access_scope === 'restaurant' ? 'Restoran' : 'Penginapan'}
                  </Badge>
                  <Badge variant={item.is_available ? 'success' : 'danger'} size="sm">
                    {item.is_available ? 'Ready' : 'Habis'}
                  </Badge>
                </div>
              </div>
            )}

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-sm tracking-tight">{item.name}</h3>
                <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="font-bold text-stone-900 text-sm">
                    {item.price_range_min && item.price_range_max
                      ? `${formatRupiah(item.price_range_min)} – ${formatRupiah(item.price_range_max)}`
                      : formatRupiah(item.price)}
                    <span className="text-[10px] text-stone-400 font-normal ml-1">
                      /{item.price_basis === 'per_100g' || item.price_basis === 'per_gram' ? '100gr' : item.price_basis === 'per_ekor' ? '1 ekor' : 'porsi'}
                    </span>
                  </div>

                  {item.meat_type !== 'none' && (
                    <span className="text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                      🥩 {item.meat_type.toUpperCase()} ({item.is_fixed_gram ? `Fixed ${item.standard_meat_gram}g` : `Fleksibel`})
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={() => handleToggleAvailable(item)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors ${
                    item.is_available
                      ? 'text-red-700 hover:bg-red-50'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {item.is_available ? 'Tandai Habis' : 'Tandai Ready'}
                </button>
                <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(item)}>
                  <Edit className="w-3.5 h-3.5 mr-1" />
                  <span>Edit</span>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && editingItem && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItem.id ? 'Edit Menu' : 'Tambah Menu Baru'}
          maxWidth="lg"
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <Input
              label="Nama Menu"
              value={editingItem.name || ''}
              onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Deskripsi Menu
              </label>
              <textarea
                value={editingItem.description || ''}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                rows={2}
                className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Jenis Daging"
                value={editingItem.meat_type || 'none'}
                onChange={(e) => {
                  const val = e.target.value as MeatType;
                  setEditingItem({
                    ...editingItem,
                    meat_type: val,
                    price_basis: val !== 'none' ? 'per_100g' : 'per_portion',
                    standard_meat_gram: val !== 'none' ? 100 : 0,
                    min_meat_gram: val !== 'none' ? 100 : 0,
                  });
                }}
              >
                <option value="none">Bukan Daging (Non-Meat)</option>
                <option value="brisket">Brisket Sapi</option>
                <option value="lidah_sapi">Lidah Sapi</option>
                <option value="domba">Domba</option>
                <option value="ayam">Ayam</option>
                <option value="bebek">Bebek</option>
                <option value="salmon">Salmon</option>
                <option value="marlin">Marlin</option>
                <option value="lele">Lele</option>
              </Select>

              {/* Requirement 3.2: Opsi 1 ekor, per 100gr, per porsi ketika menu berkaitan dengan daging */}
              <Select
                label="Dasar Harga (Satuan)"
                value={editingItem.price_basis || 'per_portion'}
                onChange={(e) => setEditingItem({ ...editingItem, price_basis: e.target.value as any })}
              >
                {editingItem.meat_type !== 'none' ? (
                  <>
                    <option value="per_100g">Per 100gr (Daging Fleksibel)</option>
                    <option value="per_ekor">1 Ekor (Unggas / Utuh)</option>
                    <option value="per_portion">Per Porsi (Porsi Tetap)</option>
                  </>
                ) : (
                  <>
                    <option value="per_portion">Per Porsi</option>
                    <option value="per_package">Per Paket</option>
                  </>
                )}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Akses Scope"
                value={editingItem.access_scope || 'restaurant'}
                onChange={(e) => setEditingItem({ ...editingItem, access_scope: e.target.value as any })}
              >
                <option value="restaurant">Restoran</option>
                <option value="lodging">Khusus Penginapan</option>
                <option value="both">Keduanya (Resto & Inap)</option>
              </Select>

              <Input
                label={
                  editingItem.price_basis === 'per_100g' || editingItem.price_basis === 'per_gram'
                    ? 'Harga per 100gr (Rp)'
                    : editingItem.price_basis === 'per_ekor'
                    ? 'Harga per 1 Ekor (Rp)'
                    : 'Harga per Porsi (Rp)'
                }
                type="number"
                value={editingItem.price ?? 0}
                onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            {editingItem.meat_type !== 'none' && (
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_fixed_gram"
                    checked={editingItem.is_fixed_gram || false}
                    onChange={(e) => setEditingItem({ ...editingItem, is_fixed_gram: e.target.checked })}
                    className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                  />
                  <label htmlFor="is_fixed_gram" className="font-semibold text-stone-800">
                    Gramasi Fixed (Contoh: Nasi Goreng Daging Asap fixed 30g)
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Standard Gram / Porsi"
                    type="number"
                    value={editingItem.standard_meat_gram ?? 100}
                    onChange={(e) => setEditingItem({ ...editingItem, standard_meat_gram: parseFloat(e.target.value) || 0 })}
                  />
                  <Input
                    label="Minimum Gram"
                    type="number"
                    value={editingItem.min_meat_gram ?? 100}
                    onChange={(e) => setEditingItem({ ...editingItem, min_meat_gram: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            )}

            <Input
              label="URL Foto Menu"
              value={editingItem.image_url || ''}
              onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="amber" size="sm">
                Simpan Master Menu
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
