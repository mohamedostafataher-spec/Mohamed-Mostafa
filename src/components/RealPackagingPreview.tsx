import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, ShieldCheck, Heart, Sparkles, Check, Paperclip, ChevronLeft, MailOpen } from 'lucide-react';
import { supabase } from '../services/db';

export default function RealPackagingPreview() {
  const [boxTheme, setBoxTheme] = useState<'rose' | 'black'>('rose');
  const [cardInitial, setCardInitial] = useState('S');
  const [activeTab, setActiveTab] = useState<'box' | 'card' | 'gift' | 'bag'>('box');
  const [spritzScent, setSpritzScent] = useState(false);
  const [catalogItems, setCatalogItems] = useState<any[]>([]);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const { data } = await supabase.from('homepage_sections').select('content_json').eq('section_key', 'sulta_luxury_packaging_v2').limit(1).single();
        if (data && data.content_json) {
          const parsed = typeof data.content_json === 'string' ? JSON.parse(data.content_json) : data.content_json;
          if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            setCatalogItems(parsed);
            return;
          }
        }
      } catch (e) {
        console.warn("Could not query supabase for packaging experience showcase", e);
      }
      
      // Fallback defaults
      setCatalogItems([
        {
          id: 'rose-box',
          titleAr: 'طرد وردي الحواس الملكي الأول',
          descAr: 'العلبة الوردية الناعمة برباط روز ريبون المعالج يدوياً وكرت الشمع الملكي مصبوب النحاس.',
          url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1200&auto=format&fit=crop',
          tag: 'الأكثر طلباً 🌸'
        },
        {
          id: 'black-matte',
          titleAr: 'علبة الأرستقراطية الليلية السوداء',
          descAr: 'العلبة السوداء المطلية بلمسة مخملية مطفية عازلة مع شعار مبصوم من الذهب عيار ٢٤ قيراط.',
          url: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?q=80&w=1200&auto=format&fit=crop',
          tag: 'طبعة كبّار والشخصيات الفاخرة ✨'
        },
        {
          id: 'white-gold',
          titleAr: 'الباقة الكريستالية المضيئة',
          descAr: 'علبة العيد والمناسبات البيضاء الموشحة بخيوط الروز والذهبي، مصممة لحفلات الزواج وصالون العرائس.',
          url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1200&auto=format&fit=crop',
          tag: 'عروس صولا الفخمة ⚜️'
        },
        {
          id: 'silk-wrap',
          titleAr: 'لفات مناديل الحرير الفلورال',
          descAr: 'لفائف مناديل حمائية حريرية ناعمة تحيط ببيجامتكِ الفاخرة بعبق عطر رويال مسك البولندي.',
          url: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?q=80&w=1200&auto=format&fit=crop',
          tag: 'تكييف داخلي معبق 🏵️'
        }
      ]);
    };
    loadCatalog();
  }, []);

  const boxDetails = {
    rose: {
      color: 'bg-rose-50 border-rose-100',
      boxColor: '#FDF2F4',
      hex: '#FDF2F4',
      nameAr: 'العيد والعروس: وردي الحواس المخملي كوتور',
      descAr: 'علبة متينة فخمة بلون بودرة الوردي المخملي، بشريط ساتان منسوج يدوياً ومبطنة بورق الخزامى الحريري.',
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1200&auto=format&fit=crop'
    },
    black: {
      color: 'bg-stone-900 border-stone-800 text-stone-200',
      boxColor: '#171717',
      hex: '#171717',
      nameAr: 'أطقم الليل: أسود مطفي ملكي إرستقراطي',
      descAr: 'علبة برستيج مطلية بلون الليل الملكي، بشعار مطبوع بالذهب اللامع وشريط كافيار فاخر مضلع عريض.',
      image: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?q=80&w=1200&auto=format&fit=crop'
    }
  };

  const handleSpritz = () => {
    setSpritzScent(true);
    // Sensory luxury play sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(329.63, audioCtx.currentTime); // Mi note
      osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}
    setTimeout(() => setSpritzScent(false), 1800);
  };

  return (
    <div className="bg-white rounded-3.5xl border border-stone-150 p-6 md:p-8 space-y-8 text-right font-sans shadow-sm" dir="rtl" id="packaging_preview_center">
      <div className="border-b border-gray-100 pb-5">
        <div className="flex items-center gap-1.5 justify-start flex-row-reverse">
          <span className="bg-pink-100 text-[#A44C5C] text-[10px] font-bold px-3 py-1 rounded-full font-sans">معاينة التغليف التفاعلي الفوري 🎁</span>
        </div>
        <h3 className="font-serif text-2xl text-gray-950 mt-2 font-bold select-none">٤. محاكاة الطرود والعلب كوتور (SULTA Unboxing Preview)</h3>
        <p className="text-gray-500 text-xs mt-1 leading-relaxed">
          شاهدي تفاصيل وفخامة الباقة وكيف ستصل إليكِ أو لمن تحبين. اضغطي على النوافذ لتشريح المكونات وعرض ملمس علبة الشحن وبطاقة الشمع الملكية والشنطة الأنيقة.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Visual Simulated Canvas - 5 cols */}
        <div className="lg:col-span-5 bg-stone-50 border border-stone-200/60 rounded-3.5xl p-6 flex flex-col justify-between relative overflow-hidden min-h-[350px]">
          {/* Scent Spritz Particles */}
          <AnimatePresence>
            {spritzScent && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 0.8, scale: 1.5 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#A44C5C]/5 pointer-events-none z-20 flex items-center justify-center"
              >
                <div className="w-48 h-48 rounded-full border-4 border-dashed border-[#A44C5C]/20 animate-spin" />
                <span className="absolute text-xs text-[#A44C5C] font-semibold bg-white/90 px-3 py-1.5 rounded-full shadow-sm">
                  🌾 رش زيت رويال مسك لافندر اللطيف...
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SULTA Gold Crest Logo Backplate */}
          <div className="absolute top-4 left-4 opacity-5 select-none font-serif text-6xl pointer-events-none">SULTA</div>

          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <AnimatePresence mode="wait">
              {activeTab === 'box' && (
                <motion.div 
                  key="box"
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4 text-center w-full"
                >
                  <div className="relative w-44 h-44 mx-auto rounded-2xl overflow-hidden shadow-xl border border-stone-200 bg-white" style={{ borderColor: boxTheme === 'rose' ? '#FBCFE8' : '#374151' }}>
                    <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-stone-900/5 to-transparent" />
                    {/* Simulated Box Rendering */}
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 relative" style={{ backgroundColor: boxTheme === 'rose' ? '#FDF2F4' : '#1F1F1F' }}>
                      <span className={`text-4xl ${boxTheme === 'rose' ? 'text-[#A44C5C]' : 'text-[#F6E7A6]'}`}>⚜️</span>
                      <span className={`text-xs font-serif font-black tracking-widest mt-2 block ${boxTheme === 'rose' ? 'text-stone-800' : 'text-[#F6E7A6]'}`}>SULTA</span>
                      {/* Ribbon Loop overlay */}
                      <div className="absolute inset-y-0 w-5 bg-gradient-to-r from-pink-400 to-pink-500 opacity-80" style={{ left: '46%', backgroundColor: boxTheme === 'rose' ? '#E11D48' : '#000000' }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] font-bold text-gray-800 block text-center mt-1">{boxDetails[boxTheme].nameAr}</span>
                    <span className="text-[9.5px] text-gray-400 block max-w-xs mx-auto leading-relaxed mt-0.5">{boxDetails[boxTheme].descAr}</span>
                  </div>
                </motion.div>
              )}

              {activeTab === 'card' && (
                <motion.div 
                  key="card"
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.95 }}
                  className="space-y-4 text-center w-full"
                >
                  <div className="relative w-40 h-52 mx-auto bg-[#FBFBFA] rounded-2xl shadow-xl border border-amber-900/10 p-5 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-[8px] text-stone-400 font-mono tracking-wide">CONFIDENTIAL ATELIER</span>
                      <span className="text-stone-500 text-xs">✉️</span>
                    </div>
                    
                    <div className="text-center space-y-1 my-3">
                      <p className="text-[10px] text-gray-400">إشراقة أناقة لـ</p>
                      <p className="text-xs font-serif font-bold italic text-stone-700">"صاحبة السمو والجمال المترف"</p>
                      <div className="w-10 h-0.5 bg-amber-200 mx-auto my-1" />
                    </div>

                    <div className="flex flex-col items-center">
                      {/* Simulated Wax Seal Stamp */}
                      <div className="w-10 h-10 rounded-full bg-[#A44C5C] text-[#F6E7A6] font-serif font-black text-sm flex items-center justify-center shadow-lg ring-4 ring-[#A44C5C]/20 border border-amber-500/30 select-none animate-pulse">
                        {cardInitial || 'S'}
                      </div>
                      <span className="text-[8px] text-[#A44C5C] font-bold mt-1.5 block">مهر الشمع الملكي المصبوب</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 max-w-xs mx-auto leading-normal">
                    ظرف فينتج كلاسيكي مبطن، مختوم يدوياً بختم شمع النحل الساخن بحرف كود العميلة المختار {cardInitial} لتوصيل منتهى الرومانسية البصرية.
                  </p>
                </motion.div>
              )}

              {activeTab === 'gift' && (
                <motion.div 
                  key="gift"
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.95 }}
                  className="space-y-4 text-center w-full"
                >
                  <div className="relative w-44 h-40 mx-auto bg-stone-900 rounded-3xl p-5 flex flex-col justify-between text-white overflow-hidden shadow-2xl">
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-pink-500/10 rounded-full blur-xl" />
                    <div className="flex justify-between items-center text-[10px] text-[#F6E7A6]">
                      <span className="font-bold">Complimentary Gift</span>
                      <span>🎀</span>
                    </div>
                    <div className="my-2.5">
                      <h5 className="font-serif text-sm font-bold text-[#F6E7A6]">ربطة شعر وعينات الحواس</h5>
                      <p className="text-[9px] text-stone-300 mt-1">حرير طبيعي 100% بلون متناسق لحماية شعركِ أثناء النوم وجلسات الحمام.</p>
                    </div>
                    <div className="bg-white/10 px-2 py-1 rounded-lg text-[9px] text-zinc-300 text-center font-bold">
                      مشمول تلقائياً بدون تكلفة في طردكِ
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 max-w-xs mx-auto leading-normal">
                    تحصل كل عميلة على ربطة شعر (Scrunchie) من بقايا الحرير الفاخر لنظام الهدر الصفري، بالإضافة لبطاقة عينة عود للتجربة الاستحمامية.
                  </p>
                </motion.div>
              )}

              {activeTab === 'bag' && (
                <motion.div 
                  key="bag"
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.95 }}
                  className="space-y-4 text-center w-full"
                >
                  <div className="relative w-40 h-48 mx-auto bg-[#F1ECE5] border border-stone-300 rounded-lg p-5 flex flex-col justify-between shadow-xl">
                    {/* Rope Handles */}
                    <div className="absolute -top-3 inset-x-0 flex justify-center gap-6">
                      <div className="w-10 h-6 border-t-2 border-x-2 border-stone-600 rounded-t-full" />
                    </div>
                    
                    <div className="pt-2 text-center">
                      <span className="text-[7px] text-stone-500 uppercase tracking-widest font-mono block">SULTA BOUTIQUE</span>
                      <div className="w-4 h-0.25 bg-stone-500 mx-auto my-1" />
                    </div>
                    
                    <div className="text-center font-serif py-4">
                      <span className="text-xl text-stone-800 font-bold block">S</span>
                      <span className="text-[8px] text-stone-400 block tracking-widest">COUTURE</span>
                    </div>

                    <div className="bg-stone-850 text-white p-1 text-[8px] font-mono text-center rounded">
                      RECYCLABLE LUXURY BAG
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 max-w-xs mx-auto leading-normal">
                    كيس ورقي مكسو غير تجاري فائق القوة، مصبوغ بمواد آمنة على البيئة، بأشرطة كتان متينة ممتازة لحمل الهدايا وتسهيل المشي للبوتيك.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="pt-4 border-t border-stone-200/50 flex justify-between items-center text-[10px] text-stone-500 font-sans shadow-inner p-1.5 rounded-2xl bg-white">
            <span className="font-bold text-[#A44C5C]">تأثير دائم للرفاهية 🌟</span>
            <button 
              onClick={handleSpritz}
              className="bg-[#A44C5C] text-white hover:bg-neutral-900 active:scale-95 px-3 py-1.5 rounded-xl font-bold font-sans cursor-pointer flex items-center gap-1.5 transition-all text-[10px] leading-none"
            >
              💨 بخ رذاذ العطر الخاص بالطرود
            </button>
          </div>
        </div>

        {/* Custom Tabs & Selectors - 7 cols */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setActiveTab('box')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 justify-center ${activeTab === 'box' ? 'border-[#A44C5C] bg-[#A44C5C]/5 font-bold text-gray-950 shadow-sm' : 'border-stone-150 bg-stone-50/50 hover:bg-stone-50 text-gray-500'}`}
              >
                <div className={`w-6 h-6 rounded-lg ${activeTab === 'box' ? 'bg-[#A44C5C] text-white' : 'bg-gray-100 text-gray-400'} flex items-center justify-center text-[10px]`}>
                  📦
                </div>
                <span className="text-[11px] block">1. العلبة والعلب</span>
              </button>

              <button
                onClick={() => setActiveTab('card')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 justify-center ${activeTab === 'card' ? 'border-[#A44C5C] bg-[#A44C5C]/5 font-bold text-gray-950 shadow-sm' : 'border-stone-150 bg-stone-50/50 hover:bg-stone-50 text-gray-500'}`}
              >
                <div className={`w-6 h-6 rounded-lg ${activeTab === 'card' ? 'bg-[#A44C5C] text-white' : 'bg-gray-100 text-gray-400'} flex items-center justify-center text-[10px]`}>
                  ✉️
                </div>
                <span className="text-[11px] block">2. بطاقة الشمع</span>
              </button>

              <button
                onClick={() => setActiveTab('gift')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 justify-center ${activeTab === 'gift' ? 'border-[#A44C5C] bg-[#A44C5C]/5 font-bold text-gray-950 shadow-sm' : 'border-stone-150 bg-stone-50/50 hover:bg-stone-50 text-gray-500'}`}
              >
                <div className={`w-6 h-6 rounded-lg ${activeTab === 'gift' ? 'bg-[#A44C5C] text-white' : 'bg-gray-100 text-gray-400'} flex items-center justify-center text-[10px]`}>
                  🎀
                </div>
                <span className="text-[11px] block">3. هدية السكرانشي</span>
              </button>

              <button
                onClick={() => setActiveTab('bag')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 justify-center ${activeTab === 'bag' ? 'border-[#A44C5C] bg-[#A44C5C]/5 font-bold text-gray-950 shadow-sm' : 'border-stone-150 bg-stone-50/50 hover:bg-stone-50 text-gray-500'}`}
              >
                <div className={`w-6 h-6 rounded-lg ${activeTab === 'bag' ? 'bg-[#A44C5C] text-white' : 'bg-gray-100 text-gray-400'} flex items-center justify-center text-[10px]`}>
                  🛍️
                </div>
                <span className="text-[11px] block">4. شنطة الحَمْل</span>
              </button>
            </div>

            {/* Sub-panels depending on theme selection */}
            <div className="bg-[#FAF9F5]/70 p-5 rounded-2.5xl border border-[#FAFAF7] space-y-4 text-right">
              {activeTab === 'box' && (
                <div className="space-y-3.5">
                  <span className="text-xs font-bold text-[#0B0B0B] block">طراز وثيم العلبة الفاخرة المعتمدة بـ Sulta:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div 
                      onClick={() => setBoxTheme('rose')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 items-end ${boxTheme === 'rose' ? 'border-[#A44C5C] bg-white ring-2 ring-[#A44C5C]/10 font-bold' : 'bg-white border-neutral-150 hover:bg-neutral-50'}`}
                    >
                      <div className="flex gap-2 items-center flex-row-reverse">
                        <span className="w-3.5 h-3.5 rounded-full inline-block border bg-rose-200" />
                        <span className="text-xs text-gray-950 font-bold">وردي الحواس الفرنسي</span>
                      </div>
                      <span className="text-[10px] text-gray-400 block text-right">الأكثر مبيعاً للعروس وإهداء الأعياد</span>
                    </div>

                    <div 
                      onClick={() => setBoxTheme('black')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 items-end ${boxTheme === 'black' ? 'border-[#A44C5C] bg-white ring-2 ring-[#A44C5C]/10 font-bold' : 'bg-white border-neutral-150 hover:bg-neutral-50'}`}
                    >
                      <div className="flex gap-2 items-center flex-row-reverse">
                        <span className="w-3.5 h-3.5 rounded-full inline-block border bg-stone-950" />
                        <span className="text-xs text-gray-950 font-bold">الأرستقراطي الملكي الأسود</span>
                      </div>
                      <span className="text-[10px] text-gray-400 block text-right">لعشاق الفخامة الداكنة والغموض</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'card' && (
                <div className="space-y-3.5">
                  <span className="text-xs font-bold text-[#0B0B0B] block">الحرف المفضل لمهر الشمع النحاسي (Custom Initial):</span>
                  <p className="text-[10.5px] text-gray-500 leading-relaxed font-sans">
                    سيقوم خبراؤنا بصب شمع لزج أحمر أو ذهبي حار على شريط طردكِ، ونقشه بقالب معدني مائل يحمل الحرف المختار لزيادة دلال وخصوصية الفتح.
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      maxLength={2}
                      value={cardInitial}
                      onChange={(e) => setCardInitial(e.target.value.toUpperCase())}
                      className="w-16 text-center bg-white border border-stone-200 rounded-xl px-2.5 py-2.5 font-serif font-black text-lg text-gray-950 focus:outline-[#A44C5C]"
                      placeholder="S"
                    />
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-800 block">اكتبي حرف الاسم الأول (عربي/إنجليزي)</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">مثال: M لـ "مها" أو S لـ "سحر"</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'gift' && (
                <div className="space-y-2 font-sans">
                  <span className="text-xs font-bold text-gray-850 block">✓ هدية مجانية مضافة من ريع الحرير الطبيعي (Eco-Couture Gift)</span>
                  <p className="text-[10.5px] text-gray-500 leading-normal">
                    لنرمم بقايا الحرير الأصيل من مصانعنا ومشاغلنا، نجمعها لنرتقي بربطات حرير ناعمة تحمي بصيلات شعرك من التقصف والاحتكاك الليلي. إنها هدية من العائلة لك بدون سقف سعر إضافي.
                  </p>
                  <div className="bg-white p-3 border border-stone-150 rounded-xl flex items-center justify-between font-sans text-[11px] text-emerald-800">
                    <span className="font-bold">✓ تشمل: علبة سولا الحريرية + ربطة شعر + كرت الحروف</span>
                    <span className="bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">مشمول للكل 🌸</span>
                  </div>
                </div>
              )}

              {activeTab === 'bag' && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#0B0B0B] block">الشنطة الورقية للتقديم كهدية (Luxury Gift Bag):</span>
                  <p className="text-[10.5px] text-gray-500 leading-normal">
                    تحفظ العلبة الورقية بعيداً عن الغبار والأتربة في الرحلة، ونضعها بداخل هذا الكيس المكسو الفاخر بشريط منسق لتكون الباقة جاهزة للإبهار الفوري وقت التسليم المباشر.
                  </p>
                  <div className="bg-[#FCFAF6] border border-amber-950/5 p-3 rounded-xl text-center">
                    <span className="text-[11px] text-[#A44C5C] font-bold block">« مصممة لتتسع للأرواب والأطقم كوتور لتقديم غاية في الشموخ والأثر »</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-neutral-50 p-4 border border-stone-200/50 rounded-2.5xl flex flex-col sm:flex-row justify-between items-center gap-3.5">
            <div className="text-right">
              <span className="text-xs font-serif font-bold text-[#0B0B0B] block">طريقة صب الشمع وتحضير العلبة الملكية:</span>
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                يتم الكي البخاري الفاخر لملابسك ثم طيها بورق المناديل الأبيض ورشها بنذر عطر الدار، ثم صب الشمع الساخن وختمه باسمكِ مجاناً.
              </p>
            </div>
            <div className="bg-white border border-stone-150 px-4 py-2.5 rounded-xl text-center shrink-0 shadow-xs">
              <span className="text-[10px] text-gray-400 block">رسوم بكج التغليف الملكي</span>
              <strong className="text-[13px] text-emerald-700 font-bold block mt-0.5">مجانًا بالكامل 🎁</strong>
            </div>
          </div>

        </div>

      </div>

      {/* Premium Downloadable Packaging Photo Catalog Section added per user request */}
      <div className="border-t border-gray-100 pt-8 mt-12 bg-stone-50/30 p-6 rounded-3.5xl">
        <h4 className="font-serif text-lg font-bold text-gray-950 mb-2 flex items-center justify-start gap-2 flex-row-reverse text-right">
          <span>ألبوم صور التغليف كوتور الجاهزة للتحميل (High-Res Downloads)</span>
          <span className="text-sm">📸</span>
        </h4>
        <p className="text-xs text-gray-500 mb-6 max-w-2xl leading-relaxed text-right">
          نقدم لكِ هنا لقطات ومراجع حية لعلب الهدايا والصناديق لتتمكني من تحميلها ومشاركتها مع أحبابكِ قبل اختيار البيجامة الملكية. انقري على التحميل لحفظ الصورة بدقة عالية.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {catalogItems.map((item, idx) => (
            <div 
              key={item.id || idx} 
              className="group bg-white rounded-3xl border border-stone-150 p-3 flex flex-col justify-between hover:shadow-lg transition-all duration-300 hover:border-[#A44C5C]/20 text-right"
            >
              <div>
                {/* Image Frame */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-stone-50 mb-3.5">
                  <img 
                    src={item.url} 
                    alt={item.titleAr} 
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-xs text-white text-[9px] font-sans font-semibold px-2 py-0.5 rounded-full select-none">
                    {item.tag}
                  </div>
                </div>

                {/* Info Text */}
                <h5 className="font-sans font-bold text-xs text-gray-950 mb-1">{item.titleAr}</h5>
                <p className="text-[10px] text-gray-400 leading-relaxed mb-4">{item.descAr}</p>
              </div>

              {/* Download CTA triggers download dynamically */}
              <div className="flex gap-2">
                <button 
                  className="flex-1 bg-[#FAF3F4] text-[#A44C5C] hover:bg-[#A44C5C] hover:text-white border border-[#A44C5C]/10 py-1.5 rounded-xl font-bold font-sans transition-all text-[11px] text-center flex items-center justify-center gap-1.5 cursor-pointer uppercase select-none"
                  onClick={() => {
                    window.open(item.url, '_blank');
                  }}
                >
                  📥 تحميل الصورة
                </button>
                <button
                  onClick={() => {
                    window.open(item.url, '_blank');
                  }}
                  className="bg-stone-50 border border-stone-200 hover:bg-stone-100 p-1.5 rounded-xl text-stone-500 hover:text-gray-800 transition-colors cursor-pointer"
                  title="عرض مكبر"
                >
                  🔍
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
