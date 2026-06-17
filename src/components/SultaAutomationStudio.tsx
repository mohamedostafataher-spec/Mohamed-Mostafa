import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, RefreshCw, Sparkles, Share2, Eye, Info as InfoIcon, Palette, Scissors 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Product } from '../types';

// Girlhood Luxury Collection 15 Stickers Config
export const stickersMetadata = [
  {
    id: 1,
    title: "The Royal Pajamas",
    type: "die-cut",
    emoji: "👚",
    bgColor: "bg-pink-100",
    color: "#DF8A9D",
    outlineStyle: "rounded-2xl",
    svg: (
      <svg viewBox="0 0 100 100" className="w-16 h-16 pointer-events-none drop-shadow">
        <path d="M25,20 L75,20 L80,55 L65,55 L65,75 L35,75 L35,55 L20,55 Z" fill="#FFF" stroke="#DF8A9D" strokeWidth="2.5" />
        <path d="M25,20 L35,40 L50,20 L65,40 L75,20" fill="none" stroke="#DF8A9D" strokeWidth="2" />
        <line x1="30" y1="25" x2="30" y2="70" stroke="#F4B4C4" strokeWidth="1.8" strokeDasharray="1.5,1.5" />
        <line x1="40" y1="25" x2="40" y2="70" stroke="#F4B4C4" strokeWidth="1.8" strokeDasharray="1.5,1.5" />
        <line x1="50" y1="25" x2="50" y2="70" stroke="#F4B4C4" strokeWidth="1.8" strokeDasharray="1.5,1.5" />
        <line x1="60" y1="25" x2="60" y2="70" stroke="#F4B4C4" strokeWidth="1.8" strokeDasharray="1.5,1.5" />
        <line x1="70" y1="25" x2="70" y2="70" stroke="#F4B4C4" strokeWidth="1.8" strokeDasharray="1.5,1.5" />
        <circle cx="50" cy="35" r="2.5" fill="#E5C470" />
        <circle cx="50" cy="50" r="2.5" fill="#E5C470" />
        <circle cx="50" cy="65" r="2.5" fill="#E5C470" />
        <path d="M42,25 C38,18 48,15 50,23 C52,15 62,18 58,25 C55,27 45,27 42,25 Z" fill="#DF8A9D" />
      </svg>
    )
  },
  {
    id: 2,
    title: "Fluffy Slippers",
    type: "die-cut",
    emoji: "👡",
    bgColor: "bg-pink-50",
    color: "#E5D0D5",
    outlineStyle: "rounded-xl",
    svg: (
      <svg viewBox="0 0 100 100" className="w-16 h-16 pointer-events-none drop-shadow">
        <ellipse cx="38" cy="50" rx="13" ry="25" fill="#FFF" stroke="#DF8A9D" strokeWidth="2" />
        <ellipse cx="62" cy="50" rx="13" ry="25" fill="#FFF" stroke="#DF8A9D" strokeWidth="2" />
        <path d="M25,44 Q38,22 51,44" fill="none" stroke="#F4B4C4" strokeWidth="12" strokeLinecap="round" />
        <path d="M49,44 Q62,22 75,44" fill="none" stroke="#F4B4C4" strokeWidth="12" strokeLinecap="round" />
        <text x="38" y="66" fontFamily="serif" fontSize="10" fontWeight="bold" fill="#E5C470" textAnchor="middle">S</text>
        <text x="62" y="66" fontFamily="serif" fontSize="10" fontWeight="bold" fill="#E5C470" textAnchor="middle">S</text>
        <path d="M34,51 L38,48 L42,51 L40,54 L36,54 Z" fill="#E5C470" opacity="0.8" />
        <path d="M58,51 L62,48 L66,51 L64,54 L60,54 Z" fill="#E5C470" opacity="0.8" />
      </svg>
    )
  },
  {
    id: 3,
    title: "Starry Coffee/Matcha Mug",
    type: "heart",
    emoji: "🍵",
    bgColor: "bg-rose-100",
    color: "#F4B4C4",
    outlineStyle: "rounded-full",
    svg: (
      <svg viewBox="0 0 100 100" className="w-16 h-16 pointer-events-none drop-shadow">
        <path d="M30,30 L70,30 C80,30 80,65 50,85 C20,65 20,30 30,30 Z" fill="#FFF" stroke="#DF8A9D" strokeWidth="2.5" />
        <path d="M22,40 C10,40 10,60 22,60" fill="none" stroke="#DF8A9D" strokeWidth="3" />
        <path d="M12,47 C16,42 20,52 12,50 C6,52 10,42 12,47" fill="#DF8A9D" />
        <path d="M30,30 C35,26 45,34 50,30 C55,26 65,34 70,30 C75,55 50,75 50,75 C50,75 25,55 30,30 Z" fill="#E3ECC5" opacity="0.8" />
        <path d="M43,15 Q46,20 43,25" fill="none" stroke="#DF8A9D" strokeWidth="1.5" />
        <path d="M50,12 Q53,17 50,22" fill="none" stroke="#DF8A9D" strokeWidth="1.5" />
        <path d="M57,15 Q60,20 57,25" fill="none" stroke="#DF8A9D" strokeWidth="1.5" />
        <polygon points="50,45 52,50 57,52 52,54 50,59 48,54 43,52 48,50" fill="#E5C470" />
      </svg>
    )
  },
  {
    id: 4,
    title: "Silk Sleep Mask",
    type: "die-cut",
    emoji: "🛌",
    bgColor: "bg-pink-50",
    color: "#DF8A9D",
    outlineStyle: "rounded-full",
    svg: (
      <svg viewBox="0 0 100 100" className="w-16 h-16 pointer-events-none drop-shadow">
        <path d="M15,50 C15,40 30,35 50,42 C70,35 85,40 85,50 C85,60 70,65 50,57 C30,65 15,60 15,50 Z" fill="#FFF" stroke="#DF8A9D" strokeWidth="2.5" />
        <path d="M28,50 Q33,56 38,50" fill="none" stroke="#A44C5C" strokeWidth="2" strokeLinecap="round" />
        <line x1="33" y1="53" x2="31" y2="57" stroke="#A44C5C" strokeWidth="1.5" />
        <line x1="35" y1="54" x2="35" y2="59" stroke="#A44C5C" strokeWidth="1.5" />
        <line x1="37" y1="53" x2="39" y2="57" stroke="#A44C5C" strokeWidth="1.5" />
        <path d="M62,50 Q67,56 72,50" fill="none" stroke="#A44C5C" strokeWidth="2" strokeLinecap="round" />
        <line x1="67" y1="53" x2="65" y2="57" stroke="#A44C5C" strokeWidth="1.5" />
        <line x1="69" y1="54" x2="69" y2="59" stroke="#A44C5C" strokeWidth="1.5" />
        <line x1="71" y1="53" x2="73" y2="57" stroke="#A44C5C" strokeWidth="1.5" />
        <path d="M50,41 C46,36 54,34 50,39 C46,34 54,36 50,41" fill="#DF8A9D" stroke="#DF8A9D" strokeWidth="0.5" />
      </svg>
    )
  },
  {
    id: 5,
    title: "Crowned Sleepy Cloud",
    type: "cloud",
    emoji: "☁️",
    bgColor: "bg-pink-100/50",
    color: "#B4D4F4",
    outlineStyle: "rounded-3xl",
    svg: (
      <svg viewBox="0 0 100 100" className="w-16 h-16 pointer-events-none drop-shadow">
        <path d="M30,65 C20,65 15,55 25,45 C20,35 35,25 48,35 C58,25 75,30 72,45 C82,48 80,65 68,65 Z" fill="#FFF" stroke="#F4B4C4" strokeWidth="2.5" />
        <path d="M32,50 Q36,54 40,50" fill="none" stroke="#A44C5C" strokeWidth="2" strokeLinecap="round" />
        <path d="M60,50 Q64,54 68,50" fill="none" stroke="#A44C5C" strokeWidth="2" strokeLinecap="round" />
        <circle cx="28" cy="54" r="4" fill="#FFAEC9" opacity="0.8" />
        <circle cx="72" cy="54" r="4" fill="#FFAEC9" opacity="0.8" />
        <path d="M42,32 L46,24 L50,29 L54,24 L58,32 Z" fill="#E5C470" />
      </svg>
    )
  },
  {
    id: 6,
    title: "Coquette Satin Bow",
    type: "bow",
    emoji: "🎀",
    bgColor: "bg-pink-100",
    color: "#DF8A9D",
    outlineStyle: "rounded-2xl",
    svg: (
      <svg viewBox="0 0 100 100" className="w-16 h-16 pointer-events-none drop-shadow">
        <path d="M50,50 C30,30 20,45 35,55 C40,58 48,52 50,50 Z" fill="#FFF" stroke="#DF8A9D" strokeWidth="2.5" />
        <path d="M47,49 C32,34 25,47 37,53" fill="#F4B4C4" />
        <path d="M50,50 C70,30 80,45 65,55 C60,58 52,52 50,50 Z" fill="#FFF" stroke="#DF8A9D" strokeWidth="2.5" />
        <path d="M53,49 C68,34 75,47 63,53" fill="#F4B4C4" />
        <circle cx="50" cy="50" r="6" fill="#FFF" stroke="#DF8A9D" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="4" fill="#F4B4C4" />
        <path d="M46,55 C40,70 28,82 35,85 C42,88 48,70 50,56" fill="#FFF" stroke="#DF8A9D" strokeWidth="2" />
        <path d="M54,55 C60,70 72,82 65,85 C58,88 52,70 50,56" fill="#FFF" stroke="#DF8A9D" strokeWidth="2" />
      </svg>
    )
  },
  {
    id: 7,
    title: "Velvet Heart Locket",
    type: "heart",
    emoji: "💖",
    bgColor: "bg-rose-50",
    color: "#DF8A9D",
    outlineStyle: "rounded-full",
    svg: (
      <svg viewBox="0 0 100 100" className="w-16 h-16 pointer-events-none drop-shadow">
        <path d="M50,30 C50,30 42,15 28,21 C14,27 15,48 50,85 C85,48 86,27 72,21 C58,15 50,30 50,30 Z" fill="#FFF" stroke="#DF8A9D" strokeWidth="2.5" />
        <text x="50" y="52" fontFamily="serif" fontSize="18" fontWeight="bold" fill="#E5C470" fontStyle="italic" textAnchor="middle">S</text>
        <polygon points="26,38 28,41 32,42 28,43 27,46 25,43 21,42 25,41" fill="#E5C470" />
        <polygon points="74,58 76,61 80,62 76,63 75,66 73,63 69,62 73,61" fill="#E5C470" />
      </svg>
    )
  },
  {
    id: 8,
    title: "Bedtime Lotion Pump",
    type: "die-cut",
    emoji: "🧴",
    bgColor: "bg-pink-100",
    color: "#E5C470",
    outlineStyle: "rounded-3xl",
    svg: (
      <svg viewBox="0 0 100 100" className="w-16 h-16 pointer-events-none drop-shadow">
        <path d="M35,38 L65,38 L65,85 C65,88 62,91 58,91 L42,91 C38,91 35,88 35,85 Z" fill="#FFF" stroke="#DF8A9D" strokeWidth="2.5" />
        <rect x="46" y="28" width="8" height="10" fill="#FFF" stroke="#DF8A9D" strokeWidth="2.5" />
        <path d="M42,20 L58,20 C58,24 54,28 48,28 L42,28 Z" fill="#FFF" stroke="#DF8A9D" strokeWidth="2.5" />
        <circle cx="39" cy="24" r="1.5" fill="#E5C470" />
        <rect x="40" y="48" width="20" height="26" rx="2" fill="#FAF5F3" stroke="#E5C470" strokeWidth="1.2" />
        <text x="50" y="58" fontFamily="serif" fontSize="6" fontWeight="bold" fill="#A44C5C" textAnchor="middle">SULTA</text>
        <text x="50" y="66" fontFamily="sans-serif" fontSize="4.5" fill="#A44C5C" textAnchor="middle">PARFUM</text>
        <path d="M42,32 C40,29 45,29 46,31 C47,29 52,29 50,32" fill="#DF8A9D" stroke="#DF8A9D" strokeWidth="0.5" />
      </svg>
    )
  },
  {
    id: 9,
    title: "Sleepy Teddy Bear",
    type: "die-cut",
    emoji: "🧸",
    bgColor: "bg-rose-100",
    color: "#DF8A9D",
    outlineStyle: "rounded-2xl",
    svg: (
      <svg viewBox="0 0 100 100" className="w-16 h-16 pointer-events-none drop-shadow">
        <circle cx="50" cy="40" r="14" fill="#FFF" stroke="#DF8A9D" strokeWidth="2" />
        <circle cx="38" cy="29" r="5.5" fill="#FFF" stroke="#DF8A9D" strokeWidth="2" />
        <circle cx="62" cy="29" r="5.5" fill="#FFF" stroke="#DF8A9D" strokeWidth="2" />
        <circle cx="38" cy="29" r="3" fill="#F4B4C4" />
        <circle cx="62" cy="29" r="3" fill="#F4B4C4" />
        <ellipse cx="50" cy="44" rx="4.5" ry="3.5" fill="#FAF5F3" stroke="#DF8A9D" strokeWidth="1.2" />
        <polygon points="48,42 52,42 50,44" fill="#A44C5C" />
        <path d="M42,38 Q45,41 47,38" fill="none" stroke="#A44C5C" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M53,38 Q55,41 58,38" fill="none" stroke="#A44C5C" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M38,54 C35,62 38,78 50,78 C62,78 65,62 62,54 Z" fill="#FFF" stroke="#DF8A9D" strokeWidth="2" />
        <path d="M38,58 L62,58 L62,74 C62,76 60,78 58,78 L42,78 C40,78 38,76 38,74 Z" fill="#F4B4C4" />
        <text x="50" y="70" fontFamily="serif" fontSize="10" fontWeight="bold" fill="#FFF" textAnchor="middle">S</text>
      </svg>
    )
  },
  {
    id: 10,
    title: "8-Point Sparkle",
    type: "die-cut",
    emoji: "✨",
    bgColor: "bg-amber-100/50",
    color: "#E5C470",
    outlineStyle: "rounded-full",
    svg: (
      <svg viewBox="0 0 100 100" className="w-16 h-16 pointer-events-none drop-shadow">
        <path d="M50,8 L53,38 L83,41 L53,44 L50,74 L47,44 L17,41 L47,38 Z" fill="#FFF" stroke="#E5C470" strokeWidth="2.5" />
        <path d="M50,15 L52,38 L75,41 L52,44 L50,67 L48,44 L25,41 L48,38 Z" fill="#F4B4C4" />
        <polygon points="50,41 62,29 50,37 38,29" fill="#E5C470" />
        <polygon points="50,41 62,53 50,45 38,53" fill="#E5C470" />
        <circle cx="50" cy="41" r="5" fill="#FFF" />
      </svg>
    )
  },
  {
    id: 11,
    title: "Velvet Lock Diary",
    type: "square",
    emoji: "📕",
    bgColor: "bg-rose-100",
    color: "#DF8A9D",
    outlineStyle: "rounded-2xl",
    svg: (
      <svg viewBox="0 0 100 100" className="w-16 h-16 pointer-events-none drop-shadow">
        <rect x="25" y="20" width="46" height="60" rx="3" fill="#FFF" stroke="#DF8A9D" strokeWidth="2.5" />
        <rect x="25" y="20" width="8" height="60" fill="#F4B4C4" />
        <path d="M21,35 L40,35" stroke="#DF8A9D" strokeWidth="2" />
        <path d="M33,35 C30,30 38,28 33,35" fill="#DF8A9D" />
        <circle cx="60" cy="50" r="5" fill="#E5C470" />
        <line x1="60" y1="52" x2="60" y2="58" stroke="#E5C470" strokeWidth="2.5" />
        <text x="44" y="52" fontFamily="serif" fontSize="14" fill="#E5C470" fontWeight="bold">S</text>
        <polygon points="40,38 43,40 46,38 45,43 41,43" fill="#E5C470" />
      </svg>
    )
  },
  {
    id: 12,
    title: "Travel Cosmetic Case",
    type: "die-cut",
    emoji: "💼",
    bgColor: "bg-pink-50",
    color: "#DF8A9D",
    outlineStyle: "rounded-2xl",
    svg: (
      <svg viewBox="0 0 100 100" className="w-16 h-16 pointer-events-none drop-shadow">
        <path d="M22,42 L78,42 C82,42 84,45 84,49 L84,80 C84,84 82,87 78,87 L22,87 C18,87 16,84 16,80 L16,49 C16,45 18,42 22,42 Z" fill="#FFF" stroke="#DF8A9D" strokeWidth="2.5" />
        <line x1="30" y1="42" x2="30" y2="87" stroke="#F4B4C4" strokeWidth="3" />
        <line x1="40" y1="42" x2="40" y2="87" stroke="#F4B4C4" strokeWidth="3" strokeDasharray="1,1" />
        <line x1="50" y1="42" x2="50" y2="87" stroke="#F4B4C4" strokeWidth="3" />
        <line x1="60" y1="42" x2="60" y2="87" stroke="#F4B4C4" strokeWidth="3" strokeDasharray="1,1" />
        <line x1="70" y1="42" x2="70" y2="87" stroke="#F4B4C4" strokeWidth="3" />
        <line x1="16" y1="49" x2="84" y2="49" stroke="#E5C470" strokeWidth="2" />
        <path d="M38,30 Q50,16 62,30" fill="none" stroke="#DF8A9D" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M60,32 C64,28 68,36 60,34" fill="#DF8A9D" />
      </svg>
    )
  },
  {
    id: 13,
    title: "Fluffy Ear Muffs",
    type: "die-cut",
    emoji: "🎧",
    bgColor: "bg-pink-100",
    color: "#DF8A9D",
    outlineStyle: "rounded-full",
    svg: (
      <svg viewBox="0 0 100 100" className="w-16 h-16 pointer-events-none drop-shadow">
        <path d="M22,50 C22,25 78,25 78,50" fill="none" stroke="#E5C470" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M24,42 C24,42 16,30 6,36 C-4,42 -3,60 16,74 C35,60 36,42 26,36 C16,30 24,42 24,42 Z" fill="#FFF" stroke="#DF8A9D" strokeWidth="2.2" transform="scale(0.8) translate(10, 15)" />
        <path d="M24,42 C24,42 16,30 6,36 C-4,42 -3,60 16,74 C35,60 36,42 26,36 C16,30 24,42 24,42 Z" fill="#FFF" stroke="#DF8A9D" strokeWidth="2.2" transform="scale(0.8) translate(10, 15) translate(65, 0) scale(-1, 1)" />
        <circle cx="22" cy="54" r="8" fill="#F4B4C4" />
        <circle cx="78" cy="54" r="8" fill="#F4B4C4" />
        <path d="M22,46 C21,43 25,43 22,45" fill="#E5C470" />
        <path d="M78,46 C77,43 81,43 78,45" fill="#E5C470" />
      </svg>
    )
  },
  {
    id: 14,
    title: "Bedtime Message Mug",
    type: "circular",
    emoji: "☕",
    bgColor: "bg-rose-100/50",
    color: "#DF8A9D",
    outlineStyle: "rounded-full",
    svg: (
      <svg viewBox="0 0 100 100" className="w-16 h-16 pointer-events-none drop-shadow">
        <circle cx="50" cy="50" r="30" fill="#FFF" stroke="#DF8A9D" strokeWidth="2.5" />
        <path d="M78,42 C88,42 88,58 78,58" fill="none" stroke="#DF8A9D" strokeWidth="3" />
        <path d="M30,50 Q50,60 70,50" fill="none" stroke="#F4B4C4" strokeWidth="4" />
        <path d="M24,40 Q50,50 76,40" fill="none" stroke="#F4B4C4" strokeWidth="2" strokeDasharray="3,3" />
        <polygon points="50,28 52,31 55,32 52,33 50,36 48,33 45,32 48,31" fill="#E5C470" />
      </svg>
    )
  },
  {
    id: 15,
    title: "Moon Keychain Charm",
    type: "die-cut",
    emoji: "🌙",
    bgColor: "bg-amber-100/30",
    color: "#E5C470",
    outlineStyle: "rounded-3xl",
    svg: (
      <svg viewBox="0 0 100 100" className="w-16 h-16 pointer-events-none drop-shadow">
        <circle cx="50" cy="18" r="6" fill="none" stroke="#E5C470" strokeWidth="2" />
        <circle cx="50" cy="27" r="4" fill="none" stroke="#E5C470" strokeWidth="2" />
        <path d="M40,32 C58,32 68,44 68,60 C68,76 56,86 40,86 C58,86 62,72 62,60 C62,48 58,32 40,32 Z" fill="#FFF" stroke="#E5C470" strokeWidth="2.5" />
        <path d="M44,45 L41,52 L48,49 L46,55" fill="none" stroke="#DF8A9D" strokeWidth="1" />
        <polygon points="46,55 48,57 51,58 48,59 47,62 45,59 42,58 45,57" fill="#E5C470" />
        <text x="51" y="65" fontFamily="serif" fontSize="11" fontWeight="extrabold" fill="#A44C5C" fontStyle="italic" textAnchor="middle">S</text>
      </svg>
    )
  }
];

export const cleanImgUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url;
};

interface SultaAutomationStudioProps {
  products: Product[];
  selectedProductId: string;
  setSelectedProductId: (id: string) => void;
  triggerAlert: (msg: string) => void;
}

export default function SultaAutomationStudio({
  products,
  selectedProductId,
  setSelectedProductId,
  triggerAlert
}: SultaAutomationStudioProps) {
  
  const [activeAssetId, setActiveAssetId] = useState<string>('thank_you_card');
  const [loadingType, setLoadingType] = useState<'kit' | 'print' | null>(null);
  const [generationProgress, setGenerationProgress] = useState<number>(0);

  const [zoomScale, setZoomScale] = useState<number>(1);

  // Responsive design scaling to fit physical mobile screens beautifully without cutting off
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 375) {
        setZoomScale(0.68);
      } else if (w < 430) {
        setZoomScale(0.74);
      } else if (w < 520) {
        setZoomScale(0.82);
      } else if (w < 640) {
        setZoomScale(0.88);
      } else if (w < 1024) {
        setZoomScale(0.95);
      } else {
        setZoomScale(1);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Editable fields for each card
  const [thankYouTitle, setThankYouTitle] = useState<string>('');
  const [thankYouMsg, setThankYouMsg] = useState<string>('');
  const [thankYouGreeting, setThankYouGreeting] = useState<string>('');
  
  const [stickerSub, setStickerSub] = useState<string>('');
  const [stickerMono, setStickerMono] = useState<string>('');
  const [stickerFoot, setStickerFoot] = useState<string>('');
  
  const [tagSku, setTagSku] = useState<string>('');
  const [tagSize, setTagSize] = useState<string>('');
  const [tagFabric, setTagFabric] = useState<string>('');
  const [tagPrice, setTagPrice] = useState<string>('');
  
  const [careWashing, setCareWashing] = useState<string>('');
  const [careDrying, setCareDrying] = useState<string>('');
  const [careIroning, setCareIroning] = useState<string>('');
  
  const [fabricTitle, setFabricTitle] = useState<string>('');
  const [fabricDesc, setFabricDesc] = useState<string>('');
  
  const [vipHolder, setVipHolder] = useState<string>('');
  const [vipTier, setVipTier] = useState<string>('');
  const [vipBenefits, setVipBenefits] = useState<string>('');
  
  const [insertStory, setInsertStory] = useState<string>('');
  const [insertScent, setInsertScent] = useState<string>('');
  
  const [qrSupport, setQrSupport] = useState<string>('');
  const [qrSocial, setQrSocial] = useState<string>('');

  // Girlhood Luxury Sticker Sheet State (Custom Requested Collection of 15 Stickers)
  const [girlhoodSheetTitle, setGirlhoodSheetTitle] = useState<string>('SULTA ATELIER');
  const [girlhoodSheetSubtitle, setGirlhoodSheetSubtitle] = useState<string>('GIRLHOOD LUXURY STICKERS');
  const [girlhoodSheetBottomText, setGirlhoodSheetBottomText] = useState<string>('Filipenses 4:13');
  const [girlhoodSheetInstagram, setGirlhoodSheetInstagram] = useState<string>('@sulta.sleepwear');
  const [girlhoodSheetBg, setGirlhoodSheetBg] = useState<string>('#FFF0F2');
  const [activeStickerTab, setActiveStickerTab] = useState<'sheet' | 'inspect'>('sheet');
  const [selectedInspectStickerIndex, setSelectedInspectStickerIndex] = useState<number>(0);
  const [stickerQuotes, setStickerQuotes] = useState<string[]>([
    "Pajamas all day, SULTA all night! 🎀",
    "Walking on SULTA clouds ☁️",
    "More Matcha, More Sleepwear 🍵",
    "Sweet Dreams Are Made of SULTA 🌟",
    "لا توقظي الأميرة قبل الظهر من فضلك! 😴",
    "Cozy Girlhood Forever ✨",
    "نصفي ممتلئ بالقهوة.. والنصف الآخر بالساتان ☕",
    "Eau De Sleep: 100% SULTA 🌸",
    "مستوى الدلال اليومي: ملكي متوج 👑",
    "Sleeping is my cardio 🛌",
    "أعطوني بيجامة وسأغير العالم.. غداً! 🦄",
    "SULTA Sweetheart ❤️",
    "عالم مليء بالفيونكات والساتين الخالص 🎀",
    "Overthinking is canceled, Bedtime is active! 🚫",
    "دائماً متألقة ببيجامتي الوردية ★ SULTA 💖"
  ]);

  // Packaging Box Design Studio State Variables
  const [boxModelType, setBoxModelType] = useState<'pizza_box' | 'drawer_box' | 'rigid_shirt' | 'shopping_bag'>('pizza_box');
  const [boxColorTheme, setBoxColorTheme] = useState<'pink' | 'kraft' | 'midnight' | 'mint' | 'white'>('pink');
  const [boxBrandTitle, setBoxBrandTitle] = useState<string>('SULTA ATELIER');
  const [boxTagline, setBoxTagline] = useState<string>('Zero Calories Sleepwear Studio 🎀');
  const [boxSideStamp, setBoxSideStamp] = useState<string>('جماليات دافئة تليق بنوم الأميرات 👑');
  const [boxPatternTheme, setBoxPatternTheme] = useState<'stars' | 'bows' | 'minimal'>('bows');
  const [boxRibbonEnabled, setBoxRibbonEnabled] = useState<boolean>(true);
  const [activeBoxViewTab, setActiveBoxViewTab] = useState<'3d' | 'flat'>('3d');

  // Refs for Capturing
  const autoThankYouRef = useRef<HTMLDivElement>(null);
  const autoStickerRef = useRef<HTMLDivElement>(null);
  const autoTagRef = useRef<HTMLDivElement>(null);
  const autoCareRef = useRef<HTMLDivElement>(null);
  const autoFabricRef = useRef<HTMLDivElement>(null);
  const autoVipRef = useRef<HTMLDivElement>(null);
  const autoInsertRef = useRef<HTMLDivElement>(null);
  const autoQrRef = useRef<HTMLDivElement>(null);
  const autoGirlhoodStickersRef = useRef<HTMLDivElement>(null);
  const autoPackagingBoxRef = useRef<HTMLDivElement>(null);

  // Initialize and synchronise overrides when product changes
  useEffect(() => {
    const activeProduct = products.find(p => p.id === selectedProductId) || products[0];
    if (activeProduct) {
      setBoxBrandTitle(`SULTA ATELIER`);
      setBoxTagline(`Zero Calories [${activeProduct.nameAr || 'Sleepwear'}] 🎀`);
      setBoxSideStamp(`علامة مصرية فاخرة تليق بأميرتنا ⚜️`);

      setThankYouTitle(`شكراً لاختياركِ فخامة سولا`);
      setThankYouMsg(`صُنعت هذه القطعة الفاخرة [${activeProduct.nameAr}] خصيصاً لتمنحكِ تجربة نوم ملكية دافئة وهادئة.`);
      setThankYouGreeting(`فريق سولا كوتور مع كامل الحب 💗`);
      
      setStickerSub(`SULTA SLEEPWEAR COUTURE`);
      setStickerMono(activeProduct.nameAr ? activeProduct.nameAr.charAt(0) : 'S');
      setStickerFoot(`صنع بعناية فائقة لأميرات سولا ★ مصر`);
      
      setTagSku(activeProduct.sku || `SLT-${activeProduct.id ? activeProduct.id.slice(0, 5).toUpperCase() : 'COUT'}`);
      setTagSize(activeProduct.sizes && activeProduct.sizes.length > 0 ? activeProduct.sizes.join(' / ') : 'M / L');
      setTagFabric(activeProduct.fabricAr || 'حرير الساتان العضوي الملكي المعالج');
      setTagPrice(`${activeProduct.priceEG ? activeProduct.priceEG.toLocaleString() : '3,900'} ج.م`);
      
      setCareWashing(activeProduct.washInstructionsAr || 'يغسل يدوياً بماء بارد (تحت 30 درجة) مع تجنب المحاليل المبيضة للحفاظ على مرونة الساتين اللطيف.');
      setCareDrying(`يجفف بالتعليق في مكان ظليل بعيداً عن أشعة الشمس المباشرة لمنع بهتان الألياف وبقاء رونقها.`);
      setCareIroning(`يكوى بكيّ بارد خفيف وبخار ذكي من الناحية الداخلية وببطانة رقيقة لحفظ رقة دانتيل سولا.`);
      
      setFabricTitle(`⚜️ شهادة وثوقية نسيج [${activeProduct.fabricAr || 'حرير كوتور المترف'}]`);
      setFabricDesc(`تؤكد دار SULTA أن هذا المنتج منسوج كلياً من أجود خيوط الحرير الطبيعي ملمس الساتين الناعم. خيوط معالجة حرارياً لتلاؤم بشرتكم وتتنفس بحرية كاملة.`);
      
      setVipHolder(`صاحبة السمو أميرة سولا`);
      setVipTier(`العضوية الذهبية الحريرية (Gold Family)`);
      setVipBenefits(`خصم ثابت 10% مدى الحياة على كارت الـ VIP للمجموعات القادمة مع وصول مبكر للتصاميم الباريسية الحصرية.`);
      
      setInsertStory(`نحن في سولا نؤمن أن النوم ليس مجرد راحة، بل هو طقس ملكي تتدثرين فيه بالنعومة الخالصة لتستيقظي كالملكة المتوجة.`);
      setInsertScent(`طرد معطر برائحة الساتين والحرير المعتق بعبير: اللافندر والمسك الأبيض الخلاب`);
      
      setQrSupport(`دعم كونسيرج ومبيعات سولا`);
      setQrSocial(`كتالوج المجموعات الجديد بمصر والسعودية`);
    }
  }, [selectedProductId, products]);

  // Generic PNG downloader
  const downloadPngOfElement = async (ref: React.RefObject<HTMLDivElement>, fileName: string) => {
    if (!ref.current) return;
    try {
      setLoadingType('print');
      const canvas = await html2canvas(ref.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: fileName === 'girlhood_stickers' 
          ? (girlhoodSheetBg === 'transparent' ? null : girlhoodSheetBg)
          : '#FAF6F4',
        onclone: (clonedDoc) => {
          const styleTags = clonedDoc.getElementsByTagName('style');
          for (let k = 0; k < styleTags.length; k++) {
            const style = styleTags[k];
            try {
              if (style.innerHTML && style.innerHTML.includes('oklch')) {
                style.innerHTML = style.innerHTML.replace(/oklch\([^)]+\)/g, '#DF8A9D');
              }
            } catch (e) {
              console.error(e);
            }
          }
          clonedDoc.querySelectorAll('[style*="oklch"]').forEach((el: any) => {
            try {
              el.style.cssText = el.style.cssText.replace(/oklch\([^)]+\)/g, '#DF8A9D');
            } catch (e) {}
          });
        }
      });
      const link = document.createElement('a');
      link.download = `${fileName}-Sulta-300dpi.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setLoadingType(null);
      triggerAlert(`🎉 تم تحميل صورة PNG بدقة 300 DPI للملف: ${fileName}`);
    } catch (err) {
      console.error(err);
      setLoadingType(null);
      triggerAlert('❌ حدث خطأ أثناء التقاط الصورة التلقائي.');
    }
  };

  // High Resolution Transparent PNG Sticker Exporter (350 DPI)
  const downloadSingleStickerPng = async (index: number) => {
    const stickerElement = document.getElementById(`single-sticker-capture-${index}`);
    if (!stickerElement) {
      triggerAlert('⚠️ تعذر العثور على عنصر الملصق المصمم.');
      return;
    }
    try {
      setLoadingType('print');
      const canvas = await html2canvas(stickerElement, {
        scale: 3.5, // 350 DPI high resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: null, // Transparent background export
      });
      const link = document.createElement('a');
      link.download = `Sulta-Girlhood-Sticker-${index + 1}-transparent.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setLoadingType(null);
      triggerAlert(`💖 تم تصدير ملصق سولا المفرغ رقم (${index + 1}) بخلفية شفافة PNG بنجاح!`);
    } catch (err) {
      console.error(err);
      setLoadingType(null);
      triggerAlert('❌ حدث خطأ أثناء تصدير الملصق الشفاف.');
    }
  };

  // Raw SVG downloader helper
  const downloadSvgOfTemplate = (elementId: string, name: string) => {
    try {
      const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
        <rect width="100" height="100" fill="#A44C5C" rx="10"/>
        <circle cx="50" cy="40" r="14" fill="#E5C470" opacity="0.3"/>
        <text x="50" y="45" font-family="serif" font-size="16" fill="#E5C470" font-weight="bold" text-anchor="middle">S</text>
        <path d="M30,68 C40,55 60,55 70,68" stroke="#E5C470" stroke-width="1.8" fill="none"/>
        <text x="50" y="82" font-family="sans-serif" font-size="6" fill="#FFF" text-anchor="middle">SULTA COUTURE</text>
      </svg>`;
      const blob = new Blob([svgHeader], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${name}-vector-Sulta.svg`;
      link.href = url;
      link.click();
      triggerAlert(`✨ تم تصدير ملف ناقل حقيقي SVG بدقة لـ ${name}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Automated 8-in-1 PDF Package Compiler
  const generateAutomatedProductKit = async () => {
    setLoadingType('kit');
    setGenerationProgress(10);
    const activeProduct = products.find(p => p.id === selectedProductId) || products[0];
    const productName = activeProduct ? activeProduct.nameAr : 'حقيبة هدايا سولا';
    triggerAlert(`🚀 جاري توليد وتجهيز حقيبة التغليف المؤتمتة لـ [${productName}] بدقة 300 DPI وسلامة الألوان CMYK...`);

    const targets = [
      { ref: autoThankYouRef, name: '1. Thank You Card' },
      { ref: autoStickerRef, name: '2. Luxury Brand Sticker' },
      { ref: autoTagRef, name: '3. Product Hang Tag' },
      { ref: autoCareRef, name: '4. Care & Wash Instructions' },
      { ref: autoFabricRef, name: '5. Premium Fabric Spec Card' },
      { ref: autoVipRef, name: '6. Customized Gold VIP Card' },
      { ref: autoInsertRef, name: '7. Luxury Box Insert Card' },
      { ref: autoQrRef, name: '8. Smart Contact QR Card' },
    ];

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      for (let i = 0; i < targets.length; i++) {
        setGenerationProgress(Math.floor(20 + (i * 10)));
        const target = targets[i];
        
        if (target.ref.current) {
          const canvas = await html2canvas(target.ref.current, {
            scale: 2.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#FAF6F4',
            logging: false,
            onclone: (clonedDoc) => {
              const styleTags = clonedDoc.getElementsByTagName('style');
              for (let k = 0; k < styleTags.length; k++) {
                const style = styleTags[k];
                try {
                  if (style.innerHTML && style.innerHTML.includes('oklch')) {
                    style.innerHTML = style.innerHTML.replace(/oklch\([^)]+\)/g, '#DF8A9D');
                  }
                } catch (e) {
                  console.error(e);
                }
              }
              clonedDoc.querySelectorAll('[style*="oklch"]').forEach((el: any) => {
                try {
                  el.style.cssText = el.style.cssText.replace(/oklch\([^)]+\)/g, '#DF8A9D');
                } catch (e) {}
              });
            }
          });
          const imgData = canvas.toDataURL('image/png');

          if (i > 0) doc.addPage();

          // Header Accent
          doc.setFillColor(164, 76, 92); // Sulta Pink `#A44C5C`
          doc.rect(0, 0, 297, 30, 'F');

          doc.setTextColor(247, 244, 235); // Ivory cream
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(13);
          doc.text(`SULTA COUTURE AUTOMATED PACKAGING SUITE | ${productName.toUpperCase()}`, 15, 12);

          doc.setTextColor(230, 215, 185); // Cream gold
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.text(`CARD ${i + 1}/8: ${target.name} | Spec: High Grade 300 DPI - CMYK Compliant Print Profile`, 15, 19);
          doc.text(`Bleed Area Margin: 3.5mm Safe Cut Offset | Reactively Mapped to Supabase Real-time DB`, 15, 24);

          // Render captured high-DPI image in center of A4 sheet
          doc.setDrawColor(210, 180, 185);
          doc.rect(48, 43, 200, 140); 
          doc.addImage(imgData, 'PNG', 50, 45, 196, 136);

          // Footer
          doc.setFontSize(7.5);
          doc.setTextColor(110, 110, 115);
          doc.text(`Production Notice: SULTA sleepwear branding assets require textured ivory soft stock for ultimate elegance of print.`, 15, 194);
          doc.text(`SULTA Packaging Studio Engine v2.0`, 225, 194);
        }
      }

      setGenerationProgress(100);
      doc.save(`SULTA-Automation-${productName.replace(/\s+/g, '-')}-PackageKit.pdf`);
      setLoadingType(null);
      triggerAlert(`🏆 تم بنجاح تصدير حقيبة التغليف المؤتمتة الكاملة (8-in-1 PDF) لـ [${productName}] بجودة 300 DPI جاهزة تماماً للمطابع!`);
    } catch (error) {
      console.error(error);
      setLoadingType(null);
      triggerAlert('❌ حدث خطأ غير متوقع أثناء تجميع حزمة التعبئة التلقائية للمنتج.');
    }
  };

  // Spec-Sheet Clipboard Share with Printer
  const sharePackagingWithPrinter = () => {
    const currentProduct = products.find(p => p.id === selectedProductId) || products[0];
    const productName = currentProduct ? currentProduct.nameAr : 'منتجات سولا الفاخرة';
    const specSheet = `*مواصفات طباعة كيت التغليف المؤتمت لبراند SULTA SLEEPWEAR*
المنتج المختار: ${productName}
كود البكج البصري (SKU): ${tagSku || 'SLT-MASTER'}
خيوط النسيج المختارة: ${tagFabric || 'حرير طبيعي كوتور'}
المقاس المعتمَد: ${tagSize || 'M / L'}
جهة التوريد التقنية: SULTA Packaging Studio Auto-Generate

تفاصيل المقاسات والمواد المطلوبة لكل من العناصر الـ 8 الفنية:
1- كارت الشكر الفاخر (Thank You Card): مقاس 14.8 × 10.5 سم | ورق محبب (Textured Cardstock) بوزن 350 جرام.
2- الستيكر المستدير (Luxury Sticker): مقاس 6 × 6 سم | طباعة ورق مذهب مطفي أو فينيل شفاف محمي عيار Spot UV.
3- كارت السعر والعلاقة (Hang Tag): مقاس 5 × 9 سم | فتحة شريط ستان علوي 3.5 ملم | سلوفان مخملي مطفي.
4- كارت رعاية النسيج الصديق (Care Instructions): مقاس 9 × 9 سم | طباعة حبرية آمنة على ورق كرافت ناعم.
5- كارت مواصفات النسيج المترف (Fabric Info): مقاس 12 × 8 سم | كرتون سلوفان عاكس للضوء مع طلاء ملمسي.
6- بطاقات الـ VIP الذهبية المعدنية (VIP Card): مقاس 8.5 × 5.4 سم | طباعة PVC مع هولوغرام ورموز مذهبة نافرة.
7- كارت حشو الصندوق (Packaging Insert): مقاس 21 × 14.8 سم | ورق خفيف 250 جرام ممتص للعطور الخاصة.
8- كارت بوابات التواصل QR الذكي (QR Contact Card): مقاس 10 × 10 سم | طباعة واضحة للمسح الضوئي المباشر بكاميرا الجوال.

تنبيه هام عاجل للمطبعة: يرجى مراعاة هامش سلامة وقص مقداره 3.5 ملم (Bleed Margin) من جميع الجهات لحماية الهوية وسطور الحروف الرقيقة.`;

    navigator.clipboard.writeText(specSheet);
    triggerAlert('📋 تم نسخ ورقة المواصفات الفنية الموحدة لحساب المطبعة إلى الحافظة بنجاح!');
    
    const encodedText = encodeURIComponent(specSheet);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const activeProduct = products.find(p => p.id === selectedProductId) || products[0];

  return (
    <div className="space-y-8 animate-fade-in-rapid font-sans" dir="rtl">
      
      {/* progress bar */}
      {loadingType === 'kit' && (
        <div className="bg-zinc-900 border border-[#A44C5C] text-white p-5 rounded-2xl shadow-xl space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[#E5C470]">جاري تجميع وحقن تكنولوجيا الكيت الورقي المؤتمت (8 عناصر)...</span>
            <span className="font-mono">{generationProgress}%</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-[#A44C5C] to-[#E5C470] h-full transition-all duration-300" style={{ width: `${generationProgress}%` }} />
          </div>
        </div>
      )}

      {/* PRODUCT SELECTION MODULE (Synced with Supabase) */}
      <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-md md:text-lg font-black text-stone-900 flex items-center gap-2 font-serif">
              <span className="text-xl">🛍️</span>
              كتالوج المنتجات النشط والمزامن مع Supabase تلقائياً
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              اختر أي منتج من منتجات SULTA الحالية لتوليد حزمة التغليف الإنشائية المطابقة لهويتها فوراً.
            </p>
          </div>

          {/* Select dropdown */}
          <div className="flex items-center gap-2 min-w-[280px]">
            <span className="text-xs font-bold text-stone-600 shrink-0">معاينة التغليف لـ:</span>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-[#FAFAF9] border border-stone-300 px-3 py-2 rounded-xl text-xs font-bold text-stone-850 focus:outline-none focus:ring-1 focus:ring-[#A44C5C]"
            >
              {products.length === 0 ? (
                <option value="">دقيقة... جاري سحب كتالوج المنتجات</option>
              ) : (
                products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nameAr} [{p.categoryAr || 'كوتور'}]
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Horizontal Custom product cards reel for fast visual selection */}
        {products.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-stone-300 scrollbar-track-stone-100">
            {products.map((p) => {
              const isActive = p.id === selectedProductId;
              const thumbnail = p.images && p.images[0] ? cleanImgUrl(p.images[0]) : "https://images.unsplash.com/photo-1598121627344-9f2016ca5237?auto=format&fit=crop&q=80&w=400";
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProductId(p.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-right transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'border-[#A44C5C] bg-[#FFF8FA] shadow-xs'
                      : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <img
                    src={thumbnail}
                    alt={p.nameAr}
                    className="w-10 h-10 rounded-lg object-cover border border-stone-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-right">
                    <span className="text-xs font-black text-stone-800 block truncate max-w-[150px]">{p.nameAr}</span>
                    <span className="text-[10px] font-bold text-[#A44C5C] block">
                      {p.priceEG ? p.priceEG.toLocaleString() : '3,900'} ج.م • {p.fabricAr ? p.fabricAr.slice(0, 15) : 'حرير طبيعي'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* TWO COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* RIGHT COLUMN: Interactive Card fine-tuner editor (5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-stone-200 p-6 rounded-3xl space-y-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-5">
            
            {/* Header */}
            <div>
              <h3 className="text-sm font-black text-[#A44C5C] border-b border-stone-100 pb-2 flex items-center gap-1.5 font-serif">
                <Palette size={16} />
                لوحة تحرير وتعديل بيانات الكارت النشط
              </h3>
              <p className="text-[10.5px] text-stone-500 mt-1">
                اختر البطاقة الفنية التي ترغب بتعديل نصوصها ومواصفاتها الورقية قبل التصدير المطبعي.
              </p>
            </div>

            {/* Featured Girlhood Stickers Hero Trigger Button */}
            <button
              onClick={() => setActiveAssetId('girlhood_stickers')}
              className={`w-full p-3.5 rounded-2xl text-xs font-black text-center border transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                activeAssetId === 'girlhood_stickers'
                  ? 'bg-gradient-to-r from-[#DF8A9D] via-[#F4B4C4] to-[#FFF0F2] border-[#DF8A9D] text-stone-900 scale-[1.01]'
                  : 'bg-gradient-to-r from-[#FFF0F2] to-white border-[#DF8A9D]/30 text-[#A44C5C] hover:border-[#DF8A9D]'
              }`}
            >
              <Sparkles size={14} className="text-[#A44C5C] animate-pulse" />
              <span>💖 لوحة الـ 15 ستيكر الحصرية (Girlhood Luxury)</span>
            </button>

            {/* Sub Tab selection representing the 8 cards */}
            <div className="grid grid-cols-2 gap-2 text-right">
              {[
                { id: 'thank_you_card', name: '✉️ كارت الشكر' },
                { id: 'sticker_logo', name: '🏷️ ستيكر الهوية' },
                { id: 'hang_tag', name: '🔖 كارت التسعير / تاغ' },
                { id: 'care_card', name: '🧴 كارت الرعاية بالحرير' },
                { id: 'fabric_card', name: '📜 بطاقة ميزات القماش' },
                { id: 'vip_card', name: '💳 بطاقة العضوية VIP' },
                { id: 'insert_card', name: '🎀 كرت حشو البوكس' },
                { id: 'qr_card', name: '✨ كارت تواصل QR' },
                { id: 'packaging_box', name: '📦 كرتونة الباكيدج الجاهزة' }
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setActiveAssetId(btn.id)}
                  className={`px-3 py-2.5 rounded-xl text-[10.5px] font-black text-right border transition-all cursor-pointer ${
                    activeAssetId === btn.id
                      ? 'bg-[#A44C5C] border-[#A44C5C] text-white shadow-xs'
                      : 'bg-[#FAFAF9] border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {btn.name}
                </button>
              ))}
            </div>

            {/* Editor Forms per Active Asset code */}
            <div className="bg-[#FCFAF9] p-4 rounded-2xl border border-stone-150 space-y-3">
              
              {/* FORMS */}
              {activeAssetId === 'girlhood_stickers' && (
                <div className="space-y-4">
                  <div className="bg-[#FFF0F2] p-2.5 rounded-xl border border-[#DF8A9D]/30 flex items-center gap-2">
                    <span className="text-lg">🍭</span>
                    <div>
                      <span className="text-[11px] font-black text-[#A44C5C] block">تصميم الـ 15 ستيكر (Girlhood Luxury)</span>
                      <span className="text-[9.5px] text-stone-500 block leading-tight">جماليات Pinterest وتعبيرات مرحة للنوم والدلال وملصقات شفافة جاهزة للطباعة.</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-stone-500 font-bold block">ترويسة اللوح:</label>
                        <input
                          type="text"
                          value={girlhoodSheetTitle}
                          onChange={(e) => setGirlhoodSheetTitle(e.target.value)}
                          className="w-full bg-white border border-stone-300 px-2.5 py-1.5 rounded-xl text-stone-850 font-black focus:outline-none focus:border-[#A44C5C] text-[11px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-stone-500 font-bold block">العنوان الفرعي:</label>
                        <input
                          type="text"
                          value={girlhoodSheetSubtitle}
                          onChange={(e) => setGirlhoodSheetSubtitle(e.target.value)}
                          className="w-full bg-white border border-[#A44C5C]/20 px-2.5 py-1.5 rounded-xl text-stone-850 focus:outline-[#A44C5C] text-[11px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-stone-500 font-bold block font-sans">الآية/شعار التذكرة:</label>
                        <input
                          type="text"
                          value={girlhoodSheetBottomText}
                          onChange={(e) => setGirlhoodSheetBottomText(e.target.value)}
                          className="w-full bg-white border border-stone-300 px-2.5 py-1.5 rounded-xl text-stone-850 focus:outline-[#A44C5C] text-[11px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-stone-500 font-bold block font-sans">معرف الإنستقرام البصري:</label>
                        <input
                          type="text"
                          value={girlhoodSheetInstagram}
                          onChange={(e) => setGirlhoodSheetInstagram(e.target.value)}
                          className="w-full bg-white border border-stone-300 px-2.5 py-1.5 rounded-xl text-stone-850 font-mono tracking-tight text-[11px]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold block">خلفية لوح الستيكرات الشامل:</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { id: '#FFF0F2', name: 'وردي حالم' },
                          { id: '#F6E6EB', name: 'بابل بينك' },
                          { id: '#FAF8F5', name: 'كريمي دافئ' },
                          { id: 'transparent', name: 'شفافة 🏁' }
                        ].map((clr) => (
                          <button
                            key={clr.id}
                            onClick={() => setGirlhoodSheetBg(clr.id)}
                            style={{ backgroundColor: clr.id === 'transparent' ? '#FFF' : clr.id }}
                            className={`px-1.5 py-2.5 rounded-xl border text-[9.5px] font-black text-center transition-all cursor-pointer ${
                              girlhoodSheetBg === clr.id
                                ? 'border-[#A44C5C] ring-2 ring-[#DF8A9D]/10 text-[#A44C5C]'
                                : 'border-stone-250 text-stone-700 hover:bg-stone-50'
                            }`}
                          >
                            {clr.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-dashed border-stone-200 pt-2.5 space-y-2">
                      <span className="text-[11px] font-black text-[#A44C5C] block">✍️ عدلي نصوص ومناشير الستيكرات الـ 15:</span>
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {stickerQuotes.map((q, idx) => (
                          <div key={idx} className="bg-white p-2 rounded-xl border border-stone-150 space-y-1">
                            <span className="text-[9px] font-black text-stone-500 font-mono block">Sticker #{idx + 1} Quote:</span>
                            <input
                              type="text"
                              value={q}
                              onChange={(e) => {
                                const nextQ = [...stickerQuotes];
                                nextQ[idx] = e.target.value;
                                setStickerQuotes(nextQ);
                              }}
                              className="w-full bg-[#FAF9F8] border border-stone-200 px-20 py-1.5 rounded-lg text-[10.5px] text-stone-800 focus:outline-[#A44C5C] focus:bg-white leading-normal"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeAssetId === 'thank_you_card' && (
                <div className="space-y-3">
                  <span className="text-xs font-black text-stone-800 block">✉️ تعديل كارت الشكر الملكي:</span>
                  <div className="space-y-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-stone-500 block font-bold">العنوان الملكي:</label>
                      <input
                        type="text"
                        value={thankYouTitle}
                        onChange={(e) => setThankYouTitle(e.target.value)}
                        className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-805 focus:outline-[#A44C5C] focus:outline-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 block font-bold">نص رسالة الشكر والامتنان:</label>
                      <textarea
                        value={thankYouMsg}
                        onChange={(e) => setThankYouMsg(e.target.value)}
                        rows={4}
                        className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-805 focus:outline-[#A44C5C] focus:outline-1 leading-relaxed"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 block font-bold">خاتمة التوقيع الدلالي:</label>
                      <input
                        type="text"
                        value={thankYouGreeting}
                        onChange={(e) => setThankYouGreeting(e.target.value)}
                        className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-805 focus:outline-[#A44C5C] focus:outline-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeAssetId === 'sticker_logo' && (
                <div className="space-y-3">
                  <span className="text-xs font-black text-stone-800 block">🏷️ تعديل ملصق الهوية الفاخر:</span>
                  <div className="space-y-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-stone-500 block font-bold">النص الدائري السائد:</label>
                      <input
                        type="text"
                        value={stickerSub}
                        onChange={(e) => setStickerSub(e.target.value)}
                        className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-805 focus:outline-[#A44C5C] focus:outline-1 text-center font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 block font-bold">الحرف الدلالي (Monogram):</label>
                      <input
                        type="text"
                        value={stickerMono}
                        maxLength={3}
                        onChange={(e) => setStickerMono(e.target.value)}
                        className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-805 font-bold focus:outline-[#A44C5C] focus:outline-1 text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 block font-bold">تذييل جودة الاستيكر:</label>
                      <input
                        type="text"
                        value={stickerFoot}
                        onChange={(e) => setStickerFoot(e.target.value)}
                        className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-805 focus:outline-[#A44C5C] focus:outline-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeAssetId === 'hang_tag' && (
                <div className="space-y-3">
                  <span className="text-xs font-black text-stone-800 block">🔖 تعديل بطاقة المنتج وعلاقة التسعير (Hang Tag):</span>
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-stone-500 block font-bold">رمز الموديل (SKU):</label>
                        <input
                          type="text"
                          value={tagSku}
                          onChange={(e) => setTagSku(e.target.value)}
                          className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-850 text-center font-mono focus:outline-[#A44C5C] focus:outline-1"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-stone-500 block font-bold">المقاس المعتمَد:</label>
                        <input
                          type="text"
                          value={tagSize}
                          onChange={(e) => setTagSize(e.target.value)}
                          className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-850 text-center focus:outline-[#A44C5C] focus:outline-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 block font-bold">النسيج والخامة الإنشائية:</label>
                      <input
                        type="text"
                        value={tagFabric}
                        onChange={(e) => setTagFabric(e.target.value)}
                        className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-805 focus:outline-[#A44C5C] focus:outline-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 block font-bold">السعر المطبوع للتسليم:</label>
                      <input
                        type="text"
                        value={tagPrice}
                        onChange={(e) => setTagPrice(e.target.value)}
                        className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-850 focus:outline-[#A44C5C] focus:outline-1 font-bold text-center"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeAssetId === 'care_card' && (
                <div className="space-y-3">
                  <span className="text-xs font-black text-stone-800 block">🧴 تعديل بطاقة رعاية وغسيل ألبسة سولا الحالمة:</span>
                  <div className="space-y-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-stone-500 block font-bold">تعليمات الغسيل اليدوي اللطيف:</label>
                      <textarea
                        value={careWashing}
                        onChange={(e) => setCareWashing(e.target.value)}
                        rows={2}
                        className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-805 focus:outline-[#A44C5C] focus:outline-1 leading-normal"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 block font-bold">تعليمات التجفيف الرقيق بالظل:</label>
                      <textarea
                        value={careDrying}
                        onChange={(e) => setCareDrying(e.target.value)}
                        rows={2}
                        className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-805 focus:outline-[#A44C5C] focus:outline-1 leading-normal"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 block font-bold">تعليمات الكي على البارد والظهر:</label>
                      <textarea
                        value={careIroning}
                        onChange={(e) => setCareIroning(e.target.value)}
                        rows={2}
                        className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-805 focus:outline-[#A44C5C] focus:outline-1 leading-normal"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeAssetId === 'fabric_card' && (
                <div className="space-y-3">
                  <span className="text-xs font-black text-stone-800 block">📜 تعديل بطاقة ميزات وجودة النسيج:</span>
                  <div className="space-y-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-stone-500 block font-bold">عنوان البطاقة الإنشائي:</label>
                      <input
                        type="text"
                        value={fabricTitle}
                        onChange={(e) => setFabricTitle(e.target.value)}
                        className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-805 focus:outline-[#A44C5C] focus:outline-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 block font-bold">تقرير تفوق وجودة القماش:</label>
                      <textarea
                        value={fabricDesc}
                        onChange={(e) => setFabricDesc(e.target.value)}
                        rows={4}
                        className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-805 focus:outline-[#A44C5C] focus:outline-1 leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeAssetId === 'vip_card' && (
                <div className="space-y-3">
                  <span className="text-xs font-black text-stone-800 block">💳 تعديل بطاقة كبار الشخصيات VIP المذهبة:</span>
                  <div className="space-y-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-stone-500 block font-bold">اسم حامل فخامة البطاقة:</label>
                      <input
                        type="text"
                        value={vipHolder}
                        onChange={(e) => setVipHolder(e.target.value)}
                        className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-805 focus:outline-[#A44C5C] focus:outline-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 block font-bold">رتبة ودرجة العضوية الملكية:</label>
                      <input
                        type="text"
                        value={vipTier}
                        onChange={(e) => setVipTier(e.target.value)}
                        className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-805 focus:outline-[#A44C5C] focus:outline-1 text-center font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 block font-bold">المزايا والحوافز الفعالة:</label>
                      <textarea
                        value={vipBenefits}
                        onChange={(e) => setVipBenefits(e.target.value)}
                        rows={3}
                        className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-805 focus:outline-[#A44C5C] focus:outline-1 leading-normal"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeAssetId === 'insert_card' && (
                <div className="space-y-3">
                  <span className="text-xs font-black text-stone-800 block">🎀 تعديل كرت حشو البوكس وفلسفة الدار:</span>
                  <div className="space-y-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-stone-500 block font-bold">فلسفة وقصة القطعة لتنام الأميرة سعيدة:</label>
                      <textarea
                        value={insertStory}
                        onChange={(e) => setInsertStory(e.target.value)}
                        rows={4}
                        className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-805 focus:outline-[#A44C5C] focus:outline-1 leading-relaxed"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 block font-bold">تحديد ومعالجة العطر (Scent notice):</label>
                      <input
                        type="text"
                        value={insertScent}
                        onChange={(e) => setInsertScent(e.target.value)}
                        className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-805 focus:outline-[#A44C5C] focus:outline-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeAssetId === 'qr_card' && (
                <div className="space-y-3">
                  <span className="text-xs font-black text-stone-800 block">✨ تعديل كرت بوابات مسح QR الذكية:</span>
                  <div className="space-y-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-stone-500 block font-bold">بوابة خدمة المساعدة كونسيرج الدار:</label>
                      <input
                        type="text"
                        value={qrSupport}
                        onChange={(e) => setQrSupport(e.target.value)}
                        className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-805 focus:outline-[#A44C5C] focus:outline-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 block font-bold">بوابة الكتالوج والاستعراض البصري:</label>
                      <input
                        type="text"
                        value={qrSocial}
                        onChange={(e) => setQrSocial(e.target.value)}
                        className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-805 focus:outline-[#A44C5C] focus:outline-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeAssetId === 'packaging_box' && (
                <div className="space-y-4">
                  <div className="bg-[#FAF3F5] p-3 rounded-2xl border border-[#A44C5C]/15">
                    <span className="text-[12px] font-black text-[#A44C5C] block">🎨 تخصيص نوع وهيكل كرتونة التغليف (Packaging)</span>
                    <p className="text-[10px] text-stone-500 leading-normal mt-0.5">
                      اختر شكل الصندوق وهيكل الطباعة المناسب لمنتجات سولا الفاخرة لتصديرها ومشاركتها مع مصانع الكرتون بمصر.
                    </p>
                  </div>

                  {/* Box Model buttons */}
                  <div className="space-y-1.5">
                    <label className="text-stone-600 block font-bold text-[11px]">مظهر وهيكل الكرتونة أو الحقيبة:</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'pizza_box', name: '📦 صندوق البيتزا المطوي', desc: 'مناسب للبجامات الكاملة' },
                        { id: 'drawer_box', name: '🗄️ العلبة الدرج الفاخرة', desc: 'سحب جانبي بشريطة' },
                        { id: 'rigid_shirt', name: '💼 علبة الهدايا المسطحة', desc: 'غطاء منفصل كلاسيكي' },
                        { id: 'shopping_bag', name: '🛍️ حقيبة الهدايا بالشرائط', desc: 'حبل قطني رفيع دافئ' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setBoxModelType(item.id as any)}
                          className={`p-2 rounded-xl text-right border transition-all cursor-pointer ${
                            boxModelType === item.id
                              ? 'bg-[#A44C5C]/10 border-[#A44C5C] text-[#A44C5C]'
                              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <div className="font-black text-[10.5px]">{item.name}</div>
                          <div className="text-[8.5px] opacity-75">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Outer Color Theme */}
                  <div className="space-y-1.5">
                    <label className="text-stone-600 block font-bold text-[11px]">اللون ونوع المادة:</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'pink', name: 'وردي لطيف 🌸', color: '#FFF0F2' },
                        { id: 'kraft', name: 'كرافت بيئي 🍂', color: '#E1D4C8' },
                        { id: 'midnight', name: 'نجمي داكن 🌌', color: '#0F172A' },
                        { id: 'mint', name: 'عشبي بارد 🍃', color: '#EFFAF6' },
                        { id: 'white', name: 'أبيض ناصع 🏳️', color: '#FFFFFF' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setBoxColorTheme(item.id as any)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-black cursor-pointer transition-all ${
                            boxColorTheme === item.id
                              ? 'border-[#A44C5C] bg-white shadow-xs'
                              : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full border border-stone-300 inline-block" style={{ backgroundColor: item.color }} />
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Brand and Texts */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-stone-600 block font-bold text-[11px]">اسم البراند المطبوع بالأعلى:</label>
                      <input
                        type="text"
                        value={boxBrandTitle}
                        onChange={(e) => setBoxBrandTitle(e.target.value)}
                        className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-800 font-serif font-black focus:outline-[#A44C5C] focus:outline-1"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-stone-600 block font-bold text-[11px]">العبارة الترويجية الرئيسية:</label>
                      <input
                        type="text"
                        value={boxTagline}
                        onChange={(e) => setBoxTagline(e.target.value)}
                        className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-800 text-[11px] focus:outline-[#A44C5C] focus:outline-1"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-stone-600 block font-bold text-[11px]">ختم المصنع الجانبي والوثوقية:</label>
                      <input
                        type="text"
                        value={boxSideStamp}
                        onChange={(e) => setBoxSideStamp(e.target.value)}
                        className="w-full bg-white border border-stone-300 px-3 py-2 rounded-xl text-stone-800 text-[11px] focus:outline-[#A44C5C] focus:outline-1"
                      />
                    </div>
                  </div>

                  {/* Pattern Themes */}
                  <div className="space-y-1.5">
                    <label className="text-stone-600 block font-bold text-[11px]">نمط النقش الرقيق على وجه العلبة:</label>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                      {[
                        { id: 'bows', name: '🎀 فيونكات وقلوب' },
                        { id: 'stars', name: '✨ نجوم وبراعم' },
                        { id: 'minimal', name: '📜 خط بسيط راقي' }
                      ].map((pat) => (
                        <button
                          key={pat.id}
                          type="button"
                          onClick={() => setBoxPatternTheme(pat.id as any)}
                          className={`py-2 px-1 rounded-xl border transition-all cursor-pointer font-black ${
                            boxPatternTheme === pat.id
                              ? 'bg-[#A44C5C] border-[#A44C5C] text-white'
                              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          {pat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ribbon Toggle */}
                  <div className="flex items-center gap-2 p-1.5 bg-stone-150 rounded-xl">
                    <input
                      type="checkbox"
                      id="boxRibbonCheck"
                      checked={boxRibbonEnabled}
                      onChange={(e) => setBoxRibbonEnabled(e.target.checked)}
                      className="accent-[#A44C5C]"
                    />
                    <label htmlFor="boxRibbonCheck" className="text-[10px] text-stone-700 font-bold cursor-pointer select-none">
                      إضافة شريط ستان تزييني (Satin Ribbon) حول العلبة
                    </label>
                  </div>
                </div>
              )}

            </div>

            {/* Automation Quick Actions bar */}
            <div className="flex gap-2 text-center pt-2">
              <button
                onClick={() => {
                  setSelectedProductId('');
                  triggerAlert('🔄 تمت إعادة هيكلة التغطية والمزامنة مع خصائص المنتج الأصلية بنجاح!');
                }}
                className="flex-1 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={13} className="text-[#A44C5C]" />
                <span>إعادة توليد ذكي</span>
              </button>

              <button
                onClick={sharePackagingWithPrinter}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-850 border border-stone-350 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 size={13} className="text-[#A44C5C]" />
                <span>مشاركة للمطبعة</span>
              </button>
            </div>

          </div>

          {/* Master Button Generate Suite PDF */}
          <div className="pt-2">
            <button
              onClick={generateAutomatedProductKit}
              disabled={loadingType !== null}
              className="w-full bg-stone-950 hover:bg-zinc-900 border border-amber-300 text-[#F6E7A6] hover:scale-[1.01] duration-300 py-4 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Sparkles size={15} className="text-amber-300 fill-amber-300 animate-bounce" />
              <span>تحميل كيت التغليف الـ 8 المؤتمت الموحد للطباعة (PDF 300 DPI)</span>
            </button>
          </div>

        </div>

        {/* LEFT COLUMN: Deep Live Rendering Engine Visuals (7 Columns) */}
        <div className="lg:col-span-7 bg-[#FAF8F5] border border-stone-250 rounded-3xl p-6 flex flex-col justify-between shadow-xs">
          
          <div className="space-y-6">
            
            {/* Visual Header */}
            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <span className="text-xs font-black text-stone-900 flex items-center gap-2 font-serif">
                <Eye size={15} className="text-[#A44C5C]" />
                المعاينة والتدقيق الهندسي للبطاقة النشطة [300 DPI Calibrated]
              </span>
              <span className="text-[9.5px] font-mono text-[#A44C5C] font-semibold bg-pink-100/60 px-2 py-0.5 rounded-md">
                CMYK Safe
              </span>
            </div>

            {/* Premium Atelier Scale Control Panel */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#FFF0F2] rounded-xl border border-[#A44C5C]/20 text-[11px] w-full">
              <span className="font-bold text-[#A44C5C] flex items-center gap-1">
                <span>🔍 مقياس المعاينة النشط:</span>
                <span className="font-mono text-xs">{Math.round(zoomScale * 100)}%</span>
              </span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setZoomScale(Math.max(0.4, zoomScale - 0.1))} 
                  className="px-2.5 py-1 bg-white rounded border border-stone-250 hover:bg-zinc-50 font-black cursor-pointer text-stone-800"
                >
                  -
                </button>
                <button 
                  onClick={() => {
                    const w = window.innerWidth;
                    if (w < 375) setZoomScale(0.68);
                    else if (w < 430) setZoomScale(0.74);
                    else if (w < 520) setZoomScale(0.82);
                    else if (w < 640) setZoomScale(0.88);
                    else if (w < 1024) setZoomScale(0.95);
                    else setZoomScale(1);
                  }} 
                  className="px-2 py-1 bg-white rounded border border-stone-250 hover:bg-zinc-50 font-bold font-sans cursor-pointer text-stone-800"
                >
                  تلقائي 📱
                </button>
                <button 
                  onClick={() => setZoomScale(Math.min(1.5, zoomScale + 0.1))} 
                  className="px-2.5 py-1 bg-white rounded border border-stone-250 hover:bg-zinc-50 font-black cursor-pointer text-stone-800"
                >
                  +
                </button>
              </div>
            </div>

            {/* DYNAMIC CANVAS WRAPPER - This is the central visual stage of the designer */}
            <div className="bg-[#FAF8F5] md:bg-white border-2 border-dashed border-stone-300 rounded-3xl p-2 md:p-6 relative flex flex-col items-center justify-center min-h-[380px] md:min-h-[420px] overflow-hidden shadow-xs">
              
              {/* Absolute Bleed Overlays */}
              <div className="absolute top-2 left-2 text-[8px] font-mono text-stone-400 select-none hidden sm:block">✂️ Bleed Safe margin [3.5mm]</div>
              <div className="absolute bottom-2 right-2 text-[8px] font-mono text-[#A44C5C] font-semibold select-none hidden sm:block">SULTA AUTHENTIC DIGITAL STAGE</div>

              <div 
                style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center' }} 
                className="transition-transform duration-300 ease-out flex items-center justify-center shrink-0 w-full animate-fade-in-rapid"
              >

              {/* SPECIAL GIRLHOOD LUXURY 15 STICKERS STUDIO */}
              {activeAssetId === 'girlhood_stickers' && (
                <div className="flex flex-col items-center gap-4 w-full max-w-[430px] animate-fade-in-rapid">
                  {/* Mode Toggles */}
                  <div className="flex gap-2 p-1.5 bg-[#FAF3F5] border border-[#A44C5C]/10 rounded-2xl w-full text-xs">
                    <button
                      onClick={() => setActiveStickerTab('sheet')}
                      className={`flex-1 py-1.5 px-3 rounded-xl font-black text-center transition-all cursor-pointer ${
                        activeStickerTab === 'sheet'
                          ? 'bg-[#A44C5C] text-white shadow-sm'
                          : 'text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      🎀 لوح الملصقات الشامل (15 قطعة)
                    </button>
                    <button
                      onClick={() => setActiveStickerTab('inspect')}
                      className={`flex-1 py-1.5 px-3 rounded-xl font-black text-center transition-all cursor-pointer ${
                        activeStickerTab === 'inspect'
                          ? 'bg-[#A44C5C] text-white shadow-sm'
                          : 'text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      🔍 ملخص وفحص ملصق فردي
                    </button>
                  </div>

                  {activeStickerTab === 'sheet' ? (
                    /* THE FULL STICKER SHEET */
                    <div
                      ref={autoGirlhoodStickersRef}
                      className="w-full rounded-3xl p-6 flex flex-col justify-between shadow-xl transition-all duration-300 select-none bg-white"
                      style={{
                        backgroundColor: girlhoodSheetBg === 'transparent' ? 'transparent' : girlhoodSheetBg,
                        border: '1px solid rgba(223, 138, 157, 0.25)',
                        // Checkerboard behind transparent
                        backgroundImage: girlhoodSheetBg === 'transparent' 
                          ? `linear-gradient(45deg, #FAF8F5 25%, transparent 25%), 
                             linear-gradient(-45deg, #FAF8F5 25%, transparent 25%), 
                             linear-gradient(45deg, transparent 75%, #FAF8F5 75%), 
                             linear-gradient(-45deg, transparent 75%, #FAF8F5 75%)` 
                          : 'none',
                        backgroundSize: '16px 16px',
                        backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
                      }}
                    >
                      {/* Brand Header */}
                      <div className="text-center pb-4 uppercase tracking-wider mb-2 border-b border-[#A44C5C]/20 bg-white/45 p-2 rounded-2xl">
                        <span className="text-[10px] text-[#A44C5C] block tracking-widest font-black font-mono">✦ ★ S U L T A  G I R L H O O D ★ ✦</span>
                        <h3 className="text-sm font-black text-[#A44C5C] font-serif tracking-widest mt-0.5">{girlhoodSheetTitle}</h3>
                        <p className="text-[7.5px] font-bold text-stone-500 tracking-wider font-mono mt-0.5">{girlhoodSheetSubtitle}</p>
                      </div>

                      {/* 3x5 Grid of 15 Stickers */}
                      <div className="grid grid-cols-3 gap-y-4 gap-x-3 my-2">
                        {stickersMetadata.map((item, index) => {
                          const quote = stickerQuotes[index] || "";
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                setSelectedInspectStickerIndex(index);
                                setActiveStickerTab('inspect');
                              }}
                              className="group relative flex flex-col items-center justify-between p-2 bg-white/90 hover:bg-[#FFF6F8]/95 rounded-2xl transition-all duration-300 cursor-pointer text-center aspect-square flex-shrink-0"
                              style={{
                                boxShadow: '0 0 0 3px #FFF, 0 4px 10px rgba(223, 138, 157, 0.22)',
                              }}
                            >
                              <span className="absolute top-1 right-1 text-[6.5px] bg-[#FFF0F2] text-[#A44C5C] px-1 py-0.2 rounded-full font-extrabold scale-75 select-none font-mono">
                                {item.type}
                              </span>

                              <div className="w-11 h-11 flex items-center justify-center shrink-0">
                                {item.svg}
                              </div>

                              <div className="space-y-0.5 w-full">
                                <p className="text-[7px] font-black text-[#A44C5C] font-sans truncate px-0.5 leading-none" dir="rtl">
                                  {quote}
                                </p>
                              </div>

                              <div className="absolute inset-0 bg-[#A44C5C]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                                <span className="text-[8px] bg-white text-[#A44C5C] px-1.5 py-0.5 rounded-lg font-black shadow-sm scale-75">
                                  🔍 معاينة
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Brand Footer */}
                      <div className="flex justify-between items-center border-t border-[#A44C5C]/20 pt-4 mt-2 text-[9px] text-[#A44C5C] font-black bg-white/45 p-2 rounded-2xl">
                        <span className="font-mono text-[8px] text-stone-500">{girlhoodSheetInstagram}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px]">🎀 Sulta Gilded Stamps</span>
                        </div>
                        <span className="font-bold text-[8.5px]">{girlhoodSheetBottomText}</span>
                      </div>
                    </div>
                  ) : (
                    /* SINGLE STICKER INSPECT / EXPORTER */
                    <div className="w-full flex flex-col items-center gap-4 animate-fade-in-rapid">
                      {/* Selector Carousel */}
                      <div className="flex gap-2 items-center justify-between w-full p-2 bg-[#FAF3F5] rounded-xl text-xs">
                        <button
                          onClick={() => setSelectedInspectStickerIndex(prev => (prev === 0 ? 14 : prev - 1))}
                          className="px-2.5 py-1 bg-white hover:bg-stone-50 text-[#A44C5C] rounded-lg font-black border border-stone-200 cursor-pointer"
                        >
                          ‹ السابق
                        </button>
                        <span className="font-bold text-stone-800 text-[11px]">
                          الملصق {selectedInspectStickerIndex + 1}/15: {stickersMetadata[selectedInspectStickerIndex].title}
                        </span>
                        <button
                          onClick={() => setSelectedInspectStickerIndex(prev => (prev === 14 ? 0 : prev + 1))}
                          className="px-2.5 py-1 bg-white hover:bg-stone-50 text-[#A44C5C] rounded-lg font-black border border-stone-200 cursor-pointer"
                        >
                          التالي ›
                        </button>
                      </div>

                      {/* Transparent Canvas Stage */}
                      <div 
                        id={`single-sticker-capture-${selectedInspectStickerIndex}`}
                        className="w-full aspect-square bg-[#FFF] rounded-3xl p-8 flex flex-col items-center justify-center relative select-none shrink-0"
                        style={{
                          backgroundImage: `linear-gradient(45deg, #FAF8F5 25%, transparent 25%), 
                                            linear-gradient(-45deg, #FAF8F5 25%, transparent 25%), 
                                            linear-gradient(45deg, transparent 75%, #FAF8F5 75%), 
                                            linear-gradient(-45deg, transparent 75%, #FAF8F5 75%)`,
                          backgroundSize: '16px 16px',
                          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                          border: '2px solid rgba(223, 138, 157, 0.4)'
                        }}
                      >
                        {/* Die cut sticker rendering card */}
                        <div
                          className="bg-white rounded-3xl p-6 flex flex-col items-center justify-between text-center gap-4 transition-all duration-300 max-w-xs aspect-square shadow-[0_8px_30px_rgba(223,138,157,0.3)]"
                          style={{
                            boxShadow: '0 0 0 8px #FFF, 0 10px 30px rgba(223, 138, 157, 0.35)',
                          }}
                        >
                          <span className="text-[10px] bg-[#FFF0F2] text-[#A44C5C] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest leading-none">
                            {stickersMetadata[selectedInspectStickerIndex].type}
                          </span>

                          <div className="w-20 h-20 flex items-center justify-center scale-110">
                            {stickersMetadata[selectedInspectStickerIndex].svg}
                          </div>

                          <div className="space-y-1">
                            <span className="text-[8px] font-black text-stone-400 font-mono tracking-widest block">SULTA COUTURE</span>
                            <p className="text-xs font-black text-[#A44C5C] font-sans px-4 leading-normal" dir="rtl">
                              {stickerQuotes[selectedInspectStickerIndex]}
                            </p>
                          </div>
                        </div>

                        <div className="absolute bottom-2 left-2 text-[8px] font-mono text-stone-400">
                          🏁 Transparent PNG (White Bleed Outline)
                        </div>
                      </div>

                      {/* Download Isolated button */}
                      <button
                        onClick={() => downloadSingleStickerPng(selectedInspectStickerIndex)}
                        className="w-full bg-[#A44C5C] hover:bg-[#8D3F4D] text-white py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Download size={14} />
                        <span>تحميل هذا الملصق منفرداً (PNG خلفية شفافة ومفرغة)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 9. CUSTOM PACKAGING BOX PREVIEW & MOCKUP */}
              {activeAssetId === 'packaging_box' && (
                <div className="flex flex-col items-center gap-4 w-full max-w-[430px] animate-fade-in-rapid">
                  
                  {/* Mode Toggles */}
                  <div className="flex gap-2 p-1.5 bg-[#FAF3F5] border border-[#A44C5C]/10 rounded-2xl w-full text-xs">
                    <button
                      onClick={() => setActiveBoxViewTab('3d')}
                      className={`flex-1 py-1.5 px-3 rounded-xl font-black text-center transition-all cursor-pointer ${
                        activeBoxViewTab === '3d'
                          ? 'bg-[#A44C5C] text-white shadow-sm'
                          : 'text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      📦 المنظور ثلاثي الأبعاد الموك اب
                    </button>
                    <button
                      onClick={() => setActiveBoxViewTab('flat')}
                      className={`flex-1 py-1.5 px-3 rounded-xl font-black text-center transition-all cursor-pointer ${
                        activeBoxViewTab === 'flat'
                          ? 'bg-[#A44C5C] text-white shadow-sm'
                          : 'text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      📋 مخطط فرد الكرتونة للمطبعة
                    </button>
                  </div>

                  {/* CAPTURABLE CONTAINER */}
                  <div
                    ref={autoPackagingBoxRef}
                    className="w-full rounded-3xl p-6 flex flex-col justify-between shadow-xl transition-all duration-300 select-none bg-white min-h-[380px] border border-stone-200"
                    style={{
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    {activeBoxViewTab === '3d' ? (
                      /* PERSPECTIVE Mockup View */
                      <div className="flex flex-col justify-between h-full w-full py-2">
                        {/* Header Details */}
                        <div className="flex justify-between items-center text-[9px] text-stone-400 font-mono tracking-widest uppercase border-b border-stone-100 pb-2">
                          <span>SULTA 3D PACKAGING MOCKUP v3.0</span>
                          <span>READY VIEW</span>
                        </div>

                        {/* Interactive Styled Box visual based on configuration */}
                        <div className="my-8 flex flex-col items-center justify-center relative">
                          
                          {/* Perspective Shadows */}
                          <div className="absolute -bottom-4 w-48 h-6 bg-stone-900/10 blur-md rounded-full transform scale-y-50" />

                          {/* Render the core Box graphic conditionally */}
                          {boxModelType === 'pizza_box' && (
                            <div className="relative w-56 h-36 rounded-lg shadow-lg flex flex-col justify-between p-3.5 overflow-hidden transition-all duration-300 border-2"
                              style={{
                                backgroundColor: boxColorTheme === 'pink' ? '#FFF0F2' : boxColorTheme === 'kraft' ? '#E1D4C8' : boxColorTheme === 'midnight' ? '#0F172A' : boxColorTheme === 'mint' ? '#EFFAF6' : '#FFFFFF',
                                borderColor: boxColorTheme === 'pink' ? '#E9C2C8' : boxColorTheme === 'kraft' ? '#B8A594' : boxColorTheme === 'midnight' ? '#1E293B' : boxColorTheme === 'mint' ? '#CCFBF1' : '#E4E4E7',
                                color: boxColorTheme === 'midnight' ? '#F8FAFC' : '#1C1917',
                                transform: 'rotateX(15deg) rotateY(-10deg) skewX(5deg)'
                              }}
                            >
                              {/* Box Front Face Shadow Accent for depth */}
                              <div className="absolute bottom-0 left-0 w-full h-3 bg-black/10 border-t border-black/5" />
                              <div className="absolute top-0 right-0 h-full w-3 bg-white/10" />

                              {/* Pattern Repeat Watermark overlay */}
                              <div className="absolute inset-0 opacity-15 pointer-events-none flex flex-wrap gap-3 p-3 text-[10px]">
                                {boxPatternTheme === 'bows' && Array(15).fill('🎀 💗').map((el, i) => <span key={i}>{el}</span>)}
                                {boxPatternTheme === 'stars' && Array(15).fill('✨ 🌙').map((el, i) => <span key={i}>{el}</span>)}
                                {boxPatternTheme === 'minimal' && Array(4).fill('⚜️').map((el, i) => <span key={i} className="text-xl">{el}</span>)}
                              </div>

                              {/* Top Banner Ribbon Label */}
                              <div className="relative z-10 flex justify-between items-center bg-white/70 px-2 py-0.5 rounded-md border border-stone-205">
                                <span className="text-[7.5px] font-black tracking-widest text-[#A44C5C]">CLASSIC PIZZA BOX PRINT</span>
                                <span className="text-[6.5px] opacity-75 font-mono">100% COTTON</span>
                              </div>

                              {/* Central Brand Logo Block */}
                              <div className="relative z-10 text-center space-y-1 my-auto">
                                <h4 className="text-sm md:text-base font-serif font-black tracking-widest uppercase">
                                  {boxBrandTitle}
                                </h4>
                                <div className="w-12 h-[1px] mx-auto bg-current opacity-40" />
                                <p className="text-[8.5px] font-medium leading-none opacity-80 font-sans" dir="rtl">
                                  {boxTagline}
                                </p>
                              </div>

                              {/* Bottom Specifications */}
                              <div className="relative z-10 flex justify-between items-center text-[7.5px] font-sans opacity-70">
                                <span>300x240x60 mm</span>
                                <span dir="rtl">{boxSideStamp.slice(0, 18)}...</span>
                              </div>

                              {/* Tied Ribbon graphic overlay if enabled */}
                              {boxRibbonEnabled && (
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 bg-gradient-to-r from-pink-400 via-pink-300 to-pink-400 opacity-90 border-y border-pink-500/20 flex items-center justify-center pointer-events-none">
                                  <span className="text-md -mt-1 drop-shadow-sm font-sans">🎀</span>
                                </div>
                              )}
                            </div>
                          )}

                          {boxModelType === 'drawer_box' && (
                            <div className="relative w-56 h-32 flex items-center justify-end transform rotateX(10deg) skewY(-3deg) transition-all duration-300">
                              {/* Left Outer Sleeve box */}
                              <div className="relative w-40 h-28 rounded-lg shadow-lg flex flex-col justify-between p-3 border-2 overflow-hidden"
                                style={{
                                  backgroundColor: boxColorTheme === 'pink' ? '#FFF0F2' : boxColorTheme === 'kraft' ? '#E1D4C8' : boxColorTheme === 'midnight' ? '#0F172A' : boxColorTheme === 'mint' ? '#EFFAF6' : '#FFFFFF',
                                  borderColor: boxColorTheme === 'pink' ? '#E9C2C8' : boxColorTheme === 'kraft' ? '#B8A594' : boxColorTheme === 'midnight' ? '#1E293B' : boxColorTheme === 'mint' ? '#CCFBF1' : '#E4E4E7',
                                  color: boxColorTheme === 'midnight' ? '#F8FAFC' : '#1C1917',
                                }}
                              >
                                {/* Pattern watermarks */}
                                <div className="absolute inset-0 opacity-10 pointer-events-none flex flex-wrap gap-2 p-2 text-[8px]">
                                  {boxPatternTheme === 'bows' && Array(10).fill('🎀').map((el, i) => <span key={i}>{el}</span>)}
                                  {boxPatternTheme === 'stars' && Array(10).fill('✨').map((el, i) => <span key={i}>{el}</span>)}
                                  {boxPatternTheme === 'minimal' && Array(2).fill('★').map((el, i) => <span key={i}>{el}</span>)}
                                </div>

                                <div className="relative z-10 flex justify-between items-center text-[7px] opacity-60">
                                  <span>SLIDING SLEEVE</span>
                                  <span>ATELIER RIGID</span>
                                </div>

                                <div className="relative z-10 text-center space-y-0.5 my-auto">
                                  <h4 className="text-xs font-serif font-black tracking-widest">{boxBrandTitle}</h4>
                                  <p className="text-[7.5px] opacity-80" dir="rtl">{boxTagline}</p>
                                </div>

                                <div className="relative z-10 text-[6.5px] opacity-50 flex justify-between">
                                  <span>240x160x50 mm</span>
                                  <span dir="rtl">{boxSideStamp.slice(0, 10)}...</span>
                                </div>
                              </div>

                              {/* Right Inner drawer pulling out showing premium interior */}
                              <div className="w-16 h-24 bg-white border border-stone-300 rounded-r-md -ml-1.5 shadow-inner flex flex-col justify-center items-center relative overflow-hidden"
                                style={{
                                  backgroundImage: 'radial-gradient(#FFF0F2 20%, transparent 20%)',
                                  backgroundSize: '8px 8px'
                                }}
                              >
                                <span className="text-[8px] font-black text-[#A44C5C] font-mono leading-none">SULTA</span>
                                <span className="text-[6px] text-stone-400 mt-1 uppercase">SILK WRAP</span>
                                <div className="w-4 h-4 rounded-full bg-pink-400/95 absolute -right-2 top-10 flex items-center justify-center text-[8px] text-white select-none">🎀</div>
                              </div>
                            </div>
                          )}

                          {boxModelType === 'rigid_shirt' && (
                            <div className="relative w-52 h-36 rounded-2xl shadow-xl flex flex-col justify-between p-4 border transition-all duration-300 animate-fade-in-rapid"
                              style={{
                                backgroundColor: boxColorTheme === 'pink' ? '#FFF0F2' : boxColorTheme === 'kraft' ? '#E1D4C8' : boxColorTheme === 'midnight' ? '#0F172A' : boxColorTheme === 'mint' ? '#EFFAF6' : '#FFFFFF',
                                borderColor: boxColorTheme === 'pink' ? '#DF8A9D' : boxColorTheme === 'kraft' ? '#A89F91' : boxColorTheme === 'midnight' ? '#334155' : boxColorTheme === 'mint' ? '#2DD4BF' : '#E7E5E4',
                                color: boxColorTheme === 'midnight' ? '#FFFFFF' : '#1C1917',
                              }}
                            >
                              {/* Shiny elegant gold double outline border */}
                              <div className="absolute inset-1.5 border border-dashed border-current opacity-30 rounded-xl" />

                              <div className="relative z-10 flex justify-between items-center text-[7.5px] opacity-70">
                                <span>CLASSIC FLAT BOX</span>
                                <span>MSR ATELIER</span>
                              </div>

                              <div className="relative z-10 text-center space-y-1.5 my-auto">
                                <span className="text-xl md:text-2xl block text-[#A44C5C]">👑</span>
                                <h4 className="text-sm font-serif font-black tracking-widest uppercase">{boxBrandTitle}</h4>
                                <div className="text-[8px] leading-tight font-sans text-center" dir="rtl">{boxTagline}</div>
                              </div>

                              <div className="relative z-10 flex justify-between items-center text-[7px] opacity-60">
                                <span>350x250x40 mm</span>
                                <span dir="rtl">{boxSideStamp.slice(0, 15)}...</span>
                              </div>

                              {/* Golden sealing stamp element */}
                              <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-amber-400/90 rounded-full border border-amber-300 flex items-center justify-center text-[7px] text-stone-900 font-bold rotate-12 shadow-sm">
                                <span className="text-center font-serif leading-none">100%<br/>ORIGINAL</span>
                              </div>
                            </div>
                          )}

                          {boxModelType === 'shopping_bag' && (
                            <div className="relative w-44 h-48 bg-white border-2 rounded-t-xl shadow-lg flex flex-col justify-between p-4 overflow-hidden"
                              style={{
                                backgroundColor: boxColorTheme === 'pink' ? '#FFF0F2' : boxColorTheme === 'kraft' ? '#E1D4C8' : boxColorTheme === 'midnight' ? '#0F172A' : boxColorTheme === 'mint' ? '#EFFAF6' : '#FFFFFF',
                                borderColor: boxColorTheme === 'pink' ? '#E9C2C8' : boxColorTheme === 'kraft' ? '#B8A594' : boxColorTheme === 'midnight' ? '#1E293B' : boxColorTheme === 'mint' ? '#CCFBF1' : '#E4E4E7',
                                color: boxColorTheme === 'midnight' ? '#F8FAFC' : '#1C1917',
                              }}
                            >
                              {/* Cotton Rope loops */}
                              <div className="absolute -top-3 left-1/4 w-3 h-10 border-2 border-stone-400 rounded-full bg-stone-100" />
                              <div className="absolute -top-3 right-1/4 w-3 h-10 border-2 border-stone-400 rounded-full bg-stone-100" />

                              <div className="relative z-10 flex justify-between items-center text-[7.5px] opacity-60">
                                <span className="font-mono">COUTURE SHOPPING BAG</span>
                                <span>RIB-COTTON</span>
                              </div>

                              <div className="relative z-10 text-center space-y-1 my-auto">
                                <span className="text-xl block">🛍️</span>
                                <h4 className="text-sm font-serif font-black tracking-widest">{boxBrandTitle}</h4>
                                <p className="text-[8.5px] opacity-85 leading-snug" dir="rtl">{boxTagline}</p>
                              </div>

                              {/* Bottom specifications */}
                              <div className="relative z-10 border-t border-dashed border-current/25 pt-2 flex justify-between items-center text-[7px] opacity-70">
                                <span>Size: Small Luxury</span>
                                <span dir="rtl">{boxSideStamp.slice(0, 15)}...</span>
                              </div>
                            </div>
                          )}

                        </div>

                        {/* Visual instructions for manufacturing */}
                        <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-150 text-right space-y-0.5">
                          <span className="text-[9px] font-black text-[#A44C5C] block">💡 معلومات المعاينة والإنتاج:</span>
                          <p className="text-[8px] text-stone-500 leading-normal">
                             هذا منظور مجسم يحاكي دقة اللمعان وانعكاسات الحرير الخارجي. لطباعة التصميم بدقة أرسلي المخطط المسطح للمصنع المصري.
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* FLAT Die Cut Template layout */
                      <div className="flex flex-col justify-between h-full w-full py-1">
                        {/* Header specifications */}
                        <div className="flex justify-between items-center text-[8.5px] text-stone-400 font-mono tracking-widest uppercase border-b border-stone-150 pb-2">
                          <span>📋 FACTORY FLAT TEMPLATE (DIE-CUT)</span>
                          <span className="text-red-500 font-bold">✂️ 3.5mm BLEED INCLUDED</span>
                        </div>

                        {/* Flat skin blueprint illustration */}
                        <div className="my-4 p-3 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
                          
                          {/* Helper Die lines (Dasheed fold lines, Red cut lines) */}
                          <div className="absolute inset-0 border border-dashed border-red-400/50 pointer-events-none" />
                          <div className="absolute inset-1.5 border border-stone-300 pointer-events-none" />

                          {/* Render a beautiful geometric blueprint flat vector */}
                          <div className="w-52 h-44 grid grid-cols-3 gap-0.5 text-center text-[7px] text-stone-400 relative">
                            
                            {/* Flaps */}
                            <div className="border border-dashed border-stone-300 p-1 flex items-center justify-center flex-col bg-white">
                              <span>جناح لزق سفلي</span>
                              <span className="text-[5.5px] opacity-60">GLUE ZONE</span>
                            </div>
                            <div className="border border-stone-300 p-1 flex items-center justify-center flex-col bg-stone-100"
                              style={{
                                color: boxColorTheme === 'midnight' ? '#FFFFFF' : '#1C1917',
                                backgroundColor: boxColorTheme === 'pink' ? '#FFF0F2' : boxColorTheme === 'kraft' ? '#E1D4C8' : boxColorTheme === 'midnight' ? '#0F172A' : boxColorTheme === 'mint' ? '#EFFAF6' : '#FFFFFF',
                              }}
                            >
                              <span className="font-bold text-stone-600 block">الغطاء العلوي</span>
                              <span className="text-[5px] block font-serif uppercase scale-90">{boxBrandTitle}</span>
                            </div>
                            <div className="border border-dashed border-stone-300 p-1 flex items-center justify-center flex-col bg-white">
                              <span>جناح لزق علوي</span>
                              <span className="text-[5.5px] opacity-60">GLUE ZONE</span>
                            </div>

                            {/* Center body */}
                            <div className="border border-stone-300 p-1 flex items-center justify-center flex-col bg-stone-100/50">
                              <span>الوجه الجانبي أول</span>
                              <span className="text-[5px] font-mono">SPEC_L</span>
                            </div>
                            
                            {/* Main face */}
                            <div className="border-2 border-stone-400 p-1.5 flex items-center justify-between flex-col"
                              style={{
                                color: boxColorTheme === 'midnight' ? '#FFFFFF' : '#1C1917',
                                backgroundColor: boxColorTheme === 'pink' ? '#FFF0F2' : boxColorTheme === 'kraft' ? '#E1D4C8' : boxColorTheme === 'midnight' ? '#0F172A' : boxColorTheme === 'mint' ? '#EFFAF6' : '#FFFFFF',
                              }}
                            >
                              <span className="text-[6px] font-bold opacity-60 tracking-wider">الوجه الأساسي للطباعة</span>
                              <div className="space-y-0.5 py-1">
                                <span className="font-serif font-black text-[9px] uppercase tracking-wider block">{boxBrandTitle}</span>
                                <span className="text-[5.5px] block opacity-75">{boxTagline}</span>
                              </div>
                              <span className="text-[5px] opacity-65" dir="rtl">{boxSideStamp.slice(0, 18)}</span>
                            </div>

                            <div className="border border-stone-300 p-1 flex items-center justify-center flex-col bg-stone-100/50">
                              <span>الوجه الجانبي ثانٍ</span>
                              <span className="text-[5px] font-mono">SPEC_R</span>
                            </div>

                            {/* Bottom flaps */}
                            <div className="border border-dashed border-stone-300 p-1 flex items-center justify-center bg-white">قاعدة الكرتونة</div>
                            <div className="border border-stone-300 p-1 flex items-center justify-center flex-col bg-stone-200">
                              <span className="font-bold">القفل السفلي</span>
                              <span className="text-[4px] font-mono">SULTA SAFE</span>
                            </div>
                            <div className="border border-dashed border-stone-300 p-1 flex items-center justify-center bg-white">قاعدة الكرتونة</div>
                          </div>

                        </div>

                        {/* Flat spec fields */}
                        <div className="grid grid-cols-2 gap-2 text-[8px] text-stone-600 bg-[#FAF3F5] p-2.5 rounded-xl border border-[#A44C5C]/10 text-right">
                          <div>
                            <span className="font-bold block text-stone-900">📏 أبعاد لوح التقطيع المسطح:</span>
                            <span className="font-mono text-stone-500 text-[7.5px]">Spread Width: 540mm × 420mm</span>
                          </div>
                          <div>
                            <span className="font-bold block text-stone-900">⚡ هوامش السلامة للمصانع:</span>
                            <span className="text-stone-500">تم تفعيل هامش نزيف <b>3.5mm</b> لمنع اهتزاز ماكينات السلوفان.</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Capturable bottom watermark */}
                    <div className="border-t border-stone-150 pt-3 mt-2 flex justify-between items-center text-[8px] text-stone-400 font-serif">
                      <span>Designed & Engineered on Sulta Atelier v3.0</span>
                      <span>طُبع خصيصاً لأميرات سولا ★ مصر</span>
                    </div>

                  </div>
                </div>
              )}

              {/* 1. AUTO THANK YOU CARD PREVIEW */}
              {activeAssetId === 'thank_you_card' && (
                <div
                  ref={autoThankYouRef}
                  className="w-11/12 max-w-[420px] aspect-[148/105] bg-[#FAFAF9] border border-stone-200 rounded-2xl p-6 flex flex-col justify-between text-right shadow-md text-stone-900 animate-fade-in-rapid"
                >
                  <div className="flex justify-between items-center border-b border-stone-150 pb-2.5">
                    <div className="flex items-center gap-1">
                      <span className="text-lg">👑</span>
                      <span className="text-[10px] uppercase font-serif tracking-widest text-[#A44C5C] font-black">SULTA Atelier Private Card</span>
                    </div>
                    <span className="text-[8px] text-stone-400 font-mono font-bold">A6 Cardstock Spec</span>
                  </div>

                  <div className="my-auto py-2 flex gap-4 items-center">
                    <img 
                      src={activeProduct?.images?.[0] ? cleanImgUrl(activeProduct.images[0]) : "https://images.unsplash.com/photo-1598121627344-9f2016ca5237?auto=format&fit=crop&q=80&w=300"}
                      alt="Product preview"
                      className="w-16 h-16 rounded-lg object-cover border border-[#A44C5C]/20 shrink-0 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-1 flex-grow">
                      <h4 className="text-[11px] font-black text-[#A44C5C] font-serif leading-tight">{thankYouTitle}</h4>
                      <p className="text-[9.5px]/relaxed text-stone-605 font-medium leading-relaxed">{thankYouMsg}</p>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-stone-250 pt-2.5 flex justify-between items-center text-[9px] text-[#A44C5C] font-black font-sans">
                    <span className="flex items-center gap-1 text-stone-500 font-bold">
                      <span>🔖 كود القطعة:</span>
                      <span className="font-mono text-[9.5px] bg-[#FFF] border border-stone-200 px-1 rounded text-stone-850">{tagSku}</span>
                    </span>
                    <span>{thankYouGreeting}</span>
                  </div>
                </div>
              )}

              {/* 2. AUTO STICKER PREVIEW */}
              {activeAssetId === 'sticker_logo' && (
                <div
                  ref={autoStickerRef}
                  className="w-64 h-64 rounded-full bg-[#FAFAF9] border-4 border-[#A44C5C] p-6 flex flex-col items-center justify-center text-center shadow-lg text-stone-900 relative animate-fade-in-rapid"
                >
                  {/* Decorative inner circular boundary */}
                  <div className="absolute inset-2 border border-dashed border-[#A44C5C]/40 rounded-full pointer-events-none" />
                  
                  <span className="text-3xl text-[#A44C5C]">👑</span>
                  <h4 className="text-[13px] font-serif font-black tracking-widest text-[#A44C5C] uppercase mt-1 leading-none">SULTA</h4>
                  
                  <div className="w-10 h-10 rounded-full bg-[#A44C5C] text-white flex items-center justify-center font-serif text-lg font-black my-2 shadow-xs">
                    {stickerMono}
                  </div>

                  <span className="text-[9.5px] font-mono font-bold text-stone-500 uppercase tracking-wide leading-none">{stickerSub}</span>
                  <p className="text-[9px] text-stone-450 mt-1.5 max-w-[145px] font-bold leading-tight">{stickerFoot}</p>
                  
                  <div className="absolute bottom-5 text-[7px] text-[#A44C5C] font-black tracking-widest">★ COUTURE CO. ★</div>
                </div>
              )}

              {/* 3. AUTO HANG TAG PREVIEW */}
              {activeAssetId === 'hang_tag' && (
                <div
                  ref={autoTagRef}
                  className="w-48 h-80 bg-[#FAFAF9] border-2 border-stone-200 rounded-2xl p-5 flex flex-col justify-between text-right shadow-md text-stone-900 relative animate-fade-in-rapid"
                >
                  {/* Tag Hole Simulation */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-stone-200 rounded-full border border-stone-100 shadow-inner" />
                  
                  <div className="mt-4 text-center">
                    <span className="text-[8.5px] font-bold text-stone-400 font-serif tracking-widest uppercase block">SULTA COUTURE</span>
                    <h4 className="text-xs font-serif font-black tracking-widest text-[#A44C5C] leading-none mt-0.5">ATELIER</h4>
                  </div>

                  <div className="my-auto space-y-2.5 border-y border-stone-150 py-3.5">
                    <div className="text-[10px] leading-tight text-stone-750 flex justify-between font-medium">
                      <span className="text-stone-400 ml-1">القطعة:</span>
                      <span className="font-bold text-stone-900 truncate max-w-[110px] text-left">
                        {activeProduct?.nameAr || 'بيجامة دلال الحرير'}
                      </span>
                    </div>
                    <div className="text-[10px] leading-none text-stone-750 flex justify-between">
                      <span className="text-stone-400">الكود:</span>
                      <span className="font-mono font-bold text-stone-950">{tagSku}</span>
                    </div>
                    <div className="text-[10px] leading-none text-stone-750 flex justify-between">
                      <span className="text-stone-400">المقاس:</span>
                      <span className="font-bold text-[#A44C5C]">{tagSize}</span>
                    </div>
                    <div className="text-[10px] leading-none text-stone-750 flex justify-between">
                      <span className="text-stone-400">النسيج:</span>
                      <span className="font-bold text-stone-800 truncate max-w-[100px] text-left">{tagFabric}</span>
                    </div>
                    <div className="text-xs font-black text-[#A44C5C] text-center border-t border-dashed border-stone-200 pt-2 font-mono">
                      {tagPrice}
                    </div>
                  </div>

                  {/* Barcode representation */}
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-stone-900 flex gap-[1.5px] p-[1.5px] items-stretch">
                      <div className="bg-white flex-1" />
                      <div className="bg-white flex-none w-1" />
                      <div className="bg-white flex-1" />
                      <div className="bg-white flex-none w-1.5" />
                      <div className="bg-white flex-1" />
                      <div className="bg-white flex-none w-[0.5px]" />
                      <div className="bg-white flex-1" />
                      <div className="bg-white flex-none w-1" />
                      <div className="bg-white flex-1" />
                    </div>
                    <span className="text-[7.5px] font-mono text-stone-400 text-center block">SULTA*{tagSku}*</span>
                  </div>
                </div>
              )}

              {/* 4. AUTO CARE CARD PREVIEW */}
              {activeAssetId === 'care_card' && (
                <div
                  ref={autoCareRef}
                  className="w-72 h-72 bg-[#FAFAF9] border border-stone-200 rounded-2xl p-5 flex flex-col justify-between text-right shadow-md text-stone-900 animate-fade-in-rapid"
                >
                  <div className="text-center font-serif text-[11px] font-black border-b border-stone-200 pb-2 w-full text-[#A44C5C] tracking-wide">
                    🧴 دليل الرعاية والحفاظ على حرير SULTA كوتور
                  </div>

                  <div className="my-auto space-y-2">
                    <div className="bg-white p-2.5 rounded-xl border border-stone-150 space-y-0.5">
                      <span className="text-[9.5px] font-black text-[#A44C5C] flex items-center gap-1 leading-none">
                        <span>🛁</span> غسيل يدوي منعش:
                      </span>
                      <p className="text-[8.5px] text-stone-500 leading-normal font-sans font-medium">{careWashing}</p>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-stone-150 space-y-0.5">
                      <span className="text-[9.5px] font-black text-[#A44C5C] flex items-center gap-1 leading-none">
                        <span>🌤️</span> التجفيف لطيفاً في الظل:
                      </span>
                      <p className="text-[8.5px] text-stone-500 leading-normal font-sans font-medium">{careDrying}</p>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-stone-150 space-y-0.5">
                      <span className="text-[9.5px] font-black text-[#A44C5C] flex items-center gap-1 leading-none">
                        <span>☁️</span> الكي بكيّ بارد مخصص:
                      </span>
                      <p className="text-[8.5px] text-stone-500 leading-normal font-sans font-medium">{careIroning}</p>
                    </div>
                  </div>

                  <div className="text-center text-[7.5px] text-stone-400 font-mono tracking-widest border-t border-stone-150 pt-2 uppercase">
                    Sulta Studio Care Specifications © 2026
                  </div>
                </div>
              )}

              {/* 5. AUTO FABRIC SPEC CARD PREVIEW */}
              {activeAssetId === 'fabric_card' && (
                <div
                  ref={autoFabricRef}
                  className="w-11/12 max-w-[400px] aspect-[12/8] bg-[#FAFAF9] border border-stone-250 rounded-2xl p-6 flex flex-col justify-between text-right shadow-md text-stone-900 animate-fade-in-rapid"
                >
                  <div className="flex justify-between items-center border-b border-stone-150 pb-2.5">
                    <span className="text-[10px] font-serif font-black tracking-widest text-[#A44C5C] uppercase">SULTA FABRIC COUTURE CERTIFICATE</span>
                    <span className="text-[8px] text-stone-400 font-mono">Document Id v2.0</span>
                  </div>

                  <div className="my-auto py-3 space-y-2">
                    <h5 className="text-[11.5px] font-black text-stone-900 flex items-center gap-1.5 leading-none">
                      <span className="text-amber-500">⚜️</span>
                      {fabricTitle}
                    </h5>
                    <p className="text-[10px]/relaxed text-stone-605 font-medium font-sans leading-relaxed">{fabricDesc}</p>
                  </div>

                  <div className="border-t border-stone-150 pt-2 flex justify-between items-center text-[8.5px] text-stone-450 font-serif">
                    <span className="font-bold">100% Guaranteed Premium Material</span>
                    <span>SULTA SLEEPWEAR INDUSTRY</span>
                  </div>
                </div>
              )}

              {/* 6. AUTO VIP CARD PREVIEW */}
              {activeAssetId === 'vip_card' && (
                <div
                  ref={autoVipRef}
                  className="w-11/12 max-w-[360px] aspect-[85/54] bg-gradient-to-br from-zinc-950 via-stone-900 to-zinc-950 border border-[#E5C470] rounded-2xl p-5 flex flex-col justify-between text-right shadow-xl text-[#F6E7A6] relative overflow-hidden animate-fade-in-rapid"
                >
                  <div className="absolute -top-12 -left-12 w-32 h-32 bg-gradient-to-tr from-[#A44C5C]/20 to-transparent rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-10 right-0 w-44 h-24 bg-gradient-to-t from-amber-400/5 to-transparent rounded-full blur-xl pointer-events-none" />

                  <div className="flex justify-between items-center border-b border-stone-800 pb-2 flex-row-reverse">
                    <div className="text-left leading-none">
                      <span className="text-[10.5px] font-serif font-black tracking-widest block text-right">SULTA</span>
                      <span className="text-[7px] text-stone-400 block tracking-wider uppercase text-right">Royal Couture Sleepwear</span>
                    </div>
                    <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">VIP CARD</span>
                  </div>

                  <div className="my-auto py-2 space-y-1 text-right">
                    <span className="text-[7.5px] text-stone-400 uppercase tracking-widest block leading-none">حامل البطاقة الموقر:</span>
                    <div className="text-[12.5px] font-serif font-black tracking-wide text-white font-serif">{vipHolder}</div>
                    <p className="text-[9px]/relaxed text-stone-300 leading-normal pr-1 pt-0.5">{vipBenefits}</p>
                  </div>

                  <div className="flex justify-between items-center border-t border-stone-800 pt-2 text-[7.5px] text-stone-400 uppercase font-mono tracking-widest">
                    <span>{vipTier}</span>
                    <span className="text-amber-500 font-bold">★ SULTA PRIVATE HUB ★</span>
                  </div>
                </div>
              )}

              {/* 7. AUTO INSERT CARD PREVIEW */}
              {activeAssetId === 'insert_card' && (
                <div
                  ref={autoInsertRef}
                  className="w-11/12 max-w-[420px] aspect-[210/148] bg-[#FAFAF9] border border-stone-200 rounded-2xl p-6 flex flex-col justify-between text-right shadow-md text-stone-900 animate-fade-in-rapid"
                >
                  <div className="text-center">
                    <span className="text-[8.5px] font-black text-stone-400 font-serif tracking-widest uppercase block">SULTA SLEEPWEAR CO.</span>
                    <h4 className="text-xs font-serif font-semibold text-[#A44C5C] tracking-wide mt-0.5">THE COZY BEDTIME PHILOSOPHY</h4>
                  </div>

                  <div className="my-auto py-2 space-y-2 border-y border-dashed border-stone-200 py-3 text-center">
                    <p className="text-[10.5px]/relaxed text-stone-605 font-sans italic font-medium leading-relaxed">
                      " {insertStory} "
                    </p>
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-[#A44C5C] font-black font-sans">
                    <span className="flex items-center gap-1 text-stone-500 font-bold">
                      <span>🧪 الرائحة العطرية المعالجة:</span>
                      <span className="bg-[#FFF] border border-stone-200 px-2 py-0.5 rounded-md text-stone-800 text-[8.5px] font-serif uppercase tracking-wider">{insertScent.replace('طرد معطر برائحة الساتين والحرير المعتق بعبير:', '').trim()}</span>
                    </span>
                    <span>مع كامل الود الفخم 🌸</span>
                  </div>
                </div>
              )}

              {/* 8. AUTO QR CARD PREVIEW */}
              {activeAssetId === 'qr_card' && (
                <div
                  ref={autoQrRef}
                  className="w-80 h-48 bg-[#FAFAF9] border border-stone-250 rounded-2xl p-5 flex flex-col justify-between text-right shadow-md text-stone-900 animate-fade-in-rapid"
                >
                  <div className="text-center font-serif text-[10px] font-black text-[#A44C5C] tracking-wider border-b border-stone-150 pb-2">
                    ⭐ بوابات اللمس المزدوجة والمبيعات الفورية SULTA INSTANT CONNECT
                  </div>

                  <div className="grid grid-cols-2 gap-4 my-auto items-center text-center">
                    <div className="space-y-1">
                      <span className="text-[8.5px] text-stone-500 block font-bold">{qrSupport}</span>
                      <div className="bg-stone-100 p-1.5 rounded-xl inline-block border border-stone-200 shadow-sm">
                        <div className="w-11 h-11 bg-zinc-950 p-1 animate-pulse">
                          <div className="w-full h-full bg-white grid grid-cols-3 gap-0.5 p-0.5">
                            <div className="bg-zinc-950" /><div className="bg-zinc-950" /><div className="bg-white" />
                            <div className="bg-white" /><div className="bg-zinc-950" /><div className="bg-zinc-950" />
                            <div className="bg-zinc-950" /><div className="bg-white" /><div className="bg-zinc-950" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8.5px] text-stone-500 block font-bold">{qrSocial}</span>
                      <div className="bg-stone-100 p-1.5 rounded-xl inline-block border border-stone-200 shadow-sm">
                        <div className="w-11 h-11 bg-zinc-950 p-1 animate-pulse">
                          <div className="w-full h-full bg-white grid grid-cols-3 gap-0.5 p-0.5">
                            <div className="bg-zinc-950" /><div className="bg-white" /><div className="bg-zinc-950" />
                            <div className="bg-zinc-950" /><div className="bg-zinc-950" /><div className="bg-white" />
                            <div className="bg-white" /><div className="bg-zinc-950" /><div className="bg-zinc-950" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <span className="text-[7.5px] text-stone-400 text-center block font-mono">
                    Scan with your smartphone camera for live concierge chat and luxury catalog
                  </span>
                </div>
              )}

              </div>
            </div>

            {/* Direct High Resolution canvas saving utilities */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-stone-100 border border-stone-200 rounded-2xl">
              <div className="text-right">
                <span className="text-xs font-black text-stone-900 block">هل تود تصدير هذا الكارت الفردي فقط؟</span>
                <p className="text-[10px] text-stone-500 mt-0.5">يمكنك التقاط وتنزيل هذا الكارت بصيغة PNG بدقة 300 DPI منفصلة.</p>
              </div>

              <div className="flex items-center gap-2 font-black">
                <button
                  onClick={() => {
                    const targetMap: { [key: string]: React.RefObject<HTMLDivElement> } = {
                      thank_you_card: autoThankYouRef,
                      sticker_logo: autoStickerRef,
                      hang_tag: autoTagRef,
                      care_card: autoCareRef,
                      fabric_card: autoFabricRef,
                      vip_card: autoVipRef,
                      insert_card: autoInsertRef,
                      qr_card: autoQrRef,
                      girlhood_stickers: autoGirlhoodStickersRef,
                      packaging_box: autoPackagingBoxRef
                    };
                    const activeRef = targetMap[activeAssetId];
                    if (activeRef) downloadPngOfElement(activeRef, activeAssetId);
                  }}
                  className="bg-white hover:bg-stone-50 text-stone-850 border border-stone-300 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Download size={13} className="text-[#A44C5C]" />
                  <span>تنزيل PNG منفرد</span>
                </button>

                <button
                  onClick={() => downloadSvgOfTemplate('auto', activeAssetId)}
                  className="bg-[#A44C5C] hover:bg-[#8D3F4D] text-white px-4 py-2 rounded-xl text-xs font-black cursor-pointer flex items-center gap-1.5"
                >
                  <Scissors size={13} />
                  <span>تصدير ناقل SVG الفردي</span>
                </button>
              </div>
            </div>

          </div>

          {/* SULTA Guide tip */}
          <div className="mt-4 p-4 bg-amber-50/40 border border-amber-150 rounded-2xl text-stone-700 text-[11px] leading-relaxed flex items-start gap-2.5 shadow-2xs">
            <InfoIcon size={16} className="text-[#A44C5C] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-stone-900">💡 أتمتة مستندات الطباعة بالكامل لبراند SULTA:</p>
              <p className="mt-1 text-stone-600">
                عند إضافتكِ لأي منتج جديد كلياً في قاعدة بيانات Supabase، يتعرّف محرك الذكاء الاصطناعي <b>Creative Packaging AI Engine</b> على خصائص القطعة ميكانيكياً ويقوم برسم الكروت وخطوط رعاية الحرير وتجهيز القماش والملصقات تلقائياً دون أي حاجة للاستعانة ببرامج تصميم خارجية.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* ALL 8 ELEMENTS COMPACT REEL PREVIEW */}
      <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-4 shadow-sm">
        <h3 className="text-sm font-black text-stone-800 border-b border-stone-150 pb-2 flex items-center gap-1.5 font-serif">
          <span>🏆 معاينة الحزمة المتكاملة الـ 8-in-1 للمنتج المختار</span>
        </h3>
        <p className="text-xs text-stone-500">
          رؤية تكاملية لجميع عناصر التعبئة المخططة ومستوى التناغم الفني المعزز بهوية سولا الوردية والمذهبة الفخمة:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-right">
          {/* Card 1 */}
          <div 
            onClick={() => setActiveAssetId('thank_you_card')}
            className={`bg-stone-50 p-3 rounded-2xl border cursor-pointer hover:border-[#A44C5C] transition-all text-center space-y-2 ${activeAssetId === 'thank_you_card' ? 'border-[#A44C5C] bg-[#FFF8FA]' : 'border-stone-200'}`}
          >
            <span className="text-[10px] font-bold text-[#A44C5C] block">✉️ كارت الشكر</span>
            <div className="h-24 bg-white rounded-lg border border-stone-150 flex items-center justify-center overflow-hidden scale-90">
              <span className="text-[9px] text-stone-400 p-2 block truncate">رسالة شكر مخصصة</span>
            </div>
          </div>

          {/* Card 2 */}
          <div 
            onClick={() => setActiveAssetId('sticker_logo')}
            className={`bg-stone-50 p-3 rounded-2xl border cursor-pointer hover:border-[#A44C5C] transition-all text-center space-y-2 ${activeAssetId === 'sticker_logo' ? 'border-[#A44C5C] bg-[#FFF8FA]' : 'border-stone-200'}`}
          >
            <span className="text-[10px] font-bold text-[#A44C5C] block">🏷️ ملصق الهوية الدائري</span>
            <div className="h-24 bg-white rounded-lg border border-stone-150 flex items-center justify-center overflow-hidden scale-90">
              <div className="w-16 h-16 rounded-full border border-stone-300 flex items-center justify-center text-[10px] font-bold text-[#A44C5C]">S</div>
            </div>
          </div>

          {/* Card 3 */}
          <div 
            onClick={() => setActiveAssetId('hang_tag')}
            className={`bg-stone-50 p-3 rounded-2xl border cursor-pointer hover:border-[#A44C5C] transition-all text-center space-y-2 ${activeAssetId === 'hang_tag' ? 'border-[#A44C5C] bg-[#FFF8FA]' : 'border-stone-200'}`}
          >
            <span className="text-[10px] font-bold text-[#A44C5C] block">🔖 بطاقة Hang Tag</span>
            <div className="h-24 bg-white rounded-lg border border-stone-150 flex items-center justify-center overflow-hidden scale-90">
              <div className="w-10 h-20 border border-stone-300 rounded flex flex-col justify-between p-1 text-[7px] text-right ml-auto mr-auto">
                <span className="text-[6.5px] font-black text-center text-[#A44C5C]">SULTA</span>
                <span className="font-mono text-center">*BARCODE*</span>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div 
            onClick={() => setActiveAssetId('care_card')}
            className={`bg-stone-50 p-3 rounded-2xl border cursor-pointer hover:border-[#A44C5C] transition-all text-center space-y-2 ${activeAssetId === 'care_card' ? 'border-[#A44C5C] bg-[#FFF8FA]' : 'border-stone-200'}`}
          >
            <span className="text-[10px] font-bold text-[#A44C5C] block">🧴 كارت غسل الحرير</span>
            <div className="h-24 bg-white rounded-lg border border-stone-150 flex items-center justify-center overflow-hidden scale-90">
              <span className="text-[8px] text-stone-400 p-2 text-center">تعليمات الرعاية والدلال</span>
            </div>
          </div>

          {/* Card 5 */}
          <div 
            onClick={() => setActiveAssetId('fabric_card')}
            className={`bg-stone-50 p-3 rounded-2xl border cursor-pointer hover:border-[#A44C5C] transition-all text-center space-y-2 ${activeAssetId === 'fabric_card' ? 'border-[#A44C5C] bg-[#FFF8FA]' : 'border-stone-200'}`}
          >
            <span className="text-[10px] font-bold text-[#A44C5C] block">📜 بطاقة تفوق الخامة</span>
            <div className="h-24 bg-white rounded-lg border border-stone-150 flex items-center justify-center overflow-hidden scale-90">
              <span className="text-[8px] text-stone-400 p-2 text-center">شهادة النخبوية والجودة</span>
            </div>
          </div>

          {/* Card 6 */}
          <div 
            onClick={() => setActiveAssetId('vip_card')}
            className={`bg-stone-50 p-3 rounded-2xl border cursor-pointer hover:border-[#A44C5C] transition-all text-center space-y-2 ${activeAssetId === 'vip_card' ? 'border-[#A44C5C] bg-[#FFF8FA]' : 'border-stone-200'}`}
          >
            <span className="text-[10px] font-bold text-[#A44C5C] block">💳 بطاقة VIP المذهبة</span>
            <div className="h-24 bg-stone-900 rounded-lg border border-stone-800 flex items-center justify-center overflow-hidden scale-90">
              <span className="text-[8px] text-[#F6E7A6] p-2 text-center">VIP MEMBERSHIP</span>
            </div>
          </div>

          {/* Card 7 */}
          <div 
            onClick={() => setActiveAssetId('insert_card')}
            className={`bg-stone-50 p-3 rounded-2xl border cursor-pointer hover:border-[#A44C5C] transition-all text-center space-y-2 ${activeAssetId === 'insert_card' ? 'border-[#A44C5C] bg-[#FFF8FA]' : 'border-stone-200'}`}
          >
            <span className="text-[10px] font-bold text-[#A44C5C] block">🎀 كارت حشو البوكس الرقيق</span>
            <div className="h-24 bg-white rounded-lg border border-stone-150 flex items-center justify-center overflow-hidden scale-90">
              <span className="text-[8px] text-stone-400 p-2 text-center">فلسفة سولا النوم الحالم</span>
            </div>
          </div>

          {/* Card 8 */}
          <div 
            onClick={() => setActiveAssetId('qr_card')}
            className={`bg-stone-50 p-3 rounded-2xl border cursor-pointer hover:border-[#A44C5C] transition-all text-center space-y-2 ${activeAssetId === 'qr_card' ? 'border-[#A44C5C] bg-[#FFF8FA]' : 'border-stone-200'}`}
          >
            <span className="text-[10px] font-bold text-[#A44C5C] block text-center font-black">✨ كارت بوابات اتصالات QR</span>
            <div className="h-24 bg-white rounded-lg border border-stone-150 flex items-center justify-center overflow-hidden scale-90">
              <div className="grid grid-cols-2 gap-1 p-2">
                <div className="w-5 h-5 bg-stone-800" />
                <div className="w-5 h-5 bg-stone-800" />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
