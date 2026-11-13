import React, { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Eye,
  ShoppingBag,
  Layers,
  Globe,
  CheckSquare
} from 'lucide-react';
import { Category, Product, Settings } from '../../types';
import { dbService, cleanImgUrl } from '../../services/db';
import { ProductMetric } from '../../utils/analytics';
import {
  CanonicalAdminRole,
  canEditProducts,
  canUpdateStock,
  canDeleteProduct,
  canViewCostPrice
} from '../../utils/rbac';
import { AdminEmptyState, ConfirmModal } from './AdminUI';

interface AdminProductsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: Category[];
  settings: Settings | null;
  adminRole: CanonicalAdminRole;
  adminName?: string;
  productAnalyticsMap: Record<string, ProductMetric>;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  stockFilter: 'all' | 'critical';
  onStockFilterChange: (f: 'all' | 'critical') => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (product: Product) => void;
  onRequestDelete: (product: Product) => void;
  onRequestRestore: () => void;
  onQuickAddStock: (product: Product, amount: number) => void;
  onToggleDiscount: (product: Product, e?: React.MouseEvent) => void;
  toast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function AdminProducts({
  products,
  setProducts,
  categories,
  settings,
  adminRole,
  adminName = 'إدارة المتجر',
  productAnalyticsMap,
  searchQuery,
  onSearchChange,
  stockFilter,
  onStockFilterChange,
  onOpenAddModal,
  onOpenEditModal,
  onRequestDelete,
  onRequestRestore,
  onQuickAddStock,
  onToggleDiscount,
  toast
}: AdminProductsProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<'all' | 'no_image' | 'missing_seo' | 'out_of_stock'>('all');

  // Inline Quick Edits
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [inlinePriceVal, setInlinePriceVal] = useState<string>('');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [inlineStockVal, setInlineStockVal] = useState<string>('');
  const [savingRowId, setSavingRowId] = useState<string | null>(null);

  // Bulk selection & confirmation
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const canEdit = canEditProducts(adminRole);
  const canStock = canUpdateStock(adminRole);
  const canDel = canDeleteProduct(adminRole);
  const showCost = canViewCostPrice(adminRole);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const threshold = p.minStockThreshold ?? 5;
      if (stockFilter === 'critical' && Number(p.stock) > threshold) return false;
      if (statusFilter !== 'all' && (p.status || 'active') !== statusFilter) return false;
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;

      if (healthFilter === 'no_image') {
        const hasImg = Array.isArray(p.images) && p.images.some((i) => typeof i === 'string' && i.trim() !== '');
        if (hasImg) return false;
      } else if (healthFilter === 'missing_seo') {
        if (p.seo?.metaTitleAr && p.seo?.metaDescriptionAr) return false;
      } else if (healthFilter === 'out_of_stock') {
        if (Number(p.stock) > 0) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hit =
          (p.nameAr && p.nameAr.toLowerCase().includes(q)) ||
          (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.slug && p.slug.toLowerCase().includes(q)) ||
          (p.categoryAr && p.categoryAr.toLowerCase().includes(q));
        if (!hit) return false;
      }

      return true;
    });
  }, [products, searchQuery, stockFilter, statusFilter, categoryFilter, healthFilter]);

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const handleSaveInlinePrice = async (p: Product) => {
    const numPrice = Number(inlinePriceVal);
    if (!Number.isFinite(numPrice) || numPrice <= 0) {
      toast?.('يرجى إدخال سعر صحيح أكبر من صفر', 'error');
      return;
    }
    setSavingRowId(p.id);
    try {
      const updated: Product = {
        ...p,
        priceSA: numPrice,
        regularPrice: numPrice,
        discountPercent: 0,
        priceEG: p.priceEG && p.priceSA > 0 ? Math.round(numPrice * (p.priceEG / p.priceSA)) : Math.round(numPrice * 5)
      };
      setProducts((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
      await dbService.saveProduct(updated);
      toast?.(`تم تحديث سعر "${p.nameAr}" إلى ${numPrice} ر.س`, 'success');
      setEditingPriceId(null);
    } catch {
      toast?.('تعذر حفظ السعر الجديد', 'error');
    } finally {
      setSavingRowId(null);
    }
  };

  const handleSaveInlineStock = async (p: Product) => {
    const nextStock = Math.max(0, Math.floor(Number(inlineStockVal)));
    if (!Number.isFinite(nextStock)) {
      toast?.('يرجى إدخال كمية صحيحة', 'error');
      return;
    }
    const oldStock = Number(p.stock || 0);
    const diff = nextStock - oldStock;
    setSavingRowId(p.id);
    try {
      const updated: Product = { ...p, stock: nextStock };
      setProducts((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
      await dbService.updateProductStock(p.id, p, nextStock, 'تعديل سريع من جدول المنتجات', adminName);
      if (diff !== 0) {
        toast?.(`تم تحديث مخزون "${p.nameAr}" إلى ${nextStock} قطعة`, 'success');
      }
      setEditingStockId(null);
    } catch {
      toast?.('تعذر حفظ المخزون الجديد', 'error');
    } finally {
      setSavingRowId(null);
    }
  };

  const handleQuickStatusChange = async (p: Product, nextStatus: Product['status']) => {
    if (!canEdit) return;
    setSavingRowId(p.id);
    try {
      const updated: Product = { ...p, status: nextStatus };
      setProducts((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
      await dbService.saveProduct(updated);
      const label = nextStatus === 'active' ? 'منشور' : nextStatus === 'draft' ? 'مسودة (مخفي)' : 'مؤرشف';
      toast?.(`تم تغيير حالة "${p.nameAr}" إلى ${label}`, 'success');
    } catch {
      toast?.('تعذر تغيير حالة النشر', 'error');
    } finally {
      setSavingRowId(null);
    }
  };

  const handleBulkStatus = async (nextStatus: 'active' | 'draft' | 'archived') => {
    if (!canEdit || selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      const targets = products.filter((p) => selectedIds.includes(p.id));
      for (const p of targets) {
        await dbService.saveProduct({ ...p, status: nextStatus });
      }
      setProducts((prev) => prev.map((p) => (selectedIds.includes(p.id) ? { ...p, status: nextStatus } : p)));
      toast?.(`تم تحديث حالة ${targets.length} منتج بنجاح`, 'success');
      setSelectedIds([]);
    } catch {
      toast?.('حدث خطأ أثناء الإجراء الجماعي', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkAddStock = async (amount: number) => {
    if (!canStock || selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      const targets = products.filter((p) => selectedIds.includes(p.id));
      for (const p of targets) {
        const nextStock = Math.max(0, Number(p.stock || 0) + amount);
        await dbService.updateProductStock(p.id, p, nextStock, `تزويد جماعي (+${amount})`, adminName);
      }
      setProducts((prev) =>
        prev.map((p) => (selectedIds.includes(p.id) ? { ...p, stock: Math.max(0, Number(p.stock || 0) + amount) } : p))
      );
      toast?.(`تمت إضافة +${amount} قطعة لعدد ${targets.length} منتج`, 'success');
      setSelectedIds([]);
    } catch {
      toast?.('حدث خطأ أثناء التزويد الجماعي', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (!canDel || selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      const targets = [...selectedIds];
      for (const id of targets) {
        await dbService.deleteProduct(id);
      }
      setProducts((prev) => prev.filter((p) => !targets.includes(p.id)));
      toast?.(`تم حذف ${targets.length} منتج نهائياً`, 'success');
      setSelectedIds([]);
      setConfirmBulkDelete(false);
    } catch {
      toast?.('تعذر حذف بعض المنتجات', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const statusBadge = (st?: string) => {
    if (st === 'draft') return { label: 'مسودة', cls: 'bg-amber-100 text-amber-900 border-amber-200' };
    if (st === 'archived') return { label: 'مؤرشف', cls: 'bg-gray-200 text-gray-700 border-gray-300' };
    return { label: 'منشور', cls: 'bg-emerald-100 text-emerald-900 border-emerald-200' };
  };

  return (
    <div className="space-y-4 animate-fade-in-rapid" dir="rtl">
      {/* Top Search & Action Controls */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="ابحثي باسم المنتج، SKU، Slug، أو القسم..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl py-2 pr-9 pl-4 text-xs focus:bg-white focus:outline-none focus:border-[#A44C5C]"
            />
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 font-mono px-2">
              المعروض: <strong className="text-gray-950">{filteredProducts.length}</strong>
            </span>
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={onRequestRestore}
                  className="min-h-[44px] bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer border border-gray-200"
                >
                  <RefreshCw size={14} />
                  <span>استعادة المفقود</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenAddModal}
                  className="min-h-[44px] bg-[#A44C5C] hover:bg-[#8E3E4D] text-white text-xs font-bold px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus size={15} />
                  <span>إضافة منتج</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Multi-Filter Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="min-h-[40px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 font-bold text-gray-700"
          >
            <option value="all">كل الحالات</option>
            <option value="active">منشور بالمتجر</option>
            <option value="draft">مسودة (مخفي)</option>
            <option value="archived">مؤرشف</option>
          </select>

          <select
            value={stockFilter}
            onChange={(e) => onStockFilterChange(e.target.value as any)}
            className="min-h-[40px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 font-bold text-gray-700"
          >
            <option value="all">كل مستويات المخزون</option>
            <option value="critical">مخزون حرج (&lt;= الحد الأدنى)</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="min-h-[40px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 font-bold text-gray-700"
          >
            <option value="all">كل الأقسام</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.nameAr}
              </option>
            ))}
          </select>

          <select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value as any)}
            className="min-h-[40px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 font-bold text-gray-700"
          >
            <option value="all">كل الجاهزية</option>
            <option value="out_of_stock">نفد المخزون (0)</option>
            <option value="no_image">بدون صور</option>
            <option value="missing_seo">SEO غير مكتمل</option>
          </select>

          {(statusFilter !== 'all' || stockFilter !== 'all' || categoryFilter !== 'all' || healthFilter !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                onStockFilterChange('all');
                setCategoryFilter('all');
                setHealthFilter('all');
                onSearchChange('');
              }}
              className="min-h-[40px] px-3 text-xs font-bold text-[#A44C5C] hover:bg-[#FCF5F6] rounded-xl cursor-pointer"
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-[#111827] text-white rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-bold">
            <CheckSquare size={16} className="text-rose-300" />
            <span>تم تحديد {selectedIds.length} قطعة</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <>
                <button
                  type="button"
                  disabled={isBulkProcessing}
                  onClick={() => handleBulkStatus('active')}
                  className="min-h-[40px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold cursor-pointer"
                >
                  نشر المحدد
                </button>
                <button
                  type="button"
                  disabled={isBulkProcessing}
                  onClick={() => handleBulkStatus('draft')}
                  className="min-h-[40px] px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-bold cursor-pointer"
                >
                  إخفاء (مسودة)
                </button>
              </>
            )}
            {canStock && (
              <button
                type="button"
                disabled={isBulkProcessing}
                onClick={() => handleBulkAddStock(10)}
                className="min-h-[40px] px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold cursor-pointer"
              >
                +10 مخزون
              </button>
            )}
            {canDel && (
              <button
                type="button"
                disabled={isBulkProcessing}
                onClick={() => setConfirmBulkDelete(true)}
                className="min-h-[40px] px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold cursor-pointer"
              >
                حذف جماعي
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="min-h-[40px] px-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 ? (
        <AdminEmptyState
          title={searchQuery ? 'لا توجد منتجات مطابقة' : 'لا توجد منتجات حالياً'}
          description="جرّبي تغيير الفلاتر أو إضافة قطعة جديدة إلى الكتالوج."
          icon={<ShoppingBag size={26} />}
        />
      ) : (
        <>
          {/* Mobile Cards (< md) */}
          <div className="md:hidden space-y-3">
            {filteredProducts.map((p) => {
              const eff = dbService.getProductActualPrice(p, 'SA', settings);
              const threshold = p.minStockThreshold ?? 5;
              const isSelected = selectedIds.includes(p.id);
              const st = statusBadge(p.status);
              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl border p-4 shadow-2xs space-y-3 ${
                    isSelected ? 'border-[#A44C5C] ring-1 ring-[#A44C5C]' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(p.id)}
                      className="w-5 h-5 mt-1 accent-[#A44C5C] cursor-pointer"
                      aria-label={`تحديد ${p.nameAr}`}
                    />
                    <div className="w-16 h-20 rounded-xl bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                      {p.images?.[0] ? (
                        <img src={cleanImgUrl(p.images[0], p.category)} alt={p.nameAr} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold">بدون صورة</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-gray-950 truncate">{p.nameAr}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${st.cls}`}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{p.categoryAr || p.category}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-sm text-[#A44C5C]">{eff.unitPrice} ر.س</span>
                        {showCost && p.costPrice !== undefined && (
                          <span className="text-[11px] text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md font-mono">
                            التكلفة: {p.costPrice}
                          </span>
                        )}
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded-md text-[11px] ${
                            Number(p.stock) === 0
                              ? 'bg-rose-100 text-rose-800'
                              : Number(p.stock) <= threshold
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          المخزون: {p.stock}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                    {canStock && (
                      <button
                        type="button"
                        onClick={() => onQuickAddStock(p, 10)}
                        className="min-h-[44px] px-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold cursor-pointer"
                      >
                        +10 مخزون
                      </button>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => onOpenEditModal(p)}
                        className="flex-1 min-h-[44px] px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 size={14} />
                        <span>تعديل شامل</span>
                      </button>
                    )}
                    {canDel && (
                      <button
                        type="button"
                        onClick={() => onRequestDelete(p)}
                        className="min-w-[44px] min-h-[44px] px-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center cursor-pointer"
                        aria-label={`حذف ${p.nameAr}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#F8F9FA] text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 accent-[#A44C5C] cursor-pointer"
                        aria-label="تحديد جميع المنتجات"
                      />
                    </th>
                    <th className="py-3 px-3 font-bold">القطعة</th>
                    <th className="py-3 px-3 font-bold">الحالة</th>
                    <th className="py-3 px-3 font-bold">السعر السريع (ر.س)</th>
                    {showCost && <th className="py-3 px-3 font-bold text-purple-900">التكلفة</th>}
                    <th className="py-3 px-3 font-bold">المخزون (تعديل سريع)</th>
                    <th className="py-3 px-3 font-bold">التفاعل وSEO</th>
                    <th className="py-3 px-3 font-bold text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((p) => {
                    const eff = dbService.getProductActualPrice(p, 'SA', settings);
                    const threshold = p.minStockThreshold ?? 5;
                    const pMetric = productAnalyticsMap[p.id];
                    const hasSeo = Boolean(p.seo?.metaTitleAr && p.seo?.metaDescriptionAr);
                    const hasImage = Array.isArray(p.images) && p.images.some((i) => i && i.trim() !== '');
                    const isSelected = selectedIds.includes(p.id);

                    return (
                      <tr key={p.id} className={`hover:bg-gray-50/80 transition-colors ${isSelected ? 'bg-[#FCF5F6]/60' : ''}`}>
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(p.id)}
                            className="w-4 h-4 accent-[#A44C5C] cursor-pointer"
                          />
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-14 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                              {hasImage ? (
                                <img src={cleanImgUrl(p.images[0], p.category)} alt={p.nameAr} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[9px] text-amber-700 bg-amber-50 font-bold text-center">
                                  بدون صورة
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-gray-950 block">{p.nameAr}</span>
                              <span className="text-[11px] text-gray-500 block">{p.categoryAr || p.category}</span>
                              {p.sku && <span className="text-[10px] font-mono text-gray-400">{p.sku}</span>}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          {canEdit ? (
                            <select
                              disabled={savingRowId === p.id}
                              value={p.status || 'active'}
                              onChange={(e) => handleQuickStatusChange(p, e.target.value as Product['status'])}
                              className={`min-h-[36px] px-2.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                                statusBadge(p.status).cls
                              }`}
                            >
                              <option value="active">منشور</option>
                              <option value="draft">مسودة</option>
                              <option value="archived">مؤرشف</option>
                            </select>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${statusBadge(p.status).cls}`}>
                              {statusBadge(p.status).label}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          {editingPriceId === p.id ? (
                            <div className="flex items-center gap-1" dir="ltr">
                              <input
                                type="number"
                                min="1"
                                autoFocus
                                value={inlinePriceVal}
                                onChange={(e) => setInlinePriceVal(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveInlinePrice(p);
                                  if (e.key === 'Escape') setEditingPriceId(null);
                                }}
                                className="w-20 min-h-[36px] px-2 text-xs border border-[#A44C5C] rounded-lg font-mono text-center"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveInlinePrice(p)}
                                className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg bg-emerald-600 text-white cursor-pointer"
                              >
                                <Check size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPriceId(null)}
                                className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg bg-gray-200 text-gray-700 cursor-pointer"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={!canEdit}
                                  onClick={() => {
                                    if (!canEdit) return;
                                    setEditingPriceId(p.id);
                                    setInlinePriceVal(String(eff.unitPrice));
                                  }}
                                  className="font-mono font-black text-sm text-[#A44C5C] hover:underline cursor-pointer disabled:cursor-default"
                                  title={canEdit ? 'اضغطي لتعديل السعر السريع' : undefined}
                                >
                                  {eff.unitPrice} ر.س
                                </button>
                                {eff.hasDiscount && (
                                  <span className="text-[11px] font-mono text-gray-400 line-through">{eff.originalPrice}</span>
                                )}
                              </div>
                              {(p.discountPercent || 0) > 0 && canEdit && (
                                <button
                                  type="button"
                                  onClick={(e) => onToggleDiscount(p, e)}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer ${
                                    p.discountStatus !== 'inactive' && p.isDiscountActive !== false
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : 'bg-rose-50 text-rose-800 border-rose-200'
                                  }`}
                                >
                                  خصم {p.discountPercent}% ({p.discountStatus !== 'inactive' && p.isDiscountActive !== false ? 'شغال' : 'متوقف'})
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {showCost && (
                          <td className="py-3 px-3 font-mono font-bold text-purple-900">
                            {p.costPrice !== undefined ? `${p.costPrice} ر.س` : <span className="text-gray-400">-</span>}
                          </td>
                        )}

                        <td className="py-3 px-3">
                          {editingStockId === p.id ? (
                            <div className="flex items-center gap-1" dir="ltr">
                              <input
                                type="number"
                                min="0"
                                autoFocus
                                value={inlineStockVal}
                                onChange={(e) => setInlineStockVal(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveInlineStock(p);
                                  if (e.key === 'Escape') setEditingStockId(null);
                                }}
                                className="w-16 min-h-[36px] px-2 text-xs border border-[#A44C5C] rounded-lg font-mono text-center"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveInlineStock(p)}
                                className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg bg-emerald-600 text-white cursor-pointer"
                              >
                                <Check size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingStockId(null)}
                                className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg bg-gray-200 text-gray-700 cursor-pointer"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={!canStock}
                                onClick={() => {
                                  if (!canStock) return;
                                  setEditingStockId(p.id);
                                  setInlineStockVal(String(p.stock || 0));
                                }}
                                className={`font-mono font-bold px-2.5 py-1 rounded-lg text-xs cursor-pointer disabled:cursor-default ${
                                  Number(p.stock) === 0
                                    ? 'bg-rose-100 text-rose-800'
                                    : Number(p.stock) <= threshold
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                }`}
                                title={canStock ? `اضغطي لتعديل المخزون (الحد الأدنى: ${threshold})` : undefined}
                              >
                                {p.stock} قطعة
                              </button>
                              {Number(p.stock) <= threshold && (
                                <span title={`وصل للحد الأدنى (${threshold})`} className="text-amber-600">
                                  <AlertTriangle size={14} />
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <div className="space-y-1 text-[10.5px]">
                            <div className="flex items-center gap-2 text-gray-600 font-mono">
                              <span className="flex items-center gap-1">
                                <Eye size={11} /> {pMetric?.views || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Layers size={11} /> {pMetric?.ordersCount || 0} طلب
                              </span>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold ${
                                hasSeo ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                              }`}
                            >
                              <Globe size={10} />
                              <span>{hasSeo ? 'SEO مكتمل' : 'SEO ناقص'}</span>
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => onOpenEditModal(p)}
                                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl cursor-pointer"
                                title="تعديل المنتج وSEO والصور"
                                aria-label={`تعديل ${p.nameAr}`}
                              >
                                <Edit2 size={15} />
                              </button>
                            )}
                            {canDel && (
                              <button
                                type="button"
                                onClick={() => onRequestDelete(p)}
                                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl cursor-pointer"
                                title="حذف المنتج"
                                aria-label={`حذف ${p.nameAr}`}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <ConfirmModal
        isOpen={confirmBulkDelete}
        title="تأكيد الحذف الجماعي"
        description={`سيتم حذف ${selectedIds.length} منتج نهائياً من قاعدة البيانات والمتجر. هذا الإجراء لا يمكن التراجع عنه.`}
        confirmLabel="نعم، حذف المحدد"
        cancelLabel="إلغاء"
        isLoading={isBulkProcessing}
        onCancel={() => setConfirmBulkDelete(false)}
        onConfirm={handleConfirmBulkDelete}
      />
    </div>
  );
}
