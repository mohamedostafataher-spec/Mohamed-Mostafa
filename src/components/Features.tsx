import React from 'react';
import { Truck, ShieldCheck, RefreshCw, Globe, Sparkles, HeartHandshake, Heart } from 'lucide-react';
import RibbonBowDivider from './RibbonBowDivider';
import { cleanImgUrl } from '../services/db';

interface FeaturesProps {
  homepageSections?: any[];
}

export default function Features({ homepageSections = [] }: FeaturesProps) {
  // Parse dynamic features from Supabase
  const featuresSection = homepageSections.find(s => s.section_key === 'features_list');
  const dynamicContent = featuresSection?.content_json;

  const defaultQualities = [
    {
      icon: <Truck size={22} className="text-black" />,
      title: 'شحن ملكي فائق السرعة',
      desc: 'توصيل مخصص لباب المنزل مغلّف بصندوق هدايا أسود فاخر بعناية.',
    },
    {
      icon: <ShieldCheck size={22} className="text-black" />,
      title: 'سداد مشفر آمن بالكامل',
      desc: 'ندعم بوابات دفع Apple Pay وSTC Pay ومدى والفيزا وفوري بكل سلاسة.',
    },
    {
      icon: <Sparkles size={22} className="text-black" />,
      title: 'خامات فاخرة فائقة النعومة',
      desc: 'أقمشة معالجة بحرفية بنعومة تضاهي الغيوم، مع خامات نقية فاخرة ومريحة.',
    },
    {
      icon: <RefreshCw size={22} className="text-black" />,
      title: 'سياسة إرجاع بلا مشقة',
      desc: 'لكِ كامل الراحة في الاستبدال والاسترجاع السهل في مصر والسعودية خلال حيز ١٤ يوماً.',
    },
    {
      icon: <Globe size={22} className="text-black" />,
      title: 'التوصيل لمصر والمملكة 🇸🇦 🇪🇬',
      desc: 'مخازن مجهزة بالكامل بالبلدين لضمان أسعار مرنة بدون جمارك إضافية.',
    },
    {
      icon: <HeartHandshake size={22} className="text-black" />,
      title: 'صندوق الهدايا الملكي 👑',
      desc: 'كل شحنة تأتي في صندوق دلال فاخر ببطاقة مخصصة لتليق بالأميرات العرائس.',
    }
  ];

  const rawQualities = dynamicContent?.qualities || defaultQualities;
  const qualities = rawQualities
    .filter((q: any) => !q.title?.includes('إيطال') && !q.title?.includes('ايطال') && !q.title?.includes('عريقة'))
    .map((q: any, idx: number) => ({
      ...q,
      icon: defaultQualities[idx % defaultQualities.length].icon
    }));

  const unboxing = dynamicContent?.unboxing || {
    title: 'فخامة بيجامات سُلْطَة النسائية',
    description: 'تجمع مجموعاتنا بين أرقى خامات الحرير الفاخر والتصاميم العصرية لتمنحكِ الراحة والجمال في كل لحظة. اكتشفي التميز في كل قطعة مصممة خصيصاً للمرأة التي تبحث عن الفخامة.',
    bullet1: 'أقمشة باردة ناعمة تداعب بشرتكِ',
    bullet2: 'تصاميم ملكية تجمع بين الأنوثة والرقي'
  };

  return (
    <section className="bg-white py-16 border-y border-gray-150 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* GUARANTEES / BENEFITS GRID */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <RibbonBowDivider />
          <h3 className="text-2xl md:text-3xl font-extrabold text-[#111827] tracking-tight mt-4">
            لماذا تختارين التسوق من SULTA؟
          </h3>
          <p className="text-gray-600 text-xs mt-2 font-bold tracking-wider">ضمان الجودة، سرعة الشحن، وراحة تليق بكِ</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {qualities.map((item: any, idx: number) => (
            <div
              key={idx}
              className="group flex flex-col items-center text-center p-6 bg-[#F8F9FA] hover:bg-white rounded-2xl transition-all duration-300 border border-gray-200/80 hover:border-gray-300 hover:shadow-md cursor-default"
            >
              <div className="w-12 h-12 rounded-full bg-white group-hover:bg-gray-100 border border-gray-200 flex items-center justify-center mb-4 transition-colors shadow-2xs">
                {item.icon}
              </div>
              <h4 className="text-sm font-bold text-[#111827] mb-1.5">
                {item.title}
              </h4>
              <p className="text-gray-500 text-xs leading-relaxed max-w-xs">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* LUXURY UNBOXING SHOWCASE */}
        <div className="mt-20 bg-white rounded-[40px] p-8 md:p-12 border border-gray-200 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gray-100/50 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-right order-2 md:order-1">
              <span className="text-[10px] text-gray-900 font-semibold tracking-[0.3em] uppercase block font-sans">
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
                  <div className="w-1.5 h-1.5 rounded-full bg-black" />
                </li>
                <li className="flex items-center gap-3 justify-end text-[#0B0B0B] text-sm font-medium">
                  <span>{unboxing.bullet2}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-black" />
                </li>
              </ul>
            </div>
            <div className="relative order-1 md:order-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-3xl overflow-hidden shadow-2xl rotate-[-2deg] hover:rotate-0 transition-transform duration-500 aspect-[4/5] border border-gray-200">
                  <img 
                    src={cleanImgUrl('fallback', 'loungewear')}
                    alt="Sulta Brand Artwork" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = cleanImgUrl('fallback', 'sleepwear');
                    }}
                  />
                </div>
                <div className="rounded-3xl overflow-hidden shadow-2xl rotate-[3deg] translate-y-8 hover:rotate-0 transition-transform duration-500 aspect-[4/5] border border-gray-200">
                  <img 
                    src={cleanImgUrl('fallback', 'sleepwear')}
                    alt="Sulta Premium Lifestyle Art" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = cleanImgUrl('fallback', 'sleepwear');
                    }}
                  />
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <span className="text-white text-base font-serif">👑</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
