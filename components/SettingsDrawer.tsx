'use client';
import {useEffect, useRef, useState} from 'react';
import {useApp} from './AppProvider';
import Drawer from './Drawer';
import {getEditions} from '@/lib/client-data';
import {BISM_UTH, RECITERS, type TafsirEdition, type TransEdition} from '@/lib/meta';
import type {Settings} from '@/lib/settings';
import {cx, h4, segBtn, segWrap, sel} from '@/lib/ui';
import {clearExtraTafsir} from './TafseerPanel';

const BISM_IP = 'بِسۡمِ اللّٰہِ الرَّحۡمٰنِ الرَّحِیۡمِ';
const opt = 'flex items-center gap-2.5 border-b border-line px-1 py-[7px] text-[14.5px] [&_input]:size-[17px] [&_input]:accent-brand';

function Seg<T extends string>({value, items, onPick, id}: {value: T; items: [T, string][]; onPick: (v: T) => void; id?: string}) {
  return <div className={segWrap} id={id}>{items.map(([v, l]) => <button key={v} data-v={v} className={segBtn(value === v)} onClick={() => onPick(v)}>{l}</button>)}</div>;
}

export default function SettingsDrawer() {
  const {settings: S, update, settingsOpen, closeSettings, toast} = useApp();
  const [eds, setEds] = useState<{trans: TransEdition[]; tafsir: TafsirEdition[]} | null>(null);
  const [err, setErr] = useState('');
  const tafRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (settingsOpen && !eds) getEditions().then(setEds).catch(e => setErr(e.message)); }, [settingsOpen, eds]);
  useEffect(() => { if (settingsOpen === 'tafsir' && eds) setTimeout(() => tafRef.current?.scrollIntoView({block: 'start'}), 50); }, [settingsOpen, eds]);

  const set = (p: Partial<Settings>) => update(p);
  const toggleTrans = (id: string, on: boolean) => {
    if (on && S.trans.length >= 4){ toast('Up to 4 translations'); return; }
    set({trans: on ? [...S.trans, id] : S.trans.filter(x => x !== id)});
  };
  const toggleTaf = (slug: string, on: boolean) => {
    if (on && S.tafsirs.length >= 8){ toast('Up to 8 tafseers'); return; }
    if (!on && S.tafsirs.length <= 1){ toast('Keep at least one tafseer'); return; }
    clearExtraTafsir(slug);
    set({tafsirs: on ? [...S.tafsirs, slug] : S.tafsirs.filter(x => x !== slug)});
  };
  const transGroup = (lang: string, title: string) => (
    <>
      <h4 className={h4}>{title}</h4>
      {eds?.trans.filter(e => e.language === lang).map(e => (
        <label key={e.identifier} className={opt}><input type="checkbox" value={e.identifier} checked={S.trans.includes(e.identifier)} onChange={ev => toggleTrans(e.identifier, ev.target.checked)} />
          {e.englishName}<small className="ml-auto text-xs text-muted">{e.name && e.name !== e.englishName ? e.name : ''}</small></label>
      ))}
    </>
  );
  const tafRow = (e: TafsirEdition) => (
    <label key={e.slug} className={opt}><input type="checkbox" data-taf={e.slug} checked={S.tafsirs.includes(e.slug)} onChange={ev => toggleTaf(e.slug, ev.target.checked)} />
      {e.name}<small className="ml-auto text-right text-xs text-muted">{e.author_name || ''}</small></label>
  );
  const by = (l: string) => eds?.tafsir.filter(e => e.language_name.toLowerCase() === l) || [];
  const arSel = by('arabic').some(e => S.tafsirs.includes(e.slug));

  return (
    <Drawer id="setDrawer" open={!!settingsOpen} onClose={closeSettings} title="Reading settings" label="Settings">
      <h4 className={h4}>Colour theme</h4>
      <Seg id="palSeg" value={S.palette} onPick={v => set({palette: v})} items={[['midnight', 'Midnight & Gold'], ['ocean', 'Ocean & Coral'], ['classic', 'Classic Green']]} />
      <h4 className={h4}>Light / dark</h4>
      <Seg id="themeSeg" value={S.theme} onPick={v => set({theme: v})} items={[['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']]} />
      <h4 className={h4}>Quran script</h4>
      <Seg id="scriptSeg" value={S.script} onPick={v => set({script: v})} items={[['uthmani', 'Uthmani'], ['indopak', 'Indo-Pak']]} />
      <div className={cx('q-ar mt-2 !text-center !text-[26px]', S.script === 'indopak' && 'is-ip')} style={{lineHeight: 2.3}}>{S.script === 'indopak' ? BISM_IP : BISM_UTH}</div>
      <h4 className={h4}>Recitation</h4>
      <select className={cx(sel, 'w-full')} id="recSel" value={S.reciter} onChange={e => set({reciter: e.target.value})}>
        {RECITERS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>
      <label className={opt}><input type="checkbox" id="autoPlay" checked={S.autoPlay} onChange={e => set({autoPlay: e.target.checked})} />Continue to the next ayah</label>
      <label className={opt}><input type="checkbox" id="autoScroll" checked={S.autoScroll} onChange={e => set({autoScroll: e.target.checked})} />Scroll to the ayah being recited</label>
      <h4 className={h4}>Reading aids</h4>
      <label className={opt}><input type="checkbox" id="wbwOn" checked={S.wbw} onChange={e => set({wbw: e.target.checked})} />Word-by-word meanings under each word</label>
      <div className="my-1.5"><Seg id="wbwLang" value={S.wbwLang} onPick={v => set({wbwLang: v})} items={[['ur', 'Urdu meanings'], ['en', 'English meanings']]} /></div>
      <label className={opt}><input type="checkbox" id="tjOn" checked={S.tajweed} onChange={e => { set({tajweed: e.target.checked}); if (e.target.checked && S.script === 'indopak') toast('Tajweed colours show in Uthmani script'); }} />Tajweed colours <small className="ml-auto text-xs text-muted">Uthmani script only</small></label>
      <label className={opt}><input type="checkbox" id="wsOn" checked={S.wordSound} onChange={e => set({wordSound: e.target.checked})} />Play a word&apos;s sound when I tap it</label>
      <h4 className={h4}>Text size</h4>
      <div className="flex items-center gap-2.5 text-sm">Arabic <input type="range" min={22} max={52} id="arR" className="flex-1 accent-brand" value={S.arSize} onChange={e => set({arSize: +e.target.value})} /><span className="w-6">{S.arSize}</span></div>
      <div className="mt-2 flex items-center gap-2.5 text-sm">Translation <input type="range" min={14} max={28} id="trR" className="flex-1 accent-brand" value={S.trSize} onChange={e => set({trSize: +e.target.value})} /><span className="w-6">{S.trSize}</span></div>
      <label className={cx(opt, 'mt-2')}><input type="checkbox" id="showAr" checked={S.showAr} onChange={e => set({showAr: e.target.checked})} />Show Arabic text</label>
      {err && <p className="text-sm text-bad">Lists could not load: {err}</p>}
      {!eds && !err && <div className="grid place-items-center py-8"><div className="spin" /></div>}
      {eds && <>
        {transGroup('ur', 'Urdu translations')}
        {transGroup('en', 'English translations')}
        <p className="text-[13px] text-muted">Pick up to 4 translations.</p>
      </>}
      <h4 className={h4}>Tafseer layout</h4>
      <Seg id="tafLay" value={S.tafLayout} onPick={v => set({tafLayout: v})} items={[['accordion', 'Accordion'], ['split', 'List + reader']]} />
      <div ref={tafRef} id="tafSet" className="scroll-mt-2">
        <h4 className={h4}>Tafseers to show</h4>
        {eds && <>
          {by('urdu').map(tafRow)}{by('english').map(tafRow)}
          <details open={arSel} className="mt-1.5"><summary className="cursor-pointer px-1 py-2 text-sm text-brand">Arabic tafseers ({by('arabic').length})</summary>{by('arabic').map(tafRow)}</details>
        </>}
      </div>
      <p className="text-[13px] text-muted">Pick up to 8 tafseers. They show as expandable sections, in this order.</p>
    </Drawer>
  );
}
