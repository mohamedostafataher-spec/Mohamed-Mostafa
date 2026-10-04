import React, { useState, useEffect, useRef } from 'react';
import { Search, Heart, ShoppingBag, User, Menu, X, Sparkles, Truck, Phone, ChevronDown, Check } from 'lucide-react';
import { Country, CartItem, Product, Settings } from '../types';
import { cleanImgUrl } from '../services/db';
import SultaImage from './SultaImage';

interface HeaderProps {
  currentTab: string;
  setTab: (tab: string) => void;
  country: Country;
  setCountry: (country: Country) => void;
  cart: CartItem[];
  favorites: string[];
  onOpenCart: () => void;
  onOpenFavorites: () => void;
  onSearch: (query: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  settings?: Settings;
  session: any;
  products?: Product[];
}

export default function Header({
  currentTab,
  setTab,
  country,
  setCountry,
  cart,
  favorites,
  onOpenCart,
  onOpenFavorites,
  onSearch,
  mobileMenuOpen,
  setMobileMenuOpen,
  settings,
  session,
  products = [],
}: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ hours: number, mins: number, secs: number }>({ hours: 0, mins: 0, secs: 0 });
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Computed visual suggestions list matching query
  const suggestions = React.useMemo(() => {
    const trimmed = localQuery.trim().toLowerCase();
    if (!trimmed || trimmed.length < 1) return [];

    return products
      .filter((p) => {
        const arMatch = p.nameAr?.toLowerCase().includes(trimmed);
        const enMatch = p.nameEn?.toLowerCase().includes(trimmed);
        const catMatch = p.categoryAr?.toLowerCase().includes(trimmed) || p.category?.toLowerCase().includes(trimmed);
        return p.status === 'active' && (arMatch || enMatch || catMatch);
      })
      .slice(0, 5);
  }, [localQuery, products]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diff = tomorrow.getTime() - now.getTime();
      return {
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        mins: Math.floor((diff / 1000 / 60) % 60),
        secs: Math.floor((diff / 1000) % 60)
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => {
    const itemPrice = item.product?.priceSA || 0;
    return sum + (itemPrice * item.quantity);
  }, 0);
  const currencyLabel = 'ر.س';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      onSearch(localQuery);
      setTab('store');
      setIsSearchFocused(false);
      setSearchOpen(false);
    }
  };

  const navCategories = [
    { id: 'home', label: 'الرئيسية 🏠' },
    { id: 'store', label: 'المتجر 🛍️' },
    { id: 'best-sellers', label: 'الأكثر طلباً 🔥' },
    { id: 'offers', label: 'العروض 🏷️' }
  ];

  const activeWhatsApp = settings?.whatsappSaudi || '966596894393';
  const activeWhatsAppClean = activeWhatsApp.replace(/\D/g, '');
  const activeWhatsAppDisplay = '0596894393';

  return (
    <header className="sticky top-0 z-50 bg-white font-sans transition-all duration-200" dir="rtl">
      {/* 1. Top Announcement Header Bar (Clean Salla style) */}
      <div className="bg-[#F8F9FA] text-gray-700 text-[10px] sm:text-[11px] py-1.5 px-3 sm:px-4 border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Shipping & Promo Notification */}
          <div className="flex items-center gap-1.5 text-gray-700 font-medium truncate">
            <Truck size={13} className="text-black shrink-0" />
            <span className="hidden sm:inline">
              شحن سريع ومجاني لكافة مدن ومناطق المملكة العربية السعودية للطلبات فوق 800 ريال 🇸🇦 | كود الخصم: <strong className="font-mono text-black">SULTA20</strong>
            </span>
            <span className="sm:hidden font-semibold truncate text-[9px]">
              شحن مجاني فوق 800 ر.س لكافة مدن المملكة • كود: <strong className="text-black">SULTA20</strong>
            </span>
          </div>

          {/* Flash Promo Countdown (Desktop) */}
          <div className="hidden md:flex items-center gap-1.5 text-[10.5px] font-bold text-gray-600 shrink-0">
            <Sparkles size={12} className="text-black" />
            <span>ينتهي عرض الموسم خلال:</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-900 font-bold" dir="ltr">
              {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.mins).padStart(2, '0')}:{String(timeLeft.secs).padStart(2, '0')}
            </span>
          </div>

          {/* Right Controls: Instagram, TikTok & Country Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Desktop WhatsApp Link */}
            <a
              href={`https://wa.me/${activeWhatsAppClean}?text=${encodeURIComponent('مرحباً SULTA، أحتاج للمساعدة بخصوص الطلب بالمملكة 🌸')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 text-black hover:text-black font-bold bg-gray-100 hover:bg-gray-200 border border-gray-300 px-2.5 py-0.5 rounded-full transition-all text-[10.5px]"
              title="تواصل معنا عبر واتساب"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
              <span>واتساب:</span>
              <span className="font-mono text-[10px]" dir="ltr">{activeWhatsAppDisplay}</span>
            </a>

            {/* Instagram Icon Link */}
            <a
              href="https://www.instagram.com/sultabrand?stkn=MXZ5cjFhYW44cGI1aQ=="
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-white border border-gray-200 text-black hover:bg-gray-100 transition-all shadow-2xs"
              title="تابعونا على انستغرام"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>

            {/* TikTok Icon Link */}
            <a
              href="https://www.tiktok.com/@sulta.brand"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-white border border-gray-200 text-black hover:bg-gray-100 transition-all shadow-2xs"
              title="تابعونا على تيك توك"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </a>

            {/* Country and Currency Switcher */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-0.5 shadow-2xs text-[9.5px] sm:text-[10px] font-bold text-gray-900">
              <span>🇸🇦</span>
              <span>ر.س</span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Main Navigation Bar (Clean White Salla / Nalah Layout) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        <div className="flex items-center justify-between gap-3 sm:gap-6 w-full">
          
          {/* Mobile Menu & Search Toggle Buttons */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-800 hover:text-black p-2 rounded-xl bg-gray-50 border border-gray-200 transition-colors"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="text-gray-800 hover:text-black p-2 rounded-xl bg-gray-50 border border-gray-200 transition-colors"
              aria-label="البحث"
            >
              <Search size={19} />
            </button>
          </div>

          {/* SULTA Brand Logo (Centered on mobile, left/right on desktop) */}
          <div 
            className="flex items-center cursor-pointer select-none" 
            onClick={() => setTab('home')}
          >
            <div className="flex flex-col items-center sm:items-start group">
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-2xl font-black tracking-widest text-[#111827] group-hover:text-black transition-colors font-serif uppercase">
                  {settings?.siteName || 'SULTA'}
                </span>
                <span className="text-black text-xs sm:text-sm">👑</span>
              </div>
              <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] font-bold text-gray-500 font-sans -mt-0.5">
                سُـلـطَـة · أزياء النوم الفاخرة
              </span>
            </div>
          </div>

          {/* 3. Center Wide Search Bar (Signature Salla Feature) */}
          <div ref={searchContainerRef} className="hidden lg:flex flex-1 max-w-xl relative">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                type="text"
                placeholder="ابحثي عن بيجامات، أرواب عرايس، أطقم نوم فاخرة..."
                value={localQuery}
                onChange={(e) => {
                  setLocalQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full bg-[#F8F9FA] hover:bg-white focus:bg-white text-gray-900 border border-gray-250 focus:border-black rounded-full py-2.5 pr-11 pl-24 text-xs font-sans placeholder-gray-400 shadow-2xs focus:shadow-md transition-all outline-hidden text-right"
                dir="rtl"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Search size={18} />
              </div>
              <button
                type="submit"
                className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-[#111827] hover:bg-black text-white text-[11px] font-bold px-4 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs"
              >
                بحث
              </button>
            </form>

            {/* Instant Live Suggestions Dropdown (Salla Style) */}
            {isSearchFocused && suggestions.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden z-50 animate-scale-up text-right">
                <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-bold">
                  <span>منتجات مقترحة فورية</span>
                  <span className="text-black font-bold">{suggestions.length} نتائج</span>
                </div>
                <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                  {suggestions.map((p) => {
                    const priceVal = p.priceSA;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          onSearch(p.nameAr);
                          setLocalQuery(p.nameAr);
                          setTab('store');
                          setIsSearchFocused(false);
                        }}
                        className="p-3 hover:bg-[#F8F9FA] flex items-center justify-between gap-3 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-14 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                            <SultaImage 
                              src={cleanImgUrl(p.images?.[0], p.category)} 
                              alt={p.nameAr} 
                              className="w-full h-full"
                              imgClassName="object-cover"
                            />
                          </div>
                          <div className="text-right">
                            <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{p.nameAr}</h4>
                            <span className="text-[10px] text-gray-400 block mt-0.5">{p.categoryAr || p.category}</span>
                          </div>
                        </div>
                        <div className="text-left shrink-0">
                          <span className="font-bold text-xs text-[#A44C5C] font-mono" dir="ltr">
                            {priceVal} {currencyLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-2.5 bg-gray-50 text-center border-t border-gray-100">
                  <button
                    onClick={() => {
                      onSearch(localQuery);
                      setTab('store');
                      setIsSearchFocused(false);
                    }}
                    className="text-xs font-bold text-[#A44C5C] hover:underline"
                  >
                    عرض كافة النتائج في المتجر ←
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Action Cluster: Account, Favorites, Cart */}
          <div className="flex items-center gap-1.5 sm:gap-3 select-none shrink-0">
            
            {/* User Account */}
            <button
              onClick={() => setTab('account')}
              className={`hidden md:flex p-2.5 rounded-xl border transition-all items-center gap-1.5 cursor-pointer ${
                currentTab === 'account' 
                  ? 'bg-gray-100 border-gray-300 text-black' 
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
              }`}
              title="حسابي والطلبات"
            >
              <User size={18} />
              <span className="hidden xl:inline text-xs font-bold">حسابي</span>
            </button>

            {/* Wishlist Button (Desktop & Tablet) */}
            <button
              onClick={onOpenFavorites}
              className="hidden sm:flex p-2 sm:p-2.5 rounded-xl bg-white border border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-700 transition-all relative cursor-pointer"
              title="المفضلة"
            >
              <Heart size={17} className={favorites.length > 0 ? "fill-red-500 text-red-500" : ""} />
              {favorites.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full shadow-sm animate-scale-up">
                  {favorites.length}
                </span>
              )}
            </button>

            {/* Cart Button (Salla Style with Item Count & Live Total) */}
            <button
              onClick={onOpenCart}
              className="flex items-center gap-1.5 sm:gap-2 bg-[#111827] hover:bg-black active:scale-98 text-white px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-xl transition-all shadow-sm cursor-pointer group"
              title="سلة المشتريات"
            >
              <div className="relative">
                <ShoppingBag size={17} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-[9px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-right leading-none">
                <span className="text-[11px] font-bold">السلة</span>
                <span className="text-[10px] text-gray-300 font-mono mt-0.5" dir="ltr">
                  {cartTotal > 0 ? `${cartTotal} ${currencyLabel}` : 'فارغة'}
                </span>
              </div>
            </button>

          </div>

        </div>
      </div>

      {/* 4. Category Ribbon Navigation Bar (Salla style) */}
      <nav className="bg-white border-y border-gray-150 overflow-x-auto scrollbar-none shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-start gap-1 py-1 text-xs whitespace-nowrap">
          {navCategories.map((item) => {
            const isActive = currentTab === item.id || (currentTab === '' && item.id === 'home');
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#111827] text-white shadow-2xs'
                    : 'text-gray-700 hover:text-black hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Search Overlay Bar */}
      {searchOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 p-3 shadow-md animate-slide-down">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="ابحثي عن الموديل أو اللون أو المقاس..."
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-250 rounded-xl px-3.5 py-2 text-xs text-right outline-hidden"
              dir="rtl"
              autoFocus
            />
            <button
              type="submit"
              className="bg-[#111827] text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              بحث
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="p-2 text-gray-500 hover:text-black"
            >
              <X size={18} />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
