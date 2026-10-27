import React, { useState, useEffect } from 'react';
import { Users, ShoppingBag, CheckCircle2, Sparkles, Flame } from 'lucide-react';
import { subscribeVisitorCount, subscribePixelLogs, PixelEventLog } from '../utils/analytics';
import { useToast } from './Toast';

export default function LiveVisitorCounter() {
  const [visitorCount, setVisitorCount] = useState(1);
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const seenEventIds = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    // 1. Subscribe to visitor count changes
    const unsubCount = subscribeVisitorCount((count) => {
      setVisitorCount(count);
    });

    // 2. Subscribe to real-time events to show FOMO notifications to other users
    const unsubLogs = subscribePixelLogs((logs) => {
      if (logs.length === 0) return;
      
      const latestEvent = logs[0];
      
      // If we've already seen this specific event, skip
      if (seenEventIds.current.has(latestEvent.id)) return;
      seenEventIds.current.add(latestEvent.id);

      // Keep set size manageable
      if (seenEventIds.current.size > 50) {
        const first = Array.from(seenEventIds.current)[0];
        seenEventIds.current.delete(first);
      }

      // Logic: If the event is fresh (less than 5 seconds old)
      const now = new Date();
      // latestEvent.timestamp is "HH:MM:SS" (from analytics.ts)
      const [h, m, s] = latestEvent.timestamp.split(':').map(Number);
      const eventDate = new Date();
      eventDate.setHours(h, m, s);
      
      const diffMs = Math.abs(now.getTime() - eventDate.getTime());
      
      if (diffMs < 5000) {
        if (latestEvent.event === 'AddToCart') {
          toast(`🔥 أميرة أخرى أضافت قطعة "${latestEvent.details.split(': ')[1] || 'فاخرة'}" للسلة الآن!`, 'info');
        } else if (latestEvent.event === 'Purchase') {
          toast(`✨ مبارك لعميلة جديدة! تم تأكيد طلب ملكي بقيمة ${latestEvent.value} ر.س 🛍️`, 'success');
        }
      }
    });

    // Show component after a small delay for elegance
    const timer = setTimeout(() => setIsVisible(true), 2000);

    return () => {
      unsubCount();
      unsubLogs();
      clearTimeout(timer);
    };
  }, [toast]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 z-40 animate-fade-in">
      <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl p-2.5 px-4 shadow-xl flex items-center gap-3 transition-all hover:scale-105 select-none">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
            <Users size={16} />
          </div>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black text-gray-950 font-mono tracking-tight">{visitorCount}</span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">زائرة نشطة</span>
          </div>
          <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
             <Flame size={10} className="animate-bounce" />
             يتسوقون معكِ الآن
          </p>
        </div>
      </div>
    </div>
  );
}
