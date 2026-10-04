'use client';
/* Browser-only tafseer helpers: sanitize HTML, and fix Quran quotes inside Urdu tafseer. */
const ALLOWED = new Set(['P','BR','B','STRONG','I','EM','H1','H2','H3','H4','UL','OL','LI','BLOCKQUOTE','SPAN','DIV','SUP']);
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function safeTafsir(raw: string): string {
  raw = String(raw || '').trim();
  if (!raw) return '';
  if (!/<[a-z][\s\S]*>/i.test(raw)) return raw.split(/\n+/).filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('');
  const doc = new DOMParser().parseFromString(raw, 'text/html');
  const out = document.createElement('div');
  (function walk(src: Node, dst: Node){
    src.childNodes.forEach(n => {
      if (n.nodeType === 3){ dst.appendChild(document.createTextNode(n.nodeValue || '')); return; }
      if (n.nodeType !== 1) return;
      const el = n as Element;
      if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED)$/.test(el.tagName)) return;
      if (ALLOWED.has(el.tagName)){ const c = document.createElement(el.tagName === 'DIV' ? 'p' : el.tagName); walk(el, c); dst.appendChild(c); }
      else walk(el, dst);
    });
  })(doc.body, out);
  return out.innerHTML;
}
const QDIAC = /[ً-ْٰۖ-ۭ]/g;
const WAQF: Record<string, string> = {'ط':'ؕ','ج':'ۚ','ص':'ۖ','ق':'ۗ','م':'ۘ','ز':'ے','لا':'ۙ'};
const NONJOIN = 'اأإآٱدذرزوؤة';
/** Urdu tafseers type Quran quotes with Urdu letters and full-letter waqf signs; convert to standard Quran spelling. */
export function normQuote(t: string): string {
  const words = t.split(/\s+/).filter(Boolean)
    .map(w => w.replace(/ی/g, 'ي').replace(/ک/g, 'ك').replace(/[ہھ]/g, 'ه').replace(/ۃ/g, 'ة'));
  const out: string[] = [];
  words.forEach(w => {
    const g = w.match(/^(.*[ً-ْٰ])([طجصقمز])$/);
    if (g){ out.push(g[1] + WAQF[g[2]]); return; }
    if (WAQF[w] && out.length){ out[out.length - 1] += WAQF[w]; return; }
    w = w.replace(/([ء-ي])([ً-ْ]*)ء([ً-ِ]?)(?=[ء-ي])/g, (m, a, d, v) => NONJOIN.includes(a) ? m : a + d + 'ـ' + v + 'ٔ');
    out.push(w);
  });
  return out.join(' ');
}
/** Wrap runs of vowelled Arabic inside Urdu tafseer so they use the Quran font. */
export function markQuranRuns(html: string): string {
  const box = document.createElement('div'); box.innerHTML = html;
  const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = []; while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  nodes.forEach(node => {
    const parts = (node.nodeValue || '').split(/(\s+)/);
    const marks = parts.map(t => (t.match(QDIAC) || []).length);
    const isQ: (boolean | 'waqf')[] = parts.map((_, i) => marks[i] > 0);
    parts.forEach((t, i) => { if (!isQ[i] && /^[؀-ۿ]$/.test(t.trim()) && isQ.slice(0, i).includes(true) && isQ.slice(i + 1).includes(true)) isQ[i] = 'waqf'; });
    if (!isQ.some(Boolean)) return;
    const frag = document.createDocumentFragment();
    let i = 0;
    while (i < parts.length){
      if (isQ[i] && !/^\s+$/.test(parts[i])){
        let j = i, n = 0, total = 0;
        while (j < parts.length && (isQ[j] || /^\s+$/.test(parts[j]))){ if (isQ[j] === true){ n++; total += marks[j]; } j++; }
        while (j > i && /^\s+$/.test(parts[j - 1])) j--;
        if (n >= 2 || total >= 3){
          const sp = document.createElement('span'); sp.className = 'qar'; sp.dir = 'rtl'; sp.textContent = normQuote(parts.slice(i, j).join(''));
          frag.appendChild(sp); i = j; continue;
        }
      }
      frag.appendChild(document.createTextNode(parts[i])); i++;
    }
    node.parentNode!.replaceChild(frag, node);
  });
  return box.innerHTML;
}
export function tafsirHtml(text: string, lang: string): string {
  const body = safeTafsir(text);
  return lang.toLowerCase().startsWith('urdu') ? markQuranRuns(body) : body;
}
