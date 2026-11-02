-- ============================================================================
-- SULTA ATELIER — MIGRATION 02: INVENTORY MOVEMENTS & AUDIT ACTIVITY LOGS
-- File: supabase/migrations/20261102000002_sulta_inventory_and_audit.sql
-- Description: Establishes dedicated tables for physical stock movements tracking
--              and administrative activity auditing.
-- ============================================================================

-- 1. Create stock_movements table
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  variant TEXT DEFAULT 'One Size',
  change_qty INT NOT NULL,
  new_stock_level INT,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('order_deduction', 'order_cancellation_restock', 'manual_restock', 'inventory_audit', 'damage_adjustment')),
  reason TEXT,
  reference_order_id TEXT,
  admin_name TEXT DEFAULT 'النظام التلقائي',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_prod ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON public.stock_movements(created_at DESC);

-- Enable RLS on stock_movements
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read stock movements" ON public.stock_movements;
CREATE POLICY "Public read stock movements"
  ON public.stock_movements FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Insert stock movements" ON public.stock_movements;
CREATE POLICY "Insert stock movements"
  ON public.stock_movements FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 2. Create activity_logs table (if not exists or standardize it)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  admin_id TEXT DEFAULT 'system',
  admin_email TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_date ON public.activity_logs(created_at DESC);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read activity logs" ON public.activity_logs;
CREATE POLICY "Public read activity logs"
  ON public.activity_logs FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Insert activity logs" ON public.activity_logs;
CREATE POLICY "Insert activity logs"
  ON public.activity_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
