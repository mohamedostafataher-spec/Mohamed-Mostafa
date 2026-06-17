import React, { useState, useEffect } from 'react';
import { Truck, Coins, ShieldCheck, Save, RefreshCw, Smartphone, Globe, Landmark, Sparkles } from 'lucide-react';
import { Settings, ShippingRate, Product } from '../types';
import { dbService } from '../services/db';

interface GlobalSystemConfigProps {
  settings?: Settings;
  onSaveComplete?: () => void;
  products?: Product[];
}

export default function GlobalSystemConfig({
  settings,
  onSaveComplete,
  products = [],
}: GlobalSystemConfigProps) {
  const [saving, setSaving] = useState(false);
  
  // Local states corresponding to settings DB
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [defaultShippingFee, setDefaultShippingFee] = useState(0);
  const [contactPhone, setContactPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [siteName, setSiteName] = useState('SULTA');

  // Country specific states
  const [egDefaultCoupon, setEgDefaultCoupon] = useState('');
  const [saDefaultCoupon, setSaDefaultCoupon] = useState('');
  const [egExclusiveProductIds, setEgExclusiveProductIds] = useState<string[]>([]);
  const [saExclusiveProductIds, setSaExclusiveProductIds] = useState<string[]>([]);

  useEffect(() => {
    if (settings) {
      setShippingRates(settings.shippingRates || [
        { regionAr: 'شحن موحد لجميع محافظات مصر 🇪🇬', regionEn: 'Egypt Flat Shipping Rate', fee: 100 },
        { regionAr: 'شحن موحد لجميع مدن المملكة العربية السعودية 🇸🇦', regionEn: 'KSA Flat Shipping Rate', fee: 50 }
      ]);
      setDefaultShippingFee(settings.defaultShippingFee || 45);
      setContactPhone(settings.contactPhone || '');
      setWhatsapp(settings.whatsapp || '');
      setInstagram(settings.instagram || '');
      setSiteName(settings.siteName || 'SULTA');

      setEgDefaultCoupon(settings.egDefaultCoupon || '');
      setSaDefaultCoupon(settings.saDefaultCoupon || '');
      setEgExclusiveProductIds(settings.egExclusiveProductIds || []);
      setSaExclusiveProductIds(settings.saExclusiveProductIds || []);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload: Partial<Settings> = {
        ...settings,
        siteName,
        shippingRates,
        defaultShippingFee,
        contactPhone,
        whatsapp,
        instagram,
        egDefaultCoupon,
        saDefaultCoupon,
        egExclusiveProductIds,
        saExclusiveProductIds,
      };

      const success = await dbService.saveHomepageSection('general_settings_global_v2', payload);
      const dbSuccess = await dbService.saveHomepageSection('settings', payload);

      if (success || dbSuccess) {
        alert('تم حفظ الإعدادات الإقليمية لـ SULTA بنجاح! 🇸🇦 🇪🇬');
        if (onSaveComplete) onSaveComplete();
      } else {
        alert('فشل حفظ إعدادات الأنظمة الإقليمية.');
      }
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الاتصال بقاعدة البيانات.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateFee = (idx: number, fee: number) => {
    const nextRates = [...shippingRates];
    nextRates[idx].fee = fee;
    setShippingRates(nextRates);
  };

  return (
    <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs text-right font-sans" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 mb-6 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#A44C5C]/15 text-[#A44C5C] text-[10px] font-bold tracking-widest px-2.5 py-0.5 rounded-full font-sans">
              GLOBAL EXPORTS & SHIPPING
            </span>
            <span className="text-[10px] text-gray-400 font-sans">التجهيز لأسواق الخليج العربي ومصر</span>
          </div>
          <h3 className="text-xl font-serif font-light text-gray-900 mt-2">
            بوابة الإعدادات الإقليمية وأنظمة الشحن الثنائية
          </h3>
          <p className="text-gray-400 text-xs mt-1 leading-relaxed">
            التحكم الكامل بأسعار الشحن الموحد وسعر الصرف التقديري، وتوجيه خدمات الدعم الفني الملكي لقاصدي البوتيك من مصر والسعودية.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          type="button"
          className="bg-[#A44C5C] hover:bg-[#DF8A9D] text-white text-xs font-bold px-6 py-2.5 rounded-full transition-all flex items-center gap-2 cursor-pointer shadow-xs"
        >
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          <span>{saving ? 'جاري الحفظ الملكي...' : 'حفظ الإعدادات الإقليمية'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section: Shipping Fees */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 justify-start">
              <Truck size={16} className="text-[#A44C5C]" />
              <span>إدارة رسوم الشحن الثنائي وعلي الحدود</span>
            </h4>

            <div className="space-y-3 font-sans text-xs">
              {shippingRates.map((rate, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-gray-900">{rate.regionAr}</span>
                    <Globe size={14} className="text-gray-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={rate.fee}
                      onChange={(e) => handleUpdateFee(idx, Number(e.target.value))}
                      className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 w-28 text-center text-sm font-bold font-sans outline-none focus:border-[#A44C5C]"
                    />
                    <span className="text-gray-500 font-sans font-semibold">
                      {idx === 0 ? 'EGP (جمهورية مصر العربية)' : 'SAR (المملكة العربية السعودية)'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Channels Support Connections */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 justify-start">
              <Smartphone size={16} className="text-[#A44C5C]" />
              <span>قنوات الدعم الملكي (الكونسيرج والواتساب)</span>
            </h4>

            <div className="space-y-3 font-sans text-xs">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1 font-bold">اسم البراند باللوحة</label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-150 rounded-xl px-4 py-2.5 text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1 font-bold">هاتف الاتصال للدعم</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="201000000000+ أو +966..."
                  className="w-full bg-gray-50 border border-gray-150 rounded-xl px-4 py-2.5 text-xs text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1 font-bold">رابط / رقم الواتساب المباشر للكونسيرج</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="https://wa.me/201..."
                  className="w-full bg-gray-50 border border-gray-150 rounded-xl px-4 py-2.5 text-xs text-left"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Country-specific Virtual Coupon Codes & Exclusive Product Groups */}
        <div className="border-t border-gray-150 pt-6 mt-6 space-y-6">
          <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 justify-start font-serif">
            <Sparkles size={16} className="text-[#A44C5C]" />
            <span>العروض والمنتجات الحصرية المخصصة حسب الدول 🇸🇦 🇪🇬</span>
          </h4>
          <p className="text-xs text-gray-400">
            أدخل هنا الكود المخصص الذي يتم تطبيقه تلقائياً للزوار بمجرد التعرف على دولتهم، وحدد المنتجات الحصرية التي تظهر وتتوفر فقط لعملاء هذه الدولة.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Egypt Specific Section */}
            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-150 space-y-4 text-right">
              <div className="flex items-center gap-1.5 font-bold text-[#A44C5C] justify-start">
                <span className="text-base">🇪🇬</span>
                <span>تخصيص زوار جمهورية مصر العربية</span>
              </div>

              <div>
                <label className="block text-[10px] text-stone-500 mb-1 font-bold text-right">كود الخصم الافتراضي التلقائي لمصر</label>
                <input
                  type="text"
                  value={egDefaultCoupon}
                  onChange={(e) => setEgDefaultCoupon(e.target.value.toUpperCase())}
                  placeholder="مثال: EGYPT20"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-sans text-center"
                />
              </div>

              <div>
                <label className="block text-[10px] text-stone-500 mb-1 font-bold text-right">المنتجات الحصرية لمصر (تظهر فقط لزوار مصر)</label>
                <div className="bg-white border border-gray-150 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2 text-xs">
                  {products && products.length > 0 ? (
                    products.map((p) => {
                      const checked = egExclusiveProductIds.includes(p.id);
                      return (
                        <label key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-stone-50 p-1.5 rounded justify-start">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setEgExclusiveProductIds(egExclusiveProductIds.filter(id => id !== p.id));
                              } else {
                                setEgExclusiveProductIds([...egExclusiveProductIds, p.id]);
                              }
                            }}
                            className="rounded border-gray-300 text-[#A44C5C] focus:ring-[#A44C5C]"
                          />
                          <span className="truncate">{p.nameAr || p.nameEn}</span>
                        </label>
                      );
                    })
                  ) : (
                    <span className="text-[10px] text-gray-400 block text-center py-2">لا توجد منتجات متطابقة</span>
                  )}
                </div>
              </div>
            </div>

            {/* Saudi Arabia Specific Section */}
            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-150 space-y-4 text-right">
              <div className="flex items-center gap-1.5 font-bold text-[#A44C5C] justify-start">
                <span className="text-base">🇸🇦</span>
                <span>تخصيص زوار المملكة العربية السعودية</span>
              </div>

              <div>
                <label className="block text-[10px] text-stone-500 mb-1 font-bold text-right">كود الخصم الافتراضي التلقائي للسعودية</label>
                <input
                  type="text"
                  value={saDefaultCoupon}
                  onChange={(e) => setSaDefaultCoupon(e.target.value.toUpperCase())}
                  placeholder="مثال: KSA15"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-sans text-center"
                />
              </div>

              <div>
                <label className="block text-[10px] text-stone-500 mb-1 font-bold text-right">المنتجات الحصرية للسعودية (تظهر فقط لزوار السعودية)</label>
                <div className="bg-white border border-gray-150 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2 text-xs">
                  {products && products.length > 0 ? (
                    products.map((p) => {
                      const checked = saExclusiveProductIds.includes(p.id);
                      return (
                        <label key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-stone-50 p-1.5 rounded justify-start">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setSaExclusiveProductIds(saExclusiveProductIds.filter(id => id !== p.id));
                              } else {
                                setSaExclusiveProductIds([...saExclusiveProductIds, p.id]);
                              }
                            }}
                            className="rounded border-gray-300 text-[#A44C5C] focus:ring-[#A44C5C]"
                          />
                          <span className="truncate">{p.nameAr || p.nameEn}</span>
                        </label>
                      );
                    })
                  ) : (
                    <span className="text-[10px] text-gray-400 block text-center py-2">لا توجد منتجات متطابقة</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-2 text-xs text-emerald-850 justify-start">
          <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
          <span>لقد جرى ضبط ومزامنة جداول الشحن الثنائية مع السحاب للحفاظ على معدلات الشراء سلسة وموثوقة بنسبة 100%.</span>
        </div>
      </form>
    </div>
  );
}
