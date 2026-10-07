import { Order } from '../types';

/**
 * Service to handle WhatsApp interactions.
 * 
 * NOTE: For official Template Messages, you must integrate with the WhatsApp Business API.
 * This service provides a robust structured wrapper for current interactions and
 * prepares the structure for future API integration.
 */

export const WhatsAppService = {
  // Returns the WhatsApp URL instead of opening it directly
  getInvoiceLink: (order: Order, phoneNumber: string) => {
    const origin = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost') 
      ? window.location.origin 
      : (typeof window !== 'undefined' ? window.location.origin : 'https://sulta.store');
    
    const trackUrl = `${origin}/track-order/${order.id}`;
    const itemsList = order.items.map(i => `• ${i.productName} (${i.color} - ${i.size}) × ${i.quantity}`).join('\n');
    const message = `🌸 متجر SULTA للأزياء الملكية\n\n` +
                 `تم تأكيد طلبك بنجاح:\n` +
                 `📋 رقم الطلب: ${order.trackingNumber || order.id.slice(0, 18)}\n` +
                 `💰 الإجمالي: ${order.totalPrice.toLocaleString()} ${order.currency}\n` +
                 `🔍 رابط تتبع شحنتكِ المباشر:\n${trackUrl}\n\n` +
                 `📦 تفاصيل المنتجات:\n${itemsList}`;
    
    return `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  },

  // Keep for backward compatibility or direct usage where appropriate, but safer now
  sendInvoice: (order: Order, phoneNumber: string) => {
    const url = WhatsAppService.getInvoiceLink(order, phoneNumber);
    window.open(url, '_blank');
  },

  // Placeholder for official API Template Message implementation
  // Requires: Meta Developer Account & Approved Templates
  sendTemplateMessage: async (templateName: string, recipientPhone: string, variables: any) => {
    console.warn("WhatsApp API Template Message service not initialized. Please configure WhatsApp Business API.");
    // Example: await fetch('https://graph.facebook.com/v19.0/PHONE_NUMBER_ID/messages', { ... });
  }
};
