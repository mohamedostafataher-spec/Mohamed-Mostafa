import React, { useState } from 'react';
import { Star, Heart, Calendar, Sparkles, Inbox } from 'lucide-react';
import { Product } from '../types';
import { cleanImgUrl } from '../services/db';
import { ProductPrice } from './ProductPrice';

interface NewArrivalsProps {
  products: Product[];
  country: 'EG' | 'SA';
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
}

export default function NewArrivals({
  products,
  country,
  favorites,
  toggleFavorite,
  onSelectProduct
}: NewArrivalsProps) {
  const currencyLabel = country === 'EG' ? 'EGP' : 'SAR';
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Sort products to list newer ones first
  const allLatest = [...products]
    .filter(p => p.status === 'active')
    .sort((a, b) => b.id.localeCompare(a.id));

  // Category tags
  const categories = ['all', ...Array.from(new Set(allLatest.map(p => p.category).filter(Boolean)))];

  const filtered = activeCategory === 'all' 
    ? allLatest 
    : allLatest.filter(p => p.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-right" dir="rtl">
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <div className="flex justify-center items-center gap-1.5 text-[#A44C5C] text-xs font-serif tracking-widest font-bold">
          <Calendar size={14} className="text-[#A44C5C]" />
          <span>CORDON BLEU REVELATIONS</span>
        </div>
        <h2 className="font-serif text-3xl md:text-4xl font-light text-[#0B0B0B] tracking-wide">
          أحدث الإصدارات الفاخرة | New Arrivals
        </h2>
        <div className="w-16 h-[1px] bg-[#A44C5C]/30 mx-auto my-3" />
        <p className="text-gray-500 text-xs leading-relaxed max-w-lg mx-auto">
          انغمسي في تشكيلة الموسم المطرّزة بشغف. نسيج طازج خرج لتوه من معاملنا وقُصّ بمهارة إيطالية لتوفير تجربة استرخاء لا نهائية وحرير لا يزول بريقه.
        </p>
      </div>

      {/* Category selector chips */}
      {categories.length > 2 && (
        <div className="flex flex-wrap gap-2.5 justify-center mb-10 select-none">
          {categories.map((catName) => (
            <button
              key={catName}
              onClick={() => setActiveCategory(catName)}
              className={`px-5 py-2.5 rounded-full text-xs font-serif tracking-widest uppercase transition-all duration-350 cursor-pointer ${
                activeCategory === catName
                  ? 'bg-[#A44C5C] text-white font-bold shadow-md'
                  : 'bg-white text-[#0B0B0B] hover:bg-pink-50/50 border border-[#DF8A9D]/12'
              }`}
            >
              {catName === 'all' ? 'جميع الإصدارات' : 
               catName === 'sleepwear' ? 'Sleepwear ملابس نوم' :
               catName === 'loungewear' ? 'Loungewear ملابس استرخاء' :
               catName === 'homewear' ? 'Homewear ملابس منزلية' : catName}
            </button>
          ))}
        </div>
      )}

      {/* Grid of New arrivals */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {filtered.map((prod) => {
            const priceVal = country === 'EG' ? prod.priceEG : prod.priceSA;
            const imgToUse = cleanImgUrl(prod.images[0], prod.category);

            return (
              <div
                key={prod.id}
                onClick={() => onSelectProduct(prod)}
                className="group flex flex-col h-full bg-white rounded-2xl p-3 overflow-hidden border border-[#DF8A9D]/10 hover:border-[#DF8A9D]/30 transition-all duration-300 hover:shadow-md relative select-none cursor-pointer"
              >
                {/* Brand new badge overlay */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-[#FAF4F5] text-[#A44C5C] text-[8px] font-sans font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border border-[#DF8A9D]/15">
                  <Sparkles size={8} className="text-[#A44C5C]" />
                  <span>طازج ✦ NEW</span>
                </div>
                
                {/* Favorite Button */}
                <div className="absolute top-4 right-4 z-10">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(prod.id); }} 
                    className="p-1 bg-white/90 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-[#DF8A9D] border border-gray-100 cursor-pointer"
                  >
                    <Heart size={12} className={favorites.includes(prod.id) ? "fill-[#DF8A9D] text-[#DF8A9D]" : ""} />
                  </button>
                </div>

                {/* Main Photo */}
                <div className="relative aspect-[3/4] overflow-hidden bg-[#FAF5F0] rounded-xl mb-3">
                  <img
                    src={imgToUse}
                    alt={prod.nameAr}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[800ms] opacity-95"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Details bottom block */}
                <div className="space-y-1 text-center mt-auto flex flex-col items-center">
                  <span className="text-[7.5px] uppercase tracking-widest font-sans font-bold text-gray-400 block">
                    {prod.category === 'sleepwear' ? 'Sleepwear' : prod.category === 'loungewear' ? 'Loungewear' : 'Couture'}
                  </span>
                  <h4 className="text-3xs sm:text-2xs md:text-xs font-semibold text-[#0B0B0B] line-clamp-1 font-serif tracking-wide text-center">
                    {country === 'EG' ? prod.nameAr : prod.nameEn}
                  </h4>
                  <div className="mt-1.5 flex flex-col items-center">
                    <ProductPrice product={prod} country={country} size="sm" showBadge={true} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-neutral-50 rounded-2xl text-gray-400 text-xs italic">
          لا توجد إصدارات جديدة مسجلة في هذا التصنيف حالياً.
        </div>
      )}
    </div>
  );
}
