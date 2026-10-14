'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Image as ImageIcon, Check, X, Clock, ShieldCheck } from 'lucide-react';
import { getAllGallerySubmissions, updateGalleryStatus } from '@/lib/services/galleryService';
import { GallerySubmission } from '@/lib/supabase/types';
import { formatDateTimeWIB } from '@/lib/utils/formatters';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminGalleryPage() {
  const [submissions, setSubmissions] = useState<GallerySubmission[]>([]);
  const [tab, setTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const list = await getAllGallerySubmissions();
    setSubmissions(list);
  }

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    await updateGalleryStatus(id, status, 'Admin Moderator');
    loadData();
  };

  const filtered = submissions.filter((s) => (tab === 'all' ? true : s.status === tab));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-amber-600" />
            <span>Moderasi Galeri & Foto Tamu</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Validasi persetujuan foto momen tamu yang diunggah menggunakan Booking Code sebelum tayang ke publik.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-stone-300 rounded-lg p-1 text-xs font-semibold">
          <button
            onClick={() => setTab('all')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              tab === 'all' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Semua ({submissions.length})
          </button>
          <button
            onClick={() => setTab('pending')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              tab === 'pending' ? 'bg-amber-600 text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Menunggu Review ({submissions.filter((s) => s.status === 'pending').length})
          </button>
          <button
            onClick={() => setTab('approved')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              tab === 'approved' ? 'bg-emerald-700 text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Disetujui ({submissions.filter((s) => s.status === 'approved').length})
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Tidak Ada Pengajuan Foto"
          description="Belum ada foto tamu pada kategori ini."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <Card key={item.id} className="p-0 overflow-hidden flex flex-col justify-between">
              <div className="relative w-full h-48 bg-stone-100">
                <Image src={item.image_url} alt={item.guest_name} fill className="object-cover" />
                <div className="absolute top-2.5 right-2.5">
                  <Badge
                    variant={
                      item.status === 'approved'
                        ? 'success'
                        : item.status === 'pending'
                        ? 'warning'
                        : 'danger'
                    }
                    size="sm"
                  >
                    {item.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 text-sm">{item.guest_name}</span>
                    <span className="font-mono text-stone-400 text-xs">{item.booking_code}</span>
                  </div>
                  {item.caption && (
                    <p className="text-xs text-stone-600 mt-2 italic line-clamp-3">
                      &quot;{item.caption}&quot;
                    </p>
                  )}
                  <div className="text-[10px] text-stone-400 mt-2">
                    Diunggah: {formatDateTimeWIB(item.submitted_at)}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                  {item.status !== 'approved' && (
                    <Button variant="amber" size="sm" onClick={() => handleAction(item.id, 'approved')}>
                      <Check className="w-3.5 h-3.5 mr-1" />
                      <span>Setujui (Tayang)</span>
                    </Button>
                  )}
                  {item.status !== 'rejected' && (
                    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleAction(item.id, 'rejected')}>
                      <X className="w-3.5 h-3.5 mr-1" />
                      <span>Tolak</span>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
