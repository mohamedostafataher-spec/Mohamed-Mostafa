/**
 * SULTA Unified Payment Service
 * 
 * Central coordinator for all payment processing in the SULTA Boutique:
 * - Apple Pay (Real device & Paymob gateway flow)
 * - Visa / Mastercard / Mada (PCI-DSS compliant Paymob gateway)
 * - Cash on Delivery (COD)
 * 
 * STRICT ARCHITECTURAL INVARIANTS:
 * 1. NO fake payment success simulation (`paymentSuccess = true` is forbidden).
 * 2. NO secrets (API secrets, HMAC secrets) are present in the frontend.
 * 3. Statuses strictly mapped: pending, paid, failed, cancelled, cod.
 * 4. Electronic payments ONLY marked 'paid' when authenticated by the payment gateway / webhook / server HMAC.
 * 
 * REQUIRED BACKEND SERVER ENDPOINTS:
 * --------------------------------------------------------------------------
 * 1. POST /api/payment/paymob/intention
 *    Request Body:
 *    {
 *      "order_id": string,
 *      "amount_cents": number,
 *      "currency": "SAR",
 *      "payment_method": "apple_pay" | "card",
 *      "customer": { "name": string, "phone": string, "city": string, "address": string },
 *      "items": Array<{ "id": string, "name": string, "price": number, "quantity": number }>
 *    }
 *    Headers:
 *      Uses server-side PAYMOB_SECRET_KEY in server environment.
 *    Response:
 *    {
 *      "success": true,
 *      "client_secret": string,
 *      "payment_key": string,
 *      "redirection_url": string,
 *      "iframe_url": string
 *    }
 * 
 * 2. POST /api/payment/paymob/verify
 *    Request Body:
 *    {
 *      "order_id": string,
 *      "transaction_id": string,
 *      "hmac": string,
 *      ...paymob_callback_params
 *    }
 *    Response:
 *    {
 *      "verified": boolean,
 *      "status": "paid" | "failed" | "cancelled"
 *    }
 * 
 * 3. POST /api/payment/paymob/webhook
 *    Receives direct server-to-server notifications from Paymob with HMAC validation.
 * --------------------------------------------------------------------------
 */

import { 
  CustomerBillingData, 
  PaymentIntentResponse, 
  PaymentMethodType, 
  PaymentVerificationResult
} from './types';
import { initiateCardPayment } from './cardPayment';
import { orderService, CreateOrderParams } from './orderService';
import { PAYMOB_VERIFY_ENDPOINT } from './paymentConfig';
import { Order } from '../types';

export const paymentService = {

  /**
   * Processes an order with Cash on Delivery (COD)
   * Does NOT mark payment as electronically paid.
   * Order status is set to 'cod'.
   */
  async processCashOnDelivery(params: CreateOrderParams): Promise<{ order: Order; message: string }> {
    const order = await orderService.createOrder(params, 'cod');
    return {
      order,
      message: 'تم استلام طلبك بنجاح وسيتم التواصل معك لتأكيد الطلب.'
    };
  },

  /**
   * Initiates electronic payment flow (Card, PayPal, or Bank Transfer)
   */
  async initiateElectronicPayment(
    params: CreateOrderParams,
    method: 'card' | 'bank_transfer' | 'paypal'
  ): Promise<{ order: Order; paymentIntent: PaymentIntentResponse }> {
    // 1. Create order in 'pending' status (never 'paid' upfront!)
    const order = await orderService.createOrder(params, 'pending');

    // Handle Direct Bank Transfer or PayPal (which needs redirection)
    if (method === 'bank_transfer' || method === 'paypal') {
      // PayPal Business logic improvement
      // Convert SAR to USD for PayPal compatibility if needed (approx 1 SAR = 0.27 USD)
      const amountUSD = (order.totalPrice * 0.27).toFixed(2);
      
      return {
        order,
        paymentIntent: {
          success: true,
          orderId: order.id,
          status: 'pending',
          // Improved PayPal flow: Redirect to a standard payment request
          // Note: PayPal standard buttons work best with USD/EUR for international business accounts
          redirectionUrl: method === 'paypal' 
            ? `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=concierge@sulta.sa&amount=${amountUSD}&currency_code=USD&item_name=SULTA_Order_${order.id}&return=${window.location.origin}/order-success&cancel_return=${window.location.origin}` 
            : undefined
        }
      };
    }

    // Handle other electronic payments (Card)
    const paymentParams = {
      orderId: order.id,
      amount: order.totalPrice,
      currency: 'SAR' as const,
      customer: params.customer,
      items: order.items.map(i => ({
        id: i.productId,
        name: i.productName,
        price: i.price,
        quantity: i.quantity,
        variant: `${i.color} - ${i.size}`
      })),
      method: method as any
    };

    // 3. Delegate to appropriate payment provider module
    let paymentIntent: PaymentIntentResponse;
    paymentIntent = await initiateCardPayment(paymentParams);

    // If initial gateway call failed, set order status to 'failed'
    if (!paymentIntent.success) {
      await orderService.updateOrderStatus(order.id, 'failed');
    }

    return { order, paymentIntent };
  },

  /**
   * Verifies an electronic transaction with the backend server
   * HMAC verification happens STRICTLY on the backend to avoid exposing keys.
   */
  async verifyPayment(
    orderId: string, 
    transactionId?: string, 
    queryParams?: Record<string, string>
  ): Promise<PaymentVerificationResult> {
    try {
      const response = await fetch(PAYMOB_VERIFY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          transaction_id: transactionId,
          params: queryParams,
        }),
      });

      if (!response.ok) {
        return {
          verified: false,
          orderId,
          status: 'failed',
          errorMessage: 'لم تكتمل عملية الدفع. حاول مرة أخرى أو اختر طريقة دفع أخرى.'
        };
      }

      // Ensure JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {
          verified: false,
          orderId,
          status: 'failed',
          errorMessage: 'تلقى المتجر رداً غير متوقع من الخادم (HTML).'
        };
      }

      const result = await response.json();
      
      // Update local order status strictly if verified
      if (result.verified && result.status === 'paid') {
        await orderService.updateOrderStatus(orderId, 'paid');
      } else if (result.status === 'failed') {
        await orderService.updateOrderStatus(orderId, 'failed');
      }

      return result;
    } catch (error) {
      console.error('[PaymentService] Error verifying transaction:', error);
      return {
        verified: false,
        orderId,
        status: 'failed',
        errorMessage: 'لم تكتمل عملية الدفع. حاول مرة أخرى أو اختر طريقة دفع أخرى.'
      };
    }
  }
};
