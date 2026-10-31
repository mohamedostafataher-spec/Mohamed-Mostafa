import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { getProductSlug } from '../src/utils/slugify.js';
import { SEED_FALLBACK_PRODUCTS } from '../src/data/fallbackProducts.js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://fwadgmhabzaudusxghnh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_pYBVo5mba3tEpuMDxUlt6g_3aCk67gj';

const supabase = createClient(supabaseUrl, supabaseKey);
const BASE_URL = 'https://sulta.vercel.app';

function generateSitemap() {
  console.log('[Sitemap] Generating public/sitemap.xml...');

  const todayIso = new Date().toISOString().split('T')[0];

  const staticPages = [
    { route: '/', priority: '1.0', changefreq: 'daily' },
    { route: '/store/', priority: '0.9', changefreq: 'daily' },
    { route: '/best-sellers/', priority: '0.9', changefreq: 'daily' },
    { route: '/offers/', priority: '0.9', changefreq: 'daily' },
    { route: '/new-arrivals/', priority: '0.9', changefreq: 'daily' },
    { route: '/about/', priority: '0.7', changefreq: 'monthly' },
    { route: '/contact/', priority: '0.7', changefreq: 'monthly' },
    { route: '/faq/', priority: '0.7', changefreq: 'monthly' },
    { route: '/returns/', priority: '0.6', changefreq: 'monthly' }
  ];

  let rawProducts: any[] = [];
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name_en, name_ar, name, updated_at, created_at, status');
    
    if (!error && data && data.length > 0) {
      rawProducts = data.filter((p: any) => p.status !== 'archived');
    }
  } catch (err) {
    console.warn('[Sitemap] Supabase products fetch notice, using fallback items:', err);
  }

  if (rawProducts.length === 0) {
    rawProducts = SEED_FALLBACK_PRODUCTS;
  }

  const productEntries = rawProducts.map((p: any) => {
    let nameEn = p.name_en || p.nameEn || '';
    let nameAr = p.name_ar || p.nameAr || '';
    if (!nameEn && !nameAr && p.name) {
      const parts = p.name.split(' | ');
      nameAr = parts[0] || p.name;
      nameEn = parts[1] || parts[0] || p.name;
    }
    
    const slug = getProductSlug({ id: p.id, nameEn, nameAr });
    const lastmod = p.updated_at ? p.updated_at.split('T')[0] : (p.created_at ? p.created_at.split('T')[0] : todayIso);
    
    return {
      route: `/product/${slug}/`,
      lastmod,
      priority: '0.8',
      changefreq: 'weekly'
    };
  });

  const xmlEntries = [
    ...staticPages.map(p => `  <url>
    <loc>${BASE_URL}${p.route}</loc>
    <lastmod>${todayIso}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
    ...productEntries.map(p => `  <url>
    <loc>${BASE_URL}${p.route}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`)
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries.join('\n')}
</urlset>`;

  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const destPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(destPath, sitemapXml, 'utf-8');
  console.log(`[Sitemap] Successfully generated sitemap.xml with ${staticPages.length + productEntries.length} routes at ${destPath}`);
}

generateSitemap();
