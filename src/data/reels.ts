export interface Reel {
  id: number;
  file: string; // base name inside /reels/
  slug: string; // product slug (as in the sitemap)
  title: string;
}

export const REELS: Reel[] = [
  { id: 1, file: 'reel-1-sukkar-ivory', slug: 'sugar-bow-pajama-set-ivory-white', title: 'بيجامة سُكّر بالفيونكة، أبيض عاجي' },
  { id: 2, file: 'reel-2-rosa', slug: 'rosa-evening-bloom-pajama-set', title: 'بيجامة روزا، ورد المساء' },
  { id: 3, file: 'reel-3-rouge', slug: 'red-polka-dot-strappy-cotton-pajama', title: 'بيجامة روج المنقّطة بحمالات' },
  { id: 4, file: 'reel-4-sukkar-wardi', slug: 'sugar-bow-pajama-set-royal-pink', title: 'بيجامة سُكّر بالفيونكة، وردي ملكي' },
  { id: 5, file: 'reel-5-rozy-zuhur', slug: 'pink-floral-crinkle-cotton-womens-pajama', title: 'بيجامة روزي، زهور' },
  { id: 6, file: 'reel-6-flora-tulip', slug: 'tulip-crinkle-cotton-womens-pajama', title: 'بيجامة فلورا، توليب' },
  { id: 7, file: 'reel-7-rozy-pink', slug: 'rosie-soft-crinkle-cotton-pajama', title: 'بيجامة روزي الوردية، قطن كوريشة ناعم' }
];

export const REELS_MUSIC_CREDIT =
  'Music: Ibn Al-Noor by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0';

export const findReelForSlug = (...slugs: Array<string | undefined>): Reel | undefined =>
  REELS.find(r => slugs.some(s => !!s && (s === r.slug || s.endsWith('-' + r.slug) || s.includes(r.slug))));
