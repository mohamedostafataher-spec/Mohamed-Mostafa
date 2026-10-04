import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Filter, Search, Heart, ShoppingBag, Eye, X, ChevronDown, 
  Sparkles, SlidersHorizontal, ArrowLeft, Play, Info, 
  Volume2, VolumeX, Check, Grid, RefreshCw, Star, ArrowUpDown, Wand2, Tag, Truck, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Country, Category } from '../types';
import StyleAssistant from './StyleAssistant';
import { ProductPrice } from './ProductPrice';
import SultaImage from './SultaImage';
import { cleanImgUrl } from '../services/db';

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
  
  // Quick view states
  const [qvSelectedSize, setQvSelectedSize] = useState<string>('');
  const [qvSelectedColor, setQvSelectedColor] = useState<{ name: string; hex: string } | null>(null);
  const [qvActiveImageIdx, setQvActiveImageIdx] = useState<number>(0);

  // Auto-select size & color when product is selected for quick view
  useEffect(() => {
    if (quickViewProduct) {
      setQvSelectedSize(quickViewProduct.sizes?.[0] || 'S');
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
      result = result.filter(p => (country === 'EG' ? !!p.salePriceEG : !!p.salePriceSA) || p.rating >= 4.8);
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

    // Sorting
    return [...result].sort((a, b) => {
      const priceA = country === 'EG' ? a.priceEG : a.priceSA;
      const priceB = country === 'EG' ? b.priceEG : b.priceSA;

      if (sortBy === 'price-low') return priceA - priceB;
      if (sortBy === 'price-high') return priceB - priceA;
      if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
      if (sortBy === 'bestseller') return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
      return 0; // default newest
    });
  }, [products, selectedCategory, selectedCollection, searchQuery, sortBy, country]);

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
                <span>{selectedCategory === 'offers' ? 'تخفيضات وعروض حصرية 🏷️' : 'عروض موسم SULTA الحصرية 🏷️'}</span>
              </div>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-[#111827] leading-tight">
                {selectedCategory === 'offers' ? 'عروض وتخفيضات ملابس النوم والبيجامات الحريرية' : 'أرقى تصاميم ملابس النوم والبيجامات الحريرية'}
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                {selectedCategory === 'offers' 
                  ? 'اكتشفي أقوى عروض التوفير بخصومات تصل إلى 30% مع شحن سريع وتوصيل لباب بيتكِ في كافة مناطق المملكة ومصر.'
                  : 'اكتشفي تشكيلة بيجامات وأرواب النوم الفاخرة بخصومات فورية وتوصيل سريع لباب بيتكِ في كافة مناطق المملكة ومصر.'}
              </p>

              {/* Mobile Quick Promo Code Pill */}
              <div className="sm:hidden pt-1 flex items-center gap-2">
                <span className="text-[10px] bg-white border border-gray-300 text-black font-bold px-2 py-0.5 rounded-lg shadow-2xs">
                  كود الخصم: <strong className="font-mono text-black">SULTA20</strong> (خصم 20%)
                </span>
              </div>
              
              {/* Trust badges row */}
              <div className="hidden sm:flex flex-wrap items-center gap-4 pt-2 text-[11px] font-semibold text-gray-500">
                <span className="flex items-center gap-1.5 text-gray-700">
                  <Truck size={14} className="text-black" />
                  <span>شحن سريع ومجاني للطلبات المؤهلة</span>
                </span>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1.5 text-gray-700">
                  <ShieldCheck size={14} className="text-black" />
                  <span>ضمان الجودة والاستبدال السهل</span>
                </span>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1.5 text-gray-700">
                  <Tag size={14} className="text-black" />
                  <span>شامل الضريبة وبدون رسوم خفية</span>
                </span>
              </div>
            </div>

            {/* Quick Promo Action Card (Desktop / Tablet) */}
            <div className="hidden sm:block shrink-0 bg-white border border-gray-200 p-4 sm:p-5 rounded-2xl shadow-xs text-center space-y-2.5 w-full md:w-72">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">كود خصم ترحيبي إضافي</span>
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl py-2 px-3 flex items-center justify-between">
                <span className="font-mono text-sm font-black text-black tracking-wider" dir="ltr">SULTA20</span>
                <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-md font-bold">خصم 20%</span>
              </div>
              <p className="text-[10px] text-gray-500 leading-normal">
                يُطبق تلقائياً في السلة للطلبيات الأولى! 🌸
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Salla Style Horizontal Scrollable Category Pills Bar */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-1">
          {displayCategories.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedCollection('all');
                }}
                className={`shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                  isSelected
                    ? 'bg-[#111827] text-white shadow-sm scale-102'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-900 hover:bg-gray-50'
                }`}
              >
                <span>{cat.nameAr}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Sticky Filter & Sorting Toolbar */}
      <div id="catalog-explore-anchor" className="sticky top-[78px] sm:top-[115px] z-30 w-full border-y border-gray-200 bg-white/95 backdrop-blur-md shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
          
          {/* Products Count Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-900">
              جميع المنتجات
            </span>
            <span className="bg-gray-100 text-gray-600 text-[11px] font-bold px-2 py-0.5 rounded-full font-mono">
              {filteredProducts.length} قطعة
            </span>
          </div>

          {/* Right Toolbar: Search & Sort Dropdown */}
          <div className="flex items-center gap-2.5">
            
            {/* Mobile Layout Switcher */}
            <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-gray-50 sm:hidden">
              <button
                type="button"
                onClick={() => setMobileLayout('single')}
                className={`p-1 rounded text-xs transition-colors ${mobileLayout === 'single' ? 'bg-white shadow-2xs font-bold text-black' : 'text-gray-400'}`}
                title="عرض فردي"
              >
                📱
              </button>
              <button
                type="button"
                onClick={() => setMobileLayout('double')}
                className={`p-1 rounded text-xs transition-colors ${mobileLayout === 'double' ? 'bg-white shadow-2xs font-bold text-black' : 'text-gray-400'}`}
                title="شبكة مزدوجة"
              >
                <Grid size={14} />
              </button>
            </div>

            {/* Inline Quick Search Box */}
            <div className="relative w-36 sm:w-48 hidden md:block">
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Search size={13} />
              </span>
              <input
                type="text"
                placeholder="تصفية الموديلات..."
                value={searchQuery}
                onChange={(e) => onSearchQueryChange && onSearchQueryChange(e.target.value)}
                className="w-full bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 focus:border-gray-400 rounded-lg pr-7 pl-6 py-1.5 text-xs text-gray-900 placeholder-gray-400 outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => onClearSearch && onClearSearch()}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Salla Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-200 hover:border-gray-400 rounded-lg pr-3 pl-8 py-1.5 text-xs font-semibold text-gray-800 outline-hidden cursor-pointer transition-colors shadow-2xs"
              >
                <option value="newest">الأحدث وصولاً ✨</option>
                <option value="bestseller">الأكثر طلباً 🔥</option>
                <option value="price-low">السعر: من الأقل للأعلى</option>
                <option value="price-high">السعر: من الأعلى للأقل</option>
                <option value="rating">التقييم الأعلى ⭐</option>
              </select>
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronDown size={13} />
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* 4. Active Filters Reset Chips */}
      {(selectedCategory !== 'all' || searchQuery) && (
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
          <button
            onClick={() => { setSelectedCategory('all'); onClearSearch && onClearSearch(); }}
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
              جرّبي تغيير كلمات البحث أو استعراض جميع التشكيلات للاستمتاع بأحدث تصاميم SULTA.
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
            
            {filteredProducts.map((product, index) => {
              const isFav = favorites.includes(product.id);
              const cardColorSel = cardColorSelections[product.id];
              const activeImgIdx = activeThumbIndices[product.id] || 0;
              const isAdded = !!addedItemIds[product.id];
              
              // Select active image - Ensure we fallback to the first available image if activeImgIdx is invalid
              const productImgs = product.images || [];
              const safeIdx = (activeImgIdx >= 0 && activeImgIdx < productImgs.length) ? activeImgIdx : 0;
              const currentImg = cleanImgUrl(productImgs[safeIdx], product.category);

              // Calculate price & discount for Salla badge
              const currentPrice = country === 'EG' ? product.priceEG : product.priceSA;
              const hasSale = country === 'EG' ? !!product.salePriceEG : !!product.salePriceSA;
              const discountVal = (product.rating >= 4.8) ? 25 : 20;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative cursor-pointer"
                  onClick={() => onSelectProduct(product)}
                >
                  
                  {/* Top Image Frame (3:4 aspect ratio full bleed) */}
                  <div>
                    <div className="relative bg-gray-100 w-full overflow-hidden aspect-[3/4] flex items-center justify-center">
                      
                      {/* Sulta Image with Smooth Hover Zoom */}
                      <SultaImage 
                        src={currentImg} 
                        alt={product.nameAr || product.nameEn} 
                        className="w-full h-full"
                        imgClassName="w-full h-full object-cover object-top sm:object-center transition-transform duration-700 group-hover:scale-105"
                      />

                      {/* Top Right: Wishlist Heart Floating Button */}
                      <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-white text-gray-500 hover:text-red-500 shadow-sm backdrop-blur-xs flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                          title="إضافة للمفضلة"
                        >
                          <Heart size={13} className={isFav ? "fill-red-500 text-red-500" : ""} />
                        </button>
                      </div>

                      {/* Top Left: Badges (Discount / Best Seller / New) */}
                      <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10 flex flex-col gap-1 items-start">
                        {discountVal > 0 && (
                          <span className="bg-[#E11D48] text-white text-[8.5px] sm:text-[9.5px] font-black px-1.5 py-0.5 sm:px-2 rounded-md shadow-xs">
                            خصم {discountVal}%
                          </span>
                        )}
                        {product.isBestSeller && (
                          <span className="bg-[#F59E0B] text-black text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 sm:px-2 rounded-md shadow-xs">
                            الأكثر طلباً 👑
                          </span>
                        )}
                        {product.featured && (
                          <span className="bg-[#111827] text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 sm:px-2 rounded-md shadow-xs">
                            جديد ✨
                          </span>
                        )}
                      </div>

                      {/* Stock Warning Badge */}
                      {product.stock <= 3 && product.stock > 0 && (
                        <div className="absolute bottom-2 right-2 bg-red-600/90 text-white text-[8px] sm:text-[8.5px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs shadow-xs">
                          متبقي {product.stock} فقط 🚨
                        </div>
                      )}

                      {/* Quick View Button on Hover */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickViewProduct(product);
                        }}
                        className="hidden sm:flex absolute inset-0 m-auto w-10 h-10 bg-white/95 rounded-full items-center justify-center text-gray-800 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 cursor-pointer"
                        title="معاينة سريعة"
                      >
                        <Eye size={16} />
                      </button>

                      {/* Multi-image indicator line */}
                      {product.images && product.images.length > 1 && (
                        <div className="absolute bottom-2 inset-x-0 mx-auto max-w-[70%] flex justify-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          {product.images.slice(0, 4).map((_, idx) => (
                            <div
                              key={idx}
                              onMouseEnter={(e) => handleThumbHover(product.id, idx, e)}
                              className={`h-1 flex-1 rounded-full transition-all cursor-pointer ${
                                activeImgIdx === idx ? 'bg-[#A44C5C]' : 'bg-white/60'
                              }`}
                            />
                          ))}
                        </div>
                      )}

                    </div>

                    {/* Card Content Details */}
                    <div className="p-2.5 sm:p-3 pb-1 text-right space-y-1">
                      
                      {/* Category Label */}
                      <span className="text-[9.5px] sm:text-[10px] text-gray-400 font-medium block truncate">
                        {product.categoryAr || product.category || 'ملابس نوم فاخرة'}
                      </span>

                      {/* Product Name in Bold Modern Arabic Font */}
                      <h3 className="font-bold text-xs sm:text-sm text-gray-950 group-hover:text-[#A44C5C] transition-colors leading-snug line-clamp-2 min-h-[32px] sm:min-h-[38px]">
                        {product.nameAr || product.nameEn}
                      </h3>

                      {/* Rating Stars Row */}
                      <div className="flex items-center gap-1 sm:gap-1.5 justify-start pt-0.5">
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg key={i} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${i < Math.round(product.rating || 5) ? "fill-current" : "text-gray-200"}`} viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-[9.5px] sm:text-[10px] text-gray-400 font-sans font-medium">({product.reviewsCount || 34})</span>
                      </div>

                      {/* Color Options Swatches (if available) */}
                      {product.colors && product.colors.length > 0 && (
                        <div className="flex items-center gap-1 sm:gap-1.5 justify-start pt-1">
                          {product.colors.slice(0, 4).map((col, cIdx) => {
                            const isSelected = cardColorSel ? cardColorSel.name === col.name : cIdx === 0;
                            return (
                              <button
                                key={col.name}
                                type="button"
                                onClick={(e) => handleCardColorSelect(product.id, col, e)}
                                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border transition-all cursor-pointer ${
                                  isSelected ? 'scale-125 ring-1 ring-black border-white' : 'border-gray-200'
                                }`}
                                style={{ backgroundColor: col.hex }}
                                title={col.name}
                              />
                            );
                          })}
                          <span className="text-[9.5px] sm:text-[10px] text-gray-400 font-sans truncate">
                            {cardColorSel ? cardColorSel.name : product.colors[0]?.name}
                          </span>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Bottom: Price Row & Salla Full-Width Add To Cart Button */}
                  <div className="p-2.5 sm:p-3 pt-0 border-t border-gray-100 space-y-2 mt-auto">
                    
                    {/* Price and VAT inclusion */}
                    <div className="flex items-baseline justify-between">
                      <ProductPrice product={product} country={country} size="sm" showBadge={false} />
                      <span className="text-[9px] sm:text-[9.5px] text-gray-400 font-medium">شامل الضريبة</span>
                    </div>

                    {/* Prominent Salla Style "Add to Cart" Button */}
                    <button
                      type="button"
                      onClick={(e) => handleAddToCartWithFeedback(product, e)}
                      disabled={product.stock === 0}
                      className={`w-full py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer shadow-xs active:scale-98 ${
                        product.stock === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                          : isAdded
                            ? 'bg-black text-white shadow-sm'
                            : 'bg-[#111827] hover:bg-black text-white hover:shadow-md'
                      }`}
                    >
                      {product.stock === 0 ? (
                        <span>نفدت الكمية ✕</span>
                      ) : isAdded ? (
                        <>
                          <Check size={13} className="stroke-[3]" />
                          <span>تمت الإضافة للسلة</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={13} />
                          <span>أضف للسلة</span>
                        </>
                      )}
                    </button>

                  </div>

                </div>
              );
            })}

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
                    alt={quickViewProduct.nameAr}
                    className="w-full h-full"
                    imgClassName="object-cover"
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
                    
                    <h2 className="text-xl md:text-2xl font-extrabold text-[#111827] leading-tight">
                      {quickViewProduct.nameAr || quickViewProduct.nameEn}
                    </h2>

                    {/* Price tag */}
                    <div className="flex items-baseline gap-4">
                      <ProductPrice product={quickViewProduct} country={country} size="md" showBadge={true} />
                      <span className="text-[10px] text-black bg-gray-100 border border-gray-300 px-2 py-0.5 font-bold rounded-md">
                        متوفر للشحن الفوري ⚡
                      </span>
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

                    {/* Sizes selection option */}
                    {quickViewProduct.sizes && quickViewProduct.sizes.length > 0 && (
                      <div className="space-y-1.5 text-right">
                        <span className="text-[10px] text-gray-500 font-bold block">المقاس:</span>
                        <div className="flex flex-wrap gap-2">
                          {quickViewProduct.sizes.map(sz => {
                            const isSelected = qvSelectedSize === sz;
                            return (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => setQvSelectedSize(sz)}
                                className={`min-w-10 px-3 py-1.5 rounded-lg border text-xs font-bold text-center transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-[#111827] text-white border-[#111827]' 
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-black'
                                }`}
                              >
                                {sz}
                              </button>
                            );
                          })}
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
