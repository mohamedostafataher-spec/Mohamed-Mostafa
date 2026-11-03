import React from 'react';
import { Home, Tag, ShoppingBag, Heart, User } from 'lucide-react';
import { CartItem } from '../types';

interface MobileBottomNavProps {
  currentTab: string;
  setTab: (tab: string) => void;
  cart: CartItem[];
  favorites: string[];
  onOpenCart: () => void;
  onOpenFavorites: () => void;
}

export default function MobileBottomNav({
  currentTab,
  setTab,
  cart,
  favorites,
  onOpenCart,
  onOpenFavorites,
}: MobileBottomNavProps) {
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const tabs = [
    {
      id: 'home',
      label: 'الرئيسية',
      icon: Home,
      action: () => setTab('home'),
      badge: 0,
    },
    {
      id: 'store',
      label: 'المتجر',
      icon: ShoppingBag,
      action: () => setTab('store'),
      badge: 0,
    },
    {
      id: 'cart',
      label: 'السلة',
      icon: ShoppingBag,
      action: onOpenCart,
      badge: cartCount,
      isCart: true,
    },
    {
      id: 'account',
      label: 'حسابي',
      icon: User,
      action: () => setTab('account'),
      badge: 0,
    },
  ];

  return (
    <nav 
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] lg:hidden select-none"
      dir="rtl"
      aria-label="شريط التنقل السفلي"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 h-16 items-center px-2">
        {tabs.map((tab) => {
          const isActive = tab.id === currentTab || (tab.id === 'cart' && currentTab === 'cart');
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={tab.action}
              aria-label={tab.label}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-all relative cursor-pointer active:scale-95 ${
                isActive ? 'text-[#A44C5C]' : 'text-gray-500'
              }`}
            >
              <div className="relative mb-1">
                <Icon size={22} className={isActive ? 'stroke-[2.5]' : 'stroke-[2]'} />
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -left-2 bg-[#A44C5C] text-white text-[9px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full border-2 border-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold ${isActive ? 'opacity-100 font-black' : 'opacity-80'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
