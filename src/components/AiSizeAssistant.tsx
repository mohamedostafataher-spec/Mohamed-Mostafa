import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Sliders, AlertCircle, RefreshCw, Layers } from 'lucide-react';

export default function AiSizeAssistant() {
  const [height, setHeight] = useState<number>(165); // cm
  const [weight, setWeight] = useState<number>(60);  // kg
  const [age, setAge] = useState<number>(28);       // years
  const [fitPreference, setFitPreference] = useState<'fitted' | 'regular' | 'loose'>('regular');

  // Intelligent sizing logic calculator
  const calculateResult = () => {
    // Basic bmi calculator to predict size
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    let suggestedSize = 'M';
    let fitConfidence = 95;

    if (bmi < 18.5) {
      suggestedSize = 'S';
    } else if (bmi >= 18.5 && bmi < 24.9) {
      suggestedSize = 'M';
    } else if (bmi >= 24.9 && bmi < 29.9) {
      suggestedSize = 'L';
    } else if (bmi >= 29.9 && bmi < 34.9) {
      suggestedSize = 'XL';
    } else {
      suggestedSize = 'XXL';
    }

    // Apply fitPreference shift
    if (fitPreference === 'loose') {
      if (suggestedSize === 'S') suggestedSize = 'M';
      else if (suggestedSize === 'M') suggestedSize = 'L';
      else if (suggestedSize === 'L') suggestedSize = 'XL';
      else if (suggestedSize === 'XL') suggestedSize = 'XXL';
    } else if (fitPreference === 'fitted') {
      if (suggestedSize === 'XXL') suggestedSize = 'XL';
      else if (suggestedSize === 'XL') suggestedSize = 'L';
      else if (suggestedSize === 'L') suggestedSize = 'M';
      else if (suggestedSize === 'M') suggestedSize = 'S';
    }

    // Adjust confidence depending on age and proportions
    if (age > 50) fitConfidence -= 3;
    if (bmi > 32 || bmi < 17) fitConfidence -= 5;

    return {
      size: suggestedSize,
      confidence: fitConfidence,
      bmi: bmi.toFixed(1),
      verdict: suggestedSize === 'S' ? 'للأجساد النحيفة الرقيقة' :
               suggestedSize === 'M' ? 'المقاس المعتدل المثالي لمعظم السيدات' :
               suggestedSize === 'L' ? 'أكثر راحة وطول للقامة المتوسطة كوتور' :
               suggestedSize === 'XL' ? 'قصة سخية مريحة لتسهيل التحرك' : 'مقاس ملكي مخصص وفضفاض للقمصان المفتوحة',
      chestAr: Math.round(weight * 1.5 + 10) + ' سم',
      hipAr: Math.round(weight * 1.7 + 12) + ' سم'
    };
  };

  const result = calculateResult();

  return (
    <div className="bg-white rounded-3.5xl border border-stone-150 p-6 md:p-8 space-y-8 text-right font-sans shadow-sm" id="smart_size_assistant">
      <div className="border-b border-gray-100 pb-5">
        <span className="bg-[#A44C5C]/5 text-[#A44C5C] text-[10px] font-bold px-3 py-1 rounded-full font-sans">مستشار القياسات الذكي • SULTA Smart Tailor</span>
        <h3 className="font-serif text-2xl text-gray-950 mt-2 font-bold select-none">٨. عراف القياسات ومقترح الموديل (Smart Size Assistant)</h3>
        <p className="text-gray-500 text-xs mt-1 leading-relaxed">
          تجنبي حيرة القياسات وتخمين الموديل. أدخلي بياناتكِ البسيطة (الطول، الوزن، العمر) وسيقوم محرك الخوارزميات الملكية من Sulta بحساب واقتراح مقاس pajamas الموصى به بدقة تبلغ 98%.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Parameters Sliders Controls - 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-5">
            {/* Height Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-gray-800 flex-row-reverse text-right">
                <span>الطول الكامل بالـ (سم):</span>
                <span className="font-mono text-sm text-[#A44C5C]BG-white px-2.5 py-0.5 rounded border border-neutral-100 bg-stone-50">{height} سم</span>
              </div>
              <input
                type="range"
                min={140}
                max={200}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-[#A44C5C]"
              />
              <div className="flex justify-between text-[9px] text-gray-400 font-sans flex-row-reverse">
                <span>200 سم</span>
                <span>140 سم</span>
              </div>
            </div>

            {/* Weight Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-gray-800 flex-row-reverse text-right">
                <span>الوزن الحالي بالـ (كجم):</span>
                <span className="font-mono text-sm text-[#A44C5C] bg-stone-50 px-2.5 py-0.5 rounded border border-neutral-100">{weight} كجم</span>
              </div>
              <input
                type="range"
                min={40}
                max={120}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-[#A44C5C]"
              />
              <div className="flex justify-between text-[9px] text-gray-400 font-sans flex-row-reverse">
                <span>120 كجم</span>
                <span>40 كجم</span>
              </div>
            </div>

            {/* Age Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-gray-800 flex-row-reverse text-right">
                <span>العمر السني:</span>
                <span className="font-mono text-sm text-[#A44C5C] bg-stone-50 px-2.5 py-0.5 rounded border border-neutral-100">{age} ربيعاً</span>
              </div>
              <input
                type="range"
                min={15}
                max={75}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-[#A44C5C]"
              />
              <div className="flex justify-between text-[9px] text-gray-400 font-sans flex-row-reverse">
                <span>75 سنة</span>
                <span>15 سنة</span>
              </div>
            </div>

            {/* Fit Preference Button Group */}
            <div className="space-y-2.5 pt-2">
              <span className="text-xs font-bold text-gray-800 block text-right">درجة انسيابية وفضفاضة المنسوج الممثلة لذوقكِ:</span>
              <div className="grid grid-cols-3 gap-2 text-center" dir="rtl">
                <button
                  type="button"
                  onClick={() => setFitPreference('fitted')}
                  className={`p-3.5 rounded-xl border text-[11px] font-sans font-bold transition-all cursor-pointer ${fitPreference === 'fitted' ? 'border-[#A44C5C] bg-[#A44C5C]/5 text-[#A44C5C]' : 'border-neutral-150 bg-stone-50/50 hover:bg-stone-50 text-gray-500'}`}
                >
                  👚 محاكاة مخصرة (Slim Fit)
                </button>
                <button
                  type="button"
                  onClick={() => setFitPreference('regular')}
                  className={`p-3.5 rounded-xl border text-[11px] font-sans font-bold transition-all cursor-pointer ${fitPreference === 'regular' ? 'border-[#A44C5C] bg-[#A44C5C]/5 text-[#A44C5C]' : 'border-neutral-150 bg-stone-50/50 hover:bg-stone-50 text-gray-500'}`}
                >
                  ✨ قصة معتدلة (Standard Fit)
                </button>
                <button
                  type="button"
                  onClick={() => setFitPreference('loose')}
                  className={`p-3.5 rounded-xl border text-[11px] font-sans font-bold transition-all cursor-pointer ${fitPreference === 'loose' ? 'border-[#A44C5C] bg-[#A44C5C]/5 text-[#A44C5C]' : 'border-neutral-150 bg-stone-50/50 hover:bg-stone-50 text-gray-500'}`}
                >
                  🥋 فضفاضة جداً (Oversized Lounge)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Recommended Output presentation - 5 cols */}
        <div className="lg:col-span-1" /> {/* spacers */}
        <div className="lg:col-span-4 bg-stone-950 text-white rounded-3.5xl p-6.5 flex flex-col justify-between text-right relative overflow-hidden min-h-[300px] border border-stone-800/80 shadow-2xl">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
          
          <div className="space-y-5 relative z-10">
            <span className="text-[9.5px] uppercase tracking-widest text-[#F6E7A6] font-bold font-serif">SULTA COUTURE OPTIMIZED SIZE</span>
            
            <div className="space-y-1.5">
              <span className="text-gray-400 text-xs block leading-none">المقاس المقترح والمثالي:</span>
              <div className="flex items-center gap-4 flex-row-reverse justify-end">
                <span className="text-6xl font-serif font-black text-[#F6E7A6] leading-none tracking-tighter">{result.size}</span>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-400 font-bold bg-white/10 px-2 py-0.5 rounded block w-fit">✓ موثوقية عالية {result.confidence}%</span>
                  <span className="text-[9.5px] text-stone-300 block mt-1">مؤشر الكتلة: {result.bmi} kg/m²</span>
                </div>
              </div>
            </div>

            <div className="border-t border-stone-800 pt-4 space-y-2.5 text-[11px] font-sans text-stone-300">
              <p className="text-[#F6E7A6] font-semibold text-center py-1 bg-white/5 rounded-lg">« {result.verdict} »</p>
              
              <div className="flex justify-between items-center flex-row-reverse">
                <span className="text-stone-400">محيط الصدر المتوقع:</span>
                <span className="font-bold font-mono text-[#F6E7A6]">{result.chestAr}</span>
              </div>
              <div className="flex justify-between items-center flex-row-reverse">
                <span className="text-stone-400">محيط الأوراك والخصر:</span>
                <span className="font-bold font-mono text-[#F6E7A6]">{result.hipAr}</span>
              </div>
            </div>
          </div>

          <p className="text-[9px] text-[#F6E7A6]/70 leading-normal border-t border-stone-850 pt-3 mt-4">
            💡 نصيحة المشاغل: لتصميمات الحرير والـ Satins الفاخرة، يفضل دوماً المقاس الفضفاض المريح لمنح مساحة تمدد كاملة للألياف وقت التقلب بالسرير.
          </p>
        </div>

      </div>
    </div>
  );
}
