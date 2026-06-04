import { Product, Review, DiscountCoupon, Order, InStockAlert, Category, Settings, ContactMessage, NewsletterSubscription } from '../types';
import { createClient } from '@supabase/supabase-js';

// --- ROBUST CONFIGURATION ---
const DEFAULT_URL = 'https://fwadgmhabzaudusxghnh.supabase.co';
const DEFAULT_KEY = 'NOT_CONFIGURED';

let urlToUse = DEFAULT_URL;
let keyToUse = DEFAULT_KEY;

// Safely extract from Vite env if available
try {
  const env = (import.meta as any).env;
  if (env) {
    const vUrl = env.VITE_SUPABASE_URL;
    const vKey = env.VITE_SUPABASE_ANON_KEY;

    if (typeof vUrl === 'string' && vUrl.trim().startsWith('http') && vUrl.includes('.')) {
      urlToUse = vUrl.trim();
    }
    
    // A real Supabase key is a long JWT (usually > 50 chars). 
    // We reject placeholders like 'sb_publishable_...' or 'YOUR_...'
    if (typeof vKey === 'string' && vKey.trim().length > 20 && !vKey.startsWith('sb_') && !vKey.includes('YOUR_')) {
      keyToUse = vKey.trim();
    }
  }
} catch (e) {
    // Environment not available, use defaults
}

// --- DUMMY CLIENT (FALLBACK) ---
const createDummyClient = () => {
    const p = (val: any = null) => Promise.resolve({ data: val, error: null });
    const chainable = () => ({
        select: () => ({ 
            order: () => ({ 
                limit: () => ({ single: () => p() }), 
                then: (cb: any) => cb({ data: [], error: null }) 
            }),
            eq: () => ({ 
                limit: () => ({ single: () => p() }), 
                then: (cb: any) => cb({ data: [], error: null }) 
            }),
            limit: () => ({ single: () => p() }),
            then: (cb: any) => cb({ data: [], error: null }) 
        }),
        insert: () => p(),
        upsert: () => p(),
        update: () => ({ eq: () => p() }),
        delete: () => ({ eq: () => p() }),
        insert_multiple: () => p(),
    });

    return {
        from: () => chainable(),
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signInWithPassword: () => p(),
            signUp: () => p(),
            signOut: () => Promise.resolve({ error: null }),
        },
        channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
        removeChannel: () => {},
        storage: { from: () => ({ upload: () => p(), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) }
    };
};

// --- INITIALIZATION ---
let supabaseInstance: any;

// Final check: URL must be valid for the Supabase SDK to even try
const isUrlStructurallyValid = (u: string) => {
    try {
        if (!u || typeof u !== 'string') return false;
        if (!u.startsWith('http')) return false;
        // Basic check for presence of a domain part
        return u.split('.').length >= 2;
    } catch {
        return false;
    }
};

if (isUrlStructurallyValid(urlToUse) && keyToUse !== DEFAULT_KEY) {
    try {
        supabaseInstance = createClient(urlToUse, keyToUse);
    } catch (err) {
        console.error("[SULTA DB] createClient threw an error:", err);
        supabaseInstance = createDummyClient();
    }
} else {
    supabaseInstance = createDummyClient();
}

export const supabase = supabaseInstance;

// ==========================================
// SULTA COUTURE SUPABASE CONNECTION
// ==========================================

function mapCategory(data: any): Category {
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    imageUrl: data.image_url || data.imageUrl
  };
}

function mapSettings(data: any): Settings {
  return {
    siteName: data.site_name,
    logo: data.logo,
    promoBannerAr: data.promo_banner_ar,
    promoEndTime: data.promo_end_time,
    heroMiniAlertAr: data.hero_mini_alert_ar,
    heroSubtitleAr: data.hero_subtitle_ar,
    heroDescriptionAr: data.hero_description_ar,
    heroImages: Array.isArray(data.hero_images) ? data.hero_images : (data.hero_images ? JSON.parse(data.hero_images) : []),
    contactEmail: data.contact_email,
    contactPhone: data.contact_phone,
    whatsapp: data.whatsapp,
    instagram: data.instagram,
    facebook: data.facebook,
    tiktok: data.tiktok,
    facebookPixelId: data.facebook_pixel_id,
    googleAnalyticsId: data.google_analytics_id,
    snapchatPixelId: data.snapchat_pixel_id,
    tiktokPixelId: data.tiktok_pixel_id,
    shippingRates: Array.isArray(data.shipping_rates) ? data.shipping_rates : (data.shipping_rates ? JSON.parse(data.shipping_rates) : []),
    defaultShippingFee: Number(data.default_shipping_fee ?? 0)
  };
}

function mapProduct(data: any): Product {
  return {
    id: data.id,
    nameAr: data.name_ar || '',
    nameEn: data.name_en || '',
    category: data.category || 'new',
    categoryAr: data.category_ar || '',
    priceEG: Number(data.price_eg ?? 0),
    priceSA: Number(data.price_sa ?? 0),
    descriptionAr: data.description_ar || '',
    descriptionEn: data.description_en || '',
    fabricAr: data.fabric_ar || '',
    fabricEn: data.fabric_en || '',
    washInstructionsAr: data.wash_instructions_ar || '',
    images: Array.isArray(data.images) ? data.images : (data.images ? JSON.parse(data.images) : []),
    video: data.video || undefined,
    colors: Array.isArray(data.colors) ? data.colors : (data.colors ? JSON.parse(data.colors) : []),
    sizes: Array.isArray(data.sizes) ? data.sizes : (data.sizes ? JSON.parse(data.sizes) : []),
    isBestSeller: !!data.is_best_seller,
    rating: Number(data.rating ?? 5),
    reviewsCount: Number(data.reviews_count ?? 0),
    stock: Number(data.stock ?? 0)
  };
}

function mapReview(data: any): Review {
  return {
    id: data.id,
    username: data.username || '',
    avatar: data.avatar || '',
    rating: Number(data.rating ?? 5),
    comment: data.comment || '',
    date: data.date || '',
    country: data.country || 'SA',
    productName: data.product_name || ''
  };
}

function mapCoupon(data: any): DiscountCoupon {
  return {
    code: data.code || '',
    discountPercent: Number(data.discount_percent ?? 0),
    description: data.description || ''
  };
}

function mapOrder(data: any): Order {
  return {
    id: data.id,
    customerName: data.customer_name || '',
    phone: data.phone || '',
    country: data.country || 'SA',
    city: data.city || '',
    address: data.address || '',
    notes: data.notes || undefined,
    giftMessage: data.gift_message || undefined,
    giftCardTheme: data.gift_card_theme || undefined,
    items: Array.isArray(data.items) ? data.items : (data.items ? JSON.parse(data.items) : []),
    totalPrice: Number(data.total_price ?? 0),
    currency: data.currency || 'SAR',
    paymentMethod: data.payment_method || '',
    status: data.status || 'pending',
    date: data.date || ''
  };
}

export const dbService = {
  supabase,
  
  uploadImage: async (file: File): Promise<string | null> => {
    try {
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (err) {
      console.error("Error uploading image to Supabase Storage:", err);
      return null;
    }
  },

  getSettings: async (): Promise<Settings | null> => {
    const { data, error } = await supabase.from('settings').select('*').limit(1).single();
    if (error) return null;
    return data ? mapSettings(data) : null;
  },

  updateSettings: async (settings: Partial<Settings>): Promise<boolean> => {
    try {
      const { data: existing } = await supabase.from('settings').select('id').limit(1).single();
      
      const payload: any = {
        site_name: settings.siteName,
        logo: settings.logo,
        promo_banner_ar: settings.promoBannerAr,
        promo_end_time: settings.promoEndTime,
        hero_mini_alert_ar: settings.heroMiniAlertAr,
        hero_subtitle_ar: settings.heroSubtitleAr,
        hero_description_ar: settings.heroDescriptionAr,
        hero_images: settings.heroImages,
        contact_email: settings.contactEmail,
        contact_phone: settings.contactPhone,
        whatsapp: settings.whatsapp,
        instagram: settings.instagram,
        facebook: settings.facebook,
        tiktok: settings.tiktok,
        facebook_pixel_id: settings.facebookPixelId,
        google_analytics_id: settings.googleAnalyticsId,
        snapchat_pixel_id: settings.snapchatPixelId,
        tiktok_pixel_id: settings.tiktokPixelId,
        shipping_rates: settings.shippingRates,
        default_shipping_fee: settings.defaultShippingFee
      };

      // Remove undefined keys
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      let error;
      if (existing && existing.id) {
        const result = await supabase.from('settings').update(payload).eq('id', existing.id);
        error = result.error;
      } else {
        const result = await supabase.from('settings').insert([{ id: 'default', ...payload }]);
        error = result.error;
      }

      if (error) {
        console.error("Error updating settings:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Exception updating settings:", err);
      return false;
    }
  },

  getFaqs: async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase.from('faq').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  },

  subscribeCategories: (
    onSuccess: (categories: Category[]) => void, 
    _onError: (error: any) => void
  ): (() => void) => {
    supabase.from('categories').select('*').then(({ data }) => {
      if (data) onSuccess(data.map(mapCategory));
    });

    const channel = supabase
      .channel('public:categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, async () => {
        const { data } = await supabase.from('categories').select('*');
        if (data) onSuccess(data.map(mapCategory));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  saveCategory: async (category: Category): Promise<void> => {
    const { error } = await supabase
      .from('categories')
      .upsert([{
        id: category.id,
        name: category.name,
        slug: category.slug,
        image_url: category.imageUrl
      }]);
    if (error) throw error;
  },

  deleteCategory: async (categoryId: string): Promise<void> => {
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    if (error) throw error;
  },

  subscribeProducts: (
    onSuccess: (products: Product[]) => void, 
    _onError: (error: any) => void
  ): (() => void) => {
    supabase.from('products').select('*').then(({ data }) => {
      if (data) onSuccess(data.map(mapProduct));
    });

    const channel = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        const { data } = await supabase.from('products').select('*');
        if (data) onSuccess(data.map(mapProduct));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeCoupons: (
    onSuccess: (coupons: DiscountCoupon[]) => void, 
    _onError: (error: any) => void
  ): (() => void) => {
    supabase.from('coupons').select('*').then(({ data }) => {
      if (data) onSuccess(data.map(mapCoupon));
    });

    const channel = supabase
      .channel('public:coupons')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, async () => {
        const { data } = await supabase.from('coupons').select('*');
        if (data) onSuccess(data.map(mapCoupon));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeReviews: (
    onSuccess: (reviews: Review[]) => void, 
    _onError: (error: any) => void
  ): (() => void) => {
    supabase.from('reviews').select('*').then(({ data }) => {
      if (data) onSuccess(data.map(mapReview));
    });

    const channel = supabase
      .channel('public:reviews')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, async () => {
        const { data } = await supabase.from('reviews').select('*');
        if (data) onSuccess(data.map(mapReview));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeOrders: (
    onSuccess: (orders: Order[]) => void, 
    _onError: (error: any) => void
  ): (() => void) => {
    supabase.from('orders').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) onSuccess(data.map(mapOrder));
    });

    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
        const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (data) onSuccess(data.map(mapOrder));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  saveOrder: async (order: Order): Promise<void> => {
    const { error } = await supabase.from('orders').insert([{
      id: order.id,
      customer_name: order.customerName,
      phone: order.phone,
      country: order.country,
      city: order.city,
      address: order.address,
      notes: order.giftMessage 
        ? `${order.notes || ''} [بطاقة إهداء ثيم ${order.giftCardTheme || 'عام'}: ${order.giftMessage}]`
        : order.notes,
      items: order.items,
      total_price: order.totalPrice,
      currency: order.currency,
      payment_method: order.paymentMethod,
      status: order.status,
      date: order.date
    }]);
    if (error) throw error;
  },

  updateProductStock: async (productId: string, _currentProduct: Product, nextStock: number): Promise<void> => {
    const { error } = await supabase
      .from('products')
      .update({ stock: nextStock })
      .eq('id', productId);
    if (error) throw error;
  },

  saveProduct: async (product: Product): Promise<void> => {
    const { error } = await supabase
      .from('products')
      .upsert([{
        id: product.id,
        name_ar: product.nameAr,
        name_en: product.nameEn,
        category: product.category,
        category_ar: product.categoryAr,
        price_eg: product.priceEG,
        price_sa: product.priceSA,
        description_ar: product.descriptionAr,
        description_en: product.descriptionEn,
        fabric_ar: product.fabricAr,
        fabric_en: product.fabricEn,
        wash_instructions_ar: product.washInstructionsAr,
        images: product.images,
        video: product.video || null,
        colors: product.colors,
        sizes: product.sizes,
        is_best_seller: product.isBestSeller,
        rating: product.rating,
        reviews_count: product.reviewsCount,
        stock: product.stock,
        name: product.nameEn,
        slug: product.id.toLowerCase().replace(/\s+/g, '-'),
        description: product.descriptionEn
      }]);
    if (error) throw error;
  },

  deleteProduct: async (productId: string): Promise<void> => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw error;
  },

  saveCoupon: async (coupon: DiscountCoupon): Promise<void> => {
    const { error } = await supabase
      .from('coupons')
      .upsert([{
        code: coupon.code,
        discount_percent: coupon.discountPercent,
        description: coupon.description,
        discount_value: 0
      }]);
    if (error) throw error;
  },

  deleteCoupon: async (code: string): Promise<void> => {
    const { error } = await supabase.from('coupons').delete().eq('code', code);
    if (error) throw error;
  },

  updateOrder: async (order: Order): Promise<void> => {
    const { error } = await supabase.from('orders').update({ status: order.status }).eq('id', order.id);
    if (error) throw error;
  },

  saveReview: async (review: Review): Promise<void> => {
    const { error } = await supabase.from('reviews').insert([{
      id: review.id,
      username: review.username,
      avatar: review.avatar,
      rating: review.rating,
      comment: review.comment,
      date: review.date,
      country: review.country,
      product_name: review.productName
    }]);
    if (error) throw error;
  },

  saveStockAlert: async (alert: InStockAlert): Promise<void> => {
    const { error } = await supabase.from('stock_alerts').insert([{
      id: alert.id,
      product_id: alert.productId,
      product_name: alert.productName,
      color: alert.color,
      size: alert.size,
      email_or_phone: alert.emailOrPhone,
      date: alert.date
    }]);
    
    if (error) {
       console.warn("Stock alerts table error, using local storage fallback");
       try {
         const stored = JSON.parse(localStorage.getItem('local_stock_alerts') || '[]');
         stored.push(alert);
         localStorage.setItem('local_stock_alerts', JSON.stringify(stored));
       } catch (storageError) {
         console.error("Local storage fallback failed:", storageError);
       }
    }
  },

  saveContactMessage: async (msg: ContactMessage): Promise<void> => {
    const { error } = await supabase.from('contact_messages').insert([{
      id: msg.id,
      name: msg.name,
      email: msg.email,
      message: msg.message,
      date: msg.date
    }]);
    if (error) throw error;
  },

  saveNewsletterSubscription: async (sub: NewsletterSubscription): Promise<void> => {
    const { error } = await supabase.from('newsletter_subscriptions').insert([{
      id: sub.id,
      email: sub.email,
      phone: sub.phone,
      date: sub.date
    }]);
    if (error) throw error;
  }
};
