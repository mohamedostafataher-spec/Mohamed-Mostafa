import React, { useMemo } from 'react';
import { Bell, ShoppingBag, ShieldAlert, CheckCircle2, Package, Sparkles, Megaphone, ArrowRight } from 'lucide-react';
import { Order, Product } from '../types';

interface SmartNotificationsCenterProps {
  orders: Order[];
  products: Product[];
  healthScore?: number;
  healthIssuesCount?: number;
  onNavigateToTab: (tab: string) => void;
}

export default function SmartNotificationsCenter({
  orders,
  products,
  healthScore = 100,
  healthIssuesCount = 0,
  onNavigateToTab,
}: SmartNotificationsCenterProps) {
  const notifications = useMemo(() => {
    const list: {
      id: string;
      title: string;
      desc: string;
      type: 'order' | 'warning' | 'info' | 'success';
      time: string;
      actionLabel?: string;
      actionTab?: string;
    }[] = [];

    // 1. Pending/New Orders Group
    const pendingOrders = orders.filter((o) => o.status === 'new');
    if (pendingOrders.length > 0) {
      list.push({
        id: 'new-orders-alert',
        title: `لديك ${pendingOrders.length} طلبات جديدة بحاجة للتجهيز 📥`,
        desc: `عملاء من المملكة العربية السعودية ومصر ينتظرون تأكيد شحناتهم حالاً.`,
        type: 'order',
        time: 'الآن',
        actionLabel: 'شاشاة الطلبات',
        actionTab: 'orders',
      });
    }

    // 2. Low stock items
    const lowStockProducts = products.filter((p) => p.stock <= 4 && p.status === 'active');
    if (lowStockProducts.length > 0) {
      const topLow = lowStockProducts.slice(0, 2).map((p) => p.nameAr).join('، ');
      list.push({
        id: 'low-stock-alert',
        title: `تحذير مخزون حرج: منتجات أوشكت على النفاد ⚠️`,
        desc: `المنتجات التالية مخزونها أقل من 5 قطع: ${topLow} (إجمالي ${lowStockProducts.length} منتجات).`,
        type: 'warning',
        time: 'منذ دقيقة',
        actionLabel: 'تحديث المخزن',
        actionTab: 'inventory',
      });
    }

    // 3. Store Health Alerts
    if (healthIssuesCount > 0) {
      list.push({
        id: 'health-alert',
        title: `نظام التشخيص: تم رصد ملفات بحاجة للترميم الآلي 🛠️`,
        desc: `تم اكتشاف ${healthIssuesCount} نواقص (SKU مفقود، وصف غير فخم، روابط صور فارغة) قد تضعف تجربة SULTA.`,
        type: 'warning',
        time: 'منذ ساعتين',
        actionLabel: 'إصلاح المشاكل',
        actionTab: 'system_health',
      });
    }

    // 4. Milestone Success
    const completedOrders = orders.filter((o) => o.status === 'delivered');
    if (completedOrders.length > 0) {
      const totalRevenue = orders
        .filter((o) => o.status === 'delivered')
        .reduce((sum, o) => sum + (o.currency === 'SAR' ? o.totalPrice * 13 : o.totalPrice), 0);
      list.push({
        id: 'milestone-revenue',
        title: `إنجاز ملكي: الطلبات المكتملة تحقق نجاحاً قياسياً ✨`,
        desc: `لقد قمت بإيصال ${completedOrders.length} شحنة فاخرة بنجاح، محققاً مبيعات مطهرة عالية القيمة.`,
        type: 'success',
        time: 'اليوم',
        actionLabel: 'عرض التقارير',
        actionTab: 'kpis',
      });
    }

    // 5. Default General Announcement
    list.push({
      id: 'general-motd',
      title: 'بوتيك SULTA مستعد لتوسعات الخليج العربي 🌍',
      desc: 'بوابة الدفع وبنية الشحن ومحولات العملات مهيأة بالكامل لكلا الدولتين الشقيقتين (مصر والسعودية).',
      type: 'info',
      time: 'مستمر',
    });

    return list;
  }, [orders, products, healthIssuesCount]);

  return (
    <div className="bg-white border border-gray-150 rounded-3xl p-6 relative overflow-hidden text-right" dir="rtl">
      <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#FAF5F0] flex items-center justify-center text-[#A44C5C]">
            <Bell size={18} className="animate-swing" />
          </div>
          <div>
            <h4 className="font-serif text-sm font-bold text-gray-900">مركز الإشعارات الذكي والمستمر</h4>
            <p className="text-[10px] text-gray-400 font-sans mt-0.5">تتبع دوري مستقل دون تأخير لبيانات المتجر والطلبيات الزائرة.</p>
          </div>
        </div>
        <span className="text-[10px] font-bold bg-[#A44C5C]/10 text-[#A44C5C] px-3 py-1 rounded-full font-sans">
          {notifications.length} إشعار نشط
        </span>
      </div>

      <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
        {notifications.map((notif) => {
          let bgClass = 'bg-[#FAF5F0] border-gray-150 text-gray-800';
          let icon = <Megaphone size={16} className="text-gray-500" />;

          if (notif.type === 'order') {
            bgClass = 'bg-amber-50/50 border-amber-100 text-amber-900';
            icon = <ShoppingBag size={16} className="text-amber-600" />;
          } else if (notif.type === 'warning') {
            bgClass = 'bg-rose-50/50 border-rose-100 text-rose-900';
            icon = <ShieldAlert size={16} className="text-rose-600 animate-pulse" />;
          } else if (notif.type === 'success') {
            bgClass = 'bg-emerald-50/50 border-emerald-100 text-emerald-900';
            icon = <CheckCircle2 size={16} className="text-emerald-600" />;
          }

          return (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border text-xs transition-all duration-300 flex items-start justify-between gap-4 hover:shadow-sm ${bgClass}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1.5 rounded-xl bg-white/80 border border-inherit">
                  {icon}
                </div>
                <div>
                  <h5 className="font-bold text-gray-900 flex items-center gap-1.5 flex-wrap">
                    {notif.title}
                    {notif.time && (
                      <span className="text-[9px] bg-white/60 text-gray-400 px-1.5 py-0.5 rounded font-sans">
                        {notif.time}
                      </span>
                    )}
                  </h5>
                  <p className="text-[11px] text-gray-600 mt-1 font-sans leading-relaxed">{notif.desc}</p>
                </div>
              </div>

              {notif.actionLabel && notif.actionTab && (
                <button
                  onClick={() => onNavigateToTab(notif.actionTab!)}
                  className="shrink-0 flex items-center gap-1 text-[10px] bg-white hover:bg-gray-150 text-gray-800 font-bold px-3 py-1.5 rounded-xl border border-gray-200 transition-all cursor-pointer"
                >
                  <span>{notif.actionLabel}</span>
                  <ArrowRight size={10} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
