import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { getProductSlug } from '../src/utils/slugify.js';
import { SEED_FALLBACK_PRODUCTS } from '../src/data/fallbackProducts.js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://fwadgmhabzaudusxghnh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_pYBVo5mba3tEpuMDxUlt6g_3aCk67gj';

const supabase = createClient(supabaseUrl, supabaseKey);
const BASE_URL = 'https://sulta.vercel.app';

function cleanImgUrl(url: any): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return '/img/sulta_default_1_1781140865386.webp';
  }
  return url.trim();
}

function truncateWordBoundary(text: string, maxLen = 154): string {
  if (!text || text.length <= maxLen) return text || '';
  const sub = text.substring(0, maxLen);
  const lastSpace = sub.lastIndexOf(' ');
  return (lastSpace > 0 ? sub.substring(0, lastSpace) : sub).trim();
}

function buildPageHtml(
  template: string,
  routePath: string,
  meta: {
    title: string;
    description: string;
    image?: string;
    type?: string;
    noindex?: boolean;
    jsonLd?: any[];
    bodyHtml?: string;
  }
): string {
  const cleanPath = routePath.split('?')[0].trim().replace(/^\/+/, '').replace(/\/+$/, '');
  const fullUrl = cleanPath ? `${BASE_URL}/${cleanPath}` : BASE_URL;
  
  const pageTitle = meta.title || 'بيجامات نسائية قطنية ومريحة في السعودية | سولته';
  const pageDesc = truncateWordBoundary(meta.description || 'تسوقي بيجامات نسائية قطنية ومريحة في السعودية من متجر سولته. أقمشة قطن ناعم وكوريشة بمقاس واحد 45-80 كجم مع توصيل سريع.');
  const rawImage = meta.image || '/img/sulta_hero_banner_real.webp';
  const absImage = rawImage.startsWith('http') ? rawImage : `${BASE_URL}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;

  let html = template;

  // Clean out template defaults to avoid duplicate canonical / description / OG tags
  html = html.replace(/<title>.*?<\/title>/gi, '');
  html = html.replace(/<meta\s+name=["']description["'][^>]*>/gi, '');
  html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '');
  html = html.replace(/<meta\s+property=["']og:title["'][^>]*>/gi, '');
  html = html.replace(/<meta\s+property=["']og:description["'][^>]*>/gi, '');
  html = html.replace(/<meta\s+property=["']og:url["'][^>]*>/gi, '');
  html = html.replace(/<meta\s+property=["']og:type["'][^>]*>/gi, '');
  html = html.replace(/<meta\s+property=["']og:site_name["'][^>]*>/gi, '');
  html = html.replace(/<meta\s+name=["']twitter:title["'][^>]*>/gi, '');
  html = html.replace(/<meta\s+name=["']twitter:description["'][^>]*>/gi, '');

  if (meta.noindex) {
    html = html.replace(/<meta\s+name=["']robots["'][^>]*>/gi, '');
  }

  const headTags = [
    `<title>${pageTitle}</title>`,
    `<meta name="description" content="${pageDesc}" />`,
    `<link rel="canonical" href="${fullUrl}" />`,
    `<meta property="og:type" content="${meta.type || 'website'}" />`,
    `<meta property="og:title" content="${pageTitle}" />`,
    `<meta property="og:description" content="${pageDesc}" />`,
    `<meta property="og:url" content="${fullUrl}" />`,
    `<meta property="og:site_name" content="سولته" />`,
    `<meta property="og:locale" content="ar_SA" />`,
    `<meta property="og:image" content="${absImage}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:type" content="${absImage.endsWith('.webp') ? 'image/webp' : 'image/jpeg'}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${pageTitle}" />`,
    `<meta name="twitter:description" content="${pageDesc}" />`,
    `<meta name="twitter:image" content="${absImage}" />`
  ];

  if (meta.noindex) {
    headTags.push(`<meta name="robots" content="noindex, nofollow" />`);
  }

  if (meta.jsonLd && meta.jsonLd.length > 0) {
    meta.jsonLd.forEach(schema => {
      headTags.push(`<script type="application/ld+json">${JSON.stringify(schema)}</script>`);
    });
  }

  html = html.replace('</head>', `  ${headTags.join('\n  ')}\n</head>`);

  if (meta.bodyHtml) {
    if (html.includes('<div id="root"></div>')) {
      html = html.replace('<div id="root"></div>', `<div id="root">${meta.bodyHtml}</div>`);
    } else {
      html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">${meta.bodyHtml}</div>`);
    }
  }

  return html;
}

async function runPrerender() {
  console.log('[Prerender] Starting static HTML generation...');

  const distDir = path.resolve(process.cwd(), 'dist');
  const templatePath = path.join(distDir, 'index.html');

  if (!fs.existsSync(templatePath)) {
    console.error('[Prerender] ERROR: dist/index.html does not exist. Run vite build first.');
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, 'utf-8');

  let rawProducts: any[] = [];
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (!error && data && data.length > 0) {
      rawProducts = data.filter((p: any) => p.status !== 'archived');
      console.log(`[Prerender] Fetched ${rawProducts.length} active products from Supabase.`);
    } else if (error) {
      console.warn('[Prerender] Supabase fetch warning, using fallback products:', error.message);
    }
  } catch (err) {
    console.warn('[Prerender] Supabase product fetch warning:', err);
  }

  if (rawProducts.length === 0) {
    rawProducts = SEED_FALLBACK_PRODUCTS.filter((p: any) => p.status !== 'archived');
    console.log(`[Prerender] Using ${rawProducts.length} seed fallback active products.`);
  }

  if (!rawProducts || rawProducts.length === 0) {
    console.error('[Prerender] FATAL: 0 products found. Halting build.');
    process.exit(1);
  }

  // Pre-rendered Static Pages
  const staticRoutes = [
    {
      path: '',
      title: 'بيجامات نسائية قطنية ومريحة في السعودية | سولته',
      description: truncateWordBoundary('تسوقي بيجامات نسائية قطنية ومريحة في السعودية من متجر سولته. أقمشة قطن ناعم وكوريشة بمقاس واحد يناسب 45 إلى 80 كجم مع توصيل سريع وتغليف أنيق.'),
      image: '/img/sulta_hero_banner_real.webp',
      bodyHtml: `<main dir="rtl" class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-3xl sm:text-4xl font-extrabold text-center my-6 text-gray-900">بيجامات نسائية قطنية ومريحة في السعودية — متجر سولته</h1>
        <div class="text-center text-gray-600 max-w-3xl mx-auto mb-8 text-sm sm:text-base leading-relaxed">
          <p>
            مرحباً بكِ في سولته، وجهتكِ الأولى لاختيار البيجامات النسائية القطنية في السعودية. نختار لكِ خامات القطن المريح عالي التهوية والقطن الكوريشة الناعم بقصّات أنثوية مريحة للمنزل والنوم. تتوفر تشكيلتنا بمقاس واحد عملي يناسب الأوزان من 45 إلى 80 كيلو مع شحن سريع وتوصيل لجميع مناطق المملكة.
          </p>
        </div>
        <section class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          ${rawProducts.map((p: any) => {
            const slug = p.slug || getProductSlug({ id: p.id, nameEn: p.name_en || p.nameEn, nameAr: p.name_ar || p.nameAr });
            const nameAr = p.name_ar || p.nameAr || p.name;
            const price = Number(p.price || p.price_sa || p.priceSA || 69);
            const stock = Number(p.stock ?? 0);
            const material = p.material || p.fabricAr || p.fabric_ar || 'قطن ناعم ومريح';
            const imgUrl = cleanImgUrl(Array.isArray(p.images) ? p.images[0] : p.image_url);
            const imageAlt = `${nameAr} من ${material} — متجر سولته`;
            return `
            <article class="border border-gray-200 rounded-2xl p-4 bg-white shadow-xs hover:shadow-md transition-shadow">
              <a href="/product/${slug}" class="block group">
                <img src="${imgUrl}" alt="${imageAlt}" class="w-full aspect-[3/4] object-cover rounded-xl" loading="lazy" width="600" height="800" />
                <h2 class="text-lg font-bold mt-4 text-gray-900 group-hover:text-[#A44C5C] transition-colors">${nameAr}</h2>
              </a>
              <p class="text-sm text-gray-500 mt-1">${material} — وان سايز (45-80 كجم)</p>
              <div class="mt-3 flex items-center justify-between">
                <span class="text-xl font-bold text-gray-900">${price} ر.س</span>
                <span class="text-xs bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full font-medium">${stock > 0 ? `متوفر (${stock} قطع)` : 'نفدت الكمية'}</span>
              </div>
            </article>
          `;
          }).join('')}
        </section>
      </main>`
    },
    {
      path: 'store',
      title: 'بيجامات نسائية قطن وملابس نوم قطنية | سولته',
      description: truncateWordBoundary('تصفحي تشكيلة بيجامات نسائية قطن وملابس نوم نسائية قطنية من متجر سولته بالسعودية. موديلات قطن كوريشة وقطن ناعم مقاس واحد 45-80 كجم مع شحن سريع.'),
      bodyHtml: `<main dir="rtl" class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-extrabold my-6 text-gray-900">بيجامات نسائية قطن — تشكيلة ملابس نوم قطنية من سولته</h1>
        <div class="text-gray-600 max-w-3xl mb-8 text-sm sm:text-base leading-relaxed">
          <p>
            استكشفي متجر سولته واختاري بيجامتكِ المفضلة من تشكيلة بيجامات نسائية قطن وملابس نوم قطنية مصممة لتناسب مختلف الأوقات المنزلية. تشمل التشكيلة بيجامات قطن كوريشة بطبعات زهرية وبيجامات قطن بحمالات ربط وموديلات ناعمة بمقاس واحد مريح يناسب من 45 إلى 80 كجم.
          </p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          ${rawProducts.map((p: any) => {
            const slug = p.slug || getProductSlug({ id: p.id, nameEn: p.name_en || p.nameEn, nameAr: p.name_ar || p.nameAr });
            const nameAr = p.name_ar || p.nameAr || p.name;
            const price = Number(p.price || p.price_sa || p.priceSA || 69);
            const stock = Number(p.stock ?? 0);
            const material = p.material || p.fabricAr || p.fabric_ar || 'قطن ناعم ومريح';
            const imgUrl = cleanImgUrl(Array.isArray(p.images) ? p.images[0] : p.image_url);
            const imageAlt = `${nameAr} من ${material} — متجر سولته`;
            return `
            <article class="border border-gray-200 rounded-2xl p-4 bg-white shadow-xs hover:shadow-md transition-shadow">
              <a href="/product/${slug}" class="block group">
                <img src="${imgUrl}" alt="${imageAlt}" class="w-full aspect-[3/4] object-cover rounded-xl" loading="lazy" width="600" height="800" />
                <h2 class="text-lg font-bold mt-3 text-gray-900 group-hover:text-[#A44C5C] transition-colors">${nameAr}</h2>
              </a>
              <p class="text-sm text-gray-500 mt-1">${material}</p>
              <div class="mt-2 flex items-center justify-between">
                <span class="text-lg font-bold text-gray-900">${price} ر.س</span>
                <span class="text-xs text-rose-600 font-medium">${stock > 0 ? `متوفر (${stock} قطع)` : 'نفدت الكمية'}</span>
              </div>
            </article>
          `;
          }).join('')}
        </div>
      </main>`
    },
    {
      path: 'new-arrivals',
      title: 'أحدث بيجامات نسائية قطنية وصل حديثًا | سولته',
      description: truncateWordBoundary('اكتشفي أحدث تصاميم ملابس النوم والبيجامات النسائية القطنية التي وصلت حديثاً إلى متجر سولته بالسعودية بمقاس واحد يناسب 45-80 كجم.'),
      bodyHtml: `<main dir="rtl" class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-extrabold my-6 text-gray-900">أحدث البيجامات النسائية القطنية من سولته</h1>
        <p class="text-gray-600 max-w-2xl mb-8 leading-relaxed">
          وصل حديثاً إلى متجر سولته: أحدث موديلات البيجامات النسائية بأقمشة قطنية ناعمة ومقاس وان سايز يناسب الأوزان من 45 إلى 80 كيلو. تسوقي أحدث الإضافات بكميات محدودة لضمان التميز.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          ${rawProducts.slice(0, 6).map((p: any) => {
            const slug = p.slug || getProductSlug({ id: p.id, nameEn: p.name_en || p.nameEn, nameAr: p.name_ar || p.nameAr });
            const nameAr = p.name_ar || p.nameAr || p.name;
            const price = Number(p.price || p.price_sa || p.priceSA || 69);
            const material = p.material || p.fabricAr || p.fabric_ar || 'قطن ناعم ومريح';
            const imgUrl = cleanImgUrl(Array.isArray(p.images) ? p.images[0] : p.image_url);
            return `
            <article class="border border-gray-200 rounded-2xl p-4 bg-white shadow-xs">
              <a href="/product/${slug}" class="block group">
                <img src="${imgUrl}" alt="${nameAr}" class="w-full aspect-[3/4] object-cover rounded-xl" loading="lazy" />
                <h2 class="text-lg font-bold mt-3 text-gray-900 group-hover:text-[#A44C5C]">${nameAr}</h2>
              </a>
              <p class="text-sm text-gray-500 mt-1">${material}</p>
              <span class="text-lg font-bold text-gray-900 mt-2 block">${price} ر.س</span>
            </article>
          `;
          }).join('')}
        </div>
      </main>`
    },
    {
      path: 'best-sellers',
      title: 'بيجامات نسائية قطن الأكثر طلباً ومبيعاً | سولته',
      description: truncateWordBoundary('تسوقي أكثر موديلات البيجامات النسائية القطنية طلباً في متجر سولته بالسعودية. خامات قطن ناعم ومقاس واحد مريح 45-80 كجم.'),
      bodyHtml: `<main dir="rtl" class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-extrabold my-6 text-gray-900">بيجامات نسائية قطن الأكثر طلباً — متجر سولته</h1>
        <p class="text-gray-600 max-w-2xl mb-8 leading-relaxed">
          القطع الأكثر طلباً وإعجاباً من عميلات سولته في السعودية: بيجامات قطن ناعم وقطن كوريشة بتصاميم مريحة ومقاس واحد انسيابي يناسب من 45 إلى 80 كيلو.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          ${rawProducts.filter((p: any) => p.is_best_seller || p.isBestSeller || true).slice(0, 6).map((p: any) => {
            const slug = p.slug || getProductSlug({ id: p.id, nameEn: p.name_en || p.nameEn, nameAr: p.name_ar || p.nameAr });
            const nameAr = p.name_ar || p.nameAr || p.name;
            const price = Number(p.price || p.price_sa || p.priceSA || 69);
            const material = p.material || p.fabricAr || p.fabric_ar || 'قطن ناعم ومريح';
            const imgUrl = cleanImgUrl(Array.isArray(p.images) ? p.images[0] : p.image_url);
            return `
            <article class="border border-gray-200 rounded-2xl p-4 bg-white shadow-xs">
              <a href="/product/${slug}" class="block group">
                <img src="${imgUrl}" alt="${nameAr}" class="w-full aspect-[3/4] object-cover rounded-xl" loading="lazy" />
                <h2 class="text-lg font-bold mt-3 text-gray-900 group-hover:text-[#A44C5C]">${nameAr}</h2>
              </a>
              <p class="text-sm text-gray-500 mt-1">${material}</p>
              <span class="text-lg font-bold text-gray-900 mt-2 block">${price} ر.س</span>
            </article>
          `;
          }).join('')}
        </div>
      </main>`
    },
    {
      path: 'offers',
      title: 'عروض وتخفيضات بيجامات نسائية قطن | سولته',
      description: truncateWordBoundary('عروض وتخفيضات حصرية على تشكيلة بيجامات نسائية قطن من متجر سولته بالسعودية. تسوقي بأفضل الأسعار مع توصيل سريع.'),
      bodyHtml: `<main dir="rtl" class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-extrabold my-6 text-gray-900">عروض وتخفيضات البيجامات النسائية القطنية — سولته</h1>
        <p class="text-gray-600 max-w-2xl mb-8 leading-relaxed">
          استفيدي من عروض وتخفيضات سولته على تشكيلة البيجامات النسائية القطنية المريحة. جميع القطع بمقاس وان سايز 45-80 كجم مع خيارات دفع آمنة وتوصيل موثوق.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          ${rawProducts.map((p: any) => {
            const slug = p.slug || getProductSlug({ id: p.id, nameEn: p.name_en || p.nameEn, nameAr: p.name_ar || p.nameAr });
            const nameAr = p.name_ar || p.nameAr || p.name;
            const price = Number(p.price || p.price_sa || p.priceSA || 69);
            const material = p.material || p.fabricAr || p.fabric_ar || 'قطن ناعم ومريح';
            const imgUrl = cleanImgUrl(Array.isArray(p.images) ? p.images[0] : p.image_url);
            return `
            <article class="border border-gray-200 rounded-2xl p-4 bg-white shadow-xs">
              <a href="/product/${slug}" class="block group">
                <img src="${imgUrl}" alt="${nameAr}" class="w-full aspect-[3/4] object-cover rounded-xl" loading="lazy" />
                <h2 class="text-lg font-bold mt-3 text-gray-900 group-hover:text-[#A44C5C]">${nameAr}</h2>
              </a>
              <p class="text-sm text-gray-500 mt-1">${material}</p>
              <span class="text-lg font-bold text-gray-900 mt-2 block">${price} ر.س</span>
            </article>
          `;
          }).join('')}
        </div>
      </main>`
    },
    {
      path: 'about',
      title: 'عن متجر سولته للبيجامات النسائية | قصتنا',
      description: truncateWordBoundary('تعرفي على متجر سولته السعودي المتخصص في أزياء النوم والبيجامات النسائية القطنية المريحة بمقاس وان سايز يناسب من 45 إلى 80 كجم.'),
      bodyHtml: `<main dir="rtl" class="max-w-4xl mx-auto px-4 py-12">
        <h1 class="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6 text-center">عن متجر سولته لأزياء النوم والبيجامات النسائية</h1>
        <div class="prose prose-lg text-gray-700 leading-relaxed space-y-4">
          <p>
            تأسس متجر سولته في المملكة العربية السعودية برؤية تركز على تقديم بيجامات وملابس نوم نسائية تجمع بين النعومة الفائقة، والأناقة الهادئة، والراحة اليومية داخل المنزل.
          </p>
          <p>
            نعتمد في خاماتنا على القطن الطبيعي المعالج والقطن الكوريشة خفيف الوزن عالي التهوية ليضمن راحة البشرة طوال الليل وأثناء جلسات البيت المريحة.
          </p>
          <p>
            تعتمد تشكيلتنا نظام المقاس الموحد (وان سايز) المدروس بعناية ليناسب الأوزان من 45 إلى 80 كجم بقصّات مرنة ومريحة بدون أي ضغط.
          </p>
          <div class="mt-8 pt-6 border-t border-gray-200 text-center">
            <a href="/store" class="inline-block bg-[#A44C5C] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#8e3f4d] transition-colors">
              تصفحي تشكيلة البيجامات
            </a>
          </div>
        </div>
      </main>`
    },
    {
      path: 'faq',
      title: 'الأسئلة الشائعة حول المقاسات والخامات والتوصيل | سولته',
      description: truncateWordBoundary('إجابات شاملة حول مقاسات بيجامات سولته (45-80 كجم)، خامات القطن وطرق الغسيل، الشحن لمدن السعودية وسياسة الاستبدال.'),
      bodyHtml: `<main dir="rtl" class="max-w-4xl mx-auto px-4 py-12">
        <h1 class="text-3xl font-extrabold text-gray-900 mb-8 text-center">الأسئلة الشائعة حول بيجامات سولته النسائية</h1>
        <div class="space-y-4">
          <details class="border border-gray-200 rounded-xl p-4 bg-white" open>
            <summary class="font-bold text-gray-900 cursor-pointer">ما هو نظام المقاس في بيجامات سولته؟</summary>
            <p class="mt-2 text-gray-600 leading-relaxed text-sm">تتوفر قطع سولته بنظام المقاس الموحد (One Size) الانسيابي والمريح، وهو مصمم بقصّة مرنة ومدروسة تناسب الأوزان من 45 إلى 80 كجم.</p>
          </details>
          <details class="border border-gray-200 rounded-xl p-4 bg-white">
            <summary class="font-bold text-gray-900 cursor-pointer">ما هي خامات البيجامات المستخدمة؟</summary>
            <p class="mt-2 text-gray-600 leading-relaxed text-sm">نستخدم خامات قطنية مريحة تشمل القطن الناعم المبرد والقطن الكوريشة خفيف الوزن عالي التهوية اللطيف على البشرة.</p>
          </details>
          <details class="border border-gray-200 rounded-xl p-4 bg-white">
            <summary class="font-bold text-gray-900 cursor-pointer">كيف أحافظ على البيجامة أثناء الغسيل؟</summary>
            <p class="mt-2 text-gray-600 leading-relaxed text-sm">يُفضل غسل القطع بماء بارد وبدون مبيضات (كلور)، مع تجنب التجفيف بحرارة عالية للحفاظ على نعومة النسيج وألوانه.</p>
          </details>
          <details class="border border-gray-200 rounded-xl p-4 bg-white">
            <summary class="font-bold text-gray-900 cursor-pointer">كم مدة ورسوم التوصيل في السعودية؟</summary>
            <p class="mt-2 text-gray-600 leading-relaxed text-sm">نوفر توصيلاً سريعاً لكافة مدن المملكة خلال 2 إلى 4 أيام عمل. رسوم الشحن 40 ر.س، والشحن مجاني للطلبات فوق 299 ر.س.</p>
          </details>
        </div>
      </main>`
    },
    {
      path: 'returns',
      title: 'سياسة الاستبدال والاسترجاع | متجر سولته',
      description: truncateWordBoundary('تعرفي على شروط وسياسة الاستبدال والاسترجاع المرنة في متجر سولته خلال 14 يوماً من الاستلام مع شروط الحفاظ على جودة القطعة.'),
      bodyHtml: `<main dir="rtl" class="max-w-4xl mx-auto px-4 py-12">
        <h1 class="text-3xl font-extrabold text-gray-900 mb-6 text-center">سياسة الاستبدال والاسترجاع في متجر سولته</h1>
        <div class="bg-white border border-gray-200 rounded-2xl p-6 text-gray-700 leading-relaxed space-y-4">
          <p>
            في متجر سولته، نحرص على رضاكِ التام وراحتكِ عند التسوق. ندعم سياسة استبدال واسترجاع مرنة وفق الشروط التالية:
          </p>
          <ul class="list-disc list-inside space-y-2 text-sm">
            <li>مدة الاسترجاع والاستبدال هي 14 يوماً من تاريخ استلام الطلب.</li>
            <li>يجب أن تكون القطعة في حالتها الأصلية غير ملبوسة وبكامل بطاقاتها وتغليفها الأصلي.</li>
            <li>يتم التواصل مباشرة مع خدمة العملاء عبر الواتساب لتنسيق استلام الشحنة وإعادة المبلغ أو استبدال القطعة.</li>
          </ul>
        </div>
      </main>`
    },
    { path: 'track-order', title: 'تتبع الطلب | سولته', description: 'تتبعي حالة طلبك وشحنتك في سولته.', noindex: true, bodyHtml: '' },
    { path: 'dashboard', title: 'لوحة الإدارة | سولته', description: 'لوحة التحكم والإدارة لمتجر سولته.', noindex: true, bodyHtml: '' }
  ];

  for (const page of staticRoutes) {
    const pageHtml = buildPageHtml(template, page.path, {
      title: page.title,
      description: page.description,
      noindex: page.noindex,
      bodyHtml: page.bodyHtml
    });

    if (page.path === '') {
      fs.writeFileSync(path.join(distDir, 'index.html'), pageHtml, 'utf-8');
    } else {
      const pageDir = path.join(distDir, page.path);
      if (!fs.existsSync(pageDir)) fs.mkdirSync(pageDir, { recursive: true });
      fs.writeFileSync(path.join(pageDir, 'index.html'), pageHtml, 'utf-8');
      fs.writeFileSync(path.join(distDir, `${page.path}.html`), pageHtml, 'utf-8');
    }
  }

  // Pre-render Active Product Pages
  let countProductPages = 0;
  for (const p of rawProducts) {
    try {
      const slug = p.slug || getProductSlug({ id: p.id, nameEn: p.name_en || p.nameEn, nameAr: p.name_ar || p.nameAr });
      const nameAr = p.name_ar || p.nameAr || p.name;
      const h1Text = p.h1 || `${nameAr} — قطن وان سايز`;
      let seoTitleText = p.seo_title || p.seoTitle || `${nameAr} | سولته`;
      // Ensure the brand suffix matches 'سولته' (with هـ)
      if (seoTitleText.includes('سولتة')) {
        seoTitleText = seoTitleText.replace(/سولتة/g, 'سولته');
      } else if (!seoTitleText.includes('سولته')) {
        seoTitleText = `${seoTitleText} | سولته`;
      }
      const rawDesc = p.description_ar || p.descriptionAr || p.description || '';
      const material = p.material || p.fabricAr || p.fabric_ar || 'قطن ناعم ومريح';
      let shortDesc = truncateWordBoundary(p.short_description || p.shortDescription || rawDesc || `${nameAr} من خامة ${material}. مقاس وان سايز يناسب من 45 إلى 80 كيلو من متجر سولته.`);
      if (shortDesc.includes('سولتة')) {
        shortDesc = shortDesc.replace(/سولتة/g, 'سولته');
      }
      const price = Number(p.price || p.price_sa || p.priceSA || 69);
      const stock = Number(p.stock ?? 0);
      const careInstructions = p.care_instructions || p.washInstructionsAr || p.wash_instructions_ar || 'تُغسل بمويه باردة، ويفضّل بدون كلور، وتجنّبي الحرارة العالية.';

      const productUrlPath = `product/${slug}`;
      const fullProductUrl = `${BASE_URL}/${productUrlPath}`;

      const primaryImg = cleanImgUrl(Array.isArray(p.images) ? p.images[0] : p.image_url);
      const absImage = primaryImg.startsWith('http') ? primaryImg : `${BASE_URL}${primaryImg.startsWith('/') ? '' : '/'}${primaryImg}`;

      const fabricTag = material ? ` من ${material}` : '';
      const imageAlt = `${nameAr}${fabricTag} — متجر سولته`;

      // Schema.org Product (STRICT: Real data only, NO fake reviews, NO fake ratings)
      const productJsonLd: any = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": nameAr,
        "image": [absImage],
        "description": shortDesc,
        "sku": p.sku || p.id,
        "brand": {
          "@type": "Brand",
          "name": "سولته"
        },
        "audience": {
          "@type": "PeopleAudience",
          "suggestedGender": "female"
        },
        "offers": {
          "@type": "Offer",
          "url": fullProductUrl,
          "priceCurrency": "SAR",
          "price": price,
          "availability": stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "itemCondition": "https://schema.org/NewCondition"
        }
      };

      if (material && typeof material === 'string' && material.trim() !== '') {
        productJsonLd.material = material.trim();
      }

      const sizeStr = p.size_info || (p.sizes && Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes.join(', ') : 'One Size (45-80 kg)');
      if (sizeStr && typeof sizeStr === 'string' && sizeStr.trim() !== '') {
        productJsonLd.size = sizeStr.trim();
      }

      if (p.colors && Array.isArray(p.colors) && p.colors[0]?.name && typeof p.colors[0].name === 'string' && p.colors[0].name.trim() !== '') {
        productJsonLd.color = p.colors[0].name.trim();
      }

      if (p.sale_ends_at && p.compare_at_price && p.compare_at_price > price) {
        productJsonLd.offers.priceValidUntil = p.sale_ends_at;
      }

      // BreadcrumbList Schema
      const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "الرئيسية",
            "item": BASE_URL
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "المتجر",
            "item": `${BASE_URL}/store`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": nameAr,
            "item": fullProductUrl
          }
        ]
      };

      // FAQPage Schema
      const faqJsonLd = {
        "@context": "https://schema.org/",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "ما المقاس؟",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "وان سايز يناسب من 45 إلى 80 كيلو."
            }
          },
          {
            "@type": "Question",
            "name": "من أي خامة؟",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": material.includes('كوريشة') ? 'قطن كوريشة ناعم ومريح.' : 'قطن ناعم ومريح.'
            }
          },
          {
            "@type": "Question",
            "name": "كيف أغسلها؟",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "بمويه باردة، ويفضّل بدون كلور، مع تجنّب الحرارة العالية."
            }
          },
          {
            "@type": "Question",
            "name": "هل الكمية متوفرة؟",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": stock > 0 ? `الكمية متوفرة (${stock} قطع متبقية).` : 'نفدت الكمية حالياً.'
            }
          }
        ]
      };

      const whatsappText = encodeURIComponent(`مرحباً سولته، أود الاستفسار والطلب لمنتج: ${nameAr}\nالرابط: ${fullProductUrl}`);
      const whatsappUrl = `https://wa.me/966552823677?text=${whatsappText}`;

      const bodyHtml = `<main dir="rtl" class="max-w-6xl mx-auto px-4 py-8">
        <div class="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-2xl flex items-center justify-between">
          <span>شحن مجاني لكافة مدن المملكة للطلبات فوق 299 ر.س 🇸🇦</span>
          <span class="text-emerald-600 text-xs">سولته</span>
        </div>

        <nav class="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
          <a href="/" class="hover:underline">الرئيسية</a> &gt; 
          <a href="/store" class="hover:underline">المتجر</a> &gt; 
          <span class="text-gray-900 font-medium">${nameAr}</span>
        </nav>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <img src="${primaryImg}" alt="${imageAlt}" class="w-full aspect-[3/4] object-cover rounded-3xl shadow-sm border border-gray-100" fetchpriority="high" width="800" height="1066" />
          </div>
          
          <div class="space-y-6 text-right">
            <div>
              ${stock <= 10 && stock > 0 ? `<span class="inline-block bg-rose-50 text-rose-700 text-xs font-bold px-3 py-1 rounded-full mb-2">متبقي ${stock} قطع فقط</span>` : ''}
              ${stock === 0 ? `<span class="inline-block bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full mb-2">نفدت الكمية</span>` : ''}
              <h1 class="text-2xl sm:text-3xl font-black text-gray-950">${h1Text}</h1>
              <div class="mt-2 flex items-center gap-3">
                <span class="text-2xl font-black text-[#A44C5C]">${price} ر.س</span>
                ${p.compare_at_price && p.compare_at_price > price && (!p.sale_ends_at || new Date(p.sale_ends_at) > new Date()) ? `<span class="text-sm text-gray-400 line-through">${p.compare_at_price} ر.س</span>` : ''}
              </div>
            </div>

            <div class="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2 text-sm text-gray-800">
              <p><strong>الخامة:</strong> ${material}</p>
              <p><strong>المقاس:</strong> وان سايز يناسب من 45 إلى 80 كيلو</p>
              <p><strong>طريقة الغسيل:</strong> ${careInstructions}</p>
            </div>

            <p class="text-gray-700 text-base leading-relaxed whitespace-pre-line">${rawDesc}</p>

            <div class="pt-2 text-xs text-gray-500">
              <span>تصفحي المزيد من </span>
              <a href="/store" class="text-[#A44C5C] font-bold hover:underline">تشكيلة البيجامات النسائية القطنية</a>
              <span> في متجر سولته.</span>
            </div>

            <div class="pt-2">
              <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold py-3.5 px-6 rounded-2xl shadow-sm transition-colors text-center text-base">
                طلب مباشر عبر واتساب
              </a>
            </div>

            <!-- Visible FAQ Accordion -->
            <div class="mt-8 pt-6 border-t border-gray-200">
              <h2 class="text-xl font-bold text-gray-900 mb-4">الأسئلة الشائعة حول هذا المنتج</h2>
              <div class="space-y-3">
                <details class="bg-white border border-gray-200 rounded-xl p-3.5" open>
                  <summary class="font-bold cursor-pointer text-gray-900">س: ما المقاس؟</summary>
                  <p class="mt-2 text-sm text-gray-700 leading-relaxed">ج: وان سايز يناسب من 45 إلى 80 كيلو.</p>
                </details>
                <details class="bg-white border border-gray-200 rounded-xl p-3.5">
                  <summary class="font-bold cursor-pointer text-gray-900">س: من أي خامة؟</summary>
                  <p class="mt-2 text-sm text-gray-700 leading-relaxed">ج: ${material.includes('كوريشة') ? 'قطن كوريشة ناعم ومريح.' : 'قطن ناعم ومريح.'}</p>
                </details>
                <details class="bg-white border border-gray-200 rounded-xl p-3.5">
                  <summary class="font-bold cursor-pointer text-gray-900">س: كيف أغسلها؟</summary>
                  <p class="mt-2 text-sm text-gray-700 leading-relaxed">ج: بمويه باردة، ويفضّل بدون كلور، مع تجنّب الحرارة العالية.</p>
                </details>
                <details class="bg-white border border-gray-200 rounded-xl p-3.5">
                  <summary class="font-bold cursor-pointer text-gray-900">س: هل الكمية متوفرة؟</summary>
                  <p class="mt-2 text-sm text-gray-700 leading-relaxed">ج: ${stock > 0 ? `الكمية متوفرة (${stock} قطع متبقية).` : 'نفدت الكمية حالياً.'}</p>
                </details>
              </div>
            </div>

            <!-- Similar products section with real links -->
            <div class="mt-8 pt-6 border-t border-gray-200">
              <h2 class="text-lg font-bold text-gray-900 mb-3">منتجات مشابهة</h2>
              <div class="grid grid-cols-2 gap-3">
                ${rawProducts.filter((sim: any) => sim.id !== p.id).slice(0, 2).map((sim: any) => {
                  const simSlug = sim.slug || getProductSlug({ id: sim.id, nameEn: sim.name_en || sim.nameEn, nameAr: sim.name_ar || sim.nameAr });
                  const simName = sim.name_ar || sim.nameAr || sim.name;
                  const simMaterial = sim.material || sim.fabricAr || sim.fabric_ar || 'قطن مريح';
                  return `
                  <a href="/product/${simSlug}" class="block p-2 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <img src="${cleanImgUrl(sim.images?.[0])}" alt="${simName} من ${simMaterial}" class="w-full aspect-[3/4] object-cover rounded-lg mb-2" loading="lazy" />
                    <span class="text-xs font-bold text-gray-900 line-clamp-1 block">${simName}</span>
                    <span class="text-xs font-bold text-[#A44C5C] mt-1 block">${sim.price || sim.price_sa || sim.priceSA || 69} ر.س</span>
                  </a>`;
                }).join('')}
              </div>
            </div>

          </div>
        </div>
      </main>`;

      const pageHtml = buildPageHtml(template, productUrlPath, {
        title: seoTitleText,
        description: shortDesc,
        image: primaryImg,
        type: 'product',
        jsonLd: [productJsonLd, breadcrumbJsonLd, faqJsonLd],
        bodyHtml
      });

      // 1. Output to dist/product/{slug}/index.html and dist/product/{slug}.html
      const prodDirSlug = path.join(distDir, 'product', slug);
      if (!fs.existsSync(prodDirSlug)) fs.mkdirSync(prodDirSlug, { recursive: true });
      fs.writeFileSync(path.join(prodDirSlug, 'index.html'), pageHtml, 'utf-8');
      fs.writeFileSync(path.join(distDir, 'product', `${slug}.html`), pageHtml, 'utf-8');

      // 2. Output to dist/product/{id}/index.html for UUID direct navigation
      if (p.id) {
        const prodDirId = path.join(distDir, 'product', p.id);
        if (!fs.existsSync(prodDirId)) fs.mkdirSync(prodDirId, { recursive: true });
        fs.writeFileSync(path.join(prodDirId, 'index.html'), pageHtml, 'utf-8');
        fs.writeFileSync(path.join(distDir, 'product', `${p.id}.html`), pageHtml, 'utf-8');
      }

      countProductPages++;
    } catch (err) {
      console.error(`[Prerender] ERROR rendering product ID ${p.id}:`, err);
      process.exit(1);
    }
  }

  if (countProductPages === 0) {
    console.error('[Prerender] ERROR: 0 product pages generated! Failing build.');
    process.exit(1);
  }

  console.log(`[Prerender] Successfully generated ${countProductPages} product pages in dist/product!`);
}

runPrerender().catch(err => {
  console.error('[Prerender] Fatal build error:', err);
  process.exit(1);
});
