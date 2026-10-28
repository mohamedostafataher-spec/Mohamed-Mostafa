import { Product, Order } from '../types';
import { logPixelEvent } from './analytics';

/**
 * SHA-256 client-side hash function required by TikTok Pixel Advanced Matching.
 * Normalizes input (lowercase, trimmed) before hashing.
 */
export async function sha256(value: string): Promise<string> {
  const normalized = (value || '').trim().toLowerCase();
  if (!normalized) return '';
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(normalized);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    console.warn('[TikTok Pixel] SHA-256 error:', err);
  }
  return normalized;
}

/**
 * Identify customer with SHA-256 hashed PII data.
 * Must be called before events where PII data postback is expected.
 */
export async function ttqIdentify(data: {
  email?: string;
  phone?: string;
  externalId?: string;
}) {
  try {
    const payload: { email?: string; phone_number?: string; external_id?: string } = {};

    if (data.email) {
      payload.email = await sha256(data.email);
    }
    if (data.phone) {
      // Normalize phone number (digits only, e.g. E.164 without plus)
      const cleanPhone = data.phone.replace(/\D/g, '');
      payload.phone_number = await sha256(cleanPhone);
    }
    if (data.externalId) {
      payload.external_id = await sha256(data.externalId);
    }

    if (typeof window !== 'undefined' && (window as any).ttq && Object.keys(payload).length > 0) {
      (window as any).ttq.identify(payload);
      logPixelEvent('TikTok', 'identify', 'تم تحديث بيانات العميل المشفّرة (SHA-256)');
      console.log('[TikTok Pixel] identify executed with SHA-256:', payload);
    }
  } catch (err) {
    console.warn('[TikTok Pixel] ttqIdentify error:', err);
  }
}

/**
 * Safe generic TikTok Pixel event runner
 */
function trackTikTok(event: string, payload: Record<string, any>, label: string, value?: number, currency: string = 'SAR') {
  try {
    if (typeof window !== 'undefined' && (window as any).ttq && typeof (window as any).ttq.track === 'function') {
      (window as any).ttq.track(event, payload);
      logPixelEvent('TikTok', event, label, 'sent', value, currency);
      console.log(`[TikTok Pixel] ${event}:`, payload);
    }
  } catch (err) {
    console.warn(`[TikTok Pixel] ${event} error:`, err);
  }
}

/**
 * 1. ViewContent
 */
export function trackTikTokViewContent(product: Product, currency: string = 'SAR') {
  const val = Number(product.salePriceSA || product.priceSA || 195);
  trackTikTok('ViewContent', {
    contents: [
      {
        content_id: String(product.id),
        content_type: 'product',
        content_name: product.nameAr || product.nameEn || 'SULTA Sleepwear'
      }
    ],
    value: val,
    currency
  }, `مشاهدة قطعة: ${product.nameAr}`, val, currency);
}

/**
 * 2. AddToWishlist
 */
export function trackTikTokAddToWishlist(product: Product, currency: string = 'SAR') {
  const val = Number(product.salePriceSA || product.priceSA || 195);
  trackTikTok('AddToWishlist', {
    contents: [
      {
        content_id: String(product.id),
        content_type: 'product',
        content_name: product.nameAr || product.nameEn || 'SULTA Sleepwear'
      }
    ],
    value: val,
    currency
  }, `إضافة للمفضلة: ${product.nameAr}`, val, currency);
}

/**
 * 3. Search
 */
export function trackTikTokSearch(query: string, matchedProducts: Product[] = [], currency: string = 'SAR') {
  const contents = matchedProducts.slice(0, 5).map(p => ({
    content_id: String(p.id),
    content_type: 'product',
    content_name: p.nameAr || p.nameEn
  }));
  trackTikTok('Search', {
    contents: contents.length > 0 ? contents : [{
      content_id: 'search-query',
      content_type: 'product',
      content_name: query
    }],
    value: 0,
    currency,
    search_string: query
  }, `بحث: "${query}"`, 0, currency);
}

/**
 * 4. AddToCart
 */
export function trackTikTokAddToCart(product: Product, quantity: number = 1, currency: string = 'SAR') {
  const unitPrice = Number(product.salePriceSA || product.priceSA || 195);
  const totalVal = unitPrice * quantity;
  trackTikTok('AddToCart', {
    contents: [
      {
        content_id: String(product.id),
        content_type: 'product',
        content_name: product.nameAr || product.nameEn || 'SULTA Sleepwear'
      }
    ],
    value: totalVal,
    currency
  }, `إضافة للسلة: ${product.nameAr} × ${quantity}`, totalVal, currency);
}

/**
 * 5. InitiateCheckout
 */
export function trackTikTokInitiateCheckout(
  items: Array<{ product?: Product; productId?: string; quantity?: number; name?: string; price?: number }>,
  totalValue: number,
  currency: string = 'SAR'
) {
  const contents = items.map(i => ({
    content_id: String(i.product?.id || i.productId || 'item'),
    content_type: 'product',
    content_name: i.product?.nameAr || i.name || 'SULTA Piece'
  }));

  trackTikTok('InitiateCheckout', {
    contents,
    value: totalValue,
    currency
  }, `بدء الدفع (سلة بقيمة ${totalValue} ${currency})`, totalValue, currency);
}

/**
 * 6. AddPaymentInfo
 */
export function trackTikTokAddPaymentInfo(
  items: Array<{ product?: Product; productId?: string; quantity?: number; name?: string; price?: number }>,
  totalValue: number,
  currency: string = 'SAR'
) {
  const contents = items.map(i => ({
    content_id: String(i.product?.id || i.productId || 'item'),
    content_type: 'product',
    content_name: i.product?.nameAr || i.name || 'SULTA Piece'
  }));

  trackTikTok('AddPaymentInfo', {
    contents,
    value: totalValue,
    currency
  }, `إدخال بيانات الدفع (${totalValue} ${currency})`, totalValue, currency);
}

/**
 * 7. PlaceAnOrder
 */
export function trackTikTokPlaceAnOrder(order: Order, currency: string = 'SAR') {
  const total = Number(order.totalPrice) || 0;
  const contents = order.items.map(i => ({
    content_id: String(i.productId),
    content_type: 'product',
    content_name: i.productName || 'SULTA Piece'
  }));

  trackTikTok('PlaceAnOrder', {
    contents,
    value: total,
    currency
  }, `تأكيد طلب #${order.id.slice(0, 8)}`, total, currency);
}

/**
 * 8. CompleteRegistration
 */
export function trackTikTokCompleteRegistration(userId: string, email?: string, phone?: string, currency: string = 'SAR') {
  // First identify user with SHA-256
  ttqIdentify({ email, phone, externalId: userId });

  trackTikTok('CompleteRegistration', {
    contents: [
      {
        content_id: userId,
        content_type: 'product',
        content_name: 'تسجيل حساب عميل ملكي'
      }
    ],
    value: 0,
    currency
  }, `تسجيل حساب جديد (#${userId.slice(0, 8)})`, 0, currency);
}

/**
 * 9. Purchase
 */
export function trackTikTokPurchase(order: Order, currency: string = 'SAR') {
  const total = Number(order.totalPrice) || 0;
  const contents = order.items.map(i => ({
    content_id: String(i.productId),
    content_type: 'product',
    content_name: i.productName || 'SULTA Piece'
  }));

  // Identify with customer data from the order
  ttqIdentify({
    email: order.email || undefined,
    phone: order.phone || undefined,
    externalId: (order as any).customerId || order.id
  });

  // Also track both PlaceAnOrder and Purchase to cover all TikTok Ads optimization objectives
  trackTikTok('Purchase', {
    contents,
    value: total,
    currency
  }, `عملية شراء مكتملة: طلب #${order.id.slice(0, 8)}`, total, currency);

  trackTikTok('PlaceAnOrder', {
    contents,
    value: total,
    currency
  }, `طلب جديد: #${order.id.slice(0, 8)}`, total, currency);
}
