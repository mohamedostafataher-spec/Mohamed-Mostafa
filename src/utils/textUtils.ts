/**
 * Parses raw Supabase product description, extracts clean Arabic text
 * before any " | " or "[METADATA_Sulta_V2]" tag.
 */
export function parseCleanArabicDescription(rawDescription?: string): string {
  if (!rawDescription) return '';

  let cleaned = rawDescription;

  // Remove metadata block if present
  const metaIndex = cleaned.indexOf('[METADATA_Sulta_V2]');
  if (metaIndex !== -1) {
    cleaned = cleaned.substring(0, metaIndex);
  }

  // Split by separator " | " and take the first part (Arabic text)
  if (cleaned.includes(' | ')) {
    const parts = cleaned.split(' | ');
    cleaned = parts[0] || '';
  }

  return cleaned.trim();
}

/**
 * Truncates text to max 155 characters, ending cleanly on the last complete word.
 */
export function truncateTo155Words(text?: string): string {
  const clean = parseCleanArabicDescription(text);
  if (!clean) return 'متجر سولته للأزياء الراقية والبيجامات الفاخرة. تصاميم ملكية بخامات عالمية وتوصيل سريع لكل مدن المملكة.';
  
  if (clean.length <= 155) return clean;

  const truncated = clean.substring(0, 155);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 100) {
    return truncated.substring(0, lastSpace).trim() + '...';
  }
  return truncated.trim() + '...';
}

/**
 * Formats product title to "{اسم المنتج} | سولته" ensuring brand appears once and length <= 60 chars.
 */
export function formatProductTitle(productName?: string): string {
  if (!productName) return 'قطعة ملكية فاخرة | سولته';
  
  // Remove existing brand suffix if present to prevent double brand
  let cleanName = productName.replace(/\s*\|\s*سولته/g, '').replace(/\s*-\s*سولته/g, '').trim();
  // Replace internal '|' separators with ' - ' to retain color variant distinctions
  cleanName = cleanName.replace(/\s*\|\s*/g, ' - ');
  
  const suffix = ' | سولته';
  const maxLength = 60;

  if ((cleanName + suffix).length <= maxLength) {
    return `${cleanName}${suffix}`;
  }

  // If too long, truncate base name on complete word
  const availableLength = maxLength - suffix.length - 3; // 3 for '...'
  let truncatedBase = cleanName.substring(0, availableLength);
  const lastSpace = truncatedBase.lastIndexOf(' ');
  if (lastSpace > 20) {
    truncatedBase = truncatedBase.substring(0, lastSpace);
  }
  return `${truncatedBase.trim()}...${suffix}`;
}
