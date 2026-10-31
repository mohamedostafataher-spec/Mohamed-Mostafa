import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { dbService, cleanImgUrl } from '../services/db';
import { getIdFromSlug, slugify } from '../utils/slugify';
import SEO from './SEO';
import { truncateTo155Words, formatProductTitle } from '../utils/textUtils';
import { ProductPrice } from './ProductPrice';
import { 
  ShoppingBag, 
  Heart, 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Film, 
  ArrowRight,
  Plus,
  Minus,
  Sparkles
} from 'lucide-react';
import { trackViewContent } from '../utils/analytics';
import { trackTikTokViewContent } from '../utils/tiktokPixel';
import SultaImage from './SultaImage';

interface ProductPageProps {
  onAddToCart: (product: Product, color: any, size: string, qty: number) => void;
  toggleFavorite: (id: string) => void;
  favorites: string[];
}

const ProductPage: React.FC<ProductPageProps> = ({ onAddToCart, toggleFavorite, favorites }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Gallery & Media Interactive States
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [isVideoActive, setIsVideoActive] = useState<boolean>(false);

  // Touch Swipe Handling for Mobile
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    const id = getIdFromSlug(slug);
    
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const p = await dbService.getProductById(id);
        if (p) {
          setProduct(p);
          setSelectedColor(p.colors?.[0] || null);
          setSelectedSize(p.sizes?.[0] || '');
          setActiveImageIdx(0);
          setIsVideoActive(false);
          
          // Analytics
          trackViewContent(p, 'SAR');
          trackTikTokViewContent(p, 'SAR');

          // Correct URL to pretty slug if needed
          const correctSlug = `${p.id}-${slugify(p.nameEn || p.nameAr || '')}`;
          if (slug !== correctSlug && !slug.startsWith(p.id)) {
            navigate(`/product/${correctSlug}`, { replace: true });
          }
        } else {
          navigate('/404');
        }
      } catch (err) {
        console.error(err);
        navigate('/404');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#A44C5C] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) return null;

  const isFav = favorites.includes(product.id);

  // Build clean images array
  const rawList = Array.isArray(product.images) && product.images.length > 0 
    ? product.images 
    : [cleanImgUrl('', product.category)];
  const displayImages = rawList.map(img => cleanImgUrl(img, product.category));

  const currentMainImage = displayImages[activeImageIdx] || displayImages[0];

  const handleNextImage = () => {
    setIsVideoActive(false);
    setActiveImageIdx(prev => (prev + 1) % displayImages.length);
  };

  const handlePrevImage = () => {
    setIsVideoActive(false);
    setActiveImageIdx(prev => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isSwipe = Math.abs(distance) > 40;

    if (isSwipe) {
      if (distance > 0) {
        // Swiped left in RTL: advance to next image
        handleNextImage();
      } else {
        // Swiped right in RTL: go back to previous image
        handlePrevImage();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const cleanShortDesc = truncateTo155Words(product.descriptionAr);
  const formattedTitle = formatProductTitle(product.nameAr);

  // JSON-LD for Product
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.nameAr,
    "image": displayImages,
    "description": cleanShortDesc,
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": "SULTA Atelier"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://sulta.vercel.app/product/${slug}`,
      "priceCurrency": "SAR",
      "price": product.salePriceSA || product.priceSA,
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };

  // Breadcrumb JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "الرئيسية",
        "item": "https://sulta.vercel.app/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "المتجر",
        "item": "https://sulta.vercel.app/store"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.nameAr,
        "item": `https://sulta.vercel.app/product/${slug}`
      }
    ]
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10" dir="rtl">
      <SEO 
        title={formattedTitle}
        description={cleanShortDesc}
        path={`/product/${slug}`}
        image={currentMainImage}
        type="product"
      />
      
      <script type="application/ld+json">
        {JSON.stringify([jsonLd, breadcrumbJsonLd])}
      </script>

      {/* Back to store shortcut */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/store')}
          className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-gray-600 hover:text-[#A44C5C] transition-colors cursor-pointer group"
        >
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          <span>العودة لجميع تشكيلات المتجر</span>
        </button>
        <span className="text-xs text-gray-400 font-sans">
          رقم القطعة: <span className="font-mono text-gray-600">{product.id.slice(0, 8)}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14">
        {/* Product Media & Interactive Gallery */}
        <div className="space-y-4">
          {/* Main Visual Display Frame (3:4 ratio) with Swipe & Flip Controls */}
          <div 
            className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden bg-neutral-900 border border-gray-200 shadow-sm select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {isVideoActive ? (
              <div className="w-full h-full relative bg-black flex items-center justify-center">
                {product.video ? (
                  (() => {
                    const isYouTube = product.video.includes('youtube.com') || product.video.includes('youtu.be');
                    const isVimeo = product.video.includes('vimeo.com');

                    if (isYouTube) {
                      let vidId = '';
                      if (product.video.includes('v=')) {
                        vidId = product.video.split('v=')[1].split('&')[0];
                      } else if (product.video.includes('youtu.be/')) {
                        vidId = product.video.split('youtu.be/')[1];
                      } else if (product.video.includes('embed/')) {
                        vidId = product.video.split('embed/')[1];
                      }
                      return (
                        <iframe
                          src={`https://www.youtube.com/embed/${vidId}?autoplay=1&mute=0&loop=1&playlist=${vidId}`}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={product.nameAr}
                        />
                      );
                    }

                    if (isVimeo) {
                      const vidId = product.video.split('/').pop()?.split('?')[0];
                      return (
                        <iframe
                          src={`https://player.vimeo.com/video/${vidId}?autoplay=1&loop=1`}
                          className="w-full h-full border-0"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                          title={product.nameAr}
                        />
                      );
                    }

                    return (
                      <video
                        src={product.video}
                        className="w-full h-full object-cover"
                        controls
                        autoPlay
                        loop
                        playsInline
                      />
                    );
                  })()
                ) : (
                  <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center text-center p-6 text-white bg-gradient-to-b from-neutral-900 to-black">
                    <SultaImage 
                      src={currentMainImage} 
                      alt={product.nameAr}
                      className="absolute inset-0 w-full h-full object-cover opacity-40 scale-105 transition-transform duration-700" 
                    />
                    <div className="relative z-10 space-y-3">
                      <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mx-auto border border-white/20 text-[#F4B6C2]">
                        <Film size={26} />
                      </div>
                      <span className="text-[10px] tracking-widest uppercase text-[#F4B6C2] font-black">SULTA Haute Couture</span>
                      <h4 className="text-xl font-serif font-black">{product.nameAr}</h4>
                      <p className="text-xs text-gray-300 max-w-xs leading-relaxed">
                        استعراض تفاصيل خامات البيجامة الفاخرة ونعومة النسيج الملكي.
                      </p>
                    </div>
                  </div>
                )}

                {/* Return to Photos Pill */}
                <button
                  type="button"
                  onClick={() => setIsVideoActive(false)}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 hover:bg-[#A44C5C] text-white px-5 py-2 rounded-full text-xs font-bold border border-white/20 backdrop-blur-md transition-all shadow-lg flex items-center gap-2 cursor-pointer z-20"
                >
                  <span>عرض صور القطعة</span>
                  <span>📷</span>
                </button>
              </div>
            ) : (
              <>
                <SultaImage 
                  key={currentMainImage}
                  src={currentMainImage} 
                  alt={`${product.nameAr} - ${product.categoryAr || 'بيجامة'} سولتة فاخرة`}
                  className="w-full h-full"
                  imgClassName="object-cover"
                  priority={true}
                />

                {/* Counter Badge */}
                {displayImages.length > 1 && (
                  <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/10 shadow-sm">
                    {activeImageIdx + 1} / {displayImages.length}
                  </div>
                )}

                {/* Navigation Arrows for desktop and tablet */}
                {displayImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevImage();
                      }}
                      aria-label="الصورة السابقة"
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-900 shadow-md flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-sm"
                    >
                      <ChevronRight size={22} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextImage();
                      }}
                      aria-label="الصورة التالية"
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-900 shadow-md flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-sm"
                    >
                      <ChevronLeft size={22} />
                    </button>
                  </>
                )}

                {/* Video Preview Button if Video Exists */}
                {product.video && (
                  <button
                    type="button"
                    onClick={() => setIsVideoActive(true)}
                    className="absolute bottom-4 left-4 z-20 bg-[#A44C5C]/90 hover:bg-[#A44C5C] text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg backdrop-blur-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Play size={14} className="fill-current" />
                    <span>فيديو القطعة</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Interactive Thumbnails Gallery */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none pt-1">
            {displayImages.map((img, idx) => {
              const isSelected = !isVideoActive && activeImageIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setIsVideoActive(false);
                    setActiveImageIdx(idx);
                  }}
                  className={`relative flex-shrink-0 w-20 h-24 rounded-2xl overflow-hidden bg-gray-100 border-2 transition-all duration-200 cursor-pointer ${
                    isSelected 
                      ? 'border-[#A44C5C] ring-2 ring-[#A44C5C]/30 shadow-md scale-102' 
                      : 'border-gray-200 opacity-70 hover:opacity-100'
                  }`}
                  aria-label={`عرض الصورة ${idx + 1}`}
                >
                  <SultaImage 
                    src={img} 
                    alt={`${product.nameAr} - صورة مصغرة ${idx + 1}`} 
                    className="w-full h-full"
                    imgClassName="object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#A44C5C]/10 pointer-events-none" />
                  )}
                </button>
              );
            })}

            {/* Video Thumbnail Button */}
            {product.video && (
              <button
                type="button"
                onClick={() => setIsVideoActive(true)}
                className={`relative flex-shrink-0 w-20 h-24 rounded-2xl overflow-hidden bg-neutral-900 border-2 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-white ${
                  isVideoActive 
                    ? 'border-[#A44C5C] ring-2 ring-[#A44C5C]/30 shadow-md scale-102' 
                    : 'border-gray-300 opacity-75 hover:opacity-100'
                }`}
                aria-label="مشاهدة فيديو القطعة"
              >
                <div className="w-8 h-8 rounded-full bg-[#A44C5C] flex items-center justify-center mb-1 text-white shadow-sm">
                  <Play size={16} className="fill-current translate-x-[-1px]" />
                </div>
                <span className="text-[10px] font-bold">فيديو</span>
              </button>
            )}
          </div>
          <p className="text-[11px] text-gray-400 text-center font-sans">
            اسحبي الصورة لليمين أو اليسار للتنقل بين زوايا القطعة ✦
          </p>
        </div>

        {/* Product Info & Specifications */}
        <div className="space-y-6 md:space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-[#FAF4F5] text-[#A44C5C] px-3 py-1 rounded-full text-xs font-bold">
              <Sparkles size={14} />
              <span>{product.categoryAr || 'أزياء النوم الملكية'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-950 tracking-tight">
              {product.nameAr}
            </h1>

            <div className="flex items-center gap-4 pt-1">
              <ProductPrice product={product} country="SA" size="lg" />
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-bold">
                شامل الضريبة والشحن السريع 🇸🇦
              </span>
            </div>

            <p className="text-gray-600 leading-relaxed text-sm sm:text-base pt-2 whitespace-pre-line">
              {product.descriptionAr || "قطعة ملكية فاخرة من تشكيلة سولتة الحصرية، صُممت بعناية فائقة لتمنحكِ الراحة والأناقة التي تستحقينها."}
            </p>
          </div>

          {/* Color Selector */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-gray-900">
                  اللون المختار: <span className="text-[#A44C5C] font-black">{selectedColor?.name || 'الافتراضي'}</span>
                </label>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((c, idx) => {
                  const isSelected = selectedColor?.name === c.name;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedColor(c);
                        // If color has special images linked, switch to first one
                        if (c.images && c.images.length > 0) {
                          const matchingIdx = displayImages.findIndex(img => img.includes(c.images![0]));
                          if (matchingIdx > -1) setActiveImageIdx(matchingIdx);
                        }
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-[#A44C5C] bg-[#FAF4F5] text-[#A44C5C] font-bold shadow-xs' 
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span 
                        className="w-5 h-5 rounded-full border border-black/10 shadow-xs" 
                        style={{ backgroundColor: c.hex }} 
                      />
                      <span className="text-xs">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-gray-900">
                  المقاس: <span className="text-[#A44C5C] font-black">{selectedSize}</span>
                </label>
                <span className="text-[11px] text-gray-400 font-sans">مقاسات قياسية مريحة</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map((s, idx) => {
                  const isSelected = selectedSize === s;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`min-w-[50px] px-4 py-2.5 rounded-xl border-2 font-black text-sm transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#111827] text-white border-[#111827] shadow-sm' 
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity and Add to Cart Section */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              {/* Quantity Controller */}
              <div className="flex items-center border-2 border-gray-200 rounded-2xl bg-white px-2 py-1 select-none">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  aria-label="تقليل الكمية"
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                >
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center font-black text-sm">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => q + 1)}
                  aria-label="زيادة الكمية"
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={() => onAddToCart(product, selectedColor, selectedSize, quantity)}
                className="flex-1 bg-[#111827] hover:bg-black text-white py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all active:scale-98 shadow-md cursor-pointer"
              >
                <ShoppingBag size={20} />
                <span>إضافة إلى الحقيبة ({quantity})</span>
              </button>

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => toggleFavorite(product.id)}
                aria-label={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  isFav 
                    ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-xs' 
                    : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                }`}
              >
                <Heart size={22} className={isFav ? "fill-current" : ""} />
              </button>
            </div>
          </div>

          {/* Luxury Guarantees & Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50/80 border border-gray-100">
              <div className="w-8 h-8 bg-emerald-100/70 rounded-full flex items-center justify-center text-emerald-700 flex-shrink-0">
                <ShieldCheck size={18} />
              </div>
              <span className="text-xs font-bold text-gray-800">جودة ملكية أصلية</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50/80 border border-gray-100">
              <div className="w-8 h-8 bg-blue-100/70 rounded-full flex items-center justify-center text-blue-700 flex-shrink-0">
                <Truck size={18} />
              </div>
              <span className="text-xs font-bold text-gray-800">شحن سريع للباب</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50/80 border border-gray-100">
              <div className="w-8 h-8 bg-amber-100/70 rounded-full flex items-center justify-center text-amber-700 flex-shrink-0">
                <RefreshCw size={18} />
              </div>
              <span className="text-xs font-bold text-gray-800">استبدال سهل وسلس</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;

