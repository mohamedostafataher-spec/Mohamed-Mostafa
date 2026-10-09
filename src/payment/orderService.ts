/**
 * SULTA Payment Architecture - Order Management Service
 * 
 * Manages order creation, lifecycle states, and persistence.
 * Strictly adheres to verified statuses:
 * - 'pending': Order created, awaiting electronic payment or manual processing.
 * - 'paid': ONLY set when verified by payment provider (Paymob / webhook / HMAC).
 * - 'failed': Electronic transaction declined or interrupted.
 * - 'cancelled': Order aborted by customer or merchant.
 * - 'cod': Cash On Delivery order confirmed for physical fulfillment.
 * 
 * NO fake success states!
 */

import { Order, CartItem, Country } from '../types';
import { dbService } from '../services/db';
import { CustomerBillingData, PaymentGatewayStatus, PaymentMethodType } from './types';

export interface CreateOrderParams {
  customer: CustomerBillingData;
  country: Country;
  cart: CartItem[];
  shippingFee: number;
  totalPrice: number;
  paymentMethodType: PaymentMethodType;
  couponCode?: string;
  notes?: string;
  whatsappOptIn?: boolean;
}

export const orderService = {
  /**
   * Generates a unique tracking reference code for Saudi logistics
   */
  generateOrderCode(): string {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `SULTA-${randomDigits}`;
  },

  /**
   * Assembles and saves an order to persistent storage
   */
  async createOrder(params: CreateOrderParams, initialStatus: PaymentGatewayStatus): Promise<Order> {
    const orderId = crypto.randomUUID();
    const trackingCode = this.generateOrderCode();

    let readablePaymentMethod = 'الدفع عند الاستلام';
    if (params.paymentMethodType === 'card') {
      readablePaymentMethod = 'بطاقة ائتمانية / مدى (Visa / Mastercard / Mada)';
    } else if (params.paymentMethodType === 'paypal') {
      readablePaymentMethod = 'PayPal (باي بال)';
    } else if (params.paymentMethodType === 'bank_transfer') {
      readablePaymentMethod = 'تحويل بنكي مباشر (حساب المتجر)';
    } else if (params.paymentMethodType === 'cod') {
      readablePaymentMethod = 'الدفع عند الاستلام (COD)';
    }

    const newOrder: Order = {
      id: orderId,
      trackingNumber: trackingCode,
      customerName: params.customer.name,
      phone: params.customer.phone,
      email: params.customer.email,
      country: params.country,
      city: params.customer.city,
      address: params.customer.address,
      notes: params.notes,
      shippingFee: params.shippingFee,
      items: params.cart.map(item => {
        const itemPrice = params.country === 'EG' ? item.product.priceEG : item.product.priceSA;
        return {
          productId: item.product.id,
          productName: item.product.nameAr,
          color: item.selectedColor?.name || 'افتراضي',
          size: item.selectedSize,
          quantity: item.quantity,
          price: itemPrice
        };
      }),
      totalPrice: params.totalPrice,
      currency: params.country === 'EG' ? 'EGP' : 'SAR',
      paymentMethod: readablePaymentMethod,
      status: initialStatus as any,
      whatsappOptIn: params.whatsappOptIn || false,
      whatsappOptInDate: params.whatsappOptIn ? new Date().toISOString() : undefined,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    // Save order through database service
    await dbService.saveOrder(newOrder);

    return newOrder;
  },

  /**
   * Updates an order's status following real gateway verification
   */
  async updateOrderStatus(orderId: string, status: PaymentGatewayStatus): Promise<boolean> {
    try {
      const raw = localStorage.getItem('sulta_offline_orders');
      const orders: Order[] = raw ? JSON.parse(raw) : [];
      const target = orders.find(o => o.id === orderId);
      if (target) {
        target.status = status as any;
        await dbService.updateOrder(target);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[OrderService] Error updating order status:', error);
      return false;
    }
  }
};
