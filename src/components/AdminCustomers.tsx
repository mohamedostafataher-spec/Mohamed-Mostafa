import React, { useState, useMemo } from 'react';
import { Users, Search, MessageCircle, MapPin, ShoppingBag, DollarSign, Award, Star, ExternalLink, Calendar, CheckCircle2 } from 'lucide-react';
import { Order, CustomerAnalyticsRecord } from '../types';
import { dbService } from '../services/db';

interface AdminCustomersProps {
  orders: Order[];
  toast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function AdminCustomers({ orders, toast }: AdminCustomersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'VIP' | 'متكررة' | 'جديدة'>('all');
  const [cityFilter, setCityFilter] = useState('all');

  // Derive real customer intelligence records dynamically from store orders
  const customers = useMemo(() => {
    return dbService.deriveCustomerRecords(orders);
  }, [orders]);

  // Extract unique cities from customers
  const cities = useMemo(() => {
    const set = new Set<string>();
    customers.forEach(c => {
      if (c.city && c.city.trim()) set.add(c.city.trim());
    });
    return Array.from(set);
  }, [customers]);

  // Aggregate metrics
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const vipCount = customers.filter(c => c.tier === 'VIP').length;
    const repeatCount = customers.filter(c => c.totalOrders > 1).length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgSpend = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;
    const repeatRate = totalCustomers > 0 ? Math.round((repeatCount / totalCustomers) * 100) : 0;

    return {
      totalCustomers,
      vipCount,
      repeatCount,
      avgSpend,
      repeatRate
    };
  }, [customers]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (tierFilter !== 'all' && c.tier !== tierFilter) return false;
      if (cityFilter !== 'all' && c.city !== cityFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    });
  }, [customers, searchQuery, tierFilter, cityFilter]);

  // WhatsApp concierge outreach helper
  const handleOpenWhatsApp = (customer: CustomerAnalyticsRecord) => {
    const cleanPhone = customer.phone.replace(/[^\d]/g, '');
    let targetPhone = cleanPhone;
    if (targetPhone.startsWith('05')) {
      targetPhone = '966' + targetPhone.slice(1);
    } else if (targetPhone.startsWith('5')) {
      targetPhone = '966' + targetPhone;
    }

    const greeting = encodeURIComponent(
      `أهلاً بكِ عزيزتنا ${customer.name} من SULTA Atelier 👑\nسعداء جدًا بتسوقكِ معنا، ويسرنا تواصل كونسيرج سُلطة معكِ للتأكد من رضاكِ التام عن طلبيتك وتقديم كل الدعم لكِ ✨`
    );

    window.open(`https://wa.me/${targetPhone}?text=${greeting}`, '_blank');
    toast?.(`جاري فتح محادثة الواتساب مع العميلة ${customer.name} 💬`, 'info');
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in" dir="rtl">
      {/* Header & KPI Summary Cards */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-150">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FCF5F6] border border-[#DF8A9D]/30 text-[#A44C5C] flex items-center justify-center shrink-0 shadow-2xs">
              <Users size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-950 flex items-center gap-2">
                <span>سجل العميلات الذكي (Customer CRM Intelligence)</span>
                <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full font-mono">
                  {stats.totalCustomers} عميلة مسجلة
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                بيانات حقيقية 100% مستخلصة تلقائيًا من طلبات المتجر مع تصنيف درجات الولاء ومتوسط الإنفاق
              </p>
            </div>
          </div>
        </div>

        {/* CRM Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-[#FAF8F8] border border-gray-150 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-gray-500 font-bold block flex items-center gap-1">
              <Users size={13} className="text-[#A44C5C]" />
              <span>إجمالي العميلات</span>
            </span>
            <div className="text-xl font-black font-mono text-gray-950">
              {stats.totalCustomers} <span className="text-[10px] font-sans text-gray-400">عميلة</span>
            </div>
          </div>

          <div className="bg-[#FAF8F8] border border-gray-150 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-gray-500 font-bold block flex items-center gap-1">
              <Award size={13} className="text-amber-600" />
              <span>عميلات VIP (الأعلى إنفاقًا)</span>
            </span>
            <div className="text-xl font-black font-mono text-amber-700">
              {stats.vipCount} <span className="text-[10px] font-sans text-gray-400">ملكية 👑</span>
            </div>
          </div>

          <div className="bg-[#FAF8F8] border border-gray-150 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-gray-500 font-bold block flex items-center gap-1">
              <DollarSign size={13} className="text-emerald-600" />
              <span>متوسط قيمة العميل (LTV)</span>
            </span>
            <div className="text-xl font-black font-mono text-emerald-700">
              {stats.avgSpend.toLocaleString()} <span className="text-[10px] font-sans text-gray-400">ر.س</span>
            </div>
          </div>

          <div className="bg-[#FAF8F8] border border-gray-150 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-gray-500 font-bold block flex items-center gap-1">
              <CheckCircle2 size={13} className="text-indigo-600" />
              <span>معدل الشراء المتكرر</span>
            </span>
            <div className="text-xl font-black font-mono text-indigo-700">
              {stats.repeatRate}% <span className="text-[10px] font-sans text-gray-400">ولاء مرتفع</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="ابحثي بالاسم، رقم الجوال، أو المدينة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl py-2.5 pr-9 pl-4 text-xs focus:bg-white focus:outline-none focus:border-[#A44C5C] transition-all"
          />
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Tier Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
          {[
            { id: 'all', label: 'كافة العميلات' },
            { id: 'VIP', label: '👑 VIP (الملكيات)' },
            { id: 'متكررة', label: '🔄 متكررة الشراء' },
            { id: 'جديدة', label: '✨ عميلة جديدة' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTierFilter(t.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                tierFilter === t.id
                  ? 'bg-[#A44C5C] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}

          {/* City selector if multiple cities */}
          {cities.length > 1 && (
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-gray-100 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 outline-none cursor-pointer"
            >
              <option value="all">كافة المدن</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Customer Table / Cards */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-gray-150 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-gray-950">قائمة العميلات والطلبات السابقة</h4>
            <p className="text-xs text-gray-400 mt-0.5">ترتيب تنازلي حسب إجمالي قيمة المشتريات</p>
          </div>
          <span className="text-xs font-mono font-bold text-gray-500">
            {filteredCustomers.length} من {customers.length}
          </span>
        </div>

        {customers.length === 0 ? (
          <div className="p-16 text-center text-gray-400 space-y-2">
            <Users size={40} className="mx-auto opacity-20" />
            <p className="font-bold text-sm text-gray-700">لا توجد سجلات عميلات مسجلة بعد</p>
            <p className="text-xs">بمجرد تسجيل أول طلب شراء حقيقي، ستظهر بيانات العميلات ومستويات الولاء هنا تلقائياً.</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-1">
            <p className="font-bold text-sm text-gray-700">لم يتم العثور على أي عميلة تطابق هذا البحث أو الفلتر</p>
            <p className="text-xs">جربي مسح شريط البحث أو اختيار "كافة العميلات".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-100/50 text-gray-500 border-b border-gray-200 font-bold text-[11px]">
                <tr>
                  <th className="py-4 px-5">العميلة</th>
                  <th className="py-4 px-5">رقم الجوال</th>
                  <th className="py-4 px-5">المدينة</th>
                  <th className="py-4 px-5">تصنيف الولاء</th>
                  <th className="py-4 px-5 text-center">عدد الطلبات</th>
                  <th className="py-4 px-5 text-center">إجمالي الإنفاق</th>
                  <th className="py-4 px-5">آخر طلب</th>
                  <th className="py-4 px-5 text-center">الكونسيرج</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {filteredCustomers.map((cust, idx) => {
                  const isVip = cust.tier === 'VIP';
                  return (
                    <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-gray-950 flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isVip ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            {isVip ? '👑' : cust.name.charAt(0) || 'ع'}
                          </div>
                          <span>{cust.name}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5 font-mono text-gray-700 text-xs" dir="ltr">
                        {cust.phone}
                      </td>

                      <td className="py-4 px-5 text-gray-600 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} className="text-gray-400" />
                          <span>{cust.city}</span>
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                          cust.tier === 'VIP'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : cust.tier === 'متكررة'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                          {cust.tier === 'VIP' && <Star size={11} className="fill-amber-500 text-amber-500" />}
                          <span>{cust.tier}</span>
                        </span>
                      </td>

                      <td className="py-4 px-5 text-center font-mono font-bold text-gray-900">
                        {cust.totalOrders}
                      </td>

                      <td className="py-4 px-5 text-center font-mono font-black text-[#A44C5C]">
                        {cust.totalSpent.toLocaleString()} ر.س
                      </td>

                      <td className="py-4 px-5 font-mono text-[11px] text-gray-500">
                        {cust.lastOrderDate || '-'}
                      </td>

                      <td className="py-4 px-5 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsApp(cust)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                          title="فتح محادثة كونسيرج خاصة بالعميلة عبر الواتساب"
                        >
                          <MessageCircle size={13} />
                          <span>تواصل</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
