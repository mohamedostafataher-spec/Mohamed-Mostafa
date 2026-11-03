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

// Fast check for local optimized WebP asset
const getOptimizedSrc = (url: string, width?: number | string): string => {
  if (!url) return '';
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
  const [errorCount, setErrorCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasFailed, setHasFailed] = useState(!initialUrl);
  const imgRef = useRef<HTMLImageElement>(null);

  // Responsive sizes for srcSet
  const generateSrcSet = (url: string) => {
    if (!url || !url.startsWith('http') || url.includes('data:')) return undefined;
    
    const sizes = [400, 800, 1200];
    return sizes
      .map(w => {
        let baseUrl = url;
        if (url.includes('wsrv.nl')) {
           try {
             baseUrl = decodeURIComponent(url.split('url=')[1]?.split('&')[0]);
           } catch(e) {}
        }
        return `https://wsrv.nl/?url=${encodeURIComponent(baseUrl)}&w=${w}&output=webp&q=80&il ${w}w`;
      })
      .join(', ');
  };

  const srcSet = currentSrc ? generateSrcSet(currentSrc) : undefined;

  // Sync with prop changes
  useEffect(() => {
    const newUrl = src ? getOptimizedSrc(src, width) : fallbackSrc;
    setCurrentSrc(newUrl);
    setErrorCount(0);
    setIsLoaded(false);
    setHasFailed(!newUrl);
    
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src, fallbackSrc, width]);

  const handleError = () => {
    if (errorCount === 0 && currentSrc.includes('wsrv.nl/?url=')) {
      try {
        const rawUrl = currentSrc.split('url=')[1]?.split('&')[0];
        if (rawUrl) {
          const decoded = decodeURIComponent(rawUrl);
          setCurrentSrc(decoded);
          setErrorCount(1);
          return;
        }
      } catch (e) {}
    }
    
    // Strict requirement: No fake model or stock image fallbacks!
    setHasFailed(true);
    setCurrentSrc('');
  };

  const handleLoad = () => {
    setIsLoaded(true);
    setHasFailed(false);
  };

  const alignmentClass = alignment === 'top' ? 'object-top' : alignment === 'bottom' ? 'object-bottom' : 'object-center';

  // Neutral Gray Fallback Box (No fake models, No generic clothes icons)
  if (hasFailed || !currentSrc) {
    const displayName = productName || alt || 'سولته';
    return (
      <div 
        className={`w-full h-full bg-gray-100 flex flex-col items-center justify-center p-4 text-center select-none aspect-[3/4] ${className}`}
        role="img"
        aria-label={alt || displayName}
      >
        <span className="text-xs font-bold text-gray-700 line-clamp-2 px-2">{displayName}</span>
        <span className="text-[10px] text-gray-500 mt-1.5 font-medium">لا توجد صورة متوفرة</span>
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
        srcSet={srcSet}
        sizes={props.sizes || "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
        alt={alt || "بيجامة نسائية فاخرة من Sulta"}
        className={`w-full h-full block ${imgClassName || (contain ? 'object-contain' : 'object-cover')} ${alignmentClass} relative z-10 transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onError={handleError}
        onLoad={handleLoad}
        loading={priority ? 'eager' : (props.loading || 'lazy')}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
        referrerPolicy="no-referrer"
        width={typeof width === 'number' ? width : undefined}
        {...props}
      />
    </div>
  );
}
