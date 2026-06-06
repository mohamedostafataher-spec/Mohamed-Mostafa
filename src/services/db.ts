import { Product, Review, DiscountCoupon, Order, InStockAlert, Category, Settings, ContactMessage, NewsletterSubscription, Collection, BlogPost, FaqItem } from '../types';
import { createClient } from '@supabase/supabase-js';

// --- ROBUST CONFIGURATION ---
const DEFAULT_URL = 'https://fwadgmhabzaudusxghnh.supabase.co';
const DEFAULT_KEY = 'NOT_CONFIGURED';

let urlToUse = DEFAULT_URL;
let keyToUse = DEFAULT_KEY;

// Safely extract from Vite env if available
try {
  const env = (import.meta as any).env;
  if (env) {
    const vUrl = env.VITE_SUPABASE_URL;
    const vKey = env.VITE_SUPABASE_ANON_KEY;

    if (typeof vUrl === 'string' && vUrl.trim().startsWith('http') && vUrl.includes('.')) {
      urlToUse = vUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    }
    
    // A real Supabase key is a long JWT (usually > 50 chars). 
    // We reject placeholders like 'YOUR_...'
    // If it starts with 'sb_', we log a warning but allow it to attempt initialization.
    if (typeof vKey === 'string' && vKey.trim().length > 20 && !vKey.includes('YOUR_')) {
      if (vKey.startsWith('sb_')) {
          console.warn("[SULTA DB] Using a key starting with 'sb_'. This might be a placeholder.");
      }
      keyToUse = vKey.trim();
    }
  }
} catch (e) {
    // Environment not available, use defaults
}

// --- DUMMY CLIENT (FALLBACK) ---
const createDummyClient = () => {
    const p = (val: any = null) => Promise.resolve({ data: val, error: null });
    const chainable = () => ({
        select: () => ({ 
            order: () => ({ 
                limit: () => ({ single: () => p() }), 
                then: (cb: any) => cb({ data: [], error: null }) 
            }),
            eq: () => ({ 
                limit: () => ({ single: () => p() }), 
                then: (cb: any) => cb({ data: [], error: null }) 
            }),
            limit: () => ({ single: () => p() }),
            then: (cb: any) => cb({ data: [], error: null }) 
        }),
        insert: () => p(),
        upsert: () => p(),
        update: () => ({ eq: () => p() }),
        delete: () => ({ eq: () => p() }),
        insert_multiple: () => p(),
    });

    return {
        from: () => chainable(),
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signInWithPassword: () => p(),
            signUp: () => p(),
            signOut: () => Promise.resolve({ error: null }),
        },
        channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
        removeChannel: () => {},
        storage: { from: () => ({ upload: () => p(), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) }
    };
};

// --- INITIALIZATION ---
let supabaseInstance: any;

// Final check: URL must be valid for the Supabase SDK to even try
const isUrlStructurallyValid = (u: string) => {
    try {
        if (!u || typeof u !== 'string') return false;
        if (!u.startsWith('http')) return false;
        // Basic check for presence of a domain part
        return u.split('.').length >= 2;
    } catch {
        return false;
    }
};

if (isUrlStructurallyValid(urlToUse) && keyToUse !== DEFAULT_KEY) {
    try {
        const cleanUrl = urlToUse.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
        supabaseInstance = createClient(cleanUrl, keyToUse);
    } catch (err) {
        console.error("[SULTA DB] createClient threw an error:", err);
        supabaseInstance = createDummyClient();
    }
} else {
    supabaseInstance = createDummyClient();
}

export const supabase = supabaseInstance;

// ==========================================
// MOCK FALLBACK BOUTIQUE DATA (Match mockups exactly)
// ==========================================

export const MOCK_BOUTIQUE_CATEGORIES: Category[] = [
  { id: 'sleepwear', nameAr: 'ملابس نوم', nameEn: 'Sleepwear', slug: 'sleepwear', imageUrl: 'https://images.unsplash.com/photo-1614088685112-0a7db9bcdad5?q=80&w=600' },
  { id: 'loungewear', nameAr: 'طواقم استرخاء', nameEn: 'Loungewear', slug: 'loungewear', imageUrl: 'https://images.unsplash.com/photo-1582298538104-fc2c0a1a0071?q=80&w=600' },
  { id: 'homewear', nameAr: 'ملابس منزلية', nameEn: 'Homewear', slug: 'homewear', imageUrl: 'https://images.unsplash.com/photo-1517554558809-9b4971b38f39?q=80&w=600' },
  { id: 'collections', nameAr: 'مجموعات حصرية', nameEn: 'Collections', slug: 'collections', imageUrl: 'https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=600' }
];

export const MOCK_BOUTIQUE_PRODUCTS: Product[] = [
  {
    id: 'satin-blush',
    nameAr: 'طقم بيجامة ساتان روز الملكي متبلّش',
    nameEn: 'Satin Blush Pajama Set',
    category: 'sleepwear',
    categoryAr: 'ملابس نوم',
    priceEG: 2700,
    priceSA: 330,
    descriptionAr: 'دللي حواسك مع طقم بيجامة الساتان الروز المصممة بعناية فائقة لتنساب بنعومة تامة كالحرير على البشرة.',
    descriptionEn: 'Indulge in premium relaxation with our hand-tailored Satin Blush sleep set, curated uniquely for SULTA.',
    fabricAr: 'حرير ساتان مبرد فاخر عالي الكثافة (بولي ساتان فائق النعومة)',
    fabricEn: 'Premium high-density breathable cooling Satin (Polysatin composition)',
    washInstructionsAr: 'غسيل يدوي بماء بارد ومساحيق غسيل رقيقة للمنسوجات الفاخرة.',
    images: [
      'https://images.unsplash.com/photo-1614088685112-0a7db9bcdad5?q=80&w=800',
      'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=800'
    ],
    colors: [
      { name: 'Rose', hex: '#DF8A9D' },
      { name: 'Ivory', hex: '#FAF5F0' }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    isBestSeller: true,
    rating: 5,
    reviewsCount: 128,
    stock: 25,
    sku: 'SLT-SAT-BLS',
    featured: true,
    status: 'active',
    shortDescription: 'Satin Blush premium pajama set for brides and modern ladies.',
    tags: ['Satin', 'Sleepwear', 'Pajamas', 'New Arrivals']
  },
  {
    id: 'ivory-dream',
    nameAr: 'طقم ساتان حلم العاج الكلاسيكي',
    nameEn: 'Ivory Dream Pajama Set',
    category: 'sleepwear',
    categoryAr: 'ملابس نوم',
    priceEG: 2500,
    priceSA: 310,
    descriptionAr: 'كلاسيكية خالدة بلون العاج اللؤلؤي البديع. تتميز بياقة مفتوحة وأطراف مطرزة بدقة لخياطة راقية لا تزول.',
    descriptionEn: 'A pristine luxury staple. Beautiful pearl ivory pajama set with detailed premium stitching and piping.',
    fabricAr: 'حرير طبيعي معالج بالساتان فائق القوام',
    fabricEn: 'Processed premium silk-satin blend with exquisite drape count',
    washInstructionsAr: 'تنظيف جاف أو غسيل رقيق للغاية منفصلا.',
    images: [
      'https://images.unsplash.com/photo-1517554558809-9b4971b38f39?q=80&w=800',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=800'
    ],
    colors: [
      { name: 'Pearl Ivory', hex: '#FAF5F0' },
      { name: 'Gold', hex: '#DBC082' }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    isBestSeller: true,
    rating: 5,
    reviewsCount: 96,
    stock: 14,
    sku: 'SLT-SAT-IVY',
    featured: true,
    status: 'active',
    shortDescription: 'Elegant Ivory Dream pajamas with contract piping.',
    tags: ['Ivory', 'Classic', 'Satin', 'Bridal']
  },
  {
    id: 'soft-pink-cotton',
    nameAr: 'طقم قطن مريح بلون وردي ناعم',
    nameEn: 'Soft Pink Cotton Set',
    category: 'loungewear',
    categoryAr: 'ملابس استرخاء',
    priceEG: 2400,
    priceSA: 295,
    descriptionAr: 'طقم مصنوع من قطن مصري نقي معالج بمرونة تامة للراحة في المنزل والتلذذ بنوم هانىء وراحة فائقة.',
    descriptionEn: 'Experience pure cotton comfort. Exceptionally soft pink cotton lounge and sleep set.',
    fabricAr: 'قطن طبيعي نقي 100٪ مع خيوط مرنة',
    fabricEn: '100% long-staple egyptian organic cotton with gentle stretch',
    washInstructionsAr: 'غسيل آلي بماء فاتر ولطيف.',
    images: [
      'https://images.unsplash.com/photo-1582298538104-fc2c0a1a0071?q=80&w=800',
      'https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=800'
    ],
    colors: [
      { name: 'Soft Rose', hex: '#DF8A9D' },
      { name: 'Lilac', hex: '#E2D1F9' }
    ],
    sizes: ['M', 'L', 'XL'],
    isBestSeller: true,
    rating: 5,
    reviewsCount: 231,
    stock: 45,
    sku: 'SLT-COT-PNK',
    featured: true,
    status: 'active',
    shortDescription: 'Supremely breathable soft pink cotton lounge set.',
    tags: ['Cotton', 'Loungewear', 'Soft Pink']
  },
  {
    id: 'midnight-elegance',
    nameAr: 'طقم ساتان أناقة منتصف الليل الأسود',
    nameEn: 'Midnight Elegance Set',
    category: 'sleepwear',
    categoryAr: 'ملابس نوم',
    priceEG: 2900,
    priceSA: 355,
    descriptionAr: 'الفخامة السوداء العميقة ببريق الساتان الساحر وطباعة دانتيل خفيفة. مصممة لتجربة ملكية مهيبة بالمنزل.',
    descriptionEn: 'Enigmatic deep black satin with premium satin touch and subtle contrasts for a powerful elegant styling.',
    fabricAr: 'ساتان العرائس الثقيل الإيطالي عالي الجاذبية',
    fabricEn: 'Heavy bridal-weight premium satin with high luster finish',
    washInstructionsAr: 'غسيل رقيق يدوي بماء بارد وبدون عصر مكثف.',
    images: [
      'https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=800',
      'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=800'
    ],
    colors: [
      { name: 'Midnight Black', hex: '#0B0B0B' },
      { name: 'Deep Grey', hex: '#4A4A4A' }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    isBestSeller: true,
    rating: 5,
    reviewsCount: 74,
    stock: 19,
    sku: 'SLT-SAT-MID',
    featured: true,
    status: 'active',
    shortDescription: 'Deep lustrous black sleepwear set for high-end styling.',
    tags: ['Satin', 'Midnight', 'Black', 'Best Sellers']
  },
  {
    id: 'lavender-luxe',
    nameAr: 'طقم ساتان اللافندر المترف للعرايس',
    nameEn: 'Lavender Luxe Set',
    category: 'sleepwear',
    categoryAr: 'ملابس نوم',
    priceEG: 2650,
    priceSA: 325,
    descriptionAr: 'تمتعي باللون اللافندر الباريسي الآسر مع خامة خفيفة ناعمة تداعب الجسد مفعمة بالأنوثة الحالمة.',
    descriptionEn: 'Dreamy shade of Parisian Lavender. High-end satin lounge set engineered with ultimate drape layout.',
    fabricAr: 'حرير فيسكوز ساتان فائق النعومة والمطاطية الجانبية',
    fabricEn: 'Viscose-silk satin blend with luxurious side-stretch and cooling comfort',
    washInstructionsAr: 'تنظيف رقيق مع مسحوق غسيل سائل خاص بالحرير.',
    images: [
      'https://images.unsplash.com/photo-1562572159-4ebcd318f2dd?q=80&w=800',
      'https://images.unsplash.com/photo-1517554558809-9b4971b38f39?q=80&w=800'
    ],
    colors: [
      { name: 'Lavender', hex: '#BDB2FF' },
      { name: 'Ivory Pearl', hex: '#FAF5F0' }
    ],
    sizes: ['S', 'M', 'L'],
    isBestSeller: true,
    rating: 5,
    reviewsCount: 112,
    stock: 22,
    sku: 'SLT-SAT-LAV',
    featured: true,
    status: 'active',
    shortDescription: 'Dreamy Lavender satin bridal pajama set.',
    tags: ['Lavender', 'Satin', 'Pajamas', 'Luxe']
  },
  {
    id: 'rose-satin-boutique',
    nameAr: 'طقم ساتان الورد الفاخر المزين بدانتيل',
    nameEn: 'Rose Satin Set',
    category: 'sleepwear',
    categoryAr: 'ملابس نوم',
    priceEG: 1800,
    priceSA: 220,
    descriptionAr: 'قوام ساتان حريري خفيف يمنحك النعومة المطلقة التي تبحثين عنها مع كل لمسة.',
    descriptionEn: 'Light fluid satin that feels incredible on your skin. Tailored meticulously.',
    fabricAr: 'ساتان السلس الناعم المعالج ضد الكرمشة والكهرباء الساكنة',
    fabricEn: 'Boutique anti-static ultra-smooth satin with lace highlights',
    washInstructionsAr: 'يغسل يدويًا للحفاظ على الأطراف المزينة بالدانتيل رقيقًا.',
    images: [
      'https://images.unsplash.com/photo-1614088685112-0a7db9bcdad5?q=80&w=800',
      'https://images.unsplash.com/photo-1582298538104-fc2c0a1a0071?q=80&w=800'
    ],
    colors: [
      { name: 'Satin Rose', hex: '#DF8A9D' }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    isBestSeller: true,
    rating: 5,
    reviewsCount: 88,
    stock: 30,
    sku: 'SLT-SAT-RSE',
    featured: true,
    status: 'active',
    shortDescription: 'Handcrafted rose satin set decorated with fine lace.',
    tags: ['Lace', 'Satin', 'Rose']
  }
];

// ==========================================
// SULTA COUTURE SUPABASE CONNECTION
// ==========================================

function mapCategory(data: any): Category {
  return {
    id: data.id,
    name: data.name, // Legacy support
    nameAr: data.name_ar || data.nameAr || data.name || '',
    nameEn: data.name_en || data.nameEn || data.name || '',
    slug: data.slug,
    imageUrl: data.image_url || data.imageUrl
  };
}

function mapCollection(data: any): Collection {
  return {
    id: data.id,
    nameAr: data.name_ar || data.name || '',
    nameEn: data.name_en || data.name || '',
    descriptionAr: data.description_ar || data.description || '',
    descriptionEn: data.description_en || data.description || '',
    imageUrl: data.image_url || data.imageUrl
  };
}

function mapSettings(data: any): Settings {
  return {
    siteName: data.site_name,
    logo: data.logo,
    promoBannerAr: data.promo_banner_ar,
    promoEndTime: data.promo_end_time,
    heroMiniAlertAr: data.hero_mini_alert_ar,
    heroSubtitleAr: data.hero_subtitle_ar,
    heroDescriptionAr: data.hero_description_ar,
    heroImages: Array.isArray(data.hero_images) ? data.hero_images : (data.hero_images ? JSON.parse(data.hero_images) : []),
    contactEmail: data.contact_email,
    contactPhone: data.contact_phone,
    whatsapp: data.whatsapp,
    instagram: data.instagram,
    facebook: data.facebook,
    tiktok: data.tiktok,
    facebookPixelId: data.facebook_pixel_id,
    googleAnalyticsId: data.google_analytics_id,
    snapchatPixelId: data.snapchat_pixel_id,
    tiktokPixelId: data.tiktok_pixel_id,
    shippingRates: Array.isArray(data.shipping_rates) ? data.shipping_rates : (data.shipping_rates ? JSON.parse(data.shipping_rates) : []),
    defaultShippingFee: Number(data.default_shipping_fee ?? 0)
  };
}

function mapProduct(data: any): Product {
  return {
    id: data.id,
    nameAr: data.name_ar || '',
    nameEn: data.name_en || '',
    category: data.category || 'new',
    categoryAr: data.category_ar || '',
    priceEG: Number(data.price_eg ?? 0),
    priceSA: Number(data.price_sa ?? 0),
    descriptionAr: data.description_ar || '',
    descriptionEn: data.description_en || '',
    fabricAr: data.fabric_ar || '',
    fabricEn: data.fabric_en || '',
    washInstructionsAr: data.wash_instructions_ar || '',
    images: Array.isArray(data.images) ? data.images : (data.images ? JSON.parse(data.images) : []),
    video: data.video || undefined,
    colors: Array.isArray(data.colors) ? data.colors : (data.colors ? JSON.parse(data.colors) : []),
    sizes: Array.isArray(data.sizes) ? data.sizes : (data.sizes ? JSON.parse(data.sizes) : []),
    isBestSeller: !!data.is_best_seller,
    rating: Number(data.rating ?? 5),
    reviewsCount: Number(data.reviews_count ?? 0),
    stock: Number(data.stock ?? 0),
    sku: data.sku || undefined,
    salePriceEG: data.sale_price_eg ? Number(data.sale_price_eg) : (data.sale_price ? Number(data.sale_price) : undefined),
    salePriceSA: data.sale_price_sa ? Number(data.sale_price_sa) : (data.sale_price ? Number(data.sale_price) : undefined),
    featured: !!data.featured,
    status: data.status || 'active',
    shortDescription: data.short_description || undefined,
    tags: Array.isArray(data.tags) ? data.tags : (data.tags ? JSON.parse(data.tags) : []),
    collection: data.collection || undefined,
    seo: data.seo ? (typeof data.seo === 'string' ? JSON.parse(data.seo) : data.seo) : undefined
  };
}

function mapReview(data: any): Review {
  return {
    id: data.id,
    username: data.username || '',
    avatar: data.avatar || '',
    rating: Number(data.rating ?? 5),
    comment: data.comment || '',
    date: data.date || '',
    country: data.country || 'SA',
    productName: data.product_name || ''
  };
}

function mapCoupon(data: any): DiscountCoupon {
  return {
    code: data.code || '',
    discountPercent: Number(data.discount_percent ?? 0),
    description: data.description || ''
  };
}

function mapOrder(data: any): Order {
  return {
    id: data.id,
    customerName: data.customer_name || '',
    phone: data.phone || '',
    country: data.country || 'SA',
    city: data.city || '',
    address: data.address || '',
    notes: data.notes || undefined,
    giftMessage: data.gift_message || undefined,
    giftCardTheme: data.gift_card_theme || undefined,
    items: Array.isArray(data.items) ? data.items : (data.items ? JSON.parse(data.items) : []),
    totalPrice: Number(data.total_price ?? 0),
    currency: data.currency || 'SAR',
    paymentMethod: data.payment_method || '',
    status: data.status || 'pending',
    date: data.date || ''
  };
}

function mapBlogPost(data: any): BlogPost {
  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    content: data.content,
    excerpt: data.excerpt,
    imageUrl: data.image_url || data.imageUrl,
    author: data.author,
    category: data.category,
    tags: Array.isArray(data.tags) ? data.tags : (data.tags ? JSON.parse(data.tags) : []),
    publishedAt: data.published_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    status: data.status || 'draft',
    seo: data.seo ? (typeof data.seo === 'string' ? JSON.parse(data.seo) : data.seo) : undefined
  };
}

function mapFaqItem(data: any): FaqItem {
  return {
    id: data.id,
    question: data.question,
    answer: data.answer,
    category: data.category || 'all',
    orderIndex: Number(data.order_index ?? 0)
  };
}

export const dbService = {
  supabase,
  
  uploadImage: async (file: File): Promise<string | null> => {
    try {
      // Use a completely safe filename structure to avoid "Invalid path specified" error
      const fileExt = file.name ? file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') : '';
      const safeExtension = fileExt ? fileExt.toLowerCase() : (file.type ? file.type.split('/')[1] : 'jpeg');
      const randomString = Math.random().toString(36).substring(2, 10);
      const fileName = `${Date.now()}_${randomString}.${safeExtension || 'jpg'}`;
      
      console.log(`[Supabase Storage] Uploading to bucket 'products', file: ${fileName}`);

      // Ensure the 'products' bucket exists and is public
      try {
        const { error: bucketError } = await supabase.storage.createBucket('products', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });
        if (bucketError) {
          // If error is just that it already exists, that's fine.
          console.log("[Supabase Storage] Bucket setup status:", bucketError.message);
        } else {
          console.log("[Supabase Storage] Created 'products' public bucket successfully.");
        }
      } catch (bucketErr: any) {
        console.log("[Supabase Storage] Skipped bucket creation/validation:", bucketErr?.message || bucketErr);
      }

      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, file, { 
          cacheControl: '3600', 
          upsert: true,
          contentType: file.type || 'image/jpeg'
        });

      if (error) {
        console.error("[Supabase Storage] Upload error details:", error);
        throw error;
      }
      if (!data) throw new Error("Upload response was empty");

      console.log(`[Supabase Storage] Upload path: ${data.path}`);

      const { data: publicData } = supabase.storage
        .from('products')
        .getPublicUrl(data.path);

      if (!publicData || !publicData.publicUrl) {
          throw new Error("Failed to generate public URL");
      }

      console.log(`[Supabase Storage] Public URL: ${publicData.publicUrl}`);
      return publicData.publicUrl;
    } catch (err) {
      console.error("Error uploading image to Supabase Storage:", err);
      return null;
    }
  },

  getSettings: async (): Promise<Settings | null> => {
    const { data, error } = await supabase.from('settings').select('*').limit(1).single();
    if (error) return null;
    return data ? mapSettings(data) : null;
  },

  updateSettings: async (settings: Partial<Settings>): Promise<boolean> => {
    try {
      const { data: existing } = await supabase.from('settings').select('id').limit(1).single();
      
      const payload: any = {
        site_name: settings.siteName,
        logo: settings.logo,
        promo_banner_ar: settings.promoBannerAr,
        promo_end_time: settings.promoEndTime,
        hero_mini_alert_ar: settings.heroMiniAlertAr,
        hero_subtitle_ar: settings.heroSubtitleAr,
        hero_description_ar: settings.heroDescriptionAr,
        hero_images: settings.heroImages,
        contact_email: settings.contactEmail,
        contact_phone: settings.contactPhone,
        whatsapp: settings.whatsapp,
        instagram: settings.instagram,
        facebook: settings.facebook,
        tiktok: settings.tiktok,
        facebook_pixel_id: settings.facebookPixelId,
        google_analytics_id: settings.googleAnalyticsId,
        snapchat_pixel_id: settings.snapchatPixelId,
        tiktok_pixel_id: settings.tiktokPixelId,
        shipping_rates: settings.shippingRates,
        default_shipping_fee: settings.defaultShippingFee
      };

      // Remove undefined keys
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      let error;
      if (existing && existing.id) {
        const result = await supabase.from('settings').update(payload).eq('id', existing.id);
        error = result.error;
      } else {
        const result = await supabase.from('settings').insert([{ id: 'default', ...payload }]);
        error = result.error;
      }

      if (error) {
        console.error("Error updating settings:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Exception updating settings:", err);
      return false;
    }
  },

  subscribeBlogPosts: (
    onSuccess: (posts: BlogPost[]) => void, 
    _onError: (error: any) => void
  ): (() => void) => {
    supabase.from('blog_posts').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) onSuccess(data.map(mapBlogPost));
    });

    const channelName = 'public:blog_posts:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, async () => {
        const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
        if (data) onSuccess(data.map(mapBlogPost));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  saveBlogPost: async (post: BlogPost): Promise<void> => {
    const { error } = await supabase
      .from('blog_posts')
      .upsert([{
        id: post.id || undefined,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        image_url: post.imageUrl,
        author: post.author,
        category: post.category,
        tags: post.tags,
        published_at: post.publishedAt,
        status: post.status,
        seo: post.seo ? JSON.stringify(post.seo) : null
      }]);
    if (error) throw error;
  },

  deleteBlogPost: async (postId: string): Promise<void> => {
    const { error } = await supabase.from('blog_posts').delete().eq('id', postId);
    if (error) throw error;
  },

  getFaqs: async (): Promise<FaqItem[]> => {
    try {
      const { data, error } = await supabase.from('faq').select('*').order('order_index', { ascending: true });
      if (error) throw error;
      return (data || []).map(mapFaqItem);
    } catch {
      return [];
    }
  },

  saveFaqItem: async (faq: FaqItem): Promise<void> => {
    const { error } = await supabase
      .from('faq')
      .upsert([{
        id: faq.id || undefined,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        order_index: faq.orderIndex
      }]);
    if (error) throw error;
  },

  deleteFaqItem: async (faqId: string): Promise<void> => {
    const { error } = await supabase.from('faq').delete().eq('id', faqId);
    if (error) throw error;
  },

  subscribeCategories: (
    onSuccess: (categories: Category[]) => void, 
    _onError: (error: any) => void
  ): (() => void) => {
    supabase.from('categories').select('*').then(({ data }) => {
      if (data && data.length > 0) {
        onSuccess(data.map(mapCategory));
      } else {
        onSuccess([]);
      }
    });

    const channelName = 'public:categories:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, async () => {
        const { data } = await supabase.from('categories').select('*');
        if (data && data.length > 0) {
          onSuccess(data.map(mapCategory));
        } else {
          onSuccess([]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  saveCategory: async (category: Category): Promise<void> => {
    const { error } = await supabase
      .from('categories')
      .upsert([{
        id: category.id,
        name: category.nameAr || category.name,
        name_ar: category.nameAr,
        name_en: category.nameEn,
        slug: category.slug,
        image_url: category.imageUrl
      }]);
    if (error) throw error;
  },

  deleteCategory: async (categoryId: string): Promise<void> => {
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    if (error) throw error;
  },

  subscribeCollections: (
    onSuccess: (collections: Collection[]) => void, 
    _onError: (error: any) => void
  ): (() => void) => {
    supabase.from('collections').select('*').then(({ data }) => {
      if (data) onSuccess(data.map(mapCollection));
    });

    const channelName = 'public:collections:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collections' }, async () => {
        const { data } = await supabase.from('collections').select('*');
        if (data) onSuccess(data.map(mapCollection));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  saveCollection: async (collection: Collection): Promise<void> => {
    const { error } = await supabase
      .from('collections')
      .upsert([{
        id: collection.id || undefined,
        name: collection.nameAr, // For legacy/compatibility
        name_ar: collection.nameAr,
        name_en: collection.nameEn,
        description_ar: collection.descriptionAr,
        description_en: collection.descriptionEn,
        image_url: collection.imageUrl
      }]);
    if (error) throw error;
  },

  deleteCollection: async (collectionId: string): Promise<void> => {
    const { error } = await supabase.from('collections').delete().eq('id', collectionId);
    if (error) throw error;
  },

  subscribeHomepageSections: (
    onSuccess: (sections: any[]) => void, 
    _onError: (error: any) => void
  ): (() => void) => {
    supabase.from('homepage_sections').select('*').then(({ data }) => {
      if (data) onSuccess(data);
    });

    const channelName = 'public:homepage_sections:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homepage_sections' }, async () => {
        const { data } = await supabase.from('homepage_sections').select('*');
        if (data) onSuccess(data);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeProducts: (
    onSuccess: (products: Product[]) => void, 
    _onError: (error: any) => void
  ): (() => void) => {
    supabase.from('products').select('*').then(({ data }) => {
      if (data && data.length > 0) {
        onSuccess(data.map(mapProduct));
      } else {
        onSuccess([]);
      }
    });

    const channelName = 'public:products:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        const { data } = await supabase.from('products').select('*');
        if (data && data.length > 0) {
          onSuccess(data.map(mapProduct));
        } else {
          onSuccess([]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeCoupons: (
    onSuccess: (coupons: DiscountCoupon[]) => void, 
    _onError: (error: any) => void
  ): (() => void) => {
    supabase.from('coupons').select('*').then(({ data }) => {
      if (data) onSuccess(data.map(mapCoupon));
    });

    const channelName = 'public:coupons:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, async () => {
        const { data } = await supabase.from('coupons').select('*');
        if (data) onSuccess(data.map(mapCoupon));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeReviews: (
    onSuccess: (reviews: Review[]) => void, 
    _onError: (error: any) => void
  ): (() => void) => {
    supabase.from('reviews').select('*').then(({ data }) => {
      if (data) onSuccess(data.map(mapReview));
    });

    const channelName = 'public:reviews:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, async () => {
        const { data } = await supabase.from('reviews').select('*');
        if (data) onSuccess(data.map(mapReview));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeOrders: (
    onSuccess: (orders: Order[]) => void, 
    _onError: (error: any) => void
  ): (() => void) => {
    supabase.from('orders').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) onSuccess(data.map(mapOrder));
    });

    const channelName = 'public:orders:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
        const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (data) onSuccess(data.map(mapOrder));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  saveOrder: async (order: Order): Promise<void> => {
    const { error } = await supabase.from('orders').insert([{
      id: order.id,
      customer_name: order.customerName,
      phone: order.phone,
      country: order.country,
      city: order.city,
      address: order.address,
      notes: order.giftMessage 
        ? `${order.notes || ''} [بطاقة إهداء ثيم ${order.giftCardTheme || 'عام'}: ${order.giftMessage}]`
        : order.notes,
      items: order.items,
      total_price: order.totalPrice,
      currency: order.currency,
      payment_method: order.paymentMethod,
      status: order.status,
      date: order.date
    }]);
    if (error) throw error;
  },

  updateProductStock: async (productId: string, _currentProduct: Product, nextStock: number): Promise<void> => {
    const { error } = await supabase
      .from('products')
      .update({ stock: nextStock })
      .eq('id', productId);
    if (error) throw error;
  },

  saveProduct: async (product: Product): Promise<void> => {
    // Standard allowed categories in CHECK constraint: ('satin', 'cotton', 'loungewear', 'dresses', 'new')
    const allowedCategories = ['satin', 'cotton', 'loungewear', 'dresses', 'new'];
    const safeCategory = allowedCategories.includes(product.category) ? product.category : 'new';

    const payload: any = {
      id: product.id,
      name_ar: product.nameAr,
      name_en: product.nameEn,
      category: safeCategory,
      category_id: product.category || 'new',
      category_ar: product.categoryAr,
      price: product.priceEG || product.priceSA || 0,
      price_eg: product.priceEG,
      price_sa: product.priceSA,
      description_ar: product.descriptionAr,
      description_en: product.descriptionEn,
      fabric_ar: product.fabricAr,
      fabric_en: product.fabricEn,
      wash_instructions_ar: product.washInstructionsAr,
      images: product.images || [],
      video: product.video || null,
      colors: JSON.stringify(product.colors || []),
      sizes: product.sizes || [],
      is_best_seller: product.isBestSeller,
      featured: product.featured || false,
      status: product.status || 'active',
      sku: product.sku || null,
      sale_price: product.salePriceSA || product.salePriceEG || null,
      sale_price_sa: product.salePriceSA || null,
      sale_price_eg: product.salePriceEG || null,
      stock: product.stock,
      rating: product.rating,
      reviews_count: product.reviewsCount,
      short_description: product.shortDescription || null,
      tags: JSON.stringify(product.tags || []),
      collection: product.collection || null,
      name: product.nameEn,
      slug: product.id.toLowerCase().replace(/\s+/g, '-'),
      description: product.descriptionEn,
      seo: product.seo ? JSON.stringify(product.seo) : null
    };

    let { error } = await supabase.from('products').upsert([payload]);

    let retries = 30;
    while (error && error.message && error.message.includes('Could not find the') && retries > 0) {
      console.warn("[DB] Schema cache issue:", error.message);
      
      const match = error.message.match(/Could not find the '([^']+)' column/);
      if (match && match[1]) {
        const colName = match[1];
        console.warn(`[DB] Removing column '${colName}' to bypass schema cache...`);
        delete payload[colName];
        
        const retryRes = await supabase.from('products').upsert([payload]);
        error = retryRes.error;
      } else {
        break;
      }
      retries--;
    }

    if (error) throw error;
  },

  getHomepageSections: async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase.from('homepage_sections').select('*');
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn("Homepage sections fetch failed, using memory", err);
      return [];
    }
  },

  saveHomepageSection: async (sectionKey: string, contentJson: any, active: boolean = true): Promise<boolean> => {
    try {
      const { error } = await supabase.from('homepage_sections').upsert([{
        section_key: sectionKey,
        content_json: contentJson,
        active: active
      }], { onConflict: 'section_key' });
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Failed to save homepage section to DB:", err);
      return false;
    }
  },

  deleteProduct: async (productId: string): Promise<void> => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw error;
  },

  saveCoupon: async (coupon: DiscountCoupon): Promise<void> => {
    const { error } = await supabase
      .from('coupons')
      .upsert([{
        code: coupon.code,
        discount_percent: coupon.discountPercent,
        description: coupon.description,
        discount_value: 0
      }]);
    if (error) throw error;
  },

  deleteCoupon: async (code: string): Promise<void> => {
    const { error } = await supabase.from('coupons').delete().eq('code', code);
    if (error) throw error;
  },

  updateOrder: async (order: Order): Promise<void> => {
    const { error } = await supabase.from('orders').update({ status: order.status }).eq('id', order.id);
    if (error) throw error;
  },

  saveReview: async (review: Review): Promise<void> => {
    const { error } = await supabase.from('reviews').insert([{
      id: review.id,
      username: review.username,
      avatar: review.avatar,
      rating: review.rating,
      comment: review.comment,
      date: review.date,
      country: review.country,
      product_name: review.productName
    }]);
    if (error) throw error;
  },

  saveStockAlert: async (alert: InStockAlert): Promise<void> => {
    const { error } = await supabase.from('stock_alerts').insert([{
      id: alert.id,
      product_id: alert.productId,
      product_name: alert.productName,
      color: alert.color,
      size: alert.size,
      email_or_phone: alert.emailOrPhone,
      date: alert.date
    }]);
    
    if (error) {
       console.warn("Stock alerts table error, using local storage fallback");
       try {
         const stored = JSON.parse(localStorage.getItem('local_stock_alerts') || '[]');
         stored.push(alert);
         localStorage.setItem('local_stock_alerts', JSON.stringify(stored));
       } catch (storageError) {
         console.error("Local storage fallback failed:", storageError);
       }
    }
  },

  saveContactMessage: async (msg: ContactMessage): Promise<void> => {
    const { error } = await supabase.from('contact_messages').insert([{
      id: msg.id,
      name: msg.name,
      email: msg.email,
      message: msg.message,
      date: msg.date
    }]);
    if (error) throw error;
  },

  // Log Activity
  logActivity: async (action: string, details: string, adminId: string = 'system'): Promise<void> => {
    try {
      const log = {
        id: `LOG-${Date.now()}`,
        action,
        details,
        admin_id: adminId,
        date: new Date().toISOString()
      };
      const { error } = await supabase.from('activity_logs').insert([log]);
      if (error) throw error;
    } catch {
      // Fallback
    }
  },

  subscribeActivityLogs: (
    onSuccess: (logs: any[]) => void, 
    _onError: (error: any) => void
  ): (() => void) => {
    supabase.from('activity_logs').select('*').order('date', { ascending: false }).then(({ data }) => {
      if (data) onSuccess(data);
    });

    const channelName = 'public:activity_logs:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, async () => {
        const { data } = await supabase.from('activity_logs').select('*').order('date', { ascending: false });
        if (data) onSuccess(data);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Inventory Management
  updateInventory: async (productId: string, variant: string, change: number, reason: string): Promise<void> => {
    try {
      const log = {
        id: `INV-${Date.now()}`,
        product_id: productId,
        variant,
        change,
        reason,
        date: new Date().toISOString(),
        admin_id: 'admin'
      };
      await supabase.from('inventory_logs').insert([log]);
      await dbService.logActivity('UPDATE_INVENTORY', `Updated stock for ${productId} (${variant}) by ${change}. Reason: ${reason}`);
    } catch { }
  },

  // ADD TEST PRODUCT
  addExperimentalPajama: async (): Promise<void> => {
    const product: Product = {
      id: 'experimental-pajama-001',
      nameAr: 'بيجامة فيونكات وردي تجريبية',
      nameEn: 'Experimental Pink Bow Pajama Set',
      category: 'sleepwear',
      categoryAr: 'ملابس نوم',
      priceEG: 850,
      priceSA: 120,
      descriptionAr: 'بيجامة تجريبية مع فيونكات وردي ناعمة للتحقق وتجربة نظام الشراء الفاخر.',
      descriptionEn: 'Experimental pajama set with soft pink bows for purchasing flow testing.',
      fabricAr: 'قطن مبرد ناعم عالي الجودة',
      fabricEn: 'High quality soft premium cooling cotton',
      washInstructionsAr: 'يغسل بماء غسيل لطيف لتجنب انكماش النسيج الممتاز.',
      images: ['/src/assets/images/pink_bow_pajama_1780730148591.png'],
      colors: [
        { name: 'Rose', hex: '#DF8A9D' },
        { name: 'White', hex: '#FFFFFF' }
      ],
      sizes: ['M', 'L', 'XL'],
      isBestSeller: true,
      rating: 5,
      reviewsCount: 12,
      stock: 15,
      status: 'active',
      featured: true,
      tags: ['New Arrivals', 'Pajamas', 'Collections']
    };
    await dbService.saveProduct(product);
  },

  subscribeInventoryLogs: (
    onSuccess: (logs: any[]) => void, 
    _onError: (error: any) => void
  ): (() => void) => {
    supabase.from('inventory_logs').select('*').order('date', { ascending: false }).then(({ data }) => {
      if (data) onSuccess(data);
    });
    const channelName = 'public:inventory_logs:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_logs' }, async () => {
        const { data } = await supabase.from('inventory_logs').select('*').order('date', { ascending: false });
        if (data) onSuccess(data);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  },

  // Advanced Coupons
  subscribeAdvancedCoupons: (
    onSuccess: (coupons: any[]) => void, 
    _onError: (error: any) => void
  ): (() => void) => {
    supabase.from('advanced_coupons').select('*').then(({ data }) => {
      if (data) onSuccess(data);
    });
    const channelName = 'public:advanced_coupons:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'advanced_coupons' }, async () => {
        const { data } = await supabase.from('advanced_coupons').select('*');
        if (data) onSuccess(data);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  },

  saveAdvancedCoupon: async (coupon: any): Promise<void> => {
    const { error } = await supabase.from('advanced_coupons').upsert([coupon]);
    if (error) throw error;
    await dbService.logActivity('SAVE_COUPON', `Saved coupon ${coupon.code}`);
  },

  deleteAdvancedCoupon: async (id: string): Promise<void> => {
    const { error } = await supabase.from('advanced_coupons').delete().eq('id', id);
    if (error) throw error;
    await dbService.logActivity('DELETE_COUPON', `Deleted coupon ${id}`);
  },

  saveNewsletterSubscription: async (sub: any): Promise<void> => {
    try {
      await supabase.from('newsletter_subs').upsert({
        id: sub.id,
        email: sub.email,
        phone: sub.phone,
        source: sub.source,
        date: sub.date,
        subscribed: sub.subscribed
      });
    } catch (e) {
      console.warn("Newsletter Sub upsert fallback:", e);
    }
  },

  // Promotions
  subscribePromotions: (
    onSuccess: (promotions: any[]) => void, 
    _onError: (error: any) => void
  ): (() => void) => {
    supabase.from('promotions').select('*').then(({ data }) => {
      // mapping
      if (data) onSuccess(data.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        discountType: p.discount_type,
        discountValue: p.discount_value,
        startDate: p.start_date,
        endDate: p.end_date,
        isActive: p.is_active,
        applicableCategories: p.applicable_categories || [],
        bannerText: p.banner_text,
        createdAt: p.created_at
      })));
    });
    const channelName = 'public:promotions:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
        .channel(channelName)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'promotions' }, async () => {
        const { data } = await supabase.from('promotions').select('*');
        if (data) onSuccess(data.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          discountType: p.discount_type,
          discountValue: p.discount_value,
          startDate: p.start_date,
          endDate: p.end_date,
          isActive: p.is_active,
          applicableCategories: p.applicable_categories || [],
          bannerText: p.banner_text,
          createdAt: p.created_at
        })));
    }).subscribe();
    return () => supabase.removeChannel(channel);
  },

  savePromotion: async (promo: any): Promise<void> => {
    const { error } = await supabase.from('promotions').upsert([{
      id: promo.id,
      name: promo.name,
      description: promo.description,
      discount_type: promo.discountType,
      discount_value: promo.discountValue,
      start_date: promo.startDate,
      end_date: promo.endDate,
      is_active: promo.isActive,
      applicable_categories: promo.applicableCategories,
      banner_text: promo.bannerText,
      created_at: promo.createdAt
    }]);
    if (error) {
      console.error(error);
      throw error;
    }
    await dbService.logActivity('SAVE_PROMOTION', `Saved promotion ${promo.name}`);
  },

  deletePromotion: async (id: string): Promise<void> => {
    const { error } = await supabase.from('promotions').delete().eq('id', id);
    if (error) throw error;
    await dbService.logActivity('DELETE_PROMOTION', `Deleted promotion ${id}`);
  },

  // Customers (Profile & Loyalty)
  subscribeCustomers: (
    onSuccess: (customers: any[]) => void, 
    _onError: (error: any) => void
  ): (() => void) => {
    supabase.from('customers').select('*').then(({ data }) => {
      if (data) onSuccess(data);
    });
    const channel = supabase.channel('public:customers').on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, async () => {
        const { data } = await supabase.from('customers').select('*');
        if (data) onSuccess(data);
    }).subscribe();
    return () => supabase.removeChannel(channel);
  },

  saveCustomer: async (customer: any): Promise<void> => {
    const { error } = await supabase.from('customers').upsert([customer]);
    if (error) throw error;
    await dbService.logActivity('SAVE_CUSTOMER', `Saved customer ${customer.email || customer.id}`);
  },

  getMediaAssets: async (): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .storage
        .from('products')
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        if (error.message && error.message.includes("Invalid path")) {
          console.warn("[SULTA DB] Got 'Invalid path' error from Supabase Storage. This typically means the 'products' bucket has not been created yet in your Supabase project. To resolve, copy and execute the Storage SQL setup block at the bottom of standard 'supabase-schema.sql'.");
        }
        throw error;
      }
      if (!data) return [];

      // Generate public URLs for all files
      return data
        .filter(file => file.name && file.name !== '.emptyFolderPlaceholder')
        .map(file => {
          const { data: { publicUrl } } = supabase
            .storage
            .from('products')
            .getPublicUrl(file.name);
          return publicUrl;
        });
    } catch (err) {
      console.error('Error fetching media assets:', err);
      return [];
    }
  },

  // Seed Data if DB is empty
  seedInitialData: async (): Promise<void> => {
    try {
      const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
      if (count === 0) {
        console.log("DB is empty, seeding initial boutique data...");
        // Seed Categories
        for (const cat of MOCK_BOUTIQUE_CATEGORIES) {
          await dbService.saveCategory(cat);
        }
        // Seed Products
        for (const prod of MOCK_BOUTIQUE_PRODUCTS) {
          await dbService.saveProduct(prod);
        }
        // Seed Settings
        await dbService.updateSettings({
          siteName: 'SULTA ATELIER',
          promoBannerAr: 'خصم ٢٠٪ بمناسبة الافتتاح - ابدئي رحلتك الملكية اليوم',
          heroSubtitleAr: 'THE SOFTEST LIFE',
          heroDescriptionAr: 'طقم بيجامة ساتان فائق النعومة والخامة الملكية المعالجة حرارياً',
          whatsapp: '+966500000000',
          instagram: 'sulta.atelier',
          defaultShippingFee: 35
        });
        
        // Seed Features Section
        const featuresContent = {
          qualities: [
            { title: 'شحن ملكي فائق السرعة', desc: 'توصيل مخصص لباب المنزل مغلّف بصندوق هدايا أسود ووردي فاخر بعناية.' },
            { title: 'سداد مشفر آمن بالكامل', desc: 'ندعم بوابات دفع Apple Pay وSTC Pay ومدى والفيزا وفوري بكل سلاسة.' },
            { title: 'خامات إيطالية وعضوية عريقة', desc: 'ساتان معالج حرارياً بنعومة تضاهي الغيوم، قطن مصري نقي طويل التيلة.' }
          ],
          unboxing: {
            title: 'تجربة فتح الصندوق الملكي',
            description: '"لأنكِ لستِ مجرد عميلة، بل ملكة متوجة في مملكتك الخاصة.. صممنا بكج SULTA ليمنحكِ شعور الفخامة منذ اللحظة الأولى لوصوله."',
            bullet1: 'تغليف حريري يحمي رقة الملابس الملكية',
            bullet2: 'عطر الدار الفاخر يفوح مع كل قطعة'
          }
        };
        await dbService.saveHomepageSection('features_list', featuresContent);

        // Seed Hero Banners
        const heroContent = {
          banners: [
            {
              mediaUrl: '/src/assets/images/hero_sleepwear_luxury_1780620325112.png',
              title: 'BECAUSE YOU DESERVE',
              subtitle: 'THE SOFTEST LIFE',
              description: 'طقم بيجامة ساتان فائق النعومة والخامة الملكية المعالجة حرارياً',
              ctaText: 'DISCOVER THE COLLECTION | اكتشفي المجموعة',
              active: true
            }
          ]
        };
        await dbService.saveHomepageSection('hero_banners', heroContent);
      }
    } catch (err) {
      console.error("Seeding failed:", err);
    }
  },
};
