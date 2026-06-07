import React, { useState } from 'react';
import { Sparkles, X, ChevronLeft, Shirt, Heart, Ruler, Droplets } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function StyleAssistant({ 
  onClose,
  onRecommend 
}: { 
  onClose: () => void,
  onRecommend: (categoryId: string) => void
}) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<any>({});

  const handleSelect = (key: string, val: string) => {
    setAnswers({ ...answers, [key]: val });
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Analyze and recommend
      let rec = 'sleepwear';
      if (answers.vibe === 'relax' || answers.fabric === 'cotton') rec = 'loungewear';
      if (answers.vibe === 'home' && answers.fabric === 'cotton') rec = 'homewear';

      onRecommend(rec);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-gray-400 hover:text-black z-10 bg-white/50 backdrop-blur rounded-full p-1"
        >
          <X size={20} />
        </button>

        <div className="bg-[#FAF4F5] p-8 text-center relative border-b border-[#DF8A9C]/20">
          <Sparkles className="w-8 h-8 text-[#DF8A9C] mx-auto mb-3" />
          <h2 className="text-2xl font-serif font-light text-[#0B0B0B]">مستشار العناية والستايل</h2>
          <p className="text-sm text-gray-500 mt-2 font-sans">
            دعنا نساعدك في اختيار القطعة الملكية الأنسب لذوقك واحتياجك.
          </p>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-gray-800 text-center mb-6">ما هو هدفك الأساسي من القطعة؟</h3>
                
                <button onClick={() => handleSelect('vibe', 'sleep')} className="w-full flex items-center gap-4 p-4 border border-gray-150 rounded-2xl hover:border-[#DF8A9C] hover:bg-[#FAF4F5] transition text-right group">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:text-[#DF8A9C] text-gray-500">
                    <Heart size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0B0B0B]">نوم فاخر ومريح</h4>
                    <p className="text-xs text-gray-500">أبحث عن بيجامات حريرية باردة.</p>
                  </div>
                </button>

                <button onClick={() => handleSelect('vibe', 'relax')} className="w-full flex items-center gap-4 p-4 border border-gray-150 rounded-2xl hover:border-[#DF8A9C] hover:bg-[#FAF4F5] transition text-right group">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:text-[#DF8A9C] text-gray-500">
                    <Shirt size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0B0B0B]">استرخاء في المنزل</h4>
                    <p className="text-xs text-gray-500">أطقم جلوس مريحة وأنيقة.</p>
                  </div>
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-gray-800 text-center mb-6">ما هي الخامة المفضلة لكِ؟</h3>
                
                <button onClick={() => handleSelect('fabric', 'satin')} className="w-full flex items-center gap-4 p-4 border border-gray-150 rounded-2xl hover:border-[#DF8A9C] hover:bg-[#FAF4F5] transition text-right group">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:text-[#DF8A9C] text-gray-500">
                    <Droplets size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0B0B0B]">ساتان معالج (برودة ونعومة)</h4>
                    <p className="text-xs text-gray-500">ملمس يشبه خفة الماء على البشرة.</p>
                  </div>
                </button>

                <button onClick={() => handleSelect('fabric', 'cotton')} className="w-full flex items-center gap-4 p-4 border border-gray-150 rounded-2xl hover:border-[#DF8A9C] hover:bg-[#FAF4F5] transition text-right group">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:text-[#DF8A9C] text-gray-500">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0B0B0B]">قطن مصري نقي</h4>
                    <p className="text-xs text-gray-500">راحة فائقة التهوية وعملية.</p>
                  </div>
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-gray-800 text-center mb-6">كيف تفضلين المقاس والتفصيل؟</h3>
                
                <button onClick={() => handleSelect('fit', 'loose')} className="w-full flex items-center gap-4 p-4 border border-gray-150 rounded-2xl hover:border-[#DF8A9C] hover:bg-[#FAF4F5] transition text-right group">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:text-[#DF8A9C] text-gray-500">
                    <Ruler size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0B0B0B]">فضفاض (Oversized)</h4>
                    <p className="text-xs text-gray-500">حرية حركة مطلقة.</p>
                  </div>
                </button>

                <button onClick={() => handleSelect('fit', 'regular')} className="w-full flex items-center gap-4 p-4 border border-gray-150 rounded-2xl hover:border-[#DF8A9C] hover:bg-[#FAF4F5] transition text-right group">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:text-[#DF8A9C] text-gray-500">
                    <Ruler size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0B0B0B]">مقاس مضبوط (Regular)</h4>
                    <p className="text-xs text-gray-500">قصة كلاسيكية ترسم القوام بأناقة.</p>
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between">
             <div className="flex gap-1.5">
               {[1, 2, 3].map(i => (
                 <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step >= i ? 'w-6 bg-[#DF8A9C]' : 'w-2 bg-gray-200'}`} />
               ))}
             </div>
             {step > 1 && (
               <button onClick={() => setStep(step - 1)} className="text-sm text-gray-500 hover:text-black font-semibold flex items-center gap-1">
                 <ChevronLeft size={16} />
                 رجوع
               </button>
             )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
