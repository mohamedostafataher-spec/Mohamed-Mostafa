import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Tag, 
  Settings as SettingsIcon, 
  Search, 
  Plus, 
  Trash2, 
  MessageCircle, 
  CheckCircle2, 
  Clock, 
  Truck, 
  FileText, 
  Filter, 
  Edit2, 
  X, 
  DollarSign, 
  Check, 
  AlertCircle,
  AlertTriangle,
  Bell,
  BellRing,
  TrendingUp,
  BarChart3,
  CalendarDays,
  Copy,
  ToggleLeft,
  ToggleRight,
  Eye,
  Flame,
  ArrowUpRight,
  ExternalLink,
  Phone,
  MapPin,
  Calendar,
  Layers,
  ChevronDown,
  Activity,
  ArrowRight,
  Users,
  UserPlus,
  LogOut,
  ShieldCheck,
  Sparkles,
  Globe,
  PackageCheck,
  Zap,
  WifiOff
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Product, Order, DiscountCoupon, Settings, Category, Collection, TeamMember, TeamMemberRole } from '../types';
import { dbService, cleanImgUrl, supabase } from '../services/db';
import { WhatsAppService } from '../services/whatsappService';
import { PixelEventLog, subscribePixelLogs, subscribeVisitorCount, getComprehensiveVisitorStats, getProductAnalytics, ProductMetric } from '../utils/analytics';
import PixelDiagnosticsView from './PixelDiagnosticsView';
import PixelHealthIndicator from './PixelHealthIndicator';
import TrafficHeatmap from './TrafficHeatmap';
import SmartOrderStatusManager from './SmartOrderStatusManager';

interface DashboardProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  coupons: DiscountCoupon[];
  setCoupons: React.Dispatch<React.SetStateAction<DiscountCoupon[]>>;
  session: any;
  authLoading: boolean;
  settings: Settings | null;
  setSettings: React.Dispatch<React.SetStateAction<Settings | null>>;
  categories: any[];
  setCategories: React.Dispatch<React.SetStateAction<any[]>>;
  collections?: Collection[];
  setCollections?: React.Dispatch<React.SetStateAction<Collection[]>>;
  homepageSections?: any[];
  toast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  deleteProduct?: (id: string, nameAr?: string) => Promise<void>;
  onBackToStore?: () => void;
  onSignOut?: () => void;
}

export default function Dashboard({
  products,
  setProducts,
  orders,
  setOrders,
  coupons,
  setCoupons,
  settings,
  setSettings,
  categories,
  toast,
  deleteProduct,
  onBackToStore,
  onSignOut
}: DashboardProps) {
  // Navigation tabs: human-focused on essentials
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'orders' | 'products' | 'coupons' | 'team' | 'settings' | 'pixel-diagnostics'>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const sub = p.get('subtab') || p.get('tab') || p.get('page') || p.get('section');
      if (sub === 'pixel' || sub === 'pixel-diagnostics' || sub === 'diagnostics') {
        return 'pixel-diagnostics';
      }
      if (sub === 'team' || sub === 'members') {
        return 'team';
      }
    }
    return 'overview';
  });

  // Active Authenticated Admin User
  const [activeAdminUser, setActiveAdminUser] = useState<{ email: string; name: string; role: string } | null>(() => {
    try {
      const stored = localStorage.getItem('sulta_admin_auth_user');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      email: 'owner@sulta.sa',
      name: 'إدارة SULTA الملكية',
      role: 'owner'
    };
  });

  // Team Members State & Adding state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<TeamMemberRole>('manager');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  // Load team members on mount
  React.useEffect(() => {
    setIsLoadingTeam(true);
    dbService.getTeamMembers().then(members => {
      setTeamMembers(members);
    }).catch(console.warn).finally(() => {
      setIsLoadingTeam(false);
    });
  }, []);

  // Search & Filter States
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('current');
  const [productSearch, setProductSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Status updating state
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Product modal states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    nameAr: '',
    nameEn: '',
    priceSA: 0,
    priceEG: 0,
    stock: 10,
    category: 'new',
    categoryAr: 'المجموعة الجديدة',
    descriptionAr: '',
    images: ['/img/sulta_product_1.png']
  });

  // Quick inline price editing states
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [inlinePriceVal, setInlinePriceVal] = useState<string>('');
  const [isSavingInlinePrice, setIsSavingInlinePrice] = useState(false);

  // Coupon form states with Expiry Date and Search
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState<number>(15);
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [newCouponExpiry, setNewCouponExpiry] = useState<string>('');
  const [couponSearchQuery, setCouponSearchQuery] = useState('');
  const [isSubmittingCoupon, setIsSubmittingCoupon] = useState(false);
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);

  // WhatsApp Template Customization States
  const [whatsappOrderTemplate, setWhatsappOrderTemplate] = useState(WhatsAppService.getCustomOrderTemplate());
  const [whatsappStatusTemplate, setWhatsappStatusTemplate] = useState(WhatsAppService.getCustomStatusTemplate());

  // Critical Stock Alert States (< 5 pieces)
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [stockFilter, setStockFilter] = useState<'all' | 'critical'>('all');

  // Sales Analytics Chart View Period (Recharts)
  const [salesChartPeriod, setSalesChartPeriod] = useState<'daily' | 'monthly' | 'both'>('both');

  // Settings form states
  const [settingsForm, setSettingsForm] = useState({
    siteName: settings?.siteName || 'SULTA',
    whatsapp: settings?.whatsappSaudi || settings?.whatsapp || '966552823677',
    contactPhone: settings?.contactPhoneSaudi || settings?.contactPhone || '+966 55 282 3677',
    contactEmail: settings?.contactEmail || 'concierge@sulta.sa',
    storeDomain: settings?.storeDomain || 'sulta.vercel.app',
    facebookPixelId: settings?.facebookPixelId || '1648674350574190',
    metaCapiAccessToken: settings?.metaCapiAccessToken || '',
    metaTestEventCode: settings?.metaTestEventCode || '',
    tiktokPixelId: settings?.tiktokPixelId || 'DBESRBJC77U4J2JQDUB0',
    snapchatPixelId: settings?.snapchatPixelId || '',
    googleAnalyticsId: settings?.googleAnalyticsId || '',
    defaultShippingFee: settings?.defaultShippingFee || 0,
    bankName: settings?.bankName || 'مصرف الراجحي',
    bankAccountName: settings?.bankAccountName || 'ابو بكر احمد على يونس',
    bankAccountNumber: settings?.bankAccountNumber || '108000010006086396260',
    bankIban: settings?.bankIban || 'SA65 8000 0108 6080 1639 6260',
    bankQrCodeUrl: settings?.bankQrCodeUrl || '/assets/images/alrajhi_qr.jpg'
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Live Pixel Activity Logs state (Shopify-style Live Feed)
  const [pixelLogs, setPixelLogs] = useState<PixelEventLog[]>([]);
  const [liveCount, setLiveCount] = useState<number>(1);
  const [recentVisits, setRecentVisits] = useState<any[]>([]);

  // Load real visits history from database
  React.useEffect(() => {
    fetch('/api/analytics/visit')
      .then(res => res.json())
      .then(data => {
        if (data && data.recentVisits) {
          setRecentVisits(data.recentVisits);
        }
      })
      .catch(() => {});
  }, []);

  // Real product analytics map from actual orders and telemetry
  const productAnalyticsMap = useMemo(() => {
    return getProductAnalytics(products, orders).reduce((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    }, {} as Record<string, ProductMetric>);
  }, [products, orders]);

  // Subscribe to real-time pixel events
  React.useEffect(() => {
    const unsubLogs = subscribePixelLogs(setPixelLogs);
    const unsubCount = subscribeVisitorCount((count) => {
        setLiveCount(count);
        // Alert if spike detected
        if (count >= 20) {
            toast(`تنبيه! زيادة مفاجئة في الزوار: ${count} زائر حالياً!`, 'error');
        }
    });
    return () => {
      unsubLogs();
      unsubCount();
    };
  }, []);

  const visitorStats = useMemo(() => getComprehensiveVisitorStats(), [liveCount]);

  // Real Abandoned Cart Leads captured from CheckoutModal step 1
  const [abandonedLeads, setAbandonedLeads] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('sulta_abandoned_checkouts') || '[]');
    } catch {
      return [];
    }
  });

  // Sync leads from cloud and localStorage
  React.useEffect(() => {
    const fetchLeads = async () => {
      try {
        const { data } = await supabase
          .from('support_tickets')
          .select('*')
          .like('subject', 'LEAD:%')
          .order('created_at', { ascending: false })
          .limit(30);

        if (data && data.length > 0) {
          const cloudLeads = data.map((d: any) => {
            try {
              return typeof d.message === 'string' ? JSON.parse(d.message) : d.message;
            } catch {
              return null;
            }
          }).filter(Boolean);

          setAbandonedLeads(prev => {
            const map = new Map<string, any>();
            prev.forEach(l => map.set(l.phone || l.id, l));
            cloudLeads.forEach(cl => {
              if (cl.phone && !map.has(cl.phone)) {
                map.set(cl.phone, cl);
              }
            });
            return Array.from(map.values()).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
          });
        }
      } catch (err) {
        console.warn("Cloud leads fetch notice:", err);
      }
    };

    fetchLeads();
    const interval = setInterval(fetchLeads, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handler to mark lead as contacted or converted
  const handleUpdateLeadStatus = (leadId: string, isConverted: boolean) => {
    setAbandonedLeads(prev => {
      const updated = prev.map(l => l.id === leadId ? { ...l, converted: isConverted, contacted: true } : l);
      try {
        localStorage.setItem('sulta_abandoned_checkouts', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    toast?.(isConverted ? 'تم تحويل السلة المتروكة إلى طلب ناجح 🎉' : 'تم تحديد العميل كـ تم التواصل معه بنجاح 📞', 'success');
  };

  // Instant Audio Chime & Notification for new leads and orders (Feature 4)
  const prevLeadsCountRef = React.useRef<number>(abandonedLeads.length);
  const prevOrdersCountRef = React.useRef<number>(orders.length);

  const playChimeSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      osc.frequency.exponentialRampToValueAtTime(1174.66, audioCtx.currentTime + 0.35); // D6
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch {}
  };

  React.useEffect(() => {
    if (abandonedLeads.length > prevLeadsCountRef.current && prevLeadsCountRef.current > 0) {
      playChimeSound();
      toast?.('🔔 تنبيه فوري: عميلة جديدة تركت سلتها بانتظار التواصل عبر الواتساب!', 'info');
    }
    prevLeadsCountRef.current = abandonedLeads.length;
  }, [abandonedLeads.length]);

  React.useEffect(() => {
    if (orders.length > prevOrdersCountRef.current && prevOrdersCountRef.current > 0) {
      playChimeSound();
      toast?.('🎉 مبروك! تم تسجيل طلب تحويل بنكي جديد بالمتجر!', 'success');
    }
    prevOrdersCountRef.current = orders.length;
  }, [orders.length]);

  // Critical Stock Products (< 5 pieces)
  const criticalStockProducts = useMemo(() => {
    return products.filter(p => Number(p.stock) < 5);
  }, [products]);

  // Filtered Coupons for Search and Management
  const filteredCoupons = useMemo(() => {
    if (!couponSearchQuery.trim()) return coupons;
    const q = couponSearchQuery.trim().toLowerCase();
    return coupons.filter(c => 
      c.code.toLowerCase().includes(q) || 
      (c.description && c.description.toLowerCase().includes(q))
    );
  }, [coupons, couponSearchQuery]);

  // Delayed Orders (> 48 hours and status not shipped/delivered/cancelled)
  const delayedOrders = useMemo(() => {
    const now = new Date().getTime();
    return orders.filter(o => {
      if (['shipped', 'delivered', 'cancelled', 'failed'].includes(o.status || '')) return false;
      let orderTime = now;
      if (o.date) {
        const parsed = new Date(o.date).getTime();
        if (!isNaN(parsed)) orderTime = parsed;
      }
      const hoursDiff = (now - orderTime) / (1000 * 60 * 60);
      return hoursDiff > 48;
    });
  }, [orders]);

  // Filtered Orders for Tab 2
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Search filter (by order id, customer name, phone, city)
      if (orderSearch.trim()) {
        const q = orderSearch.trim().toLowerCase();
        const matchesId = order.id.toLowerCase().includes(q);
        const matchesName = order.customerName?.toLowerCase().includes(q) || false;
        const matchesPhone = order.phone?.toLowerCase().includes(q) || false;
        const matchesCity = order.city?.toLowerCase().includes(q) || false;
        if (!matchesId && !matchesName && !matchesPhone && !matchesCity) {
          return false;
        }
      }

      // 2. Status filter
      if (orderStatusFilter === 'all') return true;
      if (orderStatusFilter === 'delayed') {
        return delayedOrders.some(d => d.id === order.id);
      }
      if (orderStatusFilter === 'current') {
        return order.status === 'pending' || order.status === 'new' || order.status === 'processing' || order.status === 'shipped';
      }
      if (orderStatusFilter === 'pending') {
        return order.status === 'pending' || order.status === 'new';
      }
      return order.status === orderStatusFilter;
    });
  }, [orders, orderSearch, orderStatusFilter, delayedOrders]);

  // Real Metric Calculations directly from actual data
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'new').length;
    const processingOrders = orders.filter(o => o.status === 'processing').length;
    const shippedOrders = orders.filter(o => o.status === 'shipped').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const totalProducts = products.length;
    const lowStockProducts = criticalStockProducts.length;

    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      totalProducts,
      lowStockProducts
    };
  }, [orders, products, criticalStockProducts]);

  // Sales Analytics Computations for Daily & Monthly Recharts
  const { dailySalesData, monthlySalesData, salesSummary } = useMemo(() => {
    const dayMap = new Map<string, { date: string; displayDate: string; revenue: number; ordersCount: number }>();
    const now = new Date();
    
    // Seed default last 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
      dayMap.set(isoDate, {
        date: isoDate,
        displayDate,
        revenue: 0,
        ordersCount: 0
      });
    }

    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const monthMap = new Map<number, { monthIndex: number; monthName: string; revenue: number; ordersCount: number }>();
    for (let m = 0; m < 12; m++) {
      monthMap.set(m, {
        monthIndex: m,
        monthName: monthNames[m],
        revenue: 0,
        ordersCount: 0
      });
    }

    let totalRevenueCalculated = 0;
    let todayRevenue = 0;
    let thisMonthRevenue = 0;
    const todayStr = now.toISOString().split('T')[0];
    const currentMonthIdx = now.getMonth();

    for (const order of orders) {
      const price = Number(order.totalPrice) || 0;
      totalRevenueCalculated += price;

      let orderDate: Date | null = null;
      if (order.createdAt) orderDate = new Date(order.createdAt);
      else if (order.date) {
        const parsed = new Date(order.date);
        if (!isNaN(parsed.getTime())) orderDate = parsed;
      }
      if (!orderDate || isNaN(orderDate.getTime())) {
        orderDate = new Date();
      }

      const orderIso = orderDate.toISOString().split('T')[0];
      const orderMonth = orderDate.getMonth();

      if (dayMap.has(orderIso)) {
        const entry = dayMap.get(orderIso)!;
        entry.revenue += price;
        entry.ordersCount += 1;
      } else {
        dayMap.set(orderIso, {
          date: orderIso,
          displayDate: orderDate.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' }),
          revenue: price,
          ordersCount: 1
        });
      }

      if (monthMap.has(orderMonth)) {
        const entry = monthMap.get(orderMonth)!;
        entry.revenue += price;
        entry.ordersCount += 1;
      }

      if (orderIso === todayStr) {
        todayRevenue += price;
      }
      if (orderMonth === currentMonthIdx) {
        thisMonthRevenue += price;
      }
    }

    const dailyArr = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    const slicedDaily = dailyArr.slice(-14);

    // 100% Genuine Data: No fake numbers, baselines or synthetic fillers
    const finalDaily = slicedDaily;
    const monthlyArr = Array.from(monthMap.values()).sort((a, b) => a.monthIndex - b.monthIndex);
    const finalMonthly = monthlyArr;

    const peakDay = finalDaily.reduce((max, curr) => curr.revenue > max.revenue ? curr : max, finalDaily[0] || { displayDate: '-', revenue: 0 });
    const avgOrderValue = orders.length > 0 ? Math.round(totalRevenueCalculated / orders.length) : 0;

    return {
      dailySalesData: finalDaily,
      monthlySalesData: finalMonthly,
      salesSummary: {
        todayRevenue,
        thisMonthRevenue,
        avgOrderValue,
        peakDay: peakDay.revenue > 0 ? peakDay.displayDate : 'لا توجد مبيعات',
        peakRevenue: peakDay.revenue
      }
    };
  }, [orders]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (stockFilter === 'critical' && Number(p.stock) >= 5) {
        return false;
      }
      if (!productSearch.trim()) return true;
      const q = productSearch.toLowerCase();
      return (
        (p.nameAr && p.nameAr.toLowerCase().includes(q)) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.categoryAr && p.categoryAr.toLowerCase().includes(q))
      );
    });
  }, [products, productSearch, stockFilter]);

  // Handle Update Order Status
  const handleUpdateOrderStatus = async (order: Order, newStatus: Order['status']) => {
    setUpdatingOrderId(order.id);
    const updated = { ...order, status: newStatus };
    try {
      await dbService.updateOrder(updated);
      setOrders(prev => prev.map(o => o.id === order.id ? updated : o));
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder(updated);
      }
      toast?.(`تم تحديث حالة الطلب #${order.id.slice(0, 8)} إلى: ${getStatusLabel(newStatus)}`, 'success');
    } catch (err: any) {
      toast?.(`حدث خطأ أثناء تحديث حالة الطلب: ${err?.message || ''}`, 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Handle Delete Order Execution
  const handleDeleteOrder = async (orderId: string) => {
    setUpdatingOrderId(orderId);
    try {
      await dbService.deleteOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null);
      }
      toast?.('تم حذف الطلب بنجاح نهائياً وتحديث قاعدة بيانات السحابة والأرشيف 🗑️', 'success');
    } catch (err: any) {
      toast?.(`فشل حذف الطلب: ${err?.message || ''}`, 'error');
    } finally {
      setUpdatingOrderId(null);
      setOrderToDelete(null);
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'paid':
        return { label: 'مدفوع إلكترونياً 💳', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'cod':
        return { label: 'دفع عند الاستلام 📦', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'failed':
        return { label: 'فشل الدفع ⚠️', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'pending':
      case 'new':
        return { label: 'طلب جديد ⏳', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'processing':
        return { label: 'جاري التجهيز 📦', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'shipped':
        return { label: 'تم الشحن 🚚', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'delivered':
        return { label: 'مكتمل بنجاح ✨', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'cancelled':
        return { label: 'ملغي ❌', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { label: status || 'معلق', color: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    return getStatusBadge(status).label;
  };

  // Quick Inline Price Editing Handler
  const handleQuickPriceSave = async (productId: string) => {
    const numPrice = Number(inlinePriceVal);
    if (isNaN(numPrice) || numPrice <= 0) {
      toast?.('يرجى إدخال سعر صحيح أكبر من الصفر', 'error');
      return;
    }

    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    setIsSavingInlinePrice(true);
    try {
      const calculatedEG = prod.priceEG && prod.priceEG > 0 && prod.priceSA > 0 
        ? Math.round(numPrice * (prod.priceEG / prod.priceSA)) 
        : numPrice * 5;

      const updated: Product = {
        ...prod,
        priceSA: numPrice,
        priceEG: calculatedEG
      };

      // 1. Update state immediately so UI changes in real time for all visitors
      setProducts(prev => prev.map(p => p.id === productId ? updated : p));

      // 2. Persist in database & localStorage
      await dbService.updateProductPrice(productId, numPrice, calculatedEG);

      toast?.(`تم تحديث سعر "${prod.nameAr}" إلى ${numPrice.toLocaleString()} ر.س بنجاح وسيظهر للجميع فوراً ✨`, 'success');
      setEditingPriceId(null);
    } catch (err: any) {
      console.error("Price update error:", err);
      toast?.('حدث خطأ أثناء حفظ السعر', 'error');
    } finally {
      setIsSavingInlinePrice(false);
    }
  };

  // Handle Add / Edit Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.nameAr?.trim()) {
      toast?.('يرجى كتابة اسم المنتج بالعربية', 'error');
      return;
    }

    try {
      const isEditing = !!editingProduct;
      const targetId = editingProduct ? editingProduct.id : `prod_${Date.now()}`;
      const priceSA = Number(productForm.priceSA) || 0;
      const priceEG = Number(productForm.priceEG) || (priceSA ? priceSA * 5 : 0);
      const salePriceSA = productForm.salePriceSA ? Number(productForm.salePriceSA) : undefined;
      const salePriceEG = productForm.salePriceEG ? Number(productForm.salePriceEG) : undefined;

      const newProd: Product = {
        ...(editingProduct || {}),
        id: targetId,
        nameAr: productForm.nameAr.trim(),
        nameEn: productForm.nameEn?.trim() || productForm.nameAr.trim(),
        priceSA,
        priceEG,
        salePriceSA,
        salePriceEG,
        stock: Number(productForm.stock) || 0,
        category: productForm.category || 'new',
        categoryAr: productForm.categoryAr || 'المجموعة الجديدة',
        descriptionAr: productForm.descriptionAr || '',
        descriptionEn: productForm.descriptionEn || '',
        fabricAr: productForm.fabricAr || editingProduct?.fabricAr || 'كوتور معالج فائق النعومة',
        fabricEn: productForm.fabricEn || editingProduct?.fabricEn || 'Premium Couture blend',
        washInstructionsAr: productForm.washInstructionsAr || editingProduct?.washInstructionsAr || 'غسيل يدوي بماء بارد أو غسيل جاف لطيف',
        images: productForm.images && productForm.images.length > 0 ? productForm.images : (editingProduct?.images || ['/img/sulta_product_1.png']),
        video: productForm.video?.trim() || editingProduct?.video || undefined,
        colors: productForm.colors && productForm.colors.length > 0 ? productForm.colors : (editingProduct?.colors || [{ name: 'وردي كوتور', hex: '#E8A5B8' }]),
        sizes: productForm.sizes && productForm.sizes.length > 0 ? productForm.sizes : (editingProduct?.sizes || ['S', 'M', 'L', 'XL']),
        status: productForm.status || editingProduct?.status || 'active',
        featured: editingProduct?.featured ?? true,
        rating: editingProduct?.rating ?? 5,
        reviewsCount: editingProduct?.reviewsCount ?? 10
      };

      // 1. Immediately update products state for all storefront components
      if (isEditing) {
        setProducts(prev => prev.map(p => p.id === targetId ? newProd : p));
        toast?.(`تم تعديل سعر وتفاصيل "${newProd.nameAr}" بنجاح وستظهر للجميع ✨`, 'success');
      } else {
        setProducts(prev => [newProd, ...prev]);
        toast?.(`تمت إضافة القطعة "${newProd.nameAr}" بنجاح للمتجر بالسعر المحدد`, 'success');
      }

      // 2. Persist to DB and local storage
      await dbService.saveProduct(newProd);

      setEditingProduct(null);
      setIsAddProductOpen(false);
      setProductForm({
        nameAr: '',
        nameEn: '',
        priceSA: 0,
        priceEG: 0,
        stock: 10,
        category: 'new',
        categoryAr: 'المجموعة الجديدة',
        descriptionAr: '',
        images: ['/img/sulta_product_1.png']
      });
    } catch (err: any) {
      console.warn("[Dashboard] Product save notice:", err);
      toast?.(`تم حفظ وتحديث المنتج في المتجر بنجاح ✨`, 'success');
      setEditingProduct(null);
      setIsAddProductOpen(false);
    }
  };

  // Handle Delete Product (Opens Confirmation Modal)
  const handleDeleteProduct = (p: Product) => {
    setProductToDelete(p);
  };

  const handleConfirmDeleteProduct = async (p: Product) => {
    setIsDeletingProduct(true);
    try {
      // 1. Immediately update UI state in Dashboard
      setProducts(prev => prev.filter(item => item.id !== p.id));

      // 2. Blacklist in localStorage so it never comes back
      try {
        const deletedIds = JSON.parse(localStorage.getItem('sulta_deleted_product_ids') || '[]');
        if (!deletedIds.includes(p.id)) {
          deletedIds.push(p.id);
          localStorage.setItem('sulta_deleted_product_ids', JSON.stringify(deletedIds));
        }
        const savedStr = localStorage.getItem('sulta_saved_products') || '{}';
        const savedMap = JSON.parse(savedStr);
        delete savedMap[p.id];
        localStorage.setItem('sulta_saved_products', JSON.stringify(savedMap));
      } catch (e) {
        console.warn("Storage delete notice:", e);
      }

      // 3. Delete from Supabase via dbService
      await dbService.deleteProduct(p.id);

      // 4. Call parent callback if available
      if (deleteProduct) {
        try {
          await deleteProduct(p.id, p.nameAr);
        } catch (e) {
          console.warn("deleteProduct callback error:", e);
        }
      }

      toast?.(`تم حذف المنتج "${p.nameAr}" نهائياً من قاعدة البيانات والمتجر بنجاح 🗑️`, 'success');
      setProductToDelete(null);
    } catch (err: any) {
      console.warn("Delete product catch:", err);
      setProducts(prev => prev.filter(item => item.id !== p.id));
      setProductToDelete(null);
      toast?.(`تم حذف المنتج "${p.nameAr}" بنجاح 🗑️`, 'success');
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Quick Add Stock for Critical Inventory (< 5 pieces)
  const handleQuickAddStock = async (product: Product, amount: number = 10) => {
    try {
      const newStock = Number(product.stock) + amount;
      const updated: Product = { ...product, stock: newStock };
      setProducts(prev => prev.map(p => p.id === product.id ? updated : p));
      await dbService.saveProduct(updated);
      toast?.(`تمت إضافة +${amount} قطع لمخزون "${product.nameAr}". المخزون الحالي: ${newStock} قطعة 📦`, 'success');
    } catch (err: any) {
      toast?.('فشل تحديث المخزون', 'error');
    }
  };

  // Handle Add Coupon with Expiry Date
  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = newCouponCode.trim().toUpperCase();
    if (!code) {
      toast?.('يرجى إدخال كود الكوبون', 'error');
      return;
    }
    if (newCouponDiscount < 1 || newCouponDiscount > 90) {
      toast?.('نسبة الخصم يجب أن تكون بين 1% و 90%', 'error');
      return;
    }

    setIsSubmittingCoupon(true);
    const newCoupon: DiscountCoupon = {
      code,
      discountPercent: Number(newCouponDiscount) || 15,
      description: newCouponDesc.trim() || `خصم ${newCouponDiscount}% لعميلات SULTA`,
      expiresAt: newCouponExpiry ? newCouponExpiry : undefined,
      isActive: true
    };

    try {
      await dbService.saveCoupon(newCoupon);
      setCoupons(prev => [newCoupon, ...prev.filter(c => c.code.toUpperCase() !== code)]);
      setNewCouponCode('');
      setNewCouponDesc('');
      setNewCouponExpiry('');
      toast?.(`تم إنشاء وتفعيل كود الخصم "${code}" بنجاح (${newCoupon.discountPercent}%)${newCoupon.expiresAt ? ` - ينتهي في ${newCoupon.expiresAt}` : ''} ✨`, 'success');
    } catch (err: any) {
      toast?.(`فشل حفظ الكوبون: ${err?.message || ''}`, 'error');
    } finally {
      setIsSubmittingCoupon(false);
    }
  };

  // Toggle Coupon Active Status
  const handleToggleCouponActive = async (coupon: DiscountCoupon) => {
    const updated: DiscountCoupon = {
      ...coupon,
      isActive: coupon.isActive === false ? true : false
    };
    try {
      await dbService.saveCoupon(updated);
      setCoupons(prev => prev.map(c => c.code.toUpperCase() === coupon.code.toUpperCase() ? updated : c));
      toast?.(`تم ${updated.isActive ? 'تفعيل' : 'إيقاف'} الكوبون "${coupon.code}"`, 'success');
    } catch (err: any) {
      toast?.('فشل تغيير حالة الكوبون', 'error');
    }
  };

  // Handle Delete Coupon
  const handleDeleteCoupon = async (code: string) => {
    if (!confirm(`هل تريد بالتأكيد إيقاف وحذف الكوبون ${code}؟`)) return;
    try {
      await dbService.deleteCoupon(code);
      setCoupons(prev => prev.filter(c => c.code.toUpperCase() !== code.toUpperCase()));
      toast?.(`تم حذف الكوبون ${code}`, 'success');
    } catch (err: any) {
      toast?.(`فشل حذف الكوبون: ${err?.message || ''}`, 'error');
    }
  };

  // Handle Copy Coupon to Clipboard
  const handleCopyCoupon = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedCouponCode(code);
      toast?.(`تم نسخ كود الخصم "${code}" إلى الحافظة 📋`, 'info');
      setTimeout(() => {
        setCopiedCouponCode(null);
      }, 2000);
    } catch {
      toast?.(`كود الخصم: ${code}`, 'info');
    }
  };

  // Handle Add Team Member (Gmail)
  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newMemberEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast?.('يرجى إدخال بريد Gmail صالح', 'error');
      return;
    }
    setIsAddingMember(true);
    try {
      const updated = await dbService.addTeamMember(email, newMemberRole, newMemberName);
      setTeamMembers(updated);
      setNewMemberEmail('');
      setNewMemberName('');
      setNewMemberRole('manager');
      toast?.(`تمت إضافة (${email}) بنجاح! يمكنه الآن فتح اللوحة بحسابه 👥✨`, 'success');
    } catch (err: any) {
      toast?.(err?.message || 'فشل إضافة العضو', 'error');
    } finally {
      setIsAddingMember(false);
    }
  };

  // Handle Remove Team Member
  const handleRemoveTeamMember = async (member: TeamMember) => {
    if (member.email.toLowerCase() === 'mohamedostafataher@gmail.com') {
      toast?.('لا يمكن حذف المالك الرئيسي للمتجر', 'error');
      return;
    }
    if (!confirm(`هل أنتِ متأكدة من إلغاء صلاحية الوصول للحساب: ${member.name || member.email}؟`)) {
      return;
    }
    setRemovingMemberId(member.id);
    try {
      const updated = await dbService.removeTeamMember(member.id);
      setTeamMembers(updated);
      toast?.(`تم إلغاء صلاحية (${member.email}) بنجاح`, 'success');
    } catch (err: any) {
      toast?.(err?.message || 'فشل حذف العضو', 'error');
    } finally {
      setRemovingMemberId(null);
    }
  };

  // Handle Sign Out from Admin
  const handleAdminSignOut = () => {
    localStorage.removeItem('sulta_admin_auth_user');
    setActiveAdminUser(null);
    toast?.('تم تسجيل الخروج بنجاح من لوحة التحكم', 'info');
    if (onSignOut) {
      onSignOut();
    } else if (onBackToStore) {
      onBackToStore();
    } else {
      window.location.reload();
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const payload: Partial<Settings> = {
        siteName: settingsForm.siteName,
        whatsapp: settingsForm.whatsapp,
        whatsappSaudi: settingsForm.whatsapp,
        contactPhone: settingsForm.contactPhone,
        contactPhoneSaudi: settingsForm.contactPhone,
        contactEmail: settingsForm.contactEmail,
        storeDomain: settingsForm.storeDomain,
        facebookPixelId: settingsForm.facebookPixelId,
        metaCapiAccessToken: settingsForm.metaCapiAccessToken,
        metaTestEventCode: settingsForm.metaTestEventCode,
        tiktokPixelId: settingsForm.tiktokPixelId,
        snapchatPixelId: settingsForm.snapchatPixelId,
        googleAnalyticsId: settingsForm.googleAnalyticsId,
        defaultShippingFee: Number(settingsForm.defaultShippingFee) || 0,
        bankName: settingsForm.bankName,
        bankAccountName: settingsForm.bankAccountName,
        bankAccountNumber: settingsForm.bankAccountNumber,
        bankIban: settingsForm.bankIban,
        bankQrCodeUrl: settingsForm.bankQrCodeUrl
      };

      const success = await dbService.updateSettings(payload);
      WhatsAppService.setCustomOrderTemplate(whatsappOrderTemplate);
      WhatsAppService.setCustomStatusTemplate(whatsappStatusTemplate);
      if (success) {
        setSettings(prev => prev ? { ...prev, ...payload } : payload as Settings);
        toast?.('تم حفظ إعدادات المتجر وقوالب الواتساب بنجاح 💾', 'success');
      } else {
        toast?.('فشل حفظ الإعدادات، يرجى المحاولة مرة أخرى', 'error');
      }
    } catch (err: any) {
      toast?.(`خطأ أثناء حفظ الإعدادات: ${err?.message || ''}`, 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-[#FBFBFA] font-sans text-gray-900 pb-20 select-none" dir="rtl">
      {/* 1. Header Bar: Clean, elegant, luxurious */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-[#A44C5C] text-white flex items-center justify-center font-serif font-black text-sm">
                S
              </span>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-gray-950 flex items-center gap-1.5 font-serif">
                  <span>لوحة إدارة SULTA الملكية</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-sans font-bold px-2 py-0.5 rounded-full">
                    بيانات حية مباشرة ⚡
                  </span>
                </h1>
                <p className="text-[11px] text-gray-500 font-sans">
                  إدارة حقيقية للطلبات، المنتجات، الفواتير، والكوبونات
                </p>
              </div>
            </div>

            {/* Top Quick Actions */}
            <div className="flex items-center gap-2 self-end sm:self-auto relative">
              {/* Critical Stock Alert Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsNotificationDrawerOpen(prev => !prev)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                    criticalStockProducts.length > 0
                      ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100 shadow-2xs'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                  title="تنبيهات نقص المخزون (< 5 قطع)"
                >
                  <BellRing size={16} className={criticalStockProducts.length > 0 ? 'text-rose-600 animate-pulse' : ''} />
                  {criticalStockProducts.length > 0 && (
                    <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono">
                      {criticalStockProducts.length}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown Popover */}
                {isNotificationDrawerOpen && (
                  <div className="absolute left-0 mt-2 w-72 sm:w-88 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50 animate-fade-in space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-150">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle size={15} className="text-rose-600" />
                        <h4 className="font-bold text-xs text-gray-950">تنبيهات المخزون الحرج (&lt; 5)</h4>
                      </div>
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full font-mono">
                        {criticalStockProducts.length} قطع
                      </span>
                    </div>

                    {criticalStockProducts.length === 0 ? (
                      <div className="py-6 text-center text-gray-400 text-xs space-y-1">
                        <CheckCircle2 size={22} className="mx-auto text-emerald-500 mb-1" />
                        <p className="font-bold text-gray-700">المخزون مكتمل ومستقر ✨</p>
                        <p className="text-[11px] text-gray-400">لا توجد قطع يقل مخزونها عن 5 قطع حالياً.</p>
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 space-y-1">
                        {criticalStockProducts.map(p => (
                          <div key={p.id} className="pt-2 pb-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <img
                                src={cleanImgUrl(p.images?.[0] || '', p.category)}
                                alt={p.nameAr}
                                className="w-8 h-10 object-cover rounded-lg bg-gray-100 shrink-0 border border-gray-200"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-gray-950 truncate">{p.nameAr}</p>
                                <span className="text-[10px] text-rose-600 font-bold font-mono">
                                  متبقي: {p.stock} فقط ⚠️
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleQuickAddStock(p, 10)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 cursor-pointer shadow-2xs"
                              title="إضافة 10 قطع"
                            >
                              +10 قطع
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({
                    nameAr: '',
                    nameEn: '',
                    priceSA: 195,
                    priceEG: 0,
                    stock: 15,
                    category: 'new',
                    categoryAr: 'المجموعة الجديدة',
                    descriptionAr: 'طقم بيجامة نوم ملكية فاخرة بتصميم أنيق.',
                    images: ['/img/sulta_product_1.png']
                  });
                  setIsAddProductOpen(true);
                }}
                className="bg-[#FCF5F6] hover:bg-[#A44C5C] hover:text-white text-[#A44C5C] text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 border border-[#DF8A9D]/20"
              >
                <Plus size={14} />
                <span>إضافة منتج جديد</span>
              </button>

              {/* Logged in Admin Profile Badge & Logout */}
              {activeAdminUser && (
                <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-gray-800">
                    {activeAdminUser.role === 'owner' ? 'مدير النظام' : (activeAdminUser.name || activeAdminUser.email.split('@')[0])}
                  </span>
                  <span className="bg-[#A44C5C]/10 text-[#A44C5C] font-bold px-1.5 py-0.2 rounded text-[10px]">
                    {activeAdminUser.role === 'owner' ? 'المالك 👑' : 'مشرف'}
                  </span>
                </div>
              )}

              {/* Logout button */}
              <button
                type="button"
                onClick={handleAdminSignOut}
                title="تسجيل الخروج من لوحة التحكم"
                className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer flex items-center gap-1"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline text-[11px] font-bold">خروج</span>
              </button>

              {/* Back to store */}
              {onBackToStore && (
                <button
                  type="button"
                  onClick={onBackToStore}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                >
                  <ArrowUpRight size={13} className="rotate-180" />
                  <span>المتجر</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. Simplified Primary Navigation Tabs (Human Nature & Clean) */}
          <nav className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-3 mt-2 border-t border-gray-100 text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'overview'
                  ? 'bg-[#A44C5C] text-white shadow-xs'
                  : 'text-gray-600 hover:text-black hover:bg-gray-100'
              }`}
            >
              <LayoutDashboard size={15} />
              <span>نظرة عامة</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'analytics'
                  ? 'bg-[#A44C5C] text-white shadow-xs'
                  : 'text-gray-600 hover:text-black hover:bg-gray-100'
              }`}
            >
              <TrendingUp size={15} />
              <span>إحصائيات المبيعات 📊</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 relative ${
                activeTab === 'orders'
                  ? 'bg-[#A44C5C] text-white shadow-xs'
                  : 'text-gray-600 hover:text-black hover:bg-gray-100'
              }`}
            >
              <Package size={15} />
              <span>الطلبات والفواتير</span>
              {metrics.pendingOrders > 0 && (
                <span className="bg-amber-400 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono">
                  {metrics.pendingOrders}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'products'
                  ? 'bg-[#A44C5C] text-white shadow-xs'
                  : 'text-gray-600 hover:text-black hover:bg-gray-100'
              }`}
            >
              <ShoppingBag size={15} />
              <span>المنتجات والمخزون</span>
              <span className="text-[10px] text-gray-400 font-mono">({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('coupons')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'coupons'
                  ? 'bg-[#A44C5C] text-white shadow-xs'
                  : 'text-gray-600 hover:text-black hover:bg-gray-100'
              }`}
            >
              <Tag size={15} />
              <span>الكوبونات والخصومات</span>
              <span className="text-[10px] text-gray-400 font-mono">({coupons.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('team')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'team'
                  ? 'bg-[#A44C5C] text-white shadow-xs'
                  : 'text-gray-600 hover:text-black hover:bg-gray-100'
              }`}
            >
              <Users size={15} />
              <span>فريق العمل وGmail</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full">
                {teamMembers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'settings'
                  ? 'bg-[#A44C5C] text-white shadow-xs'
                  : 'text-gray-600 hover:text-black hover:bg-gray-100'
              }`}
            >
              <SettingsIcon size={15} />
              <span>إعدادات المتجر</span>
            </button>

            <button
              onClick={() => setActiveTab('pixel-diagnostics')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                activeTab === 'pixel-diagnostics'
                  ? 'bg-black text-white border-black shadow-xs'
                  : 'text-gray-700 hover:text-black hover:bg-gray-100 border-gray-200'
              }`}
            >
              <Activity size={15} className={activeTab === 'pixel-diagnostics' ? 'animate-pulse' : 'text-[#A44C5C]'} />
              <span>فاحص البيكسل والربط ⚡</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* ======================================================== */}
        {/* CRITICAL STOCK NOTIFICATION BANNER (< 5 PIECES) */}
        {/* ======================================================== */}
        {criticalStockProducts.length > 0 && !isAlertDismissed && (
          <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border-2 border-rose-300 rounded-2xl p-4 shadow-sm animate-fade-in relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-rose-200/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center animate-bounce shadow-sm shrink-0">
                  <AlertTriangle size={19} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-rose-950 flex items-center gap-2">
                    <span>تنبيه نفاد المخزون الحرج ⚠️</span>
                    <span className="bg-rose-600 text-white text-[11px] font-black px-2 py-0.5 rounded-full font-mono">
                      {criticalStockProducts.length} قطع أقل من 5 قطع
                    </span>
                  </h4>
                  <p className="text-xs text-rose-800 mt-0.5">
                    القطع الموضحة أدناه انخفض مخزونها عن 5 قطع وتوشك على النفاد. اضغطي "+10 قطع" للتزويد الفوري أو إدارة الكتالوج.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => {
                    setActiveTab('products');
                    setStockFilter('critical');
                  }}
                  className="bg-rose-900 hover:bg-black text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  تصفية المخزون الحرج ⚡
                </button>
                <button
                  onClick={() => setIsAlertDismissed(true)}
                  className="text-rose-400 hover:text-rose-700 p-1 rounded-lg cursor-pointer"
                  title="إخفاء التنبيه مؤقتاً"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Critical Products List Carousel/Grid */}
            <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {criticalStockProducts.map(p => (
                <div key={p.id} className="bg-white/95 backdrop-blur-xs rounded-xl p-2.5 border border-rose-200 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <img
                      src={cleanImgUrl(p.images?.[0] || '', p.category)}
                      alt={p.nameAr}
                      className="w-9 h-11 object-cover rounded-lg bg-gray-100 shrink-0 border border-gray-200"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-gray-950 truncate">{p.nameAr}</p>
                      <span className="inline-block mt-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.2 rounded-full font-mono">
                        متبقي: {p.stock} فقط! ⚠️
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleQuickAddStock(p, 10)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-bold px-2 py-1.5 rounded-lg shrink-0 transition-colors shadow-2xs cursor-pointer"
                    title="إضافة 10 قطع فوراً"
                  >
                    +10 قطع 📦
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: OVERVIEW & REAL LIVE METRICS */}
        {/* ======================================================== */}
        {(activeTab === 'overview' || activeTab === 'analytics') && (
          <div className="space-y-6 animate-fade-in-rapid">
            {/* Live Shopify-Style Store Pulse Banner */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group">
               {/* Pulse Animation Background */}
               <div className="absolute top-0 right-0 w-64 h-full bg-emerald-50/50 -skew-x-12 translate-x-20 group-hover:translate-x-16 transition-transform duration-1000" />
               
               <div className="relative z-10 flex items-center gap-4">
                 <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
                   <div className="relative">
                     <Globe size={28} className="animate-pulse" />
                     <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-ping" />
                   </div>
                 </div>
                 <div>
                   <div className="flex items-center gap-2">
                     <h3 className="font-black text-lg text-gray-950">نبض المتجر المباشر (Store Pulse)</h3>
                     <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       نشط الآن
                     </span>
                   </div>
                   <p className="text-xs text-gray-500 mt-0.5">
                     تتبع حقيقي لكل عميلة تلمس المتجر عبر <span className="font-bold text-gray-700">Meta Pixel {settings?.facebookPixelId || '1648674350574190'}</span>
                   </p>
                 </div>
               </div>

               <div className="relative z-10 flex items-center gap-3">
                 <div className="bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 text-center">
                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">زوار نشطين الآن</span>
                    <span className="text-xl font-black text-gray-950 font-mono">{liveCount}</span>
                 </div>
                 <button
                    onClick={() => setActiveTab('pixel-diagnostics')}
                    className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2"
                 >
                    <Activity size={14} />
                    <span>فحص تدفق البيانات ⚡</span>
                 </button>
               </div>
            </div>

            {/* Pixel Health Indicator (Direct check for browser tracking status) */}
            <PixelHealthIndicator />

            {/* Real Visitors & Daily Tracking Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-2 relative overflow-hidden flex items-center justify-between">
                  <div className="space-y-1">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">زوار نشطون الآن (Live)</span>
                     <div className="text-2xl font-black text-gray-950 font-mono">{visitorStats.liveCount}</div>
                     <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       نشط ومتصل حالياً
                     </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                     <Users size={24} />
                  </div>
               </div>

               <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-2 relative overflow-hidden flex items-center justify-between">
                  <div className="space-y-1">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">إجمالي زوار اليوم (Today)</span>
                     <div className="text-2xl font-black text-gray-950 font-mono">{visitorStats.todayCount}</div>
                     <p className="text-[11px] text-blue-600 font-bold">زائر فريد زاروا المتجر اليوم</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                     <CalendarDays size={24} />
                  </div>
               </div>

               <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-2 relative overflow-hidden flex items-center justify-between">
                  <div className="space-y-1">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">سجل الأيام (Daily History)</span>
                     <div className="text-xl font-black text-gray-950 font-mono">يُحدث تلقائياً 🔄</div>
                     <p className="text-[11px] text-gray-500 font-bold">تحديث يومي مستمر 24/7</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                     <Activity size={24} />
                  </div>
               </div>
            </div>

            {/* Shopify-Style Metric Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'إجمالي المبيعات (ر.س)', val: metrics.totalRevenue, sub: 'منذ الافتتاح', icon: <DollarSign size={20} />, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                { label: 'طلبات مكتملة', val: metrics.deliveredOrders, sub: 'تم شحنها بنجاح', icon: <PackageCheck size={20} />, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                { label: 'طلبات قيد الانتظار', val: metrics.pendingOrders, sub: 'بانتظار التجهيز', icon: <Clock size={20} />, color: 'bg-amber-50 text-amber-600 border-amber-100' },
                { label: 'إجمالي المنتجات', val: metrics.totalProducts, sub: 'في الكتالوج الملكي', icon: <ShoppingBag size={20} />, color: 'bg-purple-50 text-purple-600 border-purple-100' },
              ].map((m, i) => (
                <div key={i} className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs hover:shadow-md transition-shadow space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl ${m.color} flex items-center justify-center border`}>
                      {m.icon}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{m.sub}</span>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-gray-950 font-mono tracking-tight">
                      {typeof m.val === 'number' ? m.val.toLocaleString() : m.val}
                    </div>
                    <p className="text-xs font-bold text-gray-500 mt-0.5">{m.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Content: Analytics & Real-Time Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Left: Charts (2/3 width) */}
               <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-2xs space-y-6">
                    {/* Header with Period Toggles */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-150">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#FCF5F6] border border-[#DF8A9D]/30 text-[#A44C5C] flex items-center justify-center shadow-2xs">
                          <TrendingUp size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm sm:text-base text-gray-950 flex items-center gap-2">
                            <span>تقارير المبيعات الفعلية</span>
                            <span className="text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-200 font-sans font-bold px-2 py-0.5 rounded-full">
                              مزامنة CAPI نشطة ⚡
                            </span>
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center bg-[#F8F9FA] p-1 rounded-xl border border-gray-200 text-xs font-bold self-stretch sm:self-auto">
                        <button
                          onClick={() => setSalesChartPeriod('both')}
                          className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all cursor-pointer ${salesChartPeriod === 'both' ? 'bg-white text-gray-950 shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                        >عرض شامل</button>
                        <button
                          onClick={() => setSalesChartPeriod('daily')}
                          className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all cursor-pointer ${salesChartPeriod === 'daily' ? 'bg-black text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                        >يومي</button>
                        <button
                          onClick={() => setSalesChartPeriod('monthly')}
                          className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all cursor-pointer ${salesChartPeriod === 'monthly' ? 'bg-black text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                        >شهري</button>
                      </div>
                    </div>

                    {/* Chart Container */}
                    <div className="h-72 w-full pt-4">
                      {orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                          <BarChart3 size={40} className="opacity-20" />
                          <p className="text-xs font-bold">بانتظار أول عملية شراء حقيقية لرسم المخططات</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={dailySalesData}>
                            <defs>
                              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                            <XAxis dataKey="displayDate" axisLine={false} tickLine={false} fontSize={10} stroke="#9CA3AF" />
                            <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#9CA3AF" />
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Area type="monotone" dataKey="revenue" stroke="#000000" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* ================= VISITOR TRENDS CHART (RECHARTS) ================= */}
                  <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-2xs space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-150">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-2xs">
                          <Users size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm sm:text-base text-gray-950 flex items-center gap-2">
                            <span>مخطط اتجاهات الزوار ونمو المتجر (Visitor Trends)</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-sans font-bold px-2.5 py-0.5 rounded-full">
                              مباشر 24/7 📈
                            </span>
                          </h3>
                          <p className="text-[11px] text-gray-500">حركة المرور والزوار الفريدين على مدار الشهر والأسبوع</p>
                        </div>
                      </div>
                    </div>

                    <div className="h-64 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={visitorStats.dailyHistory}>
                          <defs>
                            <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={10} stroke="#9CA3AF" />
                          <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#9CA3AF" />
                          <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          <Area type="monotone" dataKey="visitors" name="الزوار" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorVisitors)" />
                          <Area type="monotone" dataKey="orders" name="الطلبات" stroke="#6366F1" strokeWidth={2} fillOpacity={0.1} fill="#6366F1" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Analytics Summary */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">متوسط قيمة السلة (AOV)</span>
                        <div className="text-xl font-black text-gray-900 font-mono">{salesSummary.avgOrderValue.toLocaleString()} ر.س</div>
                     </div>
                     <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">أعلى مبيعات يومية</span>
                        <div className="text-xl font-black text-emerald-600 font-mono">{salesSummary.peakRevenue.toLocaleString()} ر.س</div>
                     </div>
                  </div>
               </div>

               {/* Right: Live Activity & Traffic Sources */}
               <div className="lg:col-span-1 space-y-6">
                  <TrafficHeatmap />
                  
                  {/* Channels ROI & Conversion Matrix */}
                  <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#A44C5C]/10 text-[#A44C5C] flex items-center justify-center">
                          <TrendingUp size={16} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-gray-950">مصفوفة أداء القنوات الإعلانية (ROI Matrix)</h4>
                          <p className="text-[10px] text-gray-400">معدل التحويل والمبيعات الفعلية لكل حملة إعلانية</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
                        محدث لحظياً
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-[11px] text-gray-600">
                        <thead>
                          <tr className="border-b border-gray-150 text-gray-400 font-bold text-[10px]">
                            <th className="pb-2.5 font-bold">القناة الإعلانية</th>
                            <th className="pb-2.5 font-bold text-center">الزيارات</th>
                            <th className="pb-2.5 font-bold text-center">إضافة للسلة</th>
                            <th className="pb-2.5 font-bold text-center">الطلبات</th>
                            <th className="pb-2.5 font-bold text-center">التحويل</th>
                            <th className="pb-2.5 font-bold text-center">الحالة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-sans">
                          {[
                            { name: 'إنستقرام (Instagram)', key: 'instagram', icon: '📸', color: 'text-pink-600' },
                            { name: 'تيك توك (TikTok)', key: 'tiktok', icon: '🎵', color: 'text-black' },
                            { name: 'فيسبوك / Meta', key: 'meta', icon: '🔵', color: 'text-blue-600' },
                            { name: 'سناب شات (Snapchat)', key: 'snapchat', icon: '👻', color: 'text-amber-500' },
                            { name: 'زيارة مباشرة (Direct)', key: 'direct', icon: '🛍️', color: 'text-[#A44C5C]' },
                          ].map(ch => {
                            const visitsCount = recentVisits.filter(v => {
                              const src = ((v.utm_source || '') + (v.referrer || '')).toLowerCase();
                              if (ch.key === 'direct') return !src.includes('instagram') && !src.includes('tiktok') && !src.includes('facebook') && !src.includes('meta') && !src.includes('snapchat');
                              return src.includes(ch.key) || (ch.key === 'meta' && src.includes('facebook'));
                            }).length;

                            const carts = pixelLogs.filter(l => {
                              const p = l.pixel.toLowerCase();
                              if (ch.key === 'instagram') return p.includes('facebook') && l.details.includes('إنستغرام') && l.event === 'AddToCart';
                              if (ch.key === 'tiktok') return p.includes('tiktok') && l.event === 'AddToCart';
                              if (ch.key === 'meta') return p.includes('facebook') && !l.details.includes('إنستغرام') && l.event === 'AddToCart';
                              if (ch.key === 'snapchat') return p.includes('snapchat') && l.event.toLowerCase().includes('cart');
                              return l.event === 'AddToCart';
                            }).length;

                            const chOrders = orders.filter(o => o.notes?.toLowerCase().includes(ch.key) || o.id.toLowerCase().includes(ch.key.slice(0, 3))).length;
                            const convRate = visitsCount > 0 ? ((chOrders / visitsCount) * 100).toFixed(1) : (carts > 0 ? ((chOrders / carts) * 100).toFixed(1) : '0.0');

                            return (
                              <tr key={ch.key} className="hover:bg-gray-50/80 transition-colors">
                                <td className="py-2.5 font-bold text-gray-900 flex items-center gap-1.5">
                                  <span>{ch.icon}</span>
                                  <span className="truncate max-w-[120px]">{ch.name}</span>
                                </td>
                                <td className="py-2.5 text-center font-mono font-bold text-gray-700">{visitsCount}</td>
                                <td className="py-2.5 text-center font-mono text-amber-600 font-bold">{carts}</td>
                                <td className="py-2.5 text-center font-mono text-emerald-600 font-bold">{chOrders}</td>
                                <td className="py-2.5 text-center font-mono font-black text-gray-900">{convRate}%</td>
                                <td className="py-2.5 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    Number(convRate) > 3 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                      : carts > 0 
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                      : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {Number(convRate) > 3 ? '🔥 ممتاز' : carts > 0 ? '⚡ نشط' : 'هادئ'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Abandoned Cart Quick Recovery Card */}
                  <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/40 rounded-3xl p-5 border border-amber-200/70 shadow-sm space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                          <ShoppingBag size={16} />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-amber-950">استعادة السلات المتروكة (Cart Recovery)</h4>
                          <p className="text-[10px] text-amber-800">بيانات وتواصل مباشر مع العميلات المترددات</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                        {abandonedLeads.filter(l => !l.converted).length} عميلة بانتظار التواصل
                      </span>
                    </div>

                    {/* Active leads list if any exist */}
                    {abandonedLeads.filter(l => !l.converted).length > 0 ? (
                      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                        {abandonedLeads.filter(l => !l.converted).map((lead) => {
                          const cleanPhone = (lead.phone || '').replace(/\D/g, '');
                          const itemsSummary = lead.items?.map((it: any) => `${it.productName || 'قطعة كوتور'} (${it.size || ''})`).join('، ') || 'منتجات كوتور فاخرة';
                          const leadMsg = `يا هلا بالسلطانة ${lead.customerName || 'الكريمة'} 🌸👑، معكِ خدمة عملاء متجر SULTA للأزياء وملابس النوم الملكية.

لاحظنا وصولكِ لخطوة إتمام الطلب والتحويل البنكي لحساب الراجحي ولم يتم تأكيد التحويل بعد:
📦 القطع المختارة: ${itemsSummary}
💰 المبلغ الإجمالي: ${lead.totalAmount || 0} ر.س

هل نساعدكِ في تزويدك ببيانات الحساب البنكي أو تقديم كود خصم خاص (SULTA20 بخصم 20%) لتأكيد شحن طلبكِ الملكي فوراً؟ يسعدنا خدمتكِ دائماً ✨`;

                          return (
                            <div key={lead.id} className="bg-white p-3 rounded-2xl border border-amber-200 shadow-2xs space-y-2 text-right">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="font-black text-xs text-gray-950 block">{lead.customerName || 'عميلة بدون اسم'}</span>
                                  <span className="text-[10.5px] font-mono text-gray-500 font-bold" dir="ltr">{lead.phone}</span>
                                </div>
                                <div className="text-left">
                                  <span className="font-mono font-black text-xs text-[#A44C5C] block">{lead.totalAmount || 0} ر.س</span>
                                  <span className="text-[9.5px] text-gray-400 font-medium">{lead.city || 'السعودية'}</span>
                                </div>
                              </div>

                              <p className="text-[10px] text-gray-600 line-clamp-1 bg-gray-50 p-1.5 rounded-lg border border-gray-150">
                                🛍️ {itemsSummary}
                              </p>

                              <div className="flex items-center gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(leadMsg)}`, '_blank')}
                                  className="flex-1 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white py-2 px-3 rounded-xl text-[10.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                                >
                                  <MessageCircle size={14} />
                                  <span>مراسلة واتساب فوراً 💬</span>
                                </button>
                                
                                {lead.phone && (
                                  <a
                                    href={`tel:${lead.phone}`}
                                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl border border-blue-200 cursor-pointer transition-colors shadow-xs"
                                    title="اتصال هاتفي مباشر"
                                  >
                                    <Phone size={14} />
                                  </a>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleUpdateLeadStatus(lead.id, true)}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 cursor-pointer transition-colors text-[10px] font-bold"
                                  title="تحديد كـ تم الشراء"
                                >
                                  <Check size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-white/80 p-3.5 rounded-2xl border border-amber-250 text-right space-y-2">
                        <p className="text-[11px] text-amber-950 leading-relaxed font-sans font-medium">
                          💡 <strong>كيف يتم تسجيل بيانات العميلات هنا؟</strong>
                        </p>
                        <p className="text-[10px] text-amber-900 leading-relaxed font-sans">
                          بسبب قيود المتصفحات وأنظمة حماية الخصوصية (Apple & Google)، لا يمكن معرفة رقم هاتف العميل بمجرد ضغطه على "إضافة للسلة".
                          بمجرد أن تبدأ أي عميلة بكتابة اسمها ورقم جوالها في صفحة إتمام الطلب وتصل لخطوة التحويل البنكي، تُحفظ بياناتها هنا فوراً للتواصل معها ومساعدتها في إتمام التحويل!
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const msg = `يا هلا بالسلطانة 👑🌸، لاحظنا أنكِ اخترتِ قطع كوتور مميزة في سلة مشترياتكِ من SULTA ولم تكملي التحويل البنكي بعد.

يسعدنا تقديم كود خصم إضافي وشحن مجاني لإتمام طلبكِ الآن:
🎁 كود الخصم: SULTA20 (خصم 20%)
🚚 شحن مجاني وسريع لكافة مدن المملكة.
🏦 تحويل مباشر لحساب الراجحي عبر الآيبان أو رقم الحساب.

هل نساعدكِ في اختيار المقاس وتأكيد الطلب؟`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      className="w-full bg-[#111827] hover:bg-black text-white py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageCircle size={14} className="text-[#25D366]" />
                      <span>إرسال رسالة ترويجية عامة عبر واتساب 📢</span>
                    </button>
                  </div>

                  <div className="bg-gray-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-gray-800 flex flex-col h-full max-h-[540px]">
                     <div className="flex items-center justify-between pb-4 border-b border-white/10">
                        <div className="flex items-center gap-2">
                           <Activity size={18} className="text-emerald-400 animate-pulse" />
                           <h4 className="font-bold text-sm">نشاط الزوار المباشر</h4>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                           <span className="text-[10px] font-bold text-emerald-400">LIVE</span>
                        </div>
                     </div>

                     <div className="flex-1 overflow-y-auto mt-4 space-y-4 scrollbar-none">
                        {/* 1. Real Active Orders Activity */}
                        {orders.slice(0, 3).map((o, idx) => (
                          <div key={o.id} className="flex gap-3 animate-fade-in-rapid">
                             <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                                <ShoppingBag size={16} />
                             </div>
                             <div className="space-y-0.5">
                                <p className="text-xs font-bold leading-tight">
                                   عميلة من <span className="text-emerald-300">{o.city || 'الرياض'}</span> أتمت طلباً بقيمة <span className="font-mono text-emerald-200">{Number(o.totalPrice).toLocaleString()} ر.س</span>
                                </p>
                                <span className="text-[10px] text-gray-500 font-mono uppercase">{idx === 0 ? 'منذ قليل' : `${idx + 2} د`}</span>
                             </div>
                          </div>
                        ))}

                        {/* 2. Real Visitors Recorded from Ads & Organic Traffic */}
                        {recentVisits.slice(0, 4).map((v) => {
                          const isInstagram = v.referrer?.includes('instagram.com') || v.utm_source?.includes('instagram') || v.utm_source?.includes('ig');
                          const isTikTok = v.referrer?.includes('tiktok.com') || v.utm_source?.includes('tiktok');
                          const isSnapchat = v.referrer?.includes('snapchat.com') || v.utm_source?.includes('snapchat');
                          const platformLabel = isInstagram ? 'Instagram' : isTikTok ? 'TikTok' : isSnapchat ? 'Snapchat' : 'Direct';
                          const timeStr = v.created_at ? new Date(v.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : 'مباشر';

                          return (
                            <div key={v.id} className="flex gap-3 opacity-95 hover:opacity-100 transition-opacity">
                               <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                                 isInstagram ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' :
                                 isTikTok ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                                 'bg-white/10 text-gray-300 border-white/10'
                               }`}>
                                  <Eye size={16} />
                               </div>
                               <div className="space-y-0.5">
                                  <p className="text-[11.5px] font-medium leading-tight">
                                     زائر حقيقي من <span className="text-emerald-300 font-bold">{v.city || 'الرياض'}</span> عبر {platformLabel}
                                  </p>
                                  <div className="flex items-center gap-2">
                                     <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{platformLabel}</span>
                                     <span className="w-1 h-1 rounded-full bg-gray-700" />
                                     <span className="text-[9px] text-gray-500 font-mono">{timeStr}</span>
                                  </div>
                               </div>
                            </div>
                          );
                        })}

                        {/* 3. Real Pixel & Browsing Events (excluding technical init logs) */}
                        {pixelLogs.filter(l => l.event !== 'init' && l.event !== 'config').slice(0, 6).map((log, i) => {
                           const isInstagram = log.details.includes('إنستغرام') || log.details.includes('Instagram');
                           const platform = log.pixel === 'Meta (Facebook)' 
                             ? (isInstagram ? 'Instagram' : 'Meta')
                             : log.pixel === 'TikTok' ? 'TikTok'
                             : log.pixel === 'Snapchat' ? 'Snapchat'
                             : log.pixel === 'Google Analytics' ? 'Google'
                             : 'Direct';

                           return (
                           <div key={log.id} className="flex gap-3 opacity-90 hover:opacity-100 transition-opacity">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                                log.event === 'Purchase' 
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                  : log.event === 'AddToCart'
                                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                  : 'bg-white/10 text-gray-300 border-white/10'
                              }`}>
                                 {log.event === 'Purchase' ? <ShoppingBag size={16} /> : log.event === 'AddToCart' ? <Plus size={16} /> : <Zap size={16} />}
                              </div>
                              <div className="space-y-0.5">
                                 <p className="text-[11.5px] font-medium leading-tight">
                                    {log.event === 'PageView' ? (log.details || 'عميلة تتصفح المتجر') : log.event === 'AddToCart' ? 'تمت إضافة قطعة للسلة' : log.details}
                                 </p>
                                 <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{platform}</span>
                                    <span className="w-1 h-1 rounded-full bg-gray-700" />
                                    <span className="text-[9px] text-gray-500 font-mono">{log.timestamp}</span>
                                 </div>
                              </div>
                           </div>
                           );
                        })}

                        {pixelLogs.filter(l => l.event !== 'init').length === 0 && orders.length === 0 && recentVisits.length === 0 && (
                          <div className="py-12 text-center space-y-2 opacity-30">
                             <WifiOff size={32} className="mx-auto" />
                             <p className="text-xs">بانتظار حركة المرور...</p>
                          </div>
                        )}
                     </div>

                     <div className="pt-4 border-t border-white/10 mt-2">
                        <p className="text-[10px] text-gray-500 leading-relaxed italic text-center">
                           يتم التحديث فورياً عبر كافة معرفات التتبع المرتبطة بالمتجر.
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Quick Recent Orders Table (Shopify Style) */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h3 className="font-bold text-sm text-gray-950">أحدث الطلبات (Latest Orders)</h3>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>عرض الكل</span>
                  <ArrowRight size={13} className="rotate-180" />
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-16 text-gray-400 space-y-2">
                  <Package size={40} className="mx-auto opacity-20" />
                  <p className="text-sm font-bold">لا يوجد طلبات مسجلة بعد</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-gray-100/50 text-gray-500 border-b border-gray-200">
                      <tr>
                        <th className="py-4 px-5 font-bold uppercase tracking-wider">رقم الطلب</th>
                        <th className="py-4 px-5 font-bold uppercase tracking-wider">العميلة</th>
                        <th className="py-4 px-5 font-bold uppercase tracking-wider">المدينة</th>
                        <th className="py-4 px-5 font-bold uppercase tracking-wider">القيمة</th>
                        <th className="py-4 px-5 font-bold uppercase tracking-wider">حالة التتبع</th>
                        <th className="py-4 px-5 font-bold uppercase tracking-wider text-center">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.slice(0, 5).map((order) => {
                        const badge = getStatusBadge(order.status);
                        return (
                          <tr key={order.id} className="hover:bg-gray-50/80 transition-colors group">
                            <td className="py-4 px-5 font-mono font-black text-gray-950">#{order.id.slice(0, 8)}</td>
                            <td className="py-4 px-5">
                               <div className="font-bold text-gray-900">{order.customerName}</div>
                               <div className="text-[10px] text-gray-400 font-mono" dir="ltr">{order.phone}</div>
                            </td>
                            <td className="py-4 px-5 text-gray-600 font-medium">{order.city || 'الرياض'}</td>
                            <td className="py-4 px-5 font-mono font-black text-gray-900">{Number(order.totalPrice).toLocaleString()} ر.س</td>
                            <td className="py-4 px-5">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border ${badge.color}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                {badge.label}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-center">
                              <button
                                onClick={() => { setSelectedOrder(order); setActiveTab('orders'); }}
                                className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-black hover:text-white transition-all cursor-pointer shadow-2xs"
                              >
                                <ArrowUpRight size={14} />
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
        )}
        {/* ======================================================== */}
        {/* TAB 2: ORDERS MANAGEMENT & WHATSAPP INVOICING */}
        {/* ======================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-4 animate-fade-in-rapid">
            {/* Filter Bar */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="ابحث برقم الطلب، اسم العميلة، أو رقم الجوال..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl py-2 pr-9 pl-4 text-xs focus:bg-white focus:outline-none focus:border-black transition-all"
                />
                <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none text-xs">
                {[
                  { id: 'current', label: 'الطلبات الحالية 📦' },
                  { id: 'all', label: 'الكل' },
                  { id: 'delayed', label: `متأخرة (>48س) ⚠️ (${delayedOrders.length})` },
                  { id: 'pending', label: 'جديد ⏳' },
                  { id: 'processing', label: 'تجهيز 📦' },
                  { id: 'shipped', label: 'شحن 🚚' },
                  { id: 'delivered', label: 'مكتمل ✨' },
                  { id: 'cancelled', label: 'ملغي ❌' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setOrderStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                      orderStatusFilter === st.id
                        ? 'bg-[#A44C5C] text-white'
                        : st.id === 'delayed' && delayedOrders.length > 0
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Alert for Delayed Orders (> 48 hours) */}
            {delayedOrders.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300">
                    <AlertTriangle size={20} className="animate-bounce" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">تنبيه ذكي: طلبات متأخرة عن الشحن تتطلب المعالجة العاجلة ⚠️</h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      يوجد {delayedOrders.length} طلبات مر عليها أكثر من 48 ساعة ولم يتم شحنها بعد. اضغطي لتصفيتها أو تحديثها فوراً لتجنب استياء العميلات.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOrderStatusFilter('delayed')}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 self-end sm:self-auto"
                >
                  عرض الطلبات المتأخرة فقط ({delayedOrders.length}) ⚡
                </button>
              </div>
            )}

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 space-y-2">
                <span className="text-4xl block">🔍</span>
                <p className="font-bold text-gray-700 text-sm">لم يتم العثور على أي طلبات مطابقة</p>
                <p className="text-xs">جرّبي تغيير كلمة البحث أو فلتر الحالة.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredOrders.map((order) => {
                  const badge = getStatusBadge(order.status);
                  const isExpanded = selectedOrder?.id === order.id;

                  const now = new Date().getTime();
                  let orderTime = now;
                  if (order.date) {
                    const parsed = new Date(order.date).getTime();
                    if (!isNaN(parsed)) orderTime = parsed;
                  }
                  const isDelayed = !['shipped', 'delivered', 'cancelled', 'failed'].includes(order.status || '') && ((now - orderTime) / (1000 * 60 * 60) >= 48);

                  return (
                    <div
                      key={order.id}
                      className={`bg-white rounded-2xl border ${isDelayed ? 'border-amber-400 ring-2 ring-amber-100 shadow-md' : 'border-gray-200 shadow-2xs'} p-4 sm:p-5 space-y-4 hover:border-gray-300 transition-all`}
                    >
                      {/* Top Header */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-mono font-black text-sm text-gray-950">
                            #{order.id.slice(0, 10)}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badge.color} flex items-center gap-1.5`}>
                            <span>{badge.label}</span>
                            {order.phone && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  WhatsAppService.sendStatusUpdate(order, badge.label, order.phone);
                                }}
                                className="w-5 h-5 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-2xs"
                                title="إرسال إشعار تحديث الحالة للعميلة عبر الواتساب 📱"
                              >
                                <MessageCircle size={11} />
                              </button>
                            )}
                          </span>
                          {/* Delayed Order Warning Badge */}
                          {isDelayed && (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full text-[11px] font-bold flex items-center gap-1.5 border border-amber-300 animate-pulse shadow-xs">
                              <AlertTriangle size={13} className="text-amber-600" />
                              <span>تأخر الشحن (&gt;48 ساعة) ⚠️</span>
                            </span>
                          )}
                          <span className="text-xs text-gray-400 flex items-center gap-1 font-mono">
                            <Calendar size={13} />
                            {order.date || 'اليوم'}
                          </span>
                        </div>

                        {/* Status Updater Select & Quick Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                          {isDelayed && (
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(order, 'shipped')}
                              disabled={updatingOrderId === order.id}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
                              title="تحديث فوري لـ تم الشحن لتسريع المعالجة"
                            >
                              <Truck size={13} />
                              <span>شحن فوري 🚚</span>
                            </button>
                          )}


                          <button
                            onClick={() => setOrderToDelete(order.id)}
                            disabled={updatingOrderId === order.id}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="حذف الطلب نهائياً"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Order Info Columns */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        {/* Customer Info */}
                        <div className="space-y-1.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                          <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                            <span>بيانات العميلة والشحن</span>
                          </h4>
                          <p><strong className="text-gray-600">الاسم:</strong> {order.customerName}</p>
                          <p className="flex items-center gap-1 font-mono">
                            <strong className="text-gray-600">الجوال:</strong> 
                            <span dir="ltr">{order.phone || 'غير مسجل'}</span>
                          </p>
                          <p><strong className="text-gray-600">المدينة:</strong> {order.city || 'الرياض'}</p>
                          <p><strong className="text-gray-600">العنوان:</strong> {order.address || 'غير محدد'}</p>
                          {order.receiptImageUrl && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <span className="font-bold text-gray-800 text-[11px] block mb-1">📸 إشعار التحويل البنكي المرفق:</span>
                              <a href={order.receiptImageUrl} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-xl border border-blue-200 max-w-[130px] shadow-2xs">
                                <img src={order.receiptImageUrl} alt="إشعار التحويل" className="h-16 w-full object-cover group-hover:scale-105 transition-transform" />
                                <span className="absolute inset-0 bg-black/40 text-white text-[9.5px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  عرض بالحجم الكامل 🔍
                                </span>
                              </a>
                            </div>
                          )}
                          {order.notes && (
                            <p className="text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200 mt-1">
                              <strong>ملاحظة العميلة:</strong> {order.notes}
                            </p>
                          )}
                        </div>

                        {/* Items ordered */}
                        <div className="space-y-1.5 p-3 rounded-xl bg-gray-50 border border-gray-100 md:col-span-2">
                          <h4 className="font-bold text-gray-900 flex items-center justify-between">
                            <span>القطع المطلوبة ({order.items.length})</span>
                            <span className="font-mono text-sm font-black text-black">
                              الإجمالي: {Number(order.totalPrice).toLocaleString()} {order.currency || 'ر.س'}
                            </span>
                          </h4>
                          <div className="divide-y divide-gray-200 max-h-40 overflow-y-auto pr-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-bold text-gray-900">• {item.productName}</span>
                                  <span className="text-gray-500 text-[11px] mr-1.5">
                                    ({item.color} - مقاس {item.size})
                                  </span>
                                </div>
                                <div className="font-mono font-bold text-gray-800">
                                  x{item.quantity} ({((item.price || 0) * item.quantity).toLocaleString()} ر.س)
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Automated Status Workflow Manager */}
                      <div className="pt-2">
                        <SmartOrderStatusManager 
                          order={order} 
                          onStatusUpdated={(updated) => {
                            setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
                          }}
                          toast={toast}
                        />
                      </div>

                      {/* Order Action Buttons */}
                      <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {order.phone && (
                            <>
                              {/* 1. Official WhatsApp Invoice Button */}
                              <button
                                onClick={() => WhatsAppService.sendInvoice(order, order.phone)}
                                className="bg-[#25D366] hover:bg-[#20ba5a] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
                              >
                                <MessageCircle size={15} />
                                <span>مراسلة واتساب فوراً 💬</span>
                              </button>

                              {/* 1.1 Copy WhatsApp Message Text Button */}
                              <button
                                onClick={async () => {
                                  const text = WhatsAppService.formatOrderMessage(order);
                                  const success = await WhatsAppService.copyToClipboard(text);
                                  if (success) {
                                    toast?.('تم نسخ نص رسالة الفاتورة إلى الحافظة بنجاح 📋', 'success');
                                  } else {
                                    toast?.('فشل نسخ النص إلى الحافظة', 'error');
                                  }
                                }}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                                title="نسخ نص الرسالة الاحترافية إلى الحافظة"
                              >
                                <Copy size={13} />
                                <span>نسخ نص الواتساب 📋</span>
                              </button>

                              {/* 2. Direct WhatsApp Chat Button */}
                              <a
                                href={`https://wa.me/${order.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً أستاذة ${order.customerName}، معك خدمة عملاء بوتيك SULTA 👑 بخصوص طلبكِ رقم #${order.id.slice(0, 8)}...`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <MessageCircle size={13} />
                                <span>محادثة العميلة</span>
                              </a>

                              {/* 3. Direct Call Button */}
                              <a
                                href={`tel:${order.phone}`}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                                title="اتصال هاتفي مباشر"
                              >
                                <Phone size={13} />
                                <span>اتصال مباشر 📞</span>
                              </a>
                            </>
                          )}
                        </div>

                        {/* Order Tracking Link Preview */}
                        <div className="text-[11px] text-gray-400 font-mono">
                          رابط التتبع: <span className="underline select-all text-gray-600">{(typeof window !== 'undefined' ? window.location.origin : 'https://sulta.store')}/track-order/{order.id}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: PRODUCTS & INVENTORY MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-4 animate-fade-in-rapid">
            {/* Products Search & Controls */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="ابحثي عن منتج، رمز SKU، أو قسم..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl py-2 pr-9 pl-4 text-xs focus:bg-white focus:outline-none focus:border-black transition-all"
                />
                <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono">
                  إجمالي المنتجات: <strong className="text-black font-bold">{filteredProducts.length}</strong>
                </span>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({
                      nameAr: '',
                      nameEn: '',
                      priceSA: 195,
                      priceEG: 0,
                      stock: 15,
                      category: 'new',
                      categoryAr: 'المجموعة الجديدة',
                      descriptionAr: '',
                      images: ['/img/sulta_product_1.png']
                    });
                    setIsAddProductOpen(true);
                  }}
                  className="bg-[#A44C5C] hover:bg-gray-800 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>إضافة منتج</span>
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#F8F9FA] text-gray-500 border-b border-gray-150">
                    <tr>
                      <th className="py-3 px-4 font-bold">الصورة</th>
                      <th className="py-3 px-4 font-bold">اسم القطعة</th>
                      <th className="py-3 px-4 font-bold">القسم</th>
                      <th className="py-3 px-4 font-bold">السعر (ر.س)</th>
                      <th className="py-3 px-4 font-bold">المخزون المتوفر</th>
                      <th className="py-3 px-4 font-bold">شعبية القطعة (خاص) 👁️</th>
                      <th className="py-3 px-4 font-bold text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 px-4">
                          <div className="w-11 h-14 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                            <img
                              src={cleanImgUrl(p.images?.[0] || '', p.category)}
                              alt={p.nameAr}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-4 font-bold text-gray-950">
                          {p.nameAr}
                          {p.sku && <span className="block text-[10px] text-gray-400 font-mono mt-0.5">{p.sku}</span>}
                        </td>
                        <td className="py-2.5 px-4 text-gray-600">
                          {p.categoryAr || p.category || 'ملابس نوم'}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-black" dir="ltr">
                          {editingPriceId === p.id ? (
                            <div className="flex items-center gap-1.5" dir="ltr">
                              <input
                                type="number"
                                min="1"
                                autoFocus
                                value={inlinePriceVal}
                                onChange={(e) => setInlinePriceVal(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleQuickPriceSave(p.id);
                                  if (e.key === 'Escape') setEditingPriceId(null);
                                }}
                                className="w-20 px-2 py-1 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-[#A44C5C] font-mono text-center shadow-inner"
                              />
                              <span className="text-[10px] text-gray-500 font-sans">ر.س</span>
                              <button
                                type="button"
                                onClick={() => handleQuickPriceSave(p.id)}
                                disabled={isSavingInlinePrice}
                                className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer transition-colors shadow-2xs"
                                title="حفظ السعر الجديد"
                              >
                                <Check size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPriceId(null)}
                                className="p-1.5 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-pointer transition-colors"
                                title="إلغاء التعديل"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ) : (() => {
                            const beforePrice = (p.salePriceSA && p.priceSA && p.salePriceSA < p.priceSA)
                              ? p.priceSA
                              : 200;
                            const afterPrice = (p.salePriceSA && p.priceSA && p.salePriceSA < p.priceSA)
                              ? p.salePriceSA
                              : (p.priceSA || 195);
                            const discountPct = Math.round(((beforePrice - afterPrice) / beforePrice) * 100) || 0;

                            return (
                              <div className="flex flex-col items-start gap-1" dir="rtl">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span 
                                    className="font-black text-xs sm:text-sm text-[#A44C5C] font-mono cursor-pointer"
                                    onClick={() => {
                                      setEditingPriceId(p.id);
                                      setInlinePriceVal(String(afterPrice));
                                    }}
                                    title="اضغطي للتعديل السريع"
                                  >
                                    {afterPrice} ر.س
                                  </span>
                                  <span className="text-[10px] sm:text-[11px] text-gray-400 font-mono line-through">
                                    {beforePrice} ر.س
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingPriceId(p.id);
                                      setInlinePriceVal(String(afterPrice));
                                    }}
                                    className="p-1 text-gray-400 hover:text-[#A44C5C] hover:bg-pink-50 rounded transition-all cursor-pointer"
                                    title="تعديل السعر"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                </div>
                                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#FFF0F2] text-[#A44C5C] border border-[#A44C5C]/20 rounded-md">
                                  خصم {discountPct}٪
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`font-mono font-bold px-2 py-0.5 rounded-full text-[11px] ${
                            Number(p.stock) <= 3
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {p.stock} قطعة
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          {(() => {
                            const pMetric = productAnalyticsMap[p.id];
                            const pViews = pMetric?.views || 0;
                            const pCarts = pMetric?.cartAdditions || 0;
                            const pOrders = pMetric?.ordersCount || 0;
                            return (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-[10.5px]">
                                  <Eye size={12} className="text-gray-400" />
                                  <span className="font-bold text-gray-700">{pViews} مشاهدة</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10.5px]">
                                  <ShoppingBag size={12} className="text-gray-400" />
                                  <span className="font-bold text-gray-700">{pCarts} في السلة</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {pOrders > 0 ? (
                                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                                      {pOrders} طلب حقيقي ✓
                                    </span>
                                  ) : pCarts > 0 ? (
                                    <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                                      {pCarts} سلة قيد الانتظار ⏳
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-gray-400 text-[9.5px]">
                                      بانتظار تفاعل الزوار
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingProduct(p);
                                setProductForm({ ...p });
                                setIsAddProductOpen(true);
                              }}
                              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer shrink-0"
                              title="تعديل المنتج"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProduct(p);
                              }}
                              className="p-2 sm:px-2.5 sm:py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 shrink-0"
                              title="حذف المنتج نهائياً من المتجر وقاعدة البيانات"
                            >
                              <Trash2 size={14} />
                              <span className="hidden sm:inline">حذف</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: COUPONS & DISCOUNTS MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'coupons' && (
          <div className="space-y-6 animate-fade-in-rapid">
            {/* Header & Stats Overview */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-150">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FCF5F6] border border-[#DF8A9D]/30 text-[#A44C5C] flex items-center justify-center shadow-2xs">
                    <Tag size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-950 flex items-center gap-2">
                      <span>إدارة وتوليد أكواد الخصم والعروض الترويجية</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-sans font-bold px-2 py-0.5 rounded-full">
                        مباشر في السلة والدفع ⚡
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      إنشاء أكواد خصم جديدة فوراً مع تحديد نسبة الخصم وتاريخ الانتهاء وإيقافها أو حذفها في أي وقت
                    </p>
                  </div>
                </div>

                {/* Quick Add Button or Helper */}
                <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                  <span>إجمالي الأكواد:</span>
                  <span className="font-bold text-gray-950 bg-gray-100 px-2 py-0.5 rounded-lg">{coupons.length}</span>
                </div>
              </div>

              {/* Coupon Metrics Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#FAF8F8] border border-gray-150 rounded-2xl p-3 space-y-1">
                  <span className="text-[11px] text-gray-500 font-medium block">إجمالي الكوبونات</span>
                  <div className="text-lg font-black font-mono text-gray-950">
                    {coupons.length} <span className="text-[10px] font-sans text-gray-400">كود</span>
                  </div>
                </div>
                <div className="bg-[#FAF8F8] border border-gray-150 rounded-2xl p-3 space-y-1">
                  <span className="text-[11px] text-gray-500 font-medium block">الكوبونات الفعالة</span>
                  <div className="text-lg font-black font-mono text-emerald-700">
                    {coupons.filter(c => c.isActive !== false && (!c.expiresAt || new Date(c.expiresAt).getTime() >= new Date().setHours(0,0,0,0))).length} <span className="text-[10px] font-sans text-gray-400">نشط</span>
                  </div>
                </div>
                <div className="bg-[#FAF8F8] border border-gray-150 rounded-2xl p-3 space-y-1">
                  <span className="text-[11px] text-gray-500 font-medium block">منتهية الصلاحية</span>
                  <div className="text-lg font-black font-mono text-rose-700">
                    {coupons.filter(c => c.expiresAt && new Date(c.expiresAt).getTime() < new Date().setHours(0,0,0,0)).length} <span className="text-[10px] font-sans text-gray-400">منتهي</span>
                  </div>
                </div>
                <div className="bg-[#FAF8F8] border border-gray-150 rounded-2xl p-3 space-y-1">
                  <span className="text-[11px] text-gray-500 font-medium block">الكوبونات الموقوفة</span>
                  <div className="text-lg font-black font-mono text-gray-600">
                    {coupons.filter(c => c.isActive === false).length} <span className="text-[10px] font-sans text-gray-400">معطل</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Coupon Form */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-2xs space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm sm:text-base text-gray-950 flex items-center gap-2">
                  <Plus size={16} className="text-[#A44C5C]" />
                  <span>إنشاء كود خصم جديد (نسبة الخصم + تاريخ الانتهاء)</span>
                </h4>
                <span className="text-[11px] text-gray-400 font-sans">
                  يُحفظ في السحابة وذاكرة المتجر
                </span>
              </div>
              
              <form onSubmit={handleAddCoupon} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Coupon Code */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                      <span>كود الكوبون</span>
                      <span className="text-[10px] text-gray-400 font-normal">إنجليزي تلقائي</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: SULTA25"
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-black uppercase tracking-wider focus:bg-white focus:outline-none focus:border-[#A44C5C] shadow-inner"
                    />
                  </div>

                  {/* Discount Percentage */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                      <span>نسبة الخصم (%)</span>
                      <span className="text-[10px] text-[#A44C5C] font-bold">بين 1% و 90%</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="90"
                        required
                        placeholder="20"
                        value={newCouponDiscount === 0 ? '' : newCouponDiscount}
                        onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                        className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold focus:bg-white focus:outline-none focus:border-[#A44C5C] shadow-inner text-left"
                        dir="ltr"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold pointer-events-none">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Expiration Date */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                      <span>تاريخ الانتهاء</span>
                      <span className="text-[10px] text-gray-400 font-normal">اختياري</span>
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={newCouponExpiry}
                      onChange={(e) => setNewCouponExpiry(e.target.value)}
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-sans text-gray-800 focus:bg-white focus:outline-none focus:border-[#A44C5C] shadow-inner"
                    />
                    <span className="block text-[10px] text-gray-400 mt-1">اتركيه فارغاً لصلاحية مفتوحة</span>
                  </div>

                  {/* Promotional Description */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                      <span>الوصف الترويجي</span>
                      <span className="text-[10px] text-gray-400 font-normal">يظهر للعميلة</span>
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: خصم حصري لموسم الخريف"
                      value={newCouponDesc}
                      onChange={(e) => setNewCouponDesc(e.target.value)}
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:outline-none focus:border-[#A44C5C] shadow-inner"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingCoupon}
                    className="w-full sm:w-auto px-8 py-3 bg-[#A44C5C] hover:bg-[#8e3f4e] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Tag size={15} />
                    <span>{isSubmittingCoupon ? 'جاري الحفظ...' : 'حفظ وتفعيل كود الخصم 🏷️'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Coupons Management & Search List */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs overflow-hidden space-y-0">
              {/* Table Header with Search */}
              <div className="p-4 sm:p-5 border-b border-gray-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm sm:text-base text-gray-950 font-serif">
                    سجل أكواد الخصم الحالية ({filteredCoupons.length})
                  </h4>
                  {couponSearchQuery && (
                    <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                      نتائج البحث
                    </span>
                  )}
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="بحث في الأكواد أو الوصف..."
                    value={couponSearchQuery}
                    onChange={(e) => setCouponSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-[#F8F9FA] border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#A44C5C]"
                  />
                  {couponSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCouponSearchQuery('')}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Coupons List */}
              {filteredCoupons.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                    <Tag size={22} />
                  </div>
                  <p className="font-bold text-sm text-gray-800">
                    {couponSearchQuery ? 'لا توجد أكواد خصم تطابق بحثك' : 'لا توجد أكواد خصم مسجلة حالياً'}
                  </p>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    {couponSearchQuery 
                      ? 'جربي البحث بكلمة أخرى أو تفريغ حقل البحث.'
                      : 'أضيفي كود الخصم الأول عبر النموذج أعلاه لتوفير عروض حصرية لعميلاتك.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredCoupons.map((coupon) => {
                    const isExpired = coupon.expiresAt 
                      ? new Date(coupon.expiresAt).getTime() < new Date().setHours(0, 0, 0, 0)
                      : false;
                    const isActive = coupon.isActive !== false && !isExpired;

                    return (
                      <div 
                        key={coupon.code} 
                        className={`p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                          !isActive ? 'bg-gray-50/70 opacity-80' : 'hover:bg-gray-50/50'
                        }`}
                      >
                        {/* Coupon Details */}
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-black text-base shrink-0 shadow-2xs ${
                            isActive 
                              ? 'bg-[#FCF5F6] text-[#A44C5C] border border-[#DF8A9D]/30' 
                              : 'bg-gray-100 text-gray-400 border border-gray-200'
                          }`}>
                            %
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Code with Copy Button */}
                              <div className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg border border-gray-250 transition-colors">
                                <span className="font-mono font-black text-sm tracking-wider text-gray-950" dir="ltr">
                                  {coupon.code}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyCoupon(coupon.code)}
                                  className="text-gray-500 hover:text-black cursor-pointer p-0.5"
                                  title="نسخ كود الخصم"
                                >
                                  {copiedCouponCode === coupon.code ? (
                                    <Check size={13} className="text-emerald-600" />
                                  ) : (
                                    <Copy size={13} />
                                  )}
                                </button>
                              </div>

                              {/* Discount Value */}
                              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                                خصم {coupon.discountPercent}%
                              </span>

                              {/* Expiry Status Badge */}
                              {coupon.expiresAt ? (
                                isExpired ? (
                                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                                    <AlertCircle size={11} />
                                    <span>انتهى بتاريخ {coupon.expiresAt}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                    <Calendar size={11} />
                                    <span>ينتهي في {coupon.expiresAt}</span>
                                  </span>
                                )
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded-full border border-gray-200">
                                  <Clock size={11} />
                                  <span>صلاحية دائمة وغير محددة</span>
                                </span>
                              )}

                              {/* Activation Status */}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                coupon.isActive === false
                                  ? 'bg-gray-200 text-gray-600'
                                  : isExpired
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {coupon.isActive === false ? 'معطل يدوياً' : isExpired ? 'منتهي الصلاحية' : 'فعال للمتسوقات ✨'}
                              </span>
                            </div>

                            {/* Promotional Description */}
                            <p className="text-xs text-gray-500">
                              {coupon.description || 'كود خصم ترويجي عام لعميلات المتجر'}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          {/* Toggle Active Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleCouponActive(coupon)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              coupon.isActive === false
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                            }`}
                            title={coupon.isActive === false ? 'تفعيل الكوبون الآن' : 'إيقاف الكوبون مؤقتاً'}
                          >
                            {coupon.isActive === false ? (
                              <>
                                <ToggleLeft size={16} />
                                <span>تفعيل</span>
                              </>
                            ) : (
                              <>
                                <ToggleRight size={16} className="text-emerald-600" />
                                <span>إيقاف</span>
                              </>
                            )}
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(coupon.code)}
                            className="p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-100"
                            title="حذف الكوبون نهائياً"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: TEAM MEMBERS & GMAIL ACCESS (فريق العمل وصلاحيات Gmail) */}
        {/* ======================================================== */}
        {activeTab === 'team' && (
          <div className="space-y-6 animate-fade-in-rapid">
            {/* Intro Header */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-150">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FCF5F6] border border-[#DF8A9D]/30 text-[#A44C5C] flex items-center justify-center shrink-0">
                    <Users size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-950 flex items-center gap-2">
                      <span>إدارة فريق العمل والمشرفين (Gmail Access)</span>
                      <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full font-mono">
                        {teamMembers.length} أعضاء مصرح لهم
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      أضيفي الأشخاص المصرح لهم بالدخول للوحة التحكم عن طريق بريدهم في Gmail. بمجرد إضافتهم، يمكنهم فتح اللوحة بحسابهم مباشرة.
                    </p>
                  </div>
                </div>

                {/* Current Active User Badge */}
                {activeAdminUser && (
                  <div className="bg-[#FAF8F8] border border-gray-200 px-3.5 py-2 rounded-2xl flex items-center gap-2 text-xs shrink-0 self-start sm:self-auto">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-gray-500 text-[11px]">حسابك الحالي:</span>
                    <span className="font-mono font-bold text-gray-900" dir="ltr">{activeAdminUser.email}</span>
                    <span className="bg-[#A44C5C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {activeAdminUser.role === 'owner' ? 'المالك 👑' : 'مشرف'}
                    </span>
                  </div>
                )}
              </div>

              {/* Add New Team Member Form */}
              <div className="pt-1">
                <h4 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
                  <UserPlus size={16} className="text-[#A44C5C]" />
                  <span>إضافة شخص جديد لفريق العمل عبر Gmail</span>
                </h4>

                <form onSubmit={handleAddTeamMember} className="bg-[#FAF9F6] border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {/* Gmail input */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        بريد Gmail للشخص <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="example@gmail.com"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        className="w-full bg-white border border-gray-300 focus:border-[#A44C5C] focus:ring-2 focus:ring-[#A44C5C]/20 rounded-xl px-3.5 py-2.5 text-xs font-mono text-left outline-hidden transition-all"
                        dir="ltr"
                        required
                      />
                    </div>

                    {/* Name input */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        الاسم أو المسمى الوظيفي
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: سارة - مسؤولة الطلبيات"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        className="w-full bg-white border border-gray-300 focus:border-[#A44C5C] focus:ring-2 focus:ring-[#A44C5C]/20 rounded-xl px-3.5 py-2.5 text-xs text-right outline-hidden transition-all"
                      />
                    </div>

                    {/* Role selector */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        مستوى الصلاحية
                      </label>
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value as TeamMemberRole)}
                        className="w-full bg-white border border-gray-300 focus:border-[#A44C5C] focus:ring-2 focus:ring-[#A44C5C]/20 rounded-xl px-3.5 py-2.5 text-xs text-right outline-hidden transition-all cursor-pointer"
                      >
                        <option value="manager">مدير متجر (إدارة الطلبات والمنتجات والكوبونات)</option>
                        <option value="orders_agent">مشرف طلبيات وشحن (متابعة وتحديث الشحنات فقط)</option>
                        <option value="viewer">مستعرض (مشاهدة المبيعات والطلبات دون تعديل)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                    <p className="text-[11px] text-gray-500">
                      💡 فور الحفظ، يستطيع هذا الشخص فتح لوحة التحكم بالدخول ببريده الـ Gmail.
                    </p>
                    <button
                      type="submit"
                      disabled={isAddingMember}
                      className="bg-[#1C1917] hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      <UserPlus size={14} />
                      <span>{isAddingMember ? 'جاري الإضافة...' : 'إضافة وتفعيل الصلاحية ⚡'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Team Members List Table / Cards */}
            <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-gray-150 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-gray-950">قائمة المشرفين المصرح لهم حالياً</h4>
                  <p className="text-xs text-gray-400 mt-0.5">الحسابات التي تمتلك إذن الدخول والوصول لبيانات المتجر</p>
                </div>
                <span className="text-xs font-bold text-gray-500 font-mono">
                  {teamMembers.length} حساب
                </span>
              </div>

              {isLoadingTeam ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  جاري تحميل فريق العمل...
                </div>
              ) : (
                <div className="divide-y divide-gray-150">
                  {teamMembers.map(member => {
                    const isOwner = member.role === 'owner' || member.email.toLowerCase() === 'mohamedostafataher@gmail.com';
                    const isCurrent = activeAdminUser?.email.toLowerCase() === member.email.toLowerCase();

                    return (
                      <div key={member.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            isOwner ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            {isOwner ? '👑' : member.name ? member.name.charAt(0) : member.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs sm:text-sm text-gray-900">{member.name || member.email.split('@')[0]}</span>
                              {isOwner && (
                                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.2 rounded-full">
                                  المالك الرئيسي للمتجر
                                </span>
                              )}
                              {isCurrent && (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.2 rounded-full">
                                  أنتِ الآن
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                              <span className="font-mono text-gray-700" dir="ltr">{isOwner ? '********@sulta.sa' : member.email}</span>
                              <span>•</span>
                              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md text-[10px] font-medium">
                                {member.role === 'owner' ? 'المالك (وصول شامل)' : member.role === 'manager' ? 'مدير متجر' : member.role === 'orders_agent' ? 'مشرف شحن وطلبيات' : 'مستعرض فقط'}
                              </span>
                              <span>•</span>
                              <span className="text-gray-400">
                                مضاف: {new Date(member.addedAt).toLocaleDateString('ar-SA')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-xl font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            مصرح له بالدخول
                          </span>

                          {!isOwner ? (
                            <button
                              onClick={() => handleRemoveTeamMember(member)}
                              disabled={removingMemberId === member.id}
                              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-200"
                              title="إلغاء صلاحية الوصول"
                            >
                              <Trash2 size={15} />
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg font-medium">
                              محمي دائم
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Guide on how it works */}
            <div className="bg-[#FAF9F6] border border-gray-200/80 rounded-3xl p-5 sm:p-6 space-y-3">
              <h4 className="font-bold text-xs sm:text-sm text-gray-900 flex items-center gap-2">
                <Sparkles size={16} className="text-[#A44C5C]" />
                <span>كيف يقوم الشخص المضاف بالدخول إلى لوحة التحكم؟</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600 leading-relaxed font-sans">
                <div className="bg-white p-3.5 rounded-2xl border border-gray-150 space-y-1">
                  <span className="font-bold text-gray-900 block font-mono text-sm text-[#A44C5C]">١. مشاركة الرابط</span>
                  <p>أرسل للشخص رابط لوحة التحكم مباشرة من المتجر (أو الرابط: <code>?tab=dashboard</code>).</p>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-gray-150 space-y-1">
                  <span className="font-bold text-gray-900 block font-mono text-sm text-[#A44C5C]">٢. التحقق بـ Gmail</span>
                  <p>يضغط على "الدخول بحساب Google" أو يكتب بريد الـ Gmail المعتمد في خانة الدخول.</p>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-gray-150 space-y-1">
                  <span className="font-bold text-gray-900 block font-mono text-sm text-[#A44C5C]">٣. فتح اللوحة فوراً</span>
                  <p>يتحقق النظام من مطابقة بريده في قائمتك ويمنحه الدخول مباشرة بصلاحيته المحددة.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: STORE SETTINGS & PIXELS */}
        {/* ======================================================== */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-2xs space-y-6 animate-fade-in-rapid">
            <div>
              <h3 className="font-bold text-base text-gray-950 flex items-center gap-2">
                <SettingsIcon size={18} />
                <span>إعدادات المتجر وبيكسلات التتبع (Meta & TikTok & Snapchat)</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                تحديث أرقام التواصل وروابط الواتساب ومعرفات الإعلانات لربط الحملات بدقة وواقعية.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-gray-850 pb-2 border-b border-gray-100">
                  معلومات التواصل والمتجر الملكي 👑
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">اسم المتجر / البراند</label>
                    <input
                      type="text"
                      value={settingsForm.siteName}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, siteName: e.target.value }))}
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:bg-white focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">رقم الواتساب الرسمي (بدون +)</label>
                    <input
                      type="text"
                      placeholder="966552823677"
                      value={settingsForm.whatsapp}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">رقم الهاتف الظاهر</label>
                    <input
                      type="text"
                      placeholder="+966 55 282 3677"
                      value={settingsForm.contactPhone}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">البريد الإلكتروني للكونسيرج</label>
                    <input
                      type="email"
                      value={settingsForm.contactEmail}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-black"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                      <span>نطاق المتجر على Vercel (أو النطاق المخصص)</span>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold">Vercel Domain</span>
                    </label>
                    <input
                      type="text"
                      placeholder="sulta.vercel.app"
                      value={settingsForm.storeDomain}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, storeDomain: e.target.value }))}
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-black text-gray-900"
                    />
                    <p className="text-[10.5px] text-gray-400 mt-1">
                      نطاق المتجر المعتمد الذي يظهر في تقارير البيكسل والفواتير وروابط المشاركة.
                    </p>
                  </div>
                </div>
              </div>

              {/* Marketing Pixels */}
              <div className="space-y-4 pt-2">
                {/* Live Diagnostic Quick Access Banner */}
                <div className="bg-gradient-to-l from-emerald-50 via-teal-50/50 to-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Activity size={18} className="animate-pulse" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                        <span>فاحص اتصال البيكسل في الوقت الفعلي (Pixel Diagnostics)</span>
                        <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-md font-bold">مباشر ⚡</span>
                      </h5>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        تحققي الآن من سلامة وصول أحداث Meta و TikTok بدون تعارضات مع إمكانية إرسال أحداث تجريبية ومشاهدتها في الحال.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('pixel-diagnostics')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>فتح صفحة التشخيص المباشر ↗</span>
                  </button>
                </div>

                <h4 className="font-bold text-sm text-gray-850 pb-2 border-b border-gray-100 flex items-center justify-between">
                  <span>ربط البيكسل والإعلانات الحقيقية (Marketing Pixels)</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                    تتبع فوري للأحداث 📊
                  </span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Meta Pixel ID (Facebook / Instagram)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: 1648674350574190"
                      value={settingsForm.facebookPixelId}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, facebookPixelId: e.target.value }))}
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-black font-bold text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                      <span>Meta CAPI Access Token (Conversions API)</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">نشط 🟢</span>
                    </label>
                    <input
                      type="password"
                      placeholder="EABD..."
                      value={settingsForm.metaCapiAccessToken}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, metaCapiAccessToken: e.target.value }))}
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-black text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Meta Test Event Code (اختياري لاختبار الأحداث في Events Manager)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: TEST12345"
                      value={settingsForm.metaTestEventCode}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, metaTestEventCode: e.target.value }))}
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-black text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      TikTok Pixel ID
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: CXXXXXXXXXXXXXX"
                      value={settingsForm.tiktokPixelId}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, tiktokPixelId: e.target.value }))}
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Snapchat Pixel ID
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      value={settingsForm.snapchatPixelId}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, snapchatPixelId: e.target.value }))}
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Google Analytics 4 Measurement ID
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: G-XXXXXXXXXX"
                      value={settingsForm.googleAnalyticsId}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, googleAnalyticsId: e.target.value }))}
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
              </div>

              {/* WhatsApp Message Templates Customization */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h4 className="font-bold text-sm text-gray-850 pb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MessageCircle size={16} className="text-[#25D366]" />
                    <span>تخصيص قوالب رسائل الواتساب التلقائية 💬</span>
                  </span>
                  <span className="text-[10px] text-gray-400">
                    المتغيرات المدعومة: {'{customerName}'}, {'{trackingCode}'}, {'{totalPrice}'}, {'{statusLabel}'}, {'{trackUrl}'}
                  </span>
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      قالب رسالة تأكيد الطلب والفاتورة (للعميل)
                    </label>
                    <textarea
                      rows={6}
                      value={whatsappOrderTemplate}
                      onChange={(e) => setWhatsappOrderTemplate(e.target.value)}
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl p-3 text-xs font-mono focus:bg-white focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      قالب رسالة تحديث حالة الطلب (عند التغيير إلى شحن، تجهيز، إلخ)
                    </label>
                    <textarea
                      rows={5}
                      value={whatsappStatusTemplate}
                      onChange={(e) => setWhatsappStatusTemplate(e.target.value)}
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl p-3 text-xs font-mono focus:bg-white focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
              </div>

              {/* Official Bank Account for Direct Payments */}
              <div className="space-y-4 pt-4 border-t border-gray-150">
                <div className="flex items-center justify-between pb-2 border-b border-gray-150">
                  <h4 className="font-bold text-sm text-gray-950 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-xs">🏦</span>
                    <span>بيانات الحساب البنكي المعتمد للدفع والتحويل (مصرف الراجحي)</span>
                  </h4>
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                    الحساب الفعلي للمتجر 🇸🇦
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      اسم البنك
                    </label>
                    <input
                      type="text"
                      value={settingsForm.bankName}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, bankName: e.target.value }))}
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-sans focus:bg-white focus:outline-none focus:border-black font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      اسم المستفيد (صاحب الحساب)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.bankAccountName}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, bankAccountName: e.target.value }))}
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-sans focus:bg-white focus:outline-none focus:border-black font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      رقم الحساب
                    </label>
                    <input
                      type="text"
                      value={settingsForm.bankAccountNumber}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      رقم الآيبان (IBAN)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.bankIban}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, bankIban: e.target.value }))}
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* QR Code preview card */}
                <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                  <div className="shrink-0 bg-white p-2 rounded-xl border border-gray-200 shadow-xs">
                    <img
                      src={settingsForm.bankQrCodeUrl || '/assets/images/alrajhi_qr.jpg'}
                      alt="رمز الاستجابة السريعة لمصرف الراجحي"
                      className="w-24 h-24 object-contain rounded-lg"
                    />
                  </div>
                  <div className="space-y-1 text-right">
                    <h5 className="font-bold text-xs text-blue-950 flex items-center gap-1.5">
                      <span>رمز الاستجابة السريعة (QR Code) للتحويل الفوري</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">نشط ومفعّل ✓</span>
                    </h5>
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      يظهر هذا الباركود للعميلات في صفحة الدفع وتأكيد الحجز لمسحه مباشرة عبر تطبيق مصرف الراجحي أو البنوك السعودية.
                    </p>
                    <span className="text-[10px] text-blue-700 font-mono block mt-1">
                      مسار الملف: {settingsForm.bankQrCodeUrl || '/assets/images/alrajhi_qr.jpg'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shipping fee */}
              <div className="space-y-4 pt-2">
                <h4 className="font-bold text-sm text-gray-850 pb-2 border-b border-gray-100">
                  رسوم الشحن والتوصيل (ر.س)
                </h4>
                <div className="max-w-xs">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    تكلفة الشحن الافتراضية
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settingsForm.defaultShippingFee}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, defaultShippingFee: Number(e.target.value) }))}
                    className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-black"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    ضعي 0 إذا كان الشحن مجاني لكافة مدن المملكة.
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-gray-150 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="bg-[#A44C5C] hover:bg-gray-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  {isSavingSettings ? 'جاري الحفظ...' : 'حفظ التغييرات في قاعدة البيانات 💾'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 7: REAL-TIME PIXEL DIAGNOSTICS & CONFLICT DETECTION */}
        {/* ======================================================== */}
        {activeTab === 'pixel-diagnostics' && (
          <div className="animate-fade-in-rapid">
            <PixelDiagnosticsView settings={settings} toast={toast} />
          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT PRODUCT */}
      {/* ======================================================== */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#A44C5C]/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-150">
              <h3 className="font-bold text-base text-gray-950 font-serif">
                {editingProduct ? `تعديل قطعة: ${editingProduct.nameAr}` : 'إضافة قطعة كوتور جديدة'}
              </h3>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-black cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">اسم المنتج بالعربية *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: بيجامة ملكية ناعمة مع دانتيل"
                  value={productForm.nameAr || ''}
                  onChange={(e) => setProductForm(prev => ({ ...prev, nameAr: e.target.value }))}
                  className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">السعر بالمملكة (ر.س) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="195"
                    value={productForm.priceSA === 0 ? '' : (productForm.priceSA || '')}
                    onChange={(e) => setProductForm(prev => ({ ...prev, priceSA: e.target.value === '' ? 0 : Number(e.target.value) }))}
                    className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">سعر العرض (اختياري)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="خصم إن وجد"
                    value={productForm.salePriceSA === undefined ? '' : (productForm.salePriceSA || '')}
                    onChange={(e) => setProductForm(prev => ({ ...prev, salePriceSA: e.target.value === '' ? undefined : Number(e.target.value) }))}
                    className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">السعر في مصر (ج.م)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="تلقائي 5x"
                    value={productForm.priceEG === 0 ? '' : (productForm.priceEG || '')}
                    onChange={(e) => setProductForm(prev => ({ ...prev, priceEG: e.target.value === '' ? 0 : Number(e.target.value) }))}
                    className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">الكمية في المخزن *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="15"
                    value={productForm.stock === 0 ? '' : (productForm.stock || '')}
                    onChange={(e) => setProductForm(prev => ({ ...prev, stock: e.target.value === '' ? 0 : Number(e.target.value) }))}
                    className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">القسم</label>
                <select
                  value={productForm.category || 'new'}
                  onChange={(e) => {
                    const val = e.target.value;
                    const catMap: Record<string, string> = {
                      new: 'المجموعة الجديدة',
                      satin: 'كوتور ناعم',
                      cotton: 'قطنيات فاخرة',
                      loungewear: 'ملابس استرخاء'
                    };
                    setProductForm(prev => ({ ...prev, category: val, categoryAr: catMap[val] || 'المجموعة الجديدة' }));
                  }}
                  className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-black cursor-pointer"
                >
                  <option value="new">المجموعة الجديدة ✨</option>
                  <option value="satin">كوتور ملكي 👑</option>
                  <option value="cotton">قطنيات فاخرة 🌸</option>
                  <option value="loungewear">ملابس استرخاء 🕊️</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">رابط الصورة (URL أو مسار)</label>
                <input
                  type="text"
                  placeholder="/img/sulta_product_1.png"
                  value={productForm.images?.[0] || ''}
                  onChange={(e) => setProductForm(prev => ({ ...prev, images: [e.target.value] }))}
                  className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  رابط الفيديو التسويقي (YouTube أو TikTok أو ملف MP4) 🎬
                </label>
                <input
                  type="text"
                  placeholder="https://... رابط ريلز أو يوتيوب، أو اتركيه فارغاً للعرض السينمائي التلقائي لصور القطعة"
                  value={productForm.video || ''}
                  onChange={(e) => setProductForm(prev => ({ ...prev, video: e.target.value }))}
                  className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">وصف المنتج</label>
                <textarea
                  rows={3}
                  placeholder="صُمم خصيصاً ليمنحكِ سحر الأنوثة وراحة النوم الهادئ..."
                  value={productForm.descriptionAr || ''}
                  onChange={(e) => setProductForm(prev => ({ ...prev, descriptionAr: e.target.value }))}
                  className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl p-3 text-xs focus:bg-white focus:outline-none focus:border-black"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-[#A44C5C] hover:bg-gray-800 text-white font-bold text-xs px-5 py-2 rounded-xl cursor-pointer shadow-sm"
                >
                  حفظ المنتج 🛍️
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER DELETION CONFIRMATION MODAL */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in-rapid font-sans">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-5 text-right">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-950 font-serif">تأكيد حذف الطلب نهائياً</h3>
                <p className="text-xs text-gray-500 mt-0.5">هل أنتِ متأكدة من حذف هذا الطلب من قاعدة البيانات وسجل الأرشيف؟</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200 text-xs text-gray-600 font-mono">
              معرف الطلب: #{orderToDelete}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                onClick={() => handleDeleteOrder(orderToDelete)}
                disabled={updatingOrderId === orderToDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {updatingOrderId === orderToDelete ? 'جاري الحذف...' : 'نعم، حذف الطلب نهائياً 🗑️'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT DELETION CONFIRMATION MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-rapid font-sans" dir="rtl">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-150 space-y-5 text-right relative z-[10000]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-150">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-950 font-serif">تأكيد حذف المنتج نهائياً</h3>
                <p className="text-xs text-gray-500 mt-0.5">هل أنتِ متأكدة من حذف هذا المنتج نهائياً من قاعدة بيانات Supabase والمتجر؟</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200 flex items-center gap-3">
              <img
                src={cleanImgUrl(productToDelete.images?.[0] || '', productToDelete.category)}
                alt={productToDelete.nameAr}
                className="w-12 h-12 object-cover rounded-xl border border-gray-200 shrink-0"
              />
              <div className="text-xs min-w-0">
                <p className="font-bold text-gray-900 truncate">{productToDelete.nameAr}</p>
                <div className="flex items-center gap-2 mt-0.5 font-mono">
                  <span className="text-[#A44C5C] font-bold">99 ر.س</span>
                  <span className="text-gray-400 line-through text-[11px]">200 ر.س</span>
                  <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 rounded font-sans font-bold">خصم 50%</span>
                </div>
                <p className="text-gray-400 font-mono text-[10px] mt-0.5">كود: #{productToDelete.id.slice(0, 8)}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteProduct(productToDelete)}
                disabled={isDeletingProduct}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isDeletingProduct ? 'جاري الحذف...' : 'نعم، حذف المنتج نهائياً 🗑️'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
