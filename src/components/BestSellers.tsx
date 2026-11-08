import React from 'react';
import { Award } from 'lucide-react';
import { Product } from '../types';
import ProductCard from './ProductCard';
import SEO from './SEO';

interface BestSellersProps {
  products: Product[];
  country: 'EG' | 'SA';
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart?: (product: Product, color: any, size: string, qty: number) => void;
}

export default function BestSellers({
  products,
  country,
  favorites,
  toggleFavorite,
  onSelectProduct,
  onAddToCart
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
      <SEO 
        title="بيجامات نسائية قطن الأكثر طلباً ومبيعاً | سولته" 
        description="تسوقي أكثر موديلات البيجامات النسائية القطنية طلباً في متجر سولته بالسعودية. خامات قطن ناعم ومقاس واحد مريح 45-80 كجم." 
        path="/best-sellers" 
      />
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <div className="flex justify-center items-center gap-1.5 text-[#A44C5C] text-xs font-serif tracking-widest font-bold">
          <Award size={14} className="animate-bounce" />
          <span>الأكثر طلباً</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B0B0B] tracking-wide">
          بيجامات نسائية قطن الأكثر طلباً — متجر سولته
        </h1>
        <div className="w-16 h-[1px] bg-[#A44C5C]/30 mx-auto my-3" />
        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
          الموديلات الأكثر طلباً وإعجاباً من عميلات سولته في السعودية: بيجامات قطن ناعم وقطن كوريشة بتصاميم مريحة ومقاس واحد انسيابي يناسب من 45 إلى 80 كيلو.
        </p>
      </div>

      {/* Hero Curated Best Seller Display (Bento Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {list.slice(0, 12).map((prod, index) => (
          <ProductCard
            key={prod.id}
            product={prod}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            onSelectProduct={onSelectProduct}
            onAddToCart={(p, c, s, q) => {
              onAddToCart(p, c, s, q);
            }}
            priority={index < 4}
            renderBadge={() => (
              <div className="bg-[#A44C5C] text-[#F6E7A6] w-7 h-7 sm:w-8 sm:h-8 rounded-full font-serif font-bold text-[10px] flex items-center justify-center shadow-md border-2 border-white">
                #{index + 1}
              </div>
            )}
          />
        ))}
      </div>

    </div>
  );
}
