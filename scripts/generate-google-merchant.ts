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

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

async function generateGoogleMerchantFeed() {
  console.log('[Google Merchant] Generating feeds/google-merchant.xml...');

  let activeProducts: any[] = [];
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (!error && data && data.length > 0) {
      activeProducts = data.filter((p: any) => p.status !== 'archived');
    }
  } catch (err) {
    console.warn('[Google Merchant] Supabase fetch warning:', err);
  }

  if (activeProducts.length === 0) {
    activeProducts = SEED_FALLBACK_PRODUCTS.filter((p: any) => p.status !== 'archived');
  }

  const itemsXml = activeProducts.map((p: any) => {
    const slug = p.slug || getProductSlug({ id: p.id, nameEn: p.name_en || p.nameEn, nameAr: p.name_ar || p.nameAr });
    const title = p.name_ar || p.nameAr || p.name || 'بيجامة نسائية';
    const description = p.short_description || p.shortDescription || p.description_ar || p.descriptionAr || title;
    const link = `${BASE_URL}/product/${slug}/`;
    
    const imgs: string[] = Array.isArray(p.images) ? p.images : (p.image_url ? [p.image_url] : []);
    const cleanImgs = imgs.map((img: string) => img.startsWith('http') ? img : `${BASE_URL}${img.startsWith('/') ? '' : '/'}${img}`);
    const primaryImg = cleanImgs[0] || `${BASE_URL}/img/tulip-crinkle-cotton-pajama.webp`;
    const additionalImgs = cleanImgs.slice(1);

    const priceNum = Number(p.price || p.price_sa || p.priceSA || 69);
    const formattedPrice = `${priceNum.toFixed(2)} SAR`;

    // Only output sale_price if there is a real lower sale price
    let salePriceXml = '';
    const saleNum = p.sale_price_sa || p.salePriceSA;
    if (saleNum && Number(saleNum) < priceNum) {
      salePriceXml = `\n      <g:sale_price>${Number(saleNum).toFixed(2)} SAR</g:sale_price>`;
    }

    const stockCount = Number(p.stock ?? 0);
    const availability = stockCount > 0 ? 'in_stock' : 'out_of_stock';
    const material = p.material || p.fabricAr || p.fabric_ar || 'قطن';
    const color = (Array.isArray(p.colors) && p.colors[0]?.name) ? p.colors[0].name : 'متعدد';

    return `    <item>
      <g:id>${p.id}</g:id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${primaryImg}</g:image_link>
${additionalImgs.map(img => `      <g:additional_image_link>${img}</g:additional_image_link>`).join('\n')}
      <g:price>${formattedPrice}</g:price>${salePriceXml}
      <g:availability>${availability}</g:availability>
      <g:brand>سولتة</g:brand>
      <g:condition>new</g:condition>
      <g:gender>female</g:gender>
      <g:age_group>adult</g:age_group>
      <g:size>Free Size</g:size>
      <g:material>${escapeXml(material)}</g:material>
      <g:color>${escapeXml(color)}</g:color>
    </item>`;
  }).join('\n');

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>متجر سولتة | SULTA Atelier</title>
    <link>${BASE_URL}</link>
    <description>تغذية منتجات متجر سولتة لملابس النوم والبيجامات النسائية القطنية</description>
${itemsXml}
  </channel>
</rss>`;

  const feedsDir = path.resolve(process.cwd(), 'public', 'feeds');
  if (!fs.existsSync(feedsDir)) {
    fs.mkdirSync(feedsDir, { recursive: true });
  }

  const destPath = path.join(feedsDir, 'google-merchant.xml');
  fs.writeFileSync(destPath, rssXml, 'utf-8');
  console.log(`[Google Merchant] Successfully generated ${destPath} with ${activeProducts.length} products.`);
}

generateGoogleMerchantFeed().catch(err => {
  console.error('[Google Merchant] Feed generation error:', err);
  process.exit(1);
});
