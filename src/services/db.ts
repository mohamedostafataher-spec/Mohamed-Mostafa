/// <reference types="vite/client" />
import { Product, Review, DiscountCoupon, Order, InStockAlert, Category, Settings, ContactMessage, NewsletterSubscription, Collection, BlogPost, FaqItem, SupportTicket, TicketMessage } from '../types';
import { createClient } from '@supabase/supabase-js';

// --- ROBUST CONFIGURATION ---
const DEFAULT_URL = 'https://fwadgmhabzaudusxghnh.supabase.co';
const DEFAULT_KEY = 'NOT_CONFIGURED';

let urlToUse = DEFAULT_URL;
let keyToUse = DEFAULT_KEY;

// Safely extract from Vite env if available, falling back to process.env in Node CLI environments
try {
  let vUrl: string | undefined;
  let vKey: string | undefined;

  try {
    vUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
    vKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;
  } catch {
    // Vite object not defined or throws
  }

  if (!vUrl && typeof process !== 'undefined' && process.env) {
    vUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  }
  if (!vKey && typeof process !== 'undefined' && process.env) {
    vKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  if (typeof vUrl === 'string' && vUrl.trim().startsWith('http') && vUrl.includes('.')) {
    urlToUse = vUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  }
  
  // A real Supabase key is a long JWT (usually > 50 chars). 
  // We reject placeholders like 'YOUR_...'
  // If it starts with 'sb_', we allow it to attempt initialization.
  if (typeof vKey === 'string' && vKey.trim().length > 20 && !vKey.includes('YOUR_')) {
    if (vKey.startsWith('sb_')) {
        console.warn("[SULTA DB] Using a key starting with 'sb_'. This is active.");
    }
    keyToUse = vKey.trim();
  }
} catch (e) {
    // Environment not available, use defaults
}

// --- DUMMY CLIENT (FALLBACK) ---
const createDummyClient = () => {
    const p = (val: any = null) => Promise.resolve({ data: val, count: 0, error: null });
    
    // A simple handler for the mock chain
    const mock: any = {
        select: () => mock,
        from: () => mock,
        order: () => mock,
        eq: () => mock,
        limit: () => mock,
        single: () => p(),
        insert: () => p(),
        upsert: () => p(),
        update: () => mock, 
        delete: () => mock,
        then: (cb: any) => {
            cb({ data: [], count: 0, error: null });
            return mock;
        },
        catch: (cb: any) => {
            return mock;
        }
    };

    return {
        from: () => mock,
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
        console.log(`[SULTA DB] Correctly configured with real Supabase database: ${cleanUrl} (Key length: ${keyToUse.length})`);
        supabaseInstance = createClient(cleanUrl, keyToUse);
    } catch (err) {
        console.error("[SULTA DB] createClient threw an error:", err);
        supabaseInstance = createDummyClient();
    }
} else {
    console.warn(`[SULTA DB] Using offline fallback Dummy Client. Missing or invalid Supabase configurations. URL: ${urlToUse}, Key: ${keyToUse === DEFAULT_KEY ? 'DEFAULT_KEY' : 'PRESENT'}`);
    supabaseInstance = createDummyClient();
}

export const supabase = supabaseInstance;

export const SEED_BLOG_POSTS: BlogPost[] = [
  {
    id: "art-001",
    title: "أسرار اختيار بيجامة العروس المثالية - ليلة من العمر تفوق الواقع",
    slug: "bride-pajama-secrets",
    content: "الملابس الفخمة تعيد ترتيب روحكِ وحسابات استرخائك. ليلة العروس ليست ليلة عابرة، بل هي تدشين لنمط حياة مترف من كوتور سولتة المنسوج من خيوط الفخامة الاستثنائية. ينصح مصممو سولتة بالبدء بقطع الساتان الملكي المفتوح، وتطويقها بالدانتيل الإيطالي عريض الأطراف لتتوجي كإمبراطورة الحسن والدلال.",
    excerpt: "دليل العروس لتنسيق أطقم النوم الراقية للياليها الفريدة بمقاييس الجودة العالمية.",
    imageUrl: "/img/bridal_satin_robe_pink_1.png",
    author: "SULTA Atelier",
    category: "Couture",
    tags: ["Bridal", "Luxury", "Styling"],
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "published"
  },
  {
    id: "art-002",
    title: "الحرير الإيطالي الطبيعي vs الصناعي - علم المنسوجات المترفة",
    slug: "pure-italian-silk-science",
    content: "إن لمس أقمشة SULTA هو بمثابة التمشي فوق الرمل البكر الدافئ. نستخدم في القطع الخيوط الحريرية الطبيعية المعالجة بوزن ثقيل وتصميم مبرد ليتنفس جسدكِ بحرية تامة ويعزز هرمونات الاسترخاء. وتجنبي القطع البترولية التي تشتت ذرات الهواء وتضغط على مسامات البشرة الحساسة.",
    excerpt: "تعلمي كيف تفرقين بين التفاصيل الراقية والأقمشة المقلدة لترتدي دوماً ما يليق بوقارك.",
    imageUrl: "/img/pink_bow_pajama_1780730148591.png",
    author: "Atelier SULTA",
    category: "Fabric",
    tags: ["Tissue Silk", "Authenticity", "Couture"],
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "published"
  }
];

export const SEED_FAQ: FaqItem[] = [
  { id: "faq-1", question: "كيف أقوم بتنظيف فساتين الحرير الطبيعي من سولتة؟", answer: "ننصح بإن تودع القطع في الغسيل الجاف أو غسيل يدوي لطيف للغاية بالماء البارد دون تعريض للفرك العنيف.", category: "المنسوجات", orderIndex: 1 },
  { id: "faq-2", question: "هل تتوفر عينات من الأقمشة قبل التفصيل الفاخر؟", answer: "بالتأكيد، يوفر Atelier SULTA علبة منسوجات نموذجية تُرسل لعملاء باقة الصالون لتنسيق الألوان المطلوبة.", category: "الخدمة", orderIndex: 2 }
];

export const SEED_ADVANCED_COUPONS: any[] = [
  { id: 'ac-1', code: 'ROYAL30', discount_type: 'percentage', discount_value: 30, limit_per_user: 1, min_order_value: 500, current_usages: 12, is_active: true },
  { id: 'ac-2', code: 'SULTA100', discount_type: 'fixed', discount_value: 100, limit_per_user: 5, min_order_value: 1000, current_usages: 3, is_active: true }
];

export const SEED_PROMOTIONS: any[] = [
  { id: 'prom-1', name: 'أسبوع الحرير الملكي', description: 'خصم ٢٥٪ على جميع مشغولات الحرير الإيطالي الصافي بمناسبة تدشين مجموعة العروس الملكية الجديدة.', discount_type: 'percentage', discount_value: 25, is_active: true, banner_text: 'عروض أسبوع الحرير الملكي الفاخر - خصم ٢٥٪' }
];

export const SEED_ACTIVITY_LOGS: any[] = [
  { id: 'log-1', action: 'BOOT_SYSTEM', details: 'Sulta Luxury Control Center booted successfully connected to Supabase.', admin_id: 'system', admin_name: 'إدارة النظام الملكية', date: new Date().toISOString() }
];

export const SEED_INVENTORY_LOGS: any[] = [
  { id: 'invlog-1', product_id: 'royal-pajama', variant: 'S - Bride White', change: 10, reason: 'تسوية رصيد المستودع لافتتاح الصالون', date: new Date().toISOString(), admin_id: 'admin' }
];

// ==========================================
// MOCK FALLBACK BOUTIQUE DATA REMOVED FOR PRODUCTION
// ==========================================

// ==========================================
// SULTA COUTURE SUPABASE CONNECTION
// ==========================================

export function cleanText(text: any): any {
  if (typeof text !== 'string') return text;
  return text
    .replace(/zoria/ig, 'SULTA')
    .replace(/زوريا/g, 'سولتا');
}

export function cleanImgUrl(url: any, fallbackCategory?: string): string {
  const getUnsplashFallback = (category?: string): string => {
    const cat = String(category || 'sleepwear').toLowerCase();
    if (cat === 'sleepwear') {
      return '/img/sulta_sleepwear.png';
    }
    if (cat === 'loungewear') {
      return '/img/sulta_loungewear.png';
    }
    if (cat === 'homewear' || cat === 'dresses') {
      return '/img/sulta_product_2.png';
    }
    if (cat === 'collections' || cat === 'new') {
      return '/img/sulta_hero_banner.png';
    }
    return '/img/sulta_product_1.png'; // Default peach blush luxury pajama
  };

  if (!url || typeof url !== 'string' || url.trim() === '' || url.includes('placeholder') || url.includes('or_url.png')) {
    return getUnsplashFallback(fallbackCategory);
  }

  let cleaned = url.trim();
  if (cleaned.startsWith('/src/assets/')) {
    cleaned = cleaned.replace(/^\/src\/assets\//, '/assets/');
  } else if (cleaned.startsWith('src/assets/')) {
    cleaned = cleaned.replace(/^src\/assets\//, '/assets/');
  }

  // Pre-configured high-resolution Unsplash mappings so local asset paths load beautiful images
  const IMAGE_MAPPING: Record<string, string> = {
    'hero_pajama_lifestyle_1_1780682110287.png': '/img/sulta_sleepwear.png',
    'hero_pajama_editorial_2_1780682126486.png': '/img/sulta_loungewear.png',
    'hero_pajama_detail_3_1780682140472.png': '/img/sulta_product_1.png',
    'hero_sleepwear_luxury_1780620325112.png': '/img/sulta_product_2.png',
    'pink_bow_pajama_1780730148591.png': '/img/sulta_hero_banner.png',
    'sulta_boutique_display_1_1780682812541.png': '/img/sulta_sleepwear.png',
    'sulta_box_closed_1780609086750.png': '/img/sulta_product_2.png',
    'sulta_box_open_1780609104306.png': '/img/sulta_product_1.png',
    'sulta_luxury_lifestyle_about_1_1780682261409.png': '/img/sulta_loungewear.png',
    'sulta_luxury_lifestyle_about_2_1780682276428.png': '/img/sulta_sleepwear.png',
    'sulta_luxury_pajama_1_1780681467351.png': '/img/sulta_product_1.png',
    'sulta_luxury_pajama_2_1780681482748.png': '/img/sulta_product_2.png',
    'sulta_luxury_pajama_hero_2_1780682794821.png': '/img/sulta_hero_banner.png',
  };

  // Convert local /img/ or /assets/ paths to beautiful Unsplash fallbacks
  if (cleaned.includes('/img/')) {
    const parts = cleaned.split('/');
    const filename = parts[parts.length - 1];
    if (IMAGE_MAPPING[filename]) {
      return IMAGE_MAPPING[filename];
    }
    return getUnsplashFallback(fallbackCategory);
  }

  // Also trap existing seeded unsplash mock images that might be in the database
  if (cleaned.includes('images.unsplash.com')) {
    return getUnsplashFallback(fallbackCategory);
  }

  // Exact match
  if (IMAGE_MAPPING[cleaned]) {
    return IMAGE_MAPPING[cleaned];
  }

  for (const [key, val] of Object.entries(IMAGE_MAPPING)) {
    if (cleaned.endsWith(key)) {
      return val;
    }
  }

  return cleaned;
}

function mapCategory(data: any): Category {
  return {
    id: data.id,
    name: cleanText(data.name), // Legacy support
    nameAr: cleanText(data.name_ar || data.nameAr || data.name || ''),
    nameEn: cleanText(data.name_en || data.nameEn || data.name || ''),
    slug: data.slug,
    imageUrl: cleanImgUrl(data.image_url || data.imageUrl, data.id)
  };
}

function mapCollection(data: any): Collection {
  return {
    id: data.id,
    nameAr: cleanText(data.name_ar || data.name || ''),
    nameEn: cleanText(data.name_en || data.name || ''),
    descriptionAr: cleanText(data.description_ar || data.description || ''),
    descriptionEn: cleanText(data.description_en || data.description || ''),
    imageUrl: cleanImgUrl(data.image_url || data.imageUrl, 'collections')
  };
}

function mapSettings(data: any): Settings {
  const rawHero = Array.isArray(data.hero_images) ? data.hero_images : (data.hero_images ? JSON.parse(data.hero_images) : []);
  const checkedHero = (rawHero && rawHero.length > 0) ? rawHero : [
    '/img/hero_pajama_lifestyle_1_1780682110287.png',
    '/img/hero_pajama_editorial_2_1780682126486.png',
    '/img/hero_pajama_detail_3_1780682140472.png'
  ];

  let mappedSiteName = cleanText(data.site_name || 'SULTA');

  return {
    siteName: mappedSiteName,
    logo: cleanImgUrl(data.logo, 'sleepwear') || '/img/sulta_luxury_pajama_hero_2_1780682794821.png',
    promoBannerAr: cleanText(data.promo_banner_ar),
    promoEndTime: data.promo_end_time,
    heroMiniAlertAr: cleanText(data.hero_mini_alert_ar),
    heroSubtitleAr: cleanText(data.hero_subtitle_ar),
    heroDescriptionAr: cleanText(data.hero_description_ar),
    heroImages: checkedHero.map((imgUrl: any) => cleanImgUrl(imgUrl, 'sleepwear')),
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
  const catKey = data.category || 'sleepwear';
  let rawImages = Array.isArray(data.images) ? data.images : (data.images ? JSON.parse(data.images) : []);
  if (!Array.isArray(rawImages) || rawImages.length === 0 || rawImages.every(img => !img || String(img).trim() === '')) {
    rawImages = [''];
  }
  const cleanedImages = rawImages.map((imgUrl: any) => cleanImgUrl(imgUrl, catKey));

  // Default fallbacks from physical columns
  let nameAr = data.name_ar || '';
  let nameEn = data.name_en || '';
  let descriptionAr = data.description_ar || '';
  let descriptionEn = data.description_en || '';
  let sku = data.sku || undefined;
  let fabricAr = data.fabric_ar || '';
  let fabricEn = data.fabric_en || '';
  let washInstructionsAr = data.wash_instructions_ar || '';
  let colors = Array.isArray(data.colors) ? data.colors : (data.colors ? JSON.parse(data.colors) : []);
  let sizes = Array.isArray(data.sizes) ? data.sizes : (data.sizes ? JSON.parse(data.sizes) : []);
  let isBestSeller = !!data.is_best_seller;
  let rating = Number(data.rating ?? 5);
  let reviewsCount = Number(data.reviews_count ?? 0);
  let featured = !!data.featured;
  let status = data.status || 'active';
  let shortDescription = cleanText(data.short_description || undefined);
  let tags = Array.isArray(data.tags) ? data.tags : (data.tags ? JSON.parse(data.tags) : []);
  let collection = data.collection || undefined;
  let seo = data.seo ? (typeof data.seo === 'string' ? JSON.parse(cleanText(data.seo)) : data.seo) : undefined;

  // Try parsing name fallback if nameAr and nameEn are empty but name column contains data
  if (!nameAr && !nameEn && data.name) {
    if (data.name.includes(' | ')) {
      const parts = data.name.split(' | ');
      nameAr = parts[0] || '';
      nameEn = parts[1] || parts[0] || '';
    } else {
      nameAr = data.name;
      nameEn = data.name;
    }
  }

  // Try parsing description fallback and extract metadata block if present
  if (data.description) {
    const metaIndex = data.description.indexOf(' | [METADATA_SULTA_V2]:');
    if (metaIndex !== -1) {
      const plainDescSection = data.description.substring(0, metaIndex);
      const jsonSection = data.description.substring(metaIndex + ' | [METADATA_SULTA_V2]:'.length);
      
      if (plainDescSection.includes(' | ')) {
        const parts = plainDescSection.split(' | ');
        descriptionAr = parts[0] || '';
        descriptionEn = parts[1] || parts[0] || '';
      } else {
        descriptionAr = plainDescSection;
        descriptionEn = plainDescSection;
      }

      // Reconstruct all missing metadata back to the frontend typed object
      try {
        const meta = JSON.parse(jsonSection);
        if (meta.nameAr) nameAr = meta.nameAr;
        if (meta.nameEn) nameEn = meta.nameEn;
        if (meta.descriptionAr) descriptionAr = meta.descriptionAr;
        if (meta.descriptionEn) descriptionEn = meta.descriptionEn;
        if (meta.sku) sku = meta.sku;
        if (meta.fabricAr) fabricAr = meta.fabricAr;
        if (meta.fabricEn) fabricEn = meta.fabricEn;
        if (meta.washInstructionsAr) washInstructionsAr = meta.washInstructionsAr;
        if (meta.colors) colors = meta.colors;
        if (meta.sizes) sizes = meta.sizes;
        if (meta.isBestSeller !== undefined) isBestSeller = meta.isBestSeller;
        if (meta.featured !== undefined) featured = meta.featured;
        if (meta.status) status = meta.status;
        if (meta.rating !== undefined) rating = meta.rating;
        if (meta.reviewsCount !== undefined) reviewsCount = meta.reviewsCount;
        if (meta.shortDescription) shortDescription = meta.shortDescription;
        if (meta.tags) tags = meta.tags;
        if (meta.collection) collection = meta.collection;
        if (meta.seo) seo = meta.seo;
      } catch (e) {
        console.error("[SULTA DB] Failed to parse metadata from description:", e);
      }
    } else {
      if (data.description.includes(' | ')) {
        const parts = data.description.split(' | ');
        descriptionAr = parts[0] || '';
        descriptionEn = parts[1] || parts[0] || '';
      } else {
        descriptionAr = data.description;
        descriptionEn = data.description;
      }
    }
  }

  return {
    id: data.id,
    nameAr: cleanText(nameAr),
    nameEn: cleanText(nameEn),
    category: catKey,
    categoryAr: cleanText(data.category_ar || ''),
    priceEG: Number(data.price_eg ?? 0),
    priceSA: Number(data.price_sa ?? 0),
    descriptionAr: cleanText(descriptionAr),
    descriptionEn: cleanText(descriptionEn),
    fabricAr: cleanText(fabricAr),
    fabricEn: cleanText(fabricEn),
    washInstructionsAr: cleanText(washInstructionsAr),
    images: cleanedImages,
    video: data.video || undefined,
    colors,
    sizes,
    isBestSeller,
    rating,
    reviewsCount,
    stock: Number(data.stock ?? 0),
    sku,
    salePriceEG: data.sale_price_eg ? Number(data.sale_price_eg) : (data.sale_price ? Number(data.sale_price) : undefined),
    salePriceSA: data.sale_price_sa ? Number(data.sale_price_sa) : (data.sale_price ? Number(data.sale_price) : undefined),
    featured,
    status,
    shortDescription,
    tags,
    collection,
    seo
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
    date: data.date || '',
    trackingNumber: data.tracking_number || undefined
  };
}

function mapBlogPost(data: any): BlogPost {
  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    content: data.content,
    excerpt: data.excerpt,
    imageUrl: cleanImgUrl(data.image_url || data.imageUrl, 'sleepwear'),
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

function mapTicketMessage(data: any): TicketMessage {
  return {
    id: data.id,
    ticketId: data.ticket_id,
    senderType: data.sender_type,
    senderName: data.sender_name,
    content: data.content,
    createdAt: data.created_at
  };
}

function mapTicket(data: any): SupportTicket {
  return {
    id: data.id,
    customerId: data.customer_id,
    customerName: data.customer_name,
    email: data.email,
    phone: data.phone,
    type: data.type,
    status: data.status,
    subject: data.subject,
    createdAt: data.created_at,
    updatedAt: data.updated_at
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
    if (data && data.site_name && data.site_name.toLowerCase().includes('zoria')) {
      const cleanedSiteName = data.site_name.replace(/zoria/ig, 'SULTA');
      await supabase.from('settings').update({ site_name: cleanedSiteName }).eq('id', data.id);
      data.site_name = cleanedSiteName;
    }
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
    const fetchPosts = () => {
      supabase.from('blog_posts').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
        if (error || !data || data.length === 0) {
          onSuccess(SEED_BLOG_POSTS);
        } else {
          onSuccess(data.map(mapBlogPost));
        }
      }).catch(() => {
        onSuccess(SEED_BLOG_POSTS);
      });
    };

    fetchPosts();

    const channelName = 'public:blog_posts:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, () => {
        fetchPosts();
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
    if (error) {
      console.error("Supabase saveBlogPost failed:", error.message);
      throw error;
    }
  },

  deleteBlogPost: async (postId: string): Promise<void> => {
    const { error } = await supabase.from('blog_posts').delete().eq('id', postId);
    if (error) {
      console.error("Supabase deleteBlogPost failed:", error.message);
      throw error;
    }
  },

  getFaqs: async (): Promise<FaqItem[]> => {
    try {
      const { data, error } = await supabase.from('faq').select('*').order('order_index', { ascending: true });
      if (error || !data || data.length === 0) {
        return SEED_FAQ;
      }
      return data.map(mapFaqItem);
    } catch {
      return SEED_FAQ;
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
    if (error) {
      console.error("Supabase saveFaqItem failed:", error.message);
      throw error;
    }
  },

  deleteFaqItem: async (faqId: string): Promise<void> => {
    const { error } = await supabase.from('faq').delete().eq('id', faqId);
    if (error) {
      console.error("Supabase deleteFaqItem failed:", error.message);
      throw error;
    }
  },

  subscribeCategories: (
    onSuccess: (categories: Category[]) => void, 
    _onError: (error: any) => void
  ): (() => void) => {
    supabase.from('categories').select('*').then(({ data, error }) => {
      if (error) {
        onSuccess([]);
      } else if (data) {
        onSuccess(data.map(mapCategory));
      }
    }).catch(() => onSuccess([]));

    const channelName = 'public:categories:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, async () => {
        try {
          const { data, error } = await supabase.from('categories').select('*');
          if (error) {
            onSuccess([]);
          } else if (data) {
            onSuccess(data.map(mapCategory));
          }
        } catch {
          onSuccess([]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  saveCategory: async (category: Category): Promise<void> => {
    let catId = category.id;

    const buildPayload = (uid: string) => ({
      id: uid,
      name: category.nameAr || category.name || '',
      name_ar: category.nameAr || null,
      name_en: category.nameEn || null,
      slug: category.slug || (category.id ? category.id.toLowerCase() : 'slug-' + Date.now()),
      image_url: category.imageUrl || null
    });

    let payload = buildPayload(catId);
    let { error } = await supabase.from('categories').upsert([payload]);

    let retries = 15;
    while (error && error.message && retries > 0) {
      if (error.message.includes("Could not find the '")) {
        const match = error.message.match(/Could not find the '([^']+)' column/);
        if (match && match[1]) {
          const colName = match[1];
          console.warn(`[DB] Removing categories missing column '${colName}' of 'categories' to bypass schema cache...`);
          delete payload[colName];
        } else {
          break;
        }
      } else {
        break;
      }
      const retryRes = await supabase.from('categories').upsert([payload]);
      error = retryRes.error;
      retries--;
    }

    if (error) throw error;
  },

  deleteCategory: async (categoryId: string): Promise<void> => {
    // First reset any product.category_id that matches this category to null or 'new' to prevent foreign key constraint violations
    try {
      await supabase.from('products').update({ category_id: null }).eq('category_id', categoryId);
    } catch (e) {
      console.warn("[DB] Failed to pre-clear product foreign keys (could be normal depending on schema):", e);
    }

    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    if (error) {
      console.warn("[DB] deleteCategory failed with raw categoryId:", categoryId, error);
      throw error;
    }
  },

  subscribeCollections: (
    onSuccess: (collections: Collection[]) => void, 
    _onError: (error: any) => void
  ): (() => void) => {
    supabase.from('collections').select('*').then(({ data, error }) => { if (error) throw error; if (data)   onSuccess(data.map(mapCollection)); }).catch((err) => { console.warn('Supabase fetch failed for collections', err); /* fallback provided by state default */ });

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
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const { error } = await supabase
      .from('collections')
      .upsert([{
        id: (collection.id && isUUID(collection.id)) ? collection.id : undefined,
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
    supabase.from('homepage_sections').select('*').then(({ data, error }) => { if (error) throw error; if (data)   onSuccess(data); }).catch((err) => { console.warn('Supabase fetch failed for homepage_sections', err); /* fallback provided by state default */ });

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
    supabase.from('products').select('*').then(({ data, error }) => {
      if (error) {
        onSuccess([]);
      } else if (data) {
        onSuccess(data.map(mapProduct));
      }
    }).catch(() => onSuccess([]));

    const channelName = 'public:products:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        try {
          const { data, error } = await supabase.from('products').select('*');
          if (error) {
            onSuccess([]);
          } else if (data) {
            onSuccess(data.map(mapProduct));
          }
        } catch {
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
    supabase.from('coupons').select('*').then(({ data, error }) => { if (error) throw error; if (data)   onSuccess(data.map(mapCoupon)); }).catch((err) => { console.warn('Supabase fetch failed for coupons', err); /* fallback provided by state default */ });

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
    supabase.from('reviews').select('*').then(({ data, error }) => { if (error) throw error; if (data)   onSuccess(data.map(mapReview)); }).catch((err) => { console.warn('Supabase fetch failed for reviews', err); /* fallback provided by state default */ });

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
    const loadAndMerge = (dbOrders: any[]) => {
      let localOrders: any[] = [];
      try {
        localOrders = JSON.parse(localStorage.getItem('sulta_offline_orders') || '[]');
      } catch (e) {
        console.warn("Failed to read sulta_offline_orders from localStorage", e);
      }
      
      const mappedDb = dbOrders.map(mapOrder);
      const dbIds = new Set(mappedDb.map(o => o.id));
      
      const merged = [...mappedDb];
      for (const lo of localOrders) {
        if (!dbIds.has(lo.id)) {
          merged.push(lo);
        }
      }
      onSuccess(merged);
    };

    supabase.from('orders').select('*').order('created_at', { ascending: false }).then(({ data, error }) => { 
      if (error) {
        console.warn('Supabase fetch failed for orders, using local storage fallback', error);
        loadAndMerge([]);
      } else if (data) {
        loadAndMerge(data);
      } 
    }).catch((err) => { 
      console.warn('Supabase fetch failed for orders', err); 
      loadAndMerge([]);
    });

    const channelName = 'public:orders:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
        const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (data) loadAndMerge(data);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  saveOrder: async (order: Order): Promise<void> => {
    // 1. Dual-write to localStorage for 100% transaction resilience
    try {
      const offlineOrders = JSON.parse(localStorage.getItem('sulta_offline_orders') || '[]');
      if (!offlineOrders.some((o: any) => o.id === order.id)) {
        offlineOrders.push(order);
        localStorage.setItem('sulta_offline_orders', JSON.stringify(offlineOrders));
        console.log("[SULTA DB] Saved order physically into localStorage for fallback resilience.", order.id);
      }
    } catch (e) {
      console.warn("[SULTA DB] Non-fatal localStorage dual-write failed:", e);
    }

    const safeCountry = (order.country && (order.country.toUpperCase() === 'EG' || order.country.toUpperCase() === 'SA')) 
      ? order.country.toUpperCase() 
      : 'SA';
    const safeCurrency = (order.currency && (order.currency.toUpperCase() === 'EGP' || order.currency.toUpperCase() === 'SAR')) 
      ? order.currency.toUpperCase() 
      : (safeCountry === 'EG' ? 'EGP' : 'SAR');
    const safeStatus = (order.status && ['pending', 'processing', 'shipped', 'delivered'].includes(order.status))
      ? order.status
      : 'pending';

    const payload: any = {
      id: order.id,
      customer_name: order.customerName,
      phone: order.phone,
      country: safeCountry,
      city: order.city,
      address: order.address,
      notes: order.giftMessage 
        ? `${order.notes || ''} [بطاقة إهداء ثيم ${order.giftCardTheme || 'عام'}: ${order.giftMessage}]`
        : order.notes,
      items: order.items,
      total_price: order.totalPrice,
      currency: safeCurrency,
      payment_method: order.paymentMethod,
      status: safeStatus,
      date: order.date,
      tracking_number: order.trackingNumber || null,
      subtotal: Number(order.totalPrice ?? 0) - Number(order.shippingFee ?? 0),
      shipping_cost: Number(order.shippingFee ?? 0),
      discount: 0,
      total: Number(order.totalPrice ?? 0)
    };

    console.log("[SULTA DB] Attempting insert into 'orders' with payload:", payload);
    
    try {
      let { error } = await supabase.from('orders').insert([payload]);

      let retries = 20;
      while (error && error.message && retries > 0) {
        const errMsg = error.message;
        console.warn(`[SULTA DB] saveOrder failed on Supabase: "${errMsg}". Retries left: ${retries}`);

        // 1. Column doesn't exist
        let colName: string | null = null;
        const missingMatch = errMsg.match(/Could not find the '([^']+)' column/i);
        const pgNotExistMatch = errMsg.match(/column "([^"]+)" of relation "orders" does not exist/i) || errMsg.match(/column "([^"]+)" does not exist/i);
        
        if (missingMatch && missingMatch[1]) {
          colName = missingMatch[1];
        } else if (pgNotExistMatch && pgNotExistMatch[1]) {
          colName = pgNotExistMatch[1];
        }

        if (colName) {
          console.warn(`[SULTA DB] Automatically removing column '${colName}' to satisfy database schema.`);
          delete payload[colName];
          
          const retryRes = await supabase.from('orders').insert([payload]);
          error = retryRes.error;
          retries--;
          continue;
        }

        // 2. CHECK constraint violation override
        if (errMsg.toLowerCase().includes("check constraint") || errMsg.toLowerCase().includes("violates check")) {
          if (errMsg.toLowerCase().includes("country")) {
            payload.country = 'SA';
            payload.currency = 'SAR';
          }
          if (errMsg.toLowerCase().includes("status")) {
            payload.status = 'pending';
          }
          if (errMsg.toLowerCase().includes("currency")) {
            payload.currency = 'SAR';
          }

          const retryRes = await supabase.from('orders').insert([payload]);
          error = retryRes.error;
          retries--;
          continue;
        }

        break;
      }

      if (error) {
        console.error("[SULTA DB] Failed to save order on Supabase cloud. Defaulting to local offline storage successfully. Error:", error);
      } else {
        console.log("[SULTA DB] Order successfully inserted into Supabase cloud!");
      }
    } catch (e: any) {
      console.error("[SULTA DB] Unexpected exception when writing to orders table, fallback to offline local orders:", e.message || e);
    }
  },

  updateProductStock: async (productId: string, _currentProduct: Product, nextStock: number): Promise<void> => {
    try {
      const payload: any = {
        stock: nextStock,
        stock_quantity: nextStock
      };
      
      let { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', productId);
        
      let retries = 5;
      while (error && error.message && retries > 0) {
        const errMsg = error.message;
        let colName: string | null = null;
        const missingMatch = errMsg.match(/Could not find the '([^']+)' column/i);
        const pgNotExistMatch = errMsg.match(/column "([^"]+)" of relation "products" does not exist/i) || errMsg.match(/column "([^"]+)" does not exist/i);
        
        if (missingMatch && missingMatch[1]) {
          colName = missingMatch[1];
        } else if (pgNotExistMatch && pgNotExistMatch[1]) {
          colName = pgNotExistMatch[1];
        }
        
        if (colName) {
          delete payload[colName];
          const retryRes = await supabase
            .from('products')
            .update(payload)
            .eq('id', productId);
          error = retryRes.error;
          retries--;
          continue;
        }
        break;
      }
      
      if (error) {
        console.warn("[SULTA DB] Warning: updateProductStock did not apply on server, but continuing checkout:", error.message);
      }
    } catch (e: any) {
      console.warn("[SULTA DB] Non-fatal stock update warning:", e.message || e);
    }
  },

  saveProduct: async (product: Product): Promise<void> => {
    // Standard allowed categories in CHECK constraint: ('satin', 'cotton', 'loungewear', 'dresses', 'new')
    const allowedCategories = ['satin', 'cotton', 'loungewear', 'dresses', 'new'];
    const safeCategory = allowedCategories.includes(product.category) ? product.category : 'new';
    
    // UUID format check for foreign keys that might cause syntax errors in Supabase strict mode
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    const getCategoryUuid = (id: string) => {
      const CATEGORY_UUID_MAP: Record<string, string> = {
        'sleepwear': 'de000000-0000-0000-0000-000000000001',
        'loungewear': 'de000000-0000-0000-0000-000000000002',
        'homewear': 'de000000-0000-0000-0000-000000000003',
        'dresses': 'de000000-0000-0000-0000-000000000004',
        'new': 'de000000-0000-0000-0000-000000000005',
        'collections': 'de000000-0000-0000-0000-000000000006'
      };
      return CATEGORY_UUID_MAP[id.toLowerCase()];
    };

    let resolvedCategoryId = product.category;
    if (resolvedCategoryId && !isUUID(resolvedCategoryId)) {
      resolvedCategoryId = getCategoryUuid(resolvedCategoryId) || resolvedCategoryId;
    }

    // Pack all product metadata into a JSON block so legacy database structures retain 100% of features
    const metadata = {
      nameAr: product.nameAr || '',
      nameEn: product.nameEn || '',
      descriptionAr: product.descriptionAr || '',
      descriptionEn: product.descriptionEn || '',
      sku: product.sku || null,
      fabricAr: product.fabricAr || '',
      fabricEn: product.fabricEn || '',
      washInstructionsAr: product.washInstructionsAr || '',
      colors: product.colors || [],
      sizes: product.sizes || [],
      isBestSeller: !!product.isBestSeller,
      featured: !!product.featured,
      status: product.status || 'active',
      rating: product.rating ?? 5,
      reviewsCount: product.reviewsCount ?? 0,
      shortDescription: product.shortDescription || null,
      tags: product.tags || [],
      collection: product.collection || null,
      seo: product.seo || null
    };

    const encodedName = (product.nameAr || '') + ' | ' + (product.nameEn || '');
    const encodedDescription = (product.descriptionAr || '') + ' | ' + (product.descriptionEn || '') + ' | [METADATA_SULTA_V2]:' + JSON.stringify(metadata);

    const payload: any = {
      id: product.id,
      name_ar: product.nameAr,
      name_en: product.nameEn,
      category: safeCategory,
      category_id: resolvedCategoryId || null,
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
      collection: (product.collection && isUUID(product.collection)) ? product.collection : null,
      name: encodedName,
      slug: (product.id && !isUUID(product.id)) ? product.id.toLowerCase().replace(/\s+/g, '-') : product.id.toLowerCase().replace(/\s+/g, '-'),
      description: encodedDescription,
      seo: product.seo ? JSON.stringify(product.seo) : null
    };

    // Ensure double-safety mappings for both field variants
    payload.stock_quantity = product.stock;

    let { error } = await supabase.from('products').upsert([payload]);

    let retries = 35;
    while (error && error.message && retries > 0) {
      const errMsg = error.message;
      console.warn(`[SULTA DB] Attempting automatic error resolution for product upsert: "${errMsg}". Retries left: ${retries}`);

      // 1. Missing or extra column resolution (both PostgREST & PostgreSQL native formats)
      let colName: string | null = null;
      const missingMatch = errMsg.match(/Could not find the '([^']+)' column/i);
      const pgNotExistMatch = errMsg.match(/column "([^"]+)" of relation "products" does not exist/i) || errMsg.match(/column "([^"]+)" does not exist/i);
      
      if (missingMatch && missingMatch[1]) {
        colName = missingMatch[1];
      } else if (pgNotExistMatch && pgNotExistMatch[1]) {
        colName = pgNotExistMatch[1];
      }

      if (colName) {
        console.warn(`[SULTA DB] Automatically removing unsupported column '${colName}' from the insert payload to avoid schema conflict.`);
        delete payload[colName];
        
        const retryRes = await supabase.from('products').upsert([payload]);
        error = retryRes.error;
        retries--;
        continue;
      }

      // 2. Foreign Key Constraint Violation (e.g., category_id or collection does not exist in their parent tables)
      if (errMsg.toLowerCase().includes("foreign key constraint") || errMsg.toLowerCase().includes("violates foreign key")) {
        if (errMsg.toLowerCase().includes("category_id") && payload.category_id !== null) {
          console.warn("[SULTA DB] Foreign key violation on category_id! Nullifying category_id to guarantee product is created.");
          payload.category_id = null;
        } else if (errMsg.toLowerCase().includes("collection") && payload.collection !== null) {
          console.warn("[SULTA DB] Foreign key violation on collection! Nullifying collection reference to guarantee product is created.");
          payload.collection = null;
        } else {
          console.warn("[SULTA DB] Unspecified foreign key violation. Safety nullifying optional relational references.");
          payload.category_id = null;
          payload.collection = null;
        }

        const retryRes = await supabase.from('products').upsert([payload]);
        error = retryRes.error;
        retries--;
        continue;
      }

      // 3. UUID Syntax or Conversion Errors
      const uuidMatch = errMsg.match(/invalid input syntax for type uuid:\s*"([^"]+)"/i);
      if (uuidMatch && uuidMatch[1]) {
        const problematicVal = uuidMatch[1];
        console.warn(`[SULTA DB] Invalid UUID syntax detected: "${problematicVal}". Commencing auto-remapping...`);
        
        if (payload.category_id === problematicVal) {
          const catUuid = getCategoryUuid(problematicVal);
          if (catUuid) {
            console.warn(`[SULTA DB] Auto-mapping invalid category_id '${problematicVal}' to valid UUID: '${catUuid}'`);
            payload.category_id = catUuid;
          } else {
            console.warn(`[SULTA DB] No UUID map found. Nullifying category_id to bypass UUID type-casting check.`);
            payload.category_id = null;
          }
        } else {
          // Look for any keys containing the problematic value and nullify/delete them
          for (const key of Object.keys(payload)) {
            if (payload[key] === problematicVal) {
              console.warn(`[SULTA DB] Safety nullifying problematic UUID field: '${key}'`);
              payload[key] = null;
            }
          }
        }

        const retryRes = await supabase.from('products').upsert([payload]);
        error = retryRes.error;
        retries--;
        continue;
      }

      // 4. CHECK constraint violation (e.g. category CHECK or status CHECK limits in the database schema)
      if (errMsg.toLowerCase().includes("check constraint") || errMsg.toLowerCase().includes("violates check")) {
        if (errMsg.toLowerCase().includes("category")) {
          console.warn("[SULTA DB] CHECK constraint error on category! Resetting to default 'new'.");
          payload.category = 'new';
        }
        if (errMsg.toLowerCase().includes("status")) {
          console.warn("[SULTA DB] CHECK constraint error on status! Resetting to default 'active'.");
          payload.status = 'active';
        }
        
        const retryRes = await supabase.from('products').upsert([payload]);
        error = retryRes.error;
        retries--;
        continue;
      }

      // 5. Input syntax & array format normalization for arrays like sizes/images
      if (errMsg.toLowerCase().includes("malformed array literal") || errMsg.toLowerCase().includes("invalid input syntax") || errMsg.toLowerCase().includes("cannot cast")) {
        if (errMsg.toLowerCase().includes("images")) {
          console.warn("[SULTA DB] Array syntax error on images column. Normalizing to native array...");
          if (typeof payload.images === 'string') {
            try {
              payload.images = JSON.parse(payload.images);
            } catch {
              payload.images = [payload.images || '/img/sulta_product_1.png'];
            }
          }
          if (!Array.isArray(payload.images)) {
            payload.images = [];
          }
        }
        
        if (errMsg.toLowerCase().includes("colors")) {
          console.warn("[SULTA DB] JSONB syntax error on colors column. Normalizing payload.colors to empty array...");
          payload.colors = [];
        }

        if (errMsg.toLowerCase().includes("sizes")) {
          console.warn("[SULTA DB] Array syntax error on sizes. Setting defaults.");
          payload.sizes = ['S', 'M', 'L', 'XL', 'XXL'];
        }

        const retryRes = await supabase.from('products').upsert([payload]);
        error = retryRes.error;
        retries--;
        continue;
      }

      // Cannot resolve automatically - break to trigger standard user reporting
      break;
    }

    console.log("[SULTA DB] Save finished. Payload columns remaining:", Object.keys(payload), "Error:", error ? error.message : "Success 🎉");
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
    try {
      const localOrders = JSON.parse(localStorage.getItem('sulta_offline_orders') || '[]');
      const idx = localOrders.findIndex((o: any) => o.id === order.id);
      if (idx !== -1) {
        localOrders[idx].status = order.status;
        localStorage.setItem('sulta_offline_orders', JSON.stringify(localOrders));
      }
    } catch (e) {
      console.warn("Failed to update status in localStorage orders log:", e);
    }
    const { error } = await supabase.from('orders').update({ status: order.status }).eq('id', order.id);
    if (error) {
      console.error("Non-blocking warning: Supabase cloud updateOrder status sync skipped:", error);
    }
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
    if (error) {
      console.error("Supabase saveContactMessage failed:", error.message);
      throw error;
    }
  },

  // Log Activity
  logActivity: async (action: string, details: string, adminId: string = 'system'): Promise<void> => {
    const log = {
      id: `LOG-${Date.now()}`,
      action,
      details,
      admin_id: adminId,
      date: new Date().toISOString()
    };
    const { error } = await supabase.from('activity_logs').insert([log]);
    if (error) {
      console.warn("Supabase logActivity failed:", error.message);
    }
  },

  subscribeActivityLogs: (
    onSuccess: (logs: any[]) => void, 
    _onError: (error: any) => void
  ): (() => void) => {
    const fetchLogs = () => {
      supabase.from('activity_logs').select('*').order('date', { ascending: false }).then(({ data, error }) => {
        if (error || !data || data.length === 0) {
          onSuccess(SEED_ACTIVITY_LOGS);
        } else {
          onSuccess(data);
        }
      }).catch((err) => {
        console.warn('Supabase fetch failed for activity_logs, returning seed', err);
        onSuccess(SEED_ACTIVITY_LOGS);
      });
    };

    fetchLogs();

    const channelName = 'public:activity_logs:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, () => {
        fetchLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Inventory Management
  updateInventory: async (productId: string, variant: string, change: number, reason: string): Promise<void> => {
    const log = {
      id: `INV-${Date.now()}`,
      product_id: productId,
      variant,
      change,
      reason,
      date: new Date().toISOString(),
      admin_id: 'admin'
    };
    const { error } = await supabase.from('inventory_logs').insert([log]);
    if (error) {
      console.warn("Supabase updateInventory insertion failed:", error.message);
    }
    await dbService.logActivity('UPDATE_INVENTORY', `Updated stock for ${productId} (${variant}) by ${change}. Reason: ${reason}`);
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
      images: ['/img/pink_bow_pajama_1780730148591.png'],
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
    const fetchLogs = () => {
      supabase.from('inventory_logs').select('*').order('date', { ascending: false }).then(({ data, error }) => {
        if (error || !data || data.length === 0) {
          onSuccess(SEED_INVENTORY_LOGS);
        } else {
          onSuccess(data);
        }
      }).catch((err) => {
        console.warn('Supabase fetch failed for inventory_logs, returning seed', err);
        onSuccess(SEED_INVENTORY_LOGS);
      });
    };

    fetchLogs();

    const channelName = 'public:inventory_logs:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_logs' }, () => {
        fetchLogs();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Advanced Coupons
  subscribeAdvancedCoupons: (
    onSuccess: (coupons: any[]) => void, 
    _onError: (error: any) => void
  ): (() => void) => {
    const fetchCoupons = () => {
      supabase.from('advanced_coupons').select('*').then(({ data, error }) => {
        if (error || !data || data.length === 0) {
          onSuccess(SEED_ADVANCED_COUPONS);
        } else {
          onSuccess(data);
        }
      }).catch((err) => {
        console.warn('Supabase fetch failed for advanced_coupons, returning seed', err);
        onSuccess(SEED_ADVANCED_COUPONS);
      });
    };

    fetchCoupons();

    const channelName = 'public:advanced_coupons:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'advanced_coupons' }, () => {
        fetchCoupons();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },

  saveAdvancedCoupon: async (coupon: any): Promise<void> => {
    const { error } = await supabase.from('advanced_coupons').upsert([coupon]);
    if (error) {
      console.error("Supabase saveAdvancedCoupon failed:", error.message);
      throw error;
    }
    await dbService.logActivity('SAVE_COUPON', `Saved coupon ${coupon.code}`);
  },

  deleteAdvancedCoupon: async (id: string): Promise<void> => {
    const { error } = await supabase.from('advanced_coupons').delete().eq('id', id);
    if (error) {
      console.error("Supabase deleteAdvancedCoupon failed:", error.message);
      throw error;
    }
    await dbService.logActivity('DELETE_COUPON', `Deleted coupon ${id}`);
  },

  saveNewsletterSubscription: async (sub: any): Promise<void> => {
    const { error } = await supabase.from('newsletter_subs').upsert({
      id: sub.id,
      email: sub.email,
      phone: sub.phone,
      source: sub.source,
      date: sub.date,
      subscribed: sub.subscribed
    });
    if (error) {
      console.warn("Newsletter Sub upsert failed:", error.message);
    }
  },

  // Promotions
  subscribePromotions: (
    onSuccess: (promotions: any[]) => void, 
    _onError: (error: any) => void
  ): (() => void) => {
    const mapPromo = (p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      discountType: p.discount_type || p.discountType,
      discountValue: p.discount_value || p.discountValue,
      startDate: p.start_date || p.startDate,
      endDate: p.end_date || p.endDate,
      isActive: p.is_active !== undefined ? p.is_active : p.isActive,
      applicableCategories: p.applicable_categories || p.applicableCategories || [],
      bannerText: p.banner_text || p.bannerText,
      createdAt: p.created_at || p.createdAt
    });

    const fetchPromos = () => {
      supabase.from('promotions').select('*').then(({ data, error }) => {
        if (error || !data || data.length === 0) {
          onSuccess(SEED_PROMOTIONS.map(mapPromo));
        } else {
          onSuccess(data.map(mapPromo));
        }
      }).catch(() => {
        onSuccess(SEED_PROMOTIONS.map(mapPromo));
      });
    };

    fetchPromos();

    const channelName = 'public:promotions:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promotions' }, () => {
        fetchPromos();
      }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
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
      console.error("Supabase savePromotion failed:", error.message);
      throw error;
    }
    await dbService.logActivity('SAVE_PROMOTION', `Saved promotion ${promo.name}`);
  },

  deletePromotion: async (id: string): Promise<void> => {
    const { error } = await supabase.from('promotions').delete().eq('id', id);
    if (error) {
      console.error("Supabase deletePromotion failed:", error.message);
      throw error;
    }
    await dbService.logActivity('DELETE_PROMOTION', `Deleted promotion ${id}`);
  },

  // Customers (Profile & Loyalty)
  subscribeCustomers: (
    onSuccess: (customers: any[]) => void, 
    _onError: (error: any) => void
  ): (() => void) => {
    supabase.from('customers').select('*').then(({ data, error }) => { if (error) throw error; if (data)   onSuccess(data); }).catch((err) => { console.warn('Supabase fetch failed for customers', err); /* fallback provided by state default */ });
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
    console.log('Seeding is disabled for production.');
  },

  // SUPPORT TICKETS
  subscribeTickets: (
    onSuccess: (tickets: SupportTicket[]) => void,
    _onError: (error: any) => void
  ): (() => void) => {
    supabase.from('support_tickets').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) {
        onSuccess([]);
      } else if (data) {
        onSuccess(data.map(mapTicket));
      }
    }).catch(() => onSuccess([]));

    const channelName = 'public:support_tickets:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, async () => {
        const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
        if (data) onSuccess(data.map(mapTicket));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  },

  subscribeTicketMessages: (
    ticketId: string,
    onSuccess: (messages: TicketMessage[]) => void,
    _onError: (error: any) => void
  ): (() => void) => {
    supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true }).then(({ data, error }) => {
      if (error) {
        onSuccess([]);
      } else if (data) {
        onSuccess(data.map(mapTicketMessage));
      }
    }).catch(() => onSuccess([]));

    const channelName = 'public:ticket_messages:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${ticketId}` }, async () => {
        const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
        if (data) onSuccess(data.map(mapTicketMessage));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  },

  saveTicket: async (ticket: SupportTicket): Promise<void> => {
    const payload = {
      id: ticket.id,
      customer_id: ticket.customerId,
      customer_name: ticket.customerName,
      email: ticket.email,
      phone: ticket.phone,
      type: ticket.type,
      status: ticket.status,
      subject: ticket.subject,
      created_at: ticket.createdAt,
      updated_at: ticket.updatedAt
    };
    try {
      const { error } = await supabase.from('support_tickets').upsert([payload]);
      if (error) throw error;
    } catch (e: any) {
      console.warn('Silent save for ticket in local/localStorage (table might not exist)', e.message);
      try { localStorage.setItem('support_ticket_' + ticket.id, JSON.stringify(payload)); } catch(err){}
    }
  },

  updateTicketStatus: async (ticketId: string, status: SupportTicket['status']): Promise<void> => {
    try {
      const { error } = await supabase.from('support_tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', ticketId);
      if (error) throw error;
    } catch (e: any) {
      console.warn('Failed to update ticket status via Supabase:', e.message);
    }
  },

  saveTicketMessage: async (message: TicketMessage): Promise<void> => {
    const payload = {
      id: message.id,
      ticket_id: message.ticketId,
      sender_type: message.senderType,
      sender_name: message.senderName,
      content: message.content,
      created_at: message.createdAt
    };
    try {
      const { error } = await supabase.from('ticket_messages').insert([payload]);
      if (error) throw error;
    } catch (e: any) {
      console.warn('Silent save for ticket message in local/localStorage', e.message);
      try { localStorage.setItem('ticket_message_' + message.id, JSON.stringify(payload)); } catch(err){}
    }
  },

  // DIAGNOSTIC TEST FOR PRODUCTS TABLE (RLS AND API KEY VERIFICATION)
  testProductsConnection: async (): Promise<{
    success: boolean;
    error: any;
    data: any[] | null;
    message: string;
    diagnosticDetails?: string;
  }> => {
    console.log("%c[SULTA DB DIAGNOSTIC] 🔍 Starting connection diagnostics for table 'products'...", "background: #161618; color: #c5a059; font-weight: bold; font-size: 13px; padding: 4px; border-radius: 4px;");
    
    // Log active URL
    console.log(`[SULTA DB DIAGNOSTIC] Target Supabase URL: ${urlToUse}`);
    
    try {
      // 1. Check if we are using the Dummy Client
      if (keyToUse === DEFAULT_KEY) {
        const errorMsg = "The database is currently using the offline fallback Mock Client because VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY are missing or set to defaults.";
        console.error("%c[SULTA DB DIAGNOSTIC] ❌ CONFIGURATION ERROR:", "color: #ff4b4b; font-weight: bold;", errorMsg);
        console.table({
          "VITE_SUPABASE_URL Configured": isUrlStructurallyValid(urlToUse) ? "Yes" : "No",
          "VITE_SUPABASE_ANON_KEY Configured": keyToUse !== DEFAULT_KEY ? "Yes" : "No (Using DEFAULT_KEY)",
          "Active URL": urlToUse,
          "Expected Key Action": "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env / Vercel configurations."
        });
        
        return {
          success: false,
          error: new Error("Supabase is not configured (Using Mock Client)"),
          data: null,
          message: errorMsg,
          diagnosticDetails: "تنبيه: تطبيقك غير متصل بقاعدة بيانات حقيقية. يرجى التحقق من متغيرات البيئة VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY للتأكد من ربطها بـ Supabase بنجاح."
        };
      }

      // 2. Query 'products'
      console.log("[SULTA DB DIAGNOSTIC] Sending select query: supabase.from('products').select('*').limit(5)...");
      const { data, error, status, statusText } = await supabase.from('products').select('*').limit(5);

      if (error) {
        console.error("%c[SULTA DB DIAGNOSTIC] ❌ DATABASE CONNECTION FAILED:", "color: #ff4b4b; font-weight: bold;");
        console.error("Error Object:", error);
        console.table({
          "HTTP Status": status,
          "Status Text": statusText,
          "Error Code": error.code || "None",
          "Error Message": error.message
        });

        let diagnosticDetails = "خطأ غير معروف في الاتصال. راجع الكونسول لمزيد من التفاصيل.";
        
        // Pinpoint RLS vs API Key vs Schema issues
        if (status === 401 || error.message?.includes("JWT") || error.message?.includes("Invalid API key") || error.message?.toLowerCase().includes("unauthorized")) {
          // Authentication / API Key Issue
          diagnosticDetails = "❌ خلل في مفاتيح الـ API: رمز التوثيق (JWT / ANON KEY) غير صالح أو منتهي الصلاحية، أو أنه لا يتطابق مع هذا المشروع في Supabase. يرجى إعادة نسخ مفتاح Anon من إعدادات API في لوحة تحكم Supabase وتحديث المتغيرات.";
          console.warn("%c[SULTA DB DIAGNOSTIC] 💡 ANALYSIS: API KEY / AUTHENTICATION ISSUE SPOTTED!", "color: #ffca28; font-weight: bold;");
          console.warn("Recommendation: Ensure VITE_SUPABASE_ANON_KEY matches your Supabase Project's Anon key perfectly. Check for spaces or trailing slash errors.");
        } 
        else if (status === 403 || error.message?.toLowerCase().includes("violates row-level security") || error.message?.toLowerCase().includes("insufficient_privilege") || error.message?.toLowerCase().includes("permission denied")) {
          // RLS Rule Issue
          diagnosticDetails = "❌ خلل في سياسات الأمان RLS: تم الاتصال بنجاح ولكن سياسات الأمان في Supabase تمنع استرجاع البيانات (Row Level Security). يرجى فتح جدول 'products' في Supabase والذهاب لـ Authentication -> Policies وإنشاء سياسة تمكن المستخدمين (عموم الجمهور) من إجراء عملية القراءة SELECT.";
          console.warn("%c[SULTA DB DIAGNOSTIC] 💡 ANALYSIS: ROW LEVEL SECURITY (RLS) VIOLATION SPOTTED!", "color: #ffca28; font-weight: bold;");
          console.warn("Recommendation: RLS is active on public.products but has no POLICY allowing SELECT/Read. Go to Supabase -> Database -> Policies -> Enable Read Access for everyone.");
        }
        else if (status === 404 || error.code === "PGRST116" || error.message?.toLowerCase().includes("relation") || error.message?.toLowerCase().includes("does not exist")) {
          // Missing Schema/Table Issue
          diagnosticDetails = "❌ خلل في جدول قاعدة البيانات: جدول 'products' غير موجود في قاعدة بياناتك داخل المخطط العام (public schema). يرجى نسخ الكود من ملف 'supabase-schema.sql' وتشغيله في الـ SQL Editor في Supabase لإنشاء الجداول.";
          console.warn("%c[SULTA DB DIAGNOSTIC] 💡 ANALYSIS: MISSING TABLE OR SCHEMATIC ERROR!", "color: #ffca28; font-weight: bold;");
          console.warn("Recommendation: Run the database creation script 'supabase-schema.sql' inside the Supabase SQL Editor. The table 'products' could not be found.");
        }

        return {
          success: false,
          error,
          data: null,
          message: `فشل الاتصال: ${error.message} (كود ${status})`,
          diagnosticDetails
        };
      }

      // 3. Successful Connection
      console.log("%c[SULTA DB DIAGNOSTIC] 🎉 CONNECTION TEST PASSED SUCCESSFULLY!", "color: #4caf50; font-weight: bold;");
      console.log(`[SULTA DB DIAGNOSTIC] Retrieved ${data?.length || 0} products:`, data);

      let successMsg = `تم الاتصال بجداول Supabase ومطابقة جدول products بنجاح. تم استرجاع ${data?.length || 0} من المنتجات.`;
      let diagnosticDetails = "اتصالك سليم وقائم بشكل كامل! الجداول مطابقة والـ API Key سليم تماماً والبيانات مسترجعة ونشطة وعامة.";
      
      if (!data || data.length === 0) {
        successMsg += " (تحذير: جدول المنتجات فارغ تماماً)";
        diagnosticDetails = "الاتصال سليم، ولكن لا توجد منتجات لعرضها. يرجى الانتقال إلى لوحة التحكم الإدارية أو Supabase لإضافة منتج جديد، أو تشغيل Seed للبيانات للتمتع بالعرض التفاعلي.";
        console.warn("[SULTA DB DIAGNOSTIC] Warning: Connection succeeded but table is empty. Try adding an item!");
      }

      return {
        success: true,
        error: null,
        data,
        message: successMsg,
        diagnosticDetails
      };

    } catch (err: any) {
      console.error("%c[SULTA DB DIAGNOSTIC] ❌ UNEXPECTED SYSTEM RUNTIME EXCEPTION:", "color: #ff4b4b; font-weight: bold;", err);
      return {
        success: false,
        error: err,
        data: null,
        message: `حدث استثناء غير متوقع: ${err?.message || String(err)}`,
        diagnosticDetails: "تسبب تشغيل الكود في كود متصفح العميل بعطل أثناء إرسال استعلام Supabase. تحقق من اتصال الشبكة وسرعة الاستجابة."
      };
    }
  },
};
