import React from 'react';
import { CreditCard, Banknote, Building2, ShieldCheck, CheckCircle2 } from 'lucide-react';

/**
 * PaymentMethodsDisplay - Sulta Official Prominent Payment Methods Display
 * Displays enlarged, high-visibility badges for:
 * 1. الدفع عند الاستلام (Cash on Delivery)
 * 2. تحويل حساب بنكي (Bank Transfer - Al Rajhi & SNB)
 * 3. مدى (mada)
 * 4. Apple Pay & Cards (Visa / Mastercard)
 */

interface PaymentMethodsDisplayProps {
  variant?: 'footer' | 'checkout';
}

export default function PaymentMethodsDisplay({ variant = 'footer' }: PaymentMethodsDisplayProps) {
  const isFooter = variant === 'footer';

  return (
    <div className={`space-y-3 w-full ${variant === 'checkout' ? 'my-3' : ''}`} dir="rtl">
      {/* 1. Large Highlight Badges for Cash on Delivery, Bank Transfer, and Mada */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* الدفع عند الاستلام */}
        <div className="flex items-center gap-2.5 bg-emerald-50/80 border border-emerald-200/90 rounded-xl px-3 py-2 shadow-2xs hover:border-emerald-300 transition-all">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Banknote size={18} strokeWidth={2.2} />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs font-black text-emerald-950 leading-tight">الدفع عند الاستلام</span>
            <span className="text-[10px] text-emerald-700 font-bold">ادفعي بأمان عند الاستلام</span>
          </div>
        </div>

        {/* تحويل حساب بنكي */}
        <div className="flex items-center gap-2.5 bg-blue-50/80 border border-blue-200/90 rounded-xl px-3 py-2 shadow-2xs hover:border-blue-300 transition-all">
          <div className="w-8 h-8 rounded-lg bg-[#004B87] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Building2 size={18} strokeWidth={2.2} />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs font-black text-blue-950 leading-tight">تحويل حساب بنكي</span>
            <span className="text-[10px] text-blue-700 font-bold">الراجحي / الأهلي (IBAN)</span>
          </div>
        </div>

        {/* مدى */}
        <div className="flex items-center gap-2.5 bg-amber-50/80 border border-amber-200/90 rounded-xl px-3 py-2 shadow-2xs hover:border-amber-300 transition-all">
          <div className="w-8 h-8 rounded-lg bg-[#007A3D] text-white flex items-center justify-center shrink-0 shadow-xs font-black text-xs tracking-tighter">
            mada
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs font-black text-amber-950 leading-tight">بطاقة مدى (mada)</span>
            <span className="text-[10px] text-amber-800 font-bold">دفع فوري بالبطاقة البنكية</span>
          </div>
        </div>
      </div>

      {/* 2. Official Visual Payment Partner Badge (Enlarged and Crisp) */}
      <div className="bg-white p-3 rounded-2xl border-2 border-gray-100 shadow-xs hover:border-gray-200 transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <ShieldCheck size={18} className="text-emerald-600" />
          <span className="text-[11px] font-black text-gray-800">
            بوابات دفع سعودية معتمدة ومشفرة 100%
          </span>
        </div>
        <div className="flex items-center justify-center">
          <img 
            src="/assets/aistudio/YHdjS5O14jZZWQXsG7gybkOtD7CRXcklAxkIe83q_9b507384.jpeg" 
            alt="طرق الدفع المعتمدة: مدى، تحويل بنكي، الدفع عند الاستلام، ابل باي، فيزا وماستركارد" 
            className="h-10 sm:h-12 w-auto object-contain max-w-full rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
