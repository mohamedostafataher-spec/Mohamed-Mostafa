/**
 * SULTA Payment Architecture - Types Definition
 * Strictly isolates payment structures and status definitions.
 * Follows PCI-DSS: NEVER stores card numbers, CVVs, or secret tokens on frontend.
 */

export type PaymentMethodType = 'card' | 'cod' | 'bank_transfer' | 'paypal';

export type PaymentGatewayStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'cod';

export interface CustomerBillingData {
  name: string;
  phone: string;
  city: string;
  address: string;
  email?: string;
}

export interface PaymentItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
}

export interface CreatePaymentIntentParams {
  orderId: string;
  amount: number; // in SAR (Saudi Riyals)
  currency: 'SAR' | 'EGP';
  customer: CustomerBillingData;
  items: PaymentItem[];
  method: PaymentMethodType;
}

export interface PaymentIntentResponse {
  success: boolean;
  orderId: string;
  clientSecret?: string;
  paymentKey?: string;
  iframeUrl?: string;
  redirectionUrl?: string;
  status: PaymentGatewayStatus;
  errorMessage?: string;
  requiresRedirect?: boolean;
}

export interface PaymentVerificationResult {
  verified: boolean;
  orderId: string;
  transactionId?: string | number;
  status: PaymentGatewayStatus;
  amountCents?: number;
  currency?: string;
  gatewayResponse?: any;
  errorMessage?: string;
}

export interface PaymobPublicConfig {
  publicKey: string;
  paymentEndpoint: string;
  clientEndpoint: string;
  cardIntegrationId?: string;
  iframeId?: string;
  currency: 'SAR';
}
