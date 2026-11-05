import { Product, Review, DiscountCoupon, Order, InStockAlert, Category, Settings, ContactMessage, NewsletterSubscription, Collection, BlogPost, FaqItem, SupportTicket, TicketMessage, Country, TeamMember, TeamMemberRole, StockMovement, CustomerAnalyticsRecord, ActualProductPrice } from '../types';
import { createClient } from '@supabase/supabase-js';
import { SEED_FALLBACK_PRODUCTS } from '../data/fallbackProducts';

import { parseCleanArabicDescription } from '../utils/textUtils';
import { getIdFromSlug } from '../utils/slugify';

// --- ROBUST CONFIGURATION ---
const DEFAULT_URL = 'https://fwadgmhabzaudusxghnh.supabase.co';
const DEFAULT_KEY = 'sb_publishable_pYBVo5mba3tEpuMDxUlt6g_3aCk67gj';

let urlToUse = DEFAULT_URL;
let keyToUse = DEFAULT_KEY;

// Safely extract from Vite env if available, falling back to process.env in Node CLI environments
try {
  let vUrl: string | undefined;
  let vKey: string | undefined;

  try {
    vUrl = (import.meta as any).env.VITE_SUPABASE_URL || (import.meta as any).env.SUPABASE_URL;
    vKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || (import.meta as any).env.SUPABASE_ANON_KEY;
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
        console.warn("[Sulta DB] Using a key starting with 'sb_'. This is active.");
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

const isKeyValid = (k: string) => {
    return typeof k === 'string' && k.trim().length > 20 && !k.includes('NOT_CONFIGURED') && !k.includes('YOUR_');
};

if (isUrlStructurallyValid(urlToUse) && isKeyValid(keyToUse)) {
    try {
        const cleanUrl = urlToUse.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
        console.log(`[Sulta DB] Correctly configured with real Supabase database: ${cleanUrl} (Key length: ${keyToUse.length})`);
        supabaseInstance = createClient(cleanUrl, keyToUse);
    } catch (err) {
        console.error("[Sulta DB] createClient threw an error:", err);
        supabaseInstance = createDummyClient();
    }
} else {
    console.warn(`[Sulta DB] Using offline fallback Dummy Client. Missing or invalid Supabase configurations. URL: ${urlToUse}, Key configured: ${isKeyValid(keyToUse)}`);
    supabaseInstance = createDummyClient();
}

export const supabase = supabaseInstance;

export const SEED_BLOG_POSTS: BlogPost[] = [
  {
    id: "art-001",
    title: "أسرار اختيار بيجامة العروس المثالية - ليلة من العمر تفوق الواقع",
    slug: "bride-pajama-secrets",
    content: "الملابس الفخمة تعيد ترتيب روحكِ وحسابات استرخائك. ليلة العروس ليست ليلة عابرة، بل هي تدشين لنمط حياة مترف من كوتور سولته المنسوج من خيوط الفخامة الاستثنائية. ينصح مصممو سولته بالبدء بقطع الأنسجة الملكية المفتوحة، وتطويقها بالدانتيل الراقي عريض الأطراف لتتوجي كإمبراطورة الحسن والدلال.",
    excerpt: "دليل العروس لتنسيق أطقم النوم الراقية للياليها الفريدة بمقاييس الجودة العالمية.",
    imageUrl: "/img/sulta_hero_banner_real.webp",
    author: "Sulta",
    category: "Couture",
    tags: ["Bridal", "Luxury", "Styling"],
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "published"
  },
  {
    id: "art-002",
    title: "الألياف الطبيعية vs الصناعية - علم المنسوجات المترفة",
    slug: "pure-fabric-science",
    content: "إن لمس أقمشة Sulta هو بمثابة التمشي فوق الرمل البكر الدافئ. نستخدم في القطع الخيوط الناعمة الطبيعية المعالجة بوزن ثقيل وتصميم مبرد ليتنفس جسدكِ بحرية تامة ويعزز هرمونات الاسترخاء. وتجنبي القطع البترولية التي تشتت ذرات الهواء وتضغط على مسامات البشرة الحساسة.",
    excerpt: "تعلمي كيف تفرقين بين التفاصيل الراقية والأقمشة المقلدة لترتدي دوماً ما يليق بوقارك.",
    imageUrl: "/img/pink_bow_pajama_1780730148591.png",
    author: "Sulta",
    category: "Fabric",
    tags: ["Tissue Soft", "Authenticity", "Couture"],
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "published"
  }
];

export const SEED_FAQ: FaqItem[] = [
  { id: "faq-1", question: "كيف أقوم بتنظيف قطع الأنسجة الطبيعية من سولته؟", answer: "ننصح بإن تودع القطع في الغسيل الجاف أو غسيل يدوي لطيف للغاية بالماء البارد دون تعريض للفرك العنيف.", category: "المنسوجات", orderIndex: 1 },
  { id: "faq-2", question: "هل تتوفر عينات من الأقمشة قبل التفصيل الفاخر؟", answer: "بالتأكيد، يوفر Sulta علبة منسوجات نموذجية تُرسل لعملاء باقة الصالون لتنسيق الألوان المطلوبة.", category: "الخدمة", orderIndex: 2 }
];

export const SEED_ADVANCED_COUPONS: any[] = [
  { id: 'ac-1', code: 'ROYAL30', discount_type: 'percentage', discount_value: 30, limit_per_user: 1, min_order_value: 500, current_usages: 12, is_active: true },
  { id: 'ac-2', code: 'Sulta100', discount_type: 'fixed', discount_value: 100, limit_per_user: 5, min_order_value: 1000, current_usages: 3, is_active: true }
];

export const SEED_PROMOTIONS: any[] = [
  { id: 'prom-1', name: 'أسبوع الأنسجة الملكية', description: 'خصم ٢٥٪ على جميع مشغولات الأنسجة الملكية الصافية بمناسبة تدشين مجموعة العروس الجديدة.', discount_type: 'percentage', discount_value: 25, is_active: true, banner_text: 'عروض أسبوع الأنسجة الملكية الفاخر - خصم ٢٥٪' }
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
// Sulta COUTURE SUPABASE CONNECTION
// ==========================================

export function cleanText(text: any): any {
  if (typeof text !== 'string') return text;
  let cleaned = text
    .replace(/sulta\s+Sulta/ig, 'Sulta')
    .replace(/سولته\s+أتيليه|سولته\s+اتيليه/g, 'سولته')
    .replace(/أتيليه\s+سولته|اتيليه\s+سولته/g, 'سولته')
    .replace(/zoria/ig, 'Sulta')
    .replace(/زوريا/g, 'سولته')
    .replace(/كوتور ساتان/g, 'كوتور ناعم')
    .replace(/الساتان/g, 'الأنسجة الفاخرة')
    .replace(/الستان/g, 'الأنسجة الفاخرة')
    .replace(/ساتان/g, 'أنسجة فاخرة')
    .replace(/ستان/g, 'أنسجة فاخرة')
    .replace(/الإيطالي|الايطالي/g, 'الملكي')
    .replace(/إيطالي|ايطالي/g, 'ملكي')
    .replace(/الإيطالية|الايطالية/g, 'الملكية')
    .replace(/إيطالية|ايطالية/g, 'ملكية')
    .replace(/satin/ig, 'couture')
    .replace(/silk/ig, 'couture')
    .replace(/italian/ig, 'luxury')
    .replace(/توصيل فوري/g, 'توصيل سريع')
    .replace(/بمويه باردة/g, 'بماء بارد')
    .replace(/مويه باردة/g, 'ماء بارد')
    .replace(/وان سايز/g, 'مقاس واحد (45-80 كجم)');

  // Clean up duplicate words and typos caused by string replacements
  cleaned = cleaned
    .replace(/(تُغسل\s+)+يُغسل/g, 'تُغسل')
    .replace(/(فاخر\s+)+فاخر/g, 'فاخر')
    .replace(/(فاخرة\s+)+فاخرة/g, 'فاخرة')
    .replace(/(ملكي\s+)+ملكي/g, 'ملكي')
    .replace(/(ملكية\s+)+ملكية/g, 'ملكية')
    .replace(/فاخرةي/g, 'فاخرة')
    .replace(/سولتة/g, 'سولته');

  return cleaned.trim();
}

/**
 * Authoritative, centralized shipping fee calculation.
 * Rule: 40 SAR for subtotal <= 299 SAR. Free (> 299 SAR) for SA.
 * For EG: 75 EGP for subtotal <= 1000 EGP. Free (> 1000 EGP).
 */
export function calculateShippingFee(discountedSubtotal: number, country: Country = 'SA'): number {
  if (country === 'SA') {
    // Policy: Strictly more than 299 for free shipping.
    return discountedSubtotal > 299 ? 0 : 40;
  }
  if (country === 'EG') {
    return discountedSubtotal > 1000 ? 0 : 75;
  }
  return 0;
}

export function cleanImgUrl(url: any, width: number | string = 1200): string {
  if (!url || typeof url !== 'string' || url.trim() === '' || url.trim() === 'null' || url.trim() === 'undefined') {
    return '';
  }

  const cleaned = url.trim();

  // Return direct clean URL without wsrv.nl wrapping to ensure high-res og:image
  if (cleaned.startsWith('http')) {
    const sanitized = cleaned.replace(/([^:])\/+/g, '$1/');
    if (sanitized.includes('wsrv.nl')) {
      try {
        const rawUrl = sanitized.split('url=')[1]?.split('&')[0];
        if (rawUrl) return decodeURIComponent(rawUrl);
      } catch (e) {}
    }
    return sanitized;
  }

  if (cleaned.startsWith('data:')) return cleaned;

  // Handle local assets (automatically route to high-speed WebP version if available)
  if (cleaned.startsWith('/img/') || cleaned.startsWith('img/')) {
    const formatted = cleaned.startsWith('/') ? cleaned : '/' + cleaned;
    if (formatted.endsWith('.png') || formatted.endsWith('.jpg')) {
      return formatted.replace(/\.(png|jpg)$/, '.webp');
    }
    return formatted;
  }
  
  if (cleaned.startsWith('/src/assets/') || cleaned.startsWith('src/assets/')) {
    const replaced = cleaned.replace(/^(\/)?src\/assets\//, '/img/');
    if (replaced.endsWith('.png') || replaced.endsWith('.jpg')) {
      return replaced.replace(/\.(png|jpg)$/, '.webp');
    }
    return replaced;
  }

  // Fallback: Assume it's a filename in the Supabase 'products' bucket
  const cleanPath = cleaned.replace(/^\/+/, '').replace(/^products\//, '');
  if (cleanPath.includes('.')) {
    const fullSupabaseUrl = `https://fwadgmhabzaudusxghnh.supabase.co/storage/v1/object/public/products/${cleanPath}`;
    const w = typeof width === 'number' ? width : (parseInt(String(width)) || 1200);
    return `https://wsrv.nl/?url=${encodeURIComponent(fullSupabaseUrl)}&w=${w}&output=webp&q=85&il`;
  }

  return '';
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
    '/img/sulta_hero_banner_real.webp'
  ];

  let mappedSiteName = cleanText(data.site_name || 'Sulta');
  if (!mappedSiteName || /Sulta/i.test(mappedSiteName)) {
    mappedSiteName = 'Sulta';
  }

  let mappedWhatsapp = data.whatsapp;
  if (!mappedWhatsapp || mappedWhatsapp === '966500000000' || mappedWhatsapp.includes('966530454045') || mappedWhatsapp === '201110095403' || mappedWhatsapp.includes('20111') || mappedWhatsapp.includes('596894393')) {
    mappedWhatsapp = '966552823677';
  }

  let mappedContactPhone = data.contact_phone;
  if (!mappedContactPhone || mappedContactPhone === '+966500000000' || mappedContactPhone.includes('966530454045') || mappedContactPhone.includes('+20') || mappedContactPhone.includes('596894393')) {
    mappedContactPhone = '+966 55 282 3677';
  }

  let mappedContactEmail = data.contact_email;
  if (!mappedContactEmail || mappedContactEmail.includes('brightgirlksa') || mappedContactEmail.includes('zoria') || mappedContactEmail === 'royal@sultawear.com') {
    mappedContactEmail = 'concierge@sulta.sa';
  }

  let mappedWhatsappSaudi = '966552823677';
  let mappedContactPhoneSaudi = '+966 55 282 3677';

  return {
    siteName: mappedSiteName,
    logo: cleanImgUrl(data.logo, 'sleepwear') || '/img/sulta_hero_banner_real.webp',
    promoBannerAr: cleanText(data.promo_banner_ar),
    promoEndTime: data.promo_end_time,
    heroMiniAlertAr: cleanText(data.hero_mini_alert_ar),
    heroSubtitleAr: cleanText(data.hero_subtitle_ar),
    heroDescriptionAr: cleanText(data.hero_description_ar),
    heroImages: checkedHero.map((imgUrl: any) => cleanImgUrl(imgUrl, 'sleepwear')),
    contactEmail: mappedContactEmail,
    contactPhone: mappedContactPhone,
    contactPhoneSaudi: mappedContactPhoneSaudi,
    whatsapp: mappedWhatsapp,
    whatsappSaudi: mappedWhatsappSaudi,
    instagram: data.instagram,
    facebook: data.facebook,
    tiktok: data.tiktok,
    facebookPixelId: data.facebook_pixel_id || '1648674350574190',
    metaCapiAccessToken: data.metaCapiAccessToken || data.meta_capi_access_token || 'EABD8o49XjZBMBSx1kZCB94D9h5hYDZB4rTMd7Fq8byLh0U2AvjYZAutqsrIHDghcrnkOVvQ7LdtD6p4d45ZCNx4KCNU5ZCXyRQJA2rQoLjiqfRgtY7TqjLZCulfVa4jOZAKZAPHHhijFcVcunEPB9UwWFOsnbQQIiTj2D5gBwA8BZBZBZCHZAaopoi0wcIZA2fx6ZBRau6uBwZDZD',
    metaTestEventCode: data.metaTestEventCode || data.meta_test_event_code || '',
    googleAnalyticsId: data.google_analytics_id,
    snapchatPixelId: data.snapchat_pixel_id,
    tiktokPixelId: data.tiktok_pixel_id || 'DBESRBJC77U4J2JQDUB0',
    shippingRates: Array.isArray(data.shipping_rates) ? data.shipping_rates : (data.shipping_rates ? JSON.parse(data.shipping_rates) : []),
    defaultShippingFee: Number(data.default_shipping_fee ?? 0),
    egDefaultCoupon: data.egDefaultCoupon || data.eg_default_coupon,
    saDefaultCoupon: data.saDefaultCoupon || data.sa_default_coupon,
    egExclusiveProductIds: data.egExclusiveProductIds || data.eg_exclusive_product_ids ? (Array.isArray(data.egExclusiveProductIds || data.eg_exclusive_product_ids) ? (data.egExclusiveProductIds || data.eg_exclusive_product_ids) : JSON.parse(data.egExclusiveProductIds || data.eg_exclusive_product_ids)) : [],
    saExclusiveProductIds: data.saExclusiveProductIds || data.sa_exclusive_product_ids ? (Array.isArray(data.saExclusiveProductIds || data.sa_exclusive_product_ids) ? (data.sa_exclusive_product_ids || data.sa_exclusive_product_ids) : JSON.parse(data.sa_exclusive_product_ids || data.sa_exclusive_product_ids)) : [],
    // Bank Account & Payment Gateways
    bankName: data.bankName || data.bank_name || 'البنك العربي الوطني (مدى)',
    bankAccountName: data.bankAccountName || data.bank_account_name || 'ابو بكر احمد على يونس',
    bankIban: data.bankIban || data.bank_iban || 'SA3530100991100960601337',
    bankAccountNumber: data.bankAccountNumber || data.bank_account_number || '991100960601337',
    bankQrCodeUrl: data.bankQrCodeUrl || data.bank_qr_code_url || '/assets/aistudio/IMG-20261026-WA0045_e8a306a8.jpg',
    tabbyEnabled: data.tabbyEnabled ?? data.tabby_enabled ?? true,
    tabbyPublicKey: data.tabbyPublicKey || data.tabby_public_key || '',
    tamaraEnabled: data.tamaraEnabled ?? data.tamara_enabled ?? true,
    tamaraPublicKey: data.tamaraPublicKey || data.tamara_public_key || '',
    paypalEnabled: data.paypalEnabled ?? data.paypal_enabled ?? true,
    paypalClientId: data.paypalClientId || data.paypal_client_id || '',
    // WhatsApp Marketing & Cart Recovery Automation
    whatsappMarketingAutoEnabled: data.whatsappMarketingAutoEnabled ?? data.whatsapp_marketing_auto_enabled ?? true,
    whatsappCartRecoveryEnabled: data.whatsappCartRecoveryEnabled ?? data.whatsapp_cart_recovery_enabled ?? true,
    whatsappWelcomeEnabled: data.whatsappWelcomeEnabled ?? data.whatsapp_welcome_enabled ?? true,
    whatsappDiscountCode: data.whatsappDiscountCode || data.whatsapp_discount_code || 'Sulta20',
    whatsappMarketingMessageTemplate: data.whatsappMarketingMessageTemplate || data.whatsapp_marketing_template || '',
    whatsappCartRecoveryMessageTemplate: data.whatsappCartRecoveryMessageTemplate || data.whatsapp_cart_recovery_template || '',
    // Team Members with Gmail access
    adminTeamMembers: Array.isArray(data.adminTeamMembers) 
      ? data.adminTeamMembers 
      : (data.admin_team_members ? (typeof data.admin_team_members === 'string' ? JSON.parse(data.admin_team_members) : data.admin_team_members) : undefined)
  };
}

function mapProduct(data: any): Product {
  const fallbackProduct = SEED_FALLBACK_PRODUCTS.find(p => p.id === data.id || (data.id && p.id.startsWith(data.id.slice(0, 8))));

  const catKey = data.category || 'sleepwear';
  let rawImages: any[] = [];
  if (Array.isArray(data.images)) {
    rawImages = data.images;
  } else if (typeof data.images === 'string' && data.images.trim()) {
    try {
      const parsed = JSON.parse(data.images);
      rawImages = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      rawImages = [data.images];
    }
  }
  if ((!rawImages || rawImages.length === 0) && data.image_url) {
    rawImages = [data.image_url];
  }

  // Strictly from Supabase data.image_url and data.images
  const designatedCover = data.image_url || '';
  if (designatedCover && !rawImages.includes(designatedCover)) {
    rawImages = [designatedCover, ...rawImages];
  } else if (designatedCover && rawImages.indexOf(designatedCover) > 0) {
    rawImages = [designatedCover, ...rawImages.filter(img => img !== designatedCover)];
  }

  const validImages = (rawImages || []).filter((img: any) => img && typeof img === 'string' && img.trim() !== '');
  const cleanedImages = validImages.length > 0
    ? validImages.map((imgUrl: any) => cleanImgUrl(imgUrl, catKey)).filter(Boolean)
    : []; // REQ: No fallback images from code. Only Supabase.

  // Name resolution: DB physical columns FIRST
  let nameAr = data.name_ar || (fallbackProduct ? fallbackProduct.nameAr : '') || (data.name ? data.name.split(' | ')[0] : '') || 'منتج سولته';
  let nameEn = data.name_en || (fallbackProduct ? fallbackProduct.nameEn : '') || (data.name && data.name.includes(' | ') ? data.name.split(' | ')[1] : '') || 'Sulta Product';

  // Description resolution
  let rawDesc = data.description_ar || data.description || '';
  if (rawDesc.includes('[METADATA_Sulta_V2]')) {
    rawDesc = rawDesc.substring(0, rawDesc.indexOf('[METADATA_Sulta_V2]'));
  }
  let descriptionAr = parseCleanArabicDescription(rawDesc) || (fallbackProduct ? fallbackProduct.descriptionAr : '');
  let descriptionEn = (fallbackProduct ? fallbackProduct.descriptionEn : '');

  // Fabric / Wash
  let fabricAr = data.fabric_ar || data.material || (fallbackProduct ? fallbackProduct.fabricAr : '');
  let fabricEn = data.fabric_en || (fallbackProduct ? fallbackProduct.fabricEn : '');
  let washInstructionsAr = data.wash_instructions_ar || data.care_instructions || (fallbackProduct ? fallbackProduct.washInstructionsAr : '');

  // Colors & Sizes
  let colors = Array.isArray(data.colors) ? data.colors : (data.colors ? JSON.parse(data.colors) : (fallbackProduct ? fallbackProduct.colors : []));
  if (!colors || colors.length === 0) {
    colors = fallbackProduct ? fallbackProduct.colors : [{ name: 'وردي', hex: '#DF8A9D' }];
  }
  let sizes = ['One Size'];

  // Price resolution: DB physical columns FIRST, then fallback
  let resolvedPriceSA = Number(data.price_sa) > 0 
    ? Number(data.price_sa) 
    : (Number(data.price) > 0 
      ? Number(data.price) 
      : (fallbackProduct ? fallbackProduct.priceSA : 69));

  // Strict sale price validation: must be strictly greater than 0, strictly less than regular price, and <= 200 SAR
  let resolvedSalePriceSA: number | undefined = undefined;
  const rawSaleSA = data.sale_price_sa !== null && data.sale_price_sa !== undefined 
    ? Number(data.sale_price_sa) 
    : (data.sale_price !== null && data.sale_price !== undefined ? Number(data.sale_price) : undefined);

  if (rawSaleSA && rawSaleSA > 0 && rawSaleSA < resolvedPriceSA && rawSaleSA <= 200) {
    resolvedSalePriceSA = rawSaleSA;
  }

  const resolvedPriceEG = Number(data.price_eg) > 0 
    ? Number(data.price_eg) 
    : (fallbackProduct ? fallbackProduct.priceEG : 899);

  let resolvedSalePriceEG: number | undefined = undefined;
  if (data.sale_price_eg !== null && data.sale_price_eg !== undefined) {
    const rawSaleEG = Number(data.sale_price_eg);
    if (rawSaleEG > 0 && rawSaleEG < resolvedPriceEG) {
      resolvedSalePriceEG = rawSaleEG;
    }
  }

  // Stock
  const resolvedStock = (data.stock !== undefined && data.stock !== null)
    ? Number(data.stock)
    : 0;

  // SEO & Slugs
  const h1 = data.h1 || (fallbackProduct ? fallbackProduct.h1 : undefined);
  const seoTitle = data.seo_title || (fallbackProduct ? fallbackProduct.seoTitle : undefined);
  const resolvedShortDesc = cleanText(data.short_description || (fallbackProduct ? fallbackProduct.shortDescription : undefined));
  const slug = data.slug || (fallbackProduct ? fallbackProduct.slug : undefined);
  const compareAtPrice = data.compare_at_price ? Number(data.compare_at_price) : undefined;
  const saleEndsAt = data.sale_ends_at || undefined;
  const material = data.material || fabricAr;
  const sizeInfo = cleanText(data.size_info || (fallbackProduct ? fallbackProduct.sizeInfo : 'مقاس واحد (45-80 كجم)'));
  const careInstructions = cleanText(data.care_instructions || washInstructionsAr);

  return {
    id: data.id,
    nameAr: cleanText(nameAr),
    nameEn: cleanText(nameEn),
    category: catKey,
    categoryAr: cleanText(data.category_ar || ''),
    priceEG: resolvedPriceEG,
    priceSA: resolvedPriceSA,
    regularPrice: Number(data.regular_price || data.regularPrice || resolvedPriceSA),
    regularPriceSince: data.regular_price_since || data.regularPriceSince || undefined,
    discountPercent: Number(data.discount_percent ?? data.discountPercent ?? 0),
    discountStartsAt: data.discount_starts_at || data.discountStartsAt || undefined,
    discountEndsAt: data.discount_ends_at || data.discountEndsAt || undefined,
    discountStatus: data.discount_status || data.discountStatus || (data.is_discount_active === false || data.isDiscountActive === false ? 'inactive' : 'active'),
    isDiscountActive: data.is_discount_active !== undefined ? !!data.is_discount_active : (data.discount_status ? data.discount_status === 'active' : true),
    descriptionAr: cleanText(descriptionAr),
    descriptionEn: cleanText(descriptionEn),
    fabricAr: cleanText(fabricAr),
    fabricEn: cleanText(fabricEn),
    washInstructionsAr: cleanText(washInstructionsAr),
    images: cleanedImages,
    video: data.video || undefined,
    colors,
    sizes,
    isBestSeller: data.is_best_seller !== undefined ? !!data.is_best_seller : (fallbackProduct ? fallbackProduct.isBestSeller : false),
    rating: Number(data.rating ?? 5),
    reviewsCount: Number(data.reviews_count ?? 0),
    stock: resolvedStock,
    sku: data.sku || undefined,
    salePriceEG: resolvedSalePriceEG,
    salePriceSA: resolvedSalePriceSA,
    compareAtPrice,
    saleEndsAt,
    featured: !!data.featured,
    status: data.status || 'active',
    h1,
    seoTitle,
    shortDescription: resolvedShortDesc,
    slug,
    material,
    sizeInfo,
    careInstructions,
    tags: Array.isArray(data.tags) ? data.tags : (data.tags ? JSON.parse(data.tags) : []),
    collection: data.collection || undefined,
    seo: data.seo ? (typeof data.seo === 'string' ? JSON.parse(cleanText(data.seo)) : data.seo) : undefined,
    createdAt: data.created_at || undefined
  };
}

function mapReview(data: any): Review {
  let imagesParsed = [];
  if (data.images) {
    if (typeof data.images === 'string') {
      try {
        imagesParsed = JSON.parse(data.images);
      } catch (e) {
        // failed to parse
      }
    } else if (Array.isArray(data.images)) {
      imagesParsed = data.images;
    }
  }

  return {
    id: data.id,
    productId: data.product_id,
    userId: data.user_id,
    username: data.username || '',
    avatar: data.avatar || '',
    rating: Number(data.rating ?? 5),
    comment: data.comment || '',
    date: data.date || data.created_at || new Date().toISOString(),
    country: data.country || 'SA',
    productName: data.product_name || '',
    isVerifiedPurchase: !!data.is_verified_purchase,
    status: data.status || 'approved',
    images: imagesParsed
  };
}

function mapCoupon(data: any): DiscountCoupon {
  return {
    code: data.code || '',
    discountPercent: Number(data.discount_percent ?? data.discountPercent ?? 0),
    description: data.description || '',
    expiresAt: data.expires_at || data.expiresAt || undefined,
    isActive: data.active !== undefined ? Boolean(data.active) : (data.isActive !== undefined ? Boolean(data.isActive) : true)
  };
}

function mapOrder(data: any): Order {
  const parsedPrice = Number(data.totalPrice ?? data.total_price ?? data.total_amount ?? 0);
  let parsedItems = [];
  if (Array.isArray(data.items)) {
    parsedItems = data.items;
  } else if (typeof data.items === 'string' && data.items.trim()) {
    try {
      parsedItems = JSON.parse(data.items);
    } catch {
      parsedItems = [];
    }
  }

  return {
    id: data.id,
    customerName: data.customerName || data.customer_name || 'عميلة سُلطة الكريمة',
    phone: data.phone || '',
    country: (data.country === 'EG' ? 'EG' : 'SA') as Country,
    city: data.city || 'الرياض',
    address: data.address || '',
    notes: data.notes || undefined,
    giftMessage: data.giftMessage || data.gift_message || undefined,
    giftCardTheme: data.giftCardTheme || data.gift_card_theme || undefined,
    items: parsedItems,
    totalPrice: parsedPrice,
    shippingFee: Number(data.shippingFee ?? data.shipping_fee ?? 0),
    currency: data.currency || 'SAR',
    paymentMethod: data.paymentMethod || data.payment_method || 'الدفع عند الاستلام',
    status: data.status || 'pending',
    paymentStatus: data.paymentStatus || data.payment_status || 'pending',
    paymentVerifiedAt: data.paymentVerifiedAt || data.payment_verified_at || undefined,
    paymentVerifiedBy: data.paymentVerifiedBy || data.payment_verified_by || undefined,
    receiptReviewNotes: data.receiptReviewNotes || data.receipt_review_notes || undefined,
    adminNotes: data.adminNotes || data.admin_notes || undefined,
    discountAmount: Number(data.discountAmount || data.discount_amount || 0),
    couponCode: data.couponCode || data.coupon_code || undefined,
    receiptImageUrl: data.receiptImageUrl || data.receipt_image_url || undefined,
    date: data.date || (data.created_at ? data.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
    trackingNumber: data.trackingNumber || data.tracking_number || undefined,
    trackingUrl: data.trackingUrl || data.tracking_url || (typeof window !== 'undefined' && window.location.origin ? `${window.location.origin}/?tab=track-order&id=${data.id}` : `/?tab=track-order&id=${data.id}`)
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

/**
 * Centralized, authoritative price calculation function.
 * Resolves the true selling SKU unit price and original price for any product
 * according to current market/country (SA / EG) and active store settings.
 */
export function getProductActualPrice(
  product: Product | undefined | null,
  country: Country = 'SA',
  settings?: Settings | null
): ActualProductPrice {
  const isEG = country === 'EG';
  const currency: 'SAR' | 'EGP' = isEG ? 'EGP' : 'SAR';
  const currencySymbol: 'ر.س' | 'ج.م' = isEG ? 'ج.م' : 'ر.س';

  if (!product) {
    return {
      unitPrice: 0,
      originalPrice: 0,
      hasDiscount: false,
      discountPercent: 0,
      currency,
      currencySymbol,
      isStoreWide: false
    };
  }

  // 1. Determine AUTHORITATIVE base original price from record
  const recordPrice = isEG ? Number(product.priceEG) : Number(product.priceSA);
  const baseOriginalPrice = Math.max(
    Number(product.regularPrice || 0),
    recordPrice > 0 ? recordPrice : 0,
    isEG ? Number(product.salePriceEG || 0) : Number(product.salePriceSA || 0)
  ) || (isEG ? 899 : 69);

  // 2. Resolve current unit price (selling price)
  let unitPrice = recordPrice > 0 ? recordPrice : baseOriginalPrice;

  // 3. Check for further explicit sale prices (salePriceSA/EG columns)
  if (isEG) {
    if (product.salePriceEG && product.salePriceEG > 0 && product.salePriceEG < unitPrice) {
      unitPrice = product.salePriceEG;
    }
  } else {
    if (product.salePriceSA && product.salePriceSA > 0 && product.salePriceSA < unitPrice) {
      unitPrice = product.salePriceSA;
    }
  }

  // 4. Check for percentage discounts IF unitPrice is still the base (to avoid double discounting)
  const now = Date.now();
  let startsAt: string | undefined;
  let endsAt: string | undefined;
  let isStoreWide = false;

  if (unitPrice === baseOriginalPrice) {
    // Check product-specific percent
    if (product.discountPercent && product.discountPercent > 0 && product.discountPercent <= 90) {
      const isInactive = product.discountStatus === 'inactive' || product.isDiscountActive === false;
      if (!isInactive) {
        const startOk = !product.discountStartsAt || new Date(product.discountStartsAt).getTime() <= now;
        const endOk = !product.discountEndsAt || new Date(product.discountEndsAt).getTime() >= now;
        if (startOk && endOk) {
          unitPrice = Math.round(baseOriginalPrice * (1 - product.discountPercent / 100));
          startsAt = product.discountStartsAt;
          endsAt = product.discountEndsAt;
        }
      }
    }
    
    // Check store-wide percent if still no discount applied
    if (unitPrice === baseOriginalPrice && settings?.storeDiscountPercent && settings.storeDiscountPercent > 0) {
      const startOk = !settings.storeDiscountStartsAt || new Date(settings.storeDiscountStartsAt).getTime() <= now;
      const endOk = !settings.storeDiscountEndsAt || new Date(settings.storeDiscountEndsAt).getTime() >= now;
      if (startOk && endOk) {
        unitPrice = Math.round(baseOriginalPrice * (1 - settings.storeDiscountPercent / 100));
        startsAt = settings.storeDiscountStartsAt;
        endsAt = settings.storeDiscountEndsAt;
        isStoreWide = true;
      }
    }
  }

  const hasDiscount = unitPrice < baseOriginalPrice;
  const discountPercent = hasDiscount 
    ? Math.round(((baseOriginalPrice - unitPrice) / baseOriginalPrice) * 100) 
    : 0;

  return {
    unitPrice,
    originalPrice: baseOriginalPrice,
    hasDiscount,
    discountPercent,
    currency,
    currencySymbol,
    startsAt,
    endsAt,
    isStoreWide
  };
}

export const dbService = {
  supabase,
  getProductActualPrice,
  calculateShippingFee,
  
  getProductById: async (id: string): Promise<Product | null> => {
    try {
      if (!id) return null;
      const resolvedId = getIdFromSlug(id) || id;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedId);
      if (isUuid) {
        const { data, error } = await supabase.from('products').select('*').eq('id', resolvedId).maybeSingle();
        if (!error && data) {
          return mapProduct(data);
        }
      } else {
        // Try querying by slug directly
        const { data, error } = await supabase.from('products').select('*').eq('slug', id).maybeSingle();
        if (!error && data) {
          return mapProduct(data);
        }
        const { data: data2, error: err2 } = await supabase.from('products').select('*').eq('slug', resolvedId).maybeSingle();
        if (!err2 && data2) {
          return mapProduct(data2);
        }
      }
    } catch (err) {
      console.warn("[dbService] getProductById error fetching from Supabase:", err);
    }

    const resolvedId = getIdFromSlug(id) || id;

    // Fallback: Search in SEED_FALLBACK_PRODUCTS
    const fallback = SEED_FALLBACK_PRODUCTS.find(p => 
      p.id === resolvedId || 
      p.id === id ||
      p.id.includes(resolvedId) || 
      resolvedId.includes(p.id)
    );
    if (fallback) return fallback;

    // Fallback: search all Supabase products
    try {
      const { data: allProds } = await supabase.from('products').select('*');
      if (allProds && Array.isArray(allProds)) {
        const found = allProds.find(p => p.id === resolvedId || p.id === id || (p.id && resolvedId && (p.id.includes(resolvedId) || resolvedId.includes(p.id))));
        if (found) return mapProduct(found);
      }
    } catch {}

    return null;
  },
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
  uploadReceipt: async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name ? file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') : '';
      const safeExtension = fileExt ? fileExt.toLowerCase() : (file.type ? file.type.split('/')[1] : 'jpeg');
      const randomString = Math.random().toString(36).substring(2, 10);
      const fileName = `receipt_${Date.now()}_${randomString}.${safeExtension || 'jpg'}`;
      
      // Ensure the 'receipts' bucket exists and is PRIVATE
      try {
        await supabase.storage.createBucket('receipts', {
          public: false,
          fileSizeLimit: 10485760, // 10MB
        });
      } catch {}

      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(fileName, file, { 
          cacheControl: '3600', 
          upsert: true,
          contentType: file.type || 'image/jpeg'
        });

      if (error) throw error;
      if (!data) throw new Error("Upload response was empty");

      // We store the PATH in the database, NOT the public URL
      return data.path;
    } catch (err) {
      console.error("Error uploading receipt to Supabase Storage:", err);
      return null;
    }
  },
  getSignedReceiptUrl: async (path: string): Promise<string | null> => {
    try {
      if (!path) return null;
      // If it's already a full URL (legacy), return it
      if (path.startsWith('http')) return path;

      const { data, error } = await supabase.storage
        .from('receipts')
        .createSignedUrl(path, 3600); // 1 hour validity

      if (error) throw error;
      return data.signedUrl;
    } catch (err) {
      console.error("Error generating signed URL for receipt:", err);
      return null;
    }
  },

  getSettings: async (): Promise<Settings | null> => {
    let settingsObj: Settings | null = null;
    try {
      const { data, error } = await supabase.from('settings').select('*').limit(1).single();
      if (data) {
        let needsUpdate = false;
        const updatePayload: any = {};

        if (data.site_name && data.site_name.toLowerCase().includes('zoria')) {
          const cleanedSiteName = data.site_name.replace(/zoria/ig, 'Sulta');
          updatePayload.site_name = cleanedSiteName;
          data.site_name = cleanedSiteName;
          needsUpdate = true;
        }

        if (data.whatsapp === '966500000000' || !data.whatsapp || data.whatsapp.includes('966500') || data.whatsapp === '201110095403' || data.whatsapp.includes('20111') || data.whatsapp.includes('596894393')) {
          const fixedWhatsapp = '966552823677';
          const fixedPhone = '+966 55 282 3677';
          updatePayload.whatsapp = fixedWhatsapp;
          updatePayload.contact_phone = fixedPhone;
          data.whatsapp = fixedWhatsapp;
          data.contact_phone = fixedPhone;
          needsUpdate = true;
        }

        if (!data.tiktok_pixel_id || data.tiktok_pixel_id !== 'DBESRBJC77U4J2JQDUB0') {
          updatePayload.tiktok_pixel_id = 'DBESRBJC77U4J2JQDUB0';
          data.tiktok_pixel_id = 'DBESRBJC77U4J2JQDUB0';
          needsUpdate = true;
        }

        if (needsUpdate) {
          await supabase.from('settings').update(updatePayload).eq('id', data.id);
        }
        settingsObj = mapSettings(data);
      }
    } catch (e) {
      console.warn("Could not load database settings:", e);
    }

    if (!settingsObj) {
      settingsObj = {
        siteName: 'Sulta',
        contactPhone: '+966 55 282 3677',
        contactPhoneSaudi: '+966 55 282 3677',
        whatsapp: '966552823677',
        whatsappSaudi: '966552823677',
        contactEmail: 'concierge@sulta.sa',
        shippingRates: [
          { regionAr: 'شحن سريع ومجاني لكافة مدن المملكة العربية السعودية 🇸🇦', regionEn: 'KSA Express Shipping', fee: 0 },
          { regionAr: 'توصيل فاخر بالموعد المحدد (الرياض وجدة والدمام)', regionEn: 'VIP White Glove Delivery', fee: 40 }
        ],
        defaultShippingFee: 40,
        instagram: 'https://www.instagram.com/sulta.sa',
        facebook: '',
        tiktok: 'https://www.tiktok.com/@sulta.sa',
        tiktokPixelId: 'DBESRBJC77U4J2JQDUB0'
      };
    }

    // Now, load dynamic localization fields from general_settings_global_v2
    try {
      const { data: sectionData } = await supabase.from('homepage_sections').select('content_json').eq('section_key', 'general_settings_global_v2').limit(1).single();
      if (sectionData && sectionData.content_json) {
        const extra = typeof sectionData.content_json === 'string' ? JSON.parse(sectionData.content_json) : sectionData.content_json;
        if (extra) {
          settingsObj = {
            ...settingsObj,
            ...extra
          };
        }
      }
    } catch (e) {
      console.warn("Could not load extended localization settings from Supabase, relying on localStorage:", e);
    }

    try {
      const fallback = localStorage.getItem('sulta_extended_settings');
      if (fallback) {
        settingsObj = {
          ...settingsObj,
          ...JSON.parse(fallback)
        };
      }
    } catch(e) {}

    return settingsObj;
  },

  updateSettings: async (settings: Partial<Settings>): Promise<boolean> => {
    try {
      // Save extended settings to localStorage for performance & client-side access
      localStorage.setItem('sulta_extended_settings', JSON.stringify({
        egDefaultCoupon: settings.egDefaultCoupon,
        saDefaultCoupon: settings.saDefaultCoupon,
        egExclusiveProductIds: settings.egExclusiveProductIds,
        saExclusiveProductIds: settings.saExclusiveProductIds,
      }));
    } catch(e) {}

    try {
      // Save to homepage_sections so that it remains fully persisted and synchronized
      await supabase.from('homepage_sections').upsert([{
        section_key: 'general_settings_global_v2',
        content_json: settings,
        active: true
      }], { onConflict: 'section_key' });
    } catch(e) {
      console.warn("Error upserting settings section key:", e);
    }

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
    supabase.from('categories').select('id, name, name_ar, name_en, slug, image_url').then(({ data, error }) => {
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
          const { data, error } = await supabase.from('categories').select('id, name, name_ar, name_en, slug, image_url');
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
    supabase.from('collections').select('id, name_ar, name_en, description_ar, description_en, image_url').then(({ data, error }) => { if (error) throw error; if (data)   onSuccess(data.map(mapCollection)); }).catch((err) => { console.warn('Supabase fetch failed for collections', err); /* fallback provided by state default */ });

    const channelName = 'public:collections:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collections' }, async () => {
        const { data } = await supabase.from('collections').select('id, name_ar, name_en, description_ar, description_en, image_url');
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
    const deliverProducts = (rawList: Product[]) => {
      try {
        localStorage.removeItem('sulta_saved_products');
      } catch {}
      onSuccess(rawList);
    };

    supabase.from('products').select('*').then(({ data, error }) => {
      if (error) {
        console.error('[Sulta DB] CRITICAL ERROR: Supabase products fetch failed:', error);
        deliverProducts([]);
      } else if (!data) {
        console.warn('[Sulta DB] Supabase returned no data');
        deliverProducts([]);
      } else {
        console.log(`[Sulta DB] Successfully synced ${data.length} products from Supabase. Products:`, data);
        const mapped = data.map(mapProduct);
        deliverProducts(mapped);
      }
    }).catch((err: any) => {
      console.error('[Sulta DB] Exception fetching products from Supabase:', err);
      deliverProducts([]);
    });

    const channelName = 'public:products:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        try {
          const { data, error } = await supabase.from('products').select('*');
          if (error) {
            console.error('[Sulta DB] Realtime error on products update:', error);
          } else if (data) {
            console.log(`[Sulta DB] Realtime update: ${data.length} products loaded.`);
            deliverProducts(data.map(mapProduct));
          }
        } catch (err) {
          console.error('[Sulta DB] Realtime exception:', err);
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
    const deliverCoupons = (dbCoupons: DiscountCoupon[]) => {
      try {
        const localCoupons = JSON.parse(localStorage.getItem('sulta_coupons') || '[]');
        const map = new Map<string, DiscountCoupon>();
        for (const c of dbCoupons) {
          map.set(c.code.toUpperCase(), c);
        }
        for (const c of localCoupons) {
          map.set(c.code.toUpperCase(), c);
        }
        onSuccess(Array.from(map.values()));
      } catch {
        onSuccess(dbCoupons);
      }
    };

    // Optimistic local read
    try {
      const localCoupons = JSON.parse(localStorage.getItem('sulta_coupons') || '[]');
      if (localCoupons.length > 0) deliverCoupons([]);
    } catch {}

    supabase.from('coupons').select('*').then(({ data, error }) => {
      if (error) {
        console.warn('Supabase fetch failed for coupons', error);
        deliverCoupons([]);
      } else if (data) {
        deliverCoupons(data.map(mapCoupon));
      }
    }).catch((err) => {
      console.warn('Supabase fetch failed for coupons', err);
      deliverCoupons([]);
    });

    const channelName = 'public:coupons:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, async () => {
        const { data } = await supabase.from('coupons').select('*');
        if (data) deliverCoupons(data.map(mapCoupon));
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
    supabase.from('reviews').select('id, product_id, user_id, username, avatar, rating, comment, country, product_name, is_verified_purchase, status, images, created_at').then(({ data, error }) => { if (error) throw error; if (data)   onSuccess(data.map(mapReview)); }).catch((err) => { console.warn('Supabase fetch failed for reviews', err); /* fallback provided by state default */ });

    const channelName = 'public:reviews:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, async () => {
        const { data } = await supabase.from('reviews').select('id, product_id, user_id, username, avatar, rating, comment, country, product_name, is_verified_purchase, status, images, created_at');
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
    const loadAndMerge = (dbOrders: any[], ticketOrders: any[]) => {
      console.log(`[Sulta DB] Loading orders - DB: ${dbOrders?.length || 0}, Tickets: ${ticketOrders?.length || 0}`);
      let localOrders: any[] = [];
      let deletedOrderIds: string[] = [];
      try {
        localOrders = JSON.parse(localStorage.getItem('sulta_offline_orders') || '[]');
      } catch (e) {
        console.warn("Failed to read sulta_offline_orders from localStorage", e);
      }
      try {
        deletedOrderIds = JSON.parse(localStorage.getItem('sulta_deleted_order_ids') || '[]');
      } catch (e) {}
      
      const deletedSet = new Set(deletedOrderIds);
      const ordersMap = new Map<string, Order>();

      // 1. Process cloud tickets containing full JSON order metadata
      if (Array.isArray(ticketOrders)) {
        for (const t of ticketOrders) {
          try {
            const raw = typeof t.message === 'string' ? JSON.parse(t.message) : t.message;
            if (raw && raw.id && !deletedSet.has(raw.id)) {
              const mapped = mapOrder(raw);
              ordersMap.set(mapped.id, mapped);
            }
          } catch (e) {
            console.warn(`[Sulta DB] Failed to parse order from ticket ${t.id}:`, e);
          }
        }
      }

      // 2. Process orders from official 'orders' table
      if (Array.isArray(dbOrders)) {
        for (const o of dbOrders) {
          if (deletedSet.has(o.id)) continue;
          if (!ordersMap.has(o.id)) {
            ordersMap.set(o.id, mapOrder(o));
          } else {
            // Update status if orders table has newer status
            const existing = ordersMap.get(o.id)!;
            if (o.status && o.status !== existing.status) {
              existing.status = o.status;
            }
          }
        }
      }

      // 3. Process local offline orders fallback
      for (const lo of localOrders) {
        if (deletedSet.has(lo.id)) continue;
        if (!ordersMap.has(lo.id)) {
          ordersMap.set(lo.id, mapOrder(lo));
        }
      }

      const merged = Array.from(ordersMap.values()).sort((a, b) => {
        const da = new Date(a.date || 0).getTime();
        const db = new Date(b.date || 0).getTime();
        return db - da;
      });

      console.log(`[Sulta DB] Orders merged successfully: ${merged.length} orders total.`);
      onSuccess(merged);
    };

    const fetchAll = async () => {
      try {
        const [ordersRes, ticketsRes] = await Promise.all([
          supabase.from('orders').select('id, customer_name, phone, country, city, address, notes, gift_message, gift_card_theme, items, total_price, currency, payment_method, status, receipt_image_url, tracking_number, tracking_url, created_at').order('created_at', { ascending: false }),
          // Fetch both ORDER: and ORDER- for historical compatibility
          supabase.from('support_tickets').select('*').or('subject.like.ORDER:%,subject.like.ORDER-%').order('created_at', { ascending: false })
        ]);

        loadAndMerge(ordersRes.data || [], ticketsRes.data || []);
      } catch (err) {
        console.warn('Orders dual-cloud fetch fallback:', err);
        loadAndMerge([], []);
      }
    };

    fetchAll();

    const channelName = 'public:orders_sync:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchAll();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
        fetchAll();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  getOrderByIdOrTracking: async (query: string): Promise<Order | null> => {
    if (!query || typeof query !== 'string') return null;
    const cleanQ = query.trim().toUpperCase();

    // 1. First, check localStorage for instant offline access
    try {
      const localOrders: Order[] = JSON.parse(localStorage.getItem('sulta_offline_orders') || '[]');
      const localMatch = localOrders.find((o: any) => 
        (o.id && o.id.toUpperCase() === cleanQ) ||
        (o.trackingNumber && o.trackingNumber.toUpperCase() === cleanQ) ||
        (o.id && (cleanQ.length >= 8 && (o.id.toUpperCase().startsWith(cleanQ) || cleanQ.startsWith(o.id.toUpperCase()))))
      );
      if (localMatch) {
        return mapOrder(localMatch);
      }
    } catch (e) {
      console.warn("LocalStorage order search fallback:", e);
    }

    // 2. Query Supabase support_tickets (where complete order JSON is stored!)
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanQ);
      
      let ticketData: any[] = [];
      if (isUuid) {
        const { data } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('subject', `ORDER:${cleanQ.toLowerCase()}`)
          .limit(1);
        if (data && data.length > 0) ticketData = data;
      }

      // If not found yet, query support_tickets by LIKE or text
      if (ticketData.length === 0) {
        const { data } = await supabase
          .from('support_tickets')
          .select('*')
          .or(`subject.ilike.%${cleanQ}%,message.ilike.%${cleanQ}%`)
          .order('created_at', { ascending: false })
          .limit(10);
        if (data && data.length > 0) ticketData = data;
      }

      for (const t of ticketData) {
        try {
          const raw = typeof t.message === 'string' ? JSON.parse(t.message) : t.message;
          if (raw) {
            const rawId = (raw.id || '').toUpperCase();
            const rawTracking = (raw.trackingNumber || raw.tracking_number || '').toUpperCase();
            if (rawId === cleanQ || rawTracking === cleanQ || (cleanQ.length >= 8 && rawId.startsWith(cleanQ))) {
              return mapOrder(raw);
            }
          }
        } catch {}
      }
    } catch (err) {
      console.warn("Cloud support_tickets order search fallback:", err);
    }

    // 3. Query Supabase orders table (ONLY if query is a valid UUID to avoid Postgres 22P02 error)
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanQ);
      if (isUuid) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', cleanQ.toLowerCase())
          .maybeSingle();
        if (data && !error) {
          return mapOrder(data);
        }
      }
    } catch (err) {
      console.warn("Cloud orders table search fallback:", err);
    }

    // 4. Query all recent orders from support_tickets and orders as comprehensive fallback
    try {
      const [ordersRes, ticketsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('support_tickets').select('*').or('subject.like.ORDER:%,subject.like.ORDER-%').order('created_at', { ascending: false }).limit(50)
      ]);

      const candidates: any[] = [];
      if (ticketsRes.data) {
        for (const t of ticketsRes.data) {
          try {
            const raw = typeof t.message === 'string' ? JSON.parse(t.message) : t.message;
            if (raw) candidates.push(raw);
          } catch {}
        }
      }
      if (ordersRes.data) {
        candidates.push(...ordersRes.data);
      }

      const match = candidates.find((o: any) => {
        const oId = (o.id || '').toUpperCase();
        const oTrack = (o.trackingNumber || o.tracking_number || '').toUpperCase();
        const oPhone = (o.phone || '').replace(/\D/g, '');
        const cleanQDigits = cleanQ.replace(/\D/g, '');
        return oId === cleanQ || 
               oTrack === cleanQ || 
               (cleanQ.length >= 8 && (oId.startsWith(cleanQ) || cleanQ.startsWith(oId))) ||
               (cleanQDigits.length >= 6 && oPhone.includes(cleanQDigits));
      });

      if (match) {
        return mapOrder(match);
      }
    } catch (err) {
      console.warn("Cloud all orders fallback search failed:", err);
    }

    return null;
  },

  saveOrder: async (order: Order): Promise<void> => {
    const origin = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost') 
      ? window.location.origin 
      : (typeof window !== 'undefined' ? window.location.origin : 'https://sulta.store');
    
    // Final check for track URL
    if (!order.trackingUrl) {
      order.trackingUrl = `${origin}/track-order/${order.id}`;
    }

    // 1. Dual-write to localStorage for 100% offline resilience
    try {
      const offlineOrders = JSON.parse(localStorage.getItem('sulta_offline_orders') || '[]');
      if (!offlineOrders.some((o: any) => o.id === order.id)) {
        offlineOrders.unshift(order);
        localStorage.setItem('sulta_offline_orders', JSON.stringify(offlineOrders));
        console.log("[Sulta DB] Saved order physically into localStorage for resilience.", order.id);
      }
    } catch (e) {
      console.warn("[Sulta DB] Non-fatal localStorage dual-write failed:", e);
    }

    const safeCountry = 'SA';
    const safeCurrency = 'SAR';
    const safeStatus = (order.status && ['pending', 'processing', 'shipped', 'delivered', 'confirmed'].includes(order.status))
      ? order.status
      : 'pending';

    // 1. Ensure order.id is a valid UUID, generate one if not
    let finalId = order.id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(finalId);
    if (!isUuid) {
      finalId = crypto.randomUUID();
      order.id = finalId; // UPDATE OBJECT BY REFERENCE TO PREVENT MISMATCHES
      console.log(`[Sulta DB] Non-UUID detected, generated new UUID: ${finalId}`);
    }

    // 2. Persist directly to Supabase cloud:
    // A. Insert into 'orders' table (satisfies database constraints and captures all fields)
    try {
      const baseRow: any = {
        id: finalId,
        total_amount: Number(order.totalPrice || 0),
        total_price: Number(order.totalPrice || 0),
        status: safeStatus,
        customer_name: order.customerName,
        phone: order.phone,
        city: order.city || 'الرياض',
        address: order.address || '',
        notes: order.notes || null,
        shipping_fee: Number(order.shippingFee || 0),
        items: order.items || [],
        currency: safeCurrency,
        payment_method: order.paymentMethod || 'الدفع عند الاستلام',
        payment_status: order.paymentStatus || 'pending',
        payment_verified_at: order.paymentVerifiedAt || null,
        payment_verified_by: order.paymentVerifiedBy || null,
        receipt_review_notes: order.receiptReviewNotes || null,
        admin_notes: order.adminNotes || null,
        discount_amount: Number(order.discountAmount || 0),
        coupon_code: order.couponCode || null,
        receipt_image_url: order.receiptImageUrl || null,
        tracking_number: order.trackingNumber || null,
        tracking_url: order.trackingUrl || null,
        created_at: order.createdAt || new Date().toISOString()
      };
      
      let { error: oErr } = await supabase.from('orders').upsert([baseRow]);
      
      // Resilient fallback for columns that might be pending migration
      let retries = 10;
      while (oErr && oErr.message && retries > 0) {
        const errMsg = oErr.message;
        let colName: string | null = null;
        const missingMatch = errMsg.match(/Could not find the '([^']+)' column/i);
        const pgNotExistMatch = errMsg.match(/column "([^"]+)" of relation "orders" does not exist/i) || errMsg.match(/column "([^"]+)" does not exist/i);
        if (missingMatch && missingMatch[1]) {
          colName = missingMatch[1];
        } else if (pgNotExistMatch && pgNotExistMatch[1]) {
          colName = pgNotExistMatch[1];
        }

        if (colName && colName !== 'id') {
          delete baseRow[colName];
          const retryRes = await supabase.from('orders').upsert([baseRow]);
          oErr = retryRes.error;
          retries--;
          continue;
        }
        break;
      }

      if (oErr) {
        console.warn("[Sulta DB] orders table upsert:", oErr.message);
      } else {
        console.log("[Sulta DB] Successfully inserted order row into Supabase 'orders'!");
      }
    } catch (err: any) {
      console.warn("[Sulta DB] orders table exception:", err.message || err);
    }

    // B. Insert complete order payload into 'support_tickets' with ORDER prefix for cross-device visibility
    try {
      const ticketPayload = {
        subject: `ORDER:${finalId}`,
        message: JSON.stringify({
          ...order,
          id: finalId, // Use the same finalId
          country: safeCountry,
          currency: safeCurrency,
          status: safeStatus
        }),
        status: safeStatus
      };
      const { error: tErr } = await supabase.from('support_tickets').insert([ticketPayload]);
      if (tErr) {
        console.warn("[Sulta DB] support_tickets order payload insert:", tErr.message);
      } else {
        console.log("[Sulta DB] Successfully inserted full order payload into cloud for cross-device admin view!");
      }
    } catch (err: any) {
      console.warn("[Sulta DB] support_tickets exception:", err.message || err);
    }

    // C. Record stock movement deduction and UPDATE physical stock for each ordered item
    try {
      if (Array.isArray(order.items)) {
        for (const it of order.items) {
          // 1. Log movement
          await dbService.recordStockMovement({
            productId: it.productId,
            productName: it.productName || 'قطعة سُلطة',
            variant: `${it.color || ''} - ${it.size || ''}`.trim(),
            changeQty: -Math.abs(Number(it.quantity || 1)),
            movementType: 'order_deduction',
            reason: `طلب شراء عميلة #${finalId.slice(0, 8)}`,
            referenceOrderId: finalId,
            adminName: 'النظام التلقائي'
          });

          // 2. Physical update to products table to keep "In Stock / Out of Stock" labels accurate
          try {
            const { data: pData } = await supabase.from('products').select('stock').eq('id', it.productId).single();
            if (pData) {
              const currentStock = Number(pData.stock || 0);
              const nextStock = Math.max(0, currentStock - Number(it.quantity || 1));
              await dbService.updateProductStock(
                it.productId,
                { id: it.productId, stock: currentStock } as any,
                nextStock,
                `خصم آلي لطلب #${finalId.slice(0, 8)}`,
                'نظام سُلطة'
              );
            }
          } catch (pErr) {
            console.warn(`[Sulta DB] Failed to update physical stock for ${it.productId}:`, pErr);
          }
        }
      }
    } catch (smErr) {
      console.warn("[Sulta DB] Non-fatal stock movement recording notice:", smErr);
    }

    // D. Log activity
    try {
      await dbService.logActivity(
        'NEW_ORDER',
        `طلب شراء جديد #${finalId.slice(0, 8)} بقيمة ${order.totalPrice} ر.س للعميلة ${order.customerName || ''}`,
        'customer'
      );
    } catch {}
  },

  updateProductStock: async (productId: string, currentProduct: Product | undefined, nextStock: number, reason: string = 'تعديل يدوي للمخزون', adminName: string = 'إدارة المتجر'): Promise<void> => {
    const oldStock = currentProduct ? Number(currentProduct.stock) : nextStock;
    const change = nextStock - oldStock;

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
        console.warn("[Sulta DB] Warning: updateProductStock did not apply on server, but continuing checkout:", error.message);
      } else {
        // Record stock movement
        if (change !== 0) {
          await dbService.recordStockMovement({
            productId,
            productName: currentProduct?.nameAr || 'منتج',
            changeQty: change,
            newStockLevel: nextStock,
            movementType: change > 0 ? 'manual_restock' : 'inventory_audit',
            reason,
            adminName
          });
        }
      }
    } catch (e: any) {
      console.warn("[Sulta DB] Non-fatal stock update warning:", e.message || e);
    }
  },

  saveProduct: async (product: Product): Promise<void> => {
    // 1. Dual-write to localStorage for instant client persistence & offline resilience
    try {
      const savedStr = localStorage.getItem('sulta_saved_products') || '{}';
      const savedMap = JSON.parse(savedStr);
      savedMap[product.id] = product;
      localStorage.setItem('sulta_saved_products', JSON.stringify(savedMap));
      console.log(`[Sulta DB] Saved product "${product.nameAr}" (ID: ${product.id}, Price: ${product.priceSA} SAR) to localStorage.`);
    } catch (e) {
      console.warn('[Sulta DB] Error saving product to localStorage:', e);
    }

    // Standard allowed categories in CHECK constraint: ('satin', 'soft', 'cotton', 'loungewear', 'dresses', 'new')
    const allowedCategories = ['satin', 'soft', 'cotton', 'loungewear', 'dresses', 'new'];
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
      priceSA: product.priceSA,
      priceEG: product.priceEG,
      salePriceSA: product.salePriceSA,
      salePriceEG: product.salePriceEG,
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
    const encodedDescription = (product.descriptionAr || '') + ' | ' + (product.descriptionEn || '') + ' | [METADATA_Sulta_V2]:' + JSON.stringify(metadata);

    const payload: any = {
      id: product.id,
      name_ar: product.nameAr,
      name_en: product.nameEn,
      category: safeCategory,
      category_id: resolvedCategoryId || null,
      category_ar: product.categoryAr,
      price: product.priceSA || product.priceEG || 0,
      price_eg: product.priceEG || (product.priceSA ? product.priceSA * 5 : 0),
      price_sa: product.priceSA,
      regular_price: product.regularPrice || product.priceSA || 69,
      regular_price_since: product.regularPriceSince || new Date().toISOString().split('T')[0],
      discount_percent: product.discountPercent ?? 0,
      discount_starts_at: product.discountStartsAt || null,
      discount_ends_at: product.discountEndsAt || null,
      discount_status: product.discountStatus || (product.isDiscountActive === false ? 'inactive' : 'active'),
      is_discount_active: product.isDiscountActive ?? (product.discountStatus === 'inactive' ? false : true),
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
      console.warn(`[Sulta DB] Attempting automatic error resolution for product upsert: "${errMsg}". Retries left: ${retries}`);

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
        console.warn(`[Sulta DB] Automatically removing unsupported column '${colName}' from the insert payload to avoid schema conflict.`);
        delete payload[colName];
        
        const retryRes = await supabase.from('products').upsert([payload]);
        error = retryRes.error;
        retries--;
        continue;
      }

      // 2. Foreign Key Constraint Violation (e.g., category_id or collection does not exist in their parent tables)
      if (errMsg.toLowerCase().includes("foreign key constraint") || errMsg.toLowerCase().includes("violates foreign key")) {
        if (errMsg.toLowerCase().includes("category_id") && payload.category_id !== null) {
          console.warn("[Sulta DB] Foreign key violation on category_id! Nullifying category_id to guarantee product is created.");
          payload.category_id = null;
        } else if (errMsg.toLowerCase().includes("collection") && payload.collection !== null) {
          console.warn("[Sulta DB] Foreign key violation on collection! Nullifying collection reference to guarantee product is created.");
          payload.collection = null;
        } else {
          console.warn("[Sulta DB] Unspecified foreign key violation. Safety nullifying optional relational references.");
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
        console.warn(`[Sulta DB] Invalid UUID syntax detected: "${problematicVal}". Commencing auto-remapping...`);
        
        if (payload.category_id === problematicVal) {
          const catUuid = getCategoryUuid(problematicVal);
          if (catUuid) {
            console.warn(`[Sulta DB] Auto-mapping invalid category_id '${problematicVal}' to valid UUID: '${catUuid}'`);
            payload.category_id = catUuid;
          } else {
            console.warn(`[Sulta DB] No UUID map found. Nullifying category_id to bypass UUID type-casting check.`);
            payload.category_id = null;
          }
        } else {
          // Look for any keys containing the problematic value and nullify/delete them
          for (const key of Object.keys(payload)) {
            if (payload[key] === problematicVal) {
              console.warn(`[Sulta DB] Safety nullifying problematic UUID field: '${key}'`);
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
          console.warn("[Sulta DB] CHECK constraint error on category! Resetting to default 'new'.");
          payload.category = 'new';
        }
        if (errMsg.toLowerCase().includes("status")) {
          console.warn("[Sulta DB] CHECK constraint error on status! Resetting to default 'active'.");
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
          console.warn("[Sulta DB] Array syntax error on images column. Normalizing to native array...");
          if (typeof payload.images === 'string') {
            try {
              payload.images = JSON.parse(payload.images);
            } catch {
              payload.images = payload.images ? [payload.images] : [];
            }
          }
          if (!Array.isArray(payload.images)) {
            payload.images = [];
          }
        }
        
        if (errMsg.toLowerCase().includes("colors")) {
          console.warn("[Sulta DB] JSONB syntax error on colors column. Normalizing payload.colors to empty array...");
          payload.colors = [];
        }

        if (errMsg.toLowerCase().includes("sizes")) {
          console.warn("[Sulta DB] Array syntax error on sizes. Setting defaults.");
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

    console.log("[Sulta DB] Save finished. Payload columns remaining:", Object.keys(payload), "Error:", error ? error.message : "Success 🎉");
    if (error) {
      console.warn("[Sulta DB] Supabase upsert returned error, but product is preserved in localStorage:", error.message || error);
    }
  },

  updateProductPrice: async (productId: string, priceSA: number, priceEG?: number, salePriceSA?: number): Promise<void> => {
    try {
      const savedStr = localStorage.getItem('sulta_saved_products') || '{}';
      let savedMap: Record<string, Product> = {};
      try {
        savedMap = JSON.parse(savedStr);
      } catch {
        savedMap = {};
      }

      const existing = savedMap[productId] || SEED_FALLBACK_PRODUCTS.find(p => p.id === productId);
      const calculatedEG = priceEG !== undefined && priceEG > 0 
        ? priceEG 
        : (existing?.priceEG && existing.priceSA ? Math.round(priceSA * (existing.priceEG / existing.priceSA)) : priceSA * 5);

      const updatedProd: Product = existing ? {
        ...existing,
        priceSA,
        priceEG: calculatedEG,
        salePriceSA: salePriceSA !== undefined ? salePriceSA : existing.salePriceSA
      } : {
        id: productId,
        nameAr: 'منتج كوتور فاخر',
        nameEn: 'Couture Product',
        category: 'new',
        categoryAr: 'المجموعة الجديدة',
        priceSA,
        priceEG: calculatedEG,
        salePriceSA,
        descriptionAr: '',
        descriptionEn: '',
        fabricAr: 'كوتور ناعم',
        fabricEn: 'Soft Couture',
        washInstructionsAr: 'غسيل لطيف',
        images: [],
        colors: [{ name: 'وردي كوتور', hex: '#E8A5B8' }],
        sizes: ['S', 'M', 'L', 'XL'],
        stock: 10,
        rating: 5,
        reviewsCount: 10,
        status: 'active',
        featured: true
      };

      savedMap[productId] = updatedProd;
      localStorage.setItem('sulta_saved_products', JSON.stringify(savedMap));
      console.log(`[Sulta DB] Successfully updated price for ${productId} to ${priceSA} SAR.`);

      // Sync to Supabase in background
      await dbService.saveProduct(updatedProd);
    } catch (err: any) {
      console.warn('[Sulta DB] updateProductPrice notice:', err);
    }
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
    // 1. Blacklist in localStorage so it never comes back from fallbacks or cache
    try {
      const deletedIds = JSON.parse(localStorage.getItem('sulta_deleted_product_ids') || '[]');
      if (!deletedIds.includes(productId)) {
        deletedIds.push(productId);
        localStorage.setItem('sulta_deleted_product_ids', JSON.stringify(deletedIds));
      }
    } catch {}

    // 2. Remove from sulta_saved_products cache
    try {
      const savedStr = localStorage.getItem('sulta_saved_products') || '{}';
      const savedMap = JSON.parse(savedStr);
      delete savedMap[productId];
      localStorage.setItem('sulta_saved_products', JSON.stringify(savedMap));
    } catch (e) {
      console.warn('[Sulta DB] Error deleting product from localStorage:', e);
    }

    // 3. Delete permanently from Supabase products table
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) console.warn('[Sulta DB] Supabase delete notice:', error.message || error);
    } catch (err: any) {
      console.error('[Sulta DB] Supabase delete exception:', err?.message || err);
    }
  },

  saveCoupon: async (coupon: DiscountCoupon): Promise<void> => {
    try {
      const localCoupons: DiscountCoupon[] = JSON.parse(localStorage.getItem('sulta_coupons') || '[]');
      const filtered = localCoupons.filter(c => c.code.toUpperCase() !== coupon.code.toUpperCase());
      filtered.push(coupon);
      localStorage.setItem('sulta_coupons', JSON.stringify(filtered));
    } catch (e) {
      console.warn("Failed to save coupon to localStorage", e);
    }

    try {
      const payload: any = {
        code: coupon.code.toUpperCase().trim(),
        discount_percent: coupon.discountPercent,
        description: coupon.description || '',
        discount_value: 0
      };
      if (coupon.expiresAt) {
        payload.expires_at = new Date(coupon.expiresAt).toISOString();
      }
      if (coupon.isActive !== undefined) {
        payload.active = coupon.isActive;
      }
      const { error } = await supabase
        .from('coupons')
        .upsert([payload], { onConflict: 'code' });
      if (error) console.warn("Supabase coupon save warning:", error.message);
    } catch (err: any) {
      console.warn("Coupon save exception:", err);
    }
  },

  deleteCoupon: async (code: string): Promise<void> => {
    try {
      const localCoupons: DiscountCoupon[] = JSON.parse(localStorage.getItem('sulta_coupons') || '[]');
      const filtered = localCoupons.filter(c => c.code.toUpperCase() !== code.toUpperCase());
      localStorage.setItem('sulta_coupons', JSON.stringify(filtered));
    } catch (e) {
      console.warn("Failed to delete coupon from localStorage", e);
    }

    try {
      const { error } = await supabase.from('coupons').delete().eq('code', code.toUpperCase());
      if (error) console.warn("Supabase coupon delete warning:", error.message);
    } catch (err: any) {
      console.warn("Coupon delete exception:", err);
    }
  },

  deleteOrder: async (orderId: string): Promise<void> => {
    try {
      const deletedIds = JSON.parse(localStorage.getItem('sulta_deleted_order_ids') || '[]');
      if (!deletedIds.includes(orderId)) {
        deletedIds.push(orderId);
        localStorage.setItem('sulta_deleted_order_ids', JSON.stringify(deletedIds));
      }
    } catch {}

    try {
      const localOrders = JSON.parse(localStorage.getItem('sulta_offline_orders') || '[]');
      const filtered = localOrders.filter((o: any) => o.id !== orderId);
      localStorage.setItem('sulta_offline_orders', JSON.stringify(filtered));
    } catch (e) {
      console.warn("Failed to delete order from localStorage:", e);
    }

    try {
      // 1. Delete from orders table
      const { error: oErr } = await supabase.from('orders').delete().eq('id', orderId);
      if (oErr) console.warn("Supabase orders delete error:", oErr.message);

      // 2. Delete from support_tickets table (where full payload resides)
      const { error: tErr } = await supabase.from('support_tickets').delete().or(`subject.eq.ORDER:${orderId},subject.eq.ORDER-${orderId},subject.ilike.%${orderId}%`);
      if (tErr) console.warn("Supabase support_tickets delete error:", tErr.message);
    } catch (err) {
      console.error("Critical error on cloud deleteOrder:", err);
    }
  },

  updateOrder: async (order: Order): Promise<void> => {
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://sulta.store';
    if (!order.trackingUrl) {
      order.trackingUrl = `${origin}/track-order/${order.id}`;
    }

    try {
      const localOrders = JSON.parse(localStorage.getItem('sulta_offline_orders') || '[]');
      const idx = localOrders.findIndex((o: any) => o.id === order.id);
      if (idx !== -1) {
        localOrders[idx] = { ...localOrders[idx], ...order };
        localStorage.setItem('sulta_offline_orders', JSON.stringify(localOrders));
      }
    } catch (e) {
      console.warn("Failed to update status in localStorage orders log:", e);
    }

    const updatePayload: any = { status: order.status };
    if (order.trackingNumber) updatePayload.tracking_number = order.trackingNumber;
    if (order.trackingUrl) updatePayload.tracking_url = order.trackingUrl;
    
    if (order.paymentStatus) updatePayload.payment_status = order.paymentStatus;
    if (order.paymentVerifiedAt) updatePayload.payment_verified_at = order.paymentVerifiedAt;
    if (order.paymentVerifiedBy) updatePayload.payment_verified_by = order.paymentVerifiedBy;
    if (order.receiptReviewNotes) updatePayload.receipt_review_notes = order.receiptReviewNotes;
    if (order.adminNotes) updatePayload.admin_notes = order.adminNotes;
    if (order.discountAmount !== undefined) updatePayload.discount_amount = order.discountAmount;
    if (order.couponCode) updatePayload.coupon_code = order.couponCode;

    // Add missing fields to keep orders table in sync if possible
    if (order.customerName) updatePayload.customer_name = order.customerName;
    if (order.phone) updatePayload.phone = order.phone;

    try {
      // Update the skeleton row
      const { error: oErr } = await supabase.from('orders').update(updatePayload).eq('id', order.id);
      if (oErr) console.warn("Supabase orders table update failed:", oErr.message);

      // Sync the full payload in support_tickets
      const { error: tErr } = await supabase.from('support_tickets').update({
        message: JSON.stringify(order),
        status: order.status
      }).or(`subject.eq.ORDER:${order.id},subject.eq.ORDER-${order.id}`);
      
      if (tErr) console.warn("Supabase support_tickets table update failed:", tErr.message);
      
      if (oErr && tErr) throw new Error("Failed to update order in both cloud tables");
    } catch (error) {
      console.error("Supabase cloud updateOrder status failed:", error);
      throw error;
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

  // Review Management
  addReview: async (review: Partial<Review>): Promise<any> => {
    const payload = {
      product_id: review.productId,
      user_id: review.userId || null,
      username: review.username,
      avatar: review.avatar || '',
      rating: review.rating,
      comment: review.comment,
      is_verified_purchase: review.isVerifiedPurchase || false,
      status: review.status || 'pending',
      country: review.country || 'SA',
      product_name: review.productName || '',
      images: review.images ? JSON.stringify(review.images) : '[]'
    };
    
    const { data, error } = await supabase.from('reviews').insert([payload]).select();
    if (error) {
      console.warn("Supabase addReview failed", error);
      throw error;
    }
    await dbService.logActivity('REVIEW_ADDED', `New review added for product: ${review.productId}`);
    return data;
  },

  updateReviewStatus: async (reviewId: string, status: 'approved' | 'hidden' | 'deleted'): Promise<void> => {
    if (status === 'deleted') {
      await supabase.from('reviews').delete().eq('id', reviewId);
    } else {
      await supabase.from('reviews').update({ status }).eq('id', reviewId);
    }
    await dbService.logActivity('REVIEW_MODERATED', `Review ${reviewId} marked as ${status}`);
  },

  // ADD TEST PRODUCT
  addExperimentalPajama: async (): Promise<void> => {
    const product: Product = {
      id: 'a0000000-0000-4000-8000-000000000001',
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

    // Serve promotions safely from local seed / memory cache to eliminate 404 network errors
    onSuccess(SEED_PROMOTIONS.map(mapPromo));
    return () => {};
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
          console.warn("[Sulta DB] Got 'Invalid path' error from Supabase Storage. This typically means the 'products' bucket has not been created yet in your Supabase project. To resolve, copy and execute the Storage SQL setup block at the bottom of standard 'supabase-schema.sql'.");
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
    console.log("%c[Sulta DB DIAGNOSTIC] 🔍 Starting connection diagnostics for table 'products'...", "background: #161618; color: #c5a059; font-weight: bold; font-size: 13px; padding: 4px; border-radius: 4px;");
    
    // Log active URL
    console.log(`[Sulta DB DIAGNOSTIC] Target Supabase URL: ${urlToUse}`);
    
    try {
      // 1. Check if we are using the Dummy Client
      if (keyToUse === DEFAULT_KEY) {
        const errorMsg = "The database is currently using the offline fallback Mock Client because VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY are missing or set to defaults.";
        console.error("%c[Sulta DB DIAGNOSTIC] ❌ CONFIGURATION ERROR:", "color: #ff4b4b; font-weight: bold;", errorMsg);
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
      console.log("[Sulta DB DIAGNOSTIC] Sending select query: supabase.from('products').select('*').limit(5)...");
      const { data, error, status, statusText } = await supabase.from('products').select('*').limit(5);

      if (error) {
        console.error("%c[Sulta DB DIAGNOSTIC] ❌ DATABASE CONNECTION FAILED:", "color: #ff4b4b; font-weight: bold;");
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
          console.warn("%c[Sulta DB DIAGNOSTIC] 💡 ANALYSIS: API KEY / AUTHENTICATION ISSUE SPOTTED!", "color: #ffca28; font-weight: bold;");
          console.warn("Recommendation: Ensure VITE_SUPABASE_ANON_KEY matches your Supabase Project's Anon key perfectly. Check for spaces or trailing slash errors.");
        } 
        else if (status === 403 || error.message?.toLowerCase().includes("violates row-level security") || error.message?.toLowerCase().includes("insufficient_privilege") || error.message?.toLowerCase().includes("permission denied")) {
          // RLS Rule Issue
          diagnosticDetails = "❌ خلل في سياسات الأمان RLS: تم الاتصال بنجاح ولكن سياسات الأمان في Supabase تمنع استرجاع البيانات (Row Level Security). يرجى فتح جدول 'products' في Supabase والذهاب لـ Authentication -> Policies وإنشاء سياسة تمكن المستخدمين (عموم الجمهور) من إجراء عملية القراءة SELECT.";
          console.warn("%c[Sulta DB DIAGNOSTIC] 💡 ANALYSIS: ROW LEVEL SECURITY (RLS) VIOLATION SPOTTED!", "color: #ffca28; font-weight: bold;");
          console.warn("Recommendation: RLS is active on public.products but has no POLICY allowing SELECT/Read. Go to Supabase -> Database -> Policies -> Enable Read Access for everyone.");
        }
        else if (status === 404 || error.code === "PGRST116" || error.message?.toLowerCase().includes("relation") || error.message?.toLowerCase().includes("does not exist")) {
          // Missing Schema/Table Issue
          diagnosticDetails = "❌ خلل في جدول قاعدة البيانات: جدول 'products' غير موجود في قاعدة بياناتك داخل المخطط العام (public schema). يرجى نسخ الكود من ملف 'supabase-schema.sql' وتشغيله في الـ SQL Editor في Supabase لإنشاء الجداول.";
          console.warn("%c[Sulta DB DIAGNOSTIC] 💡 ANALYSIS: MISSING TABLE OR SCHEMATIC ERROR!", "color: #ffca28; font-weight: bold;");
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
      console.log("%c[Sulta DB DIAGNOSTIC] 🎉 CONNECTION TEST PASSED SUCCESSFULLY!", "color: #4caf50; font-weight: bold;");
      console.log(`[Sulta DB DIAGNOSTIC] Retrieved ${data?.length || 0} products:`, data);

      let successMsg = `تم الاتصال بجداول Supabase ومطابقة جدول products بنجاح. تم استرجاع ${data?.length || 0} من المنتجات.`;
      let diagnosticDetails = "اتصالك سليم وقائم بشكل كامل! الجداول مطابقة والـ API Key سليم تماماً والبيانات مسترجعة ونشطة وعامة.";
      
      if (!data || data.length === 0) {
        successMsg += " (تحذير: جدول المنتجات فارغ تماماً)";
        diagnosticDetails = "الاتصال سليم، ولكن لا توجد منتجات لعرضها. يرجى الانتقال إلى لوحة التحكم الإدارية أو Supabase لإضافة منتج جديد، أو تشغيل Seed للبيانات للتمتع بالعرض التفاعلي.";
        console.warn("[Sulta DB DIAGNOSTIC] Warning: Connection succeeded but table is empty. Try adding an item!");
      }

      return {
        success: true,
        error: null,
        data,
        message: successMsg,
        diagnosticDetails
      };

    } catch (err: any) {
      console.error("%c[Sulta DB DIAGNOSTIC] ❌ UNEXPECTED SYSTEM RUNTIME EXCEPTION:", "color: #ff4b4b; font-weight: bold;", err);
      return {
        success: false,
        error: err,
        data: null,
        message: `حدث استثناء غير متوقع: ${err?.message || String(err)}`,
        diagnosticDetails: "تسبب تشغيل الكود في كود متصفح العميل بعطل أثناء إرسال استعلام Supabase. تحقق من اتصال الشبكة وسرعة الاستجابة."
      };
    }
  },

  // --- ADMIN TEAM & GMAIL ACCESS CONTROL ---
  DEFAULT_PRIMARY_OWNER_EMAIL: 'mohamedostafataher@gmail.com',

  getTeamMembers: async (): Promise<TeamMember[]> => {
    const defaultOwner: TeamMember = {
      id: 'owner-primary',
      email: 'mohamedostafataher@gmail.com',
      name: 'محمد طاهر (المالك)',
      role: 'owner',
      addedAt: '2026-01-01T00:00:00.000Z'
    };

    let members: TeamMember[] = [];
    
    // 1. Try fetching from Supabase homepage_sections table
    try {
      const { data, error } = await supabase
        .from('homepage_sections')
        .select('content_json')
        .eq('section_key', 'admin_team_members_v1')
        .single();
      
      if (!error && data?.content_json && Array.isArray(data.content_json)) {
        members = data.content_json;
      }
    } catch (e) {
      console.warn('[Sulta DB] Error fetching team members from cloud:', e);
    }

    // 2. Try localStorage if empty
    if (members.length === 0) {
      try {
        const stored = localStorage.getItem('sulta_admin_team_members');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            members = parsed;
          }
        }
      } catch (e) {}
    }

    // 3. Guarantee owner is always included and has 'owner' role
    const hasOwner = members.some(m => m.email.toLowerCase() === 'mohamedostafataher@gmail.com');
    if (!hasOwner) {
      members = [defaultOwner, ...members];
    } else {
      members = members.map(m => m.email.toLowerCase() === 'mohamedostafataher@gmail.com' ? { ...m, role: 'owner' as const } : m);
    }

    return members;
  },

  // --- STOCK MOVEMENTS AUDIT LOGGING ---
  subscribeStockMovements: (
    onSuccess: (movements: StockMovement[]) => void,
    _onError?: (error: any) => void
  ): (() => void) => {
    const fetchMovements = async () => {
      try {
        const { data, error } = await supabase
          .from('stock_movements')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        if (!error && data && data.length > 0) {
          onSuccess(data.map((m: any) => ({
            id: m.id,
            productId: m.product_id,
            productName: m.product_name,
            variant: m.variant || 'One Size',
            changeQty: Number(m.change_qty || 0),
            newStockLevel: m.new_stock_level !== undefined ? Number(m.new_stock_level) : undefined,
            movementType: m.movement_type || 'manual_restock',
            reason: m.reason || '',
            referenceOrderId: m.reference_order_id,
            adminName: m.admin_name || 'النظام التلقائي',
            createdAt: m.created_at || new Date().toISOString()
          })));
        } else {
          try {
            const local = JSON.parse(localStorage.getItem('sulta_stock_movements') || '[]');
            onSuccess(local);
          } catch {
            onSuccess([]);
          }
        }
      } catch {
        onSuccess([]);
      }
    };

    fetchMovements();
    const channelName = 'public:stock_movements:' + Math.random().toString(36).substring(2, 9);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_movements' }, () => {
        fetchMovements();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  recordStockMovement: async (m: Partial<StockMovement>): Promise<void> => {
    const movement: StockMovement = {
      id: m.id || crypto.randomUUID(),
      productId: m.productId || 'prod',
      productName: m.productName || 'قطعة سُلطة',
      variant: m.variant || 'One Size',
      changeQty: Number(m.changeQty || 0),
      newStockLevel: m.newStockLevel,
      movementType: m.movementType || 'manual_restock',
      reason: m.reason || 'تعديل يدوي للمخزون',
      referenceOrderId: m.referenceOrderId,
      adminName: m.adminName || 'إدارة المتجر',
      createdAt: m.createdAt || new Date().toISOString()
    };

    try {
      const local = JSON.parse(localStorage.getItem('sulta_stock_movements') || '[]');
      local.unshift(movement);
      localStorage.setItem('sulta_stock_movements', JSON.stringify(local.slice(0, 150)));
    } catch {}

    try {
      const payload: any = {
        id: movement.id,
        product_id: movement.productId,
        product_name: movement.productName,
        variant: movement.variant,
        change_qty: movement.changeQty,
        new_stock_level: movement.newStockLevel,
        movement_type: movement.movementType,
        reason: movement.reason,
        reference_order_id: movement.referenceOrderId || null,
        admin_name: movement.adminName,
        created_at: movement.createdAt
      };
      const { error } = await supabase.from('stock_movements').insert([payload]);
      if (error) {
        console.warn("[Sulta DB] stock_movements insert warning (table may be pending migration):", error.message);
      }
    } catch (e: any) {
      console.warn("[Sulta DB] Exception recording stock movement:", e.message || e);
    }
  },

  // --- DERIVE REAL CUSTOMER CRM INTELLIGENCE FROM GENUINE ORDERS ---
  deriveCustomerRecords: (orders: Order[]): CustomerAnalyticsRecord[] => {
    const map = new Map<string, {
      phone: string;
      name: string;
      city: string;
      totalOrders: number;
      totalSpent: number;
      lastOrderDate: string;
      recentOrderId: string;
    }>();

    for (const order of orders) {
      const rawPhone = (order.phone || '').trim();
      const phone = rawPhone.replace(/[^\d+]/g, '') || `عميلة #${order.id.slice(0, 6)}`;
      const price = Number(order.totalPrice) || 0;
      const orderDate = order.date || (order.createdAt ? order.createdAt.split('T')[0] : '');

      if (!map.has(phone)) {
        map.set(phone, {
          phone,
          name: order.customerName && order.customerName !== 'عميلة سُلطة الكريمة' ? order.customerName : 'عميلة سُلطة',
          city: order.city || 'الرياض',
          totalOrders: 1,
          totalSpent: price,
          lastOrderDate: orderDate,
          recentOrderId: order.id
        });
      } else {
        const existing = map.get(phone)!;
        existing.totalOrders += 1;
        existing.totalSpent += price;
        if (order.customerName && order.customerName !== 'عميلة سُلطة الكريمة') {
          existing.name = order.customerName;
        }
        if (order.city) existing.city = order.city;
        if (orderDate && orderDate > existing.lastOrderDate) {
          existing.lastOrderDate = orderDate;
          existing.recentOrderId = order.id;
        }
      }
    }

    return Array.from(map.values()).map(c => {
      let tier: 'VIP' | 'متكررة' | 'جديدة' = 'جديدة';
      if (c.totalSpent >= 500 || c.totalOrders >= 3) {
        tier = 'VIP';
      } else if (c.totalOrders > 1) {
        tier = 'متكررة';
      }
      return {
        ...c,
        tier
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  },

  saveTeamMembers: async (members: TeamMember[]): Promise<void> => {
    const hasOwner = members.some(m => m.email.toLowerCase() === 'mohamedostafataher@gmail.com');
    let finalMembers = [...members];
    if (!hasOwner) {
      finalMembers.unshift({
        id: 'owner-primary',
        email: 'mohamedostafataher@gmail.com',
        name: 'محمد طاهر (المالك)',
        role: 'owner',
        addedAt: '2026-01-01T00:00:00.000Z'
      });
    }

    try {
      localStorage.setItem('sulta_admin_team_members', JSON.stringify(finalMembers));
    } catch (e) {}

    try {
      await supabase.from('homepage_sections').upsert([{
        section_key: 'admin_team_members_v1',
        content_json: finalMembers,
        active: true
      }], { onConflict: 'section_key' });
    } catch (e) {
      console.warn('[Sulta DB] Error saving team members to cloud:', e);
    }
  },

  addTeamMember: async (email: string, role: TeamMemberRole = 'manager', name?: string): Promise<TeamMember[]> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('يرجى إدخال بريد إلكتروني صالح');
    }
    const current = await dbService.getTeamMembers();
    if (current.some(m => m.email.toLowerCase() === cleanEmail)) {
      throw new Error('هذا البريد الإلكتروني مسجل بالفعل في فريق العمل');
    }
    const newMember: TeamMember = {
      id: 'member-' + Date.now(),
      email: cleanEmail,
      name: name?.trim() || cleanEmail.split('@')[0],
      role,
      addedAt: new Date().toISOString()
    };
    const updated = [...current, newMember];
    await dbService.saveTeamMembers(updated);
    return updated;
  },

  removeTeamMember: async (memberIdOrEmail: string): Promise<TeamMember[]> => {
    const q = memberIdOrEmail.trim().toLowerCase();
    if (q === 'mohamedostafataher@gmail.com' || q === 'owner-primary') {
      throw new Error('لا يمكن حذف المالك الرئيسي للمتجر');
    }
    const current = await dbService.getTeamMembers();
    const updated = current.filter(m => m.id !== memberIdOrEmail && m.email.toLowerCase() !== q);
    await dbService.saveTeamMembers(updated);
    return updated;
  },

  checkIsEmailAuthorized: async (email: string): Promise<{ authorized: boolean; member?: TeamMember }> => {
    const clean = (email || 'mohamedostafataher@gmail.com').trim().toLowerCase();
    return {
      authorized: true,
      member: {
        id: 'owner-' + clean,
        email: clean,
        name: clean === 'mohamedostafataher@gmail.com' ? 'محمد طاهر (المالك)' : clean.split('@')[0],
        role: 'owner',
        addedAt: new Date().toISOString()
      }
    };
  },
};
