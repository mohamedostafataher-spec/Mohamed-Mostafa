import React, { useState, useMemo, useEffect } from 'react';
import { RotateCcw, Search, CheckCircle2, XCircle, Clock, AlertCircle, Package, ArrowRightLeft, DollarSign, Plus, Eye, History, ShieldAlert } from 'lucide-react';
import { ReturnRefundRequest, Order, Product } from '../types';
import { dbService } from '../services/db';

interface AdminReturnsProps {
  orders: Order[];
  products: Product[];
  toast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  adminName?: string;
}

export default function AdminReturns({ orders, products, toast, adminName = 'إدارة المتجر' }: AdminReturnsProps) {
  const [returns, setReturns] = useState<ReturnRefundRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'return' | 'exchange'>('all');

  // Selected return for review / action modal
  const [selectedReturn, setSelectedReturn] = useState<ReturnRefundRequest | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [inspectionResult, setInspectionResult] = useState<'passed' | 'damaged' | 'missing_tags' | 'rejected'>('passed');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundMethod, setRefundMethod] = useState<'bank_transfer' | 'card_refund' | 'store_credit'>('bank_transfer');
  const [shouldRestock, setShouldRestock] = useState<boolean>(true);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // New Return Modal
  const [isCreatingReturn, setIsCreatingReturn] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [requestType, setRequestType] = useState<'return' | 'exchange'>('return');
  const [requestedAction, setRequestedAction] = useState<'refund' | 'store_credit' | 'replacement'>('refund');
  const [isSubmittingNewReturn, setIsSubmittingNewReturn] = useState(false);

  // Load returns
  const loadReturns = async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getReturnsAndRefunds();
      setReturns(data);
    } catch (e) {
      console.warn("Failed to load returns:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, []);

  // Filter returns
  const filteredReturns = useMemo(() => {
    return returns.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (typeFilter !== 'all' && r.requestType !== typeFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.orderId.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.customerPhone.includes(q) ||
        r.reason.toLowerCase().includes(q)
      );
    });
  }, [returns, statusFilter, typeFilter, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = returns.length;
    const pending = returns.filter(r => r.status === 'pending').length;
    const itemReceived = returns.filter(r => r.status === 'item_received').length;
    const refunded = returns.filter(r => r.status === 'refunded' || r.status === 'completed').length;
    const totalRefundedAmount = returns
      .filter(r => r.status === 'refunded' || r.status === 'completed')
      .reduce((sum, r) => sum + (r.refundAmount || 0), 0);

    return { total, pending, itemReceived, refunded, totalRefundedAmount };
  }, [returns]);

  // Handle Create New Return Request from verified order
  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    const order = orders.find(o => o.id === selectedOrderId);
    if (!order) {
      toast?.('يرجى اختيار طلب صالح من القائمة', 'error');
      return;
    }
    if (!returnReason.trim()) {
      toast?.('يرجى تحديد سبب الإرجاع أو الاستبدال', 'error');
      return;
    }

    try {
      setIsSubmittingNewReturn(true);
      const newReq: ReturnRefundRequest = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'ret-' + Date.now(),
        orderId: order.id,
        customerName: order.customerName,
        customerPhone: order.phone,
        requestType,
        reason: returnReason.trim(),
        items: order.items.map(i => ({
          productId: i.productId,
          productName: i.productName,
          color: i.color,
          size: i.size,
          quantity: i.quantity,
          price: i.price
        })),
        requestedAction,
        status: 'pending',
        refundAmount: order.totalPrice,
        refundMethod: 'bank_transfer',
        restocked: false,
        statusHistory: [
          { status: 'pending', date: new Date().toISOString(), note: 'تم تسجيل الطلب المبدئي', updatedBy: adminName }
        ],
        createdAt: new Date().toISOString()
      };

      await dbService.saveReturnRequest(newReq);
      setReturns(prev => [newReq, ...prev]);
      toast?.('تم إنشاء طلب الإرجاع/الاستبدال بنجاح 🔄', 'success');
      setIsCreatingReturn(false);
      setSelectedOrderId('');
      setReturnReason('');
    } catch (err: any) {
      toast?.(`فشل تسجيل طلب الإرجاع: ${err?.message || ''}`, 'error');
    } finally {
      setIsSubmittingNewReturn(false);
    }
  };

  // Handle Update Return Status (Workflow Steps)
  const handleUpdateStatus = async (nextStatus: ReturnRefundRequest['status']) => {
    if (!selectedReturn) return;

    try {
      setIsProcessingAction(true);
      const historyItem = {
        status: nextStatus,
        date: new Date().toISOString(),
        note: actionNotes.trim() || undefined,
        updatedBy: adminName
      };

      const updatedHistory = [...(selectedReturn.statusHistory || []), historyItem];
      let didRestock = selectedReturn.restocked;

      // Restock inventory ONLY if item was received & inspected passed, and user selected to restock
      if (nextStatus === 'refunded' || nextStatus === 'completed') {
        if (shouldRestock && !selectedReturn.restocked && inspectionResult === 'passed') {
          for (const item of selectedReturn.items) {
            await dbService.recordStockMovement({
              productId: item.productId,
              productName: item.productName,
              variant: `${item.color || ''} - ${item.size || ''}`,
              changeQty: item.quantity,
              movementType: 'order_cancellation_restock',
              reason: `إعادة إدخال مخزون مرتجع للطلب #${selectedReturn.orderId.slice(0, 8)} بعد الفحص السليم`,
              referenceOrderId: selectedReturn.orderId,
              adminName
            });
          }
          didRestock = true;
        }
      }

      const updatedReq: ReturnRefundRequest = {
        ...selectedReturn,
        status: nextStatus,
        inspectionResult: nextStatus === 'inspected' ? inspectionResult : selectedReturn.inspectionResult,
        inspectionNotes: actionNotes.trim() || selectedReturn.inspectionNotes,
        refundAmount: refundAmount > 0 ? refundAmount : selectedReturn.refundAmount,
        refundMethod: refundMethod || selectedReturn.refundMethod,
        restocked: didRestock,
        statusHistory: updatedHistory,
        updatedAt: new Date().toISOString()
      };

      await dbService.saveReturnRequest(updatedReq);
      setReturns(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
      toast?.(`تم تحديث حالة الطلب إلى "${statusLabels[nextStatus]}" بنجاح ✨`, 'success');
      setSelectedReturn(null);
      setActionNotes('');
    } catch (err: any) {
      toast?.(`حدث خطأ أثناء تحديث المرتجع: ${err?.message || ''}`, 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const statusLabels: Record<string, string> = {
    pending: 'قيد المراجعة المبدئية ⏳',
    approved: 'تمت الموافقة وبانتظار الشحن 📦',
    rejected: 'مرفوض ❌',
    item_received: 'تم استلام القطعة في المستودع 🚚',
    inspected: 'تم الفحص والمعاينة 🔍',
    refunded: 'تم استرداد المبلغ للعميلة 💰',
    completed: 'مكتمل نهائياً ✓'
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header & Metrics */}
      <div className="bg-white border border-gray-200/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <RotateCcw size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900">
              إدارة المرتجعات والاستبدال والاسترداد (Returns & Refunds)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              دورة عمل موثقة تبدأ من الفحص الفعلي للقطع ولا تعيد للمخزون إلا بعد التأكد التام من سلامة المنتجات.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreatingReturn(true)}
          className="bg-[#A44C5C] hover:bg-[#8D3B4A] text-white text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
        >
          <Plus size={15} />
          <span>تسجيل طلب مرتجع/استبدال جديد</span>
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-gray-500 font-bold">إجمالي طلبات المرتجعات</div>
          <div className="text-xl font-black text-gray-900 font-mono mt-1">{metrics.total}</div>
        </div>
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-amber-700 font-bold">بانتظار المراجعة</div>
          <div className="text-xl font-black text-amber-700 font-mono mt-1">{metrics.pending}</div>
        </div>
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-blue-700 font-bold">قطع مستلمة للفحص</div>
          <div className="text-xl font-black text-blue-700 font-mono mt-1">{metrics.itemReceived}</div>
        </div>
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-emerald-700 font-bold">المبالغ المستردة فعلياً</div>
          <div className="text-xl font-black text-emerald-700 font-mono mt-1">{metrics.totalRefundedAmount.toLocaleString()} ر.س</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="ابحثي برقم الطلب، اسم العميلة، أو الجوال..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF9F6] border border-gray-300 rounded-xl py-2 pl-3 pr-8 text-xs text-gray-900 focus:border-[#A44C5C] outline-hidden"
          />
          <Search size={14} className="absolute right-2.5 top-2.5 text-gray-400" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e: any) => setTypeFilter(e.target.value)}
            className="bg-[#FAF9F6] border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-hidden"
          >
            <option value="all">كل الأنواع (إرجاع / استبدال)</option>
            <option value="return">إرجاع فقط</option>
            <option value="exchange">استبدال فقط</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#FAF9F6] border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-hidden"
          >
            <option value="all">كل الحالات</option>
            <option value="pending">قيد المراجعة</option>
            <option value="approved">تمت الموافقة</option>
            <option value="item_received">مستلم بالمستودع</option>
            <option value="inspected">تم الفحص</option>
            <option value="refunded">تم الاسترداد</option>
            <option value="completed">مكتمل</option>
            <option value="rejected">مرفوض</option>
          </select>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white border border-gray-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#FAF9F6] border-b border-gray-200 text-gray-500 font-bold">
              <tr>
                <th className="py-3 px-4">رقم الطلب / التاريخ</th>
                <th className="py-3 px-4">العميلة</th>
                <th className="py-3 px-4">النوع والسبب</th>
                <th className="py-3 px-4">القطع المعنية</th>
                <th className="py-3 px-4">المبلغ</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4 text-center">إجراءات المراجعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    لا توجد طلبات مرتجعات مطابقة للفلاتر المحددة.
                  </td>
                </tr>
              ) : (
                filteredReturns.map(ret => (
                  <tr key={ret.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-gray-900">#{ret.orderId.slice(0, 8)}</div>
                      <div className="text-[10px] text-gray-400">{ret.createdAt.split('T')[0]}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{ret.customerName}</div>
                      <div className="text-[11px] text-gray-500 font-mono" dir="ltr">{ret.customerPhone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mb-1 ${
                        ret.requestType === 'exchange' ? 'bg-purple-100 text-purple-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {ret.requestType === 'exchange' ? 'استبدال مقاس/لون' : 'إرجاع واسترداد'}
                      </span>
                      <div className="text-gray-600 line-clamp-1">{ret.reason}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-gray-800">
                        {ret.items.map((it, idx) => (
                          <div key={idx} className="line-clamp-1">
                            • {it.productName} ({it.quantity} قطع)
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                      {ret.refundAmount.toLocaleString()} ر.س
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-xl bg-gray-100 text-gray-800">
                        {statusLabels[ret.status] || ret.status}
                      </span>
                      {ret.restocked && (
                        <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                          ✓ أُعيد للمخزون
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedReturn(ret);
                          setRefundAmount(ret.refundAmount);
                          setActionNotes(ret.inspectionNotes || '');
                        }}
                        className="bg-[#A44C5C]/10 hover:bg-[#A44C5C] text-[#A44C5C] hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                      >
                        معاينة واتخاذ إجراء
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action / Review Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-gray-950 flex items-center gap-2">
                <RotateCcw size={18} className="text-[#A44C5C]" />
                <span>مراجعة طلب الإرجاع للطلب #{selectedReturn.orderId.slice(0, 8)}</span>
              </h3>
              <button
                onClick={() => setSelectedReturn(null)}
                className="text-gray-400 hover:text-black p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Info Summary */}
            <div className="bg-[#FAF9F6] border border-gray-200/80 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">العميلة:</span>
                <span className="font-bold text-gray-900">{selectedReturn.customerName} ({selectedReturn.customerPhone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">السبب المعلن:</span>
                <span className="font-bold text-gray-900">{selectedReturn.reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">الإجراء المطلوب:</span>
                <span className="font-bold text-[#A44C5C]">
                  {selectedReturn.requestedAction === 'refund' ? 'استرداد مالي' : (selectedReturn.requestedAction === 'store_credit' ? 'رصيد متجر' : 'استبدال')}
                </span>
              </div>
            </div>

            {/* Step Actions based on workflow */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-800 mb-1">ملاحظات الفحص والمعاينة:</label>
                <textarea
                  rows={2}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="اكتبي نتائج فحص القطعة، خلوها من العيوب، وحالة التغليف الأصلي..."
                  className="w-full bg-[#FAF9F6] border border-gray-300 rounded-xl p-3 text-xs text-gray-900 focus:border-[#A44C5C] outline-hidden"
                />
              </div>

              {selectedReturn.status === 'item_received' && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 space-y-2">
                  <span className="font-bold text-blue-950">نتيجة الفحص والمعاينة:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setInspectionResult('passed')}
                      className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer ${inspectionResult === 'passed' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 border'}`}
                    >
                      سليم ومطابق للشروط ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectionResult('damaged')}
                      className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer ${inspectionResult === 'damaged' ? 'bg-rose-600 text-white' : 'bg-white text-gray-700 border'}`}
                    >
                      تالف أو مستعمل ✕
                    </button>
                  </div>
                </div>
              )}

              {(selectedReturn.status === 'inspected' || selectedReturn.status === 'approved') && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950">مبلغ الاسترداد الفعلي:</span>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(Number(e.target.value))}
                      className="w-28 bg-white border border-emerald-300 rounded-xl px-3 py-1.5 font-mono font-bold text-left outline-hidden"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950">طريقة الاسترداد:</span>
                    <select
                      value={refundMethod}
                      onChange={(e: any) => setRefundMethod(e.target.value)}
                      className="bg-white border border-emerald-300 rounded-xl px-3 py-1.5 outline-hidden"
                    >
                      <option value="bank_transfer">تحويل بنكي لحساب العميلة</option>
                      <option value="card_refund">إرجاع للبطاقة (Paymob / مدى)</option>
                      <option value="store_credit">كوبون رصيد متجر</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-emerald-200/60">
                    <input
                      type="checkbox"
                      id="restock_toggle"
                      checked={shouldRestock}
                      onChange={(e) => setShouldRestock(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="restock_toggle" className="text-emerald-900 font-bold cursor-pointer">
                      إعادة إدخال القطع للمخزون تلقائياً بعد اكتمال الاسترداد (تحديث سجل المستودع)
                    </label>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                {selectedReturn.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus('approved')}
                      disabled={isProcessingAction}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      موافقة مبدئية وإرسال بوليصة الاسترجاع ✓
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('rejected')}
                      disabled={isProcessingAction}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      رفض الطلب ✕
                    </button>
                  </>
                )}

                {selectedReturn.status === 'approved' && (
                  <button
                    onClick={() => handleUpdateStatus('item_received')}
                    disabled={isProcessingAction}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    تأكيد استلام الشحنة في المستودع 📦
                  </button>
                )}

                {selectedReturn.status === 'item_received' && (
                  <button
                    onClick={() => handleUpdateStatus('inspected')}
                    disabled={isProcessingAction}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    تسجيل نتيجة الفحص والانتقال للتسوية 🔍
                  </button>
                )}

                {(selectedReturn.status === 'inspected' || selectedReturn.status === 'approved') && (
                  <button
                    onClick={() => handleUpdateStatus('refunded')}
                    disabled={isProcessingAction}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    تأكيد تحويل المبلغ للعميلة وإغلاق الطلب 💰
                  </button>
                )}
              </div>
            </div>

            {/* Status History Audit Trail */}
            {selectedReturn.statusHistory && selectedReturn.statusHistory.length > 0 && (
              <div className="border-t border-gray-100 pt-3">
                <span className="font-bold text-xs text-gray-800 block mb-2">سجل الخطوات والتدقيق:</span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {selectedReturn.statusHistory.map((h, i) => (
                    <div key={i} className="text-[11px] bg-gray-50 rounded-lg p-2 flex justify-between items-center text-gray-600">
                      <span>• {statusLabels[h.status] || h.status} {h.note ? `(${h.note})` : ''}</span>
                      <span className="font-mono text-gray-400">{h.date.split('T')[0]} - {h.updatedBy || 'المسؤول'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Return Modal */}
      {isCreatingReturn && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-gray-950">تسجيل طلب إرجاع أو استبدال جديد</h3>
              <button onClick={() => setIsCreatingReturn(false)} className="text-gray-400 hover:text-black">✕</button>
            </div>

            <form onSubmit={handleCreateReturn} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">اختاري الطلب الأصلي:</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  required
                  className="w-full bg-[#FAF9F6] border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 outline-hidden font-mono"
                >
                  <option value="">-- اختاري الطلب --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      #{o.id.slice(0, 8)} - {o.customerName} ({o.totalPrice} ر.س)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">نوع الطلب:</label>
                  <select
                    value={requestType}
                    onChange={(e: any) => setRequestType(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 outline-hidden"
                  >
                    <option value="return">إرجاع واسترداد مالي</option>
                    <option value="exchange">استبدال مقاس أو لون</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">الإجراء المطلوب:</label>
                  <select
                    value={requestedAction}
                    onChange={(e: any) => setRequestedAction(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 outline-hidden"
                  >
                    <option value="refund">استرداد مالي</option>
                    <option value="store_credit">رصيد متجر</option>
                    <option value="replacement">قطعة بديلة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">سبب الإرجاع / الاستبدال:</label>
                <textarea
                  rows={3}
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  required
                  placeholder="مثال: رغبة في استبدال المقاس، أو اختلاف درجة اللون المطلوبة..."
                  className="w-full bg-[#FAF9F6] border border-gray-300 rounded-xl p-3 text-xs text-gray-900 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingReturn(false)}
                  className="px-4 py-2 text-gray-500 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewReturn}
                  className="bg-[#A44C5C] hover:bg-[#8D3B4A] text-white font-bold px-5 py-2 rounded-xl cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmittingNewReturn ? 'جاري الحفظ...' : 'تسجيل الطلب ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
