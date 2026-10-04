import React from 'react';
import { Truck, ShieldCheck, RefreshCw, Globe, Sparkles, HeartHandshake } from 'lucide-react';
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

  return (
    <section className="bg-white py-12 sm:py-16 border-y border-gray-150 font-sans">
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

      </div>
    </section>
  );
}
