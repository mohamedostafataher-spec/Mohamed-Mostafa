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
    { id: 'all', name: 'ALL COLLECTIONS' },
    ...categories.map(c => ({ id: c.id, name: (c.name || '').toUpperCase() }))
  ];

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => p.status !== 'draft' && p.status !== 'archived');
    
    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory || p.categoryAr === selectedCategory);
    }
    
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        (p.nameEn && p.nameEn.toLowerCase().includes(q)) || 
        (p.nameAr && p.nameAr.toLowerCase().includes(q)) ||
        (p.descriptionEn && p.descriptionEn.toLowerCase().includes(q))
      );
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
            The Essentials
          </h2>
          <p className="font-sans text-sm md:text-base text-gray-500 max-w-xl mx-auto mb-10">
            Curated collection of the finest luxury sleepwear and loungewear. Discover what makes Sulta an international icon.
          </p>

          <div className="relative max-w-xl mx-auto">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search by color, fabric, or collection..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange && onSearchQueryChange(e.target.value)}
              className="w-full bg-white border border-[#DF8A9D]/30 focus:border-[#A44C5C] focus:ring-1 focus:ring-[#A44C5C] rounded-full pl-12 pr-12 py-3.5 text-sm text-[#0B0B0B] placeholder-gray-400 tracking-wide font-sans focus:outline-none transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => onClearSearch && onClearSearch()}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0B0B0B] transition-colors"
                title="Clear Search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="md:hidden flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#0B0B0B] hover:text-[#A44C5C] transition-colors"
            >
              <Filter size={16} />
              Filters
            </button>
            <span className="text-xs font-sans text-gray-400 uppercase tracking-widest hidden md:block">
              {filteredProducts.length} Results
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#0B0B0B]">
            <span className="hidden sm:block text-gray-400 font-sans">Sort By:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-transparent pr-6 focus:outline-none cursor-pointer hover:text-[#A44C5C] transition-colors pb-1 border-b border-transparent hover:border-[#A44C5C]"
              >
                <option value="newest">Newest</option>
                <option value="bestseller">Best Sellers</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          
          {/* Desktop Filter Sidebar */}
          <aside className={`w-full md:w-64 shrink-0 transition-all ${isFilterOpen ? 'block' : 'hidden md:block'}`}>
            <div className="sticky top-24 space-y-10">
              
              <div>
                <h4 className="font-serif text-sm font-semibold tracking-widest uppercase mb-4 text-[#0B0B0B] border-b border-gray-100 pb-2">Collections</h4>
                <ul className="space-y-3 font-sans text-sm">
                  {displayCategories.map(cat => (
                    <li key={cat.id}>
                      <button
                        onClick={() => { setSelectedCategory(cat.id); setIsFilterOpen(false); }}
                        className={`text-left w-full hover:text-[#A44C5C] transition-colors uppercase tracking-wider text-xs ${selectedCategory === cat.id ? 'text-[#A44C5C] font-semibold' : 'text-gray-500'}`}
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
                            <ShoppingBag size={14} /> Add To Bag
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
      </div>
    </div>
  );
}
