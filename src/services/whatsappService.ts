import { Order } from '../types';

/**
 * Service to handle WhatsApp interactions.
 */

export const WhatsAppService = {
  // Returns the WhatsApp URL with customized bank details and screenshot confirmation request
  getInvoiceLink: (order: Order, phoneNumber: string) => {
    const origin = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost') 
      ? window.location.origin 
      : (typeof window !== 'undefined' ? window.location.origin : 'https://sulta.store');
    
    const trackingCode = order.trackingNumber || order.id;
    const isCloudRun = origin.includes('run.app');
    const trackUrl = `${origin}/?tab=track-order&id=${encodeURIComponent(trackingCode)}`;
    const itemsList = order.items.map(i => `• ${i.productName} (${i.color} - ${i.size}) × ${i.quantity}`).join('\n');
    const isBank = (order.paymentMethod || '').includes('بنكي') || (order.paymentMethod || '').toLowerCase().includes('bank');
    
    let message = `🌸 متجر SULTA للأزياء وتصاميم النوم الفاخرة\n\n` +
      `أهلاً بكِ! تم تسجيل طلبكِ بنجاح 👑\n` +
      `📋 رقم الطلب والتتبع: ${trackingCode}\n` +
      `💰 المبلغ الإجمالي: ${order.totalPrice.toLocaleString()} ${order.currency || 'ر.س'}\n` +
      `📦 المنتجات:\n${itemsList}\n\n`;

    if (isBank) {
      message += `🏦 ✦ بيانات الحساب البنكي لإتمام التحويل ✦\n` +
        `• البنك: مصرف الراجحي\n` +
        `• اسم الحساب: مؤسسة سُلطة للأزياء\n` +
        `• رقم الآيبان (IBAN):\n` +
        `SA82 8000 0000 1234 5678 9012\n` +
        `• المبلغ المطلوب تحويله: ${order.totalPrice.toLocaleString()} ${order.currency || 'ر.س'}\n\n` +
        `📸 فضلاً قومي بتحويل المبلغ وأرسلي صورة أو لقطة شاشة لإشعار التحويل البنكي هنا في المحادثة لتأكيد حجز طلبكِ وبدء التجهيز والشحن فوراً ✨\n\n`;
    } else {
      message += `💵 وسيلة السداد: الدفع عند الاستلام (نقداً عند استلام شحنتكِ من مندوب التوصيل لباب منزلكِ).\n\n`;
    }

    message += `🔍 تتبع مسار شحنتكِ:\n` +
      `يمكنكِ تتبع الشحنة برقم الطلب [ ${trackingCode} ] مباشرة عبر المتجر:\n` +
      `${trackUrl}\n\n` +
      `شكراً لاختياركِ SULTA 🌸`;

    if (isCloudRun) {
      message += `\n(تنبيه: يمكنكِ استخدام رقم الطلب أعلاه مباشرة في صفحة تتبع طلبيتكِ بالمتجر)`;
    }
    
    return `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  },

  // Direct send opening WhatsApp web / app
  sendInvoice: (order: Order, phoneNumber: string) => {
    const url = WhatsAppService.getInvoiceLink(order, phoneNumber);
    window.open(url, '_blank');
  },

  sendTemplateMessage: async (templateName: string, recipientPhone: string, variables: any) => {
    console.warn("WhatsApp API Template Message service not initialized.");
  }
};
