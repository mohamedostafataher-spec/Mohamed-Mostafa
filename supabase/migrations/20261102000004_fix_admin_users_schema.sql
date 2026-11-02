-- Fix for missing 'name' column in admin_users and ensure proper RBAC structure
-- This migration adds the missing 'name' column and ensures RLS is correctly set up.

DO $$ 
BEGIN 
    -- Add name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'admin_users' AND COLUMN_NAME = 'name') THEN
        ALTER TABLE public.admin_users ADD COLUMN name TEXT;
    END IF;

    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'admin_users' AND COLUMN_NAME = 'is_active') THEN
        ALTER TABLE public.admin_users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all admin users
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;
CREATE POLICY "Admins can view all admin users" 
ON public.admin_users 
FOR SELECT 
USING (
  auth.role() = 'authenticated' AND 
  EXISTS (SELECT 1 FROM public.admin_users WHERE email = auth.jwt() ->> 'email' AND is_active = true)
);

-- Policy: Super admins can manage admin users
DROP POLICY IF EXISTS "Super admins can manage admin users" ON public.admin_users;
CREATE POLICY "Super admins can manage admin users" 
ON public.admin_users 
FOR ALL 
USING (
  auth.role() = 'authenticated' AND 
  EXISTS (SELECT 1 FROM public.admin_users WHERE email = auth.jwt() ->> 'email' AND role = 'super_admin' AND is_active = true)
);

-- Re-insert or update a default super admin if needed (optional, depends on setup)
-- INSERT INTO public.admin_users (email, name, role, is_active)
-- VALUES ('admin@sulta.sa', 'Sulta Admin', 'super_admin', true)
-- ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
