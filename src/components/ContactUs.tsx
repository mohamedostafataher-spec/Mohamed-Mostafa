import React, { useState } from 'react';
import { Send, Phone, Mail, Clock, Check, Heart } from 'lucide-react';
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
      toast('We apologize, a technical issue occurred while sending your message. Please try again later.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      
      {/* Header Title */}
      <div className="bg-[#FAF5F0] py-24 md:py-32 border-b border-[#DF8A9D]/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="font-serif italic text-xs tracking-[0.2em] text-[#A44C5C] block mb-3 uppercase">
            Let's Stay Connected
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-[#0B0B0B] tracking-wide mb-6 uppercase">
            Contact Sulta
          </h2>
          <div className="w-12 h-[1px] bg-[#A44C5C] mx-auto mb-4" />
          <p className="text-sm text-gray-500 font-sans max-w-md mx-auto leading-relaxed">
            Sulta's customer service and design team are ready to answer your questions and assist you in selecting the perfect fit with pleasure.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* Column 1: Info & Work hours block */}
          <div className="space-y-8">
            <div className="bg-[#FAF5F0] border border-[#DF8A9D]/10 rounded-sm p-10 px-8 shadow-sm space-y-8">
              <h3 className="font-serif text-2xl font-light text-[#0B0B0B] pb-4 border-b border-[#DF8A9D]/20 tracking-wider">
                Direct Channels
              </h3>

              <div className="space-y-6 font-sans text-sm text-gray-700">
                <div className="flex flex-col gap-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <Phone size={14} className="text-[#A44C5C] shrink-0" />
                    <p className="font-serif text-[10px] tracking-widest uppercase text-gray-400">Customer Service & WhatsApp Orders</p>
                  </div>
                  <a href={`https://wa.me/${settings?.whatsapp || '201110095403'}`} target="_blank" rel="noopener noreferrer" className="font-sans font-medium text-[#0B0B0B] hover:text-[#A44C5C]">
                    {settings?.contactPhone || '+20 111 009 5403'}
                  </a>
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail size={14} className="text-[#A44C5C] shrink-0" />
                    <p className="font-serif text-[10px] tracking-widest uppercase text-gray-400">Correspondence & E-Support</p>
                  </div>
                  <a href={`mailto:${settings?.contactEmail || 'support@sulta-sleepwear.com'}`} className="font-sans font-medium text-[#0B0B0B] hover:text-[#A44C5C]">
                    {settings?.contactEmail || 'support@sulta-sleepwear.com'}
                  </a>
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-[#A44C5C] shrink-0" />
                    <p className="font-serif text-[10px] tracking-widest uppercase text-gray-400">Working Hours & Timezone</p>
                  </div>
                  <p className="font-sans font-medium text-[#0B0B0B]">
                    Daily from 9:00 AM to 11:00 PM (Mecca and Cairo Time)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Digital correspondence form */}
          <div className="bg-[#0B0B0B] text-[#FAF5F0] rounded-sm p-10 px-8 shadow-xl">
            <h3 className="font-serif text-2xl font-light mb-2 tracking-wider">Leave a Message</h3>
            <p className="text-xs text-gray-400 mb-8 font-sans font-light">
              We look forward to hearing from you. Please fill out the form below.
            </p>

            {submitted ? (
              <div className="bg-[#DF8A9D]/10 border border-[#DF8A9D]/30 rounded-sm p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#DF8A9D]/20 text-[#DF8A9D] flex items-center justify-center mx-auto mb-2">
                  <Check size={20} />
                </div>
                <h4 className="font-serif text-lg text-[#FAF5F0]">Message Sent Elegantly</h4>
                <p className="text-xs text-gray-400 font-sans leading-relaxed">
                  We have received your message. One of our customer service representatives will contact you via email shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-6 font-sans">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-[#FAF5F0]/60 block ml-2">Name</label>
                    <input
                      type="text"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border-b border-[#FAF5F0]/20 px-2 py-3 bg-transparent text-[#FAF5F0] placeholder-gray-500 focus:outline-none focus:border-[#DF8A9D] transition-colors text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-[#FAF5F0]/60 block ml-2">Email</label>
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border-b border-[#FAF5F0]/20 px-2 py-3 bg-transparent text-[#FAF5F0] placeholder-gray-500 focus:outline-none focus:border-[#DF8A9D] transition-colors text-sm text-left"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-[#FAF5F0]/60 block ml-2">Message Content</label>
                  <textarea
                    placeholder="Provide us with details..."
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full border-b border-[#FAF5F0]/20 px-2 py-3 bg-transparent text-[#FAF5F0] placeholder-gray-500 focus:outline-none focus:border-[#DF8A9D] transition-colors text-sm resize-none"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#FAF5F0] text-[#0B0B0B] hover:bg-[#A44C5C] hover:text-[#FAF5F0] py-4 rounded-sm text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 group mt-4"
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">Sending...</span>
                  ) : (
                    <>
                      <span>Submit</span>
                      <Send size={14} className="group-hover:translate-x-1 transition-transform" />
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
