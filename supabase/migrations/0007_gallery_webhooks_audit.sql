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
