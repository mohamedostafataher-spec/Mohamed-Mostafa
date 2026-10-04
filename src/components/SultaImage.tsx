import React, { useState, useEffect, useRef } from 'react';
import { cleanImgUrl } from '../services/db';

interface SultaImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  imgClassName?: string;
}

const DEFAULT_FALLBACK = '/img/sulta_product_1.png';

export default function SultaImage({ 
  src, 
  alt, 
  className = '', 
  imgClassName = 'object-cover object-center',
  fallbackSrc = DEFAULT_FALLBACK,
  ...props 
}: SultaImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(src ? cleanImgUrl(src) : fallbackSrc);
  const [errorCount, setErrorCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Sync with prop changes
  useEffect(() => {
    const newUrl = src ? cleanImgUrl(src) : fallbackSrc;
    setCurrentSrc(newUrl);
    setErrorCount(0);
    setIsLoaded(false);
    
    // Check if browser already has it cached
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    }
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (errorCount < 1) {
      setCurrentSrc(fallbackSrc);
      setErrorCount(1);
    } else if (errorCount < 2) {
      setCurrentSrc('/img/sulta_product_2.png');
      setErrorCount(2);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div className={`relative overflow-hidden bg-gray-50 ${className}`}>
      {/* Loading Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 z-0 bg-gray-100 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin opacity-30" />
        </div>
      )}

      <img
        key={currentSrc}
        ref={imgRef}
        src={currentSrc}
        alt={alt || "SULTA Product"}
        className={`w-full h-full block ${imgClassName} relative z-10 transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onError={handleError}
        onLoad={handleLoad}
        loading="eager"
        referrerPolicy="no-referrer"
        {...props}
      />
    </div>
  );
}
