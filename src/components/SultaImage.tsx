import React, { useState, useEffect, useRef } from 'react';
import { cleanImgUrl } from '../services/db';
import { SEED_FALLBACK_PRODUCTS } from '../data/fallbackProducts';

interface SultaImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  imgClassName?: string;
  priority?: boolean;
  contain?: boolean;
  alignment?: 'center' | 'top' | 'bottom';
  productName?: string;
  width?: number | string;
  height?: number | string;
}

// Clean and resolve direct accessible URL with automatic srcSet generation
const getResponsiveSrcSet = (url: string): string => {
  if (!url || typeof url !== 'string' || !url.trim() || url.includes('base64')) return '';
  
  // Standard responsive widths for e-commerce
  const widths = [400, 800, 1200];
  return widths
    .map(w => `${cleanImgUrl(url, w)} ${w}w`)
    .join(', ');
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
  height,
  productName,
  ...props 
}: SultaImageProps) {
  const defaultWidth = width || 'md';
  const initialUrl = src ? cleanImgUrl(src, defaultWidth) : fallbackSrc;
  
  const [currentSrc, setCurrentSrc] = useState<string>(initialUrl);
  const [currentSrcSet, setCurrentSrcSet] = useState<string>(src ? getResponsiveSrcSet(src) : '');
  const [retryStage, setRetryStage] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasFailed, setHasFailed] = useState(!initialUrl);
  const imgRef = useRef<HTMLImageElement>(null);

  // Sync with prop changes
  useEffect(() => {
    const newUrl = src ? cleanImgUrl(src, defaultWidth) : fallbackSrc;
    setCurrentSrc(newUrl);
    setCurrentSrcSet(src ? getResponsiveSrcSet(src) : '');
    setRetryStage(0);
    setIsLoaded(false);
    setHasFailed(!newUrl);
    
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src, fallbackSrc, defaultWidth]);

  const handleError = () => {
    // Multi-tier recovery sequence:
    // Tier 1: If current URL was a proxy or wsrv.nl, extract the raw URL
    if (retryStage === 0 && currentSrc.includes('wsrv.nl')) {
      try {
        const rawUrl = new URL(currentSrc).searchParams.get('url');
        if (rawUrl) {
          setRetryStage(1);
          setCurrentSrc(decodeURIComponent(rawUrl));
          setCurrentSrcSet(''); // Disable srcSet on retry
          return;
        }
      } catch {}
    }

    // Tier 2: If it is an enhanced_4k webp that failed, try the unenhanced original JPEG/PNG
    if (retryStage <= 1 && currentSrc.includes('enhanced_4k_')) {
      const originalPath = currentSrc.replace('enhanced_4k_', '').replace(/\.webp$/, '.jpeg');
      setRetryStage(2);
      setCurrentSrc(originalPath);
      setCurrentSrcSet('');
      return;
    }

    // Tier 3: If productName is provided, look up from SEED_FALLBACK_PRODUCTS
    if (retryStage <= 2 && productName) {
      const norm = (s: string) => s.replace(/[\u064B-\u065F\u0670]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/[-—_]/g, ' ').trim();
      const cleanTarget = norm(productName);
      const match = SEED_FALLBACK_PRODUCTS.find(p => norm(p.nameAr).includes(cleanTarget) || cleanTarget.includes(norm(p.nameAr)));
      if (match && match.images && match.images[0] && match.images[0] !== currentSrc) {
        setRetryStage(3);
        setCurrentSrc(match.images[0]);
        setCurrentSrcSet(getResponsiveSrcSet(match.images[0]));
        return;
      }
    }

    // Tier 4: If fallbackSrc was provided and different
    if (retryStage <= 3 && fallbackSrc && fallbackSrc !== currentSrc) {
      setRetryStage(4);
      setCurrentSrc(fallbackSrc);
      setCurrentSrcSet('');
      return;
    }
    
    setHasFailed(true);
    console.warn(`[Sulta Image] Failed to load after recovery attempts: ${productName || alt}`);
  };

  const handleLoad = () => {
    setIsLoaded(true);
    setHasFailed(false);
  };

  const alignmentClass = alignment === 'top' ? 'object-top' : alignment === 'bottom' ? 'object-bottom' : 'object-center';
  const displayName = productName || alt || 'منتج سولته';

  if (hasFailed || !currentSrc) {
    return (
      <div 
        className={`w-full h-full bg-gray-50 flex flex-col items-center justify-center p-4 text-center select-none aspect-[3/4] border border-gray-100/50 rounded-2xl ${className}`}
        role="img"
        aria-label={alt || `${displayName} - الصورة غير متوفرة`}
      >
        <span className="text-[10px] font-bold text-gray-400 bg-white/50 px-3 py-1.5 rounded-full border border-gray-100">صورة غير متوفرة</span>
      </div>
    );
  }

  return (
    <div 
      className={`relative overflow-hidden group transition-all duration-500 ${contain ? 'bg-white' : 'bg-gray-50'} ${className}`}
      style={{ aspectRatio: contain ? 'auto' : '3/4' }}
    >
      {/* Skeleton / Placeholder */}
      <div className={`absolute inset-0 z-0 bg-gradient-to-br from-gray-100 to-gray-50 animate-pulse transition-opacity duration-700 ${isLoaded ? 'opacity-0' : 'opacity-100'}`} />

      <img
        key={currentSrc}
        ref={imgRef}
        src={currentSrc}
        srcSet={currentSrcSet || props.srcSet}
        sizes={props.sizes || "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
        alt={alt || displayName}
        width={width || (contain ? undefined : 600)}
        height={height || (contain ? undefined : 800)}
        className={`w-full h-full block ${imgClassName || (contain ? 'object-contain' : 'object-cover')} ${alignmentClass} relative z-10 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-md'}`}
        onError={handleError}
        onLoad={handleLoad}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'low'}
        decoding="async"
        {...props}
      />
      
      {/* Glass overlay on hover for premium feel */}
      <div className="absolute inset-0 z-20 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
    </div>
  );
}
