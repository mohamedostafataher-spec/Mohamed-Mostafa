import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Truck,
  MessageCircle,
  Copy,
  Printer,
  FileDown,
  ShieldAlert,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Phone,
  Send,
  FileText,
  Trash2,
  ArrowLeft,
  Save
} from 'lucide-react';
import { Order, ShippingCarrier, TeamMember, WhatsAppEventKey } from '../../types';
import { CanonicalAdminRole, canDeleteOrder, canUpdateOrderStatus, canViewCostPrice } from '../../utils/rbac';
import {
  CanonicalOrderStage,
  MAIN_PIPELINE_SEQUENCE,
  ORDER_STAGE_META,
  analyzeOrderRisk,
  canTransitionOrderStatus,
  getAllowedNextStatuses,
  getOrderStageMeta,
  normalizeOrderStage
} from '../../utils/orderPipeline';
import {
  buildCarrierTrackingUrl,
  generateShippingWaybillPdf,
  getCarrierDisplayName
} from '../../utils/shippingCarriers';
import { DEFAULT_EVENT_TEMPLATES, WhatsAppService } from '../../services/whatsappService';
import { dbService } from '../../services/db';
import { AdminBadge, AdminButton } from './AdminUI';

interface AdminOrderDetailDrawerProps {
  order: Order;
  allOrders: Order[];
  carriers: ShippingCarrier[];
  teamMembers: TeamMember[];
  adminRole: CanonicalAdminRole;
  adminName: string;
  renderReceiptImage: (path: string) => React.ReactNode;
  onClose: () => void;
  onUpdateOrder: (updated: Order, toastMsg?: string) => Promise<void>;
  onTransitionStatus: (order: Order, nextStage: CanonicalOrderStage, note?: string) => Promise<void>;
  onVerifyPayment: (order: Order) => Promise<void>;
  onRequestRejectPayment: (order: Order) => void;
  onRequestDeleteOrder: (orderId: string) => void;
  onPrintInvoice: (order: Order) => void;
  onOpenRelatedOrder: (orderId: string) => void;
  toast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const WHATSAPP_EVENTS_ORDER: WhatsAppEventKey[] = [
  'confirmed',
  'shipped',
  'delivered',
  'reminder',
  'review'
];

export default function AdminOrderDetailDrawer({
  order,
  allOrders,
  carriers,
  teamMembers,
  adminRole,
  adminName,
  renderReceiptImage,
  onClose,
  onUpdateOrder,
  onTransitionStatus,
  onVerifyPayment,
  onRequestRejectPayment,
  onRequestDeleteOrder,
  onPrintInvoice,
  onOpenRelatedOrder,
  toast
}: AdminOrderDetailDrawerProps) {
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [trackingNumberDraft, setTrackingNumberDraft] = useState(order.trackingNumber || '');
  const [carrierCodeDraft, setCarrierCodeDraft] = useState(
    order.shippingCarrierCode || order.shippingCarrier || carriers[0]?.id || 'SMSA'
  );
  const [customCarrierDraft, setCustomCarrierDraft] = useState(order.shippingCarrier || '');
  const [shippingCostDraft, setShippingCostDraft] = useState(String(order.shippingCost ?? ''));
  const [adminNotesDraft, setAdminNotesDraft] = useState(order.adminNotes || '');
  const [transitionNoteDraft, setTransitionNoteDraft] = useState('');

  const [activeWaEvent, setActiveWaEvent] = useState<WhatsAppEventKey>('confirmed');
  const [waMessageDraft, setWaMessageDraft] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSavingFields, setIsSavingFields] = useState(false);

  const currentStage = normalizeOrderStage(order.status);
  const stageMeta = getOrderStageMeta(order.status);
  const allowedNext = useMemo(() => getAllowedNextStatuses(order.status, adminRole), [order.status, adminRole]);
  const risk = useMemo(() => analyzeOrderRisk(order, allOrders), [order, allOrders]);

  const activeCarriers = useMemo(() => carriers.filter((c) => c.isActive !== false), [carriers]);

  // Sync drafts when switching between orders
  useEffect(() => {
    setTrackingNumberDraft(order.trackingNumber || '');
    setCarrierCodeDraft(order.shippingCarrierCode || order.shippingCarrier || activeCarriers[0]?.id || 'SMSA');
    setCustomCarrierDraft(order.shippingCarrier || '');
    setShippingCostDraft(String(order.shippingCost ?? ''));
    setAdminNotesDraft(order.adminNotes || '');
    setTransitionNoteDraft('');

    // Suggest sensible default WhatsApp template matching order stage
    const suggested: WhatsAppEventKey =
      currentStage === 'shipped' || currentStage === 'out_for_delivery'
        ? 'shipped'
        : currentStage === 'delivered'
        ? 'delivered'
        : currentStage === 'pending'
        ? 'reminder'
        : 'confirmed';
    setActiveWaEvent(suggested);

    setLoadingHistory(true);
    dbService
      .getOrderStatusHistory(order.id)
      .then((rows) => setStatusHistory(Array.isArray(rows) ? rows : []))
      .catch(() => setStatusHistory([]))
      .finally(() => setLoadingHistory(false));
  }, [order.id]);

  // Re-generate WhatsApp message preview when event or tracking/carrier changes
  useEffect(() => {
    const selectedCarrier = activeCarriers.find((c) => c.id === carrierCodeDraft);
    const carrierName =
      carrierCodeDraft === 'CUSTOM'
        ? customCarrierDraft || 'شركة الشحن'
        : selectedCarrier?.nameAr || getCarrierDisplayName(order, carriers);
    const carrierTrackUrl = buildCarrierTrackingUrl(carrierCodeDraft, trackingNumberDraft, carriers);
    const draftOrder: Order = {
      ...order,
      trackingNumber: trackingNumberDraft || order.trackingNumber,
      shippingCarrier: carrierName,
      shippingCarrierCode: carrierCodeDraft
    };
    const msg = WhatsAppService.formatEventMessage(activeWaEvent, draftOrder, {
      statusLabel: stageMeta.label,
      carrierName,
      carrierTrackUrl
    });
    setWaMessageDraft(msg);
  }, [activeWaEvent, order.id, trackingNumberDraft, carrierCodeDraft, customCarrierDraft]);

  const liveCarrierTrackUrl = useMemo(
    () => buildCarrierTrackingUrl(carrierCodeDraft, trackingNumberDraft || order.trackingNumber, carriers),
    [carrierCodeDraft, trackingNumberDraft, order.trackingNumber, carriers]
  );

  const storeTrackingUrl = useMemo(() => {
    const origin =
      typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://sulta.vercel.app';
    return `${origin}/?tab=track-order&id=${encodeURIComponent(order.id)}`;
  }, [order.id]);

  const handleSaveShipping = async () => {
    setIsSavingFields(true);
    try {
      const selected = activeCarriers.find((c) => c.id === carrierCodeDraft);
      const carrierLabel =
        carrierCodeDraft === 'CUSTOM'
          ? customCarrierDraft.trim() || 'شركة شحن أخرى'
          : selected?.nameAr || carrierCodeDraft;

      const updated: Order = {
        ...order,
        shippingCarrierCode: carrierCodeDraft,
        shippingCarrier: carrierLabel,
        trackingNumber: trackingNumberDraft.trim() || undefined,
        ...(canViewCostPrice(adminRole) && shippingCostDraft !== ''
          ? { shippingCost: Number(shippingCostDraft) || 0 }
          : {})
      };
      await onUpdateOrder(updated, 'تم حفظ بيانات الشحن ورقم التتبع بنجاح 🚚');
    } finally {
      setIsSavingFields(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingFields(true);
    try {
      await onUpdateOrder({ ...order, adminNotes: adminNotesDraft }, 'تم حفظ الملاحظات الداخلية 📝');
    } finally {
      setIsSavingFields(false);
    }
  };

  const handleAssignStaff = async (emailOrName: string) => {
    await onUpdateOrder(
      { ...order, assignedTo: emailOrName || undefined },
      emailOrName ? `تم تعيين الطلب إلى ${emailOrName}` : 'تم إلغاء تعيين المسؤول'
    );
  };

  const handleDownloadWaybill = async () => {
    setIsGeneratingPdf(true);
    try {
      const selected = activeCarriers.find((c) => c.id === carrierCodeDraft);
      const carrierLabel =
        carrierCodeDraft === 'CUSTOM'
          ? customCarrierDraft.trim() || 'شركة شحن أخرى'
          : selected?.nameAr || getCarrierDisplayName(order, carriers);
      await generateShippingWaybillPdf(
        {
          ...order,
          shippingCarrierCode: carrierCodeDraft,
          shippingCarrier: carrierLabel,
          trackingNumber: trackingNumberDraft || order.trackingNumber
        },
        carriers
      );
      toast?.('تم تحميل بوليصة الشحن بصيغة PDF بنجاح', 'success');
    } catch (err: any) {
      toast?.(`تعذر إنشاء ملف البوليصة: ${err?.message || ''}`, 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSendWhatsAppWithLog = async () => {
    if (!order.phone) {
      toast?.('رقم جوال العميلة غير مسجل في الطلب', 'error');
      return;
    }
    const url = WhatsAppService.buildWhatsAppUrl(order.phone, waMessageDraft);
    window.open(url, '_blank', 'noopener,noreferrer');

    const logEntry = WhatsAppService.createSendLogEntry(
      activeWaEvent,
      order.phone,
      waMessageDraft,
      adminName
    );
    const updatedLogs = [logEntry, ...(order.whatsappLogs || [])].slice(0, 30);
    await onUpdateOrder({ ...order, whatsappLogs: updatedLogs });
    toast?.('تم فتح واتساب وتسجيل الرسالة في سجل الطلب', 'success');
  };

  const unifiedTimeline = useMemo(() => {
    const items: { id: string; title: string; subtitle?: string; timestamp: string; actor?: string; kind: 'status' | 'whatsapp' | 'payment' }[] = [];

    statusHistory.forEach((h, idx) => {
      const fromLabel = h.old_status ? getOrderStageMeta(h.old_status).shortLabel : '';
      const toLabel = getOrderStageMeta(h.new_status).shortLabel;
      items.push({
        id: h.id || `hist_${idx}`,
        title: fromLabel ? `تغيير الحالة: ${fromLabel} ← ${toLabel}` : `الحالة: ${toLabel}`,
        subtitle: h.notes || undefined,
        timestamp: h.created_at || new Date().toISOString(),
        actor: h.changed_by || 'الإدارة',
        kind: 'status'
      });
    });

    (order.whatsappLogs || []).forEach((w) => {
      items.push({
        id: w.id,
        title: `واتساب (${w.eventLabel})`,
        subtitle: w.previewText,
        timestamp: w.sentAt,
        actor: w.sentBy,
        kind: 'whatsapp'
      });
    });

    if (order.paymentVerifiedAt) {
      items.push({
        id: 'payment_verified',
        title: order.paymentStatus === 'paid' ? 'تأكيد استلام الدفع' : 'تحديث حالة الدفع',
        subtitle: order.receiptReviewNotes || undefined,
        timestamp: order.paymentVerifiedAt,
        actor: order.paymentVerifiedBy || 'الإدارة',
        kind: 'payment'
      });
    }

    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [statusHistory, order.whatsappLogs, order.paymentVerifiedAt, order.paymentStatus, order.paymentVerifiedBy, order.receiptReviewNotes]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex justify-end animate-fade-in"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl border-r border-gray-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        aria-label={`تفاصيل الطلب ${order.id}`}
      >
        {/* Top Drawer Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-mono font-black text-base text-gray-950">
                  #{order.id.slice(0, 8).toUpperCase()}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${stageMeta.colorClass}`}>
                  {stageMeta.label}
                </span>
                {order.assignedTo && (
                  <AdminBadge tone="info">المسؤول: {order.assignedTo}</AdminBadge>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {order.customerName} · {order.date || (order.createdAt ? order.createdAt.split('T')[0] : '')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {canDeleteOrder(adminRole) && (
              <button
                type="button"
                onClick={() => onRequestDeleteOrder(order.id)}
                aria-label="حذف الطلب"
                title="حذف الطلب نهائياً"
                className="min-w-[44px] min-h-[44px] rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center justify-center cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق تفاصيل الطلب"
              className="min-w-[44px] min-h-[44px] rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5 flex-1">
          {/* Risk / Duplicate Detector Banner */}
          {risk.isFlagged && (
            <div
              className={`rounded-2xl p-4 border space-y-2 ${
                risk.severity === 'high'
                  ? 'bg-rose-50 border-rose-200 text-rose-950'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                <ShieldAlert size={16} className={risk.severity === 'high' ? 'text-rose-600' : 'text-amber-600'} />
                <span>تنبيه مراجعة الطلب (كشف التكرار والمخاطر)</span>
              </div>
              <ul className="space-y-1 text-[11px] list-disc list-inside">
                {risk.reasons.map((r) => (
                  <li key={r.code}>
                    <strong>{r.label}:</strong> {r.detail}
                  </li>
                ))}
              </ul>
              {risk.relatedOrderIds.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] font-bold">طلبات مرتبطة:</span>
                  {risk.relatedOrderIds.map((rid) => (
                    <button
                      key={rid}
                      type="button"
                      onClick={() => onOpenRelatedOrder(rid)}
                      className="px-2 py-1 rounded-lg bg-white border border-rose-300 font-mono text-[11px] font-bold hover:bg-rose-100 cursor-pointer"
                    >
                      #{rid.slice(0, 8)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pipeline State Machine & Transitions */}
          <div className="bg-[#FAF8F8] rounded-2xl p-4 border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-gray-950">مسار حالة الطلب (Pipeline State Machine)</h4>
              <span className="text-[11px] text-gray-500">انتقالات موثقة ومقيدة</span>
            </div>

            {/* Linear Progress Stepper */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {MAIN_PIPELINE_SEQUENCE.map((st, idx) => {
                const stMeta = ORDER_STAGE_META[st];
                const currIdx = MAIN_PIPELINE_SEQUENCE.indexOf(currentStage);
                const isDone = currIdx >= 0 && idx <= currIdx;
                const isCurrent = currentStage === st;
                return (
                  <React.Fragment key={st}>
                    <div
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0 border ${
                        isCurrent
                          ? 'bg-[#A44C5C] text-white border-[#A44C5C]'
                          : isDone
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-white text-gray-400 border-gray-200'
                      }`}
                    >
                      {stMeta.shortLabel}
                    </div>
                    {idx < MAIN_PIPELINE_SEQUENCE.length - 1 && (
                      <ArrowLeft size={12} className="text-gray-300 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Allowed Transitions */}
            {canUpdateOrderStatus(adminRole) && (
              <div className="space-y-2.5 pt-2 border-t border-gray-200/70">
                <input
                  type="text"
                  value={transitionNoteDraft}
                  onChange={(e) => setTransitionNoteDraft(e.target.value)}
                  placeholder="ملاحظة الانتقال للسجل (اختياري)..."
                  className="w-full min-h-[40px] bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#A44C5C]"
                />
                {allowedNext.length === 0 ? (
                  <p className="text-[11px] text-gray-500">
                    هذه الحالة نهائية ({stageMeta.shortLabel}) ولا توجد انتقالات متاحة لصلاحيتك الحالية.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allowedNext.map((nextStage) => {
                      const nextMeta = ORDER_STAGE_META[nextStage];
                      const isDanger = nextStage === 'cancelled' || nextStage === 'failed' || nextStage === 'returned';
                      return (
                        <button
                          key={nextStage}
                          type="button"
                          onClick={() => {
                            if (!canTransitionOrderStatus(order.status, nextStage, adminRole)) return;
                            onTransitionStatus(order, nextStage, transitionNoteDraft.trim() || undefined);
                            setTransitionNoteDraft('');
                          }}
                          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                            isDanger
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                              : 'bg-white hover:bg-[#FCF5F6] text-gray-900 border-gray-300 hover:border-[#A44C5C]'
                          }`}
                        >
                          نقل إلى: {nextMeta.shortLabel}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Staff Assignment + Customer Info + Payment Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-gray-900">بيانات العميلة</h5>
                <div className="flex items-center gap-1.5">
                  {order.phone && (
                    <a
                      href={`tel:${order.phone}`}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold inline-flex items-center gap-1"
                    >
                      <Phone size={12} />
                      <span>اتصال</span>
                    </a>
                  )}
                </div>
              </div>
              <p><strong>الاسم:</strong> {order.customerName}</p>
              <p>
                <strong>الجوال:</strong>{' '}
                <span className="font-mono" dir="ltr">{order.phone || '-'}</span>
              </p>
              <p><strong>المدينة:</strong> {order.city || 'الرياض'}</p>
              <p><strong>العنوان:</strong> {order.address || 'غير محدد'}</p>
              {order.notes && (
                <p className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                  <strong>ملاحظة العميلة:</strong> {order.notes}
                </p>
              )}

              {/* Assignee Select */}
              <div className="pt-2 border-t border-gray-200/80">
                <label htmlFor="order-assignee-select" className="text-[11px] font-bold text-gray-700 flex items-center gap-1 mb-1">
                  <UserCheck size={13} className="text-[#A44C5C]" />
                  <span>تعيين مسؤول المتابعة:</span>
                </label>
                <select
                  id="order-assignee-select"
                  value={order.assignedTo || ''}
                  onChange={(e) => handleAssignStaff(e.target.value)}
                  className="w-full min-h-[42px] bg-white border border-gray-300 rounded-xl px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#A44C5C]"
                >
                  <option value="">غير معيّن</option>
                  {teamMembers.map((m) => {
                    const label = m.name ? `${m.name} (${m.email})` : m.email;
                    return (
                      <option key={m.id || m.email} value={m.name || m.email}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Payment & Items Summary */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-gray-900">الدفع والقطع ({order.items?.length || 0})</h5>
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
              </div>

              <div className="text-[11px] text-gray-600">
                طريقة الدفع: <strong className="text-gray-900">{order.paymentMethod || 'الدفع عند الاستلام'}</strong>
              </div>

              <div className="divide-y divide-gray-200 max-h-32 overflow-y-auto bg-white rounded-xl border border-gray-200 px-3">
                {(order.items || []).map((it, i) => (
                  <div key={i} className="py-1.5 flex items-center justify-between gap-2 text-[11px]">
                    <span className="truncate font-medium text-gray-800">
                      {it.productName} ({it.color} · {it.size})
                    </span>
                    <span className="font-mono font-bold text-gray-950 shrink-0">×{it.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-gray-600">الإجمالي:</span>
                <span className="font-mono tabular-nums font-black text-base text-[#A44C5C]">
                  {Number(order.totalPrice || 0).toLocaleString()} {order.currency === 'EGP' ? 'ج.م' : 'ر.س'}
                </span>
              </div>

              {order.receiptImageUrl && (
                <div className="pt-1">
                  <span className="text-[11px] font-bold text-gray-700 block mb-1">إشعار التحويل المرفق:</span>
                  {renderReceiptImage(order.receiptImageUrl)}
                </div>
              )}

              {order.paymentStatus !== 'paid' && canUpdateOrderStatus(adminRole) && (
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onVerifyPayment(order)}
                    className="flex-1 min-h-[44px] bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 size={14} />
                    <span>تأكيد الدفع</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRequestRejectPayment(order)}
                    className="min-h-[44px] px-3.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <XCircle size={14} />
                    <span>رفض</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Free Manual Shipping & Waybill PDF */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-3.5 text-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h5 className="font-bold text-gray-950 flex items-center gap-1.5">
                <Truck size={15} className="text-[#A44C5C]" />
                <span>الشحن اليدوي والبوليصة (PDF مجاني)</span>
              </h5>
              <div className="flex items-center gap-2">
                <AdminButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={isGeneratingPdf}
                  onClick={handleDownloadWaybill}
                >
                  <FileDown size={14} />
                  <span>بوليصة PDF</span>
                </AdminButton>
                <AdminButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onPrintInvoice(order)}
                >
                  <Printer size={14} />
                  <span>فاتورة</span>
                </AdminButton>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">شركة الشحن:</label>
                <select
                  value={carrierCodeDraft}
                  onChange={(e) => setCarrierCodeDraft(e.target.value)}
                  className="w-full min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#A44C5C]"
                >
                  {activeCarriers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr}
                    </option>
                  ))}
                  <option value="CUSTOM">شركة أخرى (إدخال يدوي)</option>
                </select>
              </div>

              {carrierCodeDraft === 'CUSTOM' && (
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">اسم الشركة اليدوي:</label>
                  <input
                    type="text"
                    value={customCarrierDraft}
                    onChange={(e) => setCustomCarrierDraft(e.target.value)}
                    placeholder="اكتبي اسم شركة الشحن"
                    className="w-full min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 text-xs outline-none focus:border-[#A44C5C]"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">رقم التتبع / البوليصة:</label>
                <input
                  type="text"
                  dir="ltr"
                  value={trackingNumberDraft}
                  onChange={(e) => setTrackingNumberDraft(e.target.value)}
                  placeholder="مثال: 2984719283"
                  className="w-full min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 text-xs font-mono outline-none focus:border-[#A44C5C]"
                />
              </div>

              {canViewCostPrice(adminRole) && (
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">تكلفة الشحن الفعلية (ر.س):</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    dir="ltr"
                    value={shippingCostDraft}
                    onChange={(e) => setShippingCostDraft(e.target.value)}
                    placeholder="0"
                    className="w-full min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 text-xs font-mono outline-none focus:border-[#A44C5C]"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <AdminButton
                type="button"
                variant="primary"
                size="sm"
                loading={isSavingFields}
                onClick={handleSaveShipping}
              >
                <Save size={14} />
                <span>حفظ بيانات الشحن</span>
              </AdminButton>

              {liveCarrierTrackUrl && (
                <a
                  href={liveCarrierTrackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <ExternalLink size={13} />
                  <span>فتح رابط شركة الشحن</span>
                </a>
              )}

              <button
                type="button"
                onClick={async () => {
                  const ok = await WhatsAppService.copyToClipboard(storeTrackingUrl);
                  toast?.(ok ? 'تم نسخ رابط صفحة تتبع العميلة' : 'تعذر النسخ', ok ? 'success' : 'error');
                }}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Copy size={13} />
                <span>نسخ رابط تتبع العميلة</span>
              </button>
            </div>
          </div>

          {/* Free WhatsApp Templates & Sent Log */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-3 text-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h5 className="font-bold text-gray-950 flex items-center gap-1.5">
                <MessageCircle size={15} className="text-[#25D366]" />
                <span>قوالب الواتساب المجانية (wa.me)</span>
              </h5>
              <span className="text-[11px] text-gray-500 font-mono">
                أُرسل: {order.whatsappLogs?.length || 0} رسالة
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {WHATSAPP_EVENTS_ORDER.map((ev) => (
                <button
                  key={ev}
                  type="button"
                  onClick={() => setActiveWaEvent(ev)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-xl font-bold text-[11px] cursor-pointer transition-colors ${
                    activeWaEvent === ev
                      ? 'bg-[#25D366] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {DEFAULT_EVENT_TEMPLATES[ev].titleAr}
                </button>
              ))}
            </div>

            <textarea
              value={waMessageDraft}
              onChange={(e) => setWaMessageDraft(e.target.value)}
              rows={5}
              className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl p-3 text-xs leading-relaxed focus:bg-white focus:outline-none focus:border-[#25D366]"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSendWhatsAppWithLog}
                className="flex-1 min-h-[44px] bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Send size={14} />
                <span>فتح WhatsApp وتسجيل الإرسال</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await WhatsAppService.copyToClipboard(waMessageDraft);
                  toast?.(ok ? 'تم نسخ نص الرسالة' : 'تعذر النسخ', ok ? 'success' : 'error');
                }}
                className="min-h-[44px] px-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Copy size={14} />
                <span>نسخ</span>
              </button>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-2.5 text-xs">
            <label htmlFor="drawer-admin-notes" className="font-bold text-gray-950 flex items-center gap-1.5">
              <FileText size={14} className="text-[#A44C5C]" />
              <span>ملاحظات داخلية للفريق</span>
            </label>
            <textarea
              id="drawer-admin-notes"
              value={adminNotesDraft}
              onChange={(e) => setAdminNotesDraft(e.target.value)}
              rows={2}
              placeholder="ملاحظات داخلية لا تظهر للعميلة..."
              className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl p-3 text-xs focus:bg-white focus:outline-none focus:border-[#A44C5C]"
            />
            <AdminButton type="button" variant="secondary" size="sm" loading={isSavingFields} onClick={handleSaveNotes}>
              <Save size={13} />
              <span>حفظ الملاحظة</span>
            </AdminButton>
          </div>

          {/* Unified Timeline */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-3 text-xs">
            <h5 className="font-bold text-gray-950 flex items-center gap-1.5">
              <Clock size={14} className="text-[#A44C5C]" />
              <span>الجدول الزمني للطلب (Timeline)</span>
            </h5>

            {loadingHistory ? (
              <div className="text-gray-400 text-xs py-3">جاري تحميل السجل الزمني...</div>
            ) : unifiedTimeline.length === 0 ? (
              <div className="text-gray-400 text-xs py-2">
                تم إنشاء الطلب في {order.createdAt ? new Date(order.createdAt).toLocaleString('ar-SA') : order.date} — لا توجد أحداث مسجلة إضافية بعد.
              </div>
            ) : (
              <div className="space-y-2.5 border-r-2 border-gray-200 pr-3">
                {unifiedTimeline.map((item) => (
                  <div key={item.id} className="relative bg-gray-50 rounded-xl p-2.5 border border-gray-150">
                    <span
                      className={`w-2.5 h-2.5 rounded-full absolute -right-[19px] top-3 border-2 border-white ${
                        item.kind === 'whatsapp'
                          ? 'bg-[#25D366]'
                          : item.kind === 'payment'
                          ? 'bg-emerald-600'
                          : 'bg-[#A44C5C]'
                      }`}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-gray-900">{item.title}</span>
                      <span className="text-[10px] font-mono text-gray-500">
                        {new Date(item.timestamp).toLocaleString('ar-SA')}
                      </span>
                    </div>
                    {item.subtitle && (
                      <p className="text-[11px] text-gray-600 mt-1 line-clamp-2">{item.subtitle}</p>
                    )}
                    {item.actor && (
                      <span className="text-[10px] text-gray-400 block mt-1">بواسطة: {item.actor}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
