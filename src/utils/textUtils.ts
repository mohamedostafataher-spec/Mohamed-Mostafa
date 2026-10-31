/**
 * Parses raw Supabase product description, extracts clean Arabic text
 * before any " | " or "[METADATA_SULTA_V2]" tag.
 */
export function parseCleanArabicDescription(rawDescription?: string): string {
  if (!rawDescription) return '';

  let cleaned = rawDescription;

  // Remove metadata block if present
  const metaIndex = cleaned.indexOf('[METADATA_SULTA_V2]');
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
  if (!clean) return 'متجر سولتة للأزياء الراقية والبيجامات الفاخرة. تصاميم ملكية بخامات عالمية وتوصيل سريع لكل مدن المملكة.';
  
  if (clean.length <= 155) return clean;

  const truncated = clean.substring(0, 155);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 100) {
    return truncated.substring(0, lastSpace).trim() + '...';
  }
  return truncated.trim() + '...';
}

/**
 * Formats product title to "{اسم المنتج} | سولتة" ensuring brand appears once and length <= 60 chars.
 */
export function formatProductTitle(productName?: string): string {
  const baseName = (productName || 'قطعة ملكية فاخرة').split(' | ')[0].trim();
  const suffix = ' | سولتة';
  const maxLength = 60;

  if ((baseName + suffix).length <= maxLength) {
    return `${baseName}${suffix}`;
  }

  // If too long, truncate base name
  const availableLength = maxLength - suffix.length - 3; // 3 for '...'
  const truncatedBase = baseName.substring(0, availableLength).trim();
  return `${truncatedBase}...${suffix}`;
}
