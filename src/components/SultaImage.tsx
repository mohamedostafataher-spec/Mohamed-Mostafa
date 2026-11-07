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
  // Use 'md' as a safe default for components that don't specify width
  const defaultWidth = width || 'md';
  const initialUrl = src ? cleanImgUrl(src, defaultWidth) : fallbackSrc;
  
  const [currentSrc, setCurrentSrc] = useState<string>(initialUrl);
  const [retryStage, setRetryStage] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasFailed, setHasFailed] = useState(!initialUrl);
  const imgRef = useRef<HTMLImageElement>(null);

  // Sync with prop changes
  useEffect(() => {
    const newUrl = src ? cleanImgUrl(src, defaultWidth) : fallbackSrc;
    setCurrentSrc(newUrl);
    setRetryStage(0);
    setIsLoaded(false);
    setHasFailed(!newUrl);
    
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src, fallbackSrc, defaultWidth]);

  // Generate automated srcset for responsive delivery if it's a proxied URL
  const generateSrcSet = () => {
    if (!src || src.startsWith('data:') || src.startsWith('/')) return undefined;
    
    // We create a standard responsive ramp: sm (320), md (640), lg (1080), xl (1920)
    return [
      `${cleanImgUrl(src, 'sm')} 320w`,
      `${cleanImgUrl(src, 'md')} 640w`,
      `${cleanImgUrl(src, 'lg')} 1080w`,
      `${cleanImgUrl(src, 'xl')} 1920w`
    ].join(', ');
  };

  const srcSet = generateSrcSet();
  const sizes = props.sizes || '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw';

  const handleError = () => {
    if (retryStage === 0 && currentSrc.includes('wsrv.nl')) {
      try {
        const rawUrl = new URL(currentSrc).searchParams.get('url');
        if (rawUrl) {
          setRetryStage(1);
          setCurrentSrc(decodeURIComponent(rawUrl));
          return;
        }
      } catch {}
    }
    
    setHasFailed(true);
    console.warn(`[Sulta Image] Failed to load: ${productName || alt}`);
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
        srcSet={srcSet}
        sizes={sizes}
        alt={alt || displayName}
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
