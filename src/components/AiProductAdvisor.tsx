import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, UserCheck, Heart, ShoppingBag, Stars, RefreshCw } from 'lucide-react';
import { Product } from '../types';

interface AiProductAdvisorProps {
  allProducts?: Product[];
  onSelectProduct?: (p: Product) => void;
}

export default function AiProductAdvisor({ allProducts = [], onSelectProduct }: AiProductAdvisorProps) {
  const [step, setStep] = useState<number>(0); // 0 = Welcome, 1-4 = Quiz, 5 = Recommendation Results
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loadingResults, setLoadingResults] = useState<boolean>(false);

  const stepsData = [
    {
      id: 'touch',
      questionAr: '١. ما هو ملمس وثوب النوم المفضل لديكِ والأنسب لبشرتكِ؟',
      options: [
        { key: 'silk', titleAr: 'حرير التوت الطبيعي الإيطالي (Italian Pure Silk)', descAr: 'لمسة غنية دافئة، بروتينية لطيفة وحماية كاملة للجلد.' },
        { key: 'satin', titleAr: 'ساتان كوتور المرن الممتاز (High-Lustre Satin)', descAr: 'لمعان متلالئ براق، انسيابية ارتدادية ومثالية للحركة.' },
        { key: 'cotton', titleAr: 'الكتان والقطن المصري العضوي (Egyptian Cotton)', descAr: 'نعومة قطنية دافئة هادئة تمتص الرطوبة ومريحة جداً غسيل متكرر.' }
      ]
    },
    {
      id: 'fit',
      questionAr: '٢. ما هي قصة pajamas أو فستان النوم المفضلة لقوامكِ المترف؟',
      options: [
        { key: 'classic', titleAr: 'البجامات الكلاسيكية ذات الأزرار والأطواق المفتوحة', descAr: 'رسمية، مريحة وأنيقة مستوحاة من البيوت الباريسية.' },
        { key: 'robe', titleAr: 'أرواب الكيمونو الفخمة المزينة بالدانتيل المفرغ كوتور', descAr: 'أنثوية بالغة الرقة والجاذبية مع شريط خصر مائل.' },
        { key: 'oversized', titleAr: 'أطقم فضفاضة ومكشوفة الأكتاف (Oversized Loungewear)', descAr: 'للراحة الأرستقراطية القصوى والتنقل الحر بأرجاء البيت.' }
      ]
    },
    {
      id: 'event',
      questionAr: '٣. ما هي المناسبة والحدث الأساسي لارتداء هذه القطعة الساحرة؟',
      options: [
        { key: 'bridal', titleAr: 'تجهيزات العرس الفخم وصباحية ليلة الزفاف (Bridal Selection)', descAr: 'رقي مطلق وتطريز مذهب لتبدي مبهجة وخاطفة للأنظار.' },
        { key: 'lounge', titleAr: 'الاسترخاء اليومي وقراءة الكتب بجوار المدفأة بأناقة هادئة', descAr: 'خامات مقاومة للتعبئة وهادئة تليق بقهوة المساء.' },
        { key: 'gift', titleAr: 'هدايا استثنائية لصديقة غالية أو أخت منسقة بصندوق شمع فخم', descAr: 'التغليف كتحفة فخمة تليق بروابط المحبة والمودة.' }
      ]
    },
    {
      id: 'vibe',
      questionAr: '٤. ما هي عائلة الألوان التي تعبر عن مزاجكِ وتثير عاطفتكِ؟',
      options: [
        { key: 'nude', titleAr: 'درجات النود والوردي الفرنسي الهادئ والوردي البودرة', descAr: 'أنثوية دافئة هادئة مريحة وودية جداً للنظر.' },
        { key: 'dark', titleAr: 'الأسود الفاحم الأرستقراطي والأخضر الكافيار الزمردي الغامق', descAr: 'هيبة ملكية بالغة الفخامة، حدة، قوة وتميز بامتصاص الضوء.' },
        { key: 'gold', titleAr: 'الأبيض العاجي المشرق والبيج الذهبي والذهبي الهلامي الفاتح', descAr: 'رومانسية عتيقة كلاسيكية تشبه أجنحة الفنادق السويسرية.' }
      ]
    }
  ];

  const handleSelectOption = (key: string) => {
    const currentQuestionKey = stepsData[step - 1].id;
    const nextAnswers = { ...answers, [currentQuestionKey]: key };
    setAnswers(nextAnswers);

    if (step < stepsData.length) {
      setStep(step + 1);
    } else {
      setLoadingResults(true);
      setStep(5);
      // Play styling processing chime
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // La note
        osc.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.15); // C# note
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } catch (e) {}

      setTimeout(() => {
        setLoadingResults(false);
      }, 1500);
    }
  };

  // Algorithmic pyjamas product-ranking selection system matching user preferences
  const getRecommendedProducts = () => {
    if (allProducts.length === 0) return [];

    const scored = allProducts.map((p) => {
      let score = 50; // base score

      const nameLower = (p.nameAr + p.nameEn + p.descriptionAr + p.descriptionEn).toLowerCase();

      // Question 1 matching (fabric)
      if (answers.touch === 'silk' && (nameLower.includes('حرير') || nameLower.includes('silk') || nameLower.includes('mulberry'))) score += 30;
      if (answers.touch === 'satin' && (nameLower.includes('ساتان') || nameLower.includes('satin') || nameLower.includes('شريط'))) score += 35;
      if (answers.touch === 'cotton' && (nameLower.includes('قطن') || nameLower.includes('cotton') || nameLower.includes('كتان'))) score += 30;

      // Question 2 matching (silhouette)
      if (answers.fit === 'classic' && (nameLower.includes('كلاسيك') || nameLower.includes('طقم') || nameLower.includes('بجامة'))) score += 25;
      if (answers.fit === 'robe' && (nameLower.includes('روب') || nameLower.includes('كيمونو') || nameLower.includes('دانتيل') || nameLower.includes('robe'))) score += 35;
      if (answers.fit === 'oversized' && (nameLower.includes('فضفاض') || nameLower.includes('واسع') || nameLower.includes('lounge'))) score += 25;

      // Question 3 matching (event)
      if (answers.event === 'bridal' && (nameLower.includes('عروس') || nameLower.includes('زفاف') || nameLower.includes('bridal') || nameLower.includes('أبيض'))) score += 30;
      if (answers.event === 'lounge' && (p.isBestSeller || nameLower.includes('رغوة') || nameLower.includes('مطاط'))) score += 20;

      // Question 4 matching (colors)
      if (answers.vibe === 'nude' && (nameLower.includes('وردي') || nameLower.includes('زهري') || nameLower.includes('بينك') || nameLower.includes('pink'))) score += 35;
      if (answers.vibe === 'dark' && (nameLower.includes('أسود') || nameLower.includes('فاحم') || nameLower.includes('كافيار') || nameLower.includes('black') || nameLower.includes('زمرد'))) score += 35;
      if (answers.vibe === 'gold' && (nameLower.includes('ذهبي') || nameLower.includes('بيج') || nameLower.includes('ذهبي') || nameLower.includes('gold') || nameLower.includes('أبيض'))) score += 35;

      return { product: p, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(x => ({ ...x.product, matchRate: Math.min(100, x.score) }));
  };

  const recommendations = getRecommendedProducts();

  return (
    <div className="bg-[#FAF9F5] rounded-3.5xl border border-[#FAFAF7] p-6 md:p-8 space-y-6 text-right font-sans relative overflow-hidden shadow-xs" id="sulta_ai_advisor">
      {/* Decorative vector sparks */}
      <div className="absolute right-0 top-0 w-48 h-48 bg-amber-200/5 rounded-full blur-2xl pointer-events-none" />

      {/* Welcome Step (0) */}
      {step === 0 && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="text-center py-6 space-y-5"
        >
          <div className="w-16 h-16 bg-[#0B0B0B] text-[#F6E7A6] rounded-full flex items-center justify-center mx-auto shadow-xl">
            <Sparkles size={28} className="animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#A44C5C] block mb-1">AI Personal Styling Assistant</span>
            <h4 className="font-serif text-2xl font-bold text-gray-950">مستشارة الأناقة الرقمية من SULTA 👑</h4>
            <p className="text-gray-500 text-xs mt-2 max-w-md mx-auto leading-relaxed">
              مرحباً بكِ في أتيلييه سولتا للاستشارات الإرشادية الفاخرة. قومي بتوجيه خبيرتنا الرقمية للإجابة على ٤ تفضيلات ذوقية مخصصة، لنرسم لكِ البجامة والقطع الأنسب لجمالكِ الأخاذ.
            </p>
          </div>
          <button
            onClick={() => setStep(1)}
            type="button"
            className="bg-[#0B0B0B] hover:bg-[#A44C5C] hover:scale-103 active:scale-98 text-[#F6E7A6] text-xs font-sans font-bold px-8 py-3.5 rounded-2xl transition-all cursor-pointer shadow-md"
          >
            دعنا نبدأ الاستشارة الشخصية ✦
          </button>
        </motion.div>
      )}

      {/* Quiz Steps (1-4) */}
      {step >= 1 && step <= 4 && (
        <motion.div 
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center border-b border-gray-200/60 pb-3 flex-row-reverse text-right font-sans">
            <span className="text-xs bg-[#A44C5C]/5 text-[#A44C5C] font-semibold px-3 py-1 rounded-full text-[10px]">الخطوة {step} من ٤</span>
            <button
              onClick={() => setStep(step - 1)}
              className="text-[10.5px] text-gray-400 hover:text-gray-900 flex items-center gap-1 font-bold cursor-pointer"
            >
              <span>← العودة للسابق</span>
            </button>
          </div>

          <h4 className="font-serif font-bold text-lg text-gray-950 leading-relaxed text-right leading-relaxed mb-4">
            {stepsData[step - 1].questionAr}
          </h4>

          <div className="grid grid-cols-1 gap-3">
            {stepsData[step - 1].options.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleSelectOption(opt.key)}
                className="w-full text-right p-4.5 rounded-2.5xl bg-white border border-stone-200 hover:border-[#A44C5C] hover:bg-neutral-50/20 active:scale-[0.99] transition-all cursor-pointer text-xs font-sans space-y-1 block shadow-xs"
              >
                <div className="flex justify-between items-center flex-row-reverse">
                  <span className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-[10px] text-[#A44C5C] block">
                    {answers[stepsData[step - 1].id] === opt.key ? '●' : ''}
                  </span>
                  <strong className="text-gray-950 text-xs font-bold font-sans">{opt.titleAr}</strong>
                </div>
                <p className="text-gray-500 text-[10px] leading-relaxed pr-6">{opt.descAr}</p>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recommendation Results (Step 5) */}
      {step === 5 && (
        <div className="space-y-6">
          {loadingResults ? (
            <div className="text-center py-10 space-y-4 font-sans text-xs text-gray-500 leading-relaxed">
              <div className="w-10 h-10 border-4 border-[#A44C5C]/30 border-t-[#A44C5C] rounded-full animate-spin mx-auto" />
              <p className="animate-pulse">تقوم المستشارة الآن بغربلة الكتالوج ومطابقة الأنسجة والنعومة والقصّات لخروج باقة تليق بسموكِ...</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center border-b border-gray-200/60 pb-3 flex-row-reverse text-right">
                <div>
                  <h4 className="font-serif text-lg font-bold text-gray-950">توصية خبير السولتا المترفة 👑</h4>
                  <p className="text-gray-400 text-[10px] mt-0.5">تم الحساب اعتماداً على رغباتك العضوية ومقاييس الحواس</p>
                </div>
                <button
                  onClick={() => { setAnswers({}); setStep(0); }}
                  className="bg-white border border-stone-200 hover:bg-neutral-50 rounded-xl px-3 py-1.5 text-[10px] font-sans font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={11} />
                  <span>استشارة جديدة</span>
                </button>
              </div>

              {recommendations.length === 0 ? (
                <div className="text-center py-6 font-sans text-xs text-gray-400">
                  لا تتوفر أي منتجات نشطة لمطابقة دقيقة حالياً في أرشيف البوتيك. يرجى مراجعة الكتالوج ثانيةً.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recommendations.map((prod: any) => {
                    const img = prod.images && prod.images[0] ? prod.images[0] : '/img/placeholder.png';
                    const matchedP = prod as Product;

                    return (
                      <div 
                        key={prod.id}
                        className="bg-white border border-neutral-150 rounded-3xl p-4.5 flex flex-col justify-between hover:scale-102 hover:shadow-md transition-all duration-300 shadow-xs text-right"
                      >
                        <div className="space-y-3">
                          <div className="relative h-44 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-150">
                            <img 
                              src={img} 
                              alt={prod.nameAr} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-2.5 right-2.5 bg-[#0B0B0B] text-[#F6E7A6] px-2 py-0.5 rounded-lg text-[9.5px] font-sans font-bold shadow-xs">
                              🏆 مطابقة {prod.matchRate}%
                            </div>
                          </div>

                          <div>
                            <h5 className="font-serif text-[11.5px] font-bold text-gray-950 leading-relaxed truncate">{prod.nameAr}</h5>
                            <span className="text-[10px] text-gray-400 font-sans block truncate mt-0.5">{prod.categoryAr} • {prod.fabricAr}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between flex-row-reverse">
                          <span className="text-xs font-serif font-bold text-[#A44C5C]">
                            {matchedP.priceSA || matchedP.priceEG} {matchedP.priceSA ? 'ر.س' : 'ج.م'}
                          </span>
                          {onSelectProduct && (
                            <button
                              onClick={() => onSelectProduct(matchedP)}
                              className="bg-[#0B0B0B] hover:bg-[#A44C5C] text-white text-[9.5px] font-sans font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer select-none leading-none"
                            >
                              عرض كوتور
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="bg-[#A44C5C]/5 border border-[#A44C5C]/10 p-4 rounded-2.5xl text-right">
                <span className="text-xs font-bold text-[#A44C5C] block">💡 مستشاركِ يخبركِ بخصوص تغليف الهدية:</span>
                <p className="text-[10px] text-gray-650 leading-relaxed mt-1 leading-relaxed">
                  تمت مطابقة هذه القطع الموصى بها مع ثيم تغليف العلب الوردي والفريد لصالون هدايا Sulta وتقديم مهر الختم الشمعي مع شريط ستان كوتور متطابق لرفع درجة التأثير والانطباع الساحر.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
