import React, { useState, useMemo, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, AlertCircle, Plus, Trash2, ArrowUpRight, ArrowDownRight, FileText, CheckCircle2, PieChart, Tag, RefreshCw, ShoppingBag } from 'lucide-react';
import { Order, Product, OperatingExpense, ReturnRefundRequest, FinancialAnalyticsSummary } from '../types';
import { dbService } from '../services/db';

interface AdminFinancialsProps {
  orders: Order[];
  products: Product[];
  toast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onUpdateProductCost?: (productId: string, costPrice: number) => Promise<void>;
}

export default function AdminFinancials({ orders, products, toast, onUpdateProductCost }: AdminFinancialsProps) {
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | '90days' | 'all'>('30days');
  const [expenses, setExpenses] = useState<OperatingExpense[]>([]);
  const [returns, setReturns] = useState<ReturnRefundRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New expense form
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<OperatingExpense['category']>('marketing');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expenseNotes, setExpenseNotes] = useState('');
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // Product cost inline edit
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [editingCostVal, setEditingCostVal] = useState<number>(0);
  const [isSavingCost, setIsSavingCost] = useState(false);

  // Load expenses and returns
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
      console.warn("Error loading financial extra data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter orders by selected date range
  const filteredOrders = useMemo(() => {
    if (dateRange === 'all') return orders;
    const now = Date.now();
    const daysMap = {
      today: 1,
      '7days': 7,
      '30days': 30,
      '90days': 90
    };
    const maxDays = daysMap[dateRange];
    const cutoff = now - maxDays * 24 * 60 * 60 * 1000;

    return orders.filter(o => {
      const orderDate = new Date(o.createdAt || o.date).getTime();
      return orderDate >= cutoff;
    });
  }, [orders, dateRange]);

  // Filter expenses by date range
  const filteredExpenses = useMemo(() => {
    if (dateRange === 'all') return expenses;
    const now = Date.now();
    const daysMap = {
      today: 1,
      '7days': 7,
      '30days': 30,
      '90days': 90
    };
    const maxDays = daysMap[dateRange];
    const cutoff = now - maxDays * 24 * 60 * 60 * 1000;

    return expenses.filter(e => {
      const expDate = new Date(e.date).getTime();
      return expDate >= cutoff;
    });
  }, [expenses, dateRange]);

  // Calculate comprehensive P&L financial summary
  const summary: FinancialAnalyticsSummary = useMemo(() => {
    return dbService.calculateFinancialSummary(filteredOrders, filteredExpenses, returns);
  }, [filteredOrders, filteredExpenses, returns]);

  // Handle Add Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim()) {
      toast?.('يرجى كتابة عنوان للمصروف', 'error');
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
      setExpenses(prev => [newExp, ...prev]);
      toast?.('تمت إضافة المصروف التشغيلي بنجاح 💰', 'success');
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

  // Handle Delete Expense
  const handleDeleteExpense = async (id: string) => {
    if (!confirm('هل أنتِ متأكدة من حذف هذا المصروف؟')) return;
    try {
      await dbService.deleteOperatingExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast?.('تم حذف المصروف بنجاح', 'success');
    } catch (err: any) {
      toast?.(`فشل حذف المصروف: ${err?.message || ''}`, 'error');
    }
  };

  // Handle Save Product Cost
  const handleSaveProductCost = async (product: Product) => {
    try {
      setIsSavingCost(true);
      const updated: Product = { ...product, costPrice: editingCostVal };
      await dbService.saveProduct(updated);
      if (onUpdateProductCost) {
        await onUpdateProductCost(product.id, editingCostVal);
      }
      toast?.(`تم تحديث تكلفة شراء "${product.nameAr}" إلى ${editingCostVal} ر.س بنجاح 🏷️`, 'success');
      setEditingCostId(null);
    } catch (err: any) {
      toast?.(`فشل تحديث التكلفة: ${err?.message || ''}`, 'error');
    } finally {
      setIsSavingCost(false);
    }
  };

  // Category Arabic translation map
  const categoryNames: Record<string, string> = {
    marketing: 'إعلانات وتسويق',
    shipping: 'شحن ونقل',
    packaging: 'تغليف وبوكسات',
    software: 'برمجيات واشتراكات',
    salaries: 'رواتب وعمولات',
    other: 'مصاريف أخرى'
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header & Date Range Selector */}
      <div className="bg-white border border-gray-200/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">
                الذكاء المالي والأرباح الحقيقية (P&L Intelligence)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                حساب دقيق يستند لطلبات Supabase وتكاليف الشراء والمصروفات التشغيلية. لا نعتبر الإيراد ربحاً.
              </p>
            </div>
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1.5 bg-[#FAF9F6] p-1 rounded-2xl border border-gray-200 text-xs font-bold">
          <button
            onClick={() => setDateRange('today')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${dateRange === 'today' ? 'bg-[#A44C5C] text-white shadow-xs' : 'text-gray-600 hover:text-black'}`}
          >
            اليوم
          </button>
          <button
            onClick={() => setDateRange('7days')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${dateRange === '7days' ? 'bg-[#A44C5C] text-white shadow-xs' : 'text-gray-600 hover:text-black'}`}
          >
            آخر 7 أيام
          </button>
          <button
            onClick={() => setDateRange('30days')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${dateRange === '30days' ? 'bg-[#A44C5C] text-white shadow-xs' : 'text-gray-600 hover:text-black'}`}
          >
            آخر 30 يوماً
          </button>
          <button
            onClick={() => setDateRange('90days')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${dateRange === '90days' ? 'bg-[#A44C5C] text-white shadow-xs' : 'text-gray-600 hover:text-black'}`}
          >
            آخر 90 يوماً
          </button>
          <button
            onClick={() => setDateRange('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${dateRange === 'all' ? 'bg-[#A44C5C] text-white shadow-xs' : 'text-gray-600 hover:text-black'}`}
          >
            كل الأوقات
          </button>
        </div>
      </div>

      {/* COGS Reliability Alert */}
      {summary.cogsReliability === 'unavailable' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">تنبيه بشأن تكلفة البضاعة المباعة (COGS):</p>
            <p className="leading-relaxed">
              لم يتم إدخال سعر تكلفة الشراء للقطع حتى الآن. يتم عرض صافي المبيعات بدقة، لكن احتساب إجمالي وصافي الأرباح يتطلب إدخال تكلفة شراء القطع في جدول "تكاليف الشراء" أدناه.
            </p>
          </div>
        </div>
      )}

      {/* Key Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales */}
        <div className="bg-white border border-gray-200/80 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold">إجمالي المبيعات (Gross Sales)</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-950 font-mono">
            {summary.grossSales.toLocaleString()} <span className="text-xs font-normal">ر.س</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-sans">
            مجموع أسعار القطع قبل الخصومات ومصاريف الشحن.
          </p>
        </div>

        {/* Net Sales */}
        <div className="bg-white border border-gray-200/80 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold">صافي المبيعات (Net Sales)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {summary.netSales.toLocaleString()} <span className="text-xs font-normal">ر.س</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-sans">
            الإجمالي - الخصومات ({summary.totalDiscounts} ر.س) - المرتجعات ({summary.totalRefunds} ر.س) + الشحن.
          </p>
        </div>

        {/* Cost of Goods Sold (COGS) */}
        <div className="bg-white border border-gray-200/80 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold">تكلفة البضاعة (COGS)</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Tag size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-900 font-mono">
            {summary.cogs.toLocaleString()} <span className="text-xs font-normal">ر.س</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
              summary.cogsReliability === 'exact' 
                ? 'bg-emerald-100 text-emerald-800' 
                : (summary.cogsReliability === 'partial' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600')
            }`}>
              {summary.cogsReliability === 'exact' ? 'دقيق ومكتمل ✓' : (summary.cogsReliability === 'partial' ? 'جزئي (بعض القطع بدون تكلفة)' : 'غير مدخل')}
            </span>
          </div>
        </div>

        {/* Estimated Net Profit */}
        <div className={`border-2 rounded-3xl p-5 shadow-xs ${
          summary.estimatedNetProfit >= 0 ? 'bg-emerald-50/50 border-emerald-300' : 'bg-rose-50/50 border-rose-300'
        }`}>
          <div className="flex items-center justify-between text-gray-600 mb-2">
            <span className="text-xs font-bold">صافي الربح التقديري (Net Profit)</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              summary.estimatedNetProfit >= 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}>
              <DollarSign size={14} />
            </div>
          </div>
          <div className={`text-2xl font-black font-mono ${
            summary.estimatedNetProfit >= 0 ? 'text-emerald-900' : 'text-rose-900'
          }`}>
            {summary.estimatedNetProfit.toLocaleString()} <span className="text-xs font-normal">ر.س</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-sans">
            إجمالي الربح ({summary.grossProfit.toLocaleString()} ر.س) - المصاريف ({summary.operatingExpenses.toLocaleString()} ر.س).
          </p>
        </div>
      </div>

      {/* Financial Calculation Breakdown Table */}
      <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
          <FileText size={16} className="text-[#A44C5C]" />
          <span>قائمة الدخل والتدفق المالي الموثق (Income Statement Breakdown)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-bold">
                <th className="py-2.5 px-3">البند المالي</th>
                <th className="py-2.5 px-3">طريقة الحساب ومصدر البيانات</th>
                <th className="py-2.5 px-3 font-mono text-left">المبلغ (ر.س)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              <tr>
                <td className="py-3 px-3 font-bold text-gray-900">إجمالي مبيعات المنتجات (Gross Sales)</td>
                <td className="py-3 px-3 text-gray-500">مجموع أسعار قطع الطلبات المؤكدة والمسلمة (جدول orders.items)</td>
                <td className="py-3 px-3 font-mono font-bold text-gray-900 text-left">+{summary.grossSales.toLocaleString()}</td>
              </tr>
              <tr className="text-rose-700">
                <td className="py-3 px-3 font-bold">الخصومات والكوبونات (Discounts)</td>
                <td className="py-3 px-3 text-gray-500">مجموع مبالغ التخفيض من الكوبونات وعروض الترويح (orders.discount_amount)</td>
                <td className="py-3 px-3 font-mono font-bold text-left">-{summary.totalDiscounts.toLocaleString()}</td>
              </tr>
              <tr className="text-rose-700">
                <td className="py-3 px-3 font-bold">المرتجعات والمبالغ المستردة (Refunds)</td>
                <td className="py-3 px-3 text-gray-500">مجموع المبالغ المستردة للعميلات من جدول returns_and_refunds</td>
                <td className="py-3 px-3 font-mono font-bold text-left">-{summary.totalRefunds.toLocaleString()}</td>
              </tr>
              <tr className="text-blue-700">
                <td className="py-3 px-3 font-bold">إيراد الشحن المحصل (Shipping Revenue)</td>
                <td className="py-3 px-3 text-gray-500">رسوم الشحن المحصلة (40 ر.س للطلبات أقل من 299 ر.س)</td>
                <td className="py-3 px-3 font-mono font-bold text-left">+{summary.shippingRevenue.toLocaleString()}</td>
              </tr>
              <tr className="bg-gray-50/80 font-bold text-gray-950">
                <td className="py-3 px-3 font-black">= صافي المبيعات (Net Sales)</td>
                <td className="py-3 px-3 text-gray-600 font-normal">المبلغ الفعلي المحقق بعد الخصومات والشحن</td>
                <td className="py-3 px-3 font-mono font-black text-left">{summary.netSales.toLocaleString()}</td>
              </tr>
              <tr className="text-purple-900">
                <td className="py-3 px-3 font-bold">تكلفة البضاعة المباعة (COGS)</td>
                <td className="py-3 px-3 text-gray-500">مجموع (الكمية المباعة × تكلفة الشراء للقطعة products.cost_price)</td>
                <td className="py-3 px-3 font-mono font-bold text-left">-{summary.cogs.toLocaleString()}</td>
              </tr>
              <tr className="bg-emerald-50/60 font-bold text-emerald-950">
                <td className="py-3 px-3 font-black">= إجمالي الربح التشغيلي (Gross Profit)</td>
                <td className="py-3 px-3 text-emerald-800 font-normal">صافي المبيعات مطروحاً منه تكلفة شراء البضاعة</td>
                <td className="py-3 px-3 font-mono font-black text-left">{summary.grossProfit.toLocaleString()}</td>
              </tr>
              <tr className="text-amber-800">
                <td className="py-3 px-3 font-bold">المصروفات التشغيلية والتسويقية (Operating Expenses)</td>
                <td className="py-3 px-3 text-gray-500">إجمالي الإعلانات والتغليف والاشتراكات من جدول operating_expenses</td>
                <td className="py-3 px-3 font-mono font-bold text-left">-{summary.operatingExpenses.toLocaleString()}</td>
              </tr>
              <tr className="bg-emerald-100/70 text-emerald-950 font-black text-sm">
                <td className="py-3.5 px-3">= صافي الربح الحقيقي النهائي (Net Profit)</td>
                <td className="py-3.5 px-3 text-emerald-900 font-normal text-xs">الربح الصافي الفعلي بعد حسم كافة التكاليف والمصاريف</td>
                <td className="py-3.5 px-3 font-mono text-left">{summary.estimatedNetProfit.toLocaleString()} ر.س</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Operating Expenses & Product Costs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Operating Expenses Module */}
        <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <span>المصروفات التشغيلية والتسويقية</span>
                <span className="bg-gray-100 text-gray-700 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full">
                  {expenses.length}
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                سجّلي تكاليف الحملات الإعلانية، البوكسات، الشحن، والبرمجيات.
              </p>
            </div>
            <button
              onClick={() => setIsAddingExpense(!isAddingExpense)}
              className="bg-[#A44C5C] hover:bg-[#8D3B4A] text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Plus size={14} />
              <span>إضافة مصروف</span>
            </button>
          </div>

          {/* Add Expense Form */}
          {isAddingExpense && (
            <form onSubmit={handleAddExpense} className="bg-[#FAF9F6] border border-gray-200 rounded-2xl p-4 space-y-3 animate-fade-in">
              <div className="font-bold text-xs text-gray-900">تسجيل مصروف جديد:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">بيان المصروف:</label>
                  <input
                    type="text"
                    placeholder="مثال: إعلانات تيك توك وسناب شات"
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    required
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:border-[#A44C5C] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">التصنيف:</label>
                  <select
                    value={expenseCategory}
                    onChange={(e: any) => setExpenseCategory(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:border-[#A44C5C] outline-hidden"
                  >
                    <option value="marketing">إعلانات وتسويق</option>
                    <option value="packaging">تغليف وبوكسات</option>
                    <option value="shipping">شحن ونقل</option>
                    <option value="software">برمجيات واشتراكات</option>
                    <option value="salaries">رواتب وعمولات</option>
                    <option value="other">مصاريف أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">المبلغ (ر.س):</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="مثال: 500"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 focus:border-[#A44C5C] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">التاريخ:</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:border-[#A44C5C] outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">ملاحظات إضافية (اختياري):</label>
                <input
                  type="text"
                  placeholder="رقم الفاتورة أو تفاصيل إضافية..."
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:border-[#A44C5C] outline-hidden"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingExpense(false)}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-black cursor-pointer font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExpense}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmittingExpense ? 'جاري الحفظ...' : 'حفظ المصروف ✓'}
                </button>
              </div>
            </form>
          )}

          {/* Expenses List */}
          <div className="max-h-80 overflow-y-auto space-y-2">
            {expenses.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">
                لا توجد مصروفات مسجلة حالياً. اضغطي "إضافة مصروف" لتسجيل تكاليف المتجر.
              </div>
            ) : (
              expenses.map(exp => (
                <div key={exp.id} className="bg-[#FAF9F6] border border-gray-200/80 rounded-2xl p-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-gray-900 flex items-center gap-2">
                      <span>{exp.title}</span>
                      <span className="bg-gray-200/80 text-gray-700 text-[10px] px-2 py-0.5 rounded-md font-sans">
                        {categoryNames[exp.category] || exp.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5 font-mono">
                      {exp.date} {exp.notes ? `• ${exp.notes}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-rose-700 text-sm">
                      -{exp.amount.toLocaleString()} ر.س
                    </span>
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="text-gray-400 hover:text-rose-600 transition-colors cursor-pointer p-1"
                      title="حذف المصروف"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Product Purchase Cost (COGS) Manager */}
        <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Tag size={16} className="text-[#A44C5C]" />
              <span>تكلفة شراء القطع (COGS Settings)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              حددي سعر الشراء بالجملة لكل قطعة لاحتساب هامش الربح بدقة. هذه الأسعار سرية تماماً ولا تظهر للعميلات.
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2.5">
            {products.map(prod => {
              const sellingPrice = prod.priceSA || 69;
              const cost = prod.costPrice || 0;
              const profitMargin = sellingPrice > 0 ? Math.round(((sellingPrice - cost) / sellingPrice) * 100) : 0;
              const isEditing = editingCostId === prod.id;

              return (
                <div key={prod.id} className="bg-[#FAF9F6] border border-gray-200/80 rounded-2xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    {prod.images?.[0] ? (
                      <img src={prod.images[0]} alt={prod.nameAr} className="w-10 h-10 object-cover rounded-xl" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                    )}
                    <div>
                      <div className="font-bold text-gray-900">{prod.nameAr}</div>
                      <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                        سعر البيع: <span className="font-bold">{sellingPrice} ر.س</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          value={editingCostVal}
                          onChange={(e) => setEditingCostVal(Number(e.target.value))}
                          className="w-16 bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-mono text-center outline-hidden"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveProductCost(prod)}
                          disabled={isSavingCost}
                          className="bg-emerald-600 text-white text-[11px] font-bold px-2 py-1 rounded-lg cursor-pointer"
                        >
                          حفظ
                        </button>
                        <button
                          onClick={() => setEditingCostId(null)}
                          className="text-gray-400 hover:text-black text-[11px] cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <div className="text-left flex items-center gap-2.5">
                        <div>
                          <div className="font-mono font-bold text-gray-900">
                            {cost > 0 ? `${cost} ر.س` : <span className="text-amber-600 font-normal">غير محدد</span>}
                          </div>
                          {cost > 0 && (
                            <span className="text-[10px] font-bold text-emerald-700">
                              هامش: {profitMargin}%
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setEditingCostId(prod.id);
                            setEditingCostVal(cost);
                          }}
                          className="text-xs text-[#A44C5C] hover:underline font-bold cursor-pointer"
                        >
                          تعديل
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
