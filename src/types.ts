export type Country = 'EG' | 'SA';
export type Currency = 'EGP' | 'SAR';

export interface Category {
  id: string;
  name?: string; // Legacy
  nameAr: string;
  nameEn: string;
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
  currency?: string;
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
  featured?: boolean;
  status?: 'active' | 'draft' | 'archived';
  sku?: string;
  salePriceEG?: number;
  salePriceSA?: number;
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

export type OrderStatus = 'new' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';

export interface InventoryLog {
  id: string;
  productId: string;
  variant: string; // color-size
  change: number;
  reason: string;
  date: string;
  adminId: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  adminId: string;
  date: string;
}

export type CouponType = 'percentage' | 'fixed' | 'free_shipping';

export interface AdvancedCoupon {
  id: string;
  code: string;
  type: CouponType;
  value: number; // percentage or fixed amount
  expirationDate?: string;
  usageLimit?: number;
  timesUsed: number;
  minOrderValue?: number;
  applicableCategories?: string[];
  applicableCollections?: string[];
  applicableProducts?: string[];
  description: string;
  active: boolean;
}

export type LoyaltyTier = 'silver' | 'gold' | 'platinum' | 'diamond';

export interface CustomerProfile {
  id: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  loyaltyTier: LoyaltyTier;
  points: number;
  joinedAt: string;
  totalSpent: number;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  country: Country;
  city: string;
  address: string;
  notes?: string;
  giftMessage?: string;
  giftCardTheme?: string;
  ribbon?: string;
  shippingFee?: number;
  trackingNumber?: string;
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
  status: OrderStatus;
  date: string;
}

export type DiscountType = 'percentage' | 'fixed';

export interface PromotionCampaign {
  id: string;
  name: string; // e.g. "Ramadan Sale" or "Flash Sale"
  description: string;
  discountType: DiscountType;
  discountValue: number; // Percentage or fixed amount
  startDate: string;
  endDate: string;
  isActive: boolean;
  applicableCategories?: string[];
  bannerText?: string;
  createdAt: string;
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

export interface Collection {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  imageUrl?: string;
  author: string;
  category: string;
  tags?: string[];
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
  status: 'draft' | 'published';
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
  };
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  orderIndex: number;
}


