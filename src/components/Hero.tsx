import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Settings } from '../types';
import { cleanImgUrl } from '../services/db';
import SultaImage from './SultaImage';

interface HeroProps {
  onExplore: () => void;
  onDiscoverNew: () => void;
  settings?: Settings;
  homepageSections?: any[];
}

export default function Hero({ onExplore, onDiscoverNew, settings, homepageSections = [] }: HeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Parse dynamic hero banners from table 'homepage_sections' or use clean fallbacks
  const heroSection = homepageSections.find(s => s.section_key === 'hero_banners');
  const dynamicBanners = heroSection?.content_json?.banners || [];
  const dbActiveBanners = dynamicBanners.filter((b: any) => b.active !== false);

  const fallbackBanners = [
    {
      mediaUrl: '/img/hero_pajama_lifestyle_1_1780682110287.png',
      title: 'أزياء النوم الفاخرة',
      subtitle: 'بيجامات وأرواب الساتان الإيطالي المبرد',
      ctaText: 'تسوقي التشكيلة الآن',
      mediaType: 'image'
    },
    {
      mediaUrl: '/img/hero_pajama_editorial_2_1780682126486.png',
      title: 'تشكيلة SULTA الملكية',
      subtitle: 'نعومة فائقة وأناقة منسوجة بعناية',
      ctaText: 'اكتشفي الموديلات',
      mediaType: 'image'
    },
    {
      mediaUrl: '/img/hero_pajama_detail_3_1780682140472.png',
      title: 'فساتين نوم كوتور',
      subtitle: 'تصاميم راقية لأمسيات مفعمة بالراحة',
      ctaText: 'تصفحي الفساتين',
      mediaType: 'image'
    }
  ];

  const activeBanners = dbActiveBanners.length > 0 ? dbActiveBanners : fallbackBanners;

  const slides = activeBanners.map((b: any) => ({
    url: cleanImgUrl(b.mediaUrl || b.url, 'sleepwear'),
    alt: b.title || 'SULTA',
    title: b.title || 'أزياء النوم الفاخرة',
    subtitle: b.subtitle || 'بيجامات وأرواب الساتان الملكي',
    ctaText: b.ctaText || 'تسوقي الآن',
    mediaType: b.mediaType || 'image'
  }));

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const currentSlideData = slides[currentSlide];

  if (!currentSlideData) return null;

  return (
    <section 
      className="relative h-[200px] sm:h-[280px] md:h-[360px] lg:h-[420px] flex items-center justify-start overflow-hidden bg-white select-none cursor-pointer group"
      onClick={onExplore}
    >
      {/* Background visual with slide transition */}
      <div className="absolute inset-0 z-0">
        {slides.map((slide, idx) => {
          const isActive = idx === currentSlide;
          return (
            <div
              key={slide.url + idx}
              className={`absolute inset-0 w-full h-full transform transition-all duration-1000 ease-in-out ${
                isActive ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0'
              }`}
            >
              {slide.mediaType === 'video' ? (
                <video
                  src={slide.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <SultaImage
                  src={slide.url}
                  alt={slide.alt}
                  className="w-full h-full"
                  imgClassName="object-cover object-center"
                />
              )}
              {/* Clean Salla style gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/60 to-transparent sm:from-white/85 sm:via-white/50" />
            </div>
          );
        })}
      </div>

      {/* Content overlay - Minimal & Elegant like Salla */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12" dir="rtl">
        <div className="max-w-md text-right space-y-2 sm:space-y-3">
          
          <h2 className="font-serif text-xl sm:text-3xl md:text-4xl lg:text-5xl text-[#111827] font-bold leading-tight drop-shadow-2xs">
            {currentSlideData.title}
          </h2>

          {currentSlideData.subtitle && (
            <p className="font-sans text-xs sm:text-sm md:text-base text-gray-700 font-medium">
              {currentSlideData.subtitle}
            </p>
          )}

          <div className="pt-1 sm:pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExplore();
              }}
              className="bg-[#111827] hover:bg-[#A44C5C] text-white px-5 py-2 sm:px-6 sm:py-2.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shadow-sm hover:scale-102 active:scale-98 cursor-pointer"
            >
              <span>{currentSlideData.ctaText}</span>
              <ArrowLeft size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Slide Indicator Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 z-20">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide(idx);
              }}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentSlide ? 'w-5 bg-[#111827]' : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`شريحة ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
