import { Product, Order } from '../types';

export interface ProductMetric {
  id: string;
  name: string;
  views: number;
  cartAdditions: number;
  ordersCount: number;
  conversionRate: number; // percentage
}

const STORAGE_KEY = 'sulta_product_analytics_telemetry';

interface TelemetryData {
  [productId: string]: {
    views?: number;
    cartAdditions?: number;
  };
}

// Helper to load telemetry from localStorage Safely
const loadTelemetry = (): TelemetryData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to load telemetry data from localStorage:', e);
    return {};
  }
};

// Helper to save telemetry to localStorage
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

  // Aggregate actual product quantities ordered from orders DB
  const actualOrdersCountMap: Record<string, number> = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      actualOrdersCountMap[item.productId] = (actualOrdersCountMap[item.productId] || 0) + item.quantity;
    });
  });

  return products.map(product => {
    // Live telemetry adjustments
    const liveViews = data[product.id]?.views || 0;
    const liveAdditions = data[product.id]?.cartAdditions || 0;
    const liveOrders = actualOrdersCountMap[product.id] || 0;

    // Total final figures (Now reading exclusively from live database and telemetry)
    const views = liveViews;
    const cartAdditions = liveAdditions;
    const ordersCount = liveOrders;

    // Conversion rate formula
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
