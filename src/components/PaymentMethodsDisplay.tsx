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
        <div className="flex items-center gap-3 bg-emerald-50/90 border-2 border-emerald-200 rounded-2xl px-4 py-3 shadow-sm hover:border-emerald-400 transition-all group">
          <div className="w-14 h-14 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
            <Banknote size={32} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-base font-black text-emerald-950 leading-tight">الدفع عند الاستلام</span>
            <span className="text-xs text-emerald-700 font-bold">ادفعي بأمان عند استلام طلبيتكِ</span>
          </div>
        </div>

        {/* تحويل حساب بنكي */}
        <div className="flex items-center gap-3 bg-blue-50/90 border-2 border-blue-200 rounded-2xl px-4 py-3 shadow-sm hover:border-blue-400 transition-all group">
          <div className="w-14 h-14 rounded-xl bg-[#004B87] text-white flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
            <Building2 size={32} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-base font-black text-blue-950 leading-tight">تحويل حساب بنكي</span>
            <span className="text-xs text-blue-700 font-bold">الراجحي / الأهلي (IBAN مباشر)</span>
          </div>
        </div>

        {/* مدى */}
        <div className="flex items-center gap-3 bg-amber-50/90 border-2 border-amber-200 rounded-2xl px-4 py-3 shadow-sm hover:border-amber-400 transition-all group">
          <div className="w-14 h-14 rounded-xl bg-[#007A3D] text-white flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform font-black text-lg tracking-tighter">
            mada
          </div>
          <div className="flex flex-col text-right">
            <span className="text-base font-black text-amber-950 leading-tight">بطاقة مدى (mada)</span>
            <span className="text-xs text-amber-800 font-bold">دفع فوري آمن ببطاقتكِ البنكية</span>
          </div>
        </div>
      </div>

      {/* 2. Official Visual Payment Partner Badge (Enlarged and Crisp) */}
      <div className="bg-white p-4 rounded-3xl border-2 border-gray-100 shadow-md hover:border-[#A44C5C]/30 transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
            <ShieldCheck size={20} className="text-emerald-600" />
          </div>
          <span className="text-xs sm:text-sm font-black text-gray-900">
            بوابات دفع سعودية معتمدة ومشفرة 100%
          </span>
        </div>
        <div className="flex items-center justify-center bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
          <img 
            src="/assets/aistudio/YHdjS5O14jZZWQXsG7gybkOtD7CRXcklAxkIe83q_9b507384.jpeg" 
            alt="طرق الدفع المعتمدة: مدى، تحويل بنكي، الدفع عند الاستلام، ابل باي، فيزا وماستركارد" 
            className="h-12 sm:h-14 w-auto object-contain max-w-full rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
