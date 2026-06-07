import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Filter, Search, Heart, ShoppingBag, Eye, X, ChevronDown, 
  Sparkles, SlidersHorizontal, ArrowLeft, Play, Info, 
  Volume2, VolumeX, Check, Grid, RefreshCw, Star, ArrowUpDown, Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Country, Category } from '../types';
import StyleAssistant from './StyleAssistant';

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
  recentlyViewed = []
}: StoreViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [mobileLayout, setMobileLayout] = useState<'single' | 'double'>('double');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [activeThumbIndices, setActiveThumbIndices] = useState<Record<string, number>>({});
  const [cardColorSelections, setCardColorSelections] = useState<Record<string, { name: string; hex: string }>>({});
  const [isMuted, setIsMuted] = useState(true);
  const [showStyleAssistant, setShowStyleAssistant] = useState(false);
  
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
      { id: 'all', nameAr: 'كل المجموعات الإمبراطورية', nameEn: 'ALL COUTURE COLLECTIONS' },
      ...categories.map(c => ({ id: c.id, nameAr: c.nameAr || c.name, nameEn: c.nameEn || c.name }))
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
    let result = products.filter(p => p.status !== 'draft' && p.status !== 'archived');
    
    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory || p.categoryAr === selectedCategory);
    }

    // Collection filter
    if (selectedCollection !== 'all') {
      result = result.filter(p => p.collection === selectedCollection);
    }
    
    // Smart Arabic & English Search Engine (Satin, cotton, price ranges, colors, etc.)
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => {
        const matchesText = 
          (p.nameEn && p.nameEn.toLowerCase().includes(q)) || 
          (p.nameAr && p.nameAr.toLowerCase().includes(q)) ||
          (p.descriptionEn && p.descriptionEn.toLowerCase().includes(q)) ||
          (p.descriptionAr && p.descriptionAr.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.categoryAr && p.categoryAr.includes(q)) ||
          (p.collection && p.collection.toLowerCase().includes(q));

        const matchesFabric = 
          (q.includes('ساتان') || q.includes('satin') || q.includes('حرير') || q.includes('silk')) && 
          (p.nameAr?.includes('ساتان') || p.nameAr?.includes('حرير') || p.nameEn?.toLowerCase().includes('satin') || p.nameEn?.toLowerCase().includes('silk') || p.fabricAr?.includes('ساتان')) ||
          (q.includes('قطن') || q.includes('cotton')) && 
          (p.nameAr?.includes('قطن') || p.nameEn?.toLowerCase().includes('cotton') || p.fabricAr?.includes('قطن')) ||
          (q.includes('مخمل') || q.includes('velvet') || q.includes('شتاء') || q.includes('winter')) && 
          (p.nameAr?.includes('مخمل') || p.nameEn?.toLowerCase().includes('velvet') || p.nameAr?.includes('روب') || p.nameEn?.toLowerCase().includes('robe'));

        const matchesColor = p.colors?.some(c => 
          c.name?.toLowerCase().includes(q) || 
          (q.includes('وردي') && c.name?.includes('وردي')) ||
          ((q.includes('أبيض') || q.includes('عاجي') || q.includes('وايت')) && c.name?.includes('وايت')) ||
          (q.includes('أسود') && c.name?.includes('أسود'))
        );

        const currentPrice = country === 'EG' ? p.priceEG : p.priceSA;
        let matchesPriceRange = false;
        if (q.includes('under') || q.includes('أقل من') || q.includes('اقل من') || q.includes('تحت')) {
          const num = parseInt(q.replace(/[^0-9]/g, ''), 10);
          if (num && currentPrice <= num) {
            matchesPriceRange = true;
          }
        }

        return matchesText || matchesFabric || matchesColor || matchesPriceRange;
      });
    }

    // Sort Metrics
    result = [...result].sort((a, b) => {
      const getPrice = (p: Product) => country === 'EG' ? p.priceEG : p.priceSA;
      if (sortBy === 'price-low') return getPrice(a) - getPrice(b);
      if (sortBy === 'price-high') return getPrice(b) - getPrice(a);
      if (sortBy === 'bestseller') return (b.rating || 5) - (a.rating || 5);
      if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
      return b.id.localeCompare(a.id); // Default newest
    });

    return result;
  }, [products, selectedCategory, selectedCollection, searchQuery, sortBy, country]);

  // Determine current active category showcase details
  const activeCategoryDetails = useMemo(() => {
    if (selectedCategory === 'all') {
      return {
        titleAr: 'الكتالوج الملكي لعلامة SULTA',
        titleEn: 'THE IMPERIAL SULTA CATALOGUE',
        descAr: 'تحفة الحرير الملكي الإيطالي والقطن العضوي طويل التيلة المصمم ليزين لياليك بالفخامة والراحة المطلقة.',
        bgImage: 'https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=1600',
        quote: '"الجمال ليس اختيارًا، بل أسلوب حياة تتبنينه داخل عالمك الخاص.."',
        author: 'SULTA ATELIER'
      };
    }
    const catObj = categories.find(c => c.id === selectedCategory);
    return {
      titleAr: catObj?.nameAr || catObj?.name || 'مجموعة فاخرة',
      titleEn: (catObj?.nameEn || catObj?.name || 'COUTURE DESIGN').toUpperCase(),
      descAr: `قطع مفعمة بالفخامة والجاذبية مصممة بدقة من خامة ${catObj?.nameAr || 'البراند'} العريقة لتطوق جسدكِ كالغيم المريح.`,
      bgImage: catObj?.imageUrl || 'https://images.unsplash.com/photo-1614088685112-0a7db9bcdad5?q=80&w=1600',
      quote: `"صيغت لتلبي شغف العرائس وتلامس رقة الروح بنعومة حريرية لا تفنى."`,
      author: 'إصدارات ليمتد كوتور'
    };
  }, [selectedCategory, categories]);

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

  return (
    <div className="bg-[#FAF9F6] min-h-screen text-[#0C0C0C] font-sans antialiased text-xs md:text-sm">
      
      {/* 1. LARGE HERO COLLECTION BANNER */}
      <div className="relative w-full h-[65vh] md:h-[80vh] overflow-hidden flex items-end">
        {/* Parallax Background Frame */}
        <div className="absolute inset-0 scale-105 select-none transition-all duration-1000">
          <img 
            src={activeCategoryDetails.bgImage} 
            alt={activeCategoryDetails.titleAr} 
            className="w-full h-full object-cover object-top brightness-[0.7] animate-fade-in duration-1000"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F6] via-transparent to-black/40 z-1" />
        </div>

        {/* Video Background Layer if any matching products has video under this category */}
        {useMemo(() => {
          const catProds = products.filter(p => p.category === selectedCategory && p.video);
          const firstVid = catProds[0]?.video || '';
          if (firstVid) {
            return (
              <video 
                src={firstVid} 
                autoPlay 
                muted 
                loop 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover brightness-[0.6] transition-opacity duration-1000"
              />
            );
          }
          return null;
        }, [selectedCategory, products])}

        {/* Floating Atelier Audio Controller */}
        <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
          {/* Mute Button (Desktop only initially) */}
          <div className="hidden md:flex items-center bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/10 text-white select-none">
            <button 
              type="button"
              onClick={() => setIsMuted(!isMuted)} 
              className="text-[#FAF5F0] hover:text-[#DF8A9D] transition-colors cursor-pointer flex items-center gap-1.5"
              title={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} className="animate-pulse" />}
              <span className="text-[10px] font-sans tracking-widest font-semibold uppercase">⚜️ BRAND ATMOSPHERE</span>
            </button>
          </div>
          
          {/* Style Assistant Floating Button (Always visible) */}
          <button
            onClick={() => setShowStyleAssistant(true)}
            className="flex items-center gap-2 bg-[#FAF4F5] hover:bg-[#DF8A9C] text-[#DF8A9C] hover:text-white px-3.5 py-2 rounded-full transition-colors border border-white/20 shadow-md backdrop-blur-sm"
          >
            <Wand2 size={14} className="animate-pulse" />
            <span className="text-[10px] font-bold tracking-wide">المستشار 👗</span>
          </button>
        </div>

        {/* Content Box */}
        <div className="absolute bottom-0 inset-x-0 w-full text-center px-6 pb-12 md:pb-24 max-w-4xl mx-auto z-5 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-2 md:space-y-4"
          >
            <span className="text-[10px] md:text-xs text-[#c5a059] tracking-[0.3em] font-sans font-bold uppercase flex items-center justify-center gap-1.5">
              <Sparkles size={12} className="animate-pulse text-[#FAF5F0]" />
              SULTA COUTURE PRESENTS
            </span>
            <h1 className="font-serif text-3xl md:text-6xl lg:text-7xl font-light text-white tracking-wide uppercase leading-tight drop-shadow-sm font-imperial">
              {activeCategoryDetails.titleEn}
            </h1>
            <p className="font-serif text-sm md:text-xl text-white/95 max-w-2xl mx-auto leading-relaxed italic">
              {activeCategoryDetails.titleAr} — {activeCategoryDetails.descAr}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="pt-4 flex flex-wrap justify-center gap-3"
          >
            <button 
              type="button"
              onClick={() => {
                const galleryElem = document.getElementById('catalog-explore-anchor');
                if (galleryElem) galleryElem.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3.5 bg-[#0C0C0C] text-[#FAF5F0] border border-[#c5a059]/40 hover:bg-[#FAF5F0] hover:text-[#0C0C0C] font-semibold text-[10px] sm:text-xs uppercase tracking-widest transition-all rounded-full cursor-pointer hover:shadow-lg flex items-center gap-2 ring-1 ring-white/10"
            >
              <ShoppingBag size={13} />
              اكتشفي المجموعة الحالية | EXPLORE COLLECTION
            </button>
          </motion.div>
        </div>

        {/* Magazine Frame Ribbon line */}
        <div className="absolute bottom-0 left-0 w-full h-[6px] bg-gradient-to-r from-[#c5a059] via-[#DF8A9D] to-[#FAF9F6]" />
      </div>

      {/* 2. STICKY GLASSMORPHISM FILTER BAR & TOOLBAR */}
      <div id="catalog-explore-anchor" className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md shadow-xs select-none">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-3 flex flex-wrap items-center justify-between gap-4" dir="rtl">
          
          {/* Quick Collection Nav Links */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full md:max-w-xl pb-1 md:pb-0 font-sans">
            {displayCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setSelectedCollection('all'); }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-semibold tracking-wider transition-all uppercase cursor-pointer ${
                  selectedCategory === cat.id 
                    ? 'bg-[#0C0C0C] text-[#FAF5F0] shadow-sm' 
                    : 'text-gray-500 hover:text-[#0C0C0C] hover:bg-gray-100'
                }`}
              >
                {cat.nameAr}
              </button>
            ))}
          </div>

          {/* Right Toolbar Options */}
          <div className="flex items-center gap-3 font-sans w-full sm:w-auto justify-between sm:justify-start">
            
            {/* Mobile Layout Switcher Toggle */}
            <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3">
              <button
                type="button"
                onClick={() => setMobileLayout('single')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${mobileLayout === 'single' ? 'bg-pink-55 text-[#A44C5C]' : 'text-gray-400 hover:text-gray-800'}`}
                title="عرض تصفح كامل الصفحة"
              >
                📱
              </button>
              <button
                type="button"
                onClick={() => setMobileLayout('double')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${mobileLayout === 'double' ? 'bg-pink-55 text-[#A44C5C]' : 'text-gray-400 hover:text-gray-800'}`}
                title="شبكة مزدوجة"
              >
                <Grid size={15} />
              </button>
            </div>

            {/* Smart Search box inside sticky toolbar */}
            <div className="relative max-w-[170px] sm:max-w-xs flex-1">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Search size={13} />
              </span>
              <input
                type="text"
                placeholder="ابحثي..."
                value={searchQuery}
                onChange={(e) => onSearchQueryChange && onSearchQueryChange(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-full pr-8 pl-8 py-1.5 text-xs text-[#0B0B0B] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#A44C5C] focus:bg-white text-right font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => onClearSearch && onClearSearch()}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                >
                  <X size={10} />
                </button>
              )}
            </div>

            {/* Premium Sorting dropdown */}
            <div className="relative shrink-0 flex items-center gap-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider hidden md:inline">فرز:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-gray-50 border border-gray-200 rounded-full pr-3 pl-8 py-1.5 text-xs text-gray-800 focus:outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <option value="newest">وصلنا حديثاً ⚜️</option>
                  <option value="bestseller font-sans">الأكثر طلباً 👑</option>
                  <option value="price-low">السعر: من الأقل</option>
                  <option value="price-high">السعر: من الأعلى</option>
                  <option value="rating">التقييم الأعلى ⭐</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronDown size={11} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. COLLECTION CLASSIFIERS CHIPS BAR (FOR QUICK RESETS) */}
      {(selectedCategory !== 'all' || selectedCollection !== 'all' || searchQuery) && (
        <div className="bg-[#FAFAF9] border-b border-gray-100 py-3 select-none">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 flex flex-wrap items-center gap-2" dir="rtl">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">المرشحات النشطة:</span>
            
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#A44C5C]/5 border border-[#A44C5C]/20 rounded-full text-[10px] font-semibold text-[#A44C5C]">
                <span>المجموعة: {categories.find(c => c.id === selectedCategory)?.nameAr || selectedCategory}</span>
                <button type="button" onClick={() => setSelectedCategory('all')} className="hover:text-red-600 transition-colors">✕</button>
              </span>
            )}

            {selectedCollection !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/5 border border-amber-500/20 rounded-full text-[10px] font-semibold text-amber-800">
                <span>التشكيلة والموسم: {selectedCollection}</span>
                <button type="button" onClick={() => setSelectedCollection('all')} className="hover:text-red-600 transition-colors">✕</button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/5 border border-blue-500/20 rounded-full text-[10px] font-semibold text-blue-800">
                <span>بحث: "{searchQuery}"</span>
                <button type="button" onClick={() => onClearSearch && onClearSearch()} className="hover:text-red-600 transition-colors">✕</button>
              </span>
            )}

            <button
              onClick={() => { setSelectedCategory('all'); setSelectedCollection('all'); onClearSearch && onClearSearch(); }}
              className="text-[10px] font-bold text-gray-500 hover:text-black underline transition-colors pr-2"
            >
              Reset All / عرض كل الكتالوج
            </button>
          </div>
        </div>
      )}

      {/* 4. MAIN MAGAZINE CATALOG LAYOUT & BENTO GRID */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-16">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-28 bg-white border border-gray-150 rounded-3xl max-w-lg mx-auto p-8 shadow-xs" dir="rtl">
            <div className="w-14 h-14 bg-pink-50 text-[#A44C5C] flex items-center justify-center rounded-2xl mx-auto mb-4 text-xl">✨</div>
            <h3 className="font-serif text-lg text-gray-700 font-bold mb-1">القطع الفاخرة تحت الإعداد</h3>
            <p className="text-gray-400 text-xs mb-6">لم يتم العثور على أي قطع بالمسمى المبحوث عنه حالياً في هذا التصنيف.</p>
            <button 
              onClick={() => { setSelectedCategory('all'); setSelectedCollection('all'); onClearSearch && onClearSearch(); setSortBy('newest'); }}
              className="px-5 py-2.5 bg-[#0C0C0C] text-white hover:bg-[#A44C5C] rounded-full transition-colors text-[10px] font-semibold tracking-widest uppercase cursor-pointer"
            >
              العودة للتشكيلة الكاملة
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Desktop Left Minimal Sidebar Filtering */}
            <aside className="w-full lg:w-64 shrink-0 hidden lg:block select-none" dir="rtl">
              <div className="sticky top-28 space-y-8">
                
                {/* Brand Logo Stamp */}
                <div className="bg-white p-6 rounded-2xl border border-gray-150 text-center space-y-4">
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-[#FAF5F0] border border-[#c5a059]/30 rounded-full flex items-center justify-center mx-auto text-xs">👑</div>
                    <strong className="font-serif uppercase tracking-[0.25em] text-[#0C0C0C] text-[10px] block">SULTA ATELIER</strong>
                    <p className="text-gray-400 text-[10px]">حياكة يدوية خاصة وتوليفات الحرير الملكي الفاخر منذ التأسيس.</p>
                  </div>
                  
                  <button
                    onClick={() => setShowStyleAssistant(true)}
                    className="w-full flex items-center justify-center gap-2 bg-[#FAF4F5] hover:bg-[#DF8A9C] text-[#DF8A9C] hover:text-white px-4 py-2.5 rounded-xl transition-colors group border border-[#DF8A9C]/20"
                  >
                    <Wand2 size={14} className="group-hover:animate-spin" />
                    <span className="text-[10px] font-bold">مستشار العناية والستايل 👗</span>
                  </button>
                </div>

                {/* Subcategories widget */}
                <div className="space-y-4">
                  <h4 className="font-serif text-xs font-black tracking-widest uppercase text-gray-900 border-b border-gray-150 pb-2">التصنيفات الإمبراطورية</h4>
                  <ul className="space-y-2.5 font-sans">
                    {displayCategories.map(cat => (
                      <li key={cat.id}>
                        <button
                          onClick={() => { setSelectedCategory(cat.id); setSelectedCollection('all'); }}
                          className={`text-right w-full flex items-center justify-between text-xs transition-colors py-1 ${
                            selectedCategory === cat.id 
                              ? 'text-[#A44C5C] font-semibold border-r-2 border-[#A44C5C] pr-2' 
                              : 'text-gray-500 hover:text-black'
                          }`}
                        >
                          <span>{cat.nameAr}</span>
                          <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-mono">
                            {products.filter(p => p.status === 'active' && (cat.id === 'all' || p.category === cat.id)).length}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Collections list from Supabase */}
                {availableCollections.length > 1 && (
                  <div className="space-y-4">
                    <h4 className="font-serif text-xs font-black tracking-widest uppercase text-gray-900 border-b border-gray-150 pb-2">التشكيلات الحصرية</h4>
                    <ul className="space-y-2.5 text-xs font-sans">
                      {availableCollections.map(col => (
                        <li key={col}>
                          <button
                            onClick={() => setSelectedCollection(col)}
                            className={`text-right w-full flex items-center justify-between transition-colors py-1 ${
                              selectedCollection === col 
                                ? 'text-[#c5a059] font-bold border-r-2 border-[#c5a059] pr-2' 
                                : 'text-gray-500 hover:text-black'
                            }`}
                          >
                            <span className="uppercase tracking-wider">{col === 'all' ? 'جميع العروض والمجموعات' : col}</span>
                            {col !== 'all' && (
                              <span className="text-[9px] text-[#c5a059] bg-yellow-50 px-1 rounded">
                                LIMIT
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Luxury Seal Statement */}
                <div className="pt-4 border-t border-gray-150 text-[10px] text-gray-400 leading-relaxed font-serif italic text-right space-y-1">
                  <p>⚜️ التوصيل والاطمئنان الملكي متاح لعملاء مصر والموزعين في دول الخليج.</p>
                  <p>⚜️ تغليف هجين بعطور الدار وصندوق ذهبي مبطن.</p>
                </div>

              </div>
            </aside>

            {/* FASHION MAGAZINE ASYMMETRIC GRID VIEW */}
            <main className="flex-1 w-full">
              
              <div className={`grid gap-x-4 sm:gap-x-6 gap-y-10 sm:gap-y-16 ${
                mobileLayout === 'single'
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
                  : 'grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
              }`}>
                
                {filteredProducts.map((product, index) => {
                  const currentPrice = country === 'EG' ? product.priceEG : product.priceSA;
                  const currencyLabel = country === 'EG' ? 'EGP' : 'SAR';
                  const isFav = favorites.includes(product.id);
                  
                  // Active image selection (dynamic thumb swipe index OR color selection change)
                  const cardColorSel = cardColorSelections[product.id];
                  const activeImgIdx = activeThumbIndices[product.id] || 0;
                  
                  // Choose background colors according to card rhythm
                  const isEditorialFeature = index % 5 === 0 && mobileLayout === 'single'; // Break grid with larger content on single layout
                  
                  // Select source image
                  let currentImg = product.images?.[activeImgIdx] || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=600';
                  
                  return (
                    <div 
                      key={product.id} 
                      className={`group flex flex-col relative transition-all duration-300 select-none ${
                        isEditorialFeature 
                          ? 'col-span-full bg-[#FAF5F0] p-4 sm:p-8 rounded-3xl border border-[#DF8A9D]/15 flex-col md:flex-row gap-6 md:gap-10 items-center justify-between text-right' 
                          : 'bg-white rounded-2xl p-2 sm:p-3.5 border border-gray-100 hover:shadow-lg hover:border-[#DF8A9D]/20 duration-500'
                      }`}
                      onClick={() => onSelectProduct(product)}
                    >
                      {/* Left Block or Main Thumb Frame */}
                      <div className={`relative overflow-hidden rounded-xl bg-gray-50 flex-shrink-0 cursor-pointer ${
                        isEditorialFeature 
                          ? 'w-full md:w-1/2 aspect-[4/5] sm:aspect-[3/4]' 
                          : 'w-full aspect-[3/4]'
                      }`}>
                        
                        {/* Render Main Video if first index has video metadata */}
                        {currentImg && (currentImg.match(/\.(mp4|webm|ogg|mov)$/i) || currentImg.includes('video')) ? (
                          <div className="w-full h-full relative">
                            <video 
                              src={currentImg} 
                              className="w-full h-full object-cover" 
                              autoPlay 
                              muted 
                              loop 
                              playsInline 
                            />
                            <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-[9px] text-[#FAF5F0] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                              <Play size={8} fill="currentColor" /> LIVE RUNWAY
                            </span>
                          </div>
                        ) : (
                          <img 
                            src={currentImg} 
                            alt={product.nameEn || product.nameAr} 
                            className="w-full h-full object-cover transition-transform duration-[1000ms] group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        )}

                        {/* Top Wishlist Heart Stamp */}
                        <div className="absolute top-3 right-3 z-10">
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                            className="p-2 rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-gray-500 hover:text-red-500 shadow-sm transition-transform hover:scale-110 cursor-pointer"
                            title="إضافة للمفضلة الملكية"
                          >
                            <Heart size={13} className={isFav ? "fill-red-500 text-red-500" : ""} />
                          </button>
                        </div>

                        {/* BestSeller Gold Bow Crown Badge */}
                        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
                          {product.isBestSeller && (
                            <span className="bg-[#FAF5F0] text-[#A44C5C] text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2.5 py-1 border border-[#A44C5C]/20 shadow-xs">
                              👑 BEST SELLER
                            </span>
                          )}
                          {product.stock <= 3 && product.stock > 0 && (
                            <span className="bg-red-500 text-white text-[8px] md:text-[9px] font-black px-2 py-0.5 shadow-xs">
                              أوشك على النفاذ ليمتد 🚨
                            </span>
                          )}
                        </div>

                        {/* ADVANCED MULTI-THUMB HOVER GALLERY DESK (Dash Indicator Swiper) */}
                        {product.images && product.images.length > 1 && (
                          <div className="absolute bottom-3 inset-x-0 mx-auto max-w-[80%] flex justify-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {product.images.slice(0, 5).map((imgUrl, idx) => (
                              <div
                                key={idx}
                                onMouseEnter={(e) => handleThumbHover(product.id, idx, e)}
                                className={`h-1 flex-1 rounded-full transition-all cursor-pointer ${
                                  activeImgIdx === idx ? 'bg-[#A44C5C] w-4' : 'bg-white/50 backdrop-blur-xs'
                                }`}
                              />
                            ))}
                          </div>
                        )}

                        {/* Quick View Floating Trigger Circle */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickViewProduct(product);
                          }}
                          className="absolute inset-0 m-auto w-12 h-12 bg-white/90 backdrop-blur-sm shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:scale-110 text-gray-800"
                        >
                          <Eye size={17} />
                        </button>
                      </div>

                      {/* Right Block or Bottom Details Area */}
                      <div className={`flex flex-col justify-between py-2 text-right ${
                        isEditorialFeature 
                          ? 'w-full md:w-1/2 space-y-4 pr-0 md:pr-4' 
                          : 'space-y-2 mt-2'
                      }`}>
                        
                        <div className="space-y-1">
                          
                          {/* Editorial Number & Segment */}
                          <div className="flex items-center justify-between text-3xs tracking-widest text-[#c5a059] uppercase font-mono font-bold">
                            <span>{product.collection || 'SULTA ESSENTIALS ⚜️'}</span>
                            <span>[ N° 0{index + 1} ]</span>
                          </div>

                          {/* Product Title in Bold Royal Serif */}
                          <h3 className="font-serif text-sm md:text-base font-medium text-[#0C0C0C] group-hover:text-[#A44C5C] duration-300 tracking-wide line-clamp-1">
                            {country === 'EG' && product.nameAr ? product.nameAr : product.nameEn}
                          </h3>

                          {/* Luxury Description (if editorial layout) */}
                          {isEditorialFeature && (
                            <p className="text-gray-500 text-xs line-clamp-3 leading-relaxed pt-1 select-text">
                              {country === 'EG' ? product.descriptionAr : product.descriptionEn}
                            </p>
                          )}
                        </div>

                        {/* COLOR SWATCH PATROL (Interactive dot switcher) */}
                        {product.colors && product.colors.length > 0 && (
                          <div className="flex items-center gap-1.5 justify-start py-1">
                            {product.colors.map((col, cIdx) => {
                              const isSelected = cardColorSel ? cardColorSel.name === col.name : cIdx === 0;
                              return (
                                <button
                                  key={col.name}
                                  type="button"
                                  onClick={(e) => handleCardColorSelect(product.id, col, e)}
                                  className={`w-3.5 h-3.5 rounded-full border transition-all cursor-pointer ${
                                    isSelected ? 'scale-125 ring-1 ring-[#c5a059] border-white' : 'border-gray-200'
                                  }`}
                                  style={{ backgroundColor: col.hex }}
                                  title={col.name}
                                />
                              );
                            })}
                            <span className="text-3xs text-gray-400 font-sans tracking-wide">
                              ({cardColorSel ? cardColorSel.name : product.colors[0]?.name})
                            </span>
                          </div>
                        )}

                        {/* Sizes bar indicator */}
                        {product.sizes && product.sizes.length > 0 && (
                          <div className="flex items-center gap-1 text-[9px] font-semibold text-gray-400 font-sans justify-start">
                            <span>المقاسات:</span>
                            {product.sizes.map(sz => (
                              <span key={sz} className="px-1 border border-gray-150 rounded-xs bg-white text-gray-600">
                                {sz}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Price Unit, Tax Warning, VAT inclusion, & Quick Buy row */}
                        <div className="flex items-center justify-between pt-1 border-t border-gray-100/50">
                          
                          {/* Price Tag with local Currency */}
                          <div className="flex flex-col text-right">
                            <span className="font-sans font-bold text-xs sm:text-sm text-[#A44C5C]">
                              {currentPrice.toLocaleString()} {currencyLabel}
                            </span>
                            <span className="text-[8px] text-gray-400 font-sans">معفى من الرسوم الإضافية</span>
                          </div>

                          {/* Quick Add To Cart Instant Circle Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const chosenCol = cardColorSelections[product.id] || product.colors?.[0] || { name: 'Rose', hex: '#DF8A9D' };
                              const chosenSz = product.sizes?.[0] || 'S';
                              onAddToCart(product, chosenCol, chosenSz);
                            }}
                            className="bg-black hover:bg-[#A44C5C] text-white p-2 rounded-full transition-colors cursor-pointer"
                            title="إضافة فورية للسلة بمقاس افتراضي"
                          >
                            <ShoppingBag size={12} />
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}

              </div>

            </main>
          </div>
        )}
      </div>

      {/* 5. BRAND QUOTE / THE LIVING LADY ACCENT BANNER (MAGAZINE INTERSTITIAL) */}
      <section className="bg-white py-16 border-y border-gray-150 select-none">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-4">
          <span className="text-[10px] text-[#A44C5C] font-bold tracking-[0.25em] block uppercase">LA VIE EN SULTA</span>
          <p className="font-serif text-lg md:text-2xl text-gray-800 leading-relaxed max-w-2xl mx-auto">
            "نأخذ رقة الدانتيل الإيطالي، ننسجه مع ساتان فاخر يتدلى ليرسم جمال قوامك. نؤمن أن كل عميلة هي أميرة في مملكتها الخاصة."
          </p>
          <div className="w-12 h-[1px] bg-[#c5a059] mx-auto" />
          <span className="text-[10px] text-gray-400 font-serif tracking-widest block uppercase">- SULTA CREATIVE OFFICE</span>
        </div>
      </section>

      {/* 6. ADVANCED QUICK PRODUCT VIEW MODAL (AnimatePresence Overlay) */}
      <AnimatePresence>
        {quickViewProduct && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FAF9F6] border border-gray-200 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl relative text-right text-xs"
              dir="rtl"
            >
              {/* Close Button top corner */}
              <button
                type="button"
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-full p-2 text-gray-500 hover:text-black hover:scale-110 transition-transform cursor-pointer shadow-md z-20"
                title="إغلاق معاينة الفخامة"
              >
                <X size={16} />
              </button>

              <div className="flex flex-col md:flex-row h-full">
                
                {/* Visual Media Frame Left half */}
                <div className="w-full md:w-1/2 bg-gray-50 aspect-square md:aspect-auto relative min-h-[320px] md:min-h-[500px]">
                  
                  {/* Selected Active Image with Video check */}
                  {quickViewProduct.images?.[qvActiveImageIdx]?.match(/\.(mp4|webm|ogg|mov)$/i) || quickViewProduct.images?.[qvActiveImageIdx]?.includes('video') ? (
                    <video 
                      src={quickViewProduct.images[qvActiveImageIdx]} 
                      className="w-full h-full object-cover" 
                      autoPlay 
                      muted 
                      loop 
                      playsInline 
                    />
                  ) : (
                    <img 
                      src={quickViewProduct.images?.[qvActiveImageIdx] || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=600'} 
                      alt={quickViewProduct.nameAr}
                      className="w-full h-full object-cover animate-fade-in"
                      referrerPolicy="no-referrer"
                    />
                  )}

                  {/* Multiple Images list under main view slider */}
                  {quickViewProduct.images && quickViewProduct.images.length > 1 && (
                    <div className="absolute bottom-4 inset-x-0 mx-auto max-w-[90%] flex gap-2 justify-center z-10 overflow-x-auto no-scrollbar">
                      {quickViewProduct.images.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setQvActiveImageIdx(idx)}
                          className={`w-12 h-16 rounded-md overflow-hidden bg-white border-2 transition-all shrink-0 ${
                            qvActiveImageIdx === idx ? 'border-[#A44C5C] scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          {img.match(/\.(mp4|webm|ogg|mov)$/i) || img.includes('video') ? (
                            <span className="w-full h-full bg-[#0C0C0C] text-white flex items-center justify-center font-mono text-[8px]">VID</span>
                          ) : (
                            <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Brand Tag Ribbon overlay */}
                  <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white text-[8px] uppercase tracking-widest font-black px-2 py-0.5 rounded-sm">
                    SULTA LIVING COLLECTION
                  </div>
                </div>

                {/* Details Specifications Right half */}
                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between space-y-6">
                  
                  <div className="space-y-4">
                    <span className="text-[10px] text-[#A44C5C] tracking-[0.2em] font-black uppercase inline-block">
                      {quickViewProduct.collection || 'المجموعة الكلاسيكية'}
                    </span>
                    
                    <h2 className="font-serif text-xl md:text-2xl font-light text-[#0C0C0C] tracking-wide leading-tight">
                      {country === 'EG' && quickViewProduct.nameAr ? quickViewProduct.nameAr : quickViewProduct.nameEn}
                    </h2>

                    {/* Price tag */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-sans font-bold text-[#A44C5C]">
                        {(country === 'EG' ? quickViewProduct.priceEG : quickViewProduct.priceSA).toLocaleString()} {country === 'EG' ? 'EGP' : 'SAR'}
                      </span>
                      <span className="text-[9px] text-[#c5a059] border border-[#c5a059]/35 px-1.5 py-0.5 font-bold">
                        صندوق فاخر مجاني 🎁
                      </span>
                    </div>

                    {/* Simple description */}
                    <p className="text-gray-500 text-xs leading-relaxed select-text">
                      {country === 'EG' ? quickViewProduct.descriptionAr : quickViewProduct.descriptionEn}
                    </p>

                    {/* Colors Options */}
                    {quickViewProduct.colors && quickViewProduct.colors.length > 0 && (
                      <div className="space-y-1.5 text-right w-full">
                        <span className="text-[10px] text-gray-400 font-bold block">🎨 الألوان والأنسجة المتوفرة:</span>
                        <div className="flex items-center gap-1.5">
                          {quickViewProduct.colors.map(col => {
                            const isSelected = qvSelectedColor?.name === col.name;
                            return (
                              <button
                                key={col.name}
                                type="button"
                                onClick={() => setQvSelectedColor(col)}
                                className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                                  isSelected ? 'scale-110 ring-2 ring-[#c5a059] border-white' : 'border-gray-300'
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

                    {/* Sizes selection option with predicted checker */}
                    {quickViewProduct.sizes && quickViewProduct.sizes.length > 0 && (
                      <div className="space-y-1.5 text-right">
                        <span className="text-[10px] text-gray-400 font-bold block">📏 المقاس والملائمة:</span>
                        <div className="flex flex-wrap gap-2">
                          {quickViewProduct.sizes.map(sz => {
                            const isSelected = qvSelectedSize === sz;
                            return (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => setQvSelectedSize(sz)}
                                className={`min-w-10 px-3 py-1.5 rounded-lg border text-3xs font-semibold text-center transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-[#0C0C0C] text-white border-[#0C0C0C] font-black' 
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

                    {/* Tailoring Details */}
                    <div className="bg-pink-50/40 p-3 rounded-xl border border-pink-100/30 text-3xs text-gray-600 leading-relaxed font-sans mt-2 space-y-1">
                      <p>🧵 الخامة: <strong className="text-[#A44C5C]">{quickViewProduct.fabricAr || 'ساتان حريري إيطالي معالج للحرارة والحفظ'}</strong></p>
                      <p>✨ العناية: غسيل يدوي أو برنامج ناعم بارد تجنباً للكرمشة.</p>
                    </div>

                  </div>

                  {/* Add To Cart Button Block */}
                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        const finalColor = qvSelectedColor || quickViewProduct.colors?.[0] || { name: 'Default', hex: '#000050' };
                        const finalSize = qvSelectedSize || 'S';
                        onAddToCart(quickViewProduct, finalColor, finalSize);
                        setQuickViewProduct(null);
                      }}
                      className="w-full bg-[#0C0C0C] text-[#FAF5F0] py-3 rounded-xl text-xs font-semibold tracking-widest uppercase hover:bg-[#A44C5C] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <ShoppingBag size={14} /> إضافة سريعة والذهاب للسلة
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        onSelectProduct(quickViewProduct);
                        setQuickViewProduct(null);
                      }}
                      className="w-full bg-white text-gray-800 border border-gray-200 py-2.5 rounded-xl text-3xs hover:bg-gray-50 transition-colors uppercase font-bold cursor-pointer"
                    >
                      تفاصيل الموديل الكاملة (عرض الدار) ⚜️
                    </button>
                  </div>

                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. RECENTLY VIEWED ROW */}
      {recentlyViewed && recentlyViewed.length > 0 && (
        <section className="bg-white py-16 border-t border-gray-150 select-none">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8">
            <h3 className="font-serif text-lg tracking-wider text-center text-gray-900 mb-8 uppercase">تفقدتِها مؤخراً | RECENTLY CURATED</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recentlyViewed.slice(0, 6).map(item => (
                <div 
                  key={`rec-${item.id}`} 
                  className="group flex flex-col gap-1 cursor-pointer"
                  onClick={() => onSelectProduct(item)}
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-50 border border-gray-100">
                    <img 
                      src={item.images?.[0]} 
                      alt={item.nameAr} 
                      className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h4 className="font-sans text-[10px] font-bold text-gray-800 truncate text-right line-clamp-1">{item.nameAr}</h4>
                  <span className="font-sans text-3xs text-gray-500 text-right">
                    {(country === 'EG' ? item.priceEG : item.priceSA).toLocaleString()} {country === 'EG' ? 'EGP' : 'SAR'}
                  </span>
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
