/**
 * PaymentMethodsDisplay - Sulta Atelier Official Payment Methods Banner
 * Displays genuine payment method badges (Bank Transfer, Apple Pay, Visa, Mastercard, Mada, Cash on Delivery)
 */

interface PaymentMethodsDisplayProps {
  variant?: 'footer' | 'checkout';
}

export default function PaymentMethodsDisplay({ variant = 'footer' }: PaymentMethodsDisplayProps) {
  return (
    <div 
      className={`flex items-center justify-center sm:justify-start flex-wrap gap-2.5 ${variant === 'checkout' ? 'my-2' : ''}`}
      dir="rtl"
    >
      <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-xs hover:border-gray-200 transition-all duration-300 flex items-center justify-center max-w-full overflow-hidden">
        <img 
          src="/assets/aistudio/YHdjS5O14jZZWQXsG7gybkOtD7CRXcklAxkIe83q_9b507384.jpeg" 
          alt="طرق الدفع المعتمدة: تحويل بنكي، ابل باي، فيزا، ماستركارد، مدى، والدفع عند الاستلام" 
          className="h-8 sm:h-9 w-auto object-contain max-w-full rounded-md"
        />
      </div>
    </div>
  );
}
