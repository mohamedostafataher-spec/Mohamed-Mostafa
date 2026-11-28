// Tiny per-instance rate limiter (best effort on serverless; blocks simple floods).
const hits = new Map<string, { n: number; t: number }>();
export function limited(headers: Record<string, string | string[] | undefined>, key: string, max = 30, windowMs = 60000): boolean {
  const xf = headers['x-forwarded-for'];
  const ip = String(Array.isArray(xf) ? xf[0] : xf || 'unknown').split(',')[0].trim();
  const k = key + ':' + ip;
  const now = Date.now();
  if (hits.size > 2000) hits.clear();
  const h = hits.get(k);
  if (!h || now - h.t > windowMs) { hits.set(k, { n: 1, t: now }); return false; }
  h.n++;
  return h.n > max;
}
