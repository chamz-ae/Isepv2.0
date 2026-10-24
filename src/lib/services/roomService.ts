import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Room, RestaurantTable } from '@/lib/supabase/types';

// Default initial official rooms
export const INITIAL_ROOMS: Room[] = [
  {
    id: 'r0000001-0000-0000-0000-000000000001',
    room_number: 'LODGE-01',
    room_name: 'Timber Haven Suite',
    room_type: 'Deluxe Timber Lodge',
    price_per_night: 200000, // Rp200.000 per person standard base
    capacity: 2,
    description: 'Kabin kayu jati reclaimed dengan perapian teras, pemandangan kebun kayu rambutan, dan king bed bertabur linen organik.',
    facilities: ['King Size Bed', 'Teras Perapian Kayu', 'Rain Shower Air Panas', 'Espresso Machine', 'High-Speed Wi-Fi'],
    status: 'available',
    image_url: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'r0000002-0000-0000-0000-000000000002',
    room_number: 'LODGE-02',
    room_name: 'The Smoke Master Sanctuary',
    room_type: 'Sanctuary Suite',
    price_per_night: 200000,
    capacity: 4,
    description: 'Vila kayu dua lantai dengan ruang loteng santai, outdoor stone bathtub di bawah naungan bambu, dan balkon pemandangan pit asap.',
    facilities: ['2 Queen Beds', 'Outdoor Stone Bathtub', 'Balkon Veranda', 'Lounge Loteng', 'Akses Menu Penginapan'],
    status: 'available',
    image_url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'r0000003-0000-0000-0000-000000000003',
    room_number: 'LODGE-03',
    room_name: 'Cottage Embun Pinus',
    room_type: 'Rustic Forest Cabin',
    price_per_night: 200000,
    capacity: 2,
    description: 'Suasana hening di lereng pinus berkabut dengan ketenangan alami. Dilengkapi dek santai kayu terbuka.',
    facilities: ['Queen Size Bed', 'Dek Hutan Terbuka', 'Hot Herbal Shower', 'Keranjang Kopi Seduh', 'Speaker Akustik'],
    status: 'available',
    image_url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_TABLES: RestaurantTable[] = [
  { id: 't001', table_number: 'MEJA-01', capacity: 2, status: 'available', location_notes: 'Indoor Utama - Dekat Kasir', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 't002', table_number: 'MEJA-02', capacity: 4, status: 'available', location_notes: 'Indoor Utama - Jendela Luar', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 't003', table_number: 'MEJA-03', capacity: 4, status: 'available', location_notes: 'Outdoor Pergola - Dekat Smoker Pit', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 't004', table_number: 'MEJA-04', capacity: 6, status: 'available', location_notes: 'Outdoor Deck - Area Keluarga', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 't005', table_number: 'MEJA-05', capacity: 8, status: 'available', location_notes: 'VIP Gazebo Kayu Jati', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export async function getRooms(options?: { activeOnly?: boolean; checkIn?: string; checkOut?: string }): Promise<Room[]> {
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      let query = supabase.from('rooms').select('*');
      if (options?.activeOnly !== false) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query.order('room_number', { ascending: true });
      if (!error && data && data.length > 0) {
        const rooms = data as Room[];
        if (options?.checkIn && options?.checkOut) {
          // Filter by availability
          const availableRooms: Room[] = [];
          for (const r of rooms) {
            const isAvail = await checkRoomDateAvailability(r.id, options.checkIn, options.checkOut);
            if (isAvail) availableRooms.push(r);
          }
          return availableRooms;
        }
        return rooms;
      }
    } catch {
      // Fallback
    }
  }

  // Local storage fallback
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('asap_rooms_store');
    if (stored) {
      try {
        const rooms: Room[] = JSON.parse(stored);
        return options?.activeOnly !== false ? rooms.filter((r) => r.is_active) : rooms;
      } catch {
        // Fallback
      }
    }
    localStorage.setItem('asap_rooms_store', JSON.stringify(INITIAL_ROOMS));
  }

  return options?.activeOnly !== false ? INITIAL_ROOMS.filter((r) => r.is_active) : INITIAL_ROOMS;
}

export async function checkRoomDateAvailability(roomId: string, checkIn: string, checkOut: string, excludeOrderId?: string): Promise<boolean> {
  if (!checkIn || !checkOut) return true;
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('rpc_check_room_availability', {
        p_room_id: roomId,
        p_check_in: checkIn,
        p_check_out: checkOut,
        p_exclude_order_id: excludeOrderId || null,
      });
      if (!error && typeof data === 'boolean') return data;
    } catch {
      // Fallback
    }
  }

  // Local check against existing orders in localStorage
  if (typeof window !== 'undefined') {
    const storedOrders = localStorage.getItem('asap_orders_store');
    if (storedOrders) {
      const orders = JSON.parse(storedOrders);
      const conflict = orders.some((o: any) => {
        if (o.room_id !== roomId) return false;
        if (o.order_status === 'cancelled') return false;
        if (excludeOrderId && o.id === excludeOrderId) return false;
        if (!o.check_in_date || !o.check_out_date) return false;
        return o.check_in_date < checkOut && o.check_out_date > checkIn;
      });
      return !conflict;
    }
  }

  return true;
}

export async function getTables(): Promise<RestaurantTable[]> {
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('restaurant_tables').select('*').order('table_number', { ascending: true });
      if (!error && data && data.length > 0) return data as RestaurantTable[];
    } catch {
      // Fallback
    }
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('asap_tables_store');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fallback
      }
    }
    localStorage.setItem('asap_tables_store', JSON.stringify(INITIAL_TABLES));
  }

  return INITIAL_TABLES;
}

export async function updateRoom(room: Partial<Room>): Promise<Room> {
  const configured = isSupabaseConfigured();
  if (configured && room.id) {
    const supabase = createClient();
    const { data } = await supabase.from('rooms').update(room).eq('id', room.id).select().single();
    if (data) return data as Room;
  }

  const all = await getRooms({ activeOnly: false });
  let updatedRoom: Room;
  if (room.id) {
    updatedRoom = { ...all.find((r) => r.id === room.id)!, ...room, updated_at: new Date().toISOString() } as Room;
    const list = all.map((r) => (r.id === room.id ? updatedRoom : r));
    if (typeof window !== 'undefined') localStorage.setItem('asap_rooms_store', JSON.stringify(list));
  } else {
    updatedRoom = {
      ...room,
      id: 'r_' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Room;
    const list = [...all, updatedRoom];
    if (typeof window !== 'undefined') localStorage.setItem('asap_rooms_store', JSON.stringify(list));
  }
  return updatedRoom;
}

function isValidUUID(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export async function saveTable(table: Partial<RestaurantTable>): Promise<RestaurantTable> {
  const configured = isSupabaseConfigured();
  if (configured) {
    try {
      const supabase = createClient();
      if (table.id && isValidUUID(table.id)) {
        const { data, error } = await supabase
          .from('restaurant_tables')
          .update({
            table_number: table.table_number,
            capacity: table.capacity,
            status: table.status,
            location_notes: table.location_notes,
            is_active: table.is_active ?? true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', table.id)
          .select()
          .single();
        if (!error && data) return data as RestaurantTable;
      } else {
        const { data, error } = await supabase
          .from('restaurant_tables')
          .insert({
            table_number: table.table_number || 'Meja Baru',
            capacity: table.capacity || 4,
            status: table.status || 'available',
            location_notes: table.location_notes || null,
            is_active: table.is_active ?? true,
          })
          .select()
          .single();
        if (!error && data) return data as RestaurantTable;
      }
    } catch (err) {
      console.warn('Supabase saveTable fallback to local store:', err);
    }
  }

  const all = await getTables();
  let saved: RestaurantTable;
  if (table.id) {
    saved = { ...all.find((t) => t.id === table.id)!, ...table, updated_at: new Date().toISOString() } as RestaurantTable;
    const list = all.map((t) => (t.id === table.id ? saved : t));
    if (typeof window !== 'undefined') localStorage.setItem('asap_tables_store', JSON.stringify(list));
  } else {
    saved = {
      ...table,
      id: 't_' + Date.now(),
      table_number: table.table_number || `Meja ${all.length + 1}`,
      capacity: table.capacity || 4,
      status: table.status || 'available',
      location_notes: table.location_notes || '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as RestaurantTable;
    const list = [...all, saved];
    if (typeof window !== 'undefined') localStorage.setItem('asap_tables_store', JSON.stringify(list));
  }
  return saved;
}

export async function deleteTable(id: string): Promise<boolean> {
  const configured = isSupabaseConfigured();
  if (configured && isValidUUID(id)) {
    try {
      const supabase = createClient();
      await supabase.from('restaurant_tables').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteTable fallback to local store:', err);
    }
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('asap_tables_store');
    if (stored) {
      try {
        const list: RestaurantTable[] = JSON.parse(stored);
        const filtered = list.filter((t) => t.id !== id);
        localStorage.setItem('asap_tables_store', JSON.stringify(filtered));
      } catch {
        // Fallback
      }
    }
  }
  return true;
}

