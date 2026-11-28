// Small allow-list HTML sanitizer for blog content (no dependency).
const ALLOWED = new Set(['P','H1','H2','H3','H4','UL','OL','LI','STRONG','B','EM','I','U','BR','A','IMG','BLOCKQUOTE','HR','SPAN','DIV','FIGURE','FIGCAPTION','TABLE','THEAD','TBODY','TR','TH','TD']);
const ATTRS: Record<string, string[]> = { A: ['href', 'title', 'target', 'rel'], IMG: ['src', 'alt', 'title', 'width', 'height', 'loading'] };
const safeUrl = (v: string) => /^(https?:|mailto:|tel:|\/|#)/i.test(v.trim());

export function sanitizeHtml(html: string): string {
  if (typeof DOMParser === 'undefined') return '';
  const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
  const walk = (node: Element) => {
    Array.from(node.children).forEach((el) => {
      if (!ALLOWED.has(el.tagName)) { el.remove(); return; }
      const keep = ATTRS[el.tagName] || [];
      Array.from(el.attributes).forEach((a) => {
        const n = a.name.toLowerCase();
        if (!keep.includes(n)) { el.removeAttribute(a.name); return; }
        if ((n === 'href' || n === 'src') && !safeUrl(a.value)) el.removeAttribute(a.name);
      });
      if (el.tagName === 'A') { el.setAttribute('rel', 'noopener noreferrer'); }
      walk(el);
    });
  };
  walk(doc.body);
  return doc.body.innerHTML;
}
