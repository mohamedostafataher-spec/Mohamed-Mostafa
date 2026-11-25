// Arabic-friendly normalisation: hamza forms, ya/alef maqsura, taa marbuta, diacritics and "بيجامة/بجامة" spellings
export const normAr = (t: string) =>
  (t || '')
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/بيجام/g, 'بجام')
    .replace(/\s+/g, ' ')
    .trim();

export const matchesTokens = (haystack: string, query: string) => {
  const hay = normAr(haystack);
  const tokens = normAr(query).split(' ').filter(Boolean);
  return tokens.length > 0 && tokens.every(t => hay.includes(t));
};
