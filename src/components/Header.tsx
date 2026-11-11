import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Search, Heart, ShoppingBag, User, Menu, X, Sparkles, Truck, Phone, ChevronDown, Check } from 'lucide-react';
import { Country, CartItem, Product, Settings } from '../types';
import { cleanImgUrl, dbService } from '../services/db';
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
  isAdmin?: boolean;
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
  isAdmin = false,
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
  const prevCartCountRef = useRef(cartCount);
  const [isCartAnimating, setIsCartAnimating] = useState(false);

  useEffect(() => {
    if (cartCount > prevCartCountRef.current) {
      setIsCartAnimating(true);
      const t = setTimeout(() => setIsCartAnimating(false), 800);
      return () => clearTimeout(t);
    }
    prevCartCountRef.current = cartCount;
  }, [cartCount]);
  const cartTotal = cart.reduce((sum, item) => {
    const itemPrice = dbService.getProductActualPrice(item.product, country, settings).unitPrice;
    return sum + (itemPrice * item.quantity);
  }, 0);
  const currencyLabel = country === 'EG' ? 'ج.م' : 'ر.س';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      onSearch(localQuery);
      setTab('store');
      setIsSearchFocused(false);
      setSearchOpen(false);
    }
  };

  const [promoIndex, setPromoIndex] = useState(0);

  useEffect(() => {
    const promoTimer = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % 3);
    }, 3800);
    return () => clearInterval(promoTimer);
  }, []);

  const promoItems = [
    {
      icon: <Truck size={13} className="text-amber-400 shrink-0" />,
      text: `شحن مجاني للطلبات فوق ${country === 'SA' ? '299' : '1000'} ${country === 'SA' ? 'ر.س' : 'ج.م'} 🇸🇦`
    },
    {
      icon: <Sparkles size={13} className="text-amber-400 shrink-0" />,
      text: 'بيجامات قطن كوريشة فاخرة بكميات محدودة ✨'
    },
    {
      icon: <Check size={13} className="text-amber-400 shrink-0" />,
      text: 'استبدال سهل ومرن لضمان رضاكِ التام ✅'
    }
  ];

  const navCategories = [
    { id: 'home', label: 'الرئيسية 🏠' },
    { id: 'store', label: 'المتجر 🛍️' },
    { id: 'best-sellers', label: 'الأكثر طلباً 🔥' },
    { id: 'offers', label: 'العروض 🏷️' }
  ].filter(cat => !(cat as any).adminOnly || isAdmin);

  const activeWhatsApp = settings?.whatsappSaudi || '966552823677';
  const activeWhatsAppClean = activeWhatsApp.replace(/\D/g, '');
  const activeWhatsAppDisplay = '0552823677';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 font-sans transition-all duration-200" dir="rtl">
      {/* 1. Global Announcement / Promo Bar (High Contrast & High Readability) */}
      <div className="bg-[#0B0B0B] text-white py-2.5 px-3 border-b border-white/10 select-none shadow-sm" dir="rtl">
        <div className="max-w-[1440px] mx-auto">
          {/* Mobile View: Single rotating announcement (Optimized contrast and size) */}
          <div className="flex sm:hidden items-center justify-center min-h-[22px] overflow-hidden">
            <div 
              key={promoIndex}
              className="flex items-center justify-center gap-2 text-xs font-extrabold text-center animate-fade-in px-1"
            >
              <span className="text-amber-400 drop-shadow-sm">{promoItems[promoIndex].icon}</span>
              <span className="tracking-tight leading-none">{promoItems[promoIndex].text}</span>
            </div>
          </div>

          {/* Desktop View: Full 3-message banner */}
          <div className="hidden sm:flex items-center justify-center gap-8 text-[13px] font-bold tracking-tight">
            {promoItems.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-gray-500 opacity-50" aria-hidden="true">•</span>}
                <span className="flex items-center gap-2 hover:text-amber-300 transition-colors group">
                  <span className="text-amber-400 group-hover:scale-110 transition-transform">{item.icon}</span>
                  <span>{item.text}</span>
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between h-14 sm:h-20 gap-4">
          
          {/* Menu & Search Toggle (Mobile) */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-800 p-2 rounded-xl bg-gray-50 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-[#A44C5C] outline-hidden"
              aria-label={mobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة الرئيسية"}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <button
              onClick={() => onSearch('')}
              className="text-gray-800 p-2 rounded-xl bg-gray-50 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-[#A44C5C] outline-hidden"
              aria-label="البحث عن المنتجات"
            >
              <Search size={19} />
            </button>
          </div>

          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-[#A44C5C] rounded-lg outline-hidden" 
            onClick={() => setTab('home')}
            role="button"
            aria-label="الذهاب للرئيسية"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setTab('home')}
          >
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-widest text-[#111827] font-serif uppercase">
                  Sulta
                </span>
                <span className="text-[#A44C5C] text-sm sm:text-base" aria-hidden="true">👑</span>
              </div>
              <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] font-bold text-gray-500 font-sans -mt-0.5 hidden sm:block">
                سولته · أزياء النوم الفاخرة
              </span>
            </div>

          {/* Search Bar (Desktop) Trigger */}
          <div className="hidden lg:flex flex-1 max-w-lg relative mx-8">
            <button
              onClick={() => onSearch('')}
              className="w-full flex items-center gap-3 bg-[#F8F9FA] hover:bg-gray-50 text-gray-400 border border-gray-100 hover:border-gray-200 rounded-full py-2.5 px-6 text-xs transition-all cursor-text text-right focus-visible:ring-2 focus-visible:ring-[#A44C5C] outline-hidden"
              aria-label="البحث في المتجر"
            >
              <Search size={16} aria-hidden="true" />
              <span className="font-bold">ابحثي عن بيجامتكِ المفضلة...</span>
            </button>
          </div>

          {/* Action Cluster */}
          <div className="flex items-center gap-2 sm:gap-3 select-none shrink-0">
            <button
              onClick={onOpenCart}
              className={`flex items-center gap-2 bg-[#A44C5C] text-white px-3 sm:px-5 py-2.5 rounded-full hover:bg-[#8F3F4E] transition-all shadow-sm active:scale-95 cursor-pointer relative focus-visible:ring-2 focus-visible:ring-[#A44C5C] outline-hidden ${isCartAnimating ? 'animate-bounce' : ''}`}
              aria-label={`حقيبة التسوق، تحتوي على ${cartCount} قطع`}
            >
              <ShoppingBag size={18} aria-hidden="true" />
              <span className="hidden sm:inline text-xs font-bold">الحقيبة</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#8F3F4E] text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Luxury Navigation Menu */}
        <nav className="hidden lg:flex items-center justify-center gap-8 pt-2 pb-1 border-t border-gray-100 text-xs font-medium text-gray-700" aria-label="التنقل الرئيسي">
          {[
            { id: 'home', label: 'الرئيسية' },
            { id: 'store', label: 'المتجر والكتالوج' },
            { id: 'best-sellers', label: 'الأكثر طلباً' },
            { id: 'new-arrivals', label: 'وصل حديثاً' },
            { id: 'offers', label: 'العروض' },
            { id: 'about', label: 'عن سولته' },
            { id: 'faq', label: 'الأسئلة الشائعة' },
            { id: 'returns', label: 'الاستبدال والاسترجاع' }
          ].map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`py-1.5 transition-all relative cursor-pointer hover:text-[#A44C5C] ${
                  isActive ? 'text-[#A44C5C] font-bold' : 'text-gray-600'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#A44C5C] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
