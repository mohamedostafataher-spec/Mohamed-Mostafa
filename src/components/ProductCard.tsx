import React, { useState, useRef } from 'react';
import { ShoppingBag, Heart, Check } from 'lucide-react';
import { Product } from '../types';
import SultaImage from './SultaImage';
import { ProductPrice } from './ProductPrice';
import { dbService, cleanImgUrl } from '../services/db';
import { getProductSlug } from '../utils/slugify';
import { formatStockBadge } from '../utils/discountUtils';

interface ProductCardProps {
  product: Product;
  favorites?: string[];
  isFavorite?: boolean;
  toggleFavorite?: (id: string) => void;
  onToggleFavorite?: () => void;
  onAddToCart?: ((product: Product, color: any, size: string, qty: number) => void) | (() => void);
  onSelectProduct?: (product: Product) => void;
  onSelect?: (product: Product) => void;
  priority?: boolean;
  renderBadge?: () => React.ReactNode;
}

export default function ProductCard({
  product,
  favorites = [],
  isFavorite,
  toggleFavorite,
  onToggleFavorite,
  onAddToCart,
  onSelectProduct,
  onSelect,
  priority = false,
  renderBadge
}: ProductCardProps) {
  const [isAdded, setIsAdded] = useState(false);
  
  const isFav = isFavorite !== undefined
    ? Boolean(isFavorite)
    : (Array.isArray(favorites) ? favorites.includes(product.id) : false);

  const prodSlug = getProductSlug(product);
  const stockBadge = formatStockBadge(product.stock);
  const effDiscount = dbService.getProductActualPrice(product, 'SA', null);

  // "New" badge logic: Created in last 30 days or marked as featured
  const isNew = (() => {
    if (product.featured) return true;
    if (product.createdAt) {
      const created = new Date(product.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return created > thirtyDaysAgo;
    }
    return false;
  })();

  const handleCardClick = () => {
    if (onSelectProduct) {
      onSelectProduct(product);
    } else if (onSelect) {
      onSelect(product);
    }
  };

  const handleFavClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite();
    } else if (toggleFavorite) {
      toggleFavorite(product.id);
    }
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock === 0) return;
    
    if (onAddToCart) {
      const chosenCol = product.colors?.[0] || { name: 'الافتراضي', hex: '#000000' };
      const chosenSz = product.sizes?.[0] || 'One Size';
      (onAddToCart as any)(product, chosenCol, chosenSz, 1);
    }
    
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const primaryImg = product.images?.[0] || '';
  const colorDesc = product.colors?.[0]?.name ? ` - ${product.colors[0].name}` : '';
  const fabricDesc = product.material || product.fabricAr ? ` - ${product.material || product.fabricAr}` : '';
  const imageAlt = `${product.nameAr}${colorDesc}${fabricDesc}`;

  // Console warning for products without images
  if (!primaryImg && typeof window !== 'undefined') {
    console.warn(`[Sulta Store] تنبيه: المنتج "${product.nameAr}" (ID: ${product.id}) بدون صورة مخزنة في Supabase.`);
  }

  return (
    <div
      className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-md relative select-none cursor-pointer"
      onClick={handleCardClick}
      dir="rtl"
    >
      <a href={`/product/${prodSlug}/`} className="sr-only">
        تصفح تفاصيل منتج {product.nameAr}
      </a>

      {/* Image Container 3:4 */}
      <div 
        className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#A44C5C] outline-hidden"
        role="img"
        aria-label={`صورة منتج ${product.nameAr}`}
      >
        {/* Badges */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-start" aria-hidden="true">
          {isNew && (
            <span className="bg-[#A44C5C] text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-xs">
              جديد
            </span>
          )}
          {effDiscount.hasDiscount && (
            <span className="bg-[#E11D48] text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs">
              خصم {effDiscount.discountPercent}%
            </span>
          )}
          {product.isBestSeller && (
            <span className="bg-[#F59E0B] text-black text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs">
              الأكثر طلباً 👑
            </span>
          )}
          {renderBadge && renderBadge()}
        </div>

        {/* Stock Alert */}
        {product.stock > 0 && product.stock <= 10 && (
          <div className="absolute bottom-2 right-2 z-10 bg-red-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs shadow-xs" role="status">
            متبقي {product.stock} قطع
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex items-center justify-center" role="status">
            <span className="bg-gray-900 text-white text-[10px] font-bold px-3 py-1 rounded-full">نفدت الكمية</span>
          </div>
        )}

        {/* Wishlist Button */}
        <button 
          type="button"
          onClick={handleFavClick} 
          className="absolute top-2 left-2 z-10 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-xs text-gray-400 hover:text-red-500 transition-all active:scale-90 focus-visible:ring-2 focus-visible:ring-[#A44C5C] outline-hidden"
          aria-label={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
        >
          <Heart size={14} className={isFav ? "fill-red-500 text-red-500" : ""} aria-hidden="true" />
        </button>

        {primaryImg ? (
          <SultaImage
            src={primaryImg}
            alt={imageAlt}
            productName={product.nameAr}
            className="w-full h-full"
            contain={false}
            width="sm"
            imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center p-4 text-center select-none aspect-[3/4]">
            <span className="text-xs font-bold text-gray-700 line-clamp-2">{product.nameAr}</span>
            <span className="text-[10px] text-gray-500 mt-1 font-medium">الصورة غير متوفرة</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1 text-right">
        <span className="text-[10px] text-gray-500 font-bold mb-0.5" aria-hidden="true">
          {product.categoryAr || 'بيجامات نسائية'}
        </span>
        <h2 className="text-[11px] sm:text-xs font-bold text-gray-900 line-clamp-2 leading-snug mb-2 flex-1">
          {product.nameAr}
        </h2>

        <div className="mt-auto space-y-3">
          <div className="flex items-baseline justify-between">
            <ProductPrice product={product} country="SA" size="sm" showBadge={true} />
          </div>

          <button
            type="button"
            onClick={handleAddToCartClick}
            disabled={product.stock === 0}
            className={`w-full h-12 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-2xs focus-visible:ring-2 focus-visible:ring-[#A44C5C] outline-hidden ${
              product.stock === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isAdded
                  ? 'bg-emerald-600 text-white shadow-emerald-100/50'
                  : 'bg-[#A44C5C] text-white hover:bg-[#A44C5C]/90 shadow-[#A44C5C]/20'
            }`}
            aria-label={isAdded ? "تمت الإضافة للسلة" : `إضافة منتج ${product.nameAr} للسلة`}
          >
            {isAdded ? (
              <>
                <Check size={16} aria-hidden="true" />
                <span>تمت الإضافة</span>
              </>
            ) : (
              <>
                <ShoppingBag size={15} aria-hidden="true" />
                <span>أضيفي للسلة</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="aspect-[3/4] w-full bg-gray-100" />
      <div className="p-3 space-y-3">
        <div className="h-2 w-16 bg-gray-100 rounded" />
        <div className="space-y-1">
          <div className="h-3 w-full bg-gray-100 rounded" />
          <div className="h-3 w-2/3 bg-gray-100 rounded" />
        </div>
        <div className="mt-auto pt-2 flex justify-between">
          <div className="h-4 w-20 bg-gray-100 rounded" />
        </div>
        <div className="h-10 w-full bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}
