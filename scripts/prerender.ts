import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { getProductSlug, slugify } from '../src/utils/slugify.js';
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
  const cleaned = url.trim();
  // Return original URL for OG/Twitter tags
  return cleaned;
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
  // Ensure trailing slash
  const cleanRoutePath = routePath.split('?')[0].replace(/\/+$/, '') + '/';
  const fullUrl = `${BASE_URL}${cleanRoutePath}`;
  const siteName = 'سولتة | SULTA Atelier';
  const pageTitle = meta.title ? `${meta.title} | ${siteName}` : 'سولتة | SULTA Atelier - أزياء النوم الفاخرة';
  const pageDesc = meta.description || 'متجر سولتة للأزياء الراقية والبيجامات الفاخرة. تصاميم ملكية بخامات عالمية وتوصيل سريع لكل مدن المملكة.';
  const rawImage = meta.image || '/img/sulta_couture_luxury_banner.webp';
  const absImage = rawImage.startsWith('http') ? rawImage : `${BASE_URL}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;

  let html = template;

  // Replace Title
  html = html.replace(/<title>.*?<\/title>/i, `<title>${pageTitle}</title>`);

  // Build head tags to inject
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

  // Inject into </head>
  html = html.replace('</head>', `  ${headTags.join('\n  ')}\n</head>`);

  // Inject prerendered body into <div id="root"></div> if provided
  if (meta.bodyHtml) {
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root">${meta.bodyHtml}</div>`
    );
  }

  return html;
}

async function runPrerender() {
  console.log('[Prerender] Starting static HTML generation...');

  const distDir = path.resolve(process.cwd(), 'dist');
  const templatePath = path.join(distDir, 'index.html');

  if (!fs.existsSync(templatePath)) {
    console.error('[Prerender] Error: dist/index.html does not exist. Run vite build first.');
    return;
  }

  const template = fs.readFileSync(templatePath, 'utf-8');

  // 1. Fetch Products
  let rawProducts: any[] = [];
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (!error && data && data.length > 0) {
      rawProducts = data.filter((p: any) => p.status !== 'archived');
    }
  } catch (err) {
    console.warn('[Prerender] Supabase product fetch warning:', err);
  }

  if (rawProducts.length === 0) {
    rawProducts = SEED_FALLBACK_PRODUCTS;
  }

  // 2. Define static routes
  const staticRoutes = [
    {
      path: '/',
      title: 'الرئيسية - أزياء النوم الفاخرة والبيجامات الملكية',
      description: 'اكتشفي تشكيلة سولتة الحصرية من أزياء النوم والبيجامات الملكية الناعمة المصممة بأعلى معايير الجودة الفاخرة.',
      bodyHtml: `<main dir="rtl" class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-4xl font-black text-center my-6">سولتة | SULTA Atelier — أزياء النوم الفاخرة</h1>
        <p class="text-center text-lg text-gray-600 max-w-2xl mx-auto">تصاميم كوتور أنثوية راقية من الأنسجة الملكية الملساء لتنعمي براحة واسترخاء استثنائيين.</p>
        <section class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          ${rawProducts.map((p: any) => `
            <a href="/product/${getProductSlug({ id: p.id, nameEn: p.name_en || p.nameEn || '', nameAr: p.name_ar || p.nameAr || '' })}/" class="block">
              <article class="border border-gray-100 rounded-3xl p-4 bg-white shadow-sm">
                <img src="${cleanImgUrl(p.images?.[0] || p.image_url)}" alt="${p.name_ar || p.nameAr || 'بيجامة سولتة'}" class="w-full aspect-[3/4] object-cover rounded-2xl" loading="lazy" />
                <h2 class="text-xl font-bold mt-4">${p.name_ar || p.nameAr || 'بيجامة حرير فاخرة'}</h2>
                <p class="text-amber-700 font-extrabold text-lg mt-2">${p.sale_price_sa || p.salePriceSA || p.price_sa || p.priceSA || 200} ر.س</p>
              </article>
            </a>
          `).join('')}
        </section>
      </main>`
    },
    {
      path: '/store',
      title: 'المتجر الملكي - كوتور سولتة للأزياء الفاخرة',
      description: 'تسوقي كافة تشكيلات سولتة الفاخرة من البيجامات الكوتور، ملابس الاسترخاء والأطقم العرائسية الراقية.',
      bodyHtml: `<main dir="rtl" class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-black my-6">تشكيلة المتجر الملكي الكاملة</h1>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          ${rawProducts.map((p: any) => `
            <a href="/product/${getProductSlug({ id: p.id, nameEn: p.name_en || p.nameEn || '', nameAr: p.name_ar || p.nameAr || '' })}/" class="block">
              <article class="border rounded-2xl p-4 bg-white">
                <img src="${cleanImgUrl(p.images?.[0] || p.image_url)}" alt="${p.name_ar || p.nameAr}" class="w-full aspect-[3/4] object-cover rounded-xl" loading="lazy" />
                <h2 class="text-lg font-bold mt-3">${p.name_ar || p.nameAr}</h2>
                <p class="text-gray-900 font-black mt-1">${p.sale_price_sa || p.salePriceSA || p.price_sa || p.priceSA || 200} ر.س</p>
              </article>
            </a>
          `).join('')}
        </div>
      </main>`
    },
    {
      path: '/best-sellers',
      title: 'الأكثر طلباً - التشكيلة الأكثر مبيعاً في سولتة',
      description: 'استكشفي الأطقم والبيجامات الأكثر طلباً وإقبالاً من عميلات سولتة في المملكة والخليج.',
      bodyHtml: `<main dir="rtl" class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-black my-6">القطع الأكثر طلباً وإقبالاً</h1>
        <p class="text-gray-600">التصاميم الأكثر تفضيلاً واقتناءً في صالون SULTA.</p>
      </main>`
    },
    {
      path: '/offers',
      title: 'العروض الحصرية - التخفيضات الفاخرة',
      description: 'عروض وتخفيضات سولتة الحصرية على البيجامات وأطقم النوم المترفة بأسعار استثنائية.',
      bodyHtml: `<main dir="rtl" class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-black my-6">العروض وتخفيضات الموسم</h1>
        <p class="text-gray-600">اغتنمي فرصة اقتناء قطع سولتة الفاخرة بأسعار حصرية لفترة محدودة.</p>
      </main>`
    },
    {
      path: '/new-arrivals',
      title: 'وصل حديثاً - التشكيلة الجديدة',
      description: 'أحدث إبداعات سولتة من أطقم النوم الناعمة والأزياء المنزلية الراقية لموسم جديد مفعم بالحيوية.',
      bodyHtml: `<main dir="rtl" class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-black my-6">التشكيلة الجديدة - وصل حديثاً</h1>
        <p class="text-gray-600">أحدث أزياء الاسترخاء والأنسجة الناعمة النادرة.</p>
      </main>`
    },
    {
      path: '/about',
      title: 'عن سولتة - قصة الفخامة والأنسجة الملكية',
      description: 'تعرفي على قصة سولتة ورؤيتنا في تقديم أرقى أزياء النوم والبيجامات المصنوعة بخبرة وحب.',
      bodyHtml: `<main dir="rtl" class="max-w-4xl mx-auto px-4 py-12">
        <h1 class="text-3xl font-black mb-6">عن دار SULTA Atelier</h1>
        <p class="text-lg leading-relaxed text-gray-700">تأسست سولتة لتعيد تعريف مفهوم ملابس الاسترخاء المنزلية من خلال أنسجة فاخرة فائقة النعومة وتصاميم مريحة تنبض بالأناقة والوقار.</p>
      </main>`
    },
    {
      path: '/contact',
      title: 'تواصل معنا - خدمة عملاء سولتة الملكية',
      description: 'تواصل مع فريق كونسيرج سولتة للاستفسارات عن المقاسات، الطلبات أو الاستشارات الخاصة.',
      bodyHtml: `<main dir="rtl" class="max-w-3xl mx-auto px-4 py-12">
        <h1 class="text-3xl font-black mb-6">تواصل مع فريق سولتة</h1>
        <p class="text-gray-600">يسعدنا التواصل معكِ دائماً عبر الواتساب أو البريد الإلكتروني concierge@sulta.sa</p>
      </main>`
    },
    {
      path: '/faq',
      title: 'الأسئلة الشائعة - دليل إجابات سولتة الشامل',
      description: 'إجابات على كافة الأسئلة المتكررة بشأن الشحن، التوصيل، اختيار المقاس وطرق العناية بالأقمشة.',
      bodyHtml: `<main dir="rtl" class="max-w-4xl mx-auto px-4 py-12">
        <h1 class="text-3xl font-black mb-6">الأسئلة الشائعة والمعلومات العامة</h1>
      </main>`
    },
    {
      path: '/returns',
      title: 'سياسة الاستبدال والاسترجاع - سولتة',
      description: 'دليل وسياسة الاستبدال والاسترجاع المرنة والسهلة لعميلات دار سولتة.',
      bodyHtml: `<main dir="rtl" class="max-w-4xl mx-auto px-4 py-12">
        <h1 class="text-3xl font-black mb-6">سياسة الاستبدال والاسترجاع</h1>
      </main>`
    },
    {
      path: '/track-order',
      title: 'تتبع الطلب - متابعة الشحن المباشر',
      description: 'تابعي حالة طلبك ورقم الشحنة مباشرة خطوة بخطوة مع شركة التوصيل.',
      noindex: true,
      bodyHtml: `<main dir="rtl" class="max-w-3xl mx-auto px-4 py-12">
        <h1 class="text-3xl font-black mb-6">تتبع شحنتك المباشرة</h1>
      </main>`
    },
    {
      path: '/404',
      title: 'الصفحة غير موجودة - 404',
      description: 'عذراً، الصفحة التي تبحثين عنها غير موجودة في دار سولتة.',
      noindex: true,
      bodyHtml: `<main dir="rtl" class="max-w-xl mx-auto px-4 py-24 text-center">
        <h1 class="text-5xl font-black text-gray-900 mb-4">404</h1>
        <p class="text-xl text-gray-600">عذراً، الصفحة المطلوبة غير موجودة.</p>
      </main>`
    }
  ];

  // Write static routes to dist/
  for (const page of staticRoutes) {
    const pageHtml = buildPageHtml(template, page.path, {
      title: page.title,
      description: page.description,
      noindex: page.noindex,
      bodyHtml: page.bodyHtml
    });

    if (page.path === '/') {
      fs.writeFileSync(templatePath, pageHtml, 'utf-8');
    } else {
      const pageDir = path.join(distDir, page.path.replace(/^\//, ''));
      if (!fs.existsSync(pageDir)) {
        fs.mkdirSync(pageDir, { recursive: true });
      }
      fs.writeFileSync(path.join(pageDir, 'index.html'), pageHtml, 'utf-8');
    }
  }

  // 3. Generate Prerendered Pages for ALL Products
  let countProductPages = 0;
  for (const p of rawProducts) {
    let nameAr = p.name_ar || p.nameAr || '';
    let nameEn = p.name_en || p.nameEn || '';
    let descAr = p.description_ar || p.descriptionAr || p.description || '';

    if (!nameAr && !nameEn && p.name) {
      const parts = p.name.split(' | ');
      nameAr = parts[0] || p.name;
      nameEn = parts[1] || parts[0] || p.name;
    }

    const slug = getProductSlug({ id: p.id, nameEn, nameAr });
    const productUrlPath = `/product/${slug}/`;

    const price = p.sale_price_sa || p.salePriceSA || p.price_sa || p.priceSA || 200;
    const imgUrl = cleanImgUrl((Array.isArray(p.images) ? p.images[0] : p.image_url) || '');

    const pageTitle = `${nameAr} - ${price} ر.س - سولتة`;
    const pageDesc = descAr.slice(0, 160) || `${nameAr} بيجامة حرير فاخرة من سولتة.`;

    // JSON-LD Schemas
    const productJsonLd = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": nameAr,
      "image": Array.isArray(p.images) ? p.images.map(cleanImgUrl) : [imgUrl],
      "description": descAr || nameAr,
      "sku": p.id,
      "brand": {
        "@type": "Brand",
        "name": "SULTA Atelier"
      },
      "offers": {
        "@type": "Offer",
        "url": `${BASE_URL}${productUrlPath}`,
        "priceCurrency": "SAR",
        "price": price,
        "availability": Number(p.stock ?? 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
      }
    };

    const breadcrumbJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": `${BASE_URL}/` },
        { "@type": "ListItem", "position": 2, "name": "المتجر", "item": `${BASE_URL}/store/` },
        { "@type": "ListItem", "position": 3, "name": nameAr, "item": `${BASE_URL}${productUrlPath}` }
      ]
    };

    const bodyHtml = `<main dir="rtl" class="max-w-7xl mx-auto px-4 py-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img src="${imgUrl}" alt="${nameAr} - بيجامة حرير سولتة" class="w-full aspect-[3/4] object-cover rounded-3xl" fetchpriority="high" />
        </div>
        <div class="space-y-4">
          <h1 class="text-3xl font-black">${nameAr}</h1>
          <p class="text-2xl font-bold text-amber-800">${price} ر.س <span class="text-sm font-normal text-gray-500">شامل الضريبة 🇸🇦</span></p>
          <p class="text-gray-700 text-lg leading-relaxed">${descAr}</p>
        </div>
      </div>
    </main>`;

    const pageHtml = buildPageHtml(template, productUrlPath, {
      title: pageTitle,
      description: pageDesc,
      image: imgUrl,
      type: 'product',
      jsonLd: [productJsonLd, breadcrumbJsonLd],
      bodyHtml
    });

    const prodDir = path.join(distDir, 'product', slug);
    if (!fs.existsSync(prodDir)) {
      fs.mkdirSync(prodDir, { recursive: true });
    }
    fs.writeFileSync(path.join(prodDir, 'index.html'), pageHtml, 'utf-8');

    // Also write to dist/product/{id}/index.html for ID direct lookup
    if (p.id && p.id !== slug) {
      const idDir = path.join(distDir, 'product', p.id);
      if (!fs.existsSync(idDir)) {
        fs.mkdirSync(idDir, { recursive: true });
      }
      fs.writeFileSync(path.join(idDir, 'index.html'), pageHtml, 'utf-8');
    }

    countProductPages++;
  }

  console.log(`[Prerender] Successfully generated pre-rendered static HTML for ${staticRoutes.length} pages + ${countProductPages} product pages in dist/!`);
}

runPrerender().catch(err => { console.error(err); process.exit(1) });
