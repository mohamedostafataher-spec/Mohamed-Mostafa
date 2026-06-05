import React from 'react';
import { ArrowLeft, Calendar, User, Share2 } from 'lucide-react';
import { BlogPost } from '../types';

interface BlogPostViewProps {
  post: BlogPost;
  onBack: () => void;
}

export default function BlogPostView({ post, onBack }: BlogPostViewProps) {
  return (
    <div className="bg-white min-h-screen pt-24 pb-20 font-sans">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 hover:text-[#0B0B0B] transition-colors mb-8 md:mb-12"
        >
          <ArrowLeft size={16} />
          Back to Journal
        </button>

        <header className="text-center mb-12">
          <span className="uppercase text-[#A44C5C] text-[10px] tracking-[0.2em] font-bold block mb-4">
            {post.category}
          </span>
          <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl font-light text-[#0B0B0B] leading-tight mb-6">
            {post.title}
          </h1>
          
          <div className="flex items-center justify-center gap-6 text-[10px] text-gray-400 font-mono uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Calendar size={14} />
              {new Date(post.publishedAt).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2">
              <User size={14} />
              {post.author}
            </div>
          </div>
        </header>

        {post.imageUrl && (
          <div className="w-full aspect-video md:aspect-[21/9] overflow-hidden rounded-sm bg-gray-100 mb-16">
            <img 
              src={post.imageUrl} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="max-w-2xl mx-auto">
          {post.excerpt && (
            <p className="font-serif italic text-xl md:text-2xl text-gray-600 border-l-2 border-[#A44C5C] pl-6 mb-12 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          <div 
            className="prose prose-sm md:prose-base prose-neutral max-w-none text-gray-700 font-sans leading-loose
              prose-headings:font-serif prose-headings:font-normal prose-headings:text-[#0B0B0B]
              prose-a:text-[#A44C5C] prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-sm prose-img:shadow-sm"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="mt-16 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-6">
             {post.tags && post.tags.length > 0 && (
               <div className="flex gap-2 flex-wrap">
                 {post.tags.map(tag => (
                   <span key={tag} className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-sm tracking-wider">
                     {tag}
                   </span>
                 ))}
               </div>
             )}
             
             <button className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#0B0B0B] hover:text-[#A44C5C] transition-colors">
               <Share2 size={16} /> Share Article
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}
