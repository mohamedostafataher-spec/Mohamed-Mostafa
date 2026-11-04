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

// Color map for products
const PRODUCT_COLOR_MAP: Record<string, string> = {
  '51005136-8066-4844-8efe-718cd7644e6b': 'أحمر منقط',
  '614f6daa-d291-410b-a450-be23de75f868': 'وردي كريمي',
  '78f851f3-5f75-4153-9fbe-0e8ad54825be': 'وردي زاهي',
  '8d738e1c-0861-4569-8949-fc2d98c4fa50': 'وردي ملوكي',
  '54929551-5958-4b33-9ff9-abe83722cb78': 'أوف وايت عاجي',
  'bf2ba4f4-9c60-42d1-8566-b2e2735c3bdc': 'كحلي ورودي',
  '1d4e8104-17c9-4b64-8300-38340bdeaa18': 'أحمر منقط'
};

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

  const validItems: string[] = [];

  for (const p of activeProducts) {
    const title = p.name_ar || p.nameAr || p.name || 'بيجامة نسائية';
    
    // Description rule:
    // If g:description == title, fallback to short_description.
    // If short_description is empty/missing, DO NOT include the product and write a warning in build log.
    let desc = p.description_ar || p.descriptionAr || p.description || '';
    if (!desc || desc.trim() === title.trim()) {
      desc = p.short_description || p.shortDescription || '';
    }

    if (!desc || desc.trim() === '' || desc.trim() === title.trim()) {
      console.warn(`[Google Merchant WARNING] Product ID ${p.id} ("${title}") excluded from feed: missing or duplicate description.`);
      continue;
    }

    const slug = p.slug || getProductSlug({ id: p.id, nameEn: p.name_en || p.nameEn, nameAr: p.name_ar || p.nameAr });
    const link = `${BASE_URL}/product/${slug}/`;
    
    const imgs: string[] = Array.isArray(p.images) ? p.images : (p.image_url ? [p.image_url] : []);
    const cleanImgs = imgs.map((img: string) => img.startsWith('http') ? img : `${BASE_URL}${img.startsWith('/') ? '' : '/'}${img}`).filter(Boolean);
    if (!cleanImgs[0]) {
      console.warn(`[Google Merchant WARNING] Product ID ${p.id} ("${title}") excluded from feed: missing authentic image.`);
      continue;
    }
    const primaryImg = cleanImgs[0];
    const additionalImgs = cleanImgs.slice(1);

    // Regular base price
    const regularPrice = Number(p.regular_price || p.regularPrice || p.price_sa || p.priceSA || p.price || 69);
    const formattedPrice = `${regularPrice.toFixed(2)} SAR`;

    // Active discount check
    let salePriceXml = '';
    const discountPercent = Number(p.discount_percent || p.discountPercent || 0);
    const now = new Date();
    let isDiscountActive = false;

    if (discountPercent > 0 && discountPercent <= 90) {
      const startsOk = !p.discount_starts_at || new Date(p.discount_starts_at) <= now;
      const endsOk = !p.discount_ends_at || new Date(p.discount_ends_at) >= now;
      if (startsOk && endsOk) {
        isDiscountActive = true;
      }
    }

    if (isDiscountActive) {
      const effectivePrice = Math.round(regularPrice * (1 - discountPercent / 100));
      salePriceXml = `\n      <g:sale_price>${effectivePrice.toFixed(2)} SAR</g:sale_price>`;
      
      if (p.discount_starts_at || p.discount_ends_at) {
        const startDateIso = p.discount_starts_at ? new Date(p.discount_starts_at).toISOString() : now.toISOString();
        const endDateIso = p.discount_ends_at ? new Date(p.discount_ends_at).toISOString() : new Date(now.getTime() + 30*24*60*60*1000).toISOString();
        salePriceXml += `\n      <g:sale_price_effective_date>${startDateIso}/${endDateIso}</g:sale_price_effective_date>`;
      }
    }

    const stockCount = Number(p.stock ?? 0);
    const availability = stockCount > 0 ? 'in_stock' : 'out_of_stock';
    const material = p.material || p.fabricAr || p.fabric_ar || 'قطن مريح';

    // Real product color
    let colorName = p.color || (Array.isArray(p.colors) && p.colors[0]?.name ? p.colors[0].name : null);
    if (!colorName || colorName === 'متعدد') {
      colorName = PRODUCT_COLOR_MAP[p.id] || 'وردي';
    }

    validItems.push(`    <item>
      <g:id>${p.id}</g:id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(desc)}</g:description>
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
      <g:color>${escapeXml(colorName)}</g:color>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`);
  }

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>متجر سولتة | Sulta</title>
    <link>${BASE_URL}</link>
    <description>تغذية منتجات متجر سولتة لملابس النوم والبيجامات النسائية القطنية</description>
${validItems.join('\n')}
  </channel>
</rss>`;

  const feedsDir = path.resolve(process.cwd(), 'public', 'feeds');
  if (!fs.existsSync(feedsDir)) {
    fs.mkdirSync(feedsDir, { recursive: true });
  }

  const destPath = path.join(feedsDir, 'google-merchant.xml');
  fs.writeFileSync(destPath, rssXml, 'utf-8');
  console.log(`[Google Merchant] Successfully generated ${destPath} with ${validItems.length} valid products.`);
}

generateGoogleMerchantFeed().catch(err => {
  console.error('[Google Merchant] Feed generation error:', err);
  process.exit(1);
});
