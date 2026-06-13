import React, { useMemo } from 'react';
import { Sparkles, Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { Product, Country } from '../types';

interface SmartRecommendationsProps {
  product: Product;
  products: Product[];
  country: Country;
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
}

export default function SmartRecommendations({
  product,
  products,
  country,
  favorites,
  toggleFavorite,
  onSelectProduct
}: SmartRecommendationsProps) {
  // 🔮 Compute smart recommendation arrays using consistent seed hashing or category matching
  const recommendations = useMemo(() => {
    // 1. Same category similarities
    const sameCategory = products.filter(p => p.category === product.category && p.id !== product.id);
    
    // 2. Customers who bought this also bought (pseudo-co-occurence using category & collections)
    const coBought = products.filter(p => p.id !== product.id && (p.collection === product.collection || p.category !== product.category)).reverse();

    // 3. You might also like (favorited-related or high rating items)
    const alsoLike = products.filter(p => p.id !== product.id && p.status === 'active').sort(() => 0.5 - Math.random());

    return {
      similar: sameCategory.slice(0, 4),
      coBought: coBought.slice(0, 4),
      alsoLike: alsoLike.slice(0, 4)
    };
  }, [product, products]);

  const currencyLabel = country === 'EG' ? 'ج.م' : 'ر.س';

  const ProductCard = ({ prod }: { prod: Product }) => {
    const price = country === 'EG' ? prod.priceEG : prod.priceSA;
    const isFav = favorites.includes(prod.id);

    return (
      <div 
        onClick={() => {
          onSelectProduct(prod);
          // Scroll modal back to top to read new product
          const modalBody = document.getElementById('luxury-modal-viewport');
          if (modalBody) modalBody.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="group relative bg-[#FAFAF9]/80 border border-stone-200/55 rounded-3xl p-3.5 flex flex-col justify-between hover:bg-white hover:border-[#DF8A9C]/55 hover:shadow-md transition-all duration-300 cursor-pointer text-right"
      >
        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-stone-100 border border-stone-100">
          <img 
            src={prod.images?.[0] || '/img/placeholder.png'} 
            alt={prod.nameAr}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          {/* Tag */}
          {prod.tagAr && (
            <span className="absolute top-2 right-2 bg-[#0B0B0B] text-[#F6E7A6] text-[8px] font-sans font-bold px-2 py-0.5 rounded-full z-10">
              {prod.tagAr}
            </span>
          )}
          {/* Favorite action top left */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(prod.id);
            }}
            className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center border border-stone-150 hover:bg-white hover:scale-110 transition-all text-gray-800"
          >
            <Heart size={11} fill={isFav ? '#EF4444' : 'none'} className={isFav ? 'text-red-500' : 'text-gray-500'} />
          </button>
        </div>

        <div className="mt-2.5 space-y-1">
          <h5 className="font-serif text-[11.5px] text-gray-950 truncate font-bold leading-normal">
            {prod.nameAr}
          </h5>
          <div className="flex justify-between items-center text-[10px] flex-row-reverse">
            <span className="text-[#A44C5C] font-mono font-extrabold">
              {price.toLocaleString()} {currencyLabel}
            </span>
            <span className="text-gray-400 font-sans text-[9px]">
              {prod.categoryAr || 'كوتور'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 border-t border-gray-150 pt-10 mt-10 text-right dir-rtl" style={{ direction: 'rtl' }}>
      
      {/* SECTION 1: Customers bought also bought */}
      {recommendations.coBought.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 justify-start flex-row-reverse pb-1 border-b border-gray-100">
            <h4 className="font-serif text-[13px] font-black text-gray-950">
              العميلات اللاتي اقتنين هذه القطعة اشترين أيضاً ✨
            </h4>
            <span className="h-1.5 w-1.5 rounded-full bg-[#DF8A9C]" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommendations.coBought.map(p => (
              <ProductCard key={p.id} prod={p} />
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: Similar Category items */}
      {recommendations.similar.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 justify-start flex-row-reverse pb-1 border-b border-gray-100">
            <h4 className="font-serif text-[13px] font-black text-gray-950">
              منتجات كوتور نوم مشابهة قد تلهمكِ 👑
            </h4>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommendations.similar.map(p => (
              <ProductCard key={p.id} prod={p} />
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: You Might Also Like */}
      {recommendations.alsoLike.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 justify-start flex-row-reverse pb-1 border-b border-gray-100">
            <h4 className="font-serif text-[13px] font-black text-gray-950">
              مختارات من ذكاء الأناقة قد تعجبكِ أيضاً ✦
            </h4>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommendations.alsoLike.map(p => (
              <ProductCard key={p.id} prod={p} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
