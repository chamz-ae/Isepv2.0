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
