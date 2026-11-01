import React, { useState, useEffect, useRef } from 'react';
import { cleanImgUrl } from '../services/db';

interface SultaImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  imgClassName?: string;
  priority?: boolean;
  contain?: boolean;
  alignment?: 'center' | 'top' | 'bottom';
}

const DEFAULT_FALLBACK = '/img/sulta_product_1.webp';

// Fast check for local optimized WebP asset
const getOptimizedSrc = (url: string, width?: number | string): string => {
  if (!url) return DEFAULT_FALLBACK;
  const cleaned = cleanImgUrl(url, width);
  // If local /img/*.png or /img/*.jpg, serve the high-speed WebP version
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
  fallbackSrc = DEFAULT_FALLBACK,
  priority = false,
  contain = false,
  alignment = 'center',
  width,
  ...props 
}: SultaImageProps) {
  const initialUrl = src ? getOptimizedSrc(src, width) : fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState<string>(initialUrl);
  const [errorCount, setErrorCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Sync with prop changes
  useEffect(() => {
    const newUrl = src ? getOptimizedSrc(src, width) : fallbackSrc;
    setCurrentSrc(newUrl);
    setErrorCount(0);
    setIsLoaded(false);
    
    // Check if browser already has it cached
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
    
    if (errorCount < 2) {
      setCurrentSrc(fallbackSrc || '/img/sulta_product_1.webp');
      setErrorCount(2);
    } else if (errorCount < 3) {
      setCurrentSrc('/img/sulta_product_2.webp');
      setErrorCount(3);
    } else {
      setCurrentSrc('/img/sulta_default_1_1781140865386.webp');
      setErrorCount(4);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  // Alignment classes
  const alignmentClass = alignment === 'top' ? 'object-top' : alignment === 'bottom' ? 'object-bottom' : 'object-center';

  // Default image classes with contain/cover logic
  const defaultImgClasses = contain 
    ? `object-contain ${alignmentClass} bg-white` 
    : `object-cover ${alignmentClass} aspect-[3/4]`;

  return (
    <div 
      className={`relative overflow-hidden ${contain ? 'bg-white' : 'bg-transparent'} ${className}`}
    >
      {/* Lightweight Loading Skeleton - Match the aspect ratio to reduce CLS */}
      {!isLoaded && (
        <div className="absolute inset-0 z-0 bg-neutral-100 animate-pulse flex items-center justify-center aspect-[3/4]">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-[#A44C5C] rounded-full animate-spin opacity-40" />
        </div>
      )}

      <img
        key={currentSrc}
        ref={imgRef}
        src={currentSrc}
        alt={alt || "بيجامة نسائية فاخرة من Sulta"}
        className={`w-full block ${imgClassName || defaultImgClasses} relative z-10 transition-all duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
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

