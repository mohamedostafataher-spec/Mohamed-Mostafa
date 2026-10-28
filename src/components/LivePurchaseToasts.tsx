import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, MapPin, Check } from 'lucide-react';

interface Activity {
  id: number;
  name: string;
  city: string;
  product: string;
  time: string;
}

const ACTIVITIES: Activity[] = [
  { id: 1, name: 'سارة', city: 'الرياض', product: 'بيجامة ليلك المنقّط', time: 'منذ ٢ دقيقة' },
  { id: 2, name: 'نورة', city: 'جدة', product: 'بيجامة سُكّر الملكية', time: 'منذ ٥ دقائق' },
  { id: 3, name: 'مها', city: 'الدمام', product: 'طقم كوتور الوردي', time: 'منذ ١٠ دقائق' },
  { id: 4, name: 'عبير', city: 'مكة', product: 'بيجامة روزا الفاخرة', time: 'منذ ٣ دقائق' },
  { id: 5, name: 'ليلى', city: 'الخبر', product: 'روب العروس الملكي', time: 'منذ ٨ دقائق' },
  { id: 6, name: 'هيفاء', city: 'تبوك', product: 'بيجامة فلورا', time: 'منذ دقيقة واحدة' },
];

export default function LivePurchaseToasts() {
  const [current, setCurrent] = useState<Activity | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const showNext = () => {
      // Show notification
      setCurrent(ACTIVITIES[index]);
      setIndex((prev) => (prev + 1) % ACTIVITIES.length);

      // Hide after 5 seconds
      setTimeout(() => {
        setCurrent(null);
      }, 5000);
    };

    // Initial delay
    const timer = setTimeout(showNext, 10000);
    
    // Repeat interval
    const interval = setInterval(showNext, 25000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [index]);

  return (
    <div className="fixed bottom-20 left-4 z-[60] pointer-events-none hidden sm:block">
      <AnimatePresence>
        {current && (
          <motion.div
            initial={{ opacity: 0, x: -50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.9 }}
            className="bg-white/95 backdrop-blur-md border border-gray-100 shadow-xl rounded-2xl p-3 flex items-center gap-3 max-w-xs pointer-events-auto"
            dir="rtl"
          >
            <div className="w-10 h-10 rounded-full bg-[#FCF5F6] text-[#A44C5C] flex items-center justify-center shrink-0">
              <ShoppingBag size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                <span>تم تأكيد طلب جديد</span>
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
              </p>
              <h4 className="text-xs font-bold text-gray-900 truncate">
                {current.name} من {current.city}
              </h4>
              <p className="text-[10px] text-gray-400 truncate">
                اشترت: {current.product} ({current.time})
              </p>
            </div>
            <div className="mr-auto pl-1">
              <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Check size={12} strokeWidth={3} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
