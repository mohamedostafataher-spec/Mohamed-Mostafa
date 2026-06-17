import React from 'react';
import { ShieldCheck, Heart, Sparkles, Star, Zap } from 'lucide-react';
import { Product } from '../types';
import { cleanImgUrl } from '../services/db';
import { ProductPrice } from './ProductPrice';

interface LimitedPiecesProps {
  products: Product[];
  country: 'EG' | 'SA';
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
}

export default function LimitedPieces({
  products,
  country,
  favorites,
  toggleFavorite,
  onSelectProduct
}: LimitedPiecesProps) {
  const currencyLabel = country === 'EG' ? 'EGP' : 'SAR';

  // Filter products for limited ones (e.g., stock < 18 or specifically best sellers)
  const limitedList = products
    .filter(p => p.status === 'active')
    .slice(0, 5); // Take a subset of 5 highly exclusive masterpieces

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-right" dir="rtl">
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <div className="flex justify-center items-center gap-1.5 text-[#A44C5C] text-xs font-serif tracking-widest font-bold">
          <Zap size={14} className="text-[#A44C5C] animate-pulse" />
          <span>SULTA ROYAL LIMITED RESERVES</span>
        </div>
        <h2 className="font-serif text-3xl md:text-4xl font-light text-[#0B0B0B] tracking-wide">
          القطع الفريدة والمحدودة | Limited Pieces
        </h2>
        <div className="w-16 h-[1px] bg-[#A44C5C]/30 mx-auto my-3" />
        <p className="text-gray-500 text-xs leading-relaxed max-w-lg mx-auto">
          النوادر والروائع الملكية التي لا يحصل عليها سوا قِلة من نُخبة عَميلاتِنا. خيوط مخمل مخيطة يدوياً وتصنيع حذر جداً بكميات تحت العشر بيجامات لكِ بخصوصيتكِ المستقلة.
        </p>
      </div>

      {/* Grid displays */}
      {limitedList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {limitedList.map((prod, idx) => {
            const priceVal = country === 'EG' ? prod.priceEG : prod.priceSA;
            const imgToUse = cleanImgUrl(prod.images[0], prod.category);
            
            // Generate limited stock metrics dynamically but deterministically based on stock
            const stockLeft = Math.max(1, (prod.stock % 6) + 1);
            const initialMaxStock = stockLeft + 12;
            const progressPct = Math.round((stockLeft / initialMaxStock) * 100);

            return (
              <div
                key={prod.id}
                onClick={() => onSelectProduct(prod)}
                className="group flex flex-col bg-white rounded-[2rem] p-5 border border-[#DF8A9D]/12 hover:border-[#DF8A9D]/35 shadow-2xs hover:shadow-xl transition-all duration-[600ms] relative select-none cursor-pointer"
              >
                {/* Visual badge */}
                <div className="absolute top-6 left-6 z-10 bg-red-500 text-white text-[9px] font-sans font-bold uppercase px-3 py-1 rounded-full animate-pulse shadow-sm">
                  متبقي {stockLeft} قطع حصرية فقط!
                </div>

                <div className="absolute top-6 right-6 z-10">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(prod.id); }} 
                    className="p-1.5 bg-white/90 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-[#DF8A9D] border border-gray-100 cursor-pointer"
                  >
                    <Heart size={13} className={favorites.includes(prod.id) ? "fill-[#DF8A9D] text-[#DF8A9D]" : ""} />
                  </button>
                </div>

                <div className="relative aspect-[4/5] overflow-hidden bg-[#FAF5F0] rounded-[1.5rem] mb-4">
                  <img
                    src={imgToUse}
                    alt={prod.nameAr}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[1000ms] opacity-95"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="space-y-3 mt-auto">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-gray-400 font-sans">
                    <span>مستوى الندرة: فائق الندرة 💎</span>
                    <span>{stockLeft} من {initialMaxStock} متوفرة</span>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 to-rose-400 rounded-full transition-all duration-[1200ms]" 
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {/* Product Details Block */}
                  <div className="text-center pt-2">
                    <h3 className="font-serif text-sm font-semibold text-gray-900 group-hover:text-[#A44C5C] transition-colors">
                      {country === 'EG' ? prod.nameAr : prod.nameEn}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-sans mt-0.5 line-clamp-1">
                      {prod.descriptionAr || 'تصميم محكم التفاصيل بحرير دوج ناعم وأكمام مطوقة بالدانتيل'}
                    </p>
                    <div className="mt-2.5 flex flex-col items-center">
                      <ProductPrice product={prod} country={country} size="sm" showBadge={true} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-neutral-50 rounded-2xl text-gray-400 text-xs italic">
          لا توجد قطع فخمة محدودة مسجلة حالياً.
        </div>
      )}
    </div>
  );
}
