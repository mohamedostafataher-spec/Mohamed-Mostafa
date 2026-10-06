import { Product, Order, Settings } from '../types';

export interface ProductMetric {
  id: string;
  name: string;
  views: number;
  cartAdditions: number;
  ordersCount: number;
  conversionRate: number; // percentage
}

export interface PixelEventLog {
  id: string;
  timestamp: string;
  pixel: 'Meta (Facebook)' | 'TikTok' | 'Snapchat' | 'Google Analytics' | 'System';
  event: string;
  status: 'sent' | 'pending' | 'simulated';
  details: string;
  value?: number;
  currency?: string;
}

const STORAGE_KEY = 'sulta_product_analytics_telemetry';
const PIXEL_LOGS_KEY = 'sulta_pixel_event_logs';

interface TelemetryData {
  [productId: string]: {
    views?: number;
    cartAdditions?: number;
  };
}

// Global pixel event memory log for live debugging in Dashboard
let inMemoryPixelLogs: PixelEventLog[] = [];
let pixelLogListeners: ((logs: PixelEventLog[]) => void)[] = [];

// Helper to log pixel event
export const logPixelEvent = (
  pixel: PixelEventLog['pixel'],
  event: string,
  details: string,
  status: PixelEventLog['status'] = 'sent',
  value?: number,
  currency: string = 'SAR'
) => {
  const newLog: PixelEventLog = {
    id: 'px-' + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    pixel,
    event,
    status,
    details,
    value,
    currency
  };

  inMemoryPixelLogs = [newLog, ...inMemoryPixelLogs].slice(0, 50);
  try {
    localStorage.setItem(PIXEL_LOGS_KEY, JSON.stringify(inMemoryPixelLogs));
  } catch {}

  pixelLogListeners.forEach(listener => listener(inMemoryPixelLogs));
};

export const getPixelEventLogs = (): PixelEventLog[] => {
  if (inMemoryPixelLogs.length === 0) {
    try {
      const stored = localStorage.getItem(PIXEL_LOGS_KEY);
      if (stored) inMemoryPixelLogs = JSON.parse(stored);
    } catch {}
  }
  return inMemoryPixelLogs;
};

export const subscribePixelLogs = (cb: (logs: PixelEventLog[]) => void) => {
  pixelLogListeners.push(cb);
  cb(getPixelEventLogs());
  return () => {
    pixelLogListeners = pixelLogListeners.filter(l => l !== cb);
  };
};

// ==========================================
// PIXEL SCRIPTS DYNAMIC INJECTION
// ==========================================
declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
    ttq?: any;
    snaptr?: any;
    dataLayer?: any[];
    gtag?: any;
  }
}

let initializedPixels = {
  meta: false,
  tiktok: false,
  snapchat: false,
  google: false,
};

export const initPixels = (settings?: Partial<Settings> | null) => {
  if (!settings || typeof window === 'undefined') return;

  // 1. META (FACEBOOK) PIXEL
  const metaId = (settings.facebookPixelId || '').trim();
  if (metaId && !initializedPixels.meta) {
    try {
      (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function() {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = true;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

      window.fbq('init', metaId);
      window.fbq('track', 'PageView');
      initializedPixels.meta = true;
      logPixelEvent('Meta (Facebook)', 'init', `تم ربط معرف البيكسل (${metaId}) وتتبع PageView`);
    } catch (err: any) {
      console.warn('[Pixel] Meta initialization error:', err);
    }
  }

  // 2. TIKTOK PIXEL
  const tiktokId = (settings.tiktokPixelId || '').trim();
  if (tiktokId && !initializedPixels.tiktok) {
    try {
      (function(w: any, d: any, t: any) {
        w.TiktokAnalyticsObject = t;
        const ttq = (w[t] = w[t] || []);
        ttq.methods = [
          'page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready',
          'alias', 'group', 'enableCookie', 'disableCookie'
        ];
        ttq.setAndDefer = function(t: any, e: any) {
          t[e] = function() {
            t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
          };
        };
        for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
        ttq.instance = function(t: any) {
          const e = ttq._i[t] || [];
          for (let n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
          return e;
        };
        ttq.load = function(e: any, n: any) {
          const i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
          ttq._i = ttq._i || {};
          ttq._i[e] = [];
          ttq._i[e]._u = i;
          ttq._t = ttq._t || {};
          ttq._t[e] = +new Date();
          ttq._o = ttq._o || {};
          ttq._o[e] = n || {};
          const c = document.createElement('script');
          c.type = 'text/javascript';
          c.async = true;
          c.src = i + '?sdkid=' + e + '&lib=' + t;
          const a = document.getElementsByTagName('script')[0];
          a.parentNode?.insertBefore(c, a);
        };
        ttq.load(tiktokId);
        ttq.page();
      })(window, document, 'ttq');

      initializedPixels.tiktok = true;
      logPixelEvent('TikTok', 'init', `تم تفعيل تيك توك بيكسل (${tiktokId}) بنجاح`);
    } catch (err: any) {
      console.warn('[Pixel] TikTok initialization error:', err);
    }
  }

  // 3. SNAPCHAT PIXEL
  const snapId = (settings.snapchatPixelId || '').trim();
  if (snapId && !initializedPixels.snapchat) {
    try {
      (function(e: any, t: any, n: any) {
        if (e.snaptr) return;
        const a: any = (e.snaptr = function() {
          a.handleRequest ? a.handleRequest.apply(a, arguments) : a.queue.push(arguments);
        });
        a.queue = [];
        const s = 'script';
        const r = t.createElement(s);
        r.async = true;
        r.src = n;
        const u = t.getElementsByTagName(s)[0];
        u.parentNode?.insertBefore(r, u);
      })(window, document, 'https://sc-static.net/scevent.min.js');

      window.snaptr('init', snapId);
      window.snaptr('track', 'PAGE_VIEW');
      initializedPixels.snapchat = true;
      logPixelEvent('Snapchat', 'init', `تم ربط سناب شات بيكسل (${snapId}) وتفعيل PAGE_VIEW`);
    } catch (err: any) {
      console.warn('[Pixel] Snapchat initialization error:', err);
    }
  }

  // 4. GOOGLE ANALYTICS 4 (GA4)
  const gaId = (settings.googleAnalyticsId || '').trim();
  if (gaId && !initializedPixels.google) {
    try {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function() {
        window.dataLayer?.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', gaId);

      initializedPixels.google = true;
      logPixelEvent('Google Analytics', 'config', `تم ربط Google Analytics 4 (${gaId})`);
    } catch (err: any) {
      console.warn('[Pixel] GA4 initialization error:', err);
    }
  }
};

// ==========================================
// E-COMMERCE EVENT TRACKING METHODS
// ==========================================

export const trackPageView = (pageName: string = 'الصفحة الرئيسية') => {
  if (typeof window === 'undefined') return;

  // Meta
  if (window.fbq) {
    window.fbq('track', 'PageView');
    logPixelEvent('Meta (Facebook)', 'PageView', `زيارة صفحة: ${pageName}`);
  }
  // TikTok
  if (window.ttq) {
    window.ttq.page();
    logPixelEvent('TikTok', 'Page', `تصفح: ${pageName}`);
  }
  // Snap
  if (window.snaptr) {
    window.snaptr('track', 'PAGE_VIEW');
    logPixelEvent('Snapchat', 'PAGE_VIEW', `تصفح: ${pageName}`);
  }
  // GA4
  if (window.gtag) {
    window.gtag('event', 'page_view', { page_title: pageName });
    logPixelEvent('Google Analytics', 'page_view', `عرض: ${pageName}`);
  }
};

export const trackViewContent = (product: Product, currency: string = 'SAR') => {
  const price = product.priceSA || 0;

  if (window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_name: product.nameAr,
      content_ids: [product.id],
      content_type: 'product',
      value: price,
      currency: currency
    });
    logPixelEvent('Meta (Facebook)', 'ViewContent', `مشاهدة قطعة: ${product.nameAr}`, 'sent', price, currency);
  }

  if (window.ttq) {
    window.ttq.track('ViewContent', {
      content_id: product.id,
      content_type: 'product',
      content_name: product.nameAr,
      price: price,
      value: price,
      currency: currency
    });
    logPixelEvent('TikTok', 'ViewContent', `مشاهدة قطعة: ${product.nameAr}`, 'sent', price, currency);
  }

  if (window.snaptr) {
    window.snaptr('track', 'VIEW_CONTENT', {
      item_ids: [product.id],
      price: price,
      currency: currency
    });
    logPixelEvent('Snapchat', 'VIEW_CONTENT', `مشاهدة قطعة: ${product.nameAr}`, 'sent', price, currency);
  }

  if (window.gtag) {
    window.gtag('event', 'view_item', {
      currency: currency,
      value: price,
      items: [{ item_id: product.id, item_name: product.nameAr, price: price }]
    });
    logPixelEvent('Google Analytics', 'view_item', `مشاهدة: ${product.nameAr}`, 'sent', price, currency);
  }
};

export const trackAddToCart = (product: Product, quantity: number = 1, currency: string = 'SAR') => {
  const price = (product.priceSA || 0) * quantity;

  if (window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_name: product.nameAr,
      content_ids: [product.id],
      content_type: 'product',
      value: price,
      currency: currency
    });
    logPixelEvent('Meta (Facebook)', 'AddToCart', `إضافة للسلة: ${product.nameAr} × ${quantity}`, 'sent', price, currency);
  }

  if (window.ttq) {
    window.ttq.track('AddToCart', {
      content_id: product.id,
      content_type: 'product',
      content_name: product.nameAr,
      quantity: quantity,
      value: price,
      currency: currency
    });
    logPixelEvent('TikTok', 'AddToCart', `إضافة للسلة: ${product.nameAr} × ${quantity}`, 'sent', price, currency);
  }

  if (window.snaptr) {
    window.snaptr('track', 'ADD_CART', {
      item_ids: [product.id],
      price: price,
      currency: currency,
      number_items: quantity
    });
    logPixelEvent('Snapchat', 'ADD_CART', `إضافة للسلة: ${product.nameAr} × ${quantity}`, 'sent', price, currency);
  }

  if (window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency: currency,
      value: price,
      items: [{ item_id: product.id, item_name: product.nameAr, quantity: quantity, price: product.priceSA }]
    });
    logPixelEvent('Google Analytics', 'add_to_cart', `إضافة للسلة: ${product.nameAr}`, 'sent', price, currency);
  }
};

export const trackInitiateCheckout = (items: any[], totalValue: number, currency: string = 'SAR') => {
  const ids = items.map(i => i.product?.id || i.productId);

  if (window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      content_ids: ids,
      content_type: 'product',
      num_items: items.length,
      value: totalValue,
      currency: currency
    });
    logPixelEvent('Meta (Facebook)', 'InitiateCheckout', `بدء إتمام الطلب (عدد القطع: ${items.length})`, 'sent', totalValue, currency);
  }

  if (window.ttq) {
    window.ttq.track('InitiateCheckout', {
      contents: items.map(i => ({
        content_id: i.product?.id || i.productId,
        quantity: i.quantity || 1
      })),
      value: totalValue,
      currency: currency
    });
    logPixelEvent('TikTok', 'InitiateCheckout', `بدء الدفع (سلة بقيمة ${totalValue} ${currency})`, 'sent', totalValue, currency);
  }

  if (window.snaptr) {
    window.snaptr('track', 'START_CHECKOUT', {
      item_ids: ids,
      price: totalValue,
      currency: currency,
      number_items: items.length
    });
    logPixelEvent('Snapchat', 'START_CHECKOUT', `بدء الدفع (قيمة: ${totalValue} ${currency})`, 'sent', totalValue, currency);
  }

  if (window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: currency,
      value: totalValue,
      items: items.map(i => ({ item_id: i.product?.id || i.productId, quantity: i.quantity || 1 }))
    });
    logPixelEvent('Google Analytics', 'begin_checkout', `بدء الدفع بقيمة ${totalValue} ${currency}`, 'sent', totalValue, currency);
  }
};

export const trackPurchase = (order: Order) => {
  const currency = order.currency || 'SAR';
  const total = order.totalPrice || 0;
  const ids = order.items.map(i => i.productId);

  if (window.fbq) {
    window.fbq('track', 'Purchase', {
      content_ids: ids,
      content_type: 'product',
      value: total,
      currency: currency,
      order_id: order.id
    });
    logPixelEvent('Meta (Facebook)', 'Purchase', `تم الشراء بنجاح! طلب #${order.id.slice(0, 8)}`, 'sent', total, currency);
  }

  if (window.ttq) {
    window.ttq.track('CompletePayment', {
      content_ids: ids,
      value: total,
      currency: currency,
      order_id: order.id
    });
    logPixelEvent('TikTok', 'CompletePayment', `دفع مكتمل! طلب #${order.id.slice(0, 8)}`, 'sent', total, currency);
  }

  if (window.snaptr) {
    window.snaptr('track', 'PURCHASE', {
      item_ids: ids,
      price: total,
      currency: currency,
      transaction_id: order.id
    });
    logPixelEvent('Snapchat', 'PURCHASE', `عملية شراء ناجحة! طلب #${order.id.slice(0, 8)}`, 'sent', total, currency);
  }

  if (window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: order.id,
      value: total,
      currency: currency,
      items: order.items.map(i => ({
        item_id: i.productId,
        item_name: i.productName,
        price: i.price,
        quantity: i.quantity
      }))
    });
    logPixelEvent('Google Analytics', 'purchase', `إتمام شراء #${order.id.slice(0, 8)}`, 'sent', total, currency);
  }
};

// ==========================================
// REALTIME LIVE VISITORS / SHOPIFY METRICS
// ==========================================
export interface LiveVisitorMetrics {
  liveCount: number;
  devices: { mobile: number; desktop: number; tablet: number };
  cities: { city: string; count: number; flag: string }[];
  currentPages: { page: string; visitors: number }[];
}

export const getLiveVisitorStats = (): LiveVisitorMetrics => {
  // Return honest stats: 1 live visitor (the current user)
  // Real-time multi-user tracking requires a persistent server-side socket or heartbeat table
  const baseCount = 1;

  return {
    liveCount: baseCount,
    devices: {
      mobile: 1, // Assume current user is on mobile/desktop based on UA if needed, but keeping it simple
      desktop: 0,
      tablet: 0
    },
    cities: [
      { city: 'الموقع الحالي', count: 1, flag: '🇸🇦' }
    ],
    currentPages: [
      { page: 'تصفح المتجر', visitors: 1 }
    ]
  };
};

// ==========================================
// TELEMETRY & PRODUCT ANALYTICS
// ==========================================
const loadTelemetry = (): TelemetryData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to load telemetry data from localStorage:', e);
    return {};
  }
};

const saveTelemetry = (data: TelemetryData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save telemetry data to localStorage:', e);
  }
};

export const recordView = (productId: string) => {
  const data = loadTelemetry();
  if (!data[productId]) {
    data[productId] = {};
  }
  data[productId].views = (data[productId].views || 0) + 1;
  saveTelemetry(data);
};

export const recordCartAddition = (productId: string) => {
  const data = loadTelemetry();
  if (!data[productId]) {
    data[productId] = {};
  }
  data[productId].cartAdditions = (data[productId].cartAdditions || 0) + 1;
  saveTelemetry(data);
};

export const getProductAnalytics = (products: Product[], orders: Order[]): ProductMetric[] => {
  const data = loadTelemetry();

  const actualOrdersCountMap: Record<string, number> = {};
  orders.forEach(order => {
    order.items?.forEach(item => {
      actualOrdersCountMap[item.productId] = (actualOrdersCountMap[item.productId] || 0) + item.quantity;
    });
  });

  return products.map(product => {
    const liveViews = data[product.id]?.views || 0;
    const liveAdditions = data[product.id]?.cartAdditions || 0;
    const liveOrders = actualOrdersCountMap[product.id] || 0;

    const views = Math.max(liveViews, liveOrders * 3);
    const cartAdditions = liveAdditions;
    const ordersCount = liveOrders;

    const conversionRate = views > 0 ? Number(((ordersCount / views) * 100).toFixed(1)) : 0;

    return {
      id: product.id,
      name: product.nameAr,
      views,
      cartAdditions,
      ordersCount,
      conversionRate
    };
  });
};
