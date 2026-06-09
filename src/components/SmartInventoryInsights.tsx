import React, { useMemo } from 'react';
import { ShoppingBag, Star, AlertTriangle, ArrowUpRight, TrendingUp, Sparkles, Coins, PackageOpen } from 'lucide-react';
import { Product, Order } from '../types';

interface SmartInventoryInsightsProps {
  products: Product[];
  orders: Order[];
}

export default function SmartInventoryInsights({
  products = [],
  orders = [],
}: SmartInventoryInsightsProps) {
  const insights = useMemo(() => {
    // Group orders to check velocity
    const quantitiesByProduct: Record<string, number> = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        quantitiesByProduct[item.productId] = (quantitiesByProduct[item.productId] || 0) + item.quantity;
      });
    });

    // 1. Total valuation logic of SULTA warehouses
    const totalEGPValue = products.reduce((sum, p) => sum + (p.priceEG * p.stock), 0);
    const totalSARValue = products.reduce((sum, p) => sum + (p.priceSA * p.stock), 0);
    const totalStockCount = products.reduce((sum, p) => sum + p.stock, 0);

    // 2. Fast-Selling (المنتجات السريعة البيع)
    // Products with high quantities in orders, or stock getting dangerously low (velocity ratio)
    const fastSelling = products
      .map((p) => {
        const sold = quantitiesByProduct[p.id] || 0;
        return { ...p, sold };
      })
      .filter((p) => p.status === 'active' && p.sold > 0)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    // 3. Stagnant dead stock (المنتجات الراكدة)
    // Products with high stock (e.g. > 10) and low-or-zero orders
    const stagnant = products
      .map((p) => {
        const sold = quantitiesByProduct[p.id] || 0;
        return { ...p, sold };
      })
      .filter((p) => p.status === 'active' && p.stock > 10 && p.sold === 0)
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 5);

    // 4. Needs restocking (منتجات تحتاج إعادة توفير)
    // Stock <= 3
    const needsRestock = products
      .filter((p) => p.status === 'active' && p.stock <= 3)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5);

    return {
      totalEGPValue,
      totalSARValue,
      totalStockCount,
      fastSelling,
      stagnant,
      needsRestock,
    };
  }, [products, orders]);

  return (
    <div className="space-y-8 text-right font-sans" dir="rtl">
      {/* Financial Valuation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#FAF5F0] border border-[#DF8A9D]/15 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">حمولة المخازن ومستودع SULTA</span>
            <span className="text-2xl font-black text-[#A44C5C] font-sans">{insights.totalStockCount} قطعة</span>
          </div>
          <PackageOpen size={32} className="text-[#A44C5C] opacity-20" />
        </div>

        <div className="bg-white border border-gray-150 p-6 rounded-2xl">
          <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">تقدير القيمة السوقية (مصر)</span>
          <span className="text-2xl font-black text-gray-900 font-sans">{insights.totalEGPValue.toLocaleString()} EGP</span>
        </div>

        <div className="bg-white border border-gray-150 p-6 rounded-2xl">
          <span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">تقدير القيمة السوقية (السعودية)</span>
          <span className="text-2xl font-black text-gray-900 font-sans">{insights.totalSARValue.toLocaleString()} SAR</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* A. Fast Selling (الأكثر حركة وطلباً) */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs">
          <h4 className="font-serif text-sm font-bold text-gray-900 flex items-center gap-2 mb-4 justify-start">
            <TrendingUp size={16} className="text-emerald-600" />
            <span>منتجات سريعة الدوران (Fast-Selling)</span>
          </h4>
          <div className="space-y-3.5">
            {insights.fastSelling.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs font-sans">لا توجد مبيعات كافية لتصنيف السرعة.</div>
            ) : (
              insights.fastSelling.map((p) => (
                <div key={p.id} className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between text-xs hover:bg-gray-100/50 transition-all">
                  <div className="flex items-center gap-2.5">
                    {p.images.length > 0 ? (
                      <img src={p.images[0]} referrerPolicy="no-referrer" alt="" className="w-10 h-10 rounded-xl object-cover border border-gray-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400">?</div>
                    )}
                    <div>
                      <h5 className="font-bold text-gray-900 line-clamp-1">{p.nameAr}</h5>
                      <span className="text-[10px] text-gray-400 font-sans">المخزون الحالي: {p.stock} قطعة</span>
                    </div>
                  </div>
                  <div className="text-left font-sans">
                    <span className="bg-emerald-50 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                      بيع {p.sold} قطع
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* B. Stagnant count (منتجات راكدة البيع) */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs">
          <h4 className="font-serif text-sm font-bold text-gray-900 flex items-center gap-2 mb-4 justify-start">
            <Coins size={16} className="text-[#A44C5C]" />
            <span>قطع راكدة بالمستودع الكوتور (Stagnant)</span>
          </h4>
          <div className="space-y-3.5">
            {insights.stagnant.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs font-sans">صفر قطع راكدة عالية المخزون ومجمدة ماليّاً!</div>
            ) : (
              insights.stagnant.map((p) => (
                <div key={p.id} className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between text-xs hover:bg-gray-100/50 transition-all">
                  <div className="flex items-center gap-2.5">
                    {p.images.length > 0 ? (
                      <img src={p.images[0]} referrerPolicy="no-referrer" alt="" className="w-10 h-10 rounded-xl object-cover border border-gray-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400">?</div>
                    )}
                    <div>
                      <h5 className="font-bold text-gray-900 line-clamp-1">{p.nameAr}</h5>
                      <span className="text-[10px] text-gray-400 font-sans block">رمز: {p.sku || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="text-left font-sans">
                    <span className="text-rose-600 font-bold">{p.stock} قطية خاملة</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* C. Needs restocking (تحذير نقص حرج) */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs">
          <h4 className="font-serif text-sm font-bold text-gray-900 flex items-center gap-2 mb-4 justify-start">
            <AlertTriangle size={16} className="text-rose-500 animate-pulse" />
            <span>تحتاج إعادة توفير فوري لطلب الخليج ومصر</span>
          </h4>
          <div className="space-y-3.5">
            {insights.needsRestock.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50 text-emerald-850 rounded-2xl border border-emerald-100 text-xs font-sans font-bold">
                ⚜️ مخزون جميع المنتجات في مستوى آمن وممتاز!
              </div>
            ) : (
              insights.needsRestock.map((p) => (
                <div key={p.id} className="p-3 bg-rose-50/40 border border-rose-100 rounded-2xl flex items-center justify-between text-xs hover:bg-rose-50/60 transition-all">
                  <div className="flex items-center gap-2.5">
                    {p.images.length > 0 ? (
                      <img src={p.images[0]} referrerPolicy="no-referrer" alt="" className="w-10 h-10 rounded-xl object-cover border border-gray-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400">?</div>
                    )}
                    <div>
                      <h5 className="font-bold text-gray-900 line-clamp-1">{p.nameAr}</h5>
                      <span className="text-[10px] text-gray-500 font-sans block">التصنيف: {p.categoryAr}</span>
                    </div>
                  </div>
                  <div className="text-left font-sans">
                    <span className="text-red-600 font-bold bg-white px-2.5 py-0.5 rounded-full border border-red-200 block">
                      {p.stock === 0 ? 'نفد تماماً ❌' : `${p.stock} قطع فقط ⚠️`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
