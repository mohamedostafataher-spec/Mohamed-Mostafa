import React, { useMemo } from 'react';
import { Users, Crown, Trophy, CalendarDays, UserMinus, Sparkles, ShoppingBag, Landmark } from 'lucide-react';
import { CustomerProfile, Order } from '../types';

interface CustomerIntelligenceProps {
  customers: CustomerProfile[];
  orders: Order[];
  onViewCustomerDetail?: (email: string) => void;
}

export default function CustomerIntelligence({
  customers = [],
  orders = [],
  onViewCustomerDetail,
}: CustomerIntelligenceProps) {
  const intelligence = useMemo(() => {
    // 1. Cross-reference orders to count orders per customer
    const orderCountsByEmail: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.email) {
        orderCountsByEmail[o.email.trim().toLowerCase()] = (orderCountsByEmail[o.email.trim().toLowerCase()] || 0) + 1;
      }
    });

    // Enhance profiles with order counts and latest order dates
    const enhancedProfiles = customers.map((c) => {
      const emailLower = c.email.trim().toLowerCase();
      const orderCount = orderCountsByEmail[emailLower] || 0;
      
      // Let's find latest order date for c
      const customerOrders = orders.filter((o) => o.email?.trim().toLowerCase() === emailLower);
      const latestOrderDate = customerOrders.length > 0 
        ? customerOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date 
        : undefined;

      return {
        ...c,
        orderCount,
        latestOrderDate,
      };
    });

    // A. Top purchasing (أكثر العملاء شراءً)
    const topPurchasing = [...enhancedProfiles]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    // B. Most frequent (أكثر العملاء زيارة/تفاعلاً)
    // Sorted by order counts first, then total spent
    const mostFrequent = [...enhancedProfiles]
      .sort((a, b) => {
        if (b.orderCount !== a.orderCount) {
          return b.orderCount - a.orderCount;
        }
        return b.totalSpent - a.totalSpent;
      })
      .slice(0, 5);

    // C. New Customers (العملاء الجدد)
    // Sorted by joinedAt descending
    const newCustomers = [...enhancedProfiles]
      .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
      .slice(0, 5);

    // D. Inactive Customers (العملاء غير النشطين)
    // Customers with zero orders, or who joined > 14 days ago and haven't placed an order in the last 14 days
    const today = new Date();
    const inactiveCustomers = enhancedProfiles.filter((c) => {
      const joinDate = new Date(c.joinedAt);
      const diffDays = Math.ceil(Math.abs(today.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // If order count is 0, or hasn't ordered in last 14 days and joined > 14 days ago
      if (c.orderCount === 0) return true;
      if (c.latestOrderDate) {
        const lastOrderDate = new Date(c.latestOrderDate);
        const lastOrderDiffDays = Math.ceil(Math.abs(today.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
        return lastOrderDiffDays > 14 && diffDays > 14;
      }
      return false;
    }).slice(0, 5);

    // E. Premium Customers (العملاء المميزين)
    // Diamond and Platinum tiers
    const premiumCustomers = enhancedProfiles
      .filter((c) => c.loyaltyTier === 'diamond' || c.loyaltyTier === 'platinum' || c.loyaltyTier === 'gold')
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    // Visual segment distribution
    const segments = {
      diamond: customers.filter((c) => c.loyaltyTier === 'diamond').length,
      platinum: customers.filter((c) => c.loyaltyTier === 'platinum').length,
      gold: customers.filter((c) => c.loyaltyTier === 'gold').length,
      silver: customers.filter((c) => c.loyaltyTier === 'silver').length,
    };

    return {
      topPurchasing,
      mostFrequent,
      newCustomers,
      inactiveCustomers,
      premiumCustomers,
      segments,
      totalCount: customers.length,
    };
  }, [customers, orders]);

  return (
    <div className="space-y-8 text-right font-sans" dir="rtl">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-xs">
          <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">العملاء النشطون</span>
          <span className="text-2xl font-black text-gray-900 font-sans">{intelligence.totalCount}</span>
          <span className="text-[10px] text-[#A44C5C] font-semibold flex items-center gap-1 mt-1 justify-start">
            <Sparkles size={12} />
            متصلون بقاعدة بيانات السحاب
          </span>
        </div>

        <div className="bg-[#FAF5F0] border border-[#DF8A9D]/10 p-6 rounded-2xl shadow-xs flex justify-between items-center">
          <div>
            <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">العملاء الملكيون {`Diamond 💎`}</span>
            <span className="text-2xl font-black text-[#A44C5C] font-sans">{intelligence.segments.diamond}</span>
          </div>
          <Crown size={28} className="text-[#A44C5C] opacity-30" />
        </div>

        <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-xs">
          <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">بلاتيني {`Platinum ✧`}</span>
          <span className="text-2xl font-black text-gray-800 font-sans">{intelligence.segments.platinum}</span>
        </div>

        <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-xs">
          <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">العملاء الجدد (هذا الأسبوع)</span>
          <span className="text-2xl font-black text-emerald-600 font-sans">{intelligence.newCustomers.length}</span>
        </div>
      </div>

      {/* Tabs / Grids of Customer Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* A. Top purchasing (أكثر العملاء شراءً) */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs">
          <h3 className="font-serif text-sm font-bold text-gray-900 flex items-center gap-2 mb-4 justify-start">
            <Trophy size={18} className="text-amber-500" />
            <span>الأكثر عائداً وقدرة شرائية (أكثر العملاء شراءً)</span>
          </h3>
          <div className="space-y-3.5">
            {intelligence.topPurchasing.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs">لا توجد بيانات عملاء كافية.</div>
            ) : (
              intelligence.topPurchasing.map((c, idx) => (
                <div key={c.id} className="p-3 bg-gray-50 border border-gray-150 rounded-2xl flex items-center justify-between text-xs hover:bg-gray-100/50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-[10px] font-sans border border-amber-200">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-gray-900">{c.firstName} {c.lastName}</h4>
                      <p className="text-[10px] text-gray-400 font-sans">{c.email}</p>
                    </div>
                  </div>
                  <div className="text-left font-sans">
                    <div className="font-black text-gray-900">{c.totalSpent.toLocaleString()} EGP</div>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      c.loyaltyTier === 'diamond' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {c.loyaltyTier}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* B. Most frequent (أكثر العملاء زيارة وتكراراً) */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs">
          <h3 className="font-serif text-sm font-bold text-gray-900 flex items-center gap-2 mb-4 justify-start">
            <ShoppingBag size={18} className="text-[#A44C5C]" />
            <span>الأكثر تكراراً للطلبات (مؤشر الأكثر ملازمة لمقاساتنا)</span>
          </h3>
          <div className="space-y-3.5">
            {intelligence.mostFrequent.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs">لا توجد مبيعات مسجلة حتى اللحظة.</div>
            ) : (
              intelligence.mostFrequent.map((c, idx) => (
                <div key={c.id} className="p-3 bg-gray-50 border border-gray-150 rounded-2xl flex items-center justify-between text-xs hover:bg-gray-100/50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-[10px] font-sans border border-rose-200">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-gray-900">{c.firstName} {c.lastName}</h4>
                      <p className="text-[10px] text-gray-400 font-sans">{c.email}</p>
                    </div>
                  </div>
                  <div className="text-left font-sans">
                    <div className="font-black text-[#A44C5C]">{c.orderCount} طلبيات مكتملة</div>
                    <span className="text-[9px] text-gray-400">إجمالي {c.totalSpent.toLocaleString()} EGP</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* C. New Customers (العملاء الجدد) */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs">
          <h3 className="font-serif text-sm font-bold text-gray-900 flex items-center gap-2 mb-4 justify-start">
            <CalendarDays size={18} className="text-indigo-500" />
            <span>المنتسبون الجدد للبوتيك (جدول الترحيب والمميزات)</span>
          </h3>
          <div className="space-y-3.5">
            {intelligence.newCustomers.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs">لا توجد حسابات جديدة هذا الأسبوع.</div>
            ) : (
              intelligence.newCustomers.map((c) => (
                <div key={c.id} className="p-3 bg-gray-50 border border-gray-150 rounded-2xl flex items-center justify-between text-xs hover:bg-gray-100/50 transition-colors">
                  <div>
                    <h4 className="font-bold text-gray-900">{c.firstName} {c.lastName}</h4>
                    <span className="text-[10px] text-gray-400 font-sans">البريد الإلكتروني: {c.email}</span>
                  </div>
                  <div className="text-left font-sans">
                    <div className="text-[#A44C5C] font-semibold">
                      انضم في {new Date(c.joinedAt).toLocaleDateString('ar-EG', { month: 'long', day: 'numeric' })}
                    </div>
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 rounded font-bold">عضوية فضية</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* D. Inactive Customers (العملاء غير النشطين) */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs">
          <h3 className="font-serif text-sm font-bold text-gray-900 flex items-center gap-2 mb-4 justify-start">
            <UserMinus size={18} className="text-rose-400" />
            <span>أعضاء خاملون (بحاجة لإرسال عروض ترحيبية أو كوبونات ملكية)</span>
          </h3>
          <div className="space-y-3.5">
            {intelligence.inactiveCustomers.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs">لا يوجد أعضاء خاملين حالياً.</div>
            ) : (
              intelligence.inactiveCustomers.map((c) => (
                <div key={c.id} className="p-3 bg-gray-50 border border-gray-150 rounded-2xl flex items-center justify-between text-xs hover:bg-gray-100/50 transition-colors">
                  <div>
                    <h4 className="font-bold text-gray-900">{c.firstName} {c.lastName}</h4>
                    <p className="text-[10px] text-gray-400 font-sans">{c.email}</p>
                  </div>
                  <div className="text-left font-sans">
                    <div className="text-rose-600 font-bold">لم تطلب منذ فترة</div>
                    <span className="text-[10px] text-gray-400">إجمالي النقاط: {c.points} نقطة</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
