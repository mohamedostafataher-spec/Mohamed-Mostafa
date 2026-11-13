import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Search,
  MessageCircle,
  MapPin,
  ShoppingBag,
  DollarSign,
  Award,
  Star,
  CheckCircle2,
  X,
  Tag,
  Plus,
  FileText,
  ArrowUpLeft,
  AlertTriangle,
  Save
} from 'lucide-react';
import { Order, CustomerAnalyticsRecord, CustomerProfileMeta } from '../types';
import { dbService } from '../services/db';
import { getOrderStageMeta, normalizePhoneKey } from '../utils/orderPipeline';
import { WhatsAppService } from '../services/whatsappService';
import { AdminBadge, AdminButton, AdminEmptyState } from './admin/AdminUI';

interface AdminCustomersProps {
  orders: Order[];
  toast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onSelectOrder?: (order: Order) => void;
  adminName?: string;
}

const SUGGESTED_TAGS = [
  'عميلة VIP',
  'تفضل COD',
  'طلب هدية',
  'مقاس خاص',
  'سريعة التواصل',
  'تحتاج متابعة'
];

export default function AdminCustomers({
  orders,
  toast,
  onSelectOrder,
  adminName = 'فريق سولته'
}: AdminCustomersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'VIP' | 'متكررة' | 'جديدة'>('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');

  const [profilesMeta, setProfilesMeta] = useState<Record<string, CustomerProfileMeta>>({});
  const [selectedCustomerKey, setSelectedCustomerKey] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState('');
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    dbService.getCustomerProfilesMeta().then(setProfilesMeta).catch(() => {});
  }, []);

  // Derive real customer intelligence records dynamically from store orders + saved CRM metadata
  const customers = useMemo(() => {
    const derived = dbService.deriveCustomerRecords(orders);
    return derived.map((cust) => {
      const key = cust.normalizedPhone || normalizePhoneKey(cust.phone) || cust.phone;
      const meta = profilesMeta[key];
      return {
        ...cust,
        normalizedPhone: key,
        tags: meta?.tags || [],
        notes: meta?.notes || ''
      };
    });
  }, [orders, profilesMeta]);

  const cities = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.city && c.city.trim()) set.add(c.city.trim());
    });
    return Array.from(set);
  }, [customers]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      (c.tags || []).forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [customers]);

  // Aggregate metrics (no internal cost or margin fields exposed)
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const vipCount = customers.filter((c) => c.tier === 'VIP').length;
    const repeatCount = customers.filter((c) => c.totalOrders > 1).length;
    const totalHalalas = customers.reduce((sum, c) => sum + (c.totalSpentHalalas ?? c.totalSpent * 100), 0);
    const avgSpend = totalCustomers > 0 ? Math.round(totalHalalas / totalCustomers / 100) : 0;
    const repeatRate = totalCustomers > 0 ? Math.round((repeatCount / totalCustomers) * 100) : 0;

    return {
      totalCustomers,
      vipCount,
      repeatCount,
      avgSpend,
      repeatRate
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (tierFilter !== 'all' && c.tier !== tierFilter) return false;
      if (cityFilter !== 'all' && c.city !== cityFilter) return false;
      if (tagFilter !== 'all' && !(c.tags || []).includes(tagFilter)) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.city.toLowerCase().includes(q) ||
        (c.tags || []).some((t) => t.toLowerCase().includes(q)) ||
        (c.notes || '').toLowerCase().includes(q)
      );
    });
  }, [customers, searchQuery, tierFilter, cityFilter, tagFilter]);

  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerKey) return null;
    return customers.find((c) => (c.normalizedPhone || c.phone) === selectedCustomerKey) || null;
  }, [customers, selectedCustomerKey]);

  const selectedCustomerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    const targetKey = selectedCustomer.normalizedPhone || normalizePhoneKey(selectedCustomer.phone);
    return orders
      .filter((o) => {
        const orderKey = normalizePhoneKey(o.phone) || `id_${o.id.slice(0, 6)}`;
        return orderKey === targetKey;
      })
      .sort((a, b) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime());
  }, [orders, selectedCustomer]);

  const openCustomerDrawer = (customer: CustomerAnalyticsRecord) => {
    const key = customer.normalizedPhone || normalizePhoneKey(customer.phone) || customer.phone;
    setSelectedCustomerKey(key);
    setDraftNotes(customer.notes || '');
    setDraftTags(customer.tags || []);
    setNewTagInput('');
  };

  const handleAddTag = (tagValue: string) => {
    const clean = tagValue.trim();
    if (!clean) return;
    if (!draftTags.includes(clean)) {
      setDraftTags((prev) => [...prev, clean]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setDraftTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleSaveProfileMeta = async () => {
    if (!selectedCustomer) return;
    setIsSavingProfile(true);
    try {
      const next = await dbService.saveCustomerProfileMeta({
        phone: selectedCustomer.phone,
        customerName: selectedCustomer.name,
        city: selectedCustomer.city,
        tags: draftTags,
        notes: draftNotes.trim(),
        updatedBy: adminName
      });
      setProfilesMeta(next);
      toast?.(`تم حفظ ملف العميلة "${selectedCustomer.name}" بنجاح ✨`, 'success');
    } catch (err: any) {
      toast?.(`تعذر حفظ بيانات العميلة: ${err?.message || ''}`, 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleOpenWhatsApp = (customer: CustomerAnalyticsRecord) => {
    const message = `أهلاً بكِ عزيزتنا ${customer.name} من متجر سولته 👑\nسعداء دائماً بتسوقكِ معنا، ويسرنا خدمتكِ في أي استفسار أو طلب جديد ✨`;
    const url = WhatsAppService.buildWhatsAppUrl(customer.phone, message);
    window.open(url, '_blank', 'noopener,noreferrer');
    toast?.(`جاري فتح محادثة واتساب مع ${customer.name}`, 'info');
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in" dir="rtl">
      {/* Header & KPI Summary Cards */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/90 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-150">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FCF5F6] border border-[#DF8A9D]/30 text-[#A44C5C] flex items-center justify-center shrink-0">
              <Users size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-950 flex items-center gap-2 flex-wrap">
                <span>ملفات العميلات وسجل الولاء</span>
                <AdminBadge tone="brand">
                  <span className="font-mono">{stats.totalCustomers}</span> عميلة مسجلة
                </AdminBadge>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                اضغطي على أي عميلة لعرض سجل طلباتها الكامل، الوسوم، والملاحظات الداخلية.
              </p>
            </div>
          </div>
        </div>

        {/* CRM Metric Badges */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-[#FAF8F8] border border-gray-150 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-gray-500 font-bold flex items-center gap-1">
              <Users size={13} className="text-[#A44C5C]" />
              <span>إجمالي العميلات</span>
            </span>
            <div className="text-xl font-black font-mono tabular-nums text-gray-950">
              {stats.totalCustomers} <span className="text-[10px] font-sans text-gray-500">عميلة</span>
            </div>
          </div>

          <div className="bg-[#FAF8F8] border border-gray-150 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-gray-500 font-bold flex items-center gap-1">
              <Award size={13} className="text-amber-600" />
              <span>عميلات VIP</span>
            </span>
            <div className="text-xl font-black font-mono tabular-nums text-amber-700">
              {stats.vipCount} <span className="text-[10px] font-sans text-gray-500">ملكية</span>
            </div>
          </div>

          <div className="bg-[#FAF8F8] border border-gray-150 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-gray-500 font-bold flex items-center gap-1">
              <DollarSign size={13} className="text-emerald-600" />
              <span>متوسط إنفاق العميلة</span>
            </span>
            <div className="text-xl font-black font-mono tabular-nums text-emerald-700">
              {stats.avgSpend.toLocaleString()} <span className="text-[10px] font-sans text-gray-500">ر.س</span>
            </div>
          </div>

          <div className="bg-[#FAF8F8] border border-gray-150 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-gray-500 font-bold flex items-center gap-1">
              <CheckCircle2 size={13} className="text-indigo-600" />
              <span>معدل الشراء المتكرر</span>
            </span>
            <div className="text-xl font-black font-mono tabular-nums text-indigo-700">
              {stats.repeatRate}% <span className="text-[10px] font-sans text-gray-500">تكرار</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="ابحثي بالاسم، الجوال، المدينة، الوسوم أو الملاحظات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl py-2.5 pr-9 pl-4 text-xs focus:bg-white focus:outline-none focus:border-[#A44C5C] transition-all"
          />
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'VIP', label: 'VIP 👑' },
            { id: 'متكررة', label: 'متكررة' },
            { id: 'جديدة', label: 'جديدة' }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTierFilter(t.id as any)}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                tierFilter === t.id
                  ? 'bg-[#A44C5C] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}

          {cities.length > 1 && (
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              aria-label="تصفية حسب المدينة"
              className="min-h-[44px] bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none cursor-pointer"
            >
              <option value="all">كل المدن</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {allTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              aria-label="تصفية حسب الوسم"
              className="min-h-[44px] bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none cursor-pointer"
            >
              <option value="all">كل الوسوم</option>
              {allTags.map((tg) => (
                <option key={tg} value={tg}>
                  #{tg}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Customer Table / Mobile Cards */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-gray-150 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-gray-950">قائمة العميلات</h4>
            <p className="text-xs text-gray-500 mt-0.5">مرتبة تنازلياً حسب صافي الإنفاق</p>
          </div>
          <span className="text-xs font-mono tabular-nums font-bold text-gray-600">
            {filteredCustomers.length} من {customers.length}
          </span>
        </div>

        {customers.length === 0 ? (
          <AdminEmptyState
            icon={<Users size={24} />}
            title="لا توجد سجلات عميلات بعد"
            description="بمجرد تسجيل أول طلب شراء حقيقي، ستظهر بيانات العميلات ومستويات الولاء هنا تلقائياً."
          />
        ) : filteredCustomers.length === 0 ? (
          <AdminEmptyState
            icon={<Search size={22} />}
            title="لا توجد عميلات مطابقة للبحث"
            description="جرّبي مسح شريط البحث أو إعادة تعيين الفلاتر."
          />
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="divide-y divide-gray-100 md:hidden">
              {filteredCustomers.map((cust) => {
                const isVip = cust.tier === 'VIP';
                return (
                  <div
                    key={cust.normalizedPhone || cust.phone}
                    className="p-4 space-y-3 hover:bg-gray-50/70 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => openCustomerDrawer(cust)}
                        className="text-right flex items-center gap-2.5 min-h-[44px] cursor-pointer"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                            isVip
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-[#FCF5F6] text-[#A44C5C] border border-[#DF8A9D]/30'
                          }`}
                        >
                          {isVip ? '👑' : cust.name.charAt(0) || 'ع'}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-950">{cust.name}</div>
                          <div className="text-xs font-mono text-gray-600" dir="ltr">
                            {cust.phone}
                          </div>
                        </div>
                      </button>

                      <span className="font-mono tabular-nums font-black text-sm text-[#A44C5C]">
                        {cust.totalSpent.toLocaleString()} ر.س
                      </span>
                    </div>

                    <div className="flex items-center flex-wrap gap-1.5 text-[11px]">
                      <AdminBadge tone={cust.tier === 'VIP' ? 'warning' : cust.tier === 'متكررة' ? 'info' : 'neutral'}>
                        {cust.tier}
                      </AdminBadge>
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium">
                        {cust.city}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-mono font-bold">
                        {cust.totalOrders} طلب
                      </span>
                      {(cust.tags || []).slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-[#FCF5F6] text-[#A44C5C] border border-[#DF8A9D]/30 font-bold"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <AdminButton
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => openCustomerDrawer(cust)}
                      >
                        ملف العميلة والسجل
                      </AdminButton>
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsApp(cust)}
                        className="min-h-[44px] px-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageCircle size={14} />
                        <span>واتساب</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-100/60 text-gray-600 border-b border-gray-200 font-bold text-[11px]">
                  <tr>
                    <th className="py-3.5 px-5">العميلة والوسوم</th>
                    <th className="py-3.5 px-5">رقم الجوال</th>
                    <th className="py-3.5 px-5">المدينة</th>
                    <th className="py-3.5 px-5">التصنيف</th>
                    <th className="py-3.5 px-5 text-center">الطلبات</th>
                    <th className="py-3.5 px-5 text-center">إجمالي الإنفاق</th>
                    <th className="py-3.5 px-5">آخر طلب</th>
                    <th className="py-3.5 px-5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans">
                  {filteredCustomers.map((cust) => {
                    const isVip = cust.tier === 'VIP';
                    return (
                      <tr
                        key={cust.normalizedPhone || cust.phone}
                        onClick={() => openCustomerDrawer(cust)}
                        className="hover:bg-gray-50/90 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isVip
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-[#FCF5F6] text-[#A44C5C] border border-[#DF8A9D]/30'
                              }`}
                            >
                              {isVip ? '👑' : cust.name.charAt(0) || 'ع'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-gray-950 flex items-center gap-1.5">
                                <span>{cust.name}</span>
                                {(cust.cancelledOrdersCount || 0) >= 2 && (
                                  <span
                                    title={`${cust.cancelledOrdersCount} طلبات ملغاة أو متعثرة`}
                                    className="text-amber-600"
                                  >
                                    <AlertTriangle size={13} />
                                  </span>
                                )}
                              </div>
                              {((cust.tags && cust.tags.length > 0) || cust.notes) && (
                                <div className="flex items-center gap-1 flex-wrap mt-1">
                                  {(cust.tags || []).slice(0, 3).map((tag) => (
                                    <span
                                      key={tag}
                                      className="px-1.5 py-0.5 rounded-md bg-[#FCF5F6] text-[#A44C5C] border border-[#DF8A9D]/30 text-[10px] font-bold"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                  {cust.notes && (
                                    <span className="text-[10px] text-gray-500 truncate max-w-[160px]">
                                      · {cust.notes}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-5 font-mono text-gray-700 text-xs" dir="ltr">
                          {cust.phone}
                        </td>

                        <td className="py-3.5 px-5 text-gray-700 font-medium">
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={12} className="text-gray-400" />
                            <span>{cust.city}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                              cust.tier === 'VIP'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : cust.tier === 'متكررة'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                          >
                            {cust.tier === 'VIP' && <Star size={11} className="fill-amber-500 text-amber-500" />}
                            <span>{cust.tier}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-5 text-center font-mono tabular-nums font-bold text-gray-900">
                          {cust.totalOrders}
                        </td>

                        <td className="py-3.5 px-5 text-center font-mono tabular-nums font-black text-[#A44C5C]">
                          {cust.totalSpent.toLocaleString()} ر.س
                        </td>

                        <td className="py-3.5 px-5 font-mono text-[11px] text-gray-500">
                          {cust.lastOrderDate || '-'}
                        </td>

                        <td className="py-3.5 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openCustomerDrawer(cust)}
                              className="min-h-[44px] px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              الملف
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenWhatsApp(cust)}
                              className="min-h-[44px] px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer"
                              title="فتح محادثة واتساب"
                            >
                              <MessageCircle size={14} />
                              <span>واتساب</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Customer Profile Drawer */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex justify-end animate-fade-in"
          onClick={() => setSelectedCustomerKey(null)}
        >
          <aside
            className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl border-r border-gray-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
            aria-label="ملف العميلة"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-5 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#FCF5F6] border border-[#DF8A9D]/30 text-[#A44C5C] flex items-center justify-center font-black text-base shrink-0">
                  {selectedCustomer.tier === 'VIP' ? '👑' : selectedCustomer.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-base text-gray-950 truncate">{selectedCustomer.name}</h4>
                  <p className="text-xs font-mono text-gray-600" dir="ltr">
                    {selectedCustomer.phone} · {selectedCustomer.city}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomerKey(null)}
                aria-label="إغلاق ملف العميلة"
                className="min-w-[44px] min-h-[44px] rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-6 flex-1">
              {/* Customer Spend & Loyalty Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#FAF8F8] border border-gray-200/70">
                  <span className="text-[11px] font-bold text-gray-500 block">عدد الطلبات</span>
                  <span className="text-lg font-black font-mono tabular-nums text-gray-950">
                    {selectedCustomer.totalOrders}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAF8F8] border border-gray-200/70">
                  <span className="text-[11px] font-bold text-gray-500 block">صافي الإنفاق</span>
                  <span className="text-lg font-black font-mono tabular-nums text-[#A44C5C]">
                    {selectedCustomer.totalSpent.toLocaleString()} ر.س
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAF8F8] border border-gray-200/70">
                  <span className="text-[11px] font-bold text-gray-500 block">الإلغاء/التعثر</span>
                  <span className="text-lg font-black font-mono tabular-nums text-gray-800">
                    {selectedCustomer.cancelledOrdersCount || 0}
                  </span>
                </div>
              </div>

              {/* Quick WhatsApp Action */}
              <button
                type="button"
                onClick={() => handleOpenWhatsApp(selectedCustomer)}
                className="w-full min-h-[44px] bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <MessageCircle size={16} />
                <span>تواصل مباشر عبر واتساب (wa.me)</span>
              </button>

              {/* Tags Manager */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 space-y-3">
                <h5 className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                  <Tag size={14} className="text-[#A44C5C]" />
                  <span>الوسوم (Tags)</span>
                </h5>

                <div className="flex flex-wrap gap-1.5">
                  {draftTags.length === 0 ? (
                    <span className="text-[11px] text-gray-400">لا توجد وسوم مضافة بعد.</span>
                  ) : (
                    draftTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#DF8A9D]/50 text-[#A44C5C] text-xs font-bold"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          aria-label={`إزالة وسم ${tag}`}
                          className="text-gray-400 hover:text-rose-600 cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Preset quick tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {SUGGESTED_TAGS.filter((t) => !draftTags.includes(t)).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAddTag(preset)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#FCF5F6] border border-gray-200 text-gray-700 text-[11px] font-bold cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(newTagInput);
                      }
                    }}
                    placeholder="إضافة وسم مخصص..."
                    className="flex-1 min-h-[44px] bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#A44C5C]"
                  />
                  <AdminButton
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => handleAddTag(newTagInput)}
                  >
                    <Plus size={14} />
                    <span>إضافة</span>
                  </AdminButton>
                </div>
              </div>

              {/* CRM Notes */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 space-y-3">
                <label htmlFor="customer-crm-notes" className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                  <FileText size={14} className="text-[#A44C5C]" />
                  <span>ملاحظات فريق العمل عن العميلة</span>
                </label>
                <textarea
                  id="customer-crm-notes"
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  rows={3}
                  placeholder="مثال: تفضل التوصيل مساءً، مقاسها المعتاد L، تطلب هدايا متكررة..."
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs leading-relaxed focus:outline-none focus:border-[#A44C5C]"
                />
                <AdminButton
                  type="button"
                  variant="primary"
                  size="md"
                  loading={isSavingProfile}
                  onClick={handleSaveProfileMeta}
                  className="w-full"
                >
                  <Save size={14} />
                  <span>حفظ الوسوم والملاحظات</span>
                </AdminButton>
              </div>

              {/* Customer Order History */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs text-gray-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag size={14} className="text-[#A44C5C]" />
                    <span>تاريخ طلبات العميلة ({selectedCustomerOrders.length})</span>
                  </span>
                </h5>

                <div className="space-y-2.5">
                  {selectedCustomerOrders.map((ord) => {
                    const meta = getOrderStageMeta(ord.status);
                    return (
                      <div
                        key={ord.id}
                        className="p-3.5 rounded-2xl border border-gray-200 bg-white space-y-2 hover:border-[#A44C5C]/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-xs text-gray-950">
                              #{ord.id.slice(0, 8)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${meta.colorClass}`}>
                              {meta.label}
                            </span>
                          </div>
                          <span className="font-mono tabular-nums font-black text-xs text-[#A44C5C]">
                            {Number(ord.totalPrice || 0).toLocaleString()} ر.س
                          </span>
                        </div>

                        <div className="text-[11px] text-gray-600 flex items-center justify-between">
                          <span>{ord.date || (ord.createdAt ? ord.createdAt.split('T')[0] : '-')}</span>
                          <span>{(ord.items || []).reduce((s, i) => s + (i.quantity || 1), 0)} قطعة</span>
                        </div>

                        <div className="text-[11px] text-gray-500 line-clamp-1">
                          {(ord.items || []).map((i) => `${i.productName} (${i.size})`).join('، ')}
                        </div>

                        {onSelectOrder && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomerKey(null);
                              onSelectOrder(ord);
                            }}
                            className="w-full min-h-[40px] mt-1 rounded-xl bg-gray-50 hover:bg-[#FCF5F6] border border-gray-200 text-xs font-bold text-gray-800 hover:text-[#A44C5C] flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>فتح تفاصيل الطلب</span>
                            <ArrowUpLeft size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
