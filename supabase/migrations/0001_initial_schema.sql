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
