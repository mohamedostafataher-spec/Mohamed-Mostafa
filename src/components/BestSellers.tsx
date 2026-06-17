import React from 'react';
import { Star, Heart, TrendingUp, Sparkles, Award } from 'lucide-react';
import { Product } from '../types';
import { cleanImgUrl } from '../services/db';
import { ProductPrice } from './ProductPrice';

interface BestSellersProps {
  products: Product[];
  country: 'EG' | 'SA';
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
}

export default function BestSellers({
  products,
  country,
  favorites,
  toggleFavorite,
  onSelectProduct
}: BestSellersProps) {
  const currencyLabel = country === 'EG' ? 'EGP' : 'SAR';

  // Extract products with best-selling flag, or fallback to featured, sorted by rating
  let list = products.filter(p => p.status === 'active' && (p.isBestSeller || p.featured));
  if (list.length === 0) {
    // If none are flagged, take top rated products
    list = [...products].filter(p => p.status === 'active').sort((a, b) => (b.rating || 5) - (a.rating || 5)).slice(0, 8);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-right" dir="rtl">
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <div className="flex justify-center items-center gap-1.5 text-[#A44C5C] text-xs font-serif tracking-widest font-bold">
          <Award size={14} className="animate-bounce" />
          <span>CELEBRATED CLASSICS</span>
        </div>
        <h2 className="font-serif text-3xl md:text-4xl font-light text-[#0B0B0B] tracking-wide">
          الأكثر مبيعاً وطلباً | SULTA Best Sellers
        </h2>
        <div className="w-16 h-[1px] bg-[#A44C5C]/30 mx-auto my-3" />
        <p className="text-gray-500 text-xs leading-relaxed max-w-lg mx-auto">
          القطع التي شكلت ثورة في ذوق العميلات في مصر والسعودية. اخترناها لكِ من نسيج الحرير الدائري والريش الطبيعي والقطع الملكية التي تسابقن العرائس لاقتنائها.
        </p>
      </div>

      {/* Hero Curated Best Seller Display (Bento Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {list.slice(0, 6).map((prod, index) => {
          const priceVal = country === 'EG' ? prod.priceEG : prod.priceSA;
          const imgToUse = cleanImgUrl(prod.images[0], prod.category);
          
          return (
            <div 
              key={prod.id} 
              onClick={() => onSelectProduct(prod)}
              className="group bg-white rounded-[2rem] overflow-hidden p-4 border border-[#DF8A9D]/12 hover:border-[#DF8A9D]/40 transition-all duration-500 hover:shadow-xl cursor-pointer flex flex-col justify-between relative"
            >
              {/* Luxury Ranking Badge */}
              <div className="absolute top-6 right-6 z-20 flex items-center justify-center bg-[#A44C5C] text-[#F6E7A6] w-9 h-9 rounded-full font-serif font-bold text-xs ring-4 ring-[#FAF4F5] shadow-md">
                NO.{index + 1}
              </div>

              {/* Image Frame */}
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-neutral-50 mb-4">
                <img 
                  src={imgToUse} 
                  alt={prod.nameAr}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                
                {/* Save to Favorites toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(prod.id); }}
                  className="absolute top-4 left-4 p-2 bg-white/95 rounded-full hover:bg-white text-gray-400 hover:text-[#A44C5C] shadow-sm transition-all z-10"
                >
                  <Heart size={14} className={favorites.includes(prod.id) ? "fill-[#A44C5C] text-[#A44C5C]" : ""} />
                </button>
              </div>

              {/* Informative bottom metadata */}
              <div className="space-y-2 text-center flex flex-col items-center">
                <div className="flex items-center gap-1">
                  <span className="text-[8px] tracking-widest font-semibold bg-[#A44C5C]/8 text-[#A44C5C] px-2.5 py-0.5 rounded-full uppercase">
                    أعلى تقييم ✦ {prod.rating || '4.9'}
                  </span>
                </div>
                <h3 className="font-serif text-sm font-semibold text-[#0B0B0B] group-hover:text-[#A44C5C] transition-colors leading-relaxed line-clamp-1">
                  {country === 'EG' && prod.nameAr ? prod.nameAr : prod.nameEn}
                </h3>
                <p className="text-[10px] text-gray-400 max-w-xs font-sans line-clamp-1">
                  {prod.descriptionAr || 'نسيج فاخر يجمع بين دفء الأجواء وأناقة المظهر لراحة لا تضاهى'}
                </p>
                <div className="pt-1.5 flex flex-col items-center">
                  <ProductPrice product={prod} country={country} size="sm" showBadge={true} />
                  <span className="text-[9px] font-medium text-[#A44C5C] font-sans mt-2 hover:underline">تسوقي القطعة الفاخرة ←</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
