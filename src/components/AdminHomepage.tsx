import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Image as ImageIcon, Layout, Star, Truck, Sparkles } from 'lucide-react';
import { dbService } from '../services/db';

export default function AdminHomepage() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    setLoading(true);
    const data = await dbService.getHomepageSections();
    setSections(data);
    setLoading(false);
  };

  const handleSaveSection = async (sectionKey: string, content: any) => {
    setSaving(true);
    const success = await dbService.saveHomepageSection(sectionKey, content);
    if (success) {
      alert('تم حفظ التغييرات بنجاح!');
      loadSections();
    } else {
      alert('فشل حفظ التغييرات.');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-10 text-center animate-pulse">جاري تحميل إعدادات الصفحة الرئيسية...</div>;

  const heroSection = sections.find(s => s.section_key === 'hero_banners')?.content_json || { banners: [] };
  const featuresSection = sections.find(s => s.section_key === 'features_list')?.content_json || { qualities: [], unboxing: {} };

  return (
    <div className="space-y-12 p-6 pb-24 bg-white rounded-3xl shadow-sm border border-gray-100 font-sans text-right" dir="rtl">
      
      {/* SECTION: HERO BANNERS */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-xl font-serif font-bold text-[#0B0B0B] flex items-center gap-3">
            <Layout className="text-[#A44C5C]" />
            إدارة البانر الرئيسي (Hero Slider)
          </h2>
          <button 
            onClick={() => handleSaveSection('hero_banners', heroSection)}
            disabled={saving}
            className="bg-[#A44C5C] text-white px-6 py-2 rounded-full text-xs hover:bg-[#DF8A9D] transition-colors flex items-center gap-2"
          >
            <Save size={14} />
            حفظ التغييرات
          </button>
        </div>

        <div className="space-y-4">
          {heroSection.banners.map((banner: any, idx: number) => (
            <div key={idx} className="p-6 bg-[#FAF5F0] rounded-2xl border border-[#DF8A9D]/10 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              <button 
                onClick={() => {
                  const newBanners = [...heroSection.banners];
                  newBanners.splice(idx, 1);
                  handleSaveSection('hero_banners', { ...heroSection, banners: newBanners });
                }}
                className="absolute top-4 left-4 text-red-400 hover:text-red-600 transition-colors"
                title="حذف البانر"
              >
                <Trash2 size={18} />
              </button>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">رابط الصورة / الفيديو</label>
                  <input 
                    type="text" 
                    value={banner.mediaUrl} 
                    onChange={(e) => {
                      const newBanners = [...heroSection.banners];
                      newBanners[idx].mediaUrl = e.target.value;
                      setSections(prev => prev.map(s => s.section_key === 'hero_banners' ? { ...s, content_json: { ...heroSection, banners: newBanners } } : s));
                    }}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#A44C5C]"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">العنوان الرئيسي (English)</label>
                  <input 
                    type="text" 
                    value={banner.title} 
                    onChange={(e) => {
                      const newBanners = [...heroSection.banners];
                      newBanners[idx].title = e.target.value;
                      setSections(prev => prev.map(s => s.section_key === 'hero_banners' ? { ...s, content_json: { ...heroSection, banners: newBanners } } : s));
                    }}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-serif"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">العنوان الفرعي</label>
                  <input 
                    type="text" 
                    value={banner.subtitle} 
                    onChange={(e) => {
                      const newBanners = [...heroSection.banners];
                      newBanners[idx].subtitle = e.target.value;
                      setSections(prev => prev.map(s => s.section_key === 'hero_banners' ? { ...s, content_json: { ...heroSection, banners: newBanners } } : s));
                    }}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">الوصف المختصر</label>
                  <textarea 
                    value={banner.description} 
                    onChange={(e) => {
                      const newBanners = [...heroSection.banners];
                      newBanners[idx].description = e.target.value;
                      setSections(prev => prev.map(s => s.section_key === 'hero_banners' ? { ...s, content_json: { ...heroSection, banners: newBanners } } : s));
                    }}
                    rows={2}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
          <button 
            onClick={() => {
              const newBanners = [...heroSection.banners, { mediaUrl: '', title: 'NEW COLLECTION', subtitle: 'Luxury Awaits', description: '', ctaText: 'Explore Now', active: true }];
              setSections(prev => prev.map(s => s.section_key === 'hero_banners' ? { ...s, content_json: { ...heroSection, banners: newBanners } } : s));
            }}
            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-[#A44C5C] hover:border-[#A44C5C]/30 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Plus size={16} />
            إضافة بانر جديد
          </button>
        </div>
      </section>

      {/* SECTION: FEATURES & UNBOXING */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-xl font-serif font-bold text-[#0B0B0B] flex items-center gap-3">
            <Sparkles className="text-[#A44C5C]" />
            إدارة المميزات وتجربة فتح الصندوق
          </h2>
          <button 
            onClick={() => handleSaveSection('features_list', featuresSection)}
            disabled={saving}
            className="bg-[#A44C5C] text-white px-6 py-2 rounded-full text-xs hover:bg-[#DF8A9D] transition-colors flex items-center gap-2"
          >
            <Save size={14} />
            حفظ إعدادات المميزات
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Qualities Grid */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 mb-4 tracking-wider underline underline-offset-8 decoration-[#DF8A9D]/30">قائمة المميزات الست</h3>
            {featuresSection.qualities?.map((q: any, idx: number) => (
              <div key={idx} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-[#FAF5F0] flex items-center justify-center text-[#A44C5C] font-bold text-xs">
                     {idx + 1}
                   </div>
                   <input 
                    type="text" 
                    value={q.title} 
                    onChange={(e) => {
                      const newQualities = [...featuresSection.qualities];
                      newQualities[idx].title = e.target.value;
                      setSections(prev => prev.map(s => s.section_key === 'features_list' ? { ...s, content_json: { ...featuresSection, qualities: newQualities } } : s));
                    }}
                    className="flex-1 bg-transparent border-b border-gray-100 focus:border-[#A44C5C] py-1 text-sm font-bold outline-none"
                    placeholder="العنوان..."
                  />
                </div>
                <textarea 
                  value={q.desc} 
                  onChange={(e) => {
                    const newQualities = [...featuresSection.qualities];
                    newQualities[idx].desc = e.target.value;
                    setSections(prev => prev.map(s => s.section_key === 'features_list' ? { ...s, content_json: { ...featuresSection, qualities: newQualities } } : s));
                  }}
                  className="w-full bg-[#FAF5F0]/50 rounded-xl px-3 py-2 text-xs text-gray-500 outline-none focus:bg-white transition-colors"
                  placeholder="الوصف التفصيلي..."
                  rows={2}
                />
              </div>
            ))}
          </div>

          {/* Unboxing Manager */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-gray-700 mb-4 tracking-wider underline underline-offset-8 decoration-[#DF8A9D]/30">محتوى تجربة فتح الصندوق (Unboxing)</h3>
            <div className="p-6 bg-[#0B0B0B] text-[#FAF5F0] rounded-[2.5rem] space-y-6">
               <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">عنوان القسم</label>
                  <input 
                    type="text" 
                    value={featuresSection.unboxing?.title} 
                    onChange={(e) => {
                      const newUnboxing = { ...featuresSection.unboxing, title: e.target.value };
                      setSections(prev => prev.map(s => s.section_key === 'features_list' ? { ...s, content_json: { ...featuresSection, unboxing: newUnboxing } } : s));
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#DF8A9D] outline-none"
                  />
               </div>
               <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">النص الملهم</label>
                  <textarea 
                    value={featuresSection.unboxing?.description} 
                    onChange={(e) => {
                      const newUnboxing = { ...featuresSection.unboxing, description: e.target.value };
                      setSections(prev => prev.map(s => s.section_key === 'features_list' ? { ...s, content_json: { ...featuresSection, unboxing: newUnboxing } } : s));
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm italic font-serif focus:border-[#DF8A9D] outline-none"
                    rows={4}
                  />
               </div>
               <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">النقطة الأولى</label>
                    <input 
                      type="text" 
                      value={featuresSection.unboxing?.bullet1} 
                      onChange={(e) => {
                        const newUnboxing = { ...featuresSection.unboxing, bullet1: e.target.value };
                        setSections(prev => prev.map(s => s.section_key === 'features_list' ? { ...s, content_json: { ...featuresSection, unboxing: newUnboxing } } : s));
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">النقطة الثانية</label>
                    <input 
                      type="text" 
                      value={featuresSection.unboxing?.bullet2} 
                      onChange={(e) => {
                        const newUnboxing = { ...featuresSection.unboxing, bullet2: e.target.value };
                        setSections(prev => prev.map(s => s.section_key === 'features_list' ? { ...s, content_json: { ...featuresSection, unboxing: newUnboxing } } : s));
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs"
                    />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
