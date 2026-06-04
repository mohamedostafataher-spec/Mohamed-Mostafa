export type Country = 'EG' | 'SA';
export type Currency = 'EGP' | 'SAR';

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  seo?: {
    titleAr?: string;
    titleEn?: string;
    descriptionAr?: string;
    descriptionEn?: string;
    metaTitleAr?: string;
    metaTitleEn?: string;
    metaDescriptionAr?: string;
    metaDescriptionEn?: string;
    keywordsAr?: string;
    keywordsEn?: string;
  };
}

export interface ShippingRate {
  regionAr: string;
  regionEn: string;
  fee: number;
}

export interface Settings {
  siteName: string;
  logo?: string;
  promoBannerAr?: string;
  promoEndTime?: string; // ISO string
  heroMiniAlertAr?: string;
  heroSubtitleAr?: string;
  heroDescriptionAr?: string;
  heroImages?: string[];
  contactEmail: string;
  contactPhone: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  facebookPixelId?: string;
  googleAnalyticsId?: string;
  snapchatPixelId?: string;
  tiktokPixelId?: string;
  shippingRates?: ShippingRate[];
  defaultShippingFee?: number;
}

export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  categoryAr: string;
  priceEG: number;
  priceSA: number;
  descriptionAr: string;
  descriptionEn: string;
  fabricAr: string;
  fabricEn: string;
  washInstructionsAr: string;
  images: string[];
  video?: string; // video link
  colors: { name: string; hex: string }[];
  sizes: string[];
  isBestSeller?: boolean;
  rating: number;
  reviewsCount: number;
  stock: number;
  shortDescription?: string;
  tags?: string[];
  season?: string;
  collection?: string;
  seo?: {
    metaTitleAr?: string;
    metaTitleEn?: string;
    metaDescriptionAr?: string;
    metaDescriptionEn?: string;
    keywordsAr?: string;
    keywordsEn?: string;
    ogTitleAr?: string;
    ogTitleEn?: string;
    ogDescriptionAr?: string;
    ogDescriptionEn?: string;
    schemaMarkup?: string;
    altTextAr?: string;
    altTextEn?: string;
    healthScore?: number;
    healthSuggestions?: string[];
    lastGenerated?: string;
  };
  faqs?: { q: string; a: string }[];
}

export interface Review {
  id: string;
  username: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  country: Country;
  productName: string;
}

export interface CartItem {
  product: Product;
  selectedColor: { name: string; hex: string };
  selectedSize: string;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  country: Country;
  city: string;
  address: string;
  notes?: string;
  giftMessage?: string;
  giftCardTheme?: string;
  ribbon?: string;
  shippingFee?: number;
  items: {
    productId: string;
    productName: string;
    color: string;
    size: string;
    quantity: number;
    price: number;
  }[];
  totalPrice: number;
  currency: Currency;
  paymentMethod: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  date: string;
}

export interface DiscountCoupon {
  code: string;
  discountPercent: number;
  description: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string;
}

export interface NewsletterSubscription {
  id: string;
  email: string;
  phone?: string;
  date: string;
}

export interface InStockAlert {
  id: string;
  productId: string;
  productName: string;
  color: string;
  size: string;
  emailOrPhone: string;
  date: string;
}
