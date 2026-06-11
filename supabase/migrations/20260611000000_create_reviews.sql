-- Table: reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    username VARCHAR(255) NOT NULL,
    avatar TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT NOT NULL,
    is_verified_purchase BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, hidden
    country VARCHAR(10) DEFAULT 'SA',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: review_images
CREATE TABLE IF NOT EXISTS public.review_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS reviews_product_id_idx ON public.reviews (product_id);
CREATE INDEX IF NOT EXISTS review_images_review_id_idx ON public.review_images (review_id);
CREATE INDEX IF NOT EXISTS reviews_status_idx ON public.reviews (status);

-- RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;

-- Policies for reviews
CREATE POLICY "Public reviews are viewable by everyone" ON public.reviews
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can insert their own reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Admin can manage all reviews (Example admin policy, assumes authenticated admin user)
CREATE POLICY "Admins can manage all reviews" ON public.reviews
    USING (auth.role() = 'authenticated'); -- This could be restricted to true admins in production

-- Policies for review_images
CREATE POLICY "Review images are viewable by everyone" ON public.review_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.reviews r WHERE r.id = review_id AND r.status = 'approved'
        )
    );

CREATE POLICY "Users can upload their own images" ON public.review_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.reviews r WHERE r.id = review_id AND (r.user_id = auth.uid() OR r.user_id IS NULL)
        )
    );

CREATE POLICY "Admins can manage review images" ON public.review_images
    USING (auth.role() = 'authenticated');
