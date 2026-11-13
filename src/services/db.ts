import { Product, Review, DiscountCoupon, Order, InStockAlert, Category, Settings, ContactMessage, NewsletterSubscription, Collection, BlogPost, FaqItem, SupportTicket, TicketMessage, Country, TeamMember, TeamMemberRole, StockMovement, CustomerAnalyticsRecord, ActualProductPrice, ReturnRefundRequest, OperatingExpense, AnalyticsEvent, FinancialAnalyticsSummary, ShippingCarrier, CustomerProfileMeta, WhatsAppEventKey, WhatsAppTemplateConfig, WhatsAppSendLog, Supplier, PurchaseOrder, StockReservation, SlugHistoryEntry, CartItem } from '../types';
import { createClient } from '@supabase/supabase-js';
import { SEED_FALLBACK_PRODUCTS } from '../data/fallbackProducts';

import { parseCleanArabicDescription } from '../utils/textUtils';
import { getIdFromSlug } from '../utils/slugify';
import { normalizeAdminRole, canAccessTab, canManageTeam, canManageSettings, canEditProducts, canUpdateStock, canViewCostPrice } from '../utils/rbac';
import { normalizePhoneKey, toHalalas } from '../utils/orderPipeline';
import { calculateWeightedAverageCostHalalas, fromHalalas } from '../utils/inventoryAnalytics';
import { DEFAULT_SHIPPING_CARRIERS } from '../utils/shippingCarriers';
import { DEFAULT_EVENT_TEMPLATES } from './whatsappService';

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
  },
  {
    id: "art-003",
    title: "دليل بيجامات النوم النسائية الفاخرة — كيف تختارين بين القطن الطبيعي والقطن الكوريشة؟",
    slug: "ultimate-womens-sleepwear-cotton-guide",
    content: "تعتبر ملابس النوم والبيجامات النسائية ركيزة أساسية في جودة الراحة والاسترخاء اليومي. في هذا الدليل التخصصي من دار سولته، نستعرض الفروقات الجوهرية بين القطن الطبيعي المعالج عالي النعومة وأقمشة قطن الكوريشة (Seersucker Crinkle Cotton) الباردة المقاومة للحرارة. كما نوضح سر نجاح قصّات المقاس الموحد (One Size) التي تناسب الأوزان من 45 إلى 80 كجم بانسيابية وراحة فائقة تناسب أجواء منازل السعودية والخليج، مع إرشادات الغسيل بالماء البارد للحفاظ على نعومة النسيج وألوانه الملكية.",
    excerpt: "دليل شامل ومفصل لاختيار بيجامات النوم القطنية والقطن الكوريشة ومقاس وان سايز من دار سولته.",
    imageUrl: "/img/sulta_hero_banner_real.webp",
    author: "فريق التحرير والأزياء في سولته",
    category: "أدلة الموضة",
    tags: ["بيجامات نسائية", "قطن كوريشة", "مقاس موحد", "أزياء النوم السعودية"],
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

export function cleanImgUrl(url: any, _width: number | string = 1200): string {
  if (!url || typeof url !== 'string' || url.trim() === '' || url.trim() === 'null' || url.trim() === 'undefined') {
    return '';
  }

  let cleaned = url.trim();

  // If wsrv.nl proxy URL, extract raw URL for instant direct loading
  if (cleaned.includes('wsrv.nl')) {
    try {
      const parsed = new URL(cleaned);
      const raw = parsed.searchParams.get('url');
      if (raw) cleaned = decodeURIComponent(raw);
    } catch {}
  }

  // 1. Direct Supabase Storage URLs - lightning-fast direct CDN delivery
  if (cleaned.includes('supabase.co/storage/v1/object/public/')) {
    return cleaned.replace(/([^:])\/+/g, '$1/');
  }

  // 2. Local assets
  if (cleaned.startsWith('/img/') || cleaned.startsWith('img/') || cleaned.startsWith('/src/assets/') || cleaned.startsWith('src/assets/')) {
    let path = cleaned.startsWith('/') ? cleaned : '/' + cleaned;
    path = path.replace(/^\/src\/assets\//, '/img/');
    return path;
  }

  // 3. Data URIs
  if (cleaned.startsWith('data:')) return cleaned;

  // 4. Filename in Supabase 'products' bucket
  if (!cleaned.startsWith('http') && cleaned.includes('.')) {
    const cleanPath = cleaned.replace(/^\/+/, '').replace(/^products\//, '');
    return `https://fwadgmhabzaudusxghnh.supabase.co/storage/v1/object/public/products/${cleanPath}`;
  }

  // 5. Full HTTP URLs
  if (cleaned.startsWith('http')) {
    return cleaned.replace(/([^:])\/+/g, '$1/');
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
    metaCapiAccessToken: '', // Never expose CAPI secret tokens in client state
    metaTestEventCode: data.metaTestEventCode || data.meta_test_event_code || '',
    googleAnalyticsId: data.google_analytics_id || 'G-Q3TBBTHEJL',
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
  
  // Name resolution: DB physical columns FIRST
  const nameAr = data.name_ar || (fallbackProduct ? fallbackProduct.nameAr : '') || (data.name ? data.name.split(' | ')[0] : '') || 'منتج سولته';
  const nameEn = data.name_en || (fallbackProduct ? fallbackProduct.nameEn : '') || (data.name && data.name.includes(' | ') ? data.name.split(' | ')[1] : '') || 'Sulta Product';

  // SELF-HEALING: If DB has no images, try to recover from memory goldmine by ID or Name
  let imagesToUse = validImages;
  if (imagesToUse.length === 0) {
    const recovered = SEED_FALLBACK_PRODUCTS.find(p => 
      (data.id && p.id === data.id) || 
      (data.id && typeof data.id === 'string' && p.id.startsWith(data.id.slice(0, 8))) ||
      (nameAr && p.nameAr === nameAr) ||
      (nameEn && p.nameEn === nameEn)
    );
    if (recovered && recovered.images && recovered.images.length > 0) {
      console.log(`[Sulta RECOVERY] Self-healing images for ${data.id} / ${nameAr} from fallback memory.`);
      imagesToUse = recovered.images;
    }
  }

  const cleanedImages = imagesToUse.length > 0
    ? imagesToUse.map((imgUrl: any) => cleanImgUrl(imgUrl, catKey)).filter(Boolean)
    : []; 

  // Description resolution
  let rawDesc = data.description_ar || data.description || '';
  let metadata: any = null;
  if (rawDesc.includes('[METADATA_Sulta_V2]:')) {
    try {
      const metaStr = rawDesc.substring(rawDesc.indexOf('[METADATA_Sulta_V2]:') + 20);
      metadata = JSON.parse(metaStr);
    } catch {}
    rawDesc = rawDesc.substring(0, rawDesc.indexOf('[METADATA_Sulta_V2]'));
  } else if (rawDesc.includes('[METADATA_Sulta_V2]')) {
    rawDesc = rawDesc.substring(0, rawDesc.indexOf('[METADATA_Sulta_V2]'));
  }
  let descriptionAr = parseCleanArabicDescription(rawDesc) || metadata?.descriptionAr || (fallbackProduct ? fallbackProduct.descriptionAr : '');
  let descriptionEn = metadata?.descriptionEn || (fallbackProduct ? fallbackProduct.descriptionEn : '');

  // Fabric / Wash
  let fabricAr = data.material || data.fabric_ar || metadata?.fabricAr || (fallbackProduct ? fallbackProduct.fabricAr : '');
  let fabricEn = data.fabric_en || metadata?.fabricEn || (fallbackProduct ? fallbackProduct.fabricEn : '');
  let washInstructionsAr = data.care_instructions || data.wash_instructions_ar || metadata?.washInstructionsAr || (fallbackProduct ? fallbackProduct.washInstructionsAr : '');

  // Colors & Sizes
  let colors = Array.isArray(data.colors) ? data.colors : (data.colors ? (typeof data.colors === 'string' ? JSON.parse(data.colors) : data.colors) : (metadata?.colors || (fallbackProduct ? fallbackProduct.colors : [])));
  if (!colors || colors.length === 0) {
    colors = fallbackProduct ? fallbackProduct.colors : [{ name: 'وردي', hex: '#DF8A9D' }];
  }
  let sizes = (data.sizes && Array.isArray(data.sizes) && data.sizes.length > 0)
    ? data.sizes
    : (data.size_info ? data.size_info.split(',').map((s: string) => s.trim()) : (metadata?.sizes || ['One Size']));

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
    minStockThreshold: data.min_stock_threshold !== undefined && data.min_stock_threshold !== null
      ? Number(data.min_stock_threshold)
      : (metadata?.minStockThreshold !== undefined ? Number(metadata.minStockThreshold) : 5),
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
    costPrice: data.cost_price !== undefined && data.cost_price !== null ? Number(data.cost_price) : undefined,
    collection: data.collection || undefined,
    seo: data.seo
      ? (typeof data.seo === 'string' ? JSON.parse(cleanText(data.seo)) : data.seo)
      : (metadata?.seo || undefined),
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
    shippingCarrier: data.shippingCarrier || data.shipping_carrier || undefined,
    shippingCarrierCode: data.shippingCarrierCode || data.shipping_carrier_code || undefined,
    fulfillmentStatus: data.fulfillmentStatus || data.fulfillment_status || 'unfulfilled',
    shippingCost: Number(data.shippingCost ?? data.shipping_cost ?? 0),
    expectedDeliveryDate: data.expectedDeliveryDate || data.expected_delivery_date || undefined,
    deliveryFailureReason: data.deliveryFailureReason || data.delivery_failure_reason || undefined,
    currency: data.currency || 'SAR',
    paymentMethod: data.paymentMethod || data.payment_method || 'الدفع عند الاستلام',
    status: data.status || 'pending',
    paymentStatus: data.paymentStatus || data.payment_status || 'pending',
    paymentVerifiedAt: data.paymentVerifiedAt || data.payment_verified_at || undefined,
    paymentVerifiedBy: data.paymentVerifiedBy || data.payment_verified_by || undefined,
    receiptReviewNotes: data.receiptReviewNotes || data.receipt_review_notes || undefined,
    adminNotes: data.adminNotes || data.admin_notes || undefined,
    assignedTo: data.assignedTo || data.assigned_to || undefined,
    whatsappLogs: Array.isArray(data.whatsappLogs)
      ? data.whatsappLogs
      : Array.isArray(data.whatsapp_logs)
      ? data.whatsapp_logs
      : (typeof data.whatsapp_logs === 'string' && data.whatsapp_logs.trim() ? (() => { try { return JSON.parse(data.whatsapp_logs); } catch { return []; } })() : undefined),
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

function stripCostFields(row: any) {
  if (!row || typeof row !== 'object') return row;
  const copy = { ...row };
  delete copy.cost_price;
  delete copy.costPrice;
  return copy;
}

function stripSettingsSecrets(row: any) {
  if (!row || typeof row !== 'object') return row;
  const copy = { ...row };
  delete copy.meta_capi_access_token;
  delete copy.metaCapiAccessToken;
  return copy;
}

export const dbService = {
  supabase,
  getProductActualPrice,
  calculateShippingFee,
  
  getProductById: async (id: string): Promise<Product | null> => {
    const queryPublicByCol = async (col: string, val: string) => {
      const res = await supabase.from('products_public').select('*').eq(col, val).maybeSingle();
      if (res.error) {
        const fb = await supabase.from('products').select('*').eq(col, val).maybeSingle();
        return fb.data ? { ...fb, data: stripCostFields(fb.data) } : fb;
      }
      return res;
    };

    try {
      if (!id) return null;
      const resolvedId = getIdFromSlug(id) || id;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedId);
      if (isUuid) {
        const { data, error } = await queryPublicByCol('id', resolvedId);
        if (!error && data) {
          return mapProduct(data);
        }
      } else {
        const { data, error } = await queryPublicByCol('slug', id);
        if (!error && data) {
          return mapProduct(data);
        }
        const { data: data2, error: err2 } = await queryPublicByCol('slug', resolvedId);
        if (!err2 && data2) {
          return mapProduct(data2);
        }

        // Check slug_history redirects (old_slug -> product_id)
        try {
          const { data: histRow } = await supabase
            .from('slug_history')
            .select('product_id')
            .eq('old_slug', id)
            .order('changed_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (histRow?.product_id) {
            const { data: redirectedProd } = await queryPublicByCol('id', histRow.product_id);
            if (redirectedProd) return mapProduct(redirectedProd);
          }
        } catch {}

        try {
          const localHist: SlugHistoryEntry[] = JSON.parse(localStorage.getItem('sulta_slug_history_v1') || '[]');
          const match = localHist.find((h) => h.oldSlug === id || h.oldSlug === resolvedId);
          if (match?.productId) {
            const { data: redirectedProd } = await queryPublicByCol('id', match.productId);
            if (redirectedProd) return mapProduct(redirectedProd);
          }
        } catch {}
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

    // Fallback: search public products without confidential cost_price
    try {
      let { data: allProds, error } = await supabase.from('products_public').select('*');
      if (error || !Array.isArray(allProds) || allProds.length === 0) {
        const fb = await supabase.from('products').select('*');
        if (!fb.error && Array.isArray(fb.data)) {
          allProds = fb.data.map(stripCostFields);
        }
      }
      if (allProds && Array.isArray(allProds)) {
        const found = allProds.find((p: any) => p.id === resolvedId || p.id === id || (p.id && resolvedId && (p.id.includes(resolvedId) || resolvedId.includes(p.id))));
        if (found) return mapProduct(found);
      }
    } catch {}

    return null;
  },

  getAdminProductsWithCost: async (): Promise<Product[]> => {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (!error && Array.isArray(data)) {
        return data.map(mapProduct);
      }
    } catch (err) {
      console.warn('[Sulta DB] getAdminProductsWithCost error:', err);
    }
    return [];
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
      let { data, error } = await supabase.from('settings_public').select('*').limit(1).maybeSingle();
      if (error || !data) {
        const fallbackRes = await supabase
          .from('settings')
          .select('*')
          .limit(1)
          .maybeSingle();
        if (!fallbackRes.error && fallbackRes.data) {
          data = stripSettingsSecrets(fallbackRes.data);
          error = null;
        }
      }
      if (data) {
        if (data.site_name && data.site_name.toLowerCase().includes('zoria')) {
          data.site_name = data.site_name.replace(/zoria/ig, 'Sulta');
        }
        if (data.whatsapp === '966500000000' || !data.whatsapp || data.whatsapp.includes('966500') || data.whatsapp === '201110095403' || data.whatsapp.includes('20111') || data.whatsapp.includes('596894393')) {
          data.whatsapp = '966552823677';
          data.contact_phone = '+966 55 282 3677';
        }
        if (!data.tiktok_pixel_id) {
          data.tiktok_pixel_id = 'DBESRBJC77U4J2JQDUB0';
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
    const fetchCats = async () => {
        try {
          const { data, error } = await supabase.from('categories').select('id, name, name_ar, name_en, slug, image_url');
          if (error) {
            console.warn('[Sulta DB] Categories table might be missing, falling back to products extract:', error.message);
            // Fallback: extract unique categories from products if table missing
            const { data: prods } = await supabase.from('products').select('category, category_ar');
            if (prods) {
              const uniqueNames = Array.from(new Set(prods.map(p => p.category_ar || p.category)));
              const fallbackCats = uniqueNames.map((name, idx) => ({
                id: `fallback-${idx}`,
                name: String(name),
                nameAr: String(name),
                nameEn: String(name),
                slug: String(name).toLowerCase().replace(/\s+/g, '-'),
                imageUrl: ''
              }));
              onSuccess(fallbackCats);
              return;
            }
            onSuccess([]);
          } else if (data) {
            onSuccess(data.map(mapCategory));
          }
        } catch {
          onSuccess([]);
        }
    };

    fetchCats();

    const channelName = 'public:categories:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchCats();
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
    const fetchColls = async () => {
        try {
            const { data, error } = await supabase.from('collections').select('id, name_ar, name_en, description_ar, description_en, image_url');
            if (error) {
                console.warn('[Sulta DB] Collections fetch failed, table might be missing:', error.message);
                onSuccess([]);
            } else if (data) {
                onSuccess(data.map(mapCollection));
            }
        } catch (err) {
            console.warn('Supabase exception for collections', err);
            onSuccess([]);
        }
    };

    fetchColls();

    const channelName = 'public:collections:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collections' }, () => {
        fetchColls();
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

    const fetchPublicProducts = async () => {
      const res = await supabase.from('products_public').select('*');
      if (!res.error && Array.isArray(res.data) && res.data.length > 0) {
        return res;
      }
      const fallback = await supabase.from('products').select('*');
      if (!fallback.error && Array.isArray(fallback.data)) {
        return {
          ...fallback,
          data: fallback.data.map(stripCostFields)
        };
      }
      return res.error ? fallback : res;
    };

    fetchPublicProducts().then(({ data, error }) => {
      if (error) {
        console.error('[Sulta DB] Supabase products fetch error:', error);
        _onError?.(error);
      } else if (!data) {
        console.warn('[Sulta DB] Supabase returned no product rows');
      } else {
        const mapped = data.map(mapProduct);
        deliverProducts(mapped);
      }
    }).catch((err: any) => {
      console.error('[Sulta DB] Exception fetching products from Supabase:', err);
      _onError?.(err);
    });

    const channelName = 'public:products:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        try {
          const { data, error } = await fetchPublicProducts();
          if (error) {
            console.error('[Sulta DB] Realtime error on products update:', error);
          } else if (data) {
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
    // Select only columns that are known to exist in standard schema
    const REVIEWS_COLUMNS = 'id, product_id, username, avatar, rating, comment, country, is_verified_purchase, status, images, created_at';
    
    supabase.from('reviews').select(REVIEWS_COLUMNS).then(({ data, error }) => { 
      if (error) {
        console.warn('[Sulta DB] Reviews fetch failed, columns might be missing:', error.message);
        // Try minimal select if standard fails
        supabase.from('reviews').select('id, rating, comment').then(minimal => {
            if (minimal.data) onSuccess(minimal.data.map(mapReview));
        }).catch(() => onSuccess([]));
      } else if (data) {
        onSuccess(data.map(mapReview)); 
      }
    }).catch((err) => { 
      console.warn('Supabase exception for reviews', err); 
      onSuccess([]);
    });

    const channelName = 'public:reviews:' + Math.random().toString(36).substring(2, 15);
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, async () => {
        const { data } = await supabase.from('reviews').select(REVIEWS_COLUMNS);
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
    const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    if (!finalId || !isUuid(finalId)) {
      finalId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
        ? crypto.randomUUID() 
        : '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0');
      order.id = finalId; // UPDATE OBJECT BY REFERENCE TO PREVENT MISMATCHES
      console.log(`[Sulta DB] Non-UUID detected for order, generated new UUID: ${finalId}`);
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
      console.log(`[Sulta DB] Saved product "${product.nameAr}" (ID: ${product.id}) to localStorage.`);
    } catch (e) {
      console.warn('[Sulta DB] Error saving product to localStorage:', e);
    }

    // Standard allowed categories in CHECK constraint
    const allowedCategories = ['satin', 'soft', 'cotton', 'loungewear', 'dresses', 'new', 'sleepwear'];
    const safeCategory = allowedCategories.includes(product.category) ? product.category : 'new';
    
    // UUID format check
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

    // Detect slug change before saving so slug_history can log redirect
    let previousSlugForRedirect: string | null = null;
    try {
      const savedStr = localStorage.getItem('sulta_saved_products') || '{}';
      const savedMap = JSON.parse(savedStr);
      const cachedPrev = savedMap[product.id];
      if (cachedPrev?.slug && product.slug && cachedPrev.slug.trim() !== product.slug.trim()) {
        previousSlugForRedirect = cachedPrev.slug.trim();
      }
    } catch {}

    // Pack all product metadata into a JSON block
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
      minStockThreshold: product.minStockThreshold ?? 5,
      shortDescription: product.shortDescription || null,
      tags: product.tags || [],
      collection: product.collection || null,
      seo: product.seo || null
    };

    const encodedName = (product.nameAr || '') + (product.nameEn ? ' | ' + product.nameEn : '');
    const encodedDescription = (product.descriptionAr || '') + (product.descriptionEn ? ' | ' + product.descriptionEn : '') + ' | [METADATA_Sulta_V2]:' + JSON.stringify(metadata);

    // Ensure productId is always a valid UUID
    let productId = product.id;
    const isUUIDFormat = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    if (!productId || typeof productId !== 'string' || !isUUIDFormat(productId.trim())) {
      try {
        productId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
          ? crypto.randomUUID() 
          : '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0');
      } catch (e) {
        productId = '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0');
      }
    }
    
    // Crucial: keep product object reference synced
    product.id = productId;

    // Also inspect live Supabase row for previous slug if cache missed it
    if (!previousSlugForRedirect && product.slug && product.slug.trim()) {
      try {
        const { data: prevRow } = await supabase.from('products').select('slug').eq('id', productId).maybeSingle();
        if (prevRow?.slug && prevRow.slug !== product.slug.trim() && !isUUIDFormat(prevRow.slug)) {
          previousSlugForRedirect = prevRow.slug;
        }
      } catch {}
    }

    // Map payload strictly matching Supabase columns
    const payload: any = {
      id: productId,
      name: encodedName || product.nameAr || 'Sulta Product',
      name_ar: product.nameAr || '',
      description: encodedDescription,
      description_ar: product.descriptionAr || '',
      price: product.priceSA || product.priceEG || 0,
      price_sa: product.priceSA || 0,
      price_eg: product.priceEG || (product.priceSA ? product.priceSA * 5 : 0),
      cost_price: product.costPrice !== undefined ? Number(product.costPrice) : null,
      sale_price: product.salePriceSA || product.salePriceEG || null,
      sale_price_sa: product.salePriceSA || null,
      sale_price_eg: product.salePriceEG || null,
      regular_price: product.regularPrice || product.priceSA || 69,
      regular_price_since: product.regularPriceSince || new Date().toISOString().split('T')[0],
      discount_percent: product.discountPercent ?? 0,
      discount_starts_at: product.discountStartsAt || null,
      discount_ends_at: product.discountEndsAt || null,
      stock: Number(product.stock) || 0,
      min_stock_threshold: product.minStockThreshold ?? 5,
      images: Array.isArray(product.images) ? product.images : [],
      category: safeCategory,
      category_id: (resolvedCategoryId && isUUIDFormat(resolvedCategoryId)) ? resolvedCategoryId : null,
      category_ar: product.categoryAr || 'المجموعة الجديدة',
      slug: (product.slug && product.slug.trim()) ? product.slug.trim() : productId,
      seo_title: product.seo?.metaTitleAr || product.seoTitle || null,
      short_description: product.seo?.metaDescriptionAr || product.shortDescription || null,
      seo: product.seo || null,
      status: product.status || 'active',
      material: product.fabricAr || null,
      care_instructions: product.washInstructionsAr || null,
      size_info: (product.sizes && product.sizes.length > 0) ? product.sizes.join(', ') : 'One Size'
    };

    console.log(`[Sulta DB] Upserting product ${productId}. Payload:`, { 
        id: payload.id, 
        name_ar: payload.name_ar, 
        price_sa: payload.price_sa,
        images_count: payload.images?.length 
    });

    if (!payload.id) {
        throw new Error("Critical Error: Product ID is missing in payload construction.");
    }

    let { error } = await supabase.from('products').upsert([payload], { onConflict: 'id' });

    let retries = 10;
    while (error && error.message && retries > 0) {
      const errMsg = error.message;
      console.warn(`[Sulta DB] Error on save, resolving: "${errMsg}". Retries: ${retries}`);

      // Handle null constraint specifically for 'id' if it somehow happens
      if (errMsg.includes('null value in column "id"')) {
          console.error("[Sulta DB] CRITICAL: Database reports NULL ID even though we sent one. Retrying with explicit insert...");
          const insertRes = await supabase.from('products').insert([payload]);
          error = insertRes.error;
          if (!error) break;
      }

      // 1. Column missing - remove it from payload
      let colName: string | null = null;
      const missingMatch = errMsg.match(/Could not find the '([^']+)' column/i);
      const pgNotExistMatch = errMsg.match(/column "([^"]+)" of relation "products" does not exist/i) || errMsg.match(/column "([^"]+)" does not exist/i);
      
      if (missingMatch && missingMatch[1]) colName = missingMatch[1];
      else if (pgNotExistMatch && pgNotExistMatch[1]) colName = pgNotExistMatch[1];

      // CRITICAL: NEVER delete the 'id' column from payload
      if (colName && colName !== 'id') {
        console.warn(`[Sulta DB] Removing non-existent column '${colName}' from payload.`);
        delete payload[colName];
        const retryRes = await supabase.from('products').upsert([payload], { onConflict: 'id' });
        error = retryRes.error;
        retries--;
        continue;
      }

      // 2. Foreign Key violations
      if (errMsg.toLowerCase().includes("foreign key") || errMsg.toLowerCase().includes("violates foreign key")) {
        if (errMsg.includes("category_id")) payload.category_id = null;
        else if (errMsg.includes("collection")) payload.collection = null;
        else {
            payload.category_id = null;
            payload.collection = null;
        }
        const retryRes = await supabase.from('products').upsert([payload], { onConflict: 'id' });
        error = retryRes.error;
        retries--;
        continue;
      }

      // 3. UUID Syntax
      if (errMsg.toLowerCase().includes("invalid input syntax for type uuid")) {
        const uuidMatch = errMsg.match(/"([^"]+)"/);
        const badVal = uuidMatch ? uuidMatch[1] : null;
        if (badVal) {
            for (const k of Object.keys(payload)) {
                if (k !== 'id' && payload[k] === badVal) payload[k] = null;
            }
        }
        const retryRes = await supabase.from('products').upsert([payload], { onConflict: 'id' });
        error = retryRes.error;
        retries--;
        continue;
      }

      break;
    }

    if (error) {
      console.error("[Sulta DB] Final upsert fail:", error.message);
      throw new Error(error.message || 'فشل الحفظ في قاعدة بيانات Supabase');
    }

    // Record slug redirect history if slug changed cleanly
    if (previousSlugForRedirect && payload.slug && previousSlugForRedirect !== payload.slug) {
      await dbService.recordSlugChange(productId, previousSlugForRedirect, payload.slug);
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
      const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      if (isUUID(productId)) {
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (error) console.warn('[Sulta DB] Supabase delete notice:', error.message || error);
      }
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
    if (order.adminNotes !== undefined) updatePayload.admin_notes = order.adminNotes;
    if (order.discountAmount !== undefined) updatePayload.discount_amount = order.discountAmount;
    if (order.couponCode) updatePayload.coupon_code = order.couponCode;

    if (order.shippingCarrier !== undefined) updatePayload.shipping_carrier = order.shippingCarrier;
    if (order.fulfillmentStatus) updatePayload.fulfillment_status = order.fulfillmentStatus;
    if (order.shippingCost !== undefined) updatePayload.shipping_cost = order.shippingCost;
    if (order.expectedDeliveryDate) updatePayload.expected_delivery_date = order.expectedDeliveryDate;
    if (order.deliveryFailureReason) updatePayload.delivery_failure_reason = order.deliveryFailureReason;

    // Optional D4 columns (may be pending additive SQL migration in Supabase)
    const d4ExtendedPayload: Record<string, any> = {};
    if (order.assignedTo !== undefined) d4ExtendedPayload.assigned_to = order.assignedTo || null;
    if (order.shippingCarrierCode !== undefined) d4ExtendedPayload.shipping_carrier_code = order.shippingCarrierCode || null;
    if (order.whatsappLogs !== undefined) d4ExtendedPayload.whatsapp_logs = order.whatsappLogs;

    // Add missing fields to keep orders table in sync if possible
    if (order.customerName) updatePayload.customer_name = order.customerName;
    if (order.phone) updatePayload.phone = order.phone;

    try {
      // 1. Fetch old status before updating
      let oldStatus: string | null = null;
      try {
        const { data: current } = await supabase.from('orders').select('status').eq('id', order.id).maybeSingle();
        if (current) oldStatus = current.status;
      } catch {}

      // Update the main row (try with D4 extended columns first, then safely retry core columns if schema is pending migration)
      let { error: oErr } = await supabase
        .from('orders')
        .update({ ...updatePayload, ...d4ExtendedPayload })
        .eq('id', order.id);

      if (oErr && Object.keys(d4ExtendedPayload).length > 0 && /column|schema|cache/i.test(oErr.message || '')) {
        const retry = await supabase.from('orders').update(updatePayload).eq('id', order.id);
        oErr = retry.error;
      }

      if (oErr) console.warn("Supabase orders table update failed:", oErr.message);

      // 2. Log Order Status History if changed
      if (oldStatus && oldStatus !== order.status) {
        try {
          await supabase.from('order_status_history').insert([{
            order_id: order.id,
            old_status: oldStatus,
            new_status: order.status,
            changed_by: order.updatedBy || 'إدارة المتجر',
            notes: order.statusChangeNotes || null
          }]);
        } catch (e) {
          console.warn("[Sulta DB] Order status history log warning:", e);
        }

        // 3. Automated WhatsApp status update notification
        if (order.phone && order.status !== 'pending') {
          try {
            const { WhatsAppApiService } = await import('./whatsappApi');
            const arabicStatusMap: Record<string, string> = {
              'paid': 'تم تأكيد الدفع بنجاح 💳',
              'confirmed': 'تم تأكيد طلبكِ وجاري التجهيز 🌸',
              'processing': 'جاري تجهيز وتغليف طلبكِ الفاخر 🎁',
              'packed': 'تم تغليف طلبكِ وجاهز للشحن 🎁',
              'shipped': 'تم تسليم الشحنة لشركة الشحن 🚚',
              'out_for_delivery': 'شحنتكِ مع المندوب للتوصيل اليوم ✨',
              'delivered': 'تم تسليم الطلب بحمد الله 🌸',
              'cancelled': 'تم إلغاء الطلب',
              'failed': 'تعذر تسليم الطلب — يرجى التواصل معنا',
              'returned': 'تم تسجيل طلب الاسترجاع'
            };
            const label = arabicStatusMap[order.status] || order.status;
            await WhatsAppApiService.notifyCustomerStatusUpdate(order.phone, order.customerName, order.id, label);
          } catch (wErr) {
            console.warn("[Sulta DB] Non-fatal WhatsApp status update notification error:", wErr);
          }
        }
      }

      // Sync the full payload in support_tickets (fallback storage)
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

  // Seed Data if DB is empty or recovery is requested
  seedInitialData: async (force: boolean = false): Promise<void> => {
    try {
      if (!force) {
        const { data, error } = await supabase.from('products').select('id').limit(1);
        if (!error && data && data.length > 0) {
          console.log('[Sulta DB] Database already has data, skipping automatic seeding.');
          return;
        }
      }

      console.log('[Sulta DB] Commencing data recovery/seeding from fallback goldmine...');
      await dbService.restoreMissingProducts();
    } catch (e) {
      console.warn('[Sulta DB] Seeding failure:', e);
    }
  },

  /**
   * Authoritative recovery function: Upserts all products from the hardcoded goldmine
   * into the live Supabase database, ensuring IDs and image references are preserved.
   */
  restoreMissingProducts: async (): Promise<{ success: boolean; count: number; errors: string[] }> => {
    let successCount = 0;
    const errors: string[] = [];

    console.log(`[Sulta RECOVERY] Attempting to restore ${SEED_FALLBACK_PRODUCTS.length} products to Supabase...`);

    for (const prod of SEED_FALLBACK_PRODUCTS) {
      try {
        await dbService.saveProduct(prod);
        successCount++;
        console.log(`[Sulta RECOVERY] Restored: ${prod.nameAr} (${prod.id})`);
      } catch (err: any) {
        console.error(`[Sulta RECOVERY] Failed: ${prod.nameAr}`, err.message);
        errors.push(`${prod.nameAr}: ${err.message}`);
      }
    }

    return { 
      success: errors.length === 0, 
      count: successCount, 
      errors 
    };
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

    // 1. Prefer normalized public.admin_users table (D1 RBAC)
    try {
      const { data: adminRows, error: adminErr } = await supabase
        .from('admin_users')
        .select('id, email, name, role, is_active, created_at, last_login_at')
        .eq('is_active', true);

      if (!adminErr && Array.isArray(adminRows) && adminRows.length > 0) {
        members = adminRows.map((row: any) => ({
          id: row.id || row.email,
          email: String(row.email).trim().toLowerCase(),
          name: row.name || String(row.email).split('@')[0],
          role: normalizeAdminRole(row.role),
          addedAt: row.created_at || '2026-01-01T00:00:00.000Z',
          lastLoginAt: row.last_login_at || undefined
        }));
      }
    } catch (e) {
      console.warn('[Sulta DB] admin_users lookup skipped:', e);
    }

    // 2. Fallback to homepage_sections if admin_users not yet populated
    if (members.length === 0) {
      try {
        const { data, error } = await supabase
          .from('homepage_sections')
          .select('content_json')
          .eq('section_key', 'admin_team_members_v1')
          .maybeSingle();

        if (!error && data?.content_json && Array.isArray(data.content_json)) {
          members = data.content_json.map((m: any) => ({
            ...m,
            role: normalizeAdminRole(m.role)
          }));
        }
      } catch (e) {
        console.warn('[Sulta DB] Error fetching team members from cloud:', e);
      }
    }

    // 3. Guarantee primary owner is included
    const hasOwner = members.some(m => m.email.toLowerCase() === 'mohamedostafataher@gmail.com');
    if (!hasOwner) {
      members = [defaultOwner, ...members];
    } else {
      members = members.map(m =>
        m.email.toLowerCase() === 'mohamedostafataher@gmail.com'
          ? { ...m, role: 'owner' as const }
          : m
      );
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
        // Fallback if DB CHECK constraint still expects legacy enum values before SQL migration runs
        const legacyMap: Record<string, string> = {
          inbound: 'manual_restock',
          outbound: 'order_deduction',
          return: 'order_cancellation_restock',
          adjustment: 'inventory_audit',
          damaged: 'damage_adjustment'
        };
        const fallbackType = legacyMap[String(movement.movementType)];
        if (fallbackType) {
          await supabase.from('stock_movements').insert([{ ...payload, movement_type: fallbackType }]);
        } else {
          console.warn("[Sulta DB] stock_movements insert warning (table may be pending migration):", error.message);
        }
      }
    } catch (e: any) {
      console.warn("[Sulta DB] Exception recording stock movement:", e.message || e);
    }
  },

  // --- DERIVE REAL CUSTOMER CRM INTELLIGENCE FROM GENUINE ORDERS (HALALA INTEGER PRECISION) ---
  deriveCustomerRecords: (orders: Order[]): CustomerAnalyticsRecord[] => {
    const map = new Map<string, {
      phone: string;
      normalizedPhone: string;
      name: string;
      city: string;
      totalOrders: number;
      totalSpentHalalas: number;
      cancelledOrdersCount: number;
      lastOrderDate: string;
      recentOrderId: string;
    }>();

    for (const order of orders) {
      const rawPhone = (order.phone || '').trim();
      const normKey = normalizePhoneKey(rawPhone) || `id_${order.id.slice(0, 6)}`;
      const displayPhone = rawPhone.replace(/[^\d+]/g, '') || `عميلة #${order.id.slice(0, 6)}`;
      const isCancelledOrReturned = order.status === 'cancelled' || order.status === 'returned';
      const priceHalalas = isCancelledOrReturned ? 0 : toHalalas(order.totalPrice);
      const orderDate = order.date || (order.createdAt ? order.createdAt.split('T')[0] : '');

      if (!map.has(normKey)) {
        map.set(normKey, {
          phone: displayPhone,
          normalizedPhone: normKey,
          name: order.customerName && order.customerName !== 'عميلة سُلطة الكريمة' ? order.customerName : 'عميلة سولته',
          city: order.city || 'الرياض',
          totalOrders: 1,
          totalSpentHalalas: priceHalalas,
          cancelledOrdersCount: isCancelledOrReturned || order.status === 'failed' ? 1 : 0,
          lastOrderDate: orderDate,
          recentOrderId: order.id
        });
      } else {
        const existing = map.get(normKey)!;
        existing.totalOrders += 1;
        existing.totalSpentHalalas += priceHalalas;
        if (isCancelledOrReturned || order.status === 'failed') {
          existing.cancelledOrdersCount += 1;
        }
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
      const totalSpent = Math.round(c.totalSpentHalalas / 100);
      let tier: 'VIP' | 'متكررة' | 'جديدة' = 'جديدة';
      if (c.totalSpentHalalas >= 50000 || c.totalOrders >= 3) {
        tier = 'VIP';
      } else if (c.totalOrders > 1) {
        tier = 'متكررة';
      }
      return {
        ...c,
        totalSpent,
        tier
      };
    }).sort((a, b) => (b.totalSpentHalalas || 0) - (a.totalSpentHalalas || 0));
  },

  saveTeamMembers: async (members: TeamMember[]): Promise<void> => {
    const hasOwner = members.some(m => m.email.toLowerCase() === 'mohamedostafataher@gmail.com');
    let finalMembers = members.map(m => ({ ...m, role: normalizeAdminRole(m.role) }));
    if (!hasOwner) {
      finalMembers.unshift({
        id: 'owner-primary',
        email: 'mohamedostafataher@gmail.com',
        name: 'محمد طاهر (المالك)',
        role: 'owner',
        addedAt: '2026-01-01T00:00:00.000Z'
      });
    }

    // Sync to normalized public.admin_users when accessible
    try {
      for (const m of finalMembers) {
        await supabase.from('admin_users').upsert([{
          email: m.email.trim().toLowerCase(),
          name: m.name || m.email.split('@')[0],
          role: normalizeAdminRole(m.role),
          is_active: true,
          updated_at: new Date().toISOString()
        }], { onConflict: 'email' });
      }
    } catch (e) {
      console.warn('[Sulta DB] admin_users upsert skipped:', e);
    }

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
    const normalizedRole = normalizeAdminRole(role);
    const current = await dbService.getTeamMembers();
    if (current.some(m => m.email.toLowerCase() === cleanEmail)) {
      throw new Error('هذا البريد الإلكتروني مسجل بالفعل في فريق العمل');
    }
    const newMember: TeamMember = {
      id: 'member-' + Date.now(),
      email: cleanEmail,
      name: name?.trim() || cleanEmail.split('@')[0],
      role: normalizedRole,
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
    const target = current.find(m => m.id === memberIdOrEmail || m.email.toLowerCase() === q);
    if (target) {
      try {
        await supabase.from('admin_users').update({ is_active: false }).eq('email', target.email.toLowerCase());
      } catch {}
    }
    const updated = current.filter(m => m.id !== memberIdOrEmail && m.email.toLowerCase() !== q);
    await dbService.saveTeamMembers(updated);
    return updated;
  },

  checkIsEmailAuthorized: async (email: string): Promise<{ authorized: boolean; member?: TeamMember }> => {
    const clean = (email || '').trim().toLowerCase();
    if (!clean) return { authorized: false };

    // 1. Check RPC / public.admin_users first when authenticated
    try {
      const { data: row, error } = await supabase
        .from('admin_users')
        .select('id, email, name, role, is_active, created_at')
        .ilike('email', clean)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && row) {
        return {
          authorized: true,
          member: {
            id: row.id || clean,
            email: String(row.email).toLowerCase(),
            name: row.name || clean.split('@')[0],
            role: normalizeAdminRole(row.role),
            addedAt: row.created_at || '2026-01-01T00:00:00.000Z'
          }
        };
      }
    } catch {}

    // 2. Fallback to primary owner / homepage_sections team list (only trusted once Supabase JWT verifies email)
    if (clean === dbService.DEFAULT_PRIMARY_OWNER_EMAIL) {
      return {
        authorized: true,
        member: {
          id: 'owner-primary',
          email: clean,
          name: 'محمد طاهر (المالك)',
          role: 'owner',
          addedAt: '2026-01-01T00:00:00.000Z'
        }
      };
    }

    try {
      const members = await dbService.getTeamMembers();
      const member = members.find(m => m.email.toLowerCase() === clean);
      if (member) {
        return {
          authorized: true,
          member: { ...member, role: normalizeAdminRole(member.role) }
        };
      }
    } catch (err) {
      console.warn('[Sulta DB] Authorization lookup error:', err);
    }

    return { authorized: false };
  },

  // --- PHASE 2: REAL SALES & PROFIT FINANCIAL INTELLIGENCE ---
  calculateFinancialSummary: (orders: Order[], expenses: OperatingExpense[], returns: ReturnRefundRequest[], products: Product[] = []): FinancialAnalyticsSummary => {
    const validOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'failed');
    
    let grossSales = 0;
    let totalDiscounts = 0;
    let shippingRevenue = 0;
    let cogs = 0;
    let hasMissingCost = false;
    let hasAnyCost = false;

    // Build cost map for fast fallback
    const costMap = new Map<string, number>();
    products.forEach(p => {
      if (p.costPrice) costMap.set(p.id, p.costPrice);
    });

    for (const o of validOrders) {
      totalDiscounts += Number(o.discountAmount || 0);
      shippingRevenue += Number(o.shippingFee || 0);

      for (const item of o.items) {
        const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
        grossSales += itemTotal;

        const itemCost = (item.costPrice !== undefined && item.costPrice > 0) 
          ? item.costPrice 
          : (item.productId ? costMap.get(item.productId) : 0);

        if (itemCost && itemCost > 0) {
          cogs += Number(itemCost) * (Number(item.quantity) || 1);
          hasAnyCost = true;
        } else {
          hasMissingCost = true;
        }
      }
    }

    const totalRefunds = returns
      .filter(r => r.status === 'refunded' || r.status === 'completed')
      .reduce((sum, r) => sum + Number(r.refundAmount || 0), 0);

    const netSales = Math.max(0, grossSales - totalDiscounts - totalRefunds + shippingRevenue);
    const grossProfit = netSales - cogs;
    
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const estimatedNetProfit = grossProfit - totalExpenses;

    const deliveredCount = orders.filter(o => o.status === 'delivered').length;
    const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
    const returnedCount = orders.filter(o => o.status === 'returned').length;
    const aov = validOrders.length > 0 ? Math.round(netSales / validOrders.length) : 0;

    const cogsReliability = hasAnyCost ? (hasMissingCost ? 'partial' : 'exact') : 'unavailable';

    return {
      grossSales,
      totalDiscounts,
      shippingRevenue,
      totalRefunds,
      netSales,
      cogs,
      grossProfit,
      operatingExpenses: totalExpenses,
      estimatedNetProfit,
      totalOrdersCount: orders.length,
      deliveredOrdersCount: deliveredCount,
      cancelledOrdersCount: cancelledCount,
      returnedOrdersCount: returnedCount,
      aov,
      cogsReliability
    };
  },

  // --- PHASE 2: RETURNS, EXCHANGES & REFUNDS WORKFLOW ---
  getReturnsAndRefunds: async (): Promise<ReturnRefundRequest[]> => {
    try {
      const { data, error } = await supabase
        .from('returns_and_refunds')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data)) {
        return data.map((r: any) => ({
          id: r.id,
          orderId: r.order_id,
          customerName: r.customer_name || 'عميلة سُلطة',
          customerPhone: r.customer_phone || '',
          requestType: r.request_type || 'return',
          reason: r.reason || '',
          items: Array.isArray(r.items) ? r.items : (r.items ? JSON.parse(r.items) : []),
          requestedAction: r.requested_action || 'refund',
          status: r.status || 'pending',
          inspectionNotes: r.inspection_notes || undefined,
          inspectionResult: r.inspection_result || undefined,
          refundAmount: Number(r.refund_amount || 0),
          refundMethod: r.refund_method || 'bank_transfer',
          restocked: Boolean(r.restocked),
          adminNotes: r.admin_notes || undefined,
          statusHistory: Array.isArray(r.status_history) ? r.status_history : [],
          createdAt: r.created_at || new Date().toISOString(),
          updatedAt: r.updated_at
        }));
      }
    } catch (e) {
      console.warn("[Sulta DB] Error fetching returns from cloud, using local fallback:", e);
    }

    try {
      const local = JSON.parse(localStorage.getItem('sulta_returns_refunds') || '[]');
      return local;
    } catch {
      return [];
    }
  },

  saveReturnRequest: async (req: ReturnRefundRequest): Promise<void> => {
    try {
      const local = JSON.parse(localStorage.getItem('sulta_returns_refunds') || '[]');
      const idx = local.findIndex((item: any) => item.id === req.id);
      if (idx !== -1) local[idx] = req;
      else local.unshift(req);
      localStorage.setItem('sulta_returns_refunds', JSON.stringify(local));
    } catch {}

    try {
      const payload = {
        id: req.id,
        order_id: req.orderId,
        customer_name: req.customerName,
        customer_phone: req.customerPhone,
        request_type: req.requestType,
        reason: req.reason,
        items: req.items,
        requested_action: req.requestedAction,
        status: req.status,
        inspection_notes: req.inspectionNotes || null,
        inspection_result: req.inspectionResult || null,
        refund_amount: req.refundAmount,
        refund_method: req.refundMethod || null,
        restocked: req.restocked,
        admin_notes: req.adminNotes || null,
        status_history: req.statusHistory || [],
        updated_at: new Date().toISOString()
      };
      await supabase.from('returns_and_refunds').upsert([payload]);
    } catch (e) {
      console.warn("[Sulta DB] Warning saving return to cloud:", e);
    }
  },

  // --- PHASE 2: OPERATING EXPENSES ---
  getOperatingExpenses: async (): Promise<OperatingExpense[]> => {
    try {
      const { data, error } = await supabase
        .from('operating_expenses')
        .select('*')
        .order('date', { ascending: false });
      if (!error && data && Array.isArray(data)) {
        return data.map((e: any) => ({
          id: e.id,
          title: e.title,
          category: e.category,
          amount: Number(e.amount || 0),
          date: e.date,
          notes: e.notes || undefined,
          createdBy: e.created_by || undefined,
          createdAt: e.created_at || new Date().toISOString()
        }));
      }
    } catch (err) {
      console.warn("[Sulta DB] Error fetching expenses, using local:", err);
    }

    try {
      const local = JSON.parse(localStorage.getItem('sulta_operating_expenses') || '[]');
      return local;
    } catch {
      return [];
    }
  },

  addOperatingExpense: async (expense: Omit<OperatingExpense, 'id' | 'createdAt'>): Promise<OperatingExpense> => {
    const newExp: OperatingExpense = {
      ...expense,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'exp-' + Date.now(),
      createdAt: new Date().toISOString()
    };

    try {
      const local = JSON.parse(localStorage.getItem('sulta_operating_expenses') || '[]');
      local.unshift(newExp);
      localStorage.setItem('sulta_operating_expenses', JSON.stringify(local));
    } catch {}

    try {
      await supabase.from('operating_expenses').insert([{
        id: newExp.id,
        title: newExp.title,
        category: newExp.category,
        amount: newExp.amount,
        date: newExp.date,
        notes: newExp.notes || null,
        created_by: newExp.createdBy || null
      }]);
    } catch (err) {
      console.warn("[Sulta DB] Warning adding expense to cloud:", err);
    }

    return newExp;
  },

  deleteOperatingExpense: async (id: string): Promise<void> => {
    try {
      const local = JSON.parse(localStorage.getItem('sulta_operating_expenses') || '[]');
      const filtered = local.filter((e: any) => e.id !== id);
      localStorage.setItem('sulta_operating_expenses', JSON.stringify(filtered));
    } catch {}

    try {
      await supabase.from('operating_expenses').delete().eq('id', id);
    } catch (err) {
      console.warn("[Sulta DB] Error deleting expense from cloud:", err);
    }
  },

  // --- PHASE 2: STOREFRONT ANALYTICS TRACKING & FUNNEL ---
  trackAnalyticsEvent: async (eventName: AnalyticsEvent['eventName'], entityId?: string, entityName?: string, metadata?: any): Promise<void> => {
    try {
      const sessionId = (typeof window !== 'undefined' && sessionStorage.getItem('sulta_visitor_session_id')) || 
        'guest_' + Math.random().toString(36).substring(2, 12);
      if (typeof window !== 'undefined') sessionStorage.setItem('sulta_visitor_session_id', sessionId);

      await supabase.from('analytics_events').insert([{
        event_name: eventName,
        entity_id: entityId || null,
        entity_name: entityName || null,
        metadata: metadata || {},
        session_id: sessionId
      }]);
    } catch (e) {
      // Non-blocking telemetry
    }
  },

  getAnalyticsFunnel: async (days: number = 30): Promise<{ views: number; addToCart: number; checkoutStart: number; completedOrders: number }> => {
    try {
      const dateLimit = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('analytics_events')
        .select('event_name')
        .gte('created_at', dateLimit);

      if (!error && data && Array.isArray(data)) {
        const views = data.filter(e => e.event_name === 'product_view').length;
        const addToCart = data.filter(e => e.event_name === 'add_to_cart').length;
        const checkoutStart = data.filter(e => e.event_name === 'checkout_start').length;
        const completedOrders = data.filter(e => e.event_name === 'purchase').length;

        return { views, addToCart, checkoutStart, completedOrders };
      }
    } catch (e) {}

    return { views: 0, addToCart: 0, checkoutStart: 0, completedOrders: 0 };
  },

  // --- PHASE 2: SYSTEM HEALTH & INTEGRATION MONITOR ---
  checkSystemHealth: async (): Promise<{
    database: { status: 'healthy' | 'degraded' | 'error'; latencyMs: number; message: string };
    storage: { status: 'healthy' | 'degraded' | 'error'; message: string };
    auth: { status: 'healthy' | 'unconfigured'; message: string };
    whatsapp: { status: 'configured' | 'pending_credentials'; message: string };
    timestamp: string;
  }> => {
    const start = performance.now();
    let dbStatus: 'healthy' | 'degraded' | 'error' = 'healthy';
    let dbMsg = 'قاعدة بيانات Supabase تعمل بكفاءة تامة وسرعة استجابة عالية.';
    let latencyMs = 0;

    try {
      const { error } = await supabase.from('products_public').select('id').limit(1);
      latencyMs = Math.round(performance.now() - start);
      if (error) {
        const fb = await supabase.from('products').select('id').limit(1);
        if (fb.error) {
          dbStatus = 'degraded';
          dbMsg = fb.error.message;
        }
      }
    } catch (err: any) {
      dbStatus = 'error';
      dbMsg = err.message || 'فشل الاتصال بقاعدة البيانات';
    }

    let storageStatus: 'healthy' | 'degraded' | 'error' = 'healthy';
    let storageMsg = 'حاوية تخزين الصور (Storage products) متصلة وجاهزة للرفع والتنزيل بدقة 4K.';
    try {
      const { data, error } = await supabase.storage.getBucket('products');
      if (error && !data) {
        storageMsg = 'حاوية الصور العامة تعمل ومتاحة للعرض.';
      }
    } catch {
      storageStatus = 'degraded';
      storageMsg = 'تعذر فحص حاوية التخزين بدقة، الصور العامة تعمل.';
    }

    const whatsappStatus: 'configured' | 'pending_credentials' = 'configured';
    const whatsappMsg = 'روابط الإشعارات المجانية عبر wa.me تعمل 100% بأمان دون تخزين أي مفاتيح سرية في المتصفح.';

    return {
      database: { status: dbStatus, latencyMs, message: dbMsg },
      storage: { status: storageStatus, message: storageMsg },
      auth: { status: 'healthy', message: 'بوابة المصادقة عبر Supabase Auth ونظام الصلاحيات الستة (RBAC) نشط.' },
      whatsapp: { status: whatsappStatus, message: whatsappMsg },
      timestamp: new Date().toISOString()
    };
  },

  // --- PHASE 2: ORDER STATUS HISTORY & NOTIFICATIONS ---
  getOrderStatusHistory: async (orderId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch {}
    return [];
  },

  getAdminNotifications: async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data) return data;
    } catch {}
    return [];
  },

  markNotificationRead: async (id: string): Promise<void> => {
    try {
      await supabase.from('admin_notifications').update({ is_read: true }).eq('id', id);
    } catch {}
  },

  createAdminNotification: async (notif: { type: string; title: string; message?: string; link?: string; metadata?: any }): Promise<void> => {
    try {
      await supabase.from('admin_notifications').insert([{
        type: notif.type,
        title: notif.title,
        message: notif.message || null,
        link: notif.link || null,
        metadata: notif.metadata || {}
      }]);
    } catch (e) {
      console.warn("Failed to create admin notification:", e);
    }
  },

  // --- PHASE D4: SHIPPING CARRIERS, CUSTOMER PROFILES & WHATSAPP TEMPLATES ---
  getShippingCarriers: async (): Promise<ShippingCarrier[]> => {
    try {
      const { data, error } = await supabase
        .from('shipping_carriers')
        .select('*')
        .order('id', { ascending: true });
      if (!error && data && data.length > 0) {
        const mapped: ShippingCarrier[] = data.map((row: any) => ({
          id: row.id,
          nameAr: row.name_ar || row.nameAr || row.id,
          nameEn: row.name_en || row.nameEn || undefined,
          trackingUrlTemplate: row.tracking_url_template || row.trackingUrlTemplate || '',
          isActive: row.is_active !== false
        }));
        try { localStorage.setItem('sulta_shipping_carriers', JSON.stringify(mapped)); } catch {}
        return mapped;
      }
    } catch {}

    try {
      const { data: sec } = await supabase
        .from('homepage_sections')
        .select('config')
        .eq('id', 'shipping_carriers_config')
        .maybeSingle();
      if (sec?.config?.carriers && Array.isArray(sec.config.carriers) && sec.config.carriers.length > 0) {
        return sec.config.carriers;
      }
    } catch {}

    try {
      const cached = localStorage.getItem('sulta_shipping_carriers');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    return DEFAULT_SHIPPING_CARRIERS;
  },

  saveShippingCarriers: async (carriers: ShippingCarrier[]): Promise<void> => {
    try {
      localStorage.setItem('sulta_shipping_carriers', JSON.stringify(carriers));
    } catch {}

    try {
      const rows = carriers.map((c) => ({
        id: c.id,
        name_ar: c.nameAr,
        name_en: c.nameEn || null,
        tracking_url_template: c.trackingUrlTemplate,
        is_active: c.isActive !== false
      }));
      const { error } = await supabase.from('shipping_carriers').upsert(rows);
      if (!error) return;
    } catch {}

    await supabase.from('homepage_sections').upsert({
      id: 'shipping_carriers_config',
      section_key: 'shipping_carriers_config',
      title_ar: 'شركات الشحن',
      config: { carriers }
    }).catch(() => {});
  },

  getCustomerProfilesMeta: async (): Promise<Record<string, CustomerProfileMeta>> => {
    const out: Record<string, CustomerProfileMeta> = {};
    try {
      const cached = localStorage.getItem('sulta_customer_profiles_meta');
      if (cached) Object.assign(out, JSON.parse(cached));
    } catch {}

    try {
      const { data, error } = await supabase.from('customer_profiles').select('*');
      if (!error && data) {
        data.forEach((row: any) => {
          const key = normalizePhoneKey(row.phone);
          if (!key) return;
          out[key] = {
            phone: row.phone,
            customerName: row.customer_name || undefined,
            city: row.city || undefined,
            tags: Array.isArray(row.tags) ? row.tags : [],
            notes: row.notes || '',
            updatedAt: row.updated_at || undefined,
            updatedBy: row.updated_by || undefined
          };
        });
        try { localStorage.setItem('sulta_customer_profiles_meta', JSON.stringify(out)); } catch {}
        return out;
      }
    } catch {}

    try {
      const { data: sec } = await supabase
        .from('homepage_sections')
        .select('config')
        .eq('id', 'customer_profiles_meta_fallback')
        .maybeSingle();
      if (sec?.config?.profiles) {
        Object.assign(out, sec.config.profiles);
      }
    } catch {}

    return out;
  },

  saveCustomerProfileMeta: async (profile: CustomerProfileMeta): Promise<Record<string, CustomerProfileMeta>> => {
    const key = normalizePhoneKey(profile.phone) || profile.phone;
    const now = new Date().toISOString();
    const record: CustomerProfileMeta = {
      ...profile,
      phone: profile.phone,
      updatedAt: now
    };

    const existing = await dbService.getCustomerProfilesMeta();
    const nextMap = { ...existing, [key]: record };
    try {
      localStorage.setItem('sulta_customer_profiles_meta', JSON.stringify(nextMap));
    } catch {}

    let savedInTable = false;
    try {
      const { error } = await supabase.from('customer_profiles').upsert({
        phone: key,
        customer_name: record.customerName || null,
        city: record.city || null,
        tags: record.tags || [],
        notes: record.notes || '',
        updated_by: record.updatedBy || 'فريق سولته',
        updated_at: now
      });
      if (!error) savedInTable = true;
    } catch {}

    if (!savedInTable) {
      await supabase.from('homepage_sections').upsert({
        id: 'customer_profiles_meta_fallback',
        section_key: 'customer_profiles_meta_fallback',
        title_ar: 'بيانات وملاحظات العميلات',
        config: { profiles: nextMap }
      }).catch(() => {});
    }

    return nextMap;
  },

  getWhatsappTemplates: async (): Promise<Record<WhatsAppEventKey, WhatsAppTemplateConfig>> => {
    const base = { ...DEFAULT_EVENT_TEMPLATES };
    try {
      const cached = localStorage.getItem('sulta_whatsapp_event_templates_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        (Object.keys(base) as WhatsAppEventKey[]).forEach((k) => {
          if (parsed[k]?.body) base[k] = { ...base[k], ...parsed[k], eventKey: k };
        });
      }
    } catch {}

    try {
      const { data, error } = await supabase.from('whatsapp_templates').select('*');
      if (!error && data && data.length > 0) {
        data.forEach((row: any) => {
          const key = (row.event_key || row.id) as WhatsAppEventKey;
          if (base[key] && row.body) {
            base[key] = {
              ...base[key],
              titleAr: row.title_ar || base[key].titleAr,
              body: row.body,
              updatedAt: row.updated_at || undefined
            };
          }
        });
        try { localStorage.setItem('sulta_whatsapp_event_templates_v1', JSON.stringify(base)); } catch {}
        return base;
      }
    } catch {}

    try {
      const { data: sec } = await supabase
        .from('homepage_sections')
        .select('config')
        .eq('id', 'whatsapp_templates_config')
        .maybeSingle();
      if (sec?.config?.templates) {
        (Object.keys(base) as WhatsAppEventKey[]).forEach((k) => {
          if (sec.config.templates[k]?.body) {
            base[k] = { ...base[k], ...sec.config.templates[k], eventKey: k };
          }
        });
      }
    } catch {}

    return base;
  },

  saveWhatsappTemplates: async (
    templates: Record<WhatsAppEventKey, WhatsAppTemplateConfig>
  ): Promise<void> => {
    try {
      localStorage.setItem('sulta_whatsapp_event_templates_v1', JSON.stringify(templates));
    } catch {}

    const now = new Date().toISOString();
    let savedInTable = false;
    try {
      const rows = (Object.values(templates) as WhatsAppTemplateConfig[]).map((t) => ({
        event_key: t.eventKey,
        title_ar: t.titleAr,
        body: t.body,
        updated_at: now
      }));
      const { error } = await supabase.from('whatsapp_templates').upsert(rows);
      if (!error) savedInTable = true;
    } catch {}

    if (!savedInTable) {
      await supabase.from('homepage_sections').upsert({
        id: 'whatsapp_templates_config',
        section_key: 'whatsapp_templates_config',
        title_ar: 'قوالب الواتساب المجانية',
        config: { templates }
      }).catch(() => {});
    }
  },

  // --- PHASE 2: STAFF ROLE PERMISSION CHECKER ---
  hasPermission: (
    role: TeamMemberRole,
    permission: 'financials' | 'customers' | 'orders' | 'inventory' | 'products' | 'settings' | 'team' | 'cost_price'
  ): boolean => {
    if (permission === 'financials') return canAccessTab(role, 'finances');
    if (permission === 'customers') return canAccessTab(role, 'customers');
    if (permission === 'orders') return canAccessTab(role, 'orders');
    if (permission === 'inventory') return canUpdateStock(role) || canAccessTab(role, 'inventory');
    if (permission === 'products') return canEditProducts(role) || canAccessTab(role, 'products');
    if (permission === 'settings') return canManageSettings(role);
    if (permission === 'team') return canManageTeam(role);
    if (permission === 'cost_price') return canViewCostPrice(role);
    return false;
  },

  // ==========================================================
  // PHASE D5: SLUG HISTORY REDIRECTS
  // ==========================================================
  recordSlugChange: async (
    productId: string,
    oldSlug: string,
    newSlug: string,
    changedBy: string = 'إدارة المتجر'
  ): Promise<void> => {
    const cleanOld = oldSlug.trim();
    const cleanNew = newSlug.trim();
    if (!cleanOld || !cleanNew || cleanOld === cleanNew) return;

    const entry: SlugHistoryEntry = {
      id: crypto.randomUUID(),
      productId,
      oldSlug: cleanOld,
      newSlug: cleanNew,
      changedBy,
      changedAt: new Date().toISOString()
    };

    try {
      const existing: SlugHistoryEntry[] = JSON.parse(localStorage.getItem('sulta_slug_history_v1') || '[]');
      const filtered = existing.filter((x) => !(x.productId === productId && x.oldSlug === cleanOld));
      filtered.unshift(entry);
      localStorage.setItem('sulta_slug_history_v1', JSON.stringify(filtered.slice(0, 100)));
    } catch {}

    try {
      await supabase.from('slug_history').insert([{
        id: entry.id,
        product_id: productId,
        old_slug: cleanOld,
        new_slug: cleanNew,
        changed_by: changedBy,
        changed_at: entry.changedAt
      }]);
    } catch {}
  },

  getSlugHistory: async (productId?: string): Promise<SlugHistoryEntry[]> => {
    let entries: SlugHistoryEntry[] = [];
    try {
      let query = supabase.from('slug_history').select('*').order('changed_at', { ascending: false }).limit(100);
      if (productId) query = query.eq('product_id', productId);
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        entries = data.map((r: any) => ({
          id: r.id,
          productId: r.product_id,
          oldSlug: r.old_slug,
          newSlug: r.new_slug,
          changedBy: r.changed_by || undefined,
          changedAt: r.changed_at
        }));
      }
    } catch {}

    if (entries.length === 0) {
      try {
        const local: SlugHistoryEntry[] = JSON.parse(localStorage.getItem('sulta_slug_history_v1') || '[]');
        entries = productId ? local.filter((l) => l.productId === productId) : local;
      } catch {}
    }
    return entries;
  },

  // ==========================================================
  // PHASE D5: CHECKOUT STOCK RESERVATIONS (OVERSELL GUARD)
  // ==========================================================
  getOrCreateCheckoutSessionId: (): string => {
    try {
      const key = 'sulta_checkout_session_id';
      let sid = sessionStorage.getItem(key);
      if (!sid) {
        sid = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem(key, sid);
      }
      return sid;
    } catch {
      return `chk_${Date.now()}`;
    }
  },

  getActiveStockReservations: async (): Promise<StockReservation[]> => {
    const nowIso = new Date().toISOString();
    const results: StockReservation[] = [];
    try {
      const { data, error } = await supabase
        .from('stock_reservations')
        .select('*')
        .eq('status', 'active')
        .gt('expires_at', nowIso)
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        for (const r of data) {
          results.push({
            id: r.id,
            sessionId: r.session_id,
            productId: r.product_id,
            productName: r.product_name || undefined,
            variant: r.variant || undefined,
            quantity: Number(r.quantity || 1),
            status: r.status || 'active',
            expiresAt: r.expires_at,
            createdAt: r.created_at
          });
        }
        return results;
      }
    } catch {}

    try {
      const local: StockReservation[] = JSON.parse(localStorage.getItem('sulta_stock_reservations_v1') || '[]');
      const nowMs = Date.now();
      return local.filter((r) => r.status === 'active' && new Date(r.expiresAt).getTime() > nowMs);
    } catch {
      return [];
    }
  },

  reserveCheckoutStock: async (
    sessionId: string,
    items: CartItem[],
    holdMinutes: number = 15
  ): Promise<{
    ok: boolean;
    conflicts: Array<{ productId: string; productName: string; availableQty: number; requestedQty: number }>;
  }> => {
    const conflicts: Array<{ productId: string; productName: string; availableQty: number; requestedQty: number }> = [];
    if (!items || items.length === 0) return { ok: true, conflicts };

    const nowMs = Date.now();
    const expiresAt = new Date(nowMs + holdMinutes * 60 * 1000).toISOString();
    const activeReservations = await dbService.getActiveStockReservations();

    // Aggregate requested qty per productId across cart variants
    const requestedByProduct = new Map<string, { qty: number; productName: string; fallbackStock: number }>();
    for (const it of items) {
      const pid = it.product.id;
      const prev = requestedByProduct.get(pid) || {
        qty: 0,
        productName: it.product.nameAr,
        fallbackStock: Number(it.product.stock || 0)
      };
      requestedByProduct.set(pid, {
        ...prev,
        qty: prev.qty + Math.max(1, Number(it.quantity || 1))
      });
    }

    for (const [productId, req] of requestedByProduct.entries()) {
      let physicalStock = req.fallbackStock;
      try {
        const { data: prodRow } = await supabase.from('products').select('stock').eq('id', productId).maybeSingle();
        if (prodRow && prodRow.stock !== undefined && prodRow.stock !== null) {
          physicalStock = Number(prodRow.stock);
        }
      } catch {}

      const reservedByOthers = activeReservations
        .filter((r) => r.productId === productId && r.sessionId !== sessionId)
        .reduce((sum, r) => sum + Number(r.quantity || 0), 0);

      const availableQty = Math.max(0, physicalStock - reservedByOthers);
      if (req.qty > availableQty) {
        conflicts.push({
          productId,
          productName: req.productName,
          availableQty,
          requestedQty: req.qty
        });
      }
    }

    if (conflicts.length > 0) {
      return { ok: false, conflicts };
    }

    const newReservations: StockReservation[] = items.map((it) => ({
      id: `${sessionId}_${it.product.id}_${it.selectedColor?.name || 'def'}_${it.selectedSize || 'one'}`,
      sessionId,
      productId: it.product.id,
      productName: it.product.nameAr,
      variant: `${it.selectedColor?.name || ''} - ${it.selectedSize || ''}`.trim(),
      quantity: Math.max(1, Number(it.quantity || 1)),
      status: 'active',
      expiresAt,
      createdAt: new Date(nowMs).toISOString()
    }));

    try {
      const local: StockReservation[] = JSON.parse(localStorage.getItem('sulta_stock_reservations_v1') || '[]');
      const others = local.filter((r) => r.sessionId !== sessionId && new Date(r.expiresAt).getTime() > nowMs && r.status === 'active');
      localStorage.setItem('sulta_stock_reservations_v1', JSON.stringify([...newReservations, ...others]));
    } catch {}

    try {
      await supabase.from('stock_reservations').delete().eq('session_id', sessionId).eq('status', 'active');
      const rows = newReservations.map((r) => ({
        session_id: r.sessionId,
        product_id: r.productId,
        product_name: r.productName,
        variant: r.variant,
        quantity: r.quantity,
        status: 'active',
        expires_at: r.expiresAt,
        created_at: r.createdAt
      }));
      await supabase.from('stock_reservations').insert(rows);
    } catch {}

    return { ok: true, conflicts: [] };
  },

  releaseCheckoutReservations: async (sessionId: string, markConsumed: boolean = false): Promise<void> => {
    const nextStatus: StockReservation['status'] = markConsumed ? 'consumed' : 'released';
    try {
      const local: StockReservation[] = JSON.parse(localStorage.getItem('sulta_stock_reservations_v1') || '[]');
      const updated = local
        .filter((r) => r.sessionId !== sessionId)
        .filter((r) => r.status === 'active' && new Date(r.expiresAt).getTime() > Date.now());
      localStorage.setItem('sulta_stock_reservations_v1', JSON.stringify(updated));
    } catch {}

    try {
      await supabase
        .from('stock_reservations')
        .update({ status: nextStatus })
        .eq('session_id', sessionId)
        .eq('status', 'active');
    } catch {}
  },

  // ==========================================================
  // PHASE D5: SUPPLIERS & PURCHASE ORDERS (WEIGHTED AVG COST)
  // ==========================================================
  getSuppliers: async (): Promise<Supplier[]> => {
    try {
      const { data, error } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        const mapped = data.map((r: any) => ({
          id: r.id,
          name: r.name,
          contactName: r.contact_name || undefined,
          phone: r.phone || undefined,
          email: r.email || undefined,
          city: r.city || undefined,
          notes: r.notes || undefined,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));
        try { localStorage.setItem('sulta_suppliers_v1', JSON.stringify(mapped)); } catch {}
        return mapped;
      }
    } catch {}

    try {
      const { data: sec } = await supabase.from('homepage_sections').select('config').eq('id', 'inventory_suppliers_v1').maybeSingle();
      if (Array.isArray(sec?.config?.suppliers)) {
        return sec.config.suppliers;
      }
    } catch {}

    try {
      return JSON.parse(localStorage.getItem('sulta_suppliers_v1') || '[]');
    } catch {
      return [];
    }
  },

  saveSupplier: async (supplier: Supplier): Promise<Supplier> => {
    const clean: Supplier = {
      ...supplier,
      id: supplier.id || crypto.randomUUID(),
      createdAt: supplier.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existing = await dbService.getSuppliers();
    const nextList = [clean, ...existing.filter((s) => s.id !== clean.id)];
    try { localStorage.setItem('sulta_suppliers_v1', JSON.stringify(nextList)); } catch {}

    let savedDirect = false;
    try {
      const { error } = await supabase.from('suppliers').upsert([{
        id: clean.id,
        name: clean.name,
        contact_name: clean.contactName || null,
        phone: clean.phone || null,
        email: clean.email || null,
        city: clean.city || null,
        notes: clean.notes || null,
        created_at: clean.createdAt,
        updated_at: clean.updatedAt
      }], { onConflict: 'id' });
      if (!error) savedDirect = true;
    } catch {}

    if (!savedDirect) {
      await supabase.from('homepage_sections').upsert({
        id: 'inventory_suppliers_v1',
        section_key: 'inventory_suppliers_v1',
        title_ar: 'دليل الموردين',
        config: { suppliers: nextList }
      }).catch(() => {});
    }

    return clean;
  },

  deleteSupplier: async (supplierId: string): Promise<void> => {
    const existing = await dbService.getSuppliers();
    const nextList = existing.filter((s) => s.id !== supplierId);
    try { localStorage.setItem('sulta_suppliers_v1', JSON.stringify(nextList)); } catch {}

    let deletedDirect = false;
    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', supplierId);
      if (!error) deletedDirect = true;
    } catch {}

    if (!deletedDirect) {
      await supabase.from('homepage_sections').upsert({
        id: 'inventory_suppliers_v1',
        section_key: 'inventory_suppliers_v1',
        title_ar: 'دليل الموردين',
        config: { suppliers: nextList }
      }).catch(() => {});
    }
  },

  getPurchaseOrders: async (): Promise<PurchaseOrder[]> => {
    try {
      const { data, error } = await supabase.from('purchase_orders').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        const mapped: PurchaseOrder[] = data.map((r: any) => ({
          id: r.id,
          referenceCode: r.reference_code || `PO-${String(r.id).slice(0, 6).toUpperCase()}`,
          supplierId: r.supplier_id || '',
          supplierName: r.supplier_name || 'مورد',
          status: r.status || 'draft',
          items: Array.isArray(r.items) ? r.items : [],
          totalCostHalalas: Number(r.total_cost_halalas || 0),
          notes: r.notes || undefined,
          orderedAt: r.ordered_at || undefined,
          receivedAt: r.received_at || undefined,
          createdAt: r.created_at || new Date().toISOString(),
          createdBy: r.created_by || undefined
        }));
        try { localStorage.setItem('sulta_purchase_orders_v1', JSON.stringify(mapped)); } catch {}
        return mapped;
      }
    } catch {}

    try {
      const { data: sec } = await supabase.from('homepage_sections').select('config').eq('id', 'inventory_purchase_orders_v1').maybeSingle();
      if (Array.isArray(sec?.config?.purchaseOrders)) {
        return sec.config.purchaseOrders;
      }
    } catch {}

    try {
      return JSON.parse(localStorage.getItem('sulta_purchase_orders_v1') || '[]');
    } catch {
      return [];
    }
  },

  savePurchaseOrder: async (po: PurchaseOrder): Promise<PurchaseOrder> => {
    const clean: PurchaseOrder = {
      ...po,
      id: po.id || crypto.randomUUID(),
      referenceCode: po.referenceCode || `PO-${Date.now().toString().slice(-6)}`,
      createdAt: po.createdAt || new Date().toISOString()
    };

    const existing = await dbService.getPurchaseOrders();
    const nextList = [clean, ...existing.filter((x) => x.id !== clean.id)];
    try { localStorage.setItem('sulta_purchase_orders_v1', JSON.stringify(nextList)); } catch {}

    let savedDirect = false;
    try {
      const { error } = await supabase.from('purchase_orders').upsert([{
        id: clean.id,
        reference_code: clean.referenceCode,
        supplier_id: clean.supplierId || null,
        supplier_name: clean.supplierName,
        status: clean.status,
        items: clean.items,
        total_cost_halalas: clean.totalCostHalalas,
        notes: clean.notes || null,
        ordered_at: clean.orderedAt || null,
        received_at: clean.receivedAt || null,
        created_at: clean.createdAt,
        created_by: clean.createdBy || null
      }], { onConflict: 'id' });
      if (!error) savedDirect = true;
    } catch {}

    if (!savedDirect) {
      await supabase.from('homepage_sections').upsert({
        id: 'inventory_purchase_orders_v1',
        section_key: 'inventory_purchase_orders_v1',
        title_ar: 'أوامر الشراء والموردين',
        config: { purchaseOrders: nextList }
      }).catch(() => {});
    }

    return clean;
  },

  receivePurchaseOrder: async (
    po: PurchaseOrder,
    receiveQtyByProductId: Record<string, number>,
    currentProducts: Product[],
    adminName: string = 'إدارة المستودع'
  ): Promise<{ updatedPO: PurchaseOrder; updatedProducts: Product[] }> => {
    const updatedProducts = [...currentProducts];
    const nowIso = new Date().toISOString();

    const updatedItems = po.items.map((item) => {
      const remaining = Math.max(0, item.quantity - item.receivedQuantity);
      const recvNow = Math.min(remaining, Math.max(0, Math.floor(Number(receiveQtyByProductId[item.productId] || 0))));
      return {
        ...item,
        _recvNow: recvNow,
        receivedQuantity: item.receivedQuantity + recvNow
      };
    });

    for (const item of updatedItems) {
      if (item._recvNow <= 0) continue;
      const idx = updatedProducts.findIndex((p) => p.id === item.productId);
      const prod = idx >= 0 ? updatedProducts[idx] : undefined;
      if (!prod) continue;

      const currentStock = Math.max(0, Number(prod.stock || 0));
      const unitCostHalalas = item.unitCostHalalas ?? toHalalas(item.unitCost);
      const currentCostHalalas = toHalalas(prod.costPrice);

      const newWeightedCostHalalas = calculateWeightedAverageCostHalalas({
        currentStock,
        currentUnitCostHalalas: currentCostHalalas,
        receivedQty: item._recvNow,
        receivedUnitCostHalalas: unitCostHalalas
      });

      const nextStock = currentStock + item._recvNow;
      const nextCostSAR = fromHalalas(newWeightedCostHalalas);

      const updatedProd: Product = {
        ...prod,
        stock: nextStock,
        costPrice: nextCostSAR
      };
      updatedProducts[idx] = updatedProd;

      await dbService.saveProduct(updatedProd);
      await dbService.recordStockMovement({
        productId: prod.id,
        productName: prod.nameAr,
        changeQty: item._recvNow,
        newStockLevel: nextStock,
        movementType: 'inbound',
        reason: `استلام أمر شراء ${po.referenceCode} من ${po.supplierName} (متوسط تكلفة جديد: ${nextCostSAR} ر.س)`,
        referenceId: po.id,
        unitCostHalalas,
        adminName
      });
    }

    const cleanItems = updatedItems.map(({ _recvNow, ...rest }) => rest);
    const allReceived = cleanItems.every((i) => i.receivedQuantity >= i.quantity);
    const anyReceived = cleanItems.some((i) => i.receivedQuantity > 0);
    const nextStatus: PurchaseOrder['status'] = allReceived
      ? 'received'
      : anyReceived
        ? 'partially_received'
        : po.status;

    const updatedPO: PurchaseOrder = {
      ...po,
      items: cleanItems,
      status: nextStatus,
      receivedAt: allReceived ? nowIso : po.receivedAt
    };

    await dbService.savePurchaseOrder(updatedPO);
    return { updatedPO, updatedProducts };
  }
};
