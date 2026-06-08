-- ==========================================
-- 👑 SULTA LUXURY COUTURE - COMPLETE SUPABASE PRODUCTION DATABASE SCHEMA 👑
-- 
-- HOW TO RUN:
-- 1. Open your Supabase Dashboard (https://supabase.com).
-- 2. Go to the SQL Editor and open a New Query.
-- 3. Copy and paste this entire script, then click "Run" to establish the entire production schema.
-- ==========================================

-- 1. Profiles Table (سجلات العملاء الفاخرين)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    country TEXT,
    city TEXT,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Addresses Table (عناوين التوصيل والخدمة المنزلية)
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    notes TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Categories Table (فئات المعروضات)
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Products Table (قائمة قطع النوم واللانج وير كوتور)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,
    short_description TEXT,
    price DECIMAL(12,2) NOT NULL,
    sale_price DECIMAL(12,2),
    price_eg DECIMAL(12,2) NOT NULL DEFAULT 4000.00,
    sale_price_eg DECIMAL(12,2),
    price_sa DECIMAL(12,2) NOT NULL DEFAULT 400.00,
    sale_price_sa DECIMAL(12,2),
    sku TEXT UNIQUE,
    stock_quantity INT NOT NULL DEFAULT 10,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('satin', 'cotton', 'loungewear', 'dresses', 'new')),
    category_ar TEXT NOT NULL,
    fabric_ar TEXT NOT NULL,
    fabric_en TEXT NOT NULL,
    wash_instructions_ar TEXT NOT NULL,
    images TEXT[] NOT NULL DEFAULT '{}'::text[],
    video TEXT,
    colors JSONB NOT NULL DEFAULT '[]'::jsonb, -- مصفوفة الألوان { name, hex }
    sizes TEXT[] NOT NULL DEFAULT '{}'::text[],
    is_best_seller BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    rating DECIMAL(2,1) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    stock INT NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Product Images Table (معرض صور السلع)
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INT DEFAULT 0
);

-- 6. Product Variants Table (تفاصيل مقاسات وألوان القطع الفاخرة ومخزونها)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
    color TEXT NOT NULL,
    size TEXT NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Collections Table (تشكيلات المجموعات الموسمية الفاخرة)
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Coupons Table (كوبونات الخصم والرموز المميزة)
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(12,2) NOT NULL,
    discount_percent INT NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    description TEXT,
    active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Orders Table (سجلات الطلبات والفواتير)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    country TEXT NOT NULL CHECK (country IN ('EG', 'SA')),
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    notes TEXT,
    gift_message TEXT,
    gift_card_theme TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ productId, productName, color, size, quantity, price }]
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    shipping_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(12,2) NOT NULL,
    currency TEXT NOT NULL CHECK (currency IN ('EGP', 'SAR')),
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'shipped', 'delivered')) DEFAULT 'pending',
    date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Order Items Table (تفاصيل سلع الفواتير الفردية)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID,
    quantity INT NOT NULL CHECK (quantity > 0),
    price DECIMAL(12,2) NOT NULL
);

-- 11. Payments Table (سجلات الدفع والتحقق المالي)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Reviews Table (تقييمات وشهادات زبائن سولتا)
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    username TEXT NOT NULL,
    avatar TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    review TEXT,
    images TEXT[],
    date TEXT NOT NULL,
    country TEXT NOT NULL,
    product_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. Wishlist Table (قوائم المقتنيات المفضلة والأمنيات)
CREATE TABLE IF NOT EXISTS public.wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. Cart Items Table (محتويات سلة الشراء للمحافظة على الجلسات)
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. Loyalty Points Table (نقاط الولاء ومستويات نادي كوتور)
CREATE TABLE IF NOT EXISTS public.loyalty_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    points INT NOT NULL DEFAULT 0,
    level TEXT NOT NULL DEFAULT 'Silver' CHECK (level IN ('Silver', 'Gold', 'Platinum')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. Notifications Table (التنبيهات والإشعارات الفاخرة للعملاء)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 17. Support Tickets Table (بطاقات الدعم والاستبدال الملكي والضمان الذهبي)
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 18. AI Size Predictions Table (سجلات مقاسات الذكاء الاصطناعي للأجسام)
CREATE TABLE IF NOT EXISTS public.ai_size_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    height NUMERIC,
    weight NUMERIC,
    body_shape TEXT,
    recommended_size TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 19. Settings Table (إعدادات ومعلومات البوتيك العليا وصندوق الاتصال)
CREATE TABLE IF NOT EXISTS public.settings (
    id INT PRIMARY KEY DEFAULT 1,
    site_name TEXT NOT NULL DEFAULT 'Sulta Luxury Sleepwear',
    logo TEXT,
    promo_banner_ar TEXT,
    promo_end_time TIMESTAMP WITH TIME ZONE,
    hero_mini_alert_ar TEXT,
    hero_subtitle_ar TEXT,
    hero_description_ar TEXT,
    hero_images JSONB DEFAULT '[]'::jsonb,
    contact_email TEXT DEFAULT 'royal@sultawear.com',
    contact_phone TEXT DEFAULT '+966500000000',
    whatsapp TEXT DEFAULT '966500000000',
    instagram TEXT DEFAULT 'sulta_couture',
    facebook TEXT DEFAULT 'sulta_couture',
    tiktok TEXT DEFAULT 'sulta_couture',
    facebook_pixel_id TEXT,
    google_analytics_id TEXT,
    snapchat_pixel_id TEXT,
    tiktok_pixel_id TEXT,
    shipping_rates JSONB DEFAULT '[]'::jsonb,
    currency TEXT DEFAULT 'SAR',
    default_shipping_fee NUMERIC DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT single_row CHECK (id = 1)
);

-- 20. Homepage Sections Table (أقسام وتخطيطات الصفحة الرئيسية الفاخرة)
CREATE TABLE IF NOT EXISTS public.homepage_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key TEXT UNIQUE NOT NULL,
    content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed initial boutique settings
INSERT INTO public.settings (id, site_name, contact_email, contact_phone, whatsapp, instagram, facebook, tiktok)
VALUES (1, 'Sulta High Couture Sleepwear', 'royal@sultawear.com', '+966500000000', '966500000000', 'sulta_couture', 'sulta_couture', 'sulta_couture')
ON CONFLICT (id) DO NOTHING;

-- Seed default VIP Categories
INSERT INTO public.categories (id, name, slug, image_url) VALUES
('satin', 'ساتان ملكي حريري', 'satin', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=400&q=80'),
('cotton', 'بيجامات قطن طبيعي', 'cotton', 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=400&q=80'),
('loungewear', 'لانج وير كوتور', 'loungewear', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=400&q=80'),
('dresses', 'فساتين نوم', 'dresses', 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=400&q=80'),
('new', 'المجموعة الجديدة والتريند الأكثر مبيعاً بمصر والسعودية', 'new', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=400&q=80')
ON CONFLICT (id) DO NOTHING;


-- Enable Realtime safely for standard tables:
do $$
begin
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products') then
        alter publication supabase_realtime add table public.products;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'coupons') then
        alter publication supabase_realtime add table public.coupons;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders') then
        alter publication supabase_realtime add table public.orders;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reviews') then
        alter publication supabase_realtime add table public.reviews;
    end if;
end $$;

-- Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Dynamic Public Access Policies
CREATE POLICY "Allow public select of products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public select of coupons" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "Allow public select of reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow public select of categories" ON public.categories FOR SELECT USING (true);

CREATE POLICY "Allow public inserts of orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public inserts of reviews" ON public.reviews FOR INSERT WITH CHECK (true);

-- Allow full admin operations for everyone for local boutique development controls (Using correct FOR ALL syntax)
CREATE POLICY "Allow full control of products" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow full control of coupons" ON public.coupons FOR ALL USING (true);
CREATE POLICY "Allow full control of orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Allow full control of reviews" ON public.reviews FOR ALL USING (true);
CREATE POLICY "Allow full control of profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Allow full control of addresses" ON public.addresses FOR ALL USING (true);
CREATE POLICY "Allow full control of categories" ON public.categories FOR ALL USING (true);

-- ==========================================
-- 🔔 STORAGE BUCKETS INITIALIZATION AND POLICIES
-- ==========================================

-- 1. Create the 'products' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('products', 'products', true, 52428800, '{"image/*", "video/*"}'::text[])
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies for 'products' bucket
-- Allow public select/read of files
CREATE POLICY "Allow public select of objects" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'products');

-- Allow anyone to upload new files
CREATE POLICY "Allow public insert of objects" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'products');

-- Allow anyone to update file details
CREATE POLICY "Allow public update of objects" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'products');

-- Allow anyone to delete files
CREATE POLICY "Allow public delete of objects" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'products');

-- ==========================================
-- 🛡️ [PHASE 6 & 7] ACTIVITY LOGS AND SYSTEM HEALTH 🛡️
-- ==========================================

-- 12. Activity Logs Table (سجلات النشاطات والمراقبة)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    details TEXT,
    admin_id TEXT DEFAULT 'system',
    admin_name TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: We trust internal usage for activity logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous full control of activity logs" ON public.activity_logs FOR ALL USING (true);

-- Add to Realtime Publication
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'activity_logs') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
    END IF;
END $$;

-- 13. System Health Monitor / Dashboard Insights (إحصائيات النظام الفورية)
CREATE OR REPLACE VIEW public.dashboard_insights AS
SELECT
    (SELECT COUNT(*) FROM public.products) as total_products,
    (SELECT COUNT(*) FROM public.orders) as total_orders,
    (SELECT COUNT(*) FROM public.profiles) as total_customers,
    (SELECT COALESCE(SUM(total), 0) FROM public.orders) as total_revenue,
    (SELECT COUNT(*) FROM public.products WHERE stock <= 5) as low_stock_products;

-- Setup full-text search capability for the products table (Phase 8: Advanced Search)
-- NOTE: Uses Arabic vector since the language is mostly Arabic.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('arabic', coalesce(name_ar, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(name_en, '')), 'A') ||
    setweight(to_tsvector('arabic', coalesce(description_ar, '')), 'B') ||
    setweight(to_tsvector('arabic', coalesce(category_ar, '')), 'C') ||
    setweight(to_tsvector('arabic', coalesce(fabric_ar, '')), 'D')
) STORED;

CREATE INDEX IF NOT EXISTS products_search_idx ON public.products USING GIN (search_vector);


