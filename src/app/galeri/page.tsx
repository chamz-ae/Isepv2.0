'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Image as ImageIcon, UploadCloud, CheckCircle2, ShieldCheck, Heart } from 'lucide-react';
import { getApprovedGallery, submitGalleryMoment } from '@/lib/services/galleryService';
import { GallerySubmission } from '@/lib/supabase/types';
import { formatDateTimeWIB } from '@/lib/utils/formatters';
import { CustomerFooter } from '@/components/customer/CustomerFooter';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

export default function CustomerGaleriPage() {
  const [moments, setMoments] = useState<GallerySubmission[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form upload
  const [bookingCode, setBookingCode] = useState('');
  const [guestName, setGuestName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<'dining' | 'stay'>('dining');
  const [consent, setConsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadGallery();
  }, []);

  async function loadGallery() {
    const list = await getApprovedGallery();
    setMoments(list);
  }

  const handleSubmitPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!bookingCode.trim() || !imageUrl.trim()) {
      setStatusMessage({ type: 'error', text: 'Booking code dan tautan foto wajib diisi.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitGalleryMoment({
        bookingCode,
        guestName,
        imageUrl,
        caption,
        category,
        consentGranted: consent,
      });

      setStatusMessage({
        type: 'success',
        text: 'Foto Anda berhasil dikirim dan sedang ditinjau oleh tim moderator ASAP ISEP sebelum tayang!',
      });
      setBookingCode('');
      setImageUrl('');
      setCaption('');
      setTimeout(() => {
        setIsModalOpen(false);
        setStatusMessage(null);
      }, 3000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Gagal mengunggah foto.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-forest-950 text-stone-100 flex flex-col justify-between selection:bg-emerald-600 selection:text-white">
      <div className="max-w-7xl mx-auto px-6 py-12 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12 border-b border-forest-800/50 pb-8">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-emerald-400 font-bold">
              GALERI & MOMEN FOOD FOREST
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-light text-stone-50 mt-1">
              Kenangan di Antara Rimba Asap
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 font-light mt-2 max-w-xl leading-relaxed">
              Koleksi foto autentik dari para penikmat smokehouse dan penghuni kabin kayu. Hanya foto yang telah diverifikasi melalui Booking Code resmi yang ditampilkan.
            </p>
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-forest-950 font-bold text-xs uppercase tracking-wider font-mono py-3 px-6 rounded-full shadow-lg"
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            <span>Unggah Momen (Pakai Booking Code)</span>
          </Button>
        </div>

        {/* Gallery Masonry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {moments.map((item) => (
            <div
              key={item.id}
              className="group bg-forest-900/40 border border-forest-800/70 rounded-3xl overflow-hidden shadow-xl hover:border-emerald-600/40 transition-all flex flex-col justify-between backdrop-blur-md"
            >
              <div className="relative aspect-[4/3] bg-forest-950 overflow-hidden">
                <Image
                  src={item.image_url}
                  alt={item.guest_name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] bg-forest-950/90 text-emerald-300 border border-forest-800 px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider">
                    {item.category === 'stay' ? '🌲 Stay Experience' : '🥩 Smokehouse Dining'}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xl font-light text-stone-100">{item.guest_name}</h3>
                  {item.caption && (
                    <p className="text-xs text-stone-300/80 mt-2 font-light italic leading-relaxed">
                      &quot;{item.caption}&quot;
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-forest-800/50 flex items-center justify-between text-[11px] text-stone-400 font-mono">
                  <span>{item.booking_code}</span>
                  <div className="flex items-center gap-1 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Terverifikasi</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Upload Moment */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Unggah Momen Anda ke Galeri"
          subtitle="Masukkan Booking Code resmi Anda sebagai verifikasi keaslian kunjungan"
          maxWidth="md"
        >
          <form onSubmit={handleSubmitPhoto} className="space-y-4 text-xs">
            {statusMessage && (
              <div
                className={`p-3 rounded-lg ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-950 border border-emerald-700 text-emerald-300'
                    : 'bg-red-950 border border-red-700 text-red-300'
                }`}
              >
                {statusMessage.text}
              </div>
            )}

            <Input
              label="Kode Pemesanan (Booking Code) *"
              placeholder="Contoh: ASAP-261010-7F4K"
              value={bookingCode}
              onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
              required
              helperText="Terdapat pada ringkasan pemesanan atau chat WhatsApp"
            />

            <Input
              label="Nama Pengunggah (Opsional)"
              placeholder="Nama Anda atau keluarga"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />

            <Input
              label="URL Tautan Foto (Supabase / Gambar Publik) *"
              placeholder="https://images.unsplash.com/photo-..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Kategori Momen
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-stone-800 font-medium">
                  <input
                    type="radio"
                    name="category"
                    checked={category === 'dining'}
                    onChange={() => setCategory('dining')}
                    className="text-amber-600"
                  />
                  <span>Daging Asap (Dining)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-stone-800 font-medium">
                  <input
                    type="radio"
                    name="category"
                    checked={category === 'stay'}
                    onChange={() => setCategory('stay')}
                    className="text-amber-600"
                  />
                  <span>Kabin Menginap (Stay)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Cerita Singkat / Caption
              </label>
              <textarea
                rows={2}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Ceritakan momen terbaik Anda saat berkunjung..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-stone-200">
              <input
                type="checkbox"
                id="consent_checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                required
              />
              <label htmlFor="consent_checkbox" className="text-stone-700 leading-snug">
                Saya memberikan izin kepada ASAP ISEP untuk menampilkan foto ini di situs publik setelah disetujui moderator.
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="amber" size="sm" isLoading={isSubmitting}>
                Kirim Foto untuk Ditinjau
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <CustomerFooter />
    </div>
  );
}
