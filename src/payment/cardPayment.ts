/**
 * SULTA Payment Architecture - Credit Card & Mada Payment Module
 * 
 * PCI-DSS & SECURITY MANDATE:
 * - NO card numbers, expiration dates, or CVV are stored on our database or frontend!
 * - Card details are submitted directly to Paymob's PCI-DSS Level 1 certified gateway.
 * - Integration via Paymob Intention API (Redirection / Unified Checkout / Hosted Iframe).
 * - Supported networks: Visa, Mastercard, and Saudi Mada (مدى).
 */

import { CreatePaymentIntentParams, PaymentIntentResponse } from './types';
import { PAYMOB_PAYMENT_ENDPOINT, PAYMOB_IFRAME_ID } from './paymentConfig';

export interface CardBrandSupport {
  id: string;
  name: string;
  nameAr: string;
  logo: string;
}

export const SUPPORTED_CARD_BRANDS: CardBrandSupport[] = [
  { id: 'mada', name: 'mada', nameAr: 'مدى', logo: '💳' },
  { id: 'visa', name: 'Visa', nameAr: 'فيزا', logo: '💳' },
  { id: 'mastercard', name: 'Mastercard', nameAr: 'ماستركارد', logo: '💳' },
];

/**
 * Initiates a Card / Mada payment with Paymob through the secure backend endpoint
 * 
 * BACKEND ENDPOINT REQUIRED:
 * POST /api/payment/paymob/intention
 * Body: {
 *   amount_cents: number,
 *   currency: 'SAR',
 *   payment_method: 'card',
 *   order_id: string,
 *   customer: { name, phone, city, address }
 * }
 */
export async function initiateCardPayment(
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResponse> {
  try {
    const response = await fetch(PAYMOB_PAYMENT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: params.orderId,
        amount_cents: Math.round(params.amount * 100),
        currency: 'SAR',
        payment_method: 'card',
        customer: params.customer,
        items: params.items
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        orderId: params.orderId,
        status: 'failed',
        errorMessage: errorData.message || 'لم تكتمل عملية الدفع بالبطاقة. تأكد من تفعيل بوابة Paymob للتاجر أو اختر طريقة دفع أخرى.'
      };
    }

    const data = await response.json();

    // Construct secure Paymob Iframe or Redirection URL
    let iframeUrl = data.iframe_url;
    if (!iframeUrl && data.payment_key && PAYMOB_IFRAME_ID) {
      iframeUrl = `https://ksa.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${data.payment_key}`;
    }

    return {
      success: true,
      orderId: params.orderId,
      paymentKey: data.payment_key,
      clientSecret: data.client_secret,
      iframeUrl: iframeUrl,
      redirectionUrl: data.redirection_url || iframeUrl,
      status: 'pending',
      requiresRedirect: Boolean(data.redirection_url || iframeUrl)
    };
  } catch (error: any) {
    console.error('[CardPayment] Error initiating card payment:', error);
    return {
      success: false,
      orderId: params.orderId,
      status: 'failed',
      errorMessage: 'تعذر الاتصال ببوابة الدفع. يرجى التحقق من اتصالك والمحاولة لاحقاً.'
    };
  }
}
