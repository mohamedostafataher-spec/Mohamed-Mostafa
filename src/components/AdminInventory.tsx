import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  AlertCircle,
  Plus,
  History,
  Search,
  CheckCircle2,
  TrendingDown,
  Layers,
  Truck,
  TrendingUp,
  Clock,
  Lock,
  Trash2,
  PackagePlus,
  ShoppingCart,
  ArrowLeftRight
} from 'lucide-react';
import { dbService } from '../services/db';
import {
  Order,
  Product,
  PurchaseOrder,
  PurchaseOrderItem,
  StockMovement,
  StockMovementType,
  StockReservation,
  Supplier
} from '../types';
import {
  CanonicalAdminRole,
  canEditCostPrice,
  canUpdateStock,
  canViewCostPrice
} from '../utils/rbac';
import {
  analyzeProductProfitabilityAndSlowMovers,
  calculateStockFromMovements,
  forecastProductStockout,
  fromHalalas,
  getMovementTypeMeta,
  toHalalas
} from '../utils/inventoryAnalytics';
import { AdminEmptyState, ConfirmModal } from './admin/AdminUI';

interface AdminInventoryProps {
  orders?: Order[];
  adminRole?: CanonicalAdminRole;
  adminName?: string;
  toast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type InventorySubTab = 'stock' | 'analytics' | 'suppliers';

export default function AdminInventory({
  orders = [],
  adminRole = 'warehouse',
  adminName = 'مسؤول المستودع',
  toast
}: AdminInventoryProps) {
  const [subTab, setSubTab] = useState<InventorySubTab>('stock');
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [reservations, setReservations] = useState<StockReservation[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewLogsProductId, setViewLogsProductId] = useState<string | null>(null);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  // Movement Adjustment Modal
  const [movementTarget, setMovementTarget] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<'inbound' | 'outbound' | 'return' | 'adjustment' | 'damaged'>('inbound');
  const [movementQty, setMovementQty] = useState<number>(10);
  const [movementReason, setMovementReason] = useState<string>('');

  // Threshold inline editing
  const [editingThresholdId, setEditingThresholdId] = useState<string | null>(null);
  const [thresholdInput, setThresholdInput] = useState<string>('5');

  // Suppliers Form State
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierCity, setSupplierCity] = useState('الرياض');
  const [supplierNotes, setSupplierNotes] = useState('');
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // Purchase Order Builder
  const [isPOFormOpen, setIsPOFormOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([]);
  const [poNotes, setPoNotes] = useState('');
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);
  const [receiveQtys, setReceiveQtys] = useState<Record<string, number>>({});
  const [isSavingPO, setIsSavingPO] = useState(false);

  const canStock = canUpdateStock(adminRole);
  const showCost = canViewCostPrice(adminRole);
  const canEditPO = canEditCostPrice(adminRole) || canStock;

  useEffect(() => {
    let unmounted = false;
    const unsubP = dbService.subscribeProducts((data) => {
      if (!unmounted) setProducts(data);
    }, () => {});

    const unsubM = dbService.subscribeStockMovements((movements) => {
      if (!unmounted) {
        setStockMovements(movements);
        setLoading(false);
      }
    }, () => setLoading(false));

    Promise.all([
      dbService.getActiveStockReservations(),
      dbService.getSuppliers(),
      dbService.getPurchaseOrders()
    ])
      .then(([resList, supList, poList]) => {
        if (unmounted) return;
        setReservations(resList);
        setSuppliers(supList);
        setPurchaseOrders(poList);
      })
      .catch(() => {});

    return () => {
      unmounted = true;
      unsubP();
      unsubM();
    };
  }, []);

  // Load cost price ONLY if authorized
  useEffect(() => {
    let active = true;
    if (!showCost) return;
    dbService.getAdminProductsWithCost()
      .then((costList) => {
        if (!active || !costList.length) return;
        const map = new Map(costList.map((c) => [c.id, c.costPrice]));
        setProducts((prev) => prev.map((p) => (map.has(p.id) ? { ...p, costPrice: map.get(p.id) } : p)));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [showCost]);

  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    toast?.(msg, type);
  };

  const forecastsByProductId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof forecastProductStockout>>();
    for (const p of products) {
      map.set(p.id, forecastProductStockout(p, orders));
    }
    return map;
  }, [products, orders]);

  const analyticsData = useMemo(
    () => analyzeProductProfitabilityAndSlowMovers(products, orders, showCost, 30),
    [products, orders, showCost]
  );

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.nameAr.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  const totalStockPieces = products.reduce((acc, p) => acc + Math.max(0, Number(p.stock || 0)), 0);
  const lowStockCount = products.filter((p) => {
    const fc = forecastsByProductId.get(p.id);
    return fc?.urgency === 'critical' || fc?.urgency === 'out';
  }).length;
  const outOfStockCount = products.filter((p) => Number(p.stock) <= 0).length;
  const activeReservedUnits = reservations.reduce((acc, r) => acc + Number(r.quantity || 0), 0);

  const handleApplyMovement = async (
    product: Product,
    type: StockMovementType,
    rawQty: number,
    reason: string
  ) => {
    if (!canStock) {
      notify('ليس لديك صلاحية تعديل المخزون', 'error');
      return;
    }
    const qtyAbs = Math.abs(Math.floor(Number(rawQty || 0)));
    if (qtyAbs === 0) {
      notify('الرجاء إدخال كمية أكبر من الصفر', 'error');
      return;
    }

    const meta = getMovementTypeMeta(type);
    let change = qtyAbs;
    if (type === 'outbound' || type === 'damaged' || type === 'order_deduction' || type === 'damage_adjustment') {
      change = -qtyAbs;
    } else if (type === 'adjustment' || type === 'inventory_audit') {
      change = Number(rawQty);
    }

    const currentStock = Math.max(0, Number(product.stock || 0));
    const nextStock = Math.max(0, currentStock + change);
    const appliedChange = nextStock - currentStock;

    setAdjustingId(product.id);
    try {
      const updated = { ...product, stock: nextStock };
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
      await dbService.saveProduct(updated);
      await dbService.recordStockMovement({
        productId: product.id,
        productName: product.nameAr,
        changeQty: appliedChange,
        newStockLevel: nextStock,
        movementType: type,
        reason: reason || meta.labelAr,
        adminName
      });
      setStockMovements((prev) => [
        {
          id: crypto.randomUUID(),
          productId: product.id,
          productName: product.nameAr,
          changeQty: appliedChange,
          newStockLevel: nextStock,
          movementType: type,
          reason: reason || meta.labelAr,
          adminName,
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);
      notify(`تم تسجيل حركة (${meta.labelAr}) لـ "${product.nameAr}". الرصيد الحالي: ${nextStock} قطعة.`);
    } catch {
      notify('فشل تسجيل حركة المخزون', 'error');
    } finally {
      setAdjustingId(null);
    }
  };

  const handleSaveThreshold = async (p: Product) => {
    const val = Math.max(0, Math.floor(Number(thresholdInput)));
    if (!Number.isFinite(val)) return;
    try {
      const updated: Product = { ...p, minStockThreshold: val };
      setProducts((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
      await dbService.saveProduct(updated);
      setEditingThresholdId(null);
      notify(`تم ضبط الحد الأدنى لتنبيه "${p.nameAr}" إلى ${val} قطع`);
    } catch {
      notify('تعذر حفظ الحد الأدنى', 'error');
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) return;
    try {
      const saved = await dbService.saveSupplier({
        id: crypto.randomUUID(),
        name: supplierName.trim(),
        phone: supplierPhone.trim(),
        city: supplierCity.trim(),
        notes: supplierNotes.trim()
      });
      setSuppliers((prev) => [saved, ...prev]);
      setSupplierName('');
      setSupplierPhone('');
      setSupplierNotes('');
      notify(`تم إضافة المورد "${saved.name}" بنجاح`);
    } catch {
      notify('فشل حفظ بيانات المورد', 'error');
    }
  };

  const handleDeleteSupplierConfirmed = async () => {
    if (!supplierToDelete) return;
    try {
      await dbService.deleteSupplier(supplierToDelete.id);
      setSuppliers((prev) => prev.filter((s) => s.id !== supplierToDelete.id));
      notify(`تم حذف المورد "${supplierToDelete.name}"`);
    } catch {
      notify('تعذر حذف المورد', 'error');
    } finally {
      setSupplierToDelete(null);
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierId || poItems.length === 0) {
      notify('اختاري المورد وأضيفي منتجاً واحداً على الأقل', 'error');
      return;
    }
    const sup = suppliers.find((s) => s.id === poSupplierId);
    const totalCostHalalas = poItems.reduce(
      (sum, it) => sum + toHalalas(it.unitCost) * Math.max(1, Number(it.quantity)),
      0
    );
    setIsSavingPO(true);
    try {
      const newPO: PurchaseOrder = {
        id: crypto.randomUUID(),
        referenceCode: `PO-${Date.now().toString().slice(-6)}`,
        supplierId: poSupplierId,
        supplierName: sup?.name || 'مورد',
        status: 'ordered',
        items: poItems.map((it) => ({
          ...it,
          unitCostHalalas: toHalalas(it.unitCost),
          receivedQuantity: 0
        })),
        totalCostHalalas,
        notes: poNotes.trim() || undefined,
        orderedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: adminName
      };
      const saved = await dbService.savePurchaseOrder(newPO);
      setPurchaseOrders((prev) => [saved, ...prev]);
      setIsPOFormOpen(false);
      setPoItems([]);
      setPoNotes('');
      notify(`تم إنشاء أمر الشراء ${saved.referenceCode} بنجاح`);
    } catch {
      notify('فشل إنشاء أمر الشراء', 'error');
    } finally {
      setIsSavingPO(false);
    }
  };

  const handleOpenReceiveModal = (po: PurchaseOrder) => {
    const initial: Record<string, number> = {};
    for (const item of po.items) {
      initial[item.productId] = Math.max(0, item.quantity - item.receivedQuantity);
    }
    setReceiveQtys(initial);
    setReceivingPO(po);
  };

  const handleConfirmReceivePO = async () => {
    if (!receivingPO) return;
    setIsSavingPO(true);
    try {
      const { updatedPO, updatedProducts } = await dbService.receivePurchaseOrder(
        receivingPO,
        receiveQtys,
        products,
        adminName
      );
      setPurchaseOrders((prev) => prev.map((x) => (x.id === updatedPO.id ? updatedPO : x)));
      setProducts(updatedProducts);
      setReceivingPO(null);
      notify(`تم استلام البضاعة لأمر ${updatedPO.referenceCode} وتحديث التكلفة بمتوسط مرجّح والمخزون!`);
    } catch {
      notify('حدث خطأ أثناء استلام أمر الشراء', 'error');
    } finally {
      setIsSavingPO(false);
    }
  };

  return (
    <div className="space-y-5 font-sans animate-fade-in" dir="rtl">
      {/* Header & KPIs */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-150">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FCF5F6] border border-[#DF8A9D]/30 text-[#A44C5C] flex items-center justify-center shrink-0">
              <Layers size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-950">إدارة المستودع والتوريد وحركات المخزون</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                سجل الحركات، توقع النفاد، الحجز المؤقت للسلة، الموردين، وأوامر الشراء بالمتوسط المرجّح
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'stock', label: 'المستودع والتوقعات', icon: Package },
              { id: 'analytics', label: 'الربحية والراكد والحجز', icon: TrendingUp },
              { id: 'suppliers', label: 'الموردين وأوامر الشراء', icon: Truck }
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSubTab(t.id as InventorySubTab)}
                  className={`min-h-[44px] px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    subTab === t.id
                      ? 'bg-[#A44C5C] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon size={14} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-[#FAF8F8] border border-gray-200 rounded-2xl p-4">
            <span className="text-[11px] text-gray-500 font-bold block">إجمالي القطع الفعلي</span>
            <div className="text-xl font-black font-mono text-gray-950 mt-1">{totalStockPieces} قطعة</div>
          </div>
          <div className="bg-[#FAF8F8] border border-gray-200 rounded-2xl p-4">
            <span className="text-[11px] text-amber-700 font-bold flex items-center gap-1">
              <AlertCircle size={13} /> مخزون حرج / توقع نفاد
            </span>
            <div className="text-xl font-black font-mono text-amber-800 mt-1">{lowStockCount} موديل</div>
          </div>
          <div className="bg-[#FAF8F8] border border-gray-200 rounded-2xl p-4">
            <span className="text-[11px] text-rose-700 font-bold flex items-center gap-1">
              <TrendingDown size={13} /> نافد من المستودع (0)
            </span>
            <div className="text-xl font-black font-mono text-rose-800 mt-1">{outOfStockCount} موديل</div>
          </div>
          <div className="bg-[#FAF8F8] border border-gray-200 rounded-2xl p-4">
            <span className="text-[11px] text-indigo-700 font-bold flex items-center gap-1">
              <Lock size={13} /> محجوز بسلة الدفع الآن
            </span>
            <div className="text-xl font-black font-mono text-indigo-900 mt-1">{activeReservedUnits} قطعة</div>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: STOCK, MOVEMENTS LEDGER & FORECASTS */}
      {subTab === 'stock' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="ابحثي باسم الموديل أو رمز SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl py-2 pr-9 pl-4 text-xs focus:bg-white focus:outline-none focus:border-[#A44C5C]"
              />
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <span className="text-xs font-mono text-gray-500">
              المعروض: {filteredProducts.length} / {products.length}
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#F8F9FA] text-gray-600 border-b border-gray-200 font-bold">
                  <tr>
                    <th className="py-3.5 px-4">المنتج</th>
                    <th className="py-3.5 px-4 text-center">الفعلي / الحركات</th>
                    <th className="py-3.5 px-4 text-center">الحد الأدنى</th>
                    <th className="py-3.5 px-4">توقع النفاد (30 يوم)</th>
                    <th className="py-3.5 px-4 text-center">تسجيل حركة</th>
                    <th className="py-3.5 px-4 text-center">السجل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-gray-400">
                        جاري تحميل بيانات المستودع...
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const productMovements = stockMovements.filter((m) => m.productId === p.id);
                      const ledgerSum = calculateStockFromMovements(productMovements);
                      const forecast = forecastsByProductId.get(p.id);
                      const isExpanded = viewLogsProductId === p.id;

                      return (
                        <React.Fragment key={p.id}>
                          <tr className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={p.images?.[0] || ''}
                                  alt={p.nameAr}
                                  className="w-10 h-11 object-cover rounded-xl border border-gray-200 bg-gray-100 shrink-0"
                                />
                                <div>
                                  <span className="font-bold text-gray-950 block">{p.nameAr}</span>
                                  <span className="text-[10.5px] font-mono text-gray-400">
                                    {p.sku || `#${p.id.slice(0, 8)}`}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span
                                  className={`font-mono font-black px-2.5 py-0.5 rounded-full ${
                                    forecast?.urgency === 'out'
                                      ? 'bg-rose-100 text-rose-800'
                                      : forecast?.urgency === 'critical'
                                        ? 'bg-amber-100 text-amber-900'
                                        : 'bg-emerald-100 text-emerald-900'
                                  }`}
                                >
                                  {p.stock} قطعة
                                </span>
                                {productMovements.length > 0 && (
                                  <span className="text-[10px] font-mono text-gray-500">
                                    مجموع الحركات: {ledgerSum}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-4 text-center">
                              {editingThresholdId === p.id ? (
                                <div className="flex items-center justify-center gap-1" dir="ltr">
                                  <input
                                    type="number"
                                    min="0"
                                    value={thresholdInput}
                                    onChange={(e) => setThresholdInput(e.target.value)}
                                    className="w-14 min-h-[34px] border border-[#A44C5C] rounded-lg text-center font-mono text-xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveThreshold(p)}
                                    className="px-2 min-h-[34px] bg-emerald-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                                  >
                                    حفظ
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  disabled={!canStock}
                                  onClick={() => {
                                    setEditingThresholdId(p.id);
                                    setThresholdInput(String(p.minStockThreshold ?? 5));
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 font-mono font-bold text-gray-800 cursor-pointer disabled:cursor-default"
                                  title="تعديل حد التنبيه الأدنى"
                                >
                                  {p.minStockThreshold ?? 5} قطع
                                </button>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              {forecast ? (
                                <div className="space-y-0.5">
                                  <span
                                    className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                                      forecast.urgency === 'out'
                                        ? 'text-rose-700'
                                        : forecast.urgency === 'critical'
                                          ? 'text-amber-700'
                                          : 'text-emerald-700'
                                    }`}
                                  >
                                    <Clock size={12} />
                                    {forecast.stock === 0
                                      ? 'نفد حالياً'
                                      : forecast.daysUntilStockout !== null
                                        ? `يكفي ~${forecast.daysUntilStockout} يوم`
                                        : 'معدل سحب هادئ'}
                                  </span>
                                  <span className="block text-[10px] text-gray-500 font-mono">
                                    مبيعات 30 يوم: {forecast.unitsSold30d} ({forecast.dailyVelocity}/يوم)
                                  </span>
                                </div>
                              ) : (
                                '-'
                              )}
                            </td>

                            <td className="py-3 px-4 text-center">
                              {canStock ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={adjustingId === p.id}
                                    onClick={() => handleApplyMovement(p, 'inbound', 10, 'وارد سريع للمستودع (+10)')}
                                    className="min-h-[38px] px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-bold cursor-pointer"
                                  >
                                    +10
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMovementTarget(p);
                                      setMovementType('inbound');
                                      setMovementQty(5);
                                      setMovementReason('');
                                    }}
                                    className="min-h-[38px] px-3 bg-[#FCF5F6] hover:bg-[#F3E5E8] text-[#A44C5C] border border-[#DF8A9D]/40 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <ArrowLeftRight size={13} />
                                    <span>حركة مخصصة</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-gray-400">عرض فقط</span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => setViewLogsProductId(isExpanded ? null : p.id)}
                                className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 rounded-xl font-bold border cursor-pointer ${
                                  isExpanded
                                    ? 'bg-[#A44C5C] text-white border-[#A44C5C]'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                                }`}
                              >
                                <History size={13} />
                                <span>{productMovements.length}</span>
                              </button>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="bg-gray-50/90">
                              <td colSpan={6} className="p-4">
                                {productMovements.length === 0 ? (
                                  <div className="py-4 text-center text-xs text-gray-500">
                                    لا توجد حركات مسجلة لهذا المنتج بعد.
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto">
                                    {productMovements.slice(0, 15).map((m) => {
                                      const meta = getMovementTypeMeta(m.movementType);
                                      return (
                                        <div key={m.id} className="bg-white p-3 rounded-xl border border-gray-200 space-y-1.5">
                                          <div className="flex items-center justify-between gap-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${meta.badgeClass}`}>
                                              {meta.labelAr}
                                            </span>
                                            <span
                                              className={`font-mono font-black text-xs ${
                                                m.changeQty >= 0 ? 'text-emerald-700' : 'text-rose-700'
                                              }`}
                                            >
                                              {m.changeQty > 0 ? `+${m.changeQty}` : m.changeQty}
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-gray-700 font-medium">{m.reason || '-'}</p>
                                          <div className="text-[10px] text-gray-400 flex justify-between pt-1 border-t border-gray-100">
                                            <span>{m.adminName || 'النظام'}</span>
                                            <span className="font-mono">{new Date(m.createdAt).toLocaleDateString('ar-SA')}</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: PROFITABILITY, SLOW MOVERS & CHECKOUT RESERVATIONS */}
      {subTab === 'analytics' && (
        <div className="space-y-5">
          {/* Active Checkout Holds */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-gray-950 flex items-center gap-2">
                <Lock size={16} className="text-indigo-700" />
                <span>الحجوزات المؤقتة أثناء إتمام الدفع (منع البيع الزائد)</span>
              </h4>
              <span className="font-mono text-xs bg-indigo-50 text-indigo-900 px-2.5 py-1 rounded-lg font-bold">
                {reservations.length} سلة نشطة
              </span>
            </div>
            {reservations.length === 0 ? (
              <p className="text-xs text-gray-500 py-2">لا توجد حجوزات مخزون مؤقتة حالياً.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {reservations.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-indigo-950">
                      <span className="truncate">{r.productName || r.productId}</span>
                      <span className="font-mono">{r.quantity} قطعة</span>
                    </div>
                    <p className="text-[11px] text-indigo-800">{r.variant || 'مقاس افتراضي'}</p>
                    <p className="text-[10px] font-mono text-gray-500">
                      ينتهي الحجز: {new Date(r.expiresAt).toLocaleTimeString('ar-SA')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Most Profitable (RBAC COGS gated) */}
            <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-4">
              <h4 className="font-bold text-sm text-gray-950 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-700" />
                <span>الأكثر ربحية وصافي الهامش</span>
              </h4>
              {!showCost ? (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center text-xs text-gray-600 space-y-1">
                  <Lock size={22} className="mx-auto text-gray-400" />
                  <p className="font-bold">بيانات التكلفة والأرباح محجوبة لهذا الدور</p>
                  <p>تظهر فقط للمالك ومدير العمليات والمحاسب وفق مصفوفة الصلاحيات.</p>
                </div>
              ) : analyticsData.topProfitable.length === 0 ? (
                <p className="text-xs text-gray-500">أضيفي سعر التكلفة (COGS) للمنتجات لحساب صافي الربح.</p>
              ) : (
                <div className="space-y-2.5">
                  {analyticsData.topProfitable.map((m) => (
                    <div
                      key={m.product.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAF8F8] border border-gray-150 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-gray-950 truncate">{m.product.nameAr}</p>
                        <p className="text-[11px] text-gray-500 font-mono">
                          مبيع: {m.unitsSold} قطعة · تكلفة القطعة: {m.product.costPrice} ر.س
                        </p>
                      </div>
                      <div className="text-left shrink-0 font-mono">
                        <span className="font-black text-emerald-800 block">
                          {fromHalalas(m.netProfitHalalas).toLocaleString()} ر.س
                        </span>
                        {m.marginPercent !== null && (
                          <span className="text-[10px] font-bold text-emerald-700">هامش {m.marginPercent}%</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Slow-Moving Inventory (>30 days without sales) */}
            <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-gray-950 flex items-center gap-2">
                  <Clock size={16} className="text-amber-600" />
                  <span>القطع الراكدة (لم تُبع خلال 30+ يوماً)</span>
                </h4>
                <span className="font-mono text-xs bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
                  {analyticsData.slowMovers.length} موديل
                </span>
              </div>
              {analyticsData.slowMovers.length === 0 ? (
                <div className="py-6 text-center text-xs text-emerald-700 font-bold">
                  كل الموديلات المتوفرة حققت مبيعات خلال آخر 30 يوماً
                </div>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto">
                  {analyticsData.slowMovers.map((m) => (
                    <div
                      key={m.product.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-amber-50/50 border border-amber-200 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-gray-950 truncate">{m.product.nameAr}</p>
                        <p className="text-[11px] text-amber-900">
                          {m.daysSinceLastSale === null
                            ? 'لم يسجل أي مبيع حتى الآن'
                            : `آخر بيع منذ ${m.daysSinceLastSale} يوماً`}
                        </p>
                      </div>
                      <div className="text-left shrink-0 font-mono">
                        <span className="font-black text-gray-950 block">{m.product.stock} قطعة مكدسة</span>
                        {showCost && m.tiedStockValueHalalas !== null && (
                          <span className="text-[10px] text-amber-800">
                            قيمة التكلفة: {fromHalalas(m.tiedStockValueHalalas)} ر.س
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: SUPPLIERS & PURCHASE ORDERS */}
      {subTab === 'suppliers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Suppliers Column */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-4">
            <h4 className="font-bold text-sm text-gray-950 flex items-center gap-2">
              <Truck size={16} className="text-[#A44C5C]" />
              <span>دليل الموردين ({suppliers.length})</span>
            </h4>

            {canEditPO && (
              <form onSubmit={handleAddSupplier} className="space-y-2.5 bg-[#FAF8F8] p-3.5 rounded-2xl border border-gray-200">
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="اسم المورد / المصنع *"
                  className="w-full min-h-[40px] bg-white border border-gray-200 rounded-xl px-3 text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    placeholder="رقم الجوال"
                    className="w-full min-h-[40px] bg-white border border-gray-200 rounded-xl px-3 text-xs font-mono"
                  />
                  <input
                    type="text"
                    value={supplierCity}
                    onChange={(e) => setSupplierCity(e.target.value)}
                    placeholder="المدينة"
                    className="w-full min-h-[40px] bg-white border border-gray-200 rounded-xl px-3 text-xs"
                  />
                </div>
                <input
                  type="text"
                  value={supplierNotes}
                  onChange={(e) => setSupplierNotes(e.target.value)}
                  placeholder="ملاحظات (حد أدنى للطلب، مدة التوريد)"
                  className="w-full min-h-[40px] bg-white border border-gray-200 rounded-xl px-3 text-xs"
                />
                <button
                  type="submit"
                  className="w-full min-h-[42px] bg-[#A44C5C] hover:bg-[#8E3E4D] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  إضافة مورد جديد
                </button>
              </form>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {suppliers.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">لا يوجد موردون مسجلون بعد</p>
              ) : (
                suppliers.map((s) => (
                  <div key={s.id} className="p-3 rounded-2xl border border-gray-200 flex items-start justify-between gap-2 text-xs">
                    <div>
                      <p className="font-bold text-gray-950">{s.name}</p>
                      <p className="text-[11px] text-gray-500 font-mono">
                        {s.city || ''} {s.phone ? `· ${s.phone}` : ''}
                      </p>
                      {s.notes && <p className="text-[11px] text-gray-600 mt-1">{s.notes}</p>}
                    </div>
                    {canEditPO && (
                      <button
                        type="button"
                        onClick={() => setSupplierToDelete(s)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        aria-label={`حذف ${s.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Purchase Orders Column */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-150">
              <div>
                <h4 className="font-bold text-sm text-gray-950 flex items-center gap-2">
                  <ShoppingCart size={16} className="text-[#A44C5C]" />
                  <span>أوامر الشراء واستلام البضاعة</span>
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  عند الاستلام يتم تحديث المخزون وحساب التكلفة الجديدة بالمتوسط المرجّح تلقائياً
                </p>
              </div>
              {canEditPO && (
                <button
                  type="button"
                  onClick={() => {
                    setPoSupplierId(suppliers[0]?.id || '');
                    setPoItems(
                      products[0]
                        ? [
                            {
                              productId: products[0].id,
                              productName: products[0].nameAr,
                              quantity: 20,
                              receivedQuantity: 0,
                              unitCost: Number(products[0].costPrice || 45)
                            }
                          ]
                        : []
                    );
                    setIsPOFormOpen((v) => !v);
                  }}
                  className="min-h-[44px] px-4 bg-[#A44C5C] hover:bg-[#8E3E4D] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={15} />
                  <span>أمر شراء جديد</span>
                </button>
              )}
            </div>

            {isPOFormOpen && (
              <form onSubmit={handleCreatePO} className="bg-[#FAF8F8] border border-gray-200 rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">المورد *</label>
                    <select
                      required
                      value={poSupplierId}
                      onChange={(e) => setPoSupplierId(e.target.value)}
                      className="w-full min-h-[42px] bg-white border border-gray-200 rounded-xl px-3 text-xs font-bold"
                    >
                      <option value="">اختاري المورد...</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">ملاحظات أمر الشراء</label>
                    <input
                      type="text"
                      value={poNotes}
                      onChange={(e) => setPoNotes(e.target.value)}
                      placeholder="مثال: دفعة موسم الصيف"
                      className="w-full min-h-[42px] bg-white border border-gray-200 rounded-xl px-3 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">الأصناف المطلوبة:</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (!products[0]) return;
                        setPoItems((prev) => [
                          ...prev,
                          {
                            productId: products[0].id,
                            productName: products[0].nameAr,
                            quantity: 10,
                            receivedQuantity: 0,
                            unitCost: Number(products[0].costPrice || 40)
                          }
                        ]);
                      }}
                      className="text-xs font-bold text-[#A44C5C] hover:underline cursor-pointer"
                    >
                      + إضافة صنف آخر
                    </button>
                  </div>
                  {poItems.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-xl border border-gray-200">
                      <select
                        value={it.productId}
                        onChange={(e) => {
                          const p = products.find((pr) => pr.id === e.target.value);
                          if (!p) return;
                          setPoItems((prev) =>
                            prev.map((row, i) =>
                              i === idx ? { ...row, productId: p.id, productName: p.nameAr } : row
                            )
                          );
                        }}
                        className="col-span-6 min-h-[38px] bg-[#F8F9FA] border border-gray-200 rounded-lg px-2 text-xs font-bold"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nameAr}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) =>
                          setPoItems((prev) =>
                            prev.map((row, i) => (i === idx ? { ...row, quantity: Number(e.target.value) } : row))
                          )
                        }
                        placeholder="الكمية"
                        className="col-span-2 min-h-[38px] bg-[#F8F9FA] border border-gray-200 rounded-lg px-2 text-xs font-mono text-center"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={it.unitCost}
                        onChange={(e) =>
                          setPoItems((prev) =>
                            prev.map((row, i) => (i === idx ? { ...row, unitCost: Number(e.target.value) } : row))
                          )
                        }
                        placeholder="التكلفة"
                        className="col-span-3 min-h-[38px] bg-[#F8F9FA] border border-gray-200 rounded-lg px-2 text-xs font-mono text-center"
                      />
                      <button
                        type="button"
                        onClick={() => setPoItems((prev) => prev.filter((_, i) => i !== idx))}
                        className="col-span-1 flex justify-center text-rose-600 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPOFormOpen(false)}
                    className="min-h-[40px] px-4 rounded-xl text-xs font-bold text-gray-600 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPO}
                    className="min-h-[40px] px-5 bg-[#A44C5C] text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    {isSavingPO ? 'جاري الإنشاء...' : 'اعتماد أمر الشراء'}
                  </button>
                </div>
              </form>
            )}

            {purchaseOrders.length === 0 ? (
              <AdminEmptyState
                title="لا توجد أوامر شراء مسجلة"
                description="أضيفي مورداً ثم أنشئي أمر شراء لتتبع الاستلام وتحديث تكلفة المخزون بمتوسط مرجّح."
                icon={<PackagePlus size={24} />}
              />
            ) : (
              <div className="space-y-3">
                {purchaseOrders.map((po) => {
                  const statusLabel =
                    po.status === 'received'
                      ? 'مستلم بالكامل'
                      : po.status === 'partially_received'
                        ? 'مستلم جزئياً'
                        : po.status === 'cancelled'
                          ? 'ملغي'
                          : 'تم الطلب';
                  const statusCls =
                    po.status === 'received'
                      ? 'bg-emerald-100 text-emerald-900'
                      : po.status === 'partially_received'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-blue-100 text-blue-900';

                  return (
                    <div key={po.id} className="border border-gray-200 rounded-2xl p-4 space-y-2.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-gray-950">{po.referenceCode}</span>
                          <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${statusCls}`}>
                            {statusLabel}
                          </span>
                          <span className="text-gray-600 font-bold">المورد: {po.supplierName}</span>
                        </div>
                        {showCost && (
                          <span className="font-mono font-black text-[#A44C5C]">
                            الإجمالي: {fromHalalas(po.totalCostHalalas).toLocaleString()} ر.س
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        {po.items.map((it, idx) => (
                          <div key={idx} className="bg-gray-50 p-2 rounded-xl flex justify-between">
                            <span className="font-bold text-gray-900 truncate">{it.productName}</span>
                            <span className="font-mono text-gray-600 shrink-0">
                              مستلم {it.receivedQuantity} / {it.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      {po.status !== 'received' && po.status !== 'cancelled' && canEditPO && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenReceiveModal(po)}
                            className="min-h-[40px] px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 size={14} />
                            <span>استلام بضاعة في المستودع (متوسط مرجّح)</span>
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

      {/* Custom Movement Modal */}
      {movementTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-200 space-y-4">
            <h4 className="font-bold text-sm text-gray-950">
              تسجيل حركة مخزون: {movementTarget.nameAr}
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">نوع الحركة</label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as any)}
                  className="w-full min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 font-bold"
                >
                  <option value="inbound">وارد للمستودع (+)</option>
                  <option value="return">مرتجع عميلة سليم (+)</option>
                  <option value="outbound">صادر يدوي (-)</option>
                  <option value="damaged">تالف / هالك (-)</option>
                  <option value="adjustment">تسوية جرد (+/-)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  {movementType === 'adjustment' ? 'فرق الكمية (+ إضافة أو - خصم)' : 'الكمية'}
                </label>
                <input
                  type="number"
                  value={movementQty}
                  onChange={(e) => setMovementQty(Number(e.target.value))}
                  className="w-full min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 font-mono font-bold text-center"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">السبب / الملاحظة</label>
                <input
                  type="text"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder="مثال: جرد شهري، استلام شحنة، قطعة تالفة بالتغليف..."
                  className="w-full min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMovementTarget(null)}
                className="min-h-[42px] px-4 rounded-xl text-xs font-bold text-gray-600 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = movementTarget;
                  setMovementTarget(null);
                  await handleApplyMovement(target, movementType, movementQty, movementReason);
                }}
                className="min-h-[42px] px-5 bg-[#A44C5C] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                اعتماد الحركة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive PO Modal */}
      {receivingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-gray-200 space-y-4">
            <div>
              <h4 className="font-bold text-sm text-gray-950">
                استلام بضاعة أمر الشراء {receivingPO.referenceCode}
              </h4>
              <p className="text-[11px] text-gray-500 mt-0.5">
                سيتم إضافة الكمية المستلمة للمخزون وحساب متوسط التكلفة المرجّح بالهللة تلقائياً.
              </p>
            </div>
            <div className="space-y-2.5 max-h-72 overflow-y-auto text-xs">
              {receivingPO.items.map((it) => {
                const remaining = Math.max(0, it.quantity - it.receivedQuantity);
                return (
                  <div key={it.productId} className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{it.productName}</p>
                      <p className="text-[11px] text-gray-500 font-mono">
                        المتبقي للاستلام: {remaining} · تكلفة الوحدة: {it.unitCost} ر.س
                      </p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={remaining}
                      value={receiveQtys[it.productId] ?? remaining}
                      onChange={(e) =>
                        setReceiveQtys((prev) => ({
                          ...prev,
                          [it.productId]: Number(e.target.value)
                        }))
                      }
                      className="w-20 min-h-[40px] bg-white border border-gray-300 rounded-xl text-center font-mono font-bold"
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setReceivingPO(null)}
                className="min-h-[42px] px-4 rounded-xl text-xs font-bold text-gray-600 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isSavingPO}
                onClick={handleConfirmReceivePO}
                className="min-h-[42px] px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                {isSavingPO ? 'جاري الاستلام...' : 'تأكيد الاستلام وتحديث التكلفة'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!supplierToDelete}
        title="تأكيد حذف المورد"
        description={`هل تريدين حذف المورد "${supplierToDelete?.name}" من الدليل؟`}
        confirmLabel="حذف المورد"
        cancelLabel="إلغاء"
        onCancel={() => setSupplierToDelete(null)}
        onConfirm={handleDeleteSupplierConfirmed}
      />
    </div>
  );
}
