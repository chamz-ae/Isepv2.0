import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { GallerySubmission } from '@/lib/supabase/types';
import { getOrderByBookingCode } from './orderService';

export const INITIAL_GALLERY: GallerySubmission[] = [
  {
    id: 'gal_01',
    booking_code: 'ASAP-261001-7F4K',
    guest_name: 'Bagas & Ratih',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    caption: 'Malam syahdu di teras kabin ditemani brisket asap 14 jam dan kehangatan api unggun.',
    category: 'stay',
    status: 'approved',
    consent_granted: true,
    submitted_at: new Date().toISOString(),
    reviewed_at: new Date().toISOString(),
    reviewed_by: 'Owner',
  },
  {
    id: 'gal_02',
    booking_code: 'ASAP-261002-9P3M',
    guest_name: 'Chef Dimas',
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    caption: 'Smoke ring merah merona dan bark hitam beraroma kayu rambutan. Daging lumer seketika.',
    category: 'dining',
    status: 'approved',
    consent_granted: true,
    submitted_at: new Date().toISOString(),
    reviewed_at: new Date().toISOString(),
    reviewed_by: 'Admin',
  },
  {
    id: 'gal_03',
    booking_code: 'ASAP-261004-2K8X',
    guest_name: 'Keluarga Mahendra',
    image_url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    caption: 'Santap siang bersama keluarga di lereng Cisarua. Ubi madu asap dan marlin asap istimewa.',
    category: 'dining',
    status: 'approved',
    consent_granted: true,
    submitted_at: new Date().toISOString(),
    reviewed_at: new Date().toISOString(),
    reviewed_by: 'Owner',
  },
];

export async function getApprovedGallery(): Promise<GallerySubmission[]> {
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('gallery_submissions')
        .select('*')
        .eq('status', 'approved')
        .order('submitted_at', { ascending: false });
      if (!error && data && data.length > 0) return data as GallerySubmission[];
    } catch {
      // Fallback
    }
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('asap_gallery_store');
    if (stored) {
      const list: GallerySubmission[] = JSON.parse(stored);
      return list.filter((g) => g.status === 'approved');
    }
    localStorage.setItem('asap_gallery_store', JSON.stringify(INITIAL_GALLERY));
  }

  return INITIAL_GALLERY;
}

export async function getAllGallerySubmissions(): Promise<GallerySubmission[]> {
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('gallery_submissions').select('*').order('submitted_at', { ascending: false });
      if (!error && data) return data as GallerySubmission[];
    } catch {
      // Fallback
    }
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('asap_gallery_store');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('asap_gallery_store', JSON.stringify(INITIAL_GALLERY));
  }

  return INITIAL_GALLERY;
}

export async function submitGalleryMoment(params: {
  bookingCode: string;
  guestName: string;
  imageUrl: string;
  caption: string;
  category: 'dining' | 'stay';
  consentGranted: boolean;
}): Promise<GallerySubmission> {
  // Validate booking code
  const order = await getOrderByBookingCode(params.bookingCode);
  if (!order) {
    throw new Error('Kode pemesanan (Booking Code) tidak valid atau tidak ditemukan di sistem.');
  }

  if (!params.consentGranted) {
    throw new Error('Persetujuan publikasi foto diperlukan untuk mengunggah ke galeri.');
  }

  const submission: GallerySubmission = {
    id: 'gal_' + Date.now(),
    booking_code: params.bookingCode.toUpperCase(),
    guest_name: params.guestName || order.guest_name,
    image_url: params.imageUrl,
    caption: params.caption,
    category: params.category,
    status: 'pending',
    consent_granted: params.consentGranted,
    submitted_at: new Date().toISOString(),
  };

  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('gallery_submissions')
        .insert({
          booking_code: submission.booking_code,
          guest_name: submission.guest_name,
          image_url: submission.image_url,
          caption: submission.caption,
          category: submission.category,
          status: 'pending',
          consent_granted: true,
        })
        .select()
        .single();
      if (!error && data) return data as GallerySubmission;
    } catch (err) {
      console.error('Error submitting gallery:', err);
    }
  }

  if (typeof window !== 'undefined') {
    const existing: GallerySubmission[] = JSON.parse(localStorage.getItem('asap_gallery_store') || '[]');
    localStorage.setItem('asap_gallery_store', JSON.stringify([submission, ...existing]));
  }

  return submission;
}

export async function updateGalleryStatus(id: string, status: 'approved' | 'rejected', reviewedBy: string): Promise<void> {
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      await supabase
        .from('gallery_submissions')
        .update({
          status,
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);
    } catch {
      // Fallback
    }
  }

  if (typeof window !== 'undefined') {
    const existing: GallerySubmission[] = JSON.parse(localStorage.getItem('asap_gallery_store') || '[]');
    const updated = existing.map((g) =>
      g.id === id ? { ...g, status, reviewed_by: reviewedBy, reviewed_at: new Date().toISOString() } : g
    );
    localStorage.setItem('asap_gallery_store', JSON.stringify(updated));
  }
}
