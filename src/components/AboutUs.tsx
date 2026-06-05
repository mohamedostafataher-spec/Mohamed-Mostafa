import React from 'react';
import { Award, Feather, Sparkles } from 'lucide-react';
import RibbonBowDivider from './RibbonBowDivider';

interface AboutUsProps {
  homepageSections?: any[];
}

export default function AboutUs({ homepageSections = [] }: AboutUsProps) {
  const fallbackStory = {
    title: 'دار سُلْطَة | SULTA HOUSE',
    quote: 'نؤمن أن ملابس النوم ليست مجرد روتين يومي — بل هي طقس يومي لتجديد الطاقة والاعتناء بالذات.',
    section1: {
      title: 'إرثنا الملكي / Our Exquisite Heritage',
      content: 'تأسست دار سُلْطَة لتقديم أنعم أقمشة الكتان والمودال المعالج حرارياً في الشرق الأوسط. كل قطعة من سُلْطَة مصممة بذكاء لتغمركِ بالراحة والسلام. منسوجاتنا الفريدة مبردة ومعالجة لتبقى قابلة للتنفس وانسيابية تماماً.',
      imageUrl: '/src/assets/images/sulta_luxury_lifestyle_about_2_1780682276428.png'
    },
    section2: {
      title: 'فلسفة النعومة الملكية / The Softest Life Philosophy',
      content: 'نمزج بين كوتور ملابس النوم الباريسية وأرقى الأذواق العصرية في الشرق الأوسط. صناعة يدوية مزينة بشرائط وردية، وتفاصيل دقيقة من الدانتيل، نؤمن أن ملابس النوم الفاخرة يجب أن تجعلكِ تشعرين بملكتكِ المتوجة كل ليلة.',
      imageUrl: '/src/assets/images/sulta_luxury_lifestyle_about_1_1780682261409.png'
    },
    pillarsTitle: 'التزامات تليق بكِ / Our Timeless Commitments',
    pillars: [
      { title: 'غزل ملكي / Royal Weave', description: 'خيوط معالجة بالمودال المستقر حرارياً، مما يضمن انسيابية تشبه الحرير ومتانة فائقة.' },
      { title: 'لمسة دقيقة / Fine Finish', description: 'خيطت بعناية في أرقى مشاغل الحياكة، مزودة بفيونكات دانتيل رقيقة وخياطة غير مرئية.' },
      { title: 'قيمة حقيقية / Direct Value', description: 'جسر مباشر من المشغل إلى البوتيك، لضمان جودة الأقمشة الفائقة مع الحفاظ على تسعير عادل.' }
    ]
  };

  const aboutData = homepageSections.find(s => s.section_key === 'about_page')?.content_json || fallbackStory;

  return (
    <div className="bg-[#FAF4F5] min-h-screen animate-fade-in py-12">
      
      {/* Hero Header */}
      <div className="bg-[#FAF5F0] py-20 border-b border-[#DF8A9D]/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-light text-[#0B0B0B] tracking-widest mb-4 uppercase">
            {aboutData.title || 'SULTA HOUSE'}
          </h2>
          <div className="py-2">
            <RibbonBowDivider />
          </div>
          <p className="font-serif italic text-base md:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed mt-4">
            "{aboutData.quote || 'We believe that comfort and elegance are never mutually exclusive.'}"
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20 space-y-24">
        
        {/* Editorial Content Expansion: Provided Artworks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-3xl overflow-hidden shadow-lg border border-pink-100 aspect-[4/5] md:aspect-auto">
             <img 
               src="/src/assets/images/sulta_box_art.png" 
               alt="Sulta Brand Artwork" 
               className="w-full h-full object-cover"
               referrerPolicy="no-referrer"
             />
          </div>
          <div className="flex flex-col justify-center space-y-6 text-right md:pl-12">
            <h4 className="font-serif text-3xl text-[#0B0B0B] font-light italic">عن عالمنا الصغير..</h4>
            <p className="text-gray-500 font-serif leading-relaxed">
              في سُلْطَة، نحن لا نصنع ملابس النوم فحسب، بل نبني عالماً من الراحة التي تبدأ من خيالكِ لتستقر في غرفتكِ. كل تفصيلة في تغليفنا وتصاميمنا مستوحاة من الأناقة الكلاسيكية بلمسة عصرية مرحة.
            </p>
            <div className="flex justify-start">
               <img src="/src/assets/images/wax_seal.png" alt="Sulta Stamp" className="w-16 h-16 object-contain opacity-80" />
            </div>
          </div>
        </div>

        {/* Third Image Grid */}
        <div className="flex flex-col md:flex-row-reverse gap-16 items-center">
            <div className="md:w-1/2 space-y-6 order-2 md:order-1 text-right">
              <h4 className="font-serif text-2xl md:text-3xl text-[#0B0B0B] font-normal tracking-wider uppercase border-b border-[#DF8A9D]/10 pb-4">
                تفرّد التصميم
              </h4>
              <p className="text-sm md:text-base text-gray-650 leading-relaxed font-serif">
                نعتمد في مجموعاتنا على تفاصيل تبرز أنوثتكِ، من الفيونكات الرقيقة إلى الألوان الهادئة التي تمنحكِ شعوراً بالسكينة.
              </p>
            </div>
            <div className="md:w-1/2 order-1 md:order-2 aspect-square overflow-hidden bg-white relative rounded-3xl shadow-md border border-pink-100">
              <img 
                src="/src/assets/images/sulta_lifestyle_art.png" 
                alt="Sulta Aesthetic" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
        </div>

        <div className="text-center">
           <img src="/src/assets/images/shoes_bow.png" alt="Luxury Details" className="w-48 mx-auto opacity-90" />
        </div>

        <div className="py-8">
          <RibbonBowDivider />
        </div>

        {/* Editorial Layout 1 */}
        {aboutData.section1 && (
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="md:w-1/2 space-y-6 order-2 md:order-1">
              <h4 className="font-serif text-2xl md:text-3xl text-[#0B0B0B] font-normal tracking-wider uppercase border-b border-[#DF8A9D]/10 pb-4">
                {aboutData.section1.title}
              </h4>
              <p className="text-sm md:text-base text-gray-650 leading-relaxed font-serif">
                {aboutData.section1.content}
              </p>
            </div>
            {aboutData.section1.imageUrl && (
              <div className="md:w-1/2 order-1 md:order-2 aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-white relative rounded-3xl shadow-md border border-pink-100">
                <img 
                  src={aboutData.section1.imageUrl} 
                  alt={aboutData.section1.title} 
                  className="w-full h-full object-cover opacity-95 hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>
        )}

        {/* Editorial Layout 2 */}
        {aboutData.section2 && (
          <div className="flex flex-col md:flex-row gap-16 items-center">
            {aboutData.section2.imageUrl && (
              <div className="md:w-1/2 aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-white relative rounded-3xl shadow-md border border-pink-100">
                <img 
                  src={aboutData.section2.imageUrl} 
                  alt={aboutData.section2.title} 
                  className="w-full h-full object-cover opacity-95 hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div className="md:w-1/2 space-y-6 text-right">
              <h4 className="font-serif text-2xl md:text-3xl text-[#0B0B0B] font-normal tracking-wider uppercase border-b border-[#DF8A9D]/10 pb-4">
                {aboutData.section2.title}
              </h4>
              <p className="text-sm md:text-base text-gray-655 leading-relaxed font-serif">
                {aboutData.section2.content}
              </p>
            </div>
          </div>
        )}

        {/* Pillars */}
        {aboutData.pillars && aboutData.pillars.length > 0 && (
          <div className="bg-[#FAF5F0] py-16 px-8 text-center border border-[#DF8A9D]/10 rounded-3xl shadow-sm">
            <h4 className="font-serif text-2xl tracking-widest text-[#0B0B0B] font-medium mb-12 uppercase">
              {aboutData.pillarsTitle || 'The Golden Pillars'}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
              {aboutData.pillars.map((pillar: any, idx: number) => (
                <div key={idx} className="flex flex-col items-center space-y-4 bg-white p-6 rounded-2xl shadow-xs border border-pink-50">
                  <Sparkles size={24} className="text-[#A44C5C]" strokeWidth={1.5} />
                  <h5 className="font-serif font-semibold text-sm tracking-widest uppercase text-[#0B0B0B]">{pillar.title}</h5>
                  <p className="text-xs text-gray-500 font-sans leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
