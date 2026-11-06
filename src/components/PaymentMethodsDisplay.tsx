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
        <div className="flex items-center gap-2 bg-emerald-50/70 border border-emerald-200/60 rounded-lg px-2 py-1.5">
          <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Banknote size={12} />
          </div>
          <div className="flex flex-col text-right leading-tight">
            <span className="text-[10.5px] font-bold text-emerald-950">الدفع عند الاستلام</span>
            <span className="text-[8.5px] text-emerald-700">آمن وموثوق</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-blue-50/70 border border-blue-200/60 rounded-lg px-2 py-1.5">
          <div className="w-5 h-5 rounded-md bg-[#004B87] text-white flex items-center justify-center shrink-0">
            <Building2 size={12} />
          </div>
          <div className="flex flex-col text-right leading-tight">
            <span className="text-[10.5px] font-bold text-blue-950">تحويل بنكي مباشر</span>
            <span className="text-[8.5px] text-blue-700">الراجحي / الأهلي</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 w-full" dir="rtl">
      <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/70 rounded-lg px-2.5 py-1.5">
        <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
          <Banknote size={13} />
        </div>
        <div className="flex flex-col text-right leading-tight">
          <span className="text-[11px] font-bold text-emerald-950">الدفع عند الاستلام</span>
          <span className="text-[9px] text-emerald-700">متاح لكافة مناطق المملكة</span>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-blue-50/80 border border-blue-200/70 rounded-lg px-2.5 py-1.5">
        <div className="w-5 h-5 rounded-md bg-[#004B87] text-white flex items-center justify-center shrink-0">
          <Building2 size={13} />
        </div>
        <div className="flex flex-col text-right leading-tight">
          <span className="text-[11px] font-bold text-blue-950">تحويل بنكي فوري</span>
          <span className="text-[9px] text-blue-700">الراجحي / الأهلي (مدى)</span>
        </div>
      </div>
    </div>
  );
}
