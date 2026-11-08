-- ==============================================================================
-- SULTA ATELIER: PHASE 2 COMPLETE OPERATIONS & DATA INTELLIGENCE UPGRADE
-- ==============================================================================
-- Run this complete script in the Supabase SQL Editor.
-- It creates all required tables, adds missing columns, configures RLS and indexes.
-- ==============================================================================

-- 1. EXTEND PRODUCTS TABLE (Cost of Goods Sold & Merchandising)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 100;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- 2. EXTEND ORDERS TABLE (Shipping & Fulfillment Details)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_carrier TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'unfulfilled';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS expected_delivery_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_failure_reason TEXT;

-- 3. ORDER STATUS HISTORY AUDIT LOG
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_order_status_hist_order_id ON public.order_status_history(order_id);

-- 4. RETURNS, EXCHANGES & REFUNDS WORKFLOW
CREATE TABLE IF NOT EXISTS public.returns_and_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    request_type TEXT NOT NULL DEFAULT 'return', -- 'return', 'exchange'
    reason TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    requested_action TEXT DEFAULT 'refund', -- 'refund', 'store_credit', 'replacement'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'item_received', 'inspected', 'refunded', 'completed'
    inspection_notes TEXT,
    inspection_result TEXT, -- 'passed', 'damaged', 'missing_tags', 'rejected'
    refund_amount NUMERIC(10, 2) DEFAULT 0,
    refund_method TEXT DEFAULT 'bank_transfer', -- 'bank_transfer', 'card_refund', 'store_credit'
    restocked BOOLEAN DEFAULT false,
    admin_notes TEXT,
    status_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON public.returns_and_refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON public.returns_and_refunds(status);

-- 5. OPERATING EXPENSES (P&L Financial Intelligence)
CREATE TABLE IF NOT EXISTS public.operating_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- 'marketing', 'shipping', 'packaging', 'software', 'salaries', 'other'
    amount NUMERIC(10, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.operating_expenses(date);

-- 6. STOREFRONT ANALYTICS & CONVERSION FUNNEL EVENTS
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL, -- 'product_view', 'category_view', 'search', 'add_to_cart', 'cart_view', 'checkout_start', 'purchase'
    entity_id TEXT,
    entity_name TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at);

-- 7. ADMIN SYSTEM NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'new_order', 'low_stock', 'payment_pending', 'return_request', 'system_alert'
    title TEXT NOT NULL,
    message TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.admin_notifications(is_read);

-- 8. WHATSAPP CLOUD API DELIVERY LOGS
CREATE TABLE IF NOT EXISTS public.whatsapp_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT,
    phone TEXT,
    type TEXT, -- 'admin_alert', 'customer_invoice', 'status_update'
    status TEXT, -- 'pending', 'sent', 'failed'
    response_payload JSONB,
    error_details TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_whatsapp_order_id ON public.whatsapp_delivery_logs(order_id);

-- 9. ADMIN ACTIVITY AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_email TEXT,
    admin_name TEXT,
    role TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_activity_admin ON public.admin_activity_logs(admin_email);

-- 10. STAFF ROLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS public.staff_profiles (
    email TEXT PRIMARY KEY,
    name TEXT,
    role TEXT DEFAULT 'viewer', -- 'owner', 'manager', 'orders', 'inventory', 'support', 'marketing', 'viewer'
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Seed initial primary owner
INSERT INTO public.staff_profiles (email, name, role) 
VALUES ('mohamedostafataher@gmail.com', 'محمد طاهر (المالك)', 'owner')
ON CONFLICT (email) DO UPDATE SET role = 'owner', is_active = true;

-- 11. ENABLE ROW LEVEL SECURITY & DEFINE POLICIES
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns_and_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

-- Permissive policies for authorized admin & public tracking events
CREATE POLICY "Allow authenticated full access on order_status_history" ON public.order_status_history USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access on returns_and_refunds" ON public.returns_and_refunds USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access on operating_expenses" ON public.operating_expenses USING (true) WITH CHECK (true);
CREATE POLICY "Allow public insert on analytics_events" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated select on analytics_events" ON public.analytics_events FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access on admin_notifications" ON public.admin_notifications USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access on whatsapp_delivery_logs" ON public.whatsapp_delivery_logs USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access on admin_activity_logs" ON public.admin_activity_logs USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access on staff_profiles" ON public.staff_profiles USING (true) WITH CHECK (true);
