import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { dbService, cleanImgUrl } from '../services/db';
import { getIdFromSlug, getProductSlug } from '../utils/slugify';
import SEO from './SEO';
import { ProductPrice } from './ProductPrice';
import { 
  ShoppingBag, 
  Heart, 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  ChevronRight, 
  ChevronLeft, 
  ArrowRight,
  Plus,
  Minus,
  MessageCircle,
  HelpCircle,
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
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<string>('One Size');
  const [quantity, setQuantity] = useState<number>(1);

  // Gallery & Media Interactive States
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);

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
          setSelectedSize('One Size');
          setActiveImageIdx(0);
          
          // Analytics (preserve exact pixels)
          trackViewContent(p, 'SAR');
          trackTikTokViewContent(p, 'SAR');

          // Ensure clean slug in URL
          const correctSlug = p.slug || getProductSlug({ id: p.id, nameEn: p.nameEn, nameAr: p.nameAr });
          if (slug !== correctSlug && slug !== `${p.id}-${correctSlug}`) {
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

    // Fetch similar products
    const unsub = dbService.subscribeProducts((prods) => {
      setAllProducts(prods.filter(item => item.status !== 'archived'));
    }, () => {});

    return () => unsub();
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
    setActiveImageIdx(prev => (prev + 1) % displayImages.length);
  };

  const handlePrevImage = () => {
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
        handleNextImage();
      } else {
        handlePrevImage();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const shortDesc = product.shortDescription || product.descriptionAr.slice(0, 150);
  const formattedTitle = product.seoTitle || `${product.nameAr} | سولتة`;
  const productSlug = product.slug || getProductSlug({ id: product.id, nameEn: product.nameEn, nameAr: product.nameAr });
  const canonicalUrl = `https://sulta.vercel.app/product/${productSlug}/`;

  // WhatsApp inquiry link
  const whatsappText = encodeURIComponent(`مرحباً سولتة، أود الاستفسار والطلب لمنتج: ${product.nameAr}\nالرابط: ${canonicalUrl}`);
  const whatsappUrl = `https://wa.me/966552823677?text=${whatsappText}`;

  // Price & strikethrough logic (strictly authentic)
  const price = product.salePriceSA || product.priceSA;
  const hasValidComparePrice = Boolean(
    product.compareAtPrice && 
    product.compareAtPrice > price &&
    (!product.saleEndsAt || new Date(product.saleEndsAt) > new Date())
  );

  const isOutOfStock = product.stock === 0;

  // JSON-LD for Product (STRICT: NO reviews, NO aggregateRating)
  const jsonLd: any = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.nameAr,
    "image": displayImages,
    "description": shortDesc,
    "sku": product.sku || product.id,
    "brand": {
      "@type": "Brand",
      "name": "سولتة"
    },
    "material": product.material || product.fabricAr,
    "audience": {
      "@type": "PeopleAudience",
      "suggestedGender": "female"
    },
    "size": "One Size (45-80 kg)",
    "offers": {
      "@type": "Offer",
      "url": canonicalUrl,
      "priceCurrency": "SAR",
      "price": price,
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition"
    }
  };

  if (hasValidComparePrice && product.saleEndsAt) {
    jsonLd.offers.priceValidUntil = product.saleEndsAt;
  }

  // BreadcrumbList JSON-LD
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
        "item": "https://sulta.vercel.app/store/"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.nameAr,
        "item": canonicalUrl
      }
    ]
  };

  const isCrinkle = (product.material || product.fabricAr).includes('كوريشة');

  const faqJsonLd = {
    "@context": "https://schema.org/",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "ما المقاس؟",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "وان سايز يناسب من 45 إلى 80 كيلو."
        }
      },
      {
        "@type": "Question",
        "name": "من أي خامة؟",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": isCrinkle ? "قطن كوريشة ناعم ومريح." : "قطن ناعم ومريح."
        }
      },
      {
        "@type": "Question",
        "name": "كيف أغسلها؟",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "بمويه باردة، ويفضّل بدون كلور، مع تجنّب الحرارة العالية."
        }
      },
      {
        "@type": "Question",
        "name": "هل الكمية متوفرة؟",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `الكمية محدودة، وتظهر المتبقية في الصفحة.`
        }
      }
    ]
  };

  const similarProducts = allProducts.filter(p => p.id !== product.id).slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10" dir="rtl">
      <SEO 
        title={formattedTitle}
        description={shortDesc}
        path={`/product/${productSlug}/`}
        image={currentMainImage}
        type="product"
      />
      
      <script type="application/ld+json">
        {JSON.stringify([jsonLd, breadcrumbJsonLd, faqJsonLd])}
      </script>

      {/* Free Shipping Banner */}
      <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-2xs">
        <span className="flex items-center gap-1.5">
          <Truck size={16} className="text-emerald-700" />
          <span>شحن مجاني لكافة مدن المملكة للطلبات فوق 299 ر.س 🇸🇦</span>
        </span>
        <span className="text-emerald-700 font-sans text-xs">سولتة SULTA</span>
      </div>

      {/* Back to store shortcut */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/store')}
          className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-gray-600 hover:text-[#A44C5C] transition-colors cursor-pointer group"
        >
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          <span>العودة لجميع تشكيلات المتجر</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14">
        {/* Product Media & Gallery */}
        <div className="space-y-4">
          <div 
            className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden bg-neutral-900 border border-gray-200 shadow-sm select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <SultaImage 
              src={currentMainImage} 
              alt={product.nameAr} 
              className="w-full h-full"
              imgClassName="w-full h-full object-cover object-center"
              priority={true}
            />

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
          </div>

          {/* Interactive Thumbnails */}
          {displayImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none pt-1">
              {displayImages.map((img, idx) => {
                const isSelected = activeImageIdx === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative flex-shrink-0 w-20 h-24 rounded-2xl overflow-hidden bg-gray-100 border-2 transition-all duration-200 cursor-pointer ${
                      isSelected 
                        ? 'border-[#A44C5C] ring-2 ring-[#A44C5C]/30 shadow-md' 
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
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Product Details & Actions */}
        <div className="space-y-6 md:space-y-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {product.stock <= 10 && product.stock > 0 && (
                <span className="inline-block bg-rose-50 text-rose-700 text-xs font-bold px-3 py-1 rounded-full">
                  متبقي {product.stock} قطع فقط
                </span>
              )}
              {isOutOfStock && (
                <span className="inline-block bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">
                  نفدت الكمية
                </span>
              )}
              <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
                وان سايز (45 - 80 كيلو)
              </span>
            </div>

            {/* H1 Heading exactly as requested */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-950 tracking-tight">
              {product.h1 || `${product.nameAr} — قطن وان سايز`}
            </h1>

            <div className="flex items-center gap-4 pt-1">
              <span className="text-2xl font-black text-[#A44C5C]">{price} ر.س</span>
              {hasValidComparePrice && (
                <span className="text-base text-gray-400 line-through font-bold">
                  {product.compareAtPrice} ر.س
                </span>
              )}
            </div>

            {/* Structured specs box */}
            <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-2.5 text-sm text-gray-800 my-4">
              <div className="flex items-start gap-2">
                <span className="font-bold text-gray-900 w-24 flex-shrink-0">الخامة:</span>
                <span className="text-gray-700">{product.material || product.fabricAr}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-gray-900 w-24 flex-shrink-0">المقاس:</span>
                <span className="text-gray-700">{product.sizeInfo || 'وان سايز يناسب من 45 إلى 80 كيلو'}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-gray-900 w-24 flex-shrink-0">تعليمات الغسيل:</span>
                <span className="text-gray-700">{product.careInstructions || product.washInstructionsAr}</span>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed text-sm sm:text-base pt-2 whitespace-pre-line">
              {product.descriptionAr}
            </p>
          </div>

          {/* Color Selector */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <label className="text-xs sm:text-sm font-bold text-gray-900 block">
                اللون: <span className="text-[#A44C5C] font-black">{selectedColor?.name || 'الافتراضي'}</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((c, idx) => {
                  const isSelected = selectedColor?.name === c.name;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border-2 transition-all cursor-pointer ${
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

          {/* Size Info */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="text-xs sm:text-sm font-bold text-gray-900 block">
              المقاس: <span className="text-[#A44C5C] font-black">One Size (وان سايز)</span>
            </label>
            <div className="inline-block bg-gray-50 border-2 border-gray-300 text-gray-900 px-4 py-2 rounded-xl font-bold text-sm">
              وان سايز مريح (يناسب 45 إلى 80 كيلو)
            </div>
          </div>

          {/* Quantity and Actions */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              {/* Quantity Controller */}
              <div className="flex items-center border-2 border-gray-200 rounded-2xl bg-white px-2 py-1 select-none">
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  aria-label="تقليل الكمية"
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center font-black text-sm">{quantity}</span>
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  aria-label="زيادة الكمية"
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => onAddToCart(product, selectedColor, 'One Size', quantity)}
                className="flex-1 bg-[#111827] hover:bg-black text-white py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all active:scale-98 shadow-md cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <ShoppingBag size={20} />
                <span>{isOutOfStock ? 'نفدت الكمية' : `إضافة إلى الحقيبة (${quantity})`}</span>
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

            {/* Direct WhatsApp Ordering */}
            <a 
              href={whatsappUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold py-3.5 px-6 rounded-2xl transition-colors shadow-sm text-center text-sm sm:text-base cursor-pointer"
            >
              <MessageCircle size={20} />
              <span>طلب مباشر واستفسار عبر واتساب</span>
            </a>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50/80 border border-gray-100">
              <div className="w-8 h-8 bg-emerald-100/70 rounded-full flex items-center justify-center text-emerald-700 flex-shrink-0">
                <ShieldCheck size={18} />
              </div>
              <span className="text-xs font-bold text-gray-800">قطن مريح عالي الجودة</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50/80 border border-gray-100">
              <div className="w-8 h-8 bg-blue-100/70 rounded-full flex items-center justify-center text-blue-700 flex-shrink-0">
                <Truck size={18} />
              </div>
              <span className="text-xs font-bold text-gray-800">توصيل لكافة مدن المملكة</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50/80 border border-gray-100">
              <div className="w-8 h-8 bg-amber-100/70 rounded-full flex items-center justify-center text-amber-700 flex-shrink-0">
                <RefreshCw size={18} />
              </div>
              <span className="text-xs font-bold text-gray-800">استبدال سهل وسلس</span>
            </div>
          </div>

          {/* Visible FAQ Accordion */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg sm:text-xl font-bold text-gray-950 mb-3 flex items-center gap-2">
              <HelpCircle size={20} className="text-[#A44C5C]" />
              <span>الأسئلة الشائعة حول هذا المنتج</span>
            </h2>
            <div className="space-y-2.5">
              <details className="bg-white border border-gray-200 rounded-xl p-3.5 transition-all open:bg-gray-50/50" open>
                <summary className="font-bold cursor-pointer text-gray-900 text-sm">س: ما المقاس؟</summary>
                <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                  ج: وان سايز يناسب من 45 إلى 80 كيلو.
                </p>
              </details>
              <details className="bg-white border border-gray-200 rounded-xl p-3.5 transition-all open:bg-gray-50/50">
                <summary className="font-bold cursor-pointer text-gray-900 text-sm">س: من أي خامة؟</summary>
                <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                  ج: {isCrinkle ? 'قطن كوريشة ناعم ومريح.' : 'قطن ناعم ومريح.'}
                </p>
              </details>
              <details className="bg-white border border-gray-200 rounded-xl p-3.5 transition-all open:bg-gray-50/50">
                <summary className="font-bold cursor-pointer text-gray-900 text-sm">س: كيف أغسلها؟</summary>
                <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                  ج: بمويه باردة، ويفضّل بدون كلور، مع تجنّب الحرارة العالية.
                </p>
              </details>
              <details className="bg-white border border-gray-200 rounded-xl p-3.5 transition-all open:bg-gray-50/50">
                <summary className="font-bold cursor-pointer text-gray-900 text-sm">س: هل الكمية متوفرة؟</summary>
                <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                  ج: الكمية محدودة، وتظهر المتبقية في الصفحة.
                </p>
              </details>
            </div>
          </div>

          {/* Similar Products */}
          {similarProducts.length > 0 && (
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-lg font-bold text-gray-950 mb-3">منتجات مشابهة</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {similarProducts.map(sim => {
                  const simSlug = sim.slug || getProductSlug({ id: sim.id, nameEn: sim.nameEn, nameAr: sim.nameAr });
                  return (
                    <a
                      key={sim.id}
                      href={`/product/${simSlug}/`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/product/${simSlug}`);
                      }}
                      className="group block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
                        <img 
                          src={cleanImgUrl(sim.images?.[0])} 
                          alt={sim.nameAr} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          loading="lazy" 
                        />
                      </div>
                      <div className="p-2.5 text-right">
                        <span className="text-xs font-bold text-gray-900 line-clamp-1 group-hover:text-[#A44C5C]">{sim.nameAr}</span>
                        <span className="text-xs font-black text-[#A44C5C] mt-1 block">{sim.salePriceSA || sim.priceSA} ر.س</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProductPage;
