import React, { useState } from 'react';
import { dbService } from '../services/db';
import type { Product } from '../types';

/** Shown only when a product is sold out. Stores the visitor's phone or email for the store owner. */
export default function StockAlertForm({ product }: { product: Product }) {
  const [contact, setContact] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = contact.trim();
    if (v.length < 6) return;
    setState('sending');
    try {
      await dbService.saveStockAlert({
        id: `Sulta-ALERT-${Math.floor(100000 + Math.random() * 900000)}`,
        productId: product.id,
        productName: product.nameAr,
        color: product.colors?.[0]?.name || '',
        size: 'One Size',
        emailOrPhone: v,
        date: new Date().toISOString()
      });
      setState('done');
    } catch {
      setState('error');
    }
  };

  if (state === 'done') {
    return <p className="mt-3 text-sm font-bold text-emerald-700" role="status">تم تسجيل طلبك. نتواصل معك لما تتوفر القطعة.</p>;
  }

  return (
    <form onSubmit={submit} className="mt-3 rounded-2xl border border-gray-200 bg-white p-4 space-y-2" dir="rtl">
      <p className="text-sm font-bold text-gray-900">القطعة غير متوفرة حالياً. سجلي رقمك أو إيميلك ونتواصل معك لما تتوفر.</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="رقم الجوال أو الإيميل"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
          aria-label="رقم الجوال أو الإيميل"
        />
        <button type="submit" disabled={state === 'sending'} className="bg-[#111827] text-white rounded-xl px-4 text-sm font-bold">
          {state === 'sending' ? '...' : 'نبهيني'}
        </button>
      </div>
      <p className="text-[11px] text-gray-500">نستخدم بياناتك فقط لإبلاغك بتوفر هذه القطعة.</p>
      {state === 'error' && <p className="text-xs text-red-600" role="alert">صار خطأ، حاولي مرة ثانية.</p>}
    </form>
  );
}
