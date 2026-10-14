-- ============================================================
-- MIGRATION 0003: GUESTS, ROOMS, RESTAURANT TABLES, MENUS
-- ASAP ISEP — Daging Asap
-- ============================================================

-- 1. GUESTS
CREATE TABLE IF NOT EXISTS public.guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    notes TEXT,
    valid_visits_count INTEGER NOT NULL DEFAULT 0,
    is_loyal BOOLEAN NOT NULL DEFAULT FALSE, -- Ditandai "Pelanggan Setia" jika valid_visits_count >= 2
    total_spend NUMERIC(12, 2) NOT NULL DEFAULT 0,
    last_visit_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_guests_phone ON public.guests(phone);
CREATE INDEX IF NOT EXISTS idx_guests_name ON public.guests(name);

CREATE TRIGGER update_guests_timestamp
    BEFORE UPDATE ON public.guests
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- 2. ROOMS
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_number TEXT NOT NULL UNIQUE,
    room_name TEXT NOT NULL,
    room_type TEXT NOT NULL,
    price_per_night NUMERIC(12, 2) NOT NULL DEFAULT 200000,
    capacity INTEGER NOT NULL DEFAULT 2,
    description TEXT,
    facilities TEXT[] DEFAULT '{}',
    status room_status NOT NULL DEFAULT 'available',
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON public.rooms(is_active);

CREATE TRIGGER update_rooms_timestamp
    BEFORE UPDATE ON public.rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- 3. RESTAURANT TABLES
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_number TEXT NOT NULL UNIQUE,
    capacity INTEGER NOT NULL DEFAULT 4,
    status table_status NOT NULL DEFAULT 'available',
    location_notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tables_status ON public.restaurant_tables(status);

CREATE TRIGGER update_tables_timestamp
    BEFORE UPDATE ON public.restaurant_tables
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- 4. MENU CATEGORIES
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. MENUS
CREATE TABLE IF NOT EXISTS public.menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    access_scope TEXT NOT NULL DEFAULT 'restaurant', -- 'restaurant', 'lodging', 'both'
    price NUMERIC(12, 2) NOT NULL,
    price_basis price_basis_enum NOT NULL DEFAULT 'per_portion',
    price_range_min NUMERIC(12, 2),
    price_range_max NUMERIC(12, 2),
    meat_type meat_type_enum NOT NULL DEFAULT 'none',
    standard_meat_gram NUMERIC(10, 2) NOT NULL DEFAULT 0,
    min_meat_gram NUMERIC(10, 2) NOT NULL DEFAULT 0,
    is_fixed_gram BOOLEAN NOT NULL DEFAULT FALSE, -- True: Fixed 30g (Nasgor), False: Flexible default 100g
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menus_category ON public.menus(category_id);
CREATE INDEX IF NOT EXISTS idx_menus_access ON public.menus(access_scope);
CREATE INDEX IF NOT EXISTS idx_menus_active_available ON public.menus(is_active, is_available);

CREATE TRIGGER update_menus_timestamp
    BEFORE UPDATE ON public.menus
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- RLS POLICIES
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- Guests: Staff full access, Public cannot read guest lists directly
CREATE POLICY "Staff read/write guests" ON public.guests FOR ALL TO authenticated USING (public.is_staff());

-- Rooms: Public can read active rooms, Staff full access
CREATE POLICY "Public read active rooms" ON public.rooms FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Staff manage rooms" ON public.rooms FOR ALL TO authenticated USING (public.is_staff());

-- Tables: Staff full access
CREATE POLICY "Public read active tables" ON public.restaurant_tables FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Staff manage tables" ON public.restaurant_tables FOR ALL TO authenticated USING (public.is_staff());

-- Categories: Public read, Staff manage
CREATE POLICY "Public read menu categories" ON public.menu_categories FOR SELECT USING (TRUE);
CREATE POLICY "Staff manage categories" ON public.menu_categories FOR ALL TO authenticated USING (public.is_staff());

-- Menus: Public read active and available, Staff full access
CREATE POLICY "Public read active menus" ON public.menus FOR SELECT USING (is_active = TRUE AND is_available = TRUE);
CREATE POLICY "Staff manage menus" ON public.menus FOR ALL TO authenticated USING (public.is_staff());
