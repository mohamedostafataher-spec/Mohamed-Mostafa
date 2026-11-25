/**
 * Meta rejects Pixel events whose currency is not a 3-letter ISO code or whose value is not a number
 * ("invalid currency" warning). This wraps window.fbq and cleans those two fields before sending.
 */
export function installFbqGuard() {
  if (typeof window === 'undefined') return;
  const w = window as any;
  let tries = 0;
  const patch = () => {
    const orig = w.fbq;
    if (typeof orig === 'function' && !orig.__sultaGuard) {
      const wrapped: any = function (this: any, ...args: any[]) {
        try {
          const p = args[2];
          if (args[0] === 'track' && p && typeof p === 'object' && ('currency' in p || 'value' in p)) {
            const cur = typeof p.currency === 'string' ? p.currency.trim().toUpperCase() : '';
            const v = Number(p.value);
            args[2] = { ...p, currency: /^[A-Z]{3}$/.test(cur) ? cur : 'SAR', value: Number.isFinite(v) ? v : 0 };
          }
        } catch {}
        return orig.apply(this, args);
      };
      Object.keys(orig).forEach((k) => { try { wrapped[k] = orig[k]; } catch {} });
      wrapped.__sultaGuard = true;
      w.fbq = wrapped;
    }
    if (++tries < 40) setTimeout(patch, 500);
  };
  patch();
}
