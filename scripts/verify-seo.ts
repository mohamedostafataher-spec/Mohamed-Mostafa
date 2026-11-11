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
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, errMsg: string) {
  if (condition) {
    results.push({ name, passed: true });
  } else {
    results.push({ name, passed: false, error: errMsg });
    console.error(`❌ FAIL: ${name} -> ${errMsg}`);
  }
}

async function verifySeo() {
  console.log('====================================================');
  console.log('🚀 SULTA TECHNICAL SEO & SEARCH CENTRAL VERIFICATION');
  console.log('====================================================\n');

  // 1. Verify robots.txt
  console.log('📋 Checking public/robots.txt...');
  const robotsPath = path.join(PUBLIC_DIR, 'robots.txt');
  assert(fs.existsSync(robotsPath), 'robots.txt exists', 'public/robots.txt file is missing');
  if (fs.existsSync(robotsPath)) {
    const robots = fs.readFileSync(robotsPath, 'utf-8');
    assert(robots.includes('User-agent: *'), 'robots.txt User-agent', 'robots.txt missing User-agent: *');
    assert(robots.includes('Disallow: /dashboard'), 'robots.txt Disallow /dashboard', 'robots.txt missing Disallow: /dashboard');
    assert(robots.includes('Disallow: /admin'), 'robots.txt Disallow /admin', 'robots.txt missing Disallow: /admin');
    assert(robots.includes('Disallow: /checkout'), 'robots.txt Disallow /checkout', 'robots.txt missing Disallow: /checkout');
    assert(robots.includes('Disallow: /cart'), 'robots.txt Disallow /cart', 'robots.txt missing Disallow: /cart');
    assert(robots.includes('Sitemap: https://sulta.vercel.app/sitemap.xml'), 'robots.txt Sitemap directive', 'robots.txt missing sitemap.xml URL');
  }

  // 2. Verify sitemap.xml
  console.log('📋 Checking public/sitemap.xml...');
  const sitemapPath = path.join(PUBLIC_DIR, 'sitemap.xml');
  assert(fs.existsSync(sitemapPath), 'sitemap.xml exists', 'public/sitemap.xml file is missing');
  if (fs.existsSync(sitemapPath)) {
    const sitemap = fs.readFileSync(sitemapPath, 'utf-8');
    assert(sitemap.includes('<urlset'), 'sitemap.xml root tag', 'sitemap missing <urlset>');
    assert(sitemap.includes(`${BASE_URL}</loc>`) || sitemap.includes(`${BASE_URL}/</loc>`), 'sitemap root homepage URL', 'sitemap missing homepage URL');
    assert(sitemap.includes(`${BASE_URL}/store`), 'sitemap /store URL', 'sitemap missing /store URL');
    assert(sitemap.includes(`${BASE_URL}/best-sellers`), 'sitemap /best-sellers URL', 'sitemap missing /best-sellers');
    assert(sitemap.includes(`${BASE_URL}/new-arrivals`), 'sitemap /new-arrivals URL', 'sitemap missing /new-arrivals');
    assert(sitemap.includes(`${BASE_URL}/about`), 'sitemap /about URL', 'sitemap missing /about');
    assert(sitemap.includes(`${BASE_URL}/faq`), 'sitemap /faq URL', 'sitemap missing /faq');
    assert(sitemap.includes(`${BASE_URL}/returns`), 'sitemap /returns URL', 'sitemap missing /returns');
    assert(!sitemap.includes('/dashboard'), 'sitemap excludes /dashboard', 'sitemap must not include /dashboard');
    assert(!sitemap.includes('/cart'), 'sitemap excludes /cart', 'sitemap must not include /cart');
  }

  // 3. Fetch products to test
  let products: any[] = [];
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (!error && data && data.length > 0) {
      products = data.filter((p: any) => p.status !== 'archived');
    }
  } catch {}
  if (products.length === 0) {
    products = SEED_FALLBACK_PRODUCTS.filter((p: any) => p.status !== 'archived');
  }

  // 4. Verify Static Pages in dist/
  console.log('📋 Checking Static Prerendered Pages in dist/...');
  const staticPagesToCheck = [
    { name: 'الرئيسية (/)', file: path.join(DIST_DIR, 'index.html'), expectedH1: 'بيجامات نسائية قطنية ومريحة في السعودية' },
    { name: 'المتجر (/store)', file: path.join(DIST_DIR, 'store', 'index.html'), expectedH1: 'بيجامات نسائية قطن' },
    { name: 'وصل حديثاً (/new-arrivals)', file: path.join(DIST_DIR, 'new-arrivals', 'index.html'), expectedH1: 'أحدث البيجامات النسائية القطنية' },
    { name: 'الأكثر طلباً (/best-sellers)', file: path.join(DIST_DIR, 'best-sellers', 'index.html'), expectedH1: 'الأكثر طلباً' },
    { name: 'العروض (/offers)', file: path.join(DIST_DIR, 'offers', 'index.html'), expectedH1: 'عروض وتخفيضات' },
    { name: 'عن المتجر (/about)', file: path.join(DIST_DIR, 'about', 'index.html'), expectedH1: 'عن متجر سولته' },
    { name: 'الأسئلة الشائعة (/faq)', file: path.join(DIST_DIR, 'faq', 'index.html'), expectedH1: 'الأسئلة الشائعة' },
    { name: 'الاستبدال والاسترجاع (/returns)', file: path.join(DIST_DIR, 'returns', 'index.html'), expectedH1: 'سياسة الاستبدال والاسترجاع' }
  ];

  for (const page of staticPagesToCheck) {
    assert(fs.existsSync(page.file), `${page.name} HTML generated`, `File missing: ${page.file}`);
    if (fs.existsSync(page.file)) {
      const html = fs.readFileSync(page.file, 'utf-8');

      // Canonical check
      const canonicalMatches = html.match(/<link\s+rel=["']canonical["'][^>]*>/gi) || [];
      assert(canonicalMatches.length === 1, `${page.name} single canonical tag`, `Found ${canonicalMatches.length} canonical tags`);

      // Description check
      const descMatches = html.match(/<meta\s+name=["']description["'][^>]*>/gi) || [];
      assert(descMatches.length === 1, `${page.name} single description tag`, `Found ${descMatches.length} description tags`);

      // Title check
      const titleMatches = html.match(/<title>(.*?)<\/title>/i);
      assert(!!titleMatches && titleMatches[1].trim().length > 10, `${page.name} title tag`, `Title is empty or invalid`);

      // H1 check
      const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
      assert(h1Matches.length === 1, `${page.name} single H1 tag`, `Expected 1 H1, found ${h1Matches.length}`);
      if (h1Matches.length > 0) {
        assert(h1Matches[0].includes(page.expectedH1), `${page.name} H1 content check`, `H1 does not contain expected phrase: "${page.expectedH1}"`);
      }

      // Ensure NO Product schema is present on non-product pages
      const scriptRegex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
      let m;
      let hasProductSchema = false;
      while ((m = scriptRegex.exec(html)) !== null) {
        try {
          const parsed = JSON.parse(m[1]);
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          if (arr.some(item => item['@type'] === 'Product')) {
            hasProductSchema = true;
          }
        } catch(e) {}
      }
      assert(!hasProductSchema, `${page.name} has no Product schema`, `Found unauthorized Product schema on static page ${page.name}`);
    }
  }

  // 5. Verify Product Pages & Structured Data
  console.log(`\n📋 Checking ${products.length} Product Pages & Structured Data (JSON-LD)...`);
  for (const p of products) {
    const slug = getProductSlug({ id: p.id, nameEn: p.name_en || p.nameEn, nameAr: p.name_ar || p.nameAr, slug: p.slug });
    const nameAr = p.name_ar || p.nameAr || p.name;
    const price = Number(p.price || p.price_sa || p.priceSA || 69);
    const stock = Number(p.stock ?? 0);
    const expectedUrl = `${BASE_URL}/product/${slug}`;

    const prodFile = path.join(DIST_DIR, 'product', slug, 'index.html');
    assert(fs.existsSync(prodFile), `Product ${nameAr} (${slug}) prerender file`, `Missing ${prodFile}`);

    if (fs.existsSync(prodFile)) {
      const html = fs.readFileSync(prodFile, 'utf-8');

      // 1. Single Title
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      assert(!!titleMatch && titleMatch[1].includes('سولته'), `Product ${nameAr} title has brand`, `Title missing brand 'سولته': ${titleMatch?.[1]}`);

      // 2. Exactly 1 Canonical Tag
      const canonicalMatches = html.match(/<link\s+rel=["']canonical["'][^>]*>/gi) || [];
      assert(canonicalMatches.length === 1, `Product ${nameAr} single canonical`, `Found ${canonicalMatches.length} canonical tags`);
      const canonicalHref = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1];
      assert(canonicalHref === expectedUrl, `Product ${nameAr} canonical URL match`, `Expected ${expectedUrl}, got ${canonicalHref}`);

      // 3. Exactly 1 Description
      const descMatches = html.match(/<meta\s+name=["']description["'][^>]*>/gi) || [];
      assert(descMatches.length === 1, `Product ${nameAr} single description`, `Found ${descMatches.length} description tags`);

      // 4. Exactly 1 H1
      const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
      assert(h1Matches.length === 1, `Product ${nameAr} single H1 tag`, `Expected 1 H1, found ${h1Matches.length}`);

      // 5. JSON-LD Product Schema
      const scriptRegex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
      let match;
      const jsonLdObjects: any[] = [];
      while ((match = scriptRegex.exec(html)) !== null) {
        try {
          const parsed = JSON.parse(match[1]);
          if (Array.isArray(parsed)) {
            jsonLdObjects.push(...parsed);
          } else {
            jsonLdObjects.push(parsed);
          }
        } catch (e: any) {
          assert(false, `Product ${nameAr} JSON-LD parse`, `JSON-LD parse error: ${e.message}`);
        }
      }

      const productSchemas = jsonLdObjects.filter(s => s['@type'] === 'Product');
      assert(productSchemas.length === 1, `Product ${nameAr} exactly 1 Product schema`, `Found ${productSchemas.length} Product schemas`);

      if (productSchemas.length === 1) {
        const schema = productSchemas[0];
        // 1. Required Product Fields
        assert(typeof schema.name === 'string' && schema.name.trim() === nameAr.trim(), `Product ${nameAr} name match`, `Expected "${nameAr}", got "${schema.name}"`);
        assert(Array.isArray(schema.image) && schema.image.length > 0 && schema.image[0].startsWith('http'), `Product ${nameAr} image absolute URL`, `Got ${JSON.stringify(schema.image)}`);
        assert(typeof schema.description === 'string' && schema.description.length > 10, `Product ${nameAr} description present`, `Missing or short description`);
        assert(typeof schema.sku === 'string' && schema.sku.length > 0, `Product ${nameAr} sku present`, `Missing SKU`);

        // 2. Brand
        assert(schema.brand && schema.brand['@type'] === 'Brand' && schema.brand.name === 'سولته', `Product ${nameAr} brand.name match`, `Expected Brand 'سولته', got ${JSON.stringify(schema.brand)}`);

        // 3. Offers
        assert(schema.offers && schema.offers['@type'] === 'Offer', `Product ${nameAr} offers is Offer`, `offers missing or invalid`);
        assert(schema.offers?.priceCurrency === 'SAR', `Product ${nameAr} offers.priceCurrency === SAR`, `Got ${schema.offers?.priceCurrency}`);
        const parsedOfferPrice = Number(schema.offers?.price);
        assert(!isNaN(parsedOfferPrice) && parsedOfferPrice > 0, `Product ${nameAr} offers.price valid positive number`, `Expected valid price, got ${schema.offers?.price}`);
        const expectedAvailability = stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
        assert(schema.offers?.availability === expectedAvailability, `Product ${nameAr} offers.availability match`, `Expected ${expectedAvailability}, got ${schema.offers?.availability}`);
        assert(schema.offers?.url === expectedUrl, `Product ${nameAr} offers.url match`, `Expected ${expectedUrl}, got ${schema.offers?.url}`);
        assert(schema.offers?.itemCondition === 'https://schema.org/NewCondition', `Product ${nameAr} offers.itemCondition NewCondition`, `Got ${schema.offers?.itemCondition}`);

        // 4. Strict Zero-Fabrication Enforcement
        assert(!schema.aggregateRating, `Product ${nameAr} no fake aggregateRating`, 'Found unverified aggregateRating in schema');
        assert(!schema.review, `Product ${nameAr} no fake review`, 'Found unverified review in schema');
        assert(!schema.gtin && !schema.gtin13 && !schema.mpn, `Product ${nameAr} no fabricated GTIN/MPN`, 'Found unverified GTIN/MPN');
      }
    }
  }

  // Summary
  console.log('\n====================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  console.log(`TOTAL CHECKS: ${results.length}`);
  console.log(`✅ PASSED: ${passedCount}`);
  console.log(`❌ FAILED: ${failedCount}`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    console.error(`💥 SEO verification failed with ${failedCount} errors.`);
    process.exit(1);
  } else {
    console.log('🎉 ALL TECHNICAL SEO AUDIT CHECKS PASSED WITH 100% SUCCESS!');
  }
}

verifySeo().catch(err => {
  console.error('Unexpected error in verifySeo:', err);
  process.exit(1);
});
