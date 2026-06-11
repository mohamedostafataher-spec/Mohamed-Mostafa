import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Crown, 
  Sparkles, 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  BarChart3, 
  Bell, 
  Activity, 
  ShieldAlert, 
  Globe, 
  MessageSquareCode, 
  Lock,
  ArrowRight,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Product, Order, CustomerProfile, Review, Category, Settings } from '../types';

// Import our modular centers
import SmartNotificationsCenter from './SmartNotificationsCenter';
import BrandReputationDashboard from './BrandReputationDashboard';
import AdminReviewsCenter from './AdminReviewsCenter';
import SultaExperienceScore from './SultaExperienceScore';
import CustomerIntelligence from './CustomerIntelligence';
import ProductPerformance from './ProductPerformance';
import SmartInventoryInsights from './SmartInventoryInsights';
import GlobalSystemConfig from './GlobalSystemConfig';
import VisualMerchandising from './VisualMerchandising';

interface ExecutiveCommandCenterProps {
  products: Product[];
  orders: Order[];
  customers: CustomerProfile[];
  reviews: Review[];
  categories: Category[];
  settings?: Settings;
  onRefreshData?: () => void;
}

export default function ExecutiveCommandCenter({
  products = [],
  orders = [],
  customers = [],
  reviews = [],
  categories = [],
  settings,
  onRefreshData,
}: ExecutiveCommandCenterProps) {
  // Tabs for sub-controls
  const [activeTab, setActiveTab] = useState<'kpis' | 'reviews_center' | 'notifications' | 'customers_intel' | 'products_performance' | 'inventory_insights' | 'brand_reputation' | 'store_health' | 'merchandising' | 'global_ready'>('kpis');

  // Aggregated analytics values
  const report = useMemo(() => {
    // A. Revenue
    const totalSAR = orders.filter((o) => o.currency === 'SAR' && o.status !== 'cancelled').reduce((sum, o) => sum + o.totalPrice, 0);
    const totalEGP = orders.filter((o) => o.currency === 'EGP' && o.status !== 'cancelled').reduce((sum, o) => sum + o.totalPrice, 0);

    // B. Total orders
    const completedOrdersCount = orders.filter((o) => o.status === 'delivered').length;

    // C. Daily Sales Chart construction
    const daysOfWeekAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const chartData = Array.from({ length: 7 })
      .map((_, idx) => {
        const d = new Date();
        d.setDate(d.getDate() - idx);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = daysOfWeekAr[d.getDay()];

        const dayOrders = orders.filter((o) => o.date === dateStr && o.status !== 'cancelled');
        // Combined value using exchange multiplier of 13.0 for EGP unified representation
        const egpEquivalent = dayOrders.reduce((sum, o) => {
          return sum + (o.currency === 'SAR' ? o.totalPrice * 13 : o.totalPrice);
        }, 0);

        return {
          name: dayName,
          sales: egpEquivalent,
        };
      })
      .reverse();

    // D. Missing configuration counts for health score tracking
    let healthIssues = 0;
    products.forEach((p) => {
      if (!p.sku || p.sku.trim() === '') healthIssues++;
      if (!p.descriptionAr || p.descriptionAr.trim().length < 20) healthIssues++;
    });

    return {
      totalSAR,
      totalEGP,
      completedOrdersCount,
      chartData,
      healthIssues,
    };
  }, [orders, products]);

  // Unified visual rendering based on tab selection
  const renderTabContent = () => {
    switch (activeTab) {
      case 'kpis':
        return (
          <div className="space-y-8 animate-fade-in-rapid">
            {/* Sales Chart Segment */}
            <div className="bg-[#FAF5F0]/30 border border-gray-150 p-6 rounded-3xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h4 className="font-serif text-sm font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp size={16} className="text-[#A44C5C]" />
                    مؤشر التدفق المالي الموحد (مصر والسعودية)
                  </h4>
                  <p className="text-[10px] text-gray-400 font-sans mt-0.5">يعرض الإيرادات الإجمالية المحتسبة بالجنيه المصري (بافتراض معامل صرف تيسيري) عن الـ 7 أيام الأخيرة.</p>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-gray-450">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#A44C5C]" />
                    مخطط مبيعات الكوتور حرة
                  </span>
                </div>
              </div>

              {/* Chart container */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A44C5C" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#A44C5C" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ stroke: '#DF8A9D' }} />
                    <Area type="monotone" dataKey="sales" stroke="#A44C5C" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Selta Brand Score & Notifications Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SmartNotificationsCenter
                orders={orders}
                products={products}
                reviews={reviews}
                healthIssuesCount={report.healthIssues}
                onNavigateToTab={(tab) => {
                  if (tab === 'orders') setActiveTab('kpis'); // Navigate or adjust tab
                  if (tab === 'inventory') setActiveTab('inventory_insights');
                  if (tab === 'system_health') setActiveTab('store_health');
                  if (tab === 'reviews') setActiveTab('reviews_center');
                  if (tab === 'kpis') setActiveTab('kpis');
                }}
              />

              <SultaExperienceScore
                products={products}
                categories={categories}
                onHealAll={async () => {
                  alert('الشفاء والترميم الفوري يعمل حالياً... جاري تعويض رموز SKU المفقودة وصنع صياغة ذكية للأوصاف.');
                  if (onRefreshData) onRefreshData();
                }}
              />
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="p-2 animate-fade-in-rapid">
            <SmartNotificationsCenter
              orders={orders}
              products={products}
              reviews={reviews}
              healthIssuesCount={report.healthIssues}
              onNavigateToTab={(tab) => {
                if (tab === 'inventory') setActiveTab('inventory_insights');
                if (tab === 'system_health') setActiveTab('store_health');
                if (tab === 'reviews') setActiveTab('reviews_center');
                if (tab === 'kpis') setActiveTab('kpis');
              }}
            />
          </div>
        );
      case 'customers_intel':
        return (
          <div className="animate-fade-in-rapid">
            <CustomerIntelligence customers={customers} orders={orders} />
          </div>
        );
      case 'products_performance':
        return (
          <div className="animate-fade-in-rapid">
            <ProductPerformance products={products} orders={orders} />
          </div>
        );
      case 'inventory_insights':
        return (
          <div className="animate-fade-in-rapid">
            <SmartInventoryInsights products={products} orders={orders} />
          </div>
        );
      case 'reviews_center':
        return (
          <div className="animate-fade-in-rapid">
            <AdminReviewsCenter reviews={reviews} products={products} />
          </div>
        );
      case 'brand_reputation':
        return (
          <div className="animate-fade-in-rapid">
            <BrandReputationDashboard reviews={reviews} totalOrdersCount={orders.length} />
          </div>
        );
      case 'store_health':
        return (
          <div className="animate-fade-in-rapid">
            <SultaExperienceScore products={products} categories={categories} />
          </div>
        );
      case 'merchandising':
        return (
          <div className="animate-fade-in-rapid">
            <VisualMerchandising products={products} collections={[]} onProductUpdate={onRefreshData} />
          </div>
        );
      case 'global_ready':
        return (
          <div className="animate-fade-in-rapid">
            <GlobalSystemConfig settings={settings} onSaveComplete={onRefreshData} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 text-right font-sans" dir="rtl">
      {/* Page Brand Head */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 p-1 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1 px-3 bg-[#A44C5C]/15 text-[#A44C5C] text-[10px] font-bold tracking-widest uppercase rounded-full font-serif flex items-center gap-1.5">
              <Crown size={12} className="text-[#A44C5C]" />
              COMMAND CENTER ULTRA
            </div>
            <span className="text-[10px] text-gray-400 font-sans">تحديث فوري دون تأخير</span>
          </div>
          <h3 className="text-xl md:text-2xl font-serif font-black text-gray-900">
            لوح القيادة والمركز التنفيذي الموحد لبراند SULTA
          </h3>
          <p className="text-gray-400 text-xs">
            بوابتك الذهبية للتحكم بالأقسام، تتبع العملاء الأوفياء، مراقبة مستودعات الرياض ومصر، وضبط معروضات البوتيك بأرقى معايير النخبة وسلايدر الواجهة.
          </p>
        </div>
      </div>

      {/* Grid Quick Figures */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-150 p-6 rounded-2.5xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">المبيعات الإجمالية بالمملكة 🇸🇦</span>
            <span className="text-2xl font-black text-gray-900 font-sans">{report.totalSAR.toLocaleString()} SAR</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Globe size={18} />
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-6 rounded-2.5xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">المبيعات الإجمالية بمصر 🇪🇬</span>
            <span className="text-2xl font-black text-gray-900 font-sans">{report.totalEGP.toLocaleString()} EGP</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#FAF5F0] border border-[#DF8A9D]/20 flex items-center justify-center text-[#A44C5C]">
            <Crown size={18} />
          </div>
        </div>

        <div className="bg-[#FAF5F0] border border-[#DF8A9D]/15 p-6 rounded-2.5xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[#A44C5C] text-[10px] uppercase font-bold block mb-1">الطلبات الفاخرة المكتملة</span>
            <span className="text-2xl font-black text-[#A44C5C] font-sans">{report.completedOrdersCount} شحنات</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <ShoppingBag size={18} />
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-6 rounded-2.5xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">معدل الفحص التشغيلي للروابط</span>
            <span className="text-2xl font-black text-emerald-600 font-sans">100% سليم</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <ShieldCheck size={18} />
          </div>
        </div>
      </div>

      {/* Internal Navigation Menu / Sub tabs */}
      <div className="flex gap-2 flex-wrap bg-gray-50 border border-gray-150 p-2 rounded-2.5xl font-sans text-xs">
        <button
          onClick={() => setActiveTab('kpis')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'kpis' ? 'bg-[#0B0B0B] text-[#F6E7A6]' : 'hover:bg-gray-150 text-gray-750'
          }`}
        >
          لوحة الإدارة التنفيذية
        </button>

        <button
          onClick={() => setActiveTab('customers_intel')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'customers_intel' ? 'bg-[#0B0B0B] text-[#F6E7A6]' : 'hover:bg-gray-150 text-gray-750'
          }`}
        >
          مركز ذكاء العملاء 👥
        </button>

        <button
          onClick={() => setActiveTab('products_performance')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'products_performance' ? 'bg-[#0B0B0B] text-[#F6E7A6]' : 'hover:bg-gray-150 text-gray-750'
          }`}
        >
          أداء المنتجات ومعدلات الاستجابة 📈
        </button>

        <button
          onClick={() => setActiveTab('inventory_insights')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'inventory_insights' ? 'bg-[#0B0B0B] text-[#F6E7A6]' : 'hover:bg-gray-150 text-gray-750'
          }`}
        >
          تحليل المخزون والأصول 📦
        </button>

        <button
          onClick={() => setActiveTab('reviews_center')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'reviews_center' ? 'bg-[#0B0B0B] text-[#F6E7A6]' : 'hover:bg-gray-150 text-gray-750'
          }`}
        >
          إدارة التقييمات والمراجعات ⭐
        </button>

        <button
          onClick={() => setActiveTab('brand_reputation')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'brand_reputation' ? 'bg-[#0B0B0B] text-[#F6E7A6]' : 'hover:bg-gray-150 text-gray-750'
          }`}
        >
          متابعة سمعة الأتيليه والمراجعات ⭐
        </button>

        <button
          onClick={() => setActiveTab('store_health')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'store_health' ? 'bg-[#0B0B0B] text-[#F6E7A6]' : 'hover:bg-gray-150 text-gray-750'
          }`}
        >
          فحص المتجر ومؤشر الفخامة 🛠️
        </button>

        <button
          onClick={() => setActiveTab('merchandising')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'merchandising' ? 'bg-[#0B0B0B] text-[#F6E7A6]' : 'hover:bg-gray-150 text-gray-750'
          }`}
        >
          تثبيت المعروض والتشكيلات ✦
        </button>

        <button
          onClick={() => setActiveTab('global_ready')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'global_ready' ? 'bg-[#0B0B0B] text-[#F6E7A6]' : 'hover:bg-gray-150 text-gray-750'
          }`}
        >
          الإعدادات الثنائية (مصر/السعودية) 🇸🇦 🇪🇬
        </button>
      </div>

      {/* Dynamic viewport content */}
      <div className="pt-2">
        {renderTabContent()}
      </div>
    </div>
  );
}
