import React, { useState, useEffect } from 'react';
import { SupportTicket, TicketMessage } from '../types';
import { dbService } from '../services/db';
import { MessageCircle, Search, Filter, Send, X, ShieldAlert, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

export default function SupportCenterAdmin() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const unsub = dbService.subscribeTickets(setTickets, console.error);
    return unsub;
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      const unsub = dbService.subscribeTicketMessages(selectedTicket.id, setMessages, console.error);
      return unsub;
    }
  }, [selectedTicket]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket) return;
    const msg: TicketMessage = {
      id: 'MSG-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      ticketId: selectedTicket.id,
      senderType: 'admin',
      senderName: 'SULTA Support',
      content: newMessage,
      createdAt: new Date().toISOString()
    };
    await dbService.saveTicketMessage(msg);
    if (selectedTicket.status === 'new' || selectedTicket.status === 'waiting_customer') {
      await dbService.updateTicketStatus(selectedTicket.id, 'reviewing');
    }
    setNewMessage('');
  };

  const handleStatusChange = async (status: SupportTicket['status']) => {
    if (!selectedTicket) return;
    await dbService.updateTicketStatus(selectedTicket.id, status);
    setSelectedTicket({ ...selectedTicket, status });
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

  const filteredTickets = tickets.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'open') return t.status !== 'closed' && t.status !== 'resolved';
    return t.status === filter;
  });

  const openTickets = tickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').length;
  const closedTickets = tickets.filter(t => t.status === 'closed' || t.status === 'resolved').length;
  const urgentTickets = tickets.filter(t => t.type === 'complaint' && t.status === 'new').length;

  // Chart data
  const chartData = [
    { name: 'السبت', tickets: 12 },
    { name: 'الأحد', tickets: 19 },
    { name: 'الإثنين', tickets: 15 },
    { name: 'الثلاثاء', tickets: 22 },
    { name: 'الأربعاء', tickets: 18 },
    { name: 'الخميس', tickets: 10 },
    { name: 'الجمعة', tickets: 5 },
  ];

  if (selectedTicket) {
    return (
      <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-xs animate-fade-in flex flex-col h-[700px]" dir="rtl">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-150 bg-gray-50 flex justify-between items-center shrink-0">
          <div className="flex gap-4 items-center">
            <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <X size={20} />
            </button>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{selectedTicket.subject}</h3>
              <p className="text-sm text-gray-500">
                {selectedTicket.customerName} | {selectedTicket.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <select
               value={selectedTicket.status}
               onChange={(e: any) => handleStatusChange(e.target.value)}
               className={`text-sm font-bold border rounded-xl px-3 py-1.5 focus:outline-none ${statusColors[selectedTicket.status]}`}
             >
                {Object.entries(statusLabels).map(([val, label]) => (
                  <option key={val} value={val} className="text-gray-900 bg-white">{label}</option>
                ))}
             </select>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
          {/* First message from the ticket content if any, or just start messages */}
          <div className="flex justify-start">
            <div className="max-w-[75%] bg-white border border-gray-150 rounded-2xl rounded-tr-sm p-4 shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                <span className="font-bold text-gray-900">{selectedTicket.customerName}</span>
                <span>•</span>
                <span>{new Date(selectedTicket.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-sm font-medium leading-relaxed">فتح العميل تذكرة دعم نوع: {typeLabels[selectedTicket.type]}</p>
            </div>
          </div>
          {messages.map((msg) => {
            const isMe = msg.senderType === 'admin';
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl p-4 ${isMe ? 'bg-[#0B0B0B] text-white rounded-tl-sm' : 'bg-white border border-gray-150 rounded-tr-sm shadow-xs'}`}>
                  <div className="flex items-center gap-2 mb-2 opacity-80 text-xs text-gray-400">
                    <span className={`font-bold ${isMe ? 'text-white' : 'text-gray-900'}`}>{msg.senderName}</span>
                    <span>•</span>
                    <span className={isMe ? 'text-white/60' : 'text-gray-500'}>{new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="p-4 md:p-6 border-t border-gray-150 bg-white shrink-0">
           <form onSubmit={handleSendMessage} className="flex gap-3">
             <input
               type="text"
               value={newMessage}
               onChange={(e) => setNewMessage(e.target.value)}
               placeholder="رد دعم SULTA..."
               className="flex-1 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-right focus:outline-none focus:border-[#0B0B0B] focus:bg-white transition-all text-sm"
             />
             <button
               type="submit"
               disabled={!newMessage.trim()}
               className="bg-[#0B0B0B] text-[#F6E7A6] px-6 rounded-xl disabled:opacity-50 hover:bg-[#A44C5C] hover:text-white transition-colors flex items-center justify-center font-bold"
             >
               إرسال الرد
             </button>
           </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#0B0B0B] flex items-center gap-2">
            <MessageCircle className="text-[#A44C5C]" />
            مركز الدعم الفني
          </h2>
          <p className="text-sm text-gray-500 mt-1">إدارة استفسارات العملاء والمشاكل التقنية</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs">
          <div className="flex items-center gap-3 mb-2 text-gray-500">
            <MessageCircle size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">التذاكر المفتوحة</span>
          </div>
          <p className="text-3xl font-black text-[#0B0B0B] pt-2">{openTickets}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs">
          <div className="flex items-center gap-3 mb-2 text-gray-500">
            <CheckCircle2 size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">تذاكر مغلقة</span>
          </div>
          <p className="text-3xl font-black text-gray-400 pt-2">{closedTickets}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-red-100 bg-red-50/30 shadow-xs">
          <div className="flex items-center gap-3 mb-2 text-red-500">
            <AlertTriangle size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">شكاوى عاجلة</span>
          </div>
          <p className="text-3xl font-black text-red-600 pt-2">{urgentTickets}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs">
          <div className="flex items-center gap-3 mb-2 text-gray-500">
            <Clock size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">متوسط استجابة</span>
          </div>
          <p className="text-3xl font-black text-[#0B0B0B] pt-2">15m</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs">
         <h3 className="font-bold text-gray-900 mb-6">معدل حجم التذاكر (7 أيام)</h3>
         <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData}>
                  <defs>
                     <linearGradient id="ticketGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A44C5C" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#A44C5C" stopOpacity={0}/>
                     </linearGradient>
                  </defs>
                  <YAxis hide />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <Tooltip wrapperClassName="text-right font-sans" />
                  <Area type="monotone" dataKey="tickets" stroke="#A44C5C" strokeWidth={3} fillOpacity={1} fill="url(#ticketGradient)" />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex gap-2">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none text-gray-700"
            >
              <option value="all">جميع التذاكر</option>
              <option value="open">المفتوحة فقط</option>
              <option value="new">جديد</option>
              <option value="closed">تم الحل الإغلاق</option>
            </select>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="بحث التذاكر..." className="pl-3 pr-9 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-gray-400 w-48" />
            </div>
          </div>
        </div>
        
        <table className="w-full text-right text-sm">
          <thead className="bg-[#FAF5F0] text-gray-500 font-serif border-b border-gray-150 uppercase tracking-widest text-xs">
            <tr>
              <th className="p-4 font-normal">الموضوع</th>
              <th className="p-4 font-normal">العميل</th>
              <th className="p-4 font-normal">النوع</th>
              <th className="p-4 font-normal">الحالة</th>
              <th className="p-4 font-normal">التاريخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTickets.map((t) => (
              <tr key={t.id} onClick={() => setSelectedTicket(t)} className="hover:bg-gray-50 cursor-pointer transition-colors group">
                <td className="p-4">
                  <div className="font-bold text-gray-900 group-hover:text-[#A44C5C]">{t.subject}</div>
                  <div className="text-xs text-gray-400 mt-1">#{t.id}</div>
                </td>
                <td className="p-4 font-medium text-gray-700">{t.customerName}</td>
                <td className="p-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs">{typeLabels[t.type]}</span></td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold border ${statusColors[t.status]}`}>
                    {statusLabels[t.status]}
                  </span>
                </td>
                <td className="p-4 text-gray-500 text-xs font-medium">{new Date(t.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {filteredTickets.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400 font-medium">لا توجد تذاكر تطابق الفلتر</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
