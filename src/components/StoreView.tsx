import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Filter, Search, Heart, ShoppingBag, Eye, X, ChevronDown, 
  Sparkles, SlidersHorizontal, ArrowLeft, Play, Info, 
  Volume2, VolumeX, Check, Grid, RefreshCw, Star, ArrowUpDown, Wand2, Tag, Truck, ShieldCheck, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Country, Category } from '../types';
import StyleAssistant from './StyleAssistant';
import { ProductPrice } from './ProductPrice';
import SultaImage from './SultaImage';
import { cleanImgUrl } from '../services/db';
import { getProductSlug } from '../utils/slugify';
import ProductCard from './ProductCard';
import SEO from './SEO';
import { calculateEffectiveDiscount } from '../utils/discountUtils';

interface StoreViewProps {
  products: Product[];
  categories: Category[];
  country: Country;
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  onAddToCart: (product: Product, color: { name: string; hex: string }, size: string) => void;
  onSelectProduct: (product: Product) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
  onSearchQueryChange?: (query: string) => void;
  recentlyViewed?: Product[];
  initialCategory?: string;
}

export default function StoreView({
  products,
  categories,
  country,
  favorites,
  toggleFavorite,
  onAddToCart,
  onSelectProduct,
  searchQuery = '',
  onClearSearch,
  onSearchQueryChange,
  recentlyViewed = [],
  initialCategory
}: StoreViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [mobileLayout, setMobileLayout] = useState<'single' | 'double'>('double');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [activeThumbIndices, setActiveThumbIndices] = useState<Record<string, number>>({});
  const [cardColorSelections, setCardColorSelections] = useState<Record<string, { name: string; hex: string }>>({});
  const [showStyleAssistant, setShowStyleAssistant] = useState(false);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  // Dynamic Catalog Price Range Calculation
  const { minPriceCatalog, maxPriceCatalog } = useMemo(() => {
    if (!products || products.length === 0) {
      return { minPriceCatalog: 0, maxPriceCatalog: country === 'EG' ? 2000 : 1000 };
    }
    let min = Infinity;
    let max = 0;
    products.forEach(p => {
      const price = country === 'EG' ? (p.priceEG || 0) : (p.priceSA || 0);
      if (price > 0) {
        if (price < min) min = price;
        if (price > max) max = price;
      }
    });
    const safeMin = min === Infinity ? 0 : Math.floor(min);
    const safeMax = max <= safeMin ? safeMin + (country === 'EG' ? 1000 : 500) : Math.ceil(max);
    return { minPriceCatalog: safeMin, maxPriceCatalog: safeMax };
  }, [products, country]);

  const [maxPrice, setMaxPrice] = useState<number>(maxPriceCatalog);
  const [isPriceSliderOpen, setIsPriceSliderOpen] = useState<boolean>(true);

  // Sync maxPrice when country or catalog prices update
  useEffect(() => {
    setMaxPrice(maxPriceCatalog);
  }, [maxPriceCatalog, country]);
  
  // Quick view states
  const [qvSelectedSize, setQvSelectedSize] = useState<string>('');
  const [qvSelectedColor, setQvSelectedColor] = useState<{ name: string; hex: string } | null>(null);
  const [qvActiveImageIdx, setQvActiveImageIdx] = useState<number>(0);

  // Auto-select size & color when product is selected for quick view
  useEffect(() => {
    if (quickViewProduct) {
      setQvSelectedSize('One Size');
      setQvSelectedColor(quickViewProduct.colors?.[0] || { name: 'Rose', hex: '#DF8A9D' });
      setQvActiveImageIdx(0);
    }
  }, [quickViewProduct]);

  // Sync category names dynamically from existing Supabase list
  const displayCategories = useMemo(() => {
    return [
      { id: 'all', nameAr: 'جميع المنتجات', icon: '✦' },
      { id: 'offers', nameAr: 'عروض وتخفيضات 🏷️', icon: '🏷️' },
      { id: 'new', nameAr: 'وصل حديثاً ✨', icon: '✨' },
      { id: 'bestseller', nameAr: 'الأكثر مبيعاً 🔥', icon: '👑' },
      ...categories
        .map(c => ({ id: c.id, nameAr: c.nameAr || c.name, icon: '🌸' }))
    ];
  }, [categories]);

  // Unique Collections from Supabase products list
  const availableCollections = useMemo(() => {
    const cols = new Set<string>();
    products.forEach(p => {
      if (p.collection && p.collection.trim() !== '') {
        cols.add(p.collection);
      }
    });
    return ['all', ...Array.from(cols)];
  }, [products]);

  // Smart Query Filter & Sort
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      if (p.status === 'archived') return false;
      // Filter out broken products that don't have a name
      if (!p.nameAr && !p.nameEn) return false;
      return true;
    });
    
    // Category filter
    if (selectedCategory === 'offers') {
      result = result.filter(p => calculateEffectiveDiscount(p, null, country).hasActiveDiscount);
    } else if (selectedCategory === 'new') {
      result = result.filter(p => p.featured || p.status === 'active');
    } else if (selectedCategory === 'bestseller') {
      result = result.filter(p => p.isBestSeller || p.rating >= 4.8);
    } else if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory || p.categoryAr === selectedCategory);
    }

    // Collection filter
    if (selectedCollection !== 'all') {
      result = result.filter(p => p.collection === selectedCollection);
    }
    
    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => {
        const searchable = `
          ${p.nameEn || ''} ${p.nameAr || ''} 
          ${p.descriptionEn || ''} ${p.descriptionAr || ''} 
          ${p.category || ''} ${p.categoryAr || ''}
          ${p.collection || ''}
          ${p.fabricAr || ''} ${p.fabricEn || ''}
          ${p.colors?.map(c => c.name).join(' ') || ''}
          ${p.tagAr || ''}
        `.toLowerCase();
        return searchable.includes(q);
      });
    }

    // Price range slider filter
    if (maxPrice > 0 && maxPrice < maxPriceCatalog) {
      result = result.filter(p => {
        const price = country === 'EG' ? (p.priceEG || 0) : (p.priceSA || 0);
        return price <= maxPrice;
      });
    }

    // Safeguard: if result is empty due to filters, fallback to all products so store is never empty
    if (result.length === 0 && !searchQuery) {
      result = products.filter(p => p.status !== 'archived');
    }

    // Sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === 'bestseller') {
        return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
      }
      
      const priceA = country === 'EG' ? (a.salePriceEG || a.priceEG || 0) : (a.salePriceSA || a.priceSA || 0);
      const priceB = country === 'EG' ? (b.salePriceEG || b.priceEG || 0) : (b.salePriceSA || b.priceSA || 0);
      
      if (sortBy === 'price-low') return priceA - priceB;
      if (sortBy === 'price-high') return priceB - priceA;
      if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
      return 0;
    });
  }, [products, selectedCategory, selectedCollection, searchQuery, sortBy, country, maxPrice, maxPriceCatalog]);

  // Scroll Restoration Logic
  useEffect(() => {
    const savedPos = sessionStorage.getItem('sulta_store_scroll_pos');
    if (savedPos && !searchQuery) {
      setTimeout(() => {
        window.scrollTo({ top: parseInt(savedPos, 10), behavior: 'instant' });
      }, 50);
    }
    
    const handleScroll = () => {
      if (!searchQuery) {
        sessionStorage.setItem('sulta_store_scroll_pos', window.scrollY.toString());
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [searchQuery]);

  // Handle color change inside inline product card
  const handleCardColorSelect = (productId: string, color: { name: string; hex: string }, event: React.MouseEvent) => {
    event.stopPropagation();
    setCardColorSelections(prev => ({ ...prev, [productId]: color }));
  };

  // Thumbnail pointer interaction for inline hover gallery
  const handleThumbHover = (productId: string, idx: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveThumbIndices(prev => ({ ...prev, [productId]: idx }));
  };

  // Trigger feedback when user clicks Add to Cart
  const handleAddToCartWithFeedback = (product: Product, event: React.MouseEvent) => {
    event.stopPropagation();
    const chosenCol = cardColorSelections[product.id] || product.colors?.[0] || { name: 'Rose', hex: '#DF8A9D' };
    const chosenSz = product.sizes?.[0] || 'S';
    
    onAddToCart(product, chosenCol, chosenSz);
    setAddedItemIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemIds(prev => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  const currencyLabel = country === 'EG' ? 'ج.م' : 'ر.س';

  return (
    <div className="bg-white min-h-screen text-[#111827] font-sans antialiased text-xs md:text-sm select-none" dir="rtl">
      <SEO 
        title={selectedCategory === 'offers' ? 'العروض والتخفيضات | سولته' : 'بيجامات نسائية قطن — تسوقي الآن | سولته'} 
        description="تصفحي كامل تشكيلة البيجامات النسائية من سولته، خامات قطنية مريحة بمقاس وان سايز 45-80 كجم وتوصيل لكافة مدن المملكة."
        path={selectedCategory === 'offers' ? '/offers/' : '/store/'} 
      />
      
      {/* Breadcrumb Navigation (Salla / Nalah Style) */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-1 text-[11px] text-gray-500 font-medium flex items-center gap-1.5">
        <span className="hover:text-black cursor-pointer">الرئيسية</span>
        <span>/</span>
        <span className="text-gray-900 font-bold">
          {selectedCategory === 'offers' ? 'العروض والتخفيضات 🏷️' : displayCategories.find(c => c.id === selectedCategory)?.nameAr || 'المتجر'}
        </span>
      </div>

      {/* 1. Salla / Nalah Style Clean White Promotional Hero Banner */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 pt-2 pb-2">
        <div className="relative rounded-2xl bg-gray-50 border border-gray-200 p-3.5 sm:p-6 md:p-8 shadow-xs overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
            <div className="text-right space-y-1.5 sm:space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-black text-white font-bold text-[10.5px] sm:text-xs">
                <Sparkles size={11} />
                <span>أزياء النوم والبيجامات القطنية 🌸</span>
              </div>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-[#111827] leading-tight">
                تشكيلة بيجامات نسائية من سولته
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                استكشفي متجر سولته واختاري بيجامتكِ المفضلة من تشكيلة البيجامات النسائية القطنية المصممة لتناسب مختلف الأوقات المنزلية. تشمل التشكيلة بيجامات قطن كوريشة بطبعات زهرية وبيجامات قطن بحمالات ربط وموديلات ناعمة بمقاس وان سايز مريح يناسب من 45 إلى 80 كيلو.
              </p>

              {/* Mobile Hook Badge */}
              <div className="sm:hidden pt-1 flex items-center gap-2">
                <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-900 font-bold px-2.5 py-1 rounded-lg shadow-2xs">
                  ✨ قطن كوريشة ناعم ومريح - مقاس فري سايز
                </span>
              </div>
              
              {/* Trust badges row */}
              <div className="hidden sm:flex flex-wrap items-center gap-4 pt-2 text-[11px] font-semibold text-gray-500">
                <span className="flex items-center gap-1.5 text-gray-700">
                  <Truck size={14} className="text-black" />
                  <span>توصيل سريع لكافة مدن المملكة</span>
                </span>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1.5 text-gray-700">
                  <ShieldCheck size={14} className="text-black" />
                  <span>خامة قطن مريحة واستبدال سهل</span>
                </span>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1.5 text-gray-700">
                  <Tag size={14} className="text-black" />
                  <span>شامل الضريبة وبدون رسوم خفية</span>
                </span>
              </div>
            </div>

            {/* Brand Card (Desktop / Tablet) */}
            <div className="hidden sm:block shrink-0 bg-[#111827] text-white p-4 sm:p-5 rounded-2xl shadow-sm text-center space-y-2.5 w-full md:w-72">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 block">✨ Sulta Sleepwear</span>
              <h2 className="text-xs font-bold leading-relaxed text-gray-100">
                بيجامات قطن كوريشة وقطن ناعم مريح
              </h2>
              <p className="text-[9.5px] text-gray-400 leading-normal">
                مقاس وان سايز مريح يناسب من 45 إلى 80 كيلو، مع بوكس سولته الأنيق.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Salla Style Horizontal Scrollable Category Pills Bar */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 -mx-1 px-1">
          {displayCategories.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedCollection('all');
                }}
                className={`shrink-0 px-5 py-2.5 rounded-2xl text-[13px] font-bold transition-all cursor-pointer flex items-center gap-2 border-2 ${
                  isSelected
                    ? 'bg-[#111827] text-white border-[#111827] shadow-lg shadow-black/5 scale-105'
                    : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200 hover:text-gray-900 active:scale-95'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span>{cat.nameAr}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Sticky Filter & Sorting Toolbar */}
      <div id="catalog-explore-anchor" className="sticky top-[70px] sm:top-[115px] z-30 w-full border-y border-gray-100 bg-white/90 backdrop-blur-xl transition-all">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          
          {/* Products Count Indicator */}
          <div className="flex items-center gap-2.5">
            <div className="flex -space-x-1.5 space-x-reverse">
              {filteredProducts.slice(0, 3).map((p, i) => (
                <div key={p.id} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-gray-50">
                  <SultaImage src={p.images[0]} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <span className="text-xs font-black text-gray-900">
              {filteredProducts.length} قطعة فاخرة
            </span>
          </div>

          {/* Right Toolbar: Search & Sort Dropdown */}
          <div className="flex items-center gap-3">
            
            {/* Salla Sort Dropdown */}
            <div className="relative group">
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-[#A44C5C] transition-colors">
                <ArrowUpDown size={14} />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-100 hover:border-gray-300 hover:bg-white rounded-xl pr-9 pl-4 py-2 text-[11px] font-bold text-gray-800 outline-hidden cursor-pointer transition-all shadow-2xs min-w-[140px] text-right"
                aria-label="ترتيب المنتجات حسب"
              >
                <option value="newest">الأحدث وصولاً ✨</option>
                <option value="bestseller">الأكثر طلباً 🔥</option>
                <option value="price-low">السعر: الأقل ➜ الأعلى</option>
                <option value="price-high">السعر: الأعلى ➜ الأقل</option>
                <option value="rating">التقييم الأعلى ⭐</option>
              </select>
            </div>

            {/* Price Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setIsPriceSliderOpen(prev => !prev)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer shadow-2xs ${
                isPriceSliderOpen || maxPrice < maxPriceCatalog
                  ? 'bg-[#111827] text-white border-black ring-4 ring-black/5'
                  : 'bg-white text-gray-800 border-gray-100 hover:border-gray-200 active:scale-95'
              }`}
              title="تصفية المنتجات حسب النطاق السعري"
              aria-label="فتح لوحة تصفية السعر"
            >
              <Filter size={14} className={maxPrice < maxPriceCatalog ? 'text-[#DF8A9C]' : ''} />
              <span className="hidden sm:inline">تصفية السعر</span>
              {maxPrice < maxPriceCatalog && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#DF8A9C] animate-pulse" />
              )}
            </button>

            {/* Mobile Layout Switcher */}
            <div className="flex items-center border border-gray-100 rounded-xl p-1 bg-gray-50 sm:hidden">
              <button
                type="button"
                onClick={() => setMobileLayout('single')}
                className={`p-1.5 rounded-lg transition-all ${mobileLayout === 'single' ? 'bg-white shadow-sm text-[#A44C5C]' : 'text-gray-400'}`}
              >
                <Grid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setMobileLayout('double')}
                className={`p-1.5 rounded-lg transition-all ${mobileLayout === 'double' ? 'bg-white shadow-sm text-[#A44C5C]' : 'text-gray-400'}`}
              >
                <Zap size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3.1 Sulta Interactive Price Range Slider Panel */}
      <AnimatePresence>
        {isPriceSliderOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-gray-200 bg-gray-50/90 backdrop-blur-md"
          >
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-[#A44C5C]" />
                  <span className="font-bold text-xs text-gray-900">تصفية المنتجات حسب النطاق السعري</span>
                  <span className="text-[11px] text-gray-500 font-medium">({filteredProducts.length} قطعة متاحة)</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="bg-white border border-gray-200 px-3 py-1 rounded-lg text-xs font-bold text-gray-900 shadow-2xs font-mono">
                    الحد الأقصى: <span className="text-[#A44C5C] font-black">{maxPrice.toLocaleString()} {currencyLabel}</span>
                  </div>
                  {maxPrice < maxPriceCatalog && (
                    <button
                      type="button"
                      onClick={() => setMaxPrice(maxPriceCatalog)}
                      className="text-[11px] font-bold text-gray-500 hover:text-black underline cursor-pointer"
                    >
                      إعادة ضبط
                    </button>
                  )}
                </div>
              </div>

              {/* Slider Track with Custom Luxury Styling */}
              <div className="space-y-1.5 py-1">
                <input
                  type="range"
                  min={minPriceCatalog}
                  max={maxPriceCatalog}
                  step={country === 'EG' ? 25 : 10}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#A44C5C] focus:outline-none"
                  id="store-price-range-slider"
                  aria-label="اختر الحد الأقصى للسعر"
                />
                
                {/* Min / Max Labels */}
                <div className="flex justify-between text-[11px] text-gray-400 font-mono font-medium">
                  <span>من {minPriceCatalog.toLocaleString()} {currencyLabel}</span>
                  <span>إلى {maxPriceCatalog.toLocaleString()} {currencyLabel}</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                <span className="text-[10px] text-gray-400 font-bold ml-1">اختيارات سريعة:</span>
                <button
                  type="button"
                  onClick={() => setMaxPrice(maxPriceCatalog)}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                    maxPrice === maxPriceCatalog 
                      ? 'bg-black text-white shadow-2xs' 
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-400'
                  }`}
                >
                  الكل ({maxPriceCatalog.toLocaleString()} {currencyLabel})
                </button>
                {[
                  Math.round(minPriceCatalog + (maxPriceCatalog - minPriceCatalog) * 0.35),
                  Math.round(minPriceCatalog + (maxPriceCatalog - minPriceCatalog) * 0.65),
                  Math.round(minPriceCatalog + (maxPriceCatalog - minPriceCatalog) * 0.85)
                ].map((presetPrice, idx) => {
                  const rounded = Math.round(presetPrice / 10) * 10;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMaxPrice(rounded)}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                        maxPrice === rounded
                          ? 'bg-black text-white shadow-2xs' 
                          : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      حتى {rounded.toLocaleString()} {currencyLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Active Filters Reset Chips */}
      {(selectedCategory !== 'all' || searchQuery || maxPrice < maxPriceCatalog) && (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-gray-400 font-bold">تصفية نشطة:</span>
          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 text-[11px] font-bold border border-gray-200">
              <span>{displayCategories.find(c => c.id === selectedCategory)?.nameAr || selectedCategory}</span>
              <button onClick={() => setSelectedCategory('all')} className="hover:text-red-600 font-bold mr-1">✕</button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200">
              <span>بحث: "{searchQuery}"</span>
              <button onClick={() => onClearSearch && onClearSearch()} className="hover:text-red-600 font-bold mr-1">✕</button>
            </span>
          )}
          {maxPrice < maxPriceCatalog && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-50 text-[#A44C5C] text-[11px] font-bold border border-pink-200">
              <span>السعر: حتى {maxPrice.toLocaleString()} {currencyLabel}</span>
              <button onClick={() => setMaxPrice(maxPriceCatalog)} className="hover:text-red-600 font-bold mr-1">✕</button>
            </span>
          )}
          <button
            onClick={() => { setSelectedCategory('all'); onClearSearch && onClearSearch(); setMaxPrice(maxPriceCatalog); }}
            className="text-[11px] font-bold text-[#A44C5C] hover:underline"
          >
            إلغاء التصفية
          </button>
        </div>
      )}

      {/* 5. Main Salla E-Commerce Product Cards Grid */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 border border-gray-200 rounded-3xl max-w-md mx-auto p-8 my-8 shadow-xs">
            <div className="w-16 h-16 bg-white text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm border border-gray-100">
              🛍️
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">لم يتم العثور على قطع تطابق بحثكِ</h3>
            <p className="text-gray-500 text-xs mb-6 leading-relaxed">
              جرّبي تغيير كلمات البحث أو استعراض جميع التشكيلات للاستمتاع بأحدث تصاميم Sulta.
            </p>
            <button
              onClick={() => { setSelectedCategory('all'); onClearSearch && onClearSearch(); }}
              className="bg-[#111827] text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-[#A44C5C] transition-colors"
            >
              عرض جميع الموديلات
            </button>
          </div>
        ) : (
          <div className={`grid ${
            mobileLayout === 'single'
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5'
              : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5'
          }`}>
            
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                favorites={favorites || []}
                isFavorite={Array.isArray(favorites) ? favorites.includes(product.id) : false}
                toggleFavorite={toggleFavorite}
                onToggleFavorite={() => toggleFavorite?.(product.id)}
                onSelect={() => onSelectProduct?.(product)}
                onSelectProduct={onSelectProduct}
                onAddToCart={(p, c, s, q) => {
                  const chosenCol = c || product.colors?.[0] || { name: 'Rose', hex: '#DF8A9D' };
                  const chosenSz = s || product.sizes?.[0] || 'S';
                  onAddToCart(product, chosenCol, chosenSz);
                }}
              />
            ))}

          </div>
        )}

      </main>

      {/* 6. Quick Product View Modal */}
      <AnimatePresence>
        {quickViewProduct && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-gray-200 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl relative text-right text-xs"
              dir="rtl"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-full p-2 text-gray-500 hover:text-black hover:scale-110 transition-transform cursor-pointer shadow-md z-20"
                title="إغلاق"
              >
                <X size={16} />
              </button>

              <div className="flex flex-col md:flex-row h-full">
                
                {/* Visual Media Frame */}
                <div className="w-full md:w-1/2 bg-gray-50 aspect-square md:aspect-auto relative min-h-[320px] md:min-h-[460px]">
                  <SultaImage 
                    src={quickViewProduct.images?.[qvActiveImageIdx]}
                    alt={`${quickViewProduct.nameAr} - ${quickViewProduct.categoryAr || 'بيجامة'} سولته`}
                    className="w-full h-full"
                    contain={true}
                    width={800}
                    imgClassName="object-contain"
                  />

                  {/* Thumbnail strip */}
                  {quickViewProduct.images && quickViewProduct.images.length > 1 && (
                    <div className="absolute bottom-4 inset-x-0 mx-auto max-w-[90%] flex gap-2 justify-center z-10 overflow-x-auto no-scrollbar">
                      {quickViewProduct.images.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setQvActiveImageIdx(idx)}
                          className={`w-12 h-16 rounded-md overflow-hidden bg-white border-2 transition-all shrink-0 ${
                            qvActiveImageIdx === idx ? 'border-[#111827] scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <SultaImage src={img} className="w-full h-full" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details Specifications */}
                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between space-y-6">
                  
                  <div className="space-y-4">
                    <span className="text-[10px] text-black font-bold uppercase inline-block">
                      {quickViewProduct.collection || 'المجموعة الرسمية'}
                    </span>
                    
                    <h3 className="text-xl md:text-2xl font-extrabold text-[#111827] leading-tight">
                      {quickViewProduct.nameAr || quickViewProduct.nameEn}
                    </h3>

                    {/* Price tag */}
                    <div className="flex items-baseline gap-4">
                      <ProductPrice product={quickViewProduct} country={country} size="md" showBadge={true} />
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-black bg-gray-100 border border-gray-300 px-2 py-0.5 font-bold rounded-md flex items-center gap-1">
                          <Zap size={10} className="fill-yellow-400 text-yellow-400" />
                          <span>متوفر للشحن الفوري ⚡</span>
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-500 text-xs leading-relaxed select-text">
                      {quickViewProduct.descriptionAr || quickViewProduct.descriptionEn}
                    </p>

                    {/* Colors Options */}
                    {quickViewProduct.colors && quickViewProduct.colors.length > 0 && (
                      <div className="space-y-1.5 text-right w-full">
                        <span className="text-[10px] text-gray-500 font-bold block">الألوان المتوفرة:</span>
                        <div className="flex items-center gap-2">
                          {quickViewProduct.colors.map(col => {
                            const isSelected = qvSelectedColor?.name === col.name;
                            return (
                              <button
                                key={col.name}
                                type="button"
                                onClick={() => setQvSelectedColor(col)}
                                className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                                  isSelected ? 'scale-110 ring-2 ring-black border-white' : 'border-gray-300'
                                }`}
                                style={{ backgroundColor: col.hex }}
                                title={col.name}
                              />
                            );
                          })}
                          <span className="text-xs text-gray-700 font-sans tracking-wide pr-1">
                            {qvSelectedColor?.name || 'اختر اللون'}
                          </span>
                        </div>
                      </div>
                    )}



                  </div>

                  {/* Add To Cart Button */}
                  <div className="pt-4 border-t border-gray-200 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        const finalColor = qvSelectedColor || quickViewProduct.colors?.[0] || { name: 'Default', hex: '#000050' };
                        const finalSize = qvSelectedSize || 'S';
                        onAddToCart(quickViewProduct, finalColor, finalSize);
                        setQuickViewProduct(null);
                      }}
                      className="w-full bg-[#111827] text-white py-3 rounded-xl text-xs font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <ShoppingBag size={14} /> إضافة سريعة للسلة
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        onSelectProduct(quickViewProduct);
                        setQuickViewProduct(null);
                      }}
                      className="w-full bg-white text-gray-800 border border-gray-200 py-2.5 rounded-xl text-xs hover:bg-gray-50 transition-colors font-bold cursor-pointer"
                    >
                      عرض صفحة المنتج الكاملة ←
                    </button>
                  </div>

                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Recently Viewed Products (Salla style) */}
      {recentlyViewed && recentlyViewed.length > 0 && (
        <section className="bg-gray-50 py-12 border-t border-gray-200 select-none">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-base font-bold text-gray-900 mb-6 text-right">
              منتجات شاهدتِها مؤخراً 👁️
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {recentlyViewed.slice(0, 6).map(item => (
                <div 
                  key={`rec-${item.id}`} 
                  className="bg-white rounded-xl border border-gray-200 p-2.5 flex flex-col gap-1.5 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onSelectProduct(item)}
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
                    <SultaImage 
                      src={item.images?.[0]} 
                      alt={item.nameAr} 
                      className="w-full h-full group-hover:scale-105"
                      imgClassName="w-full h-full object-cover object-center"
                    />
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 truncate text-right">{item.nameAr}</h4>
                  <div className="text-right">
                    <ProductPrice product={item} country={country} size="sm" showBadge={false} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {showStyleAssistant && (
        <StyleAssistant 
          onClose={() => setShowStyleAssistant(false)}
          onRecommend={(catId) => {
             setSelectedCategory(catId);
             setSelectedCollection('all');
          }}
        />
      )}
    </div>
  );
}
