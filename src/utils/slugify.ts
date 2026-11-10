export const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\u0621-\u064A\u0660-\u0669a-zA-Z0-9-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export const PRODUCT_SLUGS: Record<string, string> = {
  '51005136-8066-4844-8efe-718cd7644e6b': 'red-polka-dot-strappy-cotton-pajama',
  '614f6daa-d291-410b-a450-be23de75f868': 'tulip-crinkle-cotton-womens-pajama',
  '78f851f3-5f75-4153-9fbe-0e8ad54825be': 'pink-floral-crinkle-cotton-womens-pajama',
  '54929551-5958-4b33-9ff9-abe83722cb78': 'sugar-bow-pajama-set-royal-pink',
  '8d738e1c-0861-4569-8949-fc2d98c4fa50': 'sugar-bow-pajama-set-ivory-white',
  'bf2ba4f4-9c60-42d1-8566-b2e2735c3bdc': 'rosa-evening-bloom-pajama-set',
  '1d4e8104-17c9-4b64-8300-38340bdeaa18': 'classic-dot-pajama-set'
};

export const SLUG_TO_ID_MAP: Record<string, string> = {
  // Primary current slugs
  'red-polka-dot-strappy-cotton-pajama': '51005136-8066-4844-8efe-718cd7644e6b',
  'tulip-crinkle-cotton-womens-pajama': '614f6daa-d291-410b-a450-be23de75f868',
  'pink-floral-crinkle-cotton-womens-pajama': '78f851f3-5f75-4153-9fbe-0e8ad54825be',
  'sugar-bow-pajama-set-royal-pink': '54929551-5958-4b33-9ff9-abe83722cb78',
  'sugar-bow-pajama-set-ivory-white': '8d738e1c-0861-4569-8949-fc2d98c4fa50',
  'rosa-evening-bloom-pajama-set': 'bf2ba4f4-9c60-42d1-8566-b2e2735c3bdc',
  'classic-dot-pajama-set': '1d4e8104-17c9-4b64-8300-38340bdeaa18',

  // Backward compatibility redirects & mappings
  'red-polka-dot-strappy-pajama': '51005136-8066-4844-8efe-718cd7644e6b',
  'tulip-crinkle-cotton-pajama': '614f6daa-d291-410b-a450-be23de75f868',
  'floral-crinkle-cotton-pajama-box': '78f851f3-5f75-4153-9fbe-0e8ad54825be'
};

export const getProductSlug = (product: { id: string; nameEn?: string; nameAr?: string; slug?: string }) => {
  const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  if (product.id && PRODUCT_SLUGS[product.id]) {
    return PRODUCT_SLUGS[product.id];
  }
  if (product.slug && typeof product.slug === 'string' && product.slug.trim() && !isUuid(product.slug.trim())) {
    return product.slug.trim();
  }
  const base = product.nameEn || product.nameAr || 'product';
  return slugify(base);
};

export const getIdFromSlug = (slug: string) => {
  if (!slug) return '';
  const cleanSlug = slug.replace(/\/+$/, '').trim();

  // 1. Direct slug mapping
  if (SLUG_TO_ID_MAP[cleanSlug]) {
    return SLUG_TO_ID_MAP[cleanSlug];
  }

  // 2. Check if slug contains UUID
  const uuidRegex = /([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/;
  const uuidMatch = cleanSlug.match(uuidRegex);
  if (uuidMatch) {
    return uuidMatch[1];
  }

  // 3. Check if cleanSlug is formed like {id}-{slug}
  const parts = cleanSlug.split('-');
  if (parts.length >= 5) {
    const candidateUuid = parts.slice(0, 5).join('-');
    if (uuidRegex.test(candidateUuid)) {
      return candidateUuid;
    }
  }

  // 4. Fallback: Check if any known slug matches substring
  for (const [s, id] of Object.entries(SLUG_TO_ID_MAP)) {
    if (cleanSlug.includes(s)) return id;
  }

  return cleanSlug;
};
