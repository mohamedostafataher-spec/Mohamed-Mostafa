import React from 'react';
import { Product, Country, Settings } from '../types';
import { dbService } from '../services/db';

interface ProductPriceProps {
  product: Product;
  country: Country;
  settings?: Settings | null;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
}

export const ProductPrice: React.FC<ProductPriceProps> = ({ 
  product, 
  country,
  settings,
  size = 'md',
  showBadge = true 
}) => {
  const currencySymbolAr = country === 'EG' ? 'ج.م' : 'ر.س';
  const priceInfo = dbService.getProductActualPrice(product, country, settings);

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
        {/* Effective Calculated Current Selling Price */}
        <span className={`${fontAfter} text-[#A44C5C] font-sans tracking-tight`}>
          {(priceInfo.unitPrice ?? 0).toLocaleString()} <span className="text-[10px] font-normal leading-none">{currencySymbolAr}</span>
        </span>
        
        {/* Regular Base Price (Strikethrough ONLY when active discount exists) */}
        {priceInfo.hasDiscount && (
          <span className={`${fontBefore} text-gray-400 font-sans line-through decoration-gray-400 font-normal`}>
            {(priceInfo.originalPrice ?? 0).toLocaleString()} {currencySymbolAr}
          </span>
        )}
      </div>

      {/* Discount Percentage Badge (ONLY when active discount exists) */}
      {showBadge && priceInfo.hasDiscount && (
        <div className="flex items-center gap-1 mt-0.5">
          <span className={`inline-flex items-center font-sans font-bold bg-rose-50 text-rose-700 border border-rose-200/80 rounded-md ${badgePadding}`}>
            خصم {priceInfo.discountPercent}%
          </span>
        </div>
      )}
    </div>
  );
};
