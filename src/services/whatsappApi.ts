/**
 * SULTA — Free & Secure WhatsApp Notification Helper
 * No API secrets are ever read or stored in browser bundles.
 * Uses free wa.me deep-links on the client side; automated Cloud API
 * credentials (if used later) belong exclusively in server-side Vercel Functions.
 */

export interface WhatsAppMessagePayload {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
}

export const WhatsAppApiService = {
  /**
   * Builds a free wa.me manual message URL (zero paid API / zero browser secrets).
   */
  buildManualWhatsAppUrl: (phone: string, text: string): string => {
    let clean = (phone || '').replace(/[^\d]/g, '');
    if (clean.startsWith('05')) {
      clean = '966' + clean.substring(1);
    }
    return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
  },

  sendMessage: async (
    _payload: WhatsAppMessagePayload
  ): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    // Cloud API tokens are never stored in browser JS (VITE_ prefix forbidden for secrets).
    return {
      success: false,
      error: 'الإرسال المباشر عبر الخادم يتطلب ربط WHATSAPP_ACCESS_TOKEN في Vercel، ويمكن استخدام روابط wa.me المجانية فوراً.'
    };
  },

  notifyAdminNewOrder: async (orderId: string, customerName: string, amount: number) => {
    return WhatsAppApiService.sendMessage({
      to: '966552823677',
      templateName: 'sulta_new_order_admin',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: orderId },
            { type: 'text', text: customerName },
            { type: 'text', text: amount.toString() }
          ]
        }
      ]
    });
  },

  notifyCustomerStatusUpdate: async (
    phone: string,
    customerName: string,
    orderId: string,
    statusLabel: string
  ) => {
    return WhatsAppApiService.sendMessage({
      to: phone,
      templateName: 'sulta_order_status_update',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: customerName },
            { type: 'text', text: orderId },
            { type: 'text', text: statusLabel }
          ]
        }
      ]
    });
  }
};
