import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  Package,
  RefreshCw,
  ShoppingBag,
  Layers,
  Users,
  Tag,
  BarChart3,
  History,
  Activity,
  ShieldCheck,
  Settings as SettingsIcon,
  Zap,
  Search,
  BellRing,
  PanelRightClose,
  PanelRightOpen,
  Menu,
  X,
  LogOut,
  ArrowUpRight,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Command
} from 'lucide-react';
import { Order, Product } from '../../types';
import {
  CanonicalAdminRole,
  DashboardTabId,
  ROLE_LABELS_AR,
  canAccessTab,
  canEditProducts
} from '../../utils/rbac';
import { cleanImgUrl } from '../../services/db';

export interface NavItemConfig {
  id: DashboardTabId;
  label: string;
  shortLabel: string;
  group: 'main' | 'operations' | 'catalog' | 'finance_system';
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const ADMIN_NAV_ITEMS: NavItemConfig[] = [
  { id: 'overview', label: 'نظرة عامة', shortLabel: 'الرئيسية', group: 'main', icon: LayoutDashboard },
  { id: 'growth', label: 'تحليل النمو', shortLabel: 'النمو', group: 'main', icon: TrendingUp },
  { id: 'analytics', label: 'تقارير المبيعات', shortLabel: 'التقارير', group: 'main', icon: BarChart3 },

  { id: 'orders', label: 'الطلبات والفواتير', shortLabel: 'الطلبات', group: 'operations', icon: Package },
  { id: 'returns', label: 'المرتجعات والاستبدال', shortLabel: 'المرتجعات', group: 'operations', icon: RefreshCw },
  { id: 'customers', label: 'سجل العميلات CRM', shortLabel: 'العميلات', group: 'operations', icon: Users },

  { id: 'products', label: 'المنتجات والكتالوج', shortLabel: 'المنتجات', group: 'catalog', icon: ShoppingBag },
  { id: 'inventory', label: 'المستودع والمخزون', shortLabel: 'المخزون', group: 'catalog', icon: Layers },
  { id: 'coupons', label: 'الكوبونات والخصومات', shortLabel: 'الكوبونات', group: 'catalog', icon: Tag },

  { id: 'finances', label: 'الأرباح والمالية', shortLabel: 'المالية', group: 'finance_system', icon: DollarSign },
  { id: 'audit-logs', label: 'سجل النشاط والتدقيق', shortLabel: 'التدقيق', group: 'finance_system', icon: History },
  { id: 'system-health', label: 'مراقب النظام', shortLabel: 'النظام', group: 'finance_system', icon: Activity },
  { id: 'pixel-diagnostics', label: 'فاحص البيكسل', shortLabel: 'البيكسل', group: 'finance_system', icon: Zap },
  { id: 'team', label: 'فريق العمل والصلاحيات', shortLabel: 'الفريق', group: 'finance_system', icon: ShieldCheck },
  { id: 'settings', label: 'إعدادات المتجر', shortLabel: 'الإعدادات', group: 'finance_system', icon: SettingsIcon }
];

const GROUP_LABELS: Record<NavItemConfig['group'], string> = {
  main: 'المتابعة والملخص',
  operations: 'العمليات والعميلات',
  catalog: 'الكتالوج والمخزون',
  finance_system: 'المالية والإدارة'
};

interface AdminNotificationItem {
  id: string;
  title: string;
  message?: string;
  is_read?: boolean;
  created_at?: string;
  type?: string;
}

interface AdminLayoutProps {
  activeTab: DashboardTabId;
  onSelectTab: (tab: DashboardTabId) => void;
  adminUser: { email: string; name: string; role: CanonicalAdminRole };
  orders: Order[];
  products: Product[];
  pendingOrdersCount: number;
  criticalStockProducts: Product[];
  notifications: AdminNotificationItem[];
  onMarkNotificationRead?: (id: string) => void;
  onQuickAddStock?: (product: Product, qty: number) => void;
  onQuickAddProduct?: () => void;
  onQuickSelectOrder?: (order: Order) => void;
  onQuickSelectProduct?: (product: Product) => void;
  onSignOut: () => void;
  onBackToStore?: () => void;
  children: React.ReactNode;
}

export default function AdminLayout({
  activeTab,
  onSelectTab,
  adminUser,
  orders,
  products,
  pendingOrdersCount,
  criticalStockProducts,
  notifications,
  onMarkNotificationRead,
  onQuickAddStock,
  onQuickAddProduct,
  onQuickSelectOrder,
  onQuickSelectProduct,
  onSignOut,
  onBackToStore,
  children
}: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sulta_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('sulta_admin_sidebar_collapsed', String(sidebarCollapsed));
    } catch {}
  }, [sidebarCollapsed]);

  // Global Ctrl/Cmd + K shortcut for Quick Search + Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuickSearchOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setQuickSearchOpen(false);
        setNotifOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const allowedNavItems = useMemo(
    () => ADMIN_NAV_ITEMS.filter(item => canAccessTab(adminUser.role, item.id)),
    [adminUser.role]
  );

  const activeNavConfig =
    ADMIN_NAV_ITEMS.find(item => item.id === activeTab) || ADMIN_NAV_ITEMS[0];

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const totalAlertCount = criticalStockProducts.length + unreadNotifications.length;

  // Quick search matches across permitted tabs, orders, products
  const quickResults = useMemo(() => {
    const q = quickQuery.trim().toLowerCase();
    const matchedTabs = allowedNavItems
      .filter(t => !q || t.label.toLowerCase().includes(q) || t.id.includes(q))
      .slice(0, 6);

    const matchedOrders = q
      ? orders
          .filter(
            o =>
              o.id.toLowerCase().includes(q) ||
              (o.customerName || '').toLowerCase().includes(q) ||
              (o.phone || '').includes(q) ||
              (o.city || '').toLowerCase().includes(q)
          )
          .slice(0, 5)
      : [];

    const matchedProducts = q
      ? products
          .filter(
            p =>
              (p.nameAr || '').toLowerCase().includes(q) ||
              (p.nameEn || '').toLowerCase().includes(q) ||
              (p.sku || '').toLowerCase().includes(q)
          )
          .slice(0, 5)
      : [];

    return { matchedTabs, matchedOrders, matchedProducts };
  }, [quickQuery, allowedNavItems, orders, products]);

  // Mobile bottom navigation: pick top 4 role-allowed sections
  const mobilePrimaryTabs = useMemo(() => {
    const priorityOrder: DashboardTabId[] = ['overview', 'orders', 'products', 'inventory', 'finances', 'customers'];
    const picked: NavItemConfig[] = [];
    for (const id of priorityOrder) {
      const found = allowedNavItems.find(item => item.id === id);
      if (found && picked.length < 4) {
        picked.push(found);
      }
    }
    return picked;
  }, [allowedNavItems]);

  const handleNavClick = (tab: DashboardTabId) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  const renderBadge = (tabId: DashboardTabId) => {
    if (tabId === 'orders' && pendingOrdersCount > 0) {
      return (
        <span className="bg-amber-400 text-gray-950 text-[10px] font-black px-1.5 py-0.5 rounded-full font-mono leading-none">
          {pendingOrdersCount}
        </span>
      );
    }
    if (tabId === 'inventory' && criticalStockProducts.length > 0) {
      return (
        <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full font-mono leading-none">
          {criticalStockProducts.length}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-gray-950 font-sans flex flex-col lg:flex-row" dir="rtl">
      {/* ================================================================ */}
      {/* DESKTOP COLLAPSIBLE SIDEBAR (RTL Right Side)                     */}
      {/* ================================================================ */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-white border-l border-gray-200 sticky top-0 h-screen z-30 transition-all duration-200 ${
          sidebarCollapsed ? 'w-[80px]' : 'w-[264px]'
        }`}
        aria-label="القائمة الجانبية للوحة التحكم"
      >
        {/* Brand Row */}
        <div className="h-16 px-4 border-b border-gray-200 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => handleNavClick('overview')}
            className="flex items-center gap-2.5 min-h-[44px] cursor-pointer overflow-hidden text-right"
          >
            <span className="w-9 h-9 rounded-xl bg-[#A44C5C] text-white flex items-center justify-center font-serif font-black text-base shrink-0 shadow-xs">
              S
            </span>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <span className="font-serif font-black text-sm text-gray-950 block truncate">
                  سولته · الإدارة
                </span>
                <span className="text-[11px] font-semibold text-gray-600 block truncate">
                  {ROLE_LABELS_AR[adminUser.role]}
                </span>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSidebarCollapsed(prev => !prev)}
            aria-label={sidebarCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
            title={sidebarCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
            className="min-w-[40px] min-h-[40px] rounded-xl text-gray-600 hover:text-gray-950 hover:bg-gray-100 flex items-center justify-center cursor-pointer shrink-0"
          >
            {sidebarCollapsed ? <PanelRightOpen size={18} /> : <PanelRightClose size={18} />}
          </button>
        </div>

        {/* Grouped Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          {(['main', 'operations', 'catalog', 'finance_system'] as NavItemConfig['group'][]).map(groupKey => {
            const items = allowedNavItems.filter(item => item.group === groupKey);
            if (items.length === 0) return null;

            return (
              <div key={groupKey} className="space-y-1">
                {!sidebarCollapsed && (
                  <p className="px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider pb-1">
                    {GROUP_LABELS[groupKey]}
                  </p>
                )}
                {items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      title={sidebarCollapsed ? item.label : undefined}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full min-h-[44px] rounded-xl px-3 flex items-center justify-between gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#A44C5C] text-white shadow-xs'
                          : 'text-gray-800 hover:bg-[#FCF5F6] hover:text-[#A44C5C]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon size={18} className="shrink-0" />
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </span>
                      {!sidebarCollapsed && renderBadge(item.id)}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Bottom User & Sign Out */}
        <div className="p-3 border-t border-gray-200 space-y-2">
          {onBackToStore && (
            <button
              type="button"
              onClick={onBackToStore}
              title="العودة لواجهة المتجر"
              className="w-full min-h-[44px] rounded-xl px-3 bg-[#FAF9F6] hover:bg-gray-100 border border-gray-200 text-gray-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowUpRight size={15} className="rotate-180 shrink-0" />
              {!sidebarCollapsed && <span>زيارة المتجر</span>}
            </button>
          )}
          <button
            type="button"
            onClick={onSignOut}
            title="تسجيل الخروج"
            className="w-full min-h-[44px] rounded-xl px-3 bg-white hover:bg-rose-50 border border-gray-200 hover:border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={15} className="shrink-0" />
            {!sidebarCollapsed && <span>تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      {/* ================================================================ */}
      {/* MAIN CONTENT SHELL (HEADER + WORKSPACE)                          */}
      {/* ================================================================ */}
      <div className="flex-1 min-w-0 flex flex-col pb-24 lg:pb-10">
        {/* Sticky Admin Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
            {/* Right: Mobile menu + Page Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="فتح قائمة أقسام الإدارة"
                className="lg:hidden min-w-[44px] min-h-[44px] rounded-xl border border-gray-200 bg-white text-gray-800 flex items-center justify-center cursor-pointer"
              >
                <Menu size={20} />
              </button>

              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-black text-gray-950 truncate">
                  {activeNavConfig.label}
                </h1>
                <p className="text-[11px] text-gray-600 hidden sm:block truncate">
                  متجر سولته · {ROLE_LABELS_AR[adminUser.role]} ({adminUser.email})
                </p>
              </div>
            </div>

            {/* Center/Left Quick Actions: Search (Ctrl+K), Add Product, Notifications Bell */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Quick Search Button (Ctrl/Cmd + K) */}
              <button
                type="button"
                onClick={() => setQuickSearchOpen(true)}
                className="min-h-[44px] px-3 rounded-xl border border-gray-300 bg-[#FAF9F6] hover:bg-white hover:border-[#A44C5C] text-gray-700 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
                aria-label="بحث سريع في اللوحة (Ctrl+K)"
              >
                <Search size={16} className="text-gray-600 shrink-0" />
                <span className="hidden md:inline">بحث سريع...</span>
                <kbd
                  className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-white border border-gray-300 rounded text-gray-600"
                  dir="ltr"
                >
                  <Command size={10} />K
                </kbd>
              </button>

              {/* Quick Add Product (role-gated) */}
              {onQuickAddProduct && canEditProducts(adminUser.role) && (
                <button
                  type="button"
                  onClick={onQuickAddProduct}
                  className="min-h-[44px] px-3 sm:px-4 rounded-xl bg-[#A44C5C] hover:bg-[#8E3E4D] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">منتج جديد</span>
                </button>
              )}

              {/* Notification Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen(prev => !prev)}
                  aria-label="مركز الإشعارات والتنبيهات"
                  className={`min-w-[44px] min-h-[44px] px-2.5 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    totalAlertCount > 0
                      ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <BellRing size={18} />
                  {totalAlertCount > 0 && (
                    <span className="bg-rose-700 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full font-mono leading-none">
                      {totalAlertCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notifOpen && (
                  <div
                    className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50 space-y-3 animate-fade-in"
                    role="region"
                    aria-label="الإشعارات"
                  >
                    <div className="flex items-center justify-between pb-2.5 border-b border-gray-200">
                      <span className="font-bold text-xs text-gray-950">مركز التنبيهات والإشعارات</span>
                      <button
                        type="button"
                        onClick={() => setNotifOpen(false)}
                        aria-label="إغلاق الإشعارات"
                        className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {totalAlertCount === 0 && notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-gray-600 space-y-1.5">
                        <CheckCircle2 size={24} className="mx-auto text-emerald-700" />
                        <p className="font-bold text-gray-900">كل الأنظمة والمخزون مستقرة</p>
                        <p className="text-[11px] text-gray-600">لا توجد تنبيهات غير مقروءة حالياً.</p>
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto space-y-2.5">
                        {criticalStockProducts.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                              <AlertTriangle size={13} />
                              <span>نقص مخزون حرج (&lt; 5 قطع)</span>
                            </p>
                            {criticalStockProducts.slice(0, 5).map(p => (
                              <div
                                key={p.id}
                                className="flex items-center justify-between gap-2 p-2 rounded-xl bg-rose-50/60 border border-rose-200"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <img
                                    src={cleanImgUrl(p.images?.[0] || '', p.category)}
                                    alt={p.nameAr}
                                    className="w-8 h-9 rounded-lg object-cover border border-gray-200 shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-gray-950 truncate">{p.nameAr}</p>
                                    <span className="text-[11px] font-mono font-bold text-rose-800">
                                      متبقي: {p.stock}
                                    </span>
                                  </div>
                                </div>
                                {onQuickAddStock && canEditProducts(adminUser.role) && (
                                  <button
                                    type="button"
                                    onClick={() => onQuickAddStock(p, 10)}
                                    className="min-h-[36px] px-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold cursor-pointer shrink-0"
                                  >
                                    +10
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {notifications.slice(0, 8).map(n => (
                          <div
                            key={n.id}
                            className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-2 ${
                              n.is_read
                                ? 'bg-white border-gray-200 text-gray-700'
                                : 'bg-[#FCF5F6] border-[#A44C5C]/25 text-gray-950'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="font-bold truncate">{n.title}</p>
                              {n.message && <p className="text-[11px] text-gray-700 mt-0.5">{n.message}</p>}
                            </div>
                            {!n.is_read && onMarkNotificationRead && (
                              <button
                                type="button"
                                onClick={() => onMarkNotificationRead(n.id)}
                                className="text-[10px] font-bold text-[#A44C5C] hover:underline shrink-0 cursor-pointer"
                              >
                                تم الاطلاع
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main View Area */}
        <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-5 sm:pt-6 space-y-6">
          {children}
        </main>
      </div>

      {/* ================================================================ */}
      {/* MOBILE BOTTOM NAVIGATION BAR (< lg)                              */}
      {/* ================================================================ */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1"
        aria-label="التنقل السريع على الجوال"
      >
        <div className="grid grid-cols-5 gap-1">
          {mobilePrimaryTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleNavClick(tab.id)}
                className={`min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold relative cursor-pointer ${
                  isActive ? 'text-[#A44C5C] bg-[#FCF5F6]' : 'text-gray-700'
                }`}
              >
                <Icon size={18} />
                <span className="truncate max-w-full px-1">{tab.shortLabel}</span>
                {tab.id === 'orders' && pendingOrdersCount > 0 && (
                  <span className="absolute top-1 left-2 bg-amber-400 text-gray-950 text-[9px] font-black px-1 rounded-full font-mono">
                    {pendingOrdersCount}
                  </span>
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold text-gray-700 cursor-pointer"
          >
            <Menu size={18} />
            <span>المزيد</span>
          </button>
        </div>
      </nav>

      {/* ================================================================ */}
      {/* MOBILE FULL NAVIGATION DRAWER                                    */}
      {/* ================================================================ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden font-sans" role="dialog" aria-modal="true" aria-label="قائمة لوحة التحكم">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-80 max-w-[88vw] bg-white shadow-2xl flex flex-col z-10 border-l border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <p className="font-serif font-black text-base text-gray-950">سولته · الإدارة</p>
                <p className="text-xs text-gray-600">{ROLE_LABELS_AR[adminUser.role]}</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="إغلاق القائمة"
                className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {allowedNavItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full min-h-[44px] rounded-xl px-3.5 flex items-center justify-between gap-2.5 text-xs font-bold cursor-pointer ${
                      isActive
                        ? 'bg-[#A44C5C] text-white'
                        : 'text-gray-800 hover:bg-[#FCF5F6]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </span>
                    {renderBadge(item.id)}
                  </button>
                );
              })}
            </nav>

            <div className="p-3 border-t border-gray-200 space-y-2">
              {onBackToStore && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onBackToStore();
                  }}
                  className="w-full min-h-[44px] rounded-xl border border-gray-300 bg-[#FAF9F6] text-gray-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowUpRight size={15} className="rotate-180" />
                  <span>زيارة المتجر</span>
                </button>
              )}
              <button
                type="button"
                onClick={onSignOut}
                className="w-full min-h-[44px] rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut size={15} />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* COMMAND PALETTE / QUICK SEARCH MODAL (Ctrl/Cmd + K)              */}
      {/* ================================================================ */}
      {quickSearchOpen && (
        <div
          className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="البحث السريع في لوحة التحكم"
        >
          <div className="fixed inset-0" onClick={() => setQuickSearchOpen(false)} />
          <div className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-200 overflow-hidden z-10 animate-fade-in">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-200">
              <Search size={18} className="text-[#A44C5C] shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="ابحث عن قسم، رقم طلب، اسم عميلة، جوال، أو منتج..."
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                className="w-full min-h-[40px] text-sm text-gray-950 placeholder:text-gray-500 outline-none bg-transparent"
              />
              <button
                type="button"
                onClick={() => setQuickSearchOpen(false)}
                aria-label="إغلاق البحث السريع"
                className="min-w-[40px] min-h-[40px] rounded-xl text-gray-600 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
              {/* Tabs */}
              {quickResults.matchedTabs.length > 0 && (
                <div className="space-y-1">
                  <p className="px-2 text-[11px] font-bold text-gray-500">الأقسام</p>
                  {quickResults.matchedTabs.map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          onSelectTab(t.id);
                          setQuickSearchOpen(false);
                          setQuickQuery('');
                        }}
                        className="w-full min-h-[44px] px-3 rounded-xl hover:bg-[#FCF5F6] text-gray-900 text-xs font-bold flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon size={16} className="text-[#A44C5C]" />
                          <span>{t.label}</span>
                        </span>
                        <span className="text-[11px] text-gray-500">انتقال</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Orders */}
              {quickResults.matchedOrders.length > 0 && (
                <div className="space-y-1">
                  <p className="px-2 text-[11px] font-bold text-gray-500">الطلبات المطابقة</p>
                  {quickResults.matchedOrders.map(o => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => {
                        if (onQuickSelectOrder) onQuickSelectOrder(o);
                        else onSelectTab('orders');
                        setQuickSearchOpen(false);
                        setQuickQuery('');
                      }}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl hover:bg-[#FCF5F6] text-right flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-950 truncate">
                          {o.customerName} — <span className="font-mono">#{o.id.slice(0, 8)}</span>
                        </p>
                        <p className="text-[11px] text-gray-600 font-mono" dir="ltr">
                          {o.phone} · {o.city}
                        </p>
                      </div>
                      <span className="text-xs font-black font-mono text-[#A44C5C] shrink-0">
                        {Number(o.totalPrice).toLocaleString()} ر.س
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Products */}
              {quickResults.matchedProducts.length > 0 && (
                <div className="space-y-1">
                  <p className="px-2 text-[11px] font-bold text-gray-500">المنتجات المطابقة</p>
                  {quickResults.matchedProducts.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (onQuickSelectProduct) onQuickSelectProduct(p);
                        else onSelectTab('products');
                        setQuickSearchOpen(false);
                        setQuickQuery('');
                      }}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl hover:bg-[#FCF5F6] text-right flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={cleanImgUrl(p.images?.[0] || '', p.category)}
                          alt={p.nameAr}
                          className="w-8 h-9 rounded-lg object-cover border border-gray-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-950 truncate">{p.nameAr}</p>
                          <p className="text-[11px] text-gray-600 font-mono">
                            المخزون: {p.stock} · {p.sku || p.categoryAr}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black font-mono text-gray-900 shrink-0">
                        {p.priceSA} ر.س
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {quickQuery.trim() &&
                quickResults.matchedTabs.length === 0 &&
                quickResults.matchedOrders.length === 0 &&
                quickResults.matchedProducts.length === 0 && (
                  <div className="py-8 text-center text-xs text-gray-600">
                    لا توجد نتائج مطابقة لعبارة "{quickQuery}"
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
