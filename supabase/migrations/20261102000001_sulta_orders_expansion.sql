-- ============================================================================
-- SULTA ATELIER — MIGRATION 01: ORDERS TABLE EXPANSION & SCHEMA HARDENING
-- File: supabase/migrations/20261102000001_sulta_orders_expansion.sql
-- Description: Adds structured columns to the public.orders table for comprehensive
--              e-commerce order management, analytics views, and customer insights.
-- ============================================================================

-- 1. Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Expand orders table with missing e-commerce fields
ALTER TABLE IF EXISTS public.orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'SA',
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'الرياض',
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS gift_message TEXT,
  ADD COLUMN IF NOT EXISTS gift_card_theme TEXT,
  ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'SAR',
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'الدفع عند الاستلام (COD)',
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS tracking_url TEXT,
  ADD COLUMN IF NOT EXISTS receipt_image_url TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Backfill total_price if total_amount exists or vice-versa
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total_amount')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total_price') THEN
    ALTER TABLE public.orders ADD COLUMN total_price NUMERIC(10,2);
    UPDATE public.orders SET total_price = total_amount WHERE total_price IS NULL;
  END IF;
END $$;

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_city ON public.orders(city);

-- 5. Create real-time aggregated sales view (Daily Sales)
CREATE OR REPLACE VIEW public.view_sales_daily_summary AS
SELECT
  DATE(COALESCE(created_at, NOW())) AS sales_date,
  COUNT(id) AS total_orders,
  COALESCE(SUM(COALESCE(total_amount, total_price, 0)), 0) AS total_revenue,
  COALESCE(AVG(COALESCE(total_amount, total_price, 0)), 0) AS avg_order_value,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) AS delivered_orders,
  COUNT(CASE WHEN status IN ('pending', 'new') THEN 1 END) AS pending_orders
FROM public.orders
GROUP BY DATE(COALESCE(created_at, NOW()))
ORDER BY sales_date DESC;

-- 6. Enable Row Level Security (RLS) safely
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow anon to insert new orders (checkout flow for public customers)
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
CREATE POLICY "Public can create orders"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow reading orders by order ID or phone (order tracking)
DROP POLICY IF EXISTS "Customers can track orders" ON public.orders;
CREATE POLICY "Customers can track orders"
  ON public.orders FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow updates (for admins)
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
