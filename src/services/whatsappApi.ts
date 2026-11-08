/**
 * SULTA — Official WhatsApp Business Cloud API Service
 * Handles automated notifications for new orders and status updates.
 */

export interface WhatsAppMessagePayload {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
}

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

export const WhatsAppApiService = {
  /**
   * Sends a template-based message via WhatsApp Cloud API
   */
  sendMessage: async (payload: WhatsAppMessagePayload): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    const phoneId = (import.meta as any).env.VITE_WHATSAPP_PHONE_ID;
    const token = (import.meta as any).env.VITE_WHATSAPP_ACCESS_TOKEN;

    if (!phoneId || !token) {
      console.warn("[WhatsApp API] Credentials missing. Skipping automated notification.");
      return { success: false, error: "Credentials missing" };
    }

    try {
      const response = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: payload.to.replace(/\D/g, ''),
          type: "template",
          template: {
            name: payload.templateName,
            language: {
              code: payload.languageCode || "ar"
            },
            components: payload.components || []
          }
        }),
      });

      const data = await response.json();

      if (response.ok && data.messages?.[0]?.id) {
        console.log("[WhatsApp API] Message sent successfully:", data.messages[0].id);
        return { success: true, messageId: data.messages[0].id };
      } else {
        console.error("[WhatsApp API] Error response:", data);
        return { success: false, error: data.error?.message || "Unknown API error" };
      }
    } catch (err: any) {
      console.error("[WhatsApp API] Network error:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Notifies the admin about a new order
   */
  notifyAdminNewOrder: async (orderId: string, customerName: string, amount: number) => {
    const adminPhone = (import.meta as any).env.VITE_ADMIN_WHATSAPP_PHONE || '966552823677';
    
    return WhatsAppApiService.sendMessage({
      to: adminPhone,
      templateName: "sulta_new_order_admin",
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: orderId },
            { type: "text", text: customerName },
            { type: "text", text: amount.toString() }
          ]
        }
      ]
    });
  },

  /**
   * Notifies the customer about their order status change
   */
  notifyCustomerStatusUpdate: async (phone: string, customerName: string, orderId: string, statusLabel: string) => {
    return WhatsAppApiService.sendMessage({
      to: phone,
      templateName: "sulta_order_status_update",
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: customerName },
            { type: "text", text: orderId },
            { type: "text", text: statusLabel }
          ]
        }
      ]
    });
  }
};
