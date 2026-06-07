import React, { useState } from 'react';
import { Send, Phone, Mail, Clock, Check, Heart } from 'lucide-react';
import { useToast } from './Toast';
import { Settings, ContactMessage } from '../types';
import { dbService } from '../services/db';
import SocialLinksView from './SocialLinksView';

interface ContactUsProps {
  settings?: Settings;
}

export default function ContactUs({ settings }: ContactUsProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      const contactMsg: ContactMessage = {
        id: `MSG-${Date.now()}`,
        name,
        email,
        message,
        date: new Date().toISOString()
      };
      
      await dbService.saveContactMessage(contactMsg);
      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      console.error("Failed to send message:", err);
      toast('نعتذر، حدث خلل فني أثناء إرسال رسالتكِ. يرجى المحاولة مرة أخرى لاحقاً.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      
      {/* Header Title */}
      <div className="bg-[#FAF5F0] py-24 md:py-32 border-b border-[#DF8A9D]/20" dir="rtl">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="font-serif italic text-xs tracking-[0.2em] text-[#A44C5C] block mb-3 uppercase">
            لنكن على اتصال دائم
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-[#0B0B0B] tracking-wide mb-6 uppercase">
            تواصل مع "سُلْطَة"
          </h2>
          <div className="w-12 h-[1px] bg-[#A44C5C] mx-auto mb-4" />
          <p className="text-sm text-gray-500 font-sans max-w-md mx-auto leading-relaxed">
            فريق خدمة العملاء والتصميم في "سُلْطَة" مستعدون للإجابة على استفساراتكم ومساعدتكم في اختيار القطعة المثالية بكل سرور.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-20" dir="rtl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* Column 1: Info & Work hours block */}
          <div className="space-y-8">
            <div className="rounded-3xl overflow-hidden shadow-xl border border-pink-100 aspect-video mb-8">
               <img 
                 src="/assets/images/sulta_luxury_pajama_1_1780681467351.png" 
                 alt="Contact Sulta" 
                 className="w-full h-full object-cover"
                 referrerPolicy="no-referrer"
                 onError={(e) => {
                   e.currentTarget.src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800";
                 }}
               />
            </div>
            <div className="bg-[#FAF5F0] border border-[#DF8A9D]/10 rounded-sm p-10 px-8 shadow-sm space-y-8">
              <h3 className="font-serif text-2xl font-light text-[#0B0B0B] pb-4 border-b border-[#DF8A9D]/20 tracking-wider">
                قنوات التواصل المباشرة
              </h3>

              <div className="space-y-6 font-sans text-sm text-gray-700">
                <div className="flex flex-col gap-1 text-right">
                  <div className="flex items-center gap-2 mb-1 justify-start">
                    <Phone size={14} className="text-[#A44C5C] shrink-0" />
                    <p className="font-serif text-[10px] tracking-widest uppercase text-gray-400">خدمة العملاء وطلبات الواتساب</p>
                  </div>
                  <a href={`https://wa.me/${settings?.whatsapp || '201110095403'}`} target="_blank" rel="noopener noreferrer" className="font-sans font-medium text-[#0B0B0B] hover:text-[#A44C5C]">
                    {settings?.contactPhone || '+20 111 009 5403'}
                  </a>
                </div>

                <div className="flex flex-col gap-1 text-right">
                  <div className="flex items-center gap-2 mb-1 justify-start">
                    <Mail size={14} className="text-[#A44C5C] shrink-0" />
                    <p className="font-serif text-[10px] tracking-widest uppercase text-gray-400">المراسلات والدعم الإلكتروني</p>
                  </div>
                  <a href={`mailto:${settings?.contactEmail || 'support@sulta-sleepwear.com'}`} className="font-sans font-medium text-[#0B0B0B] hover:text-[#A44C5C]">
                    {settings?.contactEmail || 'support@sulta-sleepwear.com'}
                  </a>
                </div>

                <div className="flex flex-col gap-1 text-right">
                  <div className="flex items-center gap-2 mb-1 justify-start">
                    <Clock size={14} className="text-[#A44C5C] shrink-0" />
                    <p className="font-serif text-[10px] tracking-widest uppercase text-gray-400">أوقات العمل والمنطقة الزمنية</p>
                  </div>
                  <p className="font-sans font-medium text-[#0B0B0B]">
                    يومياً من 9:00 صباحاً حتى 11:00 مساءً (بتوقيت مكة والقاهرة)
                  </p>
                </div>
              </div>
              <div className="pt-6 border-t border-[#DF8A9D]/10">
                <span className="block text-[10px] uppercase font-serif tracking-widest text-gray-400 mb-3 text-right">أزياؤنا على منصات التواصل الاجتماعي</span>
                <SocialLinksView className="flex gap-2.5 justify-start text-[#0B0B0B]" />
              </div>
            </div>
          </div>

          {/* Column 2: Digital correspondence form */}
          <div className="bg-[#0B0B0B] text-[#FAF5F0] rounded-sm p-10 px-8 shadow-xl text-right">
            <h3 className="font-serif text-2xl font-light mb-2 tracking-wider">اتركي رسالة</h3>
            <p className="text-xs text-gray-400 mb-8 font-sans font-light">
              نتطلع لسماع رأيكِ. يرجى ملء النموذج أدناه.
            </p>

            {submitted ? (
              <div className="bg-[#DF8A9D]/10 border border-[#DF8A9D]/30 rounded-sm p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#DF8A9D]/20 text-[#DF8A9D] flex items-center justify-center mx-auto mb-2">
                  <Check size={20} />
                </div>
                <h4 className="font-serif text-lg text-[#FAF5F0]">تم إرسال الرسالة بأناقة</h4>
                <p className="text-xs text-gray-400 font-sans leading-relaxed">
                  لقد استلمنا رسالتكِ. سيقوم أحد ممثلي خدمة العملاء لدينا بالتواصل معكِ عبر البريد الإلكتروني قريباً.
                </p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-6 font-sans">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-[#FAF5F0]/60 block mr-2">الاسم</label>
                    <input
                      type="text"
                      placeholder="اسمكِ الكامل"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border-b border-[#FAF5F0]/20 px-2 py-3 bg-transparent text-[#FAF5F0] placeholder-gray-500 focus:outline-none focus:border-[#DF8A9D] transition-colors text-sm text-right"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-[#FAF5F0]/60 block mr-2">البريد الإلكتروني</label>
                    <input
                      type="email"
                      placeholder="عنوان البريد"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border-b border-[#FAF5F0]/20 px-2 py-3 bg-transparent text-[#FAF5F0] placeholder-gray-500 focus:outline-none focus:border-[#DF8A9D] transition-colors text-sm text-right"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-[#FAF5F0]/60 block mr-2">محتوى الرسالة</label>
                  <textarea
                    placeholder="زودينا بالتفاصيل..."
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full border-b border-[#FAF5F0]/20 px-2 py-3 bg-transparent text-[#FAF5F0] placeholder-gray-500 focus:outline-none focus:border-[#DF8A9D] transition-colors text-sm resize-none text-right"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#FAF5F0] text-[#0B0B0B] hover:bg-[#A44C5C] hover:text-[#FAF5F0] py-4 rounded-sm text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 group mt-4"
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">جاري الإرسال...</span>
                  ) : (
                    <>
                      <span>إرسال</span>
                      <Send size={14} className="group-hover:-translate-x-1 transition-transform rotate-180" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
