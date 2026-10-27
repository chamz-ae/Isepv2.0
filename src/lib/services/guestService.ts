import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Guest } from '@/lib/supabase/types';

export async function getGuests(searchQuery?: string): Promise<Guest[]> {
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      let query = supabase.from('guests').select('*');
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim();
        query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`);
      }
      const { data, error } = await query.order('last_visit_at', { ascending: false, nullsFirst: false });
      if (!error && data) return data as Guest[];
    } catch {
      // Fallback
    }
  }

  // Local storage fallback
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('asap_guests_store');
    if (stored) {
      try {
        const list: Guest[] = JSON.parse(stored);
        if (searchQuery && searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          return list.filter((g) => g.name.toLowerCase().includes(q) || g.phone.includes(q));
        }
        return list;
      } catch {
        // Fallback
      }
    }
  }

  return [];
}

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isValidUuid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function findOrCreateGuest(guestData: { name: string; phone: string; email?: string; notes?: string }): Promise<Guest> {
  const cleanPhone = guestData.phone.trim();
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      const { data: existing } = await supabase.from('guests').select('*').eq('phone', cleanPhone).maybeSingle();
      if (existing) {
        return existing as Guest;
      }
      const { data: created, error } = await supabase
        .from('guests')
        .insert({
          name: guestData.name.trim(),
          phone: cleanPhone,
          email: guestData.email?.trim() || null,
          notes: guestData.notes || null,
          valid_visits_count: 0,
          is_loyal: false,
          total_spend: 0,
        })
        .select()
        .single();
      if (!error && created) return created as Guest;
    } catch {
      // Fallback
    }
  }

  // Local storage fallback
  let all: Guest[] = [];
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('asap_guests_store');
    if (stored) {
      try {
        all = JSON.parse(stored);
      } catch {
        all = [];
      }
    }
  }

  const found = all.find((g) => g.phone === cleanPhone);
  if (found) return found;

  const newGuest: Guest = {
    id: generateUuid(),
    name: guestData.name.trim(),
    phone: cleanPhone,
    email: guestData.email?.trim() || null,
    notes: guestData.notes || null,
    valid_visits_count: 0,
    is_loyal: false,
    total_spend: 0,
    last_visit_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  all.push(newGuest);
  if (typeof window !== 'undefined') {
    localStorage.setItem('asap_guests_store', JSON.stringify(all));
  }
  return newGuest;
}

export async function updateGuestVisitStats(guestId: string, additionalSpend: number): Promise<void> {
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      const { data: guest } = await supabase.from('guests').select('valid_visits_count, total_spend').eq('id', guestId).single();
      if (guest) {
        const newVisits = (guest.valid_visits_count || 0) + 1;
        await supabase
          .from('guests')
          .update({
            valid_visits_count: newVisits,
            is_loyal: newVisits >= 2, // Pelanggan Setia if valid_visits_count >= 2
            total_spend: (guest.total_spend || 0) + additionalSpend,
            last_visit_at: new Date().toISOString(),
          })
          .eq('id', guestId);
      }
    } catch {
      // Fallback
    }
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('asap_guests_store');
    if (stored) {
      const all: Guest[] = JSON.parse(stored);
      const updated = all.map((g) => {
        if (g.id === guestId) {
          const newVisits = g.valid_visits_count + 1;
          return {
            ...g,
            valid_visits_count: newVisits,
            is_loyal: newVisits >= 2,
            total_spend: g.total_spend + additionalSpend,
            last_visit_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        return g;
      });
      localStorage.setItem('asap_guests_store', JSON.stringify(updated));
    }
  }
}
