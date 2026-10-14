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
