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

  // Only facts the store can stand behind (no payment gateways, no invented packaging claims).
  const qualities = [
    {
      icon: <Truck size={22} className="text-black" />,
      title: 'التوصيل لمدن المملكة',
      desc: 'التوصيل خلال 2 إلى 4 أيام عمل بعد تجهيز الطلب. الشحن 40 ر.س ومجاني للطلبات فوق 299 ر.س. نشحن أيضاً لدول الخليج وتُؤكَّد التفاصيل عند الطلب.',
    },
    {
      icon: <ShieldCheck size={22} className="text-black" />,
      title: 'الدفع عند الاستلام أو تحويل بنكي',
      desc: 'ادفعي عند الاستلام، أو حوّلي بنكياً وأرسلي الإيصال عبر واتساب لتأكيد الطلب.',
    },
    {
      icon: <Sparkles size={22} className="text-black" />,
      title: 'قطن كوريشة مريح',
      desc: 'بيجامات من القطن الكوريشة الناعم بمقاس واحد يناسب من 45 إلى 80 كجم.',
    },
    {
      icon: <RefreshCw size={22} className="text-black" />,
      title: 'استبدال واسترجاع خلال 14 يوماً',
      desc: 'للقطعة غير الملبوسة بتغليفها الأصلي. أبلغينا عن أي عيب خلال 48 ساعة من الاستلام.',
    },
  ];

  return (
    <section className="bg-white py-12 sm:py-16 border-y border-gray-150 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* GUARANTEES / BENEFITS GRID */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <RibbonBowDivider />
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#111827] tracking-tight mt-4">
            لماذا تختارين التسوق من Sulta؟
          </h2>
          <p className="text-gray-600 text-xs mt-2 font-bold tracking-wider">الشحن والدفع والاستبدال بوضوح</p>
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
              <h3 className="text-sm font-bold text-[#111827] mb-1.5">
                {item.title}
              </h3>
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
