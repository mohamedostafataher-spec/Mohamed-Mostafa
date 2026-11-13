import { Order, WhatsAppEventKey, WhatsAppSendLog, WhatsAppTemplateConfig } from '../types';

/**
 * Free WhatsApp (wa.me) communication engine with editable Arabic templates
 * for all customer lifecycle events and per-order sent history logging.
 */

export const DEFAULT_ORDER_TEMPLATE = `👑 يا هلا بسلطانتنا الغالية {customerName} 🌸✨
يسعدنا اختياركِ لقطع سولته القطنية التي تليق بذوقكِ الرفيع.

لقد تم تسجيل طلبكِ بنجاح:
📋 رقم الطلب: #{trackingCode}
💰 القيمة الإجمالية: {totalPrice} {currency}
📦 القطع المختارة:
{itemsList}

🔍 رابط متابعة طلبكِ:
{trackUrl}

شكراً لاختياركِ سولته 👑💎`;

export const DEFAULT_RECOVERY_TEMPLATE = `👑 يا هلا بسلطانتنا الغالية {customerName} 🌸✨
معكِ خدمة عملاء متجر سولته لملابس النوم القطنية المريحة.

لاحظنا أنكِ اخترتِ قطعاً رائعة في سلتكِ ولم تكملي الطلب بعد:
📦 السلة المختارة:
{itemsList}
💰 المبلغ الإجمالي: {totalPrice} {currency}

هل نساعدكِ في المقاسات أو تأكيد الطلب؟ يسعدنا خدمتكِ فوراً ✨🌸`;

export const DEFAULT_STATUS_TEMPLATE = `👑 سلطانتنا العزيزة {customerName} 🌸
يسعدنا إعلامكِ بأنه تم تحديث حالة طلبكِ رقم [#{trackingCode}] إلى:
✨ *{statusLabel}* ✨

📦 قيمة الطلب: {totalPrice} {currency}

🔍 يمكنكِ متابعة طلبكِ عبر الرابط التالي:
{trackUrl}

شكراً لثقتكِ واختياركِ سولته 🌸`;

export const DEFAULT_EVENT_TEMPLATES: Record<WhatsAppEventKey, WhatsAppTemplateConfig> = {
  confirmed: {
    eventKey: 'confirmed',
    titleAr: 'تأكيد الطلب',
    descriptionAr: 'تُرسل للعميلة فور مراجعة الطلب وتأكيده قبل التغليف.',
    body: `أهلاً بكِ عزيزتنا {customerName} 🌸
تم تأكيد طلبكِ رقم #{orderId} من متجر سولته بنجاح ✨

📦 تفاصيل القطع:
{itemsList}

💰 الإجمالي: {totalPrice} {currency}
📍 المدينة: {city}

نبدأ الآن بتجهيز طلبكِ بعناية، ويمكنكِ متابعته في أي وقت عبر الرابط:
{trackUrl}`
  },
  shipped: {
    eventKey: 'shipped',
    titleAr: 'تم الشحن',
    descriptionAr: 'تُرسل بعد تسليم الشحنة لشركة الشحن مع رقم التتبع.',
    body: `بشرى سارة عزيزتنا {customerName} 🚚✨
تم شحن طلبكِ رقم #{orderId} من متجر سولته عبر شركة: *{carrier}*

🔖 رقم التتبع: {trackingNumber}
🔗 تتبع الشحنة لدى شركة النقل:
{carrierTrackUrl}

🔍 صفحة طلبكِ في المتجر:
{trackUrl}

تصل بالسلامة يا رب 🤍`
  },
  delivered: {
    eventKey: 'delivered',
    titleAr: 'تم التسليم',
    descriptionAr: 'رسالة اطمئنان للعميلة بعد وصول الشحنة.',
    body: `أهلاً بكِ عزيزتنا {customerName} 🌸
نبارك لكِ استلام طلبكِ رقم #{orderId} من متجر سولته ✨

نتمنى أن تنال خامة القطن والمقاس إعجابكِ التام 🤍
إذا احتجتِ أي مساعدة أو استبدال، نحن بخدمتكِ دائماً هنا.`
  },
  reminder: {
    eventKey: 'reminder',
    titleAr: 'تذكير دفع / تأكيد',
    descriptionAr: 'تذكير لطيف للطلبات المعلقة (تحويل بنكي أو تأكيد COD).',
    body: `مرحباً عزيزتنا {customerName} 🌸
معكِ خدمة عملاء سولته بخصوص طلبكِ رقم #{orderId} بقيمة {totalPrice} {currency}.

نود فقط التأكد من جاهزيتكِ لاستلام الطلب / إرفاق إيصال التحويل حتى نتمكن من شحنه لكِ في أقرب وقت ✨
رابط الطلب: {trackUrl}`
  },
  review: {
    eventKey: 'review',
    titleAr: 'طلب تقييم',
    descriptionAr: 'طلب مشاركة رأي العميلة بعد تجربة القطعة.',
    body: `يا هلا عزيزتنا {customerName} 🌸
مضت أيام قليلة على وصول طلبكِ رقم #{orderId} من سولته، ويهمنا جداً نسمع رأيكِ في جودة القطن والراحة!

مشاركتكِ تقييم بسيط تساعدنا نقدم الأفضل دائماً 🤍✨`
  },
  abandoned: {
    eventKey: 'abandoned',
    titleAr: 'تذكير سلة متروكة',
    descriptionAr: 'رسالة استعادة للعميلات اللاتي وافقن على إشعارات الواتساب ولم يكملن الدفع.',
    body: DEFAULT_RECOVERY_TEMPLATE
  }
};

const STORAGE_KEY_EVENT_TEMPLATES = 'sulta_whatsapp_event_templates_v1';

export function formatSaudiWhatsAppNumber(rawPhone: string): string {
  const digits = (rawPhone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00966')) return '966' + digits.slice(5);
  if (digits.startsWith('05') && digits.length === 10) return '966' + digits.slice(1);
  if (digits.startsWith('5') && digits.length === 9) return '966' + digits;
  return digits;
}

export interface WhatsAppFormatContext {
  customerName?: string;
  orderId?: string;
  trackingNumber?: string;
  carrier?: string;
  carrierTrackUrl?: string;
  trackUrl?: string;
  totalPrice?: number;
  currency?: string;
  itemsList?: string;
  city?: string;
  statusLabel?: string;
  paymentMethod?: string;
}

export function interpolateWhatsAppTemplate(template: string, ctx: WhatsAppFormatContext): string {
  const trackingCode = ctx.trackingNumber || ctx.orderId || '';
  return (template || '')
    .replace(/\{customerName\}/g, ctx.customerName || 'العميلة الكريمة')
    .replace(/\{trackingCode\}/g, trackingCode)
    .replace(/\{trackingNumber\}/g, ctx.trackingNumber || 'سيتم التزويد به قريباً')
    .replace(/\{orderId\}/g, ctx.orderId ? ctx.orderId.slice(0, 8).toUpperCase() : '')
    .replace(/\{fullOrderId\}/g, ctx.orderId || '')
    .replace(/\{carrier\}/g, ctx.carrier || 'شركة الشحن المعتمدة')
    .replace(/\{carrierTrackUrl\}/g, ctx.carrierTrackUrl || ctx.trackUrl || '')
    .replace(/\{trackUrl\}/g, ctx.trackUrl || '')
    .replace(/\{totalPrice\}/g, (ctx.totalPrice || 0).toLocaleString())
    .replace(/\{currency\}/g, ctx.currency || 'ر.س')
    .replace(/\{itemsList\}/g, ctx.itemsList || 'منتجات سولته')
    .replace(/\{city\}/g, ctx.city || 'السعودية')
    .replace(/\{statusLabel\}/g, ctx.statusLabel || '')
    .replace(/\{paymentMethod\}/g, ctx.paymentMethod || 'تحويل بنكي');
}

export const WhatsAppService = {
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

  getEventTemplates: (): Record<WhatsAppEventKey, WhatsAppTemplateConfig> => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_EVENT_TEMPLATES);
      if (raw) {
        const parsed = JSON.parse(raw);
        const merged = { ...DEFAULT_EVENT_TEMPLATES };
        (Object.keys(DEFAULT_EVENT_TEMPLATES) as WhatsAppEventKey[]).forEach((k) => {
          if (parsed[k]?.body) {
            merged[k] = {
              ...DEFAULT_EVENT_TEMPLATES[k],
              ...parsed[k],
              eventKey: k
            };
          }
        });
        return merged;
      }
    } catch {}
    return { ...DEFAULT_EVENT_TEMPLATES };
  },

  saveEventTemplates: (templates: Record<WhatsAppEventKey, WhatsAppTemplateConfig>) => {
    try {
      localStorage.setItem(STORAGE_KEY_EVENT_TEMPLATES, JSON.stringify(templates));
    } catch {}
  },

  buildOrderContext: (
    order: Order,
    options?: { statusLabel?: string; carrierName?: string; carrierTrackUrl?: string | null }
  ): WhatsAppFormatContext => {
    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://sulta.vercel.app';
    const trackingCode = order.trackingNumber || order.id;
    const trackUrl = `${origin}/?tab=track-order&id=${encodeURIComponent(order.id)}`;
    const itemsList = (order.items || [])
      .map((i) => `• ${i.productName} (${i.color} - ${i.size}) × ${i.quantity}`)
      .join('\n');

    return {
      customerName: order.customerName,
      orderId: order.id,
      trackingNumber: order.trackingNumber || trackingCode,
      carrier: options?.carrierName || order.shippingCarrier || 'شركة الشحن المعتمدة',
      carrierTrackUrl: options?.carrierTrackUrl || trackUrl,
      trackUrl,
      totalPrice: order.totalPrice || 0,
      currency: order.currency === 'EGP' ? 'ج.م' : 'ر.س',
      itemsList,
      city: order.city || 'الرياض',
      statusLabel: options?.statusLabel || '',
      paymentMethod: order.paymentMethod || 'تحويل بنكي'
    };
  },

  formatEventMessage: (
    eventKey: WhatsAppEventKey,
    order: Order,
    options?: {
      customBody?: string;
      statusLabel?: string;
      carrierName?: string;
      carrierTrackUrl?: string | null;
    }
  ): string => {
    const templates = WhatsAppService.getEventTemplates();
    const body = options?.customBody || templates[eventKey]?.body || DEFAULT_EVENT_TEMPLATES[eventKey].body;
    const ctx = WhatsAppService.buildOrderContext(order, options);
    return interpolateWhatsAppTemplate(body, ctx);
  },

  formatOrderMessage: (order: Order, customTemplate?: string): string => {
    const template = customTemplate || WhatsAppService.getCustomOrderTemplate();
    return interpolateWhatsAppTemplate(template, WhatsAppService.buildOrderContext(order));
  },

  formatStatusMessage: (order: Order, statusLabel: string, customTemplate?: string): string => {
    const template = customTemplate || WhatsAppService.getCustomStatusTemplate();
    return interpolateWhatsAppTemplate(
      template,
      WhatsAppService.buildOrderContext(order, { statusLabel })
    );
  },

  buildWhatsAppUrl: (phoneNumber: string, message: string): string => {
    const formattedPhone = formatSaudiWhatsAppNumber(phoneNumber);
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  },

  getInvoiceLink: (order: Order, phoneNumber: string) => {
    const message = WhatsAppService.formatOrderMessage(order);
    return WhatsAppService.buildWhatsAppUrl(phoneNumber, message);
  },

  getStatusUpdateLink: (order: Order, statusLabel: string, phoneNumber: string) => {
    const message = WhatsAppService.formatStatusMessage(order, statusLabel);
    return WhatsAppService.buildWhatsAppUrl(phoneNumber, message);
  },

  sendInvoice: (order: Order, phoneNumber: string) => {
    const url = WhatsAppService.getInvoiceLink(order, phoneNumber);
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  sendStatusUpdate: (order: Order, statusLabel: string, phoneNumber: string) => {
    const url = WhatsAppService.getStatusUpdateLink(order, statusLabel, phoneNumber);
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  createSendLogEntry: (
    eventKey: WhatsAppEventKey,
    recipientPhone: string,
    messageText: string,
    sentBy: string
  ): WhatsAppSendLog => {
    const meta = DEFAULT_EVENT_TEMPLATES[eventKey];
    return {
      id: `wa_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      eventKey,
      eventLabel: meta?.titleAr || eventKey,
      sentAt: new Date().toISOString(),
      sentBy: sentBy || 'فريق سولته',
      recipientPhone,
      previewText: messageText.slice(0, 140)
    };
  },

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
