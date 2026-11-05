import React from 'react';
import { Banknote, Building2 } from 'lucide-react';

/**
 * PaymentMethodsDisplay - Sulta Official Prominent Payment Methods Display
 * Displays enlarged, high-visibility badges for:
 * 1. الدفع عند الاستلام (Cash on Delivery)
 * 2. تحويل حساب بنكي (Bank Transfer - Al Rajhi & SNB)
 */

interface PaymentMethodsDisplayProps {
  variant?: 'footer' | 'checkout';
}

export default function PaymentMethodsDisplay({ variant = 'footer' }: PaymentMethodsDisplayProps) {
  if (variant === 'footer') {
    return (
      <div className="grid grid-cols-2 gap-2 w-full" dir="rtl">
        <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/80 rounded-xl px-2.5 py-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Banknote size={16} />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[11px] font-bold text-emerald-950 leading-tight">الدفع عند الاستلام</span>
            <span className="text-[9px] text-emerald-700">آمن وموثوق</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-blue-50/80 border border-blue-200/80 rounded-xl px-2.5 py-2">
          <div className="w-7 h-7 rounded-lg bg-[#004B87] text-white flex items-center justify-center shrink-0">
            <Building2 size={16} />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[11px] font-bold text-blue-950 leading-tight">تحويل بنكي</span>
            <span className="text-[9px] text-blue-700">الراجحي / الأهلي</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 w-full my-2" dir="rtl">
      <div className="flex items-center gap-2 bg-emerald-50/75 border border-emerald-200/70 rounded-xl px-3 py-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
          <Banknote size={18} />
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[11px] font-bold text-emerald-950 leading-tight">الدفع عند الاستلام</span>
          <span className="text-[9px] text-emerald-700">متاح وآمن</span>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-blue-50/75 border border-blue-200/70 rounded-xl px-3 py-2">
        <div className="w-8 h-8 rounded-lg bg-[#004B87] text-white flex items-center justify-center shrink-0">
          <Building2 size={18} />
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[11px] font-bold text-blue-950 leading-tight">تحويل بنكي</span>
          <span className="text-[9px] text-blue-700">الراجحي / العربي</span>
        </div>
      </div>
    </div>
  );
}
