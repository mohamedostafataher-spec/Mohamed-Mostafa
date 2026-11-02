import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ShoppingBag, ArrowLeft, ArrowRight, TrendingUp, Clock, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Country } from '../types';
import SultaImage from './SultaImage';
import { ProductPrice } from './ProductPrice';
import { getProductSlug } from '../utils/slugify';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  country: Country;
  onSelectProduct: (product: Product) => void;
}

export default function SearchOverlay({
  isOpen,
  onClose,
  products,
  country,
  onSelectProduct
}: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      const savedHistory = localStorage.getItem('sulta_search_history_list');
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch (e) {
          setHistory([]);
        }
      }
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const newHistory = [query.trim(), ...history.filter(h => h !== query.trim())].slice(0, 5);
      setHistory(newHistory);
      localStorage.setItem('sulta_search_history_list', JSON.stringify(newHistory));
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('sulta_search_history_list');
  };

  const suggestions = React.useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed || trimmed.length < 1) return [];

    return products
      .filter((p) => {
        const arMatch = p.nameAr?.toLowerCase().includes(trimmed);
        const enMatch = p.nameEn?.toLowerCase().includes(trimmed);
        const catMatch = p.categoryAr?.toLowerCase().includes(trimmed) || p.category?.toLowerCase().includes(trimmed);
        const fabricMatch = p.fabricAr?.toLowerCase().includes(trimmed) || p.fabricEn?.toLowerCase().includes(trimmed);
        return p.status === 'active' && (arMatch || enMatch || catMatch || fabricMatch);
      })
      .slice(0, 6);
  }, [query, products]);

  const trendingSearches = ['بيجاما قطن', 'كوريشة', 'وصل حديثاً', 'عرض خاص', 'طقم نوم'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden" dir="rtl">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-white/95 backdrop-blur-md"
      />

      <div className="relative h-full flex flex-col">
        {/* Header Search Bar */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-2 -mr-2 text-gray-500 hover:text-black transition-colors"
              aria-label="إغلاق البحث"
            >
              <ArrowRight size={24} />
            </button>
            
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحثي عن بيجامتك المفضلة..."
                className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 pr-11 text-sm font-bold focus:ring-2 focus:ring-[#A44C5C]/20 outline-hidden transition-all"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              {query && (
                <button 
                  onClick={() => setQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-1 bg-gray-200 rounded-full text-gray-500"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="max-w-3xl mx-auto space-y-8">
            
            {/* Empty State / Suggestions */}
            {!query ? (
              <>
                {/* Recent History */}
                {history.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-gray-400 flex items-center gap-2">
                        <Clock size={14} />
                        آخر عمليات البحث
                      </h3>
                      <button onClick={clearHistory} className="text-[10px] font-bold text-[#A44C5C]">مسح الكل</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {history.map((h, i) => (
                        <button 
                          key={i}
                          onClick={() => setQuery(h)}
                          className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-gray-400 flex items-center gap-2">
                    <TrendingUp size={14} />
                    عمليات بحث شائعة
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {trendingSearches.map((t, i) => (
                      <button 
                        key={i}
                        onClick={() => setQuery(t)}
                        className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border border-gray-100"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Results Grid */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-gray-400">النتائج ({suggestions.length})</h3>
                </div>

                {suggestions.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {suggestions.map((product) => (
                      <div 
                        key={product.id}
                        onClick={() => {
                          onSelectProduct(product);
                          onClose();
                        }}
                        className="flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-2xl hover:border-[#A44C5C]/30 hover:shadow-sm transition-all cursor-pointer group"
                      >
                        <div className="w-20 h-24 shrink-0 rounded-xl overflow-hidden bg-gray-50 relative">
                          <SultaImage 
                            src={product.images[0]} 
                            alt={product.nameAr}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold">{product.categoryAr}</span>
                            {product.isBestSeller && (
                              <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold">الأكثر مبيعاً</span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-[#A44C5C] transition-colors">{product.nameAr}</h4>
                          <div className="flex items-center justify-between">
                            <ProductPrice product={product} country={country} size="sm" />
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#A44C5C] group-hover:text-white transition-all">
                              <ArrowLeft size={16} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                      <Search size={32} className="text-gray-200" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-gray-900">لم نجد نتائج لـ "{query}"</p>
                      <p className="text-xs text-gray-500">جربي البحث بكلمات أخرى أو تصفحي التصنيفات</p>
                    </div>
                    <button 
                      onClick={() => setQuery('')}
                      className="text-xs font-bold text-[#A44C5C] underline underline-offset-4"
                    >
                      عرض جميع المنتجات
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="pt-8 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => { setQuery('وصل حديثاً'); }}
                  className="flex items-center justify-center gap-2 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all group"
                >
                  <Tag size={18} className="text-[#A44C5C]" />
                  <span className="text-xs font-bold text-gray-900">وصل حديثاً</span>
                </button>
                <button 
                  onClick={() => { setQuery('عروض'); }}
                  className="flex items-center justify-center gap-2 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all group"
                >
                  <ShoppingBag size={18} className="text-[#A44C5C]" />
                  <span className="text-xs font-bold text-gray-900">العروض القوية</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
