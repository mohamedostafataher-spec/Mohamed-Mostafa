/**
 * SULTA Payment Architecture - Apple Pay Real Integration Module
 * 
 * STRICT RULES ENFORCED:
 * - Real Apple Pay integration through Paymob / ApplePaySession API.
 * - NO fake Apple Pay mock / simulation timeouts.
 * - NO card fields required when Apple Pay is active.
 * - Real hardware and browser capability detection (Safari / Apple devices / ApplePaySession).
 * - Graceful fallback and clear messaging if Apple Pay is unsupported or merchant profile is inactive.
 * 
 * APPLE PAY PRODUCTION REQUIREMENTS (Documentation for Merchant):
 * 1. An Apple Developer Account with an Apple Merchant ID (e.g., merchant.com.sulta.boutique).
 * 2. Payment Processing Certificate uploaded to Paymob Dashboard.
 * 3. Domain verification file placed at: /.well-known/apple-developer-merchantid-domain-association
 * 4. Paymob Apple Pay Integration ID enabled on Saudi account.
 */

import { ApplePayAvailability, CreatePaymentIntentParams, PaymentIntentResponse } from './types';
import { PAYMOB_PAYMENT_ENDPOINT, isPaymobConfigured } from './paymentConfig';

// Declare ApplePaySession for TypeScript environments
declare global {
  interface Window {
    ApplePaySession?: any;
  }
}

/**
 * Checks if the current client device and browser physically support Apple Pay
 */
export function checkApplePaySupport(): ApplePayAvailability {
  // Check if running in browser
  if (typeof window === 'undefined') {
    return { isAvailable: false, reason: 'البيئة غير مدعومة (Server-side)' };
  }

  // Apple Pay requires secure HTTPS protocol
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    return { 
      isAvailable: false, 
      reason: 'يتطلب Apple Pay اتصالاً آمناً بتشفير HTTPS' 
    };
  }

  // Check native ApplePaySession API in Safari / WebKit on iOS or macOS
  if (!window.ApplePaySession) {
    return { 
      isAvailable: false, 
      reason: 'Apple Pay غير مدعوم على هذا المتصفح. يرجى استخدام متصفح Safari على جهاز Apple (iPhone, iPad, Mac) مفعل به Apple Pay.' 
    };
  }

  try {
    const canMakePayments = window.ApplePaySession.canMakePayments();
    if (!canMakePayments) {
      return { 
        isAvailable: false, 
        reason: 'Apple Pay غير مفعّل على جهازك. يرجى إضافة بطاقة بنكية إلى تطبيق Wallet (المحفظة).' 
      };
    }

    return { isAvailable: true };
  } catch (error) {
    return { 
      isAvailable: false, 
      reason: 'تعذر التحقق من توفر Apple Pay على جهازك.' 
    };
  }
}

/**
 * Requests an Apple Pay transaction through Paymob's secure backend endpoint
 * 
 * BACKEND ENDPOINT REQUIRED:
 * POST /api/payment/paymob/intention
 * Body: {
 *   amount_cents: number,
 *   currency: 'SAR',
 *   payment_method: 'apple_pay',
 *   order_id: string,
 *   customer: { name, phone, city, address }
 * }
 */
export async function initiateApplePayPayment(
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResponse> {
  const availability = checkApplePaySupport();
  
  if (!availability.isAvailable) {
    return {
      success: false,
      orderId: params.orderId,
      status: 'failed',
      errorMessage: availability.reason || 'Apple Pay غير متاح على جهازك الحالي.'
    };
  }

  try {
    // Call server endpoint for payment intention
    const response = await fetch(PAYMOB_PAYMENT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: params.orderId,
        amount_cents: Math.round(params.amount * 100),
        currency: 'SAR',
        payment_method: 'apple_pay',
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
        errorMessage: errorData.message || 'لم تكتمل عملية الدفع عبر Apple Pay. تأكد من تفعيل بوابة الدفع على حساب التاجر أو اختر الدفع بالبطاقة الائتمانية أو عند الاستلام.'
      };
    }

    const data = await response.json();

    // If backend returns a redirection or payment URL from Paymob Apple Pay
    if (data.redirection_url || data.client_secret) {
      return {
        success: true,
        orderId: params.orderId,
        clientSecret: data.client_secret,
        paymentKey: data.payment_key,
        redirectionUrl: data.redirection_url,
        status: 'pending',
        requiresRedirect: Boolean(data.redirection_url)
      };
    }

    return {
      success: false,
      orderId: params.orderId,
      status: 'failed',
      errorMessage: 'لم نتمكن من بدء جلسة Apple Pay. يرجى المحاولة لاحقاً أو اختيار وسيلة دفع أخرى.'
    };
  } catch (error: any) {
    console.error('[ApplePay] Payment initiation failed:', error);
    return {
      success: false,
      orderId: params.orderId,
      status: 'failed',
      errorMessage: 'تعذر الاتصال ببوابة الدفع. تأكد من اتصال الإنترنت وحاول مجدداً.'
    };
  }
}
