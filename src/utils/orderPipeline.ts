import { Order, OrderStatus } from '../types';
import { CanonicalAdminRole, normalizeAdminRole } from './rbac';

export type CanonicalOrderStage =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'failed'
  | 'returned';

export interface OrderStageMeta {
  key: CanonicalOrderStage;
  label: string;
  shortLabel: string;
  colorClass: string;
  dotColor: string;
  isTerminal?: boolean;
}

export const ORDER_STAGE_META: Record<CanonicalOrderStage, OrderStageMeta> = {
  pending: {
    key: 'pending',
    label: 'طلب جديد ⏳',
    shortLabel: 'جديد',
    colorClass: 'bg-amber-50 text-amber-800 border-amber-200',
    dotColor: 'bg-amber-500'
  },
  confirmed: {
    key: 'confirmed',
    label: 'مؤكد ✅',
    shortLabel: 'مؤكد',
    colorClass: 'bg-sky-50 text-sky-800 border-sky-200',
    dotColor: 'bg-sky-500'
  },
  processing: {
    key: 'processing',
    label: 'قيد التجهيز 📦',
    shortLabel: 'قيد التجهيز',
    colorClass: 'bg-blue-50 text-blue-800 border-blue-200',
    dotColor: 'bg-blue-500'
  },
  packed: {
    key: 'packed',
    label: 'تم التغليف 🎁',
    shortLabel: 'جاهز للشحن',
    colorClass: 'bg-violet-50 text-violet-800 border-violet-200',
    dotColor: 'bg-violet-500'
  },
  shipped: {
    key: 'shipped',
    label: 'تم الشحن 🚚',
    shortLabel: 'تم الشحن',
    colorClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    dotColor: 'bg-indigo-500'
  },
  out_for_delivery: {
    key: 'out_for_delivery',
    label: 'مع المندوب للتوصيل 🛵',
    shortLabel: 'مع المندوب',
    colorClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    dotColor: 'bg-cyan-500'
  },
  delivered: {
    key: 'delivered',
    label: 'تم التسليم ✨',
    shortLabel: 'تم التسليم',
    colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotColor: 'bg-emerald-500'
  },
  cancelled: {
    key: 'cancelled',
    label: 'ملغي ❌',
    shortLabel: 'ملغي',
    colorClass: 'bg-rose-50 text-rose-800 border-rose-200',
    dotColor: 'bg-rose-500'
  },
  failed: {
    key: 'failed',
    label: 'فشل التوصيل ⚠️',
    shortLabel: 'فشل التوصيل',
    colorClass: 'bg-orange-50 text-orange-800 border-orange-200',
    dotColor: 'bg-orange-500'
  },
  returned: {
    key: 'returned',
    label: 'مرتجع 🔄',
    shortLabel: 'مرتجع',
    colorClass: 'bg-stone-100 text-stone-800 border-stone-300',
    dotColor: 'bg-stone-500',
    isTerminal: true
  }
};

export const MAIN_PIPELINE_SEQUENCE: CanonicalOrderStage[] = [
  'pending',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'delivered'
];

/**
 * Normalizes legacy order status values into canonical pipeline stages.
 */
export function normalizeOrderStage(status?: OrderStatus | string | null): CanonicalOrderStage {
  const s = (status || '').trim().toLowerCase();
  if (!s || s === 'new' || s === 'pending' || s === 'cod') return 'pending';
  if (s === 'paid' || s === 'confirmed') return 'confirmed';
  if (s === 'processing') return 'processing';
  if (s === 'packed') return 'packed';
  if (s === 'shipped') return 'shipped';
  if (s === 'out_for_delivery') return 'out_for_delivery';
  if (s === 'delivered') return 'delivered';
  if (s === 'cancelled') return 'cancelled';
  if (s === 'failed') return 'failed';
  if (s === 'returned') return 'returned';
  return 'pending';
}

export function getOrderStageMeta(status?: OrderStatus | string | null): OrderStageMeta {
  return ORDER_STAGE_META[normalizeOrderStage(status)];
}

/**
 * Restricted state machine transitions. Prevents invalid arbitrary jumps (e.g. pending -> delivered).
 */
const PIPELINE_TRANSITIONS: Record<CanonicalOrderStage, CanonicalOrderStage[]> = {
  pending: ['confirmed', 'processing', 'cancelled'],
  confirmed: ['processing', 'packed', 'cancelled'],
  processing: ['packed', 'shipped', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered', 'failed', 'returned'],
  out_for_delivery: ['delivered', 'failed', 'returned'],
  failed: ['shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
  delivered: ['returned'],
  cancelled: ['pending'], // Restorable only by owner/manager
  returned: [] // Terminal stage
};

export function getAllowedNextStatuses(
  currentStatus: OrderStatus | string | undefined | null,
  role?: CanonicalAdminRole | string | null
): CanonicalOrderStage[] {
  const canonicalFrom = normalizeOrderStage(currentStatus);
  const canonicalRole = normalizeAdminRole(role);
  const candidates = PIPELINE_TRANSITIONS[canonicalFrom] || [];

  if (canonicalFrom === 'cancelled') {
    return canonicalRole === 'owner' || canonicalRole === 'manager' ? ['pending'] : [];
  }

  // Warehouse cannot mark delivered or cancelled from pending directly, they focus on packing/shipping
  if (canonicalRole === 'warehouse') {
    return candidates.filter((next) =>
      ['processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'failed', 'returned'].includes(next)
    );
  }

  return candidates;
}

export function canTransitionOrderStatus(
  fromStatus: OrderStatus | string | undefined | null,
  toStatus: OrderStatus | string,
  role?: CanonicalAdminRole | string | null
): boolean {
  const target = normalizeOrderStage(toStatus);
  return getAllowedNextStatuses(fromStatus, role).includes(target);
}

/**
 * Normalizes a Saudi / Gulf phone number into canonical digits for grouping & duplicate detection.
 */
export function normalizePhoneKey(phone?: string | null): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00966') && digits.length >= 13) return '966' + digits.slice(5);
  if (digits.startsWith('9660') && digits.length >= 13) return '966' + digits.slice(4);
  if (digits.startsWith('05') && digits.length === 10) return '966' + digits.slice(1);
  if (digits.startsWith('5') && digits.length === 9) return '966' + digits;
  if (digits.startsWith('01') && digits.length === 11) return '20' + digits.slice(1); // Egypt fallback
  return digits;
}

export function isValidSaudiOrGulfPhone(phone?: string | null): boolean {
  const key = normalizePhoneKey(phone);
  if (!key) return false;
  // Saudi mobile: 9665xxxxxxxx (12 digits)
  if (/^9665\d{8}$/.test(key)) return true;
  // GCC mobiles (UAE 9715, KW 965, BH 973, QA 974, OM 968) or EG 201
  if (/^(9715\d{8}|965\d{8}|973\d{8}|974\d{8}|968\d{8}|201\d{9})$/.test(key)) return true;
  return false;
}

export type OrderRiskReasonCode =
  | 'duplicate_recent'
  | 'invalid_phone'
  | 'high_cancel_history'
  | 'high_value_cod';

export interface OrderRiskAnalysis {
  isFlagged: boolean;
  severity: 'none' | 'medium' | 'high';
  reasons: { code: OrderRiskReasonCode; label: string; detail: string }[];
  relatedOrderIds: string[];
}

export function toHalalas(sarAmount?: number | null): number {
  return Math.round((Number(sarAmount) || 0) * 100);
}

export function isOrderDelayed48h(order: Order, nowMs = Date.now()): boolean {
  const stage = normalizeOrderStage(order.status);
  if (['shipped', 'out_for_delivery', 'delivered', 'cancelled', 'failed', 'returned'].includes(stage)) {
    return false;
  }
  const timestamp = order.createdAt || order.date;
  if (!timestamp) return false;
  const parsed = new Date(timestamp).getTime();
  if (isNaN(parsed)) return false;
  return (nowMs - parsed) / (1000 * 60 * 60) >= 48;
}

/**
 * Pure suspicious/duplicate detector over genuine store orders.
 */
export function analyzeOrderRisk(order: Order, allOrders: Order[]): OrderRiskAnalysis {
  const reasons: OrderRiskAnalysis['reasons'] = [];
  const relatedOrderIds: string[] = [];

  const phoneKey = normalizePhoneKey(order.phone);
  if (!phoneKey || !isValidSaudiOrGulfPhone(order.phone)) {
    reasons.push({
      code: 'invalid_phone',
      label: 'صيغة جوال غير معتادة',
      detail: 'رقم الجوال غير مطابق لصيغ الجوال السعودي أو الخليجي، يُنصح بالتأكد قبل الشحن.'
    });
  }

  const orderTime = new Date(order.createdAt || order.date || Date.now()).getTime() || Date.now();
  const samePhoneOrders = phoneKey
    ? allOrders.filter((other) => other.id !== order.id && normalizePhoneKey(other.phone) === phoneKey)
    : [];

  // Duplicate check within 48h (non-cancelled/returned)
  const stage = normalizeOrderStage(order.status);
  if (stage !== 'cancelled' && stage !== 'returned') {
    const recentDuplicates = samePhoneOrders.filter((other) => {
      const otherStage = normalizeOrderStage(other.status);
      if (otherStage === 'cancelled' || otherStage === 'returned') return false;
      const otherTime = new Date(other.createdAt || other.date || Date.now()).getTime() || 0;
      const diffHours = Math.abs(orderTime - otherTime) / (1000 * 60 * 60);
      return diffHours <= 48;
    });

    if (recentDuplicates.length > 0) {
      recentDuplicates.forEach((d) => relatedOrderIds.push(d.id));
      reasons.push({
        code: 'duplicate_recent',
        label: `طلب مكرر محتمل (${recentDuplicates.length + 1})`,
        detail: `توجد ${recentDuplicates.length} طلبات نشطة أخرى بنفس رقم الجوال خلال 48 ساعة.`
      });
    }
  }

  // High cancellation / failed delivery history
  const badHistory = samePhoneOrders.filter((other) => {
    const st = normalizeOrderStage(other.status);
    return st === 'cancelled' || st === 'failed' || st === 'returned';
  });
  if (badHistory.length >= 2) {
    reasons.push({
      code: 'high_cancel_history',
      label: `سجل إلغاء/فشل (${badHistory.length})`,
      detail: `نفس رقم الجوال لديه ${badHistory.length} طلبات ملغاة أو تعذر توصيلها سابقاً.`
    });
  }

  // High value COD (>= 1500 SAR or >= 6 pieces)
  const isCod = (order.paymentMethod || '').toLowerCase().includes('استلام') || (order.paymentMethod || '').toLowerCase().includes('cod');
  const totalHalalas = toHalalas(order.totalPrice);
  const totalQty = (order.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  if (isCod && (totalHalalas >= 150000 || totalQty >= 6)) {
    reasons.push({
      code: 'high_value_cod',
      label: 'COD مرتفع القيمة',
      detail: 'طلب دفع عند الاستلام بقيمة أو كمية مرتفعة؛ يُفضّل تأكيد العنوان بالواتساب قبل الشحن.'
    });
  }

  const hasHighSeverity = reasons.some((r) => r.code === 'duplicate_recent' || r.code === 'high_cancel_history');
  return {
    isFlagged: reasons.length > 0,
    severity: reasons.length === 0 ? 'none' : hasHighSeverity ? 'high' : 'medium',
    reasons,
    relatedOrderIds
  };
}

export interface OrdersUrlFilters {
  q: string;
  status: string;
  pay: string;
  city: string;
  carrier: string;
  riskOnly: boolean;
}

export const DEFAULT_ORDERS_FILTERS: OrdersUrlFilters = {
  q: '',
  status: 'current',
  pay: 'all',
  city: 'all',
  carrier: 'all',
  riskOnly: false
};

export function parseOrdersUrlFilters(): OrdersUrlFilters {
  if (typeof window === 'undefined') return DEFAULT_ORDERS_FILTERS;
  const params = new URLSearchParams(window.location.search);
  return {
    q: params.get('oq') || '',
    status: params.get('ostatus') || 'current',
    pay: params.get('opay') || 'all',
    city: params.get('ocity') || 'all',
    carrier: params.get('ocarrier') || 'all',
    riskOnly: params.get('orisk') === '1'
  };
}

export function writeOrdersUrlFilters(filters: OrdersUrlFilters): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    const setOrDelete = (key: string, value: string, defaultValue: string) => {
      if (!value || value === defaultValue) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    };

    setOrDelete('oq', filters.q.trim(), '');
    setOrDelete('ostatus', filters.status, 'current');
    setOrDelete('opay', filters.pay, 'all');
    setOrDelete('ocity', filters.city, 'all');
    setOrDelete('ocarrier', filters.carrier, 'all');
    if (filters.riskOnly) {
      url.searchParams.set('orisk', '1');
    } else {
      url.searchParams.delete('orisk');
    }

    window.history.replaceState({}, '', url.toString());
  } catch {
    // Ignore restricted history API contexts
  }
}
