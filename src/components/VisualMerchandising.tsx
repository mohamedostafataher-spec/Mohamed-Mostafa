import React, { useMemo, useState } from 'react';
import { Eye, Layers, Star, Plus, ThumbsUp, Sparkles, Pin, CheckCircle2, ChevronRight, ListCollapse, ToggleLeft, ToggleRight } from 'lucide-react';
import { Product, Collection } from '../types';
import { dbService } from '../services/db';

interface VisualMerchandisingProps {
  products: Product[];
  collections: Collection[];
  onProductUpdate?: () => void;
}

export default function VisualMerchandising({
  products = [],
  collections = [],
  onProductUpdate,
}: VisualMerchandisingProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'merchandising' | 'collections_engine'>('merchandising');
  
  // States corresponding to dynamic collection parameters
  const dynamicCollections = useMemo(() => {
    // 1. Newest (الأحدث وصلاً)
    const newest = [...products]
      .filter((p) => p.status === 'active')
      .slice(0, 4);

    // 2. Best Sellers (الأكثر مبيعاً)
    const bestSellers = products
      .filter((p) => p.status === 'active' && p.isBestSeller)
      .slice(0, 4);

    // 3. Top Rated (الأعلى تقييماً)
    const topRated = [...products]
      .filter((p) => p.status === 'active')
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4);

    return {
      newest,
      bestSellers,
      topRated,
    };
  }, [products]);

  const handleToggleFeature = async (product: Product, field: 'featured' | 'isBestSeller') => {
    setUpdatingId(product.id);
    try {
      const updatedValue = !product[field];
      await dbService.saveProduct({
        ...product,
        [field]: updatedValue,
      });
      if (onProductUpdate) onProductUpdate();
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الاتصال بقاعدة البيانات.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateStatus = async (product: Product, nextStatus: 'active' | 'draft' | 'archived') => {
    setUpdatingId(product.id);
    try {
      await dbService.saveProduct({
        ...product,
        status: nextStatus as any,
      });
      if (onProductUpdate) onProductUpdate();
    } catch (e) {
      console.error(e);
      alert('فشل تحديث حالة المنتج.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Category Toggle Tabs */}
      <div className="flex border-b border-gray-100 pb-px">
        <button
          onClick={() => setActiveTab('merchandising')}
          className={`px-5 py-3 font-serif text-sm font-semibold border-b-2 tracking-wide transition-all ${
            activeTab === 'merchandising'
              ? 'border-[#A34A59] text-[#A34A59]'
              : 'border-transparent text-gray-400 hover:text-gray-650'
          }`}
        >
          مركز الترتيب والعرض البصري (Visual Merchandising)
        </button>
        <button
          onClick={() => setActiveTab('collections_engine')}
          className={`px-5 py-3 font-serif text-sm font-semibold border-b-2 tracking-wide transition-all ${
            activeTab === 'collections_engine'
              ? 'border-[#A34A59] text-[#A34A59]'
              : 'border-transparent text-gray-400 hover:text-gray-650'
          }`}
        >
          محرك التشكيلات الديناميكية (Dynamic Collections Engine)
        </button>
      </div>

      {activeTab === 'merchandising' ? (
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-serif text-sm font-bold text-gray-900 flex items-center gap-2 justify-start">
              <Pin size={16} className="text-[#A44C5C]" />
              <span>إدارة تباينات وتثبيت معروض الواجهة الرئيسية</span>
            </h3>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
              تحكم بتبويب "القطع المميزة" و"تبويب الأكثر طلباً" لترتيب تدفق الفساتين الكوتور في المعرض، والتحكم في حالتها للنشر المباشر.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.slice(0, 15).map((p) => {
              const loadingThis = updatingId === p.id;
              return (
                <div key={p.id} className={`p-4 rounded-2xl border transition-all duration-300 ${
                  p.status === 'draft' ? 'bg-gray-50 border-gray-100 opacity-70' : 'bg-white border-gray-150 hover:shadow-md'
                }`}>
                  <div className="flex gap-3">
                    {p.images && p.images.length > 0 ? (
                      <img src={p.images[0]} referrerPolicy="no-referrer" alt="" className="w-16 h-20 rounded-xl object-cover border border-gray-100 shrink-0" />
                    ) : (
                      <div className="w-16 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-gray-300 shrink-0">?</div>
                    )}

                    <div className="space-y-1.5 flex-1 select-none">
                      <h4 className="font-bold text-gray-900 text-xs line-clamp-1">{p.nameAr}</h4>
                      <p className="text-[10px] text-gray-400 font-sans">{p.categoryAr}</p>
                      
                      {/* Price fields */}
                      <div className="text-[11px] font-sans font-black text-gray-700">
                        {p.priceSA} SAR / {p.priceEG} EGP
                      </div>
                    </div>
                  </div>

                  {/* Merchandising Toggles */}
                  <div className="pt-3 border-t border-gray-100 mt-4 flex justify-between items-center text-[10px] text-gray-600 gap-2">
                    <button
                      onClick={() => handleToggleFeature(p, 'featured')}
                      disabled={loadingThis}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all font-semibold ${
                        p.featured 
                          ? 'bg-[#A44C5C]/10 text-[#A44C5C] font-bold' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <Sparkles size={11} />
                      <span>{p.featured ? 'مثبت بالرئيسية ✦' : 'تثبيت بالرئيسية'}</span>
                    </button>

                    <button
                      onClick={() => handleToggleFeature(p, 'isBestSeller')}
                      disabled={loadingThis}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all font-semibold ${
                        p.isBestSeller 
                          ? 'bg-amber-50 text-amber-700 font-bold border border-amber-200' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <ThumbsUp size={11} />
                      <span>{p.isBestSeller ? 'الأشيع طلباً 🔥' : 'وضع كأشيع طلباً'}</span>
                    </button>
                  </div>

                  {/* Operational Status selector */}
                  <div className="mt-3 flex gap-1 bg-gray-50 p-1 rounded-lg text-[9px] font-bold">
                    <button
                      onClick={() => handleUpdateStatus(p, 'active')}
                      disabled={loadingThis}
                      className={`flex-1 text-center py-1 rounded-md transition-all ${
                        p.status === 'active' ? 'bg-[#A44C5C] text-white shadow-xs' : 'text-gray-400 hover:text-gray-650'
                      }`}
                    >
                      منشور
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(p, 'draft')}
                      disabled={loadingThis}
                      className={`flex-1 text-center py-1 rounded-md transition-all ${
                        p.status === 'draft' ? 'bg-gray-700 text-white shadow-xs' : 'text-gray-400 hover:text-gray-650'
                      }`}
                    >
                      مسودة
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(p, 'archived')}
                      disabled={loadingThis}
                      className={`flex-1 text-center py-1 rounded-md transition-all ${
                        p.status === 'archived' ? 'bg-red-600 text-white shadow-xs' : 'text-gray-400 hover:text-gray-650'
                      }`}
                    >
                      مؤرشف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-serif text-sm font-bold text-gray-900 flex items-center gap-2 justify-start">
              <Layers size={16} className="text-[#A44C5C]" />
              <span>مولد التشكيلات الذكية والأقسام المجمعة آليّاً</span>
            </h3>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
              تقوم SULTA بتصنيف الموديلات أوتوماتيكياً استناداً لمشاعر وإبداءات الشراء والمشاهدات الحقيقية دون تدخل بشري، مما يوفر دائماً لافتات تسوق طازجة تزيد المبيعات.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-xs">
            {/* T-1: Newest Gowns */}
            <div className="bg-[#FAF5F0]/50 border border-[#DF8A9D]/10 p-5 rounded-2.5xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-[#DF8A9D]/10">
                <span className="font-serif font-black text-[#A34A59]">أحدث فساتين كوتور ✦ (آلي)</span>
                <span className="bg-[#A34A59] text-white text-[9px] px-2 py-0.5 rounded-full">New Arrivals</span>
              </div>
              <div className="space-y-2.5">
                {dynamicCollections.newest.map((p) => (
                  <div key={p.id} className="flex gap-2 items-center bg-white p-2 border border-gray-100 rounded-xl">
                    <img src={p.images?.[0]} referrerPolicy="no-referrer" alt="" className="w-8 h-10 rounded-lg object-cover" />
                    <span className="font-bold text-gray-900 line-clamp-1">{p.nameAr}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* T-2: Best Sellers */}
            <div className="bg-amber-50/20 border border-amber-100 p-5 rounded-2.5xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-amber-150">
                <span className="font-serif font-black text-amber-800">الأشيع طلباً والأسرع دوراناً 🔥</span>
                <span className="bg-amber-800 text-white text-[9px] px-2 py-0.5 rounded-full">Best Sellers</span>
              </div>
              <div className="space-y-2.5">
                {dynamicCollections.bestSellers.map((p) => (
                  <div key={p.id} className="flex gap-2 items-center bg-white p-2 border border-gray-100 rounded-xl">
                    <img src={p.images?.[0]} referrerPolicy="no-referrer" alt="" className="w-8 h-10 rounded-lg object-cover" />
                    <span className="font-bold text-gray-900 line-clamp-1">{p.nameAr}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* T-3: Top Rated */}
            <div className="bg-indigo-50/10 border border-indigo-100 p-5 rounded-2.5xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-indigo-150">
                <span className="font-serif font-black text-indigo-800">الأعلى مراجعة وتقييماً بمجتمعنا ⭐</span>
                <span className="bg-indigo-800 text-white text-[9px] px-2 py-0.5 rounded-full">Top Rated</span>
              </div>
              <div className="space-y-2.5">
                {dynamicCollections.topRated.map((p) => (
                  <div key={p.id} className="flex gap-2 items-center bg-white p-2 border border-gray-100 rounded-xl">
                    <img src={p.images?.[0]} referrerPolicy="no-referrer" alt="" className="w-8 h-10 rounded-lg object-cover" />
                    <span className="font-bold text-gray-900 line-clamp-1">{p.nameAr}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
