import SultaImage from "./SultaImage";
import React, { useState } from 'react';
import { Award, Feather, Sparkles, Palette, Camera, BookOpen, Copy, Check } from 'lucide-react';
import RibbonBowDivider from './RibbonBowDivider';
import { cleanImgUrl } from '../services/db';

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
      imageUrl: cleanImgUrl('fallback', 'sleepwear')
    },
    section2: {
      title: 'فلسفة النعومة الملكية / The Softest Life Philosophy',
      content: 'نمزج بين كوتور ملابس النوم الباريسية وأرقى الأذواق العصرية في الشرق الأوسط. صناعة يدوية مزينة بشرائط وردية، وتفاصيل دقيقة من الدانتيل، نؤمن أن ملابس النوم الفاخرة يجب أن تجعلكِ تشعرين بملكتكِ المتوجة كل ليلة.',
      imageUrl: cleanImgUrl('fallback', 'loungewear')
    },
    pillarsTitle: 'التزامات تليق بكِ / Our Timeless Commitments',
    pillars: [
      { title: 'غزل ملكي / Royal Weave', description: 'خيوط معالجة بالمودال المستقر حرارياً، مما يضمن انسيابية مذهلة ومتانة فائقة.' },
      { title: 'لمسة دقيقة / Fine Finish', description: 'خيطت بعناية في أرقى مشاغل الحياكة، مزودة بفيونكات دانتيل رقيقة وخياطة غير مرئية.' },
      { title: 'قيمة حقيقية / Direct Value', description: 'جسر مباشر من المشغل إلى البوتيك، لضمان جودة الأقمشة الفائقة مع الحفاظ على تسعير عادل.' }
    ]
  };

  const aboutData = homepageSections.find(s => s.section_key === 'about_page')?.content_json || fallbackStory;

  return (
    <div className="bg-[#FAF4F5] min-h-screen animate-fade-in py-12" dir="rtl">
      
      {/* Hero Header */}
      <div className="bg-[#FAF5F0] py-20 border-b border-[#DF8A9D]/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-light text-[#0B0B0B] tracking-widest mb-4 uppercase">
            {aboutData.title || 'SULTA HOUSE'}
          </h2>
          <div className="py-2">
            <RibbonBowDivider />
          </div>
          <p className="font-serif text-base md:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed mt-4">
            "{aboutData.quote || 'We believe that comfort and elegance are never mutually exclusive.'}"
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20 space-y-24">
        
        {/* Editorial Content Expansion: Provided Artworks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-3xl overflow-hidden shadow-lg border border-pink-100 aspect-[4/5] md:aspect-auto">
             <SultaImage src={cleanImgUrl("fallback", "collections")} alt="Sulta Brand Artwork" className="w-full h-full" imgClassName="object-cover" />
          </div>
          <div className="flex flex-col justify-center space-y-6 text-right md:pr-12">
            <h4 className="font-serif text-3xl text-[#0B0B0B] font-light">عن عالمنا الصغير..</h4>
            <p className="text-gray-500 font-serif leading-relaxed">
              في سُلْطَة، نحن لا نصنع ملابس النوم فحسب، بل نبني عالماً من الراحة التي تبدأ من خيالكِ لتستقر في غرفتكِ. كل تفصيلة في تغليفنا وتصاميمنا مستوحاة من الأناقة الكلاسيكية بلمسة عصرية مرحة.
            </p>
            <div className="flex justify-start">
               <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center shadow-md border border-white">
                 <span className="text-white text-lg font-serif">✨</span>
               </div>
            </div>
          </div>
        </div>

        {/* Third Image Grid */}
        <div className="flex flex-col md:flex-row-reverse gap-16 items-center">
            <div className="md:w-1/2 space-y-6 order-2 md:order-1 text-right">
              <h4 className="font-serif text-2xl md:text-3xl text-[#0B0B0B] font-normal tracking-wider uppercase border-b border-[#DF8A9D]/10 pb-4">
                تفرّد التصميم
              </h4>
              <p className="text-sm md:text-base text-gray-655 leading-relaxed font-serif">
                نعتمد في مجموعاتنا على تفاصيل تبرز أنوثتكِ، من الفيونكات الرقيقة إلى الألوان الهادئة التي تمنحكِ شعوراً بالسكينة.
              </p>
            </div>
            <div className="md:w-1/2 order-1 md:order-2 aspect-square overflow-hidden bg-white relative rounded-3xl shadow-md border border-pink-100">
               <SultaImage src={cleanImgUrl("fallback", "loungewear")} alt="Sulta Aesthetic" className="w-full h-full" imgClassName="object-cover" />
            </div>
        </div>

        <div className="text-center">
           <SultaImage src={cleanImgUrl("fallback", "sleepwear")} alt="Luxury Details" className="w-48 mx-auto opacity-90 rounded-2xl" imgClassName="object-cover" />
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
                <SultaImage src={cleanImgUrl(aboutData.section1.imageUrl, "sleepwear")} alt={aboutData.section1.title} className="w-full h-full" imgClassName="object-cover opacity-95 hover:scale-105 transition-transform duration-700" />
              </div>
            )}
          </div>
        )}

        {/* Editorial Layout 2 */}
        {aboutData.section2 && (
          <div className="flex flex-col md:flex-row gap-16 items-center">
            {aboutData.section2.imageUrl && (
              <div className="md:w-1/2 aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-white relative rounded-3xl shadow-md border border-pink-100">
                <SultaImage src={cleanImgUrl(aboutData.section2.imageUrl, "loungewear")} alt={aboutData.section2.title} className="w-full h-full" imgClassName="object-cover opacity-95 hover:scale-105 transition-transform duration-700" />
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

        {/* 🎀 SULTA BRAND STRATEGY & VISUAL IDENTITY SYSTEM 🎀 */}
        <div className="mt-20 border-t border-[#DF8A9D]/20 pt-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-[10px] text-[#A44C5C] tracking-[0.3em] font-bold uppercase block">
              SULTA ATELIER BRAND GUIDELINES
            </span>
            <h3 className="font-serif text-3xl md:text-4xl text-[#0B0B0B] font-light">
              نظام الهوية البصرية والاستراتيجية الموحدة لعلامة SULTA 👑
            </h3>
            <p className="text-xs md:text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
              وفقاً لاستراتيجيتنا الموحدة، تم تصميم ألوان وصور المتجر لتعكس الفخامة المطلقة (Couture Luxury) والتفرد من خلال تباين ملكي مدروس وتصوير فني دافئ.
            </p>
            <div className="py-2">
              <RibbonBowDivider />
            </div>
          </div>

          {/* Grid Layout for Brand Identity Elements */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12 items-stretch">
            
            {/* Left: Swatches with live copy interaction */}
            <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-3xl shadow-xs border border-pink-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Palette className="text-[#DF8A9D]" size={20} />
                  <h4 className="font-serif text-lg font-semibold text-[#0B0B0B]">لوحة الألوان الملكية الموحدة</h4>
                </div>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                  هذه هي اللوحة الرسمية التي توحد جميع زوايا SULTA. انقري على أي مربع لون لنسخ رمز اللون الـ (Hex Code) فوراً واستخدامه في حملاتك التسويقية:
                </p>
                
                <div className="space-y-4">
                  {[
                    { hex: '#0B0B0B', name: 'أسود مخملي ملوكي (Midnight Velvet Black)', desc: 'يرمز للسيادة العريقة والأناقة الكلاسيكية الفائقة.', text: 'text-[#FAF5F0]' },
                    { hex: '#DF8A9D', name: 'وردي ناعم مخملي (Soft Pink)', desc: 'لون الأنوثة والدلال الحالم والفيونكات اليدوية الرقيقة.', text: 'text-[#0B0B0B]' },
                    { hex: '#A44C5C', name: 'بورغندي فاخر (Royal Burgundy)', desc: 'يمثل التطريزات النادرة وشغف كوتور مشاغلنا الفاخرة.', text: 'text-[#FAF5F0]' },
                    { hex: '#DBC082', name: 'ذهبي شامبين لامع (Champagne Gold)', desc: 'يعكس بريق الأزرار الملكية والحفر المذهب لصناديق الهدايا.', text: 'text-[#0B0B0B]' },
                    { hex: '#FAF5F0', name: 'عاجي أوف وايت دافئ (Off-White)', desc: 'يحاكي ملمس النسيج الخام المبرد ويريح عين الزبونة الفاخرة.', text: 'text-[#0B0B0B]' }
                  ].map((color, i) => {
                    const [isCopied, setIsCopied] = useState(false);
                    const handleCopy = () => {
                      navigator.clipboard.writeText(color.hex);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    };
                    return (
                      <div 
                        key={i}
                        onClick={handleCopy}
                        className="flex items-center justify-between p-3.5 rounded-2xl border border-stone-100 hover:border-[#DF8A9D]/30 hover:shadow-xs transition-all duration-300 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5">
                          <div 
                            className="w-11 h-11 rounded-xl shadow-xs border border-white/20 transition-transform duration-300 group-hover:scale-105 flex items-center justify-center"
                            style={{ backgroundColor: color.hex }}
                          >
                            <span className={`text-[10px] font-mono font-bold ${color.text} opacity-0 group-hover:opacity-80 transition-opacity`}>S</span>
                          </div>
                          <div className="text-right">
                            <span className="block text-xs font-bold text-[#0B0B0B] group-hover:text-[#A44C5C] transition-colors">{color.name}</span>
                            <span className="block text-[10px] text-gray-500 leading-normal mt-0.5">{color.desc}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-stone-400 group-hover:text-[#DF8A9D] transition-colors pl-1">
                          <span className="font-mono text-[10px] font-bold">{color.hex}</span>
                          {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={11} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-stone-100 text-[10px] text-stone-400 text-center font-mono uppercase tracking-widest">
                SULTA COLOR METRICS — OFFICIALLY VERIFIED
              </div>
            </div>

            {/* Right: Photography Strategy & Fabric Simulator */}
            <div className="lg:col-span-5 space-y-8 flex flex-col justify-between">
              
              {/* Photo Strategy Card */}
              <div className="bg-white p-6 rounded-3xl shadow-xs border border-pink-100 flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <Camera className="text-[#A44C5C]" size={20} />
                  <h4 className="font-serif text-lg font-semibold text-[#0B0B0B]">استراتيجية الصور الموحدة</h4>
                </div>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                  للحفاظ على رونق ملوكي موحد، تخضع جميع لقطات ومنتجات دار SULTA لثلاث قواعد ذهبية للتصوير الفني:
                </p>
                <ul className="space-y-3.5 text-right">
                  <li className="flex items-start gap-2.5">
                    <span className="text-sm">📷</span>
                    <div>
                      <strong className="block text-xs text-[#0B0B0B] font-serif">الإضاءة النهارية الناعمة (Daylight)</strong>
                      <span className="block text-[10px] text-gray-500 mt-0.5">الابتعاد التام عن الفلاشات الصناعية القوية؛ تُصور البيجامات دائماً بجانب النوافذ للحصول على ظلال المنسوجات الحقيقية الناعمة.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-sm">🌸</span>
                    <div>
                      <strong className="block text-xs text-[#0B0B0B] font-serif">اللقطات الوجدانية والتفاصيل الفائقة (Focus)</strong>
                      <span className="block text-[10px] text-gray-500 mt-0.5">التركيز على خياطة الدانتيل، فيونكات الأشرطة، ولمعة ألياف المودال لتبسيط الشعور بالنعومة قبل الشراء.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-sm">📦</span>
                    <div>
                      <strong className="block text-xs text-[#0B0B0B] font-serif">دمج علبة التغليف الملكي</strong>
                      <span className="block text-[10px] text-gray-500 mt-0.5">تظهر العلبة الملكية بشريطها المربوط يدوياً في خلفية كل فوتوسيشن، للتأكيد على أن كل طرد هو هدية ملكية جاهزة.</span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Fabric Contrast Simulator */}
              <div className="bg-[#FAF5F0] p-6 rounded-3xl border border-[#DF8A9D]/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="text-[#DBC082]" size={18} />
                    <h4 className="font-serif text-sm font-semibold text-[#0B0B0B]">محاكي التباين والمنسوجات</h4>
                  </div>
                  <span className="text-[9px] bg-white text-[#A44C5C] font-bold px-2 py-0.5 rounded-full shadow-2xs">تفاعلي</span>
                </div>
                <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
                  قومي بتبديل نوع القماش الملكي أدناه لمعاينة التباين الاستراتيجي المعتمد بين الألوان والتطريزات:
                </p>
                
                {(() => {
                  const [activeFabric, setActiveFabric] = useState('silk');
                  const fabrics = [
                    { id: 'silk', name: 'القطن الفاخر', colorHex: '#DF8A9D', bg: 'bg-[#A44C5C]', border: 'border-[#DF8A9D]/50', text: 'text-[#DF8A9D]', fontColor: '#FAF5F0', badge: 'وردية كوتور' },
                    { id: 'satin', name: 'النسيج المبرد', colorHex: '#0B0B0B', bg: 'bg-[#FAF5F0]', border: 'border-[#DBC082]/50', text: 'text-[#0B0B0B]', fontColor: '#A44C5C', badge: 'تطريز ذهبي' },
                    { id: 'lace', name: 'الدانتيل الفرنسي', colorHex: '#FAF5F0', bg: 'bg-[#A44C5C]', border: 'border-white/40', text: 'text-[#FAF5F0]', fontColor: '#FAF5F0', badge: 'أبيض عاجي' }
                  ];
                  const currentFab = fabrics.find(f => f.id === activeFabric) || fabrics[0];
                  
                  return (
                    <div className="space-y-4">
                      {/* Tabs */}
                      <div className="flex gap-2 justify-center">
                        {fabrics.map((fab) => (
                          <button
                            key={fab.id}
                            onClick={() => setActiveFabric(fab.id)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                              activeFabric === fab.id 
                                ? 'bg-[#0C0C0C] text-[#FAF5F0] shadow-xs' 
                                : 'bg-white text-gray-400 hover:text-[#0C0C0C]'
                            }`}
                          >
                            {fab.name}
                          </button>
                        ))}
                      </div>

                      {/* Interactive Canvas View */}
                      <div className={`p-4 rounded-2xl ${currentFab.bg} border ${currentFab.border} transition-all duration-500 text-center space-y-2 relative overflow-hidden min-h-[90px] flex flex-col justify-center`}>
                        {/* Elegant watermark */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                          <span className="font-serif text-5xl uppercase tracking-[0.2em] font-bold text-white">SULTA</span>
                        </div>
                        <span className="text-[10px] text-[#DBC082] tracking-widest font-mono uppercase block z-1">SULTA ATELIER STANDARD</span>
                        <h5 className="font-serif text-base font-light z-1" style={{ color: currentFab.fontColor }}>
                          نعومةٌ تليقُ بِمَلِكَة
                        </h5>
                        <p className="text-[10px] z-1 leading-normal opacity-90" style={{ color: currentFab.fontColor }}>
                          مزيج فاخر من {currentFab.name} مع {currentFab.badge} المطعم يدوياً.
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
