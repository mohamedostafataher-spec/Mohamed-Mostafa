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
      id: 'offers',
      label: 'العروض',
      icon: Tag,
      action: () => setTab('offers'),
      badge: 0,
      highlight: true,
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
      <div className="max-w-md mx-auto grid grid-cols-5 h-14 items-center px-1">
        {tabs.map((tab) => {
          const isActive = tab.id === currentTab;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={tab.action}
              className={`flex flex-col items-center justify-center h-full py-1 transition-all relative cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-[#111827] font-bold'
                  : tab.highlight
                    ? 'text-[#A44C5C] font-semibold'
                    : 'text-gray-500 hover:text-gray-900 font-medium'
              }`}
            >
              <div className="relative">
                <Icon 
                  size={20} 
                  className={
                    isActive 
                      ? 'stroke-[2.5] text-[#111827]' 
                      : tab.highlight 
                        ? 'text-[#A44C5C]' 
                        : ''
                  } 
                />
                
                {/* Active Indicator Dot */}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#A44C5C]" />
                )}

                {/* Badge for Favorites or Cart */}
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -left-2 bg-[#E11D48] text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-xs border-2 border-white">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] mt-0.5 leading-none ${
                isActive 
                  ? 'font-bold text-[#111827]' 
                  : tab.highlight 
                    ? 'font-bold text-[#A44C5C]' 
                    : 'text-gray-500'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
