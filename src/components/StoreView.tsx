import React, { useState, useMemo } from 'react';
import { Filter, Search, Heart, ShoppingBag, Eye, X, ChevronDown } from 'lucide-react';
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
}: StoreViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  const displayCategories = [
    { id: 'all', name: 'كل المجموعات' },
    ...categories.map(c => ({ id: c.id, name: (c.nameAr || c.name || '').toUpperCase() }))
  ];

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => p.status !== 'draft' && p.status !== 'archived');
    
    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory || p.categoryAr === selectedCategory);
    }
    
    // Search filter (Smart Search Engine)
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

        // Fabric match (Satin, Cotton, Velvet, Silk, Linen)
        const matchesFabric = 
          (q.includes('ساتان') || q.includes('satin') || q.includes('بلينغ') || q.includes('حرير') || q.includes('silk')) && 
          (p.nameAr?.includes('ساتان') || p.nameAr?.includes('حرير') || p.nameEn?.toLowerCase().includes('satin') || p.nameEn?.toLowerCase().includes('silk')) ||
          (q.includes('قطن') || q.includes('cotton')) && 
          (p.nameAr?.includes('قطن') || p.nameEn?.toLowerCase().includes('cotton')) ||
          (q.includes('مخمل') || q.includes('velvet') || q.includes('شتاء') || q.includes('winter')) && 
          (p.nameAr?.includes('مخمل') || p.nameEn?.toLowerCase().includes('velvet') || p.nameAr?.includes('روب') || p.nameEn?.toLowerCase().includes('robe'));

        // Color matches
        const matchesColor = p.colors?.some(c => 
          c.name?.toLowerCase().includes(q) || 
          (q.includes('وردي') && c.name?.includes('وردي')) ||
          ((q.includes('أبيض') || q.includes('عاجي') || q.includes('وايت')) && c.name?.includes('وايت')) ||
          (q.includes('أسود') && c.name?.includes('أسود'))
        );

        // Price range query handling e.g. "under 400" or "أقل من ٣٠٠"
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

    // Sort
    result = [...result].sort((a, b) => {
      const getPrice = (p: Product) => country === 'EG' ? p.priceEG : p.priceSA;
      if (sortBy === 'price-low') return getPrice(a) - getPrice(b);
      if (sortBy === 'price-high') return getPrice(b) - getPrice(a);
      if (sortBy === 'bestseller') return (b.rating || 0) - (a.rating || 0);
      return 0; // newest defaults
    });

    return result;
  }, [products, selectedCategory, searchQuery, sortBy, country]);

  return (
    <div className="bg-white min-h-screen">
      {/* Search & Header Banner */}
      <div className="bg-[#FAF5F0] py-16 md:py-24 border-b border-[#DF8A9D]/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl md:text-5xl font-light text-[#0B0B0B] mb-4 tracking-wide uppercase">
            الأساسيات الفاخرة
          </h2>
          <p className="font-sans text-sm md:text-base text-gray-500 max-w-xl mx-auto mb-10">
            مجموعة مختارة من أرقى ملابس النوم والملابس المنزلية الفاخرة. اكتشفي ما يجعل "سُلْطَة" أيقونة عالمية في عالم الأناقة المنزلية.
          </p>

          <div className="relative max-w-xl mx-auto" dir="rtl">
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="ابحثي باللون، القماش، أو المجموعة..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange && onSearchQueryChange(e.target.value)}
              className="w-full bg-white border border-[#DF8A9D]/30 focus:border-[#A44C5C] focus:ring-1 focus:ring-[#A44C5C] rounded-full pr-12 pl-12 py-3.5 text-sm text-[#0B0B0B] placeholder-gray-400 tracking-wide font-sans focus:outline-none transition-all shadow-sm text-right"
            />
            {searchQuery && (
              <button
                onClick={() => onClearSearch && onClearSearch()}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0B0B0B] transition-colors"
                title="مسح البحث"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 mb-8" dir="rtl">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="md:hidden flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#0B0B0B] hover:text-[#A44C5C] transition-colors"
            >
              <Filter size={16} />
              الفلاتر
            </button>
            <span className="text-xs font-sans text-gray-400 uppercase tracking-widest hidden md:block">
              {filteredProducts.length} نتيجة
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#0B0B0B]">
            <span className="hidden sm:block text-gray-400 font-sans">ترتيب حسب:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-transparent pl-6 focus:outline-none cursor-pointer hover:text-[#A44C5C] transition-colors pb-1 border-b border-transparent hover:border-[#A44C5C]"
              >
                <option value="newest">الأحدث</option>
                <option value="bestseller">الأكثر مبيعاً</option>
                <option value="price-low">السعر: من الأقل للأعلى</option>
                <option value="price-high">السعر: من الأعلى للأقل</option>
              </select>
              <ChevronDown size={14} className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          
          {/* Desktop Filter Sidebar */}
          <aside className={`w-full md:w-64 shrink-0 transition-all ${isFilterOpen ? 'block' : 'hidden md:block'}`} dir="rtl">
            <div className="sticky top-24 space-y-10">
              
              <div>
                <h4 className="font-serif text-sm font-semibold tracking-widest uppercase mb-4 text-[#0B0B0B] border-b border-gray-100 pb-2">التصنيفات</h4>
                <ul className="space-y-3 font-sans text-sm">
                  {displayCategories.map(cat => (
                    <li key={cat.id}>
                      <button
                        onClick={() => { setSelectedCategory(cat.id); setIsFilterOpen(false); }}
                        className={`text-right w-full hover:text-[#A44C5C] transition-colors uppercase tracking-wider text-xs ${selectedCategory === cat.id ? 'text-[#A44C5C] font-semibold' : 'text-gray-500'}`}
                      >
                        {cat.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </aside>

          {/* Product Grid */}
          <main className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-24 bg-[#FAF5F0] rounded-xl">
                <p className="font-serif text-lg text-gray-500 mb-4">No pieces match your selection.</p>
                <button 
                  onClick={() => { setSelectedCategory('all'); onClearSearch && onClearSearch(); setSortBy('newest'); }}
                  className="font-sans text-xs uppercase tracking-widest font-semibold text-[#A44C5C] hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
                {filteredProducts.map(product => {
                  const currentPrice = country === 'EG' ? product.priceEG : product.priceSA;
                  const currencyLabel = country === 'EG' ? 'EGP' : 'SAR';
                  const isFav = favorites.includes(product.id);
                  const isHovered = hoveredProduct === product.id;

                  return (
                    <div 
                      key={product.id} 
                      className="group flex flex-col cursor-pointer"
                      onMouseEnter={() => setHoveredProduct(product.id)}
                      onMouseLeave={() => setHoveredProduct(null)}
                      onClick={() => onSelectProduct(product)}
                    >
                      {/* Image Area */}
                      <div className="relative aspect-[3/4] bg-[#FAF5F0] mb-4 overflow-hidden rounded-sm">
                        
                        <img 
                          src={product.images[0]} 
                          alt={product.nameEn || product.nameAr} 
                          className={`w-full h-full object-cover transition-opacity duration-700 ${isHovered && product.images[1] ? 'opacity-0' : 'opacity-100'} mix-blend-multiply`}
                          referrerPolicy="no-referrer"
                        />
                        {product.images[1] && (
                          <img 
                            src={product.images[1]} 
                            alt={`${product.nameEn || product.nameAr} - View 2`} 
                            className={`w-full h-full object-cover absolute top-0 left-0 transition-opacity duration-700 ${isHovered ? 'opacity-100' : 'opacity-0'} mix-blend-multiply`}
                            referrerPolicy="no-referrer"
                          />
                        )}

                        {/* Top Right Wishlist Button */}
                        <div className="absolute top-4 right-4 z-10">
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                            className="p-2 sm:p-2.5 rounded-full bg-white/50 backdrop-blur-md hover:bg-white transition-all text-gray-500 hover:text-[#DF8A9D] shadow-sm transform hover:scale-110"
                          >
                            <Heart size={16} className={isFav ? "fill-[#DF8A9D] text-[#DF8A9D]" : ""} />
                          </button>
                        </div>
                        
                        {/* Badges */}
                        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                           {product.isBestSeller && (
                             <span className="bg-[#faf5f0]/90 backdrop-blur-md text-[#A44C5C] text-[9px] uppercase tracking-widest font-bold px-3 py-1.5 shadow-sm border border-[#A44C5C]/10 text-center">
                               Best Seller
                             </span>
                           )}
                        </div>

                        {/* Quick Add Overlay */}
                        <div className={`absolute bottom-0 left-0 w-full transform transition-all duration-500 ease-in-out ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                          <button 
                            onClick={(e) => {
                               e.stopPropagation();
                               onAddToCart(product, product.colors[0] || { name: 'Default', hex: '#000000' }, product.sizes[0] || 'S');
                            }}
                            className="w-full bg-[#0B0B0B]/90 backdrop-blur-sm text-[#FAF5F0] py-4 text-xs font-semibold tracking-widest uppercase hover:bg-[#A44C5C] transition-colors flex items-center justify-center gap-2"
                          >
                            <ShoppingBag size={14} /> أضيفي للحقيبة
                          </button>
                        </div>
                      </div>

                      {/* Info Area */}
                      <div className="text-center md:text-left space-y-1.5">
                        <div className="flex items-center justify-center md:justify-start gap-1">
                          <span className="text-[10px] text-gray-400 font-sans tracking-widest uppercase">{product.category || product.categoryAr}</span>
                        </div>
                        <h3 className="font-serif text-sm text-[#0B0B0B] truncate group-hover:text-[#A44C5C] transition-colors">
                          {product.nameEn || product.nameAr}
                        </h3>
                        <div className="flex items-center justify-center md:justify-start gap-2">
                          <span className="font-sans font-medium text-sm text-[#A44C5C]">
                            ${currentPrice.toLocaleString()} {currencyLabel === 'EGP' ? '' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>

        </div>
        
        {/* Related Products Engine */}
        {products.length > 0 && (
          <div className="mt-20 pt-16 border-t border-gray-200">
            <h3 className="font-serif text-2xl text-center mb-10 text-[#0B0B0B]">الموديلات الأكثر طلباً الآن ✨</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {products.slice(0, 4).map(prod => {
                const isFav = favorites.includes(prod.id);
                const currencyLabel = country === 'EG' ? 'EGP' : 'SAR';
                const currentPrice = country === 'EG' ? prod.priceEG : prod.priceSA;
                
                return (
                  <div key={`trending-${prod.id}`} className="group cursor-pointer" onClick={() => onSelectProduct(prod)}>
                    <div className="relative aspect-[3/4] overflow-hidden bg-[#FAF5F0] rounded-xl mb-4">
                      <img
                        src={prod.images[0]}
                        alt={prod.nameEn || prod.nameAr}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 mix-blend-multiply"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(prod.id);
                        }}
                        className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-sm hover:scale-110 transition-transform opacity-0 group-hover:opacity-100 z-10"
                      >
                        <Heart size={14} fill={isFav ? '#A44C5C' : 'none'} className={isFav ? 'text-[#A44C5C]' : 'text-gray-400'} />
                      </button>
                    </div>
                    <div className="text-center">
                      <h4 className="text-xs font-semibold text-[#0B0B0B] line-clamp-1 font-serif mb-1">
                        {prod.nameEn || prod.nameAr}
                      </h4>
                      <span className="font-sans font-medium text-xs text-[#A44C5C]">${currentPrice.toLocaleString()} {currencyLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
