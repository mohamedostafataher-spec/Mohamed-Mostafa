import React, { useState, useEffect, useRef } from 'react';
import { cleanImgUrl } from '../services/db';

interface SultaImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  imgClassName?: string;
  priority?: boolean;
}

const DEFAULT_FALLBACK = '/img/sulta_product_1.webp';

// Fast check for local optimized WebP asset
const getOptimizedSrc = (url: string): string => {
  if (!url) return DEFAULT_FALLBACK;
  const cleaned = cleanImgUrl(url);
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
  imgClassName = 'object-cover object-center',
  fallbackSrc = DEFAULT_FALLBACK,
  priority = false,
  ...props 
}: SultaImageProps) {
  const initialUrl = src ? getOptimizedSrc(src) : fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState<string>(initialUrl);
  const [errorCount, setErrorCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Sync with prop changes
  useEffect(() => {
    const newUrl = src ? getOptimizedSrc(src) : fallbackSrc;
    setCurrentSrc(newUrl);
    setErrorCount(0);
    setIsLoaded(false);
    
    // Check if browser already has it cached
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src, fallbackSrc]);

  const handleError = () => {
    // If WebP failed, fallback to original PNG/JPG or fallbackSrc
    if (errorCount === 0 && currentSrc.endsWith('.webp')) {
      const originalExt = currentSrc.replace('.webp', '.png');
      setCurrentSrc(originalExt);
      setErrorCount(1);
    } else if (errorCount < 2) {
      setCurrentSrc(fallbackSrc);
      setErrorCount(2);
    } else if (errorCount < 3) {
      setCurrentSrc('/img/sulta_product_2.webp');
      setErrorCount(3);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div className={`relative overflow-hidden bg-gray-50/50 ${className}`}>
      {/* Lightweight Loading Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-[#A44C5C] rounded-full animate-spin opacity-40" />
        </div>
      )}

      <img
        key={currentSrc}
        ref={imgRef}
        src={currentSrc}
        alt={alt || "SULTA Royal Couture"}
        className={`w-full h-full block ${imgClassName} relative z-10 transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onError={handleError}
        onLoad={handleLoad}
        loading={priority ? 'eager' : (props.loading || 'lazy')}
        decoding="async"
        referrerPolicy="no-referrer"
        {...props}
      />
    </div>
  );
}
