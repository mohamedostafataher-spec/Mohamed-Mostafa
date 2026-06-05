import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Search, Edit2 } from 'lucide-react';
import { dbService } from '../services/db';
import { AdvancedCoupon } from '../types';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<AdvancedCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState<Partial<AdvancedCoupon>>({});

  useEffect(() => {
    const unsub = dbService.subscribeAdvancedCoupons(
      (data) => {
        setCoupons(data);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCoupon.code || !currentCoupon.type) return;

    try {
      const payload: AdvancedCoupon = {
        id: currentCoupon.id || `CPN-${Date.now()}`,
        code: currentCoupon.code.toUpperCase(),
        type: currentCoupon.type as any,
        value: Number(currentCoupon.value || 0),
        expirationDate: currentCoupon.expirationDate,
        usageLimit: currentCoupon.usageLimit ? Number(currentCoupon.usageLimit) : undefined,
        timesUsed: currentCoupon.timesUsed || 0,
        minOrderValue: currentCoupon.minOrderValue ? Number(currentCoupon.minOrderValue) : undefined,
        description: currentCoupon.description || '',
        active: currentCoupon.active !== undefined ? currentCoupon.active : true
      };
      await dbService.saveAdvancedCoupon(payload);
      setIsEditing(false);
      setCurrentCoupon({});
      alert('تم حفظ الكوبون بنجاح');
    } catch (err) {
      alert('فشل الحفظ');
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm('هل أنت متأكد؟')) return;
    try {
      await dbService.deleteAdvancedCoupon(id);
    } catch {
      alert('فشل الحذف');
    }
  };

  const filtered = coupons.filter(c => c.code.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl font-serif text-[#0B0B0B] flex items-center gap-2">
            <Tag size={20} className="text-[#A44C5C]" />
            إدارة الكوبونات المتقدمة
          </h3>
          <p className="text-gray-500 text-xs mt-1">إنشاء وتتبع كوبونات الخصم والشحن المجاني</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => { setCurrentCoupon({ type: 'percentage', active: true }); setIsEditing(true); }}
            className="px-4 py-2 bg-[#A44C5C] text-white rounded-lg text-xs font-semibold flex items-center gap-2"
          >
            <Plus size={16} /> إضافة كوبون
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">كود الخصم</label>
              <input type="text" required value={currentCoupon.code || ''} onChange={e => setCurrentCoupon({...currentCoupon, code: e.target.value.toUpperCase()})} className="w-full border p-2 rounded text-sm"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">نوع الكوبون</label>
              <select value={currentCoupon.type || 'percentage'} onChange={e => setCurrentCoupon({...currentCoupon, type: e.target.value as any})} className="w-full border p-2 rounded text-sm">
                <option value="percentage">نسبة مئوية (%)</option>
                <option value="fixed">مبلغ ثابت</option>
                <option value="free_shipping">شحن مجاني</option>
              </select>
            </div>
            {currentCoupon.type !== 'free_shipping' && (
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">القيمة</label>
                <input type="number" step="0.1" required value={currentCoupon.value || ''} onChange={e => setCurrentCoupon({...currentCoupon, value: e.target.value as any})} className="w-full border p-2 rounded text-sm"/>
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">تاريخ الانتهاء</label>
              <input type="date" value={currentCoupon.expirationDate || ''} onChange={e => setCurrentCoupon({...currentCoupon, expirationDate: e.target.value})} className="w-full border p-2 rounded text-sm"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">حد الاستخدام (اختياري)</label>
              <input type="number" placeholder="غير محدود" value={currentCoupon.usageLimit || ''} onChange={e => setCurrentCoupon({...currentCoupon, usageLimit: e.target.value as any})} className="w-full border p-2 rounded text-sm"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">الحد الأدنى للطلب (اختياري)</label>
              <input type="number" value={currentCoupon.minOrderValue || ''} onChange={e => setCurrentCoupon({...currentCoupon, minOrderValue: e.target.value as any})} className="w-full border p-2 rounded text-sm"/>
            </div>
          </div>
          <div className="flex justify-end gap-3">
             <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded-lg text-xs font-bold text-gray-600">إلغاء</button>
             <button type="submit" className="px-4 py-2 bg-[#A44C5C] text-white rounded-lg text-xs font-bold">حفظ الكوبون</button>
          </div>
        </form>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-3 text-[10px] uppercase text-gray-500 font-bold">الكود</th>
                <th className="p-3 text-[10px] uppercase text-gray-500 font-bold">النوع والقيمة</th>
                <th className="p-3 text-[10px] uppercase text-gray-500 font-bold">الاستخدام</th>
                <th className="p-3 text-[10px] uppercase text-gray-500 font-bold">الانتهاء</th>
                <th className="p-3 text-[10px] uppercase text-gray-500 font-bold">الحالة</th>
                <th className="p-3 text-[10px] uppercase text-gray-500 font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono font-bold text-sm tracking-wider">{c.code}</td>
                  <td className="p-3 text-xs text-gray-600">
                    {c.type === 'percentage' ? `${c.value}%` : c.type === 'fixed' ? `${c.value} SAR/EGP` : 'شحن مجاني'}
                  </td>
                  <td className="p-3 text-xs text-gray-500">
                    {c.timesUsed} {c.usageLimit ? `/ ${c.usageLimit}` : 'استخدام'}
                  </td>
                  <td className="p-3 text-xs text-gray-500">{c.expirationDate || 'مفتوح'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${c.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'}`}>
                      {c.active ? 'مفعل' : 'معطل'}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => { setCurrentCoupon(c); setIsEditing(true); }} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit2 size={16}/></button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
