import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpLeft,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  Inbox,
  MessageSquare,
  Minus,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users
} from 'lucide-react';
import { OperatingExpense, Order, Product, ReturnRefundRequest, Settings } from '../../types';
import { dbService, cleanImgUrl, supabase } from '../../services/db';
import {
  CanonicalAdminRole,
  DashboardTabId,
  canAccessTab,
  canUpdateStock,
  canViewCostPrice
} from '../../utils/rbac';
import { fetchVisitorStatsFromSupabase } from '../../utils/analytics';
import {
  OverviewPeriod,
  PeriodMetricDelta,
  buildNeedsActionQueue,
  buildOverviewChartSeries,
  computeOverviewKpis,
  formatSarFromHalalas,
  toHalalas
} from '../../utils/dashboardMetrics';
import {
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminErrorState,
  AdminSkeleton
} from './AdminUI';

interface AdminOverviewProps {
  orders: Order[];
  products: Product[];
  adminRole: CanonicalAdminRole;
  settings: Settings | null;
  visitorStats: {
    liveCount: number;
    todayCount: number;
    weeklyVisitors: number;
    monthlyVisitors: number;
    dailyHistory: { date: string; visitors: number; orders?: number }[];
  };
  onNavigateTab: (tab: DashboardTabId) => void;
  onFilterOrders?: (filter: 'delayed' | 'pending' | 'all') => void;
  onFilterLowStock?: () => void;
  onSelectOrder: (order: Order) => void;
  onQuickAddStock: (product: Product, qty: number) => void;
  getStatusBadge: (status: string) => { label: string; color: string };
}

const PERIOD_OPTIONS: { id: OverviewPeriod; label: string }[] = [
  { id: 'today', label: 'اليوم' },
  { id: 'week', label: '7 أيام' },
  { id: 'month', label: '30 يوماً' }
];

function DeltaIndicator({
  delta,
  comparisonLabel
}: {
  delta: PeriodMetricDelta;
  comparisonLabel: string;
}) {
  if (delta.deltaPercent === null || delta.direction === 'none') {
    return (
      <span className="text-[11px] font-medium text-gray-500">
        لا توجد بيانات سابقة ({comparisonLabel})
      </span>
    );
  }

  if (delta.direction === 'flat') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 font-mono tabular-nums">
        <Minus size={12} />
        <span>0%</span>
        <span className="font-sans text-gray-500 font-normal">{comparisonLabel}</span>
      </span>
    );
  }

  const isUp = delta.direction === 'up';
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold font-mono tabular-nums ${
        isUp ? 'text-emerald-800' : 'text-rose-800'
      }`}
    >
      {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      <span>
        {isUp ? '+' : ''}
        {delta.deltaPercent}%
      </span>
      <span className="font-sans text-gray-500 font-normal">{comparisonLabel}</span>
    </span>
  );
}

export default function AdminOverview({
  orders,
  products,
  adminRole,
  visitorStats,
  onNavigateTab,
  onFilterOrders,
  onFilterLowStock,
  onSelectOrder,
  onQuickAddStock,
  getStatusBadge
}: AdminOverviewProps) {
  const [period, setPeriod] = useState<OverviewPeriod>('month');
  const [returns, setReturns] = useState<ReturnRefundRequest[]>([]);
  const [expenses, setExpenses] = useState<OperatingExpense[]>([]);
  const [serverVisitorHistory, setServerVisitorHistory] = useState<
    { date: string; visitors: number }[]
  >([]);
  const [unansweredMessagesCount, setUnansweredMessagesCount] = useState<number>(0);
  const [isLoadingExtras, setIsLoadingExtras] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  const canSeeFinancials =
    canAccessTab(adminRole, 'finances') || canViewCostPrice(adminRole);
  const allowStockEdit = canUpdateStock(adminRole);

  useEffect(() => {
    let active = true;
    const loadOverviewOperationalData = async () => {
      setIsLoadingExtras(true);
      setLoadError(null);
      try {
        const [retList, expList, cloudHistory] = await Promise.all([
          dbService.getReturnsAndRefunds().catch(() => [] as ReturnRefundRequest[]),
          canSeeFinancials
            ? dbService.getOperatingExpenses().catch(() => [] as OperatingExpense[])
            : Promise.resolve([] as OperatingExpense[]),
          fetchVisitorStatsFromSupabase('monthly').catch(() => [])
        ]);

        let openMessages = 0;
        try {
          const { data: ticketRows } = await supabase
            .from('support_tickets')
            .select('id, status, subject')
            .in('status', ['new', 'waiting_customer'])
            .limit(100);

          if (Array.isArray(ticketRows)) {
            openMessages = ticketRows.filter((row: any) => {
              const subj = String(row.subject || '');
              return (
                !subj.startsWith('ORDER:') &&
                !subj.startsWith('ORDER-') &&
                !subj.startsWith('LEAD:') &&
                !subj.startsWith('visit:')
              );
            }).length;
          }
        } catch {
          // Optional table; keep 0 gracefully
        }

        if (!active) return;
        setReturns(Array.isArray(retList) ? retList : []);
        setExpenses(Array.isArray(expList) ? expList : []);
        setServerVisitorHistory(Array.isArray(cloudHistory) ? cloudHistory : []);
        setUnansweredMessagesCount(openMessages);
      } catch (err: any) {
        if (!active) return;
        setLoadError(err?.message || 'تعذر تحميل بعض البيانات التشغيلية للنظرة العامة.');
      } finally {
        if (active) setIsLoadingExtras(false);
      }
    };

    loadOverviewOperationalData();
    return () => {
      active = false;
    };
  }, [canSeeFinancials, reloadTrigger]);

  const mergedVisitorHistory = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of visitorStats.dailyHistory || []) {
      if (h?.date) map.set(h.date, Math.max(map.get(h.date) || 0, Number(h.visitors) || 0));
    }
    for (const h of serverVisitorHistory) {
      if (h?.date) map.set(h.date, Math.max(map.get(h.date) || 0, Number(h.visitors) || 0));
    }
    return Array.from(map.entries()).map(([date, visitors]) => ({ date, visitors }));
  }, [visitorStats.dailyHistory, serverVisitorHistory]);

  const summary = useMemo(
    () =>
      computeOverviewKpis({
        period,
        orders,
        products,
        returns,
        expenses: canSeeFinancials ? expenses : [],
        visitorDailyHistory: mergedVisitorHistory,
        todayVisitorsCount: visitorStats.todayCount
      }),
    [period, orders, products, returns, expenses, canSeeFinancials, mergedVisitorHistory, visitorStats.todayCount]
  );

  const chartSeries = useMemo(
    () =>
      buildOverviewChartSeries({
        period,
        orders,
        products
      }),
    [period, orders, products]
  );

  const needsActionItems = useMemo(
    () =>
      buildNeedsActionQueue({
        orders,
        products,
        returns,
        unansweredMessagesCount
      }),
    [orders, products, returns, unansweredMessagesCount]
  );

  const criticalProducts = useMemo(
    () =>
      [...products]
        .filter((p) => Number(p.stock) < 5)
        .sort((a, b) => Number(a.stock) - Number(b.stock))
        .slice(0, 6),
    [products]
  );

  const recentOrders = useMemo(() => orders.slice(0, 6), [orders]);

  const hasChartActivity = useMemo(
    () => chartSeries.some((p) => p.ordersCount > 0 || p.revenueSar > 0),
    [chartSeries]
  );

  if (isLoadingExtras && orders.length === 0 && products.length === 0) {
    return <AdminSkeleton rows={5} cards={4} />;
  }

  return (
    <div className="space-y-6">
      {loadError && (
        <AdminErrorState
          title="تنبيه في تحميل مؤشرات النظرة العامة"
          message={loadError}
          onRetry={() => setReloadTrigger((c) => c + 1)}
        />
      )}

      {/* Header & Period Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-950">
            ملخص الأداء والعمليات ({summary.periodLabelAr})
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">
            أرقام حقيقية محسوبة من الطلبات والمخزون والزيارات المسجلة · {summary.comparisonLabelAr}
          </p>
        </div>

        <div
          className="inline-flex items-center bg-white border border-gray-200 rounded-xl p-1 self-start sm:self-auto"
          role="group"
          aria-label="تحديد الفترة الزمنية"
        >
          {PERIOD_OPTIONS.map((opt) => {
            const active = period === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPeriod(opt.id)}
                className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#A44C5C] text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-950'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards Grid (Role-Gated Financials) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {canSeeFinancials && (
          <AdminCard padding="sm" className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-gray-600">
                مبيعات {summary.periodLabelAr}
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#FCF5F6] border border-[#A44C5C]/20 text-[#A44C5C] flex items-center justify-center shrink-0">
                <DollarSign size={18} />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-950 font-mono tabular-nums">
              {formatSarFromHalalas(summary.current.revenueHalalas)}
            </div>
            <DeltaIndicator
              delta={summary.deltas.revenue}
              comparisonLabel={summary.comparisonLabelAr}
            />
          </AdminCard>
        )}

        <AdminCard padding="sm" className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-gray-600">
              عدد الطلبات ({summary.periodLabelAr})
            </span>
            <div className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 text-gray-800 flex items-center justify-center shrink-0">
              <Package size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-950 font-mono tabular-nums">
            {summary.current.ordersCount.toLocaleString('en-US')}
          </div>
          <DeltaIndicator
            delta={summary.deltas.orders}
            comparisonLabel={summary.comparisonLabelAr}
          />
        </AdminCard>

        {canSeeFinancials && (
          <AdminCard padding="sm" className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-gray-600">متوسط قيمة الطلب (AOV)</span>
              <div className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 text-gray-800 flex items-center justify-center shrink-0">
                <ShoppingBag size={18} />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-950 font-mono tabular-nums">
              {summary.current.ordersCount > 0
                ? formatSarFromHalalas(summary.current.aovHalalas)
                : '—'}
            </div>
            <DeltaIndicator
              delta={summary.deltas.aov}
              comparisonLabel={summary.comparisonLabelAr}
            />
          </AdminCard>
        )}

        {canSeeFinancials && (
          <AdminCard padding="sm" className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-gray-600">صافي الربح التقديري</span>
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                  summary.current.netProfitHalalas >= 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-950 font-mono tabular-nums">
              {summary.current.cogsReliability === 'unavailable' &&
              summary.current.ordersCount > 0
                ? '—'
                : formatSarFromHalalas(summary.current.netProfitHalalas)}
            </div>
            {summary.current.cogsReliability === 'unavailable' &&
            summary.current.ordersCount > 0 ? (
              <span className="text-[11px] font-medium text-amber-800 block">
                أضيفي سعر التكلفة للمنتجات لحساب صافي الربح بدقة
              </span>
            ) : summary.current.cogsReliability === 'partial' ? (
              <span className="text-[11px] font-medium text-amber-800 block">
                توجد {summary.current.missingCostUnits} قطع بدون تكلفة مسجلة
              </span>
            ) : (
              <DeltaIndicator
                delta={summary.deltas.netProfit}
                comparisonLabel={summary.comparisonLabelAr}
              />
            )}
          </AdminCard>
        )}

        <AdminCard padding="sm" className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-gray-600">نسبة التحويل</span>
            <div className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 text-gray-800 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-950 font-mono tabular-nums">
            {summary.current.conversionRate !== null
              ? `${summary.current.conversionRate}%`
              : '—'}
          </div>
          {summary.current.conversionRate === null ? (
            <span className="text-[11px] font-medium text-gray-500 block">
              لا توجد زيارات مسجلة لهذه الفترة
            </span>
          ) : (
            <div className="flex flex-col gap-0.5">
              <DeltaIndicator
                delta={summary.deltas.conversionRate}
                comparisonLabel={summary.comparisonLabelAr}
              />
              <span className="text-[11px] text-gray-500 font-mono tabular-nums">
                {summary.current.visitorsCount.toLocaleString('en-US')} زيارة مسجلة
              </span>
            </div>
          )}
        </AdminCard>

        <AdminCard padding="sm" className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-gray-600">الطلبات المعلقة</span>
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                summary.operations.pendingOrdersCount > 0
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-gray-100 border-gray-200 text-gray-700'
              }`}
            >
              <Clock size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-950 font-mono tabular-nums">
            {summary.operations.pendingOrdersCount.toLocaleString('en-US')}
          </div>
          <span className="text-[11px] text-gray-600 block">
            {summary.operations.delayedOrdersCount > 0
              ? `${summary.operations.delayedOrdersCount} متأخرة أكثر من 48 ساعة`
              : 'بانتظار التأكيد أو التجهيز'}
          </span>
        </AdminCard>

        <AdminCard padding="sm" className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-gray-600">منتجات قاربت على النفاد</span>
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                summary.operations.lowStockCount > 0
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-950 font-mono tabular-nums">
            {summary.operations.lowStockCount.toLocaleString('en-US')}
          </div>
          <span className="text-[11px] text-gray-600 block">
            {summary.operations.outOfStockCount > 0
              ? `منها ${summary.operations.outOfStockCount} نفدت تماماً`
              : 'مخزون أقل من 5 قطع'}
          </span>
        </AdminCard>

        {!canSeeFinancials && (
          <AdminCard padding="sm" className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-gray-600">قيد التجهيز والشحن</span>
              <div className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 text-gray-800 flex items-center justify-center shrink-0">
                <Truck size={18} />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-950 font-mono tabular-nums">
              {(
                summary.operations.processingOrdersCount +
                summary.operations.shippedOrdersCount
              ).toLocaleString('en-US')}
            </div>
            <span className="text-[11px] text-gray-600 block">
              {summary.operations.processingOrdersCount} للتجهيز ·{' '}
              {summary.operations.shippedOrdersCount} قيد التوصيل
            </span>
          </AdminCard>
        )}

        <AdminCard padding="sm" className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-gray-600">
              {canSeeFinancials ? 'الزوار النشطون الآن' : 'الاستفسارات المفتوحة'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 text-gray-800 flex items-center justify-center shrink-0">
              {canSeeFinancials ? <Users size={18} /> : <MessageSquare size={18} />}
            </div>
          </div>
          <div className="text-2xl font-black text-gray-950 font-mono tabular-nums">
            {canSeeFinancials
              ? visitorStats.liveCount.toLocaleString('en-US')
              : unansweredMessagesCount.toLocaleString('en-US')}
          </div>
          <span className="text-[11px] text-gray-600 block font-mono tabular-nums">
            {canSeeFinancials
              ? `زوار اليوم: ${visitorStats.todayCount.toLocaleString('en-US')}`
              : 'تذاكر بانتظار الرد'}
          </span>
        </AdminCard>
      </div>

      {/* Main Two-Column Section: Sales Chart + Needs Action Now */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Main (7 cols on desktop): Sales / Orders Chart */}
        <AdminCard className="lg:col-span-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-950">
                {canSeeFinancials
                  ? `منحنى المبيعات (${summary.periodLabelAr})`
                  : `حركة الطلبات (${summary.periodLabelAr})`}
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                {canSeeFinancials
                  ? 'المبيعات اليومية بالريال السعودي (باستثناء الطلبات الملغاة)'
                  : 'توزيع الطلبات المستلمة خلال الفترة المحددة'}
              </p>
            </div>
            {canSeeFinancials && (
              <div className="flex items-center gap-4 text-xs text-gray-700 font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#A44C5C]" />
                  <span>المبيعات</span>
                </span>
                {summary.current.cogsReliability !== 'unavailable' && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#0F766E]" />
                    <span>الربح التقديري</span>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="h-72 w-full">
            {!hasChartActivity ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-2 border border-dashed border-gray-200 rounded-xl bg-[#FAF9F6] p-6">
                <BarChart3 size={32} className="text-gray-400" />
                <p className="text-xs sm:text-sm font-bold text-gray-800">
                  لا توجد طلبات مسجلة في هذه الفترة ({summary.periodLabelAr})
                </p>
                <p className="text-xs text-gray-600">
                  جرّبي تغيير النطاق الزمني إلى «30 يوماً» أو ستظهر البيانات هنا فور تسجيل طلب جديد.
                </p>
              </div>
            ) : canSeeFinancials ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sultaRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A44C5C" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#A44C5C" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="sultaProfitFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F766E" stopOpacity={0.14} />
                      <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFECE8" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    fontSize={11}
                    stroke="#6B7280"
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    fontSize={11}
                    stroke="#6B7280"
                    width={46}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const pt = payload[0].payload;
                      return (
                        <div
                          dir="rtl"
                          className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-right text-xs space-y-1.5"
                        >
                          <p className="font-bold text-gray-950">{pt.fullLabel}</p>
                          <p className="font-mono tabular-nums text-[#A44C5C] font-bold">
                            المبيعات: {Number(pt.revenueSar).toLocaleString('en-US')} ر.س
                          </p>
                          {summary.current.cogsReliability !== 'unavailable' && (
                            <p className="font-mono tabular-nums text-[#0F766E] font-bold">
                              الربح التقديري: {Number(pt.netProfitSar).toLocaleString('en-US')} ر.س
                            </p>
                          )}
                          <p className="font-mono tabular-nums text-gray-700">
                            الطلبات: {pt.ordersCount}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenueSar"
                    name="المبيعات"
                    stroke="#A44C5C"
                    strokeWidth={2.5}
                    fill="url(#sultaRevenueFill)"
                  />
                  {summary.current.cogsReliability !== 'unavailable' && (
                    <Area
                      type="monotone"
                      dataKey="netProfitSar"
                      name="الربح التقديري"
                      stroke="#0F766E"
                      strokeWidth={2}
                      fill="url(#sultaProfitFill)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFECE8" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    fontSize={11}
                    stroke="#6B7280"
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    fontSize={11}
                    stroke="#6B7280"
                    allowDecimals={false}
                    width={36}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const pt = payload[0].payload;
                      return (
                        <div
                          dir="rtl"
                          className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-right text-xs space-y-1"
                        >
                          <p className="font-bold text-gray-950">{pt.fullLabel}</p>
                          <p className="font-mono tabular-nums text-[#A44C5C] font-bold">
                            عدد الطلبات: {pt.ordersCount}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="ordersCount"
                    name="الطلبات"
                    fill="#A44C5C"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </AdminCard>

        {/* Right/Urgent (5 cols on desktop): Needs Action Now Queue */}
        <AdminCard className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-950">تحتاج إجراء الآن</h3>
              <p className="text-xs text-gray-600 mt-0.5">
                أولويات التشغيل اليومية مرتبة حسب الأهمية
              </p>
            </div>
            <span className="font-mono tabular-nums text-xs font-bold text-gray-700 bg-gray-100 border border-gray-200 rounded-lg px-2.5 py-1">
              {needsActionItems.length}
            </span>
          </div>

          {needsActionItems.length === 0 ? (
            <div className="py-8 text-center space-y-2 border border-dashed border-gray-200 rounded-xl bg-[#FAF9F6]">
              <CheckCircle2 size={28} className="mx-auto text-emerald-700" />
              <p className="text-sm font-bold text-gray-900">كل العمليات تحت السيطرة</p>
              <p className="text-xs text-gray-600">
                لا توجد طلبات متأخرة أو مرتجعات معلقة أو نقص حرج في المخزون حالياً.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {needsActionItems.map((item) => {
                const badgeStyle =
                  item.severity === 'urgent'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : item.severity === 'warning'
                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                      : 'bg-sky-50 text-sky-900 border-sky-200';

                const iconEl =
                  item.category === 'orders' ? (
                    <Package size={16} />
                  ) : item.category === 'returns' ? (
                    <RefreshCw size={16} />
                  ) : item.category === 'inventory' ? (
                    <AlertTriangle size={16} />
                  ) : (
                    <Inbox size={16} />
                  );

                return (
                  <li key={item.id} className="py-3 first:pt-1 last:pb-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${badgeStyle}`}
                        >
                          {iconEl}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-gray-950">
                              {item.title}
                            </span>
                            <span className="font-mono tabular-nums text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 border border-gray-200">
                              {item.count}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (item.id === 'delayed-orders' && onFilterOrders) {
                            onFilterOrders('delayed');
                          } else if (item.id === 'new-orders' && onFilterOrders) {
                            onFilterOrders('pending');
                          } else if (item.id === 'low-stock' && onFilterLowStock) {
                            onFilterLowStock();
                          } else {
                            onNavigateTab(item.targetTab);
                          }
                        }}
                        className="min-h-[44px] px-3 py-2 rounded-xl border border-gray-200 hover:border-[#A44C5C] hover:text-[#A44C5C] bg-white text-xs font-bold text-gray-800 inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                      >
                        <span>{item.actionLabel}</span>
                        <ArrowUpLeft size={14} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Inline Critical Stock Quick Restock Strip (when low stock exists) */}
          {criticalProducts.length > 0 && (
            <div className="pt-3 border-t border-gray-100 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-800">أكثر المنتجات قرباً للنفاد</span>
                <button
                  type="button"
                  onClick={() => (onFilterLowStock ? onFilterLowStock() : onNavigateTab('products'))}
                  className="text-[#A44C5C] hover:underline font-bold cursor-pointer min-h-[44px] px-1 inline-flex items-center"
                >
                  عرض الكل
                </button>
              </div>
              <div className="space-y-2">
                {criticalProducts.slice(0, 3).map((prod) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#FAF9F6] border border-gray-200"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={cleanImgUrl(prod.images?.[0] || '', prod.category)}
                        alt={prod.nameAr}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200 bg-white shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-950 truncate">{prod.nameAr}</p>
                        <p className="text-[11px] text-rose-800 font-mono tabular-nums font-bold">
                          المتبقي: {Number(prod.stock)}
                        </p>
                      </div>
                    </div>
                    {allowStockEdit && (
                      <button
                        type="button"
                        onClick={() => onQuickAddStock(prod, 10)}
                        className="min-h-[44px] px-3 py-2 rounded-xl bg-white hover:bg-[#A44C5C] hover:text-white text-gray-900 border border-gray-300 hover:border-[#A44C5C] text-xs font-bold inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                        title="إضافة 10 قطع للمخزون"
                      >
                        <Plus size={14} />
                        <span>10</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </AdminCard>
      </div>

      {/* Recent Orders Section (Responsive Cards on Mobile + Clean Table on Desktop) */}
      <AdminCard padding="none" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-950">أحدث الطلبات</h3>
            <p className="text-xs text-gray-600 mt-0.5">
              آخر 6 طلبات مسجلة في المتجر
            </p>
          </div>
          <AdminButton
            variant="outline"
            size="sm"
            onClick={() => (onFilterOrders ? onFilterOrders('all') : onNavigateTab('orders'))}
          >
            <span>إدارة جميع الطلبات</span>
            <ArrowUpLeft size={14} />
          </AdminButton>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-6">
            <AdminEmptyState
              title="لا توجد طلبات مسجلة بعد"
              description="عند إتمام أول طلب من العميلات في المتجر سيظهر هنا فوراً."
              icon={<Package size={24} />}
            />
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {recentOrders.map((order) => {
                const badge = getStatusBadge(order.status);
                return (
                  <div key={order.id} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono tabular-nums font-bold text-xs text-gray-950">
                        #{order.id.slice(0, 8)}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-950 truncate">{order.customerName}</p>
                        <p className="text-[11px] text-gray-600">
                          {order.city || 'الرياض'} ·{' '}
                          <span className="font-mono tabular-nums" dir="ltr">
                            {order.phone}
                          </span>
                        </p>
                      </div>
                      {canSeeFinancials && (
                        <span className="font-mono tabular-nums font-black text-gray-950 shrink-0">
                          {formatSarFromHalalas(toHalalas(order.totalPrice))}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectOrder(order);
                        onNavigateTab('orders');
                      }}
                      className="w-full min-h-[44px] rounded-xl bg-[#FAF9F6] hover:bg-gray-100 border border-gray-200 text-gray-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>فتح تفاصيل الطلب</span>
                      <ArrowUpLeft size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#FAF9F6] text-gray-700 border-b border-gray-200">
                  <tr>
                    <th className="py-3.5 px-5 font-bold">رقم الطلب</th>
                    <th className="py-3.5 px-5 font-bold">العميلة</th>
                    <th className="py-3.5 px-5 font-bold">المدينة</th>
                    {canSeeFinancials && <th className="py-3.5 px-5 font-bold">القيمة</th>}
                    <th className="py-3.5 px-5 font-bold">الحالة</th>
                    <th className="py-3.5 px-5 font-bold text-center">فتح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((order) => {
                    const badge = getStatusBadge(order.status);
                    return (
                      <tr key={order.id} className="hover:bg-[#FAF9F6] transition-colors">
                        <td className="py-3.5 px-5 font-mono tabular-nums font-bold text-gray-950">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-gray-950">{order.customerName}</div>
                          <div className="text-[11px] text-gray-600 font-mono tabular-nums" dir="ltr">
                            {order.phone}
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-gray-700 font-medium">
                          {order.city || 'الرياض'}
                        </td>
                        {canSeeFinancials && (
                          <td className="py-3.5 px-5 font-mono tabular-nums font-bold text-gray-950">
                            {formatSarFromHalalas(toHalalas(order.totalPrice))}
                          </td>
                        )}
                        <td className="py-3.5 px-5">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectOrder(order);
                              onNavigateTab('orders');
                            }}
                            aria-label={`فتح تفاصيل الطلب ${order.id}`}
                            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-800 hover:border-[#A44C5C] hover:text-[#A44C5C] transition-colors cursor-pointer"
                          >
                            <ArrowUpLeft size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </AdminCard>
    </div>
  );
}
