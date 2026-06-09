import React, { useState, useEffect } from 'react';
import { SupportTicket, TicketMessage } from '../types';
import { dbService } from '../services/db';
import { MessageCircle, Send, Plus, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function SupportTicketsClient({ session }: { session: any }) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // New ticket form
  const [subject, setSubject] = useState('');
  const [type, setType] = useState<SupportTicket['type']>('inquiry');

  useEffect(() => {
    if (session?.user?.email) {
      const unsub = dbService.subscribeTickets((allTickets) => {
        setTickets(allTickets.filter(t => t.email === session.user.email));
      }, console.error);
      return unsub;
    }
  }, [session]);

  useEffect(() => {
    if (selectedTicket) {
      const unsub = dbService.subscribeTicketMessages(selectedTicket.id, setMessages, console.error);
      return unsub;
    }
  }, [selectedTicket]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = 'TKT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const ticket: SupportTicket = {
      id: newId,
      customerId: session?.user?.id,
      customerName: session?.user?.email?.split('@')[0] || 'Customer',
      email: session?.user?.email || '',
      phone: '',
      type,
      status: 'new',
      subject,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await dbService.saveTicket(ticket);
    setIsCreating(false);
    setSelectedTicket(ticket);
    setSubject('');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket) return;
    const msg: TicketMessage = {
      id: 'MSG-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      ticketId: selectedTicket.id,
      senderType: 'customer',
      senderName: selectedTicket.customerName,
      content: newMessage,
      createdAt: new Date().toISOString()
    };
    await dbService.saveTicketMessage(msg);
    setNewMessage('');
  };

  const statusColors = {
    new: 'bg-blue-50 text-blue-600 border-blue-200',
    reviewing: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    waiting_customer: 'bg-purple-50 text-purple-600 border-purple-200',
    resolved: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    closed: 'bg-gray-50 text-gray-600 border-gray-200'
  };

  const statusLabels = {
    new: 'جديد',
    reviewing: 'قيد المراجعة',
    waiting_customer: 'بانتظار العميل',
    resolved: 'تم الحل',
    closed: 'مغلق'
  };

  const typeLabels = {
    inquiry: 'استفسار',
    complaint: 'شكوى',
    exchange: 'استبدال',
    return: 'استرجاع',
    shipping: 'شحن',
    payment: 'دفع',
    suggestion: 'اقتراح'
  };

  if (!session) {
    return <div className="text-center py-10">الرجاء تسجيل الدخول لعرض تذاكر الدعم الخاصة بك.</div>;
  }

  if (selectedTicket) {
    return (
      <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-xs animate-fade-in flex flex-col h-[600px]">
        {/* Header */}
        <div className="p-4 border-b border-gray-150 bg-gray-50 flex justify-between items-center shrink-0">
          <div className="flex gap-4">
             <div className="text-right">
                <h3 className="font-bold text-gray-900">{selectedTicket.subject}</h3>
                <span className="text-xs text-gray-500">#{selectedTicket.id} • {typeLabels[selectedTicket.type]}</span>
             </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[selectedTicket.status]}`}>
              {statusLabels[selectedTicket.status]}
            </span>
            <button onClick={() => setSelectedTicket(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
              <ArrowRight size={16} />
              عودة
            </button>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
          {messages.map((msg) => {
            const isMe = msg.senderType === 'customer';
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl p-4 ${isMe ? 'bg-[#0B0B0B] text-white rounded-tl-sm' : 'bg-white border border-gray-150 rounded-tr-sm shadow-xs'}`}>
                  <div className="flex items-center gap-2 mb-2 opacity-80 text-xs">
                    <span className="font-bold">{msg.senderName}</span>
                    <span>•</span>
                    <span>{new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          })}
          {messages.length === 0 && (
            <div className="text-center text-gray-400 py-10 flex flex-col items-center gap-3">
              <MessageCircle size={32} className="opacity-20" />
              <p>كيف يمكننا مساعدتك اليوم؟ سيقوم فريق العناية بالرد عليك قريباً.</p>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-150 bg-white shrink-0">
          {selectedTicket.status === 'closed' || selectedTicket.status === 'resolved' ? (
            <div className="text-center text-gray-500 text-sm py-2 font-medium flex items-center justify-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              تم إغلاق هذه التذكرة. يمكنك فتح تذكرة جديدة إذا كان لديك استفسار آخر.
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-right focus:outline-none focus:border-[#0B0B0B] focus:bg-white transition-all text-sm"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-[#0B0B0B] text-white px-5 rounded-xl disabled:opacity-50 hover:bg-[#A44C5C] transition-colors flex items-center justify-center"
              >
                <Send size={18} className="rotate-180" />
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-xs animate-fade-in p-8">
        <h3 className="font-serif text-2xl font-bold mb-6 text-[#0B0B0B]">إنشاء تذكرة دعم جديدة</h3>
        <form onSubmit={handleCreateTicket} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">نوع الطلب</label>
            <select
              value={type}
              onChange={(e: any) => setType(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-right focus:border-[#0B0B0B] transition-colors"
            >
              {Object.entries(typeLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">موضوع الطلب</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-right focus:border-[#0B0B0B] transition-colors"
              placeholder="مثال: استفسار عن موعد التوصيل"
              required
            />
          </div>
          <div className="flex gap-4">
            <button type="submit" className="bg-[#0B0B0B] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#A44C5C] transition-colors">
              إنشاء التذكرة
            </button>
            <button type="button" onClick={() => setIsCreating(false)} className="bg-white text-gray-600 border border-gray-200 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-150 shadow-xs">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#0B0B0B] mb-1">مركز مساعدة SULTA</h2>
          <p className="text-gray-500 font-medium text-sm">تتبع استفساراتك، وتواصل مع فريق العناية بالعملاء</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-[#0B0B0B] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#A44C5C] transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          تذكرة جديدة
        </button>
      </div>

      <div className="space-y-4">
        {tickets.length === 0 ? (
          <div className="text-center bg-white border border-gray-150 rounded-2xl p-10 shadow-xs">
            <MessageCircle size={48} className="mx-auto text-gray-200 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">لا توجد تذاكر حالية</h3>
            <p className="text-gray-500 text-sm">عندما يكون لديك سؤال أو تحتاج مساعدة، يمكنك فتح تذكرة جديدة وسيقوم فريقنا بخدمتك.</p>
          </div>
        ) : (
          tickets.map(ticket => (
            <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="bg-white p-5 rounded-2xl border border-gray-150 cursor-pointer hover:border-[#0B0B0B] hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-[#A44C5C] transition-colors text-lg mb-1">{ticket.subject}</h4>
                  <div className="flex gap-4 text-xs font-medium text-gray-400">
                    <span>#{ticket.id}</span>
                    <span>•</span>
                    <span>{typeLabels[ticket.type]}</span>
                    <span>•</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[ticket.status]}`}>
                  {statusLabels[ticket.status]}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#A44C5C] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={16} />
                عرض المحادثة
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
