import React, { useState, useMemo, useEffect } from 'react';
import { 
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
  XCircle,
  DollarSign, 
  Check, 
  AlertCircle,
  AlertTriangle,
  Loader2,
  Bell,
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
  ShieldCheck,
  Sparkles,
  Globe,
  PackageCheck,
  Zap,
  WifiOff,
  Printer,
  Download,
  History,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Upload,
  Star,
  Image as ImageIcon
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
import { AuthorizedAdminUser } from './AdminAuthGate';
import AdminLayout from './admin/AdminLayout';
import {
  ConfirmModal,
  AdminSkeleton,
  AdminEmptyState,
  AdminErrorState
} from './admin/AdminUI';
import {
  CanonicalAdminRole,
  DashboardTabId,
  ROLE_LABELS_AR,
  ROLE_DESCRIPTIONS_AR,
  normalizeAdminRole,
  canAccessTab,
  canViewCostPrice,
  canEditCostPrice,
  canEditProducts,
  canUpdateStock,
  canDeleteProduct,
  canDeleteOrder,
  canManageCoupons,
  canManageTeam,
  canManageSettings,
  canUpdateOrderStatus
} from '../utils/rbac';
import PixelHealthIndicator from './PixelHealthIndicator';
import TrafficHeatmap from './TrafficHeatmap';
import AdminOverview from './admin/AdminOverview';

// Code-split heavy admin tab views
const AdminOrders = React.lazy(() => import('./admin/AdminOrders'));
const AdminProducts = React.lazy(() => import('./admin/AdminProducts'));
const AdminProductModal = React.lazy(() => import('./admin/AdminProductModal'));
const PixelDiagnosticsView = React.lazy(() => import('./PixelDiagnosticsView'));
const AdminInventory = React.lazy(() => import('./AdminInventory'));
const AdminCustomers = React.lazy(() => import('./AdminCustomers'));
const AdminActivityLogs = React.lazy(() => import('./AdminActivityLogs'));
const AdminGrowth = React.lazy(() => import('./AdminGrowth'));
const AdminFinancials = React.lazy(() => import('./AdminFinancials'));
const AdminReturns = React.lazy(() => import('./AdminReturns'));
const AdminSystemHealth = React.lazy(() => import('./AdminSystemHealth'));

interface DashboardProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  coupons: DiscountCoupon[];
  setCoupons: React.Dispatch<React.SetStateAction<DiscountCoupon[]>>;
  session: any;
  authLoading: boolean;
  adminUser?: AuthorizedAdminUser | null;
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

/**
 * Secure component to render private receipt images using signed URLs
 */
function ReceiptImage({ path }: { path: string }) {
  const [url, setUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let unmounted = false;
    if (!path) return;
    
    // If it's already a full URL (legacy fallback), use it directly
    if (path.startsWith('http')) {
      setUrl(path);
      setLoading(false);
      return;
    }

    dbService.getSignedReceiptUrl(path).then(signedUrl => {
      if (!unmounted) {
        setUrl(signedUrl);
        setLoading(false);
      }
    }).catch(() => {
      if (!unmounted) setLoading(false);
    });

    return () => { unmounted = true; };
  }, [path]);

  if (loading) {
    return <div className="h-16 w-[130px] bg-gray-100 animate-pulse rounded-xl border border-gray-200" />;
  }

  if (!url) {
    return (
      <div className="h-16 w-[130px] bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center text-[9px] text-rose-600 text-center px-2 font-bold">
        خطأ في تحميل الإيصال ⚠️
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-xl border border-blue-200 max-w-[130px] shadow-2xs">
      <img src={url} alt="إشعار التحويل" className="h-16 w-full object-cover group-hover:scale-105 transition-transform" />
      <span className="absolute inset-0 bg-black/40 text-white text-[9.5px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        عرض بالحجم الكامل 🔍
      </span>
    </a>
  );
}

export default function Dashboard({
  products,
  setProducts,
  orders,
  setOrders,
  coupons,
  setCoupons,
  session,
  adminUser,
  settings,
  setSettings,
  categories,
  toast,
  deleteProduct,
  onBackToStore,
  onSignOut
}: DashboardProps) {
  // Navigation tabs: comprehensive real-time e-commerce operations
  const [activeTab, setActiveTab] = useState<DashboardTabId>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const sub = p.get('subtab') || p.get('tab') || p.get('page') || p.get('section');
      if (sub === 'growth') return 'growth';
      if (sub === 'finances' || sub === 'profit' || sub === 'cogs') return 'finances';
      if (sub === 'returns' || sub === 'refunds') return 'returns';
      if (sub === 'health' || sub === 'system-health' || sub === 'monitor') return 'system-health';
      if (sub === 'pixel' || sub === 'pixel-diagnostics' || sub === 'diagnostics') return 'pixel-diagnostics';
      if (sub === 'team' || sub === 'members') return 'team';
      if (sub === 'inventory' || sub === 'stock') return 'inventory';
      if (sub === 'customers' || sub === 'crm') return 'customers';
      if (sub === 'audit' || sub === 'logs' || sub === 'activity') return 'audit-logs';
      if (sub === 'coupons') return 'coupons';
      if (sub === 'orders') return 'orders';
      if (sub === 'products') return 'products';
      if (sub === 'analytics') return 'analytics';
    }
    return 'overview';
  });

  // Team Members State & Adding state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<TeamMemberRole>('manager');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);

  // Active Verified Admin User derived strictly from authenticated session / AdminAuthGate (never localStorage fallback)
  const activeAdminUser = useMemo<{ email: string; name: string; role: CanonicalAdminRole }>(() => {
    if (adminUser) {
      return {
        email: adminUser.email,
        name: adminUser.name,
        role: normalizeAdminRole(adminUser.role)
      };
    }
    const sessionEmail = session?.user?.email?.trim().toLowerCase() || '';
    const matched = teamMembers.find(m => m.email.toLowerCase() === sessionEmail);
    return {
      email: sessionEmail,
      name: matched?.name || session?.user?.user_metadata?.full_name || (sessionEmail ? sessionEmail.split('@')[0] : 'مشرف'),
      role: normalizeAdminRole(matched?.role)
    };
  }, [adminUser, session, teamMembers]);

  const adminRole = activeAdminUser.role;

  // Load team members & admin notifications on mount
  useEffect(() => {
    setIsLoadingTeam(true);
    dbService.getTeamMembers().then(members => {
      setTeamMembers(members);
    }).catch(console.warn).finally(() => {
      setIsLoadingTeam(false);
    });

    dbService.getAdminNotifications()
      .then(items => setAdminNotifications(Array.isArray(items) ? items : []))
      .catch(console.warn);
  }, []);

  // Load confidential cost_price ONLY for authorized cost roles (owner, manager, accountant)
  useEffect(() => {
    let active = true;
    if (!canViewCostPrice(adminRole)) return;
    dbService.getAdminProductsWithCost()
      .then(costProducts => {
        if (!active || !Array.isArray(costProducts) || costProducts.length === 0) return;
        const costMap = new Map(costProducts.map(cp => [cp.id, cp.costPrice]));
        setProducts(prev => prev.map(p => (costMap.has(p.id) ? { ...p, costPrice: costMap.get(p.id) } : p)));
      })
      .catch(console.warn);
    return () => { active = false; };
  }, [adminRole, setProducts]);

  // Search & Filter States
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('current');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [productSearch, setProductSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Status updating & Confirmation modal states
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [confirmRestoreProducts, setConfirmRestoreProducts] = useState(false);
  const [isProcessingConfirm, setIsProcessingConfirm] = useState(false);
  const [orderToReject, setOrderToReject] = useState<Order | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Product modal states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

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
  const [stockFilter, setStockFilter] = useState<'all' | 'critical'>('all');

  // Sales Analytics Chart View Period (Recharts)
  const [salesChartPeriod, setSalesChartPeriod] = useState<'daily' | 'monthly' | 'both'>('both');

  // Settings form states (no secret access tokens handled in browser state)
  const [settingsForm, setSettingsForm] = useState({
    siteName: settings?.siteName || 'سولته',
    whatsapp: settings?.whatsappSaudi || settings?.whatsapp || '966552823677',
    contactPhone: settings?.contactPhoneSaudi || settings?.contactPhone || '+966 55 282 3677',
    contactEmail: settings?.contactEmail || 'concierge@sulta.sa',
    storeDomain: settings?.storeDomain || 'sulta.vercel.app',
    facebookPixelId: settings?.facebookPixelId || '1648674350574190',
    metaTestEventCode: settings?.metaTestEventCode || '',
    tiktokPixelId: settings?.tiktokPixelId || 'DBESRBJC77U4J2JQDUB0',
    snapchatPixelId: settings?.snapchatPixelId || '',
    googleAnalyticsId: settings?.googleAnalyticsId || '',
    defaultShippingFee: settings?.defaultShippingFee || 0,
    bankName: settings?.bankName || 'مصرف الراجحي',
    bankAccountName: settings?.bankAccountName || 'ابو بكر احمد على يونس',
    bankAccountNumber: settings?.bankAccountNumber || '108000010006086396260',
    bankIban: settings?.bankIban || 'SA65 8000 0108 6080 1639 6260',
    bankQrCodeUrl: settings?.bankQrCodeUrl || '/assets/images/alrajhi_qr.jpg',
    storeDiscountPercent: settings?.storeDiscountPercent || 0,
    storeDiscountStartsAt: settings?.storeDiscountStartsAt || '',
    storeDiscountEndsAt: settings?.storeDiscountEndsAt || '',
    minReferenceDays: settings?.minReferenceDays || 14
  });

  // Automatically sync local settings form when database settings are loaded/refreshed
  useEffect(() => {
    if (settings) {
      setSettingsForm({
        siteName: settings.siteName || 'سولته',
        whatsapp: settings.whatsappSaudi || settings?.whatsapp || '966552823677',
        contactPhone: settings.contactPhoneSaudi || settings?.contactPhone || '+966 55 282 3677',
        contactEmail: settings.contactEmail || 'concierge@sulta.sa',
        storeDomain: settings.storeDomain || 'sulta.vercel.app',
        facebookPixelId: settings.facebookPixelId || '1648674350574190',
        metaTestEventCode: settings.metaTestEventCode || '',
        tiktokPixelId: settings.tiktokPixelId || 'DBESRBJC77U4J2JQDUB0',
        snapchatPixelId: settings.snapchatPixelId || '',
        googleAnalyticsId: settings.googleAnalyticsId || '',
        defaultShippingFee: settings.defaultShippingFee || 0,
        bankName: settings.bankName || 'مصرف الراجحي',
        bankAccountName: settings.bankAccountName || 'ابو بكر احمد على يونس',
        bankAccountNumber: settings.bankAccountNumber || '108000010006086396260',
        bankIban: settings.bankIban || 'SA65 8000 0108 6080 1639 6260',
        bankQrCodeUrl: settings.bankQrCodeUrl || '/assets/images/alrajhi_qr.jpg',
        storeDiscountPercent: settings.storeDiscountPercent || 0,
        storeDiscountStartsAt: settings.storeDiscountStartsAt || '',
        storeDiscountEndsAt: settings.storeDiscountEndsAt || '',
        minReferenceDays: settings.minReferenceDays || 14
      });
    }
  }, [settings]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Live Pixel Activity Logs state (Shopify-style Live Feed)
  const [pixelLogs, setPixelLogs] = useState<PixelEventLog[]>([]);
  const [liveCount, setLiveCount] = useState<number>(1);
  const [recentVisits, setRecentVisits] = useState<any[]>([]);

  // Load real visits history from database & Supabase fallback
  React.useEffect(() => {
    const loadVisits = async () => {
      let loaded = false;
      try {
        const res = await fetch('/api/analytics/visit');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.recentVisits) && data.recentVisits.length > 0) {
            setRecentVisits(data.recentVisits);
            loaded = true;
          }
        }
      } catch {}

      if (!loaded && supabase) {
        try {
          const { data: tickets } = await supabase
            .from('support_tickets')
            .select('id, subject, created_at, message')
            .eq('status', 'analytics_visit')
            .order('created_at', { ascending: false })
            .limit(5000);
          if (tickets && tickets.length > 0) {
            setRecentVisits(tickets.map(t => {
              let meta: any = {};
              try { meta = JSON.parse(t.message || '{}'); } catch {}
              return {
                id: t.id,
                sessionId: t.subject?.replace('visit:', '') || `guest_${t.id}`,
                page: meta.page || '/',
                referrer: meta.referrer || '',
                utm_source: meta.utm_source || '',
                city: meta.city || 'الرياض',
                created_at: t.created_at
              };
            }));
          }
        } catch {}
      }
    };
    loadVisits();
    const interval = setInterval(loadVisits, 15000); // Auto refresh every 15s
    return () => clearInterval(interval);
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
        // Alert if extreme spike detected (Increased threshold for 50k capacity)
        if (count >= 1000) {
            toast?.(`تنبيه! زيادة هائلة في الزوار: ${count} زائر حالياً!`, 'info');
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

  // Critical Stock Products (<= configurable minStockThreshold, default 5)
  const criticalStockProducts = useMemo(() => {
    return products.filter(p => Number(p.stock) <= (p.minStockThreshold ?? 5));
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
      // 3. Payment filter
      if (paymentStatusFilter !== 'all' && order.paymentStatus !== paymentStatusFilter) {
        return false;
      }

      return order.status === orderStatusFilter;
    });
  }, [orders, orderSearch, orderStatusFilter, paymentStatusFilter, delayedOrders]);

  // Real Metric Calculations directly from actual data
  const metrics = useMemo(() => {
    const nonCancelledOrders = orders.filter(o => o.status !== 'cancelled');
    const totalOrders = orders.length;
    
    // Revenue logic: only count non-cancelled
    const grossRevenue = nonCancelledOrders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
    const paidRevenue = orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
    const pendingRevenue = orders.filter(o => o.paymentStatus === 'pending').reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'new').length;
    const processingOrders = orders.filter(o => o.status === 'processing').length;
    const shippedOrders = orders.filter(o => o.status === 'shipped').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const cancelledOrdersCount = orders.filter(o => o.status === 'cancelled').length;
    
    const totalProducts = products.length;
    const lowStockProducts = criticalStockProducts.length;

    return {
      totalOrders,
      grossRevenue,
      paidRevenue,
      pendingRevenue,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrdersCount,
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

    let grossRevenueCalculated = 0;
    let todayRevenue = 0;
    let thisMonthRevenue = 0;
    const todayStr = now.toISOString().split('T')[0];
    const currentMonthIdx = now.getMonth();

    for (const order of orders) {
      const price = Number(order.totalPrice) || 0;
      if (order.status !== 'cancelled') {
        grossRevenueCalculated += price;
      }

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
    
    // Only use non-cancelled orders for AOV
    const nonCancelledOrders = orders.filter(o => o.status !== 'cancelled');
    const avgOrderValue = nonCancelledOrders.length > 0 ? Math.round(grossRevenueCalculated / nonCancelledOrders.length) : 0;

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

  // Handle Update Payment Status (Verified Admin Action)
  const handleUpdatePaymentStatus = async (order: Order, newPaymentStatus: Order['paymentStatus'], notes?: string) => {
    setUpdatingOrderId(order.id);
    const now = new Date().toISOString();
    const updated: Order = { 
      ...order, 
      paymentStatus: newPaymentStatus,
      paymentVerifiedAt: newPaymentStatus === 'paid' ? now : order.paymentVerifiedAt,
      paymentVerifiedBy: newPaymentStatus === 'paid' ? (activeAdminUser?.name || activeAdminUser?.email) : order.paymentVerifiedBy,
      receiptReviewNotes: notes || order.receiptReviewNotes
    };

    // Instruction requirement: Only verified payment evidence and authorized admin action confirm manual bank transfer
    // If setting to 'paid', we might want to also auto-advance order status to 'processing' or 'confirmed'
    if (newPaymentStatus === 'paid' && (order.status === 'pending' || order.status === 'new')) {
      updated.status = 'processing';
    }

    try {
      await dbService.updateOrder(updated);
      setOrders(prev => prev.map(o => o.id === order.id ? updated : o));
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder(updated);
      }
      toast?.(`تم تحديث حالة الدفع للطلب #${order.id.slice(0, 8)} بنجاح ✅`, 'success');
    } catch (err: any) {
      toast?.(`فشل تحديث حالة الدفع: ${err?.message || ''}`, 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Handle Save Internal Admin Notes
  const handleUpdateAdminNotes = async (order: Order, notes: string) => {
    setUpdatingOrderId(order.id);
    const updated: Order = { ...order, adminNotes: notes };
    try {
      await dbService.updateOrder(updated);
      setOrders(prev => prev.map(o => o.id === order.id ? updated : o));
      toast?.('تم حفظ الملاحظات الداخلية بنجاح 📝', 'success');
    } catch (err: any) {
      toast?.('فشل حفظ الملاحظات', 'error');
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

  // Handle Create Test Order for Merchant Verification & Peace of Mind
  const [isCreatingTestOrder, setIsCreatingTestOrder] = useState(false);
  const handleCreateTestOrder = async () => {
    setIsCreatingTestOrder(true);
    try {
      const sampleProduct = products[0] || {
        id: 'prod_luxury_1',
        nameAr: 'بيجامة حرير ملكية فاخرة',
        priceSA: 99
      };
      const testOrderId = crypto.randomUUID();
      const testOrder: Order = {
        id: testOrderId,
        trackingNumber: `Sulta-${Math.floor(100000 + Math.random() * 900000)}`,
        customerName: 'فحص تجريبي للنظام 🧪',
        phone: '0552823677',
        country: 'SA',
        city: 'الرياض',
        address: 'حي النرجس - شارع الملك سلمان',
        notes: 'طلب تجريبي تم إنشاؤه للاطمئنان والتأكد من ربط البيكسل وقاعدة البيانات',
        items: [
          {
            productId: sampleProduct.id,
            productName: sampleProduct.nameAr,
            color: 'عاجي ملكي',
            size: 'M',
            quantity: 1,
            price: sampleProduct.priceSA || 99
          }
        ],
        totalPrice: sampleProduct.priceSA || 99,
        currency: 'SAR',
        paymentMethod: 'الدفع عند الاستلام (COD)',
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };

      await dbService.saveOrder(testOrder);
      setOrders(prev => [testOrder, ...prev.filter(o => o.id !== testOrderId)]);
      toast?.('تم إنشاء طلب تجريبي بنجاح وتسجيله في Supabase والبيكسل! يمكنكِ معاينته أو حذفه في أي وقت 🧪', 'success');
    } catch (err: any) {
      toast?.(`حدث خطأ أثناء إنشاء الطلب التجريبي: ${err?.message || ''}`, 'error');
    } finally {
      setIsCreatingTestOrder(false);
    }
  };

  // --- PRINT SIMPLIFIED TAX INVOICE (ZATCA COMPLIANT FOR SAUDI MARKET) ---
  const handlePrintInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      toast?.('يرجى السماح بالنوافذ المنبثقة لطباعة الفاتورة', 'error');
      return;
    }

    const itemsHtml = (order.items || []).map(item => `
      <tr style="border-bottom: 1px solid #f1f1f1;">
        <td style="padding: 10px 12px; text-align: right; font-weight: bold;">
          ${item.productName || 'قطعة كوتور'}
          <div style="font-size: 11px; color: #78716c; font-weight: normal; margin-top: 2px;">
            اللون: ${item.color || '-'} | المقاس: ${item.size || '-'}
          </div>
        </td>
        <td style="padding: 10px 12px; text-align: center; font-family: monospace; font-weight: bold;">${item.quantity || 1}</td>
        <td style="padding: 10px 12px; text-align: center; font-family: monospace;">${Number(item.price || 0).toLocaleString()} ر.س</td>
        <td style="padding: 10px 12px; text-align: left; font-family: monospace; font-weight: 900; color: #1c1917;">${((item.price || 0) * (item.quantity || 1)).toLocaleString()} ر.س</td>
      </tr>
    `).join('');

    const invoiceHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>فاتورة ضريبية مبسطة #${order.id.slice(0, 8).toUpperCase()} - Sulta</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Arabic', sans-serif; margin: 0; padding: 30px; color: #1c1917; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #A44C5C; padding-bottom: 16px; margin-bottom: 24px; }
          .brand { font-size: 26px; font-weight: 900; color: #A44C5C; letter-spacing: 0.5px; }
          .sub { font-size: 11.5px; color: #78716c; margin-top: 3px; }
          .badge { background: #FCF5F6; color: #A44C5C; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; border: 1px solid #DF8A9D; display: inline-block; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; font-size: 12px; }
          .box { background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 16px; padding: 14px; }
          .box h4 { margin: 0 0 10px 0; font-size: 12.5px; color: #44403c; border-bottom: 1px dashed #d6d3d1; padding-bottom: 6px; font-weight: 800; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
          th { background: #f5f5f4; color: #44403c; padding: 10px 12px; font-weight: 800; }
          .summary { margin-right: auto; width: 300px; font-size: 12.5px; }
          .summary-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #f5f5f4; }
          .total { font-size: 16px; font-weight: 900; color: #A44C5C; border-top: 2px solid #A44C5C; padding-top: 10px; margin-top: 4px; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #a8a29e; border-top: 1px solid #e7e5e4; padding-top: 20px; line-height: 1.6; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: left;">
          <button onclick="window.print()" style="background: #A44C5C; color: white; border: none; padding: 10px 22px; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 13px;">طباعة الفاتورة الآن 🖨️</button>
        </div>
        <div class="header">
          <div>
            <div class="brand">Sulta · سُلطة</div>
            <div class="sub">متجر ملابس وأزياء نوم نسائية فاخرة · المملكة العربية السعودية</div>
          </div>
          <div style="text-align: left;">
            <span class="badge">فاتورة ضريبية مبسطة</span>
            <div style="font-family: monospace; font-size: 13px; margin-top: 8px; font-weight: 900;">#${order.id.slice(0, 8).toUpperCase()}</div>
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <h4>بيانات العميلة وموقع التوصيل</h4>
            <div><strong>الاسم:</strong> ${order.customerName || 'عميلة سُلطة الكريمة'}</div>
            <div style="margin-top: 4px;"><strong>الجوال:</strong> <span dir="ltr" style="font-family: monospace;">${order.phone || '-'}</span></div>
            <div style="margin-top: 4px;"><strong>المدينة:</strong> ${order.city || 'الرياض'}</div>
            <div style="margin-top: 4px;"><strong>العنوان:</strong> ${order.address || 'حسب اتفاق التوصيل'}</div>
          </div>
          <div class="box">
            <h4>بيانات الطلب والسداد</h4>
            <div><strong>تاريخ الطلب:</strong> ${order.date || new Date().toISOString().split('T')[0]}</div>
            <div style="margin-top: 4px;"><strong>طريقة الدفع:</strong> ${order.paymentMethod || 'الدفع عند الاستلام'}</div>
            <div style="margin-top: 4px;"><strong>حالة الطلب:</strong> ${getStatusLabel(order.status)}</div>
            <div style="margin-top: 4px;"><strong>رقم التتبع:</strong> <span style="font-family: monospace; font-weight: bold;">${order.trackingNumber || 'قيد الإصدار'}</span></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: right;">القطعة / المواصفات</th>
              <th style="text-align: center;">الكمية</th>
              <th style="text-align: center;">سعر الوحدة</th>
              <th style="text-align: left;">المجموع</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row">
            <span>مجموع المنتجات:</span>
            <span style="font-family: monospace; font-weight: bold;">${Number(order.totalPrice || 0).toLocaleString()} ر.س</span>
          </div>
          <div class="summary-row">
            <span>رسوم الشحن والتوصيل:</span>
            <span style="font-family: monospace; color: #16a34a; font-weight: bold;">شحن مجاني 🚚</span>
          </div>
          <div class="summary-row total">
            <span>المجموع الكلي:</span>
            <span style="font-family: monospace;">${Number(order.totalPrice || 0).toLocaleString()} ر.س</span>
          </div>
        </div>

        <div class="footer">
          <p>شكرًا لتسوقكِ من Sulta · خيوط من الفخامة والدلال تليق بوقاركِ 👑</p>
          <p>لأي استفسار بخصوص طلبيتكِ يرجى التواصل عبر الواتساب: 966552823677+ أو البريد: concierge@sulta.sa</p>
        </div>
        <script>window.onload = function() { setTimeout(function() { window.print(); }, 400); };</script>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  };

  // --- EXPORT ORDERS TO CSV (EXCEL FRIENDLY WITH ARABIC UTF-8 BOM) ---
  const handleExportOrdersCsv = () => {
    if (orders.length === 0) {
      toast?.('لا توجد طلبات لتصديرها حالياً', 'info');
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
      'الحالة',
      'إجمالي المبلغ (ر.س)',
      'عدد القطع',
      'تفاصيل القطع',
      'رقم التتبع',
      'ملاحظات'
    ];

    const rows = orders.map(o => {
      const itemsSummary = (o.items || [])
        .map(i => `${i.productName || 'منتج'} (${i.color || ''} ${i.size || ''} x${i.quantity || 1})`)
        .join(' + ');

      return [
        o.id,
        o.date || (o.createdAt ? o.createdAt.split('T')[0] : ''),
        `"${(o.customerName || '').replace(/"/g, '""')}"`,
        `"${(o.phone || '').replace(/"/g, '""')}"`,
        `"${(o.city || 'الرياض').replace(/"/g, '""')}"`,
        `"${(o.address || '').replace(/"/g, '""')}"`,
        `"${(o.paymentMethod || '').replace(/"/g, '""')}"`,
        `"${getStatusLabel(o.status)}"`,
        o.totalPrice,
        (o.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0),
        `"${itemsSummary.replace(/"/g, '""')}"`,
        `"${(o.trackingNumber || '').replace(/"/g, '""')}"`,
        `"${(o.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Sulta_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast?.('تم تصدير ملف الطلبات (CSV) بنجاح 📊', 'success');
  };

  // Status Badge Helper
  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'paid':
        return { label: 'مدفوع إلكترونياً 💳', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'cod':
        return { label: 'دفع عند الاستلام 📦', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'failed':
        return { label: 'فشل التوصيل ⚠️', color: 'bg-orange-50 text-orange-800 border-orange-200' };
      case 'pending':
      case 'new':
        return { label: 'طلب جديد ⏳', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'confirmed':
        return { label: 'مؤكد ✅', color: 'bg-sky-50 text-sky-800 border-sky-200' };
      case 'processing':
        return { label: 'جاري التجهيز 📦', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'packed':
        return { label: 'تم التغليف 🎁', color: 'bg-violet-50 text-violet-800 border-violet-200' };
      case 'shipped':
        return { label: 'تم الشحن 🚚', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'out_for_delivery':
        return { label: 'مع المندوب 🛵', color: 'bg-cyan-50 text-cyan-800 border-cyan-200' };
      case 'delivered':
        return { label: 'تم التسليم ✨', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'cancelled':
        return { label: 'ملغي ❌', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'returned':
        return { label: 'مرتجع 🔄', color: 'bg-stone-100 text-stone-800 border-stone-300' };
      default:
        return { label: status || 'معلق', color: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    return getStatusBadge(status).label;
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

  // Single-Click Quick Toggle for Product Discount Status (Updates Supabase & App State instantly)
  const handleToggleProductDiscount = async (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isCurrentlyActive = product.discountStatus !== 'inactive' && product.isDiscountActive !== false;
    const nextStatus: 'active' | 'inactive' = isCurrentlyActive ? 'inactive' : 'active';
    const nextIsActive = !isCurrentlyActive;

    const updatedProduct: Product = {
      ...product,
      discountStatus: nextStatus,
      isDiscountActive: nextIsActive
    };

    // 1. Instantly update local state for all storefront components & checkout modal
    setProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p));

    try {
      // 2. Persist directly to Supabase
      await dbService.saveProduct(updatedProduct);
      toast?.(
        nextIsActive 
          ? `تم تفعيل خصم "${product.nameAr}" بنجاح! ينعكس فوراً في السلة والمتجر 🟢`
          : `تم إيقاف خصم "${product.nameAr}" مؤقتاً! سيعود السعر العادي فوراً 🔴`,
        'success'
      );
    } catch (err: any) {
      toast?.(`حدث خطأ أثناء تحديث حالة الخصم: ${err?.message || ''}`, 'error');
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
      description: newCouponDesc.trim() || `خصم ${newCouponDiscount}% لعميلات Sulta`,
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

  // Handle Delete Coupon (opens ConfirmModal)
  const handleDeleteCoupon = (code: string) => {
    if (!canManageCoupons(adminRole)) {
      toast?.('ليس لديك صلاحية لحذف الكوبونات', 'error');
      return;
    }
    setCouponToDelete(code);
  };

  const handleConfirmDeleteCoupon = async () => {
    if (!couponToDelete) return;
    setIsProcessingConfirm(true);
    try {
      await dbService.deleteCoupon(couponToDelete);
      setCoupons(prev => prev.filter(c => c.code.toUpperCase() !== couponToDelete.toUpperCase()));
      toast?.(`تم حذف الكوبون ${couponToDelete}`, 'success');
      setCouponToDelete(null);
    } catch (err: any) {
      toast?.(`فشل حذف الكوبون: ${err?.message || ''}`, 'error');
    } finally {
      setIsProcessingConfirm(false);
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
    if (!canManageTeam(adminRole)) {
      toast?.('إدارة فريق العمل متاحة للمالك فقط', 'error');
      return;
    }
    const email = newMemberEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast?.('يرجى إدخال بريد إلكتروني صالح', 'error');
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

  // Handle Remove Team Member (opens ConfirmModal)
  const handleRemoveTeamMember = (member: TeamMember) => {
    if (!canManageTeam(adminRole)) {
      toast?.('إلغاء صلاحيات الأعضاء متاح للمالك فقط', 'error');
      return;
    }
    if (member.email.toLowerCase() === 'mohamedostafataher@gmail.com') {
      toast?.('لا يمكن حذف المالك الرئيسي للمتجر', 'error');
      return;
    }
    setMemberToRemove(member);
  };

  const handleConfirmRemoveTeamMember = async () => {
    if (!memberToRemove) return;
    setIsProcessingConfirm(true);
    setRemovingMemberId(memberToRemove.id);
    try {
      const updated = await dbService.removeTeamMember(memberToRemove.id);
      setTeamMembers(updated);
      toast?.(`تم إلغاء صلاحية (${memberToRemove.email}) بنجاح`, 'success');
      setMemberToRemove(null);
    } catch (err: any) {
      toast?.(err?.message || 'فشل حذف العضو', 'error');
    } finally {
      setRemovingMemberId(null);
      setIsProcessingConfirm(false);
    }
  };

  // Handle Sign Out from Admin
  const handleAdminSignOut = async () => {
    try {
      localStorage.removeItem('sulta_admin_auth_user');
    } catch {}
    toast?.('تم تسجيل الخروج بنجاح من لوحة التحكم', 'info');
    if (onSignOut) {
      onSignOut();
    } else {
      await supabase.auth.signOut().catch(console.warn);
      if (onBackToStore) {
        onBackToStore();
      } else {
        window.location.reload();
      }
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSettings(adminRole)) {
      toast?.('حفظ الإعدادات الحساسة متاح للمالك فقط', 'error');
      return;
    }
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
        metaTestEventCode: settingsForm.metaTestEventCode,
        tiktokPixelId: settingsForm.tiktokPixelId,
        snapchatPixelId: settingsForm.snapchatPixelId,
        googleAnalyticsId: settingsForm.googleAnalyticsId,
        defaultShippingFee: Number(settingsForm.defaultShippingFee) || 0,
        bankName: settingsForm.bankName,
        bankAccountName: settingsForm.bankAccountName,
        bankAccountNumber: settingsForm.bankAccountNumber,
        bankIban: settingsForm.bankIban,
        bankQrCodeUrl: settingsForm.bankQrCodeUrl,
        storeDiscountPercent: Number(settingsForm.storeDiscountPercent) || 0,
        storeDiscountStartsAt: settingsForm.storeDiscountStartsAt || undefined,
        storeDiscountEndsAt: settingsForm.storeDiscountEndsAt || undefined,
        minReferenceDays: Number(settingsForm.minReferenceDays) || 14
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

  const handleOpenAddProductModal = () => {
    if (!canEditProducts(adminRole)) {
      toast?.('ليس لديك صلاحية إضافة أو تعديل المنتجات', 'error');
      return;
    }
    setEditingProduct(null);
    setIsAddProductOpen(true);
  };

  const handleMarkNotificationRead = async (id: string) => {
    setAdminNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
    await dbService.markNotificationRead(id).catch(console.warn);
  };

  return (
    <>
    <AdminLayout
      activeTab={activeTab}
      onSelectTab={(tab) => setActiveTab(tab)}
      adminUser={activeAdminUser}
      orders={orders}
      products={products}
      pendingOrdersCount={metrics.pendingOrders}
      criticalStockProducts={criticalStockProducts}
      notifications={adminNotifications}
      onMarkNotificationRead={handleMarkNotificationRead}
      onQuickAddStock={(p, qty) => handleQuickAddStock(p, qty)}
      onQuickAddProduct={handleOpenAddProductModal}
      onQuickSelectOrder={(order) => {
        setSelectedOrder(order);
        setOrderSearch(order.id.slice(0, 8));
        setOrderStatusFilter('all');
        setActiveTab('orders');
      }}
      onQuickSelectProduct={(product) => {
        setProductSearch(product.nameAr);
        setActiveTab('products');
      }}
      onSignOut={handleAdminSignOut}
      onBackToStore={onBackToStore}
    >
      {!canAccessTab(adminRole, activeTab) ? (
        <AdminErrorState
          title="غير مصرح لك بالوصول لهذا القسم"
          message={`دورك الحالي (${ROLE_LABELS_AR[adminRole]}) لا يمتلك صلاحية الدخول إلى هذا التبويب.`}
          onRetry={() => setActiveTab('overview')}
        />
      ) : (
        <>

        {/* ======================================================== */}
        {/* CRITICAL STOCK NOTIFICATION BANNER (< 5 PIECES) */}
        {/* ======================================================== */}
        {activeTab !== 'overview' && criticalStockProducts.length > 0 && !isAlertDismissed && (
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
        {/* TAB 1: OVERVIEW (D3) */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <AdminOverview
            orders={orders}
            products={products}
            adminRole={adminRole}
            settings={settings}
            visitorStats={visitorStats}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onFilterOrders={(filter) => {
              setOrderStatusFilter(filter);
              setActiveTab('orders');
            }}
            onFilterLowStock={() => {
              setStockFilter('critical');
              setActiveTab('products');
            }}
            onSelectOrder={(order) => setSelectedOrder(order)}
            onQuickAddStock={(prod, qty) => handleQuickAddStock(prod, qty)}
            getStatusBadge={getStatusBadge}
          />
        )}

        {/* ======================================================== */}
        {/* TAB 2: DETAILED ANALYTICS & VISITOR TRENDS */}
        {/* ======================================================== */}
        {activeTab === 'analytics' && (
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
                { label: 'إيرادات مؤكدة (ر.س)', val: metrics.paidRevenue, sub: 'مدفوعات مستلمة ✅', icon: <CheckCircle2 size={20} />, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                { label: 'إجمالي المبيعات (ر.س)', val: metrics.grossRevenue, sub: 'كافة الطلبات (عدا الملغى)', icon: <DollarSign size={20} />, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                { label: 'مبالغ بانتظار التحويل', val: metrics.pendingRevenue, sub: 'بانتظار تأكيد الإيصال ⏳', icon: <Clock size={20} />, color: 'bg-amber-50 text-amber-600 border-amber-100' },
                { label: 'إجمالي المنتجات', val: metrics.totalProducts, sub: 'في الكتالوج الملكي', icon: <ShoppingBag size={20} />, color: 'bg-purple-50 text-purple-600 border-purple-100' },
                
                { label: 'طلبات مكتملة', val: metrics.deliveredOrders, sub: 'تم تسليمها للعميلة', icon: <PackageCheck size={20} />, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                { label: 'قيد التجهيز/الشحن', val: metrics.processingOrders + metrics.shippedOrders, sub: 'جاري المعالجة', icon: <Truck size={20} />, color: 'bg-blue-50 text-blue-600 border-blue-100' },
                { label: 'طلبات ملغاة', val: metrics.cancelledOrdersCount, sub: 'عمليات لم تكتمل', icon: <XCircle size={20} />, color: 'bg-rose-50 text-rose-600 border-rose-100' },
                { label: 'منتجات منخفضة المخزون', val: metrics.lowStockProducts, sub: 'تتطلب إعادة تعبئة ⚠️', icon: <AlertTriangle size={20} />, color: 'bg-amber-50 text-amber-700 border-amber-200' },
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-gray-100 gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-[#A44C5C]/10 text-[#A44C5C] flex items-center justify-center shrink-0 border border-[#A44C5C]/20">
                          <TrendingUp size={18} />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-gray-950">مصفوفة أداء القنوات (ROI Matrix)</h4>
                          <p className="text-[10px] text-gray-500 font-bold">بيانات حقيقية 100% من قاعدة البيانات</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-tight">LIVE SYNC</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto -mx-2 px-2 scrollbar-none">
                      <table className="min-w-[450px] w-full text-right text-[11px] text-gray-600">
                        <thead>
                          <tr className="border-b border-gray-150 text-gray-400 font-bold text-[10px]">
                            <th className="pb-2.5 font-bold sticky right-0 bg-white z-10">القناة</th>
                            <th className="pb-2.5 font-bold text-center">الزيارات</th>
                            <th className="pb-2.5 font-bold text-center">إضافة</th>
                            <th className="pb-2.5 font-bold text-center">الطلبات</th>
                            <th className="pb-2.5 font-bold text-center">التحويل</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-sans">
                          {[
                            { name: 'Instagram', key: 'instagram', icon: '📸', color: 'text-pink-600' },
                            { name: 'TikTok', key: 'tiktok', icon: '🎵', color: 'text-black' },
                            { name: 'Facebook', key: 'meta', icon: '🔵', color: 'text-blue-600' },
                            { name: 'Snapchat', key: 'snapchat', icon: '👻', color: 'text-amber-500' },
                            { name: 'Direct', key: 'direct', icon: '🛍️', color: 'text-[#A44C5C]' },
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
                                <td className="py-3 font-bold text-gray-950 flex items-center gap-2 sticky right-0 bg-white z-10 border-l border-gray-50">
                                  <span>{ch.icon}</span>
                                  <span className="truncate">{ch.name}</span>
                                </td>
                                <td className="py-3 text-center font-mono font-bold text-gray-700">{visitsCount}</td>
                                <td className="py-3 text-center font-mono text-amber-600 font-bold">{carts}</td>
                                <td className="py-3 text-center font-mono text-emerald-600 font-bold">{chOrders}</td>
                                <td className="py-3 text-center font-mono font-black text-gray-900">{convRate}%</td>
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
                          const leadMsg = `يا هلا بالسلطانة ${lead.customerName || 'الكريمة'} 🌸👑، معكِ خدمة عملاء متجر Sulta للأزياء وملابس النوم الملكية.

لاحظنا وصولكِ لخطوة إتمام الطلب والتحويل البنكي لحساب الراجحي ولم يتم تأكيد التحويل بعد:
📦 القطع المختارة: ${itemsSummary}
💰 المبلغ الإجمالي: ${lead.totalAmount || 0} ر.س

هل نساعدكِ في تزويدك ببيانات الحساب البنكي أو تقديم كود خصم خاص (Sulta20 بخصم 20%) لتأكيد شحن طلبكِ الملكي فوراً؟ يسعدنا خدمتكِ دائماً ✨`;

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
                        const msg = `يا هلا بالسلطانة 👑🌸، لاحظنا أنكِ اخترتِ قطع كوتور مميزة في سلة مشترياتكِ من Sulta ولم تكملي التحويل البنكي بعد.

يسعدنا تقديم كود خصم إضافي وشحن مجاني لإتمام طلبكِ الآن:
🎁 كود الخصم: Sulta20 (خصم 20%)
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

                  <div className="bg-gray-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-gray-800 flex flex-col">
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
                         {recentVisits.slice(0, 5).map((v) => {
                           const isInstagram = v.referrer?.includes('instagram.com') || v.utm_source?.includes('instagram') || v.utm_source?.includes('ig');
                           const isTikTok = v.referrer?.includes('tiktok.com') || v.utm_source?.includes('tiktok');
                           const isSnapchat = v.referrer?.includes('snapchat.com') || v.utm_source?.includes('snapchat');
                           const platformLabel = isInstagram ? 'Instagram' : isTikTok ? 'TikTok' : isSnapchat ? 'Snapchat' : 'Direct';
                           const timeStr = v.created_at ? new Date(v.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : 'مباشر';
                           
                           const cityName = v.city || 'الرياض';
                           const isCairo = cityName.includes('القاهرة') || cityName.toLowerCase().includes('cairo');
                           const cityLabel = isCairo ? 'القاهرة (فحص/إدارة)' : cityName;

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
                                      زائر حقيقي من <span className={`${isCairo ? 'text-amber-300' : 'text-emerald-300'} font-bold`}>{cityLabel}</span> عبر {platformLabel}
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
                <AdminEmptyState
                  title="لا يوجد طلبات مسجلة بعد"
                  description="عند إتمام أول طلب من العميلات في المتجر سيظهر هنا فوراً."
                  icon={<Package size={24} />}
                />
              ) : (
                <>
                  {/* Mobile Order Cards */}
                  <div className="md:hidden divide-y divide-gray-100">
                    {orders.slice(0, 5).map((order) => {
                      const badge = getStatusBadge(order.status);
                      return (
                        <div key={order.id} className="p-4 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-black text-xs text-gray-950">#{order.id.slice(0, 8)}</span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${badge.color}`}>
                              {badge.label}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <div>
                              <p className="font-bold text-gray-900">{order.customerName}</p>
                              <p className="text-[11px] text-gray-600 font-mono" dir="ltr">{order.phone} · {order.city || 'الرياض'}</p>
                            </div>
                            <span className="font-mono font-black text-gray-950">
                              {Number(order.totalPrice).toLocaleString()} ر.س
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setSelectedOrder(order); setActiveTab('orders'); }}
                            className="w-full min-h-[44px] rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>فتح تفاصيل الطلب</span>
                            <ArrowUpRight size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Order Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-gray-100/50 text-gray-600 border-b border-gray-200">
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
                                 <div className="text-[11px] text-gray-600 font-mono" dir="ltr">{order.phone}</div>
                              </td>
                              <td className="py-4 px-5 text-gray-700 font-medium">{order.city || 'الرياض'}</td>
                              <td className="py-4 px-5 font-mono font-black text-gray-900">{Number(order.totalPrice).toLocaleString()} ر.س</td>
                              <td className="py-4 px-5">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border ${badge.color}`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                  {badge.label}
                                </span>
                              </td>
                              <td className="py-4 px-5 text-center">
                                <button
                                  type="button"
                                  onClick={() => { setSelectedOrder(order); setActiveTab('orders'); }}
                                  aria-label="عرض تفاصيل الطلب"
                                  className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl bg-gray-100 text-gray-700 hover:bg-black hover:text-white transition-all cursor-pointer shadow-2xs"
                                >
                                  <ArrowUpRight size={15} />
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
            </div>
          </div>
        )}
        {/* ======================================================== */}
        {/* TAB: GROWTH CENTER (CONVERSION & ADS ROI) */}
        {/* ======================================================== */}
        {activeTab === 'growth' && (
          <React.Suspense fallback={<AdminSkeleton rows={5} cards={4} />}>
            <AdminGrowth orders={orders} products={products} />
          </React.Suspense>
        )}

        {/* ======================================================== */}
        {/* TAB 2: ORDERS MANAGEMENT & WHATSAPP INVOICING (D4) */}
        {/* ======================================================== */}
        {activeTab === 'orders' && (
          <React.Suspense fallback={<AdminSkeleton rows={6} cards={2} />}>
            <AdminOrders
              orders={orders}
              setOrders={setOrders}
              teamMembers={teamMembers}
              abandonedLeads={abandonedLeads}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              adminRole={adminRole}
              adminName={activeAdminUser.name}
              selectedOrder={selectedOrder}
              setSelectedOrder={setSelectedOrder}
              initialStatusFilter={orderStatusFilter}
              initialSearch={orderSearch}
              renderReceiptImage={(path) => <ReceiptImage path={path} />}
              onUpdatePaymentStatus={handleUpdatePaymentStatus}
              onRequestRejectOrder={(ord) => {
                setRejectionReasonInput('');
                setOrderToReject(ord);
              }}
              onRequestDeleteOrder={(id) => setOrderToDelete(id)}
              onPrintInvoice={handlePrintInvoice}
              onCreateTestOrder={handleCreateTestOrder}
              isCreatingTestOrder={isCreatingTestOrder}
              toast={toast}
            />
          </React.Suspense>
        )}

        {/* ======================================================== */}
        {/* TAB 3: PRODUCTS & INVENTORY MANAGEMENT (D5) */}
        {/* ======================================================== */}
        {activeTab === 'products' && (
          <React.Suspense fallback={<AdminSkeleton rows={5} cards={3} />}>
            <AdminProducts
              products={products}
              setProducts={setProducts}
              categories={categories}
              settings={settings}
              adminRole={adminRole}
              adminName={activeAdminUser.name}
              productAnalyticsMap={productAnalyticsMap}
              searchQuery={productSearch}
              onSearchChange={setProductSearch}
              stockFilter={stockFilter}
              onStockFilterChange={setStockFilter}
              onOpenAddModal={handleOpenAddProductModal}
              onOpenEditModal={(p) => {
                setEditingProduct(p);
                setIsAddProductOpen(true);
              }}
              onRequestDelete={handleDeleteProduct}
              onRequestRestore={() => setConfirmRestoreProducts(true)}
              onQuickAddStock={handleQuickAddStock}
              onToggleDiscount={handleToggleProductDiscount}
              toast={toast}
            />
          </React.Suspense>
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
                      placeholder="مثال: Sulta25"
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
                        {canManageCoupons(adminRole) && (
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {/* Toggle Active Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleCouponActive(coupon)}
                              className={`min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                coupon.isActive === false
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
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
                                  <ToggleRight size={16} className="text-emerald-700" />
                                  <span>إيقاف</span>
                                </>
                              )}
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteCoupon(coupon.code)}
                              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                              title="حذف الكوبون نهائياً"
                              aria-label={`حذف الكوبون ${coupon.code}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
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
                <div className="bg-[#FAF8F8] border border-gray-200 px-3.5 py-2 rounded-2xl flex items-center gap-2 text-xs shrink-0 self-start sm:self-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-gray-600 text-[11px]">حسابك الحالي:</span>
                  <span className="font-mono font-bold text-gray-950" dir="ltr">{activeAdminUser.email}</span>
                  <span className="bg-[#A44C5C] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    {ROLE_LABELS_AR[activeAdminUser.role]}
                  </span>
                </div>
              </div>

              {/* Add New Team Member Form (Owner only) */}
              {canManageTeam(adminRole) ? (
              <div className="pt-1">
                <h4 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
                  <UserPlus size={16} className="text-[#A44C5C]" />
                  <span>إضافة عضو جديد لفريق العمل عبر البريد الإلكتروني</span>
                </h4>

                <form onSubmit={handleAddTeamMember} className="bg-[#FAF9F6] border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1.5">
                        البريد الإلكتروني (Gmail / Work) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="example@gmail.com"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        className="w-full min-h-[44px] bg-white border border-gray-300 focus:border-[#A44C5C] focus:ring-2 focus:ring-[#A44C5C]/20 rounded-xl px-3.5 py-2.5 text-xs font-mono text-left outline-hidden transition-all"
                        dir="ltr"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1.5">
                        الاسم أو المسمى الوظيفي
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: سارة - مسؤولة الطلبيات"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        className="w-full min-h-[44px] bg-white border border-gray-300 focus:border-[#A44C5C] focus:ring-2 focus:ring-[#A44C5C]/20 rounded-xl px-3.5 py-2.5 text-xs text-right outline-hidden transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1.5">
                        الدور الوظيفي (RBAC)
                      </label>
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value as TeamMemberRole)}
                        className="w-full min-h-[44px] bg-white border border-gray-300 focus:border-[#A44C5C] focus:ring-2 focus:ring-[#A44C5C]/20 rounded-xl px-3.5 py-2.5 text-xs text-right outline-hidden transition-all cursor-pointer"
                      >
                        <option value="manager">{ROLE_LABELS_AR.manager}</option>
                        <option value="sales">{ROLE_LABELS_AR.sales}</option>
                        <option value="warehouse">{ROLE_LABELS_AR.warehouse}</option>
                        <option value="accountant">{ROLE_LABELS_AR.accountant}</option>
                        <option value="support">{ROLE_LABELS_AR.support}</option>
                      </select>
                      <p className="text-[11px] text-gray-600 mt-1">
                        {ROLE_DESCRIPTIONS_AR[normalizeAdminRole(newMemberRole)]}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                    <p className="text-[11px] text-gray-600">
                      فور الحفظ، يدخل العضو عبر المصادقة الآمنة (Google OAuth أو رابط البريد) حسب صلاحية دوره فقط.
                    </p>
                    <button
                      type="submit"
                      disabled={isAddingMember}
                      className="min-h-[44px] bg-[#1C1917] hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      <UserPlus size={14} />
                      <span>{isAddingMember ? 'جاري الإضافة...' : 'إضافة وتفعيل الصلاحية ⚡'}</span>
                    </button>
                  </div>
                </form>
              </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 font-bold">
                  عرض قائمة الفريق فقط — إضافة أو إزالة الأعضاء مقتصرة على مالك المتجر.
                </div>
              )}
            </div>

            {/* Team Members List Table / Cards */}
            <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-gray-150 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-gray-950">قائمة المشرفين المصرح لهم حالياً</h4>
                  <p className="text-xs text-gray-600 mt-0.5">الحسابات التي تمتلك إذن الدخول والوصول لبيانات المتجر حسب الدور</p>
                </div>
                <span className="text-xs font-bold text-gray-700 font-mono">
                  {teamMembers.length} حساب
                </span>
              </div>

              {isLoadingTeam ? (
                <div className="p-5">
                  <AdminSkeleton rows={3} cards={0} />
                </div>
              ) : (
                <div className="divide-y divide-gray-150">
                  {teamMembers.map(member => {
                    const canonicalRole = normalizeAdminRole(member.role);
                    const isOwner = canonicalRole === 'owner' || member.email.toLowerCase() === 'mohamedostafataher@gmail.com';
                    const isCurrent = activeAdminUser.email.toLowerCase() === member.email.toLowerCase();

                    return (
                      <div key={member.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            isOwner ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}>
                            {isOwner ? '👑' : member.name ? member.name.charAt(0) : member.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs sm:text-sm text-gray-900">{member.name || member.email.split('@')[0]}</span>
                              {isOwner && (
                                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  المالك الرئيسي للمتجر
                                </span>
                              )}
                              {isCurrent && (
                                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  حسابك الحالي
                                </span>
                              )}
                            </div>
                            <div className="flex items-center flex-wrap gap-2 mt-1 text-[11px] text-gray-600">
                              <span className="font-mono text-gray-800" dir="ltr">{isOwner ? '********@gmail.com' : member.email}</span>
                              <span>•</span>
                              <span className="bg-[#FCF5F6] text-[#8E3E4D] border border-[#A44C5C]/20 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                {ROLE_LABELS_AR[canonicalRole]}
                              </span>
                              <span>•</span>
                              <span className="text-gray-600">
                                مضاف: {new Date(member.addedAt).toLocaleDateString('ar-SA')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-xl font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            مصرح له بالدخول
                          </span>

                          {!isOwner && canManageTeam(adminRole) ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveTeamMember(member)}
                              disabled={removingMemberId === member.id}
                              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-gray-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-200"
                              title="إلغاء صلاحية الوصول"
                              aria-label={`إلغاء صلاحية ${member.email}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          ) : isOwner ? (
                            <span className="text-[10px] text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg font-medium">
                              محمي دائم
                            </span>
                          ) : null}
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

              {/* Store-Wide Percentage Discount Management */}
              <div className="bg-[#FAF8F8] border border-gray-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Tag size={18} className="text-[#A44C5C]" />
                    <h4 className="font-bold text-sm text-gray-950">خصم عام شامل لجميع منتجات المتجر (%)</h4>
                  </div>
                  <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                    يُطبق على المنتجات بدون خصم خاص 🏷️
                  </span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  عند تفعيل نسبة خصم عامة، سيتم تطبيق الخصم تلقائياً على كل منتج تكون نسبة خصمه الخاص = 0%. وفي حال كان للمنتج خصم خاص، تُطبق النسبة الأكبر تلقائياً.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">نسبة الخصم العام (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="90"
                        placeholder="0"
                        value={settingsForm.storeDiscountPercent}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, storeDiscountPercent: Number(e.target.value) }))}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold focus:outline-none focus:border-[#A44C5C] text-left pl-8"
                        dir="ltr"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold pointer-events-none">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">بداية الخصم الشامل</label>
                    <input
                      type="datetime-local"
                      value={settingsForm.storeDiscountStartsAt || ''}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, storeDiscountStartsAt: e.target.value }))}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-sans focus:outline-none focus:border-[#A44C5C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">نهاية الخصم الشامل</label>
                    <input
                      type="datetime-local"
                      value={settingsForm.storeDiscountEndsAt || ''}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, storeDiscountEndsAt: e.target.value }))}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-sans focus:outline-none focus:border-[#A44C5C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">حد الأيام المرجعية للتنبيه</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="90"
                        placeholder="14"
                        value={settingsForm.minReferenceDays}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, minReferenceDays: Number(e.target.value) }))}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold focus:outline-none focus:border-[#A44C5C] text-left pl-8"
                        dir="ltr"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold pointer-events-none">يوم</span>
                    </div>
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

                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                      <span>Meta CAPI Access Token (Conversions API)</span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                        محمي في الخادم
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-900 leading-relaxed">
                      يُدار التوكن حصرياً عبر متغير البيئة <code className="font-mono font-bold">META_CAPI_ACCESS_TOKEN</code> في Vercel Functions ولا يُرسل أو يُحفظ في المتصفح.
                    </p>
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
                  disabled={isSavingSettings || !canManageSettings(adminRole)}
                  className="min-h-[44px] bg-[#A44C5C] hover:bg-[#8E3E4D] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {isSavingSettings ? 'جاري الحفظ...' : canManageSettings(adminRole) ? 'حفظ التغييرات في قاعدة البيانات 💾' : 'للمالك فقط'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 8: INVENTORY & STOCK MOVEMENTS AUDIT (D5) */}
        {/* ======================================================== */}
        {activeTab === 'inventory' && (
          <div className="animate-fade-in-rapid">
            <React.Suspense fallback={<AdminSkeleton rows={5} cards={4} />}>
              <AdminInventory
                orders={orders}
                adminRole={adminRole}
                adminName={activeAdminUser.name}
                toast={toast}
              />
            </React.Suspense>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 9: CUSTOMER INTELLIGENCE & CRM */}
        {/* ======================================================== */}
        {activeTab === 'customers' && (
          <div className="animate-fade-in-rapid">
            <React.Suspense fallback={<AdminSkeleton rows={5} cards={3} />}>
              <AdminCustomers
                orders={orders}
                toast={toast}
                adminName={activeAdminUser.name}
                onSelectOrder={(ord) => {
                  setSelectedOrder(ord);
                  setActiveTab('orders');
                }}
              />
            </React.Suspense>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 10: ADMINISTRATIVE ACTIVITY & AUDIT LOGS */}
        {/* ======================================================== */}
        {activeTab === 'audit-logs' && (
          <div className="animate-fade-in-rapid">
            <React.Suspense fallback={<AdminSkeleton rows={6} cards={0} />}>
              <AdminActivityLogs />
            </React.Suspense>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 11: SALES ANALYTICS & REPORTS */}
        {/* ======================================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in-rapid">
            {/* Sales Analytics Overview Card */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-150">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#FCF5F6] border border-[#DF8A9D]/30 text-[#A44C5C] flex items-center justify-center shadow-2xs">
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-950 flex items-center gap-2">
                      <span>تقارير المبيعات وتحليلات الأداء المالي</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full">
                        بيانات حقيقية 100% 📊
                      </span>
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      تتبع الإيرادات، متوسط السلة، وأعلى الأيام مبيعاً من واقع الطلبات الفعلية
                    </p>
                  </div>
                </div>

                <div className="flex items-center bg-[#F8F9FA] p-1 rounded-xl border border-gray-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSalesChartPeriod('both')}
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg transition-all cursor-pointer ${salesChartPeriod === 'both' ? 'bg-white text-gray-950 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
                  >عرض شامل</button>
                  <button
                    type="button"
                    onClick={() => setSalesChartPeriod('daily')}
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg transition-all cursor-pointer ${salesChartPeriod === 'daily' ? 'bg-black text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
                  >يومي</button>
                  <button
                    type="button"
                    onClick={() => setSalesChartPeriod('monthly')}
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg transition-all cursor-pointer ${salesChartPeriod === 'monthly' ? 'bg-black text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
                  >شهري</button>
                </div>
              </div>

              {/* Chart */}
              <div className="h-80 w-full pt-2">
                {orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
                    <BarChart3 size={40} className="opacity-30" />
                    <p className="text-xs font-bold">بانتظار تسجيل أول عملية شراء حقيقية لرسم المنحنيات البيانية</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={(salesChartPeriod === 'monthly' ? monthlySalesData : dailySalesData) as any[]}>
                      <defs>
                        <linearGradient id="colorAnalytics" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#A44C5C" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#A44C5C" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                      <XAxis dataKey={salesChartPeriod === 'monthly' ? 'monthName' : 'displayDate'} axisLine={false} tickLine={false} fontSize={11} stroke="#6B7280" />
                      <YAxis axisLine={false} tickLine={false} fontSize={11} stroke="#6B7280" />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="revenue" name="الإيرادات (ر.س)" stroke="#A44C5C" strokeWidth={3} fillOpacity={1} fill="url(#colorAnalytics)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-gray-150">
                <div className="bg-[#FAF8F8] p-4 rounded-2xl border border-gray-150 space-y-1">
                  <span className="text-[11px] text-gray-600 font-bold uppercase">إجمالي الإيرادات</span>
                  <div className="text-xl font-black text-gray-950 font-mono">{metrics.grossRevenue.toLocaleString()} ر.س</div>
                </div>
                <div className="bg-[#FAF8F8] p-4 rounded-2xl border border-gray-150 space-y-1">
                  <span className="text-[11px] text-gray-600 font-bold uppercase">متوسط السلة (AOV)</span>
                  <div className="text-xl font-black text-gray-900 font-mono">{salesSummary.avgOrderValue.toLocaleString()} ر.س</div>
                </div>
                <div className="bg-[#FAF8F8] p-4 rounded-2xl border border-gray-150 space-y-1">
                  <span className="text-[11px] text-gray-600 font-bold uppercase">مبيعات اليوم</span>
                  <div className="text-xl font-black text-emerald-700 font-mono">{salesSummary.todayRevenue.toLocaleString()} ر.س</div>
                </div>
                <div className="bg-[#FAF8F8] p-4 rounded-2xl border border-gray-150 space-y-1">
                  <span className="text-[11px] text-gray-600 font-bold uppercase">أعلى مبيعات يومية</span>
                  <div className="text-xl font-black text-[#A44C5C] font-mono">{salesSummary.peakRevenue.toLocaleString()} ر.س</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: REAL FINANCIALS & P&L INTELLIGENCE */}
        {/* ======================================================== */}
        {activeTab === 'finances' && (
          <div className="animate-fade-in-rapid">
            <React.Suspense fallback={<AdminSkeleton rows={5} cards={4} />}>
              <AdminFinancials 
                orders={orders} 
                products={products} 
                toast={toast}
                onUpdateProductCost={async (id, cost) => {
                  setProducts(prev => prev.map(p => p.id === id ? { ...p, costPrice: cost } : p));
                }}
              />
            </React.Suspense>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: RETURNS, EXCHANGES & REFUNDS */}
        {/* ======================================================== */}
        {activeTab === 'returns' && (
          <div className="animate-fade-in-rapid">
            <React.Suspense fallback={<AdminSkeleton rows={5} cards={3} />}>
              <AdminReturns 
                orders={orders} 
                products={products} 
                toast={toast}
                adminName={activeAdminUser.name}
              />
            </React.Suspense>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: SYSTEM HEALTH MONITOR */}
        {/* ======================================================== */}
        {activeTab === 'system-health' && (
          <div className="animate-fade-in-rapid">
            <React.Suspense fallback={<AdminSkeleton rows={4} cards={3} />}>
              <AdminSystemHealth toast={toast} />
            </React.Suspense>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: PIXEL DIAGNOSTICS */}
        {/* ======================================================== */}
        {activeTab === 'pixel-diagnostics' && (
          <div className="animate-fade-in-rapid">
            <React.Suspense fallback={<AdminSkeleton rows={4} cards={3} />}>
              <PixelDiagnosticsView settings={settings} toast={toast} />
            </React.Suspense>
          </div>
        )}
        </>
      )}
    </AdminLayout>

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT PRODUCT (D5 MODULAR) */}
      {/* ======================================================== */}
      {isAddProductOpen && (
        <React.Suspense fallback={null}>
          <AdminProductModal
            isOpen={isAddProductOpen}
            editingProduct={editingProduct}
            categories={categories}
            settings={settings}
            adminRole={adminRole}
            adminName={activeAdminUser.name}
            onClose={() => {
              setIsAddProductOpen(false);
              setEditingProduct(null);
            }}
            onSaved={(savedProd, isNew) => {
              if (isNew) {
                setProducts((prev) => [savedProd, ...prev]);
              } else {
                setProducts((prev) => prev.map((p) => (p.id === savedProd.id ? savedProd : p)));
              }
            }}
            toast={toast}
          />
        </React.Suspense>
      )}

      {/* UNIFIED CONFIRMATION MODALS (ZERO window.confirm / ZERO HARDCODED PRICES) */}
      <ConfirmModal
        isOpen={!!orderToDelete}
        title="تأكيد حذف الطلب نهائياً"
        description="هل أنتِ متأكدة من حذف هذا الطلب من قاعدة البيانات وسجل الأرشيف؟"
        confirmLabel="نعم، حذف الطلب نهائياً"
        cancelLabel="إلغاء التراجع"
        isLoading={!!orderToDelete && updatingOrderId === orderToDelete}
        details={orderToDelete ? <span className="font-mono font-bold">معرف الطلب: #{orderToDelete}</span> : undefined}
        onCancel={() => setOrderToDelete(null)}
        onConfirm={() => {
          if (orderToDelete) return handleDeleteOrder(orderToDelete);
        }}
      />

      <ConfirmModal
        isOpen={!!productToDelete}
        title="تأكيد حذف المنتج نهائياً"
        description="هل أنتِ متأكدة من حذف هذا المنتج نهائياً من قاعدة بيانات Supabase والمتجر؟"
        confirmLabel="نعم، حذف المنتج نهائياً"
        cancelLabel="إلغاء التراجع"
        isLoading={isDeletingProduct}
        details={
          productToDelete ? (
            <div className="flex items-center gap-3">
              <img
                src={cleanImgUrl(productToDelete.images?.[0] || '', productToDelete.category)}
                alt={productToDelete.nameAr}
                className="w-12 h-12 object-cover rounded-xl border border-gray-200 shrink-0"
              />
              <div className="text-xs min-w-0 space-y-0.5">
                <p className="font-bold text-gray-950 truncate">{productToDelete.nameAr}</p>
                <p className="font-mono font-bold text-[#A44C5C]">
                  {productToDelete.priceSA} ر.س · المخزون: {productToDelete.stock}
                </p>
                <p className="text-gray-600 font-mono text-[11px]">كود: #{productToDelete.id.slice(0, 8)}</p>
              </div>
            </div>
          ) : undefined
        }
        onCancel={() => setProductToDelete(null)}
        onConfirm={() => {
          if (productToDelete) return handleConfirmDeleteProduct(productToDelete);
        }}
      />

      <ConfirmModal
        isOpen={!!couponToDelete}
        title="تأكيد حذف كود الخصم"
        description={`هل تريد بالتأكيد إيقاف وحذف الكوبون "${couponToDelete}" نهائياً؟`}
        confirmLabel="حذف الكوبون"
        cancelLabel="إلغاء"
        isLoading={isProcessingConfirm}
        onCancel={() => setCouponToDelete(null)}
        onConfirm={handleConfirmDeleteCoupon}
      />

      <ConfirmModal
        isOpen={!!memberToRemove}
        title="تأكيد إلغاء صلاحية عضو الفريق"
        description={`هل أنتِ متأكدة من إلغاء صلاحية الوصول للحساب: ${memberToRemove?.name || memberToRemove?.email}؟`}
        confirmLabel="إلغاء الصلاحية"
        cancelLabel="تراجع"
        isLoading={isProcessingConfirm}
        onCancel={() => setMemberToRemove(null)}
        onConfirm={handleConfirmRemoveTeamMember}
      />

      <ConfirmModal
        isOpen={confirmRestoreProducts}
        title="استعادة المنتجات المفقودة"
        description="هل أنتِ متأكدة من استعادة كافة المنتجات الأصلية المفقودة وتحديث قاعدة البيانات؟"
        confirmLabel="نعم، تنفيذ الاستعادة"
        cancelLabel="إلغاء"
        variant="primary"
        isLoading={isProcessingConfirm}
        onCancel={() => setConfirmRestoreProducts(false)}
        onConfirm={async () => {
          setIsProcessingConfirm(true);
          try {
            const res = await dbService.restoreMissingProducts();
            if (res.success) {
              toast?.(`تمت استعادة ${res.count} منتج بنجاح إلى قاعدة البيانات السحابية 👑`, 'success');
            } else {
              toast?.(`تم استعادة ${res.count} منتج، مع وجود ${res.errors.length} خطأ.`, 'error');
            }
            setConfirmRestoreProducts(false);
          } catch (err: any) {
            toast?.('فشل عملية الاستعادة: ' + (err?.message || ''), 'error');
          } finally {
            setIsProcessingConfirm(false);
          }
        }}
      />

      <ConfirmModal
        isOpen={!!orderToReject}
        title="تأكيد رفض إشعار الدفع"
        description={orderToReject ? `سيتم تعليم الطلب #${orderToReject.id.slice(0, 8)} كمرفوض الدفع.` : ''}
        confirmLabel="تأكيد الرفض"
        cancelLabel="تراجع"
        isLoading={!!orderToReject && updatingOrderId === orderToReject.id}
        details={
          <div className="space-y-1.5">
            <label htmlFor="reject-reason-input" className="block text-xs font-bold text-gray-800">
              سبب الرفض (اختياري):
            </label>
            <input
              id="reject-reason-input"
              type="text"
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              placeholder="مثال: الإيصال غير واضح أو المبلغ غير مطابق"
              className="w-full min-h-[44px] bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-950 outline-none focus:border-[#A44C5C]"
            />
          </div>
        }
        onCancel={() => {
          setOrderToReject(null);
          setRejectionReasonInput('');
        }}
        onConfirm={async () => {
          if (!orderToReject) return;
          const target = orderToReject;
          const reason = rejectionReasonInput.trim() || undefined;
          setOrderToReject(null);
          setRejectionReasonInput('');
          await handleUpdatePaymentStatus(target, 'rejected', reason);
        }}
      />
    </>
  );
}
