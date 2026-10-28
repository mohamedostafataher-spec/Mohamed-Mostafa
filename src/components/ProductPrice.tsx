import React from 'react';
import { Product, Country } from '../types';

interface ProductPriceProps {
  product: Product;
  country: Country;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
}

export const ProductPrice: React.FC<ProductPriceProps> = ({ 
  product, 
  country, 
  size = 'md',
  showBadge = true 
}) => {
  const currencySymbolAr = country === 'EG' ? 'ج.م' : 'ر.س';

  const isSaudi = country === 'SA';
  let afterPrice = isSaudi ? (product.priceSA || 195) : (product.priceEG || 899);
  let beforePrice = isSaudi ? (Math.max(afterPrice, 200)) : (Math.max(afterPrice, 1000));
  let discountPercent = 0;

  if (isSaudi) {
    if (product.salePriceSA && product.priceSA && product.salePriceSA < product.priceSA) {
      beforePrice = product.priceSA;
      afterPrice = product.salePriceSA;
    } else {
      afterPrice = product.priceSA || 195;
      beforePrice = Math.max(afterPrice, 200);
    }
  } else {
    if (product.salePriceEG && product.priceEG && product.salePriceEG < product.priceEG) {
      beforePrice = product.priceEG;
      afterPrice = product.salePriceEG;
    } else {
      afterPrice = product.priceEG || 899;
      beforePrice = Math.max(afterPrice, 1000);
    }
  }

  discountPercent = beforePrice > afterPrice ? Math.round(((beforePrice - afterPrice) / beforePrice) * 100) : 0;

  // Adaptive font scaling
  const fontAfter = size === 'sm' 
    ? 'text-[11px] sm:text-xs font-black' 
    : size === 'lg' 
      ? 'text-xl sm:text-2xl md:text-3xl font-black' 
      : 'text-sm sm:text-base font-black';

  const fontBefore = size === 'sm' 
    ? 'text-[9px] sm:text-[10px] ml-1' 
    : size === 'lg' 
      ? 'text-xs sm:text-sm ml-1.5' 
      : 'text-[11px] sm:text-xs ml-1.5';

  const badgePadding = size === 'sm' ? 'px-1 py-0.5 text-[8px]' : 'px-1.5 py-0.5 text-[9px] sm:text-[10px]';

  return (
    <div className="flex flex-col items-start gap-0.5 text-right select-none" dir="rtl">
      {/* Price row */}
      <div className="flex items-baseline gap-1.5 flex-wrap">
        {/* Dynamic / Final Sale Price */}
        <span className={`${fontAfter} text-[#A44C5C] font-sans tracking-tight`}>
          {afterPrice.toLocaleString()} <span className="text-[10px] font-normal leading-none">{currencySymbolAr}</span>
        </span>
        
        {/* Original Price (Strikethrough) */}
        <span className={`${fontBefore} text-gray-400 font-sans line-through decoration-gray-400 font-normal`}>
          {beforePrice.toLocaleString()} {currencySymbolAr}
        </span>
      </div>

      {/* Decorative Royal Discount Badge */}
      {showBadge && (
        <div className="flex items-center gap-1 mt-0.5">
          <span className={`inline-flex items-center font-sans font-medium bg-[#FFF0F2] text-[#A44C5C] border border-[#A44C5C]/10 rounded-md ${badgePadding} scale-95 origin-right animate-fade-in-rapid`}>
             وفر {Math.round(beforePrice - afterPrice).toLocaleString()} {currencySymbolAr} ({discountPercent}٪ خصم)
          </span>
        </div>
      )}
    </div>
  );
};
