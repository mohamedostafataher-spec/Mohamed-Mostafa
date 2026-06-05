import React, { useState, useEffect } from 'react';
import { ArrowRight, Calendar, User, Search, BookOpen } from 'lucide-react';
import { BlogPost } from '../types';
import { dbService } from '../services/db';

interface BlogViewProps {
  onReadPost: (post: BlogPost) => void;
}

export default function BlogView({ onReadPost }: BlogViewProps) {
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
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || post.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPost = filteredPosts.length > 0 ? filteredPosts[0] : null;
  const standardPosts = filteredPosts.slice(1);

  const categories = [
    { id: 'all', label: 'الكل' },
    { id: 'editorial', label: 'افتتاحيات' },
    { id: 'tips', label: 'نصائح' },
    { id: 'fabric', label: 'الأقمشة' },
    { id: 'news', label: 'أخبار' }
  ];

  return (
    <div className="bg-[#FAF5F0] min-h-screen pt-24 pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="font-serif text-4xl md:text-5xl font-light text-[#0B0B0B] tracking-widest uppercase">
            المجلة
          </h2>
          <p className="text-sm text-gray-500 font-sans max-w-md mx-auto">
            اكتشفي نصائح التنسيق، جلسات التصوير الافتتاحية، أدلة العناية بالأقمشة، وأحدث أخبار عالم "سُلْطَة".
          </p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-16" dir="rtl">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`uppercase tracking-widest text-[10px] font-bold px-4 py-2 rounded-full whitespace-nowrap transition-colors border ${
                  activeCategory === cat.id 
                  ? 'bg-[#0B0B0B] text-[#F6E7A6] border-[#0B0B0B]' 
                  : 'bg-transparent text-gray-500 border-gray-300 hover:border-[#A44C5C] hover:text-[#A44C5C]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-80 shrink-0">
            <input
              type="text"
              placeholder="ابحثي في المجلة..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-b border-gray-300 px-0 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#A44C5C] transition-colors text-right"
            />
            <Search size={16} className="absolute left-0 top-3 border-gray-400 opacity-50" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="w-8 h-8 border-2 border-[#A44C5C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-32 flex flex-col items-center">
            <BookOpen size={48} className="text-gray-300 mb-4" strokeWidth={1} />
            <p className="font-serif text-xl text-gray-400">لا توجد مقالات في هذا القسم حالياً.</p>
          </div>
        ) : (
          <div className="space-y-16">
            
            {/* Featured Post */}
            {featuredPost && (
              <div 
                onClick={() => onReadPost(featuredPost)}
                className="group cursor-pointer grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center"
              >
                <div className="aspect-[4/3] md:aspect-[3/4] overflow-hidden bg-gray-100 rounded-sm">
                  {featuredPost.imageUrl && (
                    <img 
                      src={featuredPost.imageUrl} 
                      alt={featuredPost.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 origin-center mix-blend-multiply" 
                    />
                  )}
                </div>
                <div className="space-y-6 text-center md:text-left">
                  <span className="uppercase text-[#A44C5C] text-[10px] tracking-[0.2em] font-bold">
                    {featuredPost.category}
                  </span>
                  <h3 className="font-serif text-3xl md:text-5xl leading-tight text-[#0B0B0B] group-hover:text-[#A44C5C] transition-colors">
                    {featuredPost.title}
                  </h3>
                  <p className="text-gray-600 font-sans text-sm leading-relaxed max-w-lg mx-auto md:mx-0">
                    {featuredPost.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-gray-400 font-mono">
                    <div className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(featuredPost.publishedAt).toLocaleDateString()}</div>
                    <div className="flex items-center gap-1.5"><User size={14} /> {featuredPost.author}</div>
                  </div>
                  
                  <button className="uppercase text-[10px] tracking-widest font-bold border-b border-[#0B0B0B] pb-1 flex items-center gap-2 hover:border-[#DF8A9D] hover:text-[#DF8A9D] transition-colors mx-auto md:mx-0">
                    اقرئي المقال <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Standard Posts Grid */}
            {standardPosts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-8">
                {standardPosts.map(post => (
                  <div 
                    key={post.id} 
                    onClick={() => onReadPost(post)}
                    className="group cursor-pointer flex flex-col h-full"
                  >
                    <div className="aspect-[4/5] overflow-hidden bg-gray-100 rounded-sm mb-6">
                      {post.imageUrl && (
                        <img 
                          src={post.imageUrl} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 mix-blend-multiply" 
                        />
                      )}
                    </div>
                    
                    <div className="flex flex-col flex-1 text-center">
                      <span className="uppercase text-[#A44C5C] text-[9px] tracking-[0.2em] font-bold mb-3 block">
                        {post.category}
                      </span>
                      <h4 className="font-serif text-xl md:text-2xl text-[#0B0B0B] leading-snug mb-3 group-hover:text-[#A44C5C] transition-colors line-clamp-2">
                        {post.title}
                      </h4>
                      <p className="text-gray-500 font-sans text-xs flex-1 line-clamp-3 mb-4">
                        {post.excerpt}
                      </p>
                      
                      <div className="mt-auto flex items-center justify-center gap-2 text-[10px] text-gray-400 font-mono">
                        <Calendar size={12} />
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}
