import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { PromotionCampaign } from '../types';
import { Search, Plus, Trash2, Calendar, Target, Edit3, Check, X } from 'lucide-react';

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState<PromotionCampaign[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [val, setVal] = useState(10);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState('');
  const [bannerText, setBannerText] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const unsub = dbService.subscribePromotions(setPromotions, console.error);
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const promo: PromotionCampaign = {
      id: crypto.randomUUID(),
      name,
      description: desc,
      discountType: type,
      discountValue: val,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isActive,
      bannerText,
      createdAt: new Date().toISOString()
    };
    await dbService.savePromotion(promo);
    setShowForm(false);
    
    // Reset
    setName('');
    setDesc('');
    setVal(10);
    setBannerText('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الحملة؟')) {
      await dbService.deletePromotion(id);
    }
  };

  const toggleStatus = async (promo: PromotionCampaign) => {
    await dbService.savePromotion({ ...promo, isActive: !promo.isActive });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-150 pb-4">
        <div>
          <h3 className="font-serif text-lg text-[#0B0B0B]">محرك العروض والحملات (Promotion Engine)</h3>
          <p className="text-gray-500 text-xs mt-1">إعداد الفلاش سيل، حملات نهاية العام، وعروض رمضان والعيد</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#0B0B0B] text-[#F6E7A6] px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'إلغاء' : 'إطلاق حملة جديدة'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-[#FAFAF7] border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 block mb-1 text-xs font-bold">اسم الحملة (مثال: خصم عيد الفطر)</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded-lg" />
            </div>
            <div>
              <label className="text-gray-400 block mb-1 text-xs font-bold">نص شريط الإعلانات العُلوي (Banner)</label>
              <input placeholder="مثال: خصومات حصرية 20% لفترة محدودة!" value={bannerText} onChange={e => setBannerText(e.target.value)} className="w-full border p-2 rounded-lg" />
            </div>
            <div>
              <label className="text-gray-400 block mb-1 text-xs font-bold">نوع الخصم</label>
              <select value={type} onChange={e => setType(e.target.value as any)} className="w-full border p-2 rounded-lg">
                <option value="percentage">نسبة مئوية (%)</option>
                <option value="fixed">مبلغ ثابت</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 block mb-1 text-xs font-bold">قيمة الخصم</label>
              <input type="number" required value={val} onChange={e => setVal(Number(e.target.value))} className="w-full border p-2 rounded-lg" />
            </div>
            <div>
              <label className="text-gray-400 block mb-1 text-xs font-bold">تاريخ البدء</label>
              <input type="datetime-local" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border p-2 rounded-lg" dir="ltr" />
            </div>
            <div>
              <label className="text-gray-400 block mb-1 text-xs font-bold">تاريخ الانتهاء</label>
              <input type="datetime-local" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border p-2 rounded-lg" dir="ltr" />
            </div>
            <div className="md:col-span-2">
              <label className="text-gray-400 block mb-1 text-xs font-bold">وصف داخلي (للإدارة فقط)</label>
              <input value={desc} onChange={e => setDesc(e.target.value)} className="w-full border p-2 rounded-lg" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" className="bg-[#0B0B0B] text-white px-6 py-2 rounded-lg">حفظ وجدولة الحملة</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {promotions.map(p => {
          const isOngoing = new Date(p.startDate) <= new Date() && new Date(p.endDate) >= new Date();
          const StatusIcon = p.isActive && isOngoing ? Check : Target;
          return (
            <div key={p.id} className="border p-5 rounded-2xl bg-white shadow-sm flex flex-col justify-between hover:border-gray-300 transition-colors">
               <div className="flex justify-between items-start">
                 <div>
                   <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2 flex gap-2 items-center">
                     {p.name}
                     {p.isActive && isOngoing && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-sans animate-pulse">نشطة الآن</span>}
                     {!p.isActive && <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full font-sans">متوقفة</span>}
                   </h4>
                   <div className="mt-3 text-xs text-gray-600 font-sans space-y-2">
                      <p><strong className="text-gray-400">القيمة:</strong> خصم {p.discountValue}{p.discountType === 'percentage' ? '%' : ' ثابت'}</p>
                      <p dir="ltr" className="text-right"><strong className="text-gray-400">الفترة:</strong> {new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()}</p>
                      {p.bannerText && <p className="bg-[#FAFAF7] p-2 rounded text-[#A44C5C]">شريط البانر: {p.bannerText}</p>}
                   </div>
                 </div>
                 <div className="flex flex-col gap-2">
                    <button onClick={() => toggleStatus(p)} className="p-2 border rounded-xl hover:bg-gray-50 text-gray-600" title="تفعيل/إيقاف">
                      <StatusIcon size={16} className={p.isActive ? "text-green-600" : "text-gray-400"} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 border text-red-500 rounded-xl hover:bg-red-50" title="حذف">
                      <Trash2 size={16} />
                    </button>
                 </div>
               </div>
            </div>
          )
        })}
      </div>
      
      {promotions.length === 0 && (
        <div className="text-center py-12 text-gray-400 bg-[#FAFAF7] rounded-3xl border border-dashed">
          <Target size={48} className="mx-auto mb-3 opacity-20" />
          <p>لا يوجد حملات ترويجية مبرمجة حالياً</p>
        </div>
      )}
    </div>
  );
}
