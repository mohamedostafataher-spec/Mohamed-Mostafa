import React from 'react';

export default function RibbonBowDivider() {
  return (
    <div className="flex items-center justify-center my-8 gap-4 select-none">
      <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-gray-400 flex-1 max-w-[150px] sm:max-w-[250px]" />
      <div className="relative flex items-center justify-center">
        <svg width="44" height="22" viewBox="0 0 48 24" fill="none" className="text-black filter drop-shadow-xs">
          {/* Left Ribbon Loop */}
          <path 
            d="M24 12C18 3 13 3 11 9C9 15 17 21 24 12Z" 
            fill="#F8F9FA" 
            stroke="currentColor" 
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Right Ribbon Loop */}
          <path 
            d="M24 12C30 3 35 3 37 9C39 15 31 21 24 12Z" 
            fill="#F8F9FA" 
            stroke="currentColor" 
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Left Ribbon Tail */}
          <path d="M21 13.5C16 18 11 21.5 7 22.5C11.5 20.5 16.5 17 21 13.5Z" fill="currentColor" />
          {/* Right Ribbon Tail */}
          <path d="M27 13.5C32 18 37 21.5 41 22.5C36.5 20.5 31.5 17 27 13.5Z" fill="currentColor" />
          {/* Center Knot */}
          <rect x="21" y="9" width="6" height="6" rx="2" fill="#F8F9FA" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="24" cy="12" r="1.5" fill="#0B0B0B" />
        </svg>
      </div>
      <div className="h-[1px] bg-gradient-to-l from-transparent via-gray-300 to-gray-400 flex-1 max-w-[150px] sm:max-w-[250px]" />
    </div>
  );
}
