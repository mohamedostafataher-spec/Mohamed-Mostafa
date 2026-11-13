import { OperatingExpense, Order, Product, ReturnRefundRequest } from '../types';

export type OverviewPeriod = 'today' | 'week' | 'month';

export type CostReliability = 'exact' | 'partial' | 'unavailable';

export interface PeriodMetricDelta {
  deltaPercent: number | null;
  direction: 'up' | 'down' | 'flat' | 'none';
}

export interface PeriodWindowStats {
  revenueHalalas: number;
  ordersCount: number;
  aovHalalas: number;
  netProfitHalalas: number;
  cogsHalalas: number;
  shippingCostHalalas: number;
  expensesHalalas: number;
  refundsHalalas: number;
  visitorsCount: number;
  conversionRate: number | null;
  cogsReliability: CostReliability;
  missingCostUnits: number;
  totalUnits: number;
}

export interface OverviewKpiSummary {
  period: OverviewPeriod;
  periodLabelAr: string;
  comparisonLabelAr: string;
  current: PeriodWindowStats;
  previous: PeriodWindowStats;
  deltas: {
    revenue: PeriodMetricDelta;
    orders: PeriodMetricDelta;
    aov: PeriodMetricDelta;
    netProfit: PeriodMetricDelta;
    conversionRate: PeriodMetricDelta;
  };
  operations: {
    pendingOrdersCount: number;
    processingOrdersCount: number;
    shippedOrdersCount: number;
    delayedOrdersCount: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
}

export interface OverviewChartPoint {
  key: string;
  label: string;
  fullLabel: string;
  revenueSar: number;
  netProfitSar: number;
  ordersCount: number;
}

export type NeedsActionSeverity = 'urgent' | 'warning' | 'info';

export interface NeedsActionItem {
  id: string;
  category: 'orders' | 'returns' | 'inventory' | 'messages';
  title: string;
  description: string;
  count: number;
  severity: NeedsActionSeverity;
  targetTab: 'orders' | 'returns' | 'products' | 'customers';
  actionLabel: string;
}

/**
 * Converts a SAR decimal value safely into integer halalas (1 SAR = 100 halalas).
 */
export function toHalalas(sarValue: number | string | undefined | null): number {
  const numeric = Number(sarValue);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round(numeric * 100);
}

/**
 * Converts integer halalas back into SAR numeric value (rounded to 2 decimal places).
 */
export function fromHalalas(halalas: number): number {
  if (!Number.isFinite(halalas)) return 0;
  return Math.round(halalas) / 100;
}

/**
 * Formats integer halalas cleanly as SAR text for UI display.
 */
export function formatSarFromHalalas(halalas: number): string {
  const sar = fromHalalas(halalas);
  const hasFraction = Math.abs(Math.round(halalas) % 100) !== 0;
  return `${sar.toLocaleString('en-US', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0
  })} ر.س`;
}

/**
 * Safely parses an order/expense/return timestamp into a Date instance.
 */
export function parseRecordDate(primaryDate?: string, fallbackDate?: string): Date | null {
  const candidate = primaryDate || fallbackDate;
  if (!candidate) return null;
  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function getLocalDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function isNonCancelledOrder(order: Order): boolean {
  return order.status !== 'cancelled' && order.status !== 'failed';
}

export function isPendingOrder(order: Order): boolean {
  return order.status === 'pending' || order.status === 'new';
}

export function isDelayedOrder(order: Order, referenceNow: Date = new Date()): boolean {
  if (['shipped', 'delivered', 'cancelled', 'failed', 'returned'].includes(order.status || '')) {
    return false;
  }
  const d = parseRecordDate(order.createdAt, order.date);
  if (!d) return false;
  const hoursDiff = (referenceNow.getTime() - d.getTime()) / (1000 * 60 * 60);
  return hoursDiff > 48;
}

export function computeDeltaPercent(current: number, previous: number): PeriodMetricDelta {
  if (!Number.isFinite(previous) || previous === 0) {
    return { deltaPercent: null, direction: 'none' };
  }
  const rawPercent = ((current - previous) / Math.abs(previous)) * 100;
  const rounded = Math.round(rawPercent * 10) / 10;
  if (rounded > 0) return { deltaPercent: rounded, direction: 'up' };
  if (rounded < 0) return { deltaPercent: rounded, direction: 'down' };
  return { deltaPercent: 0, direction: 'flat' };
}

function getPeriodBounds(
  period: OverviewPeriod,
  now: Date
): {
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
  periodLabelAr: string;
  comparisonLabelAr: string;
} {
  const todayStart = startOfLocalDay(now);

  if (period === 'today') {
    return {
      currentStart: todayStart,
      currentEnd: now,
      previousStart: addDays(todayStart, -1),
      previousEnd: todayStart,
      periodLabelAr: 'اليوم',
      comparisonLabelAr: 'مقارنةً بأمس'
    };
  }

  if (period === 'week') {
    const currentStart = addDays(todayStart, -6);
    const previousStart = addDays(currentStart, -7);
    return {
      currentStart,
      currentEnd: now,
      previousStart,
      previousEnd: currentStart,
      periodLabelAr: 'آخر 7 أيام',
      comparisonLabelAr: 'مقارنةً بالـ 7 أيام السابقة'
    };
  }

  const currentStart = addDays(todayStart, -29);
  const previousStart = addDays(currentStart, -30);
  return {
    currentStart,
    currentEnd: now,
    previousStart,
    previousEnd: currentStart,
    periodLabelAr: 'آخر 30 يوماً',
    comparisonLabelAr: 'مقارنةً بالـ 30 يوماً السابقة'
  };
}

function calculateWindowStats(params: {
  windowStart: Date;
  windowEnd: Date;
  orders: Order[];
  products: Product[];
  returns: ReturnRefundRequest[];
  expenses: OperatingExpense[];
  dailyVisitorsMap: Map<string, number>;
  todayLiveVisitorsFallback?: number;
  isTodayWindow?: boolean;
}): PeriodWindowStats {
  const {
    windowStart,
    windowEnd,
    orders,
    products,
    returns,
    expenses,
    dailyVisitorsMap,
    todayLiveVisitorsFallback = 0,
    isTodayWindow = false
  } = params;

  const startMs = windowStart.getTime();
  const endMs = windowEnd.getTime();

  const costHalalasMap = new Map<string, number>();
  for (const p of products) {
    if (p.costPrice !== undefined && p.costPrice !== null && Number(p.costPrice) > 0) {
      costHalalasMap.set(p.id, toHalalas(p.costPrice));
    }
  }

  let revenueHalalas = 0;
  let ordersCount = 0;
  let cogsHalalas = 0;
  let shippingCostHalalas = 0;
  let totalUnits = 0;
  let missingCostUnits = 0;
  let coveredCostUnits = 0;

  for (const order of orders) {
    if (!isNonCancelledOrder(order)) continue;
    const d = parseRecordDate(order.createdAt, order.date);
    if (!d) continue;
    const ms = d.getTime();
    if (ms < startMs || ms > endMs) continue;

    ordersCount += 1;
    revenueHalalas += toHalalas(order.totalPrice);
    shippingCostHalalas += toHalalas(order.shippingCost || 0);

    for (const item of order.items || []) {
      const qty = Math.max(1, Number(item.quantity) || 1);
      totalUnits += qty;
      const itemCostHalalas =
        item.costPrice !== undefined && item.costPrice !== null && Number(item.costPrice) > 0
          ? toHalalas(item.costPrice)
          : item.productId
            ? costHalalasMap.get(item.productId) || 0
            : 0;

      if (itemCostHalalas > 0) {
        cogsHalalas += itemCostHalalas * qty;
        coveredCostUnits += qty;
      } else {
        missingCostUnits += qty;
      }
    }
  }

  let refundsHalalas = 0;
  for (const ret of returns) {
    if (ret.status !== 'refunded' && ret.status !== 'completed') continue;
    const d = parseRecordDate(ret.updatedAt, ret.createdAt);
    if (!d) continue;
    const ms = d.getTime();
    if (ms < startMs || ms > endMs) continue;
    refundsHalalas += toHalalas(ret.refundAmount || 0);
  }

  let expensesHalalas = 0;
  for (const exp of expenses) {
    const d = parseRecordDate(exp.date, exp.createdAt);
    if (!d) continue;
    const ms = d.getTime();
    if (ms < startMs || ms > endMs) continue;
    expensesHalalas += toHalalas(exp.amount || 0);
  }

  const aovHalalas = ordersCount > 0 ? Math.round(revenueHalalas / ordersCount) : 0;
  const netProfitHalalas =
    revenueHalalas - cogsHalalas - shippingCostHalalas - refundsHalalas - expensesHalalas;

  let cogsReliability: CostReliability = 'unavailable';
  if (totalUnits === 0) {
    cogsReliability = coveredCostUnits > 0 ? 'exact' : 'unavailable';
  } else if (coveredCostUnits > 0 && missingCostUnits === 0) {
    cogsReliability = 'exact';
  } else if (coveredCostUnits > 0) {
    cogsReliability = 'partial';
  }

  // Sum recorded visitors across local day keys falling inside [windowStart, windowEnd]
  let visitorsCount = 0;
  if (isTodayWindow) {
    const todayKey = getLocalDayKey(windowStart);
    visitorsCount = Math.max(dailyVisitorsMap.get(todayKey) || 0, todayLiveVisitorsFallback);
  } else {
    let cursor = startOfLocalDay(windowStart);
    const endCursor = startOfLocalDay(windowEnd);
    let guard = 0;
    while (cursor.getTime() <= endCursor.getTime() && guard < 100) {
      // Only include day if it belongs to this window (for exclusive previousEnd like todayStart, avoid double-counting end boundary day)
      const isPreviousExclusiveEnd = cursor.getTime() === endMs;
      if (!isPreviousExclusiveEnd) {
        const key = getLocalDayKey(cursor);
        visitorsCount += dailyVisitorsMap.get(key) || 0;
      }
      cursor = addDays(cursor, 1);
      guard += 1;
    }
  }

  const conversionRate =
    visitorsCount > 0 ? Number(((ordersCount / visitorsCount) * 100).toFixed(2)) : null;

  return {
    revenueHalalas,
    ordersCount,
    aovHalalas,
    netProfitHalalas,
    cogsHalalas,
    shippingCostHalalas,
    expensesHalalas,
    refundsHalalas,
    visitorsCount,
    conversionRate,
    cogsReliability,
    missingCostUnits,
    totalUnits
  };
}

/**
 * Pure testable calculation for Dashboard Overview KPIs, previous-period deltas,
 * and current operational status. All currency math uses integer halalas.
 */
export function computeOverviewKpis(params: {
  period: OverviewPeriod;
  orders: Order[];
  products: Product[];
  returns?: ReturnRefundRequest[];
  expenses?: OperatingExpense[];
  visitorDailyHistory?: { date: string; visitors: number }[];
  todayVisitorsCount?: number;
  now?: Date;
}): OverviewKpiSummary {
  const {
    period,
    orders,
    products,
    returns = [],
    expenses = [],
    visitorDailyHistory = [],
    todayVisitorsCount = 0,
    now = new Date()
  } = params;

  const bounds = getPeriodBounds(period, now);
  const dailyVisitorsMap = new Map<string, number>();
  for (const h of visitorDailyHistory) {
    if (h && h.date) {
      dailyVisitorsMap.set(h.date, Math.max(0, Number(h.visitors) || 0));
    }
  }

  const current = calculateWindowStats({
    windowStart: bounds.currentStart,
    windowEnd: bounds.currentEnd,
    orders,
    products,
    returns,
    expenses,
    dailyVisitorsMap,
    todayLiveVisitorsFallback: todayVisitorsCount,
    isTodayWindow: period === 'today'
  });

  const previous = calculateWindowStats({
    windowStart: bounds.previousStart,
    windowEnd: bounds.previousEnd,
    orders,
    products,
    returns,
    expenses,
    dailyVisitorsMap,
    isTodayWindow: false
  });

  const pendingOrdersCount = orders.filter(isPendingOrder).length;
  const processingOrdersCount = orders.filter(
    (o) => o.status === 'confirmed' || o.status === 'processing' || o.status === 'packed'
  ).length;
  const shippedOrdersCount = orders.filter(
    (o) => o.status === 'shipped' || o.status === 'out_for_delivery'
  ).length;
  const delayedOrdersCount = orders.filter((o) => isDelayedOrder(o, now)).length;
  const lowStockCount = products.filter((p) => Number(p.stock) < 5).length;
  const outOfStockCount = products.filter((p) => Number(p.stock) <= 0).length;

  return {
    period,
    periodLabelAr: bounds.periodLabelAr,
    comparisonLabelAr: bounds.comparisonLabelAr,
    current,
    previous,
    deltas: {
      revenue: computeDeltaPercent(current.revenueHalalas, previous.revenueHalalas),
      orders: computeDeltaPercent(current.ordersCount, previous.ordersCount),
      aov: computeDeltaPercent(current.aovHalalas, previous.aovHalalas),
      netProfit: computeDeltaPercent(current.netProfitHalalas, previous.netProfitHalalas),
      conversionRate:
        current.conversionRate !== null && previous.conversionRate !== null
          ? computeDeltaPercent(current.conversionRate, previous.conversionRate)
          : { deltaPercent: null, direction: 'none' }
    },
    operations: {
      pendingOrdersCount,
      processingOrdersCount,
      shippedOrdersCount,
      delayedOrdersCount,
      lowStockCount,
      outOfStockCount
    }
  };
}

/**
 * Builds the time-series buckets for Recharts according to the selected Overview period.
 */
export function buildOverviewChartSeries(params: {
  period: OverviewPeriod;
  orders: Order[];
  products: Product[];
  now?: Date;
}): OverviewChartPoint[] {
  const { period, orders, products, now = new Date() } = params;
  const validOrders = orders.filter(isNonCancelledOrder);

  const costHalalasMap = new Map<string, number>();
  for (const p of products) {
    if (p.costPrice !== undefined && p.costPrice !== null && Number(p.costPrice) > 0) {
      costHalalasMap.set(p.id, toHalalas(p.costPrice));
    }
  }

  const getOrderProfitHalalas = (order: Order): number => {
    const rev = toHalalas(order.totalPrice);
    const ship = toHalalas(order.shippingCost || 0);
    let cogs = 0;
    for (const item of order.items || []) {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const unitCost =
        item.costPrice !== undefined && item.costPrice !== null && Number(item.costPrice) > 0
          ? toHalalas(item.costPrice)
          : item.productId
            ? costHalalasMap.get(item.productId) || 0
            : 0;
      cogs += unitCost * qty;
    }
    return rev - cogs - ship;
  };

  if (period === 'today') {
    const todayStart = startOfLocalDay(now);
    const todayKey = getLocalDayKey(todayStart);
    const buckets: Array<{
      key: string;
      label: string;
      fullLabel: string;
      revenueHalalas: number;
      profitHalalas: number;
      ordersCount: number;
    }> = [];

    for (let h = 0; h < 24; h += 2) {
      const hourLabel = `${String(h).padStart(2, '0')}:00`;
      const endHourLabel = `${String(h + 2).padStart(2, '0')}:00`;
      buckets.push({
        key: `${todayKey}-h${h}`,
        label: hourLabel,
        fullLabel: `اليوم ${hourLabel} - ${endHourLabel}`,
        revenueHalalas: 0,
        profitHalalas: 0,
        ordersCount: 0
      });
    }

    for (const order of validOrders) {
      const d = parseRecordDate(order.createdAt, order.date);
      if (!d || getLocalDayKey(d) !== todayKey) continue;
      const bucketIdx = Math.min(11, Math.floor(d.getHours() / 2));
      buckets[bucketIdx].revenueHalalas += toHalalas(order.totalPrice);
      buckets[bucketIdx].profitHalalas += getOrderProfitHalalas(order);
      buckets[bucketIdx].ordersCount += 1;
    }

    return buckets.map((b) => ({
      key: b.key,
      label: b.label,
      fullLabel: b.fullLabel,
      revenueSar: fromHalalas(b.revenueHalalas),
      netProfitSar: fromHalalas(b.profitHalalas),
      ordersCount: b.ordersCount
    }));
  }

  const totalDays = period === 'week' ? 7 : 30;
  const todayStart = startOfLocalDay(now);
  const bucketMap = new Map<
    string,
    {
      key: string;
      label: string;
      fullLabel: string;
      revenueHalalas: number;
      profitHalalas: number;
      ordersCount: number;
    }
  >();

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = addDays(todayStart, -i);
    const key = getLocalDayKey(d);
    const shortLabel = d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
    const fullLabel = d.toLocaleDateString('ar-SA', {
      weekday: 'short',
      day: 'numeric',
      month: 'long'
    });
    bucketMap.set(key, {
      key,
      label: shortLabel,
      fullLabel,
      revenueHalalas: 0,
      profitHalalas: 0,
      ordersCount: 0
    });
  }

  for (const order of validOrders) {
    const d = parseRecordDate(order.createdAt, order.date);
    if (!d) continue;
    const key = getLocalDayKey(d);
    const bucket = bucketMap.get(key);
    if (!bucket) continue;
    bucket.revenueHalalas += toHalalas(order.totalPrice);
    bucket.profitHalalas += getOrderProfitHalalas(order);
    bucket.ordersCount += 1;
  }

  return Array.from(bucketMap.values()).map((b) => ({
    key: b.key,
    label: b.label,
    fullLabel: b.fullLabel,
    revenueSar: fromHalalas(b.revenueHalalas),
    netProfitSar: fromHalalas(b.profitHalalas),
    ordersCount: b.ordersCount
  }));
}

/**
 * Aggregates real operational items that require immediate team attention.
 */
export function buildNeedsActionQueue(params: {
  orders: Order[];
  products: Product[];
  returns: ReturnRefundRequest[];
  unansweredMessagesCount: number;
  now?: Date;
}): NeedsActionItem[] {
  const { orders, products, returns, unansweredMessagesCount, now = new Date() } = params;
  const items: NeedsActionItem[] = [];

  const pendingOrders = orders.filter(isPendingOrder);
  const delayedOrders = orders.filter((o) => isDelayedOrder(o, now));

  if (delayedOrders.length > 0) {
    items.push({
      id: 'delayed-orders',
      category: 'orders',
      title: 'طلبات متأخرة عن الشحن (> 48 ساعة)',
      description: `توجد ${delayedOrders.length} طلبات لم تُشحن بعد مرور أكثر من يومين.`,
      count: delayedOrders.length,
      severity: 'urgent',
      targetTab: 'orders',
      actionLabel: 'مراجعة الطلبات المتأخرة'
    });
  }

  if (pendingOrders.length > 0) {
    items.push({
      id: 'new-orders',
      category: 'orders',
      title: 'طلبات جديدة بانتظار التأكيد',
      description: `${pendingOrders.length} طلبات بانتظار تأكيد الدفع أو التجهيز.`,
      count: pendingOrders.length,
      severity: 'warning',
      targetTab: 'orders',
      actionLabel: 'فتح الطلبات'
    });
  }

  const pendingReturns = returns.filter(
    (r) => r.status === 'pending' || r.status === 'item_received'
  );
  if (pendingReturns.length > 0) {
    items.push({
      id: 'pending-returns',
      category: 'returns',
      title: 'طلبات مرتجع أو استبدال معلقة',
      description: `${pendingReturns.length} طلبات تحتاج قرار مراجعة أو فحص قطعة.`,
      count: pendingReturns.length,
      severity: 'warning',
      targetTab: 'returns',
      actionLabel: 'معالجة المرتجعات'
    });
  }

  const lowStockProducts = products.filter((p) => Number(p.stock) < 5);
  if (lowStockProducts.length > 0) {
    const outOfStock = lowStockProducts.filter((p) => Number(p.stock) <= 0).length;
    items.push({
      id: 'low-stock',
      category: 'inventory',
      title: outOfStock > 0 ? 'منتجات نفدت أو أوشكت على النفاد' : 'منتجات بمخزون منخفض (< 5)',
      description:
        outOfStock > 0
          ? `${outOfStock} نفدت تماماً و${lowStockProducts.length - outOfStock} أقل من 5 قطع.`
          : `${lowStockProducts.length} منتجات انخفض مخزونها عن 5 قطع.`,
      count: lowStockProducts.length,
      severity: outOfStock > 0 ? 'urgent' : 'warning',
      targetTab: 'products',
      actionLabel: 'عرض الكتالوج'
    });
  }

  if (unansweredMessagesCount > 0) {
    items.push({
      id: 'unanswered-messages',
      category: 'messages',
      title: 'رسائل عميلات لم يُرد عليها',
      description: `${unansweredMessagesCount} تذاكر أو استفسارات جديدة بانتظار الرد.`,
      count: unansweredMessagesCount,
      severity: 'info',
      targetTab: 'customers',
      actionLabel: 'الرد الآن'
    });
  }

  return items;
}
