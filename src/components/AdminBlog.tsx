import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Search, Image as ImageIcon } from 'lucide-react';
import { BlogPost } from '../types';
import { dbService } from '../services/db';

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState<Partial<BlogPost>>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsub = dbService.subscribeBlogPosts(
      (data) => {
        setPosts(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching blog posts', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPost.title || !currentPost.content) {
      alert('الرجاء إدخال العنوان والمحتوى.');
      return;
    }

    try {
      const slug = currentPost.slug || currentPost.title.toLowerCase().replace(/\s+/g, '-');
      const postToSave: BlogPost = {
        id: currentPost.id || `BLOG-${Date.now()}`,
        title: currentPost.title,
        slug,
        content: currentPost.content,
        excerpt: currentPost.excerpt || '',
        imageUrl: currentPost.imageUrl,
        author: currentPost.author || 'SULTA',
        category: currentPost.category || 'general',
        tags: currentPost.tags || [],
        status: currentPost.status || 'published',
        publishedAt: currentPost.publishedAt || new Date().toISOString(),
        createdAt: currentPost.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await dbService.saveBlogPost(postToSave);
      setIsEditing(false);
      setCurrentPost({});
    } catch (err) {
      console.error(err);
      alert('فشل حفظ المقال.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المقال نهائياً؟')) return;
    try {
      await dbService.deleteBlogPost(id);
    } catch (err) {
      console.error(err);
      alert('فشل الحذف.');
    }
  };

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl font-serif text-[#0B0B0B] flex items-center gap-2">
            مجلة SULTA
          </h3>
          <p className="text-gray-500 text-xs mt-1">إدارة مقالات الموضة والأناقة والراحة المنزلية</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => {
              setCurrentPost({ status: 'published', category: 'editorial' });
              setIsEditing(true);
            }}
            className="bg-[#A44C5C] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#DF8A9D] transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            كتابة مقال جديد
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="bg-[#FAF5F0] p-6 rounded-xl border border-[#DF8A9D]/20 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-serif text-lg text-[#0B0B0B]">{currentPost.id ? 'تعديل المقال' : 'مقال جديد'}</h4>
            <button type="button" onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-red-500">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">عنوان المقال</label>
                <input
                  type="text"
                  required
                  value={currentPost.title || ''}
                  onChange={e => setCurrentPost(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#A44C5C] outline-none"
                  placeholder="مثال: كيف تختارين قماش البيجاما المناسب؟"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">الرابط المخصص (Slug)</label>
                <input
                  type="text"
                  value={currentPost.slug || ''}
                  onChange={e => setCurrentPost(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#A44C5C] outline-none"
                  placeholder="how-to-choose-sleepwear-fabric"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">القسم</label>
                <select
                  value={currentPost.category || 'editorial'}
                  onChange={e => setCurrentPost(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#A44C5C] outline-none"
                >
                  <option value="editorial">Editorial (افتتاحية)</option>
                  <option value="tips">Tips & Tricks (نصائح وحيل)</option>
                  <option value="fabric">Fabric Care (العناية بالأقمشة)</option>
                  <option value="news">News (أخبار البراند)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">صورة الغلاف (رابط مباشر)</label>
                <input
                  type="text"
                  value={currentPost.imageUrl || ''}
                  onChange={e => setCurrentPost(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#A44C5C] outline-none"
                  placeholder="/img/sulta_product_1.png"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">نبذة مختصرة (Excerpt)</label>
                <textarea
                  rows={2}
                  value={currentPost.excerpt || ''}
                  onChange={e => setCurrentPost(prev => ({ ...prev, excerpt: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#A44C5C] outline-none resize-none"
                  placeholder="ملخص يظهر في بطاقة المقال..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">محتوى المقال (HTML مدعوم)</label>
                <textarea
                  required
                  rows={6}
                  value={currentPost.content || ''}
                  onChange={e => setCurrentPost(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#A44C5C] outline-none font-mono"
                  placeholder="<p>اكتشفي الجمال...</p>"
                />
              </div>

               <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">الحالة</label>
                <select
                  value={currentPost.status || 'published'}
                  onChange={e => setCurrentPost(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#A44C5C] outline-none"
                >
                  <option value="published">منشور (Published)</option>
                  <option value="draft">مسودة (Draft)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#DF8A9D]/20">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-xs font-semibold text-white bg-[#A44C5C] rounded-xl hover:bg-[#DF8A9D] flex items-center gap-2"
            >
              <Check size={16} />
              حفظ ونشر المقال
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex gap-4 mb-6 relative">
             <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="البحث في المقالات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-1/3 bg-gray-50 border border-gray-200 rounded-xl pr-10 pl-4 py-2 text-sm focus:border-[#A44C5C] outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="p-4 text-[10px] uppercase tracking-wider text-gray-500 font-bold">المقال</th>
                  <th className="p-4 text-[10px] uppercase tracking-wider text-gray-500 font-bold">القسم</th>
                  <th className="p-4 text-[10px] uppercase tracking-wider text-gray-500 font-bold">تاريخ النشر</th>
                  <th className="p-4 text-[10px] uppercase tracking-wider text-gray-500 font-bold">الحالة</th>
                  <th className="p-4 text-[10px] uppercase tracking-wider text-gray-500 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="text-center p-8 text-gray-400">جاري التحميل...</td></tr>
                ) : filteredPosts.length === 0 ? (
                  <tr><td colSpan={5} className="text-center p-8 text-gray-400 font-serif">لا توجد مقالات مسجلة</td></tr>
                ) : (
                  filteredPosts.map(post => (
                    <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                            {post.imageUrl ? (
                              <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={16} /></div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-[#0B0B0B]">{post.title}</p>
                            <p className="text-[10px] text-gray-500 font-sans mt-0.5" dir="ltr">{post.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600 font-sans uppercase text-[10px] font-bold tracking-wider">{post.category}</td>
                      <td className="p-4 text-xs text-gray-500 font-sans">{new Date(post.publishedAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          post.status === 'published' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setCurrentPost(post);
                              setIsEditing(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
