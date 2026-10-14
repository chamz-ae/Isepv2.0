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
