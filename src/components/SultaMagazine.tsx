import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, User, Search, BookOpen, Sparkles, AlertCircle, Quote } from 'lucide-react';
import { BlogPost } from '../types';
import { dbService, cleanImgUrl } from '../services/db';

interface SultaMagazineProps {
  onReadPost: (post: BlogPost) => void;
}

export default function SultaMagazine({ onReadPost }: SultaMagazineProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const unsub = dbService.subscribeBlogPosts(
      (data) => {
        setPosts(data.filter(p => p.status === 'published'));
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching blog posts', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const filteredPosts = posts.filter(post => {
    const titleAr = post.title || '';
    const descAr = post.content || '';
    const matchesSearch = titleAr.toLowerCase().includes(searchQuery.toLowerCase()) || descAr.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || post.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPost = filteredPosts.length > 0 ? filteredPosts[0] : null;
  const secondaryPosts = filteredPosts.slice(1, 3);
  const standardPosts = filteredPosts.slice(3);

  const categories = [
    { id: 'all', label: 'جميع الأعداد' },
    { id: 'Couture', label: 'كوتور الملكي' },
    { id: 'editorial', label: 'الجلسات الافتتاحية' },
    { id: 'tips', label: 'إرشادات الاسترخاء' },
    { id: 'Fabric', label: 'أسرار الحرير' },
  ];

  return (
    <div className="bg-[#FAF5F0] min-h-screen pt-12 pb-20 font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Vogue/Harper Bazaar style header */}
        <div className="border-b-2 border-double border-gray-900 py-6 mb-12 text-center">
          <span className="text-[9px] text-[#A44C5C] font-semibold tracking-[0.4em] uppercase block mb-2">
            ✦ L'ÉDITION ROYAL DE SULTA ATELIER ✦
          </span>
          <h1 className="font-serif text-5xl md:text-7xl font-light text-[#0B0B0B] tracking-[0.2em] translate-x-[4px] uppercase select-none">
            SULTA JOURNAL
          </h1>
          <div className="flex justify-between items-center text-[9px] text-gray-500 font-mono tracking-widest mt-4 uppercase border-t border-gray-300 pt-2 px-1 max-w-2xl mx-auto">
            <span>عدد الصيف الفاخر ٢٠٢٦</span>
            <span className="font-serif italic text-[#A44C5C] font-bold">Where Art Meets Couture</span>
            <span>بلمسة ريفيرا الفرنسية</span>
          </div>
        </div>

        {/* Search & Category Filter bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-gray-200 pb-6 mb-12">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`uppercase tracking-widest text-[9.5px] font-bold px-4 py-2.5 rounded-full whitespace-nowrap transition-all border ${
                  activeCategory === cat.id 
                  ? 'bg-black text-[#F6E7A6] border-black shadow-sm' 
                  : 'bg-white/50 text-gray-600 border-gray-200 hover:border-black hover:text-black'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80 shrink-0">
            <input
              type="text"
              placeholder="ابحثي عن سر، نصيحة، أو عُنصر..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white rounded-full border border-gray-250 px-5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#A44C5C]/15 focus:border-[#A44C5C] text-right shadow-2xs"
            />
            <Search size={14} className="absolute left-4 top-3.5 text-gray-400" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="w-8 h-8 border-2 border-[#A44C5C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-24 flex flex-col items-center">
            <BookOpen size={44} className="text-gray-300 mb-4" strokeWidth={1} />
            <p className="font-serif text-lg text-gray-400">لا توجد أعداد أو مقالات منشورة حالياً في هذا القسم.</p>
          </div>
        ) : (
          <div className="space-y-16">
            
            {/* Main Editorial Hero Block */}
            {featuredPost && (
              <div 
                onClick={() => onReadPost(featuredPost)}
                className="group cursor-pointer grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-white rounded-[2.5rem] p-6 lg:p-10 border border-[#DF8A9D]/12 shadow-2xs hover:shadow-lg transition-all duration-500"
              >
                {/* Huge Cover photo */}
                <div className="lg:col-span-7 aspect-[16/10] sm:aspect-[16/9] overflow-hidden bg-neutral-50 rounded-[1.8rem]">
                  <img 
                    src={cleanImgUrl(featuredPost.imageUrl, 'editorial')} 
                    alt={featuredPost.title} 
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-1000" 
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Cover Texts with exquisite dropcap */}
                <div className="lg:col-span-5 space-y-6 text-right">
                  <div className="flex items-center gap-2">
                    <span className="uppercase text-[#A44C5C] text-[9.5px] font-bold tracking-widest bg-[#FAF4F5] px-3 py-1 rounded-full border border-[#DF8A9D]/15">
                      ★ {featuredPost.category}
                    </span>
                  </div>
                  
                  <h2 className="font-serif text-2xl md:text-3xl leading-snug text-[#0B0B0B] group-hover:text-[#A44C5C] transition-colors font-medium">
                    {featuredPost.title}
                  </h2>
                  
                  <p className="text-gray-500 font-sans text-xs leading-relaxed line-clamp-4">
                    {featuredPost.excerpt}
                  </p>

                  <div className="flex items-center gap-4 text-[10px] text-gray-400 font-mono">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(featuredPost.publishedAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><User size={12} /> {featuredPost.author}</span>
                  </div>

                  <hr className="border-gray-100" />

                  <button className="uppercase text-[10px] tracking-widest font-bold text-[#A44C5C] border-b border-[#A44C5C] pb-1 flex items-center gap-2 hover:text-[#DF8A9D] hover:border-[#DF8A9D] transition-all">
                    اقرئي العدد الكامل ←
                  </button>
                </div>
              </div>
            )}

            {/* Split Editorial Sections (Bento Layout) */}
            {secondaryPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {secondaryPosts.map(post => (
                  <div
                    key={post.id}
                    onClick={() => onReadPost(post)}
                    className="group cursor-pointer bg-white rounded-[2rem] p-5 border border-[#DF8A9D]/12 hover:border-[#DF8A9D]/30 shadow-2xs hover:shadow-md transition-all duration-500 flex flex-col md:flex-row gap-6 items-center"
                  >
                    <div className="w-full md:w-40 aspect-square overflow-hidden bg-neutral-50 rounded-2xl shrink-0">
                      <img 
                        src={cleanImgUrl(post.imageUrl, post.category)} 
                        alt={post.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="text-right space-y-2 flex-1">
                      <span className="text-[8.5px] uppercase text-[#A44C5C] tracking-wider font-bold block">{post.category}</span>
                      <h4 className="font-serif text-sm font-semibold text-gray-900 line-clamp-2 leading-relaxed group-hover:text-[#A44C5C] transition-colors">{post.title}</h4>
                      <p className="text-[10px] text-gray-400 line-clamp-2 font-sans">{post.excerpt}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Standard Columns List */}
            {standardPosts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {standardPosts.map(post => {
                  const imgToUse = cleanImgUrl(post.imageUrl, post.category);

                  return (
                    <div 
                      key={post.id} 
                      onClick={() => onReadPost(post)}
                      className="group cursor-pointer bg-white rounded-[2rem] p-5 border border-[#DF8A9D]/10 hover:border-[#DF8A9D]/35 shadow-2xs transition-all duration-500 flex flex-col h-full"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-neutral-50 rounded-[1.5rem] mb-5">
                        <img 
                          src={imgToUse} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      
                      <div className="flex flex-col flex-1 text-right">
                        <span className="uppercase text-[#A44C5C] text-[8px] tracking-[0.2s] font-bold mb-2 block">
                          {post.category}
                        </span>
                        <h4 className="font-serif text-sm font-semibold text-[#0B0B0B] leading-snug mb-2 group-hover:text-[#A44C5C] transition-colors line-clamp-2">
                          {post.title}
                        </h4>
                        <p className="text-gray-400 font-sans text-[10px] leading-relaxed flex-1 line-clamp-3 mb-4">
                          {post.excerpt}
                        </p>
                        
                        <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between text-[9px] text-gray-400 font-mono">
                          <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                          <span>بأقلام SULTA ★</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}
