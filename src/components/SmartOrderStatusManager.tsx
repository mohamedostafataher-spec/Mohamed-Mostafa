import React, { useState } from 'react';
import { 
  Clock, 
  Package, 
  Truck, 
  CheckCircle2, 
  MessageCircle, 
  ChevronRight,
  ArrowRight,
  Send,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { WhatsAppService } from '../services/whatsappService';
import { dbService } from '../services/db';

interface SmartOrderStatusManagerProps {
  order: Order;
  onStatusUpdated: (updatedOrder: Order) => void;
  toast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const STATUS_STEPS: { status: OrderStatus; label: string; icon: any; color: string; description: string }[] = [
  { 
    status: 'processing', 
    label: 'جاري التجهيز', 
    icon: Package, 
    color: 'bg-blue-600',
    description: 'يتم الآن تغليف القطع الملكية بعناية فائقة 🌸'
  },
  { 
    status: 'shipped', 
    label: 'تم الشحن', 
    icon: Truck, 
    color: 'bg-indigo-600',
    description: 'تم تسليم الشحنة لشركة التوصيل وهي في طريقها للعميلة 🚀'
  },
  { 
    status: 'delivered', 
    label: 'تم التسليم', 
    icon: CheckCircle2, 
    color: 'bg-emerald-600',
    description: 'تم وصول الطلب بنجاح وتلقي العميلة لقطعها الفاخرة ✨'
  }
];

export default function SmartOrderStatusManager({ order, onStatusUpdated, toast }: SmartOrderStatusManagerProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState<OrderStatus | null>(null);

  const handleAdvanceStatus = async (newStatus: OrderStatus) => {
    setIsUpdating(true);
    const updatedOrder = { ...order, status: newStatus };
    
    try {
      // 1. Update database
      await dbService.updateOrder(updatedOrder);
      
      // 2. Trigger local state update
      onStatusUpdated(updatedOrder);
      
      // 3. Automated WhatsApp Alert
      const statusLabel = STATUS_STEPS.find(s => s.status === newStatus)?.label || newStatus;
      WhatsAppService.sendStatusUpdate(updatedOrder, statusLabel, updatedOrder.phone);
      
      toast?.(`تم تحديث الحالة إلى "${statusLabel}" وإرسال تنبيه واتساب للعميلة 📱`, 'success');
      setShowConfirm(null);
    } catch (err: any) {
      toast?.('فشل تحديث الحالة، يرجى المحاولة لاحقاً', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStatus = order.status;
  const nextStep = STATUS_STEPS.find((_, idx) => {
    if (currentStatus === 'new' || currentStatus === 'pending' || currentStatus === 'cod') return idx === 0;
    const currentIdx = STATUS_STEPS.findIndex(s => s.status === currentStatus);
    return idx === currentIdx + 1;
  });

  return (
    <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-xs space-y-4" dir="rtl">
      <div className="flex items-center justify-between border-b border-gray-50 pb-3">
        <h4 className="text-xs font-black text-gray-900 flex items-center gap-2">
          <Clock size={14} className="text-[#A44C5C]" />
          <span>مركز أتمتة حالات الطلب (Smart Workflow) 🤖</span>
        </h4>
        <span className="text-[10px] text-gray-400 font-medium">سير عمل تلقائي</span>
      </div>

      {/* Workflow Stepper Visual */}
      <div className="flex items-center justify-between px-2 py-4 relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
        
        {STATUS_STEPS.map((step, idx) => {
          const isCompleted = STATUS_STEPS.findIndex(s => s.status === currentStatus) >= idx;
          const isCurrent = currentStatus === step.status;
          const Icon = step.icon;

          return (
            <div key={step.status} className="relative z-10 flex flex-col items-center gap-1.5 group">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                  isCompleted 
                    ? `${step.color} border-white text-white shadow-md` 
                    : 'bg-white border-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
              </div>
              <span className={`text-[9px] font-bold ${isCompleted ? 'text-gray-950' : 'text-gray-400'}`}>
                {step.label}
              </span>
              
              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block w-32 bg-gray-900 text-white text-[8px] p-2 rounded-lg text-center shadow-xl">
                {step.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* Smart Action Trigger */}
      {nextStep ? (
        <div className="pt-2">
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(nextStep.status)}
              className="w-full bg-[#A44C5C] hover:bg-black text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
            >
              <span>نقل الحالة لـ "{nextStep.label}" وتنبيه العميلة ⚡</span>
              <ArrowRight size={14} className="rotate-180" />
            </button>
          ) : (
            <div className="bg-gray-50 border border-[#A44C5C]/20 rounded-xl p-3 animate-fade-in space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-gray-700 leading-relaxed font-medium">
                   هل ترغبين بنقل الطلب لـ <strong className="text-black">"{nextStep.label}"</strong>؟
                   <br />
                   سيتم فتح الواتساب تلقائياً لإرسال إشعار التحديث للعميلة فوراً.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAdvanceStatus(nextStep.status)}
                  disabled={isUpdating}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  <span>نعم، تأكيد وتنبيه 📱</span>
                </button>
                <button
                  onClick={() => setShowConfirm(null)}
                  disabled={isUpdating}
                  className="bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 px-3 py-2 rounded-lg text-[10px] font-bold transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
          <p className="text-[10px] text-emerald-700 font-bold flex items-center justify-center gap-1.5">
            <CheckCircle2 size={13} />
            <span>تم اكتمال دورة الطلب بنجاح ✨</span>
          </p>
        </div>
      )}

      {/* Direct WhatsApp Quick Chat (Always available) */}
      <button
        onClick={() => WhatsAppService.sendInvoice(order, order.phone)}
        className="w-full border border-emerald-500/30 bg-emerald-50/30 hover:bg-emerald-50 text-emerald-700 py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all"
      >
        <MessageCircle size={13} />
        <span>مراسلة يدوية فورية عبر واتساب 💬</span>
      </button>
    </div>
  );
}
