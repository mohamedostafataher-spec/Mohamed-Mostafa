import fs from 'fs';
import path from 'path';
import { getProductSlug } from '../src/utils/slugify.js';
import { SEED_FALLBACK_PRODUCTS } from '../src/data/fallbackProducts.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://fwadgmhabzaudusxghnh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_pYBVo5mba3tEpuMDxUlt6g_3aCk67gj';
const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = 'https://sulta.vercel.app';

async function generateSitemaps() {
  console.log('[Sitemap] Generating sitemaps...');

  const todayIso = new Date().toISOString().split('T')[0];

  const staticPages = [
    { route: '', priority: '1.0', changefreq: 'daily' },
    { route: '/store', priority: '0.9', changefreq: 'daily' },
    { route: '/best-sellers', priority: '0.8', changefreq: 'weekly' },
    { route: '/offers', priority: '0.8', changefreq: 'weekly' },
    { route: '/new-arrivals', priority: '0.8', changefreq: 'weekly' },
    { route: '/about', priority: '0.6', changefreq: 'monthly' },
    { route: '/contact', priority: '0.6', changefreq: 'monthly' },
    { route: '/faq', priority: '0.6', changefreq: 'monthly' },
    { route: '/returns', priority: '0.5', changefreq: 'monthly' },
    { route: '/blog', priority: '0.7', changefreq: 'weekly' },
    { route: '/blog/ultimate-womens-sleepwear-cotton-guide', priority: '0.8', changefreq: 'monthly' }
  ];

  let activeProducts: any[] = [];
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (!error && data && data.length > 0) {
      activeProducts = data.filter((p: any) => p.status !== 'archived');
    }
  } catch (err) {
    console.warn('[Sitemap] Supabase products fetch notice:', err);
  }

  if (activeProducts.length === 0) {
    activeProducts = SEED_FALLBACK_PRODUCTS.filter((p: any) => p.status !== 'archived');
  }

  // 1. Regular sitemap.xml
  const productEntries = activeProducts.map((p: any) => {
    const slug = getProductSlug({ id: p.id, nameEn: p.name_en || p.nameEn, nameAr: p.name_ar || p.nameAr, slug: p.slug });
    const lastmod = p.updated_at ? p.updated_at.split('T')[0] : (p.created_at ? p.created_at.split('T')[0] : '2026-11-01');
    return {
      route: `/product/${slug}`,
      lastmod,
      priority: '0.9',
      changefreq: 'weekly'
    };
  });

  const xmlEntries = [
    ...staticPages.map(p => `  <url>
    <loc>${BASE_URL}${p.route}</loc>
    <lastmod>${todayIso}</lastmod>
  </url>`),
    ...productEntries.map(p => `  <url>
    <loc>${BASE_URL}${p.route}</loc>
    <lastmod>${p.lastmod}</lastmod>
  </url>`)
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries.join('\n')}
</urlset>`;

  // 2. Image Sitemap: image-sitemap.xml
  const imageEntries = activeProducts.map((p: any) => {
    const slug = p.slug || getProductSlug({ id: p.id, nameEn: p.name_en || p.nameEn, nameAr: p.name_ar || p.nameAr });
    const nameAr = p.name_ar || p.nameAr || p.name || 'بيجامة نسائية';
    const imgs: string[] = Array.isArray(p.images) ? p.images : (p.image_url ? [p.image_url] : []);
    const cleanImgs = imgs.map((img: string) => img.startsWith('http') ? img : `${BASE_URL}${img.startsWith('/') ? '' : '/'}${img}`);

    return `  <url>
    <loc>${BASE_URL}/product/${slug}</loc>
${cleanImgs.map((img: string) => `    <image:image>
      <image:loc>${img}</image:loc>
      <image:title>${nameAr}</image:title>
    </image:image>`).join('\n')}
  </url>`;
  });

  const imageSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${imageEntries.join('\n')}
</urlset>`;

  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf-8');
  fs.writeFileSync(path.join(publicDir, 'image-sitemap.xml'), imageSitemapXml, 'utf-8');
  console.log(`[Sitemap] Generated public/sitemap.xml and public/image-sitemap.xml with ${activeProducts.length} products.`);
}

generateSitemaps().catch(err => {
  console.error('[Sitemap] Generation error:', err);
  process.exit(1);
});
