-- ==============================================================================
-- SULTA ATELIER: Percentage Discount System Migration & Operations
-- ==============================================================================

-- 1. Add discount system columns to public.products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS regular_price numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS regular_price_since date DEFAULT CURRENT_DATE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 90);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_starts_at timestamptz;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_ends_at timestamptz;

-- 2. Add store-wide discount settings columns to settings table
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS store_discount_percent numeric DEFAULT 0 CHECK (store_discount_percent >= 0 AND store_discount_percent <= 90);
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS store_discount_starts_at timestamptz;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS store_discount_ends_at timestamptz;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS min_reference_days integer DEFAULT 14;

-- 3. Data Migration: Set regular_price from current active site prices without changing any displayed price
UPDATE public.products
SET 
  regular_price = COALESCE(price_sa, price, 69),
  regular_price_since = CURRENT_DATE,
  discount_percent = 0,
  discount_starts_at = NULL,
  discount_ends_at = NULL
WHERE regular_price IS NULL;

-- Ensure specific product prices are populated cleanly
UPDATE public.products SET regular_price = 75, price_sa = 75, regular_price_since = CURRENT_DATE WHERE id::text LIKE '51005136%';
UPDATE public.products SET regular_price = 69, price_sa = 69, regular_price_since = CURRENT_DATE WHERE id::text LIKE '614f6daa%';
UPDATE public.products SET regular_price = 69, price_sa = 69, regular_price_since = CURRENT_DATE WHERE id::text LIKE '78f851f3%';
UPDATE public.products SET regular_price = 99, price_sa = 99, regular_price_since = CURRENT_DATE WHERE id::text LIKE '8d738e1c%';
UPDATE public.products SET regular_price = 99, price_sa = 99, regular_price_since = CURRENT_DATE WHERE id::text LIKE '54929551%';
UPDATE public.products SET regular_price = 99, price_sa = 99, regular_price_since = CURRENT_DATE WHERE id::text LIKE 'bf2ba4f4%';
UPDATE public.products SET regular_price = 75, price_sa = 75, regular_price_since = CURRENT_DATE WHERE id::text LIKE '1d4e8104%';


-- ==============================================================================
-- SQL HELPER QUERIES FOR STORE ADMIN (Ready to copy & run)
-- ==============================================================================

-- A) Enable X% discount on a specific product for N days:
-- Example: Apply 20% discount on Product 614f6daa for 7 days
/*
UPDATE public.products
SET 
  discount_percent = 20,
  discount_starts_at = NOW(),
  discount_ends_at = NOW() + INTERVAL '7 days'
WHERE id::text LIKE '614f6daa%';
*/

-- B) Enable Store-Wide Discount (e.g., 15% discount across all products for 3 days):
/*
UPDATE public.settings
SET 
  store_discount_percent = 15,
  store_discount_starts_at = NOW(),
  store_discount_ends_at = NOW() + INTERVAL '3 days';
*/

-- C) Stop discount on a product:
/*
UPDATE public.products
SET 
  discount_percent = 0,
  discount_starts_at = NULL,
  discount_ends_at = NULL
WHERE id::text LIKE '614f6daa%';
*/

-- D) Stop store-wide discount:
/*
UPDATE public.settings
SET 
  store_discount_percent = 0,
  store_discount_starts_at = NULL,
  store_discount_ends_at = NULL;
*/
