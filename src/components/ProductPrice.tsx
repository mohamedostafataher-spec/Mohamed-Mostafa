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

  // Base Paid Price (Current price)
  const paidPrice = country === 'EG' ? product.priceEG : product.priceSA;
  
  // Explicit sale pricing check
  const hasExplicitDiscount = country === 'EG' ? !!product.salePriceEG : !!product.salePriceSA;
  const explicitSalePrice = country === 'EG' ? product.salePriceEG : product.salePriceSA;

  let beforePrice = 0;
  let afterPrice = paidPrice;
  let discountPercent = 0;

  if (hasExplicitDiscount && explicitSalePrice && explicitSalePrice < paidPrice) {
    beforePrice = paidPrice;
    afterPrice = explicitSalePrice;
    discountPercent = Math.round(((paidPrice - explicitSalePrice) / paidPrice) * 100);
  } else {
    // Beautiful royal campaign discount simulation
    // Deterministic discount based on rating/id to ensure layout stability
    const mockPercent = (product.rating >= 4.8) ? 25 : 20; 
    discountPercent = mockPercent;
    
    // The current listed price is the final paid price (safeguarding checkout consistency)
    // and we generate the handsome crossed-out original price.
    afterPrice = paidPrice;
    const rawBefore = afterPrice / (1 - mockPercent / 100);
    
    // Elegant rounding based on currency context
    if (country === 'EG') {
      beforePrice = Math.round(rawBefore / 50) * 50;
    } else {
      beforePrice = Math.round(rawBefore / 10) * 10;
    }
    
    // Final fallback safeguard
    if (beforePrice <= afterPrice) {
      beforePrice = Math.round((afterPrice * 1.30) / 10) * 10;
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
        <span className={`${fontBefore} text-gray-450 font-sans line-through decoration-rose-450/40 opacity-70`}>
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
