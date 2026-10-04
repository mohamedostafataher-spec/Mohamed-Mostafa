import React from 'react';
import { Instagram, Facebook, Twitter, MessageCircle, Pin } from 'lucide-react';
import { Settings } from '../types';

export default function SocialLinksView({ className = "flex gap-3", settings }: { className?: string, settings?: Settings }) {
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram size={18} />;
      case 'facebook':
        return <Facebook size={18} />;
      case 'twitter':
      case 'x':
        return <span className="font-bold text-xs font-serif">X</span>;
      case 'whatsapp':
        return <MessageCircle size={18} />;
      case 'tiktok':
        return <span className="font-bold text-[12px] font-sans">TikTok</span>;
      default:
        return <span className="text-[10px] uppercase font-bold">★</span>;
    }
  };

  const activeSocials = [];
  
  const instagramUrl = 'https://www.instagram.com/sultabrand?stkn=MXZ5cjFhYW44cGI1aQ==';
  activeSocials.push({ id: 'instagram', platform: 'instagram', url: instagramUrl, label: 'Instagram' });
  
  const tiktokUrl = settings?.tiktok && settings.tiktok.trim() !== ''
    ? (settings.tiktok.startsWith('http') ? settings.tiktok : `https://tiktok.com/@${settings.tiktok}`)
    : 'https://tiktok.com/@sultabrand';
  activeSocials.push({ id: 'tiktok', platform: 'tiktok', url: tiktokUrl, label: 'TikTok' });

  // Add dummy placeholder if empty, but user thinks it's fake. So we just show empty or a fallback if there's none.
  if (activeSocials.length === 0) return null;

  return (
    <div className={className} dir="rtl">
      {activeSocials.map((soc) => (
        <a
          key={soc.id}
          href={soc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full border border-gray-800 bg-black/40 flex items-center justify-center text-gray-300 hover:text-[#F6E7A6] hover:border-[#F6E7A6] transition-all"
          title={soc.label}
        >
          {getPlatformIcon(soc.platform)}
        </a>
      ))}
    </div>
  );
}
