import React from 'react';
import { Instagram, Facebook, Twitter, MessageCircle, Pin } from 'lucide-react';

export default function SocialLinksView({ className = "flex gap-3" }: { className?: string }) {
  // Read active social accounts
  const [socials, setSocials] = React.useState<any[]>([]);

  React.useEffect(() => {
    try {
      const localSoc = localStorage.getItem('sulta_marketing_socials');
      if (localSoc) {
        setSocials(JSON.parse(localSoc));
      } else {
        setSocials([
          { id: 'sa1', platform: 'instagram', username: 'sulta.couture', url: 'https://instagram.com/sulta.couture', status: 'active' },
          { id: 'sa2', platform: 'tiktok', username: 'sulta_sleepwear', url: 'https://tiktok.com/@sulta_sleepwear', status: 'active' },
          { id: 'sa3', platform: 'facebook', username: 'sulta.atelier', url: 'https://facebook.com/sulta.atelier', status: 'active' }
        ]);
      }
    } catch {
      // safe fallback
    }
  }, []);

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
      default:
        return <span className="text-[10px] uppercase font-bold">★</span>;
    }
  };

  const activeSocials = socials.filter(s => s.status === 'active');

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
          title={`${soc.platform}: ${soc.username}`}
        >
          {getPlatformIcon(soc.platform)}
        </a>
      ))}
    </div>
  );
}
