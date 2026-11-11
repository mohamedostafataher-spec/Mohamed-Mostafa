# SULTA PERFORMANCE BEFORE REPORT

## Baseline Measurements (PageSpeed Insights - Mobile)
- **Performance Score**: 55
- **Accessibility**: 96
- **Best Practices**: 96
- **SEO**: 100
- **First Contentful Paint (FCP)**: 0.9 seconds
- **Largest Contentful Paint (LCP)**: 10.5 seconds
- **Total Blocking Time (TBT)**: 0 milliseconds
- **Cumulative Layout Shift (CLS)**: 0.449
- **Speed Index**: 1.6 seconds

## Identified Issues & Opportunities
1. **Oversized Images**: Estimated savings of 2,426 KiB. Product images up to 2160px are being served for 319-425px display areas.
2. **Layout Stability (CLS)**:
   - Footer shift: ~0.256
   - Product card shift: ~0.130
   - Google Fonts causing shifts.
3. **LCP Delay**: 10.5s LCP suggests critical images are not prioritized or are blocked by JS.
4. **Caching**: Supabase images have 1-hour TTL. Potential savings of 903 KiB.
5. **Render-blocking CSS**: Main CSS bundle blocks rendering for ~280ms.
6. **Unused JavaScript**: ~122 KiB of unused code in main bundles.
7. **API Errors**: HTTP 400 for `categories`, `collections`, and `reviews`.
8. **Console Errors**: Invalid SVG path data.
9. **Inefficient Preconnects**: Unused preconnect to `wsrv.nl`.

## Root Cause Analysis
- `src/services/db.ts`: `cleanImgUrl` ignores the width parameter, serving full-size images always.
- `src/components/SultaImage.tsx`: Uses `aspect-[3/4]` but might still contribute to CLS if containers aren't stable or data loads late.
- Footer might be shifting due to late-loading content or dynamic heights.
- Supabase queries in `src/services/db.ts` might have incorrect column names or missing tables causing 400 errors.
