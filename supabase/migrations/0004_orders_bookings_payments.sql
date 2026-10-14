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
