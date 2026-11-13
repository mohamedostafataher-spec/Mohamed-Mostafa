import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Download,
  AlertTriangle,
  PackageCheck,
  Sparkles,
  Truck,
  MessageCircle,
  ShieldAlert,
  UserCheck,
  CheckSquare,
  Square,
  RotateCcw,
  Plus,
  Save,
  CheckCircle2,
  ShoppingBag,
  SlidersHorizontal,
  ExternalLink,
  Printer,
  Trash2
} from 'lucide-react';
import {
  Order,
  ShippingCarrier,
  TeamMember,
  WhatsAppEventKey,
  WhatsAppTemplateConfig
} from '../../types';
import { CanonicalAdminRole, canDeleteOrder, canUpdateOrderStatus } from '../../utils/rbac';
import {
  CanonicalOrderStage,
  DEFAULT_ORDERS_FILTERS,
  ORDER_STAGE_META,
  OrdersUrlFilters,
  analyzeOrderRisk,
  canTransitionOrderStatus,
  getOrderStageMeta,
  isOrderDelayed48h,
  normalizeOrderStage,
  parseOrdersUrlFilters,
  writeOrdersUrlFilters
} from '../../utils/orderPipeline';
import {
  DEFAULT_SHIPPING_CARRIERS,
  buildCarrierTrackingUrl,
  getCarrierDisplayName
} from '../../utils/shippingCarriers';
import {
  DEFAULT_EVENT_TEMPLATES,
  WhatsAppService
} from '../../services/whatsappService';
import { dbService } from '../../services/db';
import { AdminBadge, AdminButton, AdminEmptyState } from './AdminUI';
import AdminOrderDetailDrawer from './AdminOrderDetailDrawer';

type OrdersSubView = 'orders' | 'carriers' | 'abandoned' | 'whatsapp';

interface AdminOrdersProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  teamMembers: TeamMember[];
  abandonedLeads: any[];
  onUpdateLeadStatus: (leadId: string, isConverted: boolean) => void;
  adminRole: CanonicalAdminRole;
  adminName: string;
  selectedOrder: Order | null;
  setSelectedOrder: React.Dispatch<React.SetStateAction<Order | null>>;
  initialStatusFilter?: string;
  initialSearch?: string;
  renderReceiptImage: (path: string) => React.ReactNode;
  onUpdatePaymentStatus: (order: Order, nextStatus: Order['paymentStatus'], notes?: string) => Promise<void>;
  onRequestRejectOrder: (order: Order) => void;
  onRequestDeleteOrder: (orderId: string) => void;
  onPrintInvoice: (order: Order) => void;
  onCreateTestOrder: () => Promise<void>;
  isCreatingTestOrder: boolean;
  toast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const ALL_PIPELINE_FILTER_TABS: { id: string; label: string }[] = [
  { id: 'current', label: 'الحالية' },
  { id: 'all', label: 'الكل' },
  { id: 'pending', label: 'جديد' },
  { id: 'confirmed', label: 'مؤكد' },
  { id: 'processing', label: 'تجهيز' },
  { id: 'packed', label: 'تم التغليف' },
  { id: 'shipped', label: 'تم الشحن' },
  { id: 'out_for_delivery', label: 'مع المندوب' },
  { id: 'delivered', label: 'تم التسليم' },
  { id: 'failed', label: 'فشل توصيل' },
  { id: 'returned', label: 'مرتجع' },
  { id: 'cancelled', label: 'ملغي' }
];

const WHATSAPP_TEMPLATE_VARIABLES = [
  '{customerName}',
  '{orderId}',
  '{trackingNumber}',
  '{carrier}',
  '{carrierTrackUrl}',
  '{trackUrl}',
  '{totalPrice}',
  '{currency}',
  '{itemsList}',
  '{city}'
];

export default function AdminOrders({
  orders,
  setOrders,
  teamMembers,
  abandonedLeads,
  onUpdateLeadStatus,
  adminRole,
  adminName,
  selectedOrder,
  setSelectedOrder,
  initialStatusFilter,
  initialSearch,
  renderReceiptImage,
  onUpdatePaymentStatus,
  onRequestRejectOrder,
  onRequestDeleteOrder,
  onPrintInvoice,
  onCreateTestOrder,
  isCreatingTestOrder,
  toast
}: AdminOrdersProps) {
  const [subView, setSubView] = useState<OrdersSubView>('orders');
  const [filters, setFilters] = useState<OrdersUrlFilters>(() => {
    const fromUrl = parseOrdersUrlFilters();
    return {
      ...fromUrl,
      ...(initialStatusFilter && initialStatusFilter !== 'current' ? { status: initialStatusFilter } : {}),
      ...(initialSearch ? { q: initialSearch } : {})
    };
  });

  // Sync external initial props if triggered from Overview / Quick Search
  useEffect(() => {
    if (initialStatusFilter) {
      setFilters((prev) => ({ ...prev, status: initialStatusFilter }));
    }
  }, [initialStatusFilter]);

  useEffect(() => {
    if (initialSearch) {
      setFilters((prev) => ({ ...prev, q: initialSearch }));
    }
  }, [initialSearch]);

  // Persist active filters to URL query string
  useEffect(() => {
    writeOrdersUrlFilters(filters);
  }, [filters]);

  // Carriers & WhatsApp templates state
  const [carriers, setCarriers] = useState<ShippingCarrier[]>(DEFAULT_SHIPPING_CARRIERS);
  const [newCarrierId, setNewCarrierId] = useState('');
  const [newCarrierName, setNewCarrierName] = useState('');
  const [newCarrierUrl, setNewCarrierUrl] = useState('');
  const [isSavingCarriers, setIsSavingCarriers] = useState(false);

  const [waTemplates, setWaTemplates] = useState<Record<WhatsAppEventKey, WhatsAppTemplateConfig>>(
    () => WhatsAppService.getEventTemplates()
  );
  const [isSavingTemplates, setIsSavingTemplates] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkNextStage, setBulkNextStage] = useState<CanonicalOrderStage | ''>('');
  const [bulkAssignee, setBulkAssignee] = useState<string>('');
  const [isBulkRunning, setIsBulkRunning] = useState(false);

  useEffect(() => {
    dbService.getShippingCarriers().then(setCarriers).catch(() => {});
    dbService
      .getWhatsappTemplates()
      .then((tpls) => {
        setWaTemplates(tpls);
        WhatsAppService.saveEventTemplates(tpls);
      })
      .catch(() => {});
  }, []);

  // Precompute risk map once per orders change
  const riskMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof analyzeOrderRisk>>();
    orders.forEach((o) => {
      map.set(o.id, analyzeOrderRisk(o, orders));
    });
    return map;
  }, [orders]);

  const delayedOrdersCount = useMemo(
    () => orders.filter((o) => isOrderDelayed48h(o)).length,
    [orders]
  );

  const flaggedOrdersCount = useMemo(
    () => orders.filter((o) => riskMap.get(o.id)?.isFlagged).length,
    [orders, riskMap]
  );

  const consentedAbandonedLeads = useMemo(
    () => abandonedLeads.filter((l) => l && l.consentGiven !== false),
    [abandonedLeads]
  );

  const cities = useMemo(() => {
    const s = new Set<string>();
    orders.forEach((o) => {
      if (o.city && o.city.trim()) s.add(o.city.trim());
    });
    return Array.from(s);
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (filters.q.trim()) {
        const q = filters.q.trim().toLowerCase();
        const matchesId = order.id.toLowerCase().includes(q);
        const matchesName = order.customerName?.toLowerCase().includes(q) || false;
        const matchesPhone = order.phone?.toLowerCase().includes(q) || false;
        const matchesCity = order.city?.toLowerCase().includes(q) || false;
        const matchesTrack = order.trackingNumber?.toLowerCase().includes(q) || false;
        if (!matchesId && !matchesName && !matchesPhone && !matchesCity && !matchesTrack) {
          return false;
        }
      }

      if (filters.pay !== 'all' && (order.paymentStatus || 'pending') !== filters.pay) {
        return false;
      }

      if (filters.city !== 'all' && (order.city || 'الرياض') !== filters.city) {
        return false;
      }

      if (filters.carrier !== 'all') {
        const code = (order.shippingCarrierCode || order.shippingCarrier || '').toLowerCase();
        if (!code.includes(filters.carrier.toLowerCase())) return false;
      }

      if (filters.riskOnly && !riskMap.get(order.id)?.isFlagged) {
        return false;
      }

      const stage = normalizeOrderStage(order.status);
      if (filters.status === 'all') return true;
      if (filters.status === 'delayed') return isOrderDelayed48h(order);
      if (filters.status === 'current') {
        return ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery'].includes(stage);
      }

      return stage === filters.status;
    });
  }, [orders, filters, riskMap]);

  // Active drawer order bound to live orders state
  const liveSelectedOrder = useMemo(() => {
    if (!selectedOrder) return null;
    return orders.find((o) => o.id === selectedOrder.id) || selectedOrder;
  }, [orders, selectedOrder]);

  const handleUpdateOrder = async (updated: Order, toastMsg?: string) => {
    try {
      const payload: Order = { ...updated, updatedBy: adminName };
      await dbService.updateOrder(payload);
      setOrders((prev) => prev.map((o) => (o.id === payload.id ? payload : o)));
      if (selectedOrder?.id === payload.id) {
        setSelectedOrder(payload);
      }
      if (toastMsg) toast?.(toastMsg, 'success');
    } catch (err: any) {
      toast?.(`تعذر تحديث الطلب: ${err?.message || ''}`, 'error');
    }
  };

  const handleTransitionOrder = async (order: Order, nextStage: CanonicalOrderStage, note?: string) => {
    if (!canTransitionOrderStatus(order.status, nextStage, adminRole)) {
      toast?.('هذا الانتقال غير مسموح وفق مسار الحالات أو صلاحيتك الحالية', 'error');
      return;
    }

    const updated: Order = {
      ...order,
      status: nextStage,
      updatedBy: adminName,
      statusChangeNotes: note,
      fulfillmentStatus:
        nextStage === 'delivered'
          ? 'delivered'
          : nextStage === 'shipped' || nextStage === 'out_for_delivery'
          ? 'shipped'
          : nextStage === 'packed'
          ? 'ready_for_pickup'
          : nextStage === 'processing'
          ? 'processing'
          : order.fulfillmentStatus
    };

    await handleUpdateOrder(
      updated,
      `تم نقل الطلب #${order.id.slice(0, 8)} إلى: ${ORDER_STAGE_META[nextStage].shortLabel}`
    );
  };

  // CSV Export (selected orders if any checked, otherwise filteredOrders)
  const handleExportCsv = (targetOrders: Order[]) => {
    if (targetOrders.length === 0) {
      toast?.('لا توجد طلبات للتصدير حالياً', 'info');
      return;
    }

    const headers = [
      'رقم الطلب',
      'التاريخ',
      'اسم العميلة',
      'رقم الجوال',
      'المدينة',
      'العنوان',
      'طريقة الدفع',
      'حالة الدفع',
      'الحالة',
      'شركة الشحن',
      'رقم التتبع',
      'المسؤول',
      'إجمالي المبلغ (ر.س)',
      'عدد القطع',
      'تفاصيل القطع',
      'ملاحظات'
    ];

    const rows = targetOrders.map((o) => {
      const itemsSummary = (o.items || [])
        .map((i) => `${i.productName || 'منتج'} (${i.color || ''} ${i.size || ''} x${i.quantity || 1})`)
        .join(' + ');

      return [
        o.id,
        o.date || (o.createdAt ? o.createdAt.split('T')[0] : ''),
        `"${(o.customerName || '').replace(/"/g, '""')}"`,
        `"${(o.phone || '').replace(/"/g, '""')}"`,
        `"${(o.city || 'الرياض').replace(/"/g, '""')}"`,
        `"${(o.address || '').replace(/"/g, '""')}"`,
        `"${(o.paymentMethod || '').replace(/"/g, '""')}"`,
        `"${o.paymentStatus || 'pending'}"`,
        `"${getOrderStageMeta(o.status).shortLabel}"`,
        `"${getCarrierDisplayName(o, carriers).replace(/"/g, '""')}"`,
        `"${(o.trackingNumber || '').replace(/"/g, '""')}"`,
        `"${(o.assignedTo || '').replace(/"/g, '""')}"`,
        o.totalPrice,
        (o.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0),
        `"${itemsSummary.replace(/"/g, '""')}"`,
        `"${(o.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Sulta_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast?.(`تم تصدير ${targetOrders.length} طلب إلى ملف CSV بنجاح`, 'success');
  };

  // Bulk handlers
  const allFilteredSelected =
    filteredOrders.length > 0 && filteredOrders.every((o) => selectedIds.includes(o.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map((o) => o.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleBulkStatusApply = async () => {
    if (!bulkNextStage || selectedIds.length === 0) return;
    setIsBulkRunning(true);
    let updatedCount = 0;
    let skippedCount = 0;

    try {
      for (const id of selectedIds) {
        const target = orders.find((o) => o.id === id);
        if (!target) continue;
        if (!canTransitionOrderStatus(target.status, bulkNextStage, adminRole)) {
          skippedCount += 1;
          continue;
        }
        await handleTransitionOrder(target, bulkNextStage, 'تحديث جماعي');
        updatedCount += 1;
      }
      toast?.(
        `تم تحديث ${updatedCount} طلب${skippedCount > 0 ? ` وتجاوز ${skippedCount} لتعارض مسار الحالة` : ''}`,
        updatedCount > 0 ? 'success' : 'info'
      );
      setBulkNextStage('');
      setSelectedIds([]);
    } finally {
      setIsBulkRunning(false);
    }
  };

  const handleBulkAssignApply = async () => {
    if (!bulkAssignee || selectedIds.length === 0) return;
    setIsBulkRunning(true);
    try {
      for (const id of selectedIds) {
        const target = orders.find((o) => o.id === id);
        if (!target) continue;
        await handleUpdateOrder({ ...target, assignedTo: bulkAssignee });
      }
      toast?.(`تم تعيين ${selectedIds.length} طلب إلى ${bulkAssignee}`, 'success');
      setBulkAssignee('');
      setSelectedIds([]);
    } finally {
      setIsBulkRunning(false);
    }
  };

  // Carriers management
  const handleAddCarrier = () => {
    const cleanId = newCarrierId.trim().replace(/\s+/g, '_') || `CARRIER_${Date.now()}`;
    if (!newCarrierName.trim()) {
      toast?.('يرجى كتابة اسم شركة الشحن بالعربي', 'error');
      return;
    }
    const next: ShippingCarrier[] = [
      ...carriers.filter((c) => c.id !== cleanId),
      {
        id: cleanId,
        nameAr: newCarrierName.trim(),
        trackingUrlTemplate: newCarrierUrl.trim(),
        isActive: true
      }
    ];
    setCarriers(next);
    setNewCarrierId('');
    setNewCarrierName('');
    setNewCarrierUrl('');
  };

  const handleSaveCarriers = async () => {
    setIsSavingCarriers(true);
    try {
      await dbService.saveShippingCarriers(carriers);
      toast?.('تم حفظ جدول شركات الشحن وروابط التتبع بنجاح', 'success');
    } catch (err: any) {
      toast?.(`تعذر حفظ شركات الشحن: ${err?.message || ''}`, 'error');
    } finally {
      setIsSavingCarriers(false);
    }
  };

  const handleSaveAllWaTemplates = async () => {
    setIsSavingTemplates(true);
    try {
      await dbService.saveWhatsappTemplates(waTemplates);
      toast?.('تم حفظ كافة قوالب الواتساب بنجاح 💬', 'success');
    } catch (err: any) {
      toast?.(`تعذر حفظ القوالب: ${err?.message || ''}`, 'error');
    } finally {
      setIsSavingTemplates(false);
    }
  };

  const hasActiveFilters =
    filters.q !== '' ||
    filters.status !== 'current' ||
    filters.pay !== 'all' ||
    filters.city !== 'all' ||
    filters.carrier !== 'all' ||
    filters.riskOnly;

  return (
    <div className="space-y-5 animate-fade-in-rapid" dir="rtl">
      {/* Sub-navigation bar inside Orders Operations */}
      <div className="bg-white rounded-2xl p-2 border border-gray-200 shadow-2xs flex flex-wrap items-center gap-1.5">
        {[
          { id: 'orders', label: `الطلبات (${orders.length})`, icon: <PackageCheck size={15} /> },
          { id: 'carriers', label: `شركات الشحن (${carriers.filter((c) => c.isActive).length})`, icon: <Truck size={15} /> },
          {
            id: 'abandoned',
            label: `السلات المتروكة (${consentedAbandonedLeads.filter((l) => !l.converted).length})`,
            icon: <ShoppingBag size={15} />
          },
          { id: 'whatsapp', label: 'قوالب الواتساب المجانية', icon: <MessageCircle size={15} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubView(tab.id as OrdersSubView)}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              subView === tab.id
                ? 'bg-[#A44C5C] text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ======================================================= */}
      {/* SUBVIEW 1: ORDERS PIPELINE, FILTERS, BULK & RISK */}
      {/* ======================================================= */}
      {subView === 'orders' && (
        <div className="space-y-4">
          {/* Delayed Alert Banner */}
          {delayedOrdersCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300">
                  <AlertTriangle size={19} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">تنبيه تأخر شحن (&gt; 48 ساعة)</h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    يوجد <strong className="font-mono">{delayedOrdersCount}</strong> طلب لم يُشحن بعد منذ أكثر من 48 ساعة.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, status: 'delayed' }))}
                className="min-h-[44px] bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer shrink-0"
              >
                عرض الطلبات المتأخرة ({delayedOrdersCount})
              </button>
            </div>
          )}

          {/* Advanced Search & URL-Persisted Filters */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs space-y-3.5">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1 max-w-xl">
                <input
                  type="text"
                  placeholder="ابحثي برقم الطلب، اسم العميلة، الجوال، المدينة، أو رقم التتبع..."
                  value={filters.q}
                  onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
                  className="w-full min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl py-2 pr-9 pl-4 text-xs focus:bg-white focus:outline-none focus:border-[#A44C5C] transition-all"
                />
                <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              <div className="flex items-center flex-wrap gap-2">
                {/* City Select */}
                <select
                  value={filters.city}
                  onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value }))}
                  aria-label="تصفية حسب المدينة"
                  className="min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 text-xs font-bold text-gray-700 outline-none cursor-pointer"
                >
                  <option value="all">كل المدن</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* Carrier Select */}
                <select
                  value={filters.carrier}
                  onChange={(e) => setFilters((prev) => ({ ...prev, carrier: e.target.value }))}
                  aria-label="تصفية حسب شركة الشحن"
                  className="min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 text-xs font-bold text-gray-700 outline-none cursor-pointer"
                >
                  <option value="all">كل شركات الشحن</option>
                  {carriers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr}
                    </option>
                  ))}
                </select>

                {/* Duplicate / Suspicious toggle */}
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, riskOnly: !prev.riskOnly }))}
                  className={`min-h-[44px] px-3.5 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    filters.riskOnly
                      ? 'bg-rose-600 text-white border-rose-600'
                      : flaggedOrdersCount > 0
                      ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  <ShieldAlert size={14} />
                  <span>مكرر/مشبوه ({flaggedOrdersCount})</span>
                </button>

                {/* CSV Export */}
                <button
                  type="button"
                  onClick={() =>
                    handleExportCsv(
                      selectedIds.length > 0
                        ? filteredOrders.filter((o) => selectedIds.includes(o.id))
                        : filteredOrders
                    )
                  }
                  className="min-h-[44px] bg-emerald-700 hover:bg-emerald-800 text-white px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download size={14} />
                  <span>{selectedIds.length > 0 ? `تصدير المحدد (${selectedIds.length})` : 'تصدير CSV'}</span>
                </button>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => setFilters(DEFAULT_ORDERS_FILTERS)}
                    className="min-h-[44px] px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    title="إعادة ضبط الفلاتر"
                  >
                    <RotateCcw size={13} />
                    <span>مسح الفلاتر</span>
                  </button>
                )}
              </div>
            </div>

            {/* Pipeline Status Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {ALL_PIPELINE_FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, status: tab.id }))}
                  className={`min-h-[38px] px-3 py-1.5 rounded-xl font-bold shrink-0 cursor-pointer transition-colors ${
                    filters.status === tab.id
                      ? 'bg-[#A44C5C] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              {delayedOrdersCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, status: 'delayed' }))}
                  className={`min-h-[38px] px-3 py-1.5 rounded-xl font-bold shrink-0 cursor-pointer transition-colors ${
                    filters.status === 'delayed'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  متأخرة ({delayedOrdersCount})
                </button>
              )}
            </div>

            {/* Payment Status Filter Chips */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] pt-1 border-t border-gray-100">
              <span className="text-gray-500 font-bold flex items-center gap-1 ml-1">
                <SlidersHorizontal size={12} />
                <span>حالة الدفع:</span>
              </span>
              {[
                { id: 'all', label: 'الكل' },
                { id: 'paid', label: 'مدفوع' },
                { id: 'pending', label: 'بانتظار التأكيد' },
                { id: 'rejected', label: 'مرفوض' },
                { id: 'refunded', label: 'مسترجع' }
              ].map((ps) => (
                <button
                  key={ps.id}
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, pay: ps.id }))}
                  className={`min-h-[34px] px-2.5 py-1 rounded-lg font-bold border cursor-pointer ${
                    filters.pay === ps.id
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {ps.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedIds.length > 0 && (
            <div className="bg-[#FCF5F6] border border-[#DF8A9D]/40 rounded-2xl p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-[#A44C5C]">
                <CheckSquare size={16} />
                <span>تم تحديد {selectedIds.length} طلب</span>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-gray-600 underline hover:text-black cursor-pointer mr-2"
                >
                  إلغاء التحديد
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {canUpdateOrderStatus(adminRole) && (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={bulkNextStage}
                      onChange={(e) => setBulkNextStage(e.target.value as CanonicalOrderStage)}
                      aria-label="تغيير حالة الطلبات المحددة"
                      className="min-h-[42px] bg-white border border-gray-300 rounded-xl px-2.5 text-xs font-bold text-gray-800 outline-none"
                    >
                      <option value="">نقل الحالة جماعياً إلى...</option>
                      {(['confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'] as CanonicalOrderStage[]).map(
                        (st) => (
                          <option key={st} value={st}>
                            {ORDER_STAGE_META[st].shortLabel}
                          </option>
                        )
                      )}
                    </select>
                    <AdminButton
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={!bulkNextStage || isBulkRunning}
                      loading={isBulkRunning}
                      onClick={handleBulkStatusApply}
                    >
                      تطبيق
                    </AdminButton>
                  </div>
                )}

                {teamMembers.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={bulkAssignee}
                      onChange={(e) => setBulkAssignee(e.target.value)}
                      aria-label="تعيين مسؤول للطلبات المحددة"
                      className="min-h-[42px] bg-white border border-gray-300 rounded-xl px-2.5 text-xs font-bold text-gray-800 outline-none"
                    >
                      <option value="">تعيين مسؤول جماعي...</option>
                      {teamMembers.map((m) => (
                        <option key={m.id || m.email} value={m.name || m.email}>
                          {m.name || m.email}
                        </option>
                      ))}
                    </select>
                    <AdminButton
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={!bulkAssignee || isBulkRunning}
                      onClick={handleBulkAssignApply}
                    >
                      <UserCheck size={14} />
                      <span>تعيين</span>
                    </AdminButton>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Orders List / Empty State */}
          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 text-center space-y-4 shadow-2xs">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
                <PackageCheck size={32} />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="font-black text-gray-950 text-base sm:text-lg">
                  لا توجد طلبات مسجلة حتى الآن
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  بمجرد إتمام أي عميلة لطلبها من المتجر سيظهر هنا فوراً لإدارته وشحنه.
                </p>
              </div>
              <button
                type="button"
                onClick={onCreateTestOrder}
                disabled={isCreatingTestOrder}
                className="min-h-[44px] bg-[#A44C5C] hover:bg-[#8D3E4D] text-white px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Sparkles size={14} />
                <span>{isCreatingTestOrder ? 'جاري الإنشاء...' : 'إنشاء طلب تجريبي للفحص'}</span>
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <AdminEmptyState
              icon={<Search size={24} />}
              title="لا توجد طلبات تطابق البحث أو الفلاتر الحالية"
              description="جرّبي تعديل شروط البحث أو مسح الفلاتر."
              action={
                <AdminButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setFilters(DEFAULT_ORDERS_FILTERS)}
                >
                  مسح الفلاتر
                </AdminButton>
              }
            />
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-150 flex items-center justify-between text-xs bg-gray-50/70">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="min-h-[40px] inline-flex items-center gap-2 font-bold text-gray-800 cursor-pointer"
                >
                  {allFilteredSelected ? (
                    <CheckSquare size={16} className="text-[#A44C5C]" />
                  ) : (
                    <Square size={16} className="text-gray-400" />
                  )}
                  <span>تحديد الكل ({filteredOrders.length})</span>
                </button>
                <span className="text-gray-500 font-mono">
                  المعروض: {filteredOrders.length} من {orders.length}
                </span>
              </div>

              {/* Mobile Cards View */}
              <div className="divide-y divide-gray-100 lg:hidden">
                {filteredOrders.map((order) => {
                  const stageMeta = getOrderStageMeta(order.status);
                  const risk = riskMap.get(order.id);
                  const isDelayed = isOrderDelayed48h(order);
                  const isChecked = selectedIds.includes(order.id);

                  return (
                    <div
                      key={order.id}
                      className={`p-4 space-y-3 transition-colors ${
                        isDelayed ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => toggleSelectOne(order.id)}
                            aria-label={`تحديد طلب ${order.id}`}
                            className="min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                          >
                            {isChecked ? (
                              <CheckSquare size={18} className="text-[#A44C5C]" />
                            ) : (
                              <Square size={18} className="text-gray-400" />
                            )}
                          </button>
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="font-mono font-black text-sm text-gray-950 hover:text-[#A44C5C] cursor-pointer"
                            >
                              #{order.id.slice(0, 8)}
                            </button>
                            <div className="text-xs font-bold text-gray-800">{order.customerName}</div>
                            <div className="text-[11px] font-mono text-gray-500" dir="ltr">
                              {order.phone} · {order.city}
                            </div>
                          </div>
                        </div>

                        <div className="text-left">
                          <span className="font-mono tabular-nums font-black text-sm text-[#A44C5C] block">
                            {Number(order.totalPrice || 0).toLocaleString()} ر.س
                          </span>
                          <span className="text-[10.5px] text-gray-500 font-mono">
                            {order.date || '-'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className={`px-2.5 py-0.5 rounded-md font-bold border ${stageMeta.colorClass}`}>
                          {stageMeta.label}
                        </span>
                        <AdminBadge
                          tone={
                            order.paymentStatus === 'paid'
                              ? 'success'
                              : order.paymentStatus === 'rejected'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {order.paymentStatus === 'paid'
                            ? 'مدفوع'
                            : order.paymentStatus === 'rejected'
                            ? 'مرفوض'
                            : 'بانتظار التأكيد'}
                        </AdminBadge>
                        {risk?.isFlagged && (
                          <AdminBadge tone="danger">
                            {risk.reasons[0]?.label || 'تنبيه'}
                          </AdminBadge>
                        )}
                        {isDelayed && <AdminBadge tone="warning">متأخر &gt;48س</AdminBadge>}
                        {order.assignedTo && <AdminBadge tone="info">{order.assignedTo}</AdminBadge>}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <AdminButton
                          type="button"
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedOrder(order)}
                        >
                          إدارة الطلب والتفاصيل
                        </AdminButton>
                        <button
                          type="button"
                          onClick={() => onPrintInvoice(order)}
                          aria-label="طباعة الفاتورة"
                          className="min-w-[44px] min-h-[44px] rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center justify-center cursor-pointer"
                        >
                          <Printer size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-gray-100/70 text-gray-600 border-b border-gray-200 font-bold text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4 w-10"></th>
                      <th className="py-3.5 px-4">الطلب</th>
                      <th className="py-3.5 px-4">العميلة والجوال</th>
                      <th className="py-3.5 px-4">الحالة والتنبيهات</th>
                      <th className="py-3.5 px-4">الدفع</th>
                      <th className="py-3.5 px-4">الشحن والتتبع</th>
                      <th className="py-3.5 px-4">المسؤول</th>
                      <th className="py-3.5 px-4 text-center">الإجمالي</th>
                      <th className="py-3.5 px-4 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.map((order) => {
                      const stageMeta = getOrderStageMeta(order.status);
                      const risk = riskMap.get(order.id);
                      const isDelayed = isOrderDelayed48h(order);
                      const isChecked = selectedIds.includes(order.id);
                      const carrierTrackUrl = buildCarrierTrackingUrl(
                        order.shippingCarrierCode || order.shippingCarrier,
                        order.trackingNumber,
                        carriers
                      );

                      return (
                        <tr
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className={`hover:bg-gray-50/90 transition-colors cursor-pointer ${
                            isDelayed ? 'bg-amber-50/35' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => toggleSelectOne(order.id)}
                              aria-label={`تحديد طلب ${order.id}`}
                              className="min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                            >
                              {isChecked ? (
                                <CheckSquare size={17} className="text-[#A44C5C]" />
                              ) : (
                                <Square size={17} className="text-gray-400" />
                              )}
                            </button>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-mono font-black text-gray-950">#{order.id.slice(0, 8)}</div>
                            <div className="text-[11px] font-mono text-gray-500 mt-0.5">{order.date || '-'}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-950">{order.customerName}</div>
                            <div className="text-[11px] font-mono text-gray-600" dir="ltr">
                              {order.phone || '-'}
                            </div>
                            <div className="text-[11px] text-gray-500">{order.city || 'الرياض'}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-col items-start gap-1">
                              <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${stageMeta.colorClass}`}>
                                {stageMeta.label}
                              </span>
                              {risk?.isFlagged && (
                                <span
                                  title={risk.reasons.map((r) => r.detail).join('\n')}
                                  className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold inline-flex items-center gap-1"
                                >
                                  <ShieldAlert size={11} />
                                  <span>{risk.reasons[0]?.label}</span>
                                </span>
                              )}
                              {isDelayed && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                                  تأخر &gt;48س
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <AdminBadge
                                tone={
                                  order.paymentStatus === 'paid'
                                    ? 'success'
                                    : order.paymentStatus === 'rejected'
                                    ? 'danger'
                                    : 'warning'
                                }
                              >
                                {order.paymentStatus === 'paid'
                                  ? 'مدفوع'
                                  : order.paymentStatus === 'rejected'
                                  ? 'مرفوض'
                                  : 'بانتظار التأكيد'}
                              </AdminBadge>
                              <div className="text-[10.5px] text-gray-500 truncate max-w-[130px]">
                                {order.paymentMethod || '-'}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                            <div className="text-[11px] font-bold text-gray-800">
                              {order.shippingCarrier || order.shippingCarrierCode
                                ? getCarrierDisplayName(order, carriers)
                                : 'غير محدد'}
                            </div>
                            {order.trackingNumber ? (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="font-mono text-[11px] text-gray-600" dir="ltr">
                                  {order.trackingNumber}
                                </span>
                                {carrierTrackUrl && (
                                  <a
                                    href={carrierTrackUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="تتبع لدى شركة الشحن"
                                    className="text-indigo-600 hover:text-indigo-800"
                                  >
                                    <ExternalLink size={12} />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-400">بدون رقم تتبع</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="text-[11px] font-bold text-gray-700">
                              {order.assignedTo || <span className="text-gray-400">غير معين</span>}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center font-mono tabular-nums font-black text-[#A44C5C]">
                            {Number(order.totalPrice || 0).toLocaleString()} ر.س
                          </td>

                          <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className="min-h-[40px] px-3 rounded-xl bg-[#FCF5F6] hover:bg-[#A44C5C] text-[#A44C5C] hover:text-white border border-[#DF8A9D]/40 text-xs font-bold transition-colors cursor-pointer"
                              >
                                التفاصيل
                              </button>
                              <button
                                type="button"
                                onClick={() => onPrintInvoice(order)}
                                title="طباعة الفاتورة"
                                aria-label="طباعة الفاتورة"
                                className="min-w-[40px] min-h-[40px] rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 inline-flex items-center justify-center cursor-pointer"
                              >
                                <Printer size={14} />
                              </button>
                              {canDeleteOrder(adminRole) && (
                                <button
                                  type="button"
                                  onClick={() => onRequestDeleteOrder(order.id)}
                                  title="حذف الطلب"
                                  aria-label="حذف الطلب"
                                  className="min-w-[40px] min-h-[40px] rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 inline-flex items-center justify-center cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================= */}
      {/* SUBVIEW 2: SHIPPING CARRIERS TABLE */}
      {/* ======================================================= */}
      {subView === 'carriers' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-150">
            <div>
              <h3 className="font-bold text-base text-gray-950 flex items-center gap-2">
                <Truck size={18} className="text-[#A44C5C]" />
                <span>جدول شركات الشحن وقوالب روابط التتبع</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                استخدمي المتغير <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">{'{tracking}'}</code> ليتم استبداله تلقائياً برقم تتبع العميلة.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AdminButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setCarriers(DEFAULT_SHIPPING_CARRIERS)}
              >
                <RotateCcw size={14} />
                <span>استعادة الافتراضي</span>
              </AdminButton>
              <AdminButton
                type="button"
                variant="primary"
                size="sm"
                loading={isSavingCarriers}
                onClick={handleSaveCarriers}
              >
                <Save size={14} />
                <span>حفظ الشركات</span>
              </AdminButton>
            </div>
          </div>

          {/* Carriers List */}
          <div className="space-y-3">
            {carriers.map((carrier, idx) => (
              <div
                key={carrier.id}
                className="p-4 rounded-2xl border border-gray-200 bg-gray-50/60 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
              >
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">الكود</label>
                  <input
                    type="text"
                    value={carrier.id}
                    disabled
                    className="w-full min-h-[40px] bg-gray-100 border border-gray-200 rounded-xl px-3 text-xs font-mono text-gray-700"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">اسم الشركة</label>
                  <input
                    type="text"
                    value={carrier.nameAr}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCarriers((prev) => prev.map((c, i) => (i === idx ? { ...c, nameAr: val } : c)));
                    }}
                    className="w-full min-h-[40px] bg-white border border-gray-200 rounded-xl px-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#A44C5C]"
                  />
                </div>
                <div className="md:col-span-5">
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">قالب رابط التتبع</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={carrier.trackingUrlTemplate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCarriers((prev) =>
                        prev.map((c, i) => (i === idx ? { ...c, trackingUrlTemplate: val } : c))
                      );
                    }}
                    className="w-full min-h-[40px] bg-white border border-gray-200 rounded-xl px-3 text-xs font-mono text-gray-800 focus:outline-none focus:border-[#A44C5C]"
                  />
                </div>
                <div className="md:col-span-2 flex items-center justify-end gap-2 pt-4 md:pt-0">
                  <button
                    type="button"
                    onClick={() =>
                      setCarriers((prev) =>
                        prev.map((c, i) => (i === idx ? { ...c, isActive: !c.isActive } : c))
                      )
                    }
                    className={`min-h-[40px] px-3 rounded-xl text-xs font-bold cursor-pointer border ${
                      carrier.isActive
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}
                  >
                    {carrier.isActive ? 'نشطة' : 'متوقفة'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Carrier */}
          <div className="p-4 rounded-2xl border-2 border-dashed border-gray-200 bg-white space-y-3">
            <h4 className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
              <Plus size={14} className="text-[#A44C5C]" />
              <span>إضافة شركة شحن جديدة</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <input
                type="text"
                value={newCarrierId}
                onChange={(e) => setNewCarrierId(e.target.value)}
                placeholder="الكود (مثال: AYMAK)"
                dir="ltr"
                className="md:col-span-2 min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 text-xs font-mono"
              />
              <input
                type="text"
                value={newCarrierName}
                onChange={(e) => setNewCarrierName(e.target.value)}
                placeholder="اسم الشركة بالعربي"
                className="md:col-span-4 min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 text-xs"
              />
              <input
                type="text"
                value={newCarrierUrl}
                onChange={(e) => setNewCarrierUrl(e.target.value)}
                placeholder="https://carrier.com/track/{tracking}"
                dir="ltr"
                className="md:col-span-4 min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 text-xs font-mono"
              />
              <AdminButton
                type="button"
                variant="secondary"
                className="md:col-span-2"
                onClick={handleAddCarrier}
              >
                <Plus size={14} />
                <span>إضافة</span>
              </AdminButton>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* SUBVIEW 3: CONSENTED ABANDONED CARTS */}
      {/* ======================================================= */}
      {subView === 'abandoned' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-150">
            <div>
              <h3 className="font-bold text-base text-gray-950 flex items-center gap-2">
                <ShoppingBag size={18} className="text-[#A44C5C]" />
                <span>السلات المتروكة (بموافقة الخصوصية)</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                يتم تسجيل السلة المتروكة فقط بعد موافقة العميلة الصريحة في نموذج الطلب، مع زر تذكير مجاني عبر wa.me.
              </p>
            </div>
            <AdminBadge tone="brand">
              {consentedAbandonedLeads.filter((l) => !l.converted).length} بانتظار التذكير
            </AdminBadge>
          </div>

          {consentedAbandonedLeads.length === 0 ? (
            <AdminEmptyState
              icon={<ShoppingBag size={24} />}
              title="لا توجد سلات متروكة مسجلة بموافقة العميلات"
              description="عند اختيار العميلة خيار الموافقة على إشعارات الواتساب دون إكمال الدفع، ستظهر سلتها هنا للتذكير."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {consentedAbandonedLeads.map((lead) => {
                const itemsSummary =
                  lead.items?.map((it: any) => `• ${it.productName || 'منتج'} (${it.size || '-'}) × ${it.quantity || 1}`).join('\n') ||
                  'قطع سولته المختارة';

                const abandonedBody = waTemplates.abandoned?.body || DEFAULT_EVENT_TEMPLATES.abandoned.body;
                const message = abandonedBody
                  .replace(/\{customerName\}/g, lead.customerName || 'العميلة الكريمة')
                  .replace(/\{itemsList\}/g, itemsSummary)
                  .replace(/\{totalPrice\}/g, Number(lead.totalAmount || 0).toLocaleString())
                  .replace(/\{currency\}/g, 'ر.س')
                  .replace(/\{city\}/g, lead.city || 'السعودية');

                const waUrl = WhatsAppService.buildWhatsAppUrl(lead.phone || '', message);

                return (
                  <div
                    key={lead.id}
                    className={`p-4 rounded-2xl border space-y-3 ${
                      lead.converted
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-[#FAF8F8] border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-gray-950">{lead.customerName || 'عميلة'}</h4>
                        <p className="text-xs font-mono text-gray-600" dir="ltr">
                          {lead.phone} · {lead.city || 'السعودية'}
                        </p>
                      </div>
                      <div className="text-left">
                        <span className="font-mono font-black text-sm text-[#A44C5C] block">
                          {Number(lead.totalAmount || 0).toLocaleString()} ر.س
                        </span>
                        <AdminBadge tone={lead.converted ? 'success' : lead.contacted ? 'info' : 'warning'}>
                          {lead.converted ? 'تم التحويل لطلب' : lead.contacted ? 'تم التذكير' : 'جديدة'}
                        </AdminBadge>
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-700 bg-white p-2.5 rounded-xl border border-gray-200 whitespace-pre-line">
                      {itemsSummary}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          if (!lead.converted) onUpdateLeadStatus(lead.id, false);
                        }}
                        className="flex-1 min-h-[44px] bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle size={15} />
                        <span>تذكير واتساب (wa.me)</span>
                      </a>

                      {!lead.converted && (
                        <button
                          type="button"
                          onClick={() => onUpdateLeadStatus(lead.id, true)}
                          className="min-h-[44px] px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 size={14} />
                          <span>تحويل لمكتملة</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================= */}
      {/* SUBVIEW 4: FREE WHATSAPP TEMPLATES MANAGER */}
      {/* ======================================================= */}
      {subView === 'whatsapp' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-150">
            <div>
              <h3 className="font-bold text-base text-gray-950 flex items-center gap-2">
                <MessageCircle size={18} className="text-[#25D366]" />
                <span>قوالب رسائل الواتساب العربية (wa.me مجاني 100%)</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                عدّلي القوالب حسب أسلوب سولته، واستخدميها بنقرة واحدة من داخل أي طلب أو سلة متروكة.
              </p>
            </div>
            <AdminButton
              type="button"
              variant="primary"
              size="sm"
              loading={isSavingTemplates}
              onClick={handleSaveAllWaTemplates}
            >
              <Save size={14} />
              <span>حفظ جميع القوالب</span>
            </AdminButton>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="font-bold text-gray-700 ml-1">المتغيرات المتاحة:</span>
            {WHATSAPP_TEMPLATE_VARIABLES.map((v) => (
              <code
                key={v}
                className="px-2 py-0.5 rounded-md bg-white border border-gray-200 font-mono text-[#A44C5C] font-bold"
              >
                {v}
              </code>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(Object.keys(DEFAULT_EVENT_TEMPLATES) as WhatsAppEventKey[]).map((key) => {
              const tpl = waTemplates[key] || DEFAULT_EVENT_TEMPLATES[key];
              return (
                <div key={key} className="p-4 rounded-2xl border border-gray-200 bg-[#FAF8F8] space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-gray-950">{tpl.titleAr}</h4>
                      <p className="text-[11px] text-gray-500">{tpl.descriptionAr}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setWaTemplates((prev) => ({
                          ...prev,
                          [key]: { ...DEFAULT_EVENT_TEMPLATES[key] }
                        }))
                      }
                      className="min-h-[36px] px-2.5 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-[11px] font-bold text-gray-700 cursor-pointer"
                    >
                      استعادة
                    </button>
                  </div>

                  <textarea
                    value={tpl.body}
                    onChange={(e) => {
                      const body = e.target.value;
                      setWaTemplates((prev) => ({
                        ...prev,
                        [key]: { ...tpl, body }
                      }));
                    }}
                    rows={6}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs leading-relaxed focus:outline-none focus:border-[#A44C5C]"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order Detail Drawer */}
      {liveSelectedOrder && (
        <AdminOrderDetailDrawer
          order={liveSelectedOrder}
          allOrders={orders}
          carriers={carriers}
          teamMembers={teamMembers}
          adminRole={adminRole}
          adminName={adminName}
          renderReceiptImage={renderReceiptImage}
          onClose={() => setSelectedOrder(null)}
          onUpdateOrder={handleUpdateOrder}
          onTransitionStatus={handleTransitionOrder}
          onVerifyPayment={(ord) => onUpdatePaymentStatus(ord, 'paid')}
          onRequestRejectPayment={onRequestRejectOrder}
          onRequestDeleteOrder={onRequestDeleteOrder}
          onPrintInvoice={onPrintInvoice}
          onOpenRelatedOrder={(relatedId) => {
            const found = orders.find((o) => o.id === relatedId);
            if (found) setSelectedOrder(found);
          }}
          toast={toast}
        />
      )}
    </div>
  );
}
