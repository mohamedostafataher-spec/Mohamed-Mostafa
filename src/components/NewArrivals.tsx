import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Product } from '../types';
import ProductCard from './ProductCard';
import SEO from './SEO';

interface NewArrivalsProps {
  products: Product[];
  country: 'EG' | 'SA';
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart?: (product: Product, color: any, size: string, qty: number) => void;
}

export default function NewArrivals({
  products,
  country,
  favorites,
  toggleFavorite,
  onSelectProduct,
  onAddToCart
}: NewArrivalsProps) {
  const currencyLabel = 'ر.س';
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
      <SEO 
        title="أحدث بيجامات نسائية وصل حديثًا | سولته" 
        description="اكتشفي أحدث تصاميم ملابس النوم والبيجامات النسائية القطنية التي وصلت حديثاً إلى متجر سولته." 
        path="/new-arrivals/" 
      />
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <div className="flex justify-center items-center gap-1.5 text-[#A44C5C] text-xs font-serif tracking-widest font-bold">
          <Sparkles size={14} className="text-[#A44C5C]" />
          <span>وصل حديثاً</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B0B0B] tracking-wide">
          أحدث البيجامات النسائية من سولته
        </h1>
        <div className="w-16 h-[1px] bg-[#A44C5C]/30 mx-auto my-3" />
        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
          وصل حديثاً إلى سولته: أحدث موديلات البيجامات النسائية بأقمشة قطنية ناعمة ومقاس وان سايز يناسب الأوزان من 45 إلى 80 كيلو. تسوقي أحدث الإضافات بكميات محدودة لضمان التميز.
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {filtered.map((prod, idx) => (
            <ProductCard
              key={prod.id}
              product={prod}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              onSelectProduct={onSelectProduct}
              onAddToCart={onAddToCart}
              priority={idx < 5}
            />
          ))}
        </div>

      ) : (
        <div className="text-center py-20 bg-neutral-50 rounded-2xl text-gray-400 text-xs italic">
          لا توجد إصدارات جديدة مسجلة في هذا التصنيف حالياً.
        </div>
      )}
    </div>
  );
}
