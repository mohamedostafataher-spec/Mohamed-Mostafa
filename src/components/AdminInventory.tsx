import React, { useState, useEffect } from 'react';
import { Package, AlertCircle, Plus, Minus, History, Search, CheckCircle2, ArrowUpDown, TrendingDown, Layers } from 'lucide-react';
import { dbService } from '../services/db';
import { Product, StockMovement, InventoryLog } from '../types';

export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewLogsProductId, setViewLogsProductId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

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

    return () => {
      unmounted = true;
      unsubP();
      unsubM();
    };
  }, []);

  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setNotice({ message, type });
    setTimeout(() => {
      setNotice(null);
    }, 4000);
  };

  const handleAdjustInventory = async (
    product: Product,
    change: number,
    reason: string = 'تعديل يدوي للمخزون',
    variant: string = 'One Size'
  ) => {
    setAdjustingId(product.id);
    try {
      const newStock = Math.max(0, Number(product.stock || 0) + change);
      await dbService.updateProductStock(product.id, product, newStock, reason);
      
      // Optimistic local state update
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: newStock } : p));
      
      showNotice(`تم ${change > 0 ? 'إضافة' : 'خصم'} ${Math.abs(change)} قطع من "${product.nameAr}". المخزون الحالي: ${newStock} قطعة.`);
    } catch (err: any) {
      console.error(err);
      showNotice('حدث خطأ أثناء تعديل المخزون', 'error');
    } finally {
      setAdjustingId(null);
    }
  };

  const filteredProducts = products.filter(p => 
    p.nameAr.includes(searchQuery) || 
    p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalStockPieces = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  const lowStockCount = products.filter(p => Number(p.stock) < 5).length;
  const outOfStockCount = products.filter(p => Number(p.stock) === 0).length;

  return (
    <div className="space-y-6 font-sans animate-fade-in" dir="rtl">
      {/* Header and KPI cards */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-150">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FCF5F6] border border-[#DF8A9D]/30 text-[#A44C5C] flex items-center justify-center shrink-0 shadow-2xs">
              <Layers size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-950 flex items-center gap-2">
                <span>المستودع وحركات المخزون الفعلية (Inventory & Stock Audit)</span>
                <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full font-mono">
                  {totalStockPieces} قطعة إجمالية
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                تتبع حقيقي لكل قطعة يتم إدخالها أو خصمها تلقائياً مع طلبات الشراء
              </p>
            </div>
          </div>
        </div>

        {/* Stock KPI Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-[#FAF8F8] border border-gray-150 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-gray-500 font-bold block">إجمالي القطع بالمستودع</span>
            <div className="text-xl font-black font-mono text-gray-950">
              {totalStockPieces} <span className="text-[10px] font-sans text-gray-400">قطعة</span>
            </div>
          </div>

          <div className="bg-[#FAF8F8] border border-gray-150 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-gray-500 font-bold block">عدد المنتجات النشطة</span>
            <div className="text-xl font-black font-mono text-[#A44C5C]">
              {products.length} <span className="text-[10px] font-sans text-gray-400">موديل</span>
            </div>
          </div>

          <div className="bg-[#FAF8F8] border border-gray-150 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-amber-600 font-bold block flex items-center gap-1">
              <AlertCircle size={13} />
              <span>مخزون حرج (&lt;5 قطع)</span>
            </span>
            <div className="text-xl font-black font-mono text-amber-700">
              {lowStockCount} <span className="text-[10px] font-sans text-gray-400">موديل يوشك على النفاد</span>
            </div>
          </div>

          <div className="bg-[#FAF8F8] border border-gray-150 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-rose-600 font-bold block flex items-center gap-1">
              <TrendingDown size={13} />
              <span>نفدت الكمية تماماً (0)</span>
            </span>
            <div className="text-xl font-black font-mono text-rose-700">
              {outOfStockCount} <span className="text-[10px] font-sans text-gray-400">غير متوفر</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Notice Banner */}
      {notice && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
          notice.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {notice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="ابحث باسم الموديل أو رمز SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl py-2.5 pr-9 pl-4 text-xs focus:bg-white focus:outline-none focus:border-[#A44C5C] transition-all"
          />
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <span className="text-xs font-mono text-gray-400 self-end sm:self-auto">
          المعروض: {filteredProducts.length} من {products.length} منتج
        </span>
      </div>

      {/* Products Stock Inventory Table */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-gray-150 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-gray-950">كتالوج قطع الكوتور ومخزونها بالمستودع</h4>
            <p className="text-xs text-gray-400 mt-0.5">إمكانية التزويد السريع بـ +10 أو +25 قطعة أو تعديل دقيق</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-gray-100/50 text-gray-500 border-b border-gray-200 font-bold text-[11px]">
              <tr>
                <th className="py-4 px-5">المنتج</th>
                <th className="py-4 px-5">القسم</th>
                <th className="py-4 px-5">رمز SKU</th>
                <th className="py-4 px-5 text-center">المخزون الحالي</th>
                <th className="py-4 px-5">حالة التوفر</th>
                <th className="py-4 px-5 text-center">تزويد سريع (+قطع)</th>
                <th className="py-4 px-5 text-center">سجل الحركات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {loading ? (
                <tr><td colSpan={7} className="text-center p-12 text-gray-400">جاري تحميل بيانات المستودع...</td></tr>
              ) : filteredProducts.map(p => {
                const stock = Number(p.stock) || 0;
                const isExpanded = viewLogsProductId === p.id;
                const productMovements = stockMovements.filter(m => m.productId === p.id);

                return (
                  <React.Fragment key={p.id}>
                    <tr className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images?.[0] || '/img/sulta_product_1.png'}
                            alt={p.nameAr}
                            className="w-10 h-10 object-cover rounded-xl border border-gray-200 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-gray-900 block">{p.nameAr}</span>
                            <span className="text-[10px] text-gray-400 font-sans">{p.nameEn}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 text-gray-600 font-medium">
                        {p.categoryAr || 'كوتور'}
                      </td>

                      <td className="py-3.5 px-5 font-mono text-gray-500 text-[11px]">
                        {p.sku || `#${p.id.slice(0, 8)}`}
                      </td>

                      <td className="py-3.5 px-5 text-center">
                        <span className={`font-mono font-black text-sm px-2.5 py-1 rounded-full ${
                          stock === 0 
                            ? 'bg-rose-100 text-rose-800' 
                            : stock < 5 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {stock} قطعة
                        </span>
                      </td>

                      <td className="py-3.5 px-5">
                        {stock === 0 ? (
                          <span className="text-rose-600 flex items-center gap-1 text-[11px] font-bold">
                            <AlertCircle size={13} /> نفدت الكمية
                          </span>
                        ) : stock < 5 ? (
                          <span className="text-amber-600 flex items-center gap-1 text-[11px] font-bold">
                            <AlertCircle size={13} /> مخزون حرج (&lt;5)
                          </span>
                        ) : (
                          <span className="text-emerald-700 text-[11px] font-bold flex items-center gap-1">
                            <CheckCircle2 size={13} /> متوفر وجاهز
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAdjustInventory(p, 10, 'تزويد دفعي سريع بالمستودع (+10)')}
                            disabled={adjustingId === p.id}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                            title="إضافة 10 قطع فوراً"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustInventory(p, 25, 'تزويد دفعة تصنيع جديدة (+25)')}
                            disabled={adjustingId === p.id}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                            title="إضافة 25 قطعة فوراً"
                          >
                            +25
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustInventory(p, -1, 'تسوية يدوية عاجلة (-1)')}
                            disabled={adjustingId === p.id || stock === 0}
                            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer disabled:opacity-30"
                            title="خصم قطعة واحدة"
                          >
                            <Minus size={13} />
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 text-center">
                        <button
                          type="button"
                          onClick={() => setViewLogsProductId(isExpanded ? null : p.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            isExpanded 
                              ? 'bg-[#A44C5C] text-white border-[#A44C5C]' 
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                          }`}
                        >
                          <History size={13} />
                          <span>{isExpanded ? 'إخفاء' : 'الحركات'}</span>
                          {productMovements.length > 0 && (
                            <span className="bg-white/30 text-current px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                              {productMovements.length}
                            </span>
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Movement Audit Log Drawer */}
                    {isExpanded && (
                      <tr className="bg-gray-50/90 border-b border-gray-200">
                        <td colSpan={7} className="p-5">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                              <h5 className="font-bold text-xs text-gray-900 flex items-center gap-2">
                                <History size={14} className="text-[#A44C5C]" />
                                <span>سجل الحركات التفصيلي للمنتج: {p.nameAr}</span>
                              </h5>
                              <span className="text-[11px] text-gray-500 font-mono">
                                إجمالي السجلات: {productMovements.length}
                              </span>
                            </div>

                            {productMovements.length === 0 ? (
                              <div className="py-4 text-center text-xs text-gray-400">
                                لا توجد حركات مخزون مسجلة لهذه القطعة بعد.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                                {productMovements.slice(0, 15).map(m => (
                                  <div key={m.id} className="bg-white p-3 rounded-xl border border-gray-200 space-y-1 text-xs shadow-2xs">
                                    <div className="flex items-center justify-between">
                                      <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-md ${
                                        m.changeQty > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                      }`}>
                                        {m.changeQty > 0 ? `+${m.changeQty}` : m.changeQty} قطعة
                                      </span>
                                      <span className="text-[10px] text-gray-400 font-mono">
                                        {new Date(m.createdAt).toLocaleDateString('ar-SA')}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-gray-700 font-medium">{m.reason || 'تعديل مخزون'}</p>
                                    <div className="text-[10px] text-gray-400 flex items-center justify-between pt-1 border-t border-gray-100">
                                      <span>المسؤول: {m.adminName || 'النظام'}</span>
                                      {m.variant && <span>({m.variant})</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
