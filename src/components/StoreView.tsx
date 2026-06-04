import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Filter, Grid, SlidersHorizontal, Heart, Eye, ShoppingCart, Check, X, Sparkles, Search, GitCompare } from 'lucide-react';
import { useToast } from './Toast';
import { Product, Country, Category } from '../types';

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
}: StoreViewProps) {
  const { toast } = useToast();
  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [selectedFabric, setSelectedFabric] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<number>(10000); // max default EGP
  const [sortBy, setSortBy] = useState<string>('bestseller');
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  // Comparison States
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);

  const toggleCompare = (product: Product) => {
    setCompareList(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        return prev.filter(item => item.id !== product.id);
      } else {
        if (prev.length >= 3) {
          toast('يمكنكِ مقارنة ٣ قطع كحد أقصى في وقت واحد 🌸.', 'error');
          return prev;
        }
        return [...prev, product];
      }
    });
  };

  // Search local tracking & interactive states
  const [activeSearch, setActiveSearch] = useState(searchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Synchronize the search query state with potential external updates (e.g. Header bar)
  useEffect(() => {
    setActiveSearch(searchQuery);
  }, [searchQuery]);

  // Click outside listener for suggestions popup
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Standard Arabic Normalizer
  const normalizeAr = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/\s+/g, ' ');
  };

  // Dialect & Search Matcher Utility
  const productMatchesQuery = (product: Product, query: string) => {
    if (!query) return true;
    const cleanQuery = query.toLowerCase().trim();
    const normQuery = normalizeAr(cleanQuery);
    
    const nameArNorm = normalizeAr(product.nameAr);
    const descArNorm = normalizeAr(product.descriptionAr);
    const nameEnNorm = product.nameEn.toLowerCase();
    
    const words = normQuery.split(' ');
    
    const mappings: Record<string, string[]> = {
      'اسود': ['black', 'أسود', 'سودا', 'ليلي', 'الفحمي', 'الاسود', 'الأسود'],
      'سودا': ['black', 'أسود', 'سودا', 'ليلي', 'الفحمي', 'الاسود', 'الأسود'],
      'وردى': ['pink', 'وردي', 'روز', 'الزهري', 'بينك', 'الوردي'],
      'روز': ['pink', 'وردي', 'روز', 'الزهري', 'بينك', 'الوردي'],
      'بينك': ['pink', 'وردي', 'روز', 'الزهري', 'بينك', 'الوردي'],
      'ابيض': ['white', 'أبيض', 'بيضا', 'شامبين', 'أوف وايت', 'العاج', 'الأبيض', 'الابيض'],
      'بيضا': ['white', 'أبيض', 'بيضا', 'شامبين', 'أوف وايت', 'العاج', 'الأبيض', 'الابيض'],
      'احمر': ['red', 'أحمر', 'حمرا', 'البرغندي', 'قرمزي', 'الأحمر', 'الاحمر'],
      'حمرا': ['red', 'أحمر', 'حمرا', 'البرغندي', 'قرمزي', 'الأحمر', 'الاحمر'],
      'ستان': ['satin', 'ساتان', 'الحرير', 'حباك', 'الساتان'],
      'ساتان': ['satin', 'ساتان', 'الحرير', 'حباك', 'الساتان'],
      'حرير': ['satin', 'ساتان', 'الحرير', 'حباك', 'الساتان'],
      'قطن': ['cotton', 'قطن', 'طبيعي', 'القطن'],
      'بيجامه': ['بيجامة', 'pajama', 'بجامة', 'بيجامات', 'البيجامة', 'البيجامات'],
      'بجامه': ['بيجامة', 'pajama', 'بجامة', 'بيجامات', 'البيجامة', 'البيجامات'],
      'روب': ['روب', 'robe', 'روبين', 'الروب'],
      'صيف': ['صيفي', 'صيف', 'خفيف', 'الصيف'],
      'شتا': ['شتوي', 'شتاء', 'دافئ', 'مخمل', 'الشتاء']
    };

    return words.every((word) => {
      if (nameArNorm.includes(word) || descArNorm.includes(word) || nameEnNorm.includes(word)) {
        return true;
      }
      const targets = mappings[word];
      if (targets) {
        return targets.some(target => 
          nameArNorm.includes(normalizeAr(target)) || 
          descArNorm.includes(normalizeAr(target)) || 
          nameEnNorm.includes(target.toLowerCase())
        );
      }
      return false;
    });
  };

  // Popular and relevant presets for the smart suggestions box
  const popularKeywords = [
    { label: 'بيجامات ساتان حرييرية', query: 'ساتان' },
    { label: 'قطن مصري طبيعي ناعم', query: 'قطن' },
    { label: 'رداء لانج وير فرنسي مترف', query: 'لانج وير' },
    { label: 'فساتين نوم مريحة ورقيقة', query: 'فساتين' },
    { label: 'المجموعة الملكية الجديدة', query: 'جديد' },
    { label: 'قطع التميز والأكثر مبيعاً', query: 'التميز' },
  ];

  const popularColors = [
    { name: 'وردي ناعم', hex: '#F4B6C2', query: 'وردي' },
    { name: 'أصفر شامبين', hex: '#F6E7A6', query: 'شامبين' },
    { name: 'أوف وايت رقيق', hex: '#FAFAF7', query: 'أوف وايت' },
    { name: 'أسود فاخر ليلي', hex: '#0B0B0B', query: 'أسود' },
  ];

  // Dynamically compute the suggestions matching user input
  const suggestions = useMemo(() => {
    if (!activeSearch.trim()) {
      return {
        products: [],
        colors: popularColors,
        keywords: popularKeywords
      };
    }

    const queryNorm = normalizeAr(activeSearch);

    // 1. Filter matching products (max 4 suggestions)
    const matchedProducts = products.filter(product => {
      const nameAr = normalizeAr(product.nameAr);
      const nameEn = product.nameEn.toLowerCase();
      const descAr = normalizeAr(product.descriptionAr);
      return nameAr.includes(queryNorm) || nameEn.includes(activeSearch.toLowerCase()) || descAr.includes(queryNorm);
    }).slice(0, 4);

    // 2. Filter colors
    const matchedColors = popularColors.filter(col => {
      return normalizeAr(col.name).includes(queryNorm) || normalizeAr(col.query).includes(queryNorm);
    });

    // 3. Filter keywords
    const matchedKeywords = popularKeywords.filter(kw => {
      return normalizeAr(kw.label).includes(queryNorm) || normalizeAr(kw.query).includes(queryNorm);
    });

    return {
      products: matchedProducts,
      colors: matchedColors.length > 0 ? matchedColors : popularColors.slice(0, 2),
      keywords: matchedKeywords.length > 0 ? matchedKeywords : popularKeywords.slice(0, 3)
    };
  }, [activeSearch, products]);

  const handleUpdateSearch = (value: string) => {
    setActiveSearch(value);
    if (onSearchQueryChange) {
      onSearchQueryChange(value);
    }
  };


  // Filter Categories lookup
  const defaultCategories = [
    { id: 'satin', name: 'ساتان ملكي' },
    { id: 'cotton', name: 'قطن مصري' },
    { id: 'loungewear', name: 'لانج وير' },
    { id: 'dresses', name: 'فساتين نوم' }
  ];
  
  const displayCategories = [
    { id: 'all', label: 'الكل' },
    ...(categories.length > 0 ? categories : defaultCategories).map(c => ({ id: c.id, label: c.name }))
  ];

  const sizes = ['XS', 'S', 'M', 'L', 'XL'];
  
  const colors = [
    { name: 'وردي ناعم', hex: '#F4B6C2' },
    { name: 'أصفر شامبين', hex: '#F6E7A6' },
    { name: 'أوف وايت', hex: '#FAFAF7' },
    { name: 'أسود فاخر', hex: '#0B0B0B' },
  ];

  const fabrics = [
    { id: 'all', label: 'الكل' },
    { id: 'satin', label: 'ساتان إيطالي' },
    { id: 'cotton', label: 'قطن مصري' },
    { id: 'cashmere', label: 'كشمير حريري' },
  ];

  const isFavorite = (id: string) => favorites.includes(id);

  // Dynamic filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Smart Dialect-aware Arabic/English Search Check
      if (activeSearch && !productMatchesQuery(product, activeSearch)) {
        return false;
      }
      
      // Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }

      // Size filter
      if (selectedSize !== 'all' && !product.sizes.includes(selectedSize)) {
        return false;
      }

      // Color filter
      if (selectedColor !== 'all' && !product.colors.some(c => c.name === selectedColor)) {
        return false;
      }

      // Fabric filter
      if (selectedFabric !== 'all') {
        const textToSearch = (product.fabricAr + ' ' + product.fabricEn).toLowerCase();
        if (selectedFabric === 'satin' && !textToSearch.includes('satin') && !textToSearch.includes('ساتان')) return false;
        if (selectedFabric === 'cotton' && !textToSearch.includes('cotton') && !textToSearch.includes('قطن')) return false;
        if (selectedFabric === 'cashmere' && !textToSearch.includes('cashmere') && !textToSearch.includes('كشمير')) return false;
      }

      // Price filter
      const price = country === 'EG' ? product.priceEG : product.priceSA;
      const maxPriceLimit = country === 'EG' ? priceRange : priceRange / 12; // approximate conversion for scale slider
      if (price > maxPriceLimit) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Sorting
      const priceA = country === 'EG' ? a.priceEG : a.priceSA;
      const priceB = country === 'EG' ? b.priceEG : b.priceSA;

      if (sortBy === 'price-low') {
        return priceA - priceB;
      }
      if (sortBy === 'price-high') {
        return priceB - priceA;
      }
      if (sortBy === 'bestseller') {
        return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
      }
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      return 0;
    });
  }, [selectedCategory, selectedSize, selectedColor, selectedFabric, priceRange, sortBy, country, activeSearch, products]);

  // Adjust max range slider on Country change
  const currentMaxPrice = country === 'EG' ? 10000 : 1000;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header Banner & Royal Search Dashboard */}
      <div className="text-center mb-10 max-w-2xl mx-auto relative">
        <h2 className="font-serif text-3xl md:text-5xl text-[#0B0B0B] font-light tracking-wide mb-2">
          متجر سولتا الفاخر
        </h2>
        <div className="w-12 h-[1px] bg-[#F4B6C2] mx-auto my-4" />
        <p className="text-gray-500 text-xs md:text-sm font-sans mb-6">
          استمتعي بالتصفح وتسوقي أرقى تصاميم البيجامات والملابس المنزلية المترفة.
        </p>

        {/* Dynamic Search Box Input */}
        <div ref={searchContainerRef} className="relative max-w-lg mx-auto mb-6 z-30">
          <div className="relative flex items-center animate-fade-in">
            <span className="absolute right-4 text-gray-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="ابحثي باللون، الخامات، الملمس... (مثال: وردي، ساتان، قطن)"
              value={activeSearch}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                handleUpdateSearch(e.target.value);
                setShowSuggestions(true);
              }}
              className="w-full bg-white border border-gray-200 focus:border-[#F4B6C2] focus:ring-1 focus:ring-[#F4B6C2] rounded-full pr-11 pl-10 py-3 text-xs md:text-sm text-right text-gray-800 tracking-wide font-sans focus:outline-none transition-all shadow-sm"
              dir="rtl"
            />
            {activeSearch ? (
              <button
                type="button"
                onClick={() => {
                  handleUpdateSearch('');
                  if (onClearSearch) onClearSearch();
                }}
                className="absolute left-4 text-gray-400 hover:text-[#0B0B0B] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            ) : (
              <span className="absolute left-4 text-[#F4B6C2] flex items-center gap-1 text-[10px] md:text-xs font-serif animate-pulse pointer-events-none">
                <Sparkles size={11} />
                <span>ذكي</span>
              </span>
            )}
          </div>

          {/* Smart Suggestions Dropdown Card */}
          {showSuggestions && (
            <div className="absolute top-full mt-2 left-0 w-full bg-white border border-gray-150 rounded-2xl shadow-2xl text-right p-4 md:p-5 z-50 animate-fade-in overflow-hidden" dir="rtl">
              
              {/* Header inside suggestions */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                <span className="text-[10px] md:text-xs text-gray-400 font-sans flex items-center gap-1">
                  <Sparkles size={10} className="text-[#F6E7A6]" />
                  البحث الذكي النشط والمقترحات
                </span>
                {activeSearch && (
                  <span className="text-[9px] font-mono text-[#F4B6C2] bg-[#F4B6C2]/10 px-2 py-0.5 rounded-full">
                    {suggestions.products.length} مخرجات مطابقة
                  </span>
                )}
              </div>

              {/* Suggestions grid content */}
              <div className="space-y-4">
                
                {/* 1. Products matches */}
                <div>
                  <h6 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 font-sans border-r-2 border-[#F4B6C2] pr-1.5 text-right">
                    قطع وتصاميم مقترحة
                  </h6>
                  {suggestions.products.length === 0 ? (
                    <p className="text-[10px] text-gray-400 font-sans py-1 text-right">
                      {activeSearch ? 'لم نعثر على قطع تطابق هذا المدخل' : 'ابدئي بكتابة أحرف لعرض القطع الفاخرة المترفة'}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {suggestions.products.map(prod => {
                        const price = country === 'EG' ? prod.priceEG : prod.priceSA;
                        const currency = country === 'EG' ? 'EGP' : 'SAR';
                        return (
                          <div
                            key={prod.id}
                            onClick={() => {
                              onSelectProduct(prod);
                              setShowSuggestions(false);
                            }}
                            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all cursor-pointer text-right group"
                          >
                            <div className="w-10 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                              <img src={prod.images[0]} alt={prod.nameAr} className="w-full h-full object-cover" />
                            </div>
                            <div className="overflow-hidden text-right">
                              <span className="text-[11px] font-bold text-[#0B0B0B] block truncate group-hover:text-[#F4B6C2] transition-colors">{prod.nameAr}</span>
                              <span className="text-[9px] font-sans text-gray-400 block truncate">{prod.categoryAr} • {price.toLocaleString()} {currency}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Colors matching/proposed */}
                <div>
                  <h6 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 font-sans border-r-2 border-[#F6E7A6] pr-1.5 text-right">
                    البحث بالألوان الملكية
                  </h6>
                  <div className="flex flex-wrap gap-2 justify-start">
                    {suggestions.colors.map(col => (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => {
                          handleUpdateSearch(col.query);
                          setShowSuggestions(false);
                        }}
                        className="flex items-center gap-1.5 bg-gray-50 hover:bg-[#F4B6C2]/10 border border-gray-150 rounded-full px-2.5 py-1 text-[10px] font-sans text-gray-700 transition-all cursor-pointer whitespace-nowrap"
                      >
                        <span className="w-2.5 h-2.5 rounded-full border border-gray-300 shadow-xs shrink-0" style={{ backgroundColor: col.hex }} />
                        <span>{col.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Keywords / Tags */}
                <div>
                  <h6 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 font-sans border-r-2 border-[#0B0B0B] pr-1.5 text-right">
                    الكلمات المفتاحية الأكثر طلباً
                  </h6>
                  <div className="flex flex-wrap gap-1.5 justify-start">
                    {suggestions.keywords.map(kw => (
                      <button
                        key={kw.label}
                        type="button"
                        onClick={() => {
                          handleUpdateSearch(kw.query);
                          setShowSuggestions(false);
                        }}
                        className="bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-[#0B0B0B] border border-gray-100 rounded-lg px-2 py-1 text-[10px] font-sans transition-colors cursor-pointer"
                      >
                        {kw.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>

        {activeSearch && (
          <div className="inline-flex items-center gap-2 bg-[#F6E7A6]/30 px-4 py-2 rounded-lg text-xs font-sans text-gray-800 animate-fade-in-rapid">
            <span>نتائج البحث الفاخر عن: "<strong>{activeSearch}</strong>" (وجدت {filteredProducts.length} قطعة فريدة)</span>
            {onClearSearch && (
              <button
                type="button"
                onClick={() => {
                  handleUpdateSearch('');
                  onClearSearch();
                }}
                className="text-red-500 hover:text-red-150 transition-colors p-1"
                title="مسح البحث الفاخر"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Control row */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between pb-6 border-b border-gray-100 mb-8">
        
        {/* Toggle Mobile filter/count */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between">
          <button
            onClick={() => setShowMobileFilters(true)}
            className="md:hidden flex items-center gap-2 text-xs font-sans border border-gray-200 rounded-lg px-4 py-2 bg-white text-gray-700"
          >
            <SlidersHorizontal size={14} />
            <span>تصفية وتصنيف</span>
          </button>

          <span className="text-xs font-sans text-gray-500">
            يعرض <span className="font-semibold text-[#0B0B0B]">{filteredProducts.length}</span> من أصل <span className="font-semibold">{products.length}</span> قطع فريدة
          </span>
        </div>

        {/* Categories Tab Pill bar */}
        <div className="hidden md:flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {displayCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-sans transition-luxury whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-[#0B0B0B] text-white'
                  : 'bg-white hover:bg-pink-50 text-gray-700 border border-gray-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-xs font-sans text-gray-400">ترتيب حسب:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-sans bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none"
          >
            <option value="bestseller">الأكثر مبيعاً</option>
            <option value="price-low">السعر: من الأقل للأعلى</option>
            <option value="price-high">السعر: من الأعلى للأقل</option>
            <option value="rating">الأعلى تقييماً</option>
          </select>
        </div>
      </div>

      <div className="flex gap-8">
        
        {/* Sidebar Filters (Desktop only) */}
        <aside className="hidden md:block w-64 shrink-0 bg-white border border-gray-100 rounded-2xl p-6 h-fit sticky top-28 shadow-xs">
          
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
            <span className="font-serif font-semibold text-base text-[#0B0B0B] tracking-wide flex items-center gap-2">
              <Filter size={16} className="text-[#F4B6C2]" />
              حددي اختياراتك
            </span>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSize('all');
                setSelectedColor('all');
                setSelectedFabric('all');
                setPriceRange(currentMaxPrice);
              }}
              className="text-[11px] font-sans text-gray-400 hover:text-[#F4B6C2] transition-colors"
            >
              مسح الكل
            </button>
          </div>

          {/* Sizing */}
          <div className="mb-6">
            <h5 className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-3">المقاس</h5>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSize('all')}
                className={`w-9 h-9 text-xs font-sans rounded-lg flex items-center justify-center transition-all ${
                  selectedSize === 'all'
                    ? 'bg-[#0B0B0B] text-white font-bold shadow-xs'
                    : 'bg-gray-50 text-gray-700 hover:bg-pink-50 border border-gray-100'
                }`}
              >
                الكل
              </button>
              {sizes.map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`w-9 h-9 text-xs font-sans rounded-lg flex items-center justify-center transition-all ${
                    selectedSize === sz
                      ? 'bg-[#F4B6C2] text-white font-bold shadow-xs'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Fabric */}
          <div className="mb-6">
            <h5 className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-3">الخامة</h5>
            <div className="flex flex-col gap-2">
              {fabrics.map((fb) => (
                <button
                  key={fb.id}
                  onClick={() => setSelectedFabric(fb.id)}
                  className={`text-right text-xs px-3 py-2 rounded-lg transition-colors font-sans flex items-center justify-between ${
                    selectedFabric === fb.id
                      ? 'bg-pink-50 text-[#F4B6C2] font-semibold'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span>{fb.label}</span>
                  {selectedFabric === fb.id && <Check size={12} />}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="mb-6">
            <h5 className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-3">اللون</h5>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => setSelectedColor('all')}
                className={`w-6 h-6 text-[10px] font-sans rounded-full flex items-center justify-center transition-all border ${
                  selectedColor === 'all'
                    ? 'border-[#0B0B0B] bg-[#0B0B0B] text-white font-bold'
                    : 'border-gray-200 text-gray-700 bg-white'
                }`}
              >
                الكل
              </button>
              {colors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setSelectedColor(c.name)}
                  className={`w-6 h-6 rounded-full transition-all relative border flex items-center justify-center ${
                    selectedColor === c.name ? 'ring-2 ring-offset-2 ring-[#0B0B0B]' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {selectedColor === c.name && (
                    <Check size={10} className={c.hex === '#FAFAF7' || c.hex === '#F6E7A6' ? 'text-gray-900' : 'text-white'} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h5 className="text-xs font-semibold uppercase text-gray-400 tracking-wider">الحد الأقصى للسعر</h5>
              <span className="text-xs font-bold text-[#F4B6C2] font-sans">
                {priceRange} {country === 'EG' ? 'EGP' : 'SAR'}
              </span>
            </div>
            <input
              type="range"
              min={country === 'EG' ? 1000 : 80}
              max={currentMaxPrice}
              step={country === 'EG' ? 100 : 10}
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#F4B6C2]"
            />
          </div>

        </aside>

        {/* Products Grid */}
        <main className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl p-8">
              <span className="text-4xl">🕊️</span>
              <h4 className="font-serif text-xl font-light text-[#0B0B0B] mt-4 mb-2">لم نجد ما تبحثين عنه بالضبط</h4>
              <p className="text-gray-400 text-xs font-sans max-w-sm mx-auto mb-6">
                جربي تعديل خيارات الفلترة أو مسح فلاتر المقاس واللون للعثور على قطع سولتا الراقية الأخرى.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedSize('all');
                  setSelectedColor('all');
                  setSelectedFabric('all');
                  setPriceRange(currentMaxPrice);
                }}
                className="bg-[#0B0B0B] text-white hover:bg-[#F4B6C2] px-6 py-2.5 rounded-full text-xs font-sans transition-colors"
              >
                عرض كل المنتجات
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-8">
              {filteredProducts.map((product) => {
                const isItemFav = isFavorite(product.id);
                const currentPrice = country === 'EG' ? product.priceEG : product.priceSA;
                const currencyLabel = country === 'EG' ? 'EGP' : 'SAR';

                return (
                  <div
                    key={product.id}
                    className="group relative bg-[#FAFAF7] rounded-xl sm:rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col h-full"
                  >
                    {/* Corner Labels (Best seller, etc.) */}
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 flex flex-col gap-1">
                      {product.isBestSeller && (
                        <span className="bg-[#0B0B0B] text-[#F6E7A6] font-sans text-[8px] sm:text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-[#F6E7A6]/30 text-center">
                          التميز الملكي
                        </span>
                      )}
                      {product.category === 'new' && (
                        <span className="bg-[#F4B6C2] text-white font-sans text-[8px] sm:text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-center">
                          جديد
                        </span>
                      )}
                      {product.stock !== undefined && product.stock > 0 && product.stock < 5 && (
                        <span className="bg-[#FAF4F5] text-[#DF8A9C] border border-[#DF8A9C]/30 font-sans text-[8.5px] sm:text-[9.5px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full animate-pulse text-center shadow-xs">
                          ⏰ كمية محدودة جداً ({product.stock})
                        </span>
                      )}
                    </div>

                    {/* Wishlist Button */}
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 bg-white/80 hover:bg-white text-gray-800 p-1.5 sm:p-2 rounded-full shadow-xs transition-colors hover:text-red-500"
                    >
                      <Heart size={14} fill={isItemFav ? '#EF4444' : 'none'} className={isItemFav ? 'text-red-500' : 'text-gray-700'} />
                    </button>

                    {/* Comparison Toggle Button */}
                    <button
                      onClick={() => toggleCompare(product)}
                      className={`absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-1.5 sm:p-2 rounded-full shadow-xs transition-colors duration-250 ${
                        compareList.some(item => item.id === product.id)
                          ? 'bg-[#DF8A9C] text-white hover:bg-[#c97486]'
                          : 'bg-white/80 hover:bg-white text-gray-800 hover:text-[#DF8A9C]'
                      }`}
                      title="مقارنة المنتج"
                    >
                      <GitCompare size={14} className={compareList.some(item => item.id === product.id) ? 'scale-110' : ''} />
                    </button>

                    {/* Product Image Center */}
                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 select-none cursor-pointer" onClick={() => onSelectProduct(product)}>
                      <img
                        src={product.images[0]}
                        alt={product.nameAr}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      />
                      
                      {/* Dark overlay with interactive quick-view hover effect showing colors & availability */}
                      <div className="absolute inset-x-0 bottom-0 top-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3 select-none">
                        
                        {/* Top Indicator: Live availability tag */}
                        <div className="w-full flex justify-between items-center flex-row-reverse">
                          <span className="bg-[#0b0b0b]/85 text-[#FAF4F5] px-2 py-0.5 rounded-full font-serif font-light text-[8px] sm:text-[9px]">
                            سولتا إكسبريس ديلفري 🌿
                          </span>
                          
                          {product.stock !== undefined && product.stock > 0 ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-950/80 backdrop-blur-xs text-emerald-400 border border-emerald-500/30 text-[8px] sm:text-[9px] font-sans font-bold px-2 py-0.5 rounded-full flex-row-reverse">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span>متوفر {product.stock <= 5 ? `(متبقي ${product.stock})` : 'بالمخزون'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-red-950/80 backdrop-blur-xs text-red-300 border border-red-500/30 text-[8px] sm:text-[9px] font-sans font-bold px-2 py-0.5 rounded-full flex-row-reverse">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                              <span>نفدت الكمية 🕊️</span>
                            </span>
                          )}
                        </div>

                        {/* Middle: Beautiful "Quick View Details" Button */}
                        <div className="flex justify-center items-center my-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectProduct(product);
                            }}
                            className="bg-[#FAFAF7] hover:bg-[#0B0B0B] text-gray-900 hover:text-[#F6E7A6] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-sans font-bold transition-all flex items-center gap-1.5 shadow-lg active:scale-95 duration-200 cursor-pointer"
                          >
                            <Eye size={12} className="text-[#DF8A9C]" />
                            <span>تفاصيل القطعة 🌸</span>
                          </button>
                        </div>

                        {/* Bottom: Sliding-up detail pane of colors and sizes */}
                        <div className="bg-neutral-950/95 backdrop-blur-md rounded-2xl p-2.5 border border-white/10 text-right space-y-2 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                          {/* Sizing list */}
                          {product.sizes && product.sizes.length > 0 && (
                            <div className="flex justify-between items-center flex-row-reverse text-[9px] text-gray-300 font-sans">
                              <span>المقاسات المتوفرة:</span>
                              <div className="flex gap-1 flex-row-reverse">
                                {product.sizes.map((sz) => (
                                  <span key={sz} className="bg-white/10 px-1.5 py-0.5 rounded-md font-bold text-white border border-white/5 text-[8.5px]">
                                    {sz}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Color List with Names in Arabic! */}
                          <div className="space-y-1">
                            <span className="text-[8px] text-gray-400 font-sans block">تدرجات الألوان الفاخرة المتاحة:</span>
                            <div className="flex flex-wrap gap-1 justify-end">
                              {product.colors.map((col) => (
                                <div
                                  key={col.name}
                                  className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/15 px-1.5 py-0.5 rounded-full border border-white/5 text-[8.5px] transition-all"
                                  title={col.name}
                                >
                                  <span className="text-gray-250 font-medium font-sans text-[8px]">{col.name}</span>
                                  <span
                                    className="w-1.5 h-1.5 rounded-full border border-white/20 shrink-0"
                                    style={{ backgroundColor: col.hex }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Meta description body */}
                    <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1 mb-1 sm:mb-2">
                          <span className="text-[8px] sm:text-[10px] uppercase font-sans text-gray-400 tracking-wider">
                            {product.categoryAr}
                          </span>
                          <span className="text-gray-300 text-[8px] sm:text-xs">•</span>
                          <div className="flex items-center gap-0.5">
                            <span className="text-yellow-400 text-[10px] sm:text-xs">★</span>
                            <span className="text-[8px] sm:text-[10px] font-sans text-gray-500">{product.rating}</span>
                          </div>
                        </div>

                        <h4
                          onClick={() => onSelectProduct(product)}
                          className="text-xs sm:text-sm font-semibold text-[#0B0B0B] line-clamp-1 mb-1 sm:mb-1.5 hover:text-[#F4B6C2] transition-colors cursor-pointer"
                        >
                          {product.nameAr}
                        </h4>
                        
                        <p className="text-gray-400 text-[10px] sm:text-xs line-clamp-1 sm:line-clamp-2 leading-relaxed mb-2.5 sm:mb-4">
                          {product.descriptionAr}
                        </p>
                      </div>

                      <div className="mt-auto">
                        {/* Colors line */}
                        <div className="flex gap-1 mb-2 sm:mb-4 select-none">
                          {product.colors.map(col => (
                            <span
                              key={col.name}
                              className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full border border-gray-200"
                              style={{ backgroundColor: col.hex }}
                              title={col.name}
                            />
                          ))}
                        </div>

                        {/* Form pricing / Action bottom */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 pt-2 sm:pt-3 border-t border-gray-100">
                          <div className="flex flex-col text-right">
                            <span className="text-[8px] sm:text-[10px] text-gray-400 font-sans">السعر</span>
                            <span className="font-sans font-semibold text-xs sm:text-sm md:text-base text-[#0B0B0B] tracking-tight whitespace-nowrap">
                              {currentPrice.toLocaleString()} {currencyLabel}
                            </span>
                          </div>

                          <button
                            onClick={() => onAddToCart(product, product.colors[0], product.sizes[0] || 'S')}
                            className="w-full sm:w-auto justify-center bg-[#0B0B0B] hover:bg-[#F4B6C2] text-white hover:text-white px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-sans transition-luxury flex items-center gap-1 sm:gap-1.5"
                          >
                            <ShoppingCart size={11} />
                            <span>شراء</span>
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Sheet Component Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-start">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
          <div className="relative w-80 max-w-[85vw] bg-white h-full p-6 shadow-2xl flex flex-col overflow-y-auto animate-slide-right z-50">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
              <span className="font-serif font-bold text-[#0B0B0B] text-lg">خيارات التصفية</span>
              <button onClick={() => setShowMobileFilters(false)} className="p-1 text-gray-400 hover:text-red-500">
                <X size={20} />
              </button>
            </div>

            {/* Mobile category selection pill list */}
            <div className="mb-6">
              <h5 className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-2">القسم الرئيسي</h5>
              <div className="flex flex-col gap-1.5">
                {displayCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`text-right text-xs px-3 py-2 rounded-lg transition-colors font-sans flex items-center justify-between ${
                      selectedCategory === cat.id ? 'bg-pink-50 text-[#F4B6C2] font-semibold' : 'text-gray-600'
                    }`}
                  >
                    <span>{cat.label}</span>
                    {selectedCategory === cat.id && <Check size={12} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile sizes */}
            <div className="mb-6">
              <h5 className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-3">المقاس</h5>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSize('all')}
                  className={`w-9 h-9 text-xs font-sans rounded-lg flex items-center justify-center transition-all ${
                    selectedSize === 'all' ? 'bg-[#0B0B0B] text-white font-bold' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  الكل
                </button>
                {sizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`w-9 h-9 text-xs font-sans rounded-lg flex items-center justify-center transition-all ${
                      selectedSize === sz ? 'bg-[#F4B6C2] text-white font-bold' : 'bg-gray-100'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Fabrics */}
            <div className="mb-6">
              <h5 className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-3">الخامة</h5>
              <div className="flex flex-col gap-1.5">
                {fabrics.map((fb) => (
                  <button
                    key={fb.id}
                    onClick={() => setSelectedFabric(fb.id)}
                    className={`text-right text-xs px-3 py-2 rounded-lg transition-colors font-sans flex items-center justify-between ${
                      selectedFabric === fb.id ? 'bg-pink-50 text-[#F4B6C2] font-semibold' : 'text-gray-600'
                    }`}
                  >
                    <span>{fb.label}</span>
                    {selectedFabric === fb.id && <Check size={12} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile pricing limit slider */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h5 className="text-xs font-semibold uppercase text-gray-400 tracking-wider">الحد الأقصى للسعر</h5>
                <span className="text-xs font-bold text-[#F4B6C2] font-sans">
                  {priceRange} {country === 'EG' ? 'EGP' : 'SAR'}
                </span>
              </div>
              <input
                type="range"
                min={country === 'EG' ? 1000 : 80}
                max={currentMaxPrice}
                step={country === 'EG' ? 100 : 10}
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none accent-[#F4B6C2]"
              />
            </div>

            <button
              onClick={() => setShowMobileFilters(false)}
              className="mt-auto w-full bg-[#0B0B0B] text-white hover:bg-[#F4B6C2] py-3.5 rounded-xl text-xs font-sans font-semibold tracking-wide transition-colors text-center"
            >
              عرض {filteredProducts.length} من القطع الراقية
            </button>
          </div>
        </div>
      )}

      {/* Recently Viewed Products */}
      {recentlyViewed && recentlyViewed.length > 0 && (
        <section className="mt-20 border-t border-gray-150 pt-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center md:text-right mb-8">
              <span className="text-xs uppercase tracking-widest text-[#F4B6C2] font-serif block font-bold">Your Private History • تصفحتِها مؤخراً</span>
              <h3 className="font-serif text-2xl font-light text-[#0B0B0B] mt-1">قطع نالت اهتمامِك الفاخر</h3>
              <div className="w-12 h-0.5 bg-[#F6E7A6] mt-3 mx-auto md:mx-0" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {recentlyViewed.map((prod) => {
                const price = country === 'EG' ? prod.priceEG : prod.priceSA;
                const currency = country === 'EG' ? 'EGP' : 'SAR';
                return (
                  <div
                    key={prod.id}
                    onClick={() => onSelectProduct(prod)}
                    className="group bg-white rounded-2xl overflow-hidden border border-gray-150 hover:shadow-md transition-all p-3 cursor-pointer flex flex-col justify-between h-auto"
                  >
                    <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-50 mb-3 relative">
                      <img src={prod.images[0]} alt={prod.nameAr} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" />
                    </div>
                    <div className="space-y-1 p-1">
                      <span className="text-[10px] text-gray-400 block font-sans">{prod.categoryAr}</span>
                      <h5 className="text-xs font-bold font-sans text-gray-900 group-hover:text-[#F4B6C2] transition-colors line-clamp-1">{prod.nameAr}</h5>
                      <span className="text-xs font-sans font-semibold text-[#0B0B0B] block mt-1">{price.toLocaleString()} {currency}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
      {/* 📊 FLOATING COMPARISON BAR (شريط مقارنة الأطقم) */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 inset-x-4 max-w-lg mx-auto z-40 bg-[#0B0B0B]/95 text-white backdrop-blur-md rounded-2xl shadow-2xl px-4.5 py-3 border border-[#F6E7A6]/30 flex items-center justify-between gap-3 animate-bounce-ingress select-none flex-row-reverse text-right">
          <div className="flex items-center gap-2">
            <GitCompare size={15} className="text-[#F4B6C2]" />
            <div>
              <p className="text-[11px] font-bold">مقارنة القطع المنتقاة ({compareList.length})</p>
              <p className="text-[9px] text-[#F6E7A6]/80 font-serif">مقارنة الخامات، الأسعار وملاءمة البشرة</p>
            </div>
          </div>

          <div className="flex gap-1.5 items-center">
            {compareList.map(prod => (
              <div key={prod.id} className="relative w-8.5 h-11 rounded-lg overflow-hidden border border-white/20 bg-neutral-900 shrink-0 group">
                <img src={prod.images[0]} alt="Comp thumbnail" className="w-full h-full object-cover" />
                <button
                  onClick={() => toggleCompare(prod)}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer text-red-400 font-bold text-xs"
                  title="إزالة من المقارنة"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={() => setShowCompareModal(true)}
              className="bg-[#F4B6C2] hover:bg-white text-gray-950 px-4 py-2 rounded-xl text-[10.5px] font-sans font-black tracking-side cursor-pointer transition-all shadow-sm shrink-0"
            >
              قارني الآن ✦
            </button>
            <button
              onClick={() => setCompareList([])}
              className="bg-neutral-800 hover:bg-neutral-700 text-gray-400 hover:text-white p-2 rounded-xl text-xs cursor-pointer transition-all"
              title="تفريغ القائمة"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* 📊 LUXURIOUS COMPARISON MODAL TABLE (المعرض الكوطوري لمقارنة الموديلات والأسعار) */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity" onClick={() => setShowCompareModal(false)} />
          
          <div className="relative bg-[#FAFAF7] w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl z-55 animate-scale-up border border-[#F6E7A6]/20 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-6 py-4.5 bg-[#0B0B0B] text-white flex justify-between items-center flex-row-reverse">
              <div className="flex items-center gap-2.5">
                <GitCompare size={18} className="text-[#F6E7A6] shrink-0" />
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-[0.25em] font-serif font-black text-[#DF8A9C] block">SULTA COUTURE COMP-VIEW V3.0</span>
                  <h3 className="font-serif text-base font-light text-white">مقارنة ومطابقة الأطقم والبيجامات الراقية</h3>
                </div>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-all cursor-pointer border border-white/5"
              >
                <X size={14} />
              </button>
            </div>

            {/* Comparison Table Grid Scroll */}
            <div className="p-6 overflow-y-auto flex-1 font-sans text-right text-xs">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse rounded-xl overflow-hidden shadow-xs">
                  <thead>
                    <tr className="bg-gray-100 text-gray-800 select-none border-b border-gray-200">
                      <th className="p-3.5 text-center font-bold font-serif text-[11px] w-1/4">المواصفات الكوتورية</th>
                      {compareList.map(prod => (
                        <th key={prod.id} className="p-3.5 text-center font-bold font-serif text-sm w-1/4">
                          <span className="text-[9.5px] bg-[#0B0B0B] text-[#F6E7A6] px-2.5 py-0.5 rounded-full inline-block mb-2 font-black uppercase">
                            {prod.categoryAr}
                          </span>
                          <p className="line-clamp-1">{prod.nameAr}</p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {/* Img row */}
                    <tr>
                      <td className="p-3.5 bg-gray-50/55 font-bold text-gray-500 font-sans text-right leading-relaxed">المظهر الخارجي</td>
                      {compareList.map(prod => (
                        <td key={prod.id} className="p-3 bg-white text-center">
                          <div className="w-24 h-32 mx-auto rounded-xl overflow-hidden border border-gray-150 shadow-xs relative bg-gray-100">
                            <img src={prod.images[0]} alt={prod.nameAr} className="w-full h-full object-cover" />
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Price row */}
                    <tr>
                      <td className="p-3.5 bg-gray-50/55 font-bold text-gray-500 font-sans text-right">القيمة الاستثمارية</td>
                      {compareList.map(prod => {
                        const price = country === 'EG' ? prod.priceEG : prod.priceSA;
                        const label = country === 'EG' ? 'EGP' : 'SAR';
                        return (
                          <td key={prod.id} className="p-3.5 text-center font-bold text-neutral-900 text-sm font-sans tracking-tight">
                            {price.toLocaleString()} {label}
                            {prod.rating >= 4.9 && <span className="text-[8.5px] text-emerald-600 block mt-0.5">(الأعلى تقييماً)</span>}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Material fabric row */}
                    <tr>
                      <td className="p-3.5 bg-gray-50/55 font-bold text-gray-500 font-sans text-right">الخامة والنسيج</td>
                      {compareList.map(prod => (
                        <td key={prod.id} className="p-3.5 text-center text-gray-700 leading-relaxed font-sans">
                          {prod.descriptionAr.includes('ستان') || prod.descriptionAr.includes('حرير') ? (
                            <span>ساتان جيفنشي الحريري الناعم مع معالجة حماية الدانتيل البكر 🪷</span>
                          ) : prod.descriptionAr.includes('قطن') ? (
                            <span>قطن مصري طبيعي مئوي معالج بنضارة الكرز ☁️</span>
                          ) : (
                            <span>نسيج تيري فاخر عابر للفصول ثقيل اللمعة ✦</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Available colors row */}
                    <tr>
                      <td className="p-3.5 bg-gray-50/55 font-bold text-gray-500 font-sans text-right">الألوان المتاحة فورياً</td>
                      {compareList.map(prod => (
                        <td key={prod.id} className="p-3.5 text-center font-sans">
                          <div className="flex gap-1.5 justify-center flex-wrap">
                            {prod.colors.map(col => (
                              <span
                                key={col.name}
                                className="w-3.5 h-3.5 rounded-full border border-gray-200 inline-block shadow-inner"
                                style={{ backgroundColor: col.hex }}
                                title={col.name}
                              />
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Available sizes */}
                    <tr>
                      <td className="p-3.5 bg-gray-50/55 font-bold text-gray-500 font-sans text-right">تدرج المقاسات الذهبية</td>
                      {compareList.map(prod => (
                        <td key={prod.id} className="p-3.5 text-center font-sans text-xs text-gray-600">
                          <div className="flex gap-1 justify-center flex-wrap max-w-[120px] mx-auto">
                            {prod.sizes.map(sz => (
                              <span key={sz} className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold">
                                {sz}
                              </span>
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Rating row */}
                    <tr>
                      <td className="p-3.5 bg-gray-50/55 font-bold text-gray-500 font-sans text-right">التقييم وهالة التميز</td>
                      {compareList.map(prod => (
                        <td key={prod.id} className="p-3.5 text-center font-sans">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-yellow-400 font-sans">★</span>
                            <span className="font-bold text-gray-800">{prod.rating}</span>
                          </div>
                          <span className="text-[9px] text-gray-400 block mt-0.5 font-sans">(بناءً على طلبات الزبائن)</span>
                        </td>
                      ))}
                    </tr>

                    {/* Wash advice specs */}
                    <tr>
                      <td className="p-3.5 bg-gray-50/55 font-bold text-gray-500 font-sans text-right">العناية والغسيل</td>
                      {compareList.map(prod => (
                        <td key={prod.id} className="p-3.5 text-center text-[10px] leading-relaxed text-gray-500 font-sans">
                          {prod.descriptionAr.includes('ستان') || prod.descriptionAr.includes('حرير') ? (
                            <span>يُفضل غسل يدوي هادئ بالماء البارد دون عصر للحفاظ على لمعة الخيوط الكلاسيكية 🫧</span>
                          ) : (
                            <span>غسل بآلة أوتوماتيكية ببرنامج لطيف ودرجة حرارة منخفضة مجاناً ☁️</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Action row quick add */}
                    <tr>
                      <td className="p-3.5 bg-gray-50/55 font-bold text-gray-500 font-sans text-right">اتخاذ قرار الشراء</td>
                      {compareList.map(prod => (
                        <td key={prod.id} className="p-3.5 text-center">
                          <div className="space-y-1.5">
                            <button
                              onClick={() => {
                                onAddToCart(prod, prod.colors[0], prod.sizes[0] || 'S');
                                toast(`تفخر سولتا بإضافة ${prod.nameAr} إلى سلتكِ بنجاح! 🌸`, 'success');
                              }}
                              className="w-full bg-[#0B0B0B] hover:bg-[#F4B6C2] text-white hover:text-white px-3 py-2 rounded-xl text-[10px] font-sans font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <ShoppingCart size={11} />
                              <span>إضافة سريعة للسلة</span>
                            </button>
                            <button
                              onClick={() => {
                                setShowCompareModal(false);
                                onSelectProduct(prod);
                              }}
                              className="w-full border border-gray-200 text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-xl text-[9px] font-semibold transition-all cursor-pointer block text-center"
                            >
                              تفاصيل العرض الملكي
                            </button>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer advice */}
            <div className="px-6 py-4 bg-gray-50/95 border-t border-gray-150 text-center text-[10px] text-gray-400 font-serif flex justify-center items-center gap-1 select-none">
              <span>جميع الخامات المنسوجة خاضعة لفحص دقة الأنسجة وتعبأ بداخل صندوق سولتا الهدبي الفاخر.</span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
