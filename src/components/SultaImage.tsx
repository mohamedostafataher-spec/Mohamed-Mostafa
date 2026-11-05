import React, { useState, useEffect, useRef } from 'react';
import { cleanImgUrl } from '../services/db';

interface SultaImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  imgClassName?: string;
  priority?: boolean;
  contain?: boolean;
  alignment?: 'center' | 'top' | 'bottom';
  productName?: string;
}

// Clean and resolve direct accessible URL
const getOptimizedSrc = (url: string, width?: number | string): string => {
  if (!url || typeof url !== 'string' || !url.trim()) return '';
  const cleaned = cleanImgUrl(url, width);
  if (cleaned.startsWith('/img/') && (cleaned.endsWith('.png') || cleaned.endsWith('.jpg'))) {
    return cleaned.replace(/\.(png|jpg)$/, '.webp');
  }
  return cleaned;
};

export default function SultaImage({ 
  src, 
  alt, 
  className = '', 
  imgClassName = '',
  fallbackSrc = '',
  priority = false,
  contain = false,
  alignment = 'center',
  width,
  productName,
  ...props 
}: SultaImageProps) {
  const initialUrl = src ? getOptimizedSrc(src, width) : fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState<string>(initialUrl);
  const [retryStage, setRetryStage] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasFailed, setHasFailed] = useState(!initialUrl);
  const imgRef = useRef<HTMLImageElement>(null);

  // Sync with prop changes
  useEffect(() => {
    const newUrl = src ? getOptimizedSrc(src, width) : fallbackSrc;
    setCurrentSrc(newUrl);
    setRetryStage(0);
    setIsLoaded(false);
    setHasFailed(!newUrl);
    
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src, fallbackSrc, width]);

  const handleError = () => {
    // Stage 1: If currentSrc contains wsrv.nl proxy, fall back to the direct Supabase URL
    if (retryStage === 0 && currentSrc.includes('wsrv.nl/?url=')) {
      try {
        const rawUrl = currentSrc.split('url=')[1]?.split('&')[0];
        if (rawUrl) {
          const decoded = decodeURIComponent(rawUrl);
          setRetryStage(1);
          setCurrentSrc(decoded);
          return;
        }
      } catch {}
    }
    
    // Stage 2: If currentSrc is a direct Supabase/HTTP URL, attempt image proxy fallback
    if (retryStage === 0 && currentSrc.startsWith('http') && !currentSrc.includes('wsrv.nl')) {
      const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(currentSrc)}&output=webp&q=85`;
      setRetryStage(1);
      setCurrentSrc(proxyUrl);
      return;
    }

    // Both direct and proxy failed: Log warning safely without sensitive tokens
    if (typeof window !== 'undefined') {
      const sanitizedName = productName || alt || 'منتج';
      console.warn(`[Sulta Image Notice] تعذر تحميل صورة المنتج "${sanitizedName}".`);
    }

    setHasFailed(true);
    setCurrentSrc('');
  };

  const handleLoad = () => {
    setIsLoaded(true);
    setHasFailed(false);
  };

  const alignmentClass = alignment === 'top' ? 'object-top' : alignment === 'bottom' ? 'object-bottom' : 'object-center';
  const displayName = productName || alt || 'منتج سولته';

  // Neutral Gray Fallback Box with exact 3:4 aspect ratio
  if (hasFailed || !currentSrc) {
    return (
      <div 
        className={`w-full h-full bg-[#FAF5F0]/60 flex flex-col items-center justify-center p-4 text-center select-none aspect-[3/4] border border-[#A44C5C]/10 rounded-xl ${className}`}
        role="img"
        aria-label={alt || `${displayName} - الصورة غير متوفرة`}
      >
        <div className="w-10 h-10 rounded-full bg-white/80 shadow-2xs border border-gray-150 flex items-center justify-center text-gray-400 mb-2">
          <svg className="w-5 h-5 text-[#A44C5C]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="text-xs font-bold text-gray-800 line-clamp-2 px-2">{displayName}</span>
        <span className="text-[11px] text-gray-500 mt-1 font-medium">الصورة غير متوفرة</span>
      </div>
    );
  }

  return (
    <div 
      className={`relative overflow-hidden ${contain ? 'bg-white' : 'bg-transparent'} ${className}`}
      style={{ aspectRatio: contain ? 'auto' : '3/4' }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 z-0 bg-neutral-100 animate-pulse flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-[#A44C5C] rounded-full animate-spin opacity-40" />
        </div>
      )}

      <img
        key={currentSrc}
        ref={imgRef}
        src={currentSrc}
        alt={alt || displayName}
        className={`w-full h-full block ${imgClassName || (contain ? 'object-contain' : 'object-cover')} ${alignmentClass} relative z-10 transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onError={handleError}
        onLoad={handleLoad}
        loading={priority ? 'eager' : (props.loading || 'lazy')}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
        width={typeof width === 'number' ? width : undefined}
        {...props}
      />
    </div>
  );
}
