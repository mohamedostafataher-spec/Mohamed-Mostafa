import React from 'react';

export default function RibbonBowDivider() {
  return (
    <div className="flex items-center justify-center my-8 gap-4 select-none">
      <div className="h-[1.5px] bg-gradient-to-r from-transparent via-[#DF8A9D]/40 to-[#DF8A9D]/60 flex-1 max-w-[150px] sm:max-w-[250px]" />
      <div className="relative flex items-center justify-center">
        {/* Sparkles / Twinkle icons or star background */}
        <span className="absolute -top-3 -left-4 text-xs text-[#DBC082] animate-pulse">✦</span>
        <svg width="54" height="28" viewBox="0 0 48 24" fill="none" className="text-[#A44C5C] filter drop-shadow-xs">
          {/* Left Ribbon Loop */}
          <path 
            d="M24 12C18 3 13 3 11 9C9 15 17 21 24 12Z" 
            fill="#FAF4F5" 
            stroke="currentColor" 
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Inner shade for Left Loop */}
          <path d="M14 11C15 13 19 16 23 13" stroke="#DF8A9D" strokeWidth="1" strokeLinecap="round" />
          
          {/* Right Ribbon Loop */}
          <path 
            d="M24 12C30 3 35 3 37 9C39 15 31 21 24 12Z" 
            fill="#FAF4F5" 
            stroke="currentColor" 
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Inner shade for Right Loop */}
          <path d="M34 11C33 13 29 16 25 13" stroke="#DF8A9D" strokeWidth="1" strokeLinecap="round" />

          {/* Left Ribbon Tail */}
          <path d="M21 13.5C16 18 11 21.5 7 22.5C11.5 20.5 16.5 17 21 13.5Z" fill="currentColor" />
          {/* Right Ribbon Tail */}
          <path d="M27 13.5C32 18 37 21.5 41 22.5C36.5 20.5 31.5 17 27 13.5Z" fill="currentColor" />
          
          {/* Center Knot */}
          <rect x="21" y="9" width="6" height="6" rx="2" fill="#FAF4F5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="24" cy="12" r="1.5" fill="#A44C5C" />
        </svg>
        <span className="absolute -bottom-3 -right-4 text-xs text-[#DBC082] animate-pulse">✦</span>
      </div>
      <div className="h-[1.5px] bg-gradient-to-l from-transparent via-[#DF8A9D]/40 to-[#DF8A9D]/60 flex-1 max-w-[150px] sm:max-w-[250px]" />
    </div>
  );
}
