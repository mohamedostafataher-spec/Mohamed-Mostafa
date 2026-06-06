import React, { useState, useEffect } from 'react';
import { Search, Heart, ShoppingBag, User, Menu, X, Sparkles, RefreshCcw, ShieldCheck, Truck } from 'lucide-react';
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

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localQuery);
    setTab('store');
    setSearchOpen(false);
  };

  const menuItems = [
    { id: 'home', label: 'الرئيسية' },
    { id: 'store', label: 'المتجر' },
    { id: 'luxury-salon', label: 'صالون التجربة ✦' },
    { id: 'collections', label: 'التشكيلات' },
    { id: 'blog', label: 'المجلة' },
    { id: 'about', label: 'من نحن' },
    { id: 'track-order', label: 'تتبع الطلب' },
    { id: 'contact', label: 'اتصل بنا' },
    { id: 'dashboard', label: 'الإدارة' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FAF5F0]/95 backdrop-blur-md shadow-sm transition-luxury">
      {/* Top Thin Announcement Bar */}
      <div className="bg-[#FAF5F0] text-[#A44C5C] font-sans text-[10px] md:text-xs py-2.5 px-4 flex justify-between items-center transition-all border-b border-[#A44C5C]/10 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-[10px] sm:text-xs">
          <Truck size={14} className="text-[#A44C5C]" />
          <span className="tracking-wide">SHIPPING WORLDWIDE | شحن سريع للدول العربية</span>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-[10px] tracking-[0.25em] font-serif font-semibold">
          <Sparkles size={11} className="text-[#DF8A9D] animate-pulse" />
          <span>SULTA SLEEPWEAR COUTURE</span>
        </div>
        <div className="flex items-center gap-2 md:gap-3 text-[10.5px]">
          <span className="text-gray-400 font-sans hidden sm:inline">الشحن إلى:</span>
          <button 
            onClick={() => setCountry('SA')} 
            className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${country === 'SA' ? 'bg-[#A44C5C] text-[#FAF5F0] font-semibold' : 'opacity-60 hover:opacity-100 font-normal text-gray-700'}`}
          >
            <span>🇸🇦 SAR</span>
          </button>
          <button 
            onClick={() => setCountry('EG')} 
            className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${country === 'EG' ? 'bg-[#A44C5C] text-[#FAF5F0] font-semibold' : 'opacity-60 hover:opacity-100 font-normal text-gray-700'}`}
          >
            <span>🇪🇬 EGP</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative">
        <div className="flex items-center justify-between w-full">
          
          {/* Mobile Menu & Search - Left */}
          <div className="flex items-center gap-4 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[#0B0B0B] hover:text-[#DF8A9D] transition-colors p-1"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="text-[#0B0B0B] hover:text-[#DF8A9D] transition-colors p-1"
            >
              <Search size={22} />
            </button>
          </div>
 
          {/* BRAND LOGO */}
          <div className="flex items-center justify-center flex-1 lg:flex-none select-none cursor-pointer" onClick={() => setTab('home')}>
            {/* The SULTA text logo imitating the brand marks from mockup */}
            <div className="text-center group">
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold tracking-wide text-[#A44C5C] group-hover:text-[#DF8A9D] transition-colors duration-500 flex items-center justify-center gap-1">
                {/* sLt emblem */}
                <span className="font-serif italic font-bold">st</span>
                <span className="ml-2 uppercase tracking-[0.15em] font-normal">{settings?.siteName || 'SULTA'}</span>
              </h1>
              <span className="text-[7px] md:text-[9px] tracking-[0.3em] uppercase font-sans text-gray-500 mt-1 block">
                SULTA BRAND
              </span>
            </div>
          </div>
 
          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center justify-center gap-8 flex-1 pl-4">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`text-xs tracking-widest uppercase transition-colors relative py-1 hover:text-[#A44C5C] ${
                  currentTab === item.id || (currentTab === '' && item.id === 'home')
                    ? 'text-[#A44C5C] font-semibold border-b border-[#A44C5C]'
                    : 'text-[#0B0B0B]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Section: Nav Icons */}
          <div className="flex items-center justify-end gap-5 sm:gap-6 select-none shrink-0 text-[#0B0B0B]">
            
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="hover:text-[#DF8A9D] transition-colors hidden lg:block"
            >
              <Search size={22} strokeWidth={1.5} />
            </button>

            <button
              onClick={onOpenFavorites}
              className="hover:text-[#DF8A9D] transition-colors relative"
            >
              <Heart size={22} strokeWidth={1.5} />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-[#DF8A9D] text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-sans">
                  {favorites.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setTab('account')}
              className={`hover:text-[#DF8A9D] transition-colors hidden sm:block ${currentTab === 'account' ? 'text-[#DF8A9D]' : ''}`}
            >
              <User size={22} strokeWidth={1.5} />
              {session && (
                <span className="absolute top-0 right-0 bg-green-500 w-2 h-2 rounded-full border border-white" />
              )}
            </button>

            <button
              onClick={onOpenCart}
              className="hover:text-[#DF8A9D] transition-colors relative"
            >
              <ShoppingBag size={22} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-[#A44C5C] text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-sans">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="absolute top-full left-0 w-full bg-[#FAF5F0] border-b border-[#A44C5C]/10 py-6 px-6 shadow-md transition-all duration-300 z-40 animate-slide-up">
          <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex gap-3">
            <input
              type="text"
              placeholder="ابحثي عن ملابس النوم الفاخرة، أطقم الساتان، ملابس مريحة..."
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              className="flex-1 border-b-2 border-gray-300 bg-transparent px-2 py-2 text-lg font-serif focus:outline-none focus:border-[#A44C5C] text-[#0B0B0B] placeholder-gray-400 text-right"
              dir="rtl"
              autoFocus
            />
            <button
              type="submit"
              className="bg-[#A44C5C] text-[#FAF5F0] hover:bg-[#DF8A9D] px-8 py-2.5 text-sm uppercase tracking-wider transition-colors font-sans"
            >
              بحث
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setLocalQuery('');
              }}
              className="text-gray-500 hover:text-gray-800 px-4 text-sm uppercase tracking-wider transition-colors"
            >
              إغلاق
            </button>
          </form>
        </div>
      )}
    </header>
  );
}

