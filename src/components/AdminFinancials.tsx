import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  Plus,
  Trash2,
  FileText,
  Tag,
  ShoppingBag,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  Sliders,
  Receipt,
  Landmark,
  ShieldAlert,
  Loader2,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  Order,
  Product,
  OperatingExpense,
  ReturnRefundRequest,
  FinancialAnalyticsSummary,
  Settings,
  TeamMemberRole
} from '../types';
import { dbService } from '../services/db';
import {
  AdminButton,
  AdminCard,
  StatCard,
  AdminBadge,
  ConfirmModal,
  AdminSkeleton,
  AdminEmptyState
} from './admin/AdminUI';
import { canEditCostPrice, canViewCostPrice } from '../utils/rbac';
import {
  PaymentFeeConfig,
  DEFAULT_PAYMENT_FEE_CONFIG,
  toHalalas,
  fromHalalas,
  formatSarFromHalalas,
  calculateOrderProfitBreakdownHalalas,
  calculateMonthlyPnLAndCashflow,
  generateReconciliationSummary,
  calculateVatSummaryHalalas,
  exportRowsToCsv
} from '../utils/financialCalculations';

interface AdminFinancialsProps {
  orders: Order[];
  products: Product[];
  settings?: Settings | null;
  adminRole?: TeamMemberRole | string;
  toast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onUpdateProductCost?: (productId: string, costPrice: number) => Promise<void>;
  onUpdateOrder?: (order: Order) => Promise<void>;
}

const FEE_CONFIG_STORAGE_KEY = 'sulta_payment_fee_config_v1';

export default function AdminFinancials({
  orders,
  products,
  settings,
  adminRole = 'owner',
  toast,
  onUpdateProductCost,
  onUpdateOrder
}: AdminFinancialsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'pnl' | 'reconciliation' | 'reports' | 'receipt'>('pnl');
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | '90days' | 'all'>('30days');
  const [expenses, setExpenses] = useState<OperatingExpense[]>([]);
  const [returns, setReturns] = useState<ReturnRefundRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Payment Fee & Attribution Rules (never hardcoded/fabricated; stored per admin)
  const [showFeeSettings, setShowFeeSettings] = useState(false);
  const [feeConfig, setFeeConfig] = useState<PaymentFeeConfig>(() => {
    try {
      const saved = localStorage.getItem(FEE_CONFIG_STORAGE_KEY);
      return saved ? { ...DEFAULT_PAYMENT_FEE_CONFIG, ...JSON.parse(saved) } : DEFAULT_PAYMENT_FEE_CONFIG;
    } catch {
      return DEFAULT_PAYMENT_FEE_CONFIG;
    }
  });

  // Optional 15% VAT Toggle (Internal estimation / Receipt toggle — NOT ZATCA compliant)
  const [vatEnabled, setVatEnabled] = useState(false);

  // New expense form
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<OperatingExpense['category']>('marketing');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expenseNotes, setExpenseNotes] = useState('');
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // Delete expense modal
  const [expenseToDelete, setExpenseToDelete] = useState<OperatingExpense | null>(null);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);

  // Product cost inline edit
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [editingCostVal, setEditingCostVal] = useState<number>(0);
  const [isSavingCost, setIsSavingCost] = useState(false);

  // Reconciliation status actions
  const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);

  // Receipt PDF builder state
  const [selectedReceiptOrderId, setSelectedReceiptOrderId] = useState<string>(orders[0]?.id || '');
  const [receiptIncludeVat, setReceiptIncludeVat] = useState<boolean>(false);
  const [receiptCounter, setReceiptCounter] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('sulta_receipt_seq_counter') || '1001');
    } catch {
      return 1001;
    }
  });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const receiptPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(FEE_CONFIG_STORAGE_KEY, JSON.stringify(feeConfig));
    } catch {}
  }, [feeConfig]);

  useEffect(() => {
    if (!selectedReceiptOrderId && orders.length > 0) {
      setSelectedReceiptOrderId(orders[0].id);
    }
  }, [orders, selectedReceiptOrderId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [expData, retData] = await Promise.all([
        dbService.getOperatingExpenses(),
        dbService.getReturnsAndRefunds()
      ]);
      setExpenses(expData);
      setReturns(retData);
    } catch (e) {
      console.warn('Error loading financial extra data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredOrders = useMemo(() => {
    if (dateRange === 'all') return orders;
    const now = Date.now();
    const daysMap = { today: 1, '7days': 7, '30days': 30, '90days': 90 };
    const cutoff = now - daysMap[dateRange] * 24 * 60 * 60 * 1000;
    return orders.filter((o) => new Date(o.createdAt || o.date).getTime() >= cutoff);
  }, [orders, dateRange]);

  const filteredExpenses = useMemo(() => {
    if (dateRange === 'all') return expenses;
    const now = Date.now();
    const daysMap = { today: 1, '7days': 7, '30days': 30, '90days': 90 };
    const cutoff = now - daysMap[dateRange] * 24 * 60 * 60 * 1000;
    return expenses.filter((e) => new Date(e.date).getTime() >= cutoff);
  }, [expenses, dateRange]);

  const summary: FinancialAnalyticsSummary = useMemo(() => {
    return dbService.calculateFinancialSummary(filteredOrders, filteredExpenses, returns, products);
  }, [filteredOrders, filteredExpenses, returns, products]);

  // Integer-halalas per-order profitability breakdown
  const orderProfitRows = useMemo(() => {
    const validOrders = filteredOrders.filter((o) => o.status !== 'cancelled' && o.status !== 'failed');
    const marketingSpendHalalas = filteredExpenses
      .filter((e) => e.category === 'marketing')
      .reduce((acc, e) => acc + toHalalas(e.amount), 0);

    const perOrderAdHalalas =
      feeConfig.allocateMarketingExpensesAcrossOrders && validOrders.length > 0
        ? Math.round(marketingSpendHalalas / validOrders.length)
        : 0;

    return validOrders.map((o) =>
      calculateOrderProfitBreakdownHalalas(o, products, feeConfig, perOrderAdHalalas)
    );
  }, [filteredOrders, filteredExpenses, products, feeConfig]);

  const totalPaymentFeesHalalas = useMemo(
    () => orderProfitRows.reduce((s, r) => s + r.paymentFeeHalalas, 0),
    [orderProfitRows]
  );

  const trueNetProfitAfterFeesHalalas = useMemo(() => {
    return toHalalas(summary.estimatedNetProfit) - totalPaymentFeesHalalas;
  }, [summary.estimatedNetProfit, totalPaymentFeesHalalas]);

  const monthlyPnL = useMemo(() => {
    return calculateMonthlyPnLAndCashflow(orders, expenses, returns, products, feeConfig);
  }, [orders, expenses, returns, products, feeConfig]);

  const monthlyChartData = useMemo(() => {
    return [...monthlyPnL]
      .reverse()
      .slice(-6)
      .map((m) => ({
        name: m.monthLabel,
        'صافي المبيعات': fromHalalas(m.netSalesHalalas),
        'صافي الربح': fromHalalas(m.netProfitHalalas),
        'المصروفات والتكاليف': fromHalalas(
          m.cogsHalalas + m.operatingExpensesHalalas + m.paymentFeesHalalas
        )
      }));
  }, [monthlyPnL]);

  const reconciliation = useMemo(() => generateReconciliationSummary(filteredOrders), [filteredOrders]);

  const vatSummary = useMemo(
    () => calculateVatSummaryHalalas(toHalalas(summary.netSales), 15, true),
    [summary.netSales]
  );

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim()) {
      toast?.('يرجى كتابة بيان واضح للمصروف', 'error');
      return;
    }
    const amt = Number(expenseAmount);
    if (!amt || amt <= 0) {
      toast?.('يرجى تحديد مبلغ صالح للمصروف', 'error');
      return;
    }

    try {
      setIsSubmittingExpense(true);
      const newExp = await dbService.addOperatingExpense({
        title: expenseTitle.trim(),
        category: expenseCategory,
        amount: amt,
        date: expenseDate,
        notes: expenseNotes.trim() || undefined
      });
      setExpenses((prev) => [newExp, ...prev]);
      toast?.('تم تسجيل المصروف التشغيلي بنجاح', 'success');
      setExpenseTitle('');
      setExpenseAmount('');
      setExpenseNotes('');
      setIsAddingExpense(false);
    } catch (err: any) {
      toast?.(`فشل إضافة المصروف: ${err?.message || ''}`, 'error');
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      setIsDeletingExpense(true);
      await dbService.deleteOperatingExpense(expenseToDelete.id);
      setExpenses((prev) => prev.filter((e) => e.id !== expenseToDelete.id));
      toast?.('تم حذف المصروف بنجاح', 'success');
      setExpenseToDelete(null);
    } catch (err: any) {
      toast?.(`فشل حذف المصروف: ${err?.message || ''}`, 'error');
    } finally {
      setIsDeletingExpense(false);
    }
  };

  const handleSaveProductCost = async (product: Product) => {
    if (!canEditCostPrice(adminRole)) {
      toast?.('صلاحيتك لا تسمح بتعديل تكلفة الشراء', 'error');
      return;
    }
    try {
      setIsSavingCost(true);
      const updated: Product = { ...product, costPrice: editingCostVal };
      await dbService.saveProduct(updated);
      if (onUpdateProductCost) {
        await onUpdateProductCost(product.id, editingCostVal);
      }
      toast?.(`تم تحديث تكلفة "${product.nameAr}" إلى ${editingCostVal} ر.س`, 'success');
      setEditingCostId(null);
    } catch (err: any) {
      toast?.(`فشل تحديث التكلفة: ${err?.message || ''}`, 'error');
    } finally {
      setIsSavingCost(false);
    }
  };

  const handleMarkReconciledPaid = async (order: Order) => {
    setVerifyingOrderId(order.id);
    try {
      const updated: Order = {
        ...order,
        paymentStatus: 'paid',
        paymentVerifiedAt: new Date().toISOString()
      };
      if (onUpdateOrder) {
        await onUpdateOrder(updated);
      } else {
        await dbService.updateOrder(updated);
      }
      toast?.(`تم تأكيد تحصيل الدفع للطلب #${order.id.slice(0, 8)}`, 'success');
    } catch (err: any) {
      toast?.(`فشل تأكيد التحصيل: ${err?.message || ''}`, 'error');
    } finally {
      setVerifyingOrderId(null);
    }
  };

  // --- Accountant CSV Exports ---
  const exportSalesReportCsv = () => {
    exportRowsToCsv(
      `sulta-sales-profit-report-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'رقم الطلب',
        'التاريخ',
        'العميلة',
        'طريقة الدفع',
        'الحالة',
        'البيع (ر.س)',
        'الخصم (ر.س)',
        'التكلفة COGS (ر.س)',
        'الشحن (ر.س)',
        'رسوم الدفع (ر.س)',
        'الإعلان المنسوب (ر.س)',
        'صافي الربح (ر.س)'
      ],
      orderProfitRows.map((r) => [
        r.orderId,
        r.orderDate,
        r.customerName,
        r.paymentMethod,
        r.status,
        fromHalalas(r.grossSaleHalalas),
        fromHalalas(r.discountHalalas),
        fromHalalas(r.productCostHalalas),
        fromHalalas(r.shippingHalalas),
        fromHalalas(r.paymentFeeHalalas),
        fromHalalas(r.attributedAdCostHalalas),
        fromHalalas(r.netProfitHalalas)
      ])
    );
    toast?.('تم تصدير تقرير المبيعات والأرباح (CSV)', 'success');
  };

  const exportVatReportCsv = () => {
    const valid = filteredOrders.filter((o) => o.status !== 'cancelled' && o.status !== 'failed');
    exportRowsToCsv(
      `sulta-vat-estimate-non-zatca-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'ملاحظة الامتثال',
        'رقم الطلب',
        'التاريخ',
        'الإجمالي شامل الضريبة التقديرية (ر.س)',
        'صافي قبل الضريبة 15% (ر.س)',
        'ضريبة القيمة المضافة المقدرة 15% (ر.س)'
      ],
      valid.map((o) => {
        const v = calculateVatSummaryHalalas(toHalalas(o.totalPrice), 15, true);
        return [
          'تقدير داخلي - غير معتمد ZATCA',
          o.id,
          (o.createdAt || o.date || '').slice(0, 10),
          fromHalalas(v.totalInclVatHalalas),
          fromHalalas(v.netExclVatHalalas),
          fromHalalas(v.vatAmountHalalas)
        ];
      })
    );
    toast?.('تم تصدير تقرير التقدير الضريبي (CSV)', 'success');
  };

  const exportReturnsReportCsv = () => {
    exportRowsToCsv(
      `sulta-returns-report-${new Date().toISOString().slice(0, 10)}.csv`,
      ['معرف الطلب', 'رقم الطلب', 'العميلة', 'النوع', 'الحالة', 'المبلغ المسترد (ر.س)', 'أُعيد للمخزون', 'التاريخ'],
      returns.map((r) => [
        r.id,
        r.orderId,
        r.customerName,
        r.requestType === 'exchange' ? 'استبدال' : 'استرجاع',
        r.status,
        r.refundAmount || 0,
        r.restocked ? 'نعم' : 'لا',
        (r.createdAt || '').slice(0, 10)
      ])
    );
    toast?.('تم تصدير تقرير المرتجعات والاسترداد (CSV)', 'success');
  };

  const exportInventoryReportCsv = () => {
    exportRowsToCsv(
      `sulta-inventory-valuation-${new Date().toISOString().slice(0, 10)}.csv`,
      ['SKU', 'المنتج', 'المخزون الحالي', 'تكلفة الوحدة (ر.س)', 'قيمة المخزون بالتكلفة (ر.س)', 'سعر البيع (ر.س)', 'القيمة البيعية المتوقعة (ر.س)'],
      products.map((p) => {
        const stock = Number(p.stock || 0);
        const cost = Number(p.costPrice || 0);
        const sell = Number(p.priceSA || 0);
        return [p.sku || p.id, p.nameAr, stock, cost, stock * cost, sell, stock * sell];
      })
    );
    toast?.('تم تصدير تقرير تقييم المخزون (CSV)', 'success');
  };

  const exportExpensesReportCsv = () => {
    exportRowsToCsv(
      `sulta-expenses-report-${new Date().toISOString().slice(0, 10)}.csv`,
      ['التاريخ', 'العنوان', 'التصنيف', 'المبلغ (ر.س)', 'ملاحظات'],
      filteredExpenses.map((e) => [
        e.date,
        e.title,
        categoryNames[e.category] || e.category,
        e.amount,
        e.notes || ''
      ])
    );
    toast?.('تم تصدير تقرير المصروفات التشغيلية (CSV)', 'success');
  };

  // --- PDF Generator using html2canvas + jspdf ---
  const handleDownloadPdfElement = async (el: HTMLElement | null, filename: string, incrementReceiptSeq = false) => {
    if (!el) return;
    setIsGeneratingPdf(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, Math.min(pageHeight, pdf.internal.pageSize.getHeight()));
      pdf.save(filename);

      if (incrementReceiptSeq) {
        const nextSeq = receiptCounter + 1;
        setReceiptCounter(nextSeq);
        try {
          localStorage.setItem('sulta_receipt_seq_counter', String(nextSeq));
        } catch {}
      }
      toast?.('تم تنزيل ملف PDF بنجاح', 'success');
    } catch (err: any) {
      toast?.(`تعذر إنشاء ملف PDF: ${err?.message || ''}`, 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const selectedReceiptOrder = useMemo(
    () => orders.find((o) => o.id === selectedReceiptOrderId) || orders[0] || null,
    [orders, selectedReceiptOrderId]
  );

  const categoryNames: Record<string, string> = {
    marketing: 'إعلانات وتسويق',
    shipping: 'شحن ونقل',
    packaging: 'تغليف وبوكسات',
    software: 'برمجيات واشتراكات',
    salaries: 'رواتب وعمولات',
    other: 'مصاريف أخرى'
  };

  if (isLoading) {
    return <AdminSkeleton rows={5} cards={4} />;
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header & Navigation */}
      <AdminCard>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#FCF5F6] border border-[#A44C5C]/25 text-[#A44C5C] flex items-center justify-center shrink-0">
              <DollarSign size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-950">
                الإدارة المالية، قائمة الدخل والتقارير المحاسبية
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                حساب الأرباح بالهللة الدقيقة: ربح الطلب = البيع − الخصم − تكلفة المنتج − الشحن − رسوم الدفع − الإعلان المنسوب.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-[#FAF9F6] p-1 rounded-xl border border-gray-200 text-xs font-bold">
              {[
                { key: 'today', label: 'اليوم' },
                { key: '7days', label: '7 أيام' },
                { key: '30days', label: '30 يوماً' },
                { key: '90days', label: '90 يوماً' },
                { key: 'all', label: 'الكل' }
              ].map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDateRange(d.key as any)}
                  className={`min-h-[38px] px-3 rounded-lg transition-all cursor-pointer ${
                    dateRange === d.key ? 'bg-[#A44C5C] text-white shadow-2xs' : 'text-gray-700 hover:text-gray-950'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <AdminButton
              variant="outline"
              size="sm"
              onClick={() => setShowFeeSettings((v) => !v)}
              icon={<Sliders size={14} />}
            >
              قواعد الرسوم والضريبة
            </AdminButton>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-gray-150">
          {[
            { id: 'pnl', label: 'قائمة الدخل والتدفق النقدي', icon: TrendingUp },
            { id: 'reconciliation', label: 'تسوية COD والتحويلات البنكية', icon: Landmark },
            { id: 'reports', label: 'تقارير المحاسب (CSV / PDF)', icon: FileText },
            { id: 'receipt', label: 'إصدار إيصال طلب PDF', icon: Receipt }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`min-h-[44px] px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                  active
                    ? 'bg-[#111827] text-white border-transparent shadow-xs'
                    : 'bg-[#FAF9F6] text-gray-800 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Collapsible Fee & VAT Configuration */}
        {showFeeSettings && (
          <div className="mt-4 bg-[#FAF9F6] border border-gray-200 rounded-2xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200">
              <div>
                <h4 className="text-xs font-bold text-gray-950">إعدادات رسوم الدفع وتوزيع مصروف الإعلان</h4>
                <p className="text-[11px] text-gray-600">
                  القيم الافتراضية صفر لتجنب أي أرقام مفترضة؛ أدخلي النسب الفعلية المتفق عليها مع مزود الدفع فقط.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-bold text-gray-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vatEnabled}
                  onChange={(e) => setVatEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#A44C5C] rounded"
                />
                <span>إظهار تقدير ضريبة القيمة المضافة 15%</span>
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">رسوم COD (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={feeConfig.codFeePercent}
                  onChange={(e) => setFeeConfig({ ...feeConfig, codFeePercent: Number(e.target.value) || 0 })}
                  className="w-full min-h-[40px] bg-white border border-gray-300 rounded-xl px-2.5 font-mono text-left"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">رسوم COD ثابتة (ر.س)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={feeConfig.codFixedFeeSar}
                  onChange={(e) => setFeeConfig({ ...feeConfig, codFixedFeeSar: Number(e.target.value) || 0 })}
                  className="w-full min-h-[40px] bg-white border border-gray-300 rounded-xl px-2.5 font-mono text-left"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">رسوم البطاقة/مدى (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={feeConfig.cardFeePercent}
                  onChange={(e) => setFeeConfig({ ...feeConfig, cardFeePercent: Number(e.target.value) || 0 })}
                  className="w-full min-h-[40px] bg-white border border-gray-300 rounded-xl px-2.5 font-mono text-left"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">رسوم ثابتة/بطاقة (ر.س)</label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={feeConfig.cardFixedFeeSar}
                  onChange={(e) => setFeeConfig({ ...feeConfig, cardFixedFeeSar: Number(e.target.value) || 0 })}
                  className="w-full min-h-[40px] bg-white border border-gray-300 rounded-xl px-2.5 font-mono text-left"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">رسوم التقسيط (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={feeConfig.installmentFeePercent}
                  onChange={(e) =>
                    setFeeConfig({ ...feeConfig, installmentFeePercent: Number(e.target.value) || 0 })
                  }
                  className="w-full min-h-[40px] bg-white border border-gray-300 rounded-xl px-2.5 font-mono text-left"
                  dir="ltr"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={feeConfig.allocateMarketingExpensesAcrossOrders}
                    onChange={(e) =>
                      setFeeConfig({ ...feeConfig, allocateMarketingExpensesAcrossOrders: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#A44C5C] rounded"
                  />
                  <span>نسب مصروف الإعلان على الطلبات</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </AdminCard>

      {/* =================================================================== */}
      {/* TAB 1: P&L, CASHFLOW, PER-ORDER PROFIT, EXPENSES & COGS             */}
      {/* =================================================================== */}
      {activeSubTab === 'pnl' && (
        <div className="space-y-6">
          {summary.cogsReliability === 'unavailable' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">تنبيه بشأن تكلفة البضاعة المباعة (COGS):</p>
                <p className="leading-relaxed">
                  لم يتم إدخال تكلفة شراء المنتجات بعد. صافي المبيعات دقيق، أما احتساب الربح الصافي فيتطلب إدخال سعر الشراء في قسم "تكاليف الشراء" أدناه.
                </p>
              </div>
            </div>
          )}

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="إجمالي المبيعات (Gross)"
              value={`${summary.grossSales.toLocaleString()} ر.س`}
              hint="أسعار القطع قبل الخصم والشحن"
              accent="neutral"
              icon={<ShoppingBag size={20} />}
            />
            <StatCard
              label="صافي المبيعات (Net Sales)"
              value={`${summary.netSales.toLocaleString()} ر.س`}
              hint={`خصومات -${summary.totalDiscounts} · مرتجعات -${summary.totalRefunds}`}
              accent="emerald"
              icon={<TrendingUp size={20} />}
            />
            <StatCard
              label="تكلفة البضاعة (COGS)"
              value={`${summary.cogs.toLocaleString()} ر.س`}
              hint={
                summary.cogsReliability === 'exact'
                  ? 'مكتملة لكل القطع'
                  : summary.cogsReliability === 'partial'
                  ? 'جزئية (بعض القطع بدون تكلفة)'
                  : 'غير مدخلة'
              }
              accent="amber"
              icon={<Tag size={20} />}
            />
            <StatCard
              label="صافي الربح الفعلي"
              value={`${formatSarFromHalalas(trueNetProfitAfterFeesHalalas)} ر.س`}
              hint={`بعد خصم المصاريف (${summary.operatingExpenses} ر.س) ورسوم الدفع (${formatSarFromHalalas(totalPaymentFeesHalalas)} ر.س)`}
              accent={trueNetProfitAfterFeesHalalas >= 0 ? 'brand' : 'rose'}
              icon={<DollarSign size={20} />}
            />
          </div>

          {vatEnabled && (
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-sky-950">
              <div className="flex items-start gap-2.5">
                <ShieldAlert size={18} className="text-sky-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">تقدير ضريبة القيمة المضافة 15% (للاستخدام الداخلي المحاسبي فقط — غير مرتبط بـ ZATCA)</p>
                  <p className="text-sky-800 mt-0.5">
                    صافي المبيعات قبل الضريبة: <span className="font-mono font-bold">{formatSarFromHalalas(vatSummary.netExclVatHalalas)} ر.س</span> · الضريبة التقديرية (15%): <span className="font-mono font-bold">{formatSarFromHalalas(vatSummary.vatAmountHalalas)} ر.س</span>
                  </p>
                </div>
              </div>
              <AdminButton variant="outline" size="sm" onClick={exportVatReportCsv} icon={<Download size={14} />}>
                تصدير جدول الضريبة CSV
              </AdminButton>
            </div>
          )}

          {/* Monthly P&L Chart & Table */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <AdminCard className="xl:col-span-5">
              <h3 className="font-bold text-sm text-gray-950 mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-[#A44C5C]" />
                <span>اتجاه المبيعات والربحية الشهرية</span>
              </h3>
              <div className="h-64 w-full">
                {monthlyChartData.length === 0 ? (
                  <AdminEmptyState title="لا توجد بيانات شهرية بعد" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4B5563' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#4B5563' }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="صافي المبيعات" fill="#A44C5C" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="صافي الربح" fill="#059669" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </AdminCard>

            <AdminCard className="xl:col-span-7 overflow-hidden">
              <h3 className="font-bold text-sm text-gray-950 mb-4 flex items-center gap-2">
                <FileText size={16} className="text-[#A44C5C]" />
                <span>قائمة الدخل والتدفق النقدي الشهرية (Monthly P&L & Cashflow)</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#FAF9F6] border-b border-gray-200 text-gray-700 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">الشهر</th>
                      <th className="py-2.5 px-3">الطلبات</th>
                      <th className="py-2.5 px-3">صافي المبيعات</th>
                      <th className="py-2.5 px-3">التكلفة والمصاريف</th>
                      <th className="py-2.5 px-3">محصل نقدياً</th>
                      <th className="py-2.5 px-3">قيد التحصيل</th>
                      <th className="py-2.5 px-3">صافي الربح</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {monthlyPnL.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500">
                          لا توجد بيانات مالية مسجلة حتى الآن.
                        </td>
                      </tr>
                    ) : (
                      monthlyPnL.map((row) => (
                        <tr key={row.monthKey} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3 font-bold text-gray-950">{row.monthLabel}</td>
                          <td className="py-2.5 px-3 font-mono">{row.ordersCount}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-gray-900">
                            {formatSarFromHalalas(row.netSalesHalalas)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-rose-700">
                            -{formatSarFromHalalas(row.cogsHalalas + row.operatingExpensesHalalas + row.paymentFeesHalalas)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-emerald-700 font-bold">
                            {formatSarFromHalalas(row.cashCollectedHalalas)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-amber-700">
                            {formatSarFromHalalas(row.cashPendingHalalas)}
                          </td>
                          <td
                            className={`py-2.5 px-3 font-mono font-black ${
                              row.netProfitHalalas >= 0 ? 'text-emerald-800' : 'text-rose-800'
                            }`}
                          >
                            {formatSarFromHalalas(row.netProfitHalalas)} ر.س
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </AdminCard>
          </div>

          {/* Per-Order Profit Equation Table */}
          <AdminCard>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-150 mb-4">
              <div>
                <h3 className="font-bold text-sm text-gray-950">
                  ربحية كل طلب (البيع − الخصم − تكلفة المنتج − الشحن − رسوم الدفع − الإعلان المنسوب)
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  محسوب بدقة الهللة ({orderProfitRows.length} طلب ضمن النطاق المحدد).
                </p>
              </div>
              <AdminButton variant="outline" size="sm" onClick={exportSalesReportCsv} icon={<Download size={14} />}>
                تصدير الجدول CSV
              </AdminButton>
            </div>

            {orderProfitRows.length === 0 ? (
              <AdminEmptyState title="لا توجد طلبات صالحة في هذه الفترة" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#FAF9F6] border-b border-gray-200 text-gray-700 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">الطلب</th>
                      <th className="py-2.5 px-3">العميلة / الدفع</th>
                      <th className="py-2.5 px-3">البيع</th>
                      <th className="py-2.5 px-3">الخصم</th>
                      <th className="py-2.5 px-3">التكلفة</th>
                      <th className="py-2.5 px-3">الشحن</th>
                      <th className="py-2.5 px-3">رسوم الدفع</th>
                      <th className="py-2.5 px-3">إعلان منسوب</th>
                      <th className="py-2.5 px-3">صافي الربح</th>
                      <th className="py-2.5 px-3">إيصال</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orderProfitRows.slice(0, 30).map((row) => (
                      <tr key={row.orderId} className="hover:bg-gray-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-gray-950">
                          #{row.orderId.slice(0, 8)}
                          <span className="block text-[10px] font-normal text-gray-500">{row.orderDate}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-gray-900 block">{row.customerName}</span>
                          <span className="text-[11px] text-gray-500">{row.paymentMethod}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">{formatSarFromHalalas(row.grossSaleHalalas)}</td>
                        <td className="py-2.5 px-3 font-mono text-rose-700">-{formatSarFromHalalas(row.discountHalalas)}</td>
                        <td className="py-2.5 px-3 font-mono text-purple-900">
                          -{formatSarFromHalalas(row.productCostHalalas)}
                          {row.cogsMissing && (
                            <span className="block text-[10px] text-amber-700">ناقص</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-gray-700">-{formatSarFromHalalas(row.shippingHalalas)}</td>
                        <td className="py-2.5 px-3 font-mono text-gray-700">-{formatSarFromHalalas(row.paymentFeeHalalas)}</td>
                        <td className="py-2.5 px-3 font-mono text-gray-700">-{formatSarFromHalalas(row.attributedAdCostHalalas)}</td>
                        <td
                          className={`py-2.5 px-3 font-mono font-black ${
                            row.netProfitHalalas >= 0 ? 'text-emerald-800' : 'text-rose-800'
                          }`}
                        >
                          {formatSarFromHalalas(row.netProfitHalalas)} ر.س
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReceiptOrderId(row.orderId);
                              setActiveSubTab('receipt');
                            }}
                            className="min-h-[36px] px-2.5 rounded-lg bg-[#FCF5F6] hover:bg-[#A44C5C] text-[#A44C5C] hover:text-white border border-[#A44C5C]/25 text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminCard>

          {/* Operating Expenses & Product COGS Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expenses Manager */}
            <AdminCard className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-gray-950 flex items-center gap-2">
                    <span>المصروفات التشغيلية والتسويقية</span>
                    <AdminBadge tone="neutral">{expenses.length}</AdminBadge>
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    تكاليف الإعلانات، التغليف، الشحن، والبرمجيات.
                  </p>
                </div>
                <AdminButton
                  size="sm"
                  onClick={() => setIsAddingExpense((v) => !v)}
                  icon={<Plus size={14} />}
                >
                  إضافة مصروف
                </AdminButton>
              </div>

              {isAddingExpense && (
                <form onSubmit={handleAddExpense} className="bg-[#FAF9F6] border border-gray-200 rounded-2xl p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1">بيان المصروف</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: حملة سناب شات - نهاية الأسبوع"
                        value={expenseTitle}
                        onChange={(e) => setExpenseTitle(e.target.value)}
                        className="w-full min-h-[44px] bg-white border border-gray-300 rounded-xl px-3 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1">التصنيف</label>
                      <select
                        value={expenseCategory}
                        onChange={(e) => setExpenseCategory(e.target.value as any)}
                        className="w-full min-h-[44px] bg-white border border-gray-300 rounded-xl px-3 text-xs"
                      >
                        {Object.entries(categoryNames).map(([val, label]) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1">المبلغ (ر.س)</label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        required
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full min-h-[44px] bg-white border border-gray-300 rounded-xl px-3 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1">التاريخ</label>
                      <input
                        type="date"
                        required
                        value={expenseDate}
                        onChange={(e) => setExpenseDate(e.target.value)}
                        className="w-full min-h-[44px] bg-white border border-gray-300 rounded-xl px-3 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">ملاحظات (اختياري)</label>
                    <input
                      type="text"
                      value={expenseNotes}
                      onChange={(e) => setExpenseNotes(e.target.value)}
                      className="w-full min-h-[44px] bg-white border border-gray-300 rounded-xl px-3 text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <AdminButton variant="outline" size="sm" onClick={() => setIsAddingExpense(false)}>
                      إلغاء
                    </AdminButton>
                    <AdminButton type="submit" size="sm" loading={isSubmittingExpense}>
                      حفظ المصروف
                    </AdminButton>
                  </div>
                </form>
              )}

              <div className="max-h-80 overflow-y-auto space-y-2">
                {expenses.length === 0 ? (
                  <p className="text-center py-8 text-xs text-gray-500">لا توجد مصروفات مسجلة حالياً.</p>
                ) : (
                  expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="bg-[#FAF9F6] border border-gray-200 rounded-2xl p-3 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                          <span>{exp.title}</span>
                          <AdminBadge tone="neutral">{categoryNames[exp.category] || exp.category}</AdminBadge>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 font-mono">
                          {exp.date} {exp.notes ? `· ${exp.notes}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-rose-700 text-sm">
                          -{Number(exp.amount).toLocaleString()} ر.س
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpenseToDelete(exp)}
                          aria-label={`حذف المصروف ${exp.title}`}
                          className="min-w-[36px] min-h-[36px] rounded-xl text-gray-500 hover:text-rose-700 hover:bg-rose-50 flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </AdminCard>

            {/* Product COGS Manager (RBAC Restricted) */}
            <AdminCard className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-gray-950 flex items-center gap-2">
                  <Tag size={16} className="text-[#A44C5C]" />
                  <span>تكلفة شراء القطع (COGS — سري للإدارة والمحاسبة)</span>
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  تظهر فقط للأدوار المصرح لها برؤية التكلفة. تعديل السعر محصور بالمالك والمدير.
                </p>
              </div>

              {!canViewCostPrice(adminRole) ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs font-bold text-amber-900">
                  بيانات تكلفة الشراء محجوبة عن دورك الوظيفي الحالي.
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-2.5">
                  {products.map((prod) => {
                    const sellingPrice = prod.priceSA || 0;
                    const cost = prod.costPrice || 0;
                    const profitMargin =
                      sellingPrice > 0 ? Math.round(((sellingPrice - cost) / sellingPrice) * 100) : 0;
                    const isEditing = editingCostId === prod.id;

                    return (
                      <div
                        key={prod.id}
                        className="bg-[#FAF9F6] border border-gray-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {prod.images?.[0] ? (
                            <img src={prod.images[0]} alt={prod.nameAr} className="w-10 h-10 object-cover rounded-xl shrink-0" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-xl shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 truncate">{prod.nameAr}</div>
                            <div className="text-[11px] text-gray-600 font-mono mt-0.5">
                              البيع: <span className="font-bold">{sellingPrice} ر.س</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={editingCostVal}
                                onChange={(e) => setEditingCostVal(Number(e.target.value))}
                                className="w-20 min-h-[36px] bg-white border border-gray-300 rounded-lg px-2 text-xs font-mono text-center"
                                autoFocus
                              />
                              <AdminButton size="sm" loading={isSavingCost} onClick={() => handleSaveProductCost(prod)}>
                                حفظ
                              </AdminButton>
                              <AdminButton variant="ghost" size="sm" onClick={() => setEditingCostId(null)}>
                                إلغاء
                              </AdminButton>
                            </div>
                          ) : (
                            <div className="text-left flex items-center gap-2.5">
                              <div>
                                <div className="font-mono font-bold text-gray-900">
                                  {cost > 0 ? `${cost} ر.س` : <span className="text-amber-700 font-normal">غير محدد</span>}
                                </div>
                                {cost > 0 && sellingPrice > 0 && (
                                  <span className="text-[10px] font-bold text-emerald-700">هامش: {profitMargin}%</span>
                                )}
                              </div>
                              {canEditCostPrice(adminRole) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCostId(prod.id);
                                    setEditingCostVal(cost);
                                  }}
                                  className="min-h-[36px] px-2.5 text-xs text-[#A44C5C] hover:bg-[#FCF5F6] rounded-lg font-bold cursor-pointer"
                                >
                                  تعديل
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </AdminCard>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: COD & BANK TRANSFER RECONCILIATION                           */}
      {/* =================================================================== */}
      {activeSubTab === 'reconciliation' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="تحويل بنكي مؤكد"
              value={`${formatSarFromHalalas(reconciliation.bankVerifiedHalalas)} ر.س`}
              hint={`${reconciliation.bankVerifiedOrders.length} طلب موثق`}
              accent="emerald"
              icon={<CheckCircle2 size={20} />}
            />
            <StatCard
              label="تحويل بنكي بانتظار المراجعة"
              value={`${formatSarFromHalalas(reconciliation.bankPendingHalalas)} ر.س`}
              hint={`${reconciliation.bankPendingOrders.length} إيصال معلق`}
              accent="amber"
              icon={<Clock size={20} />}
            />
            <StatCard
              label="COD مسلّم ومحصّل"
              value={`${formatSarFromHalalas(reconciliation.codDeliveredHalalas)} ر.س`}
              hint={`${reconciliation.codDeliveredOrders.length} شحنة مسلمة`}
              accent="brand"
              icon={<Landmark size={20} />}
            />
            <StatCard
              label="COD قيد التوصيل والتحصيل"
              value={`${formatSarFromHalalas(reconciliation.codPendingHalalas)} ر.س`}
              hint={`${reconciliation.codPendingOrders.length} شحنة نشطة`}
              accent="neutral"
              icon={<RefreshCw size={20} />}
            />
          </div>

          <AdminCard>
            <h3 className="font-bold text-sm text-gray-950 mb-4">
              الطلبات المعلقة للتسوية المالية (مراجعة إيصالات التحويل أو تأكيد تحصيل COD)
            </h3>
            {reconciliation.bankPendingOrders.length === 0 && reconciliation.codPendingOrders.length === 0 ? (
              <AdminEmptyState
                title="كل التحويلات وطلبات COD مسوّاة"
                description="لا توجد طلبات معلقة في هذه الفترة الزمنية."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#FAF9F6] border-b border-gray-200 text-gray-700 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">الطلب</th>
                      <th className="py-2.5 px-3">العميلة</th>
                      <th className="py-2.5 px-3">الطريقة</th>
                      <th className="py-2.5 px-3">المبلغ</th>
                      <th className="py-2.5 px-3">حالة الطلب</th>
                      <th className="py-2.5 px-3">إجراء التسوية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...reconciliation.bankPendingOrders, ...reconciliation.codPendingOrders].map((ord) => (
                      <tr key={ord.id} className="hover:bg-gray-50">
                        <td className="py-2.5 px-3 font-mono font-bold">#{ord.id.slice(0, 8)}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-gray-900">{ord.customerName}</span>
                          <span className="block text-[11px] font-mono text-gray-500" dir="ltr">{ord.phone}</span>
                        </td>
                        <td className="py-2.5 px-3">{ord.paymentMethod}</td>
                        <td className="py-2.5 px-3 font-mono font-black text-[#A44C5C]">
                          {Number(ord.totalPrice).toLocaleString()} ر.س
                        </td>
                        <td className="py-2.5 px-3">
                          <AdminBadge tone="warning">{ord.status}</AdminBadge>
                        </td>
                        <td className="py-2.5 px-3">
                          <AdminButton
                            size="sm"
                            variant="outline"
                            loading={verifyingOrderId === ord.id}
                            onClick={() => handleMarkReconciledPaid(ord)}
                            icon={<CheckCircle2 size={14} />}
                          >
                            تأكيد التحصيل
                          </AdminButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminCard>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: ACCOUNTANT EXPORTS (CSV & PDF)                               */}
      {/* =================================================================== */}
      {activeSubTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 flex items-start gap-2.5">
            <ShieldAlert size={18} className="text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>ملاحظة محاسبية:</strong> جميع ملفات التصدير (CSV بترميز UTF-8 متوافق مع Excel وPDF) مخصصة للمحاسبة الداخلية والمراجعة المالية، وتقرير ضريبة الـ 15% تقديري داخلي <strong>وليس تقريراً معتمداً للفوترة الإلكترونية ZATCA</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: '1. تقرير المبيعات والأرباح التفصيلي',
                desc: `يتضمن ${orderProfitRows.length} طلب مع التكلفة والخصم والشحن ورسوم الدفع وصافي الربح.`,
                onCsv: exportSalesReportCsv
              },
              {
                title: '2. تقرير التقدير الضريبي (VAT 15%)',
                desc: 'حساب تقديري لصافي المبيعات وقيمة الـ 15% (للمراجعة المحاسبية الداخلية فقط).',
                onCsv: exportVatReportCsv
              },
              {
                title: '3. تقرير المرتجعات والاسترداد',
                desc: `يشمل ${returns.length} طلب استرجاع/استبدال والمبالغ المستردة وإعادة المخزون.`,
                onCsv: exportReturnsReportCsv
              },
              {
                title: '4. تقرير تقييم المخزون الحالي',
                desc: `جرد مالي لعدد ${products.length} قطعة بقيمة التكلفة والقيمة البيعية المتوقعة.`,
                onCsv: exportInventoryReportCsv
              },
              {
                title: '5. تقرير المصروفات التشغيلية',
                desc: `تفاصيل ${filteredExpenses.length} مصروفاً مصنفاً حسب الإعلانات والتغليف والشحن.`,
                onCsv: exportExpensesReportCsv
              }
            ].map((rep) => (
              <AdminCard key={rep.title} className="flex flex-col justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-gray-950">{rep.title}</h4>
                  <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{rep.desc}</p>
                </div>
                <AdminButton variant="primary" size="sm" onClick={rep.onCsv} icon={<Download size={14} />}>
                  تصدير Excel CSV
                </AdminButton>
              </AdminCard>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: SEQUENTIAL ORDER RECEIPT / INVOICE PDF (NON-ZATCA)           */}
      {/* =================================================================== */}
      {activeSubTab === 'receipt' && (
        <div className="space-y-5">
          <AdminCard>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">اختاري الطلب لإصدار الإيصال</label>
                <select
                  value={selectedReceiptOrderId}
                  onChange={(e) => setSelectedReceiptOrderId(e.target.value)}
                  className="w-full min-h-[44px] bg-[#FAF9F6] border border-gray-300 rounded-xl px-3 text-xs font-bold"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      #{o.id.slice(0, 8)} — {o.customerName} ({o.totalPrice} ر.س)
                    </option>
                  ))}
                </select>
              </div>

              <label className="min-h-[44px] flex items-center gap-2.5 bg-[#FAF9F6] border border-gray-200 rounded-xl px-4 text-xs font-bold text-gray-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={receiptIncludeVat}
                  onChange={(e) => setReceiptIncludeVat(e.target.checked)}
                  className="w-4 h-4 accent-[#A44C5C] rounded"
                />
                <span>إظهار بند ضريبة 15% الاختياري (تقديري)</span>
              </label>

              <AdminButton
                onClick={() =>
                  handleDownloadPdfElement(
                    receiptPreviewRef.current,
                    `sulta-receipt-${receiptCounter}-${selectedReceiptOrder?.id.slice(0, 8) || 'order'}.pdf`,
                    true
                  )
                }
                loading={isGeneratingPdf}
                disabled={!selectedReceiptOrder}
                icon={isGeneratingPdf ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />}
              >
                تحميل الإيصال PDF (رقم #{receiptCounter})
              </AdminButton>
            </div>
          </AdminCard>

          {selectedReceiptOrder ? (
            <div className="bg-gray-100 p-4 sm:p-6 rounded-2xl overflow-x-auto">
              <div
                ref={receiptPreviewRef}
                className="bg-white max-w-2xl mx-auto p-8 border border-gray-200 shadow-sm text-gray-950 space-y-6"
                dir="rtl"
              >
                <div className="flex items-start justify-between border-b-2 border-[#A44C5C] pb-4">
                  <div>
                    <h3 className="text-2xl font-black text-[#A44C5C]">سولته</h3>
                    <p className="text-xs text-gray-600 mt-1">متجر سولته للبيجامات النسائية القطنية · المملكة العربية السعودية</p>
                  </div>
                  <div className="text-left">
                    <span className="inline-block bg-[#FCF5F6] text-[#8E3E4D] border border-[#A44C5C]/25 px-3 py-1 rounded-lg text-xs font-bold">
                      إيصال طلب تجاري
                    </span>
                    <p className="font-mono text-xs font-bold mt-2">
                      رقم الإيصال: RCPT-{new Date().getFullYear()}-{receiptCounter}
                    </p>
                    <p className="font-mono text-[11px] text-gray-600">
                      رقم الطلب: #{selectedReceiptOrder.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-[#FAF9F6] p-3.5 rounded-xl border border-gray-200 space-y-1">
                    <p className="font-bold text-gray-900 border-b border-gray-200 pb-1 mb-1.5">بيانات العميلة</p>
                    <p>الاسم: {selectedReceiptOrder.customerName}</p>
                    <p className="font-mono" dir="ltr">الجوال: {selectedReceiptOrder.phone}</p>
                    <p>المدينة والعنوان: {selectedReceiptOrder.city} — {selectedReceiptOrder.address}</p>
                  </div>
                  <div className="bg-[#FAF9F6] p-3.5 rounded-xl border border-gray-200 space-y-1">
                    <p className="font-bold text-gray-900 border-b border-gray-200 pb-1 mb-1.5">تفاصيل السداد</p>
                    <p>التاريخ: {selectedReceiptOrder.date || (selectedReceiptOrder.createdAt || '').slice(0, 10)}</p>
                    <p>طريقة الدفع: {selectedReceiptOrder.paymentMethod}</p>
                    <p>رقم التتبع: {selectedReceiptOrder.trackingNumber || 'غير مضاف بعد'}</p>
                  </div>
                </div>

                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-y border-gray-200 text-gray-800">
                      <th className="py-2.5 px-3">المنتج</th>
                      <th className="py-2.5 px-3 text-center">الكمية</th>
                      <th className="py-2.5 px-3 text-center">سعر الوحدة</th>
                      <th className="py-2.5 px-3 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(selectedReceiptOrder.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-bold">
                          {item.productName}
                          <span className="block text-[10px] font-normal text-gray-500">
                            اللون: {item.color || '-'} · المقاس: {item.size || '-'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{item.price} ر.س</td>
                        <td className="py-2.5 px-3 text-left font-mono font-bold">
                          {(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()} ر.س
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="max-w-xs mr-auto space-y-1.5 text-xs border-t border-gray-200 pt-3">
                  {selectedReceiptOrder.discountAmount ? (
                    <div className="flex justify-between text-rose-700">
                      <span>الخصم:</span>
                      <span className="font-mono">-{selectedReceiptOrder.discountAmount} ر.س</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span>رسوم الشحن:</span>
                    <span className="font-mono">
                      {selectedReceiptOrder.shippingFee ? `${selectedReceiptOrder.shippingFee} ر.س` : 'مجاني'}
                    </span>
                  </div>
                  {receiptIncludeVat && (
                    <>
                      <div className="flex justify-between text-gray-700">
                        <span>المبلغ قبل الضريبة (تقديري):</span>
                        <span className="font-mono">
                          {formatSarFromHalalas(
                            calculateVatSummaryHalalas(toHalalas(selectedReceiptOrder.totalPrice), 15, true).netExclVatHalalas
                          )}{' '}
                          ر.س
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>ضريبة القيمة المضافة 15% (اختيارية):</span>
                        <span className="font-mono">
                          {formatSarFromHalalas(
                            calculateVatSummaryHalalas(toHalalas(selectedReceiptOrder.totalPrice), 15, true).vatAmountHalalas
                          )}{' '}
                          ر.س
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-sm font-black text-[#A44C5C] border-t-2 border-[#A44C5C] pt-2">
                    <span>الإجمالي النهائي:</span>
                    <span className="font-mono">{Number(selectedReceiptOrder.totalPrice).toLocaleString()} ر.س</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 text-center text-[11px] text-gray-600 space-y-1">
                  <p className="font-bold text-gray-800">
                    تنبيه مهم: هذا المستند إيصال طلب تجاري من متجر سولته وليس فاتورة ضريبية إلكترونية معتمدة من هيئة الزكاة والضريبة والجمارك (ZATCA).
                  </p>
                  <p>
                    للتواصل مع خدمة عملاء سولته: واتساب {settings?.whatsappSaudi || '966552823677'} · البريد {settings?.contactEmail || 'concierge@sulta.sa'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <AdminEmptyState title="لا توجد طلبات متاحة لإصدار إيصال" />
          )}
        </div>
      )}

      {/* Confirm Delete Expense Modal */}
      <ConfirmModal
        isOpen={!!expenseToDelete}
        title="تأكيد حذف المصروف التشغيلي"
        description={`هل أنتِ متأكدة من حذف "${expenseToDelete?.title || ''}"؟ لن يمكن التراجع بعد الحذف.`}
        confirmLabel="نعم، حذف المصروف"
        isLoading={isDeletingExpense}
        onConfirm={confirmDeleteExpense}
        onCancel={() => setExpenseToDelete(null)}
      />
    </div>
  );
}
