export const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\u0621-\u064A\u0660-\u0669a-zA-Z0-9-]+/g, '') // Remove all non-word chars (allow Arabic)
    .replace(/--+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')        // Trim - from start of text
    .replace(/-+$/, '');       // Trim - from end of text
};

export const getProductSlug = (product: { id: string; nameEn?: string; nameAr?: string }) => {
  const base = product.nameEn || product.nameAr || 'product';
  return `${product.id}-${slugify(base)}`;
};

export const getIdFromSlug = (slug: string) => {
  if (!slug) return '';
  
  // 1. Check if slug starts with or is a UUID (36 chars: 8-4-4-4-12)
  const uuidRegex = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/;
  const uuidMatch = slug.match(uuidRegex);
  if (uuidMatch) {
    return uuidMatch[1];
  }

  // 2. If it starts with "prod_", extract up to the hyphen after prod_xxx
  if (slug.startsWith('prod_')) {
    const nextHyphen = slug.indexOf('-', 5);
    return nextHyphen > -1 ? slug.substring(0, nextHyphen) : slug;
  }

  // 3. Fallback: split by hyphen and return first part
  const parts = slug.split('-');
  return parts[0];
};

