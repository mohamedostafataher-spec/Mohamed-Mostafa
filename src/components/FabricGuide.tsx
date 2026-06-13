import React from 'react';
import { Sparkles, Wind, Sun, Snowflake, Shield, RefreshCw } from 'lucide-react';
import FabricRealityCenter from './FabricRealityCenter';

interface FabricGuideProps {
  homepageSections?: any[];
}

export default function FabricGuide({ homepageSections = [] }: FabricGuideProps) {
  // Try to load edited content from admin CMS (homepageSections -> 'fabric_guide')
  const savedSection = homepageSections.find(s => s.section_key === 'fabric_guide')?.content_json;

  // Elegantly localized premium default fabric sections
  const sections = {
    cottonTitleAr: savedSection?.cottonTitleAr || 'تشكيلة القطن الفاخرة (Cotton Collection)',
    cottonDescAr: savedSection?.cottonDescAr || 'مصنوعة من ألياف القطن المصري طويل التيلة الفائق النعومة بنسبة 100%. يتميز بقدرته الفائقة على تنفس البشرة وامتصاص الرطوبة، مما يجعله مثالياً لليالي هادئة مريحة خالية من التعرق.',
    
    cottonLycraTitleAr: savedSection?.cottonLycraTitleAr || 'تشكيلة قطن ليكرا الإنشائية (Cotton Lycra Collection)',
    cottonLycraDescAr: savedSection?.cottonLycraDescAr || 'مزيج فريد يجمع بين نقاء القطن العضوي المتين ومرونة الليكرا الفائقة لمرونة انسيابية تناسب الحركة والنشاطات المنزلية بامتياز مع الحفاظ على الشكل الأنيق.',
    
    satinTitleAr: savedSection?.satinTitleAr || 'مجموعة الساتان الإيطالي الملكية (Satin Collection)',
    satinDescAr: savedSection?.satinDescAr || 'الساتان الملكي المعالج حرارياً بلمعة مطفأة ووزن خفيف منسدل بنعومة تضاهي الحرير الطبيعي. يوفر ملمساً بارداً ولطيفاً جداً على البشرة والعرائس بمظهر غاية في الجاذبية والفخامة.',
    
    summerTitleAr: savedSection?.summerTitleAr || 'الأقمشة الصيفية الخفيفة (Summer Fabrics)',
    summerDescAr: savedSection?.summerDescAr || 'أقمشة باردة معالجة لتنفس كامل ومقاومة درجات الحرارة. نعتمد خامات خفيفة ومفتحة للمسام تمنحكِ انتعاش الخلوة ونسمة هواء مستمرة حتى في أحر الأيام.',
    
    winterTitleAr: savedSection?.winterTitleAr || 'الأقمشة الشتوية والمخمل الملكي (Winter Fabrics)',
    winterDescAr: savedSection?.winterDescAr || 'مخمل دافئ وكثيف مع طواقم مبطنة حرارياً توفر العزل التام والدفء اللطيف داخل المنزل ليمنحكِ فخامة الأميرات مع حماية قصوى من تيارات الشتاء الباردة.',
    
    careTitleAr: savedSection?.careTitleAr || 'إرشادات العناية الخاصة والوقاية (Care Instructions)',
    careDescAr: savedSection?.careDescAr || 'ننصح بتجنب درجات الحرارة المرتفعة أثناء الكي ويفضل الكي البخاري أو بدرجة حرارة معتدلة مخصصة للحرير. تجنبي المبيضات والمواد الكيميائية وحافظي على تهوية القطع وعطر الدار.',
    
    benefitsTitleAr: savedSection?.benefitsTitleAr || 'مزايا فخامة خامات SULTA الممتازة (Fabric Benefits)',
    benefitsDescAr: savedSection?.benefitsDescAr || 'مضادة للحساسية، مقاومة للتجعد التلقائي، ثبات كلي للألوان الملكية حتى مع تكرار الغسيل، حياكة يدوية مزدوجة الحلقات تضمن عمرًا أطول للقطعة دون تلف للتمرير عبر الأجيال.',
    
    washingTitleAr: savedSection?.washingTitleAr || 'بروتوكول الغسيل والتطهير الملكي (Washing Instructions)',
    washingDescAr: savedSection?.washingDescAr || 'تُغسل القطعة يدوياً بماء بارد أو غسيل آلي ناعم (برنامج الحرير الداخلي) بمقلوبها، مع استخدام مساحيق لطيفة خالية من الفوسفور، وتجفف في الظل للحفاظ على ألق الأنسجة ونعومتها الحريرية.'
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-24 font-sans text-xs md:text-sm text-gray-700 leading-relaxed bg-[#FAF5F0] my-6 md:my-10 rounded-3xl border border-[#DF8A9D]/10" dir="rtl">
      {/* Visual Title Header */}
      <div className="text-center space-y-3 max-w-xl mx-auto mb-12">
        <span className="text-[10px] text-[#A44C5C] tracking-[0.25em] uppercase font-bold flex items-center justify-center gap-1">
          <Sparkles size={12} className="text-[#DF8A9D]/80" />
          SULTA COUTURE FABRICS
        </span>
        <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-[#0B0B0B] mb-2 uppercase tracking-wide">
          دليل الخامات الملكي الفاخر
        </h2>
        <div className="w-16 h-[1.5px] bg-[#A44C5C]/50 mx-auto" />
        <p className="text-gray-500 text-xs md:text-sm pt-2 leading-relaxed font-serif italic">
          ننتقي خيوط الدار من أرقى معالم الأنسجة الإيطالية والمصرية لنحيك لكِ تجربة نوم ملكية تلامس الروح قبل الجسد.
        </p>
      </div>

      {/* Embedded Real-time tactile simulation center */}
      <div className="mb-12 max-w-4xl mx-auto">
        <FabricRealityCenter />
      </div>

      {/* Main Grid Sections - dynamic and mobile responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
        
        {/* Cotton */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-[#DF8A9D]/30 shadow-4xs transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-row-reverse text-[#A44C5C]">
              <span className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-xs">☁️</span>
              <h3 className="font-serif font-black text-xs md:text-sm text-gray-900">{sections.cottonTitleAr}</h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-3xs md:text-xs text-right">{sections.cottonDescAr}</p>
          </div>
        </div>

        {/* Cotton Lycra */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-[#DF8A9D]/30 shadow-4xs transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-row-reverse text-[#A44C5C]">
              <span className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-xs">✨</span>
              <h3 className="font-serif font-black text-xs md:text-sm text-gray-900">{sections.cottonLycraTitleAr}</h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-3xs md:text-xs text-right">{sections.cottonLycraDescAr}</p>
          </div>
        </div>

        {/* Satin Collection */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-[#DF8A9D]/30 shadow-4xs transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-row-reverse text-[#A44C5C]">
              <span className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-xs">🦢</span>
              <h3 className="font-serif font-black text-xs md:text-sm text-gray-900">{sections.satinTitleAr}</h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-3xs md:text-xs text-right">{sections.satinDescAr}</p>
          </div>
        </div>

        {/* Summer Fabrics */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-[#DF8A9D]/30 shadow-4xs transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-row-reverse text-[#A44C5C]">
              <span className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-xs"><Wind size={14} /></span>
              <h3 className="font-serif font-black text-xs md:text-sm text-gray-900">{sections.summerTitleAr}</h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-3xs md:text-xs text-right">{sections.summerDescAr}</p>
          </div>
        </div>

        {/* Winter Fabrics */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-[#DF8A9D]/30 shadow-4xs transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-row-reverse text-[#A44C5C]">
              <span className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-xs"><Snowflake size={14} /></span>
              <h3 className="font-serif font-black text-xs md:text-sm text-gray-900">{sections.winterTitleAr}</h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-3xs md:text-xs text-right">{sections.winterDescAr}</p>
          </div>
        </div>

        {/* Care Instructions */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-[#DF8A9D]/30 shadow-4xs transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-row-reverse text-[#A44C5C]">
              <span className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-xs"><Shield size={14} /></span>
              <h3 className="font-serif font-black text-xs md:text-sm text-gray-900">{sections.careTitleAr}</h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-3xs md:text-xs text-right">{sections.careDescAr}</p>
          </div>
        </div>

        {/* Fabric Benefits */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-[#DF8A9D]/30 shadow-4xs transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-row-reverse text-[#A44C5C]">
              <span className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-xs">👑</span>
              <h3 className="font-serif font-black text-xs md:text-sm text-gray-900">{sections.benefitsTitleAr}</h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-3xs md:text-xs text-right">{sections.benefitsDescAr}</p>
          </div>
        </div>

        {/* Washing Instructions */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-[#DF8A9D]/30 shadow-4xs transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-row-reverse text-[#A44C5C]">
              <span className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-xs"><RefreshCw size={12} className="animate-spin text-[#DF8A9D]" /></span>
              <h3 className="font-serif font-black text-xs md:text-sm text-gray-900">{sections.washingTitleAr}</h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-3xs md:text-xs text-right">{sections.washingDescAr}</p>
          </div>
        </div>

      </div>

      {/* Trust Seal Footer */}
      <div className="mt-12 bg-white/50 backdrop-blur-xs p-5 rounded-2xl border border-gray-150 text-center max-w-xl mx-auto text-3xs md:text-xs space-y-1.5 leading-relaxed">
        <strong className="font-serif uppercase tracking-widest text-[#A44C5C] block mb-1">DESIGNER'S GUARANTEE:</strong>
        جميع قطع SULTA معززة بخدمة ضمان الجودة لمدة عام كامل ضد العيوب المصنعية أو الارتخاء المفرط، تأكيداً لاهتمامنا البالغ بمتعة خلوتك وثقتك المطلقة.
      </div>
    </div>
  );
}
