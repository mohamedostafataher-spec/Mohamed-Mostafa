import { Product } from '../types';

export const SEED_FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'sulta-fb-1',
    nameAr: 'بيجامة قطن كوريشة فاخرة',
    nameEn: 'Sulta Cotton Pyjama',
    category: 'sleepwear',
    categoryAr: 'بيجامات',
    priceEG: 399,
    priceSA: 99,
    salePriceEG: 299,
    salePriceSA: 79,
    descriptionAr: 'بيجامة قطن ناعمة ومريحة',
    descriptionEn: 'Soft cotton pyjama',
    fabricAr: 'قطن ناعم',
    fabricEn: 'Soft Cotton',
    washInstructionsAr: 'غسيل لطيف بماء بارد',
    images: ['https://fwadgmhabzaudusxghnh.supabase.co/storage/v1/object/public/products/sulta_default.jpg'],
    colors: [{ name: 'Rose', hex: '#DF8A9D' }],
    sizes: ['One Size (45-80kg)'],
    rating: 5,
    reviewsCount: 12,
    stock: 15,
    status: 'active'
  }
];
