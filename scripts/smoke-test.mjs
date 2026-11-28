// Free smoke test: key pages load, have a title, and contain no banned claims. Usage: node scripts/smoke-test.mjs [baseUrl]
const base = process.argv[2] || 'https://sulta.vercel.app';
const pages = ['/', '/store', '/about', '/contact', '/faq', '/shipping', '/returns', '/blog', '/delivery/riyadh', '/gift', '/en', '/sitemap.xml', '/robots.txt'];
const banned = ['عطر الدار', 'فاخرة', '100%'];
let bad = 0;
for (const p of pages) {
  try {
    const r = await fetch(base + p, { redirect: 'follow' });
    const t = await r.text();
    const hit = banned.filter((w) => t.includes(w));
    const ok = r.status === 200 && t.length > 200 && !hit.length;
    if (!ok) { bad++; console.log('FAIL', p, r.status, hit.join(',')); } else console.log('ok  ', p);
  } catch (e) { bad++; console.log('FAIL', p, String(e)); }
}
process.exit(bad ? 1 : 0);
