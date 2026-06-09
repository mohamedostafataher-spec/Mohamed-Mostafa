import React, { useState } from 'react';
import { Sparkles, ArrowLeftRight, HelpCircle, Layers, Star, Heart } from 'lucide-react';
import { Product, Collection } from '../types';
import { cleanImgUrl } from '../services/db';

interface SultaCollectionsProps {
  collections: Collection[];
  categories: any[];
  products: Product[];
  country: 'EG' | 'SA';
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  setTab: (tab: string) => void;
}

export default function SultaCollections({
  collections,
  categories,
  products,
  country,
  favorites,
  toggleFavorite,
  onSelectProduct,
  setTab
}: SultaCollectionsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  const currencyLabel = country === 'EG' ? 'EGP' : 'SAR';

  // Extract count of items per category and collection
  const getProductsByCategory = (catSlug: string) => {
    return products.filter(p => p.status === 'active' && (p.category === catSlug || p.categoryAr === catSlug));
  };

  const getProductsByCollection = (collName: string) => {
    return products.filter(p => p.status === 'active' && p.collection === collName);
  };

  // Filtered list of products based on current selection
  const displayedProducts = products.filter(p => {
    if (p.status !== 'active') return false;
    if (selectedCategory && p.category !== selectedCategory && p.categoryAr !== selectedCategory) return false;
    if (selectedCollection && p.collection !== selectedCollection) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-right" dir="rtl">
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <span className="text-[10px] text-[#A44C5C] font-semibold tracking-[0.3em] uppercase block">
          ✦ LES CHEFS-D'ŒUVRE DE SULTA ✦
        </span>
        <h2 className="font-serif text-4xl font-light text-[#0B0B0B] tracking-wide">
          مجموعات وتشكيلات SULTA الحصرية
        </h2>
        <div className="w-16 h-[1px] bg-[#A44C5C]/30 mx-auto my-3" />
        <p className="text-gray-500 text-xs leading-relaxed max-w-lg mx-auto">
          تصفحي روائع الفخامة المصممة بعناية فائقة من نسيج الحرير الإيطالي والمخمل الملكي الصافي. أطقم وتصاميم تليق بوقارك وتمنحك ليالٍ ناعمة لا تضاهى.
        </p>
      </div>

      {/* Grid of Collections */}
      <div className="mb-16">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-8">
          <h3 className="font-serif text-lg font-medium text-[#0B0B0B]">التشكيلات الموسمية كوتور</h3>
          {selectedCollection && (
            <button 
              onClick={() => setSelectedCollection(null)} 
              className="text-xs text-[#A44C5C] font-semibold hover:underline"
            >
              عرض جميع التشكيلات ✕
            </button>
          )}
        </div>

        {collections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((coll) => {
              const matchedCount = getProductsByCollection(coll.nameEn).length || getProductsByCollection(coll.nameAr).length;
              const normalizedImg = cleanImgUrl(coll.imageUrl, 'collections');

              return (
                <div
                  key={coll.id}
                  onClick={() => {
                    setSelectedCollection(coll.nameEn);
                    setSelectedCategory(null);
                  }}
                  className={`group relative aspect-[14/9] rounded-[2rem] overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-700 border ${
                    selectedCollection === coll.nameEn ? 'border-[#A44C5C] ring-2 ring-[#A44C5C]/20' : 'border-[#DF8A9D]/10'
                  }`}
                >
                  <div className="absolute inset-0 bg-white">
                    <img
                      src={normalizedImg}
                      alt={coll.nameAr}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[1200ms] opacity-90"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent group-hover:from-black/75 transition-all duration-500" />
                  </div>

                  <div className="absolute inset-x-6 bottom-6 text-white text-right space-y-1">
                    <span className="text-[9px] tracking-widest text-[#F6E7A6] font-bold uppercase">
                      COLLECTION ✦ {matchedCount} قطع فاخرة
                    </span>
                    <h4 className="font-serif text-lg sm:text-xl font-light">{coll.nameAr}</h4>
                    {coll.descriptionAr && (
                      <p className="text-gray-300 text-[10px] sm:text-xs font-light line-clamp-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {coll.descriptionAr}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-[#FAF5F0] rounded-3xl text-xs text-gray-400 italic">
            لا توجد تشكيلات نشطة حالياً. يرجى تفعيلها من لوحة الإدارة.
          </div>
        )}
      </div>

      {/* Grid of Categories */}
      <div className="mb-16">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-8">
          <h3 className="font-serif text-lg font-medium text-[#0B0B0B]">أقسام البوتيك الفخمة</h3>
          {selectedCategory && (
            <button 
              onClick={() => setSelectedCategory(null)} 
              className="text-xs text-[#A44C5C] font-semibold hover:underline"
            >
              عرض جميع الأقسام ✕
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.slice(0, 4).map((cat) => {
            const matchedCount = getProductsByCategory(cat.slug).length;
            const normalizedImg = cleanImgUrl(cat.imageUrl, cat.slug);

            return (
              <div
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.slug);
                  setSelectedCollection(null);
                }}
                className={`group relative aspect-[4/5] rounded-[2.5rem] overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-700 border ${
                  selectedCategory === cat.slug ? 'border-[#A44C5C] ring-2 ring-[#A44C5C]/20' : 'border-[#DF8A9D]/10'
                }`}
              >
                <div className="absolute inset-0 bg-white">
                  <img
                    src={normalizedImg}
                    alt={cat.nameAr}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[1200ms] opacity-90"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent group-hover:from-black/70 transition-all duration-500" />
                </div>

                <div className="absolute bottom-5 left-5 right-5 p-4 rounded-3xl bg-black/45 backdrop-blur-sm border border-white/10 text-center transform group-hover:-translate-y-1 transition-all duration-500">
                  <h4 className="text-[#F6E7A6] font-serif text-xs md:text-sm uppercase font-bold leading-tight">
                    {cat.nameEn}
                  </h4>
                  <div className="h-[1px] w-6 bg-[#F6E7A6]/40 mx-auto my-1.5" />
                  <h5 className="text-[10px] text-white font-medium">
                    {cat.nameAr}
                  </h5>
                  <span className="text-[7.5px] text-gray-300 font-bold tracking-widest block mt-1">
                    {matchedCount} منتجات مجهّزة
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Matching Products Area */}
      <div className="pt-8">
        <div className="border-b border-gray-150 pb-4 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-serif text-xl font-medium text-[#0B0B0B]">
              {selectedCollection ? `معروضات تشكيلة: ${selectedCollection}` : selectedCategory ? `معروضات قسم: ${selectedCategory}` : 'معروضات البوتيك والحرير المتوفرة'}
            </h3>
            <p className="text-gray-400 text-3xs sm:text-2xs mt-1">
              نعرض {displayedProducts.length} من أصل {products.length} قطعة كوتور أصلية.
            </p>
          </div>
          {(selectedCategory || selectedCollection) && (
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedCollection(null);
              }}
              className="text-xs text-gray-500 hover:text-black font-semibold border border-gray-300 px-4 py-1.5 rounded-full hover:bg-gray-50 transition-all"
            >
              عرض الكل وإلغاء الفرز
            </button>
          )}
        </div>

        {displayedProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {displayedProducts.map((prod) => {
              const priceVal = country === 'EG' ? prod.priceEG : prod.priceSA;
              const imgToUse = cleanImgUrl(prod.images[0], prod.category);

              return (
                <div
                  key={prod.id}
                  onClick={() => onSelectProduct(prod)}
                  className="group flex flex-col h-full bg-white rounded-2xl p-3 overflow-hidden border border-[#DF8A9D]/10 hover:border-[#DF8A9D]/30 transition-all duration-300 hover:shadow-md relative select-none cursor-pointer"
                >
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-0.5 bg-white/85 backdrop-blur-xs px-2 py-0.5 rounded-full text-[9px] text-[#A44C5C] font-serif tracking-widest font-semibold border border-[#DF8A9D]/15">
                    <Star size={8} className="fill-[#A44C5C] text-[#A44C5C]" />
                    <span>{prod.rating || 5}</span>
                  </div>

                  <div className="absolute top-4 right-4 z-10">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(prod.id); }} 
                      className="p-1 bg-white/90 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-[#DF8A9D] border border-gray-100 cursor-pointer"
                    >
                      <Heart size={12} className={favorites.includes(prod.id) ? "fill-[#DF8A9D] text-[#DF8A9D]" : ""} />
                    </button>
                  </div>

                  <div className="relative aspect-[3/4] overflow-hidden bg-[#FAF5F0] rounded-xl mb-3">
                    <img
                      src={imgToUse}
                      alt={prod.nameAr}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[800ms] opacity-95"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="space-y-1 text-center mt-auto flex flex-col items-center">
                    <span className="text-[8px] uppercase tracking-widest font-sans px-2.5 py-0.5 rounded-full bg-[#FAF4F5] text-[#A44C5C] inline-block font-semibold">
                      {prod.isBestSeller ? 'الأكثر مبيعاً' : 'كوتور'}
                    </span>
                    <h4 className="text-3xs sm:text-2xs md:text-xs font-semibold text-[#0B0B0B] line-clamp-1 font-serif tracking-wide text-center">
                      {country === 'EG' ? prod.nameAr : prod.nameEn}
                    </h4>
                    <span className="font-sans font-semibold text-3xs sm:text-2xs md:text-xs text-[#A44C5C]">
                      {priceVal.toLocaleString()} {currencyLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-neutral-50 rounded-2xl text-gray-400 text-xs italic">
            لا توجد منتجات ضمن التحديد المحدد حالياً. تصفحي قسماً آخر.
          </div>
        )}
      </div>
    </div>
  );
}
