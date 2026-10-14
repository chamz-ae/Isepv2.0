-- ============================================================
-- MIGRATION 0001: INITIAL SCHEMA & EXTENSIONS
-- ASAP ISEP — Daging Asap
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'admin', 'kasir', 'kitchen', 'housekeeping', 'purchasing');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE room_status AS ENUM ('available', 'occupied', 'cleaning', 'maintenance', 'blocked');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE table_status AS ENUM ('available', 'occupied', 'reserved');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_type_enum AS ENUM ('restaurant', 'lodging', 'combined');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status_enum AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('unpaid', 'down_payment', 'paid', 'refunded');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM ('cash', 'qris', 'bank_transfer', 'room_charge');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE meat_type_enum AS ENUM ('brisket', 'ayam', 'domba', 'marlin', 'lele', 'salmon', 'bebek', 'lidah_sapi', 'none');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE price_basis_enum AS ENUM ('per_portion', 'per_gram', 'per_package');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stock_movement_type AS ENUM (
        'purchase',
        'usage',
        'cooking_raw_deduction',
        'cooking_cooked_addition',
        'stock_opname_adjustment',
        'void_return',
        'waste',
        'spoilage',
        'operational_loss'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE purchase_category_enum AS ENUM ('restaurant', 'lodging', 'operational');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gallery_status_enum AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE kds_status_enum AS ENUM ('pending', 'preparing', 'ready', 'served');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Generic update timestamp trigger function
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- ============================================================
-- MIGRATION 0002: AUTH, PROFILES, ROLES & SECURITY
-- ASAP ISEP — Daging Asap
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'kasir',
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_profiles_timestamp
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- Function to handle new user signup from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, phone, is_active)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Staf Baru'),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'kasir'::user_role),
        NEW.raw_user_meta_data->>'phone',
        TRUE
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Helper function to check role of current authenticated user
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
DECLARE
    u_role user_role;
BEGIN
    SELECT role INTO u_role FROM public.profiles WHERE id = auth.uid() AND is_active = TRUE;
    RETURN u_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT public.get_current_user_role() IN ('owner', 'admin'));
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT public.get_current_user_role() IS NOT NULL);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR public.is_admin_or_owner());

CREATE POLICY "Allow owner/admin to manage all profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.is_admin_or_owner());
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
-- ============================================================
-- MIGRATION 0004: ORDERS, BOOKINGS, PAYMENTS & CLOSING
-- ASAP ISEP — Daging Asap
-- ============================================================

-- 1. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code TEXT NOT NULL UNIQUE, -- Contoh: ASAP-261010-7F4K
    guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
    guest_name TEXT NOT NULL,
    guest_phone TEXT NOT NULL,
    guest_email TEXT,
    order_type order_type_enum NOT NULL DEFAULT 'restaurant',
    
    -- Lodging Data
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    room_name_snapshot TEXT,
    check_in_date DATE,
    check_out_date DATE,
    adult_count INTEGER NOT NULL DEFAULT 1,
    teen_count INTEGER NOT NULL DEFAULT 0,
    child_count INTEGER NOT NULL DEFAULT 0,
    lodging_price_per_person_snapshot NUMERIC(12, 2) NOT NULL DEFAULT 200000,
    subtotal_lodging NUMERIC(12, 2) NOT NULL DEFAULT 0,

    -- Restaurant Data
    table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
    table_number_snapshot TEXT,
    subtotal_dining NUMERIC(12, 2) NOT NULL DEFAULT 0,

    -- Overall Financials
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    down_payment NUMERIC(12, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    remaining_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,

    -- Status
    order_status order_status_enum NOT NULL DEFAULT 'pending',
    payment_status payment_status_enum NOT NULL DEFAULT 'unpaid',

    -- Notes & Void Trail
    notes TEXT,
    cancellation_reason TEXT,
    cancelled_by TEXT,
    cancelled_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_booking_code ON public.orders(booking_code);
CREATE INDEX IF NOT EXISTS idx_orders_guest_phone ON public.orders(guest_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_check_in_out ON public.orders(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

CREATE TRIGGER update_orders_timestamp
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- 2. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_id UUID REFERENCES public.menus(id) ON DELETE SET NULL,
    menu_name_snapshot TEXT NOT NULL,
    unit_price_snapshot NUMERIC(12, 2) NOT NULL,
    meat_type meat_type_enum NOT NULL DEFAULT 'none',
    gram_per_portion NUMERIC(10, 2) NOT NULL DEFAULT 0,
    qty INTEGER NOT NULL DEFAULT 1,
    total_gram NUMERIC(10, 2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(12, 2) NOT NULL,
    
    -- Kitchen Display System (KDS)
    kds_status kds_status_enum NOT NULL DEFAULT 'pending',
    kds_notes TEXT,
    
    -- Inventory tracking
    inventory_deducted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_kds_status ON public.order_items(kds_status);

-- 3. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number TEXT NOT NULL UNIQUE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method payment_method_enum NOT NULL,
    is_down_payment BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'confirmed', -- 'confirmed', 'voided'
    reference_number TEXT,
    notes TEXT,
    operator_name TEXT NOT NULL DEFAULT 'Kasir',
    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON public.payments(paid_at);

-- 4. CASHIER CLOSINGS (Closing Kasir)
CREATE TABLE IF NOT EXISTS public.cashier_closings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    closing_number TEXT NOT NULL UNIQUE,
    closing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    operator_name TEXT NOT NULL,
    expected_cash NUMERIC(12, 2) NOT NULL DEFAULT 0,
    actual_cash NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cash_variance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    qris_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    transfer_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    room_charge_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_transactions INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS POLICIES
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashier_closings ENABLE ROW LEVEL SECURITY;

-- Orders RLS: Customer can insert, can read by booking_code
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public select orders" ON public.orders FOR SELECT USING (TRUE);
CREATE POLICY "Staff manage orders" ON public.orders FOR ALL TO authenticated USING (public.is_staff());

-- Order items RLS:
CREATE POLICY "Public insert order items" ON public.order_items FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public select order items" ON public.order_items FOR SELECT USING (TRUE);
CREATE POLICY "Staff manage order items" ON public.order_items FOR ALL TO authenticated USING (public.is_staff());

-- Payments RLS: Staff full access
CREATE POLICY "Public select own payments" ON public.payments FOR SELECT USING (TRUE);
CREATE POLICY "Staff manage payments" ON public.payments FOR ALL TO authenticated USING (public.is_staff());

-- Closings RLS: Staff full access
CREATE POLICY "Staff manage closings" ON public.cashier_closings FOR ALL TO authenticated USING (public.is_staff());
-- ============================================================
-- MIGRATION 0005: SUPPLIERS, PURCHASING, INVENTORY & MOVEMENTS
-- ASAP ISEP — Daging Asap
-- ============================================================

-- 1. SUPPLIERS
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT NOT NULL,
    address TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. INVENTORY (BASE UNIT: GRAM)
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'raw_meat', -- 'raw_meat', 'cooked_meat', 'supplies', 'general'
    meat_type meat_type_enum NOT NULL DEFAULT 'none',
    stock_gram NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (stock_gram >= 0),
    minimum_stock_gram NUMERIC(12, 2) NOT NULL DEFAULT 2000, -- Ambang batas stok kritis
    unit_cost_per_kg NUMERIC(12, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_meat_type ON public.inventory(meat_type);
CREATE INDEX IF NOT EXISTS idx_inventory_stock ON public.inventory(stock_gram);

CREATE TRIGGER update_inventory_timestamp
    BEFORE UPDATE ON public.inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- 3. PURCHASES (PEMBELANJAAN)
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_number TEXT NOT NULL UNIQUE, -- Contoh: PO-202610-001
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    supplier_name_snapshot TEXT NOT NULL,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category purchase_category_enum NOT NULL DEFAULT 'restaurant',
    invoice_number TEXT,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_method payment_method_enum NOT NULL DEFAULT 'cash',
    receipt_image_url TEXT,
    operator_name TEXT NOT NULL,
    notes TEXT,
    is_inventory_integrated BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_date ON public.purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchases_category ON public.purchases(category);

-- 4. PURCHASE ITEMS
CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES public.inventory(id) ON DELETE RESTRICT,
    item_name_snapshot TEXT NOT NULL,
    category TEXT NOT NULL,
    invoice_weight_kg NUMERIC(10, 3) NOT NULL DEFAULT 0,
    received_weight_kg NUMERIC(10, 3) NOT NULL DEFAULT 0,
    received_weight_gram NUMERIC(12, 2) NOT NULL DEFAULT 0, -- Nilai aktual penambah stok fisik
    unit_price_per_kg NUMERIC(12, 2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    is_stock_item BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON public.purchase_items(purchase_id);

-- 5. STOCK MOVEMENTS (LEDGER BUKU BESAR MUTASI STOK)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE RESTRICT,
    movement_type stock_movement_type NOT NULL,
    gram_change NUMERIC(12, 2) NOT NULL, -- Positif untuk masuk, Negatif untuk keluar
    remaining_gram NUMERIC(12, 2) NOT NULL, -- Saldo setelah mutasi
    reference_type TEXT, -- 'purchase', 'order', 'cooking_batch', 'stock_opname', 'void_reversal'
    reference_id TEXT,
    notes TEXT,
    operator_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_inventory_id ON public.stock_movements(inventory_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements(created_at);

-- RLS POLICIES (Protected, internal staff only)
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage suppliers" ON public.suppliers FOR ALL TO authenticated USING (public.is_staff());
CREATE POLICY "Staff manage inventory" ON public.inventory FOR ALL TO authenticated USING (public.is_staff());
CREATE POLICY "Staff manage purchases" ON public.purchases FOR ALL TO authenticated USING (public.is_staff());
CREATE POLICY "Staff manage purchase_items" ON public.purchase_items FOR ALL TO authenticated USING (public.is_staff());
CREATE POLICY "Staff manage stock_movements" ON public.stock_movements FOR ALL TO authenticated USING (public.is_staff());
-- ============================================================
-- MIGRATION 0006: COOKING BATCH, YIELD & STOCK OPNAME
-- ASAP ISEP — Daging Asap
-- ============================================================

-- 1. COOKING BATCHES (RAW VS COOKED & YIELD FORMULA)
CREATE TABLE IF NOT EXISTS public.cooking_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number TEXT NOT NULL UNIQUE, -- Contoh: BATCH-20261010-01
    raw_inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE RESTRICT,
    cooked_inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE RESTRICT,
    raw_weight_gram NUMERIC(12, 2) NOT NULL,
    cooked_weight_gram NUMERIC(12, 2) NOT NULL,
    loss_weight_gram NUMERIC(12, 2) NOT NULL, -- Formula: Raw Weight - Cooked Weight
    yield_percentage NUMERIC(6, 2) NOT NULL, -- Formula: (Cooked Weight / Raw Weight) * 100
    loss_reason TEXT NOT NULL DEFAULT 'cooking_shrinkage', -- 'trimming', 'cooking_shrinkage', 'bone', 'waste', 'spoilage', 'operational_loss', 'unknown'
    batch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    operator_name TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cooking_batches_date ON public.cooking_batches(batch_date);

-- 2. STOCK OPNAMES
CREATE TABLE IF NOT EXISTS public.stock_opnames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opname_number TEXT NOT NULL UNIQUE, -- Contoh: SO-202610-01
    opname_date DATE NOT NULL DEFAULT CURRENT_DATE,
    operator_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'confirmed'
    total_variance_gram NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_variance_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. STOCK OPNAME ITEMS
CREATE TABLE IF NOT EXISTS public.stock_opname_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_opname_id UUID NOT NULL REFERENCES public.stock_opnames(id) ON DELETE CASCADE,
    inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE RESTRICT,
    item_name_snapshot TEXT NOT NULL,
    system_gram NUMERIC(12, 2) NOT NULL,
    actual_gram NUMERIC(12, 2) NOT NULL,
    variance_gram NUMERIC(12, 2) NOT NULL, -- Formula: Actual - System
    variance_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    reason TEXT NOT NULL, -- Justifikasi wajib untuk selisih fisik
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opname_items_opname_id ON public.stock_opname_items(stock_opname_id);

-- RLS POLICIES
ALTER TABLE public.cooking_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_opnames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_opname_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage cooking_batches" ON public.cooking_batches FOR ALL TO authenticated USING (public.is_staff());
CREATE POLICY "Staff manage stock_opnames" ON public.stock_opnames FOR ALL TO authenticated USING (public.is_staff());
CREATE POLICY "Staff manage stock_opname_items" ON public.stock_opname_items FOR ALL TO authenticated USING (public.is_staff());
-- ============================================================
-- MIGRATION 0007: GALLERY, WEBHOOKS, AUDIT & ATOMIC RPCS
-- ASAP ISEP — Daging Asap
-- ============================================================

-- 1. GALLERY SUBMISSIONS
CREATE TABLE IF NOT EXISTS public.gallery_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code TEXT NOT NULL,
    guest_name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    category TEXT NOT NULL DEFAULT 'dining', -- 'dining', 'stay'
    status gallery_status_enum NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    consent_granted BOOLEAN NOT NULL DEFAULT TRUE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_gallery_status ON public.gallery_submissions(status);
CREATE INDEX IF NOT EXISTS idx_gallery_booking_code ON public.gallery_submissions(booking_code);

-- 2. WEBHOOK INTEGRATIONS (GOOGLE SHEETS & EXTERNAL)
CREATE TABLE IF NOT EXISTS public.webhook_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    webhook_url TEXT NOT NULL,
    secret_token TEXT,
    trigger_events TEXT[] NOT NULL DEFAULT '{"restaurant_paid", "lodging_paid"}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_status_code INTEGER,
    last_delivery_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. WEBHOOK LOGS
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID REFERENCES public.webhook_integrations(id) ON DELETE CASCADE,
    event TEXT NOT NULL,
    payload JSONB NOT NULL,
    status_code INTEGER,
    response_body TEXT,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    error_message TEXT,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_attempted_at ON public.webhook_logs(attempted_at);

-- 4. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_data JSONB,
    new_data JSONB,
    performed_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- 5. SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'general',
    business_name TEXT NOT NULL DEFAULT 'ASAP ISEP — Daging Asap',
    whatsapp_number TEXT NOT NULL DEFAULT '+6281234567890',
    address TEXT NOT NULL DEFAULT 'Jl. Raya Lereng Asap No. 8, Cisarua, Bogor',
    default_lodging_price_per_person NUMERIC(12, 2) NOT NULL DEFAULT 200000,
    auto_backup_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    auto_backup_schedule TEXT NOT NULL DEFAULT '23:59 WIB',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ATOMIC POSTGRESQL FUNCTIONS / RPCS (CRITICAL CORE)
-- ============================================================

-- A. ROOM AVAILABILITY CHECK
CREATE OR REPLACE FUNCTION public.rpc_check_room_availability(
    p_room_id UUID,
    p_check_in DATE,
    p_check_out DATE,
    p_exclude_order_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO conflict_count
    FROM public.orders
    WHERE room_id = p_room_id
      AND order_status != 'cancelled'
      AND (p_exclude_order_id IS NULL OR id != p_exclude_order_id)
      AND check_in_date < p_check_out
      AND check_out_date > p_check_in;

    RETURN (conflict_count = 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- B. RECORD PAYMENT ATOMICALLY
CREATE OR REPLACE FUNCTION public.rpc_record_payment_atomic(
    p_order_id UUID,
    p_amount NUMERIC,
    p_method payment_method_enum,
    p_is_dp BOOLEAN,
    p_reference TEXT,
    p_operator TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_new_paid NUMERIC;
    v_new_remaining NUMERIC;
    v_new_status payment_status_enum;
    v_payment_id UUID;
    v_pay_num TEXT;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order tidak ditemukan';
    END IF;

    IF v_order.order_status = 'cancelled' THEN
        RAISE EXCEPTION 'Tidak dapat membayar order yang sudah dibatalkan';
    END IF;

    v_new_paid := v_order.paid_amount + p_amount;
    v_new_remaining := GREATEST(0, v_order.total_amount - v_new_paid);

    IF v_new_remaining <= 0 THEN
        v_new_status := 'paid';
    ELSIF p_is_dp OR v_new_paid > 0 THEN
        v_new_status := 'down_payment';
    ELSE
        v_new_status := 'unpaid';
    END IF;

    v_pay_num := 'PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    INSERT INTO public.payments (
        payment_number, order_id, amount, payment_method, is_down_payment,
        status, reference_number, notes, operator_name, paid_at
    ) VALUES (
        v_pay_num, p_order_id, p_amount, p_method, p_is_dp,
        'confirmed', p_reference, p_notes, COALESCE(p_operator, 'Kasir'), NOW()
    ) RETURNING id INTO v_payment_id;

    UPDATE public.orders SET
        paid_amount = v_new_paid,
        remaining_amount = v_new_remaining,
        payment_status = v_new_status,
        order_status = CASE 
            WHEN order_status = 'pending' AND v_new_status IN ('paid', 'down_payment') THEN 'confirmed'::order_status_enum 
            ELSE order_status 
        END,
        updated_at = NOW()
    WHERE id = p_order_id;

    -- Update Guest total spend & loyalty check
    IF v_order.guest_id IS NOT NULL THEN
        UPDATE public.guests SET
            total_spend = total_spend + p_amount,
            last_visit_at = NOW(),
            valid_visits_count = valid_visits_count + 1,
            is_loyal = (valid_visits_count + 1 >= 2)
        WHERE id = v_order.guest_id;
    END IF;

    -- Audit log
    INSERT INTO public.audit_logs (table_name, record_id, action, new_data, performed_by)
    VALUES (
        'payments',
        v_payment_id::TEXT,
        'INSERT',
        jsonb_build_object('order_id', p_order_id, 'amount', p_amount, 'method', p_method),
        p_operator
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'payment_id', v_payment_id,
        'new_paid', v_new_paid,
        'new_remaining', v_new_remaining,
        'payment_status', v_new_status
    );
END;
$$ LANGUAGE plpgsql;

-- C. VOID / CANCEL ORDER WITH STOCK ROLLBACK
CREATE OR REPLACE FUNCTION public.rpc_void_order_atomic(
    p_order_id UUID,
    p_reason TEXT,
    p_operator TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_inv RECORD;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order tidak ditemukan';
    END IF;

    IF v_order.order_status = 'cancelled' THEN
        RAISE EXCEPTION 'Order sudah dibatalkan sebelumnya';
    END IF;

    -- Check if any meat items had deducted inventory, return to stock atomically
    FOR v_item IN SELECT * FROM public.order_items WHERE order_id = p_order_id AND inventory_deducted = TRUE LOOP
        IF v_item.meat_type != 'none' AND v_item.total_gram > 0 THEN
            SELECT * INTO v_inv FROM public.inventory 
            WHERE meat_type = v_item.meat_type AND category = 'cooked_meat' AND is_active = TRUE 
            LIMIT 1 FOR UPDATE;

            IF FOUND THEN
                UPDATE public.inventory 
                SET stock_gram = stock_gram + v_item.total_gram, updated_at = NOW()
                WHERE id = v_inv.id;

                INSERT INTO public.stock_movements (
                    inventory_id, movement_type, gram_change, remaining_gram,
                    reference_type, reference_id, notes, operator_name
                ) VALUES (
                    v_inv.id, 'void_return', v_item.total_gram, v_inv.stock_gram + v_item.total_gram,
                    'order_cancellation', p_order_id::TEXT, 'Pengembalian stok pembatalan order ' || v_order.booking_code, p_operator
                );
            END IF;
        END IF;
    END LOOP;

    -- Mark order cancelled
    UPDATE public.orders SET
        order_status = 'cancelled',
        cancellation_reason = p_reason,
        cancelled_by = p_operator,
        cancelled_at = NOW(),
        updated_at = NOW()
    WHERE id = p_order_id;

    -- If guest attached, decrement valid visit count if was credited
    IF v_order.guest_id IS NOT NULL AND v_order.paid_amount > 0 THEN
        UPDATE public.guests SET
            valid_visits_count = GREATEST(0, valid_visits_count - 1),
            is_loyal = (GREATEST(0, valid_visits_count - 1) >= 2)
        WHERE id = v_order.guest_id;
    END IF;

    -- Insert Audit log
    INSERT INTO public.audit_logs (table_name, record_id, action, new_data, performed_by)
    VALUES (
        'orders',
        p_order_id::TEXT,
        'VOID_CANCEL',
        jsonb_build_object('reason', p_reason, 'booking_code', v_order.booking_code),
        p_operator
    );

    RETURN jsonb_build_object('success', TRUE, 'message', 'Order berhasil dibatalkan dan audit tersimpan');
END;
$$ LANGUAGE plpgsql;

-- D. PROCESS COOKING BATCH ATOMICALLY (RAW -> COOKED & YIELD)
CREATE OR REPLACE FUNCTION public.rpc_process_cooking_batch_atomic(
    p_raw_inv_id UUID,
    p_cooked_inv_id UUID,
    p_raw_gram NUMERIC,
    p_cooked_gram NUMERIC,
    p_loss_reason TEXT,
    p_operator TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_raw_inv RECORD;
    v_cooked_inv RECORD;
    v_loss_gram NUMERIC;
    v_yield NUMERIC;
    v_batch_num TEXT;
    v_batch_id UUID;
BEGIN
    SELECT * INTO v_raw_inv FROM public.inventory WHERE id = p_raw_inv_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Item inventori mentah tidak ditemukan';
    END IF;

    SELECT * INTO v_cooked_inv FROM public.inventory WHERE id = p_cooked_inv_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Item inventori matang tidak ditemukan';
    END IF;

    IF v_raw_inv.stock_gram < p_raw_gram THEN
        RAISE EXCEPTION 'Stok mentah tidak mencukupi (Tersedia: %g, Diminta: %g)', v_raw_inv.stock_gram, p_raw_gram;
    END IF;

    v_loss_gram := p_raw_gram - p_cooked_gram;
    IF v_loss_gram < 0 THEN
        RAISE EXCEPTION 'Berat matang (%g) tidak boleh melebihi berat mentah (%g)', p_cooked_gram, p_raw_gram;
    END IF;

    v_yield := ROUND((p_cooked_gram / p_raw_gram) * 100, 2);
    v_batch_num := 'BATCH-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');

    -- Insert batch record
    INSERT INTO public.cooking_batches (
        batch_number, raw_inventory_id, cooked_inventory_id,
        raw_weight_gram, cooked_weight_gram, loss_weight_gram,
        yield_percentage, loss_reason, operator_name, notes
    ) VALUES (
        v_batch_num, p_raw_inv_id, p_cooked_inv_id,
        p_raw_gram, p_cooked_gram, v_loss_gram,
        v_yield, COALESCE(p_loss_reason, 'cooking_shrinkage'), p_operator, p_notes
    ) RETURNING id INTO v_batch_id;

    -- Deduct raw inventory
    UPDATE public.inventory 
    SET stock_gram = stock_gram - p_raw_gram, updated_at = NOW() 
    WHERE id = p_raw_inv_id;

    INSERT INTO public.stock_movements (
        inventory_id, movement_type, gram_change, remaining_gram,
        reference_type, reference_id, notes, operator_name
    ) VALUES (
        p_raw_inv_id, 'cooking_raw_deduction', -p_raw_gram, v_raw_inv.stock_gram - p_raw_gram,
        'cooking_batch', v_batch_id::TEXT, 'Pengurangan mentah batch ' || v_batch_num, p_operator
    );

    -- Increase cooked inventory
    UPDATE public.inventory 
    SET stock_gram = stock_gram + p_cooked_gram, updated_at = NOW() 
    WHERE id = p_cooked_inv_id;

    INSERT INTO public.stock_movements (
        inventory_id, movement_type, gram_change, remaining_gram,
        reference_type, reference_id, notes, operator_name
    ) VALUES (
        p_cooked_inv_id, 'cooking_cooked_addition', p_cooked_gram, v_cooked_inv.stock_gram + p_cooked_gram,
        'cooking_batch', v_batch_id::TEXT, 'Penambahan matang batch ' || v_batch_num, p_operator
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'batch_id', v_batch_id,
        'batch_number', v_batch_num,
        'yield_percentage', v_yield,
        'loss_weight_gram', v_loss_gram
    );
END;
$$ LANGUAGE plpgsql;

-- E. APPLY STOCK OPNAME ATOMICALLY
CREATE OR REPLACE FUNCTION public.rpc_apply_stock_opname_atomic(
    p_opname_id UUID,
    p_operator TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_opname RECORD;
    v_item RECORD;
    v_inv RECORD;
BEGIN
    SELECT * INTO v_opname FROM public.stock_opnames WHERE id = p_opname_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Stock opname tidak ditemukan';
    END IF;

    IF v_opname.status = 'confirmed' THEN
        RAISE EXCEPTION 'Stock opname sudah pernah dikonfirmasi sebelumnya';
    END IF;

    FOR v_item IN SELECT * FROM public.stock_opname_items WHERE stock_opname_id = p_opname_id LOOP
        SELECT * INTO v_inv FROM public.inventory WHERE id = v_item.inventory_id FOR UPDATE;
        IF FOUND THEN
            -- Adjust stock to match actual physical count
            UPDATE public.inventory 
            SET stock_gram = v_item.actual_gram, updated_at = NOW()
            WHERE id = v_inv.id;

            -- Record ledger movement
            INSERT INTO public.stock_movements (
                inventory_id, movement_type, gram_change, remaining_gram,
                reference_type, reference_id, notes, operator_name
            ) VALUES (
                v_inv.id, 'stock_opname_adjustment', v_item.variance_gram, v_item.actual_gram,
                'stock_opname', p_opname_id::TEXT,
                'Penyesuaian Opname ' || v_opname.opname_number || ': ' || v_item.reason,
                p_operator
            );
        END IF;
    END LOOP;

    UPDATE public.stock_opnames 
    SET status = 'confirmed', created_at = NOW()
    WHERE id = p_opname_id;

    RETURN jsonb_build_object('success', TRUE, 'message', 'Stock opname berhasil dikonfirmasi dan saldo disesuaikan');
END;
$$ LANGUAGE plpgsql;

-- RLS POLICIES
ALTER TABLE public.gallery_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Gallery: Public can view approved, Public can insert with consent, Staff full access
CREATE POLICY "Public read approved gallery" ON public.gallery_submissions FOR SELECT USING (status = 'approved');
CREATE POLICY "Public submit gallery" ON public.gallery_submissions FOR INSERT WITH CHECK (consent_granted = TRUE);
CREATE POLICY "Staff manage gallery" ON public.gallery_submissions FOR ALL TO authenticated USING (public.is_staff());

-- Webhooks: Staff only
CREATE POLICY "Staff manage webhooks" ON public.webhook_integrations FOR ALL TO authenticated USING (public.is_staff());
CREATE POLICY "Staff read webhook logs" ON public.webhook_logs FOR ALL TO authenticated USING (public.is_staff());

-- Audit: Staff only
CREATE POLICY "Staff read audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_staff());

-- Settings: Public can read business name/WA/address, Staff can update
CREATE POLICY "Public read general settings" ON public.settings FOR SELECT USING (TRUE);
CREATE POLICY "Staff manage settings" ON public.settings FOR ALL TO authenticated USING (public.is_staff());
-- ============================================================
-- ASAP ISEP — DAGING ASAP: MASTER SEED DATA
-- Sesuai Instruksi Resmi Master Prompt:
-- Hanya memuat master data menu restoran & penginapan,
-- master kategori, dan konfigurasi awal.
-- TIDAK memuat stok dummy, supplier fiktif, atau transaksi palsu.
-- ============================================================

-- 1. KATEGORI MENU
INSERT INTO public.menu_categories (id, name, slug, display_order) VALUES
('c0000001-0000-0000-0000-000000000001', 'Daging Asap Utama', 'daging-asap-utama', 1),
('c0000002-0000-0000-0000-000000000002', 'Sop & Olahan Berkuah', 'sop-kuah', 2),
('c0000003-0000-0000-0000-000000000003', 'Sayuran & Pelengkap Panggang', 'sayuran-pelengkap', 3),
('c0000004-0000-0000-0000-000000000004', 'Nasi & Karbohidrat', 'nasi-karbo', 4),
('c0000005-0000-0000-0000-000000000005', 'Spesial Tamu Penginapan', 'menu-penginapan', 5)
ON CONFLICT (slug) DO NOTHING;

-- 2. MENU RESTORAN
INSERT INTO public.menus (
    id, category_id, name, description, access_scope,
    price, price_basis, price_range_min, price_range_max,
    meat_type, standard_meat_gram, min_meat_gram, is_fixed_gram,
    is_available, is_active, image_url
) VALUES
-- Daging Asap Utama (Gramasi Fleksibel, default awal 100g)
(
    'm0000001-0000-0000-0000-000000000001',
    'c0000001-0000-0000-0000-000000000001',
    'Brisket Asap',
    'Brisket sapi pilihan diasap lambat dengan kayu keras lokal hingga bark renyah gurih dan smoke ring sempurna.',
    'restaurant',
    20000,
    'per_gram',
    NULL,
    NULL,
    'brisket',
    100,
    100,
    FALSE,
    TRUE,
    TRUE,
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
),
(
    'm0000002-0000-0000-0000-000000000002',
    'c0000001-0000-0000-0000-000000000001',
    'Lidah Sapi Asap',
    'Lidah sapi bertekstur empuk lumer dengan aroma asap khas dan bumbu marinasi rempah tradisional.',
    'restaurant',
    65000,
    'per_portion',
    NULL,
    NULL,
    'lidah_sapi',
    100,
    100,
    FALSE,
    TRUE,
    TRUE,
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80'
),
(
    'm0000003-0000-0000-0000-000000000001',
    'c0000001-0000-0000-0000-000000000001',
    'Domba Asap Bumbu Kerecek',
    'Potongan daging domba muda diasap harum, disajikan dengan racikan bumbu kerecek pedas gurih khas daerah.',
    'restaurant',
    75000,
    'per_portion',
    NULL,
    NULL,
    'domba',
    100,
    100,
    FALSE,
    TRUE,
    TRUE,
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
),
(
    'm0000004-0000-0000-0000-000000000001',
    'c0000001-0000-0000-0000-000000000001',
    'Ayam Asap',
    'Ayam utuh/potong diasap perlahan dengan rempah asap spesial, kulit kecokelatan mengkilap dan daging berjus.',
    'restaurant',
    150000,
    'per_portion',
    NULL,
    NULL,
    'ayam',
    100,
    100,
    FALSE,
    TRUE,
    TRUE,
    'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80'
),
(
    'm0000005-0000-0000-0000-000000000001',
    'c0000001-0000-0000-0000-000000000001',
    'Bebek Asap',
    'Bebek pilihan dengan bumbu meresap hingga ke serat tulang, diasap kayu pilihan menghasilkan aroma legendaris.',
    'restaurant',
    145000,
    'per_portion',
    NULL,
    NULL,
    'bebek',
    100,
    100,
    FALSE,
    TRUE,
    TRUE,
    'https://images.unsplash.com/photo-1514944298352-78d122c1e7fd?auto=format&fit=crop&w=800&q=80'
),
(
    'm0000006-0000-0000-0000-000000000001',
    'c0000001-0000-0000-0000-000000000001',
    'Salmon Asap',
    'Fillet salmon segar diasap lembut suhu terjaga, kaya rasa alami, lembut dan bercita rasa gurih luhur.',
    'restaurant',
    120000,
    'per_portion',
    NULL,
    NULL,
    'salmon',
    100,
    100,
    FALSE,
    TRUE,
    TRUE,
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80'
),
-- Sop & Kuah (Konfigurasi harga rentang Rp80.000–Rp180.000)
(
    'm0000007-0000-0000-0000-000000000001',
    'c0000002-0000-0000-0000-000000000002',
    'Sup Jamur Labu Asap',
    'Sup hangat dari labu parang panggang dan jamur hutan liar berpadu aroma asap kayu alami.',
    'restaurant',
    80000,
    'per_portion',
    80000,
    180000,
    'none',
    0,
    0,
    FALSE,
    TRUE,
    TRUE,
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80'
),
-- Sayuran & Pelengkap
(
    'm0000008-0000-0000-0000-000000000001',
    'c0000003-0000-0000-0000-000000000003',
    'Salad Hutan',
    'Daun-daunan liar segar dataran tinggi dengan dressing asam manis segar dan taburan biji-bijian.',
    'restaurant',
    40000,
    'per_portion',
    NULL,
    NULL,
    'none',
    0,
    0,
    FALSE,
    TRUE,
    TRUE,
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80'
),
(
    'm0000009-0000-0000-0000-000000000001',
    'c0000003-0000-0000-0000-000000000003',
    'Terong Bakar dan Jamur',
    'Terong ungu dibakar arang dipadukan jamur tiram oseng gurih bumbu bawang.',
    'restaurant',
    45000,
    'per_portion',
    NULL,
    NULL,
    'none',
    0,
    0,
    FALSE,
    TRUE,
    TRUE,
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'
),
(
    'm0000010-0000-0000-0000-000000000001',
    'c0000003-0000-0000-0000-000000000003',
    'Kentang Asap',
    'Kentang utuh diasap lambat, empuk merekah dengan sentuhan mentega bawang dan garam laut.',
    'restaurant',
    45000,
    'per_portion',
    NULL,
    NULL,
    'none',
    0,
    0,
    FALSE,
    TRUE,
    TRUE,
    'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80'
),
(
    'm0000011-0000-0000-0000-000000000001',
    'c0000003-0000-0000-0000-000000000003',
    'Ubi Asap',
    'Ubi madu panggang asap hangat beraroma karamel alami yang manis legit.',
    'restaurant',
    45000,
    'per_portion',
    NULL,
    NULL,
    'none',
    0,
    0,
    FALSE,
    TRUE,
    TRUE,
    'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=800&q=80'
),
(
    'm0000012-0000-0000-0000-000000000001',
    'c0000003-0000-0000-0000-000000000003',
    'Tomat',
    'Tomat panggang arang manis segar dengan taburan oregano dan minyak zaitun.',
    'restaurant',
    5000,
    'per_portion',
    NULL,
    NULL,
    'none',
    0,
    0,
    FALSE,
    TRUE,
    TRUE,
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80'
),
(
    'm0000013-0000-0000-0000-000000000001',
    'c0000003-0000-0000-0000-000000000003',
    'Bombay',
    'Bawang bombay karamel asap panggang manis gurih sebagai pendamping daging.',
    'restaurant',
    10000,
    'per_portion',
    NULL,
    NULL,
    'none',
    0,
    0,
    FALSE,
    TRUE,
    TRUE,
    'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80'
),
-- Nasi & Karbohidrat (Aturan Khusus: Nasi Goreng Fixed 30g Daging)
(
    'm0000014-0000-0000-0000-000000000001',
    'c0000004-0000-0000-0000-000000000004',
    'Nasi Goreng Daging Asap',
    'Nasi goreng wajan besi dengan potongan daging sapi asap 30g, aroma smokey pekat dan telur mata sapi.',
    'restaurant',
    40000,
    'per_portion',
    NULL,
    NULL,
    'brisket',
    30,
    30,
    TRUE,
    TRUE,
    TRUE,
    'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80'
),
(
    'm0000015-0000-0000-0000-000000000001',
    'c0000004-0000-0000-0000-000000000004',
    'Nasi Goreng Domba Asap',
    'Nasi goreng rempah istimewa dengan potongan domba asap 30g bercita rasa gurih pedas nikmat.',
    'restaurant',
    45000,
    'per_portion',
    NULL,
    NULL,
    'domba',
    30,
    30,
    TRUE,
    TRUE,
    TRUE,
    'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80'
),
(
    'm0000016-0000-0000-0000-000000000001',
    'c0000004-0000-0000-0000-000000000004',
    'Nasi Putih',
    'Nasi beras pandan wangi pulen hangat mengepul.',
    'restaurant',
    8000,
    'per_portion',
    NULL,
    NULL,
    'none',
    0,
    0,
    FALSE,
    TRUE,
    TRUE,
    'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=800&q=80'
)
ON CONFLICT (id) DO NOTHING;

-- 3. MENU PENGINAPAN (Eksklusif / Akses Tamu Penginapan)
INSERT INTO public.menus (
    id, category_id, name, description, access_scope,
    price, price_basis, price_range_min, price_range_max,
    meat_type, standard_meat_gram, min_meat_gram, is_fixed_gram,
    is_available, is_active, image_url
) VALUES
(
    'm0000017-0000-0000-0000-000000000001',
    'c0000005-0000-0000-0000-000000000005',
    'Marlin Asap',
    'Ikan marlin laut dalam diasap kayu buah segar, bertekstur padat lembut tanpa amis khas pesisir.',
    'lodging',
    40000,
    'per_portion',
    NULL,
    NULL,
    'marlin',
    100,
    100,
    FALSE,
    TRUE,
    TRUE,
    'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=800&q=80'
),
(
    'm0000018-0000-0000-0000-000000000001',
    'c0000005-0000-0000-0000-000000000005',
    'Ungkep Ayam Kampung',
    'Ayam kampung empuk bumbu kuning lengkuas khas desa yang diungkep api kecil berjam-jam.',
    'lodging',
    175000,
    'per_portion',
    NULL,
    NULL,
    'ayam',
    100,
    100,
    FALSE,
    TRUE,
    TRUE,
    'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80'
),
(
    'm0000019-0000-0000-0000-000000000001',
    'c0000005-0000-0000-0000-000000000005',
    'Kucai Telur Asin',
    'Sayur kucai sawah segar ditumis gurih dengan butiran telur asin Brebes.',
    'lodging',
    40000,
    'per_portion',
    NULL,
    NULL,
    'none',
    0,
    0,
    FALSE,
    TRUE,
    TRUE,
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'
),
(
    'm0000020-0000-0000-0000-000000000001',
    'c0000005-0000-0000-0000-000000000005',
    'Mangut Lele Asap',
    'Lele lokal diasap arang lalu dimasak dalam kuah mangut santan pedas gurih aroma daun kemangi.',
    'lodging',
    30000,
    'per_portion',
    NULL,
    NULL,
    'lele',
    100,
    100,
    FALSE,
    TRUE,
    TRUE,
    'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=800&q=80'
),
(
    'm0000021-0000-0000-0000-000000000001',
    'c0000005-0000-0000-0000-000000000005',
    'Pepes Tahu',
    'Tahu sutra lembut dibumbui daun kemangi dan rempah parut, dibungkus daun pisang bakar.',
    'lodging',
    20000,
    'per_portion',
    NULL,
    NULL,
    'none',
    0,
    0,
    FALSE,
    TRUE,
    TRUE,
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
)
ON CONFLICT (id) DO NOTHING;

-- 4. MASTER SETTINGS AWAL
INSERT INTO public.settings (
    id, business_name, whatsapp_number, address,
    default_lodging_price_per_person, auto_backup_enabled, auto_backup_schedule
) VALUES (
    'general',
    'ASAP ISEP — Daging Asap',
    '+6281234567890',
    'Jl. Raya Lereng Asap No. 8, Cisarua, Bogor',
    200000,
    TRUE,
    '23:59 WIB'
)
ON CONFLICT (id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    default_lodging_price_per_person = EXCLUDED.default_lodging_price_per_person;
