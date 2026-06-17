import React, { useState, useEffect } from 'react';
import { Download, Share2, Search, Smile, Copy, Check, Star, Heart, ArrowLeft, Send } from 'lucide-react';
import { supabase } from '../services/db';

interface StickerItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: 'sticker' | 'meme' | 'all';
  sharesCount: number;
}

export default function SultaStickersGallery({ setTab, settings }: { setTab?: (tab: string) => void; settings?: any }) {
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'sticker' | 'meme'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const defaultStickers: StickerItem[] = [
    {
      id: 'sulta-m1',
      title: 'سلطانة في السرير، ملكة في الكهف 👑',
      description: 'للسلطانات اللواتي يعشقن النوم العميق ببيجامات الحرير المطرزة يدوياً.',
      imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&auto=format&fit=crop',
      category: 'meme',
      sharesCount: 142
    },
    {
      id: 'sulta-s1',
      title: 'ريلاكس يا عمري.. صولا تعتني بكِ 🌸',
      description: 'شعار العناية الخاص بالملصقات الرسمية المرفقة بعلب المنتجات الفاخرة.',
      imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop',
      category: 'sticker',
      sharesCount: 389
    },
    {
      id: 'sulta-m2',
      title: 'عندما تكون بيجامتكِ أغلى من مستقبلي 💅',
      description: 'ميمز صيد الكواليس عند وصول أفخر مناديل ورق الزهور الإيطالي صالون صولا.',
      imageUrl: 'https://images.unsplash.com/photo-1549046486-3a62df998e36?q=80&w=600&auto=format&fit=crop',
      category: 'meme',
      sharesCount: 228
    },
    {
      id: 'sulta-s2',
      title: 'سحر الملمس الإيطالي الفاتن ✨',
      description: 'تحذير ملكي: القطعة ناعمة جداً لدرجة تخدر الحواس فور ملامستها للبشرة.',
      imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=600&auto=format&fit=crop',
      category: 'sticker',
      sharesCount: 512
    }
  ];

  useEffect(() => {
    const fetchStickers = async () => {
      try {
        setLoading(true);
        const { data } = await supabase.from('homepage_sections').select('content_json').eq('section_key', 'sulta_stickers_memes_v2').limit(1).single();
        if (data && data.content_json) {
          const parsed = typeof data.content_json === 'string' ? JSON.parse(data.content_json) : data.content_json;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStickers(parsed);
            return;
          }
        }
      } catch (e) {
        console.warn("Could not fetch remote stickers, fallback to default", e);
      } finally {
        setLoading(false);
      }
      setStickers(defaultStickers);
    };

    fetchStickers();
  }, []);

  const handleDownload = (item: StickerItem) => {
    const link = document.createElement('a');
    link.href = item.imageUrl;
    link.download = `${item.title || 'sulta-royal'}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = (item: StickerItem, platform: 'whatsapp' | 'twitter' | 'copy') => {
    const text = `شاهد هذا الملصق الإبداعي الفاخر من دار أزياء SULTA الملكية 🎭✨: "${item.title}" - ${item.description}`;
    const url = window.location.href;

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
    
    // Increment local share indicator
    setStickers(prev => prev.map(s => s.id === item.id ? { ...s, sharesCount: s.sharesCount + 1 } : s));
  };

  const filtered = stickers.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-[#FAF5F0] min-h-screen py-12 px-4 sm:px-6 lg:px-8 text-right font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Back and title bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-[#A44C5C]/10">
          <div>
            <div className="flex items-center gap-2 mb-2 justify-start">
              <span className="bg-[#A44C5C]/15 text-[#A44C5C] text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase">
                SULTA Fun & Royalty 🎭
              </span>
              <span className="text-[10px] text-gray-400">معرض الأثاث الروحي المنعش</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#0B0B0B] font-light flex items-center gap-2">
              ملصقات وميمز SULTA الملكية اللطيفة
            </h1>
            <p className="text-gray-500 text-xs mt-1 leading-relaxed max-w-2xl">
              تمتّع بتحميل ومشاركة الملصقات الكوميدية والأنيقة المستخرجة من كواليس صالون SULTA الملكي الفاخر. انقر لتنزيل الملصق بخلفية شفافة فورية أو إرساله لصديقاتكِ على الواتساب!
            </p>
          </div>

          {setTab && (
            <button
              onClick={() => setTab('home')}
              className="flex items-center gap-2 bg-white text-gray-700 hover:text-[#A44C5C] text-xs font-bold px-4 py-2 rounded-xl transition-all border border-gray-200 cursor-pointer shadow-2xs self-end"
            >
              <ArrowLeft size={14} />
              <span>العودة للبوتيك</span>
            </button>
          )}
        </div>

        {/* Searching and filter controllers */}
        <div className="bg-white p-4 rounded-3xl border border-[#DF8A9D]/15 flex flex-col md:flex-row gap-4 items-center justify-between shadow-3xs">
          
          {/* Categories Tab selector */}
          <div className="flex gap-1.5 p-1 bg-stone-50 rounded-2xl w-full md:w-auto">
            <button
              onClick={() => setActiveCategory('all')}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-3xs font-black cursor-pointer transition-all ${activeCategory === 'all' ? 'bg-[#A44C5C] text-white shadow-2xs' : 'text-gray-500 hover:text-[#A44C5C]'}`}
            >
              الكل ✨
            </button>
            <button
              onClick={() => setActiveCategory('sticker')}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-3xs font-black cursor-pointer transition-all ${activeCategory === 'sticker' ? 'bg-[#A44C5C] text-white shadow-2xs' : 'text-gray-500 hover:text-[#A44C5C]'}`}
            >
              ملصقات علب التعبئة 🏷️
            </button>
            <button
              onClick={() => setActiveCategory('meme')}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-3xs font-black cursor-pointer transition-all ${activeCategory === 'meme' ? 'bg-[#A44C5C] text-white shadow-2xs' : 'text-gray-500 hover:text-[#A44C5C]'}`}
            >
              ميمز الفكاهة والصالون 🎭
            </button>
          </div>

          {/* Search bar input */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="ابحث عن ميمز أو ملصق كوميدي..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-stone-50 border border-gray-150 rounded-2xl pr-10 pl-4 py-2.5 text-xs focus:bg-white focus:ring-1 focus:ring-[#A44C5C] focus:border-[#A44C5C] outline-none text-right font-sans"
            />
            <Search size={14} className="absolute right-3.5 top-3.5 text-gray-400" />
          </div>

        </div>

        {/* Loading and stickers showcase grid */}
        {loading ? (
          <div className="text-center py-24 space-y-3">
            <div className="w-10 h-10 border-4 border-[#A44C5C] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-gray-500 font-serif italic">جاري تجميع حزمة السخرية الرقيقة والرموز الملكية لـ SULTA...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-3.5xl p-4 border border-[#DF8A9D]/10 hover:border-[#DF8A9D]/35 hover:shadow-lg transition-all duration-300 flex flex-col h-full relative"
              >
                
                {/* Image Showcase Box */}
                <div className="relative aspect-square overflow-hidden bg-[#FAF5F0] rounded-2.5xl mb-4 group-hover:scale-[1.01] transition-transform duration-500">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[8px] font-bold ${item.category === 'sticker' ? 'bg-amber-100 text-amber-800' : 'bg-pink-100 text-[#A44C5C]'}`}>
                    {item.category === 'sticker' ? 'ملصق رسمي' : 'سخرية الفكاهة'}
                  </span>
                </div>

                {/* Details text area */}
                <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                  <div className="text-right space-y-1">
                    <h3 className="text-sm font-black text-gray-900 group-hover:text-[#A44C5C] transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                      {item.description}
                    </p>
                  </div>

                  {/* Share indicator tag list */}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-3 text-[9.5px] text-gray-400 font-sans">
                    <div className="flex gap-1 items-center">
                      <Heart size={10} className="text-[#A44C5C] fill-[#A44C5C]/20" />
                      <span>{item.sharesCount} مشاركة</span>
                    </div>
                    
                    {/* Share & Download actions buttons */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDownload(item)}
                        title="تحميل الملصق"
                        className="p-1.5 bg-gray-50 hover:bg-[#A44C5C]/10 text-gray-600 hover:text-[#A44C5C] rounded-lg transition-colors cursor-pointer"
                      >
                        <Download size={12} />
                      </button>
                      <button
                        onClick={() => handleShare(item, 'whatsapp')}
                        title="مشاركة على واتساب"
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                      >
                        <Send size={12} className="rotate-180" />
                      </button>
                      <button
                        onClick={() => handleShare(item, 'copy')}
                        title="نسخ رابط لمشاركة"
                        className="p-1.5 bg-pink-50 hover:bg-[#A44C5C] text-[#A44C5C] hover:text-white rounded-lg transition-colors cursor-pointer"
                      >
                        {copiedId === item.id ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white border border-[#DF8A9D]/10 rounded-3.3xl space-y-2">
            <Smile size={32} className="text-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-gray-800">لا يوجد ملصقات متوافقة</h3>
            <p className="text-xs text-gray-400">يرجى البحث بكلمة مفتاحية مختلفة لمطابقة عناصر صولا الملكية.</p>
          </div>
        )}

        {/* Fun info box warning */}
        <div className="p-5 bg-amber-50/50 border border-amber-200/40 rounded-3xl text-center text-xs text-amber-900 leading-relaxed max-w-3xl mx-auto font-sans">
          🎗️ <strong>ملاحظة للملهمين:</strong> كودوات المشاركة مبرهنة تقنياً لاستقبال الزوار وتوجيههم لصالون العناية وخدمة الكونسيرج. يمكنك في أي وقت تحديث الميمز والملصقات من دار تحكم الإدارة (مركز قسم التسويق) لإبقاء البوتيك حيوياً وممتعاً!
        </div>

      </div>
    </div>
  );
}
