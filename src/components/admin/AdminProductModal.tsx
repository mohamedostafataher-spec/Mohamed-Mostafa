import React, { useState, useEffect } from 'react';
import {
  X,
  Tag,
  AlertTriangle,
  Image as ImageIcon,
  Star,
  ArrowUp,
  ArrowDown,
  Trash2,
  Upload,
  Package,
  ShoppingBag,
  Loader2,
  Globe,
  Sparkles,
  GripVertical,
  Search
} from 'lucide-react';
import { Category, Product, Settings } from '../../types';
import { dbService, cleanImgUrl } from '../../services/db';
import { optimizeImageWithStats, OptimizedImageResult } from '../../services/imageOptimizer';
import { CanonicalAdminRole, canViewCostPrice, canEditCostPrice } from '../../utils/rbac';
import { buildSanitizedSlug, evaluateSeoField } from '../../utils/inventoryAnalytics';

interface AdminProductModalProps {
  isOpen: boolean;
  editingProduct: Product | null;
  categories: Category[];
  settings: Settings | null;
  adminRole: CanonicalAdminRole;
  adminName?: string;
  onClose: () => void;
  onSaved: (product: Product, isNew: boolean) => void;
  toast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type ModalTab = 'general' | 'media' | 'seo';

export default function AdminProductModal({
  isOpen,
  editingProduct,
  categories,
  settings,
  adminRole,
  adminName = 'إدارة المتجر',
  onClose,
  onSaved,
  toast
}: AdminProductModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<ModalTab>('general');
  const [form, setForm] = useState<Partial<Product>>({});
  const [colorName, setColorName] = useState('وردي ملكي');
  const [colorHex, setColorHex] = useState('#DF8A9D');
  const [sizesInput, setSizesInput] = useState('S, M, L, XL');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isDraggingOverDropzone, setIsDraggingOverDropzone] = useState(false);
  const [draggedImageIdx, setDraggedImageIdx] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState<
    Array<{ name: string; origKB: number; webpKB: number; savedPercent: number }>
  >([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setActiveSubTab('general');
    setUploadStats([]);
    setNewImageUrl('');
    if (editingProduct) {
      setForm({
        ...editingProduct,
        minStockThreshold: editingProduct.minStockThreshold ?? 5,
        status: editingProduct.status || 'active',
        seo: editingProduct.seo || {
          metaTitleAr: editingProduct.seoTitle || '',
          metaDescriptionAr: editingProduct.shortDescription || '',
          keywordsAr: ''
        }
      });
      setColorName(editingProduct.colors?.[0]?.name || 'وردي ملكي');
      setColorHex(editingProduct.colors?.[0]?.hex || '#DF8A9D');
      setSizesInput((editingProduct.sizes && editingProduct.sizes.length > 0) ? editingProduct.sizes.join(', ') : 'One Size');
    } else {
      setForm({
        nameAr: '',
        nameEn: '',
        sku: '',
        priceSA: 195,
        regularPrice: 195,
        discountPercent: 0,
        discountStatus: 'active',
        isDiscountActive: true,
        priceEG: 975,
        stock: 15,
        minStockThreshold: 5,
        status: 'active',
        category: 'sleepwear',
        categoryAr: 'ملابس نوم',
        descriptionAr: 'طقم بيجامة نوم نسائية قطنية مريحة بخامة ناعمة على البشرة.',
        fabricAr: 'قطن طبيعي ناعم 100%',
        images: [],
        slug: '',
        seo: {
          metaTitleAr: '',
          metaDescriptionAr: '',
          keywordsAr: ''
        }
      });
      setColorName('وردي ملكي');
      setColorHex('#DF8A9D');
      setSizesInput('S, M, L, XL');
    }
  }, [isOpen, editingProduct]);

  if (!isOpen) return null;

  const regPrice = Number(form.regularPrice) || Number(form.priceSA) || 69;
  const discPct = Math.max(0, Math.min(90, Number(form.discountPercent) || 0));
  const effectiveSA = discPct > 0 ? Math.round(regPrice * (1 - discPct / 100)) : regPrice;

  const regDate = editingProduct?.regularPriceSince ? new Date(editingProduct.regularPriceSince) : new Date();
  const daysSinceRef = Math.floor((Date.now() - regDate.getTime()) / (1000 * 60 * 60 * 24));
  const minRefDays = settings?.minReferenceDays || 14;
  const showRefWarning = discPct > 0 && daysSinceRef < minRefDays;

  const currentSlug = (form.slug || '').trim();
  const originalSlug = (editingProduct?.slug || '').trim();
  const isSlugModifiedOnExisting = Boolean(editingProduct && originalSlug && currentSlug && originalSlug !== currentSlug);

  const seoTitleText = form.seo?.metaTitleAr || form.seoTitle || form.nameAr || '';
  const seoDescText = form.seo?.metaDescriptionAr || form.shortDescription || form.descriptionAr || '';
  const titleEval = evaluateSeoField(form.seo?.metaTitleAr ?? form.seoTitle, 35, 60);
  const descEval = evaluateSeoField(form.seo?.metaDescriptionAr ?? form.shortDescription, 110, 160);

  const processAndUploadFiles = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast?.('يرجى اختيار ملفات صور صالحة (PNG / JPG / WebP)', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      const newStats: Array<{ name: string; origKB: number; webpKB: number; savedPercent: number }> = [];

      for (const file of imageFiles) {
        const res: OptimizedImageResult = await optimizeImageWithStats(file, {
          maxWidth: 2160,
          quality: 0.86,
          targetFormat: 'image/webp',
          applySharpen: true
        });
        const publicUrl = await dbService.uploadImage(res.file);
        if (publicUrl) {
          uploadedUrls.push(publicUrl);
          newStats.push({
            name: file.name,
            origKB: Math.max(1, Math.round(res.originalBytes / 1024)),
            webpKB: Math.max(1, Math.round(res.compressedBytes / 1024)),
            savedPercent: res.savedPercent
          });
        }
      }

      if (uploadedUrls.length > 0) {
        setForm((prev) => ({
          ...prev,
          images: [...(Array.isArray(prev.images) ? prev.images : []), ...uploadedUrls]
        }));
        setUploadStats((prev) => [...newStats, ...prev].slice(0, 6));
        toast?.(`تم ضغط إلى WebP ورفع ${uploadedUrls.length} صورة بنجاح`, 'success');
      } else {
        toast?.('تعذر رفع الصور، تحققي من اتصال Supabase Storage', 'error');
      }
    } catch (err: any) {
      toast?.(`حدث خطأ أثناء رفع الصور: ${err?.message || ''}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleMoveImage = (fromIdx: number, toIdx: number) => {
    setForm((prev) => {
      const arr = Array.isArray(prev.images) ? [...prev.images] : [];
      if (toIdx < 0 || toIdx >= arr.length || fromIdx === toIdx) return prev;
      const [item] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, item);
      return { ...prev, images: arr };
    });
  };

  const handleMakeCover = (idx: number) => {
    if (idx === 0) return;
    handleMoveImage(idx, 0);
    toast?.('تم تعيين هذه الصورة كغلاف رئيسي للقطعة', 'success');
  };

  const handleRemoveImage = (idx: number) => {
    setForm((prev) => {
      const arr = Array.isArray(prev.images) ? [...prev.images] : [];
      arr.splice(idx, 1);
      return { ...prev, images: arr };
    });
  };

  const handleAddUrlImage = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    setForm((prev) => ({
      ...prev,
      images: [...(Array.isArray(prev.images) ? prev.images : []), url]
    }));
    setNewImageUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameAr?.trim()) {
      setActiveSubTab('general');
      toast?.('يرجى إدخال اسم المنتج بالعربية', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const isUUID = (s: any) => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.trim());
      const targetId = editingProduct?.id && isUUID(editingProduct.id)
        ? editingProduct.id
        : crypto.randomUUID();

      const parsedSizes = sizesInput
        .split(/[,،]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const nextSlug = (form.slug || '').trim()
        ? buildSanitizedSlug(form.slug!)
        : (editingProduct?.slug || buildSanitizedSlug(form.nameEn || form.nameAr || '', targetId));

      const matchedCat = categories.find(
        (c) => c.slug === form.category || c.nameEn.toLowerCase() === String(form.category || '').toLowerCase()
      );

      const finalProduct: Product = {
        ...(editingProduct || {}),
        id: targetId,
        nameAr: form.nameAr.trim(),
        nameEn: (form.nameEn || '').trim() || form.nameAr.trim(),
        sku: (form.sku || '').trim() || undefined,
        category: form.category || 'new',
        categoryAr: matchedCat?.nameAr || form.categoryAr || 'المجموعة الجديدة',
        regularPrice: regPrice,
        regularPriceSince: editingProduct?.regularPriceSince || new Date().toISOString().split('T')[0],
        discountPercent: discPct,
        discountStartsAt: form.discountStartsAt || undefined,
        discountEndsAt: form.discountEndsAt || undefined,
        discountStatus: form.discountStatus || (form.isDiscountActive === false ? 'inactive' : 'active'),
        isDiscountActive: form.isDiscountActive ?? (form.discountStatus !== 'inactive'),
        priceSA: effectiveSA,
        priceEG: Number(form.priceEG) > 0 ? Number(form.priceEG) : Math.round(effectiveSA * 5),
        costPrice: canEditCostPrice(adminRole)
          ? (form.costPrice !== undefined ? Number(form.costPrice) : editingProduct?.costPrice)
          : editingProduct?.costPrice,
        stock: Math.max(0, Math.floor(Number(form.stock ?? 0))),
        minStockThreshold: Math.max(0, Math.floor(Number(form.minStockThreshold ?? 5))),
        status: form.status || 'active',
        descriptionAr: form.descriptionAr || '',
        descriptionEn: form.descriptionEn || '',
        fabricAr: form.fabricAr || 'قطن ناعم ومريح',
        fabricEn: form.fabricEn || 'Soft Cotton',
        washInstructionsAr: form.washInstructionsAr || 'غسيل لطيف بماء بارد وبدون مبيضات.',
        images: Array.isArray(form.images) ? form.images.filter((i) => typeof i === 'string' && i.trim() !== '') : [],
        video: form.video?.trim() || undefined,
        colors: [{ name: colorName || 'وردي ملكي', hex: colorHex || '#DF8A9D' }, ...(editingProduct?.colors?.slice(1) || [])],
        sizes: parsedSizes.length > 0 ? parsedSizes : ['One Size'],
        slug: nextSlug,
        seoTitle: form.seo?.metaTitleAr?.trim() || undefined,
        shortDescription: form.seo?.metaDescriptionAr?.trim() || undefined,
        seo: {
          ...(editingProduct?.seo || {}),
          ...(form.seo || {}),
          metaTitleAr: form.seo?.metaTitleAr?.trim() || '',
          metaDescriptionAr: form.seo?.metaDescriptionAr?.trim() || '',
          keywordsAr: form.seo?.keywordsAr?.trim() || ''
        },
        featured: editingProduct?.featured ?? true,
        rating: editingProduct?.rating ?? 5,
        reviewsCount: editingProduct?.reviewsCount ?? 10
      };

      const oldStock = editingProduct ? Number(editingProduct.stock || 0) : 0;
      const stockDiff = finalProduct.stock - oldStock;

      await dbService.saveProduct(finalProduct);

      if (editingProduct && stockDiff !== 0) {
        await dbService.recordStockMovement({
          productId: finalProduct.id,
          productName: finalProduct.nameAr,
          changeQty: stockDiff,
          newStockLevel: finalProduct.stock,
          movementType: 'adjustment',
          reason: 'تعديل رصيد المخزون من بطاقة المنتج',
          adminName
        });
      } else if (!editingProduct && finalProduct.stock > 0) {
        await dbService.recordStockMovement({
          productId: finalProduct.id,
          productName: finalProduct.nameAr,
          changeQty: finalProduct.stock,
          newStockLevel: finalProduct.stock,
          movementType: 'inbound',
          reason: 'رصيد افتتاحي عند إنشاء المنتج',
          adminName
        });
      }

      onSaved(finalProduct, !editingProduct);
      toast?.(
        editingProduct
          ? `تم حفظ تعديلات "${finalProduct.nameAr}" في قاعدة البيانات بنجاح`
          : `تمت إضافة "${finalProduct.nameAr}" إلى الكتالوج بنجاح`,
        'success'
      );
      onClose();
    } catch (err: any) {
      toast?.(`فشل حفظ المنتج: ${err?.message || 'خطأ غير معروف'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in" dir="rtl">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-gray-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-[#FAF8F8]">
          <div className="min-w-0">
            <h3 className="font-bold text-base text-gray-950 truncate">
              {editingProduct ? `تعديل القطعة: ${editingProduct.nameAr}` : 'إضافة قطعة جديدة للكتالوج'}
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              يدعم ضغط WebP التلقائي بالسحب والإفلات، حد التنبيه للمخزون، ومعاينة جوجل SEO
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-200/70 hover:text-gray-950 cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-gray-200 bg-white overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('general')}
            className={`min-h-[44px] px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0 ${
              activeSubTab === 'general'
                ? 'bg-[#A44C5C] text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Tag size={14} />
            <span>البيانات والتسعير والمخزون</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('media')}
            className={`min-h-[44px] px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0 ${
              activeSubTab === 'media'
                ? 'bg-[#A44C5C] text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ImageIcon size={14} />
            <span>الصور والترتيب ({form.images?.length || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('seo')}
            className={`min-h-[44px] px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0 ${
              activeSubTab === 'seo'
                ? 'bg-[#A44C5C] text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Globe size={14} />
            <span>SEO ومعاينة جوجل</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeSubTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">اسم القطعة بالعربية *</label>
                  <input
                    type="text"
                    required
                    value={form.nameAr || ''}
                    onChange={(e) => setForm((p) => ({ ...p, nameAr: e.target.value }))}
                    placeholder="مثال: بيجامة قطنية بنقشة التوليب"
                    className="w-full min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 text-xs focus:bg-white focus:outline-none focus:border-[#A44C5C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">الاسم بالإنجليزية (للروابط والمقاسات)</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={form.nameEn || ''}
                    onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))}
                    placeholder="Tulip Crinkle Cotton Pajama"
                    className="w-full min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 text-xs text-left focus:bg-white focus:outline-none focus:border-[#A44C5C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">القسم</label>
                  <select
                    value={form.category || 'new'}
                    onChange={(e) => {
                      const slug = e.target.value;
                      const cat = categories.find((c) => c.slug === slug);
                      setForm((p) => ({ ...p, category: slug, categoryAr: cat?.nameAr || p.categoryAr }));
                    }}
                    className="w-full min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 text-xs font-bold focus:bg-white focus:outline-none focus:border-[#A44C5C]"
                  >
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                        <option key={cat.id} value={cat.slug}>
                          {cat.nameAr}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="sleepwear">ملابس نوم</option>
                        <option value="loungewear">ملابس منزلية</option>
                        <option value="cotton">أطقم قطنية</option>
                        <option value="new">المجموعة الجديدة</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">حالة النشر بالمتجر</label>
                  <select
                    value={form.status || 'active'}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as Product['status'] }))}
                    className="w-full min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 text-xs font-bold focus:bg-white focus:outline-none focus:border-[#A44C5C]"
                  >
                    <option value="active">منشور ومتاح للعميلات</option>
                    <option value="draft">مسودة (مخفي مؤقتاً)</option>
                    <option value="archived">مؤرشف</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">رمز الصنف (SKU)</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={form.sku || ''}
                    onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                    placeholder="SLT-PJ-01"
                    className="w-full min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 text-xs font-mono text-left focus:bg-white focus:outline-none focus:border-[#A44C5C]"
                  />
                </div>
              </div>

              {/* Pricing Box */}
              <div className="bg-[#FAF8F8] border border-gray-200 rounded-2xl p-4 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200">
                  <span className="text-xs font-bold text-gray-950 flex items-center gap-1.5">
                    <Tag size={14} className="text-[#A44C5C]" />
                    <span>التسعير والخصومات (ر.س)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        discountStatus: p.discountStatus === 'inactive' ? 'active' : 'inactive',
                        isDiscountActive: p.discountStatus === 'inactive'
                      }))
                    }
                    className={`min-h-[36px] px-3 rounded-xl text-[11px] font-bold cursor-pointer border ${
                      form.discountStatus !== 'inactive' && form.isDiscountActive !== false
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'bg-rose-100 text-rose-900 border-rose-200'
                    }`}
                  >
                    {form.discountStatus !== 'inactive' && form.isDiscountActive !== false ? 'الخصم: مفعّل' : 'الخصم: متوقف'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">السعر الأساسي (ر.س) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.regularPrice ?? form.priceSA ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, regularPrice: Number(e.target.value) }))}
                      className="w-full min-h-[44px] bg-white border border-gray-200 rounded-xl px-3 text-xs font-mono font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">نسبة الخصم (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="90"
                      value={form.discountPercent ?? 0}
                      onChange={(e) => setForm((p) => ({ ...p, discountPercent: Number(e.target.value) }))}
                      className="w-full min-h-[44px] bg-white border border-gray-200 rounded-xl px-3 text-xs font-mono font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">المخزون الفعلي</label>
                    <input
                      type="number"
                      min="0"
                      value={form.stock ?? 0}
                      onChange={(e) => setForm((p) => ({ ...p, stock: Number(e.target.value) }))}
                      className="w-full min-h-[44px] bg-white border border-gray-200 rounded-xl px-3 text-xs font-mono font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">حد التنبيه الأدنى</label>
                    <input
                      type="number"
                      min="0"
                      value={form.minStockThreshold ?? 5}
                      onChange={(e) => setForm((p) => ({ ...p, minStockThreshold: Number(e.target.value) }))}
                      className="w-full min-h-[44px] bg-white border border-gray-200 rounded-xl px-3 text-xs font-mono font-bold text-center"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 border border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span>السعر النهائي للعميلة:</span>
                  <div className="flex items-center gap-2 font-mono">
                    <strong className="text-base text-[#A44C5C] font-black">{effectiveSA} ر.س</strong>
                    {discPct > 0 && <span className="line-through text-gray-400 text-xs">{regPrice} ر.س</span>}
                  </div>
                </div>

                {canViewCostPrice(adminRole) && (
                  <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-xs">
                      <span className="font-bold text-purple-950 block">سعر التكلفة السري (COGS)</span>
                      <span className="text-[11px] text-purple-800">محمي ومخفي عن المتجر وموظفي المبيعات</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        disabled={!canEditCostPrice(adminRole)}
                        value={form.costPrice ?? ''}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            costPrice: e.target.value === '' ? undefined : Number(e.target.value)
                          }))
                        }
                        placeholder="0.00"
                        className="w-28 min-h-[44px] bg-white border border-purple-300 rounded-xl px-3 font-mono font-bold text-center text-xs disabled:bg-gray-100"
                      />
                      <span className="text-xs font-bold text-purple-900">ر.س</span>
                    </div>
                  </div>
                )}

                {showRefWarning && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 rounded-xl flex items-start gap-2">
                    <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      السعر المرجعي مسجّل منذ <strong>{daysSinceRef} يوماً</strong> (أقل من {minRefDays} يوماً الموصى بها للتخفيضات).
                    </span>
                  </div>
                )}
              </div>

              {/* Variants & Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">اللون الرئيسي</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="w-11 h-11 rounded-xl border border-gray-200 p-1 bg-white cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={colorName}
                      onChange={(e) => setColorName(e.target.value)}
                      className="w-full min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">المقاسات (مفصولة بفاصلة)</label>
                  <input
                    type="text"
                    value={sizesInput}
                    onChange={(e) => setSizesInput(e.target.value)}
                    placeholder="S, M, L, XL أو One Size"
                    className="w-full min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">نوع القماش</label>
                  <input
                    type="text"
                    value={form.fabricAr || ''}
                    onChange={(e) => setForm((p) => ({ ...p, fabricAr: e.target.value }))}
                    placeholder="قطن مبرد 100%"
                    className="w-full min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">وصف القطعة</label>
                <textarea
                  rows={3}
                  value={form.descriptionAr || ''}
                  onChange={(e) => setForm((p) => ({ ...p, descriptionAr: e.target.value }))}
                  className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl p-3 text-xs focus:bg-white focus:outline-none focus:border-[#A44C5C]"
                />
              </div>
            </div>
          )}

          {activeSubTab === 'media' && (
            <div className="space-y-4">
              {/* Drag and Drop Uploader with WebP Conversion */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOverDropzone(true);
                }}
                onDragLeave={() => setIsDraggingOverDropzone(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingOverDropzone(false);
                  if (e.dataTransfer.files?.length) {
                    processAndUploadFiles(e.dataTransfer.files);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  isDraggingOverDropzone
                    ? 'border-[#A44C5C] bg-[#FCF5F6]'
                    : 'border-gray-300 bg-[#FAF8F8] hover:border-[#A44C5C]/60'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 text-[#A44C5C] flex items-center justify-center mx-auto mb-2 shadow-2xs">
                  {isUploading ? <Loader2 size={22} className="animate-spin" /> : <Upload size={22} />}
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {isUploading ? 'جاري ضغط الصور إلى WebP ورفعها...' : 'اسحبي وأفلتي الصور هنا (متعدد)'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  يتم التحويل والضغط تلقائياً بالمتصفح إلى صيغة WebP خفيفة وسريعة قبل الرفع مجاناً
                </p>
                <label className="mt-3 inline-flex items-center justify-center min-h-[44px] px-5 bg-[#A44C5C] hover:bg-[#8E3E4D] text-white text-xs font-bold rounded-xl cursor-pointer transition-all">
                  <span>اختيار صور من الجهاز</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isUploading}
                    onChange={(e) => {
                      if (e.target.files?.length) processAndUploadFiles(e.target.files);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>

                {uploadStats.length > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {uploadStats.map((st, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-lg font-mono"
                      >
                        {st.name.slice(0, 14)}: {st.origKB}KB ← {st.webpKB}KB WebP (-{st.savedPercent}%)
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Add URL manually */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  dir="ltr"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddUrlImage();
                    }
                  }}
                  placeholder="https://... إضافة رابط صورة مباشر"
                  className="flex-1 min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 text-xs font-mono text-left"
                />
                <button
                  type="button"
                  onClick={handleAddUrlImage}
                  className="min-h-[44px] px-4 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  إضافة رابط
                </button>
              </div>

              {/* Reorderable Image List + Live Card Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="md:col-span-2 space-y-2">
                  <p className="text-xs font-bold text-gray-800">
                    اسحبي البطاقات لإعادة الترتيب (#1 هي صورة الغلاف الرئيسية):
                  </p>
                  {(!form.images || form.images.length === 0) ? (
                    <div className="p-6 bg-gray-50 border border-dashed border-gray-300 rounded-2xl text-center text-xs text-gray-500">
                      لا توجد صور مضافة بعد
                    </div>
                  ) : (
                    form.images.map((url, idx) => (
                      <div
                        key={`${url}_${idx}`}
                        draggable
                        onDragStart={() => setDraggedImageIdx(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggedImageIdx !== null && draggedImageIdx !== idx) {
                            handleMoveImage(draggedImageIdx, idx);
                          }
                          setDraggedImageIdx(null);
                        }}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                          idx === 0 ? 'bg-amber-50/70 border-amber-300' : 'bg-white border-gray-200'
                        }`}
                      >
                        <GripVertical size={16} className="text-gray-400 cursor-grab shrink-0" />
                        <img
                          src={cleanImgUrl(url, form.category)}
                          alt={`صورة ${idx + 1}`}
                          className="w-12 h-14 object-cover rounded-lg border border-gray-200 shrink-0 bg-gray-100"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-bold text-gray-900 block">
                            {idx === 0 ? 'صورة الغلاف الرئيسية (#1)' : `صورة إضافية #${idx + 1}`}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono truncate block" dir="ltr">
                            {url}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleMakeCover(idx)}
                              className="min-w-[36px] min-h-[36px] px-2 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold rounded-lg cursor-pointer"
                              title="تعيين كغلاف"
                            >
                              <Star size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveImage(idx, idx - 1)}
                            className="min-w-[36px] min-h-[36px] flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer disabled:opacity-30"
                            aria-label="تحريك لأعلى"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === (form.images?.length || 0) - 1}
                            onClick={() => handleMoveImage(idx, idx + 1)}
                            className="min-w-[36px] min-h-[36px] flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer disabled:opacity-30"
                            aria-label="تحريك لأسفل"
                          >
                            <ArrowDown size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="min-w-[36px] min-h-[36px] flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg cursor-pointer"
                            aria-label="حذف الصورة"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Live Store Card Preview */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3">
                  <span className="text-[11px] font-bold text-gray-600 block mb-2">معاينة كارت المتجر</span>
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xs">
                    <div className="aspect-[3/4] bg-gray-100 relative">
                      {form.images?.[0] ? (
                        <img
                          src={cleanImgUrl(form.images[0], form.category)}
                          alt="معاينة الغلاف"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package size={28} />
                        </div>
                      )}
                    </div>
                    <div className="p-3 text-center space-y-1">
                      <p className="text-xs font-bold text-gray-900 line-clamp-1">{form.nameAr || 'اسم القطعة'}</p>
                      <p className="text-xs font-mono font-black text-[#A44C5C]">{effectiveSA} ر.س</p>
                      <div className="w-full bg-[#A44C5C] text-white py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1">
                        <ShoppingBag size={11} />
                        <span>أضيفي للسلة</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">رابط فيديو تسويقي (اختياري)</label>
                <input
                  type="text"
                  dir="ltr"
                  value={form.video || ''}
                  onChange={(e) => setForm((p) => ({ ...p, video: e.target.value }))}
                  placeholder="https://..."
                  className="w-full min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 text-xs font-mono text-left"
                />
              </div>
            </div>
          )}

          {activeSubTab === 'seo' && (
            <div className="space-y-4">
              {/* Slug Editor + Redirect History Notice */}
              <div className="bg-[#FAF8F8] border border-gray-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-gray-900">الرابط الدائم للقطعة (Slug)</label>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        slug: buildSanitizedSlug(p.nameEn || p.nameAr || '')
                      }))
                    }
                    className="text-[11px] font-bold text-[#A44C5C] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={12} />
                    <span>توليد تلقائي من الاسم</span>
                  </button>
                </div>
                <div className="flex items-center gap-2" dir="ltr">
                  <span className="text-xs text-gray-500 font-mono shrink-0">/product/</span>
                  <input
                    type="text"
                    value={form.slug || ''}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    placeholder="cotton-pajama-slug"
                    className="flex-1 min-h-[44px] bg-white border border-gray-200 rounded-xl px-3 text-xs font-mono text-left focus:outline-none focus:border-[#A44C5C]"
                  />
                </div>
                {isSlugModifiedOnExisting && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 text-[11px] p-2.5 rounded-xl flex items-start gap-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-600" />
                    <span>
                      تم تغيير الـ Slug من <strong className="font-mono">{originalSlug}</strong> إلى{' '}
                      <strong className="font-mono">{currentSlug}</strong>. سيتم تسجيل إعادة توجيه تلقائية في{' '}
                      <code className="font-mono">slug_history</code> للحفاظ على زوار جوجل والروابط القديمة.
                    </span>
                  </div>
                )}
              </div>

              {/* SEO Title with Counter */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-800">عنوان صفحة جوجل (SEO Title)</label>
                  <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md font-mono ${titleEval.colorClass}`}>
                    {titleEval.length} / 60 — {titleEval.labelAr}
                  </span>
                </div>
                <input
                  type="text"
                  value={form.seo?.metaTitleAr ?? form.seoTitle ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      seoTitle: e.target.value,
                      seo: { ...(p.seo || {}), metaTitleAr: e.target.value }
                    }))
                  }
                  placeholder={`${form.nameAr || 'بيجامة قطنية'} | متجر سولته`}
                  className="w-full min-h-[44px] bg-[#F8F9FA] border border-gray-200 rounded-xl px-3.5 text-xs focus:bg-white focus:outline-none focus:border-[#A44C5C]"
                />
              </div>

              {/* SEO Description with Counter */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-800">الوصف التعريفي (Meta Description)</label>
                  <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md font-mono ${descEval.colorClass}`}>
                    {descEval.length} / 160 — {descEval.labelAr}
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={form.seo?.metaDescriptionAr ?? form.shortDescription ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      shortDescription: e.target.value,
                      seo: { ...(p.seo || {}), metaDescriptionAr: e.target.value }
                    }))
                  }
                  placeholder="وصف جذاب يظهر في نتائج بحث جوجل ويوضح خامة القطن والسعر والشحن السريع بالسعودية..."
                  className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl p-3 text-xs focus:bg-white focus:outline-none focus:border-[#A44C5C]"
                />
              </div>

              {/* Google SERP Preview */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2 shadow-2xs">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 pb-2 border-b border-gray-100">
                  <Search size={13} />
                  <span>معاينة حية لنتيجة البحث في جوجل (Google SERP Preview)</span>
                </div>
                <div className="space-y-1 text-right">
                  <div className="flex items-center gap-2 text-xs text-gray-600" dir="ltr">
                    <span className="font-mono text-[11px] text-emerald-800 truncate">
                      https://sulta.vercel.app/product/{currentSlug || buildSanitizedSlug(form.nameEn || form.nameAr || 'product')}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-[#1a0dab] leading-snug line-clamp-1">
                    {seoTitleText || 'عنوان المنتج في متجر سولته'} | سولته
                  </h4>
                  <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">
                    {seoDescText || 'بيجامة نسائية قطنية ناعمة من متجر سولته مع شحن سريع لكافة مدن المملكة العربية السعودية.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="min-h-[44px] px-6 bg-[#A44C5C] hover:bg-[#8E3E4D] text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              <span>{isSaving ? 'جاري الحفظ...' : editingProduct ? 'حفظ التعديلات' : 'نشر وحفظ المنتج'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
