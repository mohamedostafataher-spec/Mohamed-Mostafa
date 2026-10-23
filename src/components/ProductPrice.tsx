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
  let beforePrice = 200;
  let afterPrice = 99;
  let discountPercent = 50;

  if (isSaudi) {
    if (product.salePriceSA && product.priceSA && product.salePriceSA < product.priceSA) {
      beforePrice = product.priceSA;
      afterPrice = product.salePriceSA;
      discountPercent = Math.round(((beforePrice - afterPrice) / beforePrice) * 100);
    } else if (product.priceSA === 99 || !product.priceSA || product.priceSA <= 120) {
      beforePrice = 200;
      afterPrice = 99;
      discountPercent = 50;
    } else {
      afterPrice = product.priceSA;
      beforePrice = Math.max(200, Math.round(afterPrice * 1.5));
      discountPercent = Math.round(((beforePrice - afterPrice) / beforePrice) * 100);
    }
  } else {
    // Egyptian Pounds (EGP)
    if (product.salePriceEG && product.priceEG && product.salePriceEG < product.priceEG) {
      beforePrice = product.priceEG;
      afterPrice = product.salePriceEG;
      discountPercent = Math.round(((beforePrice - afterPrice) / beforePrice) * 100);
    } else {
      afterPrice = product.priceEG || 499;
      beforePrice = Math.round(afterPrice * 1.5);
      discountPercent = 50;
    }
  }

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
