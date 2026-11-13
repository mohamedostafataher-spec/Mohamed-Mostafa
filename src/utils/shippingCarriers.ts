import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Order, ShippingCarrier } from '../types';

export const DEFAULT_SHIPPING_CARRIERS: ShippingCarrier[] = [
  {
    id: 'SMSA',
    nameAr: 'سمسا إكسبريس (SMSA)',
    nameEn: 'SMSA Express',
    trackingUrlTemplate: 'https://www.smsaexpress.com/sa/en/trackingdetails?tracknumbers={tracking}',
    isActive: true
  },
  {
    id: 'Aramex',
    nameAr: 'أرامكس (Aramex)',
    nameEn: 'Aramex',
    trackingUrlTemplate: 'https://www.aramex.com/sa/ar/track/results?ShipmentNumber={tracking}',
    isActive: true
  },
  {
    id: 'SPL',
    nameAr: 'سبل البريد السعودي (SPL)',
    nameEn: 'Saudi Post SPL',
    trackingUrlTemplate: 'https://splonline.com.sa/ar/track/?track={tracking}',
    isActive: true
  },
  {
    id: 'JT',
    nameAr: 'جي آند تي إكسبريس (J&T)',
    nameEn: 'J&T Express KSA',
    trackingUrlTemplate: 'https://www.jtexpress-sa.com/trajectoryQuery?bills={tracking}',
    isActive: true
  },
  {
    id: 'RedBox',
    nameAr: 'ريد بوكس (RedBox)',
    nameEn: 'RedBox KSA',
    trackingUrlTemplate: 'https://redboxsa.com/track/{tracking}',
    isActive: true
  },
  {
    id: 'Fastlo',
    nameAr: 'فاستلو (Fastlo)',
    nameEn: 'Fastlo',
    trackingUrlTemplate: 'https://fastlo.com/track/{tracking}',
    isActive: true
  }
];

export function resolveCarrierRecord(
  carrierIdOrName: string | undefined | null,
  carriers: ShippingCarrier[] = DEFAULT_SHIPPING_CARRIERS
): ShippingCarrier | undefined {
  if (!carrierIdOrName) return undefined;
  const clean = carrierIdOrName.trim().toLowerCase();
  return carriers.find(
    (c) =>
      c.id.toLowerCase() === clean ||
      c.nameAr.toLowerCase() === clean ||
      (c.nameEn && c.nameEn.toLowerCase() === clean)
  );
}

export function getCarrierDisplayName(
  order: Pick<Order, 'shippingCarrier' | 'shippingCarrierCode'>,
  carriers: ShippingCarrier[] = DEFAULT_SHIPPING_CARRIERS
): string {
  const matched =
    resolveCarrierRecord(order.shippingCarrierCode, carriers) ||
    resolveCarrierRecord(order.shippingCarrier, carriers);
  if (matched) return matched.nameAr;
  return order.shippingCarrier || 'شركة شحن معتمدة';
}

export function buildCarrierTrackingUrl(
  carrierIdOrName: string | undefined | null,
  trackingNumber: string | undefined | null,
  carriers: ShippingCarrier[] = DEFAULT_SHIPPING_CARRIERS
): string | null {
  const track = (trackingNumber || '').trim();
  if (!track) return null;
  const carrier = resolveCarrierRecord(carrierIdOrName, carriers);
  if (!carrier || !carrier.trackingUrlTemplate.trim()) return null;

  const encoded = encodeURIComponent(track);
  if (carrier.trackingUrlTemplate.includes('{tracking}')) {
    return carrier.trackingUrlTemplate.replace(/\{tracking\}/g, encoded);
  }
  return `${carrier.trackingUrlTemplate}${encoded}`;
}

function escapeHtml(input: string): string {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generates and downloads a crisp RTL Arabic Shipping Waybill PDF (A6 portrait format)
 * completely offline using open-source html2canvas + jsPDF without corrupted raw Arabic fonts.
 */
export async function generateShippingWaybillPdf(
  order: Order,
  carriers: ShippingCarrier[] = DEFAULT_SHIPPING_CARRIERS,
  storeName = 'سولته'
): Promise<void> {
  if (typeof document === 'undefined') return;

  const carrierName = getCarrierDisplayName(order, carriers);
  const trackingCode = (order.trackingNumber || `SUL-${order.id.slice(0, 8).toUpperCase()}`).trim();
  const isCod =
    (order.paymentMethod || '').includes('استلام') ||
    (order.paymentMethod || '').toLowerCase().includes('cod');
  const codAmount = isCod && order.paymentStatus !== 'paid' ? Number(order.totalPrice || 0) : 0;
  const totalPieces = (order.items || []).reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);

  const itemsText = (order.items || [])
    .slice(0, 5)
    .map((it) => `• ${escapeHtml(it.productName)} (${escapeHtml(it.color)} - ${escapeHtml(it.size)}) × ${it.quantity || 1}`)
    .join('<br/>');

  const container = document.createElement('div');
  container.dir = 'rtl';
  container.lang = 'ar';
  container.style.position = 'fixed';
  container.style.top = '-99999px';
  container.style.left = '-99999px';
  container.style.width = '560px';
  container.style.background = '#ffffff';
  container.style.color = '#111827';
  container.style.padding = '24px';
  container.style.fontFamily = "'Cairo', 'Tajawal', 'Segoe UI', Tahoma, sans-serif";
  container.style.boxSizing = 'border-box';

  container.innerHTML = `
    <div style="border: 2.5px solid #111827; border-radius: 14px; overflow: hidden; background: #fff;">
      <div style="background: #A44C5C; color: #ffffff; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 20px; font-weight: 900; letter-spacing: 0.3px;">${escapeHtml(storeName)} · بوليصة شحن</div>
          <div style="font-size: 11px; opacity: 0.9; margin-top: 2px;">المملكة العربية السعودية · شحن يدوي موثق</div>
        </div>
        <div style="text-align: left; font-family: monospace;">
          <div style="font-size: 10px; opacity: 0.85;">رقم الطلب</div>
          <div style="font-size: 15px; font-weight: 900;">#${escapeHtml(order.id.slice(0, 8).toUpperCase())}</div>
        </div>
      </div>

      <div style="padding: 14px 18px; border-bottom: 2px dashed #d1d5db; display: flex; justify-content: space-between; align-items: center; background: #fafaf9;">
        <div>
          <div style="font-size: 11px; color: #6b7280; font-weight: 700;">شركة الشحن</div>
          <div style="font-size: 15px; font-weight: 900; color: #111827; margin-top: 2px;">${escapeHtml(carrierName)}</div>
        </div>
        <div style="text-align: left;">
          <div style="font-size: 11px; color: #6b7280; font-weight: 700;">رقم التتبع / البوليصة</div>
          <div style="font-size: 17px; font-weight: 900; font-family: monospace; letter-spacing: 1px; color: #111827; margin-top: 2px;">${escapeHtml(trackingCode)}</div>
        </div>
      </div>

      <div style="padding: 16px 18px; border-bottom: 1px solid #e5e7eb;">
        <div style="font-size: 11px; color: #A44C5C; font-weight: 900; margin-bottom: 6px;">بيانات المستلمة (Ship To)</div>
        <div style="font-size: 16px; font-weight: 900; color: #111827;">${escapeHtml(order.customerName || 'عميلة سولته الكريمة')}</div>
        <div style="font-size: 13px; font-family: monospace; font-weight: 800; color: #1f2937; margin-top: 4px;" dir="ltr">${escapeHtml(order.phone || '-')}</div>
        <div style="font-size: 13px; font-weight: 700; color: #374151; margin-top: 6px;">
          المدينة: ${escapeHtml(order.city || 'الرياض')}
        </div>
        <div style="font-size: 12px; color: #4b5563; margin-top: 3px; line-height: 1.5;">
          العنوان: ${escapeHtml(order.address || 'حسب تنسيق المندوب')}
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #e5e7eb;">
        <div style="padding: 12px 18px; border-left: 1px solid #e5e7eb;">
          <div style="font-size: 10.5px; color: #6b7280; font-weight: 700;">حالة التحصيل (COD)</div>
          <div style="font-size: 16px; font-weight: 900; font-family: monospace; color: ${codAmount > 0 ? '#b91c1c' : '#047857'}; margin-top: 3px;">
            ${codAmount > 0 ? `تحصيل ${codAmount.toLocaleString()} ر.س` : 'مدفوع مسبقاً (0 ر.س)'}
          </div>
        </div>
        <div style="padding: 12px 18px;">
          <div style="font-size: 10.5px; color: #6b7280; font-weight: 700;">عدد القطع / الطرود</div>
          <div style="font-size: 16px; font-weight: 900; font-family: monospace; color: #111827; margin-top: 3px;">
            ${totalPieces} قطعة · طرد (1)
          </div>
        </div>
      </div>

      <div style="padding: 12px 18px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
        <div style="font-size: 11px; color: #6b7280; font-weight: 800; margin-bottom: 4px;">محتويات الشحنة</div>
        <div style="font-size: 11px; color: #374151; line-height: 1.65;">
          ${itemsText || 'ملابس نوم قطنية نسائية'}
        </div>
      </div>

      ${order.notes ? `
      <div style="padding: 10px 18px; background: #fffbeb; border-bottom: 1px solid #fde68a; font-size: 11px; color: #92400e;">
        <strong>ملاحظة التوصيل:</strong> ${escapeHtml(order.notes)}
      </div>` : ''}

      <div style="padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #6b7280;">
        <span>التاريخ: ${escapeHtml(order.date || new Date().toISOString().split('T')[0])}</span>
        <span style="font-family: monospace; font-weight: 700;">SULTA-WAYBILL-${escapeHtml(order.id.slice(0, 6).toUpperCase())}</span>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    // A5 portrait: 148 x 210 mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 8;
    const renderWidth = pageWidth - margin * 2;
    const renderHeight = (canvas.height * renderWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', margin, margin, renderWidth, renderHeight);
    pdf.save(`Sulta_Waybill_${order.id.slice(0, 8)}.pdf`);
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}
