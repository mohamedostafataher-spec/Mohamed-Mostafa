import {
  Order,
  Product,
  OperatingExpense,
  ReturnRefundRequest
} from '../types';

export interface PaymentFeeConfig {
  codFeePercent: number;
  codFixedFeeSar: number;
  bankTransferFeePercent: number;
  cardFeePercent: number;
  cardFixedFeeSar: number;
  installmentFeePercent: number; // Tabby / Tamara
  allocateMarketingExpensesAcrossOrders: boolean;
}

export const DEFAULT_PAYMENT_FEE_CONFIG: PaymentFeeConfig = {
  codFeePercent: 0,
  codFixedFeeSar: 0,
  bankTransferFeePercent: 0,
  cardFeePercent: 0,
  cardFixedFeeSar: 0,
  installmentFeePercent: 0,
  allocateMarketingExpensesAcrossOrders: true
};

export function toHalalas(sar: number | undefined | null): number {
  const n = Number(sar || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function fromHalalas(halalas: number): number {
  return Math.round(halalas) / 100;
}

export function formatSarFromHalalas(halalas: number): string {
  const val = fromHalalas(halalas);
  return val.toLocaleString('en-US', {
    minimumFractionDigits: val % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  });
}

export interface OrderProfitBreakdown {
  orderId: string;
  orderDate: string;
  customerName: string;
  paymentMethod: string;
  status: string;
  paymentStatus: string;
  grossSaleHalalas: number;
  discountHalalas: number;
  productCostHalalas: number;
  shippingHalalas: number;
  paymentFeeHalalas: number;
  attributedAdCostHalalas: number;
  netProfitHalalas: number;
  cogsMissing: boolean;
}

export function estimatePaymentFeeHalalas(
  order: Order,
  config: PaymentFeeConfig
): number {
  const totalHalalas = toHalalas(order.totalPrice);
  if (totalHalalas <= 0) return 0;

  const pm = (order.paymentMethod || '').toLowerCase();
  if (pm.includes('cod') || pm.includes('استلام')) {
    return (
      Math.round((totalHalalas * (config.codFeePercent || 0)) / 100) +
      toHalalas(config.codFixedFeeSar || 0)
    );
  }
  if (pm.includes('tabby') || pm.includes('tamara') || pm.includes('تابي') || pm.includes('تمارا')) {
    return Math.round((totalHalalas * (config.installmentFeePercent || 0)) / 100);
  }
  if (pm.includes('bank') || pm.includes('تحويل') || pm.includes('بنك') || pm.includes('الراجحي')) {
    return Math.round((totalHalalas * (config.bankTransferFeePercent || 0)) / 100);
  }
  return (
    Math.round((totalHalalas * (config.cardFeePercent || 0)) / 100) +
    toHalalas(config.cardFixedFeeSar || 0)
  );
}

/**
 * Exact Order Profit Formula:
 * ربح الطلب = البيع − الخصم − تكلفة المنتج − الشحن − رسوم الدفع − الإعلان المنسوب
 */
export function calculateOrderProfitBreakdownHalalas(
  order: Order,
  products: Product[],
  feeConfig: PaymentFeeConfig = DEFAULT_PAYMENT_FEE_CONFIG,
  attributedAdCostHalalas: number = 0
): OrderProfitBreakdown {
  const productCostMap = new Map<string, number>();
  products.forEach((p) => {
    if (p.costPrice && p.costPrice > 0) {
      productCostMap.set(p.id, toHalalas(p.costPrice));
    }
  });

  let itemsSaleHalalas = 0;
  let productCostHalalas = 0;
  let cogsMissing = false;

  for (const item of order.items || []) {
    const qty = Math.max(1, Number(item.quantity || 1));
    itemsSaleHalalas += toHalalas(item.price) * qty;

    const unitCostHalalas =
      item.costPrice !== undefined && item.costPrice > 0
        ? toHalalas(item.costPrice)
        : item.productId
        ? productCostMap.get(item.productId) || 0
        : 0;

    if (unitCostHalalas > 0) {
      productCostHalalas += unitCostHalalas * qty;
    } else {
      cogsMissing = true;
    }
  }

  const discountHalalas = toHalalas(order.discountAmount || 0);
  // Fall back to order.totalPrice + discount if items array is empty
  const grossSaleHalalas =
    itemsSaleHalalas > 0 ? itemsSaleHalalas : toHalalas(order.totalPrice) + discountHalalas;

  // Shipping deduction: real carrier shippingCost if entered, otherwise shippingFee if applicable
  const shippingHalalas = toHalalas(order.shippingCost ?? order.shippingFee ?? 0);
  const paymentFeeHalalas = estimatePaymentFeeHalalas(order, feeConfig);

  const netProfitHalalas =
    grossSaleHalalas -
    discountHalalas -
    productCostHalalas -
    shippingHalalas -
    paymentFeeHalalas -
    attributedAdCostHalalas;

  return {
    orderId: order.id,
    orderDate: (order.createdAt || order.date || new Date().toISOString()).slice(0, 10),
    customerName: order.customerName || 'عميلة سولته',
    paymentMethod: order.paymentMethod || 'تحويل بنكي',
    status: order.status,
    paymentStatus: order.paymentStatus || 'pending',
    grossSaleHalalas,
    discountHalalas,
    productCostHalalas,
    shippingHalalas,
    paymentFeeHalalas,
    attributedAdCostHalalas,
    netProfitHalalas,
    cogsMissing
  };
}

export interface MonthlyPnLRow {
  monthKey: string; // YYYY-MM
  monthLabel: string;
  ordersCount: number;
  grossSalesHalalas: number;
  discountsHalalas: number;
  refundsHalalas: number;
  shippingRevenueHalalas: number;
  netSalesHalalas: number;
  cogsHalalas: number;
  paymentFeesHalalas: number;
  shippingExpenseHalalas: number;
  operatingExpensesHalalas: number;
  netProfitHalalas: number;
  cashCollectedHalalas: number;
  cashPendingHalalas: number;
}

export function calculateMonthlyPnLAndCashflow(
  orders: Order[],
  expenses: OperatingExpense[],
  returns: ReturnRefundRequest[],
  products: Product[],
  feeConfig: PaymentFeeConfig = DEFAULT_PAYMENT_FEE_CONFIG
): MonthlyPnLRow[] {
  const validOrders = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'failed');
  const map = new Map<string, MonthlyPnLRow>();

  const getOrInitMonth = (isoDateStr: string): MonthlyPnLRow => {
    const cleanMonth = /^\d{4}-\d{2}/.test(isoDateStr)
      ? isoDateStr.slice(0, 7)
      : new Date().toISOString().slice(0, 7);

    if (!map.has(cleanMonth)) {
      const [yr, mo] = cleanMonth.split('-').map(Number);
      const d = new Date(yr || 2026, (mo || 1) - 1, 1);
      const monthLabel = d.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });
      map.set(cleanMonth, {
        monthKey: cleanMonth,
        monthLabel,
        ordersCount: 0,
        grossSalesHalalas: 0,
        discountsHalalas: 0,
        refundsHalalas: 0,
        shippingRevenueHalalas: 0,
        netSalesHalalas: 0,
        cogsHalalas: 0,
        paymentFeesHalalas: 0,
        shippingExpenseHalalas: 0,
        operatingExpensesHalalas: 0,
        netProfitHalalas: 0,
        cashCollectedHalalas: 0,
        cashPendingHalalas: 0
      });
    }
    return map.get(cleanMonth)!;
  };

  for (const order of validOrders) {
    const dt = order.createdAt || order.date || new Date().toISOString();
    const row = getOrInitMonth(dt);
    const breakdown = calculateOrderProfitBreakdownHalalas(order, products, feeConfig, 0);

    row.ordersCount += 1;
    row.grossSalesHalalas += breakdown.grossSaleHalalas;
    row.discountsHalalas += breakdown.discountHalalas;
    row.shippingRevenueHalalas += toHalalas(order.shippingFee || 0);
    row.cogsHalalas += breakdown.productCostHalalas;
    row.paymentFeesHalalas += breakdown.paymentFeeHalalas;
    row.shippingExpenseHalalas += breakdown.shippingHalalas;

    const totalHalalas = toHalalas(order.totalPrice);
    const isCollected =
      order.paymentStatus === 'paid' ||
      (order.status === 'delivered' &&
        ((order.paymentMethod || '').toLowerCase().includes('cod') ||
          (order.paymentMethod || '').includes('استلام')));

    if (isCollected) {
      row.cashCollectedHalalas += totalHalalas;
    } else {
      row.cashPendingHalalas += totalHalalas;
    }
  }

  for (const ret of returns) {
    if (ret.status === 'refunded' || ret.status === 'completed') {
      const row = getOrInitMonth(ret.updatedAt || ret.createdAt || new Date().toISOString());
      row.refundsHalalas += toHalalas(ret.refundAmount || 0);
    }
  }

  for (const exp of expenses) {
    const row = getOrInitMonth(exp.date || exp.createdAt || new Date().toISOString());
    row.operatingExpensesHalalas += toHalalas(exp.amount || 0);
  }

  const rows = Array.from(map.values()).map((row) => {
    row.netSalesHalalas = Math.max(
      0,
      row.grossSalesHalalas - row.discountsHalalas - row.refundsHalalas + row.shippingRevenueHalalas
    );
    row.netProfitHalalas =
      row.netSalesHalalas -
      row.cogsHalalas -
      row.paymentFeesHalalas -
      row.shippingExpenseHalalas -
      row.operatingExpensesHalalas;
    return row;
  });

  return rows.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}

export interface ReconciliationSummary {
  codDeliveredOrders: Order[];
  codDeliveredHalalas: number;
  codPendingOrders: Order[];
  codPendingHalalas: number;
  bankVerifiedOrders: Order[];
  bankVerifiedHalalas: number;
  bankPendingOrders: Order[];
  bankPendingHalalas: number;
  bankRejectedOrders: Order[];
  bankRejectedHalalas: number;
}

export function generateReconciliationSummary(orders: Order[]): ReconciliationSummary {
  const nonCancelled = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'failed');

  const isCod = (o: Order) => {
    const pm = (o.paymentMethod || '').toLowerCase();
    return pm.includes('cod') || pm.includes('استلام');
  };

  const codOrders = nonCancelled.filter(isCod);
  const bankOrders = nonCancelled.filter((o) => !isCod(o));

  const codDeliveredOrders = codOrders.filter(
    (o) => o.status === 'delivered' || o.paymentStatus === 'paid'
  );
  const codPendingOrders = codOrders.filter(
    (o) => o.status !== 'delivered' && o.paymentStatus !== 'paid'
  );

  const bankVerifiedOrders = bankOrders.filter((o) => o.paymentStatus === 'paid');
  const bankPendingOrders = bankOrders.filter(
    (o) => !o.paymentStatus || o.paymentStatus === 'pending'
  );
  const bankRejectedOrders = bankOrders.filter((o) => o.paymentStatus === 'rejected');

  const sumHalalas = (list: Order[]) =>
    list.reduce((acc, o) => acc + toHalalas(o.totalPrice), 0);

  return {
    codDeliveredOrders,
    codDeliveredHalalas: sumHalalas(codDeliveredOrders),
    codPendingOrders,
    codPendingHalalas: sumHalalas(codPendingOrders),
    bankVerifiedOrders,
    bankVerifiedHalalas: sumHalalas(bankVerifiedOrders),
    bankPendingOrders,
    bankPendingHalalas: sumHalalas(bankPendingOrders),
    bankRejectedOrders,
    bankRejectedHalalas: sumHalalas(bankRejectedOrders)
  };
}

export function calculateVatSummaryHalalas(
  amountHalalas: number,
  vatRatePercent: number = 15,
  isInclusive: boolean = true
): { netExclVatHalalas: number; vatAmountHalalas: number; totalInclVatHalalas: number } {
  if (amountHalalas <= 0 || vatRatePercent <= 0) {
    return {
      netExclVatHalalas: amountHalalas,
      vatAmountHalalas: 0,
      totalInclVatHalalas: amountHalalas
    };
  }
  const rate = vatRatePercent / 100;
  if (isInclusive) {
    const netExclVatHalalas = Math.round(amountHalalas / (1 + rate));
    const vatAmountHalalas = amountHalalas - netExclVatHalalas;
    return {
      netExclVatHalalas,
      vatAmountHalalas,
      totalInclVatHalalas: amountHalalas
    };
  }
  const vatAmountHalalas = Math.round(amountHalalas * rate);
  return {
    netExclVatHalalas: amountHalalas,
    vatAmountHalalas,
    totalInclVatHalalas: amountHalalas + vatAmountHalalas
  };
}

export function exportRowsToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvContent =
    '\uFEFF' +
    [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
