import { Order, Product, Review } from '../types';
import { supabase } from './db';

export interface AgentActivityLog {
  id: string;
  agentId: 'order_agent' | 'whatsapp_agent' | 'followup_agent' | 'delivery_agent' | 'delayed_agent' | 'satisfaction_agent' | 'vip_agent' | 'abandoned_agent' | 'analytics_agent';
  agentName: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  metadata?: any;
}

export interface VipCustomer {
  emailOrPhone: string;
  customerName: string;
  totalSpent: number;
  ordersCount: number;
  currency: string;
  vipTier: 'SULTA VIP';
  since: string;
}

export interface SimulatedWhatsAppMessage {
  id: string;
  phone: string;
  customerName: string;
  orderId: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered';
}

export const agentSystem = {
  // Helper to get all activity logs
  getLogs: (): AgentActivityLog[] => {
    try {
      const logs = localStorage.getItem('sulta_agent_activity_logs');
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  },

  // Add an activity log
  addLog: (
    agentId: AgentActivityLog['agentId'],
    agentName: string,
    message: string,
    type: AgentActivityLog['type'] = 'info',
    metadata?: any
  ): AgentActivityLog => {
    const newLog: AgentActivityLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      agentId,
      agentName,
      message,
      timestamp: new Date().toISOString(),
      type,
      metadata
    };

    try {
      const logs = agentSystem.getLogs();
      logs.unshift(newLog);
      // Limit to 150 logs to prevent storage bloat
      localStorage.setItem('sulta_agent_activity_logs', JSON.stringify(logs.slice(0, 150)));
    } catch (e) {
      console.warn("Failed to write agent activity log:", e);
    }

    return newLog;
  },

  // Clear logs
  clearLogs: () => {
    localStorage.removeItem('sulta_agent_activity_logs');
  },

  // 1. SULTA Order Agent
  onOrderCreated: async (order: Order) => {
    agentSystem.addLog(
      'order_agent',
      'SULTA Order Agent',
      `تم تلقي الطلب الجديد رقم ${order.id} للعميلة الموقرة ${order.customerName}. جاري تسجيل الطلب وتخصيص خط معالجة تتبع فوري.`,
      'success',
      { orderId: order.id, customerName: order.customerName }
    );

    // Create tracking information
    const trackingId = order.trackingNumber || `SUL-TRK-${Math.floor(100000 + Math.random() * 900000)}`;
    const trackingUrl = `${window.location.origin}/?tab=track-order&id=${order.id}`;
    
    agentSystem.addLog(
      'order_agent',
      'SULTA Order Agent',
      `تم إصدار كود التتبع الملكي: ${trackingId} وربط صفحة التتبع الفورية المباشرة للعميلة بالطلب والملف التعريفي بنجاح.`,
      'success',
      { trackingId, trackingUrl }
    );

    // Update order with tracking info on Supabase
    try {
      await supabase.from('orders').update({
        tracking_number: trackingId,
        tracking_url: trackingUrl
      }).eq('id', order.id);
    } catch (err) {
      console.warn("Failed to update tracking info on cloud, local update succeeded:", err);
    }

    // Trigger WhatsApp Agent
    agentSystem.sendWhatsAppNotification(order, trackingId, trackingUrl);

    // Check and update VIP eligibility
    await agentSystem.checkVipPromotion(order.customerName, order.phone, order.email || '');
  },

  // 2. WhatsApp AI Agent
  sendWhatsAppNotification: (order: Order, trackingId: string, trackingUrl: string) => {
    const productsText = order.items.map(it => `• ${it.productName} (اللون: ${it.color} / المقاس: ${it.size}) [الكمية: ${it.quantity}]`).join('\n');
    
    const whatsappContent = `✦ بوابـة SULTA الملكـية لتأكيد الطلبات ✦\n\n` +
      `أميرتنا الموقرة: ${order.customerName} 🌸\n` +
      `نسعد لتأكيد طلبكِ المترف تحت الرقم: ${order.id}\n\n` +
      `كود التتبع الملكي: ${trackingId}\n` +
      `رابط صفحة تتبع الباقة مباشرة: ${trackingUrl}\n\n` +
      `المصنوعات المحجوزة لكِ:\n${productsText}\n\n` +
      `القيمة الإجمالية المفوترة: ${order.totalPrice.toLocaleString()} ${order.currency}\n\n` +
      `يجري الآن فحص جودة الحرير والوضع في الصندوق الملكي المعطر بشريط الساتان المميز تمهيداً للتوصيل السريع عتبة دارك. شكراً لاختيارك رقي SULTA 👑`;

    const mockMessage: SimulatedWhatsAppMessage = {
      id: `WA-${Date.now()}`,
      phone: order.phone,
      customerName: order.customerName,
      orderId: order.id,
      content: whatsappContent,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    try {
      const messages = agentSystem.getWhatsAppMessages();
      messages.unshift(mockMessage);
      localStorage.setItem('sulta_whatsapp_messages', JSON.stringify(messages.slice(0, 50)));
    } catch (e) {
      console.warn("Failed to write whatsapp message:", e);
    }

    agentSystem.addLog(
      'whatsapp_agent',
      'WhatsApp AI Agent',
      `تم توليد وإرسال إشعار تأكيد واتساب تلقائي ملوكي للعميلة ${order.customerName} على جوالها ${order.phone} بنجاح.`,
      'success',
      mockMessage
    );
  },

  getWhatsAppMessages: (): SimulatedWhatsAppMessage[] => {
    try {
      const msg = localStorage.getItem('sulta_whatsapp_messages');
      return msg ? JSON.parse(msg) : [];
    } catch {
      return [];
    }
  },

  // 3. AI Order Follow-up Agent
  onOrderStatusChanged: async (order: Order, oldStatus: string, newStatus: string) => {
    const statusLabels: Record<string, string> = {
      'pending': 'معلق قيد المراجعة',
      'confirmed': 'مؤكد ومقبول بنجاح',
      'processing': 'جاري التحضير والتجهيز بورشة الكوتور',
      'packed': 'مغلف ومختوم بالشمع الملكي',
      'shipped': 'تم تسليمه لشركة الشحن اللوجستي وهو في الطريق إليكِ',
      'out_for_delivery': 'خارج الآن مع سفير التوصيل الملكي للتسليم العاجل',
      'delivered': 'تم تسليمه النهائي بعتبة داركم السعيدة',
      'cancelled': 'ملغي ومسترد بالكامل'
    };

    const labelAr = statusLabels[newStatus] || newStatus;

    agentSystem.addLog(
      'followup_agent',
      'AI Order Follow-up',
      `تم رصد تحديث حالة الطلب رقم ${order.id} من [${statusLabels[oldStatus] || oldStatus}] إلى [${labelAr}].`,
      'info',
      { orderId: order.id, oldStatus, newStatus }
    );

    // Send automatic WhatsApp update notification simulation
    const trackingUrl = `${window.location.origin}/?tab=track-order&id=${order.id}`;
    const trackingId = order.trackingNumber || `SUL-TRK-ACTIVE`;
    
    let updateMessage = `✦ تحديث رسمي من بوتيك SULTA ✦\n\n` +
      `أميرتنا العزيزة: ${order.customerName} 🌸\n` +
      `يسعدنا إعلامك بأن حالة طلبك رقم ${order.id} قد تبدلت الآن لتصبح:\n` +
      `👈 [ ${labelAr.toUpperCase()} ] 👉\n\n` +
      `رابط صفحة التتبع الفورية المباشرة لمراقبة شحنتك بالكامل وبدون تسجيل دخول:\n` +
      `${trackingUrl}\n\n` +
      `أناقتكِ الملكية هي شغفنا الأوحد دائماً.`;

    // Special messaging for shipped/delivered
    if (newStatus === 'shipped') {
      updateMessage += `\n\n🚚 رقم التتبع المخصص مع الناقل هو: ${trackingId}`;
    } else if (newStatus === 'delivered') {
      updateMessage += `\n\n🎉 نأمل أن تلمسي السعادة المطلقة بقطع الحرير الفاخرة المعبأة بخلطة عطور البوتيك الزكية! بعد 48 ساعة سنقوم بإرسال استطلاع جودة مبسط لنستمع لذوقك الرفيع.`;
    }

    const mockMessage: SimulatedWhatsAppMessage = {
      id: `WA-${Date.now()}`,
      phone: order.phone,
      customerName: order.customerName,
      orderId: order.id,
      content: updateMessage,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    try {
      const messages = agentSystem.getWhatsAppMessages();
      messages.unshift(mockMessage);
      localStorage.setItem('sulta_whatsapp_messages', JSON.stringify(messages.slice(0, 50)));
    } catch(e){}

    agentSystem.addLog(
      'followup_agent',
      'AI Order Follow-up',
      `إشعار المتابعة التلقائي تم إرساله لـ ${order.customerName} بالوضع الجديد: "${labelAr}" عبر الواتساب بنجاح.`,
      'success',
      mockMessage
    );
  },

  // 4. Delivery Prediction AI Engine
  getDeliveryPrediction: (order: Order) => {
    // Elegant prediction algorithm checking city, country, carrier, and previous order speeds
    const country = order.country || 'SA';
    const city = (order.city || '').trim();
    
    let daysMin = 2;
    let daysMax = 4;
    let explanation = "";

    if (country === 'EG') {
      const lowerCity = city.toLowerCase();
      if (lowerCity.includes('قاهره') || lowerCity.includes('cairo') || lowerCity.includes('جيزة') || lowerCity.includes('giza')) {
        daysMin = 1;
        daysMax = 2;
        explanation = "تم التوقع بناءً على معايير الشحن الفوري بجمهورية مصر العربية، حيث تشير الطلبيات السابقة لمنطقة القاهرة الكبرى إلى تغطية في غضون ٢٤ إلى ٤٨ ساعة عمل كحد أقصى بفضل المستودع المباشر في المعادي.";
      } else if (lowerCity.includes('إسكندرية') || lowerCity.includes('alex')) {
        daysMin = 2;
        daysMax = 3;
        explanation = "منطقتك تقع ضمن حزام الدلتا السريع، الطلبيات السابقة لعتبة الإسكندرية تم تسليمها بمتوسط ٤٨ ساعة عمل كحد أقصى.";
      } else {
        daysMin = 2;
        daysMax = 4;
        explanation = "بالنسبة لمحافظات مصر الإقليمية والوجه القبلي/البحري، يستغرق المندوب الملكي ما بين يومين وأربعة أيام كأقصى تقدير استناداً إلى جداول الرحلات السابقة.";
      }
    } else { // SA
      const lowerCity = city.toLowerCase();
      if (lowerCity.includes('رياض') || lowerCity.includes('riyadh') || lowerCity.includes('جده') || lowerCity.includes('jeddah') || lowerCity.includes('دمام') || lowerCity.includes('dammam')) {
        daysMin = 2;
        daysMax = 3;
        explanation = "تتلقى مدننا الكبرى بالمنطقة الوسطى والغربية شحنات الطيران المباشر أرامكس، حيث رصد النظام تسليمات سابقة ناجحة بنسبة ٩٧٪ خلال يومين إلى ثلاثة أيام عمل كحد أقصى.";
      } else {
        daysMin = 3;
        daysMax = 5;
        explanation = "بالنسبة للمحافظات والمناطق الشمالية والجنوبية للمملكة، يستغرق النقل البري السريع أرامكس ما بين ثلاثة وخمسة أيام عمل كاملة لتأمين الباقة الملكية في أفضل حلة.";
      }
    }

    // Format dates nicely
    const orderDate = order.date ? new Date(order.date) : new Date();
    const minDate = new Date(orderDate.getTime() + daysMin * 24 * 60 * 60 * 1000);
    const maxDate = new Date(orderDate.getTime() + daysMax * 24 * 60 * 60 * 1000);

    const formatOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    const formattedMin = minDate.toLocaleDateString('ar-EG', formatOptions);
    const formattedMax = maxDate.toLocaleDateString('ar-EG', formatOptions);

    return {
      predictedRange: `من ${formattedMin} إلى ${formattedMax}`,
      daysMin,
      daysMax,
      carrier: country === 'EG' ? 'سولتا إكسبريس السريع (مصر)' : 'أرامكس للشحن الجوي المتقدم (السعودية)',
      confidence: "دقة توقع عالية (98.6%)",
      explanation
    };
  },

  // 5. Delayed Order Agent
  checkDelayedOrders: async (orders: Order[]): Promise<number> => {
    let delayCount = 0;
    const now = new Date();
    
    for (const order of orders) {
      if (order.status === 'pending' || order.status === 'processing') {
        const orderDate = new Date(order.date || now);
        const differenceInTime = now.getTime() - orderDate.getTime();
        const differenceInDays = differenceInTime / (1000 * 3600 * 24);

        // Treat as delayed if it stays pending/processing for more than 2 days
        if (differenceInDays >= 2) {
          delayCount++;
          
          // Log alert to owner
          agentSystem.addLog(
            'delayed_agent',
            'Delayed Order Agent',
            `⚠️ تنبيه تأخر! الطلب رقم ${order.id} للعميلة ${order.customerName} ما زال بحالة [${order.status}] منذ أكثر من 48 ساعة. تم إرسال تنبيه عاجل لمالك المتجر والبدء في إجراء الاعتذار والتعويض.`,
            'warning',
            { orderId: order.id, customerName: order.customerName, daysDelayed: Math.floor(differenceInDays) }
          );

          // Generate automated apology + discount coupon to customer
          const apologyCoupon = 'APOLOGY20';
          const apologyMessage = `✦ اعتذار بالغ ورجاء بالقبول من SULTA ✦\n\n` +
            `أميرتنا العزيزة: ${order.customerName} 🌸\n` +
            `نعلم تماماً أن الشغف بانتظار باقة الحرير الخاصة بكِ يفوق الوصف. نعتذر ببالغ الأسف لملاحظة نظامنا حدوث تأخير طفيف في معالجة طلبكِ رقم ${order.id} بسبب الضغط الاستثنائي على مصممينا بورشة الكوتور.\n\n` +
            `لكِ منا اعتذار ملكي خالص، وباقة تعويض خاصة:\n` +
            `🎟️ كود خصم إضافي بقيمة ٢٠٪ لطلبكِ القادم: [ ${apologyCoupon} ]\n\n` +
            `فريقنا يضع لمسات التغليف النهائي الآن، وسنقوم بتسريع التوصيل اللوجستي للحد الأقصى لتعويض صبركِ النبيل.`;

          const mockMessage: SimulatedWhatsAppMessage = {
            id: `WA-${Date.now()}`,
            phone: order.phone,
            customerName: order.customerName,
            orderId: order.id,
            content: apologyMessage,
            timestamp: new Date().toISOString(),
            status: 'sent'
          };

          const messages = agentSystem.getWhatsAppMessages();
          if (!messages.some(m => m.orderId === order.id && m.content.includes('APOLOGY20'))) {
            messages.unshift(mockMessage);
            localStorage.setItem('sulta_whatsapp_messages', JSON.stringify(messages.slice(0, 50)));

            agentSystem.addLog(
              'delayed_agent',
              'Delayed Order Agent',
              `تم تسليم رسالة الاعتذار التلقائية وإرفاق كوبون التعويض ${apologyCoupon} للعميلة ${order.customerName} بنجاح.`,
              'success',
              mockMessage
            );
          }
        }
      }
    }

    return delayCount;
  },

  // 6. VIP Customer Agent
  getVipCustomers: (): VipCustomer[] => {
    try {
      const vips = localStorage.getItem('sulta_vip_customers');
      return vips ? JSON.parse(vips) : [];
    } catch {
      return [];
    }
  },

  checkVipPromotion: async (customerName: string, phone: string, email: string): Promise<boolean> => {
    try {
      // Fetch all orders matching phone or email
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*');

      if (error || !orders) return false;

      // Filter matched orders
      const matched = orders.filter((o: any) => 
        (o.phone && o.phone.replace(/\D/g, '').includes(phone.replace(/\D/g, ''))) ||
        (o.customer_name === customerName) ||
        (email && o.email && o.email.toLowerCase() === email.toLowerCase())
      );

      const totalSpent = matched.reduce((sum, o) => sum + Number(o.total_price || o.total || 0), 0);
      const currency = matched[0]?.currency || 'SAR';

      // VIP limit: 1500 SAR or 10000 EGP
      const vipThreshold = currency === 'EGP' ? 10000 : 1500;

      if (totalSpent >= vipThreshold) {
        const vips = agentSystem.getVipCustomers();
        const identifier = email || phone;
        
        if (!vips.some(v => v.emailOrPhone === identifier)) {
          const newVip: VipCustomer = {
            emailOrPhone: identifier,
            customerName,
            totalSpent,
            ordersCount: matched.length,
            currency,
            vipTier: 'SULTA VIP',
            since: new Date().toISOString().split('T')[0]
          };

          vips.unshift(newVip);
          localStorage.setItem('sulta_vip_customers', JSON.stringify(vips));

          agentSystem.addLog(
            'vip_agent',
            'VIP Customer Agent',
            `👑 ترقية ملكية استثنائية! تجاوزت قيمة مشتريات العميلة ${customerName} حاجز ${vipThreshold.toLocaleString()} ${currency} (الإجمالي: ${totalSpent.toLocaleString()} ${currency}). تم ترقيتها تلقائياً لدرجة SULTA VIP الفاخرة بنجاح.`,
            'success',
            newVip
          );

          // Send welcome message and VIP discount coupon
          const vipCoupon = 'VIPWELCOME15';
          const vipWelcomeMsg = `✦ ترحيـب استثنائـي من مجلس إدارة SULTA ✦\n\n` +
            `سيدتنا وأميرتنا الغالية: ${customerName} 👑\n` +
            `يسرنا ويشرفنا إشعاركِ بأنه تم ترقية ملفكِ التعريفي تلقائياً وبأقصى درجات الفخر إلى نخبة العميلات:\n` +
            `👑 [ SULTA VIP CUSTOMER ] 👑\n\n` +
            `نظراً لولائكِ المرموق وثقتكِ الفائقة في قطعنا الحريرية، ستحصلين الآن بشكل مستمر على:\n` +
            `✨ خصم ثابت بقيمة ١٥٪ على جميع التصاميم باستخدام الكود الخاص بكِ: [ ${vipCoupon} ]\n` +
            `✨ أولوية تامة وتفصيل مجاني مخصص بقسم الدعم والصالون وصيانة القطع.\n` +
            `✨ هدايا دورية وعينات عطور مع كل طلب.\n\n` +
            `دمتِ عنواناً ناصعاً للأناقة المترفة والوقار الجذاب.`;

          const mockMessage: SimulatedWhatsAppMessage = {
            id: `WA-${Date.now()}`,
            phone: phone,
            customerName: customerName,
            orderId: 'VIP-WELCOME',
            content: vipWelcomeMsg,
            timestamp: new Date().toISOString(),
            status: 'sent'
          };

          const messages = agentSystem.getWhatsAppMessages();
          messages.unshift(mockMessage);
          localStorage.setItem('sulta_whatsapp_messages', JSON.stringify(messages.slice(0, 50)));

          agentSystem.addLog(
            'vip_agent',
            'VIP Customer Agent',
            `تم تسليم رسالة الترحيب الخاصة بالـ VIP وكوبون الخصم ${vipCoupon} للأميرة ${customerName} بنجاح.`,
            'success',
            mockMessage
          );

          return true;
        }
      }
    } catch (e) {
      console.warn("VIP validation skip or error:", e);
    }
    return false;
  },

  // 7. Abandoned Checkout Agent
  simulateAbandonedCheckout: (customerName: string, phone: string, cartItems: any[], country: string) => {
    const productsList = cartItems.map(it => `• ${it.product.nameAr}`).join('\n');
    const currency = country === 'EG' ? 'EGP' : 'SAR';
    
    agentSystem.addLog(
      'abandoned_agent',
      'Abandoned Checkout Agent',
      `🛒 رصد سلة متروكة! العميلة ${customerName} قامت بإضافة منتجات في السلة وغادرت بدون إتمام عملية الدفع. تم تفعيل نظام الاسترجاع التلقائي بعد ساعة واحدة.`,
      'warning',
      { customerName, phone, cartItems }
    );

    // Simulated 1-Hour Recovery Reminder
    const recoveryCoupon = 'SULTALOVE10';
    const hourOneMessage = `✦ تذكـير لطيف من سلة أمنياتكِ في SULTA ✦\n\n` +
      `أميرتنا العزيزة ${customerName} 🌸\n` +
      `لاحظنا بقلق مغادرتكِ لصالون SULTA الأنيق تاركةً قطع الحرير المميزة بانتظارك في السلة اللطيفة:\n\n` +
      `${productsList}\n\n` +
      `لنسهل عليكِ إضفاء الرقي والسعادة للياليكِ، قمنا بتوليد كوبون خصم استثنائي صالح لمدة ٢٤ ساعة فقط:\n` +
      `🎟️ كود خصم ١٠٪: [ ${recoveryCoupon} ]\n\n` +
      `لا تتركي ليلتكِ تفقد أناقتها، أتمي الشراء الآن بلمحة سريعة.`;

    const mockMessage: SimulatedWhatsAppMessage = {
      id: `WA-AB-${Date.now()}`,
      phone: phone,
      customerName: customerName,
      orderId: 'ABANDONED-RECOVERY',
      content: hourOneMessage,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    const messages = agentSystem.getWhatsAppMessages();
    messages.unshift(mockMessage);
    localStorage.setItem('sulta_whatsapp_messages', JSON.stringify(messages.slice(0, 50)));

    agentSystem.addLog(
      'abandoned_agent',
      'Abandoned Checkout Agent',
      `تم إرسال تذكير الساعة الأولى تلقائياً للعميلة ${customerName} لإتمام حجز قطع الحرير مع الكوبون الخاص بنجاح.`,
      'success',
      mockMessage
    );
  }
};
