import React, { useState } from 'react';
import { Send, Phone, Mail, Clock, MapPin, Check, Heart } from 'lucide-react';
import { useToast } from './Toast';
import { Settings, ContactMessage } from '../types';
import { dbService } from '../services/db';

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
      toast('نعتذر، حدث تعذر فني عند إرسال رسالتك. يرجى المحاولة لاحقاً.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAFAF7] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Title */}
        <div className="text-center mb-16">
          <span className="font-serif italic text-xs tracking-[0.2em] text-gray-400 block mb-3 uppercase">
            Let's Stay Connected • نحن هنا لخدمتكم
          </span>
          <h2 className="font-serif text-3xl md:text-5xl font-light text-[#0B0B0B] tracking-wide mb-6">
            اتصلي بنا • صالون سولتا الفاخر
          </h2>
          <div className="w-16 h-0.5 bg-[#F4B6C2] mx-auto mb-4" />
          <p className="text-xs text-gray-500 font-sans max-w-md mx-auto">
            فريق خدمة عملاء ومصممي سولتا جاهزون للرد على تساؤلاتك ومساعدتك في اختيار المقاس المناسب بكل سرور.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Column 1: Info & Work hours & Map block */}
          <div className="space-y-8">
            
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xs space-y-6">
              <h3 className="font-serif text-xl font-semibold text-[#0B0B0B] pb-3 border-b border-gray-150">
                قنوات الاتصال المباشرة
              </h3>

              <div className="space-y-4 font-sans text-xs md:text-sm text-gray-700">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px]">خدمة العملاء والطلب عبر واتساب</p>
                    <a href={`https://wa.me/${settings?.whatsapp || '201110095403'}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-900 hover:text-[#F4B6C2]">
                      {settings?.contactPhone || '+20 111 009 5403'}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-pink-50 text-[#F4B6C2] flex items-center justify-center shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px]">المراسلات والدعم الإلكتروني</p>
                    <a href={`mailto:${settings?.contactEmail || 'support@sulta-sleepwear.com'}`} className="font-semibold text-gray-900 hover:text-[#F4B6C2]">
                      {settings?.contactEmail || 'support@sulta-sleepwear.com'}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-50 text-[#F6E7A6] flex items-center justify-center shrink-0">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px]">ساعات العمل والمجال الزمني</p>
                    <p className="font-semibold text-gray-900">
                      يومياً من الساعة 9:00 صباحاً وحتى الساعة 11:00 مساءً (توقيت مكة والقاهرة)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Mock Map Visual */}
            <div className="relative rounded-3xl overflow-hidden border border-gray-100 bg-white h-64 shadow-xs flex flex-col justify-between p-6">
              <div className="absolute inset-0 bg-[#F5F2EB] select-none pointer-events-none opacity-90 z-10 flex flex-col items-center justify-center">
                {/* Visual lines resembling elegant retro map */}
                <div className="absolute w-full h-[1px] bg-gray-300 top-1/3" />
                <div className="absolute w-full h-[1px] bg-gray-300 top-2/3" />
                <div className="absolute h-full w-[1px] bg-gray-300 left-1/3" />
                <div className="absolute h-full w-[1px] bg-gray-300 left-2/3" />
                
                {/* Champagne gold HQ pin */}
                <div className="w-10 h-10 rounded-full bg-[#0B0B0B] border-2 border-[#F6E7A6] flex items-center justify-center text-white animate-bounce shadow-md">
                  <MapPin size={18} className="text-[#F6E7A6]" />
                </div>
                
                <span className="font-serif font-bold text-xs text-[#0B0B0B] mt-3 tracking-widest uppercase">SULTA MAIN SHOWROOM HQ</span>
                <span className="text-[9px] text-gray-400 font-sans mt-1">طريق الملك فهد، الرياض • حي المعادي، القاهرة</span>
              </div>

              {/* Header Info absolute */}
              <div className="relative z-20 flex justify-between items-start">
                <span className="bg-[#0B0B0B]/80 text-[#F6E7A6] text-[9px] font-sans px-2.5 py-1 rounded-full uppercase tracking-widest font-medium">Flagship boutique map</span>
              </div>
            </div>

          </div>

          {/* Column 2: Elegant Contact Form */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
            <h3 className="font-serif text-xl font-semibold text-[#0B0B0B] pb-3 border-b border-gray-100 mb-6 flex items-center gap-2">
              <Heart size={16} className="text-[#F4B6C2]" />
              أرسلي لنا استفسارك المباشر
            </h3>

            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-50 text-[#25D366] flex items-center justify-center mx-auto shadow-md border border-green-200">
                  <Check size={32} />
                </div>
                <h4 className="font-serif text-lg font-bold text-[#0B0B0B]">تم استلام رسالتك الجميلة!</h4>
                <p className="text-gray-500 text-xs font-sans max-w-sm mx-auto leading-relaxed">
                  شكراً لتواصلك مع بيت الأزياء سولتا. سنقوم بمراجعة استفسارك والرد عليك عبر بريدك الإلكتروني في أقل من ٣ ساعات طيلة فترة العمل.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="bg-[#0B0B0B] text-white hover:bg-[#F4B6C2] px-6 py-2 rounded-full text-xs font-sans transition-colors"
                >
                  إرسال رسالة أخرى
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-5 font-sans">
                
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">الاسم الكريم *</label>
                  <input
                    type="text"
                    placeholder="مثال: نورة المحيسن"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-3.5 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F4B6C2]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">البريد الإلكتروني للرد *</label>
                  <input
                    type="email"
                    placeholder="مثال: noura@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs text-left border border-gray-200 rounded-lg px-3.5 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F4B6C2]"
                    dir="ltr"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">تفاصيل استفسارك أو طلبك الخاص *</label>
                  <textarea
                    placeholder="اكتبي تفاصيل مقاسك أو رغبتك في تصميم معين، أو رغبتك في طلب خاص بالتغليف لتقديمها كهدية مميزة..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-3.5 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F4B6C2] h-32 text-right"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#0B0B0B] text-[#F6E7A6] hover:bg-[#F4B6C2] hover:text-white py-3.5 rounded-xl text-xs font-sans font-semibold tracking-wide transition-luxury flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{isSubmitting ? 'جاري الإرسال...' : 'أرسلي الرسالة بكل سرور'}</span>
                    {!isSubmitting && <Send size={13} className="rotate-220" />}
                  </button>
                </div>

              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
