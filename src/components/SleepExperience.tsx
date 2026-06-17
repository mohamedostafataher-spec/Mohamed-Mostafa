import React, { useState } from 'react';
import { Eye, Heart, Moon, ShieldCheck, ShoppingBag, Sparkles, Star, Sun, Wind } from 'lucide-react';
import { Product } from '../types';
import { cleanImgUrl } from '../services/db';
import { ProductPrice } from './ProductPrice';

interface SleepExperienceProps {
  products: Product[];
  country: 'EG' | 'SA';
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
}

export default function SleepExperience({
  products,
  country,
  favorites,
  toggleFavorite,
  onSelectProduct
}: SleepExperienceProps) {
  const currencyLabel = country === 'EG' ? 'EGP' : 'SAR';
  const recommendations = products.filter(p => p.status === 'active' && p.category === 'sleepwear').slice(0, 3);

  // Experience Tips State
  const [activeTip, setActiveTip] = useState<number>(0);

  const tips = [
    {
      title: '١. ميزة الحرير الدائري للبشرة والشعر',
      desc: 'على عكس القطن والكتان الخشن، الحرير الطبيعي لا يمتص الرطوبة الطبيعية ومستحضرات تجميل الليل من بشرتك، بل يعمل كطبقة تزلج واقية تحول دون تجعدات الوجه الصباحية وتساقط خصلات الشعر الحساسة.',
      benefit: 'حماية مسامات البشرة الحساسة'
    },
    {
      title: '٢. التنفس ونقاء الجسد ليلاً',
      desc: 'بيجامات سولتة مصممة بنسب فضفاضة ملكية لعدم تقييد الشرايين والأوعية اللمفاوية أثناء النوم، مما يؤمن تهوية فائقة بفضل مسامات الساتان المغسول بمبرد حراري بارد وصحي.',
      benefit: 'التهوية العميقة وتنقية العضلات'
    },
    {
      title: '٣. طقوس العطر والتهيئة الملكية',
      desc: 'اجعلي طقس ارتدائك لبيجامة سولتة بمثابة إعلان رسمي لعقلك عن بدء الاسترخاء. رشي القليل من رذاذ اللافندر البري على أكمام الدانتيل وتنفسي بعمق لخمس دورات متصلة.',
      benefit: 'تثبيت هرمونات الاسترخاء العميق'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-right" dir="rtl">
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <div className="flex justify-center items-center gap-1.5 text-[#A44C5C] text-xs font-serif tracking-widest font-bold">
          <Moon size={14} className="text-[#A44C5C]" />
          <span>SULTA SLEEP CONTEXT & WELLNESS</span>
        </div>
        <h2 className="font-serif text-3xl md:text-4xl font-light text-[#0B0B0B] tracking-wide">
          تجربة النوم الملوكية | SULTA Sleep Experience
        </h2>
        <div className="w-16 h-[1px] bg-[#A44C5C]/30 mx-auto my-3" />
        <p className="text-gray-500 text-xs leading-relaxed max-w-lg mx-auto">
          النوم ليس غياباً عن الوعي، بل هو مراسم راقية لإكرام النفس والجسد. صممنا بيجاماتنا خصيصاً بمقاييس الكوتور الحريرية لتوفير الرفاهية الكاملة لوجهكِ وبشرتكِ.
        </p>
      </div>

      {/* Wellness interactive guide layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white rounded-[2.5rem] p-6 md:p-10 border border-[#DF8A9D]/12 shadow-sm mb-16">
        
        {/* Left column - Content & selector */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-[#A44C5C] tracking-[0.25em] uppercase block">
              HEALTH & BEAUTY DICTATE | صحتك وجمالك في الليل
            </span>
            <h3 className="font-serif text-2xl font-light text-[#0B0B0B]">
              لماذا الحرير والساتان من SULTA؟
            </h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              تصفحي الدليل التفصيلي والطقوس الموصى بها من أطباء البشرية والجلدية وخبراء الأزياء الملكية بباريس لتحصلي على أقصى سُموّ واسترخاء.
            </p>
          </div>

          {/* Interactive tabs */}
          <div className="space-y-4">
            {tips.map((tip, idx) => {
              const isOpen = activeTip === idx;
              return (
                <div 
                  key={idx}
                  onClick={() => setActiveTip(idx)}
                  className={`p-5 rounded-2xl border transition-all duration-500 text-right cursor-pointer ${
                    isOpen 
                      ? 'bg-[#0B0B0B] text-white border-black shadow-md' 
                      : 'bg-[#FAF4F5]/50 hover:bg-[#FAF4F5] border-transparent text-gray-700'
                  }`}
                >
                  <h4 className={`text-xs font-semibold ${isOpen ? 'text-[#F6E7A6]' : 'text-gray-800'}`}>{tip.title}</h4>
                  {isOpen && (
                    <div className="mt-2 text-[11.5px] leading-relaxed text-gray-300 animate-slide-up">
                      <p className="mb-2">{tip.desc}</p>
                      <span className="inline-block bg-[#F6E7A6]/10 text-[#F6E7A6] px-2 py-0.5 rounded text-[8.5px] font-bold">
                        ✦ عَيْد الفَائِدَة: {tip.benefit}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column - Beautiful atmospheric visual cards */}
        <div className="lg:col-span-5 flex flex-col justify-center items-center bg-[#FAF5F0] p-8 rounded-[2rem] border border-[#DF8A9D]/10 text-center space-y-6">
          <div className="w-16 h-16 bg-[#A44C5C]/15 text-[#A44C5C] rounded-full flex items-center justify-center animate-pulse">
            <Moon size={32} />
          </div>
          <div className="space-y-2">
            <h4 className="font-serif text-sm font-semibold text-gray-900">هرمونية السكون الداخلي</h4>
            <p className="text-[10px] text-gray-400 max-w-xs font-sans leading-relaxed">
              "الحرير يهمس بلطف لجسدكِ أنه قد حان الوقت لتوديع تعب العالم والشعور بالسكينة والنقاء."
            </p>
          </div>
          <div className="flex justify-center gap-6 pt-2 text-[#A44C5C] text-xs font-sans">
            <div className="flex flex-col items-center gap-1">
              <span className="font-bold">١٠٠٪</span>
              <span className="text-[9px] text-gray-500 text-3xs uppercase">ساتان فاخر غسيل غازي</span>
            </div>
            <div className="h-8 w-[1px] bg-[#A44C5C]/20" />
            <div className="flex flex-col items-center gap-1">
              <span className="font-bold">ثقيل</span>
              <span className="text-[9px] text-gray-500 text-3xs uppercase">وزن النسيج الإمبريالي</span>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Sleep wear curated selections */}
      <div>
        <div className="border-b border-gray-150 pb-4 mb-8">
          <h3 className="font-serif text-lg font-medium text-[#0B0B0B]">أبطال النوم والأناقة | Curated Sleeping Pieces</h3>
          <p className="text-gray-400 text-2xs mt-1">القطع الأكثر ملاءمة وفخامة ليالي النوم المرفهة والممتازة.</p>
        </div>

        {recommendations.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recommendations.map((prod) => {
              const priceVal = country === 'EG' ? prod.priceEG : prod.priceSA;
              const imgToUse = cleanImgUrl(prod.images[0], prod.category);

              return (
                <div
                  key={prod.id}
                  onClick={() => onSelectProduct(prod)}
                  className="group flex flex-col h-full bg-white rounded-2xl p-3 overflow-hidden border border-[#DF8A9D]/10 hover:border-[#DF8A9D]/30 transition-all duration-300 hover:shadow-md relative select-none cursor-pointer"
                >
                  <div className="absolute top-4 left-4 z-10 font-bold bg-white/95 text-[8.5px] px-2.5 py-0.5 rounded-full text-[#A44C5C] border border-[#DF8A9D]/12">
                     حرير نوم ✦ SILK COMFORT
                  </div>

                  <div className="relative aspect-[3/4] overflow-hidden bg-[#FAF5F0] rounded-xl mb-3">
                    <img
                      src={imgToUse}
                      alt={prod.nameAr}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[800ms] opacity-95"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="space-y-1 text-center mt-auto flex flex-col items-center">
                    <h4 className="text-3xs sm:text-2xs md:text-xs font-semibold text-[#0B0B0B] line-clamp-1 font-serif tracking-wide text-center">
                      {country === 'EG' ? prod.nameAr : prod.nameEn}
                    </h4>
                    <div className="mt-1.5 flex flex-col items-center">
                      <ProductPrice product={prod} country={country} size="sm" showBadge={true} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-neutral-50 rounded-2xl text-gray-400 text-xs italic">
            لا توجد توصيات ملابس نوم مسجلة في هذا التصنيف حالياً.
          </div>
        )}
      </div>
    </div>
  );
}
