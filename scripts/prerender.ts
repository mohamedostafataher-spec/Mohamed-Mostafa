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
  const cleanRoutePath = routePath.split('?')[0].replace(/\/+$/, '') + '/';
  const fullUrl = `${BASE_URL}${cleanRoutePath}`;
  
  const pageTitle = meta.title || 'بيجامات نسائية قطن ووان سايز | سولتة';
  const pageDesc = truncateWordBoundary(meta.description || 'متجر سولتة لأزياء النوم والبيجامات النسائية القطنية المريحة بمقاس وان سايز يناسب من 45 إلى 80 كيلو.');
  const rawImage = meta.image || '/img/tulip-crinkle-cotton-pajama.webp';
  const absImage = rawImage.startsWith('http') ? rawImage : `${BASE_URL}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;

  let html = template;

  // Replace Title cleanly
  html = html.replace(/<title>.*?<\/title>/i, `<title>${pageTitle}</title>`);

  const headTags = [
    `<meta name="description" content="${pageDesc}" />`,
    `<link rel="canonical" href="${fullUrl}" />`,
    `<meta property="og:type" content="${meta.type || 'website'}" />`,
    `<meta property="og:title" content="${pageTitle}" />`,
    `<meta property="og:description" content="${pageDesc}" />`,
    `<meta property="og:url" content="${fullUrl}" />`,
    `<meta property="og:image" content="${absImage}" />`,
    `<meta property="og:site_name" content="سولتة | SULTA" />`,
    `<meta property="og:locale" content="ar_SA" />`,
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
    html = html.replace('<div id="root"></div>', `<div id="root">${meta.bodyHtml}</div>`);
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

  // Pre-rendered Static Pages with exact H1 and 60-100 words text
  const staticRoutes = [
    {
      path: '/',
      title: 'بيجامات نسائية قطن ووان سايز | سولتة',
      description: truncateWordBoundary('تسوقي بيجامات نسائية مريحة من قطن كوريشة ناعم وقطن مريح بمقاس وان سايز يناسب 45 إلى 80 كيلو. تصاميم أنثوية مريحة وكميات محدودة مع توصيل سريع لجميع مدن المملكة.'),
      bodyHtml: `<main dir="rtl" class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-3xl sm:text-4xl font-extrabold text-center my-6 text-gray-900">بيجامات نسائية قطن ناعمة — سولتة</h1>
        <div class="text-center text-gray-600 max-w-3xl mx-auto mb-8 text-sm sm:text-base leading-relaxed">
          <p>
            مرحباً بكِ في سولتة، حيث نقدم لكِ تشكيلة بيجامات نسائية صُممت خصيصاً لتمنحكِ الراحة والهدوء في أوقات استرخائكِ اليومية بالمنزل. نعتمد في قطعنا على خامات القطن الناعم المريح والقطن الكوريشة عالي التهوية بقصّات أنثوية لطيفة تناسب ذوقكِ الرفيع. تتوفر تشكيلتنا بمقاس وان سايز مرن يناسب الأوزان من 45 إلى 80 كيلو لتضمني راحة تامة طوال اليوم، مع عناية بالتفاصيل وتوصيل موثوق لكافة مناطق المملكة.
          </p>
        </div>
        <section class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          ${rawProducts.map((p: any) => {
            const slug = p.slug || getProductSlug({ id: p.id, nameEn: p.name_en || p.nameEn, nameAr: p.name_ar || p.nameAr });
            const nameAr = p.name_ar || p.nameAr || p.name;
            const price = p.price || p.price_sa || p.priceSA || 69;
            const stock = p.stock ?? 0;
            return `
            <a href="/product/${slug}/" class="block group">
              <article class="border border-gray-200 rounded-2xl p-4 bg-white shadow-xs hover:shadow-md transition-shadow">
                <img src="${cleanImgUrl(p.images?.[0])}" alt="${nameAr}" class="w-full aspect-[3/4] object-cover rounded-xl" loading="lazy" width="600" height="800" />
                <h2 class="text-lg font-bold mt-4 text-gray-900 group-hover:text-[#A44C5C]">${nameAr}</h2>
                <p class="text-sm text-gray-500 mt-1">${p.material || p.fabricAr || p.fabric_ar || 'قطن مريح'}</p>
                <div class="mt-3 flex items-center justify-between">
                  <span class="text-xl font-bold text-gray-900">${price} ر.س</span>
                  <span class="text-xs bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full font-medium">متبقي ${stock} قطع</span>
                </div>
              </article>
            </a>
          `;
          }).join('')}
        </section>
      </main>`
    },
    {
      path: '/store/',
      title: 'بيجامات نسائية قطن — تسوقي الآن | سولتة',
      description: truncateWordBoundary('تصفحي كامل تشكيلة البيجامات النسائية من سولتة، خامات قطنية مريحة بمقاس وان سايز 45-80 كجم وتوصيل لكافة مدن المملكة.'),
      bodyHtml: `<main dir="rtl" class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-extrabold my-6 text-gray-900">تشكيلة بيجامات نسائية من سولتة</h1>
        <div class="text-gray-600 max-w-3xl mb-8 text-sm sm:text-base leading-relaxed">
          <p>
            استكشفي متجر سولتة واختاري بيجامتكِ المفضلة من تشكيلة البيجامات النسائية القطنية المصممة لتناسب مختلف الأوقات المنزلية. تشمل التشكيلة بيجامات قطن كوريشة بطبعات زهرية وبيجامات قطن بحمالات ربط وموديلات ناعمة. جميع القطع بمقاس وان سايز مريح يناسب من 45 إلى 80 كيلو، مع توضيح كامل لتعليمات الغسيل بالماء البارد للمحافظة على جودة النسيج وتوفير خدمة شحن سريعة لكل مدن المملكة.
          </p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          ${rawProducts.map((p: any) => {
            const slug = p.slug || getProductSlug({ id: p.id, nameEn: p.name_en || p.nameEn, nameAr: p.name_ar || p.nameAr });
            const nameAr = p.name_ar || p.nameAr || p.name;
            const price = p.price || p.price_sa || p.priceSA || 69;
            const stock = p.stock ?? 0;
            return `
            <a href="/product/${slug}/" class="block group">
              <article class="border border-gray-200 rounded-2xl p-4 bg-white shadow-xs hover:shadow-md transition-shadow">
                <img src="${cleanImgUrl(p.images?.[0])}" alt="${nameAr}" class="w-full aspect-[3/4] object-cover rounded-xl" loading="lazy" width="600" height="800" />
                <h2 class="text-lg font-bold mt-3 text-gray-900 group-hover:text-[#A44C5C]">${nameAr}</h2>
                <p class="text-sm text-gray-500 mt-1">${p.material || p.fabricAr || p.fabric_ar || 'قطن مريح'}</p>
                <div class="mt-2 flex items-center justify-between">
                  <span class="text-lg font-bold text-gray-900">${price} ر.س</span>
                  <span class="text-xs text-rose-600 font-medium">متوفر ${stock} قطع</span>
                </div>
              </article>
            </a>
          `;
          }).join('')}
        </div>
      </main>`
    },
    {
      path: '/new-arrivals/',
      title: 'أحدث بيجامات نسائية وصل حديثًا | سولتة',
      description: truncateWordBoundary('اكتشفي أحدث تصاميم ملابس النوم والبيجامات النسائية القطنية التي وصلت حديثاً إلى متجر سولتة.'),
      bodyHtml: `<main dir="rtl" class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-extrabold my-6 text-gray-900">أحدث البيجامات النسائية من سولتة</h1>
        <p class="text-gray-600 max-w-2xl mb-8 leading-relaxed">
          وصل حديثاً إلى سولتة: أحدث موديلات البيجامات النسائية بأقمشة قطنية ناعمة ومقاس وان سايز يناسب الأوزان من 45 إلى 80 كيلو. تسوقي أحدث الإضافات بكميات محدودة لضمان التميز.
        </p>
      </main>`
    },
    { path: '/best-sellers/', title: 'الأكثر طلباً | سولتة', description: truncateWordBoundary('أكثر موديلات البيجامات النسائية طلباً في متجر سولتة.'), bodyHtml: '' },
    { path: '/offers/', title: 'العروض | سولتة', description: truncateWordBoundary('عروض وأسعار بيجامات سولتة القطنية.'), bodyHtml: '' },
    { path: '/about/', title: 'عن سولتة | سولتة', description: truncateWordBoundary('تعرفي على متجر سولتة المتخصص في أزياء النوم والبيجامات النسائية القطنية المريحة.'), bodyHtml: '' },
    { path: '/contact/', title: 'تواصل معنا | سولتة', description: truncateWordBoundary('تواصل مع خدمة عملاء متجر سولتة عبر واتساب.'), bodyHtml: '' },
    { path: '/faq/', title: 'الأسئلة الشائعة | سولتة', description: truncateWordBoundary('دليل الأسئلة الشائعة حول مقاسات البيجامات وخامات القطن وطريقة الغسيل في متجر سولتة.'), bodyHtml: '' },
    { path: '/returns/', title: 'سياسة الاستبدال | سولتة', description: truncateWordBoundary('تعرفي على شروط وسياسة الاستبدال والاسترجاع في متجر سولتة.'), bodyHtml: '' },
    { path: '/track-order/', title: 'تتبع الطلب | سولتة', description: truncateWordBoundary('تتبعي حالة طلبك وشحنتك في سولتة.'), noindex: true, bodyHtml: '' }
  ];

  for (const page of staticRoutes) {
    const pageHtml = buildPageHtml(template, page.path, {
      title: page.title,
      description: page.description,
      noindex: page.noindex,
      bodyHtml: page.bodyHtml
    });

    const pageDir = path.join(distDir, page.path.replace(/^\//, ''));
    if (!fs.existsSync(pageDir)) fs.mkdirSync(pageDir, { recursive: true });
    fs.writeFileSync(path.join(pageDir, 'index.html'), pageHtml, 'utf-8');
  }

  // Pre-render Active Product Pages
  let countProductPages = 0;
  for (const p of rawProducts) {
    try {
      const slug = p.slug || getProductSlug({ id: p.id, nameEn: p.name_en || p.nameEn, nameAr: p.name_ar || p.nameAr });
      const nameAr = p.name_ar || p.nameAr || p.name;
      const h1Text = p.h1 || `${nameAr} — قطن وان سايز`;
      const seoTitleText = p.seo_title || p.seoTitle || `${nameAr} | سولتة`;
      const rawDesc = p.description_ar || p.descriptionAr || p.description || '';
      const shortDesc = truncateWordBoundary(p.short_description || p.shortDescription || rawDesc);
      const price = Number(p.price || p.price_sa || p.priceSA || 69);
      const stock = Number(p.stock ?? 0);
      const material = p.material || p.fabricAr || p.fabric_ar || 'قطن ناعم ومريح';
      const careInstructions = p.care_instructions || p.washInstructionsAr || p.wash_instructions_ar || 'تُغسل بمويه باردة، ويفضّل بدون كلور، وتجنّبي الحرارة العالية.';

      const productUrlPath = `/product/${slug}/`;
      const fullProductUrl = `${BASE_URL}${productUrlPath}`;

      const primaryImg = cleanImgUrl(Array.isArray(p.images) ? p.images[0] : p.image_url);
      const absImage = primaryImg.startsWith('http') ? primaryImg : `${BASE_URL}${primaryImg.startsWith('/') ? '' : '/'}${primaryImg}`;

      // Schema.org Product (STRICT: NO reviews, NO aggregateRating)
      const productJsonLd: any = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": nameAr,
        "image": [absImage],
        "description": shortDesc,
        "sku": p.sku || p.id,
        "brand": {
          "@type": "Brand",
          "name": "سولتة"
        },
        "material": material,
        "audience": {
          "@type": "PeopleAudience",
          "suggestedGender": "female"
        },
        "size": "One Size (45-80 kg)",
        "offers": {
          "@type": "Offer",
          "url": fullProductUrl,
          "priceCurrency": "SAR",
          "price": price,
          "availability": stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "itemCondition": "https://schema.org/NewCondition"
        }
      };

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
            "item": `${BASE_URL}/`
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "المتجر",
            "item": `${BASE_URL}/store/`
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
              "text": `الكمية محدودة، وتظهر المتبقية في الصفحة (متبقي ${stock} قطع).`
            }
          }
        ]
      };

      const whatsappText = encodeURIComponent(`مرحباً سولتة، أود الاستفسار والطلب لمنتج: ${nameAr}\nالرابط: ${fullProductUrl}`);
      const whatsappUrl = `https://wa.me/966552823677?text=${whatsappText}`;

      // Free shipping bar above 299 SAR
      const bodyHtml = `<main dir="rtl" class="max-w-6xl mx-auto px-4 py-8">
        <div class="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-2xl flex items-center justify-between">
          <span>شحن مجاني لكافة مدن المملكة للطلبات فوق 299 ر.س 🇸🇦</span>
          <span class="text-emerald-600 text-xs">سولتة SULTA</span>
        </div>

        <nav class="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
          <a href="/" class="hover:underline">الرئيسية</a> &gt; 
          <a href="/store/" class="hover:underline">المتجر</a> &gt; 
          <span class="text-gray-900 font-medium">${nameAr}</span>
        </nav>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <img src="${primaryImg}" alt="${nameAr}" class="w-full aspect-[3/4] object-cover rounded-3xl shadow-sm border border-gray-100" fetchpriority="high" width="800" height="1066" />
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

            <div class="pt-2">
              <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold py-3.5 px-6 rounded-2xl shadow-sm transition-colors text-center text-base">
                <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z"/></svg>
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
                  <p class="mt-2 text-sm text-gray-700 leading-relaxed">ج: الكمية محدودة، وتظهر المتبقية في الصفحة.</p>
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
                  return `
                  <a href="/product/${simSlug}/" class="block p-2 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <img src="${cleanImgUrl(sim.images?.[0])}" alt="${simName}" class="w-full aspect-[3/4] object-cover rounded-lg mb-2" loading="lazy" />
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

      // 1. Output to dist/product/{slug}/index.html
      const prodDirSlug = path.join(distDir, 'product', slug);
      if (!fs.existsSync(prodDirSlug)) fs.mkdirSync(prodDirSlug, { recursive: true });
      fs.writeFileSync(path.join(prodDirSlug, 'index.html'), pageHtml, 'utf-8');

      // 2. Also output to dist/product/{id}-{slug}/index.html for complete compatibility
      const prodDirIdSlug = path.join(distDir, 'product', `${p.id}-${slug}`);
      if (!fs.existsSync(prodDirIdSlug)) fs.mkdirSync(prodDirIdSlug, { recursive: true });
      fs.writeFileSync(path.join(prodDirIdSlug, 'index.html'), pageHtml, 'utf-8');

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

  console.log(`[Prerender] Successfully generated ${countProductPages} product pages in dist/product/!`);
}

runPrerender().catch(err => {
  console.error('[Prerender] Fatal build error:', err);
  process.exit(1);
});
