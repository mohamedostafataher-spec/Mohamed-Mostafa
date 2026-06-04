import React, { useState, useEffect } from 'react';
import { Search, Heart, ShoppingBag, Globe, Menu, X, User, Sparkles, Clock } from 'lucide-react';
import { Country, CartItem, Product, Settings } from '../types';
import { dbService, supabase } from '../services/db';

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
}: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState('');

  // 🕒 Countdown Timer Logic (Real-time active feel)
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 48, seconds: 15 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (settings?.promoEndTime) {
          try {
            const end = new Date(settings.promoEndTime).getTime();
            const now = new Date().getTime();
            const diff = end - now;
            
            if (diff > 0) {
              const h = Math.floor(diff / (1000 * 60 * 60));
              const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              const s = Math.floor((diff % (1000 * 60)) / 1000);
              return { hours: h, minutes: m, seconds: s };
            }
          } catch (e) {
             // Fallback to demo logic if date is invalid
          }
        }

        // Demo logic fallback
        if (prev.hours === 0 && prev.minutes === 0 && prev.seconds === 0) {
          return { hours: 2, minutes: 59, seconds: 59 };
        }
        
        let s = prev.seconds - 1;
        let m = prev.minutes;
        let h = prev.hours;

        if (s < 0) {
          s = 59;
          m -= 1;
        }
        if (m < 0) {
          m = 59;
          h -= 1;
        }

        return { hours: h, minutes: m, seconds: s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [settings?.promoEndTime]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localQuery);
    setTab('store');
    setSearchOpen(false);
  };

  const menuItems = [
    { id: 'home', label: 'الرئيسية' },
    { id: 'store', label: 'المتجر والكتالوج' },
    { id: 'account', label: session ? 'الملف الشخصي 👤' : 'تسجيل الدخول' },
    { id: 'dashboard', label: 'بوابة الإدارة ⚙️' },
    { id: 'about', label: 'قصتنا' },
    { id: 'contact', label: 'تواصل معنا' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FAFAF7]/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-luxury">
      <div className="bg-[#0B0B0B] text-[#F6E7A6] font-sans text-[10px] md:text-xs py-2.5 px-4 text-center tracking-wide flex justify-center items-center flex-wrap gap-4 transition-all border-b border-[#F6E7A6]/10">
        <div className="flex items-center gap-1.5 shrink-0">
          <Sparkles size={12} className="text-[#F4B6C2] animate-pulse" />
          <span>{settings?.promoBannerAr || 'شحن ملكي مجاني وسريع للمملكة ومصر ✦ جودة تليق بكِ'}</span>
        </div>
        
        <div className="flex items-center gap-2 bg-[#F6E7A6]/10 px-2 sm:px-3 py-0.5 rounded-full border border-[#F6E7A6]/20">
          <Clock size={11} className="text-[#F4B6C2]" />
          <span className="text-[8px] sm:text-[9px] uppercase tracking-widest font-bold hidden xs:inline">ينتهي العرض الملكي خلال:</span>
          <span className="font-mono text-[10px] sm:text-[11px] font-black text-white w-20 text-left">
            {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="grid grid-cols-3 items-center gap-1 sm:gap-4 w-full">
          
          {/* Right Section: Mobile Menu Switch & Country selection */}
          <div className="flex items-center gap-1 sm:gap-3 select-none justify-start">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-[#0B0B0B] hover:text-[#F4B6C2] transition-colors p-1"
              id="mobile-menu-toggle"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
 
            {/* Country Picker with Flag */}
            <div className="relative group">
              <button 
                className="flex items-center gap-1 text-[9px] sm:text-xs md:text-sm font-medium text-[#0B0B0B] hover:text-[#F4B6C2] border border-gray-150 rounded-full px-1.5 py-0.5 sm:px-3 sm:py-1.5 transition-colors bg-white shadow-xs"
                id="country-selector"
              >
                <Globe size={11} className="text-gray-400 shrink-0" />
                <span className="font-sans whitespace-nowrap">
                  {country === 'SA' ? '🇸🇦 SAR' : '🇪🇬 EGP'}
                </span>
                <span className="hidden lg:inline font-sans font-light">({country === 'SA' ? 'السعودية' : 'مصر'})</span>
              </button>
              <div className="absolute right-0 top-full mt-1 w-36 sm:w-44 bg-white border border-gray-100 rounded-lg shadow-lg hidden group-hover:block z-50 overflow-hidden">
                <button
                  onClick={() => setCountry('SA')}
                  className={`w-full text-right px-3 py-2 text-xs font-sans flex items-center justify-between hover:bg-pink-50 transition-colors ${country === 'SA' ? 'bg-pink-50 text-[#F4B6C2] font-semibold' : 'text-gray-700'}`}
                >
                  <span>المملكة العربية السعودية</span>
                  <span>SR 🇸🇦</span>
                </button>
                <button
                  onClick={() => setCountry('EG')}
                  className={`w-full text-right px-3 py-2 text-xs font-sans flex items-center justify-between hover:bg-pink-50 transition-colors ${country === 'EG' ? 'bg-pink-50 text-[#F4B6C2] font-semibold' : 'text-gray-700'}`}
                >
                  <span>جمهورية مصر العربية</span>
                  <span>LE 🇪🇬</span>
                </button>
              </div>
            </div>
          </div>
 
          {/* Center Section: BRAND SERIF LOGO */}
          <div className="flex flex-col items-center justify-center select-none cursor-pointer" onClick={() => setTab('home')}>
            <h1 className="font-serif text-lg sm:text-2xl md:text-3xl lg:text-4xl tracking-[0.1em] sm:tracking-[0.14em] uppercase font-light text-[#0B0B0B] hover:text-[#F4B6C2] transition-colors duration-500 text-center">
              {settings?.siteName || 'SULTA'}
            </h1>
            <span className="text-[6px] md:text-[9px] tracking-[0.15em] sm:tracking-[0.2em] uppercase font-serif text-gray-400 mt-0.5 text-center font-medium hidden sm:block">
              {settings?.logo ? 'Luxury Sleepwear Boutique' : 'Where Comfort Meets Elegance'}
            </span>
          </div>
 
          {/* Left Section: Nav Icons */}
          <div className="flex items-center justify-end gap-1 sm:gap-2.5 md:gap-4 select-none">
            
            {/* Search toggler */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="text-[#0B0B0B] hover:text-[#F4B6C2] transition-colors p-1.5 rounded-full hover:bg-gray-50 relative"
              id="search-toggle-btn"
              title="بحث"
            >
              <Search size={18} />
            </button>

            {/* Account Tab (Also hidden on mobile since it's in drawer menu) */}
            <button
              onClick={() => setTab('account')}
              className={`p-1.5 rounded-full hover:bg-gray-50 transition-colors relative hidden sm:block ${currentTab === 'account' ? 'text-[#F4B6C2]' : 'text-[#0B0B0B] hover:text-[#F4B6C2]'}`}
              id="account-btn"
              title={session ? "حسابي (مرحباً)" : "تسجيل الدخول"}
            >
              <User size={18} />
              {session && (
                <span className="absolute top-0.5 right-0.5 bg-[#25D366] w-2 h-2 rounded-full border border-white" />
              )}
            </button>

            {/* Wishlist */}
            <button
              onClick={onOpenFavorites}
              className="text-[#0B0B0B] hover:text-[#F4B6C2] transition-colors p-1.5 rounded-full hover:bg-gray-50 relative"
              id="favorites-btn"
              title="المفضلة"
            >
              <Heart size={18} />
              {favorites.length > 0 && (
                <span className="absolute top-0.5 left-0.5 bg-[#F4B6C2] text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-sans animate-bounce">
                  {favorites.length}
                </span>
              )}
            </button>

            {/* Cart Bag */}
            <button
              onClick={onOpenCart}
              className="text-[#0B0B0B] hover:text-[#F4B6C2] transition-colors p-1.5 rounded-full hover:bg-gray-50 relative"
              id="cart-btn"
              title="سلة المشتريات"
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span className="absolute top-0.5 left-0.5 bg-[#0B0B0B] text-[#F6E7A6] border border-[#F6E7A6] text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-sans">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Large Desktop Horizontal Nav Links */}
        <nav className="hidden lg:flex items-center justify-center gap-10 mt-6 pt-4 border-t border-gray-100">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`text-sm tracking-wider uppercase transition-colors relative py-1 ${
                currentTab === item.id
                  ? 'text-[#F4B6C2] font-semibold border-b-2 border-[#F4B6C2]'
                  : 'text-gray-600 hover:text-[#F4B6C2] font-medium'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Floating Animated Search Form */}
      {searchOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-gray-200 py-4 px-6 shadow-md transition-all duration-300 z-40 animate-fade-in">
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto flex gap-2">
            <input
              type="text"
              placeholder="ابحثي عن بيجامات ساتان، رداء لانج وير، فساتين نوم..."
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#F4B6C2]"
              autoFocus
            />
            <button
              type="submit"
              className="bg-[#0B0B0B] text-white hover:bg-[#F4B6C2] hover:text-white px-6 py-2.5 text-sm rounded-lg transition-colors font-sans"
            >
              بحث
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setLocalQuery('');
              }}
              className="border border-gray-200 text-gray-500 hover:bg-gray-100 p-2.5 rounded-lg text-sm transition-colors"
            >
              إلغاء
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
