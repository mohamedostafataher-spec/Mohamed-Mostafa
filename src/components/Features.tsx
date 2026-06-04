import React from 'react';
import { Truck, ShieldCheck, RefreshCw, Globe, Sparkles, HeartHandshake } from 'lucide-react';

export default function Features() {
  const qualities = [
    {
      icon: <Truck size={22} className="text-[#0B0B0B]" />,
      title: 'شحن ملكي فائق السرعة',
      desc: 'توصيل مخصص لباب المنزل مغلّف بصندوق هدايا أسود ووردي فاخر بعناية.',
    },
    {
      icon: <ShieldCheck size={22} className="text-[#0B0B0B]" />,
      title: 'سداد مشفر آمن بالكامل',
      desc: 'ندعم بوابات دفع Apple Pay وSTC Pay ومدى والفيزا وفوري بكل سلاسة.',
    },
    {
      icon: <Sparkles size={22} className="text-[#0B0B0B]" />,
      title: 'خامات إيطالية وعضوية عريقة',
      desc: 'ساتان معالج حرارياً بنعومة تضاهي الغيوم، قطن مصري نقي طويل التيلة.',
    },
    {
      icon: <RefreshCw size={22} className="text-[#0B0B0B]" />,
      title: 'سياسة إرجاع بلا مشقة',
      desc: 'لكِ كامل الراحة في الاستبدال والاسترجاع السهل في مصر والسعودية خلال حيز ١٤ يوماً.',
    },
    {
      icon: <Globe size={22} className="text-[#0B0B0B]" />,
      title: 'التوصيل لمصر والمملكة 🇸🇦 🇪🇬',
      desc: 'مخازن مجهزة بالكامل بالبلدين لضمان أسعار مرنة بدون جمارك إضافية.',
    },
    {
      icon: <HeartHandshake size={22} className="text-[#0B0B0B]" />,
      title: 'صندوق الهدايا الملكي 🌸',
      desc: 'كل شحنة تأتي في صندوق دلال فاخر ببطاقة مخصصة لتليق بالأميرات العرائس.',
    }
  ];

  return (
    <section className="bg-white py-16 border-y border-gray-100 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* GUARANTEES / BENEFITS GRID */}
        <div className="text-center max-w-xl mx-auto mb-12">
          <h3 className="font-serif text-2xl md:text-3xl lg:text-4xl text-[#0B0B0B] font-light tracking-wide">
            مواصفات تليقُ ببيت الأزياء SULTA
          </h3>
          <div className="w-16 h-0.5 bg-[#F4B6C2] mx-auto mt-4" />
          <p className="text-gray-400 text-xs mt-3 font-serif italic">WHERE COMFORT MEETS ROYAL ELEGANCE</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
          {qualities.map((item, idx) => (
            <div
              key={idx}
              className="group flex flex-col items-center text-center p-6 bg-[#FAFAF7] rounded-3xl transition-luxury border border-transparent hover:border-[#F4B6C2]/30 hover:bg-white hover:shadow-xl hover:scale-102 cursor-default font-sans"
            >
              <div className="w-12 h-12 rounded-full bg-[#F6E7A6]/40 group-hover:bg-[#F4B6C2] text-[#0B0B0B] group-hover:text-white transition-colors duration-300 flex items-center justify-center mb-4 shadow-xs">
                {item.icon}
              </div>
              <h4 className="text-sm md:text-base font-semibold text-[#0B0B0B] tracking-wide mb-2">
                {item.title}
              </h4>
              <p className="text-gray-500 text-xs md:text-sm leading-relaxed max-w-xs">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
