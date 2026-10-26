import { Order } from '../types';

/**
 * Service to handle WhatsApp interactions, invoice generation, status updates, and template customization.
 */

export const DEFAULT_ORDER_TEMPLATE = `🌸 متجر SULTA للأزياء وتصاميم النوم الفاخرة

أهلاً بكِ أستاذة {customerName}! تم تسجيل طلبكِ بنجاح 👑
📋 رقم الطلب والتتبع: {trackingCode}
💰 المبلغ الإجمالي: {totalPrice} {currency}
📦 المنتجات:
{itemsList}

🏦 ✦ بيانات الحساب البنكي لإتمام التحويل ✦
• البنك: مصرف الراجحي
• اسم الحساب: ابو بكر احمد على يونس
• رقم الحساب: 108000010006086396260
• رقم الآيبان (IBAN):
SA65 8000 0108 6080 1639 6260
• المبلغ المطلوب تحويله: {totalPrice} {currency}

📸 فضلاً قومي بتحويل المبلغ وأرسلي صورة أو لقطة شاشة لإشعار التحويل البنكي هنا في المحادثة لتأكيد حجز طلبكِ وبدء التجهيز والشحن فوراً ✨

🔍 تتبع مسار شحنتكِ:
يمكنكِ تتبع الشحنة برقم الطلب [ {trackingCode} ] مباشرة عبر المتجر:
{trackUrl}

شكراً لاختياركِ SULTA 🌸
(تنبيه: يمكنكِ استخدام رقم الطلب أعلاه مباشرة في صفحة تتبع طلبيتكِ بالمتجر)`;

export const DEFAULT_STATUS_TEMPLATE = `🌸 متجر SULTA للأزياء الفاخرة

عزيزتي {customerName} 👑
نود إعلامكِ بأنه تم تحديث حالة طلبكِ رقم [{trackingCode}] إلى:
✨ *{statusLabel}* ✨

📦 تفاصيل الطلب الإجمالية: {totalPrice} {currency}

🔍 يمكنكِ متابعة خط سير شحنتكِ وتحديثاتها لحظة بلحظة عبر الرابط التالي:
{trackUrl}

شكراً لثقتكِ واختياركِ SULTA 🌸`;

export const WhatsAppService = {
  // Get active custom template from localStorage or fallback to default
  getCustomOrderTemplate: (): string => {
    try {
      const saved = localStorage.getItem('sulta_whatsapp_order_template');
      return saved || DEFAULT_ORDER_TEMPLATE;
    } catch {
      return DEFAULT_ORDER_TEMPLATE;
    }
  },

  setCustomOrderTemplate: (template: string) => {
    try {
      localStorage.setItem('sulta_whatsapp_order_template', template);
    } catch {}
  },

  getCustomStatusTemplate: (): string => {
    try {
      const saved = localStorage.getItem('sulta_whatsapp_status_template');
      return saved || DEFAULT_STATUS_TEMPLATE;
    } catch {
      return DEFAULT_STATUS_TEMPLATE;
    }
  },

  setCustomStatusTemplate: (template: string) => {
    try {
      localStorage.setItem('sulta_whatsapp_status_template', template);
    } catch {}
  },

  // Formats raw order message string with dynamic variables
  formatOrderMessage: (order: Order, customTemplate?: string): string => {
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://sulta.store';
    const trackingCode = order.trackingNumber || order.id;
    const trackUrl = `${origin}/?tab=track-order&id=${encodeURIComponent(trackingCode)}`;
    const itemsList = order.items.map(i => `• ${i.productName} (${i.color} - ${i.size}) × ${i.quantity}`).join('\n');
    
    const template = customTemplate || WhatsAppService.getCustomOrderTemplate();

    return template
      .replace(/\{customerName\}/g, order.customerName || 'العميلة الكريمة')
      .replace(/\{trackingCode\}/g, trackingCode)
      .replace(/\{orderId\}/g, order.id)
      .replace(/\{totalPrice\}/g, (order.totalPrice || 0).toLocaleString())
      .replace(/\{currency\}/g, order.currency || 'ر.س')
      .replace(/\{itemsList\}/g, itemsList)
      .replace(/\{trackUrl\}/g, trackUrl)
      .replace(/\{paymentMethod\}/g, order.paymentMethod || 'تحويل بنكي');
  },

  // Formats status update message string with dynamic variables
  formatStatusMessage: (order: Order, statusLabel: string, customTemplate?: string): string => {
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://sulta.store';
    const trackingCode = order.trackingNumber || order.id;
    const trackUrl = `${origin}/?tab=track-order&id=${encodeURIComponent(trackingCode)}`;
    
    const template = customTemplate || WhatsAppService.getCustomStatusTemplate();

    return template
      .replace(/\{customerName\}/g, order.customerName || 'العميلة الكريمة')
      .replace(/\{trackingCode\}/g, trackingCode)
      .replace(/\{orderId\}/g, order.id)
      .replace(/\{statusLabel\}/g, statusLabel)
      .replace(/\{totalPrice\}/g, (order.totalPrice || 0).toLocaleString())
      .replace(/\{currency\}/g, order.currency || 'ر.س')
      .replace(/\{trackUrl\}/g, trackUrl);
  },

  // Returns the WhatsApp URL with formatted invoice message
  getInvoiceLink: (order: Order, phoneNumber: string) => {
    const message = WhatsAppService.formatOrderMessage(order);
    return `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  },

  // Returns the WhatsApp URL with formatted status update message
  getStatusUpdateLink: (order: Order, statusLabel: string, phoneNumber: string) => {
    const message = WhatsAppService.formatStatusMessage(order, statusLabel);
    return `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  },

  // Direct send opening WhatsApp web / app for invoice
  sendInvoice: (order: Order, phoneNumber: string) => {
    const url = WhatsAppService.getInvoiceLink(order, phoneNumber);
    window.open(url, '_blank');
  },

  // Direct send opening WhatsApp web / app for status update
  sendStatusUpdate: (order: Order, statusLabel: string, phoneNumber: string) => {
    const url = WhatsAppService.getStatusUpdateLink(order, statusLabel, phoneNumber);
    window.open(url, '_blank');
  },

  // Copy text to clipboard helper
  copyToClipboard: async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      } catch {
        return false;
      }
    }
  }
};
