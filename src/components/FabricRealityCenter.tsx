import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, ShieldAlert, Sparkles, Sliders, Wind, Check } from 'lucide-react';

export default function FabricRealityCenter() {
  const [selectedFabric, setSelectedFabric] = useState<'silk' | 'satin' | 'cotton'>('silk');
  const [zoomWeight, setZoomWeight] = useState<boolean>(false);
  const [breezeSpeed, setBreezeSpeed] = useState<number>(2); // 1 to 5 scale

  const fabrics = {
    silk: {
      nameAr: 'حرير التوت الطبيعي الخالص (Mulberry Silk 22-Momme)',
      softness: 98,
      stretch: 15,
      thickness: 'ثقيل مترف 22 Momme (~95 gsm)',
      weaveAr: 'نسيج ساتان حريري منسوج بمغزل أحادي دقيق جداً (Sateen Weave)',
      descriptionAr: 'أنعم ألياف بروتينية طبيعية مكافحة للتجاعيد، مصبوغة بصبغات عضوية لا تسبب الحساسية للجلد، وتمنحكِ شعوراً بالبرودة والانتعاش الطارد للحرارة.',
      originAr: 'مقاطعة كومو المرموقة، إيطاليا 🇮🇹',
      airflow: 'مثالي نفاذ بنسبة 93%'
    },
    satin: {
      nameAr: 'ساتان كوتور المطور (Luxury Stretch Satin)',
      softness: 90,
      stretch: 65,
      thickness: 'متوسط النعومة مريح (~120 gsm)',
      weaveAr: 'نسيج لولبي مائل مع ألياف مطاطية ليكرا (Four-Way Diagonal)',
      descriptionAr: 'خامة مكسوة بلمعان متلألئ بديع، تمتاز بمرونة ممتازة تجاري تحركات الجسد أثناء النوم دون مقاومة، ومقاومة تامة للتكسر والتجعد.',
      originAr: 'أتيلييه الغزل الخاص بنا بجدة 🇸🇦',
      airflow: 'ممتاز بنسبة 85%'
    },
    cotton: {
      nameAr: 'ألياف الكتان والقطن المصري العضوي (Egyptian Cotton Blend)',
      softness: 85,
      stretch: 10,
      thickness: 'تنفس عالي صيفي (~140 gsm)',
      weaveAr: 'حياكة أوكسفورد هادئة للتنفس العالي (Oxford Weave)',
      descriptionAr: 'خامات قطنية فائقة الطول والتماسك، تمتص الرطوبة بشكل خارق لتهيئة حرارة الجسم للغوص المريح في مرتبة السرير دون تعرق صيفي.',
      originAr: 'محالج كفر الدوار الموقرة بمصر 🇪🇬',
      airflow: 'فائق التنفس بنسبة 97%'
    }
  };

  const active = fabrics[selectedFabric];

  return (
    <div className="bg-white rounded-3.5xl border border-stone-150 p-6 md:p-8 space-y-8 text-right font-sans shadow-sm" id="fabric_reality_center">
      <div className="border-b border-gray-100 pb-5">
        <span className="bg-[#A44C5C]/5 text-[#A44C5C] text-[10px] font-bold px-3 py-1 rounded-full font-sans">الأقمشة الحريرية الفاخرة • SULTA Fabric Reality Center</span>
        <h3 className="font-serif text-2xl text-gray-950 mt-2 font-bold select-none">٥. مركز واقع وخامات المنسوجات (Fabric Reality Center)</h3>
        <p className="text-gray-500 text-xs mt-1 leading-relaxed">
          انغمسي في كواليس الألياف الطبيعية وخيوط الحرير. حللي نعومة ومرونة وسمك الخامة المختارة لقطع pajamas الخاصة بكِ، وعايني الألياف الدقيقة الافتراضية.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Interactive Playground Canvas - 6 cols */}
        <div className="lg:col-span-6 bg-stone-50 border border-stone-200/50 rounded-3.5xl p-6 flex flex-col justify-between relative overflow-hidden min-h-[360px]">
          {/* Fiber visual structure card with drape animation */}
          <div className="relative flex-1 flex flex-col items-center justify-center py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedFabric}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full text-center space-y-5"
              >
                {/* Visual fabric sheet drape simulation */}
                <div className="relative w-48 h-32 mx-auto rounded-2xl bg-white border border-stone-150 shadow-sm overflow-hidden p-3 flex flex-col items-center justify-center">
                  {/* Ripples moving left or right depending on breeze speed selector */}
                  <div className="absolute inset-x-0 bottom-0 top-0 opacity-20 pointer-events-none flex flex-col justify-between">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ x: [-80, 80] }}
                        transition={{
                          repeat: Infinity,
                          duration: 4 / breezeSpeed,
                          ease: "linear",
                          delay: i * 0.4
                        }}
                        className="h-1.5 bg-[#A44C5C]/90 rounded-full w-40"
                      />
                    ))}
                  </div>

                  <span className="text-4xl relative z-10">
                    {selectedFabric === 'silk' ? '🏮' : selectedFabric === 'satin' ? '🪞' : '☁️'}
                  </span>
                  
                  <span className="text-[10px] text-gray-400 font-bold block mt-2 tracking-wide font-mono">
                    {zoomWeight ? '🔬 زاوية التكبير الدقيق' : '💨 محاكاة انسياب ومرونة النسيج'}
                  </span>
                </div>

                {/* Dynamic Metrics Panel with Visual Gauges */}
                <div className="space-y-3 max-w-xs mx-auto">
                  <div className="text-right">
                    <div className="flex justify-between items-center text-[11px] mb-1 flex-row-reverse">
                      <span className="text-gray-500">مؤشر النعومة الملساء (Friction Coefficient):</span>
                      <strong className="text-[#A44C5C]">{active.softness}%</strong>
                    </div>
                    <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#A44C5C] h-full rounded-full transition-all duration-700" style={{ width: `${active.softness}%` }} />
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex justify-between items-center text-[11px] mb-1 flex-row-reverse">
                      <span className="text-gray-500">محاذاة المرونة والشد الارتدادي:</span>
                      <strong className="text-amber-700">{active.stretch}%</strong>
                    </div>
                    <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-600 h-full rounded-full transition-all duration-700" style={{ width: `${active.stretch}%` }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Breeze Controller Footer tools */}
          <div className="pt-3 border-t border-stone-200/40 flex justify-between items-center text-[11.5px] font-sans">
            <span className="text-[#A44C5C] font-bold flex items-center gap-1">
              <Wind size={13} />
              <span>جهاز تحريك وتهوية ميكرو النسيج</span>
            </span>

            <div className="flex gap-1 items-center bg-white border border-stone-200 px-2 py-1 rounded-xl">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setBreezeSpeed(s)}
                  className={`w-5 h-5 rounded-md text-[9px] font-bold text-center cursor-pointer transition-all ${breezeSpeed === s ? 'bg-[#A44C5C] text-white' : 'hover:bg-neutral-100 text-[#0B0B0B]'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Selecting fabric & specs details section - 6 cols */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-xs font-bold text-[#0B0B0B] block">اختري الخامة الحريرية لمعاينة نسيجها:</span>
            
            <div className="space-y-2.5">
              {[
                { id: 'silk', labelAr: 'حرير الحرير الطبيعي (Italian Mulberry)', subAr: 'نعومة قصوى فائقة دافئة وخالية من التجهيز' },
                { id: 'satin', labelAr: 'ساتان كوتور المطور (Luxury Stretch)', subAr: 'مرونة ارتدادية خارقة مع لمعة قوية مقاومة للتكسر' },
                { id: 'cotton', labelAr: 'كتان التوت العضوي (Mulberry Cotton)', subAr: 'تنفس مسامي فريد مناسب لشهور الصيف وحرارة الغلاف' }
              ].map((f) => (
                <div
                  key={f.id}
                  onClick={() => setSelectedFabric(f.id as any)}
                  className={`p-3.5 rounded-2xl border text-right cursor-pointer transition-all flex flex-col gap-0.5 ${selectedFabric === f.id ? 'border-[#A44C5C] bg-[#A44C5C]/5 ring-2 ring-[#A44C5C]/5' : 'bg-stone-50/50 hover:bg-stone-50 border-stone-150'}`}
                >
                  <div className="flex gap-2 items-center flex-row-reverse justify-end">
                    {selectedFabric === f.id ? <span className="text-[#A44C5C]">✓</span> : null}
                    <span className="text-xs text-gray-900 font-bold font-sans">{f.labelAr}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 block tracking-wide mt-0.5">{f.subAr}</span>
                </div>
              ))}
            </div>

            {/* Spec sheet */}
            <div className="bg-stone-50/70 border border-stone-200/40 p-4.5 rounded-2.5xl space-y-3.5 text-xs text-gray-700 font-sans">
              <div className="flex justify-between flex-row-reverse text-right items-center">
                <span className="text-gray-400">سماكة ووزن الخامة:</span>
                <span className="font-bold text-gray-950 font-mono">{active.thickness}</span>
              </div>
              <div className="flex justify-between flex-row-reverse text-right items-center">
                <span className="text-gray-400">عائلة وحزّة النسيج (Weave Structure):</span>
                <span className="font-bold text-gray-950">{active.weaveAr}</span>
              </div>
              <div className="flex justify-between flex-row-reverse text-right items-center">
                <span className="text-gray-400">بلد المنشأ والأصالة (Couture Provenance):</span>
                <span className="font-bold text-[#A44C5C]">{active.originAr}</span>
              </div>
              <div className="flex justify-between flex-row-reverse text-right items-center">
                <span className="text-gray-400">نفاذية تيار الهواء وتنفس الصدر:</span>
                <span className="font-bold text-emerald-700">{active.airflow}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-stone-150 p-4 rounded-2.5xl text-right space-y-2">
            <span className="text-xs font-bold text-gray-850 block">🔬 شهادة الجودة العضوية SULTA Thread Certified</span>
            <p className="text-[10px] text-gray-400 leading-normal">
              جميع الأرواب والبجامات لدينا مصنوعة ومختبرة في اختبارات الفك التلقائي لضمان خلوها من مسببات الحساسية الجلدية وتوفير تبريد لطيف للجلد بمقدار 2 درجة مئوية عن الأقمشة الصناعية الأخرى.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
