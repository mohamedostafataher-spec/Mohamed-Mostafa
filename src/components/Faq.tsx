import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles, MessageSquare, ShieldCheck, Truck } from 'lucide-react';
import { dbService } from '../services/db';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

export default function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [faqs, setFaqs] = useState<FaqItem[]>([
    {
      category: 'materials',
      question: 'What is the quality and material of SULTA pieces?',
      answer: 'At SULTA, we utilize the finest global fabric lines with absolute exclusivity. We use imported luxury Italian satin with a smooth silk-like back that prevents static and sweating, natural Parisian silk, and refined French Chantilly Lace. Our cotton collection is crafted entirely from organic long-staple Egyptian cotton treated for a soothing velvety feel.'
    },
    {
      category: 'sizing',
      question: 'How do I choose my perfect fit?',
      answer: 'We have a precise sizing chart tailored carefully to provide the perfect fit. We recommend reviewing the "Size Guide" to find your match. If you fall between two sizes, we advise choosing the larger size for maximum comfort.'
    },
    {
      category: 'packaging',
      question: 'How are the orders packaged?',
      answer: 'All SULTA orders are shipped inside our "Royal Luxury Packaging", a classic matte black sturdy box engraved with the brand logo in gleaming champagne gold, tied manually with a soft pink velvet ribbon. The pieces inside are wrapped with unique silk paper and accompanied by a welcome card.'
    },
    {
      category: 'shipping',
      question: 'How long does shipping take?',
      answer: 'We provide fast royal shipping for your convenience. Within major regions, shipping typically takes 2-4 business days.'
    },
    {
      category: 'returns',
      question: 'What is the return and exchange policy?',
      answer: 'We gladly support a fully flexible return and exchange policy within 14 days of receipt, provided the piece remains in its original unwashed and unused condition with all tags and the royal box intact.'
    },
    {
      category: 'payments',
      question: 'Are payment transactions secure?',
      answer: 'Our website is equipped with the highest SSL security protocols and certified bank encryption. We accept major credit cards and secure mobile payment options.'
    }
  ]);

  useEffect(() => {
    const fetchFaqs = async () => {
      const data = await dbService.getFaqs();
      if (data && data.length > 0) {
        setFaqs(data);
      }
    };
    fetchFaqs();
  }, []);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'materials', label: 'Fabrics & Quality' },
    { id: 'sizing', label: 'Sizing & Fit' },
    { id: 'packaging', label: 'Packaging & Gifting' },
    { id: 'shipping', label: 'Shipping & Delivery' },
    { id: 'returns', label: 'Returns & Exchanges' },
    { id: 'payments', label: 'Payments & Security' },
  ];

  const filteredFaqs = activeTab === 'all' 
    ? faqs 
    : faqs.filter(f => f.category === activeTab);

  return (
    <div className="bg-white min-h-screen">
      
      {/* Editorial Header */}
      <div className="bg-[#FAF5F0] py-24 md:py-32 border-b border-[#DF8A9D]/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="font-serif italic text-xs tracking-[0.2em] text-[#A44C5C] block mb-3 uppercase">
            Customer Concierge & Help
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-[#0B0B0B] tracking-wide mb-6 uppercase">
            Frequently Asked Questions
          </h2>
          <div className="w-12 h-[1px] bg-[#A44C5C] mx-auto mb-4" />
          <p className="text-sm text-gray-500 font-sans max-w-xl mx-auto leading-relaxed">
            At SULTA, we are dedicated to providing a refined shopping experience. Browse the certified answers from our experts to assist you.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20">
        {/* Categories Filter Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-16 select-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-5 py-2.5 rounded-sm text-xs font-sans tracking-widest uppercase transition-all border ${
                activeTab === cat.id
                  ? 'bg-[#0B0B0B] text-[#FAF5F0] border-black font-semibold'
                  : 'bg-transparent text-gray-600 border-gray-200 hover:border-[#DF8A9D]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4 font-sans">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              No questions found for this section.
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => (
              <div 
                key={idx} 
                className={`border rounded-sm transition-all duration-300 ${
                  openIdx === idx 
                    ? 'border-[#DF8A9D]/40 bg-[#FAF5F0]/50 shadow-sm' 
                    : 'border-gray-100 bg-white hover:border-[#DF8A9D]/30'
                }`}
              >
                <button
                  onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className={`font-serif text-sm tracking-wide ${openIdx === idx ? 'text-[#0B0B0B] font-semibold' : 'text-gray-700'}`}>
                    {faq.question}
                  </span>
                  {openIdx === idx ? (
                    <ChevronUp size={18} className="text-[#A44C5C] shrink-0 ml-4" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-400 shrink-0 ml-4" />
                  )}
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    openIdx === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="p-6 pt-0 border-t border-gray-100/50 mt-1">
                    <p className="text-sm text-gray-500 leading-relaxed font-sans">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
