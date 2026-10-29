import React, { useState, useRef } from 'react';
import { Play, Pause, ShoppingBag, ArrowLeft, Instagram, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { Product } from '../types';
import { cleanImgUrl } from '../services/db';

interface ReelsShowcaseProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, color: any, size: string, quantity: number) => void;
}

export default function ReelsShowcase({ products, onSelectProduct, onAddToCart }: ReelsShowcaseProps) {
  // Only use products that have a video or just use featured ones with cinematic motion
  const reelProducts = products.filter(p => p.featured || p.video).slice(0, 10);
  const [muted, setMuted] = useState(true);
  const [activeReelIndex, setActiveReelIndex] = useState(0);

  if (reelProducts.length === 0) return null;

  return (
    <section className="py-12 bg-white overflow-hidden" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
          <div className="text-right">
            <h3 className="text-lg sm:text-2xl font-black text-gray-900 flex items-center gap-2">
              <Instagram size={24} className="text-[#A44C5C]" />
              <span>معرض ريلز SULTA الملكي 🎬</span>
            </h3>
            <p className="text-gray-500 text-[11px] sm:text-xs mt-1">
              شاهدي انسيابية الأقمشة وفخامة التفاصيل في مقاطع قصيرة
            </p>
          </div>
          <button 
            onClick={() => setMuted(!muted)}
            className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-[#A44C5C] hover:text-white transition-all cursor-pointer shadow-sm"
            title={muted ? "كتم الصوت" : "تشغيل الصوت"}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>

        {/* Reels Horizontal Scroll */}
        <div className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x scrollbar-hide">
          {reelProducts.map((product, idx) => (
            <ReelCard 
              key={product.id} 
              product={product} 
              muted={muted} 
              isActive={activeReelIndex === idx}
              onInView={() => setActiveReelIndex(idx)}
              onSelect={() => onSelectProduct(product)}
              onAddToCart={() => onAddToCart(product, product.colors[0], product.sizes[0], 1)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ReelCard({ product, muted, isActive, onInView, onSelect, onAddToCart }: { 
  product: Product, 
  muted: boolean, 
  isActive: boolean,
  onInView: () => void,
  onSelect: () => void,
  onAddToCart: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection observer to trigger play/pause and onInView
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onInView();
          if (videoRef.current && product.video && !product.video.includes('youtube') && !product.video.includes('vimeo')) {
            videoRef.current.play().catch(() => {});
            setPlaying(true);
          }
        } else {
          if (videoRef.current) {
            videoRef.current.pause();
            setPlaying(false);
          }
        }
      },
      { threshold: 0.7 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [product.video]);

  const hasRealVideo = product.video && !product.video.includes('youtube') && !product.video.includes('vimeo');

  return (
    <div 
      ref={cardRef}
      className="relative shrink-0 w-[240px] sm:w-[280px] aspect-[9/16] rounded-3xl overflow-hidden shadow-xl border border-gray-100 snap-center group cursor-pointer"
      onClick={onSelect}
    >
      {/* Background: Video or Cinematic Image */}
      {hasRealVideo ? (
        <video
          ref={videoRef}
          src={product.video}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          muted={muted}
          playsInline
        />
      ) : (
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-gray-900">
          <img 
            src={cleanImgUrl(product.images[0], product.category)} 
            className="w-full h-full object-cover transition-transform duration-10000 group-hover:scale-125 group-hover:rotate-2" 
            alt={product.nameAr}
          />
          {/* Cinematic overlay for static images */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 animate-pulse">
                <Sparkles className="text-white" size={32} />
             </div>
          </div>
        </div>
      )}

      {/* Top Badges */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
         <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
           <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
           LIVE SHOWCASE
         </span>
      </div>

      {/* Bottom Info Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-4 pt-12 bg-gradient-to-t from-black via-black/40 to-transparent text-white text-right space-y-3">
        <div>
          <h4 className="font-bold text-sm sm:text-base line-clamp-1">{product.nameAr}</h4>
          <div className="flex items-center justify-end gap-2 mt-1">
            <span className="text-amber-400 font-black text-sm">{(product.salePriceSA || product.priceSA)} ر.س</span>
            <span className="text-white/60 line-through text-[10px]">{(product.priceSA * 2)} ر.س</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button
             onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
             className="flex-1 bg-white text-black py-2.5 rounded-2xl text-[11px] font-black flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors shadow-lg active:scale-95"
           >
             <ShoppingBag size={14} />
             <span>اشتري الآن</span>
           </button>
           <button 
             className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/40 transition-all"
           >
             {playing ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" className="mr-0.5" />}
           </button>
        </div>
      </div>

      {/* Decorative Border */}
      <div className="absolute inset-0 border-2 border-white/10 rounded-3xl pointer-events-none group-hover:border-white/30 transition-all" />
    </div>
  );
}
