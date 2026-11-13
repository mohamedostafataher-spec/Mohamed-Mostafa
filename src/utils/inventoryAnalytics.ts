import { Order, Product, StockMovement, StockMovementType } from '../types';
import { slugify } from './slugify';

export function toHalalas(amountSAR: number | undefined | null): number {
  const n = Number(amountSAR || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function fromHalalas(halalas: number | undefined | null): number {
  const n = Number(halalas || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n) / 100;
}

export interface WeightedAverageCostInput {
  currentStock: number;
  currentUnitCostHalalas: number;
  receivedQty: number;
  receivedUnitCostHalalas: number;
}

/**
 * Computes new weighted average unit cost in integer halalas upon goods receipt.
 * Uses pure integer halala math to avoid floating point drift.
 */
export function calculateWeightedAverageCostHalalas(input: WeightedAverageCostInput): number {
  const currentStock = Math.max(0, Math.floor(Number(input.currentStock || 0)));
  const receivedQty = Math.max(0, Math.floor(Number(input.receivedQty || 0)));
  const currentCost = Math.max(0, Math.round(Number(input.currentUnitCostHalalas || 0)));
  const receivedCost = Math.max(0, Math.round(Number(input.receivedUnitCostHalalas || 0)));

  if (receivedQty <= 0) return currentCost;
  if (currentStock <= 0 || currentCost <= 0) return receivedCost;

  const totalQty = currentStock + receivedQty;
  const totalValueHalalas = currentStock * currentCost + receivedQty * receivedCost;
  return Math.round(totalValueHalalas / totalQty);
}

export function calculateWeightedAverageCostSAR(params: {
  currentStock: number;
  currentUnitCostSAR?: number;
  receivedQty: number;
  receivedUnitCostSAR: number;
}): number {
  const nextHalalas = calculateWeightedAverageCostHalalas({
    currentStock: params.currentStock,
    currentUnitCostHalalas: toHalalas(params.currentUnitCostSAR),
    receivedQty: params.receivedQty,
    receivedUnitCostHalalas: toHalalas(params.receivedUnitCostSAR)
  });
  return fromHalalas(nextHalalas);
}

/**
 * Computes total stock from ledger movements (current stock = sum of movements).
 */
export function calculateStockFromMovements(movements: StockMovement[], productId?: string): number {
  return movements.reduce((sum, m) => {
    if (productId && m.productId !== productId) return sum;
    return sum + Number(m.changeQty || 0);
  }, 0);
}

export interface MovementTypeMeta {
  canonical: 'inbound' | 'outbound' | 'return' | 'adjustment' | 'damaged';
  labelAr: string;
  badgeClass: string;
  sign: 1 | -1 | 0;
}

export function getMovementTypeMeta(type: StockMovementType | string): MovementTypeMeta {
  switch (type) {
    case 'inbound':
    case 'manual_restock':
      return {
        canonical: 'inbound',
        labelAr: 'وارد للمستودع',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
        sign: 1
      };
    case 'outbound':
    case 'order_deduction':
      return {
        canonical: 'outbound',
        labelAr: 'صادر / مبيعات',
        badgeClass: 'bg-blue-100 text-blue-900 border-blue-200',
        sign: -1
      };
    case 'return':
    case 'order_cancellation_restock':
      return {
        canonical: 'return',
        labelAr: 'مرتجع / إلغاء',
        badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-200',
        sign: 1
      };
    case 'damaged':
    case 'damage_adjustment':
      return {
        canonical: 'damaged',
        labelAr: 'تالف / هالك',
        badgeClass: 'bg-rose-100 text-rose-900 border-rose-200',
        sign: -1
      };
    case 'adjustment':
    case 'inventory_audit':
    default:
      return {
        canonical: 'adjustment',
        labelAr: 'تسوية جرد',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-200',
        sign: 0
      };
  }
}

export interface ProductStockForecast {
  productId: string;
  stock: number;
  threshold: number;
  unitsSold30d: number;
  dailyVelocity: number;
  daysUntilStockout: number | null;
  urgency: 'out' | 'critical' | 'warning' | 'healthy';
  isBelowThreshold: boolean;
}

export function forecastProductStockout(
  product: Product,
  orders: Order[],
  nowMs: number = Date.now()
): ProductStockForecast {
  const stock = Math.max(0, Number(product.stock || 0));
  const threshold = Math.max(0, Number(product.minStockThreshold ?? 5));
  const windowDays = 30;
  const cutoffMs = nowMs - windowDays * 24 * 60 * 60 * 1000;

  let unitsSold30d = 0;
  for (const ord of orders) {
    if (ord.status === 'cancelled' || ord.status === 'returned' || ord.status === 'failed') continue;
    const rawDate = ord.createdAt || ord.date;
    const ts = rawDate ? new Date(rawDate).getTime() : 0;
    if (ts > 0 && ts < cutoffMs) continue;
    if (!Array.isArray(ord.items)) continue;
    for (const item of ord.items) {
      if (item.productId === product.id) {
        unitsSold30d += Math.max(0, Number(item.quantity || 0));
      }
    }
  }

  const dailyVelocity = Math.round((unitsSold30d / windowDays) * 100) / 100;
  const daysUntilStockout =
    stock <= 0 ? 0 : dailyVelocity > 0 ? Math.floor(stock / dailyVelocity) : null;
  const isBelowThreshold = stock > 0 && stock <= threshold;

  let urgency: ProductStockForecast['urgency'] = 'healthy';
  if (stock <= 0) urgency = 'out';
  else if (isBelowThreshold || (daysUntilStockout !== null && daysUntilStockout <= 7)) urgency = 'critical';
  else if (daysUntilStockout !== null && daysUntilStockout <= 14) urgency = 'warning';

  return {
    productId: product.id,
    stock,
    threshold,
    unitsSold30d,
    dailyVelocity,
    daysUntilStockout,
    urgency,
    isBelowThreshold
  };
}

export interface ProductProfitabilityMetric {
  product: Product;
  unitsSold: number;
  revenueHalalas: number;
  cogsHalalas: number | null;
  netProfitHalalas: number | null;
  marginPercent: number | null;
  lastSoldAt: string | null;
  daysSinceLastSale: number | null;
  isSlowMover: boolean;
  tiedStockValueHalalas: number | null;
}

export function analyzeProductProfitabilityAndSlowMovers(
  products: Product[],
  orders: Order[],
  canViewCost: boolean,
  slowMoverDays: number = 30,
  nowMs: number = Date.now()
): {
  metrics: ProductProfitabilityMetric[];
  topProfitable: ProductProfitabilityMetric[];
  topSelling: ProductProfitabilityMetric[];
  slowMovers: ProductProfitabilityMetric[];
} {
  const agg = new Map<string, { units: number; revenueHalalas: number; lastSoldMs: number }>();

  for (const ord of orders) {
    if (ord.status === 'cancelled' || ord.status === 'returned' || ord.status === 'failed') continue;
    const rawDate = ord.createdAt || ord.date;
    const ts = rawDate ? new Date(rawDate).getTime() : 0;
    if (!Array.isArray(ord.items)) continue;
    for (const item of ord.items) {
      const prev = agg.get(item.productId) || { units: 0, revenueHalalas: 0, lastSoldMs: 0 };
      const qty = Math.max(0, Number(item.quantity || 0));
      const lineRev = toHalalas(item.price) * qty;
      agg.set(item.productId, {
        units: prev.units + qty,
        revenueHalalas: prev.revenueHalalas + lineRev,
        lastSoldMs: Math.max(prev.lastSoldMs, ts)
      });
    }
  }

  const metrics: ProductProfitabilityMetric[] = products.map((product) => {
    const stat = agg.get(product.id) || { units: 0, revenueHalalas: 0, lastSoldMs: 0 };
    const unitCostHalalas = canViewCost && product.costPrice !== undefined && product.costPrice !== null
      ? toHalalas(product.costPrice)
      : null;

    const cogsHalalas = unitCostHalalas !== null ? unitCostHalalas * stat.units : null;
    const netProfitHalalas = cogsHalalas !== null ? stat.revenueHalalas - cogsHalalas : null;
    const marginPercent =
      netProfitHalalas !== null && stat.revenueHalalas > 0
        ? Math.round((netProfitHalalas / stat.revenueHalalas) * 1000) / 10
        : unitCostHalalas !== null && toHalalas(product.priceSA) > 0
          ? Math.round(((toHalalas(product.priceSA) - unitCostHalalas) / toHalalas(product.priceSA)) * 1000) / 10
          : null;

    const daysSinceLastSale =
      stat.lastSoldMs > 0
        ? Math.max(0, Math.floor((nowMs - stat.lastSoldMs) / (1000 * 60 * 60 * 24)))
        : null;

    const stock = Math.max(0, Number(product.stock || 0));
    const isSlowMover =
      stock > 0 && (daysSinceLastSale === null || daysSinceLastSale >= slowMoverDays);

    const tiedStockValueHalalas =
      unitCostHalalas !== null ? unitCostHalalas * stock : null;

    return {
      product,
      unitsSold: stat.units,
      revenueHalalas: stat.revenueHalalas,
      cogsHalalas,
      netProfitHalalas,
      marginPercent,
      lastSoldAt: stat.lastSoldMs > 0 ? new Date(stat.lastSoldMs).toISOString() : null,
      daysSinceLastSale,
      isSlowMover,
      tiedStockValueHalalas
    };
  });

  const topProfitable = [...metrics]
    .filter((m) => m.netProfitHalalas !== null)
    .sort((a, b) => (b.netProfitHalalas || 0) - (a.netProfitHalalas || 0))
    .slice(0, 8);

  const topSelling = [...metrics]
    .sort((a, b) => b.unitsSold - a.unitsSold || b.revenueHalalas - a.revenueHalalas)
    .slice(0, 8);

  const slowMovers = [...metrics]
    .filter((m) => m.isSlowMover)
    .sort((a, b) => Number(b.product.stock || 0) - Number(a.product.stock || 0));

  return { metrics, topProfitable, topSelling, slowMovers };
}

export function evaluateSeoField(
  value: string | undefined | null,
  minOptimal: number,
  maxOptimal: number
): { length: number; status: 'empty' | 'short' | 'optimal' | 'long'; labelAr: string; colorClass: string } {
  const len = (value || '').trim().length;
  if (len === 0) {
    return {
      length: 0,
      status: 'empty',
      labelAr: 'فارغ — سيُستخدم الافتراضي',
      colorClass: 'text-gray-500 bg-gray-100'
    };
  }
  if (len < minOptimal) {
    return {
      length: len,
      status: 'short',
      labelAr: `قصير (يفضل ${minOptimal}–${maxOptimal} حرف)`,
      colorClass: 'text-amber-800 bg-amber-100'
    };
  }
  if (len <= maxOptimal) {
    return {
      length: len,
      status: 'optimal',
      labelAr: 'طول مثالي لجوجل',
      colorClass: 'text-emerald-800 bg-emerald-100'
    };
  }
  return {
    length: len,
    status: 'long',
    labelAr: `طويل (قد يُقتطع بعد ${maxOptimal} حرف)`,
    colorClass: 'text-rose-800 bg-rose-100'
  };
}

export function buildSanitizedSlug(input: string, fallback?: string): string {
  const cleaned = slugify(input || '');
  if (cleaned) return cleaned;
  return slugify(fallback || '') || `sulta-product-${Date.now()}`;
}
