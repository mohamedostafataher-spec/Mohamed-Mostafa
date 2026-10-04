import React, { useState, useEffect, useRef } from 'react';
import { cleanImgUrl } from '../services/db';

interface SultaImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  imgClassName?: string;
}

const DEFAULT_FALLBACK = '/img/sulta_default_1_1781140865386.png';

export default function SultaImage({ 
  src, 
  alt, 
  className = '', 
  imgClassName = 'object-cover',
  fallbackSrc = DEFAULT_FALLBACK,
  ...props 
}: SultaImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(src ? cleanImgUrl(src) : fallbackSrc);
  const [errorCount, setErrorCount] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  // Sync with prop changes
  useEffect(() => {
    const newUrl = src ? cleanImgUrl(src) : fallbackSrc;
    setCurrentSrc(newUrl);
    setErrorCount(0);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (errorCount < 1) {
      setCurrentSrc(fallbackSrc);
      setErrorCount(1);
    } else if (errorCount < 2) {
      setCurrentSrc(DEFAULT_FALLBACK);
      setErrorCount(2);
    }
  };

  return (
    <div className={`relative overflow-hidden bg-gray-100/20 ${className} flex items-center justify-center`}>
      <img
        key={currentSrc}
        ref={imgRef}
        src={currentSrc}
        alt={alt || "SULTA Product"}
        className={`w-full h-full block ${imgClassName} relative z-10 transition-opacity duration-300`}
        onError={handleError}
        loading="eager"
        referrerPolicy="no-referrer"
        {...props}
      />
    </div>
  );
}
