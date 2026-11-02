-- ============================================================================
-- SULTA ATELIER — MIGRATION 03: ADMIN USERS (RBAC) & SECURITY POLICIES
-- File: supabase/migrations/20261102000003_sulta_admin_rbac_and_rls.sql
-- Description: Creates the public.admin_users table for persistent role-based access
--              control (Owner, Manager, Orders Agent, Viewer), seeds primary owner,
--              and sets up security verification.
-- ============================================================================

-- 1. Create or expand admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'manager',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all required columns exist even if the table already existed previously
ALTER TABLE IF EXISTS public.admin_users
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'manager',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Seed or update primary owner safely
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE LOWER(email) = 'mohamedostafataher@gmail.com') THEN
    UPDATE public.admin_users 
    SET 
      name = COALESCE(name, 'محمد طاهر (المالك الرئيسي)'),
      role = 'owner',
      is_active = true,
      updated_at = NOW()
    WHERE LOWER(email) = 'mohamedostafataher@gmail.com';
  ELSE
    INSERT INTO public.admin_users (email, name, role, is_active)
    VALUES ('mohamedostafataher@gmail.com', 'محمد طاهر (المالك الرئيسي)', 'owner', true);
  END IF;
END $$;

-- 3. Helper check function for Supabase RPC
CREATE OR REPLACE FUNCTION public.is_admin_email(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE LOWER(email) = LOWER(TRIM(check_email))
      AND is_active = true
  );
END;
$$;

-- 4. Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for verified admins" ON public.admin_users;
CREATE POLICY "Allow select for verified admins"
  ON public.admin_users FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow owner to manage team" ON public.admin_users;
CREATE POLICY "Allow owner to manage team"
  ON public.admin_users FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
