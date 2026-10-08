/**
 * SULTA Payment Architecture - Configuration & Gateway Endpoints
 * 
 * SECURITY MANDATE:
 * - NO API secrets, secret keys, or HMAC secrets are placed in the frontend!
 * - Frontend only uses public keys and proxies secure calls to server-side endpoints.
 * - Secret credentials (PAYMOB_SECRET_KEY, PAYMOB_HMAC_SECRET) reside exclusively
 *   in Server Environment Variables.
 * 
 * BACKEND ENDPOINTS SPECIFICATION REQUIRED:
 * 1. POST /api/payment/paymob/intention
 *    - Purpose: Calls Paymob Intention API v1 using server-side PAYMOB_SECRET_KEY.
 *    - Receives: { amount_cents, currency: 'SAR', order_id, billing_data, payment_methods }
 *    - Returns: { client_secret, payment_keys, redirection_url }
 * 
 * 2. POST /api/payment/paymob/verify
 *    - Purpose: Verifies transaction callback against PAYMOB_HMAC_SECRET server-side.
 *    - Receives: { hmac, transaction_id, order_id, ...callback_params }
 *    - Returns: { verified: boolean, status: 'paid' | 'failed' | 'cancelled' }
 * 
 * 3. POST /api/payment/paymob/webhook
 *    - Purpose: Real-time server-to-server webhook callback from Paymob.
 */

import { PaymobPublicConfig } from './types';

// Safe placeholders for public Paymob keys (overridable via Vite env)
export const PAYMOB_PUBLIC_KEY = 
  import.meta.env.VITE_PAYMOB_PUBLIC_KEY || 'PAYMOB_PUBLIC_KEY';

export const PAYMOB_PAYMENT_ENDPOINT = 
  import.meta.env.VITE_PAYMOB_PAYMENT_ENDPOINT || '/api/payment/paymob/intention';

export const PAYMOB_VERIFY_ENDPOINT = 
  import.meta.env.VITE_PAYMOB_VERIFY_ENDPOINT || '/api/payment/paymob/verify';

export const PAYMOB_CLIENT_ENDPOINT = 
  import.meta.env.VITE_PAYMOB_CLIENT_ENDPOINT || 'PAYMOB_CLIENT_ENDPOINT';

export const PAYMOB_CARD_INTEGRATION_ID = 
  import.meta.env.VITE_PAYMOB_CARD_INTEGRATION_ID || '';

export const PAYMOB_IFRAME_ID = 
  import.meta.env.VITE_PAYMOB_IFRAME_ID || '';

export const paymentConfig: PaymobPublicConfig = {
  publicKey: PAYMOB_PUBLIC_KEY,
  paymentEndpoint: PAYMOB_PAYMENT_ENDPOINT,
  clientEndpoint: PAYMOB_CLIENT_ENDPOINT,
  cardIntegrationId: PAYMOB_CARD_INTEGRATION_ID,
  iframeId: PAYMOB_IFRAME_ID,
  currency: 'SAR',
};

/**
 * Checks if Paymob live credentials have been injected into the application
 */
export function isPaymobConfigured(): boolean {
  return (
    PAYMOB_PUBLIC_KEY !== 'PAYMOB_PUBLIC_KEY' &&
    PAYMOB_PUBLIC_KEY.length > 5
  );
}
