import { Product, Settings } from '../types';

export interface EffectiveDiscountInfo {
  regularPrice: number;
  effectivePrice: number;
  discountPercent: number;
  hasActiveDiscount: boolean;
  startsAt?: string;
  endsAt?: string;
  isStoreWide: boolean;
}

export function calculateEffectiveDiscount(
  product: Product,
  settings?: Settings | null,
  country: 'SA' | 'EG' = 'SA'
): EffectiveDiscountInfo {
  const now = new Date();
  
  // Base regular price MUST be taken directly from regularPrice or priceSA/priceEG
  const regularBasePrice = product.regularPrice && product.regularPrice > 0
    ? product.regularPrice
    : (country === 'EG' ? (product.priceEG || 899) : (product.priceSA || 69));

  // 1. Check Product-Specific Discount
  let prodPercent = Number(product.discountPercent ?? 0);
  let prodValid = false;
  if (prodPercent > 0 && prodPercent <= 90) {
    const startsOk = !product.discountStartsAt || new Date(product.discountStartsAt) <= now;
    const endsOk = !product.discountEndsAt || new Date(product.discountEndsAt) >= now;
    if (startsOk && endsOk) {
      prodValid = true;
    }
  }

  // 2. Check Store-Wide Discount
  let storePercent = Number(settings?.storeDiscountPercent ?? 0);
  let storeValid = false;
  if (storePercent > 0 && storePercent <= 90) {
    const startsOk = !settings?.storeDiscountStartsAt || new Date(settings.storeDiscountStartsAt) <= now;
    const endsOk = !settings?.storeDiscountEndsAt || new Date(settings.storeDiscountEndsAt) >= now;
    if (startsOk && endsOk) {
      storeValid = true;
    }
  }

  // Determine active percent (take the higher discount if both apply)
  let activeDiscountPercent = 0;
  let isStoreWide = false;
  let activeEndsAt: string | undefined;
  let activeStartsAt: string | undefined;

  if (prodValid && storeValid) {
    if (prodPercent >= storePercent) {
      activeDiscountPercent = prodPercent;
      activeEndsAt = product.discountEndsAt;
      activeStartsAt = product.discountStartsAt;
    } else {
      activeDiscountPercent = storePercent;
      isStoreWide = true;
      activeEndsAt = settings?.storeDiscountEndsAt;
      activeStartsAt = settings?.storeDiscountStartsAt;
    }
  } else if (prodValid) {
    activeDiscountPercent = prodPercent;
    activeEndsAt = product.discountEndsAt;
    activeStartsAt = product.discountStartsAt;
  } else if (storeValid) {
    activeDiscountPercent = storePercent;
    isStoreWide = true;
    activeEndsAt = settings?.storeDiscountEndsAt;
    activeStartsAt = settings?.storeDiscountStartsAt;
  }

  if (activeDiscountPercent > 0) {
    const calculatedEffective = Math.round(regularBasePrice * (1 - activeDiscountPercent / 100));
    return {
      regularPrice: regularBasePrice,
      effectivePrice: calculatedEffective,
      discountPercent: activeDiscountPercent,
      hasActiveDiscount: true,
      startsAt: activeStartsAt,
      endsAt: activeEndsAt,
      isStoreWide
    };
  }

  return {
    regularPrice: regularBasePrice,
    effectivePrice: regularBasePrice,
    discountPercent: 0,
    hasActiveDiscount: false,
    isStoreWide: false
  };
}

/**
 * Strict stock badge text formatting:
 * 1 => "متبقي قطعة واحدة"
 * 2 => "متبقي قطعتان"
 * 3..10 => "متبقي X قطع"
 * > 10 => null
 * 0 => "نفدت الكمية"
 */
export function formatStockBadge(stock: number): { text: string; isOutOfStock: boolean } | null {
  if (stock <= 0) {
    return { text: 'نفدت الكمية', isOutOfStock: true };
  }
  if (stock === 1) {
    return { text: 'متبقي قطعة واحدة', isOutOfStock: false };
  }
  if (stock === 2) {
    return { text: 'متبقي قطعتان', isOutOfStock: false };
  }
  if (stock >= 3 && stock <= 10) {
    return { text: `متبقي ${stock} قطع`, isOutOfStock: false };
  }
  return null;
}
