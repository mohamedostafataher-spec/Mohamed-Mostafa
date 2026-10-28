-- SULTA Atelier - Official Supabase Database Schema
-- -------------------------------------------------------------
-- This file contains the complete PostgreSQL schema for the 
-- SULTA Couture luxury e-commerce platform.

-- 1. UTILITIES & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_ar TEXT,
    name_en TEXT,
    description TEXT,
    description_ar TEXT,
    description_en TEXT,
    price_sa NUMERIC(10, 2) DEFAULT 0,
    price_eg NUMERIC(10, 2) DEFAULT 0,
    sale_price_sa NUMERIC(10, 2),
    sale_price_eg NUMERIC(10, 2),
    category TEXT DEFAULT 'sleepwear',
    category_ar TEXT,
    image_url TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    video TEXT,
    colors JSONB DEFAULT '[]'::jsonb,
    sizes JSONB DEFAULT '["S", "M", "L", "XL"]'::jsonb,
    stock INTEGER DEFAULT 10,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    is_best_seller BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active',
    sku TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    collection TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'SA',
    total_price NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'SAR',
    payment_method TEXT DEFAULT 'cod',
    status TEXT DEFAULT 'pending',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    gift_message TEXT,
    gift_card_theme TEXT,
    tracking_number TEXT,
    tracking_url TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    avatar TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    country TEXT DEFAULT 'SA',
    is_verified_purchase BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'approved',
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
    code TEXT PRIMARY KEY,
    discount_percent INTEGER NOT NULL,
    description TEXT,
    expires_at DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. SETTINGS TABLE (Singleton)
CREATE TABLE IF NOT EXISTS public.settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    site_name TEXT DEFAULT 'SULTA',
    logo TEXT,
    whatsapp TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    store_domain TEXT,
    facebook_pixel_id TEXT,
    meta_capi_access_token TEXT,
    tiktok_pixel_id TEXT,
    snapchat_pixel_id TEXT,
    google_analytics_id TEXT,
    default_shipping_fee NUMERIC(10, 2) DEFAULT 0,
    bank_name TEXT,
    bank_account_name TEXT,
    bank_account_number TEXT,
    bank_iban TEXT,
    bank_qr_code_url TEXT,
    admin_team_members JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. ANALYTICS: USER SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    referrer TEXT,
    landing_page TEXT,
    device TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. ANALYTICS: VISITORS TABLE (Alternate storage)
CREATE TABLE IF NOT EXISTS public.visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT,
    page TEXT,
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    city TEXT,
    country TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. SUPPORT TICKETS (Fallback for Analytics)
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT,
    email TEXT,
    phone TEXT,
    type TEXT DEFAULT 'support',
    status TEXT DEFAULT 'open',
    subject TEXT,
    message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. POLICIES (RLS - Row Level Security)
-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Anonymous Select for Products/Reviews/Coupons/Settings
CREATE POLICY "Allow public read access" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.settings FOR SELECT USING (true);

-- Public Insert for Orders/Sessions/Tickets/Reviews
CREATE POLICY "Allow public insert" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON public.user_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON public.visitors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON public.support_tickets FOR INSERT WITH CHECK (true);

-- Admin Access (Full Control - simplified for setup)
-- Note: In production, use service_role for admin dashboard
CREATE POLICY "Allow service_role full access" ON public.products USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access" ON public.orders USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access" ON public.settings USING (true) WITH CHECK (true);
