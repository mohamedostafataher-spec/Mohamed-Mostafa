-- SQL MIGRATION TO FIX PERFORMANCE AND API ERRORS
-- Run this in Supabase SQL Editor

-- 1. Create Categories table if missing
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_ar TEXT,
    name_en TEXT,
    slug TEXT UNIQUE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create Collections table if missing
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    name_ar TEXT,
    name_en TEXT,
    description TEXT,
    description_ar TEXT,
    description_en TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Fix Reviews table columns if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='user_id') THEN
        ALTER TABLE public.reviews ADD COLUMN user_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='product_name') THEN
        ALTER TABLE public.reviews ADD COLUMN product_name TEXT;
    END IF;
END $$;

-- 4. Enable RLS and Policies for new tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read collections" ON public.collections FOR SELECT USING (true);

-- 5. Improve Cache lifetimes for storage (if possible via SQL, but usually done via bucket settings)
-- For now, ensure buckets are public
-- UPDATE storage.buckets SET public = true WHERE id = 'products';
