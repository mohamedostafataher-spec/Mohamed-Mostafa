-- ==============================================================================
-- SULTA ATELIER: Supabase Products Schema & Data Migration
-- ==============================================================================

-- 1. Ensure all columns exist on products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_sa numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_eg numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_price numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_price_sa numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_price_eg numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name_ar text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_ar text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS h1 text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS compare_at_price numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_ends_at timestamptz;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock integer DEFAULT 10;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS material text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS size_info text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS care_instructions text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. UPDATE Product (أ) - الحمراء المنقّطة بحمالات (id: 51005136-8066-4844-8efe-718cd7644e6b)
UPDATE public.products
SET
  name = 'بيجامة روج المنقّطة بحمالات',
  name_ar = 'بيجامة روج المنقّطة بحمالات',
  h1 = 'بيجامة نسائية حمراء منقّطة بحمالات — قطن وان سايز',
  seo_title = 'بيجامة نسائية حمراء منقّطة بحمالات قطن | سولتة',
  short_description = 'بيجامة نسائية حمراء منقّطة بحمالات من قطن ناعم ومريح. وان سايز من 45 إلى 80 كيلو. الكمية محدودة، اطلبيها من سولتة.',
  slug = 'red-polka-dot-strappy-cotton-pajama',
  price = 75,
  price_sa = 75,
  sale_price_sa = 75,
  compare_at_price = NULL,
  sale_ends_at = NULL,
  stock = 6,
  material = 'قطن ناعم',
  size_info = 'وان سايز يناسب من 45 إلى 80 كيلو',
  care_instructions = 'تُغسل بمويه باردة، ويفضّل بدون كلور، وتجنّبي الحرارة العالية.',
  description = 'بيجامة نسائية حمراء منقّطة بحمالات من سولتة، بلون أحمر جريء ونقط بيضاء ناعمة. الحمالات تربطينها على الكتف وفيها تجميعة عند الصدر تعطي شكلًا أنثويًا مريحًا. مصنوعة من قطن ناعم ومريح على البشرة للنوم وجلسات البيت.
• الخامة: قطن ناعم ومريح
• المقاس: وان سايز يناسب من 45 إلى 80 كيلو
• الكمية محدودة
طريقة الغسيل: تُغسل بمويه باردة، ويفضّل بدون كلور، وتجنّبي الحرارة العالية.',
  description_ar = 'بيجامة نسائية حمراء منقّطة بحمالات من سولتة، بلون أحمر جريء ونقط بيضاء ناعمة. الحمالات تربطينها على الكتف وفيها تجميعة عند الصدر تعطي شكلًا أنثويًا مريحًا. مصنوعة من قطن ناعم ومريح على البشرة للنوم وجلسات البيت.
• الخامة: قطن ناعم ومريح
• المقاس: وان سايز يناسب من 45 إلى 80 كيلو
• الكمية محدودة
طريقة الغسيل: تُغسل بمويه باردة، ويفضّل بدون كلور، وتجنّبي الحرارة العالية.',
  status = 'active',
  updated_at = now()
WHERE id::text LIKE '51005136%';

-- 3. UPDATE Product (ب) - فلورا: توليب وردي (id: 614f6daa-d291-410b-a450-be23de75f868)
UPDATE public.products
SET
  name = 'بيجامة فلورا — توليب',
  name_ar = 'بيجامة فلورا — توليب',
  h1 = 'بيجامة نسائية قطن كوريشة بطبعة التوليب — وان سايز',
  seo_title = 'بيجامة نسائية قطن كوريشة بطبعة التوليب | سولتة',
  short_description = 'بيجامة نسائية من قطن كوريشة ناعم بطبعة التوليب الوردي وحواف وردية. وان سايز من 45 إلى 80 كيلو. اطلبيها من سولتة.',
  slug = 'tulip-crinkle-cotton-womens-pajama',
  price = 69,
  price_sa = 69,
  sale_price_sa = 69,
  compare_at_price = NULL,
  sale_ends_at = NULL,
  stock = 12,
  material = 'قطن كوريشة',
  size_info = 'وان سايز يناسب من 45 إلى 80 كيلو',
  care_instructions = 'تُغسل بمويه باردة، ويفضّل بدون كلور، وتجنّبي الحرارة العالية.',
  description = 'بيجامة نسائية قطن كوريشة بطبعة التوليب الوردي من سولتة، على قماش ناعم ومريح بقصّة قميص بأكمام قصيرة وحواف وردية تضيف لمسة أنثوية هادئة.
• الخامة: قطن كوريشة ناعم ومريح
• المقاس: وان سايز يناسب من 45 إلى 80 كيلو
• الكمية محدودة
طريقة الغسيل: تُغسل بمويه باردة، ويفضّل بدون كلور، وتجنّبي الحرارة العالية.',
  description_ar = 'بيجامة نسائية قطن كوريشة بطبعة التوليب الوردي من سولتة، على قماش ناعم ومريح بقصّة قميص بأكمام قصيرة وحواف وردية تضيف لمسة أنثوية هادئة.
• الخامة: قطن كوريشة ناعم ومريح
• المقاس: وان سايز يناسب من 45 إلى 80 كيلو
• الكمية محدودة
طريقة الغسيل: تُغسل بمويه باردة، ويفضّل بدون كلور، وتجنّبي الحرارة العالية.',
  status = 'active',
  updated_at = now()
WHERE id::text LIKE '614f6daa%';

-- 4. UPDATE Product (ج) - روزي: زهور في بوكس سولتة (id: 78f851f3-5f75-4153-9fbe-0e8ad54825be)
UPDATE public.products
SET
  name = 'بيجامة روزي — زهور',
  name_ar = 'بيجامة روزي — زهور',
  h1 = 'بيجامة نسائية وردية بنقشة زهور قطن كوريشة — في بوكس سولتة',
  seo_title = 'بيجامة نسائية وردية بنقشة زهور قطن كوريشة | سولتة',
  short_description = 'بيجامة نسائية وردية بنقشة زهور من قطن كوريشة ناعم ومريح. وان سايز من 45 إلى 80 كيلو، وتصل في بوكس سولتة.',
  slug = 'pink-floral-crinkle-cotton-womens-pajama',
  price = 69,
  price_sa = 69,
  sale_price_sa = 69,
  compare_at_price = NULL,
  sale_ends_at = NULL,
  stock = 6,
  material = 'قطن كوريشة',
  size_info = 'وان سايز يناسب من 45 إلى 80 كيلو',
  care_instructions = 'تُغسل بمويه باردة، ويفضّل بدون كلور، وتجنّبي الحرارة العالية.',
  description = 'بيجامة نسائية وردية بنقشة زهور من سولتة، بدرجة وردية ناعمة ونقشة زهور صغيرة على قماش قطن كوريشة ناعم ومريح. تصلك في بوكس سولتة مع ستيكرز، فهي اختيار لطيف كهدية.
• الخامة: قطن كوريشة ناعم ومريح
• المقاس: وان سايز يناسب من 45 إلى 80 كيلو
• الكمية محدودة
طريقة الغسيل: تُغسل بمويه باردة، ويفضّل بدون كلور، وتجنّبي الحرارة العالية.',
  description_ar = 'بيجامة نسائية وردية بنقشة زهور من سولتة، بدرجة وردية ناعمة ونقشة زهور صغيرة على قماش قطن كوريشة ناعم ومريح. تصلك في بوكس سولتة مع ستيكرز، فهي اختيار لطيف كهدية.
• الخامة: قطن كوريشة ناعم ومريح
• المقاس: وان سايز يناسب من 45 إلى 80 كيلو
• الكمية محدودة
طريقة الغسيل: تُغسل بمويه باردة، ويفضّل بدون كلور، وتجنّبي الحرارة العالية.',
  status = 'active',
  updated_at = now()
WHERE id::text LIKE '78f851f3%';

-- 5. UPDATE Products (د) - سُكّر بالفيونكة (لونين: وردي ملكي و أبيض عاجي)
UPDATE public.products
SET
  name = 'بيجامة سُكّر بالفيونكة — وردي ملكي',
  name_ar = 'بيجامة سُكّر بالفيونكة — وردي ملكي',
  h1 = 'بيجامة نسائية بطبعة الفيونكة — وردي ملكي',
  seo_title = 'بيجامة نسائية بطبعة الفيونكة وردي ملكي | سولتة',
  slug = 'sugar-bow-pajama-set-royal-pink',
  updated_at = now()
WHERE id::text LIKE '8d738e1c%';

UPDATE public.products
SET
  name = 'بيجامة سُكّر بالفيونكة — أبيض عاجي',
  name_ar = 'بيجامة سُكّر بالفيونكة — أبيض عاجي',
  h1 = 'بيجامة نسائية بطبعة الفيونكة — أبيض عاجي',
  seo_title = 'بيجامة نسائية بطبعة الفيونكة أبيض عاجي | سولتة',
  slug = 'sugar-bow-pajama-set-ivory-white',
  updated_at = now()
WHERE id::text LIKE '54929551%';

-- 6. UPDATE Product (هـ) - روزا ورد المساء
UPDATE public.products
SET
  name = 'بيجامة روزا — ورد المساء',
  name_ar = 'بيجامة روزا — ورد المساء',
  h1 = 'بيجامة نسائية روزا ورد المساء — سولتة',
  seo_title = 'بيجامة نسائية روزا ورد المساء | سولتة',
  slug = 'rosa-evening-bloom-pajama-set',
  updated_at = now()
WHERE id::text LIKE 'bf2ba4f4%';

-- 7. UPDATE Product (و) - classic-dot (أرشفته أو إبقاؤه بعيداً عن الرئيسية)
UPDATE public.products
SET
  slug = 'classic-dot-pajama-set',
  status = 'archived',
  updated_at = now()
WHERE id::text LIKE '1d4e8104%';
