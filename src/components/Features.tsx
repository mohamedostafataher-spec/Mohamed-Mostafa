import React from 'react';
import { Truck, ShieldCheck, RefreshCw, Globe, Sparkles, HeartHandshake, Heart } from 'lucide-react';
import RibbonBowDivider from './RibbonBowDivider';

interface FeaturesProps {
  homepageSections?: any[];
}

export default function Features({ homepageSections = [] }: FeaturesProps) {
  // Parse dynamic features from Supabase
  const featuresSection = homepageSections.find(s => s.section_key === 'features_list');
  const dynamicContent = featuresSection?.content_json;

  const defaultQualities = [
    {
      icon: <Truck size={22} className="text-[#A44C5C]" />,
      title: 'شحن ملكي فائق السرعة',
      desc: 'توصيل مخصص لباب المنزل مغلّف بصندوق هدايا أسود ووردي فاخر بعناية.',
    },
    {
      icon: <ShieldCheck size={22} className="text-[#A44C5C]" />,
      title: 'سداد مشفر آمن بالكامل',
      desc: 'ندعم بوابات دفع Apple Pay وSTC Pay ومدى والفيزا وفوري بكل سلاسة.',
    },
    {
      icon: <Sparkles size={22} className="text-[#A44C5C]" />,
      title: 'خامات إيطالية وعضوية عريقة',
      desc: 'ساتان معالج حرارياً بنعومة تضاهي الغيوم، قطن مصري نقي طويل التيلة.',
    },
    {
      icon: <RefreshCw size={22} className="text-[#A44C5C]" />,
      title: 'سياسة إرجاع بلا مشقة',
      desc: 'لكِ كامل الراحة في الاستبدال والاسترجاع السهل في مصر والسعودية خلال حيز ١٤ يوماً.',
    },
    {
      icon: <Globe size={22} className="text-[#A44C5C]" />,
      title: 'التوصيل لمصر والمملكة 🇸🇦 🇪🇬',
      desc: 'مخازن مجهزة بالكامل بالبلدين لضمان أسعار مرنة بدون جمارك إضافية.',
    },
    {
      icon: <HeartHandshake size={22} className="text-[#A44C5C]" />,
      title: 'صندوق الهدايا الملكي 🌸',
      desc: 'كل شحنة تأتي في صندوق دلال فاخر ببطاقة مخصصة لتليق بالأميرات العرائس.',
    }
  ];

  const qualities = dynamicContent?.qualities?.map((q: any, idx: number) => ({
    ...q,
    icon: defaultQualities[idx % defaultQualities.length].icon
  })) || defaultQualities;

  const unboxing = dynamicContent?.unboxing || {
    title: 'فخامة بيجامات سُلْطَة النسائية',
    description: 'تجمع مجموعاتنا بين أرقى خامات الساتان الإيطالي والتصاميم العصرية لتمنحكِ الراحة والجمال في كل لحظة. اكتشفي التميز في كل قطعة مصممة خصيصاً للمرأة التي تبحث عن الفخامة.',
    bullet1: 'أقمشة باردة ناعمة تداعب بشرتكِ',
    bullet2: 'تصاميم ملكية تجمع بين الأنوثة والرقي'
  };

  return (
    <section className="bg-[#FAF4F5] py-16 border-y border-[#DF8A9D]/15 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* GUARANTEES / BENEFITS GRID */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <RibbonBowDivider />
          <h3 className="font-serif text-2xl md:text-3xl lg:text-4xl text-[#0B0B0B] font-light tracking-wide mt-4">
            مواصفات تليقُ ببيت الأزياء SULTA
          </h3>
          <p className="text-[#A44C5C] text-xs mt-3 font-serif italic tracking-widest">WHERE COMFORT MEETS ROYAL ELEGANCE</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
          {qualities.map((item: any, idx: number) => (
            <div
              key={idx}
              className="group flex flex-col items-center text-center p-6 bg-white rounded-3xl transition-all duration-300 border border-[#DF8A9D]/10 hover:border-[#DF8A9D]/30 hover:shadow-lg hover:scale-[1.01] cursor-default"
            >
              <div className="w-12 h-12 rounded-full bg-[#FAF4F5] group-hover:bg-[#DF8A9D]/10 flex items-center justify-center mb-4 transition-colors">
                {item.icon}
              </div>
              <h4 className="text-sm md:text-base font-semibold text-[#0B0B0B] tracking-wide mb-2 font-serif">
                {item.title}
              </h4>
              <p className="text-gray-500 text-xs md:text-sm leading-relaxed max-w-xs font-serif">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* LUXURY UNBOXING SHOWCASE */}
        <div className="mt-20 bg-white rounded-[40px] p-8 md:p-12 border border-[#DF8A9D]/20 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F4B6C2]/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-right order-2 md:order-1">
              <span className="text-[10px] text-[#A44C5C] font-semibold tracking-[0.3em] uppercase block font-sans">
                ✦ SULTA LUXURY COLLECTIONS ✦
              </span>
              <h3 className="font-serif text-3xl md:text-5xl text-[#0B0B0B] font-light leading-tight">
                {unboxing.title}
              </h3>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed font-serif">
                {unboxing.description}
              </p>
              <ul className="space-y-4 pt-4">
                <li className="flex items-center gap-3 justify-end text-[#0B0B0B] text-sm font-medium">
                  <span>{unboxing.bullet1}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#DF8A9D]" />
                </li>
                <li className="flex items-center gap-3 justify-end text-[#0B0B0B] text-sm font-medium">
                  <span>{unboxing.bullet2}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#DF8A9D]" />
                </li>
              </ul>
            </div>
            <div className="relative order-1 md:order-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-3xl overflow-hidden shadow-2xl rotate-[-2deg] hover:rotate-0 transition-transform duration-500 aspect-[4/5] border border-pink-100">
                  <img 
                    src="/img/sulta_luxury_pajama_hero_2_1780682794821.png" 
                    alt="Sulta Brand Artwork" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800";
                    }}
                  />
                </div>
                <div className="rounded-3xl overflow-hidden shadow-2xl rotate-[3deg] translate-y-8 hover:rotate-0 transition-transform duration-500 aspect-[4/5] border border-pink-100">
                  <img 
                    src="/img/hero_pajama_lifestyle_1_1780682110287.png" 
                    alt="Sulta Premium Lifestyle Art" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1614088685112-0a7db9bcdad5?q=80&w=800";
                    }}
                  />
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 w-15 h-15 bg-amber-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce-subtle">
                <span className="text-white text-lg font-serif">✨</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
