import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { getProductSlug } from '../src/utils/slugify.js';
import { SEED_FALLBACK_PRODUCTS } from '../src/data/fallbackProducts.js';
import { parseCleanArabicDescription, truncateTo155Words, formatProductTitle } from '../src/utils/textUtils.js';
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

function extractProductInfo(p: any) {
  let nameEn = p.name_en || p.nameEn || '';
  let nameAr = p.name_ar || p.nameAr || '';
  if (!nameEn && !nameAr && p.name) {
    const parts = p.name.split(' | ');
    nameAr = parts[0] || p.name;
    nameEn = parts[1] || parts[0] || p.name;
  }
  if (!nameAr) nameAr = 'منتج فاخر';
  const slug = getProductSlug({ id: p.id, nameEn, nameAr });
  return { nameAr, nameEn, slug };
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
    jsonLd?: any;
    bodyHtml?: string;
  }
): string {
  const cleanRoutePath = routePath.split('?')[0].replace(/\/+$/, '') + '/';
  const fullUrl = `${BASE_URL}${cleanRoutePath}`;
  
  const pageTitle = meta.title || 'سولتة | SULTA Atelier - أزياء النوم والبيجامات النسائية الفاخرة';
  const pageDesc = meta.description || 'متجر سولتة للأزياء الراقية والبيجامات الفاخرة. تصاميم ملكية بخامات عالمية وتوصيل سريع لكل مدن المملكة.';
  const rawImage = meta.image || '/img/sulta_couture_luxury_banner.webp';
  const absImage = rawImage.startsWith('http') ? rawImage : `${BASE_URL}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;

  let html = template;

  html = html.replace(/<title>.*?<\/title>/i, `<title>${pageTitle}</title>`);

  const headTags = [
    `<meta name="description" content="${pageDesc}" />`,
    `<link rel="canonical" href="${fullUrl}" />`,
    `<meta property="og:type" content="${meta.type || 'website'}" />`,
    `<meta property="og:title" content="${pageTitle}" />`,
    `<meta property="og:description" content="${pageDesc}" />`,
    `<meta property="og:url" content="${fullUrl}" />`,
    `<meta property="og:image" content="${absImage}" />`,
    `<meta property="og:site_name" content="SULTA Atelier" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${pageTitle}" />`,
    `<meta name="twitter:description" content="${pageDesc}" />`,
    `<meta name="twitter:image" content="${absImage}" />`
  ];

  if (meta.noindex) {
    headTags.push(`<meta name="robots" content="noindex, nofollow" />`);
  }

  if (meta.jsonLd) {
    headTags.push(`<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`);
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
      console.warn('[Prerender] Supabase fetch error, using fallback seed products:', error.message);
    }
  } catch (err) {
    console.warn('[Prerender] Supabase product fetch warning:', err);
  }

  if (rawProducts.length === 0) {
    console.warn('[Prerender] Using SEED_FALLBACK_PRODUCTS as fallback source.');
    rawProducts = SEED_FALLBACK_PRODUCTS;
  }

  if (!rawProducts || rawProducts.length === 0) {
    console.error('[Prerender] ERROR: No products found or fallback empty! Prerender failed.');
    process.exit(1);
  }

  const staticRoutes = [
    {
      path: '/',
      title: 'سولتة | SULTA Atelier - أزياء النوم والبيجامات النسائية الفاخرة',
      description: 'اكتشفي تشكيلة سولتة الحصرية من أزياء النوم والبيجامات الملكية الناعمة المصممة بأعلى معايير الجودة الفاخرة.',
      bodyHtml: `<main dir="rtl" class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-4xl font-black text-center my-6">سولتة | SULTA Atelier — أزياء النوم الفاخرة</h1>
        <section class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          ${rawProducts.map((p: any) => {
            const { nameAr, slug } = extractProductInfo(p);
            return `
            <a href="/product/${slug}/" class="block">
              <article class="border border-gray-100 rounded-3xl p-4 bg-white shadow-sm">
                <img src="${cleanImgUrl(p.images?.[0] || p.image_url)}" alt="${nameAr}" class="w-full aspect-[3/4] object-cover rounded-2xl" loading="lazy" />
                <h2 class="text-xl font-bold mt-4">${nameAr}</h2>
                <p class="text-amber-700 font-extrabold text-lg mt-2">${p.sale_price_sa || p.salePriceSA || p.price_sa || p.priceSA || 200} ر.س</p>
              </article>
            </a>
          `;
          }).join('')}
        </section>
      </main>`
    },
    {
      path: '/store/',
      title: 'المتجر | سولتة',
      description: 'تسوقي كافة تشكيلات سولتة الفاخرة من البيجامات الكوتور، ملابس الاسترخاء والأطقم العرائسية الراقية.',
      bodyHtml: `<main dir="rtl" class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-black my-6">تشكيلة المتجر الملكي الكاملة</h1>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          ${rawProducts.map((p: any) => {
            const { nameAr, slug } = extractProductInfo(p);
            return `
            <a href="/product/${slug}/" class="block">
              <article class="border rounded-2xl p-4 bg-white">
                <img src="${cleanImgUrl(p.images?.[0] || p.image_url)}" alt="${nameAr}" class="w-full aspect-[3/4] object-cover rounded-xl" loading="lazy" />
                <h2 class="text-lg font-bold mt-3">${nameAr}</h2>
                <p class="text-gray-900 font-black mt-1">${p.sale_price_sa || p.salePriceSA || p.price_sa || p.priceSA || 200} ر.س</p>
              </article>
            </a>
          `;
          }).join('')}
        </div>
      </main>`
    },
    { path: '/best-sellers/', title: 'الأكثر طلباً | سولتة', description: 'استكشفي الأطقم الأكثر طلباً.', bodyHtml: '' },
    { path: '/offers/', title: 'العروض | سولتة', description: 'تخفيضات سولتة الحصرية.', bodyHtml: '' },
    { path: '/new-arrivals/', title: 'وصل حديثاً | سولتة', description: 'أحدث إبداعات سولتة.', bodyHtml: '' },
    { path: '/about/', title: 'عن سولتة | سولتة', description: 'قصة الفخامة.', bodyHtml: '' },
    { path: '/contact/', title: 'تواصل معنا | سولتة', description: 'خدمة عملاء سولتة.', bodyHtml: '' },
    { path: '/faq/', title: 'الأسئلة الشائعة | سولتة', description: 'دليل الإجابات.', bodyHtml: '' },
    { path: '/returns/', title: 'سياسة الاستبدال | سولتة', description: 'سياسة الاسترجاع.', bodyHtml: '' },
    { path: '/track-order/', title: 'تتبع الطلب | سولتة', description: 'تتبع الشحنة.', noindex: true, bodyHtml: '' }
  ];

  try {
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
  } catch (err) {
    console.error('[Prerender] ERROR rendering static pages:', err);
    process.exit(1);
  }

  let countProductPages = 0;
  for (const p of rawProducts) {
    try {
      const { nameAr, slug } = extractProductInfo(p);
      const descAr = parseCleanArabicDescription(p.description_ar || p.descriptionAr || p.description || '');

      const productUrlPath = `/product/${slug}/`;

      const pageTitle = formatProductTitle(nameAr);
      const pageDesc = truncateTo155Words(descAr || nameAr);

      const productJsonLd = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": nameAr,
        "image": Array.isArray(p.images) ? p.images.map(cleanImgUrl) : [cleanImgUrl(p.image_url)],
        "description": descAr || nameAr,
        "sku": p.id,
        "brand": { "@type": "Brand", "name": "SULTA Atelier" },
        "offers": {
          "@type": "Offer",
          "url": `${BASE_URL}${productUrlPath}`,
          "priceCurrency": "SAR",
          "price": p.sale_price_sa || p.salePriceSA || p.price_sa || p.priceSA || 200,
          "availability": Number(p.stock ?? 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
        }
      };

      const bodyHtml = `<main dir="rtl" class="max-w-7xl mx-auto px-4 py-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div><img src="${cleanImgUrl(p.images?.[0] || p.image_url)}" alt="${nameAr}" class="w-full aspect-[3/4] object-cover rounded-3xl" fetchpriority="high" /></div>
          <div class="space-y-4">
            <h1 class="text-3xl font-black">${nameAr}</h1>
            <p class="text-2xl font-bold text-amber-800">${p.sale_price_sa || p.salePriceSA || p.price_sa || p.priceSA || 200} ر.س</p>
            <p class="text-gray-700 text-lg leading-relaxed">${descAr}</p>
          </div>
        </div>
      </main>`;

      const pageHtml = buildPageHtml(template, productUrlPath, {
        title: pageTitle,
        description: pageDesc,
        image: cleanImgUrl(p.images?.[0] || p.image_url),
        type: 'product',
        jsonLd: [productJsonLd],
        bodyHtml
      });

      const prodDir = path.join(distDir, 'product', slug);
      if (!fs.existsSync(prodDir)) fs.mkdirSync(prodDir, { recursive: true });
      fs.writeFileSync(path.join(prodDir, 'index.html'), pageHtml, 'utf-8');
      countProductPages++;
    } catch (err) {
      console.error(`[Prerender] ERROR rendering product ID ${p.id}:`, err);
      process.exit(1);
    }
  }

  if (countProductPages === 0) {
    console.error('[Prerender] ERROR: 0 product pages were generated! Failing build.');
    process.exit(1);
  }

  console.log(`[Prerender] Successfully generated ${countProductPages} product pages!`);
}

runPrerender().catch(err => {
  console.error('[Prerender] Fatal build error:', err);
  process.exit(1);
});
