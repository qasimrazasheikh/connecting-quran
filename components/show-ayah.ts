'use client';
/**
 * Long surahs and juz render their ayah cards in batches (AyahList), so a card may not be on the page yet. Code that
 * scrolls to an ayah asks for it here: AyahList renders it, and the element comes back once it's in the page (null if
 * no list has it, e.g. a key from another surah). Mushaf ayahs are always present and come straight back.
 */
export const SHOW_AYAH_EVENT = 'noor:show-ayah';
const find = (key: string) => document.querySelector<HTMLElement>(`[data-key="${key}"]`);

export function showAyah(key: string): Promise<HTMLElement | null> {
  const el = find(key); if (el) return Promise.resolve(el);
  window.dispatchEvent(new CustomEvent(SHOW_AYAH_EVENT, {detail: key}));
  // React renders the batch on its own schedule: look for the card for a few frames
  return new Promise(res => {
    let n = 0;
    const look = () => { const e = find(key); if (e || ++n > 20) res(e); else requestAnimationFrame(look); };
    requestAnimationFrame(look);
  });
}
