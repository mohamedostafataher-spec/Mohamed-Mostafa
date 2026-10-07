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
  ExternalLink,
  Phone,
  MapPin,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';
import { Product, Order, DiscountCoupon, Settings, Category, Collection } from '../types';
import { dbService, cleanImgUrl } from '../services/db';
import { WhatsAppService } from '../services/whatsappService';

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
  deleteProduct
}: DashboardProps) {
  // Navigation tabs: simple, focused on essentials
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'coupons' | 'settings'>('overview');

  // Search & Filter States
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('current');
  const [productSearch, setProductSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Status updating state
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

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

  // Coupon form states
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState<number>(15);
  const [newCouponDesc, setNewCouponDesc] = useState('');

  // Settings form states
  const [settingsForm, setSettingsForm] = useState({
    siteName: settings?.siteName || 'SULTA',
    whatsapp: settings?.whatsappSaudi || settings?.whatsapp || '966596894393',
    contactPhone: settings?.contactPhoneSaudi || settings?.contactPhone || '+966 59 689 4393',
    contactEmail: settings?.contactEmail || 'concierge@sulta.sa',
    facebookPixelId: settings?.facebookPixelId || '',
    tiktokPixelId: settings?.tiktokPixelId || '',
    snapchatPixelId: settings?.snapchatPixelId || '',
    googleAnalyticsId: settings?.googleAnalyticsId || '',
    defaultShippingFee: settings?.defaultShippingFee || 0
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Real Metric Calculations directly from actual data
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'new').length;
    const processingOrders = orders.filter(o => o.status === 'processing').length;
    const shippedOrders = orders.filter(o => o.status === 'shipped').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => Number(p.stock) <= 3).length;

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
  }, [orders, products]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = 
        !orderSearch.trim() ||
        o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.phone.includes(orderSearch) ||
        o.city.toLowerCase().includes(orderSearch.toLowerCase());

      const matchStatus = 
        orderStatusFilter === 'all' ||
        (orderStatusFilter === 'current' && o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'returned') ||
        (orderStatusFilter === 'pending' && (o.status === 'pending' || o.status === 'new')) ||
        o.status === orderStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!productSearch.trim()) return true;
      const q = productSearch.toLowerCase();
      return (
        (p.nameAr && p.nameAr.toLowerCase().includes(q)) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.categoryAr && p.categoryAr.toLowerCase().includes(q))
      );
    });
  }, [products, productSearch]);

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

  // Handle Delete Order
  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('هل أنتِ متأكدة من حذف هذا الطلب نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    
    setUpdatingOrderId(orderId);
    try {
      await dbService.deleteOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null);
      }
      toast?.('تم حذف الطلب بنجاح من الأرشيف.', 'success');
    } catch (err: any) {
      toast?.(`فشل حذف الطلب: ${err?.message || ''}`, 'error');
    } finally {
      setUpdatingOrderId(null);
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

  // Handle Add Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.nameAr?.trim()) {
      toast?.('يرجى كتابة اسم المنتج بالعربية', 'error');
      return;
    }

    try {
      const isEditing = !!editingProduct;
      const targetId = editingProduct ? editingProduct.id : `prod_${Date.now()}`;
      const newProd: Product = {
        id: targetId,
        nameAr: productForm.nameAr.trim(),
        nameEn: productForm.nameEn?.trim() || productForm.nameAr.trim(),
        priceSA: Number(productForm.priceSA) || 0,
        priceEG: Number(productForm.priceEG) || 0,
        stock: Number(productForm.stock) || 0,
        category: productForm.category || 'new',
        categoryAr: productForm.categoryAr || 'المجموعة الجديدة',
        descriptionAr: productForm.descriptionAr || '',
        descriptionEn: productForm.descriptionEn || '',
        fabricAr: productForm.fabricAr || 'حرير وساتان كوتور معالج فائق النعومة',
        fabricEn: productForm.fabricEn || 'Premium Silk & Satin blend',
        washInstructionsAr: productForm.washInstructionsAr || 'غسيل يدوي بماء بارد أو غسيل جاف لطيف',
        images: productForm.images && productForm.images.length > 0 ? productForm.images : ['/img/sulta_product_1.png'],
        colors: productForm.colors || [{ name: 'وردي كوتور', hex: '#E8A5B8' }],
        sizes: productForm.sizes || ['S', 'M', 'L', 'XL'],
        status: 'active',
        featured: true,
        rating: 5,
        reviewsCount: 10
      };

      await dbService.saveProduct(newProd);

      if (isEditing) {
        setProducts(prev => prev.map(p => p.id === targetId ? newProd : p));
        toast?.(`تم تعديل المنتج "${newProd.nameAr}" بنجاح`, 'success');
      } else {
        setProducts(prev => [newProd, ...prev]);
        toast?.(`تمت إضافة المنتج "${newProd.nameAr}" بنجاح للمتجر`, 'success');
      }

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
      toast?.(`حدث خطأ أثناء حفظ المنتج: ${err?.message || ''}`, 'error');
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async (p: Product) => {
    if (!confirm(`هل أنت متأكد من حذف المنتج "${p.nameAr}"؟`)) return;
    try {
      if (deleteProduct) {
        await deleteProduct(p.id, p.nameAr);
      } else {
        await dbService.deleteProduct(p.id);
        setProducts(prev => prev.filter(item => item.id !== p.id));
      }
      toast?.(`تم حذف المنتج "${p.nameAr}"`, 'success');
    } catch (err: any) {
      toast?.(`فشل حذف المنتج: ${err?.message || ''}`, 'error');
    }
  };

  // Handle Add Coupon
  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = newCouponCode.trim().toUpperCase();
    if (!code) {
      toast?.('يرجى إدخال كود الكوبون', 'error');
      return;
    }
    const newCoupon: DiscountCoupon = {
      code,
      discountPercent: Number(newCouponDiscount) || 10,
      description: newCouponDesc.trim() || `خصم ${newCouponDiscount}% لعميلات المتجر`
    };

    try {
      await dbService.saveCoupon(newCoupon);
      setCoupons(prev => [newCoupon, ...prev.filter(c => c.code !== code)]);
      setNewCouponCode('');
      setNewCouponDesc('');
      toast?.(`تم تفعيل الكوبون ${code} بنجاح`, 'success');
    } catch (err: any) {
      toast?.(`فشل حفظ الكوبون: ${err?.message || ''}`, 'error');
    }
  };

  // Handle Delete Coupon
  const handleDeleteCoupon = async (code: string) => {
    if (!confirm(`هل تريد بالتأكيد إيقاف وحذف الكوبون ${code}؟`)) return;
    try {
      await dbService.deleteCoupon(code);
      setCoupons(prev => prev.filter(c => c.code !== code));
      toast?.(`تم حذف الكوبون ${code}`, 'success');
    } catch (err: any) {
      toast?.(`فشل حذف الكوبون: ${err?.message || ''}`, 'error');
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
        facebookPixelId: settingsForm.facebookPixelId,
        tiktokPixelId: settingsForm.tiktokPixelId,
        snapchatPixelId: settingsForm.snapchatPixelId,
        googleAnalyticsId: settingsForm.googleAnalyticsId,
        defaultShippingFee: Number(settingsForm.defaultShippingFee) || 0
      };

      const success = await dbService.updateSettings(payload);
      if (success) {
        setSettings(prev => prev ? { ...prev, ...payload } : payload as Settings);
        toast?.('تم حفظ إعدادات المتجر وبيكسلات التتبع بنجاح', 'success');
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
            <div className="flex items-center gap-2 self-end sm:self-auto">
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
                    descriptionAr: 'طقم بيجامة نوم حريرية فاخرة بتصميم أنيق.',
                    images: ['/img/sulta_product_1.png']
                  });
                  setIsAddProductOpen(true);
                }}
                className="bg-[#FCF5F6] hover:bg-[#A44C5C] hover:text-white text-[#A44C5C] text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 border border-[#DF8A9D]/20"
              >
                <Plus size={14} />
                <span>إضافة منتج جديد</span>
              </button>
            </div>
          </div>

          {/* 2. Simplified Primary Navigation Tabs (5 clean tabs only) */}
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
              <span>نظرة عامة والمبيعات</span>
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
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === 'settings'
                  ? 'bg-[#A44C5C] text-white shadow-xs'
                  : 'text-gray-600 hover:text-black hover:bg-gray-100'
              }`}
            >
              <SettingsIcon size={15} />
              <span>إعدادات المتجر والبيكسل</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* ======================================================== */}
        {/* TAB 1: OVERVIEW & REAL LIVE METRICS */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in-rapid">
            {/* Real Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Total Revenue */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-medium">إجمالي المبيعات الفعلية</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign size={16} />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-gray-950 font-mono" dir="ltr">
                  {metrics.totalRevenue.toLocaleString()} <span className="text-xs font-sans text-gray-500">ر.س</span>
                </div>
                <p className="text-[10px] text-emerald-600 font-medium">
                  محسوبة من كافة طلبات المتجر الحقيقية
                </p>
              </div>

              {/* Total Orders */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-medium">إجمالي الطلبات المسجلة</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Package size={16} />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-gray-950 font-mono">
                  {metrics.totalOrders} <span className="text-xs font-sans text-gray-500">طلب</span>
                </div>
                <p className="text-[10px] text-blue-600 font-medium">
                  {metrics.pendingOrders} طلبات جديدة بانتظار التجهيز
                </p>
              </div>

              {/* Total Products */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-medium">المنتجات في الكتالوج</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <ShoppingBag size={16} />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-gray-950 font-mono">
                  {metrics.totalProducts} <span className="text-xs font-sans text-gray-500">قطعة</span>
                </div>
                <p className="text-[10px] text-gray-400">
                  {metrics.lowStockProducts > 0 ? `⚠️ ${metrics.lowStockProducts} قطع قارب مخزونها على النفاد` : 'المخزون مستقر'}
                </p>
              </div>

              {/* Completed Orders */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-medium">الطلبات المكتملة</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <CheckCircle2 size={16} />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-gray-950 font-mono">
                  {metrics.deliveredOrders} <span className="text-xs font-sans text-gray-500">شحنة مكتملة</span>
                </div>
                <p className="text-[10px] text-gray-400">
                  تم تسليمها للعميلات بنجاح
                </p>
              </div>
            </div>

            {/* Quick Recent Orders Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-150 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-gray-950">
                    أحدث الطلبات الحقيقية المسجلة
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    الطلبات الواردة مباشرة من المتجر وسلة الشراء
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-black hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>عرض كل الطلبات</span>
                  <span>←</span>
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs space-y-2">
                  <span className="text-3xl block">📦</span>
                  <p className="font-bold text-gray-600">لا توجد طلبات مسجلة بعد</p>
                  <p>عندما تطلب أي عميلة من المتجر، ستظهر تفاصيلها وفاتورتها هنا فوراً.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#F8F9FA] text-gray-500 border-b border-gray-150">
                      <tr>
                        <th className="py-3 px-4 font-bold">رقم الطلب</th>
                        <th className="py-3 px-4 font-bold">العميلة</th>
                        <th className="py-3 px-4 font-bold">الجوال</th>
                        <th className="py-3 px-4 font-bold">المدينة</th>
                        <th className="py-3 px-4 font-bold">المبلغ</th>
                        <th className="py-3 px-4 font-bold">الحالة</th>
                        <th className="py-3 px-4 font-bold text-center">إجراءات الفاتورة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.slice(0, 6).map((order) => {
                        const badge = getStatusBadge(order.status);
                        return (
                          <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-gray-900">
                              #{order.id.slice(0, 8)}
                            </td>
                            <td className="py-3 px-4 font-medium text-gray-950">
                              {order.customerName}
                            </td>
                            <td className="py-3 px-4 font-mono text-gray-600" dir="ltr">
                              {order.phone || 'غير مسجل'}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {order.city || 'الرياض'}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-black" dir="ltr">
                              {Number(order.totalPrice).toLocaleString()} {order.currency || 'ر.س'}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${badge.color}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {order.phone && (
                                  <button
                                    onClick={() => WhatsAppService.sendInvoice(order, order.phone)}
                                    className="bg-[#25D366] hover:bg-[#1ebd59] text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                    title="إرسال تفاصيل الفاتورة عبر واتساب"
                                  >
                                    <MessageCircle size={13} />
                                    <span>فاتورة واتساب 🧾</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setActiveTab('orders');
                                  }}
                                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-bold px-2 py-1 rounded-lg transition-all cursor-pointer"
                                  title="عرض تفاصيل الطلب"
                                >
                                  عرض
                                </button>
                              </div>
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
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

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

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-4 sm:p-5 space-y-4 hover:border-gray-300 transition-all"
                    >
                      {/* Top Header */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-mono font-black text-sm text-gray-950">
                            #{order.id.slice(0, 10)}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1 font-mono">
                            <Calendar size={13} />
                            {order.date || 'اليوم'}
                          </span>
                        </div>

                        {/* Status Updater Select */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <span className="text-xs text-gray-400 font-medium">تغيير الحالة:</span>
                          <select
                            value={order.status || 'pending'}
                            disabled={updatingOrderId === order.id}
                            onChange={(e) => handleUpdateOrderStatus(order, e.target.value as any)}
                            className="bg-[#F8F9FA] border border-gray-300 rounded-xl px-2.5 py-1 text-xs font-bold focus:outline-none focus:border-black cursor-pointer"
                          >
                            <option value="pending">طلب جديد (معلق) ⏳</option>
                            <option value="paid">مدفوع إلكترونياً 💳</option>
                            <option value="cod">دفع عند الاستلام 📦</option>
                            <option value="processing">جاري التجهيز 📦</option>
                            <option value="shipped">تم الشحن 🚚</option>
                            <option value="delivered">مكتمل بنجاح ✨</option>
                            <option value="failed">فشل الدفع ⚠️</option>
                            <option value="cancelled">إلغاء الطلب ❌</option>
                          </select>

                          <button
                            onClick={() => handleDeleteOrder(order.id)}
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

                      {/* Order Action Buttons */}
                      <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {order.phone && (
                            <>
                              {/* 1. Official WhatsApp Invoice Button */}
                              <button
                                onClick={() => WhatsAppService.sendInvoice(order, order.phone)}
                                className="bg-[#25D366] hover:bg-[#20ba5a] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                              >
                                <MessageCircle size={14} />
                                <span>إرسال الفاتورة للعميلة على الواتساب 🧾</span>
                              </button>

                              {/* 2. Direct Chat Button */}
                              <a
                                href={`https://wa.me/${order.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً أستاذة ${order.customerName}، معك خدمة عملاء بوتيك SULTA 👑 بخصوص طلبكِ رقم #${order.id.slice(0, 8)}...`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Phone size={13} />
                                <span>محادثة العميلة</span>
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
                          {Number(p.priceSA).toLocaleString()} ر.س
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
                        <td className="py-2.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setProductForm({ ...p });
                                setIsAddProductOpen(true);
                              }}
                              className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer"
                              title="تعديل المنتج"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="حذف المنتج"
                            >
                              <Trash2 size={14} />
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
            {/* Add Coupon Form */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm sm:text-base text-gray-950 flex items-center gap-2">
                <Tag size={16} className="text-black" />
                <span>إضافة كود خصم جديد للمتجر</span>
              </h3>
              
              <form onSubmit={handleAddCoupon} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">كود الكوبون</label>
                  <input
                    type="text"
                    placeholder="مثال: SULTA20"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase focus:bg-white focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">نسبة الخصم (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    placeholder="20"
                    value={newCouponDiscount}
                    onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                    className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">الوصف الترويجي</label>
                  <input
                    type="text"
                    placeholder="مثال: خصم خاص لعميلات المملكة"
                    value={newCouponDesc}
                    onChange={(e) => setNewCouponDesc(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-black"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-[#A44C5C] hover:bg-gray-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    حفظ وتفعيل الكوبون 🏷️
                  </button>
                </div>
              </form>
            </div>

            {/* Coupons List */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-gray-150">
                <h4 className="font-bold text-sm text-gray-950">الكوبونات الفعالة حالياً ({coupons.length})</h4>
              </div>
              <div className="divide-y divide-gray-100">
                {coupons.map((coupon) => (
                  <div key={coupon.code} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-mono font-black text-sm text-black">
                        %
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-gray-950">{coupon.code}</span>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.2 rounded-full">
                            خصم {coupon.discountPercent}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{coupon.description || 'كوبون ترويجي فعال'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCoupon(coupon.code)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="حذف الكوبون"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: STORE SETTINGS & PIXELS */}
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
                      placeholder="966596894393"
                      value={settingsForm.whatsapp}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">رقم الهاتف الظاهر</label>
                    <input
                      type="text"
                      placeholder="+966 59 689 4393"
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
                </div>
              </div>

              {/* Marketing Pixels */}
              <div className="space-y-4 pt-2">
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
                      placeholder="مثال: 123456789012345"
                      value={settingsForm.facebookPixelId}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, facebookPixelId: e.target.value }))}
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:border-black"
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
                  placeholder="مثال: بيجامة حريرية ناعمة مع دانتيل"
                  value={productForm.nameAr || ''}
                  onChange={(e) => setProductForm(prev => ({ ...prev, nameAr: e.target.value }))}
                  className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">السعر بالمملكة (ر.س) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="195"
                    value={productForm.priceSA || 0}
                    onChange={(e) => setProductForm(prev => ({ ...prev, priceSA: Number(e.target.value) }))}
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
                    value={productForm.stock || 0}
                    onChange={(e) => setProductForm(prev => ({ ...prev, stock: Number(e.target.value) }))}
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
                      satin: 'حرير وساتان',
                      cotton: 'قطنيات فاخرة',
                      loungewear: 'ملابس استرخاء'
                    };
                    setProductForm(prev => ({ ...prev, category: val, categoryAr: catMap[val] || 'المجموعة الجديدة' }));
                  }}
                  className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-black cursor-pointer"
                >
                  <option value="new">المجموعة الجديدة ✨</option>
                  <option value="satin">حرير وساتان كوتور 👑</option>
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
    </div>
  );
}
