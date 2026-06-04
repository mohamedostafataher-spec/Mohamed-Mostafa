import React from 'react';
import { Award, Feather, Sparkles } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="bg-[#FAFAF7] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Story Intro */}
        <div className="text-center mb-16">
          <span className="font-serif italic text-xs tracking-[0.2em] text-gray-400 block mb-3 uppercase">
            The Sulta Story • حكاية الأنوثة المترفة
          </span>
          <h2 className="font-serif text-3xl md:text-5xl font-light text-[#0B0B0B] tracking-wide mb-6">
            من نحن وعالم سولتا
          </h2>
          <div className="w-16 h-0.5 bg-[#F4B6C2] mx-auto mb-6" />
          <p className="font-serif italic text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            "نؤمن في سولتا أن الراحة والأنوثة لا تتعارضان أبداً، بل يمتزجان ليصنعا لحظات تفيض بالدلال والترف في منزلك."
          </p>
        </div>

        {/* Magazine Style Grid Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-16">
          <div className="order-2 md:order-1 space-y-4">
            <h4 className="font-serif text-lg md:text-xl text-gray-900 font-bold tracking-wide">
              البداية وشغف الأناقة المنزلية
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed font-sans">
              تأسست علامة <strong>SULTA</strong> لتصميم البيجامات الفاخرة لتكون ملاذاً هادئاً لكل امرأة تبحث عن التفرد حتى في أوقات نومها واستجمامها في المنزل. لقد لاحظنا غياب التصاميم التي تمزج حقاً بين الراحة القصوى الخالية من العيوب، والجاذبية الملكية الفائقة.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed font-sans">
              من هنا، انطلقت ورش عملنا لاختيار أرقى المنسوجات والساتان المطور بنعومة تضاهي الحرير الطبيعي، وخيوط الحرير الذهبية، والقطن المصري العضوي الذي تنام جودته الأعين الهانئة باطمئنان وتدوم جودته لسنوات طويلة.
            </p>
          </div>
          <div className="order-1 md:order-2 aspect-[4/3] rounded-3xl overflow-hidden bg-gray-100 shadow-md flex items-center justify-center p-8 text-center text-gray-300">
            [مساحة مخصصة لصورة الاستوديو والأقمشة]
          </div>
        </div>

        {/* Magazine Style Grid Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-16">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-gray-100 shadow-md flex items-center justify-center p-8 text-center text-gray-300">
            [مساحة مخصصة لصورة التغليف الفاخر]
          </div>
          <div className="space-y-4">
            <h4 className="font-serif text-lg md:text-xl text-gray-900 font-bold tracking-wide">
              رؤيتنا ورسالتنا الملكية
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed font-sans">
              <strong>رؤيتنا:</strong> أن نقود عرش ملابس النوم واللانج وير الفاخر في منطقة الشرق الأوسط والعالم، لنكون العلامة الأولى التي تتبادر لذهن كل فتاة فخورة بأنوثتها وتبحث عن الدلال الهادئ.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed font-sans">
              <strong>رسالتنا:</strong> تصميم وصنع قطع تضاهي أرقى بيوت الكوتور الباريسية، وتقديمها في بكج مخملي فاخر يمنحك تجربة تسوق راقية لا تُنسى من اللحظة الأولى وحتى ارتدائها.
            </p>
          </div>
        </div>

        {/* Core Pillars Icon Matrix */}
        <div className="bg-[#0B0B0B] text-white rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#F6E7A6]/10 blur-2xl rounded-full" />
          
          <h4 className="font-serif text-xl tracking-wider text-[#F6E7A6] font-light text-center mb-10">
            ركائز سولتا الذهبية الثلاث
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FAFAF7]/10 flex items-center justify-center text-[#F4B6C2]">
                <Feather size={20} />
              </div>
              <h5 className="font-semibold text-xs md:text-sm text-[#FAFAF7] tracking-wider">خفة منسوجات مطلقة</h5>
              <p className="text-[11px] md:text-xs text-gray-400 max-w-[200px] leading-relaxed">
                خامات معالجة ضد التوبر والحساسية توفر برودة مريحة في الصيف ودفئاً أنيقاً في الشتاء.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FAFAF7]/10 flex items-center justify-center text-[#F6E7A6]">
                <Award size={20} />
              </div>
              <h5 className="font-semibold text-xs md:text-sm text-[#FAFAF7] tracking-wider">لمسات كوتور يدوية</h5>
              <p className="text-[11px] md:text-xs text-gray-400 max-w-[200px] leading-relaxed">
                أزرار لؤلؤية طبيعية وخياطة مزدوجة بالحرير لضمان تفرد ملمس الخياطة وعدم ضيقها.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FAFAF7]/10 flex items-center justify-center text-white">
                <Sparkles size={20} />
              </div>
              <h5 className="font-semibold text-xs md:text-sm text-[#FAFAF7] tracking-wider">صناعة ذكريات الدلال</h5>
              <p className="text-[11px] md:text-xs text-gray-400 max-w-[200px] leading-relaxed">
                التغليف الفاخر والاهتمام بأدق التفاصيل يمنحك إحساس الأميرات في كل شحنة.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
