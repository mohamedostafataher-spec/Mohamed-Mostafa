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
        title="الأكثر طلباً ومبيعاً - قطع سولته المفضلة" 
        description="اكتشفي القطع التي نالت إعجاب عميلاتنا وحققت أعلى مبيعات. بيجامات حريرية وأرواب نوم مترفة تليق بكِ." 
        path="/best-sellers" 
      />
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <div className="flex justify-center items-center gap-1.5 text-[#A44C5C] text-xs font-serif tracking-widest font-bold">
          <Award size={14} className="animate-bounce" />
          <span>CELEBRATED CLASSICS</span>
        </div>
        <h2 className="font-serif text-3xl md:text-4xl font-light text-[#0B0B0B] tracking-wide">
          الأكثر مبيعاً وطلباً | Sulta Best Sellers
        </h2>
        <div className="w-16 h-[1px] bg-[#A44C5C]/30 mx-auto my-3" />
        <p className="text-gray-500 text-xs leading-relaxed max-w-lg mx-auto">
          القطع التي شكلت ثورة في ذوق عميلات النخبة في المملكة العربية السعودية. اخترناها لكِ من نسيج الكوتور الدائري والريش الطبيعي والقطع الملكية التي تسابقت العرائس لاقتنائها.
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
