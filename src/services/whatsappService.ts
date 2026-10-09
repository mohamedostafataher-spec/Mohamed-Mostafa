import { Order } from '../types';

/**
 * Service to handle WhatsApp interactions.
 */

export const WhatsAppService = {
  // Returns the WhatsApp URL instead of opening it directly
  getInvoiceLink: (order: Order, phoneNumber: string) => {
    const origin = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost') 
      ? window.location.origin 
      : (typeof window !== 'undefined' ? window.location.origin : 'https://sulta.store');
    
    const trackingCode = order.trackingNumber || order.id.slice(0, 16);
    const isCloudRun = origin.includes('run.app');
    const trackUrl = `${origin}/?tab=track-order&id=${encodeURIComponent(trackingCode)}`;
    const itemsList = order.items.map(i => `• ${i.productName} (${i.color} - ${i.size}) × ${i.quantity}`).join('\n');
    
    let message = `🌸 متجر SULTA للأزياء الملكية\n\n` +
      `تم تأكيد طلبكِ بنجاح:\n` +
      `📋 رقم التتبع والطلب: ${trackingCode}\n` +
      `💰 الإجمالي: ${order.totalPrice.toLocaleString()} ${order.currency || 'ر.س'}\n` +
      `💳 وسيلة الدفع: ${order.paymentMethod || 'مؤكد'}\n\n` +
      `🔍 تتبع شحنتكِ مباشرة:\n` +
      `يمكنكِ تتبع مسار شحنتكِ في أي وقت بالدخول لصفحة "تتبع طلبيتكِ" بالمتجر وإدخال رقم التتبع: [ ${trackingCode} ]\n` +
      `أو عبر الرابط المباشر:\n${trackUrl}\n\n` +
      `📦 تفاصيل المنتجات:\n${itemsList}`;

    if (isCloudRun) {
      message += `\n\n💡 ملاحظة لمستخدمي الآيفون وSafari: في حال ظهور نافذة أمان من المتصفح عند فتح الرابط، اضغطي على "Authenticate in new window" للمتابعة، أو تتبعي طلبيتكِ مباشرة برقم الطلب [ ${trackingCode} ] من صفحة التتبع بالمتجر دون الحاجة للرابط.`;
    }
    
    return `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  },

  // Keep for backward compatibility or direct usage where appropriate
  sendInvoice: (order: Order, phoneNumber: string) => {
    const url = WhatsAppService.getInvoiceLink(order, phoneNumber);
    window.open(url, '_blank');
  },

  // Placeholder for official API Template Message implementation
  sendTemplateMessage: async (templateName: string, recipientPhone: string, variables: any) => {
    console.warn("WhatsApp API Template Message service not initialized.");
  }
};
