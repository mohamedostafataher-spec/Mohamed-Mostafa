import React, { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { cleanImgUrl } from '../services/db';
import { logSystemError } from '../utils/logger';

interface SultaImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  skeletonClassName?: string;
  imgClassName?: string;
}

const DEFAULT_FALLBACK = '/img/sulta_hero_banner_real.png'; // A safe fallback if image completely fails

export default function SultaImage({ 
  src, 
  alt, 
  className = '', 
  skeletonClassName = '',
  imgClassName = 'object-cover',
  fallbackSrc = DEFAULT_FALLBACK,
  ...props 
}: SultaImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | undefined>(src ? cleanImgUrl(src) : undefined);

  useEffect(() => {
    // Reset state if src changes
    setIsLoaded(false);
    setHasError(false);
    setImgSrc(src ? cleanImgUrl(src) : undefined);
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      logSystemError('IMAGE_LOAD_FAILURE', `Failed to load image for alt: ${alt || 'Unknown'}`, { src });
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton / Brand Luxury Placeholder */}
      {(!isLoaded || hasError) && (
        <div className={`absolute inset-0 bg-[#FAF9F6] flex flex-col items-center justify-center border border-gray-100 p-4 select-none ${skeletonClassName}`}>
          {/* Subtle slow pulse shine effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#FAF9F6] via-[#FAF5F0] to-[#FAF9F6] opacity-60 animate-pulse" style={{ animationDuration: '3s' }} />
          
          <div className="relative z-10 flex flex-col items-center gap-1.5 text-center">
            <span className="text-xl md:text-2xl animate-bounce" style={{ animationDuration: '4s' }}>👑</span>
            <span className="font-serif uppercase tracking-[0.3em] text-[#0C0C0C] text-[9px] md:text-[10px] font-bold">SULTA</span>
            <span className="text-[7px] text-gray-400 font-sans tracking-wide">ATELIER</span>
          </div>
        </div>
      )}
      
      {imgSrc && (
        <img
          src={imgSrc}
          alt={alt || "Sulta Product"}
          className={`w-full h-full transition-opacity duration-700 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  );
}
