import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { MenuItem, MenuCategory } from '@/lib/supabase/types';

// Default initial official menus as specified in Master Prompt
export const INITIAL_OFFICIAL_MENUS: MenuItem[] = [
  // Restoran
  {
    id: 'm0000001-0000-0000-0000-000000000001',
    category_id: 'c0000001-0000-0000-0000-000000000001',
    name: 'Brisket Asap',
    description: 'Brisket sapi pilihan diasap lambat dengan kayu keras lokal hingga bark renyah gurih dan smoke ring sempurna.',
    access_scope: 'restaurant',
    price: 20000,
    price_basis: 'per_100g',
    meat_type: 'brisket',
    standard_meat_gram: 100,
    min_meat_gram: 100,
    is_fixed_gram: false,
    is_available: true,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm0000002-0000-0000-0000-000000000002',
    category_id: 'c0000001-0000-0000-0000-000000000001',
    name: 'Lidah Sapi Asap',
    description: 'Lidah sapi empuk lumer beraroma asap pekat rempah Nusantara.',
    access_scope: 'restaurant',
    price: 65000,
    price_basis: 'per_100g',
    meat_type: 'lidah_sapi',
    standard_meat_gram: 100,
    min_meat_gram: 100,
    is_fixed_gram: false,
    is_available: true,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm0000003-0000-0000-0000-000000000001',
    category_id: 'c0000001-0000-0000-0000-000000000001',
    name: 'Domba Asap Bumbu Kerecek',
    description: 'Daging domba empuk diasap wangi berpadu kuah kerecek pedas gurih khas.',
    access_scope: 'restaurant',
    price: 75000,
    price_basis: 'per_100g',
    meat_type: 'domba',
    standard_meat_gram: 100,
    min_meat_gram: 100,
    is_fixed_gram: false,
    is_available: true,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm0000004-0000-0000-0000-000000000001',
    category_id: 'c0000001-0000-0000-0000-000000000001',
    name: 'Ayam Asap',
    description: 'Ayam utuh diasap perlahan dengan rempah asap spesial, kulit mengkilap dan daging juicy.',
    access_scope: 'restaurant',
    price: 150000,
    price_basis: 'per_ekor',
    meat_type: 'ayam',
    standard_meat_gram: 0,
    min_meat_gram: 0,
    is_fixed_gram: false,
    is_available: true,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm0000005-0000-0000-0000-000000000001',
    category_id: 'c0000001-0000-0000-0000-000000000001',
    name: 'Bebek Asap',
    description: 'Bebek pilihan dengan bumbu meresap hingga ke serat, diasap dengan kayu pilihan.',
    access_scope: 'restaurant',
    price: 145000,
    price_basis: 'per_ekor',
    meat_type: 'bebek',
    standard_meat_gram: 0,
    min_meat_gram: 0,
    is_fixed_gram: false,
    is_available: true,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm0000006-0000-0000-0000-000000000001',
    category_id: 'c0000001-0000-0000-0000-000000000001',
    name: 'Salmon Asap',
    description: 'Fillet salmon diasap lembut suhu terjaga, gurih luhur dengan aroma kayu segar.',
    access_scope: 'restaurant',
    price: 120000,
    price_basis: 'per_100g',
    meat_type: 'salmon',
    standard_meat_gram: 100,
    min_meat_gram: 100,
    is_fixed_gram: false,
    is_available: true,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm0000007-0000-0000-0000-000000000001',
    category_id: 'c0000002-0000-0000-0000-000000000002',
    name: 'Sup Jamur Labu Asap',
    description: 'Sup hangat labu parang panggang dan jamur hutan beraroma asap alami.',
    access_scope: 'restaurant',
    price: 80000,
    price_basis: 'per_portion',
    price_range_min: 80000,
    price_range_max: 180000,
    meat_type: 'none',
    standard_meat_gram: 0,
    min_meat_gram: 0,
    is_fixed_gram: false,
    is_available: true,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm0000008-0000-0000-0000-000000000001',
    category_id: 'c0000003-0000-0000-0000-000000000003',
    name: 'Salad Hutan',
    description: 'Daun liar segar dataran tinggi dengan dressing asam manis segar.',
    access_scope: 'restaurant',
    price: 40000,
    price_basis: 'per_portion',
    meat_type: 'none',
    standard_meat_gram: 0,
    min_meat_gram: 0,
    is_fixed_gram: false,
    is_available: true,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm0000009-0000-0000-0000-000000000001',
    category_id: 'c0000003-0000-0000-0000-000000000003',
    name: 'Terong Bakar dan Jamur',
    description: 'Terong ungu bakar arang berpadu tumis jamur tiram bumbu gurih.',
    access_scope: 'restaurant',
    price: 45000,
    price_basis: 'per_portion',
    meat_type: 'none',
    standard_meat_gram: 0,
    min_meat_gram: 0,
    is_fixed_gram: false,
    is_available: true,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm0000010-0000-0000-0000-000000000001',
    category_id: 'c0000003-0000-0000-0000-000000000003',
    name: 'Kentang Asap',
    description: 'Kentang diasap lambat empuk merekah dengan mentega bawang dan garam laut.',
    access_scope: 'restaurant',
    price: 45000,
    price_basis: 'per_portion',
    meat_type: 'none',
    standard_meat_gram: 0,
    min_meat_gram: 0,
    is_fixed_gram: false,
    is_available: true,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm0000011-0000-0000-0000-000000000001',
    category_id: 'c0000003-0000-0000-0000-000000000003',
    name: 'Ubi Asap',
    description: 'Ubi madu panggang asap hangat beraroma karamel alami manis legit.',
    access_scope: 'restaurant',
    price: 45000,
    price_basis: 'per_portion',
    meat_type: 'none',
    standard_meat_gram: 0,
    min_meat_gram: 0,
    is_fixed_gram: false,
    is_available: true,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm0000012-0000-0000-0000-000000000001',
    category_id: 'c0000003-0000-0000-0000-000000000003',
    name: 'Tomat',
    description: 'Tomat panggang arang manis segar dengan taburan oregano dan minyak zaitun.',
    access_scope: 'restaurant',
    price: 5000,
    price_basis: 'per_portion',
    meat_type: 'none',
    standard_meat_gram: 0,
    min_meat_gram: 0,
    is_fixed_gram: false,
    is_available: true,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm0000013-0000-0000-0000-000000000001',
    category_id: 'c0000003-0000-0000-0000-000000000003',
    name: 'Bombay',
    description: 'Bawang bombay karamel panggang manis gurih.',
    access_scope: 'restaurant',
    price: 10000,
    price_basis: 'per_portion',
    meat_type: 'none',
    standard_meat_gram: 0,
    min_meat_gram: 0,
    is_fixed_gram: false,
    is_available: true,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm0000014-0000-0000-0000-000000000001',
    category_id: 'c0000004-0000-0000-0000-000000000004',
    name: 'Nasi Goreng Daging Asap',
    description: 'Nasi goreng wajan besi dengan daging asap fixed 30g, aroma smokey pekat dan telur mata sapi.',
    access_scope: 'restaurant',
    price: 40000,
    price_basis: 'per_portion',
    meat_type: 'brisket',
    standard_meat_gram: 30,
    min_meat_gram: 30,
    is_fixed_gram: true,
    is_available: true,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm0000015-0000-0000-0000-000000000001',
    category_id: 'c0000004-0000-0000-0000-000000000004',
    name: 'Nasi Goreng Domba Asap',
    description: 'Nasi goreng rempah istimewa dengan domba asap fixed 30g bercita rasa gurih pedas.',
    access_scope: 'restaurant',
    price: 45000,
    price_basis: 'per_portion',
    meat_type: 'domba',
    standard_meat_gram: 30,
    min_meat_gram: 30,
    is_fixed_gram: true,
    is_available: true,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm0000016-0000-0000-0000-000000000001',
    category_id: 'c0000004-0000-0000-0000-000000000004',
    name: 'Nasi Putih',
    description: 'Nasi beras pandan wangi pulen hangat mengepul.',
    access_scope: 'restaurant',
    price: 8000,
    price_basis: 'per_portion',
    meat_type: 'none',
    standard_meat_gram: 0,
    min_meat_gram: 0,
    is_fixed_gram: false,
    is_available: true,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Penginapan
  {
    id: 'm0000017-0000-0000-0000-000000000001',
    category_id: 'c0000005-0000-0000-0000-000000000005',
    name: 'Marlin Asap',
    description: 'Ikan marlin laut dalam diasap kayu buah segar, bertekstur padat lembut tanpa amis khas pesisir.',
    access_scope: 'lodging',
    price: 40000,
    price_basis: 'per_100g',
    meat_type: 'marlin',
    standard_meat_gram: 100,
    min_meat_gram: 100,
    is_fixed_gram: false,
    is_available: true,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm0000018-0000-0000-0000-000000000001',
    category_id: 'c0000005-0000-0000-0000-000000000005',
    name: 'Ungkep Ayam Kampung',
    description: 'Ayam kampung empuk bumbu kuning lengkuas khas desa yang diungkep api kecil berjam-jam.',
    access_scope: 'lodging',
    price: 175000,
    price_basis: 'per_ekor',
    meat_type: 'ayam',
    standard_meat_gram: 0,
    min_meat_gram: 0,
    is_fixed_gram: false,
    is_available: true,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm0000019-0000-0000-0000-000000000001',
    category_id: 'c0000005-0000-0000-0000-000000000005',
    name: 'Kucai Telur Asin',
    description: 'Sayur kucai sawah segar ditumis gurih dengan butiran telur asin Brebes.',
    access_scope: 'lodging',
    price: 40000,
    price_basis: 'per_portion',
    meat_type: 'none',
    standard_meat_gram: 0,
    min_meat_gram: 0,
    is_fixed_gram: false,
    is_available: true,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm0000020-0000-0000-0000-000000000001',
    category_id: 'c0000005-0000-0000-0000-000000000005',
    name: 'Mangut Lele Asap',
    description: 'Lele lokal diasap arang lalu dimasak dalam kuah mangut santan pedas gurih aroma daun kemangi.',
    access_scope: 'lodging',
    price: 30000,
    price_basis: 'per_100g',
    meat_type: 'lele',
    standard_meat_gram: 100,
    min_meat_gram: 100,
    is_fixed_gram: false,
    is_available: true,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm0000021-0000-0000-0000-000000000001',
    category_id: 'c0000005-0000-0000-0000-000000000005',
    name: 'Pepes Tahu',
    description: 'Tahu sutra lembut dibumbui daun kemangi dan rempah parut, dibungkus daun pisang bakar.',
    access_scope: 'lodging',
    price: 20000,
    price_basis: 'per_portion',
    meat_type: 'none',
    standard_meat_gram: 0,
    min_meat_gram: 0,
    is_fixed_gram: false,
    is_available: true,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_CATEGORIES: MenuCategory[] = [
  { id: 'c0000001-0000-0000-0000-000000000001', name: 'Daging Asap Utama', slug: 'daging-asap-utama', display_order: 1, created_at: new Date().toISOString() },
  { id: 'c0000002-0000-0000-0000-000000000002', name: 'Sop & Olahan Berkuah', slug: 'sop-kuah', display_order: 2, created_at: new Date().toISOString() },
  { id: 'c0000003-0000-0000-0000-000000000003', name: 'Sayuran & Pelengkap Panggang', slug: 'sayuran-pelengkap', display_order: 3, created_at: new Date().toISOString() },
  { id: 'c0000004-0000-0000-0000-000000000004', name: 'Nasi & Karbohidrat', slug: 'nasi-karbo', display_order: 4, created_at: new Date().toISOString() },
  { id: 'c0000005-0000-0000-0000-000000000005', name: 'Spesial Tamu Penginapan', slug: 'menu-penginapan', display_order: 5, created_at: new Date().toISOString() },
];

export async function getMenus(options?: { accessScope?: 'restaurant' | 'lodging' | 'all'; activeOnly?: boolean }): Promise<MenuItem[]> {
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      let query = supabase.from('menus').select('*');
      if (options?.activeOnly !== false) {
        query = query.eq('is_active', true);
      }
      if (options?.accessScope && options.accessScope !== 'all') {
        query = query.or(`access_scope.eq.${options.accessScope},access_scope.eq.both`);
      }
      const { data, error } = await query.order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as MenuItem[];
      }
    } catch {
      // Fallback to local
    }
  }

  // Local storage fallback with seed initialization & migration
  if (typeof window !== 'undefined') {
    const SEED_VERSION = 'v5_meat_basis_per100g_ekor_porsi';
    const currentVersion = localStorage.getItem('asap_menus_seed_version');
    const stored = localStorage.getItem('asap_menus_store');

    if (stored && currentVersion === SEED_VERSION) {
      try {
        const list: MenuItem[] = JSON.parse(stored);
        return filterMenus(list, options);
      } catch {
        // Fallback
      }
    }

    // Reconcile: Update all official menus with current correct price_basis and keep custom additions
    let mergedList: MenuItem[] = [...INITIAL_OFFICIAL_MENUS];
    if (stored) {
      try {
        const existingList: MenuItem[] = JSON.parse(stored);
        const officialMap = new Map(INITIAL_OFFICIAL_MENUS.map((m) => [m.id, m]));
        
        // Merge attributes for official menus
        mergedList = existingList.map((m) => {
          const official = officialMap.get(m.id);
          if (official) {
            return {
              ...m,
              price: official.price,
              price_basis: official.price_basis,
              meat_type: official.meat_type,
              is_fixed_gram: official.is_fixed_gram,
              standard_meat_gram: official.standard_meat_gram,
              min_meat_gram: official.min_meat_gram,
            };
          }
          return m;
        });

        // Add any official menus that were missing
        INITIAL_OFFICIAL_MENUS.forEach((off) => {
          if (!mergedList.some((m) => m.id === off.id)) {
            mergedList.push(off);
          }
        });
      } catch {
        mergedList = [...INITIAL_OFFICIAL_MENUS];
      }
    }

    localStorage.setItem('asap_menus_store', JSON.stringify(mergedList));
    localStorage.setItem('asap_menus_seed_version', SEED_VERSION);
    return filterMenus(mergedList, options);
  }

  return filterMenus(INITIAL_OFFICIAL_MENUS, options);
}

function filterMenus(list: MenuItem[], options?: { accessScope?: 'restaurant' | 'lodging' | 'all'; activeOnly?: boolean }): MenuItem[] {
  return list.filter((m) => {
    if (options?.activeOnly !== false && (!m.is_active || !m.is_available)) return false;
    if (options?.accessScope && options.accessScope !== 'all') {
      if (m.access_scope !== options.accessScope && m.access_scope !== 'both') return false;
    }
    return true;
  });
}

export async function saveMenuItem(item: Partial<MenuItem>): Promise<MenuItem> {
  const configured = isSupabaseConfigured();

  if (configured) {
    const supabase = createClient();
    if (item.id) {
      const { data, error } = await supabase.from('menus').update(item).eq('id', item.id).select().single();
      if (!error && data) return data as MenuItem;
    } else {
      const { data, error } = await supabase.from('menus').insert(item).select().single();
      if (!error && data) return data as MenuItem;
    }
  }

  // Local state update
  const all = await getMenus({ accessScope: 'all', activeOnly: false });
  let saved: MenuItem;
  if (item.id) {
    saved = { ...all.find((i) => i.id === item.id)!, ...item, updated_at: new Date().toISOString() } as MenuItem;
    const updated = all.map((i) => (i.id === item.id ? saved : i));
    if (typeof window !== 'undefined') localStorage.setItem('asap_menus_store', JSON.stringify(updated));
  } else {
    saved = {
      ...item,
      id: 'm_' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as MenuItem;
    const updated = [...all, saved];
    if (typeof window !== 'undefined') localStorage.setItem('asap_menus_store', JSON.stringify(updated));
  }

  return saved;
}

export async function toggleMenuAvailability(menuId: string, isAvailable: boolean): Promise<void> {
  const configured = isSupabaseConfigured();
  if (configured) {
    const supabase = createClient();
    await supabase.from('menus').update({ is_available: isAvailable }).eq('id', menuId);
  }

  if (typeof window !== 'undefined') {
    const all = await getMenus({ accessScope: 'all', activeOnly: false });
    const updated = all.map((i) => (i.id === menuId ? { ...i, is_available: isAvailable } : i));
    localStorage.setItem('asap_menus_store', JSON.stringify(updated));
  }
}
