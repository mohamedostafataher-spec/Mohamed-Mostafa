// Real terms only: delivery to all KSA cities, 2-4 business days, 40 SAR (free over 299 SAR), COD or bank transfer.
export const DELIVERY_CITIES: { slug: string; ar: string }[] = [
  { slug: 'riyadh', ar: 'الرياض' },
  { slug: 'jeddah', ar: 'جدة' },
  { slug: 'dammam', ar: 'الدمام' },
  { slug: 'khobar', ar: 'الخبر' },
  { slug: 'makkah', ar: 'مكة المكرمة' },
  { slug: 'madinah', ar: 'المدينة المنورة' },
  { slug: 'taif', ar: 'الطائف' },
  { slug: 'buraydah', ar: 'بريدة' },
  { slug: 'abha', ar: 'أبها' },
  { slug: 'tabuk', ar: 'تبوك' }
];

export const cityTitle = (ar: string) => `بيجامات نسائية مع توصيل إلى ${ar} | سولته`;
export const cityDesc = (ar: string) =>
  `اطلبي بيجامة نسائية من سولته مع توصيل إلى ${ar} خلال 2 إلى 4 أيام عمل. الشحن 40 ر.س ومجاني فوق 299 ر.س. الدفع عند الاستلام أو تحويل بنكي. استبدال واسترجاع خلال 14 يوم.`;
