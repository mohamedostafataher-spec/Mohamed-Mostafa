// Free new-order alert to the store owner on Telegram.
// Sends only: short order number, item count, total. No name, phone, address or photos.
// Needs two Vercel env vars: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID. Without them it does nothing.
interface Req { method?: string; body?: any; headers: Record<string, string | string[] | undefined> }
interface Res { setHeader(n: string, v: string): void; status(c: number): Res; json(b: any): void; end(): void }

const seen = new Map<string, number>();

export default async function handler(req: Req, res: Res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return res.status(200).json({ ok: true, configured: false });

  const b = req.body || {};
  const id = String(b.orderId || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 40);
  if (!id) return res.status(400).json({ ok: false });
  const now = Date.now();
  if (seen.has(id) || seen.size > 200) {
    if (seen.has(id)) return res.status(200).json({ ok: true, duplicate: true });
    seen.clear();
  }
  seen.set(id, now);

  const items = Math.max(0, Math.min(99, Number(b.items) || 0));
  const total = Math.max(0, Math.min(100000, Number(b.total) || 0));
  const pay = b.payment === 'bank' ? 'تحويل بنكي' : 'دفع عند الاستلام';
  const text = `🛍 طلب جديد في سولته\nرقم الطلب: ${id.slice(0, 8).toUpperCase()}\nعدد القطع: ${items}\nالإجمالي: ${total} ر.س\nالدفع: ${pay}\nالتفاصيل في لوحة التحكم.`;
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text }),
    });
    return res.status(200).json({ ok: r.ok });
  } catch {
    return res.status(200).json({ ok: false });
  }
}
