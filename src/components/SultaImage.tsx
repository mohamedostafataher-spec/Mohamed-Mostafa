import React, { useState, useEffect } from 'react';
import { cleanImgUrl } from '../services/db';

interface SultaImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  skeletonClassName?: string;
  imgClassName?: string;
}

const DEFAULT_FALLBACK = '/img/sulta_default_1_1781140865386.png';

export default function SultaImage({ 
  src, 
  alt, 
  className = '', 
  skeletonClassName = '',
  imgClassName = 'object-cover',
  fallbackSrc = DEFAULT_FALLBACK,
  ...props 
}: SultaImageProps) {
  const initialUrl = src ? cleanImgUrl(src) : fallbackSrc;
  const [imgSrc, setImgSrc] = useState<string>(initialUrl);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const nextUrl = src ? cleanImgUrl(src) : fallbackSrc;
    if (!src || src.trim() === '') {
      console.warn('[SultaImage] Missing image source for element:', alt || 'unnamed product');
    }
    setImgSrc(nextUrl);
    setHasError(false);
  }, [src, fallbackSrc, alt]);

  const handleError = () => {
    if (!hasError) {
      console.warn('[SultaImage] Failed to load image URL:', imgSrc, 'falling back to:', fallbackSrc);
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <div className={`relative overflow-hidden bg-[#F8F9FA] ${className}`}>
      <img
        src={imgSrc}
        alt={alt || "SULTA Product"}
        className={`w-full h-full ${imgClassName} opacity-100 transition-opacity duration-300`}
        onError={handleError}
        loading="eager"
        decoding="async"
        {...props}
      />
    </div>
  );
}

