import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Image as ImageIcon, Layout, Star, Truck, Sparkles, GripVertical } from 'lucide-react';
import { dbService } from '../services/db';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableBannerProps {
  banner: any;
  idx: number;
  uploadingIdx: number | null;
  handleImageUpload: (idx: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  removeBanner: (idx: number) => void;
  updateBannerField: (idx: number, field: string, value: any) => void;
}

function SortableItem({ banner, idx, uploadingIdx, handleImageUpload, removeBanner, updateBannerField }: SortableBannerProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: idx.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`p-6 bg-[#FAF5F0] rounded-2xl border border-[#DF8A9D]/10 grid grid-cols-1 md:grid-cols-2 gap-6 relative group ${isDragging ? 'shadow-2xl opacity-80' : ''}`}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="absolute -right-3 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-1.5 bg-white rounded-full border border-gray-100 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical size={16} className="text-gray-400" />
      </div>

      <button 
        onClick={() => removeBanner(idx)}
        className="absolute top-4 left-4 text-red-400 hover:text-red-600 transition-colors"
        title="حذف البانر"
      >
        <Trash2 size={18} />
      </button>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">رابط الصورة / الفيديو أو رفع ملف</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={banner.mediaUrl} 
              onChange={(e) => updateBannerField(idx, 'mediaUrl', e.target.value)}
              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#A44C5C]"
              placeholder="https://..."
            />
            <label className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-xl border-2 border-dashed border-[#A44C5C]/20 text-[#A44C5C] hover:bg-[#FAF5F0] transition-colors cursor-pointer ${uploadingIdx === idx ? 'animate-pulse' : ''}`}>
              <input 
                type="file" 
                accept="image/*,video/*" 
                className="hidden" 
                onChange={(e) => handleImageUpload(idx, e)}
                disabled={uploadingIdx !== null}
              />
              <ImageIcon size={18} />
            </label>
          </div>
        </div>
        <div>
          <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">العنوان الرئيسي (English)</label>
          <input 
            type="text" 
            value={banner.title} 
            onChange={(e) => updateBannerField(idx, 'title', e.target.value)}
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
            onChange={(e) => updateBannerField(idx, 'subtitle', e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">الوصف المختصر</label>
          <textarea 
            value={banner.description} 
            onChange={(e) => updateBannerField(idx, 'description', e.target.value)}
            rows={2}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminHomepage() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    setLoading(true);
    const data = await dbService.getHomepageSections();
    setSections(data || []);
    setLoading(false);
  };

  const heroSection = sections.find(s => s.section_key === 'hero_banners')?.content_json || { banners: [] };
  const featuresSection = sections.find(s => s.section_key === 'features_list')?.content_json || { qualities: [], unboxing: {} };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id as string);
      const newIndex = parseInt(over.id as string);

      const newBanners = arrayMove(heroSection.banners, oldIndex, newIndex);
      setSections(prev => prev.map(s => 
        s.section_key === 'hero_banners' 
          ? { ...s, content_json: { ...heroSection, banners: newBanners } } 
          : s
      ));
    }
  };

  const handleImageUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIdx(idx);
    try {
      const publicUrl = await dbService.uploadImage(file);
      if (publicUrl) {
        const newBanners = [...heroSection.banners];
        newBanners[idx].mediaUrl = publicUrl;
        setSections(prev => prev.map(s => s.section_key === 'hero_banners' ? { ...s, content_json: { ...heroSection, banners: newBanners } } : s));
      } else {
        alert('فشل رفع الصورة.');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الرفع.');
    } finally {
      setUploadingIdx(null);
    }
  };

  const updateBannerField = (idx: number, field: string, value: any) => {
    const newBanners = [...heroSection.banners];
    newBanners[idx] = { ...newBanners[idx], [field]: value };
    setSections(prev => prev.map(s => 
      s.section_key === 'hero_banners' 
        ? { ...s, content_json: { ...heroSection, banners: newBanners } } 
        : s
    ));
  };

  const removeBanner = (idx: number) => {
    const newBanners = [...heroSection.banners];
    newBanners.splice(idx, 1);
    handleSaveSection('hero_banners', { ...heroSection, banners: newBanners });
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

        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-4">
            <SortableContext 
              items={heroSection.banners.map((_: any, i: number) => i.toString())}
              strategy={verticalListSortingStrategy}
            >
              {heroSection.banners.map((banner: any, idx: number) => (
                <SortableItem 
                  key={idx} 
                  banner={banner} 
                  idx={idx} 
                  uploadingIdx={uploadingIdx}
                  handleImageUpload={handleImageUpload}
                  removeBanner={removeBanner}
                  updateBannerField={updateBannerField}
                />
              ))}
            </SortableContext>
            
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
        </DndContext>
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

