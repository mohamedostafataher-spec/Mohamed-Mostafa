import React from 'react';
import { Star, Heart, Flame, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { cleanImgUrl } from '../services/db';

interface TrendingNowProps {
  products: Product[];
  country: 'EG' | 'SA';
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
}

export default function TrendingNow({
  products,
  country,
  favorites,
  toggleFavorite,
  onSelectProduct
}: TrendingNowProps) {
  const currencyLabel = country === 'EG' ? 'EGP' : 'SAR';

  // Sort by rating or bestSeller flag
  const trending = [...products]
    .filter(p => p.status === 'active')
    .sort((a, b) => {
      // Prioritize highly rated, then best sellers
      const ratingDiff = (b.rating || 5) - (a.rating || 5);
      if (Math.abs(ratingDiff) > 0.1) return ratingDiff;
      return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-right" dir="rtl">
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <div className="flex justify-center items-center gap-1 text-[#A44C5C] text-xs font-serif tracking-widest font-bold">
          <Flame size={14} className="text-[#A44C5C] animate-pulse" />
          <span>TRENDING NOW</span>
        </div>
        <h2 className="font-serif text-3xl md:text-4xl font-light text-[#0B0B0B] tracking-wide">
          القطع الأكثر رواجاً | Trending Now
        </h2>
        <div className="w-16 h-[1px] bg-[#A44C5C]/30 mx-auto my-3" />
        <p className="text-gray-500 text-xs leading-relaxed max-w-lg mx-auto">
          التصاميم الأكثر حديثاً وبحثاً من قبل سيدات الصالون الفاخر. بيجامات الحرير المطرزة بأربطة الدانتيل والتصاميم الفريدة التي نفدت كمياتها وتُعاد صياغتها مجدداً بشغف.
        </p>
      </div>

      {/* Grid List */}
      {trending.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {trending.map((prod, idx) => {
            const priceVal = country === 'EG' ? prod.priceEG : prod.priceSA;
            const imgToUse = cleanImgUrl(prod.images[0], prod.category);
            // Simulate realistic popularity metrics using ID or indexes safely
            const satisfactionPct = 95 + (idx % 5);

            return (
              <div
                key={prod.id}
                onClick={() => onSelectProduct(prod)}
                className="group flex flex-col h-full bg-white rounded-2xl p-3 overflow-hidden border border-[#DF8A9D]/10 hover:border-[#DF8A9D]/30 transition-all duration-300 hover:shadow-md relative select-none cursor-pointer"
              >
                {/* Simulated engagement sparkler */}
                <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-1">
                  <div className="flex items-center gap-0.5 bg-rose-50/90 backdrop-blur-xs px-2 py-0.5 rounded-full text-[8px] text-[#A44C5C] font-semibold border border-rose-100">
                    <span>🔥 {satisfactionPct}% يفضّلنه</span>
                  </div>
                </div>
                
                {/* Favorite Toggle Icon */}
                <div className="absolute top-4 right-4 z-10">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(prod.id); }} 
                    className="p-1 bg-white/90 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-[#DF8A9D] border border-gray-100 cursor-pointer"
                  >
                    <Heart size={12} className={favorites.includes(prod.id) ? "fill-[#DF8A9D] text-[#DF8A9D]" : ""} />
                  </button>
                </div>

                {/* Cover Image */}
                <div className="relative aspect-[3/4] overflow-hidden bg-[#FAF5F0] rounded-xl mb-3">
                  <img
                    src={imgToUse}
                    alt={prod.nameAr}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[800ms] opacity-95"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Description Bottom block */}
                <div className="space-y-1 text-center mt-auto flex flex-col items-center">
                  <span className="text-[7.5px] uppercase tracking-widest text-[#A44C5C] font-bold font-sans">
                    طلب عالٍ ✦ HIGH DEMAND
                  </span>
                  <h4 className="text-3xs sm:text-2xs md:text-xs font-semibold text-[#0B0B0B] line-clamp-1 font-serif tracking-wide text-center">
                    {country === 'EG' ? prod.nameAr : prod.nameEn}
                  </h4>
                  <span className="font-sans font-bold text-3xs sm:text-2xs md:text-xs text-[#A44C5C]">
                    {priceVal.toLocaleString()} {currencyLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-neutral-50 rounded-2xl text-gray-400 text-xs italic">
          لا توجد منتجات رائجة مسجلة حالياً.
        </div>
      )}
    </div>
  );
}
